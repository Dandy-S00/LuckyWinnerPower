import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Signup() {
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [distributorCode, setDistributorCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) setDistributorCode(ref.trim());
  }, [searchParams]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email.trim()) return setError('Please enter your email address.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');

    setSubmitting(true);
    try {
      await signUp({ email: email.trim(), password, distributorCode });
      // No email confirmation required — log the new user straight in.
      try {
        await signIn({ email: email.trim(), password });
        navigate('/games', { replace: true });
        return;
      } catch {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.message || 'Could not create account. Please try again.');
    }
    setSubmitting(false);
  }

  return (
    <>
      <Navbar showDeposit={false} />

      <section className="deposit-section" style={{ minHeight: '80vh' }}>
        <div className="container">
          <h2 className="section-title">
            <i className="fas fa-user-plus me-2" style={{ fontSize: '0.7em' }}></i> Create Account
          </h2>
          <p className="section-subtitle">Join the Texas Winners family</p>

          <div className="deposit-form-card" style={{ maxWidth: 480, margin: '0 auto' }}>
            {!success ? (
              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                  <label className="form-label" htmlFor="signupEmail">
                    <i className="fas fa-envelope me-1"></i> Email
                  </label>
                  <input type="email" className="form-control" id="signupEmail" placeholder="your@email.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="mb-4">
                  <label className="form-label" htmlFor="signupPassword">
                    <i className="fas fa-lock me-1"></i> Password
                  </label>
                  <input type="password" className="form-control" id="signupPassword" placeholder="At least 8 characters"
                    minLength="8" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type="submit" className="btn-texas w-100 text-center" disabled={submitting}>
                  {submitting ? (
                    <><i className="fas fa-spinner fa-spin me-2"></i>Creating account...</>
                  ) : (
                    <><i className="fas fa-star me-2"></i>Create My Account</>
                  )}
                </button>
                <p className="text-center mt-3" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                  We'll assign you a username automatically — you can start playing right away.
                </p>
              </form>
            ) : null}
            {error && <div className="error-box">{error}</div>}
            {success && (
              <div className="success-box">
                <i className="fas fa-check-circle me-1"></i> Account created! You can now <Link to="/login" style={{ color: '#4CAF50', textDecoration: 'underline' }}>log in</Link>.
              </div>
            )}
            {!success && (
              <p className="text-center mt-3" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                Already have an account? <Link to="/login" style={{ color: 'var(--tx-gold)' }}>Log in here</Link>.
              </p>
            )}
          </div>
        </div>
      </section>

      <Footer minimal />
    </>
  );
}
