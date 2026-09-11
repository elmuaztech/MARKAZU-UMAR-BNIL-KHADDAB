import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const body = await req.json();
    const { studentId, imageBase64 } = body;

    if (!studentId || !imageBase64) {
      return NextResponse.json({ error: 'studentId and imageBase64 are required.' }, { status: 400 });
    }

    // Role-based scoping check
    if (authUser?.role === 'HEADMASTER') {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { schoolClass: true },
      });
      if (student && student.schoolClass.programmeId && authUser.assignedProgrammeId && student.schoolClass.programmeId !== authUser.assignedProgrammeId) {
        return NextResponse.json(
          { error: 'Access Forbidden (HTTP 403): Headmaster can only update photos for students in their assigned programme.' },
          { status: 403 }
        );
      }
    }

    if (authUser?.role === 'TEACHER') {
      const teacher = await prisma.teacher.findFirst({
        where: {
          OR: [
            { userId: authUser.id },
            { email: { equals: authUser.email, mode: 'insensitive' } },
            ...(authUser.username ? [{ staffNo: authUser.username }] : []),
          ],
          deletedAt: null,
        },
        include: {
          teacherAssignments: true,
          classesManaged: true,
        },
      });

      const teacherClassIds: string[] = [];
      if (teacher) {
        teacher.teacherAssignments.forEach((ta) => teacherClassIds.push(ta.classId));
        teacher.classesManaged.forEach((cm) => teacherClassIds.push(cm.id));
      }

      const student = await prisma.student.findUnique({
        where: { id: studentId },
      });

      if (!student || !teacherClassIds.includes(student.classId)) {
        return NextResponse.json(
          { error: 'Access Forbidden (HTTP 403): Teachers can only update photos for students in their assigned classes.' },
          { status: 403 }
        );
      }
    }

    // Check size limit: 5MB maximum hardcoded
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

    if (buffer.length > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Maximum upload size is 5MB. The selected image exceeds this limit.' },
        { status: 400 }
      );
    }

    // Ensure upload directory exists: public/uploads/students
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'students');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate safe unique filename
    const safeStudentId = studentId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `stu_${safeStudentId}_${Date.now()}.webp`;
    const filePath = path.join(uploadDir, fileName);

    // Save WebP file to disk
    fs.writeFileSync(filePath, buffer);

    const avatarUrl = `/uploads/students/${fileName}`;

    // Update Student record and linked User record in database
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (student) {
      if (student.userId) {
        await prisma.user.update({
          where: { id: student.userId },
          data: { avatar: avatarUrl },
        }).catch((err) => console.warn('[UPDATE_STUDENT_USER_AVATAR_WARN]', err));
      }
    }

    return NextResponse.json({
      success: true,
      avatarUrl,
      message: 'Student photo successfully compressed and saved.',
      sizeBytes: buffer.length,
      sizeKb: (buffer.length / 1024).toFixed(1),
    });
  } catch (error: any) {
    console.error('[STUDENT_PHOTO_UPLOAD_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to upload and save student photo.' }, { status: 500 });
  }
}
