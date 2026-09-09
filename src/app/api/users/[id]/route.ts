import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '../../../../lib/auth';
import { hashPassword, generateTemporaryPassword } from '../../../../lib/security';
import { sendSystemEmail } from '../../../../lib/emailService';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const userId = params.id;
    const body = await req.json();

    // 1. Locate user in PostgreSQL Prisma database
    let dbUser: any = null;
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

    if (!dbUser && authUser) {
      dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            { id: authUser.id },
            { email: { equals: authUser.email.toLowerCase().trim(), mode: 'insensitive' } },
          ],
          deletedAt: null,
        },
      });
    }

    if (!dbUser) {
      return NextResponse.json({ error: `User with ID "${userId}" was not found.` }, { status: 404 });
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

      const targetEmail = updateData.email || dbUser.email;
      if (targetEmail) {
        const origin = req.headers.get('origin');
        const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
        const proto = req.headers.get('x-forwarded-proto') || (host && /^(localhost|\d+\.\d+\.\d+\.\d+)/.test(host) ? 'http' : 'https');
        const detected = origin || (host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || ''));
        const portalUrl = detected ? detected.replace(/\/+$/, '') : '';

        sendSystemEmail({
          to: targetEmail,
          recipientName: updateData.name || dbUser.name,
          subject: 'Password Reset Notice - Markazu Umar Portal',
          template: 'WELCOME_NEW_ACCOUNT',
          metadata: {
            username: body.username || dbUser.username || targetEmail,
            tempPassword: newTempPass,
            portalUrl: `${portalUrl}/login`,
          },
        }).catch(() => {});
      }
    }

    // Persist update in PostgreSQL Prisma database
    const prismaUser = await prisma.user.update({
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

    return NextResponse.json({
      message: `User account updated successfully.${tempPassSent ? ` Temporary password dispatched to email.` : ''}`,
      user: {
        id: prismaUser.id,
        username: prismaUser.username,
        name: prismaUser.name,
        email: prismaUser.email,
        phone: prismaUser.phone,
        avatar: prismaUser.avatar,
        role: prismaUser.role,
        status: prismaUser.status,
        assignedProgrammeId: prismaUser.assignedProgrammeId,
        assignedProgrammeName: prismaUser.assignedProgrammeName,
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

    // Locate user in PostgreSQL
    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { username: userId },
          { email: { equals: userId.toLowerCase().trim(), mode: 'insensitive' } },
        ],
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: `User with ID "${userId}" was not found.` }, { status: 404 });
    }

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

    return NextResponse.json({
      message: `User account deactivated successfully.`,
      id: userId,
    });
  } catch (error: any) {
    console.error('[DELETE_USER_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to deactivate user account' }, { status: 400 });
  }
}

