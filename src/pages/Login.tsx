import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await api.auth.login(email, password);
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      navigate('/upload');
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        setError('Cannot reach the server. Make sure the backend is running.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen pt-[112px] pb-20 px-6 md:px-16 max-w-md mx-auto w-full flex flex-col justify-center">
      <div className="text-center mb-12">
        <h1 className="font-serif text-on-surface mb-4" style={{ fontSize: 'clamp(32px, 5vw, 48px)' }}>
          Welcome Back
        </h1>
        <p className="text-sm opacity-70 font-normal text-on-surface-variant">Sign in to access your contract analyses</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        {error && (
          <div className="p-3 glass-panel border border-red-400/30 text-sm text-red-400">{error}</div>
        )}
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
        <div className="space-y-2">
          <label className="block font-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase opacity-80">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent border-b border-outline/50 px-0 py-3 focus:outline-none focus:border-gold transition-colors text-on-surface placeholder:text-on-surface-variant/40"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-gold text-on-gold font-label-caps text-label-caps uppercase tracking-[0.2em] text-sm hover:bg-gold-fixed transition-colors duration-300 disabled:opacity-30 cursor-pointer rounded"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p className="text-right mt-4 text-sm opacity-60">
        <Link to="/forgot-password" className="text-gold hover:underline">Forgot password?</Link>
      </p>

      <p className="text-center mt-8 text-sm opacity-60">
        Don't have an account?{' '}
        <Link to="/signup" className="text-gold hover:underline">Sign up</Link>
      </p>
    </section>
  );
}