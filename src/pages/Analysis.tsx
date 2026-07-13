import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Info, Minus, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

interface Clause {
  id: string;
  clause_text_before: string;
  clause_text_after: string;
  plain_english_summary: string;
  favors: string;
  severity: string;
}

export default function AnalysisPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [clauses, setClauses] = useState<Clause[]>([]);

  useEffect(() => {
    if (!id) return;
    const poll = setInterval(async () => {
      try {
        const data = await api.analyses.get(id);
        setAnalysis(data.analysis);
        setClauses(data.clauses);
        if (data.analysis.status === 'completed' || data.analysis.status === 'failed') {
          clearInterval(poll);
        }
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        clearInterval(poll);
        setLoading(false);
      }
    }, 2000);
    return () => clearInterval(poll);
  }, [id]);

  if (loading) {
    return (
      <section className="min-h-screen pt-[112px] pb-20 px-6 md:px-16 flex flex-col items-center justify-center">
        <div className="glass-panel p-12 rounded-xl text-center max-w-md mx-auto">
          <span className="material-symbols-outlined text-gold text-4xl mb-6 animate-gold-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>settings_input_svideo</span>
          <h2 className="font-serif text-2xl mb-3 text-on-surface">Analyzing Your Contracts</h2>
          <p className="text-sm opacity-70 font-normal text-on-surface-variant mb-8">
            Running diff analysis and AI interpretation...
          </p>
          <div className="w-full max-w-md mx-auto">
            <div className="h-1 bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-gold rounded-full animate-gold-pulse w-2/3" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="min-h-screen pt-[112px] pb-20 px-6 md:px-16 text-center">
        <div className="glass-panel p-12 rounded-xl max-w-md mx-auto">
          <span className="material-symbols-outlined text-red-400 text-4xl mb-6">error</span>
          <h2 className="font-serif text-2xl mb-3 text-on-surface">Analysis Failed</h2>
          <p className="opacity-70 mb-8">{error}</p>
          <Link to="/upload" className="font-label-caps text-label-caps text-gold hover:underline">
            Try Again
          </Link>
        </div>
      </section>
    );
  }

  if (analysis?.status === 'processing') {
    return (
      <section className="min-h-screen pt-[112px] pb-20 px-6 md:px-16 flex flex-col items-center justify-center">
        <div className="glass-panel p-12 rounded-xl text-center max-w-md mx-auto">
          <span className="material-symbols-outlined text-gold text-4xl mb-6 animate-gold-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>settings_input_svideo</span>
          <h2 className="font-serif text-2xl mb-3 text-on-surface">Still Analyzing...</h2>
          <p className="text-sm opacity-70 font-normal text-on-surface-variant">This may take 10-30 seconds for complex contracts.</p>
        </div>
      </section>
    );
  }

  const severityStyle = (s: string) => {
    switch (s) {
      case 'major':
        return 'text-red-400 border-red-400/30 bg-red-400/10';
      case 'moderate':
        return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
      default:
        return 'text-gold border-gold/30 bg-gold/10';
    }
  };

  const favorsLabel = (f: string) => {
    switch (f) {
      case 'party_a': return 'Favors Party A';
      case 'party_b': return 'Favors Party B';
      case 'ambiguous': return 'Ambiguous';
      default: return 'Neutral';
    }
  };

  const favorsStyle = (f: string) => {
    switch (f) {
      case 'neutral': return 'border-secondary/30 text-secondary';
      case 'ambiguous': return 'border-yellow-400/30 text-yellow-400';
      default: return 'border-gold/40 text-gold';
    }
  };

  return (
    <section className="min-h-screen pt-[112px] pb-20 px-6 md:px-16 max-w-[1280px] mx-auto w-full">
      <Link
        to="/history"
        className="inline-flex items-center gap-2 font-label-caps text-label-caps opacity-70 hover:opacity-100 mb-8 transition-opacity cursor-pointer"
      >
        <span className="material-symbols-outlined">arrow_back</span> Back to History
      </Link>

      <div className="mb-12">
        <h1 className="font-serif text-on-surface mb-4" style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>
          Contract Analysis
        </h1>
        <div className="flex flex-wrap gap-4 text-sm opacity-70 font-normal text-on-surface-variant">
          <span>{analysis?.docAName} <span className="text-gold">vs</span> {analysis?.docBName}</span>
          <span>&middot;</span>
          <span>{clauses.length} change{clauses.length !== 1 ? 's' : ''} detected</span>
        </div>
      </div>

      {analysis?.summary && (
        <div className="mb-12 glass-panel p-8 rounded-xl">
          <h2 className="font-label-caps text-label-caps text-gold/70 uppercase tracking-[0.2em] mb-4">
            Executive Summary
          </h2>
          <p className="font-normal text-on-surface-variant leading-relaxed whitespace-pre-line">
            {analysis.summary}
          </p>
        </div>
      )}

      <div className="space-y-8">
        {clauses.map((clause) => (
          <div key={clause.id} className="glass-panel rounded-xl overflow-hidden">
            <div className={`p-5 border-b flex items-center justify-between flex-wrap gap-4 ${severityStyle(clause.severity)}`}>
              <div className="flex items-center gap-3">
                {clause.severity === 'major' && <AlertTriangle className="w-5 h-5 text-red-400" strokeWidth={1.5} />}
                {clause.severity === 'moderate' && <Info className="w-5 h-5 text-yellow-400" strokeWidth={1.5} />}
                {clause.severity === 'minor' && <Minus className="w-5 h-5 text-gold" strokeWidth={1.5} />}
                <span className="font-label-caps text-label-caps text-on-surface">{clause.severity} severity</span>
              </div>
              <span className={`font-label-caps text-label-caps px-3 py-1 border ${favorsStyle(clause.favors)}`}>
                {favorsLabel(clause.favors)}
              </span>
            </div>

            <div className="p-5 md:p-8">
              <div className="mb-5">
                <p className="text-on-surface-variant leading-relaxed text-gold/90">{clause.plain_english_summary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-red-400/20 glass-panel p-4 rounded-lg">
                  <p className="font-label-caps text-label-caps text-red-400/70 mb-3">Original</p>
                  <pre className="text-body-md text-on-surface-variant leading-relaxed whitespace-pre-wrap font-mono text-xs opacity-80 max-h-40 overflow-y-auto">{clause.clause_text_before}</pre>
                </div>
                <div className="border border-gold/20 glass-panel p-4 rounded-lg">
                  <p className="font-label-caps text-label-caps text-gold/70 mb-3">Revised</p>
                  <pre className="text-body-md text-on-surface-variant leading-relaxed whitespace-pre-wrap font-mono text-xs opacity-80 max-h-40 overflow-y-auto">{clause.clause_text_after}</pre>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {clauses.length === 0 && (
        <div className="text-center py-20">
          <p className="opacity-50 font-normal text-on-surface-variant">No material differences were detected between these documents.</p>
        </div>
      )}

      <div className="mt-12 glass-panel p-4 text-xs text-on-surface-variant text-center leading-relaxed">
        <strong className="text-gold/80">Not legal advice.</strong> ContractDiff is an AI-assisted
        analysis tool. Always consult a qualified attorney for legal decisions. This analysis may
        contain errors or omissions.
      </div>
    </section>
  );
}