import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getServerSessionUser } from '../../../lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestedProgrammeId = searchParams.get('programmeId');
    const requestedStatus = searchParams.get('status');

    let whereClause: any = {};

    // Role Scoping
    if (sessionUser.role === 'HEADMASTER') {
      if (!sessionUser.assignedProgrammeId) {
        return NextResponse.json(
          { error: 'You are not currently assigned to any academic programme.' },
          { status: 403 }
        );
      }
      // Strict server-side enforcement: Headmaster can ONLY view their assigned programme
      whereClause.programmeId = sessionUser.assignedProgrammeId;
    } else if (sessionUser.role === 'SUPER_ADMIN' || sessionUser.role === 'ADMIN') {
      if (requestedProgrammeId && requestedProgrammeId !== 'ALL') {
        whereClause.programmeId = requestedProgrammeId;
      }
    } else {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (requestedStatus && requestedStatus !== 'ALL') {
      whereClause.status = requestedStatus;
    }

    const applications = await prisma.admissionApplication.findMany({
      where: whereClause,
      include: {
        programme: {
          select: {
            id: true,
            code: true,
            nameEnglish: true,
            nameArabic: true,
          },
        },
        payments: {
          select: {
            id: true,
            reference: true,
            amount: true,
            status: true,
            paymentType: true,
            verifiedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ status: 'success', data: applications, applications });
  } catch (error: any) {
    console.error('[GET_ADMISSIONS_ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve applications.' },
      { status: 500 }
    );
  }
}
