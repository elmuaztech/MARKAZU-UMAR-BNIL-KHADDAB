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

    const { searchParams } = new URL(req.url);
    const requestedProgrammeId = searchParams.get('programmeId');

    let targetProgrammeId: string | null = null;

    // Role-based Scoping
    if (sessionUser.role === 'HEADMASTER') {
      if (!sessionUser.assignedProgrammeId) {
        return NextResponse.json(
          { error: 'You are not assigned to any academic programme.' },
          { status: 403 }
        );
      }
      // Headmaster can NEVER view another programme
      targetProgrammeId = sessionUser.assignedProgrammeId;
    } else if (sessionUser.role === 'SUPER_ADMIN' || sessionUser.role === 'ADMIN') {
      targetProgrammeId = requestedProgrammeId && requestedProgrammeId !== 'ALL' ? requestedProgrammeId : null;
    } else {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // 1. Fetch Programme(s) & Fee Configs
    const programmes = await prisma.programme.findMany({
      where: targetProgrammeId ? { id: targetProgrammeId } : { status: 'ACTIVE' },
      include: { feeConfig: true },
    });

    const programmeIds = programmes.map((p) => p.id);

    // 2. Count Accepted / Active Students
    const studentCount = await prisma.student.count({
      where: {
        programmeId: { in: programmeIds },
        status: 'ACTIVE',
      },
    });

    // 3. Calculate Expected School Fees from DB fee configs
    let expectedSchoolFees = 0;
    for (const prog of programmes) {
      const progStudents = await prisma.student.count({
        where: { programmeId: prog.id, status: 'ACTIVE' },
      });
      const fee = prog.feeConfig?.schoolFeeAmount || 0;
      expectedSchoolFees += progStudents * fee;
    }

    // 4. Fetch All Payment Transactions in Scope
    const transactions = await prisma.paymentTransaction.findMany({
      where: { programmeId: { in: programmeIds } },
      include: {
        programme: { select: { id: true, code: true, nameEnglish: true } },
        student: { select: { id: true, admissionNo: true, fullName: true } },
        application: { select: { id: true, applicationNo: true, studentFullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // 5. Aggregate Metrics
    const successfulTx = transactions.filter((t) => t.status === 'SUCCESS');
    const pendingTx = transactions.filter((t) => t.status === 'PENDING');
    const failedTx = transactions.filter((t) => t.status === 'FAILED');

    const totalSchoolFeesCollected = successfulTx
      .filter((t) => t.paymentType === 'SCHOOL_FEE')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalApplicationFeesCollected = successfulTx
      .filter((t) => t.paymentType === 'APPLICATION_FEE')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalCollected = totalSchoolFeesCollected + totalApplicationFeesCollected;
    const totalOutstanding = Math.max(0, expectedSchoolFees - totalSchoolFeesCollected);

    const mappedTransactions = transactions.map((t) => ({
      id: t.id,
      txRef: t.reference,
      reference: t.reference,
      flwRef: t.flutterwaveTxId,
      flutterwaveTxId: t.flutterwaveTxId,
      provider: t.provider,
      paymentType: t.paymentType,
      amount: t.amount,
      currency: t.currency,
      status: t.status,
      payerName: t.applicantName,
      applicantName: t.applicantName,
      payerEmail: t.applicantEmail,
      applicantEmail: t.applicantEmail,
      applicantPhone: t.applicantPhone,
      programmeName: t.programme?.nameEnglish,
      studentName: t.student?.fullName || t.application?.studentFullName || null,
      targetNo: t.student?.admissionNo || t.application?.applicationNo || null,
      createdAt: t.createdAt,
      verifiedAt: t.verifiedAt,
    }));

    const responseData = {
      isGlobal: !targetProgrammeId,
      programme: targetProgrammeId
        ? programmes[0]
          ? {
              id: programmes[0].id,
              name: programmes[0].nameEnglish,
              nameEnglish: programmes[0].nameEnglish,
              code: programmes[0].code,
              feeConfig: programmes[0].feeConfig,
            }
          : null
        : null,
      metrics: {
        acceptedStudents: studentCount,
        acceptedStudentsCount: studentCount,
        expectedSchoolFees,
        totalCollected,
        totalSchoolFeesCollected,
        totalApplicationFeesCollected,
        totalOutstanding,
        successfulTransactions: successfulTx.length,
        successfulCount: successfulTx.length,
        pendingTransactions: pendingTx.length,
        pendingCount: pendingTx.length,
        failedTransactions: failedTx.length,
        failedCount: failedTx.length,
      },
      transactions: mappedTransactions,
    };

    return NextResponse.json({
      status: 'success',
      data: responseData,
      ...responseData,
    });
  } catch (error: any) {
    console.error('[FINANCE_OVERVIEW_ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve financial metrics.' },
      { status: 500 }
    );
  }
}
