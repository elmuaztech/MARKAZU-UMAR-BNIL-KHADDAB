import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const teachers = await prisma.teacher.findMany({
      where: { deletedAt: null },
      include: {
        teacherAssignments: {
          include: {
            assignedSubjects: true,
          }
        }
      },
      orderBy: { fullName: 'asc' },
    });

    return NextResponse.json({
      teachers,
      total: teachers.length,
    });
  } catch (error: any) {
    console.error('[GET_TEACHERS_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch teachers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const body = await req.json();

    if (!body.fullName || !body.email || !body.staffNo) {
      return NextResponse.json({ error: 'Full Name, Email, and Staff Number are required.' }, { status: 400 });
    }

    const newTeacher = await prisma.teacher.create({
      data: {
        staffNo: body.staffNo,
        fullName: body.fullName,
        email: body.email,
        phone: body.phone || '',
        qualification: body.qualification || '',
        specialization: body.specialization || '',
        status: body.status || 'ACTIVE',
        userId: body.userId || null,
        dateJoined: body.dateJoined ? new Date(body.dateJoined) : new Date(),
      },
    });

    return NextResponse.json(
      {
        message: 'Teacher record created successfully',
        teacher: newTeacher,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[CREATE_TEACHER_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to create teacher' }, { status: 400 });
  }
}
