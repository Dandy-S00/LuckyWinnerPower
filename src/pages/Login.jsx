import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Login() {
  const { signIn, resendConfirmation } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendStatus, setResendStatus] = useState('');

  function safeNext() {
    const next = searchParams.get('next');
    if (next && next.startsWith('/') && !next.startsWith('//')) return next;
    return '/games';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setNeedsConfirmation(false);
    setResendStatus('');

    if (!email.trim()) return setError('Please enter your email address.');
    if (!password) return setError('Please enter your password.');

    setSubmitting(true);
    try {
      await signIn({ email: email.trim(), password });
      navigate(safeNext(), { replace: true });
    } catch (err) {
      let msg = err.message || 'Login failed. Please try again.';
      if (/email not confirmed/i.test(msg)) {
        msg = 'Your email address has not been confirmed yet. Check your inbox (and spam folder) for the confirmation link, or click below to resend it.';
        setNeedsConfirmation(true);
      } else if (/invalid login credentials/i.test(msg)) {
        msg = 'Incorrect email or password.';
      }
      setError(msg);
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setResendStatus('sending');
    try {
      await resendConfirmation(email.trim());
      setResendStatus('sent');
    } catch (err) {
      setResendStatus('error');
      setError(err.message || 'Failed to resend confirmation email.');
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
            {needsConfirmation && (
              <div className="text-center mt-3">
                {resendStatus === 'sent' ? (
                  <div className="success-box">
                    <i className="fas fa-check-circle me-1"></i> Confirmation email sent! Check your inbox and spam folder, then come back and log in.
                  </div>
                ) : (
                  <button
                    className="btn-texas-outline"
                    onClick={handleResend}
                    disabled={resendStatus === 'sending'}
                    style={{ fontSize: '0.9rem', padding: '0.5rem 1.5rem' }}
                  >
                    {resendStatus === 'sending' ? (
                      <><i className="fas fa-spinner fa-spin me-1"></i> Sending...</>
                    ) : (
                      <><i className="fas fa-envelope me-1"></i> Resend Confirmation Email</>
                    )}
                  </button>
                )}
              </div>
            )}
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
