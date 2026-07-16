const { requireRole } = require('../../lib/requireRole');
const { getAdminClient } = require('../../lib/supabaseAdmin');
const { enforce, clientIp } = require('../../lib/rateLimit');

// Adjusts a player's in-app balance and records an audit ledger entry.
//   Body: { userId, action: 'set' | 'zero' | 'add', amount?, note? }
//   admin       -> any player
//   distributor -> only players attributed to that distributor
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!enforce(req, res, 'portal-balance-ip:' + clientIp(req), 60)) return;

  const caller = await requireRole(req, res, ['admin', 'distributor']);
  if (!caller) return;

  const body = req.body || {};
  const userId = typeof body.userId === 'string' ? body.userId : '';
  const action = typeof body.action === 'string' ? body.action : '';
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 200) : null;

  if (!userId) return res.status(400).json({ error: 'userId is required.' });
  if (!['set', 'zero', 'add'].includes(action)) {
    return res.status(400).json({ error: "action must be 'set', 'zero', or 'add'." });
  }

  let amount = 0;
  if (action !== 'zero') {
    amount = Number(body.amount);
    if (!Number.isFinite(amount)) {
      return res.status(400).json({ error: 'A valid amount is required.' });
    }
  }

  try {
    const supabase = getAdminClient();

    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('id, balance, distributor_id, role')
      .eq('id', userId)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!profile || profile.role !== 'player') {
      return res.status(404).json({ error: 'Player not found.' });
    }

    if (caller.role === 'distributor' && profile.distributor_id !== caller.distributorId) {
      return res.status(403).json({ error: 'This player is not assigned to you.' });
    }

    const previous = Number(profile.balance || 0);
    let next;
    if (action === 'zero') {
      next = 0;
    } else if (action === 'set') {
      next = amount;
    } else {
      next = previous + amount;
    }

    if (next < 0) {
      return res.status(400).json({ error: 'Balance cannot go below $0.00.' });
    }
    next = Math.round(next * 100) / 100;

    const { error: uErr } = await supabase
      .from('profiles')
      .update({ balance: next })
      .eq('id', userId);
    if (uErr) throw uErr;

    // Best-effort audit entry; a failure here must not undo the balance change.
    await supabase
      .from('balance_adjustments')
      .insert({
        user_id: userId,
        actor_id: caller.user.id,
        actor_role: caller.role,
        previous_balance: previous,
        new_balance: next,
        note,
      })
      .then(({ error }) => {
        if (error) console.error('Ledger insert failed:', error.message);
      });

    return res.status(200).json({ userId, balance: next });
  } catch (err) {
    console.error('Balance adjust error:', err.message);
    return res.status(500).json({ error: 'Failed to update balance.' });
  }
};
