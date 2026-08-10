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

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser || existingUser.deletedAt) {
      return NextResponse.json({ error: 'User record not found in database.' }, { status: 404 });
    }

    const isSelfUpdate = authUser?.id === userId || authUser?.email.toLowerCase() === existingUser.email.toLowerCase();
    if (!isSelfUpdate && authUser?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access Forbidden (HTTP 403): You can only update your own profile or must be a Super Admin.' }, { status: 403 });
    }

    const updateData: any = {};
    if (body.name) updateData.name = body.name.trim();
    if (body.avatar !== undefined) updateData.avatar = body.avatar;
    if (body.phone !== undefined) updateData.phone = body.phone.trim();

    if (authUser?.role === 'SUPER_ADMIN') {
      if (body.email) updateData.email = body.email.trim().toLowerCase();
      if (body.role && body.role !== existingUser.role) updateData.role = body.role;
      if (body.status) updateData.status = body.status;
      if (body.assignedProgrammeId !== undefined) updateData.assignedProgrammeId = body.assignedProgrammeId;
      if (body.assignedProgrammeName !== undefined) updateData.assignedProgrammeName = body.assignedProgrammeName;
    }

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

      sendSystemEmail({
        to: existingUser.email,
        recipientName: existingUser.name,
        subject: 'Password Reset Notice - Markazu Umar Portal',
        template: 'WELCOME_NEW_ACCOUNT',
        metadata: {
          username: existingUser.username || existingUser.email,
          tempPassword: newTempPass,
        },
      }).catch(() => {});
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({
      message: `User account updated successfully.${tempPassSent ? ` Temporary password dispatched to ${updatedUser.email}.` : ''}`,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        assignedProgrammeId: updatedUser.assignedProgrammeId,
        assignedProgrammeName: updatedUser.assignedProgrammeName,
      },
    });
  } catch (error: any) {
    console.error('[UPDATE_USER_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to update user account' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const userId = params.id;

    // Soft-delete user in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        status: 'DEACTIVATED',
      },
    });

    // Revoke active sessions
    await prisma.userSession.updateMany({
      where: { userId },
      data: { revoked: true },
    });

    return NextResponse.json({
      message: `User account "${updatedUser.name}" (${updatedUser.email}) deactivated and removed permanently from database.`,
      id: userId,
    });
  } catch (error: any) {
    console.error('[DELETE_USER_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to delete user account' }, { status: 400 });
  }
}
