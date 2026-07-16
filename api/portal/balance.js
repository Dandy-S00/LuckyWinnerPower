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

    // Distributors may only touch players assigned to them; check up front for
    // a clear 403/404. The actual mutation is done atomically in the DB below.
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('id, distributor_id, role')
      .eq('id', userId)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!profile || profile.role !== 'player') {
      return res.status(404).json({ error: 'Player not found.' });
    }
    if (caller.role === 'distributor' && profile.distributor_id !== caller.distributorId) {
      return res.status(403).json({ error: 'This player is not assigned to you.' });
    }

    // Atomic: locks the row, computes + writes the balance, and inserts the
    // audit ledger row in a single transaction (see public.adjust_balance).
    const { data: result, error: rpcErr } = await supabase.rpc('adjust_balance', {
      p_user_id: userId,
      p_action: action,
      p_amount: amount,
      p_actor_id: caller.user.id,
      p_actor_role: caller.role,
      p_note: note,
    });

    if (rpcErr) {
      const msg = rpcErr.message || '';
      if (msg.includes('PLAYER_NOT_FOUND')) {
        return res.status(404).json({ error: 'Player not found.' });
      }
      if (msg.includes('NEGATIVE_BALANCE')) {
        return res.status(400).json({ error: 'Balance cannot go below $0.00.' });
      }
      if (msg.includes('INVALID_ACTION')) {
        return res.status(400).json({ error: "action must be 'set', 'zero', or 'add'." });
      }
      throw rpcErr;
    }

    const next = Number(result?.next ?? 0);
    return res.status(200).json({ userId, balance: next, previous: Number(result?.previous ?? 0) });
  } catch (err) {
    console.error('Balance adjust error:', err.message);
    return res.status(500).json({ error: 'Failed to update balance.' });
  }
};
