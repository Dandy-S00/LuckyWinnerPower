const { createClient } = require('@supabase/supabase-js');

// Service-role Supabase client. Bypasses RLS, so it must ONLY ever be used
// from server-side API endpoints after the caller's role has been verified.
let cached = null;

function getAdminClient() {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Supabase admin is not configured.');
  }
  cached = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

module.exports = { getAdminClient };
