'use client';

import React, { useState, useEffect } from 'react';
import { signIn, signUp } from '@/lib/auth-client';
import { Lock, Mail, User as UserIcon, LogIn, UserPlus, AlertCircle, Sparkles, BookOpen } from 'lucide-react';

interface AuthScreenProps {
  onSuccess?: () => void;
  inviteCode?: string;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess, inviteCode: propInviteCode }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingInvite, setPendingInvite] = useState<string | null>(propInviteCode || null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const code = propInviteCode || localStorage.getItem('taskbasket_pending_invite');
      if (code) {
        setPendingInvite(code);
      }
    }
  }, [propInviteCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          setError('Please provide your full name');
          setLoading(false);
          return;
        }

        const res = await signUp.email({
          name: name.trim(),
          email: email.trim(),
          password,
        });

        if (res.error) {
          setError(res.error.message || 'Failed to create account');
        } else {
          onSuccess?.();
        }
      } else {
        const res = await signIn.email({
          email: email.trim(),
          password,
        });

        if (res.error) {
          setError(res.error.message || 'Invalid email or password');
        } else {
          onSuccess?.();
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex-1 flex items-center justify-center p-4">
      <div
        className="w-full max-w-md rounded-3xl p-6 sm:p-8 bg-[#caa477] border-2 border-[#a88258] shadow-2xl relative text-[#22170d] overflow-hidden"
        style={{
          backgroundImage: `
            radial-gradient(rgba(45, 30, 15, 0.12) 1.2px, transparent 1.2px),
            repeating-linear-gradient(transparent, transparent 31px, rgba(45, 30, 15, 0.05) 32px)
          `,
          backgroundSize: '24px 24px, 100% 32px',
        }}
      >
        {/* Left binding spine margin */}
        <div className="absolute top-0 bottom-0 left-0 w-8 border-r-2 border-dashed border-[#8d6943]/40 flex flex-col justify-around items-center py-6 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-3.5 h-3.5 rounded-full bg-[#1b120a] shadow-inner" />
          ))}
        </div>

        <div className="pl-6 space-y-6">
          {/* Header */}
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e1308] text-[#fbf3e9] text-xs font-bold tracking-wide shadow-sm">
              <BookOpen className="w-3.5 h-3.5" />
              <span>TASKBASKET NOTEBOOK</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1e1308] tracking-tight">
              {mode === 'signin' ? 'Welcome Back' : 'Create an Account'}
            </h1>
            <p className="text-xs text-[#523d28] font-medium max-w-xs mx-auto">
              Collaborative realtime task management with private project workspaces.
            </p>
          </div>

          {/* Pending Invite Alert */}
          {pendingInvite && (
            <div className="p-3 rounded-2xl bg-[#f5e8d5] border border-[#a88258] shadow-sm flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs text-[#3b2713]">
                <div className="font-bold">Project Invitation Detected!</div>
                <div className="text-[11px] text-[#5c3e21] mt-0.5">
                  Sign in or create an account to automatically join project code <strong className="font-mono text-black">{pendingInvite}</strong>.
                </div>
              </div>
            </div>
          )}

          {/* Toggle Tabs */}
          <div className="flex rounded-2xl bg-[#b58f62]/40 p-1 border border-[#9b764d]/60">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                mode === 'signin'
                  ? 'bg-[#1e1308] text-[#fbf3e9] shadow-md'
                  : 'text-[#3b2713] hover:text-[#1e1308]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                mode === 'signup'
                  ? 'bg-[#1e1308] text-[#fbf3e9] shadow-md'
                  : 'text-[#3b2713] hover:text-[#1e1308]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-2xl bg-red-950/20 border border-red-800/40 text-red-900 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-800" />
                <span>{error}</span>
              </div>
            )}

            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#342415]">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-[#7b5f41]" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Rivera"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#f7ebe0] border border-[#a88258] text-[#1e1308] placeholder:text-[#8d6943] focus:outline-none focus:border-[#1e1308]"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#342415]">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-[#7b5f41]" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#f7ebe0] border border-[#a88258] text-[#1e1308] placeholder:text-[#8d6943] focus:outline-none focus:border-[#1e1308]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#342415]">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[#7b5f41]" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#f7ebe0] border border-[#a88258] text-[#1e1308] placeholder:text-[#8d6943] focus:outline-none focus:border-[#1e1308]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-2 rounded-xl bg-[#1e1308] hover:bg-[#342211] text-[#fbf3e9] font-bold text-xs tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-[#fbf3e9] border-t-transparent rounded-full animate-spin" />
              ) : mode === 'signin' ? (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In & Open Workspace</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account & Start</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
