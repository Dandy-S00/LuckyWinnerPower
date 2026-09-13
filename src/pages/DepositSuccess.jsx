import { Link, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function DepositSuccess() {
  const { session } = useAuth();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!session || !sessionId) {
      setStatus('invalid');
      return;
    }
    fetch(`/api/checkout-session?session_id=${encodeURIComponent(sessionId)}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not verify payment.');
        setStatus(data.status);
      })
      .catch(() => setStatus('invalid'));
  }, [searchParams, session]);

  const paid = status === 'paid';
  return (
    <>
      <Navbar showDeposit={false} />

      <section className="deposit-section" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center' }}>
        <div className="container">
          <div className="deposit-form-card text-center" style={{ borderColor: '#4CAF50' }}>
            <div style={{ fontSize: '5rem', color: paid ? '#4CAF50' : '#D4A437', marginBottom: '1.5rem' }}>
              <i className={`fas ${paid ? 'fa-check-circle' : 'fa-clock'}`}></i>
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--tx-gold)', marginBottom: '1rem' }}>
              {paid ? 'Payment Received' : status === 'pending' ? 'Payment Processing' : 'Payment Verification Required'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', marginBottom: '2rem' }}>
              {paid
                ? 'Your payment was confirmed. Your account will be credited shortly after the payment webhook completes.'
                : 'We could not confirm a completed payment yet. Check your payment email or contact support before trying again.'}
            </p>
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <Link to={paid ? '/games' : '/deposit'} className="btn-texas">
                <i className="fas fa-gamepad me-2"></i>Start Playing
              </Link>
              <Link to="/deposit" className="btn-texas-outline">
                <i className="fas fa-plus me-2"></i>Another Deposit
              </Link>
            </div>
            <p className="mt-4" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
              Transaction reference will be sent to your email.
            </p>
          </div>
        </div>
      </section>

      <Footer minimal />
    </>
  );
}
