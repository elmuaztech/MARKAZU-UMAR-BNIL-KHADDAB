import { NextRequest, NextResponse } from 'next/server';
import { MOCK_GRADES } from '../../../lib/mockData';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return NextResponse.json({
    grades: MOCK_GRADES,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return NextResponse.json(
      {
        message: 'Grade recorded successfully',
        gradeRecord: { id: `grd-${Date.now()}`, ...body },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
