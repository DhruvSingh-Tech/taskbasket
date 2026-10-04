'use client';

import React, { useState } from 'react';
import GlassSurface from '@/components/GlassSurface';
import { useTaskContext } from '@/context/TaskContext';
import { useSession } from '@/lib/auth-client';
import { Users, ChevronUp, Laptop, LogIn, UserCheck, UserPlus, Shield } from 'lucide-react';

export const CollaboratorsBar: React.FC = () => {
  const {
    currentUser,
    collaborators,
    setIsAuthModalOpen,
    setIsInviteModalOpen,
    projectMembers,
    activeProject,
  } = useTaskContext();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  if (!currentUser) return null;

  return (
    <div className="fixed bottom-5 right-6 z-50 flex flex-col items-end">
      {/* Expanded User Identity & Collaborators Popover */}
      {isOpen && (
        <div className="mb-3 w-84 rounded-3xl bg-zinc-950/95 backdrop-blur-2xl border border-white/20 p-4 shadow-2xl text-white space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold tracking-tight">Project Teammates</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
              {collaborators.length + 1} Online
            </span>
          </div>

          {/* Current User in this Window */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
                My Profile
              </span>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsAuthModalOpen(true);
                }}
                className="text-[10px] text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
              >
                {session?.user ? (
                  <>
                    <UserCheck className="w-3 h-3" />
                    <span>Manage Account</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-3 h-3" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/10 border border-white/15">
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md shrink-0"
                style={{ backgroundColor: currentUser.color || '#3B82F6' }}
              >
                {currentUser.name.charAt(0)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white truncate">
                  {currentUser.name} (You)
                </div>
                <div className="text-[10px] text-white/60 truncate">
                  {session?.user?.email || currentUser.role}
                </div>
              </div>
            </div>
          </div>

          {/* Invite Teammates Action */}
          {activeProject && (
            <div className="pt-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsInviteModalOpen(true);
                }}
                className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-300" />
                <span>Invite Teammates to Project</span>
              </button>
            </div>
          )}

          {/* Project Members List */}
          <div className="space-y-1.5 pt-1 border-t border-white/10">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-white/40 tracking-wider">
              <span>Workspace Members ({projectMembers.length})</span>
            </div>

            <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
              {projectMembers.map((m) => {
                const isAdmin = m.role === 'admin';
                const isOnline = collaborators.some((c) => c.user?.id === m.userId) || m.userId === currentUser.id;

                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-white/5 text-xs text-white/80"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ backgroundColor: m.user.color || '#3B82F6' }}
                      >
                        {m.user.name.charAt(0)}
                      </span>
                      <div className="truncate">
                        <span className="font-medium text-white truncate">{m.user.name}</span>
                        {m.userId === currentUser.id && (
                          <span className="text-[10px] text-white/50 ml-1">(You)</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isAdmin && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold flex items-center gap-0.5">
                          <Shield className="w-2.5 h-2.5" />
                          <span>Admin</span>
                        </span>
                      )}
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
                          isOnline
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-white/5 text-white/40'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isOnline ? 'bg-emerald-400 animate-ping' : 'bg-white/30'
                          }`}
                        />
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Floating Collaborators Pill */}
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        <GlassSurface
          width="auto"
          height={44}
          borderRadius={22}
          backgroundOpacity={0.15}
          saturation={1.2}
          distortionScale={-100}
          redOffset={0}
          className="px-3 shrink-0 group active:scale-95 transition-transform"
          displace={0.5}
          greenOffset={10}
          blueOffset={20}
          brightness={50}
          opacity={0.93}
          mixBlendMode="screen"
        >
          <div className="flex -space-x-2 overflow-hidden">
            {/* Current user avatar */}
            <span
              className="inline-block h-5 w-5 rounded-full ring-2 ring-zinc-950 text-[9px] font-bold text-white flex items-center justify-center shadow"
              style={{ backgroundColor: currentUser.color || '#3B82F6' }}
            >
              {currentUser.name.charAt(0)}
            </span>

            {/* Collaborators avatars */}
            {collaborators.slice(0, 3).map((c, idx) => (
              <span
                key={idx}
                className="inline-block h-5 w-5 rounded-full ring-2 ring-zinc-950 text-[9px] font-bold text-white flex items-center justify-center shadow"
                style={{ backgroundColor: c.user?.color || '#3B82F6' }}
              >
                {c.user?.name?.charAt(0) || 'U'}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold tracking-tight text-white/90">
            <span>collaborators</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
              {collaborators.length + 1}
            </span>
          </div>

          <ChevronUp
            className={`w-3.5 h-3.5 text-white/50 group-hover:text-white transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </GlassSurface>
      </div>
    </div>
  );
};
