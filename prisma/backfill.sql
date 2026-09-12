-- Safe Non-Destructive Backfill for Existing Active Records into Current Academic Session
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
