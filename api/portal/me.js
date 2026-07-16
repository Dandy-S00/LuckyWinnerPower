const { resolveCaller } = require('../../lib/requireRole');
const { getAdminClient } = require('../../lib/supabaseAdmin');
const { enforce, clientIp } = require('../../lib/rateLimit');

// Returns the authenticated caller's portal role so the frontend can render
// the correct dashboard. { role, distributorId, name }.
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!enforce(req, res, 'portal-me-ip:' + clientIp(req), 60)) return;

  const caller = await resolveCaller(req);
  if (!caller) {
    return res.status(401).json({ error: 'Please log in.' });
  }

  let name = null;
  if (caller.role === 'distributor') {
    try {
      const supabase = getAdminClient();
      const { data } = await supabase
        .from('distributors')
        .select('name, code, active')
        .eq('id', caller.distributorId)
        .maybeSingle();
      if (data) name = data.name;
      return res.status(200).json({
        role: caller.role,
        distributorId: caller.distributorId,
        name,
        code: data ? data.code : null,
        active: data ? data.active : null,
      });
    } catch (_) {
      // fall through to basic response
    }
  }

  return res.status(200).json({
    role: caller.role,
    distributorId: caller.distributorId,
    name,
  });
};
