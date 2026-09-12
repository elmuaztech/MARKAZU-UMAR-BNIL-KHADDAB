-- Safe Non-Destructive Migration: Teacher Permissions + Academic Sessions + Student Enrollments
-- Generated: 2026-09-11
-- Client: Markazu Umar School Management System

-- 1. Add canMarkAttendance and sessionId to teacher_assignments
ALTER TABLE "teacher_assignments" ADD COLUMN IF NOT EXISTS "canMarkAttendance" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "teacher_assignments" ADD COLUMN IF NOT EXISTS "sessionId" TEXT;
CREATE INDEX IF NOT EXISTS "teacher_assignments_teacherId_sessionId_idx" ON "teacher_assignments"("teacherId", "sessionId");
CREATE INDEX IF NOT EXISTS "teacher_assignments_classId_sessionId_idx" ON "teacher_assignments"("classId", "sessionId");

-- 2. Create student_enrollments table for historical student progression
CREATE TABLE IF NOT EXISTS "student_enrollments" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "programmeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_enrollments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "student_enrollments_studentId_sessionId_key" ON "student_enrollments"("studentId", "sessionId");
CREATE INDEX IF NOT EXISTS "student_enrollments_sessionId_classId_idx" ON "student_enrollments"("sessionId", "classId");

-- 3. Add sessionId to attendance_records
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "sessionId" TEXT;
CREATE INDEX IF NOT EXISTS "attendance_records_sessionId_classId_date_idx" ON "attendance_records"("sessionId", "classId", "date");

-- 4. Add sessionId to grade_records
ALTER TABLE "grade_records" ADD COLUMN IF NOT EXISTS "sessionId" TEXT;
CREATE INDEX IF NOT EXISTS "grade_records_sessionId_classId_subjectId_idx" ON "grade_records"("sessionId", "classId", "subjectId");

-- 5. Safely add foreign keys
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teacher_assignments_sessionId_fkey') THEN
        ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "school_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_enrollments_studentId_fkey') THEN
        ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_enrollments_sessionId_fkey') THEN
        ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "school_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_enrollments_classId_fkey') THEN
        ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "school_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_enrollments_programmeId_fkey') THEN
        ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "programmes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_records_sessionId_fkey') THEN
        ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "school_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'grade_records_sessionId_fkey') THEN
        ALTER TABLE "grade_records" ADD CONSTRAINT "grade_records_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "school_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- 6. Non-destructive backfill for existing records into current active session
DO $$
DECLARE
    active_session_id TEXT;
BEGIN
    SELECT id INTO active_session_id FROM "school_sessions" WHERE "isCurrent" = true LIMIT 1;
    
    IF active_session_id IS NOT NULL THEN
        -- Safely backfill student enrollments for existing active students
        INSERT INTO "student_enrollments" ("id", "studentId", "sessionId", "classId", "programmeId", "createdAt")
        SELECT 
            gen_random_uuid()::text,
            s.id,
            active_session_id,
            s."classId",
            s."programmeId",
            NOW()
        FROM "students" s
        WHERE s."deletedAt" IS NULL
        ON CONFLICT ("studentId", "sessionId") DO NOTHING;

        -- Associate unassigned existing teacher assignments to the active session
        UPDATE "teacher_assignments"
        SET "sessionId" = active_session_id
        WHERE "sessionId" IS NULL;

        -- Associate unassigned existing attendance records to the active session
        UPDATE "attendance_records"
        SET "sessionId" = active_session_id
        WHERE "sessionId" IS NULL;

        -- Associate unassigned existing grade records to the active session
        UPDATE "grade_records"
        SET "sessionId" = active_session_id
        WHERE "sessionId" IS NULL;
    END IF;
END $$;
