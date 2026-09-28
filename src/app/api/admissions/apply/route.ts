import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { sendSystemEmail } from '../../../../lib/emailService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      programmeId,
      paymentReference,
      studentFullName,
      studentGender,
      studentDob,
      passportPhoto,
      state,
      lga,
      studentAddress,
      previousSchool,
      parentName,
      parentRelationship,
      parentPhone,
      parentWhatsapp,
      parentEmail,
      parentOccupation,
      parentAddress,
      emergencyName,
      emergencyPhone,
      medicalInformation,
      remarks,
    } = body;

    if (!programmeId || !studentFullName || !parentName || !parentPhone || !parentEmail) {
      return NextResponse.json(
        { error: 'Please provide all required application and guardian information.' },
        { status: 400 }
      );
    }

    // 1. Authoritative Programme & Fee Verification
    const programme = await prisma.programme.findUnique({
      where: { id: programmeId },
      include: { feeConfig: true },
    });

    if (!programme) {
      return NextResponse.json({ error: 'Selected programme does not exist.' }, { status: 404 });
    }

    const feeConfig = programme.feeConfig;
    const isFeeRequired = Boolean(feeConfig?.requiresApplicationFee && (feeConfig?.applicationFeeAmount || 0) > 0);

    let paymentTx: any = null;

    if (isFeeRequired) {
      if (!paymentReference) {
        return NextResponse.json(
          { error: 'This programme requires a verified application fee payment before submission.' },
          { status: 402 }
        );
      }

      // Verify that a SUCCESS payment transaction exists in PostgreSQL
      paymentTx = await prisma.paymentTransaction.findUnique({
        where: { reference: paymentReference },
      });

      if (!paymentTx || paymentTx.status !== 'SUCCESS') {
        return NextResponse.json(
          { error: 'Payment could not be verified. Please complete payment before submitting.' },
          { status: 402 }
        );
      }

      if (paymentTx.programmeId !== programme.id) {
        return NextResponse.json(
          { error: 'Payment transaction was made for a different programme.' },
          { status: 400 }
        );
      }

      if (paymentTx.paymentType !== 'APPLICATION_FEE') {
        return NextResponse.json(
          { error: 'Invalid payment type associated with this transaction.' },
          { status: 400 }
        );
      }

      if (paymentTx.amount < (feeConfig?.applicationFeeAmount || 0)) {
        return NextResponse.json(
          { error: 'Payment amount does not meet the required application fee.' },
          { status: 400 }
        );
      }
    }

    // 2. Generate Unique Application Number
    const appRandom = Math.floor(1000 + Math.random() * 9000);
    const applicationNo = `APP-2026-${appRandom}`;

    // 3. Persist Admission Application in PostgreSQL
    const application = await prisma.admissionApplication.create({
      data: {
        applicationNo,
        programmeId: programme.id,
        studentFullName: studentFullName.trim(),
        studentGender: studentGender === 'FEMALE' ? 'FEMALE' : 'MALE',
        studentDob: new Date(studentDob || '2018-01-01'),
        passportPhoto: passportPhoto || null,
        state: state ? state.trim() : 'Kano State',
        lga: lga ? lga.trim() : 'Kano Municipal',
        studentAddress: studentAddress ? studentAddress.trim() : 'Kano, Nigeria',
        previousSchool: previousSchool ? previousSchool.trim() : null,
        parentName: parentName.trim(),
        parentRelationship: parentRelationship || 'Guardian',
        parentPhone: parentPhone.trim(),
        parentWhatsapp: parentWhatsapp ? parentWhatsapp.trim() : null,
        parentEmail: parentEmail.trim().toLowerCase(),
        parentOccupation: parentOccupation ? parentOccupation.trim() : null,
        parentAddress: parentAddress ? parentAddress.trim() : 'Kano, Nigeria',
        emergencyName: emergencyName ? emergencyName.trim() : null,
        emergencyPhone: emergencyPhone ? emergencyPhone.trim() : null,
        medicalInformation: medicalInformation ? medicalInformation.trim() : null,
        remarks: remarks ? remarks.trim() : null,
        status: 'SUBMITTED',
      },
    });

    // 4. Link Payment Transaction to this Application if applicable
    if (paymentTx) {
      await prisma.paymentTransaction.update({
        where: { id: paymentTx.id },
        data: { applicationId: application.id },
      });
    }

    // 5. Send Email Notification
    sendSystemEmail({
      to: application.parentEmail,
      recipientName: application.parentName,
      subject: `Admission Application Received (${application.applicationNo}) - Markazu Umar`,
      template: 'APPLICATION_SUBMITTED',
      metadata: {
        applicationNo: application.applicationNo,
        studentName: application.studentFullName,
        programmeName: programme.nameEnglish,
        submissionDate: new Date().toLocaleDateString(),
      },
    }).catch(() => {});

    return NextResponse.json({
      status: 'success',
      success: true,
      message: 'Application successfully submitted.',
      application: {
        id: application.id,
        applicationNo: application.applicationNo,
        studentFullName: application.studentFullName,
        programmeName: programme.nameEnglish,
        status: application.status,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('[ADMISSION_APPLY_ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit admission application.' },
      { status: 500 }
    );
  }
}
