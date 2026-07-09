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
      <section className="min-h-screen pt-32 pb-20 px-6 md:px-12 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-mint animate-spin mb-6" strokeWidth={1} />
        <h2 className="font-serif text-2xl mb-3 text-metallic">Analyzing Your Contracts</h2>
        <p className="text-sm opacity-70 font-normal text-body">Running diff analysis and AI interpretation...</p>
        <div className="mt-12 w-full max-w-md">
          <div className="h-1 bg-mint/10 rounded-full overflow-hidden">
            <div className="h-full bg-mint rounded-full animate-pulse w-2/3" />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="min-h-screen pt-32 pb-20 px-6 md:px-12 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-6" strokeWidth={1} />
        <h2 className="font-serif text-2xl mb-3 text-metallic">Analysis Failed</h2>
        <p className="opacity-70 mb-8">{error}</p>
        <Link to="/upload" className="text-sm uppercase tracking-[0.2em] border-b border-mint pb-1">
          Try Again
        </Link>
      </section>
    );
  }

  if (analysis?.status === 'processing') {
    return (
      <section className="min-h-screen pt-32 pb-20 px-6 md:px-12 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-mint animate-spin mb-6" strokeWidth={1} />
        <h2 className="font-serif text-2xl mb-3 text-metallic">Still Analyzing...</h2>
        <p className="text-sm opacity-70 font-normal text-body">This may take 10-30 seconds for complex contracts.</p>
      </section>
    );
  }

  const severityColor = (s: string) => {
    switch (s) {
      case 'major': return 'text-red-400 border-red-400/30';
      case 'moderate': return 'text-yellow-400 border-yellow-400/30';
      default: return 'text-mint border-mint/20';
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

  return (
    <section className="min-h-screen pt-32 pb-20 px-6 md:px-12 max-w-6xl mx-auto w-full">
      <Link to="/history" className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] opacity-70 hover:opacity-100 mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to History
      </Link>

      <div className="mb-12">
        <h1 className="font-serif text-3xl md:text-4xl mb-4 text-metallic">Contract Analysis</h1>
        <div className="flex flex-wrap gap-4 text-sm opacity-70 font-normal text-body">
          <span>{analysis?.docAName} vs {analysis?.docBName}</span>
          <span>&middot;</span>
          <span>{clauses.length} change{clauses.length !== 1 ? 's' : ''} detected</span>
        </div>
      </div>

      {analysis?.summary && (
        <div className="mb-12 p-6 border border-mint/20 bg-mint/5">
          <h2 className="text-sm uppercase tracking-[0.2em] font-medium mb-4">Executive Summary</h2>
          <p className="font-normal text-body leading-relaxed whitespace-pre-line">{analysis.summary}</p>
        </div>
      )}

      <div className="space-y-8">
        {clauses.map((clause) => (
          <div key={clause.id} className="border border-mint/10 overflow-hidden">
            <div className={`p-4 border-b flex items-center justify-between flex-wrap gap-4 ${severityColor(clause.severity)}`}>
              <div className="flex items-center gap-3">
                {clause.severity === 'major' && <AlertTriangle className="w-5 h-5 text-red-400" strokeWidth={1.5} />}
                {clause.severity === 'moderate' && <Info className="w-5 h-5 text-yellow-400" strokeWidth={1.5} />}
                {clause.severity === 'minor' && <Minus className="w-5 h-5 text-mint" strokeWidth={1.5} />}
                <span className="text-xs uppercase tracking-[0.2em] font-medium">{clause.severity} severity</span>
              </div>
              <span className={`text-xs uppercase tracking-[0.2em] px-3 py-1 border ${
                clause.favors === 'neutral' ? 'border-mint/20 text-mint/60' :
                clause.favors === 'ambiguous' ? 'border-yellow-400/30 text-yellow-400' :
                'border-mint/30 text-mint'
              }`}>
                {favorsLabel(clause.favors)}
              </span>
            </div>

            <div className="p-4 md:p-6">
              <div className="mb-4">
                <p className="text-sm font-normal text-body leading-relaxed text-mint/90">{clause.plain_english_summary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-red-400/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-red-400/70 mb-3">Original</p>
                  <pre className="text-sm font-normal text-body leading-relaxed whitespace-pre-wrap font-mono text-xs opacity-80 max-h-40 overflow-y-auto">{clause.clause_text_before}</pre>
                </div>
                <div className="border border-mint/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-mint/70 mb-3">New Version</p>
                  <pre className="text-sm font-normal text-body leading-relaxed whitespace-pre-wrap font-mono text-xs opacity-80 max-h-40 overflow-y-auto">{clause.clause_text_after}</pre>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {clauses.length === 0 && (
        <div className="text-center py-20">
          <p className="opacity-50 font-normal text-body">No material differences were detected between these documents.</p>
        </div>
      )}

      <div className="mt-12 p-4 border border-mint/10 text-xs text-mint/60 text-center">
        <strong className="text-mint/80">Not legal advice.</strong> ContractDiff is an AI-assisted analysis tool. Always consult a qualified attorney for legal decisions. This analysis may contain errors or omissions.
      </div>
    </section>
  );
}
