import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        { error: 'startDate and endDate parameters are required for clearing audit logs.' },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);
    endDate.setHours(23, 59, 59, 999);

    const result = await prisma.$transaction(async (tx) => {
      const deleted = await tx.auditLog.deleteMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Record AUDIT_LOGS_CLEARED event entry
      await tx.auditLog.create({
        data: {
          action: 'AUDIT_LOGS_CLEARED',
          performedBy: authUser ? `${authUser.name} (${authUser.role})` : 'SUPER_ADMIN',
          userId: authUser?.id || null,
          userRole: authUser?.role || 'SUPER_ADMIN',
          details: `Cleared ${deleted.count} audit log(s) for date scope ${startDateParam} to ${endDateParam}.`,
          status: 'WARNING',
          ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1',
        },
      });

      return { deletedCount: deleted.count };
    });

    return NextResponse.json({
      message: `Successfully cleared ${result.deletedCount} audit log record(s) from ${startDateParam} to ${endDateParam}.`,
      deletedCount: result.deletedCount,
      startDate: startDateParam,
      endDate: endDateParam,
    });
  } catch (error: any) {
    console.error('[CLEAR_AUDIT_LOGS_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to clear audit logs' }, { status: 400 });
  }
}
