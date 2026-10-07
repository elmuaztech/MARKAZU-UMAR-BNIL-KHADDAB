import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';
import { RuleSetStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

// POST /api/quran-assessment/rulesets/[id]/activate
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const ruleSet = await prisma.assessmentRuleSet.findUnique({
      where: { id: params.id },
      include: {
        rules: true,
      },
    });

    if (!ruleSet) {
      return NextResponse.json({ error: 'Rule Set not found' }, { status: 404 });
    }

    // Validation 1: Rule set must contain at least one rule
    if (!ruleSet.rules || ruleSet.rules.length === 0) {
      return NextResponse.json(
        { error: 'Cannot activate an empty rule set. Please configure at least one assessment rule.' },
        { status: 400 }
      );
    }

    // Validation 2: Check each rule's integrity
    const seen = new Set<string>();
    for (const rule of ruleSet.rules) {
      if (!rule.studentType || !rule.studentType.trim()) {
        return NextResponse.json({ error: `Rule ${rule.id} is missing a student type.` }, { status: 400 });
      }
      if (!rule.mistakeCategory || !rule.mistakeCategory.trim()) {
        return NextResponse.json({ error: `Rule ${rule.id} is missing a mistake category.` }, { status: 400 });
      }
      if (rule.threshold <= 0) {
        return NextResponse.json(
          { error: `Invalid threshold (${rule.threshold}) for category "${rule.mistakeCategory}". Threshold must be > 0.` },
          { status: 400 }
        );
      }

      const key = `${rule.studentType.trim().toLowerCase()}_${rule.mistakeCategory.trim().toLowerCase()}`;
      if (seen.has(key)) {
        return NextResponse.json(
          { error: `Conflicting duplicate rule found for "${rule.studentType}" - "${rule.mistakeCategory}".` },
          { status: 400 }
        );
      }
      seen.add(key);
    }

    // Archive any other ACTIVE rule sets
    await prisma.assessmentRuleSet.updateMany({
      where: {
        id: { not: params.id },
        status: RuleSetStatus.ACTIVE,
      },
      data: {
        status: RuleSetStatus.ARCHIVED,
        effectiveTo: new Date(),
        updatedBy: authUser?.name || 'Administrator',
      },
    });

    // Activate target rule set
    const activated = await prisma.assessmentRuleSet.update({
      where: { id: params.id },
      data: {
        status: RuleSetStatus.ACTIVE,
        effectiveFrom: new Date(),
        effectiveTo: null,
        updatedBy: authUser?.name || 'Administrator',
      },
      include: {
        rules: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'QURAN_RULESET_ACTIVATED',
        performedBy: authUser?.name || 'Admin',
        userRole: authUser?.role as string,
        userId: authUser?.id,
        details: JSON.stringify({
          ruleSetId: activated.id,
          name: activated.name,
          version: activated.version,
          activeRulesCount: activated.rules.filter((r) => r.active).length,
        }),
        status: 'SUCCESS',
      },
    });

    return NextResponse.json({
      message: `Rule Set "${activated.name}" (v${activated.version}) is now ACTIVE.`,
      ruleSet: activated,
    });
  } catch (error: any) {
    console.error('[ACTIVATE_RULESET_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to activate rule set' }, { status: 500 });
  }
}
