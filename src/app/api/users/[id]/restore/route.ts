import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '../../../../../lib/auth';
import { updateServerUser } from '../../../../../lib/serverDb';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const userId = params.id;

    // 1. Locate user in PostgreSQL Prisma database
    let dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { username: userId },
          { email: { equals: userId.toLowerCase().trim(), mode: 'insensitive' } },
        ],
      },
      include: {
        student: true,
        teacher: true,
        parent: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    // 2. Perform Atomic Restoration Transaction
    const restoredUser = await prisma.$transaction(async (tx) => {
      // Restore User Account
      const updatedUser = await tx.user.update({
        where: { id: dbUser.id },
        data: {
          deletedAt: null,
          status: 'ACTIVE',
          isLocked: false,
          failedLoginAttempts: 0,
          lockoutUntil: null,
        },
      });

      // Restore linked Student profile if present
      if (dbUser.student) {
        await tx.student.update({
          where: { id: dbUser.student.id },
          data: {
            deletedAt: null,
            status: 'ACTIVE',
          },
        });
      }

      // Restore linked Teacher profile if present
      if (dbUser.teacher) {
        await tx.teacher.update({
          where: { id: dbUser.teacher.id },
          data: {
            deletedAt: null,
            status: 'ACTIVE',
          },
        });
      }

      // Restore linked Parent profile if present
      if (dbUser.parent) {
        await tx.parent.update({
          where: { id: dbUser.parent.id },
          data: {
            deletedAt: null,
          },
        });
      }

      // Revoke stale sessions so user must log in fresh
      await tx.userSession.updateMany({
        where: { userId: dbUser.id },
        data: { revoked: true },
      });

      // Record in Audit Log
      try {
        await tx.auditLog.create({
          data: {
            action: 'ACCOUNT_RESTORED',
            performedBy: authUser ? `${authUser.name} (${authUser.role})` : 'SUPER_ADMIN',
            details: `Restored account identity for ${dbUser.name} (${dbUser.email}) [Role: ${dbUser.role}].`,
            status: 'SUCCESS',
            ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
          },
        });
      } catch (auditErr) {
        console.warn('[RESTORE_USER] Audit log creation warning:', auditErr);
      }

      return updatedUser;
    });

    // 3. Mirror update to serverDb
    updateServerUser(dbUser.id, {
      status: 'ACTIVE',
      deletedAt: null as any,
    });

    return NextResponse.json({
      message: `Account for "${restoredUser.name}" restored successfully and is now ACTIVE.`,
      user: restoredUser,
    });
  } catch (error: any) {
    console.error('[RESTORE_USER_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to restore user account' }, { status: 400 });
  }
}
