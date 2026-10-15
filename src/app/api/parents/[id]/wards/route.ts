import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Helper to ensure a dedicated System Unassigned Guardian record exists in PostgreSQL
 * to maintain strict foreign-key integrity without altering schema constraints.
 */
async function getOrCreateUnassignedGuardian(): Promise<string> {
  let placeholder = await prisma.parent.findFirst({
    where: { email: 'unassigned.guardian@markazuumar.internal' },
  });

  if (!placeholder) {
    placeholder = await prisma.parent.create({
      data: {
        fullName: 'Unassigned / Pending Guardian',
        email: 'unassigned.guardian@markazuumar.internal',
        phone: '00000000000',
        occupation: 'Administration Pending',
        address: 'School Administration Office',
      },
    });
  }

  return placeholder.id;
}

/**
 * GET /api/parents/[id]/wards
 * Returns currently linked children and all active students available for linking.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const { id: parentId } = params;

    const parent = await prisma.parent.findFirst({
      where: {
        OR: [{ id: parentId }, { userId: parentId }],
        deletedAt: null,
      },
      include: {
        wards: {
          where: { deletedAt: null },
          include: {
            schoolClass: { select: { id: true, name: true, section: true } },
          },
          orderBy: { fullName: 'asc' },
        },
      },
    });

    if (!parent) {
      return NextResponse.json({ error: 'Parent record not found.' }, { status: 404 });
    }

    // Get active students not linked to this parent (available to link)
    const availableStudents = await prisma.student.findMany({
      where: {
        deletedAt: null,
        NOT: {
          OR: [{ guardianId: parent.id }, ...(parent.userId ? [{ guardianId: parent.userId }] : [])],
        },
      },
      select: {
        id: true,
        fullName: true,
        admissionNo: true,
        gender: true,
        dob: true,
        schoolClass: { select: { id: true, name: true } },
        parent: { select: { id: true, fullName: true, phone: true } },
      },
      orderBy: { fullName: 'asc' },
      take: 100, // Limit initial query for speed; client can search
    });

    return NextResponse.json({
      success: true,
      parent: {
        id: parent.id,
        fullName: parent.fullName,
        email: parent.email,
        phone: parent.phone,
      },
      linkedWards: parent.wards,
      availableStudents,
    });
  } catch (error: any) {
    console.error('[PARENT_WARDS_GET_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch linked wards.' }, { status: 500 });
  }
}

/**
 * POST /api/parents/[id]/wards
 * Links an existing student to an existing parent.
 * Body: { studentId: string }
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN']);
    if (!authCheck.authorized || !authUser) {
      return NextResponse.json({ error: authCheck.reason || 'Unauthorized.' }, { status: authCheck.status || 401 });
    }

    const { id: parentId } = params;
    const body = await req.json().catch(() => ({}));
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required to establish parent-child relationship.' }, { status: 400 });
    }

    const parent = await prisma.parent.findFirst({
      where: {
        OR: [{ id: parentId }, { userId: parentId }],
        deletedAt: null,
      },
    });

    if (!parent) {
      return NextResponse.json({ error: 'Parent record not found.' }, { status: 404 });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { schoolClass: true },
    });

    if (!student || student.deletedAt) {
      return NextResponse.json({ error: 'Student record not found.' }, { status: 404 });
    }

    // Check if already linked (prevent duplicate relationships)
    if (student.guardianId === parent.id || (parent.userId && student.guardianId === parent.userId)) {
      return NextResponse.json({ error: 'This child is already linked to this parent.' }, { status: 400 });
    }

    // Atomically link student to parent
    const updatedStudent = await prisma.student.update({
      where: { id: student.id },
      data: {
        guardianId: parent.id,
      },
      include: {
        schoolClass: { select: { id: true, name: true, section: true } },
      },
    });

    // Record Audit Log in PostgreSQL if table exists or system logger
    try {
      await prisma.auditLog.create({
        data: {
          action: 'PARENT_CHILD_LINKED',
          targetRecord: `Student/${student.id}`,
          performedBy: authUser.name || authUser.email,
          userRole: authUser.role,
          details: `Linked student ${student.fullName} (${student.admissionNo}) to parent ${parent.fullName} (${parent.email})`,
          ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1',
          status: 'SUCCESS',
        },
      });
    } catch (auditErr) {
      console.warn('[AUDIT_LOG_WARNING]:', auditErr);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully linked ${student.fullName} to ${parent.fullName}.`,
      student: updatedStudent,
      parent: {
        id: parent.id,
        fullName: parent.fullName,
      },
    });
  } catch (error: any) {
    console.error('[PARENT_WARDS_POST_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to link child to parent.' }, { status: 500 });
  }
}

/**
 * DELETE /api/parents/[id]/wards
 * Unlinks a student from a parent without deleting either account or student records.
 * Query or body: { studentId: string }
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN']);
    if (!authCheck.authorized || !authUser) {
      return NextResponse.json({ error: authCheck.reason || 'Unauthorized.' }, { status: authCheck.status || 401 });
    }

    const { id: parentId } = params;
    const { searchParams } = new URL(req.url);
    const queryStudentId = searchParams.get('studentId');
    const body = await req.json().catch(() => ({}));
    const studentId = queryStudentId || body.studentId;

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required to unlink child.' }, { status: 400 });
    }

    const parent = await prisma.parent.findFirst({
      where: {
        OR: [{ id: parentId }, { userId: parentId }],
        deletedAt: null,
      },
    });

    if (!parent) {
      return NextResponse.json({ error: 'Parent record not found.' }, { status: 404 });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student || student.deletedAt) {
      return NextResponse.json({ error: 'Student record not found.' }, { status: 404 });
    }

    // Verify relationship exists
    const isCurrentlyLinked = student.guardianId === parent.id || (parent.userId && student.guardianId === parent.userId);
    if (!isCurrentlyLinked) {
      return NextResponse.json({ error: 'This child is not currently linked to this parent.' }, { status: 400 });
    }

    // Unlink child by reassigning to system unassigned guardian (preserves student account, grades, attendance)
    const unassignedGuardianId = await getOrCreateUnassignedGuardian();
    const unlinkedStudent = await prisma.student.update({
      where: { id: student.id },
      data: {
        guardianId: unassignedGuardianId,
      },
    });

    // Record Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          action: 'PARENT_CHILD_UNLINKED',
          targetRecord: `Student/${student.id}`,
          performedBy: authUser.name || authUser.email,
          userRole: authUser.role,
          details: `Unlinked student ${student.fullName} (${student.admissionNo}) from parent ${parent.fullName}`,
          ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1',
          status: 'SUCCESS',
        },
      });
    } catch (auditErr) {
      console.warn('[AUDIT_LOG_WARNING]:', auditErr);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully unlinked ${student.fullName} from ${parent.fullName}. The student record remains active and can be re-linked at any time.`,
      studentId: unlinkedStudent.id,
    });
  } catch (error: any) {
    console.error('[PARENT_WARDS_DELETE_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to unlink child.' }, { status: 500 });
  }
}
