import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { verifyFlutterwaveTransaction } from '../../../../lib/flutterwave';
import { sendSystemEmail } from '../../../../lib/emailService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const transaction_id = body.transaction_id || body.flwTransactionId || body.flw_transaction_id;
    const tx_ref = body.tx_ref || body.txRef || body.reference;

    if (!transaction_id || !tx_ref) {
      return NextResponse.json(
        { error: 'Missing transaction_id or tx_ref for verification.' },
        { status: 400 }
      );
    }

    // 1. Locate Authoritative Transaction in PostgreSQL
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { reference: tx_ref },
      include: {
        programme: true,
        application: true,
        student: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'No matching transaction reference found in database.' },
        { status: 404 }
      );
    }

    // Idempotent Return if already verified
    if (transaction.status === 'SUCCESS') {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        message: 'Payment has already been confirmed and processed.',
        transaction: {
          reference: transaction.reference,
          amount: transaction.amount,
          currency: transaction.currency,
          paymentType: transaction.paymentType,
          status: transaction.status,
          verifiedAt: transaction.verifiedAt,
        },
      });
    }

    // 2. Authoritative Verification Call to Flutterwave OP Stack API
    let flwResponse;
    try {
      flwResponse = await verifyFlutterwaveTransaction(transaction_id);
    } catch (flwErr: any) {
      console.error('[FLW_VERIFY_CALL_ERROR]', flwErr);
      return NextResponse.json(
        { error: `Flutterwave verification service error: ${flwErr.message}` },
        { status: 502 }
      );
    }

    if (flwResponse.status !== 'success' || !flwResponse.data) {
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: { status: 'FAILED' },
      });
      return NextResponse.json(
        { error: flwResponse.message || 'Payment verification failed at gateway.' },
        { status: 400 }
      );
    }

    const flwData = flwResponse.data;

    // 3. Strict Server-Side Validation: Reference, Status, Currency, Amount
    if (flwData.status !== 'successful') {
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: { status: 'FAILED', metadata: flwData as any },
      });
      return NextResponse.json(
        { error: `Payment was not successful. Gateway reported: ${flwData.status}` },
        { status: 400 }
      );
    }

    if (flwData.tx_ref !== transaction.reference) {
      return NextResponse.json(
        { error: 'Transaction reference mismatch between gateway and database.' },
        { status: 400 }
      );
    }

    if (flwData.currency.toUpperCase() !== transaction.currency.toUpperCase()) {
      return NextResponse.json(
        { error: `Currency mismatch. Expected ${transaction.currency}, got ${flwData.currency}` },
        { status: 400 }
      );
    }

    if (Number(flwData.amount) < Number(transaction.amount)) {
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: { status: 'FAILED', metadata: flwData as any },
      });
      return NextResponse.json(
        { error: `Insufficient amount paid. Expected ₦${transaction.amount}, received ₦${flwData.amount}` },
        { status: 400 }
      );
    }

    // 4. Atomic PostgreSQL Update using Prisma Transaction
    const verifiedDate = new Date();

    const [updatedTx] = await prisma.$transaction([
      prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'SUCCESS',
          flutterwaveTxId: String(flwData.id),
          verifiedAt: verifiedDate,
          metadata: flwData as any,
        },
      }),
      ...(transaction.applicationId
        ? [
            prisma.admissionApplication.update({
              where: { id: transaction.applicationId },
              data: {
                status: 'PAYMENT_CONFIRMED',
              },
            }),
          ]
        : []),
    ]);

    // 5. Dispatch Payment Confirmation Email via Existing Email Service
    try {
      await sendSystemEmail({
        to: transaction.applicantEmail,
        recipientName: transaction.applicantName,
        subject: `Payment Receipt: ${transaction.paymentType.replace('_', ' ')} - Markazu Umar`,
        template: 'FEE_PAYMENT_CONFIRMATION',
        metadata: {
          reference: transaction.reference,
          amount: transaction.amount,
          paymentType: transaction.paymentType,
          programmeName: transaction.programme?.nameEnglish || 'Markazu Umar Programme',
          date: verifiedDate.toLocaleDateString(),
        },
      });
    } catch (emailErr) {
      console.warn('[PAYMENT_VERIFY_EMAIL_WARN] Confirmation email failed:', emailErr);
    }

    return NextResponse.json({
      status: 'success',
      success: true,
      message: 'Payment successfully verified and recorded.',
      data: {
        reference: updatedTx.reference,
        txRef: updatedTx.reference,
        amount: updatedTx.amount,
        currency: updatedTx.currency,
        transactionId: updatedTx.id,
      },
      transaction: {
        reference: updatedTx.reference,
        amount: updatedTx.amount,
        currency: updatedTx.currency,
        paymentType: updatedTx.paymentType,
        status: updatedTx.status,
        verifiedAt: updatedTx.verifiedAt,
      },
    });
  } catch (error: any) {
    console.error('[PAYMENT_VERIFY_ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Server error during payment verification.' },
      { status: 500 }
    );
  }
}
