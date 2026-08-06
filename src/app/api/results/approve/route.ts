import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { submissionId, action, adminComments, reviewedBy } = body;

    if (!submissionId || !action || !['APPROVE', 'REJECT', 'RETURN'].includes(action)) {
      return NextResponse.json(
        { status: 400, message: 'Invalid payload: submissionId and valid action (APPROVE, REJECT, RETURN) are required.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: 200,
      message: `Result submission batch ${submissionId} successfully processed: ${action}`,
      data: {
        submissionId,
        status: action === 'APPROVE' ? 'APPROVED' : action === 'REJECT' ? 'REJECTED' : 'RETURNED',
        adminComments,
        reviewedBy: reviewedBy || 'Administrator',
        reviewedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json({ status: 500, message: 'Internal server error processing result batch approval' }, { status: 500 });
  }
}
