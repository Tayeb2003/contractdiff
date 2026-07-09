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
    <section className="min-h-screen pt-32 pb-20 px-6 md:px-12 max-w-md mx-auto w-full flex flex-col justify-center">
      <div className="text-center mb-12">
        <h1 className="font-serif text-3xl md:text-4xl mb-4 text-metallic">Forgot Password</h1>
        <p className="text-sm opacity-70 font-normal text-body">Enter your email and we'll send a reset link</p>
      </div>

      {error && (
        <div className="p-3 border border-red-400/30 text-sm text-red-400 mb-6">{error}</div>
      )}

      {message ? (
        <div className="space-y-6">
          <div className="p-3 border border-mint/30 text-sm text-mint">{message}</div>
          {devLink && (
            <div className="p-3 border border-yellow-400/20 text-xs text-mint/70">
              <strong className="text-yellow-400/80">Dev mode:</strong> email is not configured, so use this link directly:{' '}
              <a href={devLink} className="text-mint underline break-all">{devLink}</a>
            </div>
          )}
          <p className="text-center text-sm opacity-60">
            <Link to="/login" className="text-mint hover:underline">Back to sign in</Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <label className="block text-sm font-medium tracking-wide uppercase opacity-80">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border-b border-mint/30 px-0 py-3 focus:outline-none focus:border-mint transition-colors"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-mint text-black font-medium uppercase tracking-[0.2em] text-sm hover:bg-white transition-colors duration-300 disabled:opacity-30 cursor-pointer"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      )}

      <p className="text-center mt-8 text-sm opacity-60">
        Remembered it?{' '}
        <Link to="/login" className="text-mint hover:underline">Sign in</Link>
      </p>
    </section>
  );
}
