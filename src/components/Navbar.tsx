import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Shield, Settings } from 'lucide-react';

interface NavbarProps {
  proMode: boolean;
  onTogglePro: () => void;
}

export default function Navbar({ proMode, onTogglePro }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      const h = document.documentElement;
      const scrolled = h.scrollTop;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? (scrolled / max) * 100 : 0);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null;

  return (
    <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#0a2e28]/60 backdrop-blur-lg py-4 shadow-sm shadow-mint/5' : 'bg-transparent py-8'}`}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
        <Link to="/" className="font-serif text-3xl font-medium tracking-wide text-metallic hover:opacity-80 transition-opacity">
          ContractDiff
        </Link>

        <nav className="hidden md:flex gap-10 text-xs tracking-[0.2em] uppercase font-medium">
          <a href={isHome ? '#features' : '/#features'} className="hover:text-white transition-colors">Features</a>
          <a href={isHome ? '#pricing' : '/#pricing'} className="hover:text-white transition-colors">Pricing</a>
          <a href={isHome ? '#docs' : '/#docs'} className="hover:text-white transition-colors">Docs</a>
          <a href={isHome ? '#contact' : '/#contact'} className="hover:text-white transition-colors">Contact</a>
          <Link to="/upload" className="hover:text-white transition-colors">Compare</Link>
          {user && <Link to="/history" className="hover:text-white transition-colors">History</Link>}
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/settings" className="p-2 border border-mint/30 hover:border-mint transition-colors cursor-pointer" title="Settings">
                <Settings className="w-4 h-4 text-mint" strokeWidth={1.5} />
              </Link>
              <button className="p-2 border border-mint/30 hover:border-mint transition-colors cursor-pointer" title={user.email}>
                <User className="w-4 h-4 text-mint" strokeWidth={1.5} />
              </button>
            </>
          ) : (
            <Link to="/login" className="text-xs uppercase tracking-[0.2em] font-medium hover:text-white transition-colors hidden md:block">
              Sign In
            </Link>
          )}
          {user ? (
            <>
              <button
                onClick={onTogglePro}
                className={`p-2 transition-colors cursor-pointer ${proMode ? 'bg-mint/20 border border-mint' : 'border border-transparent opacity-40 hover:opacity-80'}`}
                title={proMode ? 'Professional mode on' : 'Toggle professional mode'}
              >
                <Shield className={`w-4 h-4 ${proMode ? 'text-mint' : 'text-body'}`} strokeWidth={1.5} />
              </button>
              <button
                onClick={() => { localStorage.clear(); window.location.href = '/'; }}
                className="relative inline-flex items-center justify-center px-6 py-2.5 text-xs uppercase tracking-[0.2em] font-medium border border-mint hover:bg-mint hover:text-black transition-all duration-300 cursor-pointer"
                style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0 100%)' }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              to="/upload"
              className="relative inline-flex items-center justify-center px-8 py-3 text-xs uppercase tracking-[0.2em] font-medium border border-mint hover:bg-mint hover:text-black transition-all duration-300"
              style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0 100%)' }}
            >
              Try Free
            </Link>
          )}
        </div>
      </div>

      {/* Scroll Progress Bar */}
      <div className="absolute bottom-0 left-0 h-px bg-mint/30 w-full">
        <div className="h-full bg-mint transition-[width] duration-150 ease-out" style={{ width: `${progress}%` }} />
      </div>
    </header>
  );
}
