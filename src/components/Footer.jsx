import { Link } from 'react-router-dom';

export default function Footer({ minimal = false }) {
  if (minimal) {
    return (
      <footer className="footer-texas">
        <div className="container">
          <div className="footer-bottom text-center" style={{ borderTop: 'none', marginTop: 0 }}>
            <p>&copy; 2024 Texas Winners. All rights reserved. | Must be 18+ to play.</p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="footer-texas">
      <div className="container">
        <div className="row">
          <div className="col-md-4 mb-4">
            <div className="footer-brand"><i className="fas fa-star me-2"></i>Texas Winners</div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
              The Lone Star State&apos;s premier sweepstakes platform. Open 24/7, fast deposits, faster cashouts.
            </p>
          </div>
          <div className="col-md-2 mb-4">
            <h6 className="text-white mb-3">Quick Links</h6>
            <div className="footer-links">
              <Link to="/">Home</Link>
              <Link to="/games">Play Games</Link>
              <Link to="/deposit">Deposit</Link>
              <Link to="/promotions">Promotions</Link>
            </div>
          </div>
          <div className="col-md-3 mb-4">
            <h6 className="text-white mb-3">Support</h6>
            <div className="footer-links">
              <Link to="/contact">Contact Us</Link>
              <Link to="/signup">Create Account</Link>
              <Link to="/login">Log In</Link>
              <a href="#rules">Rules</a>
            </div>
          </div>
          <div className="col-md-3 mb-4">
            <h6 className="text-white mb-3">Payment</h6>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
              <i className="fab fa-cc-visa me-2"></i>
              <i className="fab fa-cc-mastercard me-2"></i>
              <i className="fab fa-cc-amex me-2"></i>
              <i className="fab fa-cc-discover me-2"></i>
            </p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
              Secured by <i className="fab fa-stripe" style={{ color: '#635BFF', fontSize: '1.2rem' }}></i> Stripe
            </p>
          </div>
        </div>
        <div className="footer-bottom text-center">
          <p>&copy; 2024 Texas Winners. All rights reserved. | Must be 18+ to play. | No purchase necessary.</p>
        </div>
      </div>
    </footer>
  );
}
