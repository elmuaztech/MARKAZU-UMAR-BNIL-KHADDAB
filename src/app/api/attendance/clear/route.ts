import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const classIdParam = searchParams.get('classId');
    const programmeIdParam = searchParams.get('programmeId');

    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        { error: 'startDate and endDate parameters are required for clearing attendance records.' },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);
    endDate.setHours(23, 59, 59, 999);

    const whereClause: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (classIdParam && classIdParam !== 'ALL') {
      whereClause.classId = classIdParam;
    }

    if (programmeIdParam && programmeIdParam !== 'ALL') {
      whereClause.programmeId = programmeIdParam;
    }

    const result = await prisma.$transaction(async (tx) => {
      const targetCount = await tx.attendanceRecord.count({ where: whereClause });
      if (targetCount === 0) {
        return { deletedCount: 0 };
      }

      const deleted = await tx.attendanceRecord.deleteMany({
        where: whereClause,
      });

      return { deletedCount: deleted.count };
    });

    return NextResponse.json({
      message: `Successfully cleared ${result.deletedCount} attendance record(s) for date range ${startDateParam} to ${endDateParam}.`,
      deletedCount: result.deletedCount,
      startDate: startDateParam,
      endDate: endDateParam,
    });
  } catch (error: any) {
    console.error('[CLEAR_ATTENDANCE_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to clear attendance records' }, { status: 400 });
  }
}
