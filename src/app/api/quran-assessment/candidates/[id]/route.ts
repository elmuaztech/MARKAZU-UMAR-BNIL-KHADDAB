import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';
import { evaluateQuranAssessment } from '@/lib/quranAssessmentEngine';

export const dynamic = 'force-dynamic';

// GET /api/quran-assessment/candidates/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const candidate = await prisma.quranStudentAssessment.findUnique({
      where: { id: params.id },
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

    if (!candidate) {
      return NextResponse.json({ error: 'Assessment candidate not found' }, { status: 404 });
    }

    // Filter rules applicable for this candidate's studentType
    const applicableRules = candidate.ruleSet.rules.filter(
      (r) => r.studentType.trim().toLowerCase() === candidate.studentType.trim().toLowerCase()
    );

    // Run authoritative server-side calculation
    const calcResult = evaluateQuranAssessment(
      applicableRules,
      candidate.studentType,
      candidate.dailyRecords
    );

    return NextResponse.json({
      candidate: {
        ...candidate,
        applicableRules,
        calculation: calcResult,
      },
    });
  } catch (error: any) {
    console.error('[GET_CANDIDATE_BY_ID_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch candidate assessment' }, { status: 500 });
  }
}

// PUT /api/quran-assessment/candidates/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const candidate = await prisma.quranStudentAssessment.findUnique({
      where: { id: params.id },
      include: {
        dailyRecords: true,
        ruleSet: {
          include: { rules: true },
        },
      },
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // Approval locking protection
    if (candidate.status === 'APPROVED' && authUser?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Locked: This assessment has already been APPROVED. Only a Super Admin may reopen or modify approved records.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { studentType, examinerName, examinerId, notes, classId, teacherId } = body;

    const newStudentType = studentType ? String(studentType).trim() : candidate.studentType;

    // Recalculate if studentType changed
    let calcUpdate = {};
    if (newStudentType !== candidate.studentType) {
      const calcResult = evaluateQuranAssessment(
        candidate.ruleSet.rules,
        newStudentType,
        candidate.dailyRecords
      );
      calcUpdate = {
        finalResult: calcResult.finalResult,
        disqualificationReason: calcResult.disqualificationReason,
        disqualificationMistakes: calcResult.disqualificationMistakes,
        disqualificationThreshold: calcResult.disqualificationThreshold,
        disqualifiedOnDay: calcResult.disqualifiedOnDay,
        disqualifiedDate: calcResult.disqualifiedDate,
      };
    }

    const updated = await prisma.quranStudentAssessment.update({
      where: { id: params.id },
      data: {
        studentType: newStudentType,
        examinerName: examinerName !== undefined ? (examinerName ? String(examinerName).trim() : null) : candidate.examinerName,
        examinerId: examinerId !== undefined ? examinerId : candidate.examinerId,
        notes: notes !== undefined ? (notes ? String(notes).trim() : null) : candidate.notes,
        classId: classId || candidate.classId,
        teacherId: teacherId !== undefined ? teacherId : candidate.teacherId,
        ...calcUpdate,
      },
      include: {
        student: true,
        schoolClass: true,
        teacher: true,
        ruleSet: true,
      },
    });

    return NextResponse.json({
      message: 'Candidate assessment details updated successfully.',
      candidate: updated,
    });
  } catch (error: any) {
    console.error('[PUT_CANDIDATE_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to update candidate assessment' }, { status: 500 });
  }
}

// DELETE /api/quran-assessment/candidates/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const candidate = await prisma.quranStudentAssessment.findUnique({
      where: { id: params.id },
      include: {
        student: true,
      },
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    if (candidate.status === 'APPROVED' && authUser?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Prohibited: Approved assessments cannot be deleted. Historic records must be preserved.' },
        { status: 400 }
      );
    }

    await prisma.quranStudentAssessment.delete({
      where: { id: params.id },
    });

    await prisma.auditLog.create({
      data: {
        action: 'QURAN_CANDIDATE_DELETED',
        performedBy: authUser?.name || 'Admin',
        userRole: authUser?.role as string,
        userId: authUser?.id,
        details: JSON.stringify({
          assessmentId: candidate.id,
          studentName: candidate.student.fullName,
          studentType: candidate.studentType,
        }),
        status: 'SUCCESS',
      },
    });

    return NextResponse.json({
      message: `Candidate assessment for "${candidate.student.fullName}" deleted successfully.`,
    });
  } catch (error: any) {
    console.error('[DELETE_CANDIDATE_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to delete candidate assessment' }, { status: 500 });
  }
}
