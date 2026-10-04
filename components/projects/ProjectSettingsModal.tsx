'use client';

import React, { useState, useEffect } from 'react';
import { useTaskContext } from '@/context/TaskContext';
import {
  X,
  Settings,
  Shield,
  Trash2,
  Check,
  Copy,
  AlertTriangle,
  FolderEdit,
  Palette,
  AlignLeft,
} from 'lucide-react';

const COLOR_OPTIONS = [
  '#6366F1',
  '#EC4899',
  '#10B981',
  '#F59E0B',
  '#3B82F6',
  '#8B5CF6',
  '#EF4444',
  '#14B8A6',
];

export const ProjectSettingsModal: React.FC = () => {
  const {
    isProjectSettingsOpen,
    closeProjectSettings,
    projectToEdit,
    updateProject,
    deleteProject,
  } = useTaskContext();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366F1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name || '');
      setDescription(projectToEdit.description || '');
      setColor(projectToEdit.color || '#6366F1');
      setConfirmDelete(false);
    }
  }, [projectToEdit]);

  if (!isProjectSettingsOpen || !projectToEdit) return null;

  const isAdmin = projectToEdit.role === 'admin';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const result = await updateProject(projectToEdit.id, {
      name: name.trim(),
      description: description.trim(),
      color,
    });
    setIsSubmitting(false);

    if (result) {
      closeProjectSettings();
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setIsDeleting(true);
    const success = await deleteProject(projectToEdit.id);
    setIsDeleting(false);

    if (success) {
      closeProjectSettings();
    }
  };

  const copyInviteCode = () => {
    if (!projectToEdit.inviteCode) return;
    navigator.clipboard.writeText(projectToEdit.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
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
        {/* Left notebook binding margin with hole punches */}
        <div className="absolute top-0 bottom-0 left-0 w-7 border-r-2 border-dashed border-[#8d6943]/40 flex flex-col justify-around items-center py-6 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-3 h-3 rounded-full bg-[#1b120a] shadow-inner" />
          ))}
        </div>

        <div className="pl-5 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm"
                style={{ backgroundColor: color }}
              >
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black tracking-tight text-[#1e1308]">
                    Workspace Settings
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1e1308] text-[#fbf3e9] text-[10px] font-bold">
                    <Shield className="w-3 h-3 text-amber-400" />
                    Admin
                  </span>
                </div>
                <p className="text-xs text-[#523d28]">
                  Edit workspace details or manage project deletion
                </p>
              </div>
            </div>

            <button
              onClick={closeProjectSettings}
              className="p-1.5 rounded-xl bg-[#dfccaF] hover:bg-[#eee0ce] text-[#342414] hover:text-black border border-[#a88258]/60 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!isAdmin ? (
            <div className="p-5 rounded-2xl bg-[#dfccaF]/90 border border-amber-900/30 space-y-3 text-center">
              <Shield className="w-7 h-7 mx-auto text-amber-900" />
              <div className="text-sm font-bold text-[#22170d]">Admin Permissions Required</div>
              <p className="text-xs text-[#523d28]">
                Only project administrators can rename or delete this workspace. Please contact the project creator.
              </p>
              <button
                onClick={closeProjectSettings}
                className="px-4 py-1.5 rounded-xl bg-[#1e1308] text-[#fbf3e9] text-xs font-bold hover:bg-[#342211] transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              {/* Project Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#281a0e] flex items-center gap-1.5">
                  <FolderEdit className="w-3.5 h-3.5 text-[#5e4125]" />
                  <span>Workspace Name</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Marketing Launch, Core App"
                  required
                  className="w-full px-3 py-2 text-xs font-semibold bg-[#f4e6d3] border-2 border-[#a88258] rounded-xl text-[#24170c] placeholder:text-[#88694b] focus:outline-none focus:border-[#4a341f] shadow-inner"
                />
              </div>

              {/* Color Theme Palette */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#281a0e] flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-[#5e4125]" />
                  <span>Workspace Color</span>
                </label>
                <div className="flex items-center gap-2 flex-wrap p-2 rounded-xl bg-[#dfccaF]/70 border border-[#a88258]/50">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full transition-all relative flex items-center justify-center ${
                        color === c ? 'scale-110 ring-2 ring-[#1e1308] shadow-md' : 'hover:scale-105 opacity-80'
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    >
                      {color === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#281a0e] flex items-center gap-1.5">
                  <AlignLeft className="w-3.5 h-3.5 text-[#5e4125]" />
                  <span>Description (Optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Describe the workspace purpose, team, or goals..."
                  className="w-full px-3 py-2 text-xs bg-[#f4e6d3] border-2 border-[#a88258] rounded-xl text-[#24170c] placeholder:text-[#88694b] focus:outline-none focus:border-[#4a341f] shadow-inner resize-none"
                />
              </div>

              {/* Invite Code Quick Reference */}
              <div className="p-2.5 rounded-xl bg-[#dfccaF]/60 border border-[#a88258]/60 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[11px] font-bold text-[#5c4228]">Invite Code: </span>
                  <span className="font-mono font-black text-[#1e1308]">{projectToEdit.inviteCode}</span>
                </div>
                <button
                  type="button"
                  onClick={copyInviteCode}
                  className="px-2 py-1 rounded-lg bg-[#1e1308] text-[#fbf3e9] hover:bg-[#342211] text-[10px] font-bold flex items-center gap-1 transition-colors"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#a88258]/40">
                <button
                  type="button"
                  onClick={closeProjectSettings}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#44301c] hover:bg-[#dfccaF] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1e1308] hover:bg-[#342211] text-[#fbf3e9] text-xs font-bold shadow-md transition-colors disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>

              {/* Danger Zone: Delete Project */}
              <div className="mt-4 pt-3 border-t-2 border-dashed border-red-900/30 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="text-xs font-black text-red-950 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-800" />
                      <span>Danger Zone</span>
                    </div>
                    <p className="text-[10px] text-red-950/70">
                      Permanently delete this project and all associated tasks.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all ${
                      confirmDelete
                        ? 'bg-red-800 text-white hover:bg-red-900 animate-pulse'
                        : 'bg-red-950/15 text-red-950 hover:bg-red-900 hover:text-white border border-red-900/30'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>
                      {isDeleting
                        ? 'Deleting...'
                        : confirmDelete
                        ? 'Confirm Delete?'
                        : 'Delete Project'}
                    </span>
                  </button>
                </div>
                {confirmDelete && (
                  <div className="p-2 rounded-lg bg-red-900/10 border border-red-900/30 text-[11px] text-red-950 font-semibold flex items-center justify-between">
                    <span>Click the red button again to permanently delete.</span>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="text-[10px] underline hover:text-black font-bold ml-2"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
