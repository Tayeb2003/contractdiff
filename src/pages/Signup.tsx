import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await api.auth.signup(email, password, name);
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      navigate('/upload');
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        setError('Cannot reach the server. Make sure the backend is running (npm run dev:server).');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen pt-32 pb-20 px-6 md:px-12 max-w-md mx-auto w-full flex flex-col justify-center">
      <div className="text-center mb-12">
        <h1 className="font-serif text-3xl md:text-4xl mb-4 text-metallic">Create Account</h1>
        <p className="text-sm opacity-70 font-normal text-body">Start comparing contracts in seconds</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        {error && (
          <div className="p-3 border border-red-400/30 text-sm text-red-400">{error}</div>
        )}
        <div className="space-y-2">
          <label className="block text-sm font-medium tracking-wide uppercase opacity-80">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent border-b border-mint/30 px-0 py-3 focus:outline-none focus:border-mint transition-colors"
          />
        </div>
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
        <div className="space-y-2">
          <label className="block text-sm font-medium tracking-wide uppercase opacity-80">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent border-b border-mint/30 px-0 py-3 focus:outline-none focus:border-mint transition-colors"
            required
            minLength={6}
          />
        </div>

        <div className="p-3 border border-yellow-400/20 text-xs text-mint/70">
          <strong className="text-yellow-400/80">Important:</strong> ContractDiff provides AI-assisted analysis only. It does not constitute legal advice. Always consult a qualified attorney for legal decisions.
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-mint text-black font-medium uppercase tracking-[0.2em] text-sm hover:bg-white transition-colors duration-300 disabled:opacity-30 cursor-pointer"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="text-center mt-8 text-sm opacity-60">
        Already have an account?{' '}
        <Link to="/login" className="text-mint hover:underline">Sign in</Link>
      </p>
    </section>
  );
}
