'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../utils/api';
import { User as UserIcon, Mail, Lock, ArrowRight } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { token, setToken, setUser } = useAuthStore();
  const router = useRouter();

  // Redirect if logged in
  useEffect(() => {
    if (token) {
      router.push('/');
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name || !email || !password || !confirmPassword) {
      setErrorMsg('Please complete all form fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/register', { name, email, password });
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
        setErrorMsg(data.message || 'Registration failed.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed. Try again.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center bg-[#05060b] px-4 py-12 overflow-hidden">
      {/* Decorative Glow Orbs */}
      <div className="bg-glow-purple -top-12 -left-12"></div>
      <div className="bg-glow-cyan bottom-12 right-12"></div>

      {/* Register Panel */}
      <div className="glass-panel z-10 w-full max-w-md rounded-3xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-4">
          <img src="/logo.png" alt="AMDOX ERP Logo" className="h-24 w-24 rounded-full object-cover shadow-[0_0_20px_rgba(6,182,212,0.35)]" />
        </div>

        <h3 className="text-base font-semibold text-gray-200 mb-5 text-center">Register Admin Account</h3>

        {/* Display Error Message */}
        {errorMsg && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-semibold text-red-400">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                <UserIcon className="h-4.5 w-4.5" />
              </span>
              <input
                type="text"
                required
                placeholder="Alex Mercer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input w-full rounded-xl py-2.5 pl-11 pr-4 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                <Mail className="h-4.5 w-4.5" />
              </span>
              <input
                type="email"
                required
                placeholder="alex@amdox.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input w-full rounded-xl py-2.5 pl-11 pr-4 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                <Lock className="h-4.5 w-4.5" />
              </span>
              <input
                type="password"
                required
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input w-full rounded-xl py-2.5 pl-11 pr-4 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                <Lock className="h-4.5 w-4.5" />
              </span>
              <input
                type="password"
                required
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="glass-input w-full rounded-xl py-2.5 pl-11 pr-4 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accentPurple to-accentCyan py-3 text-sm font-semibold text-white shadow-lg shadow-accentPurple/25 transition-all hover:brightness-110 active:scale-98 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Register Profile'}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <div className="mt-6 text-center text-xs">
          <p className="text-gray-500 font-medium">
            Already have an administrative profile?{' '}
            <Link href="/login" className="font-bold text-accentCyan hover:text-accentPurple hover:underline transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
