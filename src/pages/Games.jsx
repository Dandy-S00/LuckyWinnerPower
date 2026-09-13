import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AuthGate from '../components/AuthGate';
import CasinoGames from '../components/CasinoGames';

export default function Games() {
  return (
    <AuthGate>
      <Navbar />

      <section className="games-section" style={{ minHeight: '80vh' }}>
        <div className="container py-5">
          <h2 className="section-title"><i className="fas fa-gamepad me-2" style={{ fontSize: '0.7em' }}></i> Game Lobby</h2>
          <p className="section-subtitle">Pick a Texas table and play with demo credits</p>
          <CasinoGames />

          <div className="text-center mt-5 p-4 rounded" style={{ background: 'rgba(212,164,55,0.1)', border: '1px solid rgba(212,164,55,0.3)' }}>
            <h4 style={{ color: 'var(--tx-gold)', fontFamily: "'Playfair Display', serif" }}>Need to load up?</h4>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>Deposit instantly and start playing your favorite games.</p>
            <Link to="/deposit" className="btn-texas">
              <i className="fas fa-dollar-sign me-2"></i>Make a Deposit
            </Link>
          </div>
        </div>
      </section>

      <Footer minimal />
    </AuthGate>
  );
}
