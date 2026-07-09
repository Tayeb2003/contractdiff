import Hero from '../components/Hero';
import HorizontalScroll from '../components/HorizontalScroll';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Check, FileText, ShieldAlert, Zap, Users, History as HistoryIcon, Download, LayoutTemplate, Scan, GitCompare, BadgeCheck, Server, Lock, Scale, Eye, Brain, Shield, Upload as UploadIcon, MessageSquareText } from 'lucide-react';

interface HomePageProps {
  proMode: boolean;
}

const features = [
  { icon: <FileText className="w-8 h-8" strokeWidth={1} />, title: "Smart Diff", description: "Instantly see what changed between two contracts without reading page by page. Every addition, deletion, and modification is highlighted at the clause level." },
  { icon: <Zap className="w-8 h-8" strokeWidth={1} />, title: "Plain English Translation", description: "Complex legal jargon translated into plain language, so you know exactly what you are signing. No more guessing what terms really mean." },
  { icon: <ShieldAlert className="w-8 h-8" strokeWidth={1} />, title: "Risk Scoring", description: "Every change is automatically scored by severity — minor, moderate, or major — so you can prioritise what needs a lawyer's eyes." },
  { icon: <BadgeCheck className="w-8 h-8" strokeWidth={1} />, title: "Party Favour Analysis", description: "See which party each clause favours at a glance. Spot one-sided termination clauses and unbalanced liability caps." },
  { icon: <GitCompare className="w-8 h-8" strokeWidth={1} />, title: "Multi-Format Support", description: "Upload PDF, DOCX, or plain text files. Paste raw contract text directly. ContractDiff normalises everything into a unified comparison view." },
  { icon: <Scan className="w-8 h-8" strokeWidth={1} />, title: "Clause-Level Breakdown", description: "Each changed clause is extracted, compared side-by-side, and explained in isolation so you can evaluate changes one by one." },
  { icon: <HistoryIcon className="w-8 h-8" strokeWidth={1} />, title: "Full Analysis History", description: "Every comparison is saved automatically. Revisit past analyses and track how contracts evolved between negotiations." },
  { icon: <Download className="w-8 h-8" strokeWidth={1} />, title: "Export & Share", description: "Export analysis reports to PDF or DOCX. Share results with your team, legal counsel, or stakeholders via a secure link." },
  { icon: <LayoutTemplate className="w-8 h-8" strokeWidth={1} />, title: "Custom Templates", description: "Save your own comparison templates for recurring contract types — NDAs, MSAs, SOWs — and run consistent reviews every time." },
];

const plans = [
  { name: "Starter", price: "Free", description: "Perfect for individuals comparing standard agreements.", features: ["Up to 5 contracts per month", "Basic smart diff", "Plain English translation", "Email support"] },
  { name: "Professional", price: "$29", period: "/mo", description: "For freelancers and small businesses dealing with clients.", features: ["Unlimited contract comparisons", "Advanced risk detection", "Export to PDF/Word", "Priority support", "Save custom templates"], highlighted: true },
  { name: "Enterprise", price: "$99", period: "/mo", description: "For teams and organisations with advanced needs.", features: ["Everything in Professional", "Dedicated account manager", "Custom AI model training", "SSO / SAML integration", "Audit logs & compliance", "Custom integrations", "99.9% SLA guarantee", "Priority API access", "Team collaboration tools"], comingSoon: true },
];

function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const dur = 1500;
        const step = Date.now();
        function tick() {
          const p = Math.min((Date.now() - step) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          start = Math.round(eased * to);
          setCount(start);
          if (p < 1) requestAnimationFrame(tick);
        }
        tick();
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [to]);
  return <div ref={ref}>{count}{suffix}</div>;
}

export default function HomePage({ proMode }: HomePageProps) {
  const location = useLocation();

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
    <div>
      <Hero />

      {/* Proposition */}
      <section className="relative z-10 py-40 px-6 md:px-12 max-w-[90rem] mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center mb-32"
        >
          <span className="text-xs uppercase tracking-[0.3em] opacity-50 mb-8 block">The Proposition</span>
          <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl leading-[1.1] mb-10 text-metallic">
            Every contract tells a story.<br />
            <span className="italic opacity-80">We teach you to read it.</span>
          </h2>
          <p className="text-lg md:text-2xl font-normal text-body leading-relaxed opacity-80 max-w-3xl mx-auto">
            ContractDiff is an intelligent contract analysis platform built for the non-lawyer world.
            It ingests two versions of a document, runs a forensic diff across every clause, and returns
            a plain-English breakdown of what changed, who it favors, and how seriously you should care.
            <span className="text-mint"> Understanding at a glance.</span>
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-24 max-w-6xl mx-auto">
          {[
            { icon: <Scale className="w-7 h-7" strokeWidth={1} />, title: "Clarity from Complexity", body: "Contracts are built in language designed to protect, not to inform. We strip away the legalese and surface what changed, what matters, and what demands your attention." },
            { icon: <Eye className="w-7 h-7" strokeWidth={1} />, title: "Microscopic Precision", body: "Our engine parses every clause, every comma, every liability shift with surgical accuracy. Where the naked eye misses a buried amendment, ContractDiff illuminates it." },
            { icon: <Brain className="w-7 h-7" strokeWidth={1} />, title: "Augmented Judgement", body: "We don't just highlight differences — we interpret them. Each change is scored by severity, tagged by risk, and translated into plain English." },
            { icon: <Shield className="w-7 h-7" strokeWidth={1} />, title: "Radical Autonomy", body: "Legal expertise should not be a gatekeeper — it should be a utility. No law degree required. No fine print left unread." },
          ].map((pillar, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: i * 0.15 }}
              className="border-t border-mint/15 pt-10"
            >
              <div className="flex items-start gap-6">
                <div className="text-mint mt-1 shrink-0">{pillar.icon}</div>
                <div>
                  <h3 className="font-serif text-2xl md:text-3xl mb-4 tracking-tight text-metallic">{pillar.title}</h3>
                  <p className="text-base md:text-lg font-normal text-body leading-relaxed opacity-70">{pillar.body}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 py-32 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <span className="text-xs uppercase tracking-[0.3em] opacity-50 mb-6 block">By the Numbers</span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-16 gap-x-8 mt-12">
            {[
              { to: 500, suffix: '+', label: 'Contracts Analysed' },
              { to: 99, suffix: '%', label: 'Accuracy Rate' },
              { to: 3, suffix: 's', label: 'Avg. Analysis Time' },
              { to: 100, suffix: '%', label: 'Data Privacy' },
            ].map((stat, i) => (
              <div key={i} className="relative px-4">
                {i > 0 && <span className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-px h-16 bg-mint/15" />}
                <div className="text-6xl md:text-7xl lg:text-8xl font-serif text-metallic leading-none">
                  <Counter to={stat.to} suffix={stat.suffix} />
                </div>
                <p className="text-sm font-normal text-body opacity-60 mt-4 uppercase tracking-[0.15em]">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Reviews */}
      <section className="relative z-10 py-40 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center mb-20">
            <span className="text-xs uppercase tracking-[0.3em] opacity-50 mb-6 block">Testimonials</span>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-7xl mb-6 uppercase tracking-normal text-metallic">Trusted by Negotiators</h2>
            <p className="text-lg md:text-xl opacity-80 font-normal text-body max-w-2xl mx-auto">From freelancers to legal teams — hear from people who actually use ContractDiff.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                name: "Sarah Chen",
                role: "Freelance Designer",
                company: "Studio Chen",
                avatar: "SC",
                review: "I review NDAs and service agreements a few times a month. ContractDiff caught a liability clause buried on page 14 that would have left me personally exposed. The plain-English breakdown paid for itself in one use.",
                rating: 5,
              },
              {
                name: "Marcus Okonkwo",
                role: "Product Manager",
                company: "Riviera Tech",
                avatar: "MO",
                review: "We compared a 47-page vendor agreement in under 4 seconds. The severity heatmap let our legal team prioritise 3 critical changes out of 40+ modifications. We closed the deal 2 days faster than usual.",
                rating: 5,
              },
              {
                name: "Elena Vasquez",
                role: "Startup Founder",
                company: "Nexa Health",
                avatar: "EV",
                review: "My co-founder and I were about to sign a lease that a friend's lawyer had 'reviewed'. ContractDiff flagged a renewal clause that auto-escalated rent by 18%. We walked away and found better terms. Indispensable.",
                rating: 5,
              },
              {
                name: "James Corrigan",
                role: "Solicitor",
                company: "Corrigan & Co.",
                avatar: "JC",
                review: "I was sceptical — I've been practising for 18 years. I ran a client's revision against my own markup and ContractDiff matched every change I'd caught, plus two I'd missed. I recommended it to my entire network.",
                rating: 5,
              },
              {
                name: "Priya Mehta",
                role: "Operations Lead",
                company: "Dynamo Logistics",
                avatar: "PM",
                review: "We process around 30 contracts a month with suppliers. ContractDiff cut our review time from hours to minutes. The party-favour analysis is especially useful for spotting one-sided termination clauses.",
                rating: 5,
              },
              {
                name: "Tom Bradley",
                role: "Independent Contractor",
                company: "Bradley Consulting",
                avatar: "TB",
                review: "Independent means I don't have a legal team. I used to cross my fingers and sign. Now I paste two versions, wait 5 seconds, and know exactly what changed. Massive peace of mind for $0.",
                rating: 5,
              },
            ].map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="border border-mint/10 p-8 md:p-10 flex flex-col h-full"
              >
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: review.rating }).map((_, s) => (
                    <svg key={s} className="w-5 h-5 text-mint" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="font-normal text-body opacity-80 leading-relaxed text-base flex-grow mb-8">{"\u201C"}{review.review}{"\u201D"}</p>
                <div className="flex items-center gap-4 pt-6 border-t border-mint/10">
                  <div className="w-12 h-12 rounded-full bg-mint/20 flex items-center justify-center text-sm font-medium text-mint shrink-0">
                    {review.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-mint">{review.name}</p>
                    <p className="text-xs font-normal text-body opacity-60">{review.role}, {review.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* How It Works — Horizontal Scroll */}
      <HorizontalScroll panelCount={4} className="gap-0">
        {[
          { icon: <UploadIcon className="w-12 h-12" strokeWidth={1} />, step: "01", title: "Upload", body: "Upload two versions of your contract — PDF, DOCX, or paste text directly. No formatting required." },
          { icon: <GitCompare className="w-12 h-12" strokeWidth={1} />, step: "02", title: "Compare", body: "Our engine runs a clause-level diff across both documents, extracting every change with surgical precision." },
          { icon: <MessageSquareText className="w-12 h-12" strokeWidth={1} />, step: "03", title: "Analyse", body: "AI translates each change into plain English, scores severity, and flags which party each clause favours." },
          { icon: <Download className="w-12 h-12" strokeWidth={1} />, step: "04", title: "Act", body: "Export your analysis, share with your team, negotiate from a position of knowledge — not guesswork." },
        ].map((panel, i) => (
          <div key={i} className="h-full w-full flex items-center justify-center px-8 md:px-20 border-r border-mint/10">
            <div className="max-w-lg">
              <div className="flex items-center gap-4 mb-8">
                <span className="text-7xl md:text-9xl font-serif font-bold text-metallic leading-none opacity-80">{panel.step}</span>
                <div className="text-mint">{panel.icon}</div>
              </div>
              <h3 className="font-serif text-4xl md:text-6xl mb-6 text-metallic">{panel.title}</h3>
              <div className="w-16 h-px bg-mint/40 mb-6" />
              <p className="text-lg md:text-xl font-normal text-body opacity-70 leading-relaxed">{panel.body}</p>
            </div>
          </div>
        ))}
      </HorizontalScroll>

      {/* Features */}
      <section id="features" className="relative z-10 py-40 px-6 md:px-12 max-w-[90rem] mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-20">
            <span className="text-xs uppercase tracking-[0.3em] opacity-50 mb-6 block">Features</span>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-7xl mb-6 uppercase tracking-normal text-metallic">Understand Everything</h2>
            <p className="text-lg md:text-xl opacity-80 font-normal text-body max-w-2xl mx-auto">Empowers you to negotiate with confidence by highlighting the differences that actually matter.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-24">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="flex flex-col items-center md:items-start text-center md:text-left border-t border-mint/20 pt-8"
              >
                <div className="mb-8 text-mint">{feature.icon}</div>
                <h3 className="text-2xl font-serif mb-4 uppercase tracking-wide text-metallic">{feature.title}</h3>
                <p className="font-normal text-body opacity-80 leading-relaxed text-lg">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 py-40 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center mb-20">
            <span className="text-xs uppercase tracking-[0.3em] opacity-50 mb-6 block">Pricing</span>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-7xl mb-6 uppercase tracking-normal text-metallic">Simple Pricing</h2>
            <p className="text-lg md:text-xl opacity-80 font-normal text-body max-w-2xl mx-auto">Choose the plan that fits your needs. No hidden fees or complex legal jargon here either.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 max-w-7xl mx-auto">
            {plans.map((plan, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: idx * 0.2 }}
                className={`p-10 md:p-14 border flex flex-col ${plan.highlighted ? 'border-mint bg-mint/15' : plan.comingSoon ? 'border-mint/50 bg-[#0a2e28]/30 relative' : 'border-mint/30 bg-[#0a2e28]/40'}`}
              >
                <h3 className="text-2xl font-medium tracking-widest uppercase mb-4">{plan.name}</h3>
                <div className="flex items-baseline mb-6">
                  <span className="text-5xl md:text-6xl font-serif">{plan.price}</span>
                  {plan.period && <span className="text-xl ml-2 opacity-60 font-normal text-body">{plan.period}</span>}
                </div>
                <p className="font-normal text-body opacity-80 mb-10">{plan.description}</p>
                <div className="space-y-4 flex-grow mb-12">
                  {plan.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-4">
                      <Check className="w-5 h-5 text-mint mt-0.5 shrink-0" strokeWidth={1.5} />
                      <span className="font-normal text-body opacity-90">{feature}</span>
                    </div>
                  ))}
                </div>
                <a href="#contact" className={`text-center py-4 text-sm font-medium uppercase tracking-[0.2em] transition-all duration-300 w-full ${plan.highlighted ? 'bg-mint text-black hover:bg-white' : 'border border-mint text-mint hover:bg-mint hover:text-black'} ${plan.comingSoon ? 'hidden' : ''}`}>
                  Get Started
                </a>
                {plan.comingSoon && <div className="text-center py-4 text-sm font-medium uppercase tracking-[0.2em] w-full border border-mint/30 text-body/50 cursor-not-allowed">Coming Soon</div>}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Docs / API */}
      <section id="docs" className="relative z-10 py-40 px-6 md:px-12 max-w-[90rem] mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <div className="max-w-4xl">
            <span className="text-xs uppercase tracking-[0.3em] opacity-50 mb-6 block">API</span>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-7xl mb-8 uppercase tracking-normal text-metallic">Developer API</h2>
            <p className="text-lg md:text-xl opacity-80 font-normal text-body mb-12 leading-relaxed max-w-2xl">
              ContractDiff exposes a comprehensive REST API for uploading contracts, comparing versions, and retrieving AI-powered analysis results. Every endpoint is scoped per user and secured with JWT.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              {[
                { icon: <FileText className="w-8 h-8 text-mint mb-5" strokeWidth={1} />, title: "Document Management", body: "Upload PDF, DOCX, or TXT files. Paste raw contract text. Every document is stored and scoped to its owner." },
                { icon: <GitCompare className="w-8 h-8 text-mint mb-5" strokeWidth={1} />, title: "Contract Comparison", body: "Submit any two documents and receive a structured diff. The engine extracts changed clauses and classifies them by severity." },
                { icon: <Zap className="w-8 h-8 text-mint mb-5" strokeWidth={1} />, title: "AI-Powered Analysis", body: "Each comparison runs through Google Gemini for plain-English clause summaries and smart severity ratings. Falls back to local diff without a key." },
                { icon: <Shield className="w-8 h-8 text-mint mb-5" strokeWidth={1} />, title: "Auth & Data Isolation", body: "JWT-based authentication. Every database query filters by user ID — data is fully isolated between accounts." },
              ].map((card, i) => (
                <div key={i} className="border border-mint/10 p-6 md:p-8">
                  {card.icon}
                  <h3 className="text-lg font-serif mb-2 uppercase tracking-wide text-metallic">{card.title}</h3>
                  <p className="font-normal text-body opacity-70 text-sm leading-relaxed">{card.body}</p>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-6 p-8 border border-mint/10 bg-mint/5 mb-12">
              <Server className="w-6 h-6 text-mint mt-1 shrink-0" strokeWidth={1} />
              <div>
                <h3 className="text-lg font-serif mb-2 text-metallic">Self-Hosted by Design</h3>
                <p className="font-normal text-body opacity-70 text-sm leading-relaxed mb-3">You deploy the server on your own infrastructure. Documents, analyses, and AI calls stay within your network. Your API key never reaches the client.</p>
                <div className="flex flex-wrap gap-6 text-xs font-mono opacity-60">
                  <span className="flex items-center gap-2"><Lock className="w-3 h-3" /> Your data</span>
                  <span className="flex items-center gap-2"><Server className="w-3 h-3" /> Your server</span>
                  <span className="flex items-center gap-2"><Users className="w-3 h-3" /> Your users</span>
                </div>
              </div>
            </div>
            {proMode ? (
              <Link to="/documentation" className="inline-flex items-center gap-4 text-sm font-medium uppercase tracking-[0.2em] border-b border-mint pb-1 hover:text-white hover:border-white transition-colors">
                Read Full Documentation <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-4 text-sm font-medium uppercase tracking-[0.2em] opacity-50">Full API Reference — Private</span>
            )}
          </div>
        </motion.div>
      </section>

      {/* Contact */}
      <section id="contact" className="relative z-10 py-40 px-6 md:px-12 max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-[0.3em] opacity-50 mb-6 block">Contact</span>
            <h2 className="font-serif text-4xl md:text-5xl mb-6 text-metallic">Get in Touch</h2>
            <p className="text-lg opacity-80 font-normal text-body max-w-xl mx-auto">Ready to secure your legal workflows? Send us a message for enterprise plans, security inquiries, or a free trial.</p>
          </div>
          <form className="space-y-8 max-w-2xl mx-auto" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-sm font-medium tracking-wide uppercase opacity-80">Full Name</label>
                <input type="text" className="w-full bg-transparent border-b border-mint/30 px-0 py-3 focus:outline-none focus:border-mint transition-colors placeholder:text-mint/30" placeholder="Jane Doe" required />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium tracking-wide uppercase opacity-80">Work Email</label>
                <input type="email" className="w-full bg-transparent border-b border-mint/30 px-0 py-3 focus:outline-none focus:border-mint transition-colors placeholder:text-mint/30" placeholder="jane@company.com" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium tracking-wide uppercase opacity-80">Message</label>
              <textarea rows={4} className="w-full bg-transparent border-b border-mint/30 px-0 py-3 focus:outline-none focus:border-mint transition-colors resize-none placeholder:text-mint/30" placeholder="How can we help?" required />
            </div>
            <div className="pt-4 text-center">
              <button type="submit" className="px-10 py-4 bg-mint text-black font-medium uppercase tracking-[0.2em] text-sm hover:bg-white transition-colors duration-300 cursor-pointer">Send Message</button>
            </div>
          </form>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="pt-20 pb-10 border-t border-mint/10 bg-[#0a2e28] relative z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <div className="font-serif text-3xl font-medium tracking-wide text-metallic mb-6">ContractDiff</div>
              <p className="text-body font-normal opacity-70 max-w-sm leading-relaxed">
                Intelligent contract analysis for the non-lawyer world. Understand every clause, every change, every risk — at a glance.
              </p>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] opacity-50 mb-6">Navigate</h4>
              <ul className="space-y-3 text-sm font-normal text-body opacity-80">
                <li><a href="#features" className="hover:text-mint transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-mint transition-colors">Pricing</a></li>
                <li><a href="#docs" className="hover:text-mint transition-colors">Developer API</a></li>
                <li><a href="#contact" className="hover:text-mint transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] opacity-50 mb-6">Connect</h4>
              <ul className="space-y-3 text-sm font-normal text-body opacity-80">
                <li><a href="#" className="hover:text-mint transition-colors">Twitter / X</a></li>
                <li><a href="#" className="hover:text-mint transition-colors">LinkedIn</a></li>
                <li><a href="#" className="hover:text-mint transition-colors">GitHub</a></li>
                <li><a href="mailto:hello@contractdiff.com" className="hover:text-mint transition-colors">hello@contractdiff.com</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-mint/10">
            <p className="text-sm opacity-50 font-normal text-body">&copy; {new Date().getFullYear()} ContractDiff. All rights reserved.</p>
            <p className="text-xs opacity-40 font-normal text-body tracking-[0.2em] uppercase">Designed for Clarity</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
