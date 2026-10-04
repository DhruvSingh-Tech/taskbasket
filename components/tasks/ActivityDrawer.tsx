'use client';

import React from 'react';
import { useTaskContext } from '@/context/TaskContext';
import { X, History, Clock, CheckCircle2, PlusCircle, RefreshCw, Trash2, UserPlus } from 'lucide-react';
import { ActivityType } from '@/types/task';

interface ActivityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ActivityDrawer: React.FC<ActivityDrawerProps> = ({ isOpen, onClose }) => {
  const { activities } = useTaskContext();

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
        return <PlusCircle className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      const diff = Math.floor((Date.now() - d.getTime()) / 1000);
      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return ts;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md h-full bg-zinc-950/95 backdrop-blur-2xl border-l border-white/15 p-5 shadow-2xl flex flex-col text-white animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="text-sm font-bold tracking-tight">Realtime Activity Log</h2>
              <p className="text-[11px] text-white/50">
                Live stream of changes across connected windows
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of events */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 custom-scrollbar pr-1">
          {activities.length === 0 ? (
            <div className="text-center py-12 text-white/40 text-xs">
              No activity recorded yet
            </div>
          ) : (
            activities.map(act => (
              <div
                key={act.id}
                className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0"
                      style={{ backgroundColor: act.user?.color || '#3B82F6' }}
                    >
                      {act.user?.name?.charAt(0) || 'U'}
                    </span>
                    <span className="text-xs font-semibold text-white/90">
                      {act.user?.name || 'Collaborator'}
                    </span>
                  </div>

                  <span className="text-[10px] text-white/40 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(act.timestamp)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-white/80 pl-7">
                  <span className="p-1 rounded-md bg-white/10 shrink-0">
                    {getActivityIcon(act.type)}
                  </span>
                  <span className="truncate">{act.details || act.taskTitle}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
