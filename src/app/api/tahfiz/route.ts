import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme, resolveTeacherScope } from '@/lib/auth';
import { getAllServerTahfiz, createServerTahfizRecord } from '@/lib/serverDb';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER', 'STUDENT', 'PARENT']);
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.reason }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const classId = searchParams.get('classId');
    const requestedProgId = searchParams.get('programmeId');

    if (authUser?.role === 'HEADMASTER') {
      const assignedProg = authUser.assignedProgrammeId;
      if (requestedProgId && assignedProg && requestedProgId !== assignedProg) {
        return NextResponse.json(
          { success: false, error: `Access Forbidden (HTTP 403): Headmaster is restricted to programme ID "${assignedProg}" and cannot access Tahfiz records for another section.` },
          { status: 403 }
        );
      }
    }

    const targetProgId = authUser?.role === 'HEADMASTER' ? authUser.assignedProgrammeId : requestedProgId;

    const whereClause: any = {};
    if (studentId) whereClause.studentId = studentId;
    if (classId) whereClause.classId = classId;
    if (targetProgId) whereClause.programmeId = targetProgId;

    if (authUser?.role === 'PARENT') {
      const parent = await prisma.parent.findFirst({
        where: { OR: [{ userId: authUser.id }, { id: authUser.id }], deletedAt: null },
        include: { wards: { select: { id: true } } },
      });
      const allowedStudentIds = parent?.wards.map((w) => w.id) || [];
      if (studentId && !allowedStudentIds.includes(studentId)) {
        return NextResponse.json(
          { success: false, error: 'Access Denied: You are not authorized to view Tahfiz records for this child.' },
          { status: 403 }
        );
      }
      whereClause.studentId = { in: allowedStudentIds };
    } else if (authUser?.role === 'STUDENT') {
      const student = await prisma.student.findFirst({
        where: { OR: [{ userId: authUser.id }, { id: authUser.id }], deletedAt: null },
        select: { id: true },
      });
      if (studentId && (!student || student.id !== studentId)) {
        return NextResponse.json(
          { success: false, error: 'Access Denied: You can only view your own Tahfiz records.' },
          { status: 403 }
        );
      }
      whereClause.studentId = student?.id || '__NO_STUDENT__';
    } else if (authUser?.role === 'TEACHER') {
      const scope = await resolveTeacherScope(authUser.id);
      const allowedClasses = Array.from(new Set([...scope.teachingClassIds, ...scope.attendanceClassIds]));
      if (classId && !allowedClasses.includes(classId)) {
        return NextResponse.json(
          { success: false, error: 'Access Denied: You are not assigned to this class.' },
          { status: 403 }
        );
      }
      if (!classId) {
        whereClause.classId = { in: allowedClasses.length > 0 ? allowedClasses : ['__NO_CLASSES__'] };
      }
    }

    const records = await prisma.tahfizRecord.findMany({
      where: whereClause,
      include: {
        student: true,
        schoolClass: true,
        teacher: true,
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ success: true, data: records });
  } catch (error: any) {
    console.error('[GET_TAHFIZ_ERROR]', error);
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
    const {
      studentId,
      classId,
      programmeId,
      teacherId,
      hifzSurah,
      hifzFromAyah,
      hifzToAyah,
      hifzPages,
      currentJuz,
      sabkiSurah,
      sabkiRating,
      manzilJuz,
      manzilRating,
      teacherNotes,
      studentBehaviour,
      completionPercentage,
    } = body;

    if (!studentId || !classId) {
      return NextResponse.json({ success: false, error: 'studentId and classId are required' }, { status: 400 });
    }

    if (authUser?.role === 'HEADMASTER') {
      const assignedProg = authUser.assignedProgrammeId;
      if (programmeId && assignedProg && programmeId !== assignedProg) {
        return NextResponse.json(
          { success: false, error: 'Access Forbidden (HTTP 403): Headmaster cannot create Tahfiz records for another programme.' },
          { status: 403 }
        );
      }
    }

    // 1. Save to persistent serverDb JSON database
    const serverRecord = createServerTahfizRecord({
      studentId,
      classId,
      programmeId: programmeId || authUser?.assignedProgrammeId || 'prog-01',
      teacherId: teacherId || authUser?.id || 'usr-teacher-1',
      hifzSurah,
      hifzFromAyah,
      hifzToAyah,
      hifzPages,
      currentJuz,
      sabkiSurah,
      sabkiRating,
      manzilJuz,
      manzilRating,
      teacherNotes,
      studentBehaviour,
      completionPercentage,
    });

    // 2. Try Postgres Prisma create
    let prismaRecord: any = null;
    try {
      prismaRecord = await prisma.tahfizRecord.create({
        data: {
          id: serverRecord.id,
          studentId,
          classId,
          programmeId: programmeId || authUser?.assignedProgrammeId || 'prog-01',
          teacherId: teacherId || authUser?.id || 'usr-teacher-1',
          hifzSurah: hifzSurah || 'Surah Al-Fatihah',
          hifzFromAyah: Number(hifzFromAyah || 1),
          hifzToAyah: Number(hifzToAyah || 1),
          hifzPages: Number(hifzPages || 1.0),
          currentJuz: Number(currentJuz || 1),
          sabkiSurah: sabkiSurah || '',
          sabkiRating: Number(sabkiRating || 5),
          manzilJuz: Number(manzilJuz || 1),
          manzilRating: Number(manzilRating || 5),
          teacherNotes: teacherNotes || '',
          studentBehaviour: studentBehaviour || 'EXCELLENT',
          completionPercentage: Number(completionPercentage || 0),
        },
      });
    } catch (dbErr) {
      console.warn('[POST_TAHFIZ] Postgres write warning, saved to serverDb:', dbErr);
    }

    const finalRecord = prismaRecord || serverRecord;

    return NextResponse.json({ success: true, data: finalRecord });
  } catch (error: any) {
    console.error('[POST_TAHFIZ_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
