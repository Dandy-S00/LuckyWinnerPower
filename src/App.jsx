import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
