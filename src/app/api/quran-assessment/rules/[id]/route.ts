import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// PUT /api/quran-assessment/rules/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const existing = await prisma.assessmentRule.findUnique({
      where: { id: params.id },
      include: {
        ruleSet: {
          include: {
            _count: { select: { studentAssessments: true } },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    const body = await req.json();
    const { studentType, mistakeCategory, threshold, action, active } = body;

    let numericThreshold = existing.threshold;
    if (threshold !== undefined) {
      numericThreshold = parseInt(threshold, 10);
      if (isNaN(numericThreshold) || numericThreshold <= 0) {
        return NextResponse.json({ error: 'Threshold must be a positive integer greater than zero.' }, { status: 400 });
      }
    }

    const previousValue = {
      studentType: existing.studentType,
      mistakeCategory: existing.mistakeCategory,
      threshold: existing.threshold,
      action: existing.action,
      active: existing.active,
    };

    const updated = await prisma.assessmentRule.update({
      where: { id: params.id },
      data: {
        studentType: studentType ? String(studentType).trim() : existing.studentType,
        mistakeCategory: mistakeCategory ? String(mistakeCategory).trim() : existing.mistakeCategory,
        threshold: numericThreshold,
        action: action !== undefined ? String(action).trim() : existing.action,
        active: active !== undefined ? Boolean(active) : existing.active,
      },
    });

    await prisma.assessmentRuleSet.update({
      where: { id: existing.ruleSetId },
      data: { updatedBy: authUser?.name || 'Administrator' },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'QURAN_RULE_UPDATED',
        performedBy: authUser?.name || 'Admin',
        userRole: authUser?.role as string,
        userId: authUser?.id,
        details: JSON.stringify({
          ruleId: updated.id,
          ruleSetId: existing.ruleSetId,
          ruleSetName: existing.ruleSet.name,
          previousValue,
          newValue: {
            studentType: updated.studentType,
            mistakeCategory: updated.mistakeCategory,
            threshold: updated.threshold,
            action: updated.action,
            active: updated.active,
          },
        }),
        status: 'SUCCESS',
      },
    });

    return NextResponse.json({
      message: 'Rule updated successfully.',
      rule: updated,
    });
  } catch (error: any) {
    console.error('[PUT_RULE_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to update rule' }, { status: 500 });
  }
}

// DELETE /api/quran-assessment/rules/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const existing = await prisma.assessmentRule.findUnique({
      where: { id: params.id },
      include: {
        ruleSet: {
          include: {
            _count: { select: { studentAssessments: true } },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    // If historical assessments exist on the parent rule set, deactivate instead of hard delete
    if (existing.ruleSet._count.studentAssessments > 0) {
      const deactivated = await prisma.assessmentRule.update({
        where: { id: params.id },
        data: { active: false },
      });

      await prisma.auditLog.create({
        data: {
          action: 'QURAN_RULE_DEACTIVATED',
          performedBy: authUser?.name || 'Admin',
          userRole: authUser?.role as string,
          userId: authUser?.id,
          details: JSON.stringify({
            ruleId: existing.id,
            ruleSetId: existing.ruleSetId,
            reason: 'Rule deactivated to preserve historical assessment records.',
          }),
          status: 'SUCCESS',
        },
      });

      return NextResponse.json({
        message: 'Rule deactivated (soft-deleted) because its Rule Set has existing assessments.',
        rule: deactivated,
      });
    }

    // Otherwise safe to hard delete
    await prisma.assessmentRule.delete({
      where: { id: params.id },
    });

    await prisma.auditLog.create({
      data: {
        action: 'QURAN_RULE_DELETED',
        performedBy: authUser?.name || 'Admin',
        userRole: authUser?.role as string,
        userId: authUser?.id,
        details: JSON.stringify({
          ruleId: existing.id,
          ruleSetId: existing.ruleSetId,
          studentType: existing.studentType,
          mistakeCategory: existing.mistakeCategory,
          threshold: existing.threshold,
        }),
        status: 'SUCCESS',
      },
    });

    return NextResponse.json({
      message: 'Rule deleted successfully.',
    });
  } catch (error: any) {
    console.error('[DELETE_RULE_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to delete rule' }, { status: 500 });
  }
}
