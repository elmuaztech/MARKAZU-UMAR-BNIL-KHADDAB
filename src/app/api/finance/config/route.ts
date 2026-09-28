import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getServerSessionUser } from '../../../../lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let whereClause: any = { status: 'ACTIVE' };

    if (sessionUser.role === 'HEADMASTER') {
      if (!sessionUser.assignedProgrammeId) {
        return NextResponse.json({ error: 'No assigned programme found.' }, { status: 403 });
      }
      whereClause.id = sessionUser.assignedProgrammeId;
    } else if (sessionUser.role !== 'SUPER_ADMIN' && sessionUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const programmes = await prisma.programme.findMany({
      where: whereClause,
      include: {
        feeConfig: true,
      },
      orderBy: { displayOrder: 'asc' },
    });

    // Also fetch available headmaster candidates for assignment (Super Admin only)
    let headmasters: any[] = [];
    if (sessionUser.role === 'SUPER_ADMIN') {
      headmasters = await prisma.user.findMany({
        where: { role: 'HEADMASTER', deletedAt: null, status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          email: true,
          assignedProgrammeId: true,
          assignedProgrammeName: true,
        },
      });
    }

    return NextResponse.json({ programmes, headmasters });
  } catch (error: any) {
    console.error('[FINANCE_CONFIG_GET_ERROR]', error);
    return NextResponse.json({ error: 'Failed to retrieve fee configurations.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const {
      programmeId,
      requiresApplicationFee,
      applicationFeeAmount,
      schoolFeeAmount,
      headmasterUserId,
    } = body;

    if (!programmeId) {
      return NextResponse.json({ error: 'Programme ID is required.' }, { status: 400 });
    }

    // Role Scoping
    if (sessionUser.role === 'HEADMASTER') {
      if (sessionUser.assignedProgrammeId !== programmeId) {
        return NextResponse.json(
          { error: 'Unauthorized: You can only configure your assigned programme.' },
          { status: 403 }
        );
      }
      // Headmasters cannot reassign Headmaster user
      if (headmasterUserId) {
        return NextResponse.json(
          { error: 'Only Super Admin can reassign Headmasters.' },
          { status: 403 }
        );
      }
    } else if (sessionUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only Super Admin can manage fee configurations.' }, { status: 403 });
    }

    const rawAppFee = applicationFeeAmount !== undefined ? applicationFeeAmount : body.applicationFee;
    const rawSchFee = schoolFeeAmount !== undefined ? schoolFeeAmount : body.schoolFee;
    const appFee = Number(rawAppFee || 0);
    const schFee = Number(rawSchFee || 0);

    if (appFee < 0 || schFee < 0) {
      return NextResponse.json({ error: 'Fee amounts cannot be negative.' }, { status: 400 });
    }

    // 1. Upsert ProgrammeFeeConfig in PostgreSQL
    const feeConfig = await prisma.programmeFeeConfig.upsert({
      where: { programmeId },
      update: {
        requiresApplicationFee: Boolean(requiresApplicationFee),
        applicationFeeAmount: appFee,
        schoolFeeAmount: schFee,
        updatedByUserId: sessionUser.id,
      },
      create: {
        programmeId,
        requiresApplicationFee: Boolean(requiresApplicationFee),
        applicationFeeAmount: appFee,
        schoolFeeAmount: schFee,
        currency: 'NGN',
        isActive: true,
        updatedByUserId: sessionUser.id,
      },
    });

    // 2. Assign Headmaster if provided (Super Admin only)
    if (sessionUser.role === 'SUPER_ADMIN' && headmasterUserId) {
      const targetProg = await prisma.programme.findUnique({ where: { id: programmeId } });
      if (targetProg) {
        // Clear previous programme assignment for this headmaster
        await prisma.user.update({
          where: { id: headmasterUserId },
          data: {
            assignedProgrammeId: targetProg.id,
            assignedProgrammeName: targetProg.nameEnglish,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Financial configuration successfully updated.',
      feeConfig,
    });
  } catch (error: any) {
    console.error('[FINANCE_CONFIG_POST_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to update fee configuration.' }, { status: 500 });
  }
}
