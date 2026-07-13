import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Upload, FileText, Clipboard, X, ArrowLeft, Scale, Check } from 'lucide-react';
import { api } from '../lib/api';
import { parseFileClient } from '../lib/parser';

type Side = 'a' | 'b';

interface SideState {
  mode: 'file' | 'paste' | null;
  id?: string;
  name?: string;
  text?: string;
}

const EMPTY: SideState = { mode: null };

export default function UploadPage() {
  const navigate = useNavigate();
  const [sides, setSides] = useState<{ a: SideState; b: SideState }>({ a: { mode: null }, b: { mode: null } });
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const setSide = (side: Side, patch: Partial<SideState>) =>
    setSides((prev) => ({ ...prev, [side]: { ...prev[side], ...patch } }));

  const resetSide = (side: Side) => setSides((prev) => ({ ...prev, [side]: { mode: null } }));

  const uploadFile = async (file: File, side: Side) => {
    setUploading(true);
    setError('');
    try {
      const content = await parseFileClient(file);
      if (!content.trim()) {
        throw new Error('Could not extract any text from this file. Try pasting the text instead.');
      }
      const result = await api.documents.paste(file.name, content);
      setSide(side, { mode: 'file', id: result.id, name: result.originalName });
    } catch (err: any) {
      setError(err.message || 'Failed to read file.');
    } finally {
      setUploading(false);
    }
  };

  const ensureDocId = async (side: Side, state: SideState): Promise<string> => {
    if (state.mode === 'file' && state.id) return state.id;
    if (state.mode === 'paste' && state.text && state.text.trim()) {
      const label = side === 'a' ? 'Version A' : 'Version B';
      const name = (title.trim() ? `${title.trim()} - ${label}` : `pasted-contract-${label}`);
      const result = await api.documents.paste(name, state.text);
      setSide(side, { id: result.id, name: result.originalName });
      return result.id;
    }
    throw new Error('Please provide both documents before comparing.');
  };

  const startAnalysis = async () => {
    const { a, b } = sides;
    if ((a.mode !== 'file' && a.mode !== 'paste') || (b.mode !== 'file' && b.mode !== 'paste')) {
      setError('Please provide both an original and a revised document.');
      return;
    }
    if (a.mode === 'paste' && !a.text?.trim()) {
      setError('Version A text is empty.');
      return;
    }
    if (b.mode === 'paste' && !b.text?.trim()) {
      setError('Version B text is empty.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const [idA, idB] = await Promise.all([ensureDocId('a', a), ensureDocId('b', b)]);
      const result = await api.analyses.create(idA, idB);
      navigate(`/analysis/${result.analysisId}`);
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const bothReady = (() => {
    const ready = (s: SideState) =>
      (s.mode === 'file' && !!s.id) || (s.mode === 'paste' && !!s.text?.trim());
    return ready(sides.a) && ready(sides.b);
  })();

  return (
    <section className="min-h-screen pt-[112px] pb-20 px-6 md:px-16 max-w-[1280px] mx-auto w-full relative">
      <Link
        to="/"
        className="inline-flex items-center gap-2 font-label-caps text-label-caps opacity-70 hover:opacity-100 mb-10 transition-opacity cursor-pointer"
      >
        <span className="material-symbols-outlined">arrow_back</span> Back
      </Link>

      <div className="text-center mb-14">
        <h1 className="font-serif text-on-surface mb-5" style={{ fontSize: 'clamp(36px, 5vw, 56px)' }}>
          Compare <span className="text-gold italic font-light">Contracts</span>
        </h1>
        <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto">
          Drop in your original and revised documents — or paste the text directly. We'll surface
          every change, explained in plain English.
        </p>
      </div>

      {error && (
        <div className="max-w-2xl mx-auto mb-8 p-4 glass-panel border border-red-400/30 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-5 md:gap-6 items-stretch">
        <DocPanel
          side="a"
          label="Original"
          caption="Version A"
          state={sides.a}
          disabled={uploading}
          onFile={uploadFile}
          onChange={setSide}
          onReset={resetSide}
        />
        <div className="hidden md:flex items-center justify-center">
          <span className="font-serif text-xl tracking-[0.3em] text-gold/70 border border-secondary/30 px-4 py-2 glass-panel">
            VS
          </span>
        </div>
        <DocPanel
          side="b"
          label="Revised"
          caption="Version B"
          state={sides.b}
          disabled={uploading}
          onFile={uploadFile}
          onChange={setSide}
          onReset={resetSide}
        />
      </div>

      <div className="max-w-2xl mx-auto mt-8">
        <label className="block font-label-caps text-label-caps text-on-surface-variant tracking-[0.2em] uppercase opacity-70 mb-2">
          Contract title <span className="opacity-50">(optional)</span>
        </label>
        <input
          type="text"
          placeholder="e.g. Master Services Agreement"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent border-b border-outline/50 px-0 py-3 focus:outline-none focus:border-gold transition-colors placeholder:text-on-surface-variant/40 text-on-surface"
        />
      </div>

      <div className="text-center mt-12">
        <button
          onClick={startAnalysis}
          disabled={!bothReady || uploading}
          className="inline-flex items-center justify-center gap-3 px-12 py-4 bg-gold text-on-gold font-label-caps text-label-caps uppercase tracking-[0.2em] text-sm hover:bg-gold-fixed transition-all duration-300 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed cta-clip"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
          {uploading ? 'Analysing…' : 'Compare Contracts'}
        </button>
      </div>

      <div className="mt-10 max-w-2xl mx-auto p-4 glass-panel text-xs text-on-surface-variant text-center leading-relaxed">
        <strong className="text-gold/80">Not legal advice.</strong> ContractDiff is an AI-assisted
        analysis tool. Always consult a qualified attorney for legal decisions.
      </div>
    </section>
  );
}

interface DocPanelProps {
  side: 'a' | 'b';
  label: string;
  caption: string;
  state: { mode: 'file' | 'paste' | null; id?: string; name?: string; text?: string };
  disabled: boolean;
  onFile: (file: File, side: 'a' | 'b') => void;
  onChange: (side: 'a' | 'b', patch: Partial<{ mode: 'file' | 'paste' | null; id?: string; name?: string; text?: string }>) => void;
  onReset: (side: 'a' | 'b') => void;
}

function DocPanel({ side, label, caption, state, disabled, onFile, onChange, onReset }: DocPanelProps) {
  const [tab, setTab] = useState<'upload' | 'paste'>('upload');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) onFile(file, side);
    },
    [disabled, onFile, side]
  );

  const loaded = (state.mode === 'file' && !!state.id) || (state.mode === 'paste' && !!state.text?.trim());

  return (
    <div className="glass-panel rounded-lg flex flex-col">
      <div className="flex items-center justify-between p-5 border-b border-outline-variant/30">
        <div>
          <p className="font-label-caps text-label-caps text-gold/60 tracking-[0.1em] uppercase">{caption}</p>
          <h3 className="font-serif text-xl text-on-surface">{label}</h3>
        </div>
        {loaded && (
          <button
            onClick={() => onReset(side)}
            className="text-on-surface-variant hover:text-gold transition-colors cursor-pointer"
            title="Clear"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        )}
      </div>

      <div className="flex gap-1 p-2 border-b border-outline-variant/30">
        {(['upload', 'paste'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 font-label-caps text-label-caps uppercase tracking-[0.1em] transition-colors ${
              tab === t ? 'text-gold bg-gold/10' : 'text-on-surface-variant hover:text-gold/70'
            }`}
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              {t === 'upload' ? 'cloud_upload' : 'content_paste'}
            </span>
            {t === 'upload' ? 'Upload' : 'Paste'}
          </button>
        ))}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        {loaded ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
            <div className="w-14 h-14 rounded-full bg-gold/15 flex items-center justify-center mb-4">
              {state.mode === 'file' ? (
                <span className="material-symbols-outlined text-gold text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
              ) : (
                <span className="material-symbols-outlined text-gold text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>content_paste</span>
              )}
            </div>
            <p className="font-medium text-on-surface break-words max-w-full">
              {state.mode === 'file' ? state.name : 'Pasted text ready'}
            </p>
            <p className="text-xs text-gold/70 mt-2 flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              Loaded
            </p>
          </div>
        ) : tab === 'upload' ? (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => !disabled && fileRef.current?.click()}
            className={`flex-1 min-h-[200px] flex flex-col items-center justify-center text-center cursor-pointer border-2 border-dashed rounded-lg transition-all duration-300 ${
              dragOver ? 'border-gold bg-gold/10' : 'border-outline/30 hover:border-gold/50'
            }`}
          >
            <span className={`material-symbols-outlined text-3xl mx-auto mb-4 ${dragOver ? 'text-gold' : 'text-on-surface-variant/60'}`} style={{ fontVariationSettings: "'FILL' 1" }}>cloud_upload</span>
            <p className="font-normal text-on-surface-variant opacity-80">Drop file or click to browse</p>
            <p className="text-xs opacity-50 mt-2">PDF, DOCX, or TXT</p>
          </div>
        ) : (
          <textarea
            value={state.text || ''}
            onChange={(e) => onChange(side, { mode: 'paste', text: e.target.value })}
            rows={9}
            placeholder={`Paste the ${caption.toLowerCase()} contract text here…`}
            className="flex-1 w-full bg-transparent border border-outline/30 px-4 py-3 focus:outline-none focus:border-gold transition-colors placeholder:text-on-surface-variant/40 text-on-surface font-mono text-sm resize-none"
          />
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.docx,.txt"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file, side);
          e.target.value = '';
        }}
      />
    </div>
  );
}