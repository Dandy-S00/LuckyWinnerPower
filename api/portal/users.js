const { requireRole } = require('../../lib/requireRole');
const { getAdminClient } = require('../../lib/supabaseAdmin');
const { enforce, clientIp } = require('../../lib/rateLimit');

// Player accounts for the portal.
//   GET  -> list players (admin: all; distributor: only theirs)
//   POST -> create a player { email, password, distributorId? }
//           admin: distributorId optional (any distributor or unassigned)
//           distributor: always attributed to the calling distributor
module.exports = async (req, res) => {
  if (!enforce(req, res, 'portal-users-ip:' + clientIp(req), 60)) return;

  const caller = await requireRole(req, res, ['admin', 'distributor']);
  if (!caller) return;

  if (req.method === 'POST') {
    return createPlayer(req, res, caller);
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getAdminClient();

    let query = supabase
      .from('profiles')
      .select('id, username, balance, distributor_id, created_at')
      .eq('role', 'player')
      .order('created_at', { ascending: false });

    if (caller.role === 'distributor') {
      query = query.eq('distributor_id', caller.distributorId);
    }

    const { data: profiles, error } = await query;
    if (error) throw error;

    const rows = profiles || [];
    const ids = rows.map((r) => r.id);

    // Distributor name lookup.
    const distMap = new Map();
    const { data: dists } = await supabase.from('distributors').select('id, name');
    (dists || []).forEach((d) => distMap.set(d.id, d.name));

    // Deposit totals (completed only), summed per user in JS.
    const depositTotals = new Map();
    if (ids.length > 0) {
      const { data: deposits } = await supabase
        .from('deposits')
        .select('user_id, amount')
        .eq('status', 'completed')
        .in('user_id', ids);
      (deposits || []).forEach((d) => {
        const prev = depositTotals.get(d.user_id) || 0;
        depositTotals.set(d.user_id, prev + Number(d.amount || 0));
      });
    }

    // Emails come from auth.users via the admin API (paginated).
    const emailMap = await buildEmailMap(supabase, new Set(ids));

    const users = rows.map((r) => ({
      id: r.id,
      email: emailMap.get(r.id) || null,
      username: r.username || null,
      balance: Number(r.balance || 0),
      createdAt: r.created_at,
      distributorId: r.distributor_id,
      distributorName: r.distributor_id ? distMap.get(r.distributor_id) || null : null,
      totalDeposits: depositTotals.get(r.id) || 0,
    }));

    return res.status(200).json({ users });
  } catch (err) {
    console.error('Portal users error:', err.message);
    return res.status(500).json({ error: 'Failed to load users.' });
  }
};

async function createPlayer(req, res, caller) {
  const body = req.body || {};
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email) return res.status(400).json({ error: 'Email is required.' });
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  // Determine which distributor the new player belongs to.
  let distributorId = null;
  if (caller.role === 'distributor') {
    distributorId = caller.distributorId;
  } else if (typeof body.distributorId === 'string' && body.distributorId) {
    distributorId = body.distributorId;
  }

  try {
    const supabase = getAdminClient();

    if (distributorId) {
      const { data: dist, error: dErr } = await supabase
        .from('distributors')
        .select('id')
        .eq('id', distributorId)
        .maybeSingle();
      if (dErr) throw dErr;
      if (!dist) return res.status(404).json({ error: 'Distributor not found.' });
    }

    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'player' },
    });
    if (createErr || !created?.user) {
      const msg = createErr?.message || 'Could not create user.';
      const status = /already/i.test(msg) ? 409 : 400;
      return res.status(status).json({ error: msg });
    }

    const userId = created.user.id;

    // The signup trigger created the profile (role='player') and assigned a
    // username; set the distributor attribution now.
    // If it fails, roll back the auth user so we don't report a bogus assignment.
    if (distributorId) {
      const { error: attrErr } = await supabase
        .from('profiles')
        .update({ distributor_id: distributorId })
        .eq('id', userId);
      if (attrErr) {
        await supabase.auth.admin.deleteUser(userId).catch(() => {});
        return res.status(500).json({ error: 'Could not attribute the new player to the distributor.' });
      }
    }

    const { data: profileRow } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .maybeSingle();

    const { data: distRow } = distributorId
      ? await supabase.from('distributors').select('name').eq('id', distributorId).maybeSingle()
      : { data: null };

    return res.status(201).json({
      user: {
        id: userId,
        email,
        username: profileRow ? profileRow.username : null,
        balance: 0,
        createdAt: created.user.created_at || new Date().toISOString(),
        distributorId,
        distributorName: distRow ? distRow.name : null,
        totalDeposits: 0,
      },
    });
  } catch (err) {
    console.error('Create player error:', err.message);
    return res.status(500).json({ error: 'Failed to create user.' });
  }
}

async function buildEmailMap(supabase, idSet) {
  const map = new Map();
  let page = 1;
  const perPage = 200;
  // Stop early once every requested id has been resolved.
  while (idSet.size > 0 && map.size < idSet.size) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const list = data?.users || [];
    list.forEach((u) => {
      if (idSet.has(u.id)) map.set(u.id, u.email);
    });
    if (list.length < perPage) break;
    page++;
  }
  return map;
}
