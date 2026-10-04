'use client';

import React, { useState } from 'react';
import { signIn, signUp, signOut, useSession } from '@/lib/auth-client';
import { X, Lock, Mail, User as UserIcon, LogIn, UserPlus, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';
import { useTaskContext } from '@/context/TaskContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { data: session, isPending } = useSession();
  const { setCurrentUser } = useTaskContext();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          setError('Please provide your name');
          setLoading(false);
          return;
        }

        const res = await signUp.email({
          name: name.trim(),
          email: email.trim(),
          password,
        });

        if (res.error) {
          setError(res.error.message || 'Failed to sign up');
        } else {
          setSuccess('Account created successfully! Signing in...');
          setCurrentUser({
            id: res.data?.user?.id || `user_${Date.now()}`,
            name: name.trim(),
            avatar: '',
            color: '#3B82F6',
            role: 'Member',
          });
          setTimeout(onClose, 1000);
        }
      } else {
        const res = await signIn.email({
          email: email.trim(),
          password,
        });

        if (res.error) {
          setError(res.error.message || 'Invalid credentials');
        } else {
          setSuccess('Signed in successfully!');
          if (res.data?.user) {
            setCurrentUser({
              id: res.data.user.id,
              name: res.data.user.name,
              avatar: res.data.user.image || '',
              color: '#3B82F6',
              role: 'Member',
            });
          }
          setTimeout(onClose, 1000);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      setSuccess('Signed out');
      setTimeout(onClose, 800);
    } catch {
      setError('Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-[#caa477] border border-[#a88258] p-6 shadow-2xl text-[#22170d] space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#a88258]/40">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#44301c]" />
            <h2 className="text-base font-black tracking-tight uppercase">
              {session?.user ? 'Account Profile' : mode === 'signin' ? 'Sign In to TaskBasket' : 'Create Account'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#e8d5bc]/80 hover:bg-[#f2e2cb] text-[#2c1d0c] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* If Already Logged In */}
        {session?.user ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#f4e6d3] border border-[#8b653b]/30">
              <span className="w-10 h-10 rounded-full bg-[#1e1308] text-white flex items-center justify-center text-sm font-bold">
                {session.user.name?.charAt(0) || 'U'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-[#22170d] truncate">{session.user.name}</div>
                <div className="text-xs text-[#523d28] truncate">{session.user.email}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#a88258]/30">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#e8d5bc] text-xs font-bold hover:bg-[#f2e2cb]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-md"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{loading ? 'Signing out...' : 'Sign Out'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Sign In / Sign Up Form */
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {/* Mode Switcher Tabs */}
            <div className="flex items-center p-1 rounded-2xl bg-[#b59066]/40 border border-[#9b7850]/40">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                }}
                className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all ${
                  mode === 'signin' ? 'bg-[#f4e6d3] text-[#22170d] shadow-sm' : 'text-[#44301c] hover:text-black'
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
                className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all ${
                  mode === 'signup' ? 'bg-[#f4e6d3] text-[#22170d] shadow-sm' : 'text-[#44301c] hover:text-black'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error / Success Banners */}
            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-800/15 border border-red-800/30 text-red-950 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-800/15 border border-emerald-800/30 text-emerald-950 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Name Field (Sign Up only) */}
            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="font-bold text-[#3d2a18]">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#785b3d]" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dhruv Dev"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs bg-[#e8d5bc]/95 border border-[#a88258] rounded-xl text-[#24170c] placeholder:text-[#785b3d] focus:outline-none focus:border-[#523920]"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1">
              <label className="font-bold text-[#3d2a18]">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#785b3d]" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-[#e8d5bc]/95 border border-[#a88258] rounded-xl text-[#24170c] placeholder:text-[#785b3d] focus:outline-none focus:border-[#523920]"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="font-bold text-[#3d2a18]">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#785b3d]" />
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-[#e8d5bc]/95 border border-[#a88258] rounded-xl text-[#24170c] placeholder:text-[#785b3d] focus:outline-none focus:border-[#523920]"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#1e1308] hover:bg-[#342211] text-[#fbf3e9] font-black text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 mt-2"
            >
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
