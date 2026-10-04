import { NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, projectMembers, user, tasks, activities } from '@/db/schema';
import { auth } from '@/lib/auth';
import { eq, inArray, desc, and } from 'drizzle-orm';

function generateInviteCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = 'TASK-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized', projects: [] }, { status: 401 });
    }

    const currentUserId = session.user.id;

    // Find all memberships for current user
    const memberships = await db
      .select({
        projectId: projectMembers.projectId,
        role: projectMembers.role,
      })
      .from(projectMembers)
      .where(eq(projectMembers.userId, currentUserId));

    if (memberships.length === 0) {
      return NextResponse.json({ projects: [] });
    }

    const projectIds = memberships.map((m) => m.projectId);
    const membershipRoleMap = new Map(memberships.map((m) => [m.projectId, m.role]));

    // Query project details
    const dbProjects = await db
      .select()
      .from(projects)
      .where(inArray(projects.id, projectIds))
      .orderBy(desc(projects.createdAt));

    // Query members for all user projects
    const allMembers = await db
      .select({
        memberId: projectMembers.id,
        projectId: projectMembers.projectId,
        userId: projectMembers.userId,
        role: projectMembers.role,
        joinedAt: projectMembers.joinedAt,
        userName: user.name,
        userEmail: user.email,
        userAvatar: user.image,
      })
      .from(projectMembers)
      .leftJoin(user, eq(projectMembers.userId, user.id))
      .where(inArray(projectMembers.projectId, projectIds));

    // Group members by project
    const membersByProject = new Map<string, any[]>();
    for (const m of allMembers) {
      const list = membersByProject.get(m.projectId) || [];
      list.push({
        id: m.memberId,
        userId: m.userId,
        role: m.role as 'admin' | 'member',
        joinedAt: m.joinedAt?.toISOString() || new Date().toISOString(),
        user: {
          id: m.userId,
          name: m.userName || 'Member',
          email: m.userEmail || '',
          avatar: m.userAvatar || '',
          color: '#3B82F6',
          role: m.role === 'admin' ? 'Project Admin' : 'Project Member',
        },
      });
      membersByProject.set(m.projectId, list);
    }

    const formattedProjects = dbProjects.map((p) => {
      const role = (membershipRoleMap.get(p.id) || (p.userId === currentUserId ? 'admin' : 'member')) as 'admin' | 'member';
      return {
        id: p.id,
        name: p.name,
        description: p.description || '',
        color: p.color,
        createdById: p.userId,
        inviteCode: p.inviteCode,
        role,
        members: membersByProject.get(p.id) || [],
        createdAt: p.createdAt?.toISOString() || new Date().toISOString(),
      };
    });

    return NextResponse.json({ projects: formattedProjects });
  } catch (error) {
    console.error('[API /api/projects GET] Error:', error);
    return NextResponse.json({ error: 'Database error', projects: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, color } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const inviteCode = generateInviteCode();
    const currentUserId = session.user.id;

    // Insert project
    const newProjectRecord = {
      id: projectId,
      name: name.trim(),
      description: description?.trim() || '',
      color: color || '#6366F1',
      userId: currentUserId,
      inviteCode,
    };

    await db.insert(projects).values(newProjectRecord);

    // Creator is automatically the Project Admin in projectMembers
    const memberRecord = {
      id: `pm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      projectId,
      userId: currentUserId,
      role: 'admin',
    };

    await db.insert(projectMembers).values(memberRecord);

    const fullProject = {
      ...newProjectRecord,
      createdById: currentUserId,
      role: 'admin' as const,
      members: [
        {
          id: memberRecord.id,
          userId: currentUserId,
          role: 'admin' as const,
          joinedAt: new Date().toISOString(),
          user: {
            id: currentUserId,
            name: session.user.name || 'Admin',
            email: session.user.email || '',
            avatar: session.user.image || '',
            color: '#3B82F6',
            role: 'Project Admin',
          },
        },
      ],
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, project: fullProject });
  } catch (error) {
    console.error('[API /api/projects POST] Error:', error);
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
    const { id, name, description, color } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Verify project exists
    const existingProjects = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (existingProjects.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const currentProject = existingProjects[0];
    const currentUserId = session.user.id;

    // Check if user is project admin
    const membership = await db
      .select()
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, id), eq(projectMembers.userId, currentUserId)))
      .limit(1);

    const isAdmin =
      currentProject.userId === currentUserId ||
      (membership.length > 0 && membership[0].role === 'admin');

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only project admins can modify project details' },
        { status: 403 }
      );
    }

    const updatePayload: Record<string, any> = {};
    if (name !== undefined) {
      if (!name || typeof name !== 'string' || !name.trim()) {
        return NextResponse.json({ error: 'Project name cannot be empty' }, { status: 400 });
      }
      updatePayload.name = name.trim();
    }
    if (description !== undefined) {
      updatePayload.description = description.trim();
    }
    if (color !== undefined && color.trim()) {
      updatePayload.color = color.trim();
    }

    await db.update(projects).set(updatePayload).where(eq(projects.id, id));

    // Record activity
    try {
      const actorName = session.user.name || 'Admin';
      await db.insert(activities).values({
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        projectId: id,
        taskTitle: updatePayload.name || currentProject.name,
        type: 'updated',
        userId: currentUserId,
        details: `Project details updated by ${actorName}`,
      });
    } catch (e) {
      // Non-fatal
    }

    const updatedProject = {
      ...currentProject,
      ...updatePayload,
      role: 'admin' as const,
      createdById: currentProject.userId,
    };

    return NextResponse.json({ success: true, project: updatedProject });
  } catch (error) {
    console.error('[API /api/projects PUT] Error:', error);
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
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Verify project exists
    const existingProjects = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (existingProjects.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const currentProject = existingProjects[0];
    const currentUserId = session.user.id;

    // Check if user is project admin
    const membership = await db
      .select()
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, id), eq(projectMembers.userId, currentUserId)))
      .limit(1);

    const isAdmin =
      currentProject.userId === currentUserId ||
      (membership.length > 0 && membership[0].role === 'admin');

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only project admins can delete a project' },
        { status: 403 }
      );
    }

    // Cleanly delete tasks, activities, members, and project
    await db.delete(tasks).where(eq(tasks.projectId, id));
    await db.delete(activities).where(eq(activities.projectId, id));
    await db.delete(projectMembers).where(eq(projectMembers.projectId, id));
    await db.delete(projects).where(eq(projects.id, id));

    return NextResponse.json({ success: true, id, name: currentProject.name });
  } catch (error) {
    console.error('[API /api/projects DELETE] Error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
