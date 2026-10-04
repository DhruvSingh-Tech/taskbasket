'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import GlassSurface from '@/components/GlassSurface';
import { useTaskContext } from '@/context/TaskContext';
import { useSession } from '@/lib/auth-client';
import { User, LogIn } from 'lucide-react';

export const NavbarPill: React.FC = () => {
  const pathname = usePathname();
  const { currentUser, setIsAuthModalOpen } = useTaskContext();
  const { data: session } = useSession();

  return (
    <GlassSurface
      width="100%"
      height={48}
      borderRadius={24}
      backgroundOpacity={0.15}
      saturation={1.2}
      distortionScale={-80}
      className="px-3.5 shrink-0"
    >
      <nav className="w-full flex items-center justify-between px-1">
        <Link
          href="/"
          className="text-sm font-bold tracking-tight text-white hover:text-white/90 transition-colors"
        >
          TaskBasket
        </Link>

        <div className="flex items-center gap-3 text-xs font-medium text-white/75">
          <Link
            href="/"
            className={`hover:text-white transition-colors ${
              pathname === '/' ? 'text-white font-bold' : ''
            }`}
          >
            Home
          </Link>
          <Link
            href="/about"
            className={`hover:text-white transition-colors ${
              pathname === '/about' ? 'text-white font-bold' : ''
            }`}
          >
            About
          </Link>
        </div>

        <div className="h-3.5 w-[1px] bg-white/20 mx-1" />

        {/* User Account / Better Auth Modal Trigger */}
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="flex items-center gap-1.5 text-xs text-white/90 hover:text-white transition-colors p-1 rounded-xl hover:bg-white/10"
          title={session?.user ? `Logged in as ${session.user.name}` : 'Sign In / Profile'}
        >
          {currentUser ? (
            <>
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0"
                style={{ backgroundColor: currentUser.color || '#3B82F6' }}
              >
                {currentUser.name.charAt(0)}
              </span>
              <span className="font-semibold text-white/90 text-xs">
                {currentUser.name.split(' ')[0]}
              </span>
            </>
          ) : (
            <>
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </>
          )}
        </button>
      </nav>
    </GlassSurface>
  );
};
