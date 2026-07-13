import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ScrollVideoHandler from '../components/ScrollVideoHandler';
import {
  ArrowRight,
  Check,
  FileText,
  ShieldAlert,
  Zap,
  Users,
  History as HistoryIcon,
  Download,
  Scan,
  GitCompare,
  BadgeCheck,
  Server,
  Lock,
  Scale,
  Eye,
  Brain,
  Shield,
  Upload as UploadIcon,
  MessageSquareText,
} from 'lucide-react';

interface HomePageProps {
  proMode: boolean;
}

const features = [
  { icon: <FileText className="w-8 h-8" strokeWidth={1} />, title: 'Smart Diff', description: 'Instantly see what changed between two contracts without reading page by page. Every addition, deletion, and modification is highlighted at the clause level.' },
  { icon: <Zap className="w-8 h-8" strokeWidth={1} />, title: 'Plain English Translation', description: 'Complex legal jargon translated into plain language, so you know exactly what you are signing. No more guessing what terms really mean.' },
  { icon: <ShieldAlert className="w-8 h-8" strokeWidth={1} />, title: 'Risk Scoring', description: 'Every change is automatically scored by severity — minor, moderate, or major — so you can prioritise what needs a lawyer\u2019s eyes.' },
  { icon: <BadgeCheck className="w-8 h-8" strokeWidth={1} />, title: 'Party Favour Analysis', description: 'See which party each clause favours at a glance. Spot one-sided termination clauses and unbalanced liability caps.' },
  { icon: <GitCompare className="w-8 h-8" strokeWidth={1} />, title: 'Multi-Format Support', description: 'Upload PDF, DOCX, or plain text files. Paste raw contract text directly. ContractDiff normalises everything into a unified comparison view.' },
  { icon: <Scan className="w-8 h-8" strokeWidth={1} />, title: 'Clause-Level Breakdown', description: 'Each changed clause is extracted, compared side-by-side, and explained in isolation so you can evaluate changes one by one.' },
  { icon: <HistoryIcon className="w-8 h-8" strokeWidth={1} />, title: 'Full Analysis History', description: 'Every comparison is saved automatically. Revisit past analyses and track how contracts evolved between negotiations.' },
  { icon: <Download className="w-8 h-8" strokeWidth={1} />, title: 'Export & Share', description: 'Export analysis reports to PDF or DOCX. Share results with your team, legal counsel, or stakeholders via a secure link.' },
];

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'Perfect for individuals comparing standard agreements.',
    features: ['5 contracts per month', 'Basic smart diff', 'Plain English translation', 'Email support'],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For teams and organisations with advanced needs. Contract-only pricing.',
    features: ['Unlimited comparisons', 'Advanced risk detection', 'Export to PDF/Word', 'Dedicated account manager', 'Custom AI model training', 'SSO / SAML', 'Audit logs & compliance', '99.9% SLA'],
    highlighted: true,
    contactUs: true,
  },
];

const pillars = [
  {
    icon: <Scale className="w-7 h-7" />,
    title: 'Clarity from Complexity',
    body: 'Contracts are built in language designed to protect, not to inform. We strip away the legalese and surface what changed, what matters, and what demands your attention.',
  },
  {
    icon: <Eye className="w-7 h-7" />,
    title: 'Microscopic Precision',
    body: 'Our engine parses every clause, every comma, every liability shift with surgical accuracy. Where the naked eye misses a buried amendment, ContractDiff illuminates it.',
  },
  {
    icon: <Brain className="w-7 h-7" />,
    title: 'Augmented Judgement',
    body: "We don't just highlight differences — we interpret them. Each change is scored by severity, tagged by risk, and translated into plain English.",
  },
  {
    icon: <Shield className="w-7 h-7" />,
    title: 'Radical Autonomy',
    body: 'Legal expertise should not be a gatekeeper — it should be a utility. No law degree required. No fine print left unread.',
  },
];

function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const startTs = Date.now();
          const dur = 1500;
          function tick() {
            const p = Math.min((Date.now() - startTs) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setCount(Math.round(eased * to));
            if (p < 1) requestAnimationFrame(tick);
          }
          tick();
          obs.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [el, to]);
  return <div ref={setEl}>{count}{suffix}</div>;
}

export default function HomePage({ proMode }: HomePageProps) {
  const location = useLocation();
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const onFirstScroll = () => {
      setHasScrolled(true);
      window.removeEventListener('scroll', onFirstScroll);
    };
    window.addEventListener('scroll', onFirstScroll, { once: true, passive: true });
    return () => window.removeEventListener('scroll', onFirstScroll);
  }, []);

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, [location]);

  return (
    <div className="relative">
      {/* ─────────────────────────── HERO (scroll-driven video) ─────────────────────────── */}
      <header className="relative w-full">
        {/* Scroll track — 600vh tall so full animation plays before content */}
        <div id="hero-track" className="relative w-full" style={{ height: '600vh' }}>
          {/* Pinned video layer */}
          <div className="sticky top-0 h-screen w-full overflow-hidden z-0">
            <video
              ref={(el) => {
                if (el) {
                  const video = el;
                  video.muted = true;
                  video.playsInline = true;
                  video.preload = 'auto';
                }
              }}
              id="hero-scroll-video"
              src="/hero-scroll.mp4"
              muted
              playsInline
              preload="auto"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: 1, filter: 'brightness(1.45) contrast(1.1)' }}
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(9,22,20,0.7) 0%, rgba(9,22,20,0.3) 40%, rgba(9,22,20,0.55) 100%)',
              }}
            />
          </div>

          {/* Pinned hero text — centered over the video, stays visible */}
          <div className="sticky top-0 h-screen w-full flex items-center justify-center z-10 pointer-events-none">
            <div className="w-full max-w-[1280px] mx-auto px-5 md:px-16 flex flex-col items-center text-center pointer-events-auto"
              style={{ paddingTop: '112px' }}
            >
              <h1
                className="text-display-lg font-display-lg text-on-surface mb-6 leading-[1.02] tracking-[-0.02em] drop-shadow-2xl"
                style={{
                  fontSize: 'clamp(48px, 8vw, 104px)',
                  lineHeight: 1.02,
                  transformStyle: 'preserve-3d',
                  textShadow: `
                    0 2px 4px rgba(9,22,20,0.4),
                    0 6px 12px rgba(9,22,20,0.25),
                    0 12px 24px rgba(9,22,20,0.15),
                    0 20px 40px rgba(0,0,0,0.2)
                  `.replace(/\s+/g, ' ').trim()
                }}
              >
                <span className="font-serif">ContractDiff</span>:{' '}
                <span className="text-gold italic font-light">Understand every clause.</span>
              </h1>

              <motion.div
                animate={{ opacity: hasScrolled ? 1 : 0, y: hasScrolled ? 0 : 20 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              >
                <p
                  className="text-body-lg text-body-lg text-on-surface-variant max-w-2xl mb-16 leading-relaxed"
                  style={{ fontSize: 'clamp(18px, 1.6vw, 22px)' }}
                >
                  World-class contract intelligence that reveals every change, every risk, and every shift
                  in negotiated power — in plain English. Built for non-lawyers, trusted by negotiators.
                </p>

                <div
                  className="flex flex-col sm:flex-row gap-6 w-full justify-center"
                >
                <Link
                  to="/upload"
                  className="inline-flex items-center justify-center font-label-caps text-label-caps bg-gold text-on-gold px-8 py-4 rounded uppercase tracking-widest hover:bg-gold-fixed transition-colors duration-300 shadow-[0_0_20px_rgba(227,195,129,0.4)]"
                >
                  Request a Comparison
                </Link>
                <button
                  onClick={() => {
                    const el = document.getElementById('features');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center justify-center font-label-caps text-label-caps glass-panel text-on-surface border border-secondary/50 px-8 py-4 rounded uppercase tracking-widest hover:bg-secondary/10 transition-colors duration-300 cursor-pointer"
                >
                  Our Expertise
                </button>
              </div>
            </motion.div>
          </div>
        </div>

          <ScrollVideoHandler targetId="hero-scroll-video" containerId="hero-track" />
        </div>

        {/* Scroll indicator — left side */}
        <div className="relative z-10 flex flex-col items-start -mt-20 pb-12 ml-8 md:ml-16 opacity-70 scroll-indicator">
          <span className="font-label-caps text-label-caps text-on-surface-variant mb-2 uppercase tracking-[0.2em]">
            Scroll to Explore
          </span>
          <span className="material-symbols-outlined text-on-surface-variant">arrow_downward</span>
        </div>
      </header>

      {/* ─────────────────────── PROPOSITION / 4 PILLARS ─────────────────────── */}
      <section className="relative z-10 py-20 md:py-32 lg:py-40 px-6 md:px-16 max-w-[1280px] mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center mb-16 md:mb-24 lg:mb-28"
        >
          <span className="font-label-caps text-label-caps text-gold/70 uppercase tracking-[0.3em] mb-8 block">
            The Proposition
          </span>
          <h2
            className="font-serif text-on-surface mb-10 leading-tight"
            style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}
          >
            Every contract tells a story.
            <br />
            <span className="italic text-gold">We teach you to read it.</span>
          </h2>
          <p className="text-body-lg text-on-surface-variant max-w-3xl mx-auto leading-relaxed">
            ContractDiff is an intelligent contract analysis platform built for the non-lawyer world.
            It ingests two versions of a document, runs a forensic diff across every clause, and returns
            a plain-English breakdown of what changed, who it favors, and how seriously you should care.
            <span className="text-gold"> Understanding at a glance.</span>
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-16 max-w-6xl mx-auto">
          {pillars.map((pillar, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, delay: i * 0.15 }}
              className="glass-panel p-8 rounded-lg"
            >
              <div className="flex items-start gap-6">
                <div className="text-gold mt-1 shrink-0">{pillar.icon}</div>
                <div>
                  <h3
                    className="font-serif mb-4 tracking-tight text-on-surface"
                    style={{ fontSize: 'clamp(22px, 2.5vw, 30px)' }}
                  >
                    {pillar.title}
                  </h3>
                  <p className="text-body-md text-on-surface-variant leading-relaxed opacity-80">
                    {pillar.body}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ───────────────────────── STATS ───────────────────────── */}
      <section className="relative z-10 py-24 px-6 md:px-16 max-w-[1280px] mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <span className="font-label-caps text-label-caps text-gold/70 uppercase tracking-[0.3em] mb-6 block">
            By the Numbers
          </span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-12 gap-x-8 mt-12">
            {[
              { to: 500, suffix: '+', label: 'Contracts Analysed' },
              { to: 99, suffix: '%', label: 'Accuracy Rate' },
              { to: 3, suffix: 's', label: 'Avg. Analysis Time' },
              { to: 100, suffix: '%', label: 'Data Privacy' },
            ].map((stat, i) => (
              <div key={i} className="relative px-4">
                {i > 0 && (
                  <span className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-px h-16 bg-gold/20" />
                )}
                <div
                  className="font-serif leading-none text-gold"
                  style={{ fontSize: 'clamp(36px, 5vw, 72px)' }}
                >
                  <Counter to={stat.to} suffix={stat.suffix} />
                </div>
                <p className="text-body-md text-on-surface-variant mt-4 opacity-60 uppercase tracking-[0.15em]">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ───────────────────────── FEATURES ───────────────────────── */}
      <section
        id="features"
        className="relative z-10 py-20 md:py-32 lg:py-40 px-6 md:px-16 max-w-[1280px] mx-auto w-full scroll-mt-40"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-20">
            <span className="font-label-caps text-label-caps text-gold/70 uppercase tracking-[0.3em] mb-6 block">
              Expertise
            </span>
            <h2
              className="font-serif text-on-surface mb-6 uppercase"
              style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}
            >
              Understand <span className="text-gold italic font-light">Everything</span>
            </h2>
            <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              Empowers you to negotiate with confidence by highlighting the differences that actually matter.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="glass-panel p-7 rounded-lg hover:bg-secondary/10 transition-colors duration-300"
              >
                <div className="mb-6 text-gold">{feature.icon}</div>
                <h3
                  className="font-serif mb-3 text-on-surface tracking-wide"
                  style={{ fontSize: 'clamp(20px, 1.6vw, 24px)' }}
                >
                  {feature.title}
                </h3>
                <p className="text-body-md text-on-surface-variant leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ───────────────────────── PRICING ───────────────────────── */}
      <section
        id="pricing"
        className="relative z-10 py-20 md:py-32 lg:py-40 px-6 md:px-16 max-w-[1280px] mx-auto w-full scroll-mt-40"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center mb-20">
            <span className="font-label-caps text-label-caps text-gold/70 uppercase tracking-[0.3em] mb-6 block">
              Pricing
            </span>
            <h2
              className="font-serif text-on-surface mb-6 uppercase"
              style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}
            >
              Simple <span className="text-gold italic font-light">Pricing</span>
            </h2>
            <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              Choose the plan that fits your needs. No hidden fees.
            </p>
          </div>
          <div className="flex flex-col md:flex-row justify-center gap-8 lg:gap-12 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.8 }}
                className={`p-10 md:p-12 flex flex-col rounded-lg glass-panel md:w-1/2 ${
                  plan.highlighted
                    ? 'border-gold/70 bg-gold/10'
                    : ''
                }`}
              >
                <h3 className="font-label-caps text-label-caps text-gold uppercase tracking-widest mb-4">
                  {plan.name}
                </h3>
                <div className="flex items-baseline mb-6">
                  <span
                    className="font-serif text-on-surface"
                    style={{ fontSize: 'clamp(40px, 5vw, 60px)' }}
                  >
                    {plan.price}
                  </span>
                </div>
                <p className="text-body-md text-on-surface-variant leading-relaxed mb-8">
                  {plan.description}
                </p>
                <div className="space-y-3 flex-grow mb-10">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-3 text-body-md">
                      <Check
                        className="w-5 h-5 text-gold mt-0.5 shrink-0"
                        strokeWidth={1.5}
                      />
                      <span className="text-on-surface-variant">{f}</span>
                    </div>
                  ))}
                </div>
                {plan.contactUs ? (
                  <button
                    onClick={() => {
                      const el = document.getElementById('contact');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full text-center py-4 font-label-caps text-label-caps uppercase tracking-[0.2em] transition-all duration-300 rounded border border-gold text-gold hover:bg-gold hover:text-on-gold cursor-pointer"
                  >
                    Contact Us
                  </button>
                ) : (
                  <Link
                    to="/signup"
                    className={`text-center py-4 font-label-caps text-label-caps uppercase tracking-[0.2em] transition-all duration-300 rounded ${
                      plan.highlighted
                        ? 'bg-gold text-on-gold hover:bg-gold-fixed'
                        : 'border border-gold text-gold hover:bg-gold hover:text-on-gold'
                    }`}
                  >
                    Get Started
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ───────────────────────── DOCS/API ───────────────────────── */}
      <section
        id="docs"
        className="relative z-10 py-20 md:py-32 lg:py-40 px-6 md:px-16 max-w-[1280px] mx-auto w-full scroll-mt-40"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
        >
          <div className="max-w-4xl">
            <span className="font-label-caps text-label-caps text-gold/70 uppercase tracking-[0.3em] mb-6 block">
              API
            </span>
            <h2
              className="font-serif text-on-surface mb-8 uppercase"
              style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}
            >
              Developer API
            </h2>
            <p className="text-body-lg text-on-surface-variant mb-12 leading-relaxed max-w-2xl">
              ContractDiff exposes a comprehensive REST API for uploading contracts, comparing versions,
              and retrieving AI-powered analysis results. Every endpoint is scoped per user and
              secured with JWT.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {[
                {
                  icon: <FileText className="w-7 h-7 text-gold mb-4" strokeWidth={1} />,
                  title: 'Document Management',
                  body: 'Upload PDF, DOCX, or TXT files. Paste raw contract text. Every document is stored and scoped to its owner.',
                },
                {
                  icon: <GitCompare className="w-7 h-7 text-gold mb-4" strokeWidth={1} />,
                  title: 'Contract Comparison',
                  body: 'Submit any two documents and receive a structured diff. The engine extracts changed clauses and classifies them by severity.',
                },
                {
                  icon: <Zap className="w-7 h-7 text-gold mb-4" strokeWidth={1} />,
                  title: 'AI-Powered Analysis',
                  body: 'Each comparison runs through Google Gemini for plain-English clause summaries and severity ratings. Falls back to local diff without a key.',
                },
                {
                  icon: <Shield className="w-7 h-7 text-gold mb-4" strokeWidth={1} />,
                  title: 'Auth & Data Isolation',
                  body: 'JWT-based authentication. Every database query filters by user ID — data is fully isolated between accounts.',
                },
              ].map((card, i) => (
                <div key={i} className="glass-panel p-7 rounded-lg">
                  {card.icon}
                  <h3
                    className="font-serif mb-2 text-on-surface tracking-wide"
                    style={{ fontSize: 'clamp(18px, 1.4vw, 22px)' }}
                  >
                    {card.title}
                  </h3>
                  <p className="text-body-md text-on-surface-variant leading-relaxed opacity-70">
                    {card.body}
                  </p>
                </div>
              ))}
            </div>

            <div className="glass-panel p-7 md:p-9 mb-10 rounded-lg flex flex-col sm:flex-row items-start gap-5">
              <Server className="w-6 h-6 text-gold mt-1 shrink-0" strokeWidth={1} />
              <div>
                <h3
                  className="font-serif text-on-surface mb-2"
                  style={{ fontSize: 'clamp(18px, 1.4vw, 22px)' }}
                >
                  Self-Hosted by Design
                </h3>
                <p className="text-body-md text-on-surface-variant leading-relaxed opacity-70 mb-3">
                  You deploy the server on your own infrastructure. Documents, analyses, and AI calls
                  stay within your network. Your API key never reaches the client.
                </p>
                <div className="flex flex-wrap gap-4 md:gap-6 text-xs font-mono opacity-60 text-on-surface-variant">
                  <span className="flex items-center gap-2"><Lock className="w-3 h-3" /> Your data</span>
                  <span className="flex items-center gap-2"><Server className="w-3 h-3" /> Your server</span>
                  <span className="flex items-center gap-2"><Users className="w-3 h-3" /> Your users</span>
                </div>
              </div>
            </div>

            {proMode ? (
              <Link
                to="/documentation"
                className="inline-flex items-center gap-3 font-label-caps text-label-caps text-gold uppercase tracking-[0.2em] border-b border-gold pb-1 hover:text-on-surface hover:border-on-surface transition-colors"
              >
                Read Full Documentation <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-3 font-label-caps text-label-caps opacity-50 uppercase tracking-[0.2em] text-on-surface-variant">
                Full API Reference — Private
              </span>
            )}
          </div>
        </motion.div>
      </section>

      {/* ───────────────────────── CONTACT ───────────────────────── */}
      <section
        id="contact"
        className="relative z-10 py-20 md:py-32 lg:py-40 px-6 md:px-16 max-w-4xl mx-auto w-full scroll-mt-40"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center mb-14">
            <span className="font-label-caps text-label-caps text-gold/70 uppercase tracking-[0.3em] mb-6 block">
              Contact
            </span>
            <h2
              className="font-serif text-on-surface mb-6"
              style={{ fontSize: 'clamp(36px, 5vw, 56px)' }}
            >
              Get in Touch
            </h2>
            <p className="text-body-lg text-on-surface-variant max-w-xl mx-auto">
              Ready to secure your legal workflows? Send us a message for enterprise plans, security
              inquiries, or a free trial.
            </p>
          </div>
          <form className="glass-panel p-8 md:p-12 rounded-lg space-y-8 max-w-2xl mx-auto" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block font-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase opacity-80">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full bg-transparent border-b border-outline/50 px-0 py-3 focus:outline-none focus:border-gold transition-colors placeholder:text-on-surface-variant/40 text-on-surface"
                  placeholder="Jane Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block font-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase opacity-80">
                  Work Email
                </label>
                <input
                  type="email"
                  className="w-full bg-transparent border-b border-outline/50 px-0 py-3 focus:outline-none focus:border-gold transition-colors placeholder:text-on-surface-variant/40 text-on-surface"
                  placeholder="jane@company.com"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block font-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase opacity-80">
                Message
              </label>
              <textarea
                rows={4}
                className="w-full bg-transparent border-b border-outline/50 px-0 py-3 focus:outline-none focus:border-gold transition-colors resize-none placeholder:text-on-surface-variant/40 text-on-surface"
                placeholder="How can we help?"
                required
              />
            </div>
            <div className="pt-4 text-center">
              <button
                type="submit"
                className="inline-flex items-center font-label-caps text-label-caps bg-gold text-on-gold px-10 py-4 rounded uppercase tracking-widest hover:bg-gold-fixed transition-colors duration-300 cursor-pointer"
              >
                Send Message
              </button>
            </div>
          </form>
        </motion.div>
      </section>

      {/* ───────────────────────── FOOTER ───────────────────────── */}
      <footer className="pt-section-gap pb-10 border-t border-outline-variant/40 bg-surface-container-lowest relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter max-w-container-max mx-auto px-margin-desktop" style={{ paddingLeft: '4vw', paddingRight: '4vw' }}>
          <div className="col-span-1 md:col-span-2">
            <div className="font-serif text-3xl font-bold text-on-surface mb-4">ContractDiff</div>
            <p className="text-body-md text-on-surface-variant max-w-md opacity-70 leading-relaxed">
              © {new Date().getFullYear()} ContractDiff International. Intelligent contract analysis for the
              non-lawyer world.
            </p>
          </div>
          <div className="col-span-1 md:col-span-2 flex flex-col md:flex-row gap-8 justify-end">
            <div className="flex flex-col space-y-3">
              <h4 className="font-label-caps text-label-caps text-gold/60 uppercase tracking-widest mb-2">
                Legal
              </h4>
              <Link to="/privacy" className="text-body-md text-on-surface-variant hover:text-gold transition-colors duration-300 opacity-80 hover:opacity-100">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-body-md text-on-surface-variant hover:text-gold transition-colors duration-300 opacity-80 hover:opacity-100">
                Terms of Service
              </Link>
            </div>
            <div className="flex flex-col space-y-3">
              <h4 className="font-label-caps text-label-caps text-gold/60 uppercase tracking-widest mb-2">
                Contact
              </h4>
              <a href="mailto:hello@contractdiff.com" className="text-body-md text-on-surface-variant hover:text-gold transition-colors duration-300 opacity-80 hover:opacity-100">
                hello@contractdiff.com
              </a>
              <a href="#" className="text-body-md text-on-surface-variant hover:text-gold transition-colors duration-300 opacity-80 hover:opacity-100">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
