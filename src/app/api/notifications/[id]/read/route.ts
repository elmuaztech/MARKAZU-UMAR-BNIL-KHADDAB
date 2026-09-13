import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const notificationId = params.id;

    const notif = await prisma.inAppNotification.findUnique({
      where: { id: notificationId },
    });

    if (!notif) {
      return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 });
    }

    // Ownership check: Caller must own the notification
    if (notif.userId !== authUser.id) {
      return NextResponse.json({ success: false, error: 'Access Denied: You cannot modify another user\'s notification.' }, { status: 403 });
    }

    const updated = await prisma.inAppNotification.update({
      where: { id: notificationId },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('[MARK_NOTIFICATION_READ_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
