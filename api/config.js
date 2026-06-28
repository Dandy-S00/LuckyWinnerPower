const { enforce, clientIp } = require('../lib/rateLimit');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!enforce(req, res, 'config-ip:' + clientIp(req), 60)) return;

  // Public, non-secret config; allow short-lived caching to reduce load.
  res.setHeader('Cache-Control', 'public, max-age=300');

  return res.status(200).json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
    starterMin: 5,
    coinsMin: 1,
    maxDeposit: 1000,
    minAge: 18,
  });
};
