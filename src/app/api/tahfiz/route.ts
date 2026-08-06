import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const classId = searchParams.get('classId');

    const whereClause: any = {};
    if (studentId) whereClause.studentId = studentId;
    if (classId) whereClause.classId = classId;

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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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

    if (!studentId || !classId || !teacherId) {
      return NextResponse.json({ success: false, error: 'studentId, classId, and teacherId are required' }, { status: 400 });
    }

    const record = await prisma.tahfizRecord.create({
      data: {
        studentId,
        classId,
        programmeId,
        teacherId,
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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
