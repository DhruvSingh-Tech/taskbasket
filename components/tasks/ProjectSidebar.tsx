'use client';

import React, { useState } from 'react';
import { useTaskContext } from '@/context/TaskContext';
import { Plus, Check, X, Layers, UserPlus, Hash, Shield, Sparkles } from 'lucide-react';

export const ProjectSidebar: React.FC = () => {
  const {
    projects,
    activeProjectId,
    setActiveProjectId,
    createProject,
    tasks,
    setIsInviteModalOpen,
    setIsJoinModalOpen,
  } = useTaskContext();

  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#6366F1');

  const colorOptions = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    await createProject(newProjectName.trim(), selectedColor);
    setNewProjectName('');
    setIsCreating(false);
  };

  const getTaskCount = (projId: string) => {
    return tasks.filter((t) => t.projectId === projId).length;
  };

  return (
    <aside
      className="w-full flex-1 flex flex-col rounded-3xl p-4 sm:p-5 bg-[#caa477] border border-[#a88258]/70 shadow-2xl min-h-0 overflow-hidden relative text-[#22170d]"
      style={{
        backgroundImage: `
          radial-gradient(rgba(45, 30, 15, 0.12) 1.2px, transparent 1.2px),
          repeating-linear-gradient(transparent, transparent 31px, rgba(45, 30, 15, 0.05) 32px)
        `,
        backgroundSize: '24px 24px, 100% 32px',
      }}
    >
      {/* Top Paper Header Accent Line */}
      <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-[#8a6842]/40 to-transparent pointer-events-none" />

      {/* Sidebar Header */}
      <div className="flex items-center justify-between gap-2 mb-4 px-1 shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#44301c]" />
          <h2 className="text-sm font-black tracking-tight text-[#22170d] uppercase">
            Workspaces
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsJoinModalOpen(true)}
            className="px-2 py-1 rounded-xl bg-[#dfccaF]/90 hover:bg-[#eee0ce] text-[#342414] hover:text-black border border-[#a88258]/60 shadow-sm transition-colors text-[11px] font-bold flex items-center gap-1"
            title="Join with Code"
          >
            <Hash className="w-3 h-3" />
            <span className="hidden sm:inline">Join</span>
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="p-1.5 rounded-xl bg-[#1e1308] hover:bg-[#342211] text-[#fbf3e9] shadow-sm transition-colors"
            title="Create New Project"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Inline Create Project Input */}
      {isCreating && (
        <form onSubmit={handleCreate} className="mb-3.5 p-3 rounded-2xl bg-[#dfccaF]/90 border border-[#a88258]/70 shadow-sm space-y-2 shrink-0">
          <input
            type="text"
            placeholder="Project name..."
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            autoFocus
            className="w-full px-2.5 py-1 text-xs bg-[#f4e6d3] border border-[#a88258]/70 rounded-xl text-[#24170c] placeholder:text-[#785b3d] focus:outline-none focus:border-[#523920]"
          />

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              {colorOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`w-3.5 h-3.5 rounded-full transition-transform ${
                    selectedColor === c ? 'scale-125 ring-2 ring-[#22170d]' : 'opacity-75 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="submit"
                className="p-1 rounded-md bg-[#1e1308] text-[#fbf3e9] hover:bg-[#342211] transition-colors"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="p-1 rounded-md bg-[#caa477] text-[#4a341f] hover:text-black transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Projects List */}
      <nav className="space-y-2 flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-0.5">
        {projects.length === 0 ? (
          <div className="p-4 rounded-2xl bg-[#dfccaF]/50 border border-dashed border-[#a88258] text-center space-y-2.5 my-2">
            <Sparkles className="w-5 h-5 mx-auto text-[#785b3d]" />
            <div className="text-xs font-black text-[#24170c]">No Projects Yet</div>
            <p className="text-[11px] text-[#523d28]">
              Create your first project or join with an invite code.
            </p>
            <div className="flex flex-col gap-1.5 pt-1">
              <button
                onClick={() => setIsCreating(true)}
                className="w-full py-1.5 rounded-xl bg-[#1e1308] text-[#fbf3e9] text-xs font-bold hover:bg-[#342211] transition-colors"
              >
                + Create Project
              </button>
              <button
                onClick={() => setIsJoinModalOpen(true)}
                className="w-full py-1.5 rounded-xl bg-[#dfccaF] border border-[#a88258] text-[#24170c] text-xs font-bold hover:bg-[#eee0ce] transition-colors"
              >
                Join with Code
              </button>
            </div>
          </div>
        ) : (
          projects.map((project) => {
            const isActive = activeProjectId === project.id;
            const count = getTaskCount(project.id);
            const isAdmin = project.role === 'admin';

            return (
              <div
                key={project.id}
                onClick={() => setActiveProjectId(project.id)}
                className={`group w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs cursor-pointer transition-all ${
                  isActive
                    ? 'bg-[#f4e6d3] border-2 border-[#8b653b] text-[#22170d] font-black shadow-md ring-1 ring-[#8b653b]/20'
                    : 'bg-[#e4d1b8]/80 hover:bg-[#eee0ce] border border-[#a88258]/50 text-[#3b2a1a] hover:text-black font-semibold'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: project.color || '#6366F1' }}
                  />
                  <div className="truncate flex-1 min-w-0">
                    <div className="truncate tracking-tight flex items-center gap-1.5">
                      <span>{project.name}</span>
                      {isAdmin && (
                        <span title="Project Admin">
                          <Shield className="w-3 h-3 text-amber-800 shrink-0" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {isActive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsInviteModalOpen(true);
                      }}
                      className="p-1 rounded-lg bg-[#b79166]/60 hover:bg-[#1e1308] hover:text-[#fbf3e9] text-[#22170d] transition-colors"
                      title="Invite Teammates"
                    >
                      <UserPlus className="w-3 h-3" />
                    </button>
                  )}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#22170d]/15 text-[#22170d] font-mono font-bold">
                    {count}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </nav>
    </aside>
  );
};
