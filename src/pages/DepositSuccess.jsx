import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function DepositSuccess() {
  return (
    <>
      <Navbar showDeposit={false} />

      <section className="deposit-section" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center' }}>
        <div className="container">
          <div className="deposit-form-card text-center" style={{ borderColor: '#4CAF50' }}>
            <div style={{ fontSize: '5rem', color: '#4CAF50', marginBottom: '1.5rem' }}>
              <i className="fas fa-check-circle"></i>
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--tx-gold)', marginBottom: '1rem' }}>
              Deposit Successful!
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', marginBottom: '2rem' }}>
              Your payment has been processed successfully. Your account will be credited shortly. You&apos;ll receive a confirmation email.
            </p>
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <Link to="/games" className="btn-texas">
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
