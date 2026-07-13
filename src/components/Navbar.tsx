import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface NavbarProps {
  proMode: boolean;
  onTogglePro: () => void;
}

export default function Navbar({ proMode, onTogglePro }: NavbarProps) {
  const [progress, setProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
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

  const scrollToSection = useCallback(
    (id: string) => {
      setMenuOpen(false);
      const doScroll = () => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
      if (isHome) doScroll();
      else {
        navigate('/');
        setTimeout(doScroll, 250);
      }
    },
    [isHome, navigate]
  );

  const sectionLinks = (
    <>
      <button
        onClick={() => scrollToSection('features')}
        className="font-label-caps text-label-caps text-on-surface-variant hover:text-on-surface tracking-[0.1em] uppercase font-semibold transition-colors duration-300 cursor-pointer"
      >
        Expertise
      </button>
      <button
        onClick={() => scrollToSection('pricing')}
        className="font-label-caps text-label-caps text-on-surface-variant hover:text-on-surface tracking-[0.1em] uppercase font-semibold transition-colors duration-300 cursor-pointer"
      >
        Pricing
      </button>
      <button
        onClick={() => scrollToSection('docs')}
        className="font-label-caps text-label-caps text-on-surface-variant hover:text-on-surface tracking-[0.1em] uppercase font-semibold transition-colors duration-300 cursor-pointer"
      >
        API
      </button>
      <button
        onClick={() => scrollToSection('contact')}
        className="font-label-caps text-label-caps text-on-surface-variant hover:text-on-surface tracking-[0.1em] uppercase font-semibold transition-colors duration-300 cursor-pointer"
      >
        Contact
      </button>
    </>
  );

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30">
        <div className="flex justify-between items-center max-w-[1280px] mx-auto px-5 md:px-16 py-6">
          <Link
            to="/"
            className="font-serif text-3xl md:text-3xl font-bold text-on-surface tracking-tight scale-95 active:scale-90 transition-transform"
          >
            ContractDiff
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {sectionLinks}
            {user && (
              <Link
                to="/history"
                onClick={() => setMenuOpen(false)}
                className="font-label-caps text-label-caps text-on-surface-variant hover:text-on-surface tracking-[0.1em] uppercase font-semibold transition-colors duration-300"
              >
                History
              </Link>
            )}
            <Link
              to="/upload"
              onClick={() => setMenuOpen(false)}
              className="font-label-caps text-label-caps bg-gold text-on-gold px-6 py-3 rounded uppercase tracking-widest hover:bg-gold-fixed transition-colors duration-300 shadow-[0_0_15px_rgba(227,195,129,0.3)]"
            >
              Compare
            </Link>
            {!user ? (
              <Link
                to="/login"
                className="font-label-caps text-label-caps text-on-surface-variant hover:text-on-surface tracking-[0.1em] uppercase font-semibold transition-colors duration-300"
              >
                Sign In
              </Link>
            ) : (
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/';
                }}
                className="font-label-caps text-label-caps text-on-surface-variant hover:text-on-surface tracking-[0.1em] uppercase font-semibold transition-colors duration-300"
              >
                Sign Out
              </button>
            )}
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-on-surface scale-95 active:scale-90 transition-transform cursor-pointer"
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined">{menuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>

        <div className="absolute bottom-0 left-0 h-px bg-gold/20 w-full">
          <div
            className="h-full bg-gold transition-[width] duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </nav>

      {menuOpen && (
        <div className="md:hidden fixed top-[88px] left-0 w-full z-40 bg-surface/95 backdrop-blur-xl border-b border-outline-variant/30 py-8 px-6 flex flex-col gap-5">
          {sectionLinks}
          <Link
            to="/upload"
            onClick={() => setMenuOpen(false)}
            className="font-label-caps text-label-caps bg-gold text-on-gold px-6 py-3 rounded uppercase tracking-widest hover:bg-gold-fixed transition-colors text-center"
          >
            Compare
          </Link>
          {user ? (
            <>
              <Link
                to="/history"
                onClick={() => setMenuOpen(false)}
                className="font-label-caps text-label-caps text-on-surface-variant hover:text-on-surface tracking-[0.1em] uppercase font-semibold"
              >
                History
              </Link>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/';
                }}
                className="font-label-caps text-label-caps text-on-surface-variant hover:text-on-surface tracking-[0.1em] uppercase font-semibold text-left"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="font-label-caps text-label-caps text-on-surface-variant hover:text-on-surface tracking-[0.1em] uppercase font-semibold"
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </>
  );
}
