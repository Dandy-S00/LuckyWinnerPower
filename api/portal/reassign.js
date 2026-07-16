const { requireRole } = require('../../lib/requireRole');
const { getAdminClient } = require('../../lib/supabaseAdmin');
const { enforce, clientIp } = require('../../lib/rateLimit');

// Admin-only: reassign a player to a different distributor (or clear it).
//   Body: { userId, distributorId } — distributorId null/'' clears attribution.
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!enforce(req, res, 'portal-reassign-ip:' + clientIp(req), 40)) return;

  const caller = await requireRole(req, res, ['admin']);
  if (!caller) return;

  const body = req.body || {};
  const userId = typeof body.userId === 'string' ? body.userId : '';
  const distributorId =
    typeof body.distributorId === 'string' && body.distributorId ? body.distributorId : null;

  if (!userId) return res.status(400).json({ error: 'userId is required.' });

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

    const { data, error } = await supabase
      .from('profiles')
      .update({ distributor_id: distributorId })
      .eq('id', userId)
      .eq('role', 'player')
      .select('id, distributor_id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Player not found.' });

    return res.status(200).json({ userId, distributorId: data.distributor_id });
  } catch (err) {
    console.error('Reassign error:', err.message);
    return res.status(500).json({ error: 'Failed to reassign player.' });
  }
};
