'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface InvitePageProps {
  params: Promise<{ code: string }>;
}

export default function InvitePage({ params }: InvitePageProps) {
  const resolvedParams = use(params);
  const code = (resolvedParams?.code || '').toUpperCase();
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Store pending invite in localStorage in case user needs to sign up
  useEffect(() => {
    if (code && typeof window !== 'undefined') {
      localStorage.setItem('taskbasket_pending_invite', code);
    }
  }, [code]);

  // If user is already authenticated, join automatically
  useEffect(() => {
    if (!isPending && session?.user && code && !joining && !success) {
      setJoining(true);
      fetch('/api/projects/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: code }),
      })
        .then((res) => res.json())
        .then((data) => {
          setJoining(false);
          if (data.success) {
            localStorage.removeItem('taskbasket_pending_invite');
            setSuccess(`Successfully joined ${data.project?.name || 'project'}!`);
            setTimeout(() => {
              router.push('/');
            }, 1000);
          } else {
            setError(data.error || 'Invalid or expired invite code');
          }
        })
        .catch(() => {
          setJoining(false);
          setError('Failed to join project. Please try again.');
        });
    }
  }, [isPending, session, code, joining, success, router]);

  if (isPending || joining) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center p-4">
        <div className="p-8 rounded-3xl bg-[#caa477] border-2 border-[#a88258] shadow-2xl text-center space-y-4 max-w-sm">
          <div className="w-8 h-8 mx-auto border-3 border-[#1e1308] border-t-transparent rounded-full animate-spin" />
          <h2 className="text-base font-black text-[#1e1308]">
            {joining ? 'Joining Project...' : 'Verifying Invitation...'}
          </h2>
          <p className="text-xs text-[#523d28]">
            Connecting you to project code <span className="font-mono font-bold text-black">{code}</span>
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center p-4">
        <div className="p-8 rounded-3xl bg-[#caa477] border-2 border-[#a88258] shadow-2xl text-center space-y-4 max-w-sm">
          <CheckCircle2 className="w-10 h-10 text-emerald-800 mx-auto" />
          <h2 className="text-lg font-black text-[#1e1308]">You&apos;re In!</h2>
          <p className="text-xs text-[#523d28]">{success}</p>
          <div className="text-[11px] font-bold text-[#1e1308]">Redirecting to your workspace...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center p-4">
        <div className="p-8 rounded-3xl bg-[#caa477] border-2 border-[#a88258] shadow-2xl text-center space-y-4 max-w-sm">
          <AlertCircle className="w-10 h-10 text-red-800 mx-auto" />
          <h2 className="text-lg font-black text-[#1e1308]">Invitation Issue</h2>
          <p className="text-xs text-red-900 font-semibold">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-2 rounded-xl bg-[#1e1308] text-[#fbf3e9] text-xs font-bold hover:bg-[#342211] transition-all"
          >
            Go to TaskBasket
          </button>
        </div>
      </div>
    );
  }

  // Not logged in: Show AuthScreen with invite context
  return (
    <AuthScreen
      inviteCode={code}
      onSuccess={() => {
        // Will trigger auto-join on next render via session change
      }}
    />
  );
}
