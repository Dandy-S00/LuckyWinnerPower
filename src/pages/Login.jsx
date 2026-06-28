import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function safeNext() {
    const next = searchParams.get('next');
    if (next && next.startsWith('/') && !next.startsWith('//')) return next;
    return '/games';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email.trim()) return setError('Please enter your email address.');
    if (!password) return setError('Please enter your password.');

    setSubmitting(true);
    try {
      await signIn({ email: email.trim(), password });
      navigate(safeNext(), { replace: true });
    } catch (err) {
      let msg = err.message || 'Login failed. Please try again.';
      if (/email not confirmed/i.test(msg)) {
        msg = 'Please confirm your email address first. Check your inbox for the confirmation link.';
      } else if (/invalid login credentials/i.test(msg)) {
        msg = 'Incorrect email or password.';
      }
      setError(msg);
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar showDeposit={false} />

      <section className="deposit-section" style={{ minHeight: '80vh' }}>
        <div className="container">
          <h2 className="section-title">
            <i className="fas fa-right-to-bracket me-2" style={{ fontSize: '0.7em' }}></i> Log In
          </h2>
          <p className="section-subtitle">Welcome back, partner</p>

          <div className="deposit-form-card" style={{ maxWidth: 480, margin: '0 auto' }}>
            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <label className="form-label" htmlFor="loginEmail">
                  <i className="fas fa-envelope me-1"></i> Email
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="loginEmail"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="form-label" htmlFor="loginPassword">
                  <i className="fas fa-lock me-1"></i> Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="loginPassword"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-texas w-100 text-center" disabled={submitting}>
                {submitting ? (
                  <><i className="fas fa-spinner fa-spin me-2"></i>Logging in...</>
                ) : (
                  <><i className="fas fa-right-to-bracket me-2"></i>Log In</>
                )}
              </button>
            </form>
            {error && <div className="error-box">{error}</div>}
            <p className="text-center mt-3" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
              No account yet? <Link to="/signup" style={{ color: 'var(--tx-gold)' }}>Create one here</Link>.
            </p>
          </div>
        </div>
      </section>

      <Footer minimal />
    </>
  );
}
