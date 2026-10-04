import { pgTable, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

// ==========================================
// BETTER AUTH TABLES (PostgreSQL)
// ==========================================

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==========================================
// APPLICATION DATA TABLES
// ==========================================

export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').default('#6366F1').notNull(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  inviteCode: text('invite_code').default('').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const projectMembers = pgTable('project_members', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  role: text('role').default('member').notNull(), // 'admin' | 'member'
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

export const tasks = pgTable('tasks', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').default('').notNull(),
  status: text('status').notNull(), // 'todo' | 'in-progress' | 'completed'
  priority: text('priority').default('medium').notNull(), // 'low' | 'medium' | 'high' | 'urgent'
  assignedToId: text('assigned_to_id').references(() => user.id, { onDelete: 'set null' }),
  createdById: text('created_by_id').references(() => user.id, { onDelete: 'set null' }),
  dueDate: text('due_date'),
  version: integer('version').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const activities = pgTable('activities', {
  id: text('id').primaryKey(),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  taskId: text('task_id'),
  taskTitle: text('task_title').notNull(),
  type: text('type').notNull(), // 'created' | 'updated' | 'status_changed' | 'assigned' | 'deleted' | 'project_created'
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  details: text('details'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});
