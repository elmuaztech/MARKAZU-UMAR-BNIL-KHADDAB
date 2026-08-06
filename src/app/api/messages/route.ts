import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recipientStudentId = searchParams.get('recipientStudentId');
    const senderId = searchParams.get('senderId');

    const whereClause: any = {};
    if (recipientStudentId) whereClause.recipientStudentId = recipientStudentId;
    if (senderId) whereClause.senderId = senderId;

    const messages = await prisma.directMessage.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: messages });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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

    if (!senderId || !recipientStudentId || !subject || !content) {
      return NextResponse.json({ success: false, error: 'senderId, recipientStudentId, subject, and content are required' }, { status: 400 });
    }

    const message = await prisma.directMessage.create({
      data: {
        senderId,
        senderName: senderName || 'Teacher',
        senderRole: senderRole || 'TEACHER',
        recipientStudentId,
        studentName: studentName || 'Student',
        programmeId,
        classId,
        className,
        messageType: messageType || 'GENERAL_NOTICE',
        subject,
        content,
        attachments: JSON.stringify(attachments || []),
      },
    });

    return NextResponse.json({ success: true, data: message });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
