'use client';

import React from 'react';
import { TaskProvider } from '@/context/TaskContext';
import { TaskBoard } from '@/components/tasks/TaskBoard';

export default function TasksPage() {
  return (
    <TaskProvider>
      <div className="w-full flex-1 flex flex-col">
        <TaskBoard />
      </div>
    </TaskProvider>
  );
}
