const Stripe = require('stripe');
const { verifyUser } = require('../lib/verifyUser');
const { startRequestTrace } = require('../lib/tracing');

module.exports = async (req, res) => {
  startRequestTrace(req, res, 'api.checkout_session');
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await verifyUser(req);
  if (!user) return res.status(401).json({ error: 'Please log in to view this payment.' });

  const sessionId = typeof req.query?.session_id === 'string' ? req.query.session_id : '';
  if (!/^cs_[A-Za-z0-9_-]+$/.test(sessionId)) {
    return res.status(400).json({ error: 'A valid payment session is required.' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.user_id !== user.id) {
      return res.status(404).json({ error: 'Payment session not found.' });
    }

    return res.status(200).json({
      status: session.payment_status === 'paid' && session.status === 'complete' ? 'paid' : 'pending',
      amount: session.amount_total == null ? null : session.amount_total / 100,
    });
  } catch (err) {
    console.error('Checkout session lookup error:', err.message);
    return res.status(404).json({ error: 'Payment session not found.' });
  }
};