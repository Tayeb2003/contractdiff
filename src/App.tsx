import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import SmoothScroll from './components/SmoothScroll';

const HomePage = lazy(() => import('./pages/Home'));
const DocumentationPage = lazy(() => import('./pages/DocumentationPage'));
const UploadPage = lazy(() => import('./pages/Upload'));
const AnalysisPage = lazy(() => import('./pages/Analysis'));
const HistoryPage = lazy(() => import('./pages/History'));
const LoginPage = lazy(() => import('./pages/Login'));
const SignupPage = lazy(() => import('./pages/Signup'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPassword'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPassword'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));

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
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-on-surface-variant font-label-caps uppercase tracking-widest">Loading…</div></div>}>
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
          </Suspense>
        </div>
      </SmoothScroll>
    </HashRouter>
  );
}