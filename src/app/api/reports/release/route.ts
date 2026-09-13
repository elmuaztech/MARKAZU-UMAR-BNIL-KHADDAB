import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme, getCurrentSchoolSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Report Card Release / Publish Endpoint
 * Transitions verified APPROVED grades to officially RELEASED state.
 * Generates targeted in-app notifications strictly for the linked parents of released children.
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER']);
    if (!authCheck.authorized || !authUser) {
      return NextResponse.json({ success: false, error: authCheck.reason || 'Unauthorized' }, { status: authCheck.status || 401 });
    }

    const body = await request.json();
    const { sessionId, term, classId, programmeId, studentId } = body;

    // Resolve active session if not explicitly provided
    let targetSessionId = sessionId;
    let targetSessionName = '';
    const activeSession = await getCurrentSchoolSession();
    if (!targetSessionId) {
      targetSessionId = activeSession?.id;
      targetSessionName = activeSession?.sessionName || '';
    } else {
      const s = await prisma.schoolSession.findUnique({ where: { id: targetSessionId } });
      targetSessionName = s?.sessionName || '';
    }

    const targetTerm = term || activeSession?.activeTerm || 'Term 1';

    // Build query filter
    const whereClause: any = {
      term: targetTerm,
      status: 'APPROVED',
    };

    if (targetSessionId) {
      whereClause.sessionId = targetSessionId;
    }

    if (studentId) {
      whereClause.studentId = studentId;
    } else if (classId) {
      whereClause.classId = classId;
    }

    // Headmaster scope check
    if (authUser.role === 'HEADMASTER') {
      const assignedProg = authUser.assignedProgrammeId;
      if (!assignedProg) {
        return NextResponse.json({ success: false, error: 'Headmaster has no assigned section.' }, { status: 403 });
      }
      whereClause.programmeId = assignedProg;
    } else if (programmeId) {
      whereClause.programmeId = programmeId;
    }

    // 1. Find approved grades to release
    const approvedGrades = await prisma.gradeRecord.findMany({
      where: whereClause,
      select: {
        id: true,
        studentId: true,
        classId: true,
        sessionId: true,
        term: true,
      },
    });

    if (approvedGrades.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No approved grades found matching the specified criteria. Results must be submitted and approved before official release.',
      }, { status: 400 });
    }

    // 2. Mark grades as officially RELEASED
    const gradeIds = approvedGrades.map((g) => g.id);
    await prisma.gradeRecord.updateMany({
      where: { id: { in: gradeIds } },
      data: {
        isReleased: true,
        releasedAt: new Date(),
        releasedBy: authUser.name,
      },
    });

    // Also update any matching ResultApprovalSubmission records
    await prisma.resultApprovalSubmission.updateMany({
      where: {
        term: targetTerm,
        status: 'APPROVED',
        ...(classId ? { classId } : {}),
        ...(programmeId ? { programmeId } : {}),
      },
      data: {
        isReleased: true,
        releasedAt: new Date(),
      },
    }).catch(() => {});

    // 3. Resolve distinct released students and notify ONLY their linked parents
    const distinctStudentIds = Array.from(new Set(approvedGrades.map((g) => g.studentId)));
    const releasedStudents = await prisma.student.findMany({
      where: { id: { in: distinctStudentIds } },
      include: {
        parent: {
          select: { id: true, userId: true, fullName: true },
        },
      },
    });

    let notifiedParentsCount = 0;

    for (const student of releasedStudents) {
      const parentUserId = student.parent?.userId || student.guardianId;
      if (!parentUserId) continue;

      const deduplicationToken = `REPORT_RELEASE_${student.id}_${targetSessionId || 'CURR'}_${targetTerm}`;

      // Check if notification already dispatched for this student/session/term
      const existingNotif = await prisma.inAppNotification.findFirst({
        where: {
          userId: parentUserId,
          category: 'REPORT_CARD',
          metadata: { contains: deduplicationToken },
        },
      });

      if (!existingNotif) {
        await prisma.inAppNotification.create({
          data: {
            userId: parentUserId,
            title: 'Report Ready',
            body: `Your child's ${targetTerm} report for ${targetSessionName || 'the current academic session'} is ready.`,
            category: 'REPORT_CARD',
            priority: 'NORMAL',
            senderName: 'Management Office',
            metadata: JSON.stringify({
              deduplicationToken,
              studentId: student.id,
              childName: student.fullName,
              term: targetTerm,
              session: targetSessionName,
              action: 'VIEW_REPORT',
              deepLink: `/dashboard/results?studentId=${student.id}`,
            }),
          },
        });
        notifiedParentsCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully released report cards for ${distinctStudentIds.length} children. Notified ${notifiedParentsCount} linked parent accounts.`,
      releasedGradesCount: gradeIds.length,
      releasedStudentsCount: distinctStudentIds.length,
      notifiedParentsCount,
    });
  } catch (error: any) {
    console.error('[POST_REPORT_RELEASE_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
