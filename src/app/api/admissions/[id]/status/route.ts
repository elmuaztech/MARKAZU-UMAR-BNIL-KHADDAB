import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getServerSessionUser } from '../../../../../lib/serverAuth';
import { sendSystemEmail } from '../../../../../lib/emailService';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { status, rejectionReason, assignedClassId } = body;

    const allowedStatuses = [
      'UNDER_REVIEW',
      'INTERVIEW_REQUIRED',
      'ACCEPTED',
      'REJECTED',
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid or unsupported admission status.' }, { status: 400 });
    }

    // 1. Fetch Existing Application
    const application = await prisma.admissionApplication.findUnique({
      where: { id },
      include: { programme: true },
    });

    if (!application) {
      return NextResponse.json({ error: 'Admission application not found.' }, { status: 404 });
    }

    // 2. Strict Programme Authorization Check for Headmaster
    if (sessionUser.role === 'HEADMASTER') {
      if (sessionUser.assignedProgrammeId !== application.programmeId) {
        return NextResponse.json(
          { error: 'Unauthorized: You can only review applications for your assigned programme.' },
          { status: 403 }
        );
      }
    } else if (sessionUser.role !== 'SUPER_ADMIN' && sessionUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized to modify admission status.' }, { status: 403 });
    }

    const now = new Date();

    // 3. Process Status Decision
    if (status === 'ACCEPTED') {
      // Find or create Parent in PostgreSQL
      let parent = await prisma.parent.findUnique({
        where: { email: application.parentEmail },
      });

      if (!parent) {
        parent = await prisma.parent.create({
          data: {
            fullName: application.parentName,
            email: application.parentEmail,
            phone: application.parentPhone,
            occupation: application.parentOccupation || 'Guardian',
            address: application.parentAddress || application.studentAddress,
          },
        });
      }

      // Check if student already exists for this application
      let student = application.generatedStudentId
        ? await prisma.student.findUnique({ where: { id: application.generatedStudentId } })
        : null;

      if (!student) {
        // Find default or assigned class for programme
        let targetClassId = assignedClassId;
        if (!targetClassId) {
          const firstClass = await prisma.schoolClass.findFirst({
            where: { programmeId: application.programmeId },
          });
          targetClassId = firstClass?.id;
        }

        if (!targetClassId) {
          return NextResponse.json(
            { error: 'Cannot accept application: No school class exists for this programme.' },
            { status: 400 }
          );
        }

        const admissionNo = `MU-2026-${Math.floor(100 + Math.random() * 900)}`;

        student = await prisma.student.create({
          data: {
            admissionNo,
            fullName: application.studentFullName,
            gender: application.studentGender,
            dob: application.studentDob,
            programmeId: application.programmeId,
            classId: targetClassId,
            guardianId: parent.id,
            status: 'ACTIVE',
            dateEnrolled: now,
          },
        });
      }

      // Update Application Record
      const updatedApp = await prisma.admissionApplication.update({
        where: { id: application.id },
        data: {
          status: 'ACCEPTED',
          reviewedAt: now,
          reviewedBy: sessionUser.name,
          assignedClassId: student.classId,
          generatedStudentId: student.id,
        },
      });

      // Notify Parent: Acceptance & School Fee Eligibility
      sendSystemEmail({
        to: application.parentEmail,
        recipientName: application.parentName,
        subject: `🎉 Admission Accepted: ${application.studentFullName} - Markazu Umar`,
        template: 'ADMISSION_ACCEPTED',
        metadata: {
          studentName: application.studentFullName,
          admissionNo: student.admissionNo,
          programmeName: application.programme.nameEnglish,
          date: now.toLocaleDateString(),
        },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: 'Application marked ACCEPTED. Student enrolled into active standing.',
        application: updatedApp,
        student,
      });
    } else if (status === 'REJECTED') {
      // Rejection: No student record or school fee obligation created
      const updatedApp = await prisma.admissionApplication.update({
        where: { id: application.id },
        data: {
          status: 'REJECTED',
          rejectionReason: rejectionReason ? rejectionReason.trim() : 'Did not meet admission criteria.',
          reviewedAt: now,
          reviewedBy: sessionUser.name,
        },
      });

      sendSystemEmail({
        to: application.parentEmail,
        recipientName: application.parentName,
        subject: `Admission Decision: ${application.studentFullName} - Markazu Umar`,
        template: 'ADMISSION_REJECTED',
        metadata: {
          studentName: application.studentFullName,
          reason: updatedApp.rejectionReason,
          programmeName: application.programme.nameEnglish,
        },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: 'Application marked REJECTED. No school-fee liability assigned.',
        application: updatedApp,
      });
    } else {
      // Transition to UNDER_REVIEW or INTERVIEW_REQUIRED
      const updatedApp = await prisma.admissionApplication.update({
        where: { id: application.id },
        data: {
          status,
          reviewedAt: now,
          reviewedBy: sessionUser.name,
        },
      });

      if (status === 'INTERVIEW_REQUIRED') {
        sendSystemEmail({
          to: application.parentEmail,
          recipientName: application.parentName,
          subject: `Interview/Examination Invitation: ${application.studentFullName} - Markazu Umar`,
          template: 'INTERVIEW_INVITATION',
          metadata: {
            studentName: application.studentFullName,
            programmeName: application.programme.nameEnglish,
          },
        }).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        message: `Application status transitioned to ${status}.`,
        application: updatedApp,
      });
    }
  } catch (error: any) {
    console.error('[ADMISSION_STATUS_UPDATE_ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update admission status.' },
      { status: 500 }
    );
  }
}
