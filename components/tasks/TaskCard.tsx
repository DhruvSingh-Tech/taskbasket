'use client';

import React, { useState } from 'react';
import { Task, TaskStatus } from '@/types/task';
import { useTaskContext } from '@/context/TaskContext';
import {
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowRight,
  UserCheck
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit }) => {
  const { deleteTask, moveTask, editingUsers, tabId } = useTaskContext();
  const [showMenu, setShowMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Check if another user is currently editing this task
  const activeEditor = editingUsers[task.id];
  const isBeingEditedByOther = activeEditor && activeEditor.tabId !== tabId;

  // Status colors matching image 2 wireframe
  const getStatusStyles = () => {
    switch (task.status) {
      case 'todo':
        return {
          container:
            'bg-[#441a2e]/90 hover:bg-[#521f37] border-rose-500/30 hover:border-rose-400/50 shadow-rose-950/30',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
        };
      case 'in-progress':
        return {
          container:
            'bg-[#122846]/90 hover:bg-[#173359] border-blue-500/30 hover:border-blue-400/50 shadow-blue-950/30',
          badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
        };
      case 'completed':
        return {
          container:
            'bg-[#0d3630]/90 hover:bg-[#11453d] border-teal-500/30 hover:border-teal-400/50 shadow-teal-950/30',
          badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30'
        };
    }
  };

  const getPriorityBadge = () => {
    switch (task.priority) {
      case 'urgent':
        return 'bg-red-500/30 text-red-200 border-red-500/40';
      case 'high':
        return 'bg-amber-500/30 text-amber-200 border-amber-500/40';
      case 'medium':
        return 'bg-sky-500/30 text-sky-200 border-sky-500/40';
      case 'low':
        return 'bg-zinc-500/30 text-zinc-200 border-zinc-500/40';
    }
  };

  const statusStyles = getStatusStyles();

  // Format date helper
  const formatDeadline = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`group relative rounded-2xl p-3.5 transition-all duration-200 backdrop-blur-2xl border shadow-lg cursor-grab active:cursor-grabbing ${
        statusStyles.container
      } ${isDragging ? 'opacity-40 scale-95 ring-2 ring-white/40' : 'opacity-100 hover:scale-[1.01]'}`}
    >
      {/* Realtime Remote Editing Alert */}
      {isBeingEditedByOther && (
        <div className="absolute -top-2.5 right-3 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-bold shadow-lg animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-950 animate-ping" />
          <span>{activeEditor.user.name.split(' ')[0]} is editing...</span>
        </div>
      )}

      {/* Top Row with Priority & More Options */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getPriorityBadge()}`}>
            {task.priority}
          </span>
          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-md border ${statusStyles.badge}`}>
            {task.status.replace('-', ' ')}
          </span>
        </div>

        {/* Action Menu */}
        <div className="relative">
          <button
            onClick={e => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/15 transition-colors"
            title="Options"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {showMenu && (
            <div
              className="absolute right-0 top-6 z-30 w-40 rounded-xl bg-zinc-900/95 backdrop-blur-2xl border border-white/20 p-1 shadow-2xl text-xs text-white"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setShowMenu(false);
                  onEdit(task);
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/10 text-left transition-colors"
              >
                <Edit2 className="w-3 h-3 text-sky-400" />
                <span>Edit Task</span>
              </button>

              <div className="my-1 border-t border-white/10" />

              <div className="px-2 py-0.5 text-[9px] font-semibold text-white/40 uppercase tracking-wider">
                Move To
              </div>

              {(['todo', 'in-progress', 'completed'] as TaskStatus[])
                .filter(s => s !== task.status)
                .map(s => (
                  <button
                    key={s}
                    onClick={() => {
                      setShowMenu(false);
                      moveTask(task.id, s);
                    }}
                    className="w-full flex items-center justify-between px-2 py-1 rounded-lg hover:bg-white/10 text-left text-white/80 hover:text-white transition-colors capitalize text-xs"
                  >
                    <span>{s.replace('-', ' ')}</span>
                    <ArrowRight className="w-2.5 h-2.5 text-white/40" />
                  </button>
                ))}

              <div className="my-1 border-t border-white/10" />

              <button
                onClick={() => {
                  setShowMenu(false);
                  deleteTask(task.id);
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-red-500/20 text-red-400 text-left transition-colors text-xs"
              >
                <Trash2 className="w-3 h-3 text-red-400" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Task Title (labeled 'Task' in image 2) */}
      <h3
        onClick={() => onEdit(task)}
        className="text-sm font-bold text-white tracking-tight leading-snug hover:text-white/90 cursor-pointer mb-1.5"
      >
        {task.title}
      </h3>

      {/* Task Description (labeled 'Task Description' in image 2) */}
      {task.description && (
        <p className="text-[11px] text-white/75 line-clamp-2 leading-relaxed mb-2.5">
          {task.description}
        </p>
      )}

      {/* Card Metadata Fields matching image 2 */}
      <div className="space-y-1.5 pt-2 border-t border-white/15 text-[11px]">
        {/* task deadline */}
        <div className="flex items-center justify-between text-white/80">
          <div className="flex items-center gap-1.5 text-white/60">
            <Calendar className="w-3 h-3" />
            <span>task deadline</span>
          </div>
          <span className="font-semibold text-white bg-white/15 px-2 py-0.5 rounded-md text-[10px]">
            {formatDeadline(task.dueDate)}
          </span>
        </div>

        {/* task assigned to */}
        <div className="flex items-center justify-between text-white/80">
          <div className="flex items-center gap-1.5 text-white/60">
            <UserCheck className="w-3 h-3" />
            <span>task assigned to</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow"
              style={{ backgroundColor: task.assignedTo?.color || '#3B82F6' }}
            >
              {task.assignedTo?.name.charAt(0) || 'U'}
            </span>
            <span className="font-medium text-white truncate max-w-[100px] text-[10px]">
              {task.assignedTo?.name || 'Unassigned'}
            </span>
          </div>
        </div>

        {/* task added by 2 Oct */}
        <div className="flex items-center justify-between text-[10px] text-white/50 pt-1 border-t border-white/10">
          <span>task added by {task.createdBy?.name?.split(' ')[0] || 'Member'}</span>
          <span>{formatDeadline(task.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};
