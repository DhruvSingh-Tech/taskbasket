import { NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, projectMembers, user, activities } from '@/db/schema';
import { auth } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Please sign in to join a project' }, { status: 401 });
    }

    const body = await request.json();
    const { inviteCode } = body;

    if (!inviteCode || typeof inviteCode !== 'string' || !inviteCode.trim()) {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
    }

    const cleanCode = inviteCode.trim().toUpperCase();

    // Find project by invite code
    const matchingProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.inviteCode, cleanCode))
      .limit(1);

    if (matchingProjects.length === 0) {
      return NextResponse.json({ error: 'Invalid invite code. No project found.' }, { status: 404 });
    }

    const targetProject = matchingProjects[0];
    const currentUserId = session.user.id;

    // Check if already a member
    const existingMembership = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, targetProject.id),
          eq(projectMembers.userId, currentUserId)
        )
      )
      .limit(1);

    if (existingMembership.length > 0) {
      return NextResponse.json({
        success: true,
        alreadyMember: true,
        message: 'You are already a member of this project',
        project: {
          id: targetProject.id,
          name: targetProject.name,
          description: targetProject.description,
          color: targetProject.color,
          createdById: targetProject.userId,
          inviteCode: targetProject.inviteCode,
          role: existingMembership[0].role,
          createdAt: targetProject.createdAt.toISOString(),
        },
      });
    }

    // Add user as a new member
    const newMemberId = `pm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await db.insert(projectMembers).values({
      id: newMemberId,
      projectId: targetProject.id,
      userId: currentUserId,
      role: 'member',
    });

    // Record activity
    try {
      await db.insert(activities).values({
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        projectId: targetProject.id,
        taskTitle: 'New Collaborator',
        type: 'member_joined',
        userId: currentUserId,
        details: `${session.user.name || 'A teammate'} joined the project via invite link`,
      });
    } catch (e) {
      // Non-fatal if activity log fails
    }

    const newMemberUser = {
      id: currentUserId,
      name: session.user.name || 'Member',
      email: session.user.email || '',
      avatar: session.user.image || '',
      color: '#10B981',
      role: 'Project Member',
    };

    return NextResponse.json({
      success: true,
      message: `Successfully joined ${targetProject.name}!`,
      project: {
        id: targetProject.id,
        name: targetProject.name,
        description: targetProject.description,
        color: targetProject.color,
        createdById: targetProject.userId,
        inviteCode: targetProject.inviteCode,
        role: 'member' as const,
        createdAt: targetProject.createdAt.toISOString(),
      },
      member: {
        id: newMemberId,
        userId: currentUserId,
        role: 'member' as const,
        joinedAt: new Date().toISOString(),
        user: newMemberUser,
      },
    });
  } catch (error) {
    console.error('[API /api/projects/join POST] Error:', error);
    return NextResponse.json({ error: 'Failed to join project' }, { status: 500 });
  }
}
