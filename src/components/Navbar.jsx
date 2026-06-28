import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ showOpenBadge = false, showDeposit = true }) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(true);

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  const handleLogout = async (e) => {
    e.preventDefault();
    await signOut();
    navigate('/');
  };

  const closeNav = () => setCollapsed(true);

  return (
    <nav className="navbar navbar-expand-lg navbar-texas">
      <div className="container">
        <Link className="navbar-brand brand-text" to="/" onClick={closeNav}>
          <i className="fas fa-star me-2"></i>Texas Winners
        </Link>
        <div className="d-flex align-items-center order-lg-last gap-2">
          {showOpenBadge && (
            <span className="open-badge d-none d-md-inline-flex">Open 24/7</span>
          )}
          {showDeposit && (
            <Link to="/deposit" className="nav-link btn-deposit" onClick={closeNav}>
              <i className="fas fa-dollar-sign me-1"></i>Deposit
            </Link>
          )}
        </div>
        <button
          className="navbar-toggler border-0"
          type="button"
          onClick={() => setCollapsed(!collapsed)}
        >
          <i className="fas fa-bars text-white fs-4"></i>
        </button>
        <div className={`collapse navbar-collapse ${collapsed ? '' : 'show'}`}>
          <ul className="navbar-nav ms-auto me-3 mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className={isActive('/')} to="/" onClick={closeNav}>Home</Link>
            </li>
            <li className="nav-item">
              <Link className={isActive('/games')} to="/games" onClick={closeNav}>Play Games</Link>
            </li>
            <li className="nav-item">
              <Link className={isActive('/deposit')} to="/deposit" onClick={closeNav}>Deposit</Link>
            </li>
            <li className="nav-item">
              <Link className={isActive('/promotions')} to="/promotions" onClick={closeNav}>Promotions</Link>
            </li>
            <li className="nav-item">
              <Link className={isActive('/contact')} to="/contact" onClick={closeNav}>Contact</Link>
            </li>
            <li className="nav-item">
              {user ? (
                <Link className={isActive('/account')} to="/account" onClick={closeNav}>
                  <i className="fas fa-user-circle me-1"></i>My Account
                </Link>
              ) : (
                <Link className={isActive('/login')} to="/login" onClick={closeNav}>
                  <i className="fas fa-right-to-bracket me-1"></i>Login
                </Link>
              )}
            </li>
            {user && (
              <li className="nav-item">
                <a className="nav-link" href="#" onClick={(e) => { closeNav(); handleLogout(e); }}>
                  <i className="fas fa-right-from-bracket me-1"></i>Log Out
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
