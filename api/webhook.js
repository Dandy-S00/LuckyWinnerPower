const Stripe = require('stripe');

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
