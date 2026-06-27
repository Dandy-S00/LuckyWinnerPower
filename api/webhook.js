const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

// Record a confirmed deposit into Supabase using the service-role key.
// The service-role key bypasses RLS and must only ever be used server-side.
async function recordDeposit(session) {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    // Fail loudly so the webhook returns non-200 and Stripe retries, rather
    // than silently dropping a paid deposit in a misconfigured deployment.
    throw new Error('Supabase service credentials are not configured.');
  }
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  // upsert on the unique stripe_session_id so retried webhook events
  // (Stripe may deliver the same event more than once) don't double-credit.
  const { error } = await supabase.from('deposits').upsert(
    {
      user_id: session.metadata?.user_id || null,
      stripe_session_id: session.id,
      username: session.metadata?.username || null,
      email: session.customer_email || null,
      amount: session.amount_total != null ? session.amount_total / 100 : null,
      status: 'completed',
    },
    { onConflict: 'stripe_session_id', ignoreDuplicates: true }
  );
  if (error) {
    // Throw so the handler returns non-200 and Stripe retries the (idempotent) event.
    throw new Error('Failed to record deposit: ' + error.message);
  }
}

// Get raw body for Stripe signature verification.
// In newer Vercel runtimes with bodyParser:false, req.body is already a Buffer.
// Falls back to reading from stream for compatibility.
function getRawBody(req) {
  if (Buffer.isBuffer(req.body)) {
    return Promise.resolve(req.body);
  }
  if (typeof req.body === 'string') {
    return Promise.resolve(Buffer.from(req.body));
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      console.log('Payment successful:', {
        sessionId: session.id,
        email: session.customer_email,
        amount: session.amount_total / 100,
        username: session.metadata?.username,
      });
      try {
        await recordDeposit(session);
      } catch (err) {
        // Return non-200 so Stripe retries delivery; the upsert is idempotent.
        console.error('Error recording deposit:', err.message);
        return res.status(500).json({ error: 'Failed to record deposit' });
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      console.log('Payment failed:', {
        id: paymentIntent.id,
        error: paymentIntent.last_payment_error?.message,
      });
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return res.status(200).json({ received: true });
};

// Disable Vercel's default body parser so we can read the raw body
// for Stripe signature verification
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
