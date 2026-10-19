import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';
import { evaluateQuranAssessment } from '@/lib/quranAssessmentEngine';
import { QuranAssessmentStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

// PATCH /api/quran-assessment/candidates/[id]/status
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const candidate = await prisma.quranStudentAssessment.findUnique({
      where: { id: params.id },
      include: {
        student: true,
        dailyRecords: true,
        ruleSet: {
          include: { rules: true },
        },
      },
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate assessment not found' }, { status: 404 });
    }

    const body = await req.json();
    const { action, notes } = body; // action: 'SUBMIT' | 'REVIEW' | 'APPROVE' | 'REOPEN'

    let newStatus: QuranAssessmentStatus = candidate.status;
    let submittedAt = candidate.submittedAt;
    let submittedBy = candidate.submittedBy;
    let approvedAt = candidate.approvedAt;
    let approvedBy = candidate.approvedBy;

    if (action === 'SUBMIT') {
      newStatus = QuranAssessmentStatus.SUBMITTED;
      submittedAt = new Date();
      submittedBy = authUser?.name || 'Staff';
    } else if (action === 'REVIEW') {
      newStatus = QuranAssessmentStatus.UNDER_REVIEW;
    } else if (action === 'APPROVE') {
      // STRICT ROLE SECURITY: Teachers and students cannot approve!
      if (!['SUPER_ADMIN', 'ADMIN', 'HEADMASTER'].includes(authUser?.role as string)) {
        return NextResponse.json(
          { error: 'Forbidden: Teachers and examiners cannot approve assessments. Approval requires Administrator or Headmaster role.' },
          { status: 403 }
        );
      }
      newStatus = QuranAssessmentStatus.APPROVED;
      approvedAt = new Date();
      approvedBy = authUser?.name || 'Admin';
    } else if (action === 'REOPEN') {
      // Only SUPER_ADMIN can reopen an approved assessment
      if (authUser?.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: 'Forbidden: Only Super Administrator can reopen an approved assessment for corrections.' },
          { status: 403 }
        );
      }
      newStatus = QuranAssessmentStatus.DRAFT;
      approvedAt = null;
      approvedBy = null;
    } else {
      return NextResponse.json({ error: `Invalid action "${action}". Allowed: SUBMIT, REVIEW, APPROVE, REOPEN.` }, { status: 400 });
    }

    // Authoritative calculation sync
    const calcResult = evaluateQuranAssessment(
      candidate.ruleSet.rules,
      candidate.studentType,
      candidate.dailyRecords
    );

    const updated = await prisma.quranStudentAssessment.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        finalResult: calcResult.finalResult,
        disqualificationReason: calcResult.disqualificationReason,
        disqualificationMistakes: calcResult.disqualificationMistakes,
        disqualificationThreshold: calcResult.disqualificationThreshold,
        disqualifiedOnDay: calcResult.disqualifiedOnDay,
        disqualifiedDate: calcResult.disqualifiedDate,
        submittedAt,
        submittedBy,
        approvedAt,
        approvedBy,
        notes: notes ? String(notes).trim() : candidate.notes,
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            admissionNo: true,
            gender: true,
            currentJuz: true,
            currentSurah: true,
            tajweedRating: true,
          },
        },
        schoolClass: {
          select: { id: true, name: true, section: true },
        },
        teacher: {
          select: { id: true, fullName: true, staffNo: true, phone: true },
        },
        event: {
          select: {
            id: true,
            name: true,
            durationDays: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
        ruleSet: {
          include: {
            rules: {
              where: { active: true },
              orderBy: [{ mistakeCategory: 'asc' }],
            },
          },
        },
        dailyRecords: {
          orderBy: { dayNumber: 'asc' },
        },
      },
    });

    const applicableRules = updated.ruleSet.rules.filter(
      (r) => r.studentType.trim().toLowerCase() === updated.studentType.trim().toLowerCase()
    );

    // Record audit log
    await prisma.auditLog.create({
      data: {
        action: `QURAN_ASSESSMENT_${action}`,
        performedBy: authUser?.name || 'User',
        userRole: authUser?.role as string,
        userId: authUser?.id,
        details: JSON.stringify({
          assessmentId: updated.id,
          studentName: candidate.student.fullName,
          previousStatus: candidate.status,
          newStatus: updated.status,
          finalResult: updated.finalResult,
          action,
        }),
        status: 'SUCCESS',
      },
    });

    return NextResponse.json({
      message: `Assessment status updated to ${newStatus}.`,
      candidate: {
        ...updated,
        applicableRules,
        calculation: calcResult,
      },
      calculation: calcResult,
    });
  } catch (error: any) {
    console.error('[STATUS_UPDATE_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to update assessment status' }, { status: 500 });
  }
}
