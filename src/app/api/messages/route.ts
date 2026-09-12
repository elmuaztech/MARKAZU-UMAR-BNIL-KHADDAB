import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER', 'STUDENT', 'PARENT']);
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.reason }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const recipientStudentId = searchParams.get('recipientStudentId');
    const senderId = searchParams.get('senderId');

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
      whereClause.recipientStudentId = { in: wardIds.length > 0 ? wardIds : ['__NO_WARDS__'] };
    } else {
      if (recipientStudentId) whereClause.recipientStudentId = recipientStudentId;
      if (senderId) whereClause.senderId = senderId;
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
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.reason }, { status: authCheck.status });
    }

    const body = await request.json();
    const {
      senderId,
      senderName,
      senderRole,
      recipientStudentId,
      studentName,
      programmeId,
      classId,
      className,
      messageType,
      subject,
      content,
      attachments,
    } = body;

    if (!recipientStudentId || !subject || !content) {
      return NextResponse.json({ success: false, error: 'recipientStudentId, subject, and content are required' }, { status: 400 });
    }

    const message = await prisma.directMessage.create({
      data: {
        senderId: senderId || authUser?.id || 'sys-sender',
        senderName: senderName || authUser?.name || 'Staff',
        senderRole: senderRole || (authUser?.role as string) || 'TEACHER',
        recipientStudentId,
        studentName: studentName || 'Student',
        programmeId: programmeId || null,
        classId: classId || null,
        className: className || null,
        messageType: messageType || 'GENERAL_NOTICE',
        subject,
        content,
        attachments: typeof attachments === 'string' ? attachments : JSON.stringify(attachments || []),
      },
    });

    return NextResponse.json({ success: true, data: message });
  } catch (error: any) {
    console.error('[POST_MESSAGES_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
