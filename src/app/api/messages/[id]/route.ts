import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const messageId = params.id;
    const existingMessage = await prisma.directMessage.findUnique({
      where: { id: messageId },
    });

    if (!existingMessage) {
      return NextResponse.json({ success: false, error: 'Message not found' }, { status: 404 });
    }

    // Role-based recipient ownership
    if (authUser.role === 'STUDENT') {
      const student = await prisma.student.findFirst({
        where: { OR: [{ userId: authUser.id }, { id: authUser.id }], deletedAt: null },
      });
      if (!student || student.id !== existingMessage.recipientStudentId) {
        return NextResponse.json({ success: false, error: 'Access Denied: You cannot view messages intended for other recipients.' }, { status: 403 });
      }
    } else if (authUser.role === 'PARENT') {
      const parent = await prisma.parent.findFirst({
        where: { OR: [{ userId: authUser.id }, { id: authUser.id }], deletedAt: null },
        include: { wards: { select: { id: true } } },
      });
      const wardIds = parent?.wards.map((w) => w.id) || [];
      if (!wardIds.includes(existingMessage.recipientStudentId)) {
        return NextResponse.json({ success: false, error: 'Access Denied: You cannot view messages intended for other children.' }, { status: 403 });
      }
    } else if (authUser.role === 'TEACHER') {
      const { resolveTeacherScope } = await import('@/lib/auth');
      const scope = await resolveTeacherScope(authUser.id);
      const teacherClasses = Array.from(new Set([...scope.teachingClassIds, ...scope.attendanceClassIds]));
      if (existingMessage.senderId !== authUser.id && (!existingMessage.classId || !teacherClasses.includes(existingMessage.classId))) {
        return NextResponse.json({ success: false, error: 'Access Denied: You are not authorized to view this message.' }, { status: 403 });
      }
    } else if (authUser.role === 'HEADMASTER') {
      const assignedProg = authUser.assignedProgrammeId;
      if (assignedProg && existingMessage.programmeId !== assignedProg) {
        return NextResponse.json({ success: false, error: 'Access Denied: You cannot view messages for another programme.' }, { status: 403 });
      }
    }

    return NextResponse.json({ success: true, data: existingMessage });
  } catch (error: any) {
    console.error('[GET_MESSAGE_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const messageId = params.id;
    const body = await req.json();

    const existingMessage = await prisma.directMessage.findUnique({
      where: { id: messageId },
    });

    if (!existingMessage) {
      return NextResponse.json({ success: false, error: 'Message not found' }, { status: 404 });
    }

    // Recipient ownership verification: Only recipient student or linked parent can update read/archived status
    if (authUser.role === 'STUDENT') {
      const student = await prisma.student.findFirst({
        where: { OR: [{ userId: authUser.id }, { id: authUser.id }], deletedAt: null },
      });
      if (!student || student.id !== existingMessage.recipientStudentId) {
        return NextResponse.json({ success: false, error: 'Access Denied: You cannot modify messages intended for other recipients.' }, { status: 403 });
      }
    } else if (authUser.role === 'PARENT') {
      const parent = await prisma.parent.findFirst({
        where: { OR: [{ userId: authUser.id }, { id: authUser.id }], deletedAt: null },
        include: { wards: { select: { id: true } } },
      });
      const wardIds = parent?.wards.map((w) => w.id) || [];
      if (!wardIds.includes(existingMessage.recipientStudentId)) {
        return NextResponse.json({ success: false, error: 'Access Denied: You cannot modify messages intended for other children.' }, { status: 403 });
      }
    }

    const updateData: any = {};
    if (body.isRead !== undefined) updateData.isRead = Boolean(body.isRead);
    if (body.isArchived !== undefined) updateData.isArchived = Boolean(body.isArchived);

    const updated = await prisma.directMessage.update({
      where: { id: messageId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('[PATCH_MESSAGE_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const messageId = params.id;
    const existingMessage = await prisma.directMessage.findUnique({
      where: { id: messageId },
    });

    if (!existingMessage) {
      return NextResponse.json({ success: false, error: 'Message not found' }, { status: 404 });
    }

    // Only sender, SUPER_ADMIN, or ADMIN can delete
    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN' && existingMessage.senderId !== authUser.id) {
      return NextResponse.json({ success: false, error: 'Access Denied: You cannot delete messages sent by other users.' }, { status: 403 });
    }

    await prisma.directMessage.delete({
      where: { id: messageId },
    });

    return NextResponse.json({ success: true, message: 'Message deleted successfully.' });
  } catch (error: any) {
    console.error('[DELETE_MESSAGE_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
