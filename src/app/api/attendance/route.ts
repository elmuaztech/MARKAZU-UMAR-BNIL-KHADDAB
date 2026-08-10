import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const classId = searchParams.get('classId');
    const programmeId = searchParams.get('programmeId');
    const userRole = request.headers.get('x-user-role') || searchParams.get('role');
    const userProgId = request.headers.get('x-user-programme-id') || searchParams.get('userProgrammeId');

    // PBAC Check for Headmaster
    if (userRole === 'HEADMASTER') {
      if (programmeId && userProgId && programmeId !== userProgId) {
        return NextResponse.json(
          { success: false, error: 'Access Forbidden (HTTP 403): Headmaster cannot access attendance for another programme.' },
          { status: 403 }
        );
      }
    }

    const whereClause: any = {};
    if (date) whereClause.date = new Date(date);
    if (classId) whereClause.classId = classId;
    if (userRole === 'HEADMASTER' && userProgId) {
      whereClause.programmeId = userProgId;
    } else if (programmeId) {
      whereClause.programmeId = programmeId;
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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { records, isDraft } = body;
    const userRole = request.headers.get('x-user-role') || body.userRole;
    const userProgId = request.headers.get('x-user-programme-id') || body.userProgrammeId;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ success: false, error: 'Records array is required' }, { status: 400 });
    }

    if (userRole === 'HEADMASTER' && userProgId) {
      const hasOtherProg = records.some((r) => r.programmeId && r.programmeId !== userProgId);
      if (hasOtherProg) {
        return NextResponse.json(
          { success: false, error: 'Access Forbidden (HTTP 403): Headmaster cannot submit attendance for another programme.' },
          { status: 403 }
        );
      }
    }

    const createdRecords = [];
    for (const item of records) {
      const rec = await prisma.attendanceRecord.upsert({
        where: {
          id: item.id || `att-${item.classId}-${item.studentId}-${item.date}`,
        },
        update: {
          statusEnum: item.status || 'PRESENT',
          remarks: item.remarks || '',
          isDraft: !!isDraft,
        },
        create: {
          date: new Date(item.date || Date.now()),
          studentId: item.studentId,
          classId: item.classId,
          programmeId: item.programmeId,
          teacherId: item.teacherId,
          status: 'PRESENT',
          statusEnum: item.status || 'PRESENT',
          remarks: item.remarks || '',
          isDraft: !!isDraft,
        },
      });
      createdRecords.push(rec);
    }

    return NextResponse.json({ success: true, count: createdRecords.length, data: createdRecords });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
