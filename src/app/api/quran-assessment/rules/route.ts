import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/quran-assessment/rules
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const body = await req.json();
    const { ruleSetId, studentType, mistakeCategory, threshold, action, active } = body;

    if (!ruleSetId) {
      return NextResponse.json({ error: 'ruleSetId is required.' }, { status: 400 });
    }
    if (!studentType || !String(studentType).trim()) {
      return NextResponse.json({ error: 'studentType is required (e.g. Masu Biye, Masu Haddah).' }, { status: 400 });
    }
    if (!mistakeCategory || !String(mistakeCategory).trim()) {
      return NextResponse.json({ error: 'mistakeCategory is required (e.g. Tajweed, Lahanin Kalma).' }, { status: 400 });
    }

    const numericThreshold = parseInt(threshold, 10);
    if (isNaN(numericThreshold) || numericThreshold <= 0) {
      return NextResponse.json({ error: 'Threshold must be a positive integer greater than zero.' }, { status: 400 });
    }

    const ruleSet = await prisma.assessmentRuleSet.findUnique({
      where: { id: ruleSetId },
      include: {
        _count: { select: { studentAssessments: true } },
      },
    });

    if (!ruleSet) {
      return NextResponse.json({ error: 'Rule Set not found.' }, { status: 404 });
    }

    // Check duplicate
    const existingRule = await prisma.assessmentRule.findFirst({
      where: {
        ruleSetId,
        studentType: { equals: studentType.trim(), mode: 'insensitive' },
        mistakeCategory: { equals: mistakeCategory.trim(), mode: 'insensitive' },
      },
    });

    if (existingRule) {
      return NextResponse.json(
        { error: `Rule for "${studentType.trim()}" and "${mistakeCategory.trim()}" already exists in this Rule Set.` },
        { status: 400 }
      );
    }

    const createdRule = await prisma.assessmentRule.create({
      data: {
        ruleSetId,
        studentType: studentType.trim(),
        mistakeCategory: mistakeCategory.trim(),
        threshold: numericThreshold,
        action: action || 'DISQUALIFY',
        active: active !== false,
      },
    });

    await prisma.assessmentRuleSet.update({
      where: { id: ruleSetId },
      data: { updatedBy: authUser?.name || 'Administrator' },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'QURAN_RULE_CREATED',
        performedBy: authUser?.name || 'Admin',
        userRole: authUser?.role as string,
        userId: authUser?.id,
        details: JSON.stringify({
          ruleId: createdRule.id,
          ruleSetId: ruleSet.id,
          ruleSetName: ruleSet.name,
          studentType: createdRule.studentType,
          mistakeCategory: createdRule.mistakeCategory,
          threshold: createdRule.threshold,
        }),
        status: 'SUCCESS',
      },
    });

    return NextResponse.json(
      {
        message: 'Rule created successfully.',
        rule: createdRule,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[POST_RULE_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to create rule' }, { status: 500 });
  }
}
