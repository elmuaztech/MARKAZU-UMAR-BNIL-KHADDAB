import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  getAuthenticatedUser,
  enforceRoleAndProgramme,
  verifyTeacherAcademicAccess,
  getCurrentSchoolSession,
  resolveTeacherScope,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER', 'STUDENT', 'PARENT']);
    if (!authCheck.authorized) {
      return NextResponse.json({ status: authCheck.status, message: authCheck.reason, data: [] }, { status: authCheck.status });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');
    const term = searchParams.get('term');
    const session = searchParams.get('session');
    const sessionId = searchParams.get('sessionId');

    // Role-based verification
    if (authUser?.role === 'TEACHER' && classId && subjectId) {
      const accessCheck = await verifyTeacherAcademicAccess(authUser, classId, subjectId, sessionId || undefined);
      if (!accessCheck.authorized) {
        return NextResponse.json(
          { status: 403, message: accessCheck.reason || 'You are not authorized to view results for this subject and class.', data: [] },
          { status: 403 }
        );
      }
    } else if (authUser?.role === 'HEADMASTER' && classId) {
      if (!authUser.assignedProgrammeId) {
        return NextResponse.json({ status: 403, message: 'Headmaster has no assigned programme.', data: [] }, { status: 403 });
      }
      const schoolClass = await prisma.schoolClass.findUnique({
        where: { id: classId },
        select: { programmeId: true },
      });
      if (schoolClass?.programmeId !== authUser.assignedProgrammeId) {
        return NextResponse.json({ status: 403, message: 'Class does not belong to your assigned programme.', data: [] }, { status: 403 });
      }
    }

    const whereClause: any = {};
    if (classId) whereClause.classId = classId;
    if (subjectId) whereClause.subjectId = subjectId;
    if (term) whereClause.term = term;

    if (sessionId) {
      whereClause.OR = [{ sessionId }, { session: sessionId }];
    } else if (session) {
      whereClause.session = session;
    }

    if (authUser?.role === 'STUDENT') {
      const student = await prisma.student.findFirst({
        where: { OR: [{ userId: authUser.id }, { id: authUser.id }], status: 'ACTIVE', deletedAt: null },
        select: { id: true },
      });
      whereClause.studentId = student?.id || '__NO_STUDENT__';
    } else if (authUser?.role === 'PARENT') {
      const parent = await prisma.parent.findFirst({
        where: { OR: [{ userId: authUser.id }, { id: authUser.id }], deletedAt: null },
        include: { wards: { select: { id: true } } },
      });
      const wardIds = parent?.wards.map((w) => w.id) || [];
      whereClause.studentId = { in: wardIds.length > 0 ? wardIds : ['__NO_STUDENTS__'] };
    }

    const grades = await prisma.gradeRecord.findMany({
      where: whereClause,
      include: {
        student: true,
        subject: true,
        schoolClass: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      status: 200,
      message: 'Assessment entry grid retrieved successfully',
      data: grades,
    });
  } catch (error: any) {
    console.error('[GET_GRADES_ENTRY_ERROR]', error);
    return NextResponse.json({ status: 500, message: error.message || 'Failed to fetch grades', data: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER']);
    if (!authCheck.authorized) {
      return NextResponse.json({ status: authCheck.status, message: authCheck.reason }, { status: authCheck.status });
    }

    const body = await req.json();
    const { teacherId, teacherName, programmeId, programmeName, classId, className, subjectId, subjectName, term, session, sessionId, grades } = body;

    if (!classId || !subjectId || !Array.isArray(grades)) {
      return NextResponse.json(
        { status: 400, message: 'Invalid payload parameters: classId, subjectId, and grades are required.' },
        { status: 400 }
      );
    }

    // Resolve active session dynamically from database
    let targetSessionId = sessionId;
    let activeSessionName = session;
    if (!targetSessionId || !activeSessionName) {
      const currentSession = await getCurrentSchoolSession();
      if (currentSession) {
        if (!targetSessionId) targetSessionId = currentSession.id;
        if (!activeSessionName) activeSessionName = currentSession.sessionName;
      }
    }

    // Backend authorization for Teacher
    const accessCheck = await verifyTeacherAcademicAccess(authUser!, classId, subjectId, targetSessionId);
    if (!accessCheck.authorized) {
      return NextResponse.json(
        { status: 403, message: accessCheck.reason || 'You are not authorized to submit grades for this subject in this class.' },
        { status: 403 }
      );
    }

    const submissionId = `sub-${Date.now()}`;
    const activeTerm = term || 'Term 1';
    const finalSession = activeSessionName || '2026/2027';

    // Persist or update grade records in PostgreSQL
    for (const g of grades) {
      if (!g.studentId) continue;
      const totalScore = (Number(g.assignmentScore) || 0) +
        (Number(g.ca1Score) || 0) +
        (Number(g.ca2Score) || 0) +
        (Number(g.testScore) || 0) +
        (Number(g.projectScore) || 0) +
        (Number(g.practicalScore) || 0) +
        (Number(g.examScore) || 0);

      await prisma.gradeRecord.upsert({
        where: {
          id: g.id || `grd-${g.studentId}-${subjectId}-${activeTerm}`,
        },
        create: {
          id: g.id || `grd-${g.studentId}-${subjectId}-${activeTerm}`,
          studentId: g.studentId,
          programmeId: programmeId || null,
          classId,
          subjectId,
          teacherId: teacherId || authUser?.id || null,
          sessionId: targetSessionId,
          term: activeTerm,
          session: finalSession,
          assignmentScore: Number(g.assignmentScore) || 0,
          ca1Score: Number(g.ca1Score) || 0,
          ca2Score: Number(g.ca2Score) || 0,
          testScore: Number(g.testScore) || 0,
          projectScore: Number(g.projectScore) || 0,
          practicalScore: Number(g.practicalScore) || 0,
          examScore: Number(g.examScore) || 0,
          totalScore,
          grade: g.grade || (totalScore >= 75 ? 'A' : totalScore >= 60 ? 'B' : totalScore >= 50 ? 'C' : totalScore >= 40 ? 'D' : 'F'),
          remarks: g.remarks || 'Satisfactory',
          status: 'SUBMITTED',
          submissionId,
          submittedAt: new Date(),
        },
        update: {
          sessionId: targetSessionId,
          assignmentScore: Number(g.assignmentScore) || 0,
          ca1Score: Number(g.ca1Score) || 0,
          ca2Score: Number(g.ca2Score) || 0,
          testScore: Number(g.testScore) || 0,
          projectScore: Number(g.projectScore) || 0,
          practicalScore: Number(g.practicalScore) || 0,
          examScore: Number(g.examScore) || 0,
          totalScore,
          grade: g.grade || (totalScore >= 75 ? 'A' : totalScore >= 60 ? 'B' : totalScore >= 50 ? 'C' : totalScore >= 40 ? 'D' : 'F'),
          remarks: g.remarks || 'Satisfactory',
          status: 'SUBMITTED',
          submissionId,
          submittedAt: new Date(),
        },
      });
    }

    // Create ResultApprovalSubmission
    await prisma.resultApprovalSubmission.create({
      data: {
        id: submissionId,
        teacherId: teacherId || authUser?.id || 'unknown',
        teacherName: teacherName || authUser?.name || 'Teacher',
        programmeId: programmeId || 'prog-default',
        programmeName: programmeName || 'General',
        classId,
        className: className || 'Class',
        subjectId,
        subjectName: subjectName || 'Subject',
        term: activeTerm,
        session: finalSession,
        totalStudents: grades.length,
        completedRecords: grades.length,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      status: 200,
      message: 'Result entry batch submitted successfully to Administrator Approval Queue',
      data: {
        submissionId,
        teacherId,
        programmeId,
        classId,
        subjectId,
        totalRecords: grades.length,
        submittedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[POST_GRADES_ENTRY_ERROR]', error);
    return NextResponse.json({ status: 500, message: error.message || 'Internal server error processing result batch entry' }, { status: 500 });
  }
}
