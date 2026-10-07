import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';
import { AssessmentEventStatus, RuleSetStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET /api/quran-assessment/events
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const events = await prisma.assessmentEvent.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        academicSession: {
          select: { id: true, sessionName: true, activeTerm: true },
        },
        ruleSet: {
          select: { id: true, name: true, version: true, status: true },
        },
        _count: {
          select: { assessments: true },
        },
      },
    });

    return NextResponse.json({
      events: events.map((ev) => ({
        id: ev.id,
        name: ev.name,
        description: ev.description,
        academicSession: ev.academicSession,
        ruleSet: ev.ruleSet,
        status: ev.status,
        durationDays: ev.durationDays,
        startDate: ev.startDate,
        endDate: ev.endDate,
        createdBy: ev.createdBy,
        candidatesCount: ev._count.assessments,
        createdAt: ev.createdAt,
        updatedAt: ev.updatedAt,
      })),
    });
  } catch (error: any) {
    console.error('[GET_EVENTS_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch events' }, { status: 500 });
  }
}

// POST /api/quran-assessment/events
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const body = await req.json();
    const { name, description, academicSessionId, ruleSetId, durationDays, startDate, endDate, status } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: 'Event name is required.' }, { status: 400 });
    }

    let finalRuleSetId = ruleSetId;
    if (!finalRuleSetId) {
      // Find current active rule set
      const activeRuleSet = await prisma.assessmentRuleSet.findFirst({
        where: { status: RuleSetStatus.ACTIVE },
      });
      if (!activeRuleSet) {
        return NextResponse.json(
          { error: 'No active Rule Set found. Please activate a Rule Set first or specify one.' },
          { status: 400 }
        );
      }
      finalRuleSetId = activeRuleSet.id;
    }

    const days = parseInt(durationDays || '30', 10);
    if (isNaN(days) || days <= 0) {
      return NextResponse.json({ error: 'Duration days must be a positive integer.' }, { status: 400 });
    }

    const created = await prisma.assessmentEvent.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        academicSessionId: academicSessionId || null,
        ruleSetId: finalRuleSetId,
        durationDays: days,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: status || AssessmentEventStatus.ACTIVE,
        createdBy: authUser?.name || 'Administrator',
      },
      include: {
        ruleSet: true,
        academicSession: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'QURAN_EVENT_CREATED',
        performedBy: authUser?.name || 'Admin',
        userRole: authUser?.role as string,
        userId: authUser?.id,
        details: JSON.stringify({
          eventId: created.id,
          name: created.name,
          ruleSetId: created.ruleSetId,
          ruleSetVersion: created.ruleSet.version,
          durationDays: created.durationDays,
        }),
        status: 'SUCCESS',
      },
    });

    return NextResponse.json(
      {
        message: 'Assessment event created successfully.',
        event: created,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[POST_EVENT_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to create event' }, { status: 500 });
  }
}
