'use client';

import React, { useState } from 'react';
import { useTaskContext } from '@/context/TaskContext';
import {
  Search,
  Filter,
  Plus,
  LayoutGrid,
  List,
  Wifi,
  History,
  X,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';

interface TaskToolbarProps {
  onOpenCreate: () => void;
  onToggleActivity: () => void;
  unreadActivitiesCount?: number;
}

export const TaskToolbar: React.FC<TaskToolbarProps> = ({
  onOpenCreate,
  onToggleActivity,
  unreadActivitiesCount = 0
}) => {
  const {
    searchQuery,
    setSearchQuery,
    filterPriority,
    setFilterPriority,
    filterAssignee,
    setFilterAssignee,
    viewMode,
    setViewMode,
    collaborators,
    projectMembers,
    resetToDefaultData
  } = useTaskContext();

  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const hasActiveFilters =
    filterPriority !== 'all' || filterAssignee !== 'all' || searchQuery.trim() !== '';

  const clearFilters = () => {
    setSearchQuery('');
    setFilterPriority('all');
    setFilterAssignee('all');
  };

  return (
    <div className="w-full flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 sm:p-4 rounded-3xl bg-zinc-950/40 backdrop-blur-2xl border border-white/10 shadow-2xl">
      {/* Left side: Search & Filters */}
      <div className="flex flex-1 items-center gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search tasks, tags, or assignees..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/40 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-white/40 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Trigger Button */}
        <div className="relative">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-medium border transition-all ${
              hasActiveFilters
                ? 'bg-white/20 border-white/30 text-white shadow-md'
                : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            )}
          </button>

          {/* Filter Popover */}
          {showFilterMenu && (
            <div className="absolute left-0 top-11 z-40 w-64 rounded-2xl bg-zinc-900/95 backdrop-blur-2xl border border-white/15 p-3.5 shadow-2xl text-xs text-white space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="font-semibold text-white/90">Filter Tasks</span>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-[10px] text-sky-400 hover:underline"
                  >
                    Reset all
                  </button>
                )}
              </div>

              {/* Priority Filter */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-white/60">Priority</label>
                <select
                  value={filterPriority}
                  onChange={e => setFilterPriority(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30"
                >
                  <option value="all" className="bg-zinc-900">All Priorities</option>
                  <option value="urgent" className="bg-zinc-900">Urgent</option>
                  <option value="high" className="bg-zinc-900">High</option>
                  <option value="medium" className="bg-zinc-900">Medium</option>
                  <option value="low" className="bg-zinc-900">Low</option>
                </select>
              </div>

              {/* Assignee Filter */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-white/60">Assignee</label>
                <select
                  value={filterAssignee}
                  onChange={e => setFilterAssignee(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30"
                >
                  <option value="all" className="bg-zinc-900">All Assignees</option>
                  {projectMembers.map(m => (
                    <option key={m.user.id} value={m.user.id} className="bg-zinc-900">
                      {m.user.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side: Realtime status, View mode, Activity, + Task */}
      <div className="flex items-center gap-2.5 flex-wrap justify-between md:justify-end">
        {/* Realtime Live Sync Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-medium text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="hidden sm:inline">Live Sync</span>
          <span className="text-[10px] text-emerald-400/80 font-mono">
            ({collaborators.length + 1} online)
          </span>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-2xl">
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-1.5 rounded-xl transition-all ${
              viewMode === 'kanban'
                ? 'bg-white text-zinc-950 shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
            title="Kanban Board View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-xl transition-all ${
              viewMode === 'list'
                ? 'bg-white text-zinc-950 shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
            title="List View"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Activity Log Button */}
        <button
          onClick={onToggleActivity}
          className="relative p-2 rounded-2xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 transition-colors"
          title="Activity Log"
        >
          <History className="w-4 h-4" />
          {unreadActivitiesCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-sky-500 text-[10px] font-bold text-white flex items-center justify-center">
              {unreadActivitiesCount}
            </span>
          )}
        </button>

        {/* Reset Demo Data Button */}
        <button
          onClick={resetToDefaultData}
          className="p-2 rounded-2xl bg-white/5 hover:bg-white/15 text-white/50 hover:text-white border border-white/10 transition-colors"
          title="Reset to default tasks"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Create Task Button */}
        <button
          onClick={onOpenCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-zinc-950 bg-white hover:bg-white/90 active:scale-95 rounded-2xl shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>
    </div>
  );
};
