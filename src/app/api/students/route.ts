import { NextRequest, NextResponse } from 'next/server';
import { MOCK_STUDENTS } from '../../../lib/mockData';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userRole = req.headers.get('x-user-role') || searchParams.get('role');
  const userProgId = req.headers.get('x-user-programme-id') || searchParams.get('userProgrammeId');
  const requestedProgId = searchParams.get('programmeId');

  // RBAC & PBAC Enforcement for Headmaster
  if (userRole === 'HEADMASTER') {
    if (requestedProgId && userProgId && requestedProgId !== userProgId) {
      return NextResponse.json(
        {
          error: 'Access Forbidden (HTTP 403): Headmaster cannot access students from another programme.',
          status: 403,
        },
        { status: 403 }
      );
    }
  }

  let filtered = MOCK_STUDENTS;
  if (userRole === 'HEADMASTER' && userProgId) {
    filtered = filtered.filter((s) => s.programmeId === userProgId);
  } else if (requestedProgId) {
    filtered = filtered.filter((s) => s.programmeId === requestedProgId);
  }

  return NextResponse.json({
    students: filtered,
    total: filtered.length,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userRole = req.headers.get('x-user-role') || body.userRole;
    const userProgId = req.headers.get('x-user-programme-id') || body.userProgrammeId;

    if (userRole === 'HEADMASTER') {
      if (body.programmeId && userProgId && body.programmeId !== userProgId) {
        return NextResponse.json(
          {
            error: 'Access Forbidden (HTTP 403): Headmaster cannot enroll students into another programme.',
            status: 403,
          },
          { status: 403 }
        );
      }
    }

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
