import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '../../../lib/auth';
import { hashPassword, generateTemporaryPassword } from '../../../lib/security';
import { sendSystemEmail } from '../../../lib/emailService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const includeDeactivated = searchParams.get('includeDeactivated') === 'true';

    let whereClause: any = { deletedAt: null, status: { not: 'DEACTIVATED' } };
    if (statusParam === 'DEACTIVATED') {
      whereClause = {
        OR: [
          { deletedAt: { not: null } },
          { status: 'DEACTIVATED' },
        ],
      };
    } else if (statusParam === 'ALL' || includeDeactivated) {
      whereClause = {};
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        assignedProgrammeId: true,
        assignedProgrammeName: true,
        status: true,
        isFirstLogin: true,
        isLocked: true,
        lastLoginAt: true,
        createdAt: true,
        deletedAt: true,
        teacher: {
          select: {
            id: true,
            staffNo: true,
            teacherAssignments: {
              select: {
                programmeId: true,
                classId: true,
                canMarkAttendance: true,
                assignedSubjects: {
                  select: { subjectId: true },
                },
              },
            },
            classesManaged: {
              select: { id: true },
            },
          },
        },
        student: {
          select: {
            id: true,
            admissionNo: true,
            schoolClass: {
              select: {
                name: true,
                programme: {
                  select: { nameEnglish: true },
                },
              },
            },
          },
        },
        parent: {
          select: {
            id: true,
            wards: {
              select: { id: true },
            },
          },
        },
      },
    });

    const mappedUsers = users.map((u) => {
      let assignmentSummary = 'Unassigned';

      if (u.role === 'SUPER_ADMIN' || u.role === 'ADMIN') {
        assignmentSummary = 'Global — All Programmes';
      } else if (u.role === 'HEADMASTER') {
        assignmentSummary = u.assignedProgrammeName ? u.assignedProgrammeName : 'Unassigned — No Access';
      } else if (u.role === 'TEACHER') {
        if (u.teacher && u.teacher.teacherAssignments && u.teacher.teacherAssignments.length > 0) {
          const distinctProg = new Set(u.teacher.teacherAssignments.map((a) => a.programmeId));
          const distinctClass = new Set(u.teacher.teacherAssignments.map((a) => a.classId));
          const distinctSubj = new Set();
          u.teacher.teacherAssignments.forEach((a) => {
            a.assignedSubjects?.forEach((s) => distinctSubj.add(s.subjectId));
          });

          const pCount = distinctProg.size;
          const cCount = distinctClass.size;
          const sCount = distinctSubj.size;

          assignmentSummary = `${pCount} Programme${pCount !== 1 ? 's' : ''} · ${cCount} Class${cCount !== 1 ? 'es' : ''} · ${sCount} Subject${sCount !== 1 ? 's' : ''}`;
        } else if (u.teacher && u.teacher.classesManaged && u.teacher.classesManaged.length > 0) {
          const cCount = u.teacher.classesManaged.length;
          assignmentSummary = `Class Teacher (${cCount} Class${cCount !== 1 ? 'es' : ''})`;
        } else {
          assignmentSummary = 'Unassigned — No Access';
        }
      } else if (u.role === 'STUDENT') {
        if (u.student?.schoolClass) {
          const progName = u.student.schoolClass.programme?.nameEnglish || '';
          const clsName = u.student.schoolClass.name;
          assignmentSummary = progName ? `${progName} — ${clsName}` : clsName;
        } else {
          assignmentSummary = 'Unassigned Class';
        }
      } else if (u.role === 'PARENT') {
        const wardCount = u.parent?.wards?.length || 0;
        assignmentSummary = `${wardCount} Linked Child${wardCount !== 1 ? 'ren' : ''}`;
      }

      return {
        id: u.id,
        username: u.username,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone,
        avatar: u.avatar,
        assignedProgrammeId: u.assignedProgrammeId,
        assignedProgrammeName: u.assignedProgrammeName,
        assignmentSummary,
        teacherId: u.teacher?.id || null,
        teacherStaffNo: u.teacher?.staffNo || null,
        status: u.status,
        isFirstLogin: u.isFirstLogin,
        isLocked: u.isLocked,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
        deletedAt: u.deletedAt,
      };
    });

    return NextResponse.json({ users: mappedUsers, total: mappedUsers.length });
  } catch (error: any) {
    console.error('[GET_USERS_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = (body.name || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const role = body.role || 'TEACHER';
    const phone = (body.phone || '').trim();
    const avatar = body.avatar || null;
    const assignedProgrammeId = body.assignedProgrammeId || null;
    const assignedProgrammeName = body.assignedProgrammeName || null;

    if (!name || !email) {
      return NextResponse.json({ error: 'Full Name and Email address are required.' }, { status: 400 });
    }

    // Deactivated vs Active Duplicate Email Detection strictly from PostgreSQL
    const existingAnyUser = await prisma.user.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
      },
      include: {
        student: true,
        teacher: true,
        parent: true,
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
              teacher: existingAnyUser.teacher ? { id: existingAnyUser.teacher.id, staffNo: existingAnyUser.teacher.staffNo } : null,
              parent: existingAnyUser.parent ? { id: existingAnyUser.parent.id } : null,
            },
          },
          { status: 409 }
        );
      } else {
        return NextResponse.json(
          { error: `An active account with the email address "${email}" already exists in the system. Duplicate email addresses are not allowed.` },
          { status: 400 }
        );
      }
    }

    // Auto-generate Unique User ID / Username strictly from PostgreSQL count
    let rolePrefix = 'USR';
    if (role === 'HEADMASTER') rolePrefix = 'MUBK-HM';
    else if (role === 'TEACHER') rolePrefix = 'MUBK-TEA';
    else if (role === 'ADMIN') rolePrefix = 'MUBK-ADM';
    else if (role === 'PARENT') rolePrefix = 'MUBK-PAR';
    else if (role === 'STUDENT') rolePrefix = 'MUBK-STU';

    const roleCount = await prisma.user.count({
      where: { role: role as any, deletedAt: null },
    });
    const formattedNum = (roleCount + 1).toString().padStart(4, '0');
    const generatedUsername = body.username || `${rolePrefix}-${formattedNum}`;

    // Generate initial temporary password or use provided password/hash
    let tempPassword = body.tempPassword || body.password || '';
    let passwordHash = '';

    if (body.passwordHash) {
      passwordHash = body.passwordHash;
    } else if (body.password && body.password.startsWith('argon2id$')) {
      passwordHash = body.password;
    } else if (tempPassword) {
      passwordHash = hashPassword(tempPassword);
    } else {
      tempPassword = generateTemporaryPassword();
      passwordHash = hashPassword(tempPassword);
    }

    // Atomic transaction for User + Profile creation in PostgreSQL
    const prismaUser = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username: generatedUsername,
          name,
          email,
          password: passwordHash,
          role: role as any,
          phone,
          avatar,
          assignedProgrammeId: role === 'HEADMASTER' ? assignedProgrammeId : undefined,
          assignedProgrammeName: role === 'HEADMASTER' ? assignedProgrammeName : undefined,
          status: 'ACTIVE',
          isFirstLogin: true,
          mustChangePassword: true,
        },
      });

      if (role === 'TEACHER') {
        const existingTeacher = await tx.teacher.findFirst({
          where: {
            OR: [
              { userId: newUser.id },
              { email: newUser.email },
              { staffNo: generatedUsername },
            ],
          },
        });
        if (!existingTeacher) {
          await tx.teacher.create({
            data: {
              userId: newUser.id,
              staffNo: generatedUsername,
              fullName: name,
              email: newUser.email,
              phone: phone || '',
              qualification: body.qualification || 'Degree / Higher Qualification',
              specialization: body.specialization || 'General Studies',
              status: 'ACTIVE',
            },
          });
        }
      } else if (role === 'STUDENT') {
        const existingStudent = await tx.student.findFirst({
          where: {
            OR: [
              { userId: newUser.id },
              { admissionNo: generatedUsername },
            ],
          },
        });
        if (!existingStudent) {
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
          if (!guardian) {
            guardian = await tx.parent.findFirst();
          }
          if (!guardian) {
            guardian = await tx.parent.create({
              data: {
                fullName: 'School Guardian / Parent',
                email: `guardian.${Date.now()}@markazuumar.edu.ng`,
                phone: phone || '08000000000',
                occupation: 'Guardian',
                address: 'Kano, Nigeria',
              },
            });
          }

          await tx.student.create({
            data: {
              userId: newUser.id,
              admissionNo: generatedUsername,
              fullName: name,
              gender: body.gender || 'MALE',
              dob: body.dob ? new Date(body.dob) : new Date('2015-01-01'),
              classId: targetClass.id,
              guardianId: guardian.id,
              status: 'ACTIVE',
            },
          });
        }
      } else if (role === 'PARENT') {
        const existingParent = await tx.parent.findFirst({
          where: {
            OR: [
              { userId: newUser.id },
              { email: newUser.email },
            ],
          },
        });
        if (!existingParent) {
          await tx.parent.create({
            data: {
              userId: newUser.id,
              fullName: name,
              email: newUser.email,
              phone: phone || '',
              occupation: body.occupation || 'Parent',
              address: body.address || 'Kano, Nigeria',
            },
          });
        }
      }

      return newUser;
    });

    // Dispatch Welcome Email with Credentials (Dynamically detect caller's host / IP / domain)
    const origin = req.headers.get('origin');
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const proto = req.headers.get('x-forwarded-proto') || (host && /^(localhost|\d+\.\d+\.\d+\.\d+)/.test(host) ? 'http' : 'https');
    const detectedBaseUrl = origin || (host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || ''));
    const portalUrl = detectedBaseUrl ? detectedBaseUrl.replace(/\/+$/, '') : '';
    
    try {
      await sendSystemEmail({
        to: email,
        recipientName: name,
        subject: `Welcome to Markazu Umar bn Al-Khattab Centre for Islamic Studies Portal - Your Account Credentials (${generatedUsername})`,
        template: 'WELCOME_NEW_ACCOUNT',
        metadata: {
          username: generatedUsername,
          tempPassword,
          portalUrl: `${portalUrl}/login`,
          role: role,
          assignedProgramme: assignedProgrammeName || undefined,
        },
      });
      console.log(`[USERS_API] Welcome email sent successfully to ${email}`);
    } catch (emailErr: any) {
      console.error('[USERS_API] Failed to send welcome email:', emailErr?.message);
    }

    return NextResponse.json(
      {
        message: `Account created successfully for ${name}. Credentials sent to ${email}.`,
        user: {
          id: prismaUser.id,
          username: generatedUsername,
          name: name,
          email: email,
          role: role,
          tempPassword,
          assignedProgrammeId,
          assignedProgrammeName,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[CREATE_USER_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to create user account' }, { status: 400 });
  }
}

