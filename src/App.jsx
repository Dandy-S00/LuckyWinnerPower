import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Games from './pages/Games';
import Deposit from './pages/Deposit';
import DepositSuccess from './pages/DepositSuccess';
import Account from './pages/Account';
import Promotions from './pages/Promotions';
import Contact from './pages/Contact';
import ScrollToTop from './components/ScrollToTop';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/games" element={<Games />} />
          <Route path="/deposit" element={<Deposit />} />
          <Route path="/deposit-success" element={<DepositSuccess />} />
          <Route path="/account" element={<Account />} />
          <Route path="/promotions" element={<Promotions />} />
          <Route path="/contact" element={<Contact />} />
          {/* Redirect old .html bookmarks and unknown paths to home */}
          <Route path="/index.html" element={<Navigate to="/" replace />} />
          <Route path="/login.html" element={<Navigate to="/login" replace />} />
          <Route path="/signup.html" element={<Navigate to="/signup" replace />} />
          <Route path="/link2play.html" element={<Navigate to="/games" replace />} />
          <Route path="/deposit.html" element={<Navigate to="/deposit" replace />} />
          <Route path="/deposit-success.html" element={<Navigate to="/deposit-success" replace />} />
          <Route path="/account.html" element={<Navigate to="/account" replace />} />
          <Route path="/promotions.html" element={<Navigate to="/promotions" replace />} />
          <Route path="/contact.html" element={<Navigate to="/contact" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Analytics />
      </AuthProvider>
    </BrowserRouter>
  );
}
