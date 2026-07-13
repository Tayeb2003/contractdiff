import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    if (password !== confirm) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    try {
      const result = await api.auth.resetPassword(token, password);
      setMessage(result.message || 'Password updated successfully.');
      setTimeout(() => navigate('/login'), 1500);
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
          Reset Password
        </h1>
        <p className="text-body-md text-on-surface-variant">Choose a new password for your account</p>
      </div>

      {error && (
        <div className="p-3 glass-panel border border-red-400/30 text-sm text-red-400 mb-6">{error}</div>
      )}

      {message ? (
        <div className="space-y-6">
          <div className="p-3 glass-panel border border-gold/30 text-sm text-gold">{message}</div>
          <p className="text-center text-sm opacity-60">
            <Link to="/login" className="text-gold hover:underline">Continue to sign in</Link>
          </p>
        </div>
      ) : !token ? (
        <div className="p-3 glass-panel border border-red-400/30 text-sm text-red-400">
          Missing or invalid reset link. Please request a new one.
          <div className="mt-3">
            <Link to="/forgot-password" className="text-gold hover:underline">Request reset link</Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <label className="block font-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase opacity-80">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border-b border-outline/50 px-0 py-3 focus:outline-none focus:border-gold transition-colors text-on-surface placeholder:text-on-surface-variant/40"
              required
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <label className="block font-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase opacity-80">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full bg-transparent border-b border-outline/50 px-0 py-3 focus:outline-none focus:border-gold transition-colors text-on-surface placeholder:text-on-surface-variant/40"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gold text-on-gold font-label-caps text-label-caps uppercase tracking-[0.2em] text-sm hover:bg-gold-fixed transition-colors duration-300 disabled:opacity-30 cursor-pointer rounded"
          >
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      )}

      <p className="text-center mt-8 text-sm opacity-60">
        <Link to="/login" className="text-gold hover:underline">Back to sign in</Link>
      </p>
    </section>
  );
}