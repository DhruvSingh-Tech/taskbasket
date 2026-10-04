'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import GlassSurface from '@/components/GlassSurface';
import { useTaskContext } from '@/context/TaskContext';

export const TopHeader: React.FC = () => {
  const pathname = usePathname();
  const { currentUser } = useTaskContext();

  return (
    <header className="w-full flex items-center justify-between gap-3 shrink-0 mb-3">
      {/* Brand & Navigation Pill */}
      <GlassSurface
        width="auto"
        height={46}
        borderRadius={22}
        backgroundOpacity={0.15}
        saturation={1.2}
        distortionScale={-80}
        className="px-3.5 shrink-0"
      >
        <nav className="flex items-center gap-4 sm:gap-6 px-1">
          <Link
            href="/"
            className="text-sm font-bold tracking-tight text-white hover:text-white/90 transition-colors"
          >
            TaskBasket
          </Link>

          <div className="flex items-center gap-3.5 text-xs font-medium text-white/75">
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

          <div className="h-3.5 w-[1px] bg-white/20 mx-0.5" />

          {/* User Persona Indicator */}
          {currentUser && (
            <div className="flex items-center gap-1.5 text-xs text-white/90">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0"
                style={{ backgroundColor: currentUser.color || '#3B82F6' }}
              >
                {currentUser.name.charAt(0)}
              </span>
              <span className="font-semibold text-white/90 text-xs">
                {currentUser.name.split(' ')[0]}
              </span>
            </div>
          )}
        </nav>
      </GlassSurface>
    </header>
  );
};
