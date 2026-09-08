import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: 'Access Forbidden (HTTP 403): Only Super Administrator can permanently delete user accounts.' },
        { status: 403 }
      );
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    // 1. Locate User in PostgreSQL
    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: {
        student: true,
        teacher: true,
        parent: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: `User with ID "${id}" was not found in the database.` }, { status: 404 });
    }

    // Protect Super Admin accounts from accidental self-deletion
    if (targetUser.role === 'SUPER_ADMIN') {
      const superAdminCount = await prisma.user.count({ where: { role: 'SUPER_ADMIN', deletedAt: null } });
      if (superAdminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the sole Super Administrator account on the system.' },
          { status: 400 }
        );
      }
    }

    // 2. Pre-deletion dependency tree resolution
    await prisma.$transaction(async (tx) => {
      // A. Unlink Audit Logs to preserve history without FK constraint violation
      await tx.auditLog.updateMany({
        where: { userId: id },
        data: { userId: null },
      });

      // B. Handle Teacher Dependencies
      if (targetUser.role === 'TEACHER' || targetUser.teacher) {
        const teacherId = targetUser.teacher?.id || id;
        
        // Detach class teacher assignments
        await tx.schoolClass.updateMany({
          where: { classTeacherId: teacherId },
          data: { classTeacherId: null },
        });

        // Delete teacher subjects assignments
        await tx.teacherAssignment.deleteMany({
          where: { teacherId: teacherId },
        });

        // Delete teacher profile record if exists
        await tx.teacher.deleteMany({
          where: { OR: [{ id: teacherId }, { userId: id }] },
        });
      }

      // C. Handle Parent Dependencies
      if (targetUser.role === 'PARENT' || targetUser.parent) {
        const parentId = targetUser.parent?.id || id;
        
        // Check linked student wards
        const linkedWards = await tx.student.findMany({
          where: { guardianId: parentId, deletedAt: null },
          select: { id: true, fullName: true },
        });

        if (linkedWards.length > 0) {
          const wardNames = linkedWards.map((w) => w.fullName).join(', ');
          throw new Error(
            `Cannot delete parent account while linked active student wards (${wardNames}) exist. Reassign guardian first.`
          );
        }

        // Delete parent profile record
        await tx.parent.deleteMany({
          where: { OR: [{ id: parentId }, { userId: id }] },
        });
      }

      // D. Handle Student Dependencies
      if (targetUser.role === 'STUDENT' || targetUser.student) {
        const studentId = targetUser.student?.id || id;

        await tx.attendanceRecord.deleteMany({ where: { studentId } });
        await tx.tahfizRecord.deleteMany({ where: { studentId } });
        await tx.gradeRecord.deleteMany({ where: { studentId } });

        await tx.student.deleteMany({
          where: { OR: [{ id: studentId }, { userId: id }] },
        });
      }

      // E. Delete authentication sessions & tokens (Cascade handles passwordHistory & tokens via schema)
      await tx.userSession.deleteMany({ where: { userId: id } });
      await tx.passwordHistory.deleteMany({ where: { userId: id } });
      await tx.passwordResetToken.deleteMany({ where: { userId: id } });

      // F. Finally delete User record
      await tx.user.delete({
        where: { id },
      });
    });

    // 3. Record permanent deletion event in AuditLog
    try {
      await prisma.auditLog.create({
        data: {
          action: 'USER_PERMANENTLY_DELETED',
          performedBy: authUser?.name || 'Super Administrator',
          userRole: authUser?.role || 'SUPER_ADMIN',
          userId: authUser?.id || null,
          details: `Super Admin permanently deleted user "${targetUser.name}" (${targetUser.email || targetUser.role}) ID: ${id}`,
          ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1',
          status: 'WARNING',
        },
      });
    } catch (e) {
      console.warn('[AUDIT_LOG_WARN] Failed to write permanent delete audit log:', e);
    }

    return NextResponse.json({
      message: `User account "${targetUser.name}" (${targetUser.email}) and all dependent records were permanently deleted.`,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
    });
  } catch (error: any) {
    console.error('[PERMANENT_DELETE_USER_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to permanently delete user' }, { status: 400 });
  }
}
