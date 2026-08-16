import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '../../../../lib/auth';
import { hashPassword, generateTemporaryPassword } from '../../../../lib/security';
import { sendSystemEmail } from '../../../../lib/emailService';
import { updateServerUser, deleteServerUser, findServerUser } from '../../../../lib/serverDb';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const userId = params.id;
    const body = await req.json();

    // 1. Locate user in PostgreSQL Prisma database
    let dbUser: any = null;
    try {
      if (userId === 'me' && authUser) {
        dbUser = await prisma.user.findFirst({
          where: {
            OR: [
              { id: authUser.id },
              { email: { equals: authUser.email.toLowerCase().trim(), mode: 'insensitive' } },
            ],
            deletedAt: null,
          },
        });
      } else {
        dbUser = await prisma.user.findFirst({
          where: {
            OR: [
              { id: userId },
              { username: userId },
              { email: { equals: userId.toLowerCase().trim(), mode: 'insensitive' } },
            ],
            deletedAt: null,
          },
        });
      }
    } catch (e) {
      console.warn('[PUT_USER] Prisma lookup warning:', e);
    }

    if (!dbUser && authUser) {
      try {
        dbUser = await prisma.user.findFirst({
          where: {
            OR: [
              { id: authUser.id },
              { email: { equals: authUser.email.toLowerCase().trim(), mode: 'insensitive' } },
            ],
            deletedAt: null,
          },
        });
      } catch (e) {}
    }

    if (!dbUser) {
      const serverUser = findServerUser(userId);
      if (serverUser) {
        try {
          dbUser = await prisma.user.findFirst({
            where: {
              OR: [
                { email: { equals: serverUser.email.toLowerCase().trim(), mode: 'insensitive' } },
                { username: serverUser.username || '' },
              ],
              deletedAt: null,
            },
          });
        } catch (e) {}
      }
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.avatar !== undefined) updateData.avatar = body.avatar;
    if (body.phone !== undefined) updateData.phone = body.phone.trim();
    if (body.email !== undefined) updateData.email = body.email.trim().toLowerCase();
    if (body.role !== undefined) updateData.role = body.role;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.assignedProgrammeId !== undefined) updateData.assignedProgrammeId = body.assignedProgrammeId;
    if (body.assignedProgrammeName !== undefined) updateData.assignedProgrammeName = body.assignedProgrammeName;

    // Reset password request
    let tempPassSent: string | undefined;
    if (body.resetPassword || body.newTempPassword) {
      const newTempPass = body.newTempPassword || generateTemporaryPassword();
      updateData.password = hashPassword(newTempPass);
      updateData.isFirstLogin = true;
      updateData.mustChangePassword = true;
      updateData.failedLoginAttempts = 0;
      updateData.isLocked = false;
      updateData.lockoutUntil = null;
      tempPassSent = newTempPass;

      const targetEmail = updateData.email || (dbUser ? dbUser.email : body.email);
      if (targetEmail) {
        sendSystemEmail({
          to: targetEmail,
          recipientName: updateData.name || (dbUser ? dbUser.name : 'User'),
          subject: 'Password Reset Notice - Markazu Umar Portal',
          template: 'WELCOME_NEW_ACCOUNT',
          metadata: {
            username: body.username || (dbUser ? dbUser.username : targetEmail),
            tempPassword: newTempPass,
          },
        }).catch(() => {});
      }
    }

    // 2. Update in persistent serverDb backup
    const serverDbResult = updateServerUser(userId, updateData);

    // 3. Persist update in PostgreSQL Prisma database
    let prismaUser: any = null;
    if (dbUser) {
      try {
        prismaUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: updateData,
        });

        // Synchronize associated profile records in respective tables based on role
        if (prismaUser.role === 'TEACHER') {
          await prisma.teacher.updateMany({
            where: {
              OR: [{ userId: prismaUser.id }, { email: { equals: prismaUser.email, mode: 'insensitive' } }],
            },
            data: {
              ...(updateData.name ? { fullName: updateData.name } : {}),
              ...(updateData.phone !== undefined ? { phone: updateData.phone } : {}),
            },
          }).catch(() => {});
        } else if (prismaUser.role === 'STUDENT') {
          await prisma.student.updateMany({
            where: { userId: prismaUser.id },
            data: {
              ...(updateData.name ? { fullName: updateData.name } : {}),
              ...(updateData.avatar !== undefined ? { avatar: updateData.avatar } : {}),
            },
          }).catch(() => {});
        } else if (prismaUser.role === 'PARENT') {
          await prisma.parent.updateMany({
            where: {
              OR: [{ userId: prismaUser.id }, { email: { equals: prismaUser.email, mode: 'insensitive' } }],
            },
            data: {
              ...(updateData.name ? { fullName: updateData.name } : {}),
              ...(updateData.phone !== undefined ? { phone: updateData.phone } : {}),
            },
          }).catch(() => {});
        }
      } catch (dbErr) {
        console.error('[PUT_USER] PostgreSQL Prisma update error:', dbErr);
      }
    }

    const finalUser = prismaUser || serverDbResult || (dbUser ? { ...dbUser, ...updateData } : { id: userId, ...updateData });

    return NextResponse.json({
      message: `User account updated successfully.${tempPassSent ? ` Temporary password dispatched to email.` : ''}`,
      user: {
        id: finalUser.id,
        username: finalUser.username,
        name: finalUser.name,
        email: finalUser.email,
        phone: finalUser.phone,
        avatar: finalUser.avatar,
        role: finalUser.role,
        status: finalUser.status,
        assignedProgrammeId: finalUser.assignedProgrammeId,
        assignedProgrammeName: finalUser.assignedProgrammeName,
      },
    });
  } catch (error: any) {
    console.error('[UPDATE_USER_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to update user account' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = params.id;

    // 1. Delete from persistent serverDb
    deleteServerUser(userId);

    // 2. Also soft-delete in PostgreSQL Prisma database
    let dbUser: any = null;
    try {
      dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            { id: userId },
            { username: userId },
            { email: { equals: userId.toLowerCase().trim(), mode: 'insensitive' } },
          ],
        },
      });

      if (dbUser) {
        // Enforce protection: Last active SUPER_ADMIN cannot be deleted or deactivated
        if (dbUser.role === 'SUPER_ADMIN') {
          const activeSuperAdminCount = await prisma.user.count({
            where: {
              role: 'SUPER_ADMIN',
              status: 'ACTIVE',
              deletedAt: null,
            },
          });
          if (activeSuperAdminCount <= 1 && dbUser.status === 'ACTIVE' && !dbUser.deletedAt) {
            return NextResponse.json(
              { error: 'Security Violation: Cannot delete or deactivate the last active Super Admin account.' },
              { status: 403 }
            );
          }
        }

        const deletionTimestamp = new Date();

        await prisma.user.update({
          where: { id: dbUser.id },
          data: {
            deletedAt: deletionTimestamp,
            status: 'DEACTIVATED',
          },
        });

        // Cascade soft-delete to linked Student profile if present
        await prisma.student.updateMany({
          where: { userId: dbUser.id, deletedAt: null },
          data: {
            deletedAt: deletionTimestamp,
            status: 'SUSPENDED',
          },
        });

        // Cascade soft-delete to linked Teacher profile if present
        await prisma.teacher.updateMany({
          where: { userId: dbUser.id, deletedAt: null },
          data: {
            deletedAt: deletionTimestamp,
            status: 'ON_LEAVE',
          },
        });

        // Cascade soft-delete to linked Parent profile if present
        await prisma.parent.updateMany({
          where: { userId: dbUser.id, deletedAt: null },
          data: {
            deletedAt: deletionTimestamp,
          },
        });

        await prisma.userSession.updateMany({
          where: { userId: dbUser.id },
          data: { revoked: true },
        });
      }
    } catch (dbErr) {
      console.warn('[DELETE_USER] Prisma delete warning:', dbErr);
    }

    return NextResponse.json({
      message: `User account permanently deactivated and removed from database.`,
      id: userId,
    });
  } catch (error: any) {
    console.error('[DELETE_USER_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to delete user account' }, { status: 400 });
  }
}
