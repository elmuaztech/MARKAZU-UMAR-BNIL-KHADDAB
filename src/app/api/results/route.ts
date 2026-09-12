import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  getAuthenticatedUser,
  enforceRoleAndProgramme,
  verifyTeacherAcademicAccess,
  resolveTeacherScope,
  getCurrentSchoolSession,
} from '@/lib/auth';

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
    const studentIdParam = searchParams.get('studentId');
    const sessionIdParam = searchParams.get('sessionId');
    const term = searchParams.get('term');

    const whereClause: any = {};

    // 1. Session Filter
    if (sessionIdParam) {
      whereClause.OR = [{ sessionId: sessionIdParam }, { session: sessionIdParam }];
    }

    if (term) {
      whereClause.term = term;
    }

    // 2. Role-based scoping
    if (authUser?.role === 'SUPER_ADMIN' || authUser?.role === 'ADMIN') {
      if (requestedProgId) whereClause.programmeId = requestedProgId;
      if (classId) whereClause.classId = classId;
      if (studentIdParam) whereClause.studentId = studentIdParam;
    } else if (authUser?.role === 'HEADMASTER') {
      if (!authUser.assignedProgrammeId) {
        return NextResponse.json({ error: 'Headmaster has no assigned programme.' }, { status: 403 });
      }
      whereClause.programmeId = authUser.assignedProgrammeId;
      if (classId) whereClause.classId = classId;
      if (studentIdParam) whereClause.studentId = studentIdParam;
    } else if (authUser?.role === 'STUDENT') {
      const student = await prisma.student.findFirst({
        where: { OR: [{ userId: authUser.id }, { id: authUser.id }], status: 'ACTIVE', deletedAt: null },
        select: { id: true },
      });
      if (!student) {
        return NextResponse.json({ error: 'Student record not found.' }, { status: 404 });
      }
      // Strictly enforce own studentId
      whereClause.studentId = student.id;
    } else if (authUser?.role === 'PARENT') {
      const parent = await prisma.parent.findFirst({
        where: { OR: [{ userId: authUser.id }, { id: authUser.id }], deletedAt: null },
        include: { wards: { select: { id: true } } },
      });
      if (!parent) {
        return NextResponse.json({ error: 'Parent record not found.' }, { status: 404 });
      }
      const linkedWards = parent.wards.map((w) => w.id);
      if (studentIdParam) {
        if (!linkedWards.includes(studentIdParam)) {
          return NextResponse.json({ error: 'Access forbidden: You may only view results for your linked children.' }, { status: 403 });
        }
        whereClause.studentId = studentIdParam;
      } else {
        whereClause.studentId = { in: linkedWards };
      }
    } else if (authUser?.role === 'TEACHER') {
      const scope = await resolveTeacherScope(authUser.id, sessionIdParam || undefined);
      if (!scope.isTeacher) {
        return NextResponse.json({ error: 'Teacher record not found.' }, { status: 403 });
      }

      if (classId) {
        if (!scope.teachingClassIds.includes(classId)) {
          return NextResponse.json({ error: 'Access forbidden: You are not assigned to teach this class.' }, { status: 403 });
        }
        whereClause.classId = classId;
        const assignedSubjects = scope.subjectMap[classId] || [];
        whereClause.subjectId = { in: assignedSubjects };
      } else {
        whereClause.classId = { in: scope.teachingClassIds.length > 0 ? scope.teachingClassIds : ['__NO_CLASSES__'] };
      }

      if (studentIdParam) whereClause.studentId = studentIdParam;
    }

    const grades = await prisma.gradeRecord.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            admissionNo: true,
            fullName: true,
          },
        },
        schoolClass: {
          select: {
            id: true,
            name: true,
            section: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
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
    const { studentId, classId, subjectId, sessionId } = body;

    if (!studentId || !classId || !subjectId) {
      return NextResponse.json({ error: 'Student, Class, and Subject are required.' }, { status: 400 });
    }

    // Determine target session
    let targetSessionId = sessionId;
    let targetSessionName = body.sessionName || body.session;
    if (!targetSessionId || !targetSessionName) {
      const activeSession = await getCurrentSchoolSession();
      if (activeSession) {
        if (!targetSessionId) targetSessionId = activeSession.id;
        if (!targetSessionName) targetSessionName = activeSession.sessionName;
      }
    }

    // Backend authorization for Teacher
    const accessCheck = await verifyTeacherAcademicAccess(authUser!, classId, subjectId, targetSessionId);
    if (!accessCheck.authorized) {
      return NextResponse.json(
        { error: accessCheck.reason || 'You are not authorized to submit grades for this subject in this class.' },
        { status: 403 }
      );
    }

    const ca1 = Number(body.ca1Score || body.caScore || 0);
    const ca2 = Number(body.ca2Score || 0);
    const exam = Number(body.examScore || 0);
    const total = ca1 + ca2 + exam;

    const gradeRecord = await prisma.gradeRecord.create({
      data: {
        studentId,
        classId,
        subjectId,
        programmeId: body.programmeId || null,
        ca1Score: ca1,
        ca2Score: ca2,
        examScore: exam,
        totalScore: total,
        grade: body.grade || 'A',
        remarks: body.remarks || 'EXCELLENT',
        term: body.term || 'Term 1',
        session: targetSessionName || '2026/2027',
        sessionId: targetSessionId,
        teacherId: authUser?.id || null,
      },
    });

    return NextResponse.json({
      success: true,
      gradeRecord,
    });
  } catch (error: any) {
    console.error('[POST_RESULTS_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to submit grade result' }, { status: 500 });
  }
}
