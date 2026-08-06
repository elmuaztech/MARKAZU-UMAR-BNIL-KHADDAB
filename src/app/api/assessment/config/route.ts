import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_ASSESSMENT_CONFIG } from '@/lib/mockData';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 200,
    message: 'Assessment configuration retrieved successfully',
    data: DEFAULT_ASSESSMENT_CONFIG,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return NextResponse.json({
      status: 200,
      message: 'Assessment configuration updated successfully',
      data: {
        ...DEFAULT_ASSESSMENT_CONFIG,
        ...body,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json({ status: 500, message: 'Internal server error updating assessment config' }, { status: 500 });
  }
}
