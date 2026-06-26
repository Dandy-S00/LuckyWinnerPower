module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(200).json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    minDeposit: 5,
    maxDeposit: 1000,
  });
};
