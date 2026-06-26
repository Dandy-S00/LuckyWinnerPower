const Stripe = require('stripe');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const { amount, email, username } = req.body;

  if (!amount || amount < 5) {
    return res.status(400).json({ error: 'Minimum deposit is $5.00' });
  }

  if (amount > 1000) {
    return res.status(400).json({ error: 'Maximum deposit is $1,000.00' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Texas Winners Deposit',
              description: `Account deposit${username ? ' for ' + username : ''}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: email || undefined,
      metadata: {
        username: username || '',
        deposit_amount: String(amount),
      },
      success_url: `${process.env.BASE_URL || 'https://your-domain.vercel.app'}/deposit-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL || 'https://your-domain.vercel.app'}/deposit.html?canceled=true`,
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Stripe error:', err.message);
    return res.status(500).json({ error: 'Payment session creation failed. Please try again.' });
  }
};
