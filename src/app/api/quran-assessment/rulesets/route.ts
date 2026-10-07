import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';
import { RuleSetStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET /api/quran-assessment/rulesets
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    // Allow academic staff to view rules; rule modifications are strictly restricted
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const ruleSets = await prisma.assessmentRuleSet.findMany({
      orderBy: [
        { status: 'asc' },
        { version: 'desc' },
      ],
      include: {
        rules: {
          orderBy: [
            { studentType: 'asc' },
            { mistakeCategory: 'asc' },
          ],
        },
        _count: {
          select: {
            studentAssessments: true,
            events: true,
          },
        },
      },
    });

    return NextResponse.json({
      ruleSets: ruleSets.map((rs) => ({
        id: rs.id,
        name: rs.name,
        description: rs.description,
        version: rs.version,
        status: rs.status,
        effectiveFrom: rs.effectiveFrom,
        effectiveTo: rs.effectiveTo,
        createdBy: rs.createdBy,
        updatedBy: rs.updatedBy,
        createdAt: rs.createdAt,
        updatedAt: rs.updatedAt,
        rules: rs.rules,
        assessmentsCount: rs._count.studentAssessments,
        eventsCount: rs._count.events,
      })),
    });
  } catch (error: any) {
    console.error('[GET_RULESETS_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch rule sets' }, { status: 500 });
  }
}

// POST /api/quran-assessment/rulesets
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    // Strictly SUPER_ADMIN and ADMIN only
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const body = await req.json();
    const { name, description, effectiveFrom, rules } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Rule Set name is required.' }, { status: 400 });
    }

    // Determine next version number
    const highestVersion = await prisma.assessmentRuleSet.findFirst({
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const nextVersion = (highestVersion?.version || 0) + 1;

    // Validate rules if provided
    const rulesToCreate: any[] = [];
    if (Array.isArray(rules) && rules.length > 0) {
      const seen = new Set<string>();
      for (const r of rules) {
        if (!r.studentType || !r.studentType.trim()) {
          return NextResponse.json({ error: 'Each rule must have a valid studentType.' }, { status: 400 });
        }
        if (!r.mistakeCategory || !r.mistakeCategory.trim()) {
          return NextResponse.json({ error: 'Each rule must have a valid mistakeCategory.' }, { status: 400 });
        }
        const threshold = parseInt(r.threshold, 10);
        if (isNaN(threshold) || threshold <= 0) {
          return NextResponse.json({ error: `Threshold for ${r.mistakeCategory} must be a positive integer greater than zero.` }, { status: 400 });
        }

        const key = `${r.studentType.trim().toLowerCase()}_${r.mistakeCategory.trim().toLowerCase()}`;
        if (seen.has(key)) {
          return NextResponse.json({ error: `Duplicate rule for student type "${r.studentType}" and category "${r.mistakeCategory}".` }, { status: 400 });
        }
        seen.add(key);

        rulesToCreate.push({
          studentType: r.studentType.trim(),
          mistakeCategory: r.mistakeCategory.trim(),
          threshold,
          action: r.action || 'DISQUALIFY',
          active: r.active !== false,
        });
      }
    }

    const created = await prisma.assessmentRuleSet.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        version: nextVersion,
        status: RuleSetStatus.DRAFT,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
        createdBy: authUser?.name || 'Administrator',
        updatedBy: authUser?.name || 'Administrator',
        rules: {
          create: rulesToCreate,
        },
      },
      include: {
        rules: true,
      },
    });

    // Record Audit Log
    await prisma.auditLog.create({
      data: {
        action: 'QURAN_RULESET_CREATED',
        performedBy: authUser?.name || 'Admin',
        userRole: authUser?.role as string,
        userId: authUser?.id,
        details: JSON.stringify({
          ruleSetId: created.id,
          name: created.name,
          version: created.version,
          rulesCount: created.rules.length,
        }),
        status: 'SUCCESS',
      },
    });

    return NextResponse.json(
      {
        message: `Rule Set v${created.version} created successfully in DRAFT mode.`,
        ruleSet: created,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[POST_RULESET_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to create rule set' }, { status: 500 });
  }
}
