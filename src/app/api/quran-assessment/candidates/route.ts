import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';
import { QuranAssessmentStatus, QuranAssessmentResult } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET /api/quran-assessment/candidates
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const studentType = searchParams.get('studentType');
    const classId = searchParams.get('classId');
    const teacherId = searchParams.get('teacherId');
    const examinerId = searchParams.get('examinerId');
    const resultFilter = searchParams.get('result');
    const statusFilter = searchParams.get('status');
    const search = searchParams.get('search');

    const whereClause: any = {};

    if (eventId) whereClause.eventId = eventId;
    if (studentType) whereClause.studentType = { equals: studentType, mode: 'insensitive' };
    if (classId) whereClause.classId = classId;
    if (teacherId) whereClause.teacherId = teacherId;
    if (examinerId) whereClause.examinerId = examinerId;
    if (resultFilter && resultFilter !== 'ALL') whereClause.finalResult = resultFilter as QuranAssessmentResult;
    if (statusFilter && statusFilter !== 'ALL') whereClause.status = statusFilter as QuranAssessmentStatus;

    if (search) {
      whereClause.student = {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { admissionNo: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    // Role-based teacher scoping
    if (authUser?.role === 'TEACHER' && authUser.id) {
      const teacher = await prisma.teacher.findFirst({
        where: {
          OR: [
            { userId: authUser.id },
            { id: authUser.id },
            { email: { equals: authUser.email, mode: 'insensitive' } },
            { staffNo: { equals: authUser.username || '', mode: 'insensitive' } },
          ],
        },
      });

      const orConditions: any[] = [];
      if (teacher) {
        orConditions.push({ teacherId: teacher.id });
        orConditions.push({ examinerId: teacher.id });
        orConditions.push({ examinerName: { contains: teacher.fullName, mode: 'insensitive' } });
      }
      orConditions.push({ teacherId: authUser.id });

      // Check classes taught by teacher
      const managedClasses = await prisma.schoolClass.findMany({
        where: {
          OR: [
            { classTeacherId: teacher?.id || authUser.id },
            { teacherAssignments: { some: { teacherId: teacher?.id || authUser.id } } },
          ],
        },
        select: { id: true },
      });

      if (managedClasses.length > 0) {
        orConditions.push({ classId: { in: managedClasses.map((c) => c.id) } });
      }

      whereClause.OR = orConditions.length > 0 ? orConditions : [{ teacherId: '__NONE__' }];
    }

    const candidates = await prisma.quranStudentAssessment.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            admissionNo: true,
            gender: true,
          },
        },
        schoolClass: {
          select: { id: true, name: true, section: true },
        },
        teacher: {
          select: { id: true, fullName: true, staffNo: true },
        },
        event: {
          select: { id: true, name: true, durationDays: true },
        },
        ruleSet: {
          select: { id: true, name: true, version: true },
        },
        _count: {
          select: { dailyRecords: true },
        },
        dailyRecords: {
          select: {
            tajweedMistakes: true,
            tilawaMistakes: true,
            categoryMistakes: true,
          },
        },
      },
    });

    // Compute metrics
    const totalCandidates = candidates.length;
    let inProgress = 0;
    let completed = 0;
    let qualified = 0;
    let disqualified = 0;

    const formattedCandidates = candidates.map((c) => {
      if (c.status === 'APPROVED') {
        completed++;
      } else {
        inProgress++;
      }

      if (c.finalResult === 'QUALIFIED') {
        qualified++;
      } else if (c.finalResult === 'DISQUALIFIED') {
        disqualified++;
      }

      // Calculate total mistakes across daily records
      let totalMistakes = 0;
      for (const dr of c.dailyRecords) {
        totalMistakes += (dr.tajweedMistakes || 0) + (dr.tilawaMistakes || 0);
        if (dr.categoryMistakes && typeof dr.categoryMistakes === 'object') {
          for (const val of Object.values(dr.categoryMistakes)) {
            totalMistakes += Number(val) || 0;
          }
        }
      }

      return {
        id: c.id,
        studentId: c.studentId,
        studentName: c.student.fullName,
        studentAdmissionNo: c.student.admissionNo,
        studentGender: c.student.gender,
        eventId: c.eventId,
        eventName: c.event.name,
        durationDays: c.event.durationDays,
        studentType: c.studentType,
        classId: c.classId,
        className: c.schoolClass.name,
        teacherId: c.teacherId,
        teacherName: c.teacher?.fullName || null,
        examinerId: c.examinerId,
        examinerName: c.examinerName,
        ruleSetId: c.ruleSetId,
        ruleSetName: c.ruleSet.name,
        ruleSetVersion: c.ruleSet.version,
        daysRecorded: c._count.dailyRecords,
        totalMistakes,
        status: c.status,
        finalResult: c.finalResult,
        disqualificationReason: c.disqualificationReason,
        disqualificationMistakes: c.disqualificationMistakes,
        disqualificationThreshold: c.disqualificationThreshold,
        disqualifiedOnDay: c.disqualifiedOnDay,
        disqualifiedDate: c.disqualifiedDate,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      };
    });

    return NextResponse.json({
      metrics: {
        totalCandidates,
        inProgress,
        completed,
        qualified,
        disqualified,
      },
      candidates: formattedCandidates,
    });
  } catch (error: any) {
    console.error('[GET_CANDIDATES_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch assessment candidates' }, { status: 500 });
  }
}

// POST /api/quran-assessment/candidates
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason || 'Candidate enrollment is restricted to school leadership.' }, { status: authCheck.status });
    }

    const body = await req.json();
    const { studentId, eventId, studentType, classId, teacherId, examinerId, examinerName, notes } = body;

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required. Select an existing student from the Markazu database.' }, { status: 400 });
    }
    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required. Select an assessment event.' }, { status: 400 });
    }
    if (!studentType || !String(studentType).trim()) {
      return NextResponse.json({ error: 'studentType is required (e.g. Masu Biye, Masu Haddah).' }, { status: 400 });
    }

    // 1. Check existing student in Markazu database (NO DUPLICATE RECORDS!)
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        schoolClass: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found in Markazu database.' }, { status: 404 });
    }

    // 2. Check event and snapshot its rule set
    const event = await prisma.assessmentEvent.findUnique({
      where: { id: eventId },
      include: {
        ruleSet: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Assessment Event not found.' }, { status: 404 });
    }

    // 3. Prevent duplicate candidate registration in the same event
    const existingCandidate = await prisma.quranStudentAssessment.findUnique({
      where: {
        studentId_eventId: {
          studentId,
          eventId,
        },
      },
    });

    if (existingCandidate) {
      return NextResponse.json(
        { error: `Student "${student.fullName}" (${student.admissionNo}) is already registered for "${event.name}".` },
        { status: 400 }
      );
    }

    const targetClassId = classId || student.classId;

    const created = await prisma.quranStudentAssessment.create({
      data: {
        studentId,
        eventId,
        ruleSetId: event.ruleSetId, // Snapshot authoritative rule set for historical integrity!
        studentType: studentType.trim(),
        classId: targetClassId,
        teacherId: teacherId || student.schoolClass?.classTeacherId || null,
        examinerId: examinerId || null,
        examinerName: examinerName?.trim() || authUser?.name || null,
        status: QuranAssessmentStatus.DRAFT,
        finalResult: QuranAssessmentResult.PENDING,
        notes: notes?.trim() || null,
      },
      include: {
        student: true,
        schoolClass: true,
        teacher: true,
        event: true,
        ruleSet: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'QURAN_CANDIDATE_REGISTERED',
        performedBy: authUser?.name || 'Staff',
        userRole: authUser?.role as string,
        userId: authUser?.id,
        details: JSON.stringify({
          assessmentId: created.id,
          studentName: student.fullName,
          admissionNo: student.admissionNo,
          eventName: event.name,
          studentType: created.studentType,
          ruleSetVersion: event.ruleSet.version,
        }),
        status: 'SUCCESS',
      },
    });

    return NextResponse.json(
      {
        message: `Candidate "${student.fullName}" enrolled successfully.`,
        candidate: created,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[POST_CANDIDATE_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to register assessment candidate' }, { status: 500 });
  }
}
