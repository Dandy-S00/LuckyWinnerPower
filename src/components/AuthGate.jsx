import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthGate({ children }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      const next = encodeURIComponent(location.pathname + location.search);
      navigate('/login?next=' + next, { replace: true });
    }
  }, [user, loading, navigate, location]);

  if (loading) {
    return (
      <div className="auth-gate">
        <div className="text-center" style={{ color: 'var(--tx-gold)' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2.5rem' }}></i>
          <p className="mt-3">Checking your account...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return children;
}
