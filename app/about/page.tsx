import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Wifi, RefreshCw, ShieldCheck, Layers, Users, Zap, CheckCircle } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 text-white space-y-10">
      {/* Back Button */}
      <div>
        <Link
          href="/tasks"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Live Task Board</span>
        </Link>
      </div>

      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-xs font-semibold text-sky-400">
          <Zap className="w-3.5 h-3.5" />
          <span>Realtime Synchronization Architecture</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
          TaskBasket Collaborative Engine
        </h1>
        <p className="text-sm sm:text-base text-white/70 leading-relaxed max-w-2xl">
          A high-performance collaborative task board built with Next.js, frosted glassmorphic UI, and multi-tab realtime event synchronization.
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-3xl bg-zinc-950/40 backdrop-blur-2xl border border-white/10 space-y-2.5 shadow-xl">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
            <Wifi className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold">Zero-Latency Realtime Synchronization</h2>
          <p className="text-xs text-white/70 leading-relaxed">
            Uses the browser <code className="text-sky-300 bg-white/10 px-1.5 py-0.5 rounded">BroadcastChannel API</code> coupled with <code className="text-sky-300 bg-white/10 px-1.5 py-0.5 rounded">localStorage</code> and storage event fallback. Task creation, edits, deletes, and movements broadcast instantly to all connected browser windows without requiring page refresh.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-zinc-950/40 backdrop-blur-2xl border border-white/10 space-y-2.5 shadow-xl">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold">Optimistic Locking & Conflict Resolution</h2>
          <p className="text-xs text-white/70 leading-relaxed">
            Every task maintains an incremental monotonic version tag and timestamp. If two collaborators concurrently edit the same task, TaskBasket identifies the version collision, alerts the active editor with a visual diff banner, and offers resolution options.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-zinc-950/40 backdrop-blur-2xl border border-white/10 space-y-2.5 shadow-xl">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
            <Users className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold">Live Presence & Collaborator Heartbeats</h2>
          <p className="text-xs text-white/70 leading-relaxed">
            Each browser window sends presence heartbeats every 3 seconds. The bottom-right floating Collaborators widget displays active users and lets you switch personas across windows to test concurrent workflows effortlessly.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-zinc-950/40 backdrop-blur-2xl border border-white/10 space-y-2.5 shadow-xl">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
            <Layers className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold">Drag-and-Drop & Auditable History</h2>
          <p className="text-xs text-white/70 leading-relaxed">
            Drag cards across To Do, In Progress, and Completed columns. All lifecycle events are written to an auditable chronological activity stream with actor attributions and timestamps.
          </p>
        </div>
      </div>

      {/* How to Test 2 Browser Windows */}
      <div className="p-6 rounded-3xl bg-zinc-950/50 backdrop-blur-2xl border border-white/15 space-y-4 shadow-2xl">
        <h2 className="text-base font-bold flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span>How to Test Realtime Sync Across Two Windows</span>
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-xs text-white/80 leading-relaxed">
          <li>
            Open <Link href="/tasks" className="text-sky-400 underline">TaskBasket (/tasks)</Link> in two side-by-side browser windows or tabs.
          </li>
          <li>
            In Window A, click the bottom-right <strong>collaborators</strong> pill and select <em>Dhruv Dev</em>.
          </li>
          <li>
            In Window B, click <strong>collaborators</strong> and switch to <em>Sarah Chen</em>.
          </li>
          <li>
            Drag a card or create a new task in Window A: notice it appears <strong>instantly in Window B without refreshing</strong>!
          </li>
          <li>
            Open the same task in Window A and Window B to observe live editing locks and conflict handling.
          </li>
        </ol>
      </div>
    </div>
  );
}
