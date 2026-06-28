import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AuthGate from '../components/AuthGate';

const quickAmounts = [10, 20, 50, 100, 200, 500];

export default function Deposit() {
  const { session } = useAuth();
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState('');
  const [amount, setAmount] = useState('');
  const [activeAmount, setActiveAmount] = useState(null);
  const [error, setError] = useState(searchParams.get('canceled') === 'true' ? 'Payment was canceled. You can try again when ready.' : '');
  const [submitting, setSubmitting] = useState(false);

  function handleQuickSelect(val) {
    setActiveAmount(val);
    setAmount(String(val));
  }

  function handleAmountChange(e) {
    const val = e.target.value;
    setAmount(val);
    const num = parseInt(val);
    setActiveAmount(quickAmounts.includes(num) ? num : null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!username.trim()) return setError('Please enter your game username.');
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 1) return setError('Minimum deposit is $1.00.');
    if (numAmount > 1000) return setError('Maximum deposit is $1,000.00.');

    setSubmitting(true);
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + session.access_token,
        },
        body: JSON.stringify({ amount: numAmount, username: username.trim() }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Something went wrong');
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      setError(err.message || 'Failed to create payment session. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <AuthGate>
      <Navbar showOpenBadge />

      <section className="deposit-section">
        <div className="container">
          <h2 className="section-title mb-2">
            <i className="fas fa-dollar-sign me-2" style={{ fontSize: '0.7em' }}></i> Make a Deposit
          </h2>
          <p className="section-subtitle">Secure payments powered by Stripe</p>

          <div className="deposit-form-card">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label" htmlFor="username">
                  <i className="fas fa-user me-1"></i> Game Username
                </label>
                <input type="text" className="form-control" id="username" placeholder="Enter your game username"
                  value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="email">
                  <i className="fas fa-envelope me-1"></i> Email Address
                </label>
                <input type="email" className="form-control" id="email"
                  value={session?.user?.email || ''} readOnly />
              </div>

              <div className="mb-3">
                <label className="form-label">
                  <i className="fas fa-coins me-1"></i> Quick Select Amount
                </label>
                <div className="d-flex flex-wrap gap-2">
                  {quickAmounts.map((val) => (
                    <button
                      key={val}
                      type="button"
                      className={`quick-amount-btn ${activeAmount === val ? 'active' : ''}`}
                      onClick={() => handleQuickSelect(val)}
                    >
                      ${val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label" htmlFor="amount">
                  <i className="fas fa-dollar-sign me-1"></i> Deposit Amount (USD)
                </label>
                <div className="input-group">
                  <span className="input-group-text" style={{ background: 'var(--tx-darker)', borderColor: 'rgba(212,164,55,0.3)', color: 'var(--tx-gold)' }}>$</span>
                  <input type="number" className="form-control" id="amount" min="1" max="1000" step="1"
                    placeholder="Enter amount" value={amount} onChange={handleAmountChange} required />
                </div>
                <small style={{ color: 'rgba(255,255,255,0.5)' }}>Starter Pack: min $5.00 (first purchase) | Coins: min $1.00 (after) | Max: $1,000.00</small>
              </div>

              <button type="submit" className="btn-texas w-100 text-center" disabled={submitting}>
                {submitting ? (
                  <><i className="fas fa-spinner fa-spin me-2"></i>Processing...</>
                ) : (
                  <><i className="fas fa-lock me-2"></i>Proceed to Secure Payment</>
                )}
              </button>

              {error && <div className="error-box">{error}</div>}

              <div className="text-center mt-4" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                <i className="fas fa-shield-halved me-1"></i> 256-bit SSL Encrypted<br />
                <i className="fab fa-stripe me-1" style={{ color: '#635BFF' }}></i> Powered by Stripe - We never see your card details
              </div>
            </form>
          </div>

          <div className="row g-4 mt-5">
            <div className="col-md-4">
              <div className="card-texas text-center">
                <div className="card-icon mx-auto"><i className="fas fa-bolt"></i></div>
                <h5 className="card-title">Instant Credit</h5>
                <p className="card-text">Your account is funded the moment your payment is confirmed.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card-texas text-center">
                <div className="card-icon mx-auto"><i className="fas fa-shield-halved"></i></div>
                <h5 className="card-title">Bank-Level Security</h5>
                <p className="card-text">Stripe handles all payment processing. Your card info never touches our servers.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card-texas text-center">
                <div className="card-icon mx-auto"><i className="fas fa-headset"></i></div>
                <h5 className="card-title">24/7 Support</h5>
                <p className="card-text">Having issues? Our support team is available around the clock to help.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer minimal />
    </AuthGate>
  );
}
