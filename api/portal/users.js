const { requireRole } = require('../../lib/requireRole');
const { getAdminClient } = require('../../lib/supabaseAdmin');
const { enforce, clientIp } = require('../../lib/rateLimit');

// Lists player accounts for the portal.
//   admin       -> every player
//   distributor -> only players attributed to that distributor
// Response: { users: [{ id, email, balance, createdAt, distributorId,
//                        distributorName, totalDeposits }] }
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!enforce(req, res, 'portal-users-ip:' + clientIp(req), 60)) return;

  const caller = await requireRole(req, res, ['admin', 'distributor']);
  if (!caller) return;

  try {
    const supabase = getAdminClient();

    let query = supabase
      .from('profiles')
      .select('id, balance, distributor_id, created_at')
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
