import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      paymentType,
      programmeId,
      applicationId,
      studentId,
    } = body;

    const applicantName = (body.applicantName || body.payerName || '').trim();
    const applicantEmail = (body.applicantEmail || body.payerEmail || '').trim().toLowerCase();
    const applicantPhone = (body.applicantPhone || body.payerPhone || '').trim();

    if (!paymentType || !programmeId || !applicantName || !applicantEmail) {
      return NextResponse.json(
        { error: 'Missing required payment initialization parameters' },
        { status: 400 }
      );
    }

    if (paymentType !== 'APPLICATION_FEE' && paymentType !== 'SCHOOL_FEE') {
      return NextResponse.json(
        { error: 'Invalid payment type. Must be APPLICATION_FEE or SCHOOL_FEE' },
        { status: 400 }
      );
    }

    // 1. Fetch Authoritative Programme & Fee Configuration from PostgreSQL
    const programme = await prisma.programme.findUnique({
      where: { id: programmeId },
      include: { feeConfig: true },
    });

    if (!programme) {
      return NextResponse.json({ error: 'Programme not found in database' }, { status: 404 });
    }

    const feeConfig = programme.feeConfig;
    if (!feeConfig) {
      return NextResponse.json(
        { error: 'Financial configuration not established for this programme' },
        { status: 400 }
      );
    }

    let authoritativeAmount = 0;
    const currency = feeConfig.currency || 'NGN';

    if (paymentType === 'APPLICATION_FEE') {
      if (!feeConfig.requiresApplicationFee || feeConfig.applicationFeeAmount <= 0) {
        return NextResponse.json(
          { error: 'This programme does not require an application fee.' },
          { status: 400 }
        );
      }
      authoritativeAmount = feeConfig.applicationFeeAmount;
    } else if (paymentType === 'SCHOOL_FEE') {
      if (feeConfig.schoolFeeAmount <= 0) {
        return NextResponse.json(
          { error: 'No school fee configured for this programme.' },
          { status: 400 }
        );
      }

      // If paying for a student, verify student status and programme
      if (studentId) {
        const student = await prisma.student.findUnique({
          where: { id: studentId },
        });

        if (!student) {
          return NextResponse.json({ error: 'Student record not found.' }, { status: 404 });
        }

        // Must be in active standing
        if (student.status !== 'ACTIVE') {
          return NextResponse.json(
            { error: `Cannot process school fees for student with status ${student.status}` },
            { status: 400 }
          );
        }
      }

      authoritativeAmount = feeConfig.schoolFeeAmount;
    }

    // 2. Generate Unique Transaction Reference
    const prefix = paymentType === 'APPLICATION_FEE' ? 'MUBK-APP' : 'MUBK-SCH';
    const reference = `${prefix}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 3. Persist PENDING Payment Transaction in PostgreSQL
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';

    const transaction = await prisma.paymentTransaction.create({
      data: {
        reference,
        provider: 'FLUTTERWAVE',
        paymentType,
        amount: authoritativeAmount,
        currency,
        status: 'PENDING',
        applicantEmail: applicantEmail.trim().toLowerCase(),
        applicantName: applicantName.trim(),
        applicantPhone: applicantPhone ? applicantPhone.trim() : null,
        programmeId: programme.id,
        applicationId: applicationId || null,
        studentId: studentId || null,
        ipAddress: clientIp,
        metadata: {
          programmeName: programme.nameEnglish,
          programmeCode: programme.code,
        },
      },
    });

    const publicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || process.env.FLUTTERWAVE_PUBLIC_KEY || '';

    const payloadData = {
      publicKey,
      txRef: transaction.reference,
      reference: transaction.reference,
      transactionId: transaction.id,
      amount: transaction.amount,
      currency: transaction.currency,
      paymentType: transaction.paymentType,
      programmeName: programme.nameEnglish,
      customer: {
        email: transaction.applicantEmail,
        name: transaction.applicantName,
        phone: transaction.applicantPhone,
      },
    };

    return NextResponse.json({
      status: 'success',
      success: true,
      data: payloadData,
      ...payloadData,
    });
  } catch (error: any) {
    console.error('[PAYMENT_INITIALIZE_ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Payment initialization failed' },
      { status: 500 }
    );
  }
}
