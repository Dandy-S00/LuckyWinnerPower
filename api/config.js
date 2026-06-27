module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
