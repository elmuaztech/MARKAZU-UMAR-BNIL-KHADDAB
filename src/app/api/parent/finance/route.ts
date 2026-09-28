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

    if (sessionUser.role !== 'PARENT' && sessionUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access restricted to Parent portal' }, { status: 403 });
    }

    // 1. Locate Parent Record
    let parent = await prisma.parent.findFirst({
      where: {
        OR: [
          { userId: sessionUser.id },
          { email: { equals: sessionUser.email, mode: 'insensitive' } },
        ],
      },
    });

    if (!parent) {
      // Return empty wards safely if no parent record linked yet
      return NextResponse.json({ parent: null, wards: [] });
    }

    // 2. Fetch Linked Wards & Programmes
    const students = await prisma.student.findMany({
      where: { guardianId: parent.id },
      include: {
        schoolClass: true,
      },
    });

    // 3. Evaluate Financial Status for Each Ward
    const wardFinancials = [];

    for (const student of students) {
      let programme = null;
      let feeConfig = null;

      if (student.programmeId) {
        programme = await prisma.programme.findUnique({
          where: { id: student.programmeId },
          include: { feeConfig: true },
        });
        feeConfig = programme?.feeConfig;
      }

      const schoolFeeAmount = feeConfig?.schoolFeeAmount || 0;
      const isFeeConfigured = schoolFeeAmount > 0;
      const isAcceptedAndActive = student.status === 'ACTIVE';

      // School fee is ONLY required if programme has a configured fee AND student is accepted/active
      const isSchoolFeeRequired = isFeeConfigured && isAcceptedAndActive;

      // Fetch payment history for this student
      const payments = await prisma.paymentTransaction.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: 'desc' },
      });

      const successfulPayments = payments.filter((p) => p.status === 'SUCCESS');
      const totalPaid = successfulPayments.reduce((sum, p) => sum + p.amount, 0);
      const outstandingBalance = isSchoolFeeRequired ? Math.max(0, schoolFeeAmount - totalPaid) : 0;

      wardFinancials.push({
        student: {
          id: student.id,
          admissionNo: student.admissionNo,
          fullName: student.fullName,
          status: student.status,
          className: student.schoolClass?.name || 'Class',
          programmeName: programme?.nameEnglish || 'Academic Programme',
          programmeId: programme?.id || null,
        },
        financials: {
          isSchoolFeeRequired,
          schoolFeeAmount: isSchoolFeeRequired ? schoolFeeAmount : 0,
          currency: feeConfig?.currency || 'NGN',
          totalPaid,
          outstandingBalance,
          isFullyPaid: isSchoolFeeRequired ? outstandingBalance <= 0 : true,
          payments: payments.map((p) => ({
            id: p.id,
            reference: p.reference,
            amount: p.amount,
            currency: p.currency,
            status: p.status,
            paymentType: p.paymentType,
            verifiedAt: p.verifiedAt,
            createdAt: p.createdAt,
          })),
        },
      });
    }

    const flatWards = wardFinancials.map((w) => ({
      studentId: w.student.id,
      studentName: w.student.fullName,
      admissionNo: w.student.admissionNo,
      status: w.student.status,
      className: w.student.className,
      programmeId: w.student.programmeId,
      programmeName: w.student.programmeName,
      isPaidProgramme: w.financials.isSchoolFeeRequired,
      schoolFee: w.financials.schoolFeeAmount,
      amountPaid: w.financials.totalPaid,
      outstandingBalance: w.financials.outstandingBalance,
      isFullyPaid: w.financials.isFullyPaid,
      transactions: w.financials.payments,
      student: w.student,
      financials: w.financials,
    }));

    return NextResponse.json({
      status: 'success',
      data: {
        parent: {
          id: parent.id,
          name: parent.fullName,
          email: parent.email,
          phone: parent.phone,
        },
        wards: flatWards,
      },
      parent: {
        id: parent.id,
        name: parent.fullName,
        email: parent.email,
        phone: parent.phone,
      },
      wards: flatWards,
    });
  } catch (error: any) {
    console.error('[PARENT_FINANCE_GET_ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve parent financial records.' },
      { status: 500 }
    );
  }
}
