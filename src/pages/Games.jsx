import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AuthGate from '../components/AuthGate';

const games = [
  { name: 'Juwa 777', label: 'JUWA', icon: 'fa-fish', gradient: 'linear-gradient(135deg, #1a237e, #283593)', desc: 'Fish games, slots, and table games. One of the most popular sweepstakes platforms.', badge: 'Popular', url: 'https://dl.juwa777.com' },
  { name: 'Orion Stars', label: 'ORION STARS', icon: 'fa-star', gradient: 'linear-gradient(135deg, #1b5e20, #2e7d32)', desc: 'Premium slots and fish table games with stunning graphics.', badge: 'Hot', url: 'https://start.orionstars.vip:8580' },
  { name: 'Fire Kirin', label: 'FIRE KIRIN', icon: 'fa-fire', gradient: 'linear-gradient(135deg, #b71c1c, #c62828)', desc: 'Arcade-style shooters and fish games with massive multipliers.', url: 'https://start.firekirin.xyz:8580' },
  { name: 'Game Vault 999', label: 'GAME VAULT', icon: 'fa-vault', gradient: 'linear-gradient(135deg, #4a148c, #6a1b9a)', desc: 'Huge selection of slots, keno, and fish games all in one vault.', url: 'https://download.gamevault999.com' },
  { name: 'Milky Way', label: 'MILKY WAY', icon: 'fa-meteor', gradient: 'linear-gradient(135deg, #0d47a1, #1565c0)', desc: 'Space-themed slots and fish games with cosmic jackpots.', url: 'https://milkywayapp.xyz' },
  { name: 'Vegas X', label: 'VEGAS X', icon: 'fa-dice', gradient: 'linear-gradient(135deg, #e65100, #f57c00)', desc: 'Vegas-style slots experience with progressive jackpots.', url: 'https://vegas-x.org' },
  { name: 'Panda Master', label: 'PANDA MASTER', icon: 'fa-paw', gradient: 'linear-gradient(135deg, #212121, #424242)', desc: 'Asian-themed fish games and slots with unique bonus rounds.', url: 'https://pandamaster.vip:8888' },
  { name: 'Ultra Panda', label: 'ULTRA PANDA', icon: 'fa-dragon', gradient: 'linear-gradient(135deg, #880e4f, #ad1457)', desc: 'Next-gen fish games with HD graphics and huge payouts.', url: 'https://www.ultrapanda.mobi' },
  { name: 'VBLink 777', label: 'VBLINK', icon: 'fa-link', gradient: 'linear-gradient(135deg, #004d40, #00695c)', desc: 'Classic slots and modern fish games with daily bonuses.', url: 'https://www.vblink777.club' },
];

export default function Games() {
  return (
    <AuthGate>
      <Navbar />

      <section className="games-section" style={{ minHeight: '80vh' }}>
        <div className="container py-5">
          <h2 className="section-title"><i className="fas fa-gamepad me-2" style={{ fontSize: '0.7em' }}></i> Game Lobby</h2>
          <p className="section-subtitle">Choose your game and start winning, partner</p>

          <div className="row g-4">
            {games.map((g, i) => (
              <div className="col-lg-4 col-md-6" key={i}>
                <div className="game-card">
                  <div style={{ height: 200, background: g.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="text-center">
                      <i className={`fas ${g.icon}`} style={{ fontSize: '4rem', color: 'var(--tx-gold)' }}></i>
                      <p className="mt-2" style={{ color: 'var(--tx-gold)', fontFamily: "'Rye', cursive" }}>{g.label}</p>
                    </div>
                  </div>
                  <div className="game-info">
                    <h5 className="game-title">{g.name}</h5>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{g.desc}</p>
                    {g.badge && <><span className="promo-badge mb-2">{g.badge}</span><br /></>}
                    <a href={g.url} target="_blank" rel="noopener noreferrer" className="game-btn mt-2">
                      <i className="fas fa-external-link-alt me-1"></i> Play {g.label.split(' ')[0]}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

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
