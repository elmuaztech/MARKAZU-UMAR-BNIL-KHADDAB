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

    // Teacher Class Scoping Check: Teachers only have access to students in their assigned classes
    if (authUser?.role === 'TEACHER') {
      const teacherRecord = await prisma.teacher.findFirst({
        where: {
          OR: [
            { userId: authUser.id },
            { email: { equals: authUser.email, mode: 'insensitive' } },
            ...(authUser.username ? [{ staffNo: authUser.username }] : []),
          ],
          deletedAt: null,
        },
        include: {
          teacherAssignments: true,
          classesManaged: true,
        },
      });

      const teacherClassIds: string[] = [];
      if (teacherRecord) {
        teacherRecord.teacherAssignments.forEach((ta) => teacherClassIds.push(ta.classId));
        teacherRecord.classesManaged.forEach((cm) => teacherClassIds.push(cm.id));
      }
      const uniqueTeacherClassIds = Array.from(new Set(teacherClassIds));

      whereClause.classId = { in: uniqueTeacherClassIds };
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        schoolClass: true,
        parent: true,
        user: true,
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

    const admissionNo = body.admissionNo || `MUBK-STU-${Date.now().toString().slice(-4)}`;
    const studentName = body.name || body.fullName || 'Student Name';
    const rawEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const hasEmail = rawEmail.length > 0;

    const tempPassword = body.tempPassword || 'student123';

    if (hasEmail) {
      // Check if Student or User record already exists (Active or Deactivated)
      const existingAnyUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: admissionNo },
            { email: rawEmail },
          ],
        },
        include: {
          student: true,
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
                student: existingAnyUser.student ? { id: existingAnyUser.student.id, admissionNo: existingAnyUser.student.admissionNo } : null,
              },
            },
            { status: 409 }
          );
        } else {
          return NextResponse.json(
            { error: `An account with email "${rawEmail}" or admission number "${admissionNo}" already exists.` },
            { status: 409 }
          );
        }
      }
    }

    const newStudent = await prisma.$transaction(async (tx) => {
      let resolvedUserId: string | null = body.userId || null;

      if (hasEmail && !resolvedUserId) {
        const passHash = body.passwordHash || '$2a$10$wT.L6G2cQkG6K1hK.zYy.O6qQ1.Q2.Q3.Q4';
        const createdUser = await tx.user.create({
          data: {
            username: admissionNo,
            name: studentName,
            email: rawEmail,
            password: passHash,
            role: 'STUDENT',
            status: 'ACTIVE',
            mustChangePassword: true,
          },
        });
        resolvedUserId = createdUser.id;
      }

      let targetClass = body.classId ? await tx.schoolClass.findUnique({ where: { id: body.classId } }) : null;
      if (!targetClass) {
        targetClass = await tx.schoolClass.findFirst();
      }
      if (!targetClass) {
        targetClass = await tx.schoolClass.create({
          data: {
            name: 'Tahfiz Class A',
            category: 'TAHFIZ',
            section: 'Section A',
            capacity: 30,
          },
        });
      }

      let guardian = body.guardianId ? await tx.parent.findUnique({ where: { id: body.guardianId } }) : null;

      if (!guardian && (body.parentEmail || body.parentPhone)) {
        const pEmail = body.parentEmail ? body.parentEmail.toLowerCase().trim() : null;
        const pPhone = body.parentPhone ? body.parentPhone.trim() : null;
        guardian = await tx.parent.findFirst({
          where: {
            OR: [
              pEmail ? { email: pEmail } : undefined,
              pPhone ? { phone: pPhone } : undefined,
            ].filter(Boolean) as any,
            deletedAt: null,
          },
        });
      }

      if (!guardian && body.parentName && (body.parentEmail || body.parentPhone)) {
        const pEmail = (body.parentEmail || `parent.${Date.now()}@markazuumar.edu.ng`).toLowerCase().trim();
        const pPhone = body.parentPhone || '08000000000';
        const pName = body.parentName.trim();

        let parentUser = await tx.user.findFirst({ where: { email: pEmail } });
        if (!parentUser) {
          parentUser = await tx.user.create({
            data: {
              username: `MUBK-PAR-${Date.now().toString().slice(-4)}`,
              name: pName,
              email: pEmail,
              password: '$2a$10$wT.L6G2cQkG6K1hK.zYy.O6qQ1.Q2.Q3.Q4',
              role: 'PARENT',
              phone: pPhone,
              status: 'ACTIVE',
            },
          });
        }

        guardian = await tx.parent.create({
          data: {
            fullName: pName,
            email: pEmail,
            phone: pPhone,
            occupation: body.parentOccupation || 'Parent',
            address: body.parentAddress || 'Kano, Nigeria',
            userId: parentUser.id,
          },
        });
      }

      if (!guardian) {
        guardian = await tx.parent.findFirst();
      }
      if (!guardian) {
        guardian = await tx.parent.create({
          data: {
            fullName: 'School Guardian',
            email: `guardian.${Date.now()}@markazuumar.edu.ng`,
            phone: '08000000000',
            occupation: 'Guardian',
            address: 'Kano, Nigeria',
          },
        });
      }

      return await tx.student.create({
        data: {
          userId: resolvedUserId,
          admissionNo: admissionNo,
          fullName: studentName,
          gender: body.gender || 'MALE',
          dob: body.dob ? new Date(body.dob) : new Date('2015-01-01'),
          classId: targetClass.id,
          guardianId: guardian.id,
          status: body.status || 'ACTIVE',
        },
        include: {
          schoolClass: true,
          parent: true,
          user: true,
        },
      });
    });

    return NextResponse.json(
      {
        message: 'Student enrolled successfully',
        student: newStudent,
        userCreated: hasEmail,
        credentials: hasEmail ? { username: admissionNo, email: rawEmail, tempPassword } : null,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[CREATE_STUDENT_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to enroll student' }, { status: 400 });
  }
}
