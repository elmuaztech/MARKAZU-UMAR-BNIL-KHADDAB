import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/quran-assessment/events/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const event = await prisma.assessmentEvent.findUnique({
      where: { id: params.id },
      include: {
        academicSession: true,
        ruleSet: {
          include: {
            rules: true,
          },
        },
        assessments: {
          include: {
            student: {
              select: { id: true, fullName: true, admissionNo: true },
            },
            schoolClass: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error: any) {
    console.error('[GET_EVENT_BY_ID_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch event' }, { status: 500 });
  }
}

// PUT /api/quran-assessment/events/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const existing = await prisma.assessmentEvent.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, durationDays, startDate, endDate, status } = body;

    const updated = await prisma.assessmentEvent.update({
      where: { id: params.id },
      data: {
        name: name ? String(name).trim() : existing.name,
        description: description !== undefined ? (description ? String(description).trim() : null) : existing.description,
        durationDays: durationDays ? parseInt(durationDays, 10) : existing.durationDays,
        startDate: startDate ? new Date(startDate) : existing.startDate,
        endDate: endDate ? new Date(endDate) : existing.endDate,
        status: status || existing.status,
      },
      include: {
        ruleSet: true,
        academicSession: true,
      },
    });

    return NextResponse.json({
      message: 'Event updated successfully.',
      event: updated,
    });
  } catch (error: any) {
    console.error('[PUT_EVENT_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to update event' }, { status: 500 });
  }
}
