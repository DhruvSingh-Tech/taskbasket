import { NextResponse } from 'next/server';
import { db } from '@/db';
import { activities, projectMembers, user } from '@/db/schema';
import { auth } from '@/lib/auth';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    // Verify user is a member of this project
    const membership = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, session.user.id)
        )
      )
      .limit(1);

    if (membership.length === 0) {
      return NextResponse.json({ error: 'Forbidden: Not a project member' }, { status: 403 });
    }

    // Query activities for this project with user details
    const activityRows = await db
      .select({
        id: activities.id,
        projectId: activities.projectId,
        taskId: activities.taskId,
        taskTitle: activities.taskTitle,
        type: activities.type,
        details: activities.details,
        timestamp: activities.timestamp,
        userId: activities.userId,
        userName: user.name,
        userEmail: user.email,
        userImage: user.image,
      })
      .from(activities)
      .leftJoin(user, eq(activities.userId, user.id))
      .where(eq(activities.projectId, projectId))
      .orderBy(desc(activities.timestamp))
      .limit(60);

    const formattedActivities = activityRows.map((row) => ({
      id: row.id,
      projectId: row.projectId || projectId,
      taskId: row.taskId || undefined,
      taskTitle: row.taskTitle,
      type: row.type as any,
      details: row.details || '',
      timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString(),
      user: {
        id: row.userId || 'unknown',
        name: row.userName || 'Member',
        email: row.userEmail || '',
        avatar: row.userImage || '',
        color: '#3B82F6',
        role: 'Member',
      },
    }));

    return NextResponse.json({ success: true, activities: formattedActivities });
  } catch (error) {
    console.error('[API /api/activities GET] Error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
