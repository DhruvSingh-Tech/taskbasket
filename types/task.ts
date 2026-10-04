export type TaskStatus = 'todo' | 'in-progress' | 'completed';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar: string;
  color: string;
  role: string;
}

export interface ProjectMember {
  id: string;
  userId: string;
  role: 'admin' | 'member';
  user: User;
  joinedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdById?: string;
  inviteCode: string;
  role?: 'admin' | 'member';
  members?: ProjectMember[];
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: User;
  createdBy: User;
  dueDate: string; // ISO date or formatted
  createdAt: string;
  updatedAt: string;
  version: number;
}

export type ActivityType =
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'assigned'
  | 'deleted'
  | 'project_created'
  | 'member_joined';

export interface ActivityLog {
  id: string;
  projectId?: string;
  taskId?: string;
  taskTitle: string;
  type: ActivityType;
  user: User;
  timestamp: string;
  details?: string;
}

export interface CollaboratorSession {
  tabId: string;
  user: User;
  lastActive: number;
  projectId?: string;
  currentTaskId?: string | null;
}

export type RealtimeEvent =
  | { type: 'TASK_CREATED'; task: Task; user: User; timestamp: string }
  | { type: 'TASK_UPDATED'; task: Task; previousVersion: number; user: User; timestamp: string }
  | { type: 'TASK_DELETED'; taskId: string; taskTitle: string; projectId: string; user: User; timestamp: string }
  | { type: 'TASK_MOVED'; taskId: string; projectId: string; fromStatus: TaskStatus; toStatus: TaskStatus; user: User; timestamp: string }
  | { type: 'PROJECT_CREATED'; project: Project; user: User; timestamp: string }
  | { type: 'PROJECT_UPDATED'; project: Project; user: User; timestamp: string }
  | { type: 'PROJECT_DELETED'; projectId: string; projectName: string; user: User; timestamp: string }
  | { type: 'PROJECT_MEMBER_JOINED'; projectId: string; member: ProjectMember; user: User; timestamp: string }
  | { type: 'PRESENCE_HEARTBEAT'; session: CollaboratorSession }
  | { type: 'PRESENCE_LEAVE'; tabId: string }
  | { type: 'USER_EDITING_START'; taskId: string; projectId: string; user: User; tabId: string }
  | { type: 'USER_EDITING_STOP'; taskId: string; projectId: string; tabId: string };
