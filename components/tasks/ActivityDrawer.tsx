'use client';

import React from 'react';
import { useTaskContext } from '@/context/TaskContext';
import { X, History, Clock, CheckCircle2, PlusCircle, RefreshCw, Trash2, UserPlus, Users, FolderGit2 } from 'lucide-react';
import { ActivityType } from '@/types/task';

interface ActivityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ActivityDrawer: React.FC<ActivityDrawerProps> = ({ isOpen, onClose }) => {
  const { activities, activeProject } = useTaskContext();

  if (!isOpen) return null;

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'created':
        return <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />;
      case 'status_changed':
        return <RefreshCw className="w-3.5 h-3.5 text-blue-400" />;
      case 'assigned':
        return <UserPlus className="w-3.5 h-3.5 text-purple-400" />;
      case 'updated':
        return <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />;
      case 'deleted':
        return <Trash2 className="w-3.5 h-3.5 text-red-400" />;
      case 'project_created':
        return <FolderGit2 className="w-3.5 h-3.5 text-amber-400" />;
      case 'member_joined':
        return <Users className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-white/60" />;
    }
  };

  const formatRelativeTime = (ts: string) => {
    try {
      const d = new Date(ts);
      const diff = Math.floor((Date.now() - d.getTime()) / 1000);
      if (diff < 10) return 'Just now';
      if (diff < 60) return `${diff}s ago`;
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return ts;
    }
  };

  const formatExactDate = (ts: string) => {
    try {
      return new Date(ts).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return ts;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md h-full bg-[#18120c]/95 backdrop-blur-2xl border-l border-[#4a341f] p-5 shadow-2xl flex flex-col text-white animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-tight">Project Activity Log</h2>
                {activities.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px] font-mono font-bold text-white/70">
                    {activities.length}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/50 truncate max-w-[240px]">
                {activeProject ? `Workspace: ${activeProject.name}` : 'Live stream of project changes'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of events */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 custom-scrollbar pr-1">
          {activities.length === 0 ? (
            <div className="text-center py-16 text-white/40 text-xs space-y-2">
              <History className="w-8 h-8 mx-auto text-white/20" />
              <div>No activity recorded yet for this project.</div>
              <p className="text-[11px] text-white/30">Actions like creating, updating, or moving tasks will appear here in real time.</p>
            </div>
          ) : (
            activities.map((act) => (
              <div
                key={act.id}
                className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all space-y-2"
              >
                {/* User Header & Timestamp */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {act.user?.avatar ? (
                      <img
                        src={act.user.avatar}
                        alt={act.user.name}
                        className="w-5 h-5 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0"
                        style={{ backgroundColor: act.user?.color || '#3B82F6' }}
                      >
                        {act.user?.name?.charAt(0) || 'U'}
                      </span>
                    )}
                    <span className="text-xs font-semibold text-white/90 truncate">
                      {act.user?.name || 'Teammate'}
                    </span>
                  </div>

                  <span
                    className="text-[10px] text-white/45 flex items-center gap-1 shrink-0 font-medium cursor-help"
                    title={formatExactDate(act.timestamp)}
                  >
                    <Clock className="w-3 h-3 text-white/30" />
                    {formatRelativeTime(act.timestamp)}
                  </span>
                </div>

                {/* Event Description */}
                <div className="flex items-start gap-2.5 text-xs text-white/85 pl-1">
                  <span className="p-1 rounded-md bg-white/10 shrink-0 mt-0.5">
                    {getActivityIcon(act.type)}
                  </span>
                  <div className="leading-snug break-words flex-1">
                    {act.details || `Task "${act.taskTitle}" was updated by ${act.user?.name || 'a member'}`}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
