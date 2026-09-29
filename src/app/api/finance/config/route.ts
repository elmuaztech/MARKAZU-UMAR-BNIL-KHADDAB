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

    // Fetch headmasters first
    const headmasters = await prisma.user.findMany({
      where: { role: 'HEADMASTER', deletedAt: null, status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        email: true,
        assignedProgrammeId: true,
        assignedProgrammeName: true,
      },
    });

    const formattedProgrammes = programmes.map((p) => {
      const isPaid = p.feeConfig ? (p.feeConfig.schoolFeeAmount > 0 || p.feeConfig.requiresApplicationFee) : false;
      const assignedHm = headmasters.find((hm) => hm.assignedProgrammeId === p.id);
      return {
        id: p.id,
        name: p.nameEnglish,
        nameEnglish: p.nameEnglish,
        nameArabic: p.nameArabic,
        code: p.code,
        description: p.description,
        isPaidProgramme: isPaid,
        feeConfig: p.feeConfig
          ? {
              requiresApplicationFee: p.feeConfig.requiresApplicationFee,
              applicationFee: p.feeConfig.applicationFeeAmount,
              applicationFeeAmount: p.feeConfig.applicationFeeAmount,
              schoolFee: p.feeConfig.schoolFeeAmount,
              schoolFeeAmount: p.feeConfig.schoolFeeAmount,
              currency: p.feeConfig.currency || 'NGN',
            }
          : {
              requiresApplicationFee: false,
              applicationFee: 0,
              applicationFeeAmount: 0,
              schoolFee: 0,
              schoolFeeAmount: 0,
              currency: 'NGN',
            },
        headmasterId: assignedHm?.id || null,
        headmasterName: assignedHm?.name || null,
      };
    });

    return NextResponse.json({
      status: 'success',
      data: formattedProgrammes,
      programmes: formattedProgrammes,
      headmasters,
    });
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

    const hmUserId = headmasterUserId || body.headmasterId;

    // Role Scoping
    if (sessionUser.role === 'HEADMASTER') {
      if (sessionUser.assignedProgrammeId !== programmeId) {
        return NextResponse.json(
          { error: 'Unauthorized: You can only configure your assigned programme.' },
          { status: 403 }
        );
      }
      // Headmasters cannot reassign Headmaster user
      if (hmUserId) {
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
    if (sessionUser.role === 'SUPER_ADMIN' && hmUserId) {
      const targetProg = await prisma.programme.findUnique({ where: { id: programmeId } });
      if (targetProg) {
        // Clear previous programme assignment for this headmaster
        await prisma.user.update({
          where: { id: hmUserId },
          data: {
            assignedProgrammeId: targetProg.id,
            assignedProgrammeName: targetProg.nameEnglish,
          },
        });
      }
    }

    return NextResponse.json({
      status: 'success',
      success: true,
      message: 'Financial configuration successfully updated.',
      feeConfig,
    });
  } catch (error: any) {
    console.error('[FINANCE_CONFIG_POST_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to update fee configuration.' }, { status: 500 });
  }
}
