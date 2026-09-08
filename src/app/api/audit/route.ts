import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const logs = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      auditLogs: logs.map((l) => ({
        id: l.id,
        action: l.action,
        performedBy: l.performedBy,
        userRole: l.userRole || 'ADMIN',
        details: l.details,
        ipAddress: l.ipAddress || '127.0.0.1',
        browser: l.browser || 'Browser',
        os: l.operatingSystem || 'OS',
        device: l.device || 'Desktop',
        affectedRecord: l.targetRecord,
        status: l.status as 'SUCCESS' | 'FAILURE' | 'WARNING',
        timestamp: l.createdAt.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      })),
      total: logs.length,
    });
  } catch (error: any) {
    console.error('[GET_AUDIT_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch audit logs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const body = await req.json();

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown Browser';

    const created = await prisma.auditLog.create({
      data: {
        id: body.id,
        action: body.action || 'SYSTEM_ACTION',
        performedBy: body.performedBy || authUser?.name || 'System User',
        userRole: body.userRole || authUser?.role || 'SUPER_ADMIN',
        userId: authUser?.id || body.userId || null,
        details: body.details || '',
        ipAddress: body.ipAddress || clientIp,
        browser: body.browser || userAgent.substring(0, 100),
        operatingSystem: body.os || 'Windows',
        device: body.device || 'Desktop',
        targetRecord: body.affectedRecord || body.targetRecord || null,
        status: body.status || 'SUCCESS',
      },
    });

    return NextResponse.json(
      {
        message: 'Audit log recorded',
        auditLog: created,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[POST_AUDIT_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to create audit log' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: 'Forbidden: Only Super Admin can clear audit logs.' }, { status: 403 });
    }

    const result = await prisma.auditLog.deleteMany({});

    await prisma.auditLog.create({
      data: {
        action: 'AUDIT_LOGS_CLEARED',
        performedBy: authUser?.name || 'Super Administrator',
        userRole: 'SUPER_ADMIN',
        userId: authUser?.id || null,
        details: `Super Admin cleared ${result.count} historical audit log records.`,
        ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1',
        status: 'WARNING',
      },
    });

    return NextResponse.json({
      message: `Audit logs cleared successfully (${result.count} records removed).`,
      count: result.count,
    });
  } catch (error: any) {
    console.error('[DELETE_AUDIT_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to clear audit logs' }, { status: 500 });
  }
}
