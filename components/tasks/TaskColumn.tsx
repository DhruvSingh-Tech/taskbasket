'use client';

import React, { useState } from 'react';
import { Task, TaskStatus } from '@/types/task';
import { TaskCard } from './TaskCard';
import { useTaskContext } from '@/context/TaskContext';
import { Plus, CircleDot, PlayCircle, CheckCircle2 } from 'lucide-react';

interface TaskColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onOpenCreate: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
}

export const TaskColumn: React.FC<TaskColumnProps> = ({
  status,
  title,
  tasks,
  onOpenCreate,
  onEditTask
}) => {
  const { moveTask } = useTaskContext();
  const [isDragOver, setIsDragOver] = useState(false);

  // Column header icons & styling
  const getHeaderIcon = () => {
    switch (status) {
      case 'todo':
        return <CircleDot className="w-3.5 h-3.5 text-rose-800" />;
      case 'in-progress':
        return <PlayCircle className="w-3.5 h-3.5 text-blue-800" />;
      case 'completed':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" />;
    }
  };

  const getColumnBg = () => {
    switch (status) {
      case 'todo':
        return 'bg-[#bc9080]/35 border-[#9a6452]/30 shadow-sm';
      case 'in-progress':
        return 'bg-[#8ba4bc]/35 border-[#5f7d98]/30 shadow-sm';
      case 'completed':
        return 'bg-[#8cb7a3]/35 border-[#5b8c75]/30 shadow-sm';
    }
  };

  // Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      moveTask(taskId, status);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`h-full flex flex-col rounded-3xl p-3 sm:p-3.5 backdrop-blur-sm border transition-all duration-300 min-h-0 overflow-hidden ${getColumnBg()} ${
        isDragOver ? 'ring-2 ring-[#22170d]/50 bg-white/30 scale-[1.005]' : ''
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between gap-2 mb-2.5 px-1 shrink-0">
        <div className="flex items-center gap-2">
          {getHeaderIcon()}
          <h2 className="text-xs font-black text-[#23170b] tracking-wider uppercase">
            {title}
          </h2>
          <span className="flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-[#23170b]/15 border border-[#23170b]/15 text-[10px] font-black text-[#23170b]">
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => onOpenCreate(status)}
          className="p-1 rounded-lg bg-[#e8d5bc]/80 hover:bg-[#f2e2cb] text-[#2c1d0c] hover:text-black border border-[#ad885c]/40 shadow-sm transition-colors"
          title={`Add task to ${title}`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Cards List / Droppable Area */}
      <div className="flex-1 min-h-0 space-y-2.5 overflow-y-auto pr-0.5 custom-scrollbar">
        {tasks.length === 0 ? (
          <div
            onClick={() => onOpenCreate(status)}
            className="flex flex-col items-center justify-center h-28 rounded-2xl border border-dashed border-[#8d6a45]/40 hover:border-[#63482d] bg-[#f0dfc8]/25 text-[#5e452a] hover:text-[#2a1d10] transition-all cursor-pointer p-3 text-center group"
          >
            <Plus className="w-4 h-4 mb-1 group-hover:scale-110 transition-transform text-[#5e452a]" />
            <span className="text-xs font-bold">No tasks</span>
            <span className="text-[10px] text-[#7a5e3e]">Drag or click to add</span>
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard key={task.id} task={task} onEdit={onEditTask} />
          ))
        )}
      </div>
    </div>
  );
};
