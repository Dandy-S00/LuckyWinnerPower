import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const promos = [
  {
    badge: 'New Players', icon: 'fa-percentage', title: 'Welcome Bonus - 100% Match',
    text: 'First deposit gets a 100% match bonus! Deposit $50, play with $100. Maximum bonus of $200 on your first ever deposit.',
    cta: 'Claim Now', ctaLink: '/deposit', outline: false, highlight: true,
  },
  {
    badge: 'Daily', icon: 'fa-sync', title: 'Daily Reload - 50% Bonus',
    text: 'Every day is bonus day! Get 50% extra on deposits of $25 or more. Available once daily. Max bonus $100.',
    cta: 'Deposit Now', ctaLink: '/deposit', outline: false,
  },
  {
    badge: 'Refer', icon: 'fa-users', title: 'Refer a Friend - $25 Free',
    text: "Bring your partners to Texas Winners! When they make their first deposit of $20+, you both get $25 free play. No limit on referrals.",
    cta: 'Learn More', ctaLink: '/contact', outline: true,
  },
  {
    badge: 'Weekends', icon: 'fa-hat-cowboy', title: 'Weekend Rodeo - 75% Bonus',
    text: 'Saturdays and Sundays get the rodeo treatment. 75% bonus on all deposits over $30. Maximum bonus $150 per weekend.',
    cta: 'Get Bonus', ctaLink: '/deposit', outline: false,
  },
];

export default function Promotions() {
  return (
    <>
      <Navbar />

      <section style={{ background: 'var(--gradient-dark)', minHeight: '80vh', padding: '4rem 0' }}>
        <div className="container">
          <h2 className="section-title"><i className="fas fa-gift me-2" style={{ fontSize: '0.7em' }}></i> Promotions</h2>
          <p className="section-subtitle">Bigger bonuses, Texas style</p>

          <div className="row g-4">
            {promos.map((p, i) => (
              <div className="col-lg-6" key={i}>
                <div className="card-texas" style={p.highlight ? { borderColor: 'var(--tx-gold)' } : {}}>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <span className="promo-badge">{p.badge}</span>
                    <i className={`fas ${p.icon}`} style={{ color: 'var(--tx-gold)', fontSize: '2rem' }}></i>
                  </div>
                  <h4 className="card-title" style={{ color: 'var(--tx-gold)' }}>{p.title}</h4>
                  <p className="card-text">{p.text}</p>
                  <Link
                    to={p.ctaLink}
                    className={p.outline ? 'btn-texas-outline mt-3' : 'btn-texas mt-3'}
                    style={{ fontSize: '0.9rem', padding: '0.5rem 1.5rem' }}
                  >
                    {p.cta} <i className="fas fa-arrow-right ms-1"></i>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 p-4 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h6 style={{ color: 'var(--tx-gold)' }}>Promotion Terms</h6>
            <ul style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', paddingLeft: '1.2rem' }}>
              <li>All bonuses are subject to 1x playthrough requirement before redemption.</li>
              <li>Promotions cannot be combined with other offers unless stated.</li>
              <li>Texas Winners reserves the right to modify or cancel promotions at any time.</li>
              <li>One bonus per person per promotion period.</li>
              <li>Contact support to claim referral bonuses.</li>
            </ul>
          </div>
        </div>
      </section>

      <Footer minimal />
    </>
  );
}
