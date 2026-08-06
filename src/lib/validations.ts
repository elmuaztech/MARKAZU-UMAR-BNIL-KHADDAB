import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const studentSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  admissionNo: z.string().min(4, 'Admission number is required'),
  gender: z.enum(['MALE', 'FEMALE']),
  classId: z.string().min(1, 'Please select a class'),
  guardianName: z.string().min(3, 'Guardian name is required'),
  guardianPhone: z.string().min(10, 'Valid phone number is required'),
  initialJuz: z.number().min(1).max(30),
});

export const tahfizLogSchema = z.object({
  studentId: z.string().min(1, 'Please select a student'),
  hifzSurah: z.string().min(1, 'Surah name is required'),
  hifzFromAyah: z.number().min(1),
  hifzToAyah: z.number().min(1),
  sabkiSurah: z.string().min(1),
  sabkiRating: z.number().min(1).max(5),
  manzilJuz: z.number().min(1).max(30),
  manzilRating: z.number().min(1).max(5),
  teacherNotes: z.string().min(3),
});

export const gradeSchema = z.object({
  studentId: z.string().min(1),
  subjectId: z.string().min(1),
  ca1Score: z.number().min(0).max(20),
  ca2Score: z.number().min(0).max(20),
  examScore: z.number().min(0).max(60),
  remarks: z.string().min(2),
});

export const announcementSchema = z.object({
  title: z.string().min(4, 'Title must be at least 4 characters'),
  content: z.string().min(10, 'Message content must be at least 10 characters'),
  category: z.enum(['ACADEMIC', 'TAHFIZ', 'GENERAL', 'URGENT']),
  targetRole: z.enum(['ALL', 'TEACHERS', 'PARENTS', 'STUDENTS']),
});
