import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/settings or GET /api/settings?key=admission_status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (key) {
      const setting = await prisma.systemSetting.findUnique({
        where: { key },
      });
      return NextResponse.json({
        success: true,
        key,
        value: setting ? setting.value : null,
      });
    }

    const allSettings = await prisma.systemSetting.findMany();
    const settingsMap: Record<string, string> = {};
    allSettings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({
      success: true,
      settings: settingsMap,
    });
  } catch (error: any) {
    console.error('[GET_SETTINGS_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST /api/settings (Admin only for updating system settings)
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin privileges required.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Both key and value are required.' },
        { status: 400 }
      );
    }

    const stringVal = typeof value === 'string' ? value : JSON.stringify(value);

    const saved = await prisma.systemSetting.upsert({
      where: { key },
      update: { value: stringVal },
      create: { key, value: stringVal },
    });

    return NextResponse.json({
      success: true,
      message: `Setting "${key}" updated successfully.`,
      setting: saved,
    });
  } catch (error: any) {
    console.error('[POST_SETTINGS_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save setting' },
      { status: 500 }
    );
  }
}
