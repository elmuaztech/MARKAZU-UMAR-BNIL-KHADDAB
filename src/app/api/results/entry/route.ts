import { NextRequest, NextResponse } from 'next/server';
import { MOCK_GRADES } from '@/lib/mockData';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const classId = searchParams.get('classId');
  const subjectId = searchParams.get('subjectId');

  let filtered = MOCK_GRADES;
  if (classId) filtered = filtered.filter((g) => g.classId === classId);
  if (subjectId) filtered = filtered.filter((g) => g.subjectId === subjectId);

  return NextResponse.json({
    status: 200,
    message: 'Assessment entry grid retrieved successfully',
    data: filtered,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { teacherId, programmeId, classId, subjectId, grades } = body;

    if (!teacherId || !classId || !subjectId || !Array.isArray(grades)) {
      return NextResponse.json(
        { status: 400, message: 'Invalid payload parameters: teacherId, classId, subjectId, and grades are required.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: 200,
      message: 'Result entry batch submitted successfully to Administrator Approval Queue',
      data: {
        submissionId: `sub-${Date.now()}`,
        teacherId,
        programmeId,
        classId,
        subjectId,
        totalRecords: grades.length,
        submittedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json({ status: 500, message: 'Internal server error processing result batch entry' }, { status: 500 });
  }
}
