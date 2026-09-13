import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme, resolveTeacherScope } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER', 'STUDENT', 'PARENT']);
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.reason }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const recipientStudentIdParam = searchParams.get('recipientStudentId');
    const senderIdParam = searchParams.get('senderId');

    const whereClause: any = {};

    if (authUser?.role === 'STUDENT') {
      const student = await prisma.student.findFirst({
        where: { OR: [{ userId: authUser.id }, { id: authUser.id }], status: 'ACTIVE', deletedAt: null },
        select: { id: true },
      });
      whereClause.recipientStudentId = student?.id || '__NO_STUDENT__';
    } else if (authUser?.role === 'PARENT') {
      const parent = await prisma.parent.findFirst({
        where: { OR: [{ userId: authUser.id }, { id: authUser.id }], deletedAt: null },
        include: { wards: { select: { id: true } } },
      });
      const wardIds = parent?.wards.map((w) => w.id) || [];
      if (recipientStudentIdParam) {
        if (!wardIds.includes(recipientStudentIdParam)) {
          return NextResponse.json({ success: false, error: 'Access Denied: You may only view messages for your linked children.' }, { status: 403 });
        }
        whereClause.recipientStudentId = recipientStudentIdParam;
      } else {
        whereClause.recipientStudentId = { in: wardIds.length > 0 ? wardIds : ['__NO_CHILDREN__'] };
      }
    } else if (authUser?.role === 'TEACHER') {
      const scope = await resolveTeacherScope(authUser.id);
      const teacherClasses = Array.from(new Set([...scope.teachingClassIds, ...scope.attendanceClassIds]));

      // Teacher sees only messages sent by themselves or targeting their assigned classes
      whereClause.OR = [
        { senderId: authUser.id },
        { classId: { in: teacherClasses.length > 0 ? teacherClasses : ['__NO_CLASSES__'] } }
      ];

      if (recipientStudentIdParam) {
        whereClause.recipientStudentId = recipientStudentIdParam;
      }
    } else if (authUser?.role === 'HEADMASTER') {
      if (!authUser.assignedProgrammeId) {
        return NextResponse.json({ success: false, error: 'Headmaster has no assigned section.' }, { status: 403 });
      }
      whereClause.programmeId = authUser.assignedProgrammeId;
      if (recipientStudentIdParam) whereClause.recipientStudentId = recipientStudentIdParam;
      if (senderIdParam) whereClause.senderId = senderIdParam;
    } else {
      // Global Admins
      if (recipientStudentIdParam) whereClause.recipientStudentId = recipientStudentIdParam;
      if (senderIdParam) whereClause.senderId = senderIdParam;
    }

    const messages = await prisma.directMessage.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: messages });
  } catch (error: any) {
    console.error('[GET_MESSAGES_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER']);
    if (!authCheck.authorized || !authUser) {
      return NextResponse.json({ success: false, error: authCheck.reason || 'Unauthorized' }, { status: authCheck.status || 401 });
    }

    const body = await request.json();
    const {
      recipientStudentId,
      messageType,
      subject,
      content,
      attachments,
    } = body;

    if (!recipientStudentId || !subject || !content) {
      return NextResponse.json({ success: false, error: 'recipientStudentId, subject, and content are required' }, { status: 400 });
    }

    // Verify recipient student exists in database
    const recipientStudent = await prisma.student.findUnique({
      where: { id: recipientStudentId },
      include: {
        schoolClass: {
          select: { id: true, name: true, programmeId: true },
        },
        parent: {
          select: { phone: true },
        },
      },
    });

    if (!recipientStudent) {
      return NextResponse.json({ success: false, error: 'Recipient student not found.' }, { status: 404 });
    }

    // Teacher assignment scope enforcement
    if (authUser?.role === 'TEACHER') {
      const scope = await resolveTeacherScope(authUser.id);
      const teacherClasses = Array.from(new Set([...scope.teachingClassIds, ...scope.attendanceClassIds]));
      if (!teacherClasses.includes(recipientStudent.classId)) {
        return NextResponse.json({
          success: false,
          error: 'Access Forbidden (HTTP 403): You cannot dispatch messages to students outside your assigned classes.',
        }, { status: 403 });
      }
    }

    // Headmaster programme scope enforcement
    if (authUser?.role === 'HEADMASTER') {
      const assignedProg = authUser.assignedProgrammeId;
      if (!assignedProg || recipientStudent.programmeId !== assignedProg) {
        return NextResponse.json({
          success: false,
          error: 'Access Forbidden (HTTP 403): Headmaster cannot dispatch messages to students outside assigned section.',
        }, { status: 403 });
      }
    }

    // Identity Anti-Spoofing: sender credentials strictly taken from authenticated server session
    const message = await prisma.directMessage.create({
      data: {
        senderId: authUser.id,
        senderName: authUser.name,
        senderRole: authUser.role as string,
        recipientStudentId: recipientStudent.id,
        studentName: recipientStudent.fullName,
        parentPhone: recipientStudent.parent?.phone || null,
        programmeId: recipientStudent.programmeId || recipientStudent.schoolClass?.programmeId || null,
        classId: recipientStudent.classId,
        className: recipientStudent.schoolClass?.name || null,
        messageType: messageType || 'GENERAL_NOTICE',
        subject: subject.trim(),
        content: content.trim(),
        attachments: typeof attachments === 'string' ? attachments : JSON.stringify(attachments || []),
      },
    });

    return NextResponse.json({ success: true, data: message }, { status: 201 });
  } catch (error: any) {
    console.error('[POST_MESSAGES_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
