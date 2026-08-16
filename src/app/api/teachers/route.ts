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

    const email = body.email.trim().toLowerCase();
    const staffNo = body.staffNo.trim();
    const fullName = body.fullName.trim();

    // Check if Teacher or User record already exists (Active or Deactivated)
    let existingAnyUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: staffNo },
        ],
      },
      include: {
        teacher: true,
      },
    });

    if (existingAnyUser) {
      const isDeactivated = existingAnyUser.deletedAt !== null || existingAnyUser.status === 'DEACTIVATED';
      if (isDeactivated) {
        return NextResponse.json(
          {
            isDeactivated: true,
            error: 'This email belongs to a previously deactivated account.',
            message: 'This email belongs to a previously deactivated account.',
            deactivatedUser: {
              id: existingAnyUser.id,
              name: existingAnyUser.name,
              username: existingAnyUser.username,
              email: existingAnyUser.email,
              role: existingAnyUser.role,
              status: existingAnyUser.status,
              deletedAt: existingAnyUser.deletedAt,
              teacher: existingAnyUser.teacher ? { id: existingAnyUser.teacher.id, staffNo: existingAnyUser.teacher.staffNo } : null,
            },
          },
          { status: 409 }
        );
      }
    }

    let linkedUser = existingAnyUser && !existingAnyUser.deletedAt ? existingAnyUser : null;

    // If User doesn't exist yet, create User + Teacher in transaction
    const newTeacher = await prisma.$transaction(async (tx) => {
      let targetUserId = linkedUser?.id || body.userId;

      if (!targetUserId) {
        const passHash = body.passwordHash || '$2a$10$wT.L6G2cQkG6K1hK.zYy.O6qQ1.Q2.Q3.Q4';
        const createdUser = await tx.user.create({
          data: {
            username: staffNo,
            name: fullName,
            email: email,
            password: passHash,
            role: 'TEACHER',
            phone: body.phone || '',
            status: 'ACTIVE',
          },
        });
        targetUserId = createdUser.id;
      }

      return await tx.teacher.create({
        data: {
          staffNo: staffNo,
          fullName: fullName,
          email: email,
          phone: body.phone || '',
          qualification: body.qualification || 'Degree / Higher Qualification',
          specialization: body.specialization || 'General Studies',
          status: body.status || 'ACTIVE',
          userId: targetUserId,
          dateJoined: body.dateJoined ? new Date(body.dateJoined) : new Date(),
        },
      });
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
