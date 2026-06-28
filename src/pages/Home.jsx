import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const tickerItems = [
  { icon: 'fa-trophy', name: 'Jake R.', action: 'won', amount: '$250' },
  { icon: 'fa-star', name: 'Maria T.', action: 'redeemed', amount: '$180' },
  { icon: 'fa-trophy', name: 'Big D.', action: 'won', amount: '$500' },
  { icon: 'fa-star', name: 'Austin K.', action: 'redeemed', amount: '$75' },
  { icon: 'fa-trophy', name: 'Sarah M.', action: 'won', amount: '$320' },
  { icon: 'fa-star', name: 'Houston J.', action: 'redeemed', amount: '$410' },
  { icon: 'fa-trophy', name: 'Dallas P.', action: 'won', amount: '$150' },
  { icon: 'fa-star', name: 'Lubbock T.', action: 'redeemed', amount: '$200' },
];

const features = [
  { icon: 'fa-bolt', title: 'Instant Deposits', text: 'Fund your account in seconds with Stripe. Secure card payments processed instantly so you can start playing right away.' },
  { icon: 'fa-gamepad', title: 'Top Games', text: 'Access the best sweepstakes games including Juwa, Orion Stars, Fire Kirin, Game Vault and more. All your favorites in one place.' },
  { icon: 'fa-hand-holding-dollar', title: 'Fast Cashouts', text: 'Redeem your winnings quickly with our 24/7 cashout processing. We pay fast because winners shouldn\'t have to wait.' },
];

const games = [
  { name: 'Juwa', icon: 'fa-fish', gradient: 'linear-gradient(135deg, #1a237e, #283593)', desc: 'Fish games & slots' },
  { name: 'Orion Stars', icon: 'fa-star', gradient: 'linear-gradient(135deg, #1b5e20, #2e7d32)', desc: 'Slots & fish tables' },
  { name: 'Fire Kirin', icon: 'fa-fire', gradient: 'linear-gradient(135deg, #b71c1c, #c62828)', desc: 'Arcade & shooters' },
];

const rules = [
  'Minimum deposit is $5.00. Maximum single deposit is $1,000.00.',
  'All deposits are processed securely through Stripe. We never store your card details.',
  'Sweeps coins are for entertainment only. No purchase necessary to play.',
  'You must be 18+ years old to participate.',
  'Redemptions are processed within 24 hours during business days.',
  'One account per person. Multiple accounts will be suspended.',
  'Texas Winners reserves the right to void entries that violate our terms.',
  'Contact support 24/7 for any questions or assistance.',
];

export default function Home() {
  const renderTickerItems = () =>
    tickerItems.map((item, i) => (
      <span className="ticker-item" key={i}>
        <i className={`fas ${item.icon}`}></i> {item.name} {item.action} <span className="amount">{item.amount}</span>
      </span>
    ));

  return (
    <>
      <Navbar showOpenBadge />

      <section className="ticker-section">
        <div className="ticker-track">
          {renderTickerItems()}
          {renderTickerItems()}
        </div>
      </section>

      <section className="hero-section">
        <div className="container position-relative">
          <div className="row align-items-center">
            <div className="col-lg-7">
              <h1 className="hero-title text-white">
                Welcome to<br /><span className="gold-text">Texas Winners</span>
              </h1>
              <p className="hero-subtitle">
                The Lone Star State&apos;s premier sweepstakes destination. Play your favorite games, win big, and cash out fast. No purchase necessary to enter.
              </p>
              <div className="d-flex gap-3 flex-wrap">
                <Link to="/deposit" className="btn-texas">
                  <i className="fas fa-bolt me-2"></i>Deposit Now
                </Link>
                <Link to="/games" className="btn-texas-outline">
                  <i className="fas fa-gamepad me-2"></i>Play Games
                </Link>
              </div>
            </div>
            <div className="col-lg-5 text-center mt-4 mt-lg-0">
              <div style={{ fontSize: '8rem', color: 'var(--tx-gold)', textShadow: '0 0 40px rgba(212,164,55,0.4)' }}>
                <i className="fas fa-star"></i>
              </div>
              <p className="mt-3" style={{ color: 'var(--tx-gold)', fontFamily: "'Rye', cursive", fontSize: '1.3rem' }}>
                Everything&apos;s Bigger in Texas
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5" style={{ background: 'var(--tx-dark)' }}>
        <div className="container py-4">
          <h2 className="section-title"><i className="fas fa-star me-2" style={{ fontSize: '0.7em' }}></i> Why Texas Winners?</h2>
          <p className="section-subtitle">Fast deposits, instant play, real winnings</p>
          <div className="row g-4">
            {features.map((f, i) => (
              <div className="col-md-4" key={i}>
                <div className="card-texas text-center">
                  <div className="card-icon mx-auto"><i className={`fas ${f.icon}`}></i></div>
                  <h5 className="card-title">{f.title}</h5>
                  <p className="card-text">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="games-section">
        <div className="container">
          <h2 className="section-title"><i className="fas fa-gamepad me-2" style={{ fontSize: '0.7em' }}></i> Featured Games</h2>
          <p className="section-subtitle">Choose your adventure, partner</p>
          <div className="row g-4">
            {games.map((g, i) => (
              <div className="col-md-4 col-6" key={i}>
                <div className="game-card">
                  <div style={{ height: 180, background: g.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`fas ${g.icon}`} style={{ fontSize: '4rem', color: 'var(--tx-gold)' }}></i>
                  </div>
                  <div className="game-info">
                    <h5 className="game-title">{g.name}</h5>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>{g.desc}</p>
                    <Link to="/games" className="game-btn">Play Now</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <Link to="/games" className="btn-texas-outline">View All Games <i className="fas fa-arrow-right ms-2"></i></Link>
          </div>
        </div>
      </section>

      <section className="rules-section" id="rules">
        <div className="container">
          <h2 className="section-title"><i className="fas fa-scroll me-2" style={{ fontSize: '0.7em' }}></i> Platform Rules</h2>
          <p className="section-subtitle">Play fair, win big</p>
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <ul className="rules-list">
                {rules.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5" style={{ background: 'var(--gradient-hero)' }}>
        <div className="container text-center py-4">
          <h2 className="section-title text-white" style={{ color: 'white' }}>Ready to Win Big, Partner?</h2>
          <p className="section-subtitle">Join thousands of Texas winners today</p>
          <Link to="/deposit" className="btn-texas btn-lg">
            <i className="fas fa-star me-2"></i>Make Your First Deposit
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
