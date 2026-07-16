const { verifyUser } = require('./verifyUser');
const { getAdminClient } = require('./supabaseAdmin');

// Emails listed in ADMIN_EMAILS (comma-separated) are treated as super-admins.
// This bootstraps the first admin without needing to seed the database.
function adminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// Resolves the authenticated caller's role for the admin portal.
// Returns { user, role, distributorId } where:
//   role         = 'admin' | 'distributor' | 'player'
//   distributorId = the distributor's own id when role === 'distributor'
// Returns null when the request is unauthenticated.
async function resolveCaller(req) {
  const user = await verifyUser(req);
  if (!user) return null;

  const email = (user.email || '').toLowerCase();
  if (email && adminEmails().includes(email)) {
    return { user, role: 'admin', distributorId: null };
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data) {
    return { user, role: 'player', distributorId: null };
  }

  if (data.role === 'admin') {
    return { user, role: 'admin', distributorId: null };
  }
  if (data.role === 'distributor') {
    // A deactivated distributor loses portal access entirely.
    const { data: dist } = await supabase
      .from('distributors')
      .select('active')
      .eq('id', user.id)
      .maybeSingle();
    if (!dist || !dist.active) {
      return { user, role: 'player', distributorId: null };
    }
    return { user, role: 'distributor', distributorId: user.id };
  }
  return { user, role: 'player', distributorId: null };
}

// Enforces that the caller has one of the allowed roles. On failure it writes
// the appropriate status/JSON and returns null; on success returns the caller.
async function requireRole(req, res, allowedRoles) {
  const caller = await resolveCaller(req);
  if (!caller) {
    res.status(401).json({ error: 'Please log in.' });
    return null;
  }
  if (!allowedRoles.includes(caller.role)) {
    res.status(403).json({ error: 'You do not have access to this resource.' });
    return null;
  }
  return caller;
}

module.exports = { resolveCaller, requireRole };
