import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';

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

    const record = await prisma.tahfizRecord.create({
      data: {
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

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    console.error('[POST_TAHFIZ_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
