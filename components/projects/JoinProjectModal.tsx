'use client';

import React, { useState } from 'react';
import { useTaskContext } from '@/context/TaskContext';
import { X, LogIn, AlertCircle, CheckCircle2, Hash } from 'lucide-react';

export const JoinProjectModal: React.FC = () => {
  const { isJoinModalOpen, setIsJoinModalOpen, joinProject } = useTaskContext();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isJoinModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const clean = code.trim().toUpperCase();
    if (!clean) {
      setError('Please enter a project code');
      return;
    }

    setLoading(true);
    try {
      const res = await joinProject(clean);
      if (!res.success) {
        setError(res.error || 'Failed to join project');
      } else {
        setSuccess(res.message || 'Joined project successfully!');
        setTimeout(() => {
          setIsJoinModalOpen(false);
          setCode('');
          setSuccess(null);
        }, 1200);
      }
    } catch (err: any) {
      setError(err?.message || 'Error joining project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-3xl p-6 sm:p-7 bg-[#caa477] border-2 border-[#a88258] shadow-2xl relative text-[#22170d] overflow-hidden"
        style={{
          backgroundImage: `
            radial-gradient(rgba(45, 30, 15, 0.12) 1.2px, transparent 1.2px),
            repeating-linear-gradient(transparent, transparent 31px, rgba(45, 30, 15, 0.05) 32px)
          `,
          backgroundSize: '24px 24px, 100% 32px',
        }}
      >
        {/* Left notebook binding margin */}
        <div className="absolute top-0 bottom-0 left-0 w-7 border-r-2 border-dashed border-[#8d6943]/40 flex flex-col justify-around items-center py-6 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-3 h-3 rounded-full bg-[#1b120a] shadow-inner" />
          ))}
        </div>

        <div className="pl-5 space-y-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1e1308] text-[#fbf3e9] text-[10px] font-bold uppercase tracking-wider">
                <Hash className="w-3 h-3" />
                <span>Join Workspace</span>
              </div>
              <h2 className="text-xl font-black text-[#1e1308]">
                Join via Project Code
              </h2>
              <p className="text-xs text-[#523d28]">
                Enter the 6-character code provided by the project creator.
              </p>
            </div>

            <button
              onClick={() => setIsJoinModalOpen(false)}
              className="p-1.5 rounded-full hover:bg-black/10 text-[#342415] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-950/20 border border-red-800/40 text-red-900 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-800" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-800" />
                <span>{success}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#342415]">Project Code</label>
              <input
                type="text"
                placeholder="e.g. TASK-A1B2C3"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                autoFocus
                className="w-full px-3 py-2.5 text-center font-mono text-base font-bold uppercase tracking-widest rounded-xl bg-[#f7ebe0] border border-[#a88258] text-[#1e1308] placeholder:text-[#8d6943]/60 focus:outline-none focus:border-[#1e1308] shadow-inner"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsJoinModalOpen(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl text-[#342415] hover:bg-black/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-[#1e1308] hover:bg-[#342211] text-[#fbf3e9] shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-3.5 h-3.5 border-2 border-[#fbf3e9] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Join Project</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
