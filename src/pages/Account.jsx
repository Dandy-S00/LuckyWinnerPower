import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AuthGate from '../components/AuthGate';

export default function Account() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate('/');
  }

  const dob = user?.user_metadata?.date_of_birth;

  return (
    <AuthGate>
      <Navbar showDeposit={false} />

      <section className="deposit-section" style={{ minHeight: '80vh' }}>
        <div className="container">
          <h2 className="section-title">
            <i className="fas fa-user-circle me-2" style={{ fontSize: '0.7em' }}></i> My Account
          </h2>
          <p className="section-subtitle">Howdy, partner</p>

          <div className="deposit-form-card" style={{ maxWidth: 560, margin: '0 auto' }}>
            <div className="mb-3">
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Email</span>
              <div style={{ color: '#fff', fontSize: '1.1rem' }}>{user?.email || '\u2014'}</div>
            </div>
            <div className="mb-3">
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Date of Birth</span>
              <div style={{ color: '#fff', fontSize: '1.1rem' }}>{dob || 'Not provided'}</div>
            </div>
            <div className="mb-4">
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Age Verification</span>
              <div style={{ color: '#4CAF50', fontSize: '1.1rem' }}>
                <i className="fas fa-check-circle me-1"></i> Verified 18+
              </div>
            </div>
            <div className="d-flex gap-3 flex-wrap">
              <Link to="/games" className="btn-texas"><i className="fas fa-gamepad me-2"></i>Play Games</Link>
              <Link to="/deposit" className="btn-texas-outline"><i className="fas fa-dollar-sign me-2"></i>Deposit</Link>
              <button className="btn-texas-outline" onClick={handleLogout}>
                <i className="fas fa-right-from-bracket me-2"></i>Log Out
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer minimal />
    </AuthGate>
  );
}
