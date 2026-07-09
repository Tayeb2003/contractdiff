import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Clipboard } from 'lucide-react';
import { api } from '../lib/api';

export default function UploadPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'choose' | 'upload' | 'paste'>('choose');
  const [docA, setDocA] = useState<{ id: string; name: string } | null>(null);
  const [docB, setDocB] = useState<{ id: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pasteA, setPasteA] = useState('');
  const [pasteB, setPasteB] = useState('');
  const [pasteTitle, setPasteTitle] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<'a' | 'b'>('a');

  const handleFileDrop = useCallback(async (e: React.DragEvent, target: 'a' | 'b') => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    await uploadFile(file, target);
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, target: 'a' | 'b') => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file, target);
  }, []);

  const uploadFile = async (file: File, target: 'a' | 'b') => {
    setUploading(true);
    setError('');
    try {
      const result = await api.documents.upload(file);
      if (target === 'a') setDocA({ id: result.id, name: result.originalName });
      else setDocB({ id: result.id, name: result.originalName });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handlePasteSubmit = async () => {
    if (!pasteA || !pasteB) {
      setError('Please paste both document versions');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const title = pasteTitle || 'pasted-contract';
      const [resultA, resultB] = await Promise.all([
        api.documents.paste(`${title} - version A`, pasteA),
        api.documents.paste(`${title} - version B`, pasteB),
      ]);
      setDocA({ id: resultA.id, name: resultA.originalName });
      setDocB({ id: resultB.id, name: resultB.originalName });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const startAnalysis = async () => {
    if (!docA || !docB) return;
    setUploading(true);
    try {
      const result = await api.analyses.create(docA.id, docB.id);
      navigate(`/analysis/${result.analysisId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (step === 'choose') {
    return (
      <section className="min-h-screen pt-32 pb-20 px-6 md:px-12 max-w-4xl mx-auto w-full">
        <div className="text-center mb-16">
          <h1 className="font-serif text-4xl md:text-5xl mb-6 text-metallic">Compare Contracts</h1>
          <p className="text-lg opacity-80 font-normal text-body max-w-xl mx-auto">
            Upload or paste two versions of your contract to see what changed, explained in plain English.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <button
            onClick={() => setStep('upload')}
            className="group p-12 border border-mint/30 hover:border-mint transition-all duration-300 text-center"
          >
            <Upload className="w-12 h-12 mx-auto mb-6 text-mint" strokeWidth={1} />
            <h3 className="text-xl font-serif mb-3 uppercase tracking-wide text-metallic">Upload Files</h3>
            <p className="font-normal text-body opacity-70 text-sm">PDF, DOCX, or TXT</p>
          </button>
          <button
            onClick={() => setStep('paste')}
            className="group p-12 border border-mint/30 hover:border-mint transition-all duration-300 text-center"
          >
            <Clipboard className="w-12 h-12 mx-auto mb-6 text-mint" strokeWidth={1} />
            <h3 className="text-xl font-serif mb-3 uppercase tracking-wide text-metallic">Paste Text</h3>
            <p className="font-normal text-body opacity-70 text-sm">Copy-paste contract text directly</p>
          </button>
        </div>
      </section>
    );
  }

  if (step === 'upload') {
    return (
      <section className="min-h-screen pt-32 pb-20 px-6 md:px-12 max-w-4xl mx-auto w-full">
        <button onClick={() => { setStep('choose'); setDocA(null); setDocB(null); }} className="text-sm uppercase tracking-[0.2em] opacity-70 hover:opacity-100 mb-12 block">
          &larr; Back
        </button>
        <h2 className="font-serif text-3xl md:text-4xl mb-12 text-center text-metallic">Upload Your Documents</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {(['a', 'b'] as const).map((target) => (
            <div
              key={target}
              onDrop={(e) => handleFileDrop(e, target)}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => { setUploadTarget(target); fileInputRef.current?.click(); }}
              className={`border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-300 min-h-[250px] flex flex-col items-center justify-center ${
                (target === 'a' ? docA : docB)
                  ? 'border-mint bg-mint/5'
                  : 'border-mint/20 hover:border-mint/50'
              }`}
            >
              {target === 'a' && docA ? (
                <div>
                  <FileText className="w-10 h-10 mx-auto mb-4 text-mint" strokeWidth={1} />
                  <p className="font-medium">{docA.name}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDocA(null); }}
                    className="text-xs opacity-60 hover:opacity-100 mt-2 underline"
                  >
                    Remove
                  </button>
                </div>
              ) : target === 'b' && docB ? (
                <div>
                  <FileText className="w-10 h-10 mx-auto mb-4 text-mint" strokeWidth={1} />
                  <p className="font-medium">{docB.name}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDocB(null); }}
                    className="text-xs opacity-60 hover:opacity-100 mt-2 underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="w-10 h-10 mx-auto mb-4 opacity-50" strokeWidth={1} />
                  <p className="font-normal text-body opacity-70">
                    {target === 'a' ? 'Original Version (A)' : 'New Version (B)'}
                  </p>
                  <p className="text-xs opacity-50 mt-2">Drop file or click to browse</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(e) => handleFileSelect(e, uploadTarget)}
        />

        {error && <p className="text-red-400 text-center mt-6">{error}</p>}

        <div className="text-center mt-12">
          <button
            onClick={startAnalysis}
            disabled={!docA || !docB || uploading}
            className="px-10 py-4 bg-mint text-black font-medium uppercase tracking-[0.2em] text-sm hover:bg-white transition-colors duration-300 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          >
            {uploading ? 'Processing...' : 'Compare Contracts'}
          </button>
        </div>

        <div className="mt-8 p-4 border border-mint/10 text-xs text-mint/60 text-center">
          <strong className="text-mint/80">Not legal advice.</strong> ContractDiff is an AI-assisted analysis tool. Always consult a qualified attorney for legal decisions.
        </div>
      </section>
    );
  }

  if (step === 'paste') {
    const showPasteForm = !docA || !docB;
    return (
      <section className="min-h-screen pt-32 pb-20 px-6 md:px-12 max-w-4xl mx-auto w-full">
        <button onClick={() => { setStep('choose'); setDocA(null); setDocB(null); }} className="text-sm uppercase tracking-[0.2em] opacity-70 hover:opacity-100 mb-12 block">
          &larr; Back
        </button>
        <h2 className="font-serif text-3xl md:text-4xl mb-12 text-center text-metallic">Paste Contract Text</h2>

        {showPasteForm ? (
          <>
            <div className="mb-6">
              <input
                type="text"
                placeholder="Contract title (optional)"
                value={pasteTitle}
                onChange={(e) => setPasteTitle(e.target.value)}
                className="w-full bg-transparent border-b border-mint/30 px-0 py-3 focus:outline-none focus:border-mint transition-colors placeholder:text-mint/30"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium tracking-wide uppercase opacity-80 mb-3">Version A (Original)</label>
                <textarea
                  value={pasteA}
                  onChange={(e) => setPasteA(e.target.value)}
                  rows={15}
                  className="w-full bg-transparent border border-mint/20 px-4 py-3 focus:outline-none focus:border-mint transition-colors placeholder:text-mint/30 font-mono text-sm"
                  placeholder="Paste the original contract text here..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium tracking-wide uppercase opacity-80 mb-3">Version B (New)</label>
                <textarea
                  value={pasteB}
                  onChange={(e) => setPasteB(e.target.value)}
                  rows={15}
                  className="w-full bg-transparent border border-mint/20 px-4 py-3 focus:outline-none focus:border-mint transition-colors placeholder:text-mint/30 font-mono text-sm"
                  placeholder="Paste the new/updated contract text here..."
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-center mt-6">{error}</p>}

            <div className="text-center mt-8">
              <button
                onClick={handlePasteSubmit}
                disabled={uploading}
                className="px-10 py-4 bg-mint text-black font-medium uppercase tracking-[0.2em] text-sm hover:bg-white transition-colors duration-300 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
              >
                {uploading ? 'Processing...' : 'Upload & Compare'}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-mint/20 p-6 text-center">
                <FileText className="w-10 h-10 mx-auto mb-4 text-mint" strokeWidth={1} />
                <p className="font-medium">{docA?.name}</p>
              </div>
              <div className="border border-mint/20 p-6 text-center">
                <FileText className="w-10 h-10 mx-auto mb-4 text-mint" strokeWidth={1} />
                <p className="font-medium">{docB?.name}</p>
              </div>
            </div>

            {error && <p className="text-red-400 text-center">{error}</p>}

            <div className="text-center">
              <button
                onClick={startAnalysis}
                disabled={uploading}
                className="px-10 py-4 bg-mint text-black font-medium uppercase tracking-[0.2em] text-sm hover:bg-white transition-colors duration-300 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
              >
                {uploading ? 'Processing...' : 'Compare Contracts'}
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 border border-mint/10 text-xs text-mint/60 text-center">
          <strong className="text-mint/80">Not legal advice.</strong> ContractDiff is an AI-assisted analysis tool. Always consult a qualified attorney for legal decisions.
        </div>
      </section>
    );
  }

  return null;
}
