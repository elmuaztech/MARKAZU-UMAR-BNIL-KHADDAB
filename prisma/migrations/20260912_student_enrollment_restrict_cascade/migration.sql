-- AlterTable: Change onDelete from CASCADE to RESTRICT for session and schoolClass in student_enrollments
-- Prevents accidental deletion of historical student enrollment records when an academic session or class is deleted

-- DropForeignKey
ALTER TABLE "student_enrollments" DROP CONSTRAINT IF EXISTS "student_enrollments_classId_fkey";

-- DropForeignKey
ALTER TABLE "student_enrollments" DROP CONSTRAINT IF EXISTS "student_enrollments_sessionId_fkey";

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "school_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "school_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
