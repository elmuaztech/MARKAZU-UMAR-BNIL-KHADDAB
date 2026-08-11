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

    const updateData: any = {};
    if (body.name) updateData.name = body.name.trim();
    if (body.avatar !== undefined) updateData.avatar = body.avatar;
    if (body.phone !== undefined) updateData.phone = body.phone.trim();
    if (body.email) updateData.email = body.email.trim().toLowerCase();
    if (body.role) updateData.role = body.role;
    if (body.status) updateData.status = body.status;
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

      const targetEmail = updateData.email || body.email;
      if (targetEmail) {
        sendSystemEmail({
          to: targetEmail,
          recipientName: updateData.name || 'User',
          subject: 'Password Reset Notice - Markazu Umar Portal',
          template: 'WELCOME_NEW_ACCOUNT',
          metadata: {
            username: body.username || targetEmail,
            tempPassword: newTempPass,
          },
        }).catch(() => {});
      }
    }

    // 1. Update in persistent serverDb
    const serverDbResult = updateServerUser(userId, updateData);

    // 2. Also update in PostgreSQL Prisma database if available
    let prismaUser: any = null;
    try {
      prismaUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    } catch (dbErr) {
      // Postgres offline or record not in Postgres, serverDb handles persistence
    }

    const finalUser = prismaUser || serverDbResult || { id: userId, ...updateData };

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

    // 2. Also soft-delete in PostgreSQL Prisma database if available
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          status: 'DEACTIVATED',
        },
      });

      await prisma.userSession.updateMany({
        where: { userId },
        data: { revoked: true },
      });
    } catch (dbErr) {
      // Postgres offline, serverDb handles persistence
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
