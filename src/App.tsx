import { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import SmoothScroll from './components/SmoothScroll';

import HomePage from './pages/Home';
import DocumentationPage from './pages/DocumentationPage';
import UploadPage from './pages/Upload';
import AnalysisPage from './pages/Analysis';
import HistoryPage from './pages/History';
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';
import SettingsPage from './pages/Settings';
import ForgotPasswordPage from './pages/ForgotPassword';
import ResetPasswordPage from './pages/ResetPassword';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';

export default function App() {
  const [proMode, setProMode] = useState(
    localStorage.getItem('professional_mode') === 'true'
  );
  const bgImageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = bgImageRef.current;
    if (!img) return;

    const onScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(scrollY / maxScroll, 1);
      const scale = 1 + progress * 0.3;
      img.style.transform = `scale(${scale})`;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const togglePro = () => {
    const next = !proMode;
    setProMode(next);
    localStorage.setItem('professional_mode', String(next));
  };

  return (
    <HashRouter>
      <SmoothScroll>
        <div className="min-h-screen text-on-surface font-sans bg-surface relative">
          <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-gradient-to-br from-[#05100f] via-[#091614] to-[#0c2622]">
            <img
              ref={bgImageRef}
              src="/lady-justice-bg.webp"
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-luminosity"
              style={{ transformOrigin: 'center center' }}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,transparent_0%,rgba(9,22,20,0.65)_85%)]" />
          </div>
          <Navbar proMode={proMode} onTogglePro={togglePro} />
          <Routes>
            <Route path="/" element={<HomePage proMode={proMode} />} />
            {proMode && <Route path="/documentation" element={<DocumentationPage />} />}
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/analysis/:id" element={<AnalysisPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
          </Routes>
        </div>
      </SmoothScroll>
    </HashRouter>
  );
}