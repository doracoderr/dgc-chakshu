import { useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AppRoutes from './routes/AppRoutes';
import useKeepAlive from './hooks/useKeepAlive';
import './styles/index.css';

function AppContent() {
  const { pathname } = useLocation();

  // Scroll to top on every route change (React Router doesn't do this
  // automatically, so links like Credits/Terms/Privacy Policy clicked
  // from a scrolled footer would otherwise open mid-page).
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <>
      <Navbar />
      <main>
        <AppRoutes />
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  useKeepAlive();

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}