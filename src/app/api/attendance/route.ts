import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const classId = searchParams.get('classId');

    const whereClause: any = {};
    if (date) whereClause.date = new Date(date);
    if (classId) whereClause.classId = classId;

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

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ success: false, error: 'Records array is required' }, { status: 400 });
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
