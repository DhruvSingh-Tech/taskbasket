'use client';

import React, { useState, useMemo } from 'react';
import { useTaskContext } from '@/context/TaskContext';
import { Task, TaskStatus } from '@/types/task';
import { NavbarPill } from './NavbarPill';
import { ProjectSidebar } from './ProjectSidebar';
import { TaskColumn } from './TaskColumn';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { ActivityDrawer } from './ActivityDrawer';
import { CollaboratorsBar } from './CollaboratorsBar';
import { NotificationToasts } from './NotificationToasts';
import { AuthModal } from '@/components/auth/AuthModal';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { InviteModal } from '@/components/projects/InviteModal';
import { JoinProjectModal } from '@/components/projects/JoinProjectModal';
import {
  Filter,
  Plus,
  Search,
  LayoutGrid,
  List,
  History,
  RotateCcw,
  X,
  FileText,
  Wifi,
  WifiOff,
  UserPlus,
  Sparkles,
  Hash
} from 'lucide-react';

export const TaskBoard: React.FC = () => {
  const {
    tasks,
    projects,
    activeProjectId,
    activeProject,
    projectMembers,
    searchQuery,
    setSearchQuery,
    filterPriority,
    setFilterPriority,
    filterAssignee,
    setFilterAssignee,
    viewMode,
    setViewMode,
    collaborators,
    resetToDefaultData,
    activities,
    isWsConnected,
    isAuthModalOpen,
    setIsAuthModalOpen,
    setIsInviteModalOpen,
    setIsJoinModalOpen,
    isAuthenticated,
    isAuthLoading,
  } = useTaskContext();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [modalDefaultStatus, setModalDefaultStatus] = useState<TaskStatus>('todo');
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const hasActiveFilters = filterPriority !== 'all' || filterAssignee !== 'all';

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Project filter
      if (activeProjectId !== 'all' && task.projectId !== activeProjectId) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = task.description.toLowerCase().includes(query);
        const matchesAssignee = task.assignedTo.name.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesAssignee) return false;
      }

      // Priority filter
      if (filterPriority !== 'all' && task.priority !== filterPriority) {
        return false;
      }

      // Assignee filter
      if (filterAssignee !== 'all' && task.assignedTo.id !== filterAssignee) {
        return false;
      }

      return true;
    });
  }, [tasks, activeProjectId, searchQuery, filterPriority, filterAssignee]);

  const todoTasks = useMemo(
    () => filteredTasks.filter(t => t.status === 'todo'),
    [filteredTasks]
  );
  const inProgressTasks = useMemo(
    () => filteredTasks.filter(t => t.status === 'in-progress'),
    [filteredTasks]
  );
  const completedTasks = useMemo(
    () => filteredTasks.filter(t => t.status === 'completed'),
    [filteredTasks]
  );

  const handleOpenCreate = (status: TaskStatus = 'todo') => {
    setTaskToEdit(null);
    setModalDefaultStatus(status);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  if (isAuthLoading) {
    return (
      <div className="w-full flex-1 flex items-center justify-center">
        <div className="p-8 rounded-3xl bg-[#caa477] border-2 border-[#a88258] shadow-2xl text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#1e1308] border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-sm font-black text-[#1e1308]">Loading TaskBasket...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="w-full flex-1 flex flex-col justify-center items-center">
        <AuthScreen />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex-1 flex flex-col lg:flex-row items-stretch gap-4 min-h-0 overflow-hidden">
      {/* LEFT COLUMN: Navbar Pill at top + Projects Sidebar underneath */}
      <div className="w-full lg:w-64 xl:w-72 h-full flex flex-col gap-3 shrink-0 min-h-0">
        <NavbarPill />
        <ProjectSidebar />
      </div>

      {/* RIGHT COLUMN: Yellow-Brownish Paper Task Board with Left Binding Spine (Zero Top Gap) */}
      <main className="flex-1 w-full h-full flex flex-row rounded-3xl bg-[#caa477] border border-[#a88258]/70 shadow-2xl min-h-0 overflow-hidden relative text-[#22170d]">
        {/* Notebook Binding Spine on Left Edge matching image annotations */}
        <div
          className="w-7 sm:w-9 h-full shrink-0 flex flex-col items-center justify-between py-6 rounded-l-3xl border-r-2 border-dashed border-[#573918]/30 shadow-[inset_-3px_0_6px_rgba(0,0,0,0.25)] relative overflow-hidden"
          style={{
            background:
              'linear-gradient(to right, #7a542b 0%, #aa804c 35%, #8f653a 75%, #684620 100%)'
          }}
        >
          {/* Subtle Spine Highlights and Stitches */}
          <div className="absolute inset-y-0 left-1 w-[1.5px] bg-white/20 rounded-full" />
          <div className="flex flex-col gap-8 opacity-40">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="w-2.5 h-[1.5px] bg-[#3a220b] rounded-full" />
            ))}
          </div>
        </div>

        {/* Paper Workspace Content Area */}
        <div
          className="flex-1 h-full min-h-0 flex flex-col overflow-hidden relative"
          style={{
            backgroundImage: `
              radial-gradient(rgba(45, 30, 15, 0.12) 1.2px, transparent 1.2px),
              repeating-linear-gradient(transparent, transparent 31px, rgba(45, 30, 15, 0.05) 32px)
            `,
            backgroundSize: '24px 24px, 100% 32px'
          }}
        >
          {/* 1. SEAMLESS ATTACHED TOOLBAR (Top row of the board, aligned with NavbarPill, no gap) */}
          <div className="w-full flex items-center justify-between gap-3 p-3 sm:p-3.5 pb-2.5 border-b border-[#a88258]/40 shrink-0 bg-transparent">
            {/* Search Input on Yellow-Brown Paper */}
            <div className="relative flex-1 max-w-xs sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#674e33]" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-[#e8d5bc]/95 hover:bg-[#f2e2cb] focus:bg-[#f5e7d2] border border-[#a88258]/70 rounded-xl text-[#24170c] placeholder:text-[#785b3d] focus:outline-none focus:border-[#523920] shadow-sm transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#785b3d] hover:text-[#24170c]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Toolbar Actions: Live Sync, View Switcher, Activity, Reset */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* Live Sync Status with WebSocket / Local Fallback indication */}
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 transition-colors ${
                  isWsConnected
                    ? 'bg-emerald-900/15 border border-emerald-900/25 text-emerald-950'
                    : 'bg-amber-900/15 border border-amber-900/25 text-amber-950'
                }`}
                title={isWsConnected ? 'Connected to WebSocket Server' : 'Running on Local Tab Sync (BroadcastChannel)'}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isWsConnected ? 'bg-emerald-700 animate-pulse' : 'bg-amber-700'
                  }`}
                />
                <span className="hidden sm:inline">
                  {isWsConnected ? 'WS Sync' : 'Local Sync'}
                </span>
                <span className="text-[10px] font-mono font-bold">
                  ({collaborators.length + 1})
                </span>
              </div>

              {/* View Switcher */}
              <div className="flex items-center p-0.5 bg-[#b59066]/50 border border-[#9b7850]/50 rounded-xl shrink-0">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`p-1 rounded-lg transition-all ${
                    viewMode === 'kanban'
                      ? 'bg-[#f4e6d3] text-[#22170d] shadow-sm font-black'
                      : 'text-[#44301c] hover:text-[#1a1108]'
                  }`}
                  title="Kanban Board"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-[#f4e6d3] text-[#22170d] shadow-sm font-black'
                      : 'text-[#44301c] hover:text-[#1a1108]'
                  }`}
                  title="List View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Activity Log Button */}
              <button
                onClick={() => setIsActivityOpen(!isActivityOpen)}
                className="relative p-1.5 rounded-xl bg-[#dfccaF]/90 hover:bg-[#eee0ce] text-[#342414] hover:text-black border border-[#a88258]/60 shadow-sm transition-colors shrink-0"
                title="Activity Log"
              >
                <History className="w-3.5 h-3.5" />
                {activities.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-blue-700 text-[9px] font-bold text-white flex items-center justify-center">
                    {activities.length > 9 ? '9+' : activities.length}
                  </span>
                )}
              </button>

              {/* Reset Demo Data */}
              <button
                onClick={resetToDefaultData}
                className="p-1.5 rounded-xl bg-[#dfccaF]/90 hover:bg-[#eee0ce] text-[#4a341f] hover:text-black border border-[#a88258]/60 shadow-sm transition-colors shrink-0"
                title="Reset demo data"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 2. TASKS BOARD CONTENT AREA */}
          <div className="flex-1 w-full h-full flex flex-col p-3.5 sm:p-4 pt-2.5 min-h-0 overflow-hidden">
            {/* TASKS Header Row */}
            <div className="flex items-center justify-between gap-3 pb-2.5 mb-3 border-b border-[#a88258]/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#44301c]" />
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#22170d] uppercase">
                    TASKS
                  </h1>
                </div>

                {/* Filter Button right next to TASKS */}
                <div className="relative">
                  <button
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      hasActiveFilters
                        ? 'bg-[#22170d] text-[#f7ede0] border-[#22170d] shadow-sm'
                        : 'bg-[#e4d1b8]/95 hover:bg-[#f0dfcb] border-[#a88258]/70 text-[#281a0e] shadow-sm'
                    }`}
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>Filter</span>
                    {hasActiveFilters && (
                      <span className="w-2 h-2 rounded-full bg-amber-800" />
                    )}
                  </button>

                  {/* Filter Dropdown Popover */}
                  {showFilterDropdown && (
                    <div className="absolute left-0 top-10 z-40 w-60 rounded-2xl bg-[#281b10] border border-[#5a3f28] p-3.5 shadow-2xl text-xs text-[#f5ebd8] space-y-2.5">
                      <div className="flex items-center justify-between pb-1.5 border-b border-[#5a3f28]">
                        <span className="font-bold text-white">Filter Tasks</span>
                        {hasActiveFilters && (
                          <button
                            onClick={() => {
                              setFilterPriority('all');
                              setFilterAssignee('all');
                            }}
                            className="text-[10px] text-amber-400 hover:underline"
                          >
                            Reset
                          </button>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-amber-200/70">Priority</label>
                        <select
                          value={filterPriority}
                          onChange={e => setFilterPriority(e.target.value)}
                          className="w-full px-2 py-1 text-xs bg-[#1a110a] border border-[#5a3f28] rounded-lg text-white focus:outline-none"
                        >
                          <option value="all">All Priorities</option>
                          <option value="urgent">Urgent</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-amber-200/70">Assignee</label>
                        <select
                          value={filterAssignee}
                          onChange={e => setFilterAssignee(e.target.value)}
                          className="w-full px-2 py-1 text-xs bg-[#1a110a] border border-[#5a3f28] rounded-lg text-white focus:outline-none"
                        >
                          <option value="all">All Assignees</option>
                          {projectMembers.map(m => (
                            <option key={m.user.id} value={m.user.id}>
                              {m.user.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Project Name Badge & Invite code */}
                {activeProject && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-[#24170d]/10 border border-[#24170d]/20 text-[#24170d]">
                      {activeProject.name}
                    </span>
                    {activeProject.inviteCode && (
                      <button
                        onClick={() => setIsInviteModalOpen(true)}
                        className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-[#dfccaF]/90 hover:bg-[#eee0ce] border border-[#a88258]/70 text-[#22170d] flex items-center gap-1.5 transition-colors shadow-sm"
                        title="Click to copy invite link & code"
                      >
                        <UserPlus className="w-3 h-3 text-[#523d28]" />
                        <span>Code: {activeProject.inviteCode}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Right side: Task count, Invite Button & + NEW TASK BUTTON */}
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-[#523d28] font-bold">
                  {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
                </span>

                {/* Invite Teammates button */}
                {activeProject && (
                  <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#24170c] bg-[#dfccaF]/90 hover:bg-[#eee0ce] border border-[#a88258]/70 rounded-xl shadow-sm transition-all shrink-0"
                    title="Invite Collaborators"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Invite</span>
                  </button>
                )}

                {/* + New Task Button */}
                <button
                  onClick={() => handleOpenCreate('todo')}
                  disabled={!activeProject}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black text-[#fbf3e9] bg-[#1e1308] hover:bg-[#342211] active:scale-95 rounded-xl shadow-md transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Task</span>
                </button>
              </div>
            </div>

            {/* 3 Columns Kanban Board or Zero-Project State */}
            {projects.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[#caa477] border-2 border-[#a88258] shadow-2xl text-center space-y-4 text-[#22170d]">
                  <div className="w-12 h-12 rounded-2xl bg-[#1e1308] text-[#fbf3e9] flex items-center justify-center mx-auto shadow-md">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-black text-[#1e1308]">Welcome to TaskBasket</h2>
                  <p className="text-xs text-[#523d28]">
                    You haven&apos;t joined any project yet. Create your first workspace to start adding tasks, or join an existing workspace with an invite code.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                    <button
                      onClick={() => setIsJoinModalOpen(true)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1e1308] text-[#fbf3e9] text-xs font-bold hover:bg-[#342211] shadow transition-all flex items-center justify-center gap-1.5"
                    >
                      <Hash className="w-3.5 h-3.5" />
                      <span>Join with Code</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : viewMode === 'kanban' ? (
              <div className="grid grid-cols-3 gap-3.5 sm:gap-4 flex-1 min-h-0 h-full items-stretch">
                {/* To Do Column (Burgundy Theme) */}
                <TaskColumn
                  status="todo"
                  title="To Do"
                  tasks={todoTasks}
                  onOpenCreate={handleOpenCreate}
                  onEditTask={handleEditTask}
                />

                {/* In Progress Column (Navy Theme) */}
                <TaskColumn
                  status="in-progress"
                  title="In Progress"
                  tasks={inProgressTasks}
                  onOpenCreate={handleOpenCreate}
                  onEditTask={handleEditTask}
                />

                {/* Completed Column (Teal Theme) */}
                <TaskColumn
                  status="completed"
                  title="Completed"
                  tasks={completedTasks}
                  onOpenCreate={handleOpenCreate}
                  onEditTask={handleEditTask}
                />
              </div>
            ) : (
              /* List View Mode */
              <div className="space-y-2 flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-0.5">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-20 text-[#674e33] text-sm font-semibold">
                    No tasks found matching your filters.
                  </div>
                ) : (
                  filteredTasks.map(task => (
                    <TaskCard key={task.id} task={task} onEdit={handleEditTask} />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Task Create / Edit Dialog */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskToEdit={taskToEdit}
        defaultStatus={modalDefaultStatus}
      />

      {/* Activity History Drawer */}
      <ActivityDrawer
        isOpen={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
      />

      {/* Better Auth Modal (Sign In / Sign Up / Session profile) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Project Invite Modal */}
      <InviteModal />

      {/* Join Project Modal */}
      <JoinProjectModal />

      {/* Floating Bottom-Right Collaborators Pill */}
      <CollaboratorsBar />

      {/* Live Toast Notifications */}
      <NotificationToasts />
    </div>
  );
};
