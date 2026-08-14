import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';

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

    const whereClause: any = {};
    if (classId) whereClause.classId = classId;
    if (subjectId) whereClause.subjectId = subjectId;
    if (term) whereClause.term = term;
    if (session) whereClause.session = session;

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
    const { teacherId, teacherName, programmeId, programmeName, classId, className, subjectId, subjectName, term, session, grades } = body;

    if (!classId || !subjectId || !Array.isArray(grades)) {
      return NextResponse.json(
        { status: 400, message: 'Invalid payload parameters: classId, subjectId, and grades are required.' },
        { status: 400 }
      );
    }

    const submissionId = `sub-${Date.now()}`;
    const activeTerm = term || 'Term 1';
    const activeSession = session || '1447/1448 AH (2025/2026 AD)';

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
          term: activeTerm,
          session: activeSession,
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
        session: activeSession,
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
