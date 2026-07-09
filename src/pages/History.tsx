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
      <section className="min-h-screen pt-32 pb-20 px-6 md:px-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-mint animate-spin" strokeWidth={1} />
      </section>
    );
  }

  return (
    <section className="min-h-screen pt-32 pb-20 px-6 md:px-12 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl mb-2 text-metallic">Analysis History</h1>
          <p className="text-sm opacity-70 font-normal text-body">View your past contract comparisons</p>
        </div>
        <Link
          to="/upload"
          className="px-6 py-3 bg-mint text-black text-xs uppercase tracking-[0.2em] font-medium hover:bg-white transition-colors"
        >
          New Analysis
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 border border-red-400/30 mb-8">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" strokeWidth={1.5} />
          <p className="text-sm opacity-80">{error}</p>
        </div>
      )}

      {analyses.length === 0 && !error && (
        <div className="text-center py-20">
          <FileText className="w-12 h-12 mx-auto mb-6 opacity-30" strokeWidth={1} />
          <p className="text-lg font-normal text-body opacity-60 mb-4">No analyses yet</p>
          <Link to="/upload" className="text-sm uppercase tracking-[0.2em] border-b border-mint pb-1">
            Compare Your First Contract
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {analyses.map((a) => (
          <Link
            key={a.id}
            to={`/analysis/${a.id}`}
            className="group flex items-center justify-between p-5 border border-mint/10 hover:border-mint/30 transition-all duration-300"
          >
            <div className="flex items-start gap-4 min-w-0">
              <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                a.status === 'completed' ? 'bg-mint' :
                a.status === 'failed' ? 'bg-red-400' :
                'bg-yellow-400 animate-pulse'
              }`} />
              <div className="min-w-0">
                <p className="font-medium truncate">{a.doc_a_name} vs {a.doc_b_name}</p>
                <p className="text-xs opacity-60 mt-1 flex items-center gap-2">
                  <Clock className="w-3 h-3" strokeWidth={1.5} />
                  {new Date(a.created_at).toLocaleDateString()} &middot; {a.status}
                </p>
                {a.summary && (
                  <p className="text-sm opacity-70 mt-2 line-clamp-1 font-normal text-body">{a.summary}</p>
                )}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 opacity-30 group-hover:opacity-100 transition-opacity shrink-0 ml-4" strokeWidth={1} />
          </Link>
        ))}
      </div>
    </section>
  );
}
