import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';
import {
  isStorageConfigured,
  uploadToStorage,
  getStorageObject,
  getSignedDownloadUrl,
  deleteFromStorage,
  getStudentPhotoKey,
  storageObjectExists,
} from '@/lib/storage';

export const dynamic = 'force-dynamic';

/**
 * Check if the authenticated user has permission to access or manage a specific student's photo.
 */
async function verifyStudentPhotoAccess(
  authUser: any,
  studentId: string,
  mode: 'READ' | 'WRITE'
): Promise<{ authorized: boolean; reason?: string; status?: number; student?: any }> {
  if (!authUser) {
    return { authorized: false, reason: 'Please sign in to access student photos.', status: 401 };
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      schoolClass: true,
      parent: true,
      user: true,
    },
  });

  if (!student) {
    return { authorized: false, reason: 'Student record not found.', status: 404 };
  }

  const role = authUser.role;

  // SUPER_ADMIN and ADMIN have full access
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
    return { authorized: true, student };
  }

  // HEADMASTER access check (scoped to assigned programme)
  if (role === 'HEADMASTER') {
    if (
      student.schoolClass?.programmeId &&
      authUser.assignedProgrammeId &&
      student.schoolClass.programmeId !== authUser.assignedProgrammeId
    ) {
      return {
        authorized: false,
        reason: 'You do not have permission to view or manage students outside your assigned section.',
        status: 403,
      };
    }
    return { authorized: true, student };
  }

  // TEACHER access check (scoped to assigned classes)
  if (role === 'TEACHER') {
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

    if (!teacherClassIds.includes(student.classId)) {
      return {
        authorized: false,
        reason: 'You do not have permission to view or manage students outside your assigned classes.',
        status: 403,
      };
    }
    return { authorized: true, student };
  }

  // READ-ONLY access for Parents & Students
  if (mode === 'READ') {
    if (role === 'PARENT') {
      const isParentOfStudent =
        student.guardianId === authUser.id ||
        (student.parent &&
          (student.parent.userId === authUser.id ||
            student.parent.email.toLowerCase() === authUser.email.toLowerCase() ||
            (student.parent.phone && authUser.phone && student.parent.phone === authUser.phone)));

      if (!isParentOfStudent) {
        return {
          authorized: false,
          reason: 'You do not have permission to view this photo.',
          status: 403,
        };
      }
      return { authorized: true, student };
    }

    if (role === 'STUDENT') {
      const isOwnProfile =
        student.userId === authUser.id ||
        (authUser.username && student.admissionNo.toLowerCase() === authUser.username.toLowerCase()) ||
        (student.user && student.user.email.toLowerCase() === authUser.email.toLowerCase());

      if (!isOwnProfile) {
        return {
          authorized: false,
          reason: 'You do not have permission to view this photo.',
          status: 403,
        };
      }
      return { authorized: true, student };
    }
  }

  return {
    authorized: false,
    reason: 'You do not have permission to perform this action.',
    status: 403,
  };
}

/**
 * GET: Securely retrieve and stream a student's private photo from Cloudflare R2
 * Includes strict RBAC & IDOR protection.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId') || searchParams.get('id');

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required.' }, { status: 400 });
    }

    const authUser = await getAuthenticatedUser(req);
    const access = await verifyStudentPhotoAccess(authUser, studentId, 'READ');

    if (!access.authorized) {
      return NextResponse.json({ error: access.reason }, { status: access.status || 403 });
    }

    const storageKey = getStudentPhotoKey(studentId);

    // Check Cloudflare R2 Storage
    if (isStorageConfigured()) {
      try {
        const file = await getStorageObject(storageKey);
        if (file) {
          const bodyBytes = new Uint8Array(file.buffer);
          return new NextResponse(bodyBytes, {
            status: 200,
            headers: {
              'Content-Type': file.contentType || 'image/webp',
              'Content-Length': file.contentLength.toString(),
              'Cache-Control': 'private, max-age=3600, stale-while-revalidate=86400',
            },
          });
        }
      } catch (r2Err) {
        console.warn('[R2_PHOTO_FETCH_WARN]', r2Err);
      }
    }

    // Fallback: Check local filesystem (legacy support during migration)
    const localFallbackPath = path.join(process.cwd(), 'public', 'uploads', 'students');
    if (fs.existsSync(localFallbackPath)) {
      const safeId = studentId.replace(/[^a-zA-Z0-9_-]/g, '_');
      const files = fs.readdirSync(localFallbackPath);
      const matched = files.find((f) => f.startsWith(`stu_${safeId}_`) || f.includes(safeId));

      if (matched) {
        const filePath = path.join(localFallbackPath, matched);
        const buffer = fs.readFileSync(filePath);
        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            'Content-Type': 'image/webp',
            'Content-Length': buffer.length.toString(),
            'Cache-Control': 'private, max-age=3600',
          },
        });
      }
    }

    return NextResponse.json({ error: 'Student photo not found.' }, { status: 404 });
  } catch (error: any) {
    console.error('[STUDENT_PHOTO_GET_ERROR]', error);
    return NextResponse.json({ error: 'Photo could not be retrieved. Please try again.' }, { status: 500 });
  }
}

/**
 * POST: Upload & compress a student passport photo directly into Cloudflare R2
 */
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
      return NextResponse.json({ error: 'Student ID and image data are required.' }, { status: 400 });
    }

    const access = await verifyStudentPhotoAccess(authUser, studentId, 'WRITE');
    if (!access.authorized) {
      return NextResponse.json({ error: access.reason }, { status: access.status || 403 });
    }

    // Size limit verification: 5MB maximum
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

    if (buffer.length > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Maximum upload size is 5MB. The selected image exceeds this limit.' },
        { status: 400 }
      );
    }

    const storageKey = getStudentPhotoKey(studentId);
    let storageSaved = false;
    const isProduction = process.env.NODE_ENV === 'production';

    // 1. Production: Cloudflare R2 is MANDATORY. No silent fallback to local VPS storage.
    if (isProduction) {
      if (!isStorageConfigured()) {
        console.error(
          '[R2_CONFIG_ERROR] Required Cloudflare R2 environment variables (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT/R2_ACCOUNT_ID) are missing or incomplete in production.'
        );
        return NextResponse.json(
          { error: 'Cloud storage service is not configured. Please contact the system administrator.' },
          { status: 500 }
        );
      }

      try {
        await uploadToStorage({
          key: storageKey,
          buffer,
          contentType: 'image/webp',
          metadata: {
            studentId,
            uploadedBy: authUser?.id || 'unknown',
            uploadedAt: new Date().toISOString(),
          },
        });
        storageSaved = true;
      } catch (err) {
        console.error(
          '[R2_STORAGE_UPLOAD_ERROR] Failed uploading photo to Cloudflare R2 in production:',
          err instanceof Error ? err.message : err
        );
        return NextResponse.json(
          { error: 'Failed to upload photo to cloud storage. Please try again or contact the administrator.' },
          { status: 502 }
        );
      }
    } else {
      // 2. Non-production / Development environment
      if (isStorageConfigured()) {
        try {
          await uploadToStorage({
            key: storageKey,
            buffer,
            contentType: 'image/webp',
            metadata: {
              studentId,
              uploadedBy: authUser?.id || 'unknown',
              uploadedAt: new Date().toISOString(),
            },
          });
          storageSaved = true;
        } catch (devErr) {
          console.warn('[DEV_R2_STORAGE_WARN] R2 upload failed in development, falling back to local:', devErr);
        }
      }

      // Development-only local filesystem fallback
      if (!storageSaved) {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'students');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const safeStudentId = studentId.replace(/[^a-zA-Z0-9_-]/g, '_');
        const fileName = `stu_${safeStudentId}_${Date.now()}.webp`;
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, buffer);
      }
    }

    // Standard secure authenticated photo endpoint URL
    const avatarUrl = `/api/students/photo?studentId=${encodeURIComponent(studentId)}&v=${Date.now()}`;

    // Update Student record & linked User record in database
    const student = access.student;
    if (student && student.userId) {
      await prisma.user
        .update({
          where: { id: student.userId },
          data: { avatar: avatarUrl },
        })
        .catch((err) => console.warn('[UPDATE_STUDENT_USER_AVATAR_WARN]', err));
    }

    return NextResponse.json({
      success: true,
      avatarUrl,
      storageKey,
      message: 'Photo uploaded successfully.',
      sizeBytes: buffer.length,
      sizeKb: (buffer.length / 1024).toFixed(1),
    });
  } catch (error: any) {
    console.error('[STUDENT_PHOTO_UPLOAD_ERROR]', error);
    return NextResponse.json({ error: 'Photo could not be uploaded. Please try again.' }, { status: 500 });
  }
}

/**
 * DELETE: Remove a student photo from Cloudflare R2 and database
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId') || searchParams.get('id');

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required.' }, { status: 400 });
    }

    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const access = await verifyStudentPhotoAccess(authUser, studentId, 'WRITE');
    if (!access.authorized) {
      return NextResponse.json({ error: access.reason }, { status: access.status || 403 });
    }

    const storageKey = getStudentPhotoKey(studentId);

    // Delete from R2
    if (isStorageConfigured()) {
      await deleteFromStorage(storageKey).catch((e) => console.warn('[R2_DELETE_WARN]', e));
    }

    // Delete local file if exists
    const localFallbackPath = path.join(process.cwd(), 'public', 'uploads', 'students');
    if (fs.existsSync(localFallbackPath)) {
      const safeId = studentId.replace(/[^a-zA-Z0-9_-]/g, '_');
      const files = fs.readdirSync(localFallbackPath);
      files.forEach((f) => {
        if (f.startsWith(`stu_${safeId}_`) || f.includes(safeId)) {
          try {
            fs.unlinkSync(path.join(localFallbackPath, f));
          } catch {}
        }
      });
    }

    // Clear avatar in User record
    const student = access.student;
    if (student && student.userId) {
      await prisma.user
        .update({
          where: { id: student.userId },
          data: { avatar: null },
        })
        .catch((err) => console.warn('[UPDATE_STUDENT_USER_AVATAR_WARN]', err));
    }

    return NextResponse.json({
      success: true,
      message: 'Photo removed successfully.',
    });
  } catch (error: any) {
    console.error('[STUDENT_PHOTO_DELETE_ERROR]', error);
    return NextResponse.json({ error: 'Photo could not be deleted. Please try again.' }, { status: 500 });
  }
}
