import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, projects, projectMembers, user, activities } from '@/db/schema';
import { auth } from '@/lib/auth';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized', tasks: [] }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ tasks: [] });
    }

    const currentUserId = session.user.id;

    // Verify membership in project
    const membership = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, currentUserId)
        )
      )
      .limit(1);

    if (membership.length === 0) {
      return NextResponse.json(
        { error: 'Forbidden: You are not a member of this project', tasks: [] },
        { status: 403 }
      );
    }

    // Fetch tasks
    const dbTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId))
      .orderBy(desc(tasks.createdAt));

    if (dbTasks.length === 0) {
      return NextResponse.json({ tasks: [] });
    }

    // Collect all user IDs referenced
    const userIds = new Set<string>();
    for (const t of dbTasks) {
      if (t.assignedToId) userIds.add(t.assignedToId);
      if (t.createdById) userIds.add(t.createdById);
    }

    const userMap = new Map<string, any>();
    if (userIds.size > 0) {
      const usersList = await db.select().from(user);
      for (const u of usersList) {
        userMap.set(u.id, {
          id: u.id,
          name: u.name,
          email: u.email,
          avatar: u.image || '',
          color: '#3B82F6',
          role: 'Member',
        });
      }
    }

    const formattedTasks = dbTasks.map((t) => {
      const assigned = t.assignedToId ? userMap.get(t.assignedToId) : null;
      const creator = t.createdById ? userMap.get(t.createdById) : null;

      return {
        id: t.id,
        projectId: t.projectId,
        title: t.title,
        description: t.description || '',
        status: t.status as 'todo' | 'in-progress' | 'completed',
        priority: t.priority as 'low' | 'medium' | 'high' | 'urgent',
        dueDate: t.dueDate || '',
        version: t.version || 1,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        assignedTo: assigned || {
          id: 'unassigned',
          name: 'Unassigned',
          avatar: '',
          color: '#9CA3AF',
          role: 'Member',
        },
        createdBy: creator || {
          id: session.user.id,
          name: session.user.name || 'Member',
          avatar: session.user.image || '',
          color: '#3B82F6',
          role: 'Creator',
        },
      };
    });

    return NextResponse.json({ tasks: formattedTasks });
  } catch (error) {
    console.error('[API /api/tasks GET] Error:', error);
    return NextResponse.json({ error: 'Database error', tasks: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, title, description, status, priority, dueDate, assignedToId } = body;

    if (!projectId || !title?.trim()) {
      return NextResponse.json({ error: 'Project ID and title are required' }, { status: 400 });
    }

    const currentUserId = session.user.id;

    // Check project membership
    const membership = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, currentUserId)
        )
      )
      .limit(1);

    if (membership.length === 0) {
      return NextResponse.json(
        { error: 'Forbidden: You must be invited to this project to create tasks' },
        { status: 403 }
      );
    }

    // If assigning to a user, ensure assignee is a member of this project
    let verifiedAssigneeId: string | null = null;
    if (assignedToId && assignedToId !== 'unassigned') {
      const assigneeMembership = await db
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, projectId),
            eq(projectMembers.userId, assignedToId)
          )
        )
        .limit(1);

      if (assigneeMembership.length === 0) {
        return NextResponse.json(
          { error: 'Assignee is not a member of this project' },
          { status: 400 }
        );
      }
      verifiedAssigneeId = assignedToId;
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newTaskRecord = {
      id: taskId,
      projectId,
      title: title.trim(),
      description: description?.trim() || '',
      status: (status || 'todo') as string,
      priority: (priority || 'medium') as string,
      dueDate: dueDate || null,
      assignedToId: verifiedAssigneeId,
      createdById: currentUserId,
      version: 1,
    };

    await db.insert(tasks).values(newTaskRecord);

    // Record activity
    try {
      const actorName = session.user.name || 'Member';
      await db.insert(activities).values({
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        projectId,
        taskId,
        taskTitle: title.trim(),
        type: 'created',
        userId: currentUserId,
        details: `Task "${title.trim()}" was created by ${actorName}`,
      });
    } catch (e) {
      // Non-fatal
    }

    // Query assignee user object if assigned
    let assignedUser = {
      id: 'unassigned',
      name: 'Unassigned',
      avatar: '',
      color: '#9CA3AF',
      role: 'Member',
    };

    if (verifiedAssigneeId) {
      const assigneeRows = await db.select().from(user).where(eq(user.id, verifiedAssigneeId)).limit(1);
      if (assigneeRows.length > 0) {
        const u = assigneeRows[0];
        assignedUser = {
          id: u.id,
          name: u.name,
          avatar: u.image || '',
          color: '#10B981',
          role: 'Member',
        };
      }
    }

    const creatorUser = {
      id: currentUserId,
      name: session.user.name || 'User',
      avatar: session.user.image || '',
      color: '#3B82F6',
      role: 'Creator',
    };

    const fullTask = {
      ...newTaskRecord,
      status: newTaskRecord.status as 'todo' | 'in-progress' | 'completed',
      priority: newTaskRecord.priority as 'low' | 'medium' | 'high' | 'urgent',
      dueDate: newTaskRecord.dueDate || '',
      assignedTo: assignedUser,
      createdBy: creatorUser,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, task: fullTask });
  } catch (error) {
    console.error('[API /api/tasks POST] Error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, description, status, priority, dueDate, assignedToId } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing task id' }, { status: 400 });
    }

    // Fetch existing task
    const existingTasks = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    if (existingTasks.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const existingTask = existingTasks[0];
    const currentUserId = session.user.id;

    // Check membership
    const membership = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, existingTask.projectId),
          eq(projectMembers.userId, currentUserId)
        )
      )
      .limit(1);

    if (membership.length === 0) {
      return NextResponse.json({ error: 'Forbidden: Not a project member' }, { status: 403 });
    }

    // Validate assignee if changed
    let targetAssigneeId = existingTask.assignedToId;
    if (assignedToId !== undefined) {
      if (assignedToId && assignedToId !== 'unassigned') {
        const assigneeMembership = await db
          .select()
          .from(projectMembers)
          .where(
            and(
              eq(projectMembers.projectId, existingTask.projectId),
              eq(projectMembers.userId, assignedToId)
            )
          )
          .limit(1);

        if (assigneeMembership.length === 0) {
          return NextResponse.json(
            { error: 'Assignee is not a member of this project' },
            { status: 400 }
          );
        }
        targetAssigneeId = assignedToId;
      } else {
        targetAssigneeId = null;
      }
    }

    const newVersion = (existingTask.version || 1) + 1;
    const updatePayload: Record<string, any> = {
      version: newVersion,
      updatedAt: new Date(),
    };

    if (title !== undefined) updatePayload.title = title.trim();
    if (description !== undefined) updatePayload.description = description.trim();
    if (status !== undefined) updatePayload.status = status;
    if (priority !== undefined) updatePayload.priority = priority;
    if (dueDate !== undefined) updatePayload.dueDate = dueDate || null;
    if (assignedToId !== undefined) updatePayload.assignedToId = targetAssigneeId;

    await db.update(tasks).set(updatePayload).where(eq(tasks.id, id));

    // Record activity
    try {
      const actorName = session.user.name || 'Member';
      const statusLabels: Record<string, string> = {
        todo: 'To Do',
        'in-progress': 'In Progress',
        completed: 'Completed',
      };

      let actType = 'updated';
      let actDetails = `Task "${existingTask.title}" was updated by ${actorName}`;

      if (status !== undefined && status !== existingTask.status) {
        actType = 'status_changed';
        const toLabel = statusLabels[status] || status;
        actDetails = `Task "${existingTask.title}" has been moved to ${toLabel} by ${actorName}`;
      } else if (assignedToId !== undefined && assignedToId !== existingTask.assignedToId) {
        actType = 'assigned';
        let assigneeName = 'Unassigned';
        if (targetAssigneeId) {
          const assigneeRows = await db.select().from(user).where(eq(user.id, targetAssigneeId)).limit(1);
          if (assigneeRows.length > 0) {
            assigneeName = assigneeRows[0].name;
          }
        }
        actDetails = `Task "${existingTask.title}" was assigned to ${assigneeName} by ${actorName}`;
      } else if (title !== undefined && title.trim() !== existingTask.title) {
        actDetails = `Task "${title.trim()}" was updated by ${actorName}`;
      }

      await db.insert(activities).values({
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        projectId: existingTask.projectId,
        taskId: existingTask.id,
        taskTitle: title ? title.trim() : existingTask.title,
        type: actType,
        userId: currentUserId,
        details: actDetails,
      });
    } catch (e) {
      // Non-fatal
    }

    return NextResponse.json({
      success: true,
      version: newVersion,
    });
  } catch (error) {
    console.error('[API /api/tasks PUT] Error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing task id' }, { status: 400 });
    }

    const existingTasks = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    if (existingTasks.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const existingTask = existingTasks[0];
    const currentUserId = session.user.id;

    // Check membership
    const membership = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, existingTask.projectId),
          eq(projectMembers.userId, currentUserId)
        )
      )
      .limit(1);

    if (membership.length === 0) {
      return NextResponse.json({ error: 'Forbidden: Not a project member' }, { status: 403 });
    }

    await db.delete(tasks).where(eq(tasks.id, id));

    // Record activity
    try {
      const actorName = session.user.name || 'Member';
      await db.insert(activities).values({
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        projectId: existingTask.projectId,
        taskId: existingTask.id,
        taskTitle: existingTask.title,
        type: 'deleted',
        userId: currentUserId,
        details: `Task "${existingTask.title}" was deleted by ${actorName}`,
      });
    } catch (e) {
      // Non-fatal
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API /api/tasks DELETE] Error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
