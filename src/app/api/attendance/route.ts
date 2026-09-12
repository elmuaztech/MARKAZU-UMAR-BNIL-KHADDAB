import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  getAuthenticatedUser,
  enforceRoleAndProgramme,
  verifyTeacherAttendanceAccess,
  resolveTeacherScope,
  getCurrentSchoolSession,
} from '@/lib/auth';
import { getAllServerAttendance, saveServerAttendanceBatch } from '@/lib/serverDb';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER', 'STUDENT', 'PARENT']);
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.reason }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const classId = searchParams.get('classId');
    const requestedProgId = searchParams.get('programmeId');
    const sessionIdParam = searchParams.get('sessionId');
    const studentIdParam = searchParams.get('studentId');

    const whereClause: any = {};

    if (date) whereClause.date = new Date(date);
    if (sessionIdParam) {
      whereClause.sessionId = sessionIdParam;
    }

    // Role-based scoping
    if (authUser?.role === 'HEADMASTER') {
      if (!authUser.assignedProgrammeId) {
        return NextResponse.json({ success: false, error: 'Headmaster has no assigned programme.' }, { status: 403 });
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
        return NextResponse.json({ success: false, error: 'Student profile not found.' }, { status: 404 });
      }
      whereClause.studentId = student.id;
    } else if (authUser?.role === 'PARENT') {
      const parent = await prisma.parent.findFirst({
        where: { OR: [{ userId: authUser.id }, { id: authUser.id }], deletedAt: null },
        include: { wards: { select: { id: true } } },
      });
      if (!parent) {
        return NextResponse.json({ success: false, error: 'Parent record not found.' }, { status: 404 });
      }
      const linkedWards = parent.wards.map((w) => w.id);
      if (studentIdParam) {
        if (!linkedWards.includes(studentIdParam)) {
          return NextResponse.json({ success: false, error: 'Access forbidden: You may only view attendance for your linked children.' }, { status: 403 });
        }
        whereClause.studentId = studentIdParam;
      } else {
        whereClause.studentId = { in: linkedWards };
      }
    } else if (authUser?.role === 'TEACHER') {
      const scope = await resolveTeacherScope(authUser.id, sessionIdParam || undefined);
      if (!scope.isTeacher) {
        return NextResponse.json({ success: false, error: 'Teacher record not found.' }, { status: 403 });
      }
      // Allowed to view attendance only for classes where they teach or have attendance permission
      const allowedClasses = Array.from(new Set([...scope.teachingClassIds, ...scope.attendanceClassIds]));
      if (classId) {
        if (!allowedClasses.includes(classId)) {
          return NextResponse.json({ success: false, error: 'Access forbidden: You are not assigned to this class.' }, { status: 403 });
        }
        whereClause.classId = classId;
      } else {
        whereClause.classId = { in: allowedClasses.length > 0 ? allowedClasses : ['__NO_CLASSES__'] };
      }
      if (studentIdParam) whereClause.studentId = studentIdParam;
    } else {
      // Global Admins
      if (requestedProgId) whereClause.programmeId = requestedProgId;
      if (classId) whereClause.classId = classId;
      if (studentIdParam) whereClause.studentId = studentIdParam;
    }

    const records = await prisma.attendanceRecord.findMany({
      where: whereClause,
      include: {
        student: true,
        schoolClass: true,
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ success: true, data: records });
  } catch (error: any) {
    console.error('[GET_ATTENDANCE_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER']);
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.reason }, { status: authCheck.status });
    }

    const body = await request.json();
    const { records, isDraft, sessionId } = body;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ success: false, error: 'Records array is required' }, { status: 400 });
    }

    // Resolve active session
    let targetSessionId = sessionId;
    if (!targetSessionId) {
      const activeSession = await getCurrentSchoolSession();
      targetSessionId = activeSession?.id || null;
    }

    // Headmaster check
    if (authUser?.role === 'HEADMASTER') {
      const assignedProg = authUser.assignedProgrammeId;
      if (!assignedProg) {
        return NextResponse.json({ success: false, error: 'Headmaster has no assigned programme.' }, { status: 403 });
      }
      const hasOtherProg = records.some((r) => r.programmeId && r.programmeId !== assignedProg);
      if (hasOtherProg) {
        return NextResponse.json(
          { success: false, error: 'Access Forbidden (HTTP 403): Headmaster cannot submit attendance for another programme section.' },
          { status: 403 }
        );
      }
    }

    // Backend verification of Attendance Permission for Teachers
    if (authUser?.role === 'TEACHER') {
      const distinctClassIds = Array.from(new Set(records.map((r: any) => r.classId).filter(Boolean)));
      for (const clsId of distinctClassIds) {
        const check = await verifyTeacherAttendanceAccess(authUser, clsId, targetSessionId || undefined);
        if (!check.authorized) {
          return NextResponse.json(
            {
              success: false,
              error: `Access Forbidden (HTTP 403): ${check.reason || 'You do not have attendance permission for class ' + clsId}`,
            },
            { status: 403 }
          );
        }
      }
    }

    // 1. Save to persistent serverDb JSON database
    const savedServerRecords = saveServerAttendanceBatch(records, !!isDraft);

    // 2. Postgres Prisma upsert
    const createdRecords = [];
    for (const item of records) {
      try {
        const attendanceId = item.id || `att-${item.classId}-${item.studentId}-${item.date ? item.date.split('T')[0] : new Date().toISOString().split('T')[0]}`;
        const recordDate = item.date ? new Date(item.date) : new Date();
        const validStatus = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'MEDICAL_LEAVE', 'OFFICIAL_ASSIGNMENT', 'HOLIDAY'].includes(item.status)
          ? item.status
          : 'PRESENT';

        // Resolve programmeId if missing
        let itemProgId = item.programmeId || null;
        if (!itemProgId && item.classId) {
          const cls = await prisma.schoolClass.findUnique({ where: { id: item.classId }, select: { programmeId: true } });
          itemProgId = cls?.programmeId || null;
        }

        const rec = await prisma.attendanceRecord.upsert({
          where: {
            id: attendanceId,
          },
          update: {
            sessionId: targetSessionId,
            status: validStatus as any,
            statusEnum: validStatus,
            remarks: item.remarks || '',
            isDraft: !!isDraft,
            editedBy: authUser ? `${authUser.name} (${authUser.role})` : undefined,
            editedAt: new Date(),
          },
          create: {
            id: attendanceId,
            sessionId: targetSessionId,
            date: recordDate,
            studentId: item.studentId,
            classId: item.classId,
            programmeId: itemProgId,
            teacherId: item.teacherId || authUser?.id || null,
            status: validStatus as any,
            statusEnum: validStatus,
            remarks: item.remarks || '',
            isDraft: !!isDraft,
            editedBy: authUser ? `${authUser.name} (${authUser.role})` : null,
          },
          include: {
            student: true,
            schoolClass: true,
          },
        });
        createdRecords.push(rec);
      } catch (dbErr) {
        console.error('[PRISMA_ATTENDANCE_UPSERT_ERROR]', dbErr);
      }
    }

    const finalRecords = createdRecords.length > 0 ? createdRecords : savedServerRecords;

    return NextResponse.json({ success: true, count: finalRecords.length, data: finalRecords });
  } catch (error: any) {
    console.error('[POST_ATTENDANCE_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
