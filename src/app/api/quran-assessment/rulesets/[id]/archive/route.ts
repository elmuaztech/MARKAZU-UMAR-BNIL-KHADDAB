import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';
import { RuleSetStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

// POST /api/quran-assessment/rulesets/[id]/archive
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const ruleSet = await prisma.assessmentRuleSet.findUnique({
      where: { id: params.id },
    });

    if (!ruleSet) {
      return NextResponse.json({ error: 'Rule Set not found' }, { status: 404 });
    }

    const archived = await prisma.assessmentRuleSet.update({
      where: { id: params.id },
      data: {
        status: RuleSetStatus.ARCHIVED,
        effectiveTo: new Date(),
        updatedBy: authUser?.name || 'Administrator',
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'QURAN_RULESET_ARCHIVED',
        performedBy: authUser?.name || 'Admin',
        userRole: authUser?.role as string,
        userId: authUser?.id,
        details: JSON.stringify({
          ruleSetId: archived.id,
          name: archived.name,
          version: archived.version,
        }),
        status: 'SUCCESS',
      },
    });

    return NextResponse.json({
      message: `Rule Set "${archived.name}" (v${archived.version}) has been ARCHIVED.`,
      ruleSet: archived,
    });
  } catch (error: any) {
    console.error('[ARCHIVE_RULESET_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to archive rule set' }, { status: 500 });
  }
}
