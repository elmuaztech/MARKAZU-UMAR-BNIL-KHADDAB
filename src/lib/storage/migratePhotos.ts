import fs from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';
import {
  isStorageConfigured,
  uploadToStorage,
  storageObjectExists,
  getStudentPhotoKey,
} from '@/lib/storage';

export interface MigrationResult {
  success: boolean;
  totalFound: number;
  migratedCount: number;
  skippedCount: number;
  failedCount: number;
  details: Array<{
    studentId: string;
    localPath?: string;
    storageKey?: string;
    status: 'MIGRATED' | 'SKIPPED_EXISTS' | 'FAILED' | 'LOCAL_FILE_MISSING';
    error?: string;
  }>;
}

/**
 * Safe, idempotent migration utility from local VPS storage (public/uploads/students) to Cloudflare R2.
 * Does NOT delete local files automatically.
 */
export async function migrateLocalPhotosToR2(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    totalFound: 0,
    migratedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    details: [],
  };

  if (!isStorageConfigured()) {
    return {
      ...result,
      success: false,
      details: [
        {
          studentId: 'ALL',
          status: 'FAILED',
          error: 'Cloudflare R2 is not configured in environment variables.',
        },
      ],
    };
  }

  try {
    // 1. Find all students in PostgreSQL database
    const students = await prisma.student.findMany({
      where: { deletedAt: null },
      include: { user: true },
    });

    const localDir = path.join(process.cwd(), 'public', 'uploads', 'students');
    const hasLocalDir = fs.existsSync(localDir);
    const localFiles = hasLocalDir ? fs.readdirSync(localDir) : [];

    for (const student of students) {
      const studentId = student.id;
      const targetKey = getStudentPhotoKey(studentId);
      const currentAvatar = student.user?.avatar || '';

      // Check if student has a local file on disk or referenced in DB
      let localFilePath: string | null = null;

      if (currentAvatar.startsWith('/uploads/students/')) {
        const potentialPath = path.join(process.cwd(), 'public', currentAvatar);
        if (fs.existsSync(potentialPath)) {
          localFilePath = potentialPath;
        }
      }

      if (!localFilePath && hasLocalDir) {
        const safeId = studentId.replace(/[^a-zA-Z0-9_-]/g, '_');
        const matched = localFiles.find((f) => f.startsWith(`stu_${safeId}_`) || f.includes(safeId));
        if (matched) {
          localFilePath = path.join(localDir, matched);
        }
      }

      if (!localFilePath) {
        continue;
      }

      result.totalFound++;

      // Check if already in R2
      const alreadyInR2 = await storageObjectExists(targetKey);
      if (alreadyInR2) {
        result.skippedCount++;
        result.details.push({
          studentId,
          localPath: localFilePath,
          storageKey: targetKey,
          status: 'SKIPPED_EXISTS',
        });

        // Ensure DB points to secure API URL
        const secureUrl = `/api/students/photo?studentId=${encodeURIComponent(studentId)}`;
        if (student.userId && currentAvatar !== secureUrl) {
          await prisma.user.update({
            where: { id: student.userId },
            data: { avatar: secureUrl },
          });
        }
        continue;
      }

      // Read local file & upload to R2
      try {
        const fileBuffer = fs.readFileSync(localFilePath);
        await uploadToStorage({
          key: targetKey,
          buffer: fileBuffer,
          contentType: 'image/webp',
          metadata: {
            studentId,
            migratedFromLocal: 'true',
            migratedAt: new Date().toISOString(),
          },
        });

        // Update database record to point to authenticated photo endpoint
        const secureUrl = `/api/students/photo?studentId=${encodeURIComponent(studentId)}`;
        if (student.userId) {
          await prisma.user.update({
            where: { id: student.userId },
            data: { avatar: secureUrl },
          });
        }

        result.migratedCount++;
        result.details.push({
          studentId,
          localPath: localFilePath,
          storageKey: targetKey,
          status: 'MIGRATED',
        });
      } catch (err: any) {
        result.failedCount++;
        result.details.push({
          studentId,
          localPath: localFilePath,
          storageKey: targetKey,
          status: 'FAILED',
          error: err.message || 'Failed to upload to R2',
        });
      }
    }

    result.success = result.failedCount === 0;
    return result;
  } catch (error: any) {
    return {
      ...result,
      success: false,
      details: [
        {
          studentId: 'DATABASE_QUERY',
          status: 'FAILED',
          error: error.message || 'Database query error during migration',
        },
      ],
    };
  }
}
