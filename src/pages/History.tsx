import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, FileText, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';

interface Analysis {
  id: string;
  status: string;
  summary: string;
  created_at: string;
  doc_a_name: string;
  doc_b_name: string;
}

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.analyses.list()
      .then((data) => setAnalyses(data.analyses))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="min-h-screen pt-[112px] pb-20 px-6 md:px-16 flex items-center justify-center">
        <div className="glass-panel p-12 rounded-xl text-center max-w-md mx-auto">
          <span className="material-symbols-outlined text-gold text-4xl mb-6 animate-gold-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
            settings_input_svideo
          </span>
          <h2 className="font-serif text-2xl mb-3 text-on-surface">Loading History</h2>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen pt-[112px] pb-20 px-6 md:px-16 max-w-[1280px] mx-auto w-full">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl mb-2 text-on-surface">Analysis History</h1>
          <p className="text-sm opacity-70 font-normal text-on-surface-variant">View your past contract comparisons</p>
        </div>
        <Link
          to="/upload"
          className="px-6 py-3 bg-gold text-on-gold text-xs font-label-caps text-label-caps uppercase tracking-[0.2em] font-semibold hover:bg-gold-fixed transition-colors rounded"
        >
          New Analysis
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 glass-panel rounded-lg mb-8 border border-red-400/30">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" strokeWidth={1.5} />
          <p className="text-sm opacity-80 text-red-400">{error}</p>
        </div>
      )}

      {analyses.length === 0 && !error && (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-on-surface-variant/30 text-4xl mb-6">description</span>
          <p className="text-lg font-normal text-on-surface-variant opacity-60 mb-4">No analyses yet</p>
          <Link to="/upload" className="font-label-caps text-label-caps text-gold border-b border-gold pb-1">
            Compare Your First Contract
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {analyses.map((a) => (
          <Link
            key={a.id}
            to={`/analysis/${a.id}`}
            className="group flex items-center justify-between p-5 glass-panel rounded-lg border border-outline/20 hover:border-gold/40 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-start gap-4 min-w-0">
              <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                a.status === 'completed' ? 'bg-gold' :
                a.status === 'failed' ? 'bg-red-400' :
                'bg-yellow-400 animate-pulse'
              }`} />
              <div className="min-w-0">
                <p className="font-medium text-on-surface truncate">{a.doc_a_name} vs {a.doc_b_name}</p>
                <p className="text-xs opacity-60 mt-1 flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
                  {new Date(a.created_at).toLocaleDateString()} &middot; {a.status}
                </p>
                {a.summary && (
                  <p className="text-sm opacity-70 mt-2 line-clamp-1 font-normal text-on-surface-variant">{a.summary}</p>
                )}
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant/30 group-hover:opacity-100 transition-opacity shrink-0 ml-4" style={{ fontVariationSettings: "'FILL' 1" }}>chevron_right</span>
          </Link>
        ))}
      </div>
    </section>
  );
}