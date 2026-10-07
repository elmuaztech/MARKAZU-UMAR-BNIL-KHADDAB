import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';
import { RuleSetStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET /api/quran-assessment/rulesets/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const ruleSet = await prisma.assessmentRuleSet.findUnique({
      where: { id: params.id },
      include: {
        rules: {
          orderBy: [{ studentType: 'asc' }, { mistakeCategory: 'asc' }],
        },
        _count: {
          select: {
            studentAssessments: true,
            events: true,
          },
        },
      },
    });

    if (!ruleSet) {
      return NextResponse.json({ error: 'Rule Set not found' }, { status: 404 });
    }

    return NextResponse.json({
      ruleSet: {
        ...ruleSet,
        assessmentsCount: ruleSet._count.studentAssessments,
        eventsCount: ruleSet._count.events,
      },
    });
  } catch (error: any) {
    console.error('[GET_RULESET_BY_ID_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch rule set' }, { status: 500 });
  }
}

// PUT /api/quran-assessment/rulesets/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const existing = await prisma.assessmentRuleSet.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { studentAssessments: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Rule Set not found' }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, effectiveFrom, effectiveTo } = body;

    const previousValue = {
      name: existing.name,
      description: existing.description,
      effectiveFrom: existing.effectiveFrom,
      effectiveTo: existing.effectiveTo,
    };

    const updated = await prisma.assessmentRuleSet.update({
      where: { id: params.id },
      data: {
        name: name !== undefined ? String(name).trim() : existing.name,
        description: description !== undefined ? (description ? String(description).trim() : null) : existing.description,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : existing.effectiveFrom,
        effectiveTo: effectiveTo !== undefined ? (effectiveTo ? new Date(effectiveTo) : null) : existing.effectiveTo,
        updatedBy: authUser?.name || 'Administrator',
      },
      include: {
        rules: true,
      },
    });

    // Audit update
    await prisma.auditLog.create({
      data: {
        action: 'QURAN_RULESET_UPDATED',
        performedBy: authUser?.name || 'Admin',
        userRole: authUser?.role as string,
        userId: authUser?.id,
        details: JSON.stringify({
          ruleSetId: updated.id,
          version: updated.version,
          previousValue,
          newValue: {
            name: updated.name,
            description: updated.description,
            effectiveFrom: updated.effectiveFrom,
            effectiveTo: updated.effectiveTo,
          },
        }),
        status: 'SUCCESS',
      },
    });

    return NextResponse.json({
      message: 'Rule set metadata updated successfully.',
      ruleSet: updated,
    });
  } catch (error: any) {
    console.error('[PUT_RULESET_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to update rule set' }, { status: 500 });
  }
}

// DELETE /api/quran-assessment/rulesets/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const existing = await prisma.assessmentRuleSet.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            studentAssessments: true,
            events: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Rule Set not found' }, { status: 404 });
    }

    // STRICT SAFETY REQUIREMENT: Prevent destructive hard-delete if already used by assessments!
    if (existing._count.studentAssessments > 0) {
      return NextResponse.json(
        {
          error: `Destructive deletion prohibited: This Rule Set is actively used by ${existing._count.studentAssessments} historical assessment record(s). Please archive or deactivate it instead to preserve audit and evaluation history.`,
        },
        { status: 400 }
      );
    }

    if (existing._count.events > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete Rule Set: It is associated with ${existing._count.events} assessment event(s). Please unlink or archive instead.`,
        },
        { status: 400 }
      );
    }

    // Safe to delete unused rule set
    await prisma.assessmentRuleSet.delete({
      where: { id: params.id },
    });

    await prisma.auditLog.create({
      data: {
        action: 'QURAN_RULESET_DELETED',
        performedBy: authUser?.name || 'Admin',
        userRole: authUser?.role as string,
        userId: authUser?.id,
        details: JSON.stringify({
          ruleSetId: existing.id,
          name: existing.name,
          version: existing.version,
        }),
        status: 'SUCCESS',
      },
    });

    return NextResponse.json({
      message: `Rule Set "${existing.name}" (v${existing.version}) deleted successfully.`,
    });
  } catch (error: any) {
    console.error('[DELETE_RULESET_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to delete rule set' }, { status: 500 });
  }
}
