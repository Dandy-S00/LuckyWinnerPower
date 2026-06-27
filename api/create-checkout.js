const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
const { verifyUser } = require('../lib/verifyUser');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Require a valid, authenticated account before creating a payment session.
  // Age (18+) is enforced at signup by the database trigger in supabase/setup.sql,
  // so any account that can authenticate here has already passed the age check.
  const user = await verifyUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Please log in to make a deposit.' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const body = req.body || {};
  const email = user.email;

  // Determine whether this is the user's first purchase by counting
  // completed deposits. Fail safe: treat as first-time (stricter $5 floor).
  let isFirstPurchase = true;
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { count, error } = await supabase
      .from('deposits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed');

    if (!error) {
      isFirstPurchase = count === 0;
    }
  } catch (_) {
    // On any unexpected error, keep isFirstPurchase = true (fail safe).
  }

  const minAmount = isFirstPurchase ? 5 : 1;
  const productType = isFirstPurchase ? 'Starter Pack' : 'Coins';

  const numAmount = Number(body.amount);
  if (!Number.isFinite(numAmount) || numAmount < minAmount) {
    return res.status(400).json({
      error: `Minimum ${productType} deposit is $${minAmount}.00`,
    });
  }

  if (numAmount > 1000) {
    return res.status(400).json({ error: 'Maximum deposit is $1,000.00' });
  }

  // Sanitize the optional game username: string only, trimmed, length-capped.
  const username = typeof body.username === 'string' ? body.username.trim().slice(0, 64) : '';

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productType,
              description: isFirstPurchase
                ? `Starter pack${username ? ' for ' + username : ''}`
                : `Coins${username ? ' for ' + username : ''}`,
            },
            unit_amount: Math.round(numAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: email || undefined,
      metadata: {
        user_id: user.id,
        username: username || '',
        deposit_amount: String(numAmount),
        is_first_purchase: String(isFirstPurchase),
        product_type: productType,
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
