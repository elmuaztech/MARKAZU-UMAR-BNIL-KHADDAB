import { NextRequest, NextResponse } from 'next/server';
import { MOCK_ANNOUNCEMENTS } from '../../../lib/mockData';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return NextResponse.json({
    announcements: MOCK_ANNOUNCEMENTS,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return NextResponse.json(
      {
        message: 'Announcement published successfully',
        announcement: { id: `ann-${Date.now()}`, ...body },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
