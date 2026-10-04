'use client';

import React, { useState } from 'react';
import { useTaskContext } from '@/context/TaskContext';
import { X, Copy, Check, Users, Shield, Link, UserPlus, Sparkles } from 'lucide-react';

export const InviteModal: React.FC = () => {
  const {
    isInviteModalOpen,
    setIsInviteModalOpen,
    activeProject,
    projectMembers,
    currentUser,
  } = useTaskContext();

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isInviteModalOpen || !activeProject) return null;

  const inviteCode = activeProject.inviteCode || 'N/A';
  const inviteUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/invite/${inviteCode}`
      : `http://localhost:3000/invite/${inviteCode}`;

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg rounded-3xl p-6 sm:p-7 bg-[#caa477] border-2 border-[#a88258] shadow-2xl relative text-[#22170d] overflow-hidden"
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
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1e1308] text-[#fbf3e9] text-[10px] font-bold uppercase tracking-wider">
                <Users className="w-3 h-3" />
                <span>Project Teammates</span>
              </div>
              <h2 className="text-xl font-black text-[#1e1308]">
                Invite to {activeProject.name}
              </h2>
              <p className="text-xs text-[#523d28]">
                Only invited members can view, add, or be assigned tasks in this project.
              </p>
            </div>

            <button
              onClick={() => setIsInviteModalOpen(false)}
              className="p-1.5 rounded-full hover:bg-black/10 text-[#342415] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Project Invite Code Card */}
          <div className="p-4 rounded-2xl bg-[#dfccaF]/90 border border-[#a88258] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#4a341e]">
                Project Invite Code
              </span>
              <span className="text-[10px] text-[#694c2d] font-medium">Share with teammates</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 rounded-xl bg-[#f7ebe0] border border-[#a88258] font-mono text-base font-black tracking-widest text-[#1e1308] text-center shadow-inner">
                {inviteCode}
              </div>
              <button
                onClick={copyCodeToClipboard}
                className="px-3 py-2 rounded-xl bg-[#1e1308] hover:bg-[#342211] text-[#fbf3e9] text-xs font-bold shadow transition-all flex items-center gap-1.5 shrink-0"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Direct Invite Link */}
            <div className="pt-2 border-t border-[#a88258]/40 flex items-center justify-between gap-2">
              <div className="text-[11px] font-mono text-[#523d28] truncate flex-1">
                {inviteUrl}
              </div>
              <button
                onClick={copyLinkToClipboard}
                className="px-2.5 py-1 rounded-lg bg-[#b79166]/50 hover:bg-[#a88258]/60 text-[#22170d] text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors"
              >
                {copiedLink ? <Check className="w-3 h-3 text-emerald-700" /> : <Link className="w-3 h-3" />}
                <span>{copiedLink ? 'Link Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Explanation note */}
          <div className="p-3 rounded-2xl bg-[#faefe4] border border-[#a88258]/60 flex items-start gap-2.5 text-xs text-[#3b2713]">
            <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              If your invitee doesn&apos;t have a TaskBasket account, the link prompts them to sign up or log in first, then automatically connects them to this project.
            </span>
          </div>

          {/* Current Members List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#342415]">
                Current Project Members ({projectMembers.length})
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {projectMembers.map((member) => {
                const isMe = member.user.id === currentUser?.id;
                const isAdmin = member.role === 'admin';

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#dfccaF]/70 border border-[#a88258]/50"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                        style={{ backgroundColor: member.user.color || '#3B82F6' }}
                      >
                        {member.user.name.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-[#1e1308] flex items-center gap-1.5">
                          <span>{member.user.name}</span>
                          {isMe && <span className="text-[10px] text-[#694c2d]">(You)</span>}
                        </div>
                        <div className="text-[10px] text-[#523d28]">
                          {member.user.email || 'Project Collaborator'}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                        isAdmin
                          ? 'bg-amber-600/20 text-amber-950 border border-amber-600/30'
                          : 'bg-[#523d28]/10 text-[#523d28]'
                      }`}
                    >
                      {isAdmin && <Shield className="w-3 h-3 text-amber-800" />}
                      <span>{isAdmin ? 'Project Admin' : 'Member'}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
