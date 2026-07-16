const { requireRole } = require('../../lib/requireRole');
const { getAdminClient } = require('../../lib/supabaseAdmin');
const { enforce, clientIp } = require('../../lib/rateLimit');

// Admin-only management of distributor accounts.
//   GET   -> list distributors with player counts
//   POST  -> create a distributor login { name, code, email, password }
//   PATCH -> update a distributor { id, active?, name? }
module.exports = async (req, res) => {
  if (!enforce(req, res, 'portal-dist-ip:' + clientIp(req), 40)) return;

  const caller = await requireRole(req, res, ['admin']);
  if (!caller) return;

  const supabase = getAdminClient();

  if (req.method === 'GET') {
    return listDistributors(supabase, res);
  }
  if (req.method === 'POST') {
    return createDistributor(supabase, req, res, caller);
  }
  if (req.method === 'PATCH') {
    return updateDistributor(supabase, req, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
};

async function listDistributors(supabase, res) {
  try {
    const { data: dists, error } = await supabase
      .from('distributors')
      .select('id, name, code, active, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;

    // Player counts per distributor.
    const counts = new Map();
    const { data: players } = await supabase
      .from('profiles')
      .select('distributor_id')
      .eq('role', 'player')
      .not('distributor_id', 'is', null);
    (players || []).forEach((p) => {
      counts.set(p.distributor_id, (counts.get(p.distributor_id) || 0) + 1);
    });

    const distributors = (dists || []).map((d) => ({
      id: d.id,
      name: d.name,
      code: d.code,
      active: d.active,
      createdAt: d.created_at,
      playerCount: counts.get(d.id) || 0,
    }));

    return res.status(200).json({ distributors });
  } catch (err) {
    console.error('List distributors error:', err.message);
    return res.status(500).json({ error: 'Failed to load distributors.' });
  }
}

async function createDistributor(supabase, req, res, caller) {
  const body = req.body || {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const code = typeof body.code === 'string' ? body.code.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!name) return res.status(400).json({ error: 'Name is required.' });
  if (!code) return res.status(400).json({ error: 'Distributor code is required.' });
  if (!/^[A-Za-z0-9_-]{2,32}$/.test(code)) {
    return res.status(400).json({ error: 'Code must be 2-32 letters, numbers, hyphens or underscores.' });
  }
  if (!email) return res.status(400).json({ error: 'Login email is required.' });
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  try {
    // Reject a duplicate code up front (also enforced by a unique index).
    // Compare case-insensitively in JS: ilike would treat '_' in codes as a
    // wildcard and could falsely match an unrelated code.
    const { data: existingCodes } = await supabase.from('distributors').select('code');
    const wanted = code.toLowerCase();
    if ((existingCodes || []).some((d) => (d.code || '').toLowerCase() === wanted)) {
      return res.status(409).json({ error: 'That distributor code is already in use.' });
    }

    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'distributor' },
    });
    if (createErr || !created?.user) {
      const msg = createErr?.message || 'Could not create login.';
      const status = /already/i.test(msg) ? 409 : 400;
      return res.status(status).json({ error: msg });
    }

    const userId = created.user.id;
    const { data: dist, error: insertErr } = await supabase
      .from('distributors')
      .insert({ id: userId, name, code, active: true })
      .select('id, name, code, active, created_at')
      .single();

    if (insertErr) {
      // Roll back the auth user so a failed insert doesn't orphan a login.
      await supabase.auth.admin.deleteUser(userId).catch(() => {});
      if (/duplicate|unique/i.test(insertErr.message)) {
        return res.status(409).json({ error: 'That distributor code is already in use.' });
      }
      throw insertErr;
    }

    return res.status(201).json({
      distributor: {
        id: dist.id,
        name: dist.name,
        code: dist.code,
        active: dist.active,
        createdAt: dist.created_at,
        playerCount: 0,
      },
    });
  } catch (err) {
    console.error('Create distributor error:', err.message);
    return res.status(500).json({ error: 'Failed to create distributor.' });
  }
}

async function updateDistributor(supabase, req, res) {
  const body = req.body || {};
  const id = typeof body.id === 'string' ? body.id : '';
  if (!id) return res.status(400).json({ error: 'Distributor id is required.' });

  const patch = {};
  if (typeof body.active === 'boolean') patch.active = body.active;
  if (typeof body.name === 'string' && body.name.trim()) patch.name = body.name.trim();
  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: 'Nothing to update.' });
  }

  try {
    const { data, error } = await supabase
      .from('distributors')
      .update(patch)
      .eq('id', id)
      .select('id, name, code, active, created_at')
      .single();
    if (error) throw error;
    return res.status(200).json({ distributor: data });
  } catch (err) {
    console.error('Update distributor error:', err.message);
    return res.status(500).json({ error: 'Failed to update distributor.' });
  }
}
