'use client';

import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority, User } from '@/types/task';
import { useTaskContext } from '@/context/TaskContext';
import {
  X,
  Calendar,
  UserCheck,
  AlertTriangle,
  Sparkles,
  Layers,
  Trash2,
  Check,
  UserPlus
} from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  defaultStatus?: TaskStatus;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  defaultStatus = 'todo'
}) => {
  const {
    createTask,
    updateTask,
    deleteTask,
    projects,
    activeProjectId,
    projectMembers,
    startEditingTask,
    stopEditingTask,
    conflictTask,
    resolveConflict,
    currentUser,
    setIsInviteModalOpen,
  } = useTaskContext();

  const defaultUser: User = currentUser || {
    id: 'unassigned',
    name: 'Unassigned',
    avatar: '',
    color: '#9CA3AF',
    role: 'Member',
  };

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignedTo, setAssignedTo] = useState<User>(defaultUser);
  const [dueDate, setDueDate] = useState('');
  const [projectId, setProjectId] = useState('');
  const [error, setError] = useState('');

  // Lock task when editing
  useEffect(() => {
    if (isOpen && taskToEdit) {
      startEditingTask(taskToEdit.id);
    }
    return () => {
      if (taskToEdit) {
        stopEditingTask(taskToEdit.id);
      }
    };
  }, [isOpen, taskToEdit, startEditingTask, stopEditingTask]);

  // Populate fields
  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description);
      setStatus(taskToEdit.status);
      setPriority(taskToEdit.priority);
      setAssignedTo(taskToEdit.assignedTo || defaultUser);
      setDueDate(taskToEdit.dueDate || '');
      setProjectId(taskToEdit.projectId || projects[0]?.id || '');
    } else {
      setTitle('');
      setDescription('');
      setStatus(defaultStatus);
      setPriority('medium');
      setAssignedTo(currentUser || defaultUser);
      setDueDate(new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]);
      setProjectId(activeProjectId || projects[0]?.id || '');
    }
    setError('');
  }, [taskToEdit, defaultStatus, isOpen, activeProjectId, projects, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a task title');
      return;
    }

    if (taskToEdit) {
      updateTask(taskToEdit.id, {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        assignedTo,
        dueDate,
        projectId
      });
    } else {
      createTask({
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        assignedTo,
        dueDate,
        projectId
      });
    }

    onClose();
  };

  const handleDelete = () => {
    if (taskToEdit) {
      deleteTask(taskToEdit.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-zinc-950/95 backdrop-blur-2xl border border-white/15 p-6 shadow-2xl text-white space-y-5">
        {/* Conflict Notification Banner if concurrent edit occurred */}
        {conflictTask && conflictTask.remote.id === taskToEdit?.id && (
          <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Simultaneous Edit Detected!</span>
            </div>
            <p className="text-white/80">
              Another collaborator updated this task to version #{conflictTask.remote.version}.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  resolveConflict('use_theirs');
                  onClose();
                }}
                className="px-3 py-1 rounded-xl bg-amber-500 text-zinc-950 font-semibold hover:bg-amber-400"
              >
                Accept Remote Changes
              </button>
              <button
                type="button"
                onClick={() => resolveConflict('use_mine')}
                className="px-3 py-1 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20"
              >
                Keep My Edits
              </button>
            </div>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              {taskToEdit ? 'Edit Task' : 'Create New Task'}
            </h2>
            <p className="text-xs text-white/50">
              {taskToEdit
                ? `Version #${taskToEdit.version} • Changes sync live across all windows`
                : 'Added instantly to the collaborative board in real-time'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <label className="font-semibold text-white/80">Task Title *</label>
            <input
              type="text"
              placeholder="e.g. Implement Realtime WebSockets"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 focus:bg-white/10"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-semibold text-white/80">Description</label>
            <textarea
              rows={3}
              placeholder="Add key context, acceptance criteria, or design notes..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 focus:bg-white/10 resize-none"
            />
          </div>

          {/* Project & Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-white/80">Project</label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/15 text-white focus:outline-none focus:border-white/40"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-white/80">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/15 text-white focus:outline-none focus:border-white/40"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Priority & Assignee Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-white/80">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/15 text-white focus:outline-none focus:border-white/40"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-white/80">Assignee</label>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setIsInviteModalOpen(true);
                  }}
                  className="text-[11px] text-amber-300 hover:text-amber-200 font-semibold flex items-center gap-1 transition-colors"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>Invite Teammate</span>
                </button>
              </div>
              <select
                value={assignedTo?.id || 'unassigned'}
                onChange={e => {
                  const val = e.target.value;
                  if (val === currentUser?.id) {
                    setAssignedTo(currentUser);
                  } else {
                    const mem = projectMembers.find(m => m.user.id === val);
                    if (mem) {
                      setAssignedTo(mem.user);
                    } else {
                      setAssignedTo(defaultUser);
                    }
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/15 text-white focus:outline-none focus:border-white/40"
              >
                {currentUser && (
                  <option value={currentUser.id}>
                    {currentUser.name} (You)
                  </option>
                )}
                {projectMembers
                  .filter(m => m.user.id !== currentUser?.id)
                  .map(m => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.name} ({m.role === 'admin' ? 'Admin' : 'Member'})
                    </option>
                  ))}
                {!currentUser && projectMembers.length === 0 && (
                  <option value="unassigned">Unassigned</option>
                )}
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-1">
            <label className="font-semibold text-white/80">Deadline</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-white/15 text-white focus:outline-none focus:border-white/40"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            {taskToEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-white text-zinc-950 font-bold hover:bg-white/90 active:scale-95 transition-all shadow-lg"
              >
                {taskToEdit ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
