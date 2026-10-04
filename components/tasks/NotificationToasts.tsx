'use client';

import React from 'react';
import { useTaskContext } from '@/context/TaskContext';
import { X, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export const NotificationToasts: React.FC = () => {
  const { notifications, removeNotification } = useTaskContext();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map(n => {
        const getIcon = () => {
          switch (n.type) {
            case 'success':
              return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
            case 'warning':
              return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
            default:
              return <Info className="w-4 h-4 text-sky-400 shrink-0" />;
          }
        };

        return (
          <div
            key={n.id}
            className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-950/90 backdrop-blur-2xl border border-white/15 text-white shadow-2xl animate-in slide-in-from-top-2 fade-in duration-200"
          >
            {getIcon()}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-white tracking-tight">
                  {n.title}
                </span>
                <span className="text-[10px] text-white/40">{n.timestamp}</span>
              </div>
              <p className="text-xs text-white/70 mt-0.5 line-clamp-2 leading-snug">
                {n.message}
              </p>
            </div>

            <button
              onClick={() => removeNotification(n.id)}
              className="text-white/40 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
