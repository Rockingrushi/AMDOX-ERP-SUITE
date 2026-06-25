'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../utils/api';
import { Mail, Lock, ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const { token, setToken, setUser } = useAuthStore();
  const router = useRouter();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (token) {
      router.push('/');
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    if (!email || !password) {
      setLoginError('Please enter both email and password.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/login', { email, password });
      const { data } = response;
      if (data.success) {
        setToken(data.token);
        setUser({
          id: data._id,
          name: data.name,
          email: data.email,
          role: data.role,
        });
        router.push('/');
      } else {
        setLoginError(data.message || 'Login failed.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please check credentials.';
      setLoginError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center bg-[#05060b] px-4 py-12 overflow-hidden">
      {/* Decorative Glow Orbs */}
      <div className="bg-glow-purple -top-12 -left-12"></div>
      <div className="bg-glow-cyan bottom-12 right-12"></div>

      {/* Login Card Panel */}
      <div className="glass-panel z-10 w-full max-w-md rounded-3xl p-8 shadow-2xl">
        {/* Brand Logo Header */}
        <div className="flex flex-col items-center mb-6">
          <img src="/logo.png" alt="AMDOX ERP Logo" className="h-28 w-28 rounded-full object-cover shadow-[0_0_20px_rgba(6,182,212,0.35)]" />
        </div>

        <h3 className="text-lg font-semibold text-gray-200 mb-6 text-center">Sign In to Dashboard</h3>

        {/* Error Notification */}
        {loginError && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-semibold text-red-400">
            {loginError}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                <Mail className="h-4.5 w-4.5" />
              </span>
              <input
                type="email"
                required
                placeholder="admin@amdox.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input w-full rounded-xl py-3 pl-11 pr-4 text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
                Password
              </label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                <Lock className="h-4.5 w-4.5" />
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input w-full rounded-xl py-3 pl-11 pr-4 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accentPurple to-accentCyan py-3.5 text-sm font-semibold text-white shadow-lg shadow-accentPurple/25 transition-all hover:brightness-110 active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? 'Authenticating...' : 'Access Dashboard'}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        {/* Register Navigation */}
        <div className="mt-8 text-center text-xs">
          <p className="text-gray-500 font-medium">
            Don't have an administrative account?{' '}
            <Link href="/register" className="font-bold text-accentCyan hover:text-accentPurple hover:underline transition-colors">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
