import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER', 'STUDENT', 'PARENT']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');
    const teacherId = searchParams.get('teacherId');
    const programmeId = searchParams.get('programmeId');

    const whereClause: any = {};
    if (classId) whereClause.classId = classId;
    if (teacherId) whereClause.teacherId = teacherId;
    if (programmeId) whereClause.programmeId = programmeId;

    const periods = await prisma.timetablePeriod.findMany({
      where: whereClause,
      include: {
        schoolClass: true,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return NextResponse.json({
      timetablePeriods: periods,
      total: periods.length,
    });
  } catch (error: any) {
    console.error('[GET_TIMETABLE_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch timetable' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const body = await req.json();

    if (!body.classId || !body.subjectId || !body.teacherId || !body.dayOfWeek) {
      return NextResponse.json({ error: 'Class, Subject, Teacher, and Day are required.' }, { status: 400 });
    }

    const created = await prisma.timetablePeriod.create({
      data: {
        id: body.id,
        programmeId: body.programmeId || null,
        classId: body.classId,
        subjectId: body.subjectId,
        subjectName: body.subjectName || '',
        teacherId: body.teacherId,
        teacherName: body.teacherName || '',
        dayOfWeek: body.dayOfWeek,
        startTime: body.startTime || '08:00 AM',
        endTime: body.endTime || '09:00 AM',
        room: body.room || null,
      },
    });

    return NextResponse.json(
      {
        message: 'Timetable period created',
        period: created,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[CREATE_TIMETABLE_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to create timetable period' }, { status: 400 });
  }
}
