import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  getAuthenticatedUser,
  enforceRoleAndProgramme,
  verifyTeacherAttendanceAccess,
  resolveTeacherScope,
  getCurrentSchoolSession,
} from '@/lib/auth';
import { getAllServerAttendance, saveServerAttendanceBatch } from '@/lib/serverDb';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER', 'STUDENT', 'PARENT']);
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.reason }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const classId = searchParams.get('classId');
    const requestedProgId = searchParams.get('programmeId');
    const sessionIdParam = searchParams.get('sessionId');
    const studentIdParam = searchParams.get('studentId');
    const monthParam = searchParams.get('month'); // 1 - 12
    const yearParam = searchParams.get('year');   // e.g. 2026
    const dayOfWeekParam = searchParams.get('dayOfWeek'); // 0-6 or MONDAY, TUESDAY...
    const statusParam = searchParams.get('status');
    const termParam = searchParams.get('term');

    const whereClause: any = {};

    // 1. Cooperative Date / Month / Year / Date Range Filtering
    if (dateParam) {
      const targetDate = new Date(dateParam);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      whereClause.date = { gte: startOfDay, lte: endOfDay };
    } else if (startDateParam && endDateParam) {
      const start = new Date(startDateParam);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDateParam);
      end.setHours(23, 59, 59, 999);
      whereClause.date = { gte: start, lte: end };
    } else if (startDateParam) {
      const start = new Date(startDateParam);
      start.setHours(0, 0, 0, 0);
      whereClause.date = { gte: start };
    } else if (endDateParam) {
      const end = new Date(endDateParam);
      end.setHours(23, 59, 59, 999);
      whereClause.date = { lte: end };
    } else if (monthParam && yearParam) {
      const m = parseInt(monthParam, 10) - 1;
      const y = parseInt(yearParam, 10);
      const startOfMonth = new Date(y, m, 1);
      const endOfMonth = new Date(y, m + 1, 0, 23, 59, 59, 999);
      whereClause.date = { gte: startOfMonth, lte: endOfMonth };
    } else if (yearParam) {
      const y = parseInt(yearParam, 10);
      const startOfYear = new Date(y, 0, 1);
      const endOfYear = new Date(y, 11, 31, 23, 59, 59, 999);
      whereClause.date = { gte: startOfYear, lte: endOfYear };
    }

    if (sessionIdParam && sessionIdParam !== 'ALL') {
      whereClause.sessionId = sessionIdParam;
    }

    if (statusParam && statusParam !== 'ALL') {
      whereClause.statusEnum = statusParam;
    }

    if (termParam && termParam !== 'ALL') {
      whereClause.session = {
        activeTerm: termParam,
      };
    }

    // 2. Role-based scoping
    if (authUser?.role === 'HEADMASTER') {
      if (!authUser.assignedProgrammeId) {
        return NextResponse.json({ success: false, error: 'Headmaster has no assigned programme.' }, { status: 403 });
      }
      whereClause.programmeId = authUser.assignedProgrammeId;
      if (classId) whereClause.classId = classId;
      if (studentIdParam) whereClause.studentId = studentIdParam;
    } else if (authUser?.role === 'STUDENT') {
      const student = await prisma.student.findFirst({
        where: { OR: [{ userId: authUser.id }, { id: authUser.id }], status: 'ACTIVE', deletedAt: null },
        select: { id: true },
      });
      if (!student) {
        return NextResponse.json({ success: false, error: 'Student profile not found.' }, { status: 404 });
      }
      whereClause.studentId = student.id;
    } else if (authUser?.role === 'PARENT') {
      const parent = await prisma.parent.findFirst({
        where: { OR: [{ userId: authUser.id }, { id: authUser.id }], deletedAt: null },
        include: { wards: { select: { id: true } } },
      });
      if (!parent) {
        return NextResponse.json({ success: false, error: 'Parent record not found.' }, { status: 404 });
      }
      const linkedWards = parent.wards.map((w) => w.id);
      if (studentIdParam) {
        if (!linkedWards.includes(studentIdParam)) {
          return NextResponse.json({ success: false, error: 'Access forbidden: You may only view attendance for your linked children.' }, { status: 403 });
        }
        whereClause.studentId = studentIdParam;
      } else {
        whereClause.studentId = { in: linkedWards.length > 0 ? linkedWards : ['__NO_CHILDREN__'] };
      }
    } else if (authUser?.role === 'TEACHER') {
      const scope = await resolveTeacherScope(authUser.id, sessionIdParam || undefined);
      if (!scope.isTeacher) {
        return NextResponse.json({ success: false, error: 'Teacher record not found.' }, { status: 403 });
      }
      const allowedClasses = Array.from(new Set([...scope.teachingClassIds, ...scope.attendanceClassIds]));
      if (classId) {
        if (!allowedClasses.includes(classId)) {
          return NextResponse.json({ success: false, error: 'Access forbidden: You are not assigned to this class.' }, { status: 403 });
        }
        whereClause.classId = classId;
      } else {
        whereClause.classId = { in: allowedClasses.length > 0 ? allowedClasses : ['__NO_CLASSES__'] };
      }
      if (studentIdParam) whereClause.studentId = studentIdParam;
    } else {
      // Global Admins
      if (requestedProgId) whereClause.programmeId = requestedProgId;
      if (classId) whereClause.classId = classId;
      if (studentIdParam) whereClause.studentId = studentIdParam;
    }

    let records = await prisma.attendanceRecord.findMany({
      where: whereClause,
      include: {
        student: true,
        schoolClass: true,
        session: true,
      },
      orderBy: { date: 'desc' },
    });

    // Optional Day of Week filtering (0=Sunday ... 6=Saturday, or day name)
    if (dayOfWeekParam && dayOfWeekParam !== 'ALL') {
      const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const targetDay = isNaN(Number(dayOfWeekParam))
        ? dayOfWeekParam.toUpperCase()
        : DAYS[Number(dayOfWeekParam)];

      if (targetDay) {
        records = records.filter((rec) => {
          const d = new Date(rec.date);
          return DAYS[d.getDay()] === targetDay;
        });
      }
    }

    return NextResponse.json({ success: true, data: records });
  } catch (error: any) {
    console.error('[GET_ATTENDANCE_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER']);
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.reason }, { status: authCheck.status });
    }

    const body = await request.json();
    const { records, isDraft, sessionId } = body;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ success: false, error: 'Records array is required' }, { status: 400 });
    }

    // Resolve active session
    let targetSessionId = sessionId;
    if (!targetSessionId) {
      const activeSession = await getCurrentSchoolSession();
      targetSessionId = activeSession?.id || null;
    }

    // Headmaster check
    if (authUser?.role === 'HEADMASTER') {
      const assignedProg = authUser.assignedProgrammeId;
      if (!assignedProg) {
        return NextResponse.json({ success: false, error: 'Headmaster has no assigned programme.' }, { status: 403 });
      }
      const hasOtherProg = records.some((r) => r.programmeId && r.programmeId !== assignedProg);
      if (hasOtherProg) {
        return NextResponse.json(
          { success: false, error: 'Access Forbidden (HTTP 403): Headmaster cannot submit attendance for another programme section.' },
          { status: 403 }
        );
      }
    }

    // Backend verification of Attendance Permission for Teachers
    if (authUser?.role === 'TEACHER') {
      const distinctClassIds = Array.from(new Set(records.map((r: any) => r.classId).filter(Boolean)));
      for (const clsId of distinctClassIds) {
        const check = await verifyTeacherAttendanceAccess(authUser, clsId, targetSessionId || undefined);
        if (!check.authorized) {
          return NextResponse.json(
            {
              success: false,
              error: `Access Forbidden (HTTP 403): ${check.reason || 'You do not have attendance permission for class ' + clsId}`,
            },
            { status: 403 }
          );
        }
      }
    }

    // 1. Mirror write to serverDb (fallback/offline persistence)
    const savedServerRecords = saveServerAttendanceBatch(records, !!isDraft);

    // 2. Postgres Prisma upsert
    const createdRecords = [];
    for (const item of records) {
      try {
        const attendanceId = item.id || `att-${item.classId}-${item.studentId}-${item.date ? item.date.split('T')[0] : new Date().toISOString().split('T')[0]}`;
        const recordDate = item.date ? new Date(item.date) : new Date();
        const validStatus = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'MEDICAL_LEAVE', 'OFFICIAL_ASSIGNMENT', 'HOLIDAY'].includes(item.status)
          ? item.status
          : 'PRESENT';

        // Resolve programmeId if missing
        let itemProgId = item.programmeId || null;
        if (!itemProgId && item.classId) {
          const cls = await prisma.schoolClass.findUnique({ where: { id: item.classId }, select: { programmeId: true } });
          itemProgId = cls?.programmeId || null;
        }

        const rec = await prisma.attendanceRecord.upsert({
          where: {
            id: attendanceId,
          },
          update: {
            sessionId: targetSessionId,
            status: validStatus as any,
            statusEnum: validStatus,
            remarks: item.remarks || '',
            isDraft: !!isDraft,
            editedBy: authUser ? `${authUser.name} (${authUser.role})` : undefined,
            editedAt: new Date(),
          },
          create: {
            id: attendanceId,
            sessionId: targetSessionId,
            date: recordDate,
            studentId: item.studentId,
            classId: item.classId,
            programmeId: itemProgId,
            teacherId: item.teacherId || authUser?.id || null,
            status: validStatus as any,
            statusEnum: validStatus,
            remarks: item.remarks || '',
            isDraft: !!isDraft,
            editedBy: authUser ? `${authUser.name} (${authUser.role})` : null,
          },
          include: {
            student: true,
            schoolClass: true,
          },
        });
        createdRecords.push(rec);
      } catch (dbErr) {
        console.error('[PRISMA_ATTENDANCE_UPSERT_ERROR]', dbErr);
      }
    }

    const finalRecords = createdRecords.length > 0 ? createdRecords : savedServerRecords;

    // 3. Deduplicated Attendance Notification Dispatch to Headmaster + Admins
    if (!isDraft && finalRecords.length > 0) {
      try {
        const sampleRecord = finalRecords[0];
        const classId = sampleRecord.classId;
        const recordDateStr = sampleRecord.date ? new Date(sampleRecord.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

        // Retrieve Class & Programme info if classId is present
        const schoolClass = classId ? await prisma.schoolClass.findUnique({
          where: { id: classId },
          include: { programme: true },
        }) : null;

        if (schoolClass && schoolClass.programmeId) {
          const deduplicationToken = `ATTENDANCE_${classId}_${recordDateStr}_${targetSessionId || 'CURR'}`;

          // Find active Headmaster for this programme
          const headmaster = await prisma.user.findFirst({
            where: {
              role: 'HEADMASTER',
              assignedProgrammeId: schoolClass.programmeId,
              status: 'ACTIVE',
              deletedAt: null,
            },
          });

          // Find active Admin and Super Admin accounts
          const admins = await prisma.user.findMany({
            where: {
              role: { in: ['ADMIN', 'SUPER_ADMIN'] },
              status: 'ACTIVE',
              deletedAt: null,
            },
            take: 2, // Up to 2 operational Admins
          });

          const recipientsToNotify = [
            ...(headmaster ? [headmaster] : []),
            ...admins,
          ];

          for (const recipient of recipientsToNotify) {
            // Check deduplication
            const existingNotif = await prisma.inAppNotification.findFirst({
              where: {
                userId: recipient.id,
                category: 'ATTENDANCE_COMPLETED',
                metadata: { contains: deduplicationToken },
              },
            });

            if (!existingNotif) {
              await prisma.inAppNotification.create({
                data: {
                  userId: recipient.id,
                  title: 'Attendance Submitted',
                  body: `Attendance for ${schoolClass.name} on ${recordDateStr} was submitted by ${authUser?.name || 'Staff'}.`,
                  category: 'ATTENDANCE_COMPLETED',
                  priority: 'NORMAL',
                  senderName: authUser?.name || 'Staff',
                  metadata: JSON.stringify({
                    deduplicationToken,
                    classId,
                    className: schoolClass.name,
                    programmeId: schoolClass.programmeId,
                    date: recordDateStr,
                  }),
                },
              });
            }
          }
        }
      } catch (notifErr) {
        console.warn('[ATTENDANCE_NOTIFICATION_WARNING]', notifErr);
      }
    }

    return NextResponse.json({ success: true, count: finalRecords.length, data: finalRecords });
  } catch (error: any) {
    console.error('[POST_ATTENDANCE_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
