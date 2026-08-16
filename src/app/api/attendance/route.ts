import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';
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

    // PBAC Check for Headmaster
    if (authUser?.role === 'HEADMASTER') {
      const assignedProg = authUser.assignedProgrammeId;
      if (requestedProgId && assignedProg && requestedProgId !== assignedProg) {
        return NextResponse.json(
          { success: false, error: `Access Forbidden (HTTP 403): Headmaster is restricted to programme ID "${assignedProg}" and cannot access attendance for another section.` },
          { status: 403 }
        );
      }
    }

    const targetProgId = authUser?.role === 'HEADMASTER' ? authUser.assignedProgrammeId : requestedProgId;

    const whereClause: any = {};
    if (date) whereClause.date = new Date(date);
    if (classId) whereClause.classId = classId;
    if (targetProgId) whereClause.programmeId = targetProgId;

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
    const { records, isDraft } = body;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ success: false, error: 'Records array is required' }, { status: 400 });
    }

    if (authUser?.role === 'HEADMASTER') {
      const assignedProg = authUser.assignedProgrammeId;
      const hasOtherProg = records.some((r) => r.programmeId && assignedProg && r.programmeId !== assignedProg);
      if (hasOtherProg) {
        return NextResponse.json(
          { success: false, error: 'Access Forbidden (HTTP 403): Headmaster cannot submit attendance for another programme section.' },
          { status: 403 }
        );
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
            status: validStatus as any,
            statusEnum: validStatus,
            remarks: item.remarks || '',
            isDraft: !!isDraft,
            editedBy: authUser ? `${authUser.name} (${authUser.role})` : undefined,
            editedAt: new Date(),
          },
          create: {
            id: attendanceId,
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
