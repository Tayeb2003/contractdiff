import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [devLink, setDevLink] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setDevLink('');
    try {
      const result = await api.auth.forgotPassword(email);
      setMessage(result.message || 'If an account exists for that email, a reset link has been generated.');
      if (result.devLink) setDevLink(result.devLink);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen pt-[112px] pb-20 px-6 md:px-16 max-w-md mx-auto w-full flex flex-col justify-center">
      <div className="text-center mb-12">
        <h1 className="font-serif text-on-surface mb-4" style={{ fontSize: 'clamp(32px, 5vw, 48px)' }}>
          Forgot Password
        </h1>
        <p className="text-body-md text-on-surface-variant">Enter your email and we'll send a reset link</p>
      </div>

      {error && (
        <div className="p-3 glass-panel border border-red-400/30 text-sm text-red-400 mb-6">{error}</div>
      )}

      {message ? (
        <div className="space-y-6">
          <div className="p-3 glass-panel border border-gold/30 text-sm text-gold">{message}</div>
          {devLink && (
            <div className="p-3 glass-panel border border-yellow-400/20 text-xs text-gold/70">
              <strong className="text-yellow-400/80">Dev mode:</strong> email is not configured, so use this link directly:{' '}
              <a href={devLink} className="text-gold underline break-all">{devLink}</a>
            </div>
          )}
          <p className="text-center text-sm opacity-60">
            <Link to="/login" className="text-gold hover:underline">Back to sign in</Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <label className="block font-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase opacity-80">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border-b border-outline/50 px-0 py-3 focus:outline-none focus:border-gold transition-colors text-on-surface placeholder:text-on-surface-variant/40"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gold text-on-gold font-label-caps text-label-caps uppercase tracking-[0.2em] text-sm hover:bg-gold-fixed transition-colors duration-300 disabled:opacity-30 cursor-pointer rounded"
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}

      <p className="text-center mt-8 text-sm opacity-60">
        Remembered it?{' '}
        <Link to="/login" className="text-gold hover:underline">Sign in</Link>
      </p>
    </section>
  );
}