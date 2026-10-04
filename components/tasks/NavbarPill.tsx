'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import GlassSurface from '@/components/GlassSurface';
import { useTaskContext } from '@/context/TaskContext';
import { useSession } from '@/lib/auth-client';
import { LogIn, LayoutDashboard } from 'lucide-react';

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
      className="px-3 shrink-0"
    >
      <nav className="w-full flex items-center justify-between gap-3 px-1">
        {/* Brand Logo & Name */}
        <Link
          href="/"
          className="flex items-center gap-2 group shrink-0"
          title="TaskBasket Home"
        >
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-[#1e1308] font-black text-[11px] shadow-sm">
            TB
          </div>
          <span className="text-sm font-bold tracking-tight text-white group-hover:text-amber-300 transition-colors">
            TaskBasket
          </span>
        </Link>

        {/* Right Nav Actions & Profile */}
        <div className="flex items-center gap-2 shrink-0">
          {pathname === '/about' ? (
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <LayoutDashboard className="w-3 h-3 text-amber-400" />
              <span>Board</span>
            </Link>
          ) : (
            <Link
              href="/about"
              className="px-2.5 py-1 rounded-full text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              About
            </Link>
          )}

          <div className="h-3.5 w-[1px] bg-white/20 shrink-0" />

          {/* User Account / Better Auth Modal Trigger */}
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-1.5 text-xs text-white/90 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10 shrink-0"
            title={session?.user ? `Logged in as ${session.user.name}` : 'Sign In / Profile'}
          >
            {currentUser ? (
              <>
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-5 h-5 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0"
                    style={{ backgroundColor: currentUser.color || '#3B82F6' }}
                  >
                    {currentUser.name.charAt(0)}
                  </span>
                )}
                <span className="font-semibold text-white/90 text-xs max-w-[80px] truncate">
                  {currentUser.name.split(' ')[0]}
                </span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold">Sign In</span>
              </>
            )}
          </button>
        </div>
      </nav>
    </GlassSurface>
  );
};
