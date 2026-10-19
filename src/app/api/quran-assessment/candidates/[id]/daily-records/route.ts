import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';
import { evaluateQuranAssessment } from '@/lib/quranAssessmentEngine';

export const dynamic = 'force-dynamic';

// GET /api/quran-assessment/candidates/[id]/daily-records
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const records = await prisma.quranDailyAssessmentRecord.findMany({
      where: { assessmentId: params.id },
      orderBy: { dayNumber: 'asc' },
    });

    return NextResponse.json({ dailyRecords: records });
  } catch (error: any) {
    console.error('[GET_DAILY_RECORDS_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch daily records' }, { status: 500 });
  }
}

// POST /api/quran-assessment/candidates/[id]/daily-records
// Supports both single-day update and batch 30-day paper-form submission
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const candidate = await prisma.quranStudentAssessment.findUnique({
      where: { id: params.id },
      include: {
        event: true,
        ruleSet: {
          include: {
            rules: true,
          },
        },
      },
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate assessment not found.' }, { status: 404 });
    }

    // STRICT LOCKING: If already approved, edits are prohibited
    if (candidate.status === 'APPROVED' && authUser?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Locked: This assessment has already been APPROVED. Modifications are prohibited to preserve historical integrity.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const recordsToSave: any[] = Array.isArray(body.records) ? body.records : [body];

    if (recordsToSave.length === 0) {
      return NextResponse.json({ error: 'No daily assessment records provided.' }, { status: 400 });
    }

    const durationDays = candidate.event.durationDays || 30;

    // Database transaction to upsert records safely
    await prisma.$transaction(async (tx) => {
      for (const rec of recordsToSave) {
        const dayNumber = parseInt(rec.dayNumber, 10);
        if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > durationDays) {
          throw new Error(`Invalid day number (${rec.dayNumber}). Must be between 1 and ${durationDays}.`);
        }

        const date = rec.date ? new Date(rec.date) : new Date();
        const tajweedMistakes = Math.max(0, parseInt(rec.tajweedMistakes || '0', 10));
        const tilawaMistakes = Math.max(0, parseInt(rec.tilawaMistakes || '0', 10));
        const categoryMistakes = rec.categoryMistakes && typeof rec.categoryMistakes === 'object' ? rec.categoryMistakes : null;

        await tx.quranDailyAssessmentRecord.upsert({
          where: {
            assessmentId_dayNumber: {
              assessmentId: params.id,
              dayNumber,
            },
          },
          update: {
            date,
            fromHizb: rec.fromHizb ? String(rec.fromHizb).trim() : null,
            toHizb: rec.toHizb ? String(rec.toHizb).trim() : null,
            tajweedMistakes,
            tilawaMistakes,
            categoryMistakes,
            notes: rec.notes ? String(rec.notes).trim() : null,
            enteredBy: authUser?.name || 'Staff',
          },
          create: {
            assessmentId: params.id,
            dayNumber,
            date,
            fromHizb: rec.fromHizb ? String(rec.fromHizb).trim() : null,
            toHizb: rec.toHizb ? String(rec.toHizb).trim() : null,
            tajweedMistakes,
            tilawaMistakes,
            categoryMistakes,
            notes: rec.notes ? String(rec.notes).trim() : null,
            enteredBy: authUser?.name || 'Staff',
          },
        });
      }
    });

    // Fetch all current daily records
    const allDailyRecords = await prisma.quranDailyAssessmentRecord.findMany({
      where: { assessmentId: params.id },
      orderBy: { dayNumber: 'asc' },
    });

    // Authoritative Server-Side Result Engine calculation
    const calcResult = evaluateQuranAssessment(
      candidate.ruleSet.rules,
      candidate.studentType,
      allDailyRecords
    );

    // Authoritative update to candidate record
    const updatedCandidate = await prisma.quranStudentAssessment.update({
      where: { id: params.id },
      data: {
        finalResult: calcResult.finalResult,
        disqualificationReason: calcResult.disqualificationReason,
        disqualificationMistakes: calcResult.disqualificationMistakes,
        disqualificationThreshold: calcResult.disqualificationThreshold,
        disqualifiedOnDay: calcResult.disqualifiedOnDay,
        disqualifiedDate: calcResult.disqualifiedDate,
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

    const applicableRules = updatedCandidate.ruleSet.rules.filter(
      (r) => r.studentType.trim().toLowerCase() === updatedCandidate.studentType.trim().toLowerCase()
    );

    return NextResponse.json({
      message: 'Daily assessment records saved and calculated successfully.',
      calculation: calcResult,
      candidate: {
        ...updatedCandidate,
        applicableRules,
        calculation: calcResult,
      },
      dailyRecords: allDailyRecords,
    });
  } catch (error: any) {
    console.error('[POST_DAILY_RECORDS_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to save daily assessment records' }, { status: 400 });
  }
}
