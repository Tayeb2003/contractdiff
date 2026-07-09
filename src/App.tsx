import { useRef, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import SmoothScroll from './components/SmoothScroll';
import CustomCursor from './components/CustomCursor';

const BG_VIDEO = '/bg-video.mp4';

function BackgroundVideo() {
  const refs = [useRef<HTMLVideoElement>(null), useRef<HTMLVideoElement>(null)];
  const [active, setActive] = useState(0);

  const handleEnded = (idx: number) => {
    const other = idx === 0 ? 1 : 0;
    const otherEl = refs[other].current;
    if (otherEl) {
      otherEl.currentTime = 0;
      otherEl.play().catch(() => {});
    }
    setActive(other);
  };

  return (
    <>
      {[0, 1].map((i) => (
        <video
          key={i}
          ref={refs[i]}
          src={BG_VIDEO}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none animate-kenburns transition-opacity duration-[1200ms] ease-in-out"
          style={{
            filter: 'contrast(1.2) saturate(1.25) brightness(1.2)',
            opacity: active === i ? 1 : 0,
          }}
          autoPlay={i === 0}
          muted
          playsInline
          onEnded={() => handleEnded(i)}
        />
      ))}
    </>
  );
}
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

export default function App() {
  const [proMode, setProMode] = useState(
    localStorage.getItem('professional_mode') === 'true'
  );

  const togglePro = () => {
    const next = !proMode;
    setProMode(next);
    localStorage.setItem('professional_mode', String(next));
  };

  return (
    <BrowserRouter>
      <SmoothScroll>
        <div className="min-h-screen selection:bg-mint selection:text-black font-sans text-mint bg-page relative">
          {/* Permanent video background */}
          <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-gradient-to-br from-[#05382f] via-[#0a2e28] to-[#0a4a3c]">
            <BackgroundVideo />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a2e28]/40 via-[#0a2e28]/25 to-[#0a2e28]/45" />
            <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 200px 60px rgba(10,46,40,0.9)' }} />
          </div>
          <CustomCursor />
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
        </Routes>
        </div>
      </SmoothScroll>
    </BrowserRouter>
  );
}
