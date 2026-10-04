'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  Task,
  TaskStatus,
  TaskPriority,
  Project,
  ProjectMember,
  User,
  ActivityLog,
  ActivityType,
  CollaboratorSession,
  RealtimeEvent,
} from '@/types/task';
import { useSession } from '@/lib/auth-client';

export interface NotificationToast {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  timestamp: string;
}

interface TaskContextType {
  tasks: Task[];
  projects: Project[];
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
  activeProject: Project | null;
  projectMembers: ProjectMember[];
  activities: ActivityLog[];
  currentUser: User | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  setCurrentUser: (user: User) => void;
  collaborators: CollaboratorSession[];
  editingUsers: Record<string, { user: User; tabId: string }>;
  tabId: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterPriority: string;
  setFilterPriority: (p: string) => void;
  filterAssignee: string;
  setFilterAssignee: (a: string) => void;
  viewMode: 'kanban' | 'list';
  setViewMode: (m: 'kanban' | 'list') => void;

  // Realtime & Modals
  isWsConnected: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isInviteModalOpen: boolean;
  setIsInviteModalOpen: (open: boolean) => void;
  isJoinModalOpen: boolean;
  setIsJoinModalOpen: (open: boolean) => void;

  // Task operations
  createTask: (data: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    assignedTo: User;
    dueDate: string;
    projectId?: string;
  }) => Promise<Task | null>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (id: string, newStatus: TaskStatus) => Promise<void>;

  // Project operations
  createProject: (name: string, color?: string, description?: string) => Promise<Project | null>;
  updateProject: (id: string, data: { name?: string; description?: string; color?: string }) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<boolean>;
  joinProject: (code: string) => Promise<{ success: boolean; message?: string; error?: string; project?: Project }>;
  refreshProjects: () => Promise<void>;
  refreshTasks: (projectId?: string) => Promise<void>;
  refreshActivities: (projectId?: string) => Promise<void>;
  isProjectSettingsOpen: boolean;
  setIsProjectSettingsOpen: (isOpen: boolean) => void;
  projectToEdit: Project | null;
  openProjectSettings: (project: Project) => void;
  closeProjectSettings: () => void;

  // Realtime Presence / Lock Helpers
  startEditingTask: (taskId: string) => void;
  stopEditingTask: (taskId: string) => void;

  // Notifications & Conflicts
  notifications: NotificationToast[];
  removeNotification: (id: string) => void;
  conflictTask: { local: Partial<Task>; remote: Task } | null;
  resolveConflict: (resolution: 'use_mine' | 'use_theirs') => void;

  // Utilities
  resetToDefaultData: () => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: authSession, isPending: isAuthLoading } = useSession();

  const [tabId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return `tab_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    }
    return 'tab_ssr';
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [collaborators, setCollaborators] = useState<CollaboratorSession[]>([]);
  const [editingUsers, setEditingUsers] = useState<Record<string, { user: User; tabId: string }>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [notifications, setNotifications] = useState<NotificationToast[]>([]);
  const [conflictTask, setConflictTask] = useState<{ local: Partial<Task>; remote: Task } | null>(null);

  // Modals & WebSocket State
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState<boolean>(false);
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState<boolean>(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const activeEditingTaskIdRef = useRef<string | null>(null);
  const currentUserRef = useRef<User | null>(null);
  currentUserRef.current = currentUser;

  const activeProjectIdRef = useRef<string>(activeProjectId);
  activeProjectIdRef.current = activeProjectId;

  // Active project computed object
  const activeProject = projects.find((p) => p.id === activeProjectId) || null;

  // Notification helper
  const addNotification = useCallback((title: string, message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = `notif_${Date.now()}_${Math.random()}`;
    setNotifications((prev) => [
      { id, title, message, type, timestamp: new Date().toLocaleTimeString() },
      ...prev.slice(0, 4),
    ]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4500);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Broadcast helper
  const broadcast = useCallback((event: RealtimeEvent) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(event));
      } catch (err) {
        console.warn('[WS] Failed to send event:', err);
      }
    }
    if (channelRef.current) {
      channelRef.current.postMessage(event);
    }
  }, []);

  // Handle incoming event
  const handleIncomingEvent = useCallback(
    (event: RealtimeEvent) => {
      if (!event) return;

      switch (event.type) {
        case 'TASK_CREATED': {
          if (event.task.projectId === activeProjectIdRef.current) {
            setTasks((prev) => {
              if (prev.some((t) => t.id === event.task.id)) return prev;
              return [event.task, ...prev];
            });
            setActivities((prev) => [
              {
                id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                projectId: event.task.projectId,
                taskId: event.task.id,
                taskTitle: event.task.title,
                type: 'created',
                user: event.user,
                timestamp: event.timestamp || new Date().toISOString(),
                details: `Task "${event.task.title}" was created by ${event.user.name}`,
              },
              ...prev,
            ]);
            addNotification('Task Added', `${event.user.name} created "${event.task.title}"`, 'info');
          }
          break;
        }

        case 'TASK_UPDATED': {
          if (event.task.projectId === activeProjectIdRef.current) {
            if (activeEditingTaskIdRef.current === event.task.id && event.user.id !== currentUserRef.current?.id) {
              setConflictTask({
                local: { id: event.task.id },
                remote: event.task,
              });
              addNotification('Edit Conflict Alert', `${event.user.name} updated this task concurrently!`, 'warning');
            }
            setTasks((prev) => prev.map((t) => (t.id === event.task.id ? event.task : t)));
            setActivities((prev) => [
              {
                id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                projectId: event.task.projectId,
                taskId: event.task.id,
                taskTitle: event.task.title,
                type: 'updated',
                user: event.user,
                timestamp: event.timestamp || new Date().toISOString(),
                details: `Task "${event.task.title}" was updated by ${event.user.name}`,
              },
              ...prev,
            ]);
            addNotification('Task Updated', `${event.user.name} updated "${event.task.title}"`, 'info');
          }
          break;
        }

        case 'TASK_MOVED': {
          if (event.projectId === activeProjectIdRef.current) {
            let taskTitle = 'Task';
            setTasks((prev) =>
              prev.map((t) => {
                if (t.id === event.taskId) {
                  taskTitle = t.title;
                  return { ...t, status: event.toStatus, version: t.version + 1 };
                }
                return t;
              })
            );
            const statusLabels: Record<string, string> = {
              todo: 'To Do',
              'in-progress': 'In Progress',
              completed: 'Completed',
            };
            const toLabel = statusLabels[event.toStatus] || event.toStatus;
            setActivities((prev) => [
              {
                id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                projectId: event.projectId,
                taskId: event.taskId,
                taskTitle,
                type: 'status_changed',
                user: event.user,
                timestamp: event.timestamp || new Date().toISOString(),
                details: `Task "${taskTitle}" has been moved to ${toLabel} by ${event.user.name}`,
              },
              ...prev,
            ]);
            addNotification('Task Moved', `${event.user.name} moved a task to ${toLabel}`, 'info');
          }
          break;
        }

        case 'TASK_DELETED': {
          if (event.projectId === activeProjectIdRef.current) {
            setTasks((prev) => prev.filter((t) => t.id !== event.taskId));
            setActivities((prev) => [
              {
                id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                projectId: event.projectId,
                taskId: event.taskId,
                taskTitle: event.taskTitle,
                type: 'deleted',
                user: event.user,
                timestamp: event.timestamp || new Date().toISOString(),
                details: `Task "${event.taskTitle}" was deleted by ${event.user.name}`,
              },
              ...prev,
            ]);
            addNotification('Task Deleted', `${event.user.name} deleted "${event.taskTitle}"`, 'warning');
          }
          break;
        }

        case 'PROJECT_CREATED': {
          setProjects((prev) => {
            if (prev.some((p) => p.id === event.project.id)) return prev;
            return [event.project, ...prev];
          });
          break;
        }

        case 'PROJECT_UPDATED': {
          setProjects((prev) =>
            prev.map((p) => (p.id === event.project.id ? { ...p, ...event.project } : p))
          );
          if (event.project.id === activeProjectIdRef.current) {
            addNotification('Project Updated', `${event.user.name} updated workspace details`, 'info');
          }
          break;
        }

        case 'PROJECT_DELETED': {
          setProjects((prev) => {
            const remaining = prev.filter((p) => p.id !== event.projectId);
            if (activeProjectIdRef.current === event.projectId) {
              setActiveProjectId(remaining.length > 0 ? remaining[0].id : '');
            }
            return remaining;
          });
          addNotification('Project Deleted', `${event.user.name} deleted "${event.projectName}"`, 'warning');
          break;
        }

        case 'PROJECT_MEMBER_JOINED': {
          if (event.projectId === activeProjectIdRef.current) {
            setProjectMembers((prev) => {
              if (prev.some((m) => m.userId === event.member.userId)) return prev;
              return [...prev, event.member];
            });
            setActivities((prev) => [
              {
                id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                projectId: event.projectId,
                taskTitle: 'New Collaborator',
                type: 'member_joined',
                user: event.user,
                timestamp: event.timestamp || new Date().toISOString(),
                details: `${event.user.name} joined the project`,
              },
              ...prev,
            ]);
            addNotification('New Teammate', `${event.user.name} joined the project!`, 'success');
          }
          break;
        }

        case 'PRESENCE_HEARTBEAT': {
          if (event.session && event.session.tabId !== tabId) {
            setCollaborators((prev) => {
              const existingIdx = prev.findIndex((c) => c.tabId === event.session.tabId);
              if (existingIdx >= 0) {
                const next = [...prev];
                next[existingIdx] = event.session;
                return next;
              }
              return [...prev, event.session];
            });
          }
          break;
        }

        case 'PRESENCE_LEAVE': {
          setCollaborators((prev) => prev.filter((c) => c.tabId !== event.tabId));
          setEditingUsers((prev) => {
            const next = { ...prev };
            for (const [taskId, info] of Object.entries(next)) {
              if (info.tabId === event.tabId) {
                delete next[taskId];
              }
            }
            return next;
          });
          break;
        }

        case 'USER_EDITING_START': {
          if (event.tabId !== tabId && event.projectId === activeProjectIdRef.current) {
            setEditingUsers((prev) => ({
              ...prev,
              [event.taskId]: { user: event.user, tabId: event.tabId },
            }));
          }
          break;
        }

        case 'USER_EDITING_STOP': {
          if (event.tabId !== tabId && event.projectId === activeProjectIdRef.current) {
            setEditingUsers((prev) => {
              const next = { ...prev };
              delete next[event.taskId];
              return next;
            });
          }
          break;
        }
      }
    },
    [tabId, addNotification]
  );

  // Refresh Projects
  const refreshProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        const projectList: Project[] = data.projects || [];
        setProjects(projectList);

        // Auto-select first project if none selected or current is invalid
        if (projectList.length > 0) {
          setActiveProjectId((currentId) => {
            const exists = projectList.some((p) => p.id === currentId);
            return exists ? currentId : projectList[0].id;
          });
        } else {
          setActiveProjectId('');
          setTasks([]);
          setProjectMembers([]);
        }
      }
    } catch (err) {
      console.warn('[TaskBasket] Failed to fetch projects:', err);
    }
  }, []);

  // Refresh Tasks and Members for active project
  const refreshTasks = useCallback(async (projId?: string) => {
    const targetId = projId || activeProjectIdRef.current;
    if (!targetId) {
      setTasks([]);
      setProjectMembers([]);
      return;
    }

    try {
      // Fetch tasks
      const resTasks = await fetch(`/api/tasks?projectId=${targetId}`);
      if (resTasks.ok) {
        const data = await resTasks.json();
        setTasks(data.tasks || []);
      }

      // Fetch members
      const resMembers = await fetch(`/api/projects/members?projectId=${targetId}`);
      if (resMembers.ok) {
        const data = await resMembers.json();
        setProjectMembers(data.members || []);
      }
    } catch (err) {
      console.warn('[TaskBasket] Failed to fetch tasks/members:', err);
    }
  }, []);

  // Refresh Activities for active project
  const refreshActivities = useCallback(async (projId?: string) => {
    const targetId = projId || activeProjectIdRef.current;
    if (!targetId) {
      setActivities([]);
      return;
    }

    try {
      const res = await fetch(`/api/activities?projectId=${targetId}`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch (err) {
      console.warn('[TaskBasket] Failed to fetch activities:', err);
    }
  }, []);

  // Session Sync & Auto-Join Pending Invites
  useEffect(() => {
    if (authSession?.user) {
      const user: User = {
        id: authSession.user.id,
        name: authSession.user.name || 'User',
        email: authSession.user.email || '',
        avatar: authSession.user.image || '',
        color: '#3B82F6',
        role: 'Authenticated Member',
      };
      setCurrentUserState(user);

      // Check for pending invite code in localStorage
      if (typeof window !== 'undefined') {
        const pendingInvite = localStorage.getItem('taskbasket_pending_invite');
        if (pendingInvite) {
          localStorage.removeItem('taskbasket_pending_invite');
          fetch('/api/projects/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inviteCode: pendingInvite }),
          })
            .then((r) => r.json())
            .then((data) => {
              if (data.success && data.project) {
                addNotification('Joined Project', `You've joined ${data.project.name}!`, 'success');
                refreshProjects().then(() => {
                  setActiveProjectId(data.project.id);
                });
              } else {
                refreshProjects();
              }
            })
            .catch(() => refreshProjects());
          return;
        }
      }

      refreshProjects();
    } else {
      setCurrentUserState(null);
      setProjects([]);
      setTasks([]);
      setProjectMembers([]);
      setActivities([]);
      setActiveProjectId('');
    }
  }, [authSession, refreshProjects, addNotification]);

  // When activeProjectId changes, fetch tasks, members & activities project-wise
  useEffect(() => {
    if (activeProjectId) {
      refreshTasks(activeProjectId);
      refreshActivities(activeProjectId);
    } else {
      setTasks([]);
      setProjectMembers([]);
      setActivities([]);
    }
  }, [activeProjectId, refreshTasks, refreshActivities]);

  // WebSocket Connection Lifecycle
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let ws: WebSocket | null = null;
    const getWsUrl = () => {
      if (process.env.NEXT_PUBLIC_WS_URL) {
        return process.env.NEXT_PUBLIC_WS_URL;
      }
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname || 'localhost';
      return `${protocol}//${host}:3001`;
    };
    const wsUrl = getWsUrl();

    function connectWs() {
      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsWsConnected(true);
          if (currentUserRef.current) {
            const session: CollaboratorSession = {
              tabId,
              user: currentUserRef.current,
              lastActive: Date.now(),
              projectId: activeProjectIdRef.current,
            };
            ws?.send(JSON.stringify({ type: 'PRESENCE_HEARTBEAT', session }));
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data?.type === 'WS_CONNECTED' && Array.isArray(data.activeSessions)) {
              setCollaborators(data.activeSessions.filter((s: CollaboratorSession) => s.tabId !== tabId));
            } else {
              handleIncomingEvent(data as RealtimeEvent);
            }
          } catch (err) {
            console.error('[WS] Parse error:', err);
          }
        };

        ws.onclose = () => {
          setIsWsConnected(false);
          setTimeout(connectWs, 3000);
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch (err) {
        setTimeout(connectWs, 3000);
      }
    }

    connectWs();

    // BroadcastChannel local fallback
    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel('taskbasket_realtime_bus_v1');
        channelRef.current = channel;
        channel.onmessage = (e) => {
          handleIncomingEvent(e.data);
        };
      } catch (e) {
        // BroadcastChannel unavailable
      }
    }

    // Heartbeat
    const heartbeatTimer = setInterval(() => {
      if (currentUserRef.current) {
        const session: CollaboratorSession = {
          tabId,
          user: currentUserRef.current,
          lastActive: Date.now(),
          projectId: activeProjectIdRef.current,
          currentTaskId: activeEditingTaskIdRef.current,
        };
        broadcast({ type: 'PRESENCE_HEARTBEAT', session });
      }
    }, 4000);

    // Prune stale collaborators
    const pruneTimer = setInterval(() => {
      const threshold = Date.now() - 10000;
      setCollaborators((prev) => prev.filter((c) => c.lastActive > threshold));
    }, 5000);

    return () => {
      clearInterval(heartbeatTimer);
      clearInterval(pruneTimer);
      if (ws) ws.close();
      if (channel) channel.close();
    };
  }, [tabId, broadcast, handleIncomingEvent]);

  // Create Task
  const createTask = useCallback(
    async (data: {
      title: string;
      description: string;
      status: TaskStatus;
      priority: TaskPriority;
      assignedTo: User;
      dueDate: string;
      projectId?: string;
    }) => {
      if (!currentUserRef.current) return null;
      const targetProjectId = data.projectId || activeProjectIdRef.current;
      if (!targetProjectId) {
        addNotification('Error', 'Please select or create a project first', 'warning');
        return null;
      }

      const assignedToId = data.assignedTo?.id !== 'unassigned' ? data.assignedTo?.id : null;

      try {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: targetProjectId,
            title: data.title,
            description: data.description,
            status: data.status,
            priority: data.priority,
            dueDate: data.dueDate,
            assignedToId,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          addNotification('Error', errData.error || 'Failed to create task', 'warning');
          return null;
        }

        const resData = await res.json();
        const createdTask: Task = resData.task;

        setTasks((prev) => [createdTask, ...prev]);

        setActivities((prev) => [
          {
            id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            projectId: targetProjectId,
            taskId: createdTask.id,
            taskTitle: createdTask.title,
            type: 'created',
            user: currentUserRef.current!,
            timestamp: new Date().toISOString(),
            details: `Task "${createdTask.title}" was created by ${currentUserRef.current!.name}`,
          },
          ...prev,
        ]);

        broadcast({
          type: 'TASK_CREATED',
          task: createdTask,
          user: currentUserRef.current,
          timestamp: new Date().toISOString(),
        });

        addNotification('Task Created', `"${createdTask.title}" added`, 'success');
        return createdTask;
      } catch (err) {
        addNotification('Error', 'Network error creating task', 'warning');
        return null;
      }
    },
    [broadcast, addNotification]
  );

  // Update Task
  const updateTask = useCallback(
    async (id: string, updates: Partial<Task>) => {
      if (!currentUserRef.current) return;

      const target = tasks.find((t) => t.id === id);
      if (!target) return;

      const updatedTask: Task = {
        ...target,
        ...updates,
        version: target.version + 1,
        updatedAt: new Date().toISOString(),
      };

      // Optimistic update
      setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));

      const statusLabels: Record<string, string> = {
        todo: 'To Do',
        'in-progress': 'In Progress',
        completed: 'Completed',
      };
      let actType: ActivityType = 'updated';
      let actDetails = `Task "${target.title}" was updated by ${currentUserRef.current.name}`;
      if (updates.status && updates.status !== target.status) {
        actType = 'status_changed';
        const toLabel = statusLabels[updates.status] || updates.status;
        actDetails = `Task "${target.title}" has been moved to ${toLabel} by ${currentUserRef.current.name}`;
      } else if (updates.assignedTo && updates.assignedTo.id !== target.assignedTo.id) {
        actType = 'assigned';
        actDetails = `Task "${target.title}" was assigned to ${updates.assignedTo.name} by ${currentUserRef.current.name}`;
      }

      setActivities((prev) => [
        {
          id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          projectId: target.projectId,
          taskId: id,
          taskTitle: updates.title || target.title,
          type: actType,
          user: currentUserRef.current!,
          timestamp: new Date().toISOString(),
          details: actDetails,
        },
        ...prev,
      ]);

      broadcast({
        type: 'TASK_UPDATED',
        task: updatedTask,
        previousVersion: target.version,
        user: currentUserRef.current,
        timestamp: new Date().toISOString(),
      });

      try {
        await fetch('/api/tasks', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            title: updates.title,
            description: updates.description,
            status: updates.status,
            priority: updates.priority,
            dueDate: updates.dueDate,
            assignedToId: updates.assignedTo ? updates.assignedTo.id : undefined,
          }),
        });
      } catch (err) {
        console.warn('[TaskBasket] Failed to sync task update to DB:', err);
      }
    },
    [tasks, broadcast]
  );

  // Move Task (Drag & Drop / Status Change)
  const moveTask = useCallback(
    async (id: string, newStatus: TaskStatus) => {
      if (!currentUserRef.current) return;
      const target = tasks.find((t) => t.id === id);
      if (!target || target.status === newStatus) return;

      const prevStatus = target.status;
      const updated: Task = {
        ...target,
        status: newStatus,
        version: target.version + 1,
        updatedAt: new Date().toISOString(),
      };

      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));

      const statusLabels: Record<string, string> = {
        todo: 'To Do',
        'in-progress': 'In Progress',
        completed: 'Completed',
      };
      const toLabel = statusLabels[newStatus] || newStatus;

      setActivities((prev) => [
        {
          id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          projectId: target.projectId,
          taskId: id,
          taskTitle: target.title,
          type: 'status_changed',
          user: currentUserRef.current!,
          timestamp: new Date().toISOString(),
          details: `Task "${target.title}" has been moved to ${toLabel} by ${currentUserRef.current!.name}`,
        },
        ...prev,
      ]);

      broadcast({
        type: 'TASK_MOVED',
        taskId: id,
        projectId: target.projectId,
        fromStatus: prevStatus,
        toStatus: newStatus,
        user: currentUserRef.current,
        timestamp: new Date().toISOString(),
      });

      try {
        await fetch('/api/tasks', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: newStatus }),
        });
      } catch (err) {
        console.warn('[TaskBasket] Failed to sync task move to DB:', err);
      }
    },
    [tasks, broadcast]
  );

  // Delete Task
  const deleteTask = useCallback(
    async (id: string) => {
      if (!currentUserRef.current) return;
      const target = tasks.find((t) => t.id === id);
      if (!target) return;

      setTasks((prev) => prev.filter((t) => t.id !== id));

      setActivities((prev) => [
        {
          id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          projectId: target.projectId,
          taskId: id,
          taskTitle: target.title,
          type: 'deleted',
          user: currentUserRef.current!,
          timestamp: new Date().toISOString(),
          details: `Task "${target.title}" was deleted by ${currentUserRef.current!.name}`,
        },
        ...prev,
      ]);

      broadcast({
        type: 'TASK_DELETED',
        taskId: id,
        taskTitle: target.title,
        projectId: target.projectId,
        user: currentUserRef.current,
        timestamp: new Date().toISOString(),
      });

      try {
        await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
        addNotification('Deleted', `"${target.title}" was removed`, 'info');
      } catch (err) {
        console.warn('[TaskBasket] Failed to delete task in DB:', err);
      }
    },
    [tasks, broadcast, addNotification]
  );

  // Create Project
  const createProject = useCallback(
    async (name: string, color?: string, description?: string) => {
      if (!currentUserRef.current) {
        addNotification('Sign In Required', 'Please sign in to create projects', 'warning');
        return null;
      }

      try {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, color: color || '#6366F1', description }),
        });

        if (!res.ok) {
          addNotification('Error', 'Failed to create project', 'warning');
          return null;
        }

        const data = await res.json();
        const project: Project = data.project;

        setProjects((prev) => [project, ...prev]);
        setActiveProjectId(project.id);

        broadcast({
          type: 'PROJECT_CREATED',
          project,
          user: currentUserRef.current,
          timestamp: new Date().toISOString(),
        });

        addNotification('Project Created', `"${project.name}" workspace is ready`, 'success');
        return project;
      } catch (err) {
        addNotification('Error', 'Network error creating project', 'warning');
        return null;
      }
    },
    [broadcast, addNotification]
  );

  // Update Project (Admin Only)
  const updateProject = useCallback(
    async (id: string, data: { name?: string; description?: string; color?: string }) => {
      if (!currentUserRef.current) {
        addNotification('Unauthorized', 'Please sign in to update workspace', 'warning');
        return null;
      }

      try {
        const res = await fetch('/api/projects', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...data }),
        });

        const resData = await res.json();
        if (!res.ok) {
          addNotification('Permission Denied', resData.error || 'Failed to update project', 'warning');
          return null;
        }

        const updated: Project = resData.project;
        setProjects((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
        );

        broadcast({
          type: 'PROJECT_UPDATED',
          project: updated,
          user: currentUserRef.current,
          timestamp: new Date().toISOString(),
        });

        addNotification('Project Updated', `"${updated.name}" settings saved`, 'success');
        return updated;
      } catch (err) {
        addNotification('Error', 'Network error updating project', 'warning');
        return null;
      }
    },
    [broadcast, addNotification]
  );

  // Delete Project (Admin Only)
  const deleteProject = useCallback(
    async (id: string) => {
      if (!currentUserRef.current) {
        addNotification('Unauthorized', 'Please sign in to delete workspace', 'warning');
        return false;
      }

      const target = projects.find((p) => p.id === id);
      const projectName = target?.name || 'Workspace';

      try {
        const res = await fetch(`/api/projects?id=${id}`, {
          method: 'DELETE',
        });

        const resData = await res.json();
        if (!res.ok) {
          addNotification('Permission Denied', resData.error || 'Failed to delete project', 'warning');
          return false;
        }

        setProjects((prev) => {
          const remaining = prev.filter((p) => p.id !== id);
          if (activeProjectIdRef.current === id) {
            setActiveProjectId(remaining.length > 0 ? remaining[0].id : '');
          }
          return remaining;
        });

        broadcast({
          type: 'PROJECT_DELETED',
          projectId: id,
          projectName,
          user: currentUserRef.current,
          timestamp: new Date().toISOString(),
        });

        addNotification('Project Deleted', `"${projectName}" was permanently deleted`, 'info');
        return true;
      } catch (err) {
        addNotification('Error', 'Network error deleting project', 'warning');
        return false;
      }
    },
    [projects, broadcast, addNotification]
  );

  const openProjectSettings = useCallback((project: Project) => {
    setProjectToEdit(project);
    setIsProjectSettingsOpen(true);
  }, []);

  const closeProjectSettings = useCallback(() => {
    setIsProjectSettingsOpen(false);
    setProjectToEdit(null);
  }, []);

  // Join Project
  const joinProject = useCallback(
    async (code: string) => {
      if (!currentUserRef.current) {
        return { success: false, error: 'Please sign in to join a project' };
      }

      try {
        const res = await fetch('/api/projects/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inviteCode: code }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, error: data.error || 'Failed to join project' };
        }

        await refreshProjects();
        setActiveProjectId(data.project.id);

        if (data.member) {
          broadcast({
            type: 'PROJECT_MEMBER_JOINED',
            projectId: data.project.id,
            member: data.member,
            user: currentUserRef.current,
            timestamp: new Date().toISOString(),
          });
        }

        addNotification('Project Joined', `Welcome to ${data.project.name}!`, 'success');
        return { success: true, message: data.message, project: data.project };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Network error' };
      }
    },
    [refreshProjects, broadcast, addNotification]
  );

  // Live Task Editing Pulse
  const startEditingTask = useCallback(
    (taskId: string) => {
      activeEditingTaskIdRef.current = taskId;
      if (currentUserRef.current) {
        broadcast({
          type: 'USER_EDITING_START',
          taskId,
          projectId: activeProjectIdRef.current,
          user: currentUserRef.current,
          tabId,
        });
      }
    },
    [tabId, broadcast]
  );

  const stopEditingTask = useCallback(
    (taskId: string) => {
      activeEditingTaskIdRef.current = null;
      broadcast({
        type: 'USER_EDITING_STOP',
        taskId,
        projectId: activeProjectIdRef.current,
        tabId,
      });
    },
    [tabId, broadcast]
  );

  const resolveConflict = useCallback(
    (resolution: 'use_mine' | 'use_theirs') => {
      if (!conflictTask) return;
      if (resolution === 'use_mine' && conflictTask.local.id) {
        updateTask(conflictTask.local.id, conflictTask.local);
      } else if (resolution === 'use_theirs' && conflictTask.remote) {
        setTasks((prev) => prev.map((t) => (t.id === conflictTask.remote.id ? conflictTask.remote : t)));
      }
      setConflictTask(null);
    },
    [conflictTask, updateTask]
  );

  const resetToDefaultData = useCallback(() => {
    setTasks([]);
  }, []);

  const setCurrentUser = useCallback((user: User) => {
    setCurrentUserState(user);
  }, []);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        projects,
        activeProjectId,
        setActiveProjectId,
        activeProject,
        projectMembers,
        activities,
        currentUser,
        isAuthenticated: Boolean(authSession?.user),
        isAuthLoading,
        setCurrentUser,
        collaborators,
        editingUsers,
        tabId,
        searchQuery,
        setSearchQuery,
        filterPriority,
        setFilterPriority,
        filterAssignee,
        setFilterAssignee,
        viewMode,
        setViewMode,
        isWsConnected,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isInviteModalOpen,
        setIsInviteModalOpen,
        isJoinModalOpen,
        setIsJoinModalOpen,
        createTask,
        updateTask,
        deleteTask,
        moveTask,
        createProject,
        updateProject,
        deleteProject,
        joinProject,
        refreshProjects,
        refreshTasks,
        refreshActivities,
        isProjectSettingsOpen,
        setIsProjectSettingsOpen,
        projectToEdit,
        openProjectSettings,
        closeProjectSettings,
        startEditingTask,
        stopEditingTask,
        notifications,
        removeNotification,
        conflictTask,
        resolveConflict,
        resetToDefaultData,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};
