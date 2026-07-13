import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Check, AlertTriangle, Loader2, Eye, EyeOff } from 'lucide-react';
import { api } from '../lib/api';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [provider, setProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showKey, setShowKey] = useState(false);

  const PROVIDERS = [
    { id: 'gemini', label: 'Google Gemini', url: 'https://aistudio.google.com/apikey' },
    { id: 'openai', label: 'OpenAI', url: 'https://platform.openai.com/api-keys' },
    { id: 'anthropic', label: 'Anthropic (Claude)', url: 'https://console.anthropic.com/settings/keys' },
    { id: 'nvidia', label: 'NVIDIA NIM', url: 'https://build.nvidia.com/microsoft/phi-3-mini-4k-instruct' },
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    api.auth.getKey()
      .then((data) => {
        setHasKey(data.hasKey);
        if (data.provider) setProvider(data.provider);
      })
      .catch(() => setHasKey(false));
  }, [navigate]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setMessage({ type: 'error', text: 'Please enter an API key' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await api.auth.setKey(apiKey.trim(), provider);
      setHasKey(true);
      setApiKey('');
      setMessage({ type: 'success', text: `API key saved for ${PROVIDERS.find((p) => p.id === provider)?.label}. Used only for your analyses.` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save API key' });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    try {
      await api.auth.setKey('', provider);
      setHasKey(false);
      setMessage({ type: 'success', text: 'API key removed. You will need to add one before running an analysis.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to remove API key' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="min-h-screen pt-[112px] pb-20 px-6 md:px-16 max-w-2xl mx-auto w-full">
      <h1 className="font-serif text-3xl md:text-4xl mb-2 text-on-surface">Settings</h1>
      <p className="text-sm opacity-70 font-normal text-on-surface-variant mb-12">Manage your account preferences</p>

      <div className="glass-panel p-6 md:p-8 rounded-xl">
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-gold text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
          <div>
            <h2 className="text-lg font-serif text-on-surface">AI Provider & API Key</h2>
            <p className="text-xs opacity-60 font-normal text-on-surface-variant mt-1">
              Bring your own API key for AI-powered analysis
            </p>
          </div>
        </div>

        {hasKey === true && (
          <div className="mb-6 p-3 glass-panel border border-gold/30 flex items-center gap-3">
            <span className="material-symbols-outlined text-gold shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <span className="text-sm text-gold/80">Your API key is configured</span>
          </div>
        )}

        <div className="mb-4">
          <label className="block font-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase opacity-70 mb-2">Provider</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full bg-transparent border border-outline/30 px-4 py-3 focus:outline-none focus:border-gold transition-colors text-sm text-on-surface"
          >
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id} className="bg-surface text-on-surface">
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="relative mb-4">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={`Paste your ${PROVIDERS.find((p) => p.id === provider)?.label} API key here…`}
            className="w-full bg-transparent border border-outline/30 px-4 py-3 pr-12 focus:outline-none focus:border-gold transition-colors placeholder:text-on-surface-variant/40 text-sm font-mono text-on-surface"
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              {showKey ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-gold text-on-gold font-label-caps text-label-caps uppercase tracking-[0.2em] text-xs hover:bg-gold-fixed transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed rounded"
          >
            {saving ? (
              <span className="flex items-center gap-2"><span className="material-symbols-outlined animate-spin" style={{ fontVariationSettings: "'FILL' 1" }}>sync</span> Saving…</span>
            ) : 'Save Key'}
          </button>
          {hasKey && (
            <button
              onClick={handleRemove}
              disabled={saving}
              className="px-6 py-3 border border-red-400/30 text-red-400 font-label-caps text-label-caps uppercase tracking-[0.2em] text-xs hover:bg-red-400/10 transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed rounded"
            >
              Remove
            </button>
          )}
        </div>

        {message && (
          <div className={`mt-4 p-3 flex items-start gap-3 text-sm ${
            message.type === 'error'
              ? 'bg-red-400/5 border border-red-400/20 text-red-400'
              : 'bg-gold/5 border border-gold/20 text-gold/80'
          }`}>
            {message.type === 'error' ? (
              <span className="material-symbols-outlined w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.5}>error</span>
            ) : (
              <span className="material-symbols-outlined w-4 h-4 shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="mt-6 p-4 glass-panel border border-outline/20 text-xs text-on-surface-variant/50 leading-relaxed">
          <p className="mb-2"><strong className="text-gold/70">Why bring your own key?</strong></p>
          <p>Your API key is stored securely and used only when analyzing your contracts. Each user must supply their own key for their chosen provider — there is no shared server key.</p>
          <p className="mt-2">
            Get an API key:{' '}
            {PROVIDERS.map((p, i) => (
              <span key={p.id}>
                {i > 0 && ', '}
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-gold underline">{p.label}</a>
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}