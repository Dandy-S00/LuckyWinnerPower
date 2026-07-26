import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AuthGate from '../components/AuthGate';

export default function Account() {
  const { user, session, signOut } = useAuth();
  const navigate = useNavigate();
  const [portalRole, setPortalRole] = useState(null);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    if (!session?.access_token) return;
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/portal/me', {
          headers: { Authorization: 'Bearer ' + session.access_token },
        });
        const data = await res.json();
        if (!active) return;
        if (data.username) setUsername(data.username);
        if (data.role === 'admin' || data.role === 'distributor') {
          setPortalRole(data.role);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => { active = false; };
  }, [session]);

  async function handleLogout() {
    await signOut();
    navigate('/');
  }

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
            <div className="mb-4">
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Username</span>
              <div style={{ color: '#fff', fontSize: '1.1rem' }}>{username || '\u2014'}</div>
            </div>
            {portalRole && (
              <div className="mb-4">
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Portal Access</span>
                <div>
                  <Link to="/admin" className="btn-texas mt-2">
                    <i className="fas fa-gauge-high me-2"></i>
                    {portalRole === 'admin' ? 'Open Admin Portal' : 'Open Distributor Portal'}
                  </Link>
                </div>
              </div>
            )}
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
