import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import {
  MOCK_USERS as mockUsersRaw,
  MOCK_TEACHERS as mockTeachersRaw,
  MOCK_STUDENTS as mockStudentsRaw,
  MOCK_PARENTS as mockParentsRaw,
  MOCK_PROGRAMMES as mockProgrammesRaw,
  MOCK_CLASSES as mockClassesRaw,
  MOCK_SUBJECTS as mockSubjectsRaw,
  MOCK_TEACHER_ASSIGNMENTS as mockTeacherAssignmentsRaw
} from '../src/lib/mockData';

const MOCK_USERS = mockUsersRaw as any[];
const MOCK_TEACHERS = mockTeachersRaw as any[];
const MOCK_STUDENTS = mockStudentsRaw as any[];
const MOCK_PARENTS = mockParentsRaw as any[];
const MOCK_PROGRAMMES = mockProgrammesRaw as any[];
const MOCK_CLASSES = mockClassesRaw as any[];
const MOCK_SUBJECTS = mockSubjectsRaw as any[];
const MOCK_TEACHER_ASSIGNMENTS = mockTeacherAssignmentsRaw as any[];

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // 1. Clear existing database in correct order
  console.log('Clearing existing records...');
  await prisma.teacherAssignmentSubject.deleteMany();
  await prisma.teacherAssignment.deleteMany();
  await prisma.tahfizRecord.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.gradeRecord.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.student.deleteMany();
  await prisma.schoolClass.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.programme.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.user.deleteMany();

  // 2. Load users from mssms_database.json if it exists, otherwise fall back to MOCK_USERS
  let seedUsers = MOCK_USERS;
  const dbFile = path.join(process.cwd(), 'data', 'mssms_database.json');
  if (fs.existsSync(dbFile)) {
    try {
      console.log('Loading users from local JSON database file...');
      const content = fs.readFileSync(dbFile, 'utf8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.users)) {
        // Map fields to match User
        seedUsers = parsed.users.map((u: any) => ({
          id: u.id,
          username: u.username || u.id,
          name: u.name,
          email: u.email,
          passwordHash: u.password || u.passwordHash,
          role: u.role,
          phone: u.phone || null,
          avatar: u.avatar || null,
          assignedProgrammeId: u.assignedProgrammeId || null,
          assignedProgrammeName: u.assignedProgrammeName || null,
          status: u.status || 'ACTIVE',
          isFirstLogin: u.isFirstLogin ?? true,
          mustChangePassword: u.mustChangePassword ?? false,
        }));
        console.log(`Successfully parsed ${seedUsers.length} users from JSON database.`);
      }
    } catch (e) {
      console.warn('Failed to parse local JSON database file, falling back to mock users:', e);
    }
  }

  // 3. Seed Users
  console.log('Seeding Users...');
  for (const u of seedUsers) {
    // Map User roles to upper-case enum value in Prisma
    let roleEnum: any = u.role;
    if (roleEnum === 'admin') roleEnum = 'ADMIN';
    else if (roleEnum === 'superadmin') roleEnum = 'SUPER_ADMIN';

    await prisma.user.create({
      data: {
        id: u.id,
        username: u.username || null,
        name: u.name,
        email: u.email.toLowerCase().trim(),
        password: u.passwordHash || u.password || '',
        role: roleEnum,
        phone: u.phone || null,
        avatar: u.avatar || null,
        assignedProgrammeId: u.assignedProgrammeId || null,
        assignedProgrammeName: u.assignedProgrammeName || null,
        status: u.status || 'ACTIVE',
        isFirstLogin: u.isFirstLogin ?? true,
        mustChangePassword: u.mustChangePassword ?? false,
      },
    });
  }

  // 4. Seed Programmes
  console.log('Seeding Programmes...');
  for (const p of MOCK_PROGRAMMES) {
    await prisma.programme.create({
      data: {
        id: p.id,
        code: p.programme_code || p.code,
        nameEnglish: p.programme_name_english || p.nameEnglish || p.programme_name,
        nameArabic: p.programme_name_arabic || p.nameArabic || null,
        description: p.description || null,
        hasSubcategories: p.hasSubcategories ?? false,
        subcategories: p.subcategories ? JSON.stringify(p.subcategories) : null,
        status: p.status && p.status.toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
      },
    });
  }

  // 5. Seed Teachers
  console.log('Seeding Teachers...');
  for (const t of MOCK_TEACHERS) {
    // Check if the user exists to satisfy foreign key constraints
    const userExists = await prisma.user.findUnique({ where: { id: t.id } });
    await prisma.teacher.create({
      data: {
        id: t.id,
        userId: userExists ? t.id : null,
        staffNo: t.staffNo,
        fullName: t.fullName || t.full_name_english,
        email: t.email.toLowerCase().trim(),
        phone: t.phone,
        qualification: t.qualification || '',
        specialization: t.specialization || '',
        status: t.status && t.status.toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'ON_LEAVE',
        dateJoined: t.dateJoined ? new Date(t.dateJoined) : new Date(),
      },
    });
  }

  // 6. Seed Parents
  console.log('Seeding Parents...');
  for (const p of MOCK_PARENTS) {
    const userExists = await prisma.user.findUnique({ where: { id: p.id } });
    await prisma.parent.create({
      data: {
        id: p.id,
        userId: userExists ? p.id : null,
        fullName: p.fullName,
        email: p.email.toLowerCase().trim(),
        phone: p.phone,
        occupation: p.occupation || '',
        address: p.address || '',
      },
    });
  }

  // 7. Seed School Classes
  console.log('Seeding Classes...');
  for (const c of MOCK_CLASSES) {
    // Verify teacher and programme exist
    const teacherExists = c.classTeacherId ? await prisma.teacher.findUnique({ where: { id: c.classTeacherId } }) : null;
    const programmeExists = c.programmeId ? await prisma.programme.findUnique({ where: { id: c.programmeId } }) : null;

    await prisma.schoolClass.create({
      data: {
        id: c.id,
        name: c.class_name_english || c.name,
        category: c.category as any, // TAHFIZ, ISLAMIYYA_PRIMARY, etc.
        section: c.section,
        subcategory: c.subcategory || null,
        capacity: c.capacity || 30,
        programmeId: programmeExists ? c.programmeId : null,
        classTeacherId: teacherExists ? c.classTeacherId : null,
      },
    });
  }

  // 8. Seed Students
  console.log('Seeding Students...');
  for (const s of MOCK_STUDENTS) {
    const userExists = await prisma.user.findUnique({ where: { id: s.id } });
    const classExists = await prisma.schoolClass.findUnique({ where: { id: s.classId } });
    const parentExists = await prisma.parent.findUnique({ where: { id: s.guardianId } });

    if (classExists && parentExists) {
      await prisma.student.create({
        data: {
          id: s.id,
          userId: userExists ? s.id : null,
          admissionNo: s.admissionNo,
          fullName: s.fullName,
          gender: s.gender as any,
          dob: new Date(s.dob),
          dateEnrolled: s.dateEnrolled ? new Date(s.dateEnrolled) : new Date(),
          programmeId: s.programmeId || null,
          classId: s.classId,
          guardianId: s.guardianId,
          status: s.status as any,
          currentJuz: s.hifzProgress?.currentJuz ?? 1,
          juzCompleted: s.hifzProgress?.juzCompleted ?? 0,
          currentSurah: s.hifzProgress?.currentSurah ?? 'Surah Al-Fatihah',
          currentAyah: s.hifzProgress?.currentAyah ?? 1,
          completedSurahsCount: s.hifzProgress?.completedSurahsCount ?? 0,
          tajweedRating: s.hifzProgress?.tajweedRating ?? 5,
          sabkiRating: s.hifzProgress?.sabkiRating ?? 5,
          manzilRating: s.hifzProgress?.manzilRating ?? 5,
          akhlaqRating: s.akhlaqRating as any || 'EXCELLENT',
        },
      });
    }
  }

  // 9. Seed Subjects
  console.log('Seeding Subjects...');
  for (const s of MOCK_SUBJECTS) {
    const programmeExists = s.programmeId ? await prisma.programme.findUnique({ where: { id: s.programmeId } }) : null;
    const classExists = s.classId ? await prisma.schoolClass.findUnique({ where: { id: s.classId } }) : null;

    const existingSubject = await prisma.subject.findFirst({
      where: { classId: s.classId || null, code: s.code },
    });

    if (!existingSubject) {
      await prisma.subject.create({
        data: {
          id: s.id,
          name: s.name,
          arabicName: s.arabicName || null,
          code: s.code,
          category: s.category as any, // TAHFIZ, ISLAMIC, GENERAL
          description: s.description || null,
          programmeId: programmeExists ? s.programmeId : null,
          classId: classExists ? s.classId : null,
          status: s.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
          displayOrder: s.displayOrder || 1,
        },
      });
    }
  }

  // 10. Seed Teacher Assignments & Subjects
  console.log('Seeding Teacher Assignments...');
  for (const ta of MOCK_TEACHER_ASSIGNMENTS) {
    const teacherExists = await prisma.teacher.findUnique({ where: { id: ta.teacherId } });
    const programmeExists = await prisma.programme.findUnique({ where: { id: ta.programmeId } });
    const classExists = await prisma.schoolClass.findUnique({ where: { id: ta.classId } });

    if (teacherExists && programmeExists && classExists) {
      const dbAssignment = await prisma.teacherAssignment.create({
        data: {
          id: ta.id,
          teacherId: ta.teacherId,
          programmeId: ta.programmeId,
          classId: ta.classId,
        },
      });

      for (const subId of ta.subjectIds) {
        const subjectExists = await prisma.subject.findUnique({ where: { id: subId } });
        if (subjectExists) {
          await prisma.teacherAssignmentSubject.create({
            data: {
              teacherAssignmentId: dbAssignment.id,
              subjectId: subId,
            },
          });
        }
      }
    }
  }

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
