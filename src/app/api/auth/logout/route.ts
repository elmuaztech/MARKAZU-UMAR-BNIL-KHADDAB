import { NextRequest, NextResponse } from 'next/server';
import { revokeSession } from '../../../../lib/security';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.cookies.get('mssms_session_id')?.value;
    if (sessionId) {
      revokeSession(sessionId);
    }

    const response = NextResponse.json({ message: 'Session logged out successfully' });
    response.cookies.delete('mssms_session_id');

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to terminate session' }, { status: 400 });
  }
}
