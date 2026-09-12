import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/results/approve
 * Requires authentication: SUPER_ADMIN or ADMIN only.
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ status: authCheck.status, message: authCheck.reason }, { status: authCheck.status });
    }

    const body = await req.json();
    const { submissionId, action, adminComments } = body;

    if (!submissionId || !action || !['APPROVE', 'REJECT', 'RETURN'].includes(action)) {
      return NextResponse.json(
        { status: 400, message: 'Invalid payload: submissionId and valid action (APPROVE, REJECT, RETURN) are required.' },
        { status: 400 }
      );
    }

    const newStatus = action === 'APPROVE' ? 'APPROVED' : action === 'REJECT' ? 'REJECTED' : 'RETURNED';

    // Update ResultApprovalSubmission if it exists
    const existingSubmission = await prisma.resultApprovalSubmission.findUnique({
      where: { id: submissionId },
    });

    if (existingSubmission) {
      await prisma.resultApprovalSubmission.update({
        where: { id: submissionId },
        data: {
          status: newStatus,
          adminComments: adminComments || null,
          reviewedAt: new Date(),
          reviewedBy: authUser?.name || 'Administrator',
        },
      });
    }

    // Update corresponding GradeRecords
    await prisma.gradeRecord.updateMany({
      where: { submissionId },
      data: {
        status: newStatus,
        rejectionReason: action !== 'APPROVE' ? adminComments : null,
        approvedAt: action === 'APPROVE' ? new Date() : null,
        approvedBy: action === 'APPROVE' ? (authUser?.name || 'Administrator') : null,
      },
    });

    return NextResponse.json({
      status: 200,
      message: `Result submission batch ${submissionId} successfully processed: ${action}`,
      data: {
        submissionId,
        status: newStatus,
        adminComments,
        reviewedBy: authUser?.name || 'Administrator',
        reviewedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[APPROVE_RESULTS_ERROR]', error);
    return NextResponse.json(
      { status: 500, message: error.message || 'Internal server error processing result batch approval' },
      { status: 500 }
    );
  }
}
