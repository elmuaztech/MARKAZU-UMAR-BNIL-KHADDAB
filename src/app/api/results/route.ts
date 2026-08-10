import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER', 'STUDENT', 'PARENT']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const { searchParams } = new URL(req.url);
    const requestedProgId = searchParams.get('programmeId');
    const classId = searchParams.get('classId');
    const studentId = searchParams.get('studentId');

    if (authUser?.role === 'HEADMASTER') {
      const assignedProg = authUser.assignedProgrammeId;
      if (requestedProgId && assignedProg && requestedProgId !== assignedProg) {
        return NextResponse.json(
          { error: `Access Forbidden (HTTP 403): Headmaster is restricted to programme ID "${assignedProg}" and cannot view results for another section.` },
          { status: 403 }
        );
      }
    }

    const targetProgId = authUser?.role === 'HEADMASTER' ? authUser.assignedProgrammeId : requestedProgId;

    const whereClause: any = {};
    if (targetProgId) whereClause.programmeId = targetProgId;
    if (classId) whereClause.classId = classId;
    if (studentId) whereClause.studentId = studentId;

    const grades = await prisma.gradeRecord.findMany({
      where: whereClause,
      include: {
        student: true,
        schoolClass: true,
        subject: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      grades,
      total: grades.length,
    });
  } catch (error: any) {
    console.error('[GET_RESULTS_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch grade results' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const body = await req.json();

    if (authUser?.role === 'HEADMASTER') {
      const assignedProg = authUser.assignedProgrammeId;
      if (body.programmeId && assignedProg && body.programmeId !== assignedProg) {
        return NextResponse.json(
          { error: `Access Forbidden (HTTP 403): Headmaster cannot enter grade results for another programme section.` },
          { status: 403 }
        );
      }
      body.programmeId = assignedProg;
    }

    const ca1 = Number(body.ca1Score || body.caScore || 0);
    const ca2 = Number(body.ca2Score || 0);
    const exam = Number(body.examScore || 0);
    const total = ca1 + ca2 + exam;

    const gradeRecord = await prisma.gradeRecord.create({
      data: {
        studentId: body.studentId,
        classId: body.classId,
        subjectId: body.subjectId,
        programmeId: body.programmeId || authUser?.assignedProgrammeId || 'prog-01',
        ca1Score: ca1,
        ca2Score: ca2,
        examScore: exam,
        totalScore: total,
        grade: body.grade || 'A',
        remarks: body.remarks || 'EXCELLENT',
        term: body.term || 'Term 2',
        session: body.sessionName || body.session || '2025/2026',
        teacherId: authUser?.id || 'usr-teacher-1',
      },
    });

    return NextResponse.json(
      {
        message: 'Grade recorded successfully in database',
        gradeRecord,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[CREATE_RESULT_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to record grade' }, { status: 400 });
  }
}
