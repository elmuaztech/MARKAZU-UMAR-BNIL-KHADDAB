import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme, getCurrentSchoolSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/teachers/assignments
 * Fetch teacher assignments, optionally for a specific teacher and/or session.
 * Authorized: SUPER_ADMIN, ADMIN, HEADMASTER, TEACHER (for own assignments).
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const { searchParams } = new URL(req.url);
    const teacherParam = searchParams.get('teacherId');
    const sessionParam = searchParams.get('sessionId');

    let targetTeacherId = teacherParam;

    // Teachers can only query their own assignments
    if (authUser?.role === 'TEACHER') {
      const teacher = await prisma.teacher.findFirst({
        where: {
          OR: [{ userId: authUser.id }, { id: authUser.id }],
          deletedAt: null,
        },
      });
      if (!teacher) {
        return NextResponse.json({ error: 'Teacher profile not found.' }, { status: 404 });
      }
      targetTeacherId = teacher.id;
    }

    // Determine target session
    let targetSessionId: string | undefined = sessionParam || undefined;
    if (!targetSessionId) {
      const currentSession = await getCurrentSchoolSession();
      targetSessionId = currentSession?.id || undefined;
    }

    const whereClause: any = {};
    if (targetTeacherId) {
      // Allow lookup by teacher.id or user.id
      const teacher = await prisma.teacher.findFirst({
        where: {
          OR: [{ id: targetTeacherId }, { userId: targetTeacherId }],
        },
      });
      if (teacher) {
        whereClause.teacherId = teacher.id;
      } else {
        whereClause.teacherId = targetTeacherId;
      }
    }

    if (targetSessionId) {
      whereClause.OR = [{ sessionId: targetSessionId }, { sessionId: null }];
    }

    // Headmaster scope check
    if (authUser?.role === 'HEADMASTER' && authUser.assignedProgrammeId) {
      whereClause.programmeId = authUser.assignedProgrammeId;
    }

    const assignments = await prisma.teacherAssignment.findMany({
      where: whereClause,
      include: {
        teacher: {
          select: {
            id: true,
            userId: true,
            fullName: true,
            staffNo: true,
            email: true,
          },
        },
        programme: {
          select: {
            id: true,
            nameEnglish: true,
            code: true,
            subcategories: true,
          },
        },
        schoolClass: {
          select: {
            id: true,
            name: true,
            section: true,
            subcategory: true,
            classTeacherId: true,
          },
        },
        assignedSubjects: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        session: {
          select: {
            id: true,
            sessionName: true,
            isCurrent: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      assignments,
      total: assignments.length,
      sessionId: targetSessionId,
    });
  } catch (error: any) {
    console.error('[GET_TEACHER_ASSIGNMENTS_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch assignments' }, { status: 500 });
  }
}

/**
 * POST /api/teachers/assignments
 * Save complete assignment structure for a teacher in a session.
 * Programme -> Category/Subcategory -> Class -> Subjects + Attendance Permission.
 * Authorized: SUPER_ADMIN, ADMIN.
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const body = await req.json();
    const { teacherId, sessionId, assignments } = body;

    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher ID is required.' }, { status: 400 });
    }

    if (!Array.isArray(assignments)) {
      return NextResponse.json({ error: 'Assignments array is required.' }, { status: 400 });
    }

    // Resolve teacher
    const teacher = await prisma.teacher.findFirst({
      where: {
        OR: [{ id: teacherId }, { userId: teacherId }],
        deletedAt: null,
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found.' }, { status: 404 });
    }

    const realTeacherId = teacher.id;

    // Resolve session
    let targetSessionId = sessionId;
    if (!targetSessionId) {
      const activeSession = await getCurrentSchoolSession();
      targetSessionId = activeSession?.id || null;
    }

    // Execute atomic assignment updates
    await prisma.$transaction(async (tx) => {
      // 1. Remove existing assignments for this teacher in this session (or null session)
      const deleteWhere: any = { teacherId: realTeacherId };
      if (targetSessionId) {
        deleteWhere.OR = [{ sessionId: targetSessionId }, { sessionId: null }];
      }
      await tx.teacherAssignment.deleteMany({
        where: deleteWhere,
      });

      // 2. Clear classTeacherId on classes previously managed by this teacher
      await tx.schoolClass.updateMany({
        where: { classTeacherId: realTeacherId },
        data: { classTeacherId: null },
      });

      // 3. Create new assignments
      for (const item of assignments) {
        const { programmeId, classId, subjectIds, canMarkAttendance, isClassTeacher } = item;
        if (!programmeId || !classId) continue;

        // If marked as official class teacher, update schoolClass
        if (isClassTeacher) {
          await tx.schoolClass.update({
            where: { id: classId },
            data: { classTeacherId: realTeacherId },
          });
        }

        const assignment = await tx.teacherAssignment.create({
          data: {
            teacherId: realTeacherId,
            programmeId,
            classId,
            canMarkAttendance: isClassTeacher ? true : Boolean(canMarkAttendance),
            sessionId: targetSessionId,
          },
        });

        // Add subjects if provided
        if (Array.isArray(subjectIds) && subjectIds.length > 0) {
          for (const sId of subjectIds) {
            if (!sId) continue;
            await tx.teacherAssignmentSubject.create({
              data: {
                teacherAssignmentId: assignment.id,
                subjectId: sId,
              },
            });
          }
        }
      }
    });

    // Fetch updated assignments
    const updatedAssignments = await prisma.teacherAssignment.findMany({
      where: { teacherId: realTeacherId },
      include: {
        programme: true,
        schoolClass: true,
        assignedSubjects: {
          include: {
            subject: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Teacher assignments updated successfully.',
      assignments: updatedAssignments,
    });
  } catch (error: any) {
    console.error('[POST_TEACHER_ASSIGNMENTS_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to save assignments' }, { status: 500 });
  }
}
