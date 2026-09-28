import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { sendSystemEmail } from '../../../../lib/emailService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('verif-hash');
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH;

    if (!secretHash || signature !== secretHash) {
      return NextResponse.json({ error: 'Unauthorized webhook call.' }, { status: 401 });
    }

    const payload = await req.json();
    const event = payload.event;
    const data = payload.data;

    if (event === 'charge.completed' && data && data.status === 'successful') {
      const txRef = data.tx_ref;
      const flwId = String(data.id);

      const transaction = await prisma.paymentTransaction.findUnique({
        where: { reference: txRef },
        include: { programme: true },
      });

      if (!transaction) {
        return NextResponse.json({ error: 'Transaction reference not found.' }, { status: 404 });
      }

      // Idempotency: if already processed, return 200 immediately
      if (transaction.status === 'SUCCESS') {
        return NextResponse.json({ status: 'already_processed' }, { status: 200 });
      }

      // Validate amount and currency
      if (
        data.currency.toUpperCase() === transaction.currency.toUpperCase() &&
        Number(data.amount) >= Number(transaction.amount)
      ) {
        const verifiedDate = new Date();
        await prisma.$transaction([
          prisma.paymentTransaction.update({
            where: { id: transaction.id },
            data: {
              status: 'SUCCESS',
              flutterwaveTxId: flwId,
              verifiedAt: verifiedDate,
              metadata: data,
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

        sendSystemEmail({
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
        }).catch(() => {});
      }
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error: any) {
    console.error('[FLUTTERWAVE_WEBHOOK_ERROR]', error);
    return NextResponse.json({ error: 'Webhook processing error.' }, { status: 500 });
  }
}
