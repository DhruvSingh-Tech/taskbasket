import { NextResponse } from 'next/server';
import { db } from '@/db';
import { projectMembers, user } from '@/db/schema';
import { auth } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized', members: [] }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required', members: [] }, { status: 400 });
    }

    const currentUserId = session.user.id;

    // Verify current user belongs to the project
    const myMembership = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, currentUserId)
        )
      )
      .limit(1);

    if (myMembership.length === 0) {
      return NextResponse.json(
        { error: 'Forbidden: You are not a member of this project', members: [] },
        { status: 403 }
      );
    }

    // Query members with user info
    const memberRows = await db
      .select({
        id: projectMembers.id,
        userId: projectMembers.userId,
        role: projectMembers.role,
        joinedAt: projectMembers.joinedAt,
        userName: user.name,
        userEmail: user.email,
        userImage: user.image,
      })
      .from(projectMembers)
      .leftJoin(user, eq(projectMembers.userId, user.id))
      .where(eq(projectMembers.projectId, projectId));

    const members = memberRows.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role as 'admin' | 'member',
      joinedAt: m.joinedAt.toISOString(),
      user: {
        id: m.userId,
        name: m.userName || 'Teammate',
        email: m.userEmail || '',
        avatar: m.userImage || '',
        color: m.role === 'admin' ? '#F59E0B' : '#3B82F6',
        role: m.role === 'admin' ? 'Project Admin' : 'Project Member',
      },
    }));

    return NextResponse.json({ members });
  } catch (error) {
    console.error('[API /api/projects/members GET] Error:', error);
    return NextResponse.json({ error: 'Database error', members: [] }, { status: 500 });
  }
}
