import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER', 'PARENT']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const { searchParams } = new URL(req.url);
    const requestedProgId = searchParams.get('programmeId');

    // Headmaster Programme Scoping Check
    if (authUser?.role === 'HEADMASTER') {
      const assignedProg = authUser.assignedProgrammeId;
      if (requestedProgId && assignedProg && requestedProgId !== assignedProg) {
        return NextResponse.json(
          { error: `Access Forbidden (HTTP 403): Headmaster is restricted to programme ID "${assignedProg}" and cannot access another section.` },
          { status: 403 }
        );
      }
    }

    const targetProgId = authUser?.role === 'HEADMASTER' ? authUser.assignedProgrammeId : requestedProgId;

    const whereClause: any = { deletedAt: null };
    if (targetProgId) {
      whereClause.schoolClass = {
        programmeId: targetProgId,
      };
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        schoolClass: true,
        parent: true,
      },
      orderBy: { fullName: 'asc' },
    });

    return NextResponse.json({
      students,
      total: students.length,
    });
  } catch (error: any) {
    console.error('[GET_STUDENTS_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch students' }, { status: 500 });
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

    if (authUser?.role === 'HEADMASTER') {
      const assignedProg = authUser.assignedProgrammeId;
      if (body.programmeId && assignedProg && body.programmeId !== assignedProg) {
        return NextResponse.json(
          { error: `Access Forbidden (HTTP 403): Headmaster cannot enroll students into another programme section.` },
          { status: 403 }
        );
      }
      body.programmeId = assignedProg;
    }

    const newStudent = await prisma.student.create({
      data: {
        admissionNo: body.admissionNo || `MUBK-STU-${Date.now().toString().slice(-4)}`,
        fullName: body.name || body.fullName || 'Student Name',
        gender: body.gender || 'MALE',
        dob: body.dob ? new Date(body.dob) : new Date('2015-01-01'),
        classId: body.classId || 'cls-01',
        guardianId: body.guardianId || 'prnt-01',
        status: 'ACTIVE',
      },
    });

    return NextResponse.json(
      {
        message: 'Student enrolled successfully in database',
        student: newStudent,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[CREATE_STUDENT_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to enroll student' }, { status: 400 });
  }
}
