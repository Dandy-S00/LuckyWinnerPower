import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Signup() {
  const { signUp, ageFromDob, MIN_AGE } = useAuth();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [dob, setDob] = useState('');
  const [distributorCode, setDistributorCode] = useState('');
  const [ageChecked, setAgeChecked] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) setDistributorCode(ref.trim());
  }, [searchParams]);

  const maxDob = useMemo(() => {
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 18);
    const y = cutoff.getFullYear();
    const m = String(cutoff.getMonth() + 1).padStart(2, '0');
    const d = String(cutoff.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email.trim()) return setError('Please enter your email address.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== password2) return setError('Passwords do not match.');
    if (!dob) return setError('Please enter your date of birth.');
    if (!ageChecked) return setError('You must confirm you are at least 18 years old.');
    if (!termsChecked) return setError('You must agree to the platform rules and terms.');

    const age = ageFromDob(dob);
    if (isNaN(age)) return setError('Please enter a valid date of birth.');
    if (age < MIN_AGE) return setError('You must be at least 18 years old to create an account.');

    setSubmitting(true);
    try {
      await signUp({ email: email.trim(), password, dob, distributorCode });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Could not create account. Please try again.');
      setSubmitting(false);
    }
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

          <div className="deposit-form-card">
            {!success ? (
              <form onSubmit={handleSubmit} noValidate>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label" htmlFor="signupEmail">
                      <i className="fas fa-envelope me-1"></i> Email
                    </label>
                    <input type="email" className="form-control" id="signupEmail" placeholder="your@email.com"
                      value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="signupPassword">
                      <i className="fas fa-lock me-1"></i> Password
                    </label>
                    <input type="password" className="form-control" id="signupPassword" placeholder="At least 8 characters"
                      minLength="8" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="signupPassword2">
                      <i className="fas fa-lock me-1"></i> Confirm Password
                    </label>
                    <input type="password" className="form-control" id="signupPassword2" placeholder="Re-enter password"
                      minLength="8" value={password2} onChange={(e) => setPassword2(e.target.value)} required />
                  </div>
                  <div className="col-12">
                    <label className="form-label" htmlFor="signupDob">
                      <i className="fas fa-cake-candles me-1"></i> Date of Birth
                    </label>
                    <input type="date" className="form-control" id="signupDob" max={maxDob}
                      value={dob} onChange={(e) => setDob(e.target.value)} required />
                    <small style={{ color: 'rgba(255,255,255,0.5)' }}>You must be 18 or older to play. We never ask for a government ID.</small>
                  </div>
                  <div className="col-12">
                    <label className="form-label" htmlFor="signupDistributor">
                      <i className="fas fa-store me-1"></i> Distributor Code <span style={{ opacity: 0.5 }}>(optional)</span>
                    </label>
                    <input type="text" className="form-control" id="signupDistributor" placeholder="e.g. SAMMY"
                      value={distributorCode} onChange={(e) => setDistributorCode(e.target.value)} />
                    <small style={{ color: 'rgba(255,255,255,0.5)' }}>If a distributor referred you, enter their code so they can manage your account.</small>
                  </div>
                  <div className="col-12">
                    <div className="form-check" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      <input className="form-check-input" type="checkbox" id="ageCheck"
                        checked={ageChecked} onChange={(e) => setAgeChecked(e.target.checked)} required />
                      <label className="form-check-label" htmlFor="ageCheck">
                        I confirm I am at least 18 years old and the date of birth above is accurate.
                      </label>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="form-check" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      <input className="form-check-input" type="checkbox" id="termsCheck"
                        checked={termsChecked} onChange={(e) => setTermsChecked(e.target.checked)} required />
                      <label className="form-check-label" htmlFor="termsCheck">
                        I agree to the platform rules and terms.
                      </label>
                    </div>
                  </div>
                  <div className="col-12">
                    <button type="submit" className="btn-texas w-100 text-center" disabled={submitting}>
                      {submitting ? (
                        <><i className="fas fa-spinner fa-spin me-2"></i>Creating account...</>
                      ) : (
                        <><i className="fas fa-star me-2"></i>Create My Account</>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            ) : null}
            {error && <div className="error-box">{error}</div>}
            {success && (
              <div className="success-box">
                <i className="fas fa-check-circle me-1"></i> Account created! Check your email to confirm your address, then <Link to="/login" style={{ color: '#4CAF50', textDecoration: 'underline' }}>log in</Link>.
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
