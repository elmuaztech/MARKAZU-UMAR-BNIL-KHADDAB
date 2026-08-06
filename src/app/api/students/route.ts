import { NextRequest, NextResponse } from 'next/server';
import { MOCK_STUDENTS } from '../../../lib/mockData';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return NextResponse.json({
    students: MOCK_STUDENTS,
    total: MOCK_STUDENTS.length,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return NextResponse.json(
      {
        message: 'Student enrolled successfully',
        student: { id: `usr-student-${Date.now()}`, ...body },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
