import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'admission_status' },
    });
    const status = setting?.value === 'OPEN' ? 'OPEN' : 'CLOSED';
    return NextResponse.json({ success: true, admissionStatus: status });
  } catch (error: any) {
    console.error('[GET_ADMISSION_STATUS_ERROR]', error);
    return NextResponse.json({ success: false, admissionStatus: 'CLOSED' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin privileges required to change admission status.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const newStatus = body.status === 'OPEN' ? 'OPEN' : 'CLOSED';

    await prisma.systemSetting.upsert({
      where: { key: 'admission_status' },
      update: { value: newStatus },
      create: { key: 'admission_status', value: newStatus },
    });

    return NextResponse.json({
      success: true,
      admissionStatus: newStatus,
      message: `Admission status permanently updated to ${newStatus}.`,
    });
  } catch (error: any) {
    console.error('[POST_ADMISSION_STATUS_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update admission status' },
      { status: 500 }
    );
  }
}
