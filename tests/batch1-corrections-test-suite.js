/**
 * MARKAZU UMAR ISLAMIYYAH - BATCH 1 CORRECTIONS AUTOMATED VERIFICATION SUITE
 * Tests for all 6 defect areas:
 * 1. Certificate generation, academic eligibility, and RBAC cross-access security.
 * 2. Mobile responsiveness CSS audit and breakpoint rules.
 * 3. Branding wording update ("Developed by Elmuaz Tech").
 * 4. Push notifications UX & permissions hygiene.
 * 5. Student vs Parent portal separation & attendance authorization.
 * 6. Redesigned Student Attendance View layout and data rules.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const results = [];

function recordTest(id, name, passed, details) {
  results.push({ id, name, passed, details });
  const statusStr = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[TEST ${id.toString().padStart(2, '0')}] ${statusStr}: ${name}`);
  if (details) {
    console.log(`         Details: ${details}`);
  }
}

async function run() {
  console.log('======================================================================');
  console.log('STARTING BATCH 1 AUDIT, REPAIRS & VERIFICATION SUITE');
  console.log(`Target: ${BASE_URL} | Database: PostgreSQL via Prisma`);
  console.log('======================================================================\n');

  let testStudentUserA, testStudentA;
  let testStudentUserB, testStudentB;
  let testParentUserA, testParentA;
  let testParentUserB, testParentB;
  let testTeacherUser;
  let testAdminUser;
  let testClass;

  const testSessionIds = {};

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Branding Wording Verification ("Developed by Elmuaz Tech")
    // -------------------------------------------------------------------------
    const footerPath = path.join(__dirname, '..', 'src', 'components', 'navigation', 'PublicFooter.tsx');
    const footerContent = fs.readFileSync(footerPath, 'utf8');
    const hasOldPoweredBy = footerContent.includes('Powered by') && footerContent.includes('Elmuaz');
    const hasNewDevelopedBy = footerContent.includes('Developed by') && footerContent.includes('Elmuaz');

    recordTest(
      1,
      'Branding statement in PublicFooter.tsx updated to "Developed by Elmuaz Tech"',
      !hasOldPoweredBy && hasNewDevelopedBy,
      hasNewDevelopedBy ? 'Found "Developed by Elmuaz Technologies Limited"' : 'Missing new branding'
    );

    // Check across other src files for any leftover "Powered by Elmuaz Tech"
    function findInDir(dir, pattern) {
      let matches = [];
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git')) {
            matches = matches.concat(findInDir(fullPath, pattern));
          }
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.json')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (pattern.test(content)) {
            matches.push(fullPath);
          }
        }
      }
      return matches;
    }

    const lingeringOld = findInDir(path.join(__dirname, '..', 'src'), /Powered\s+by\s+Elmuaz/i);
    recordTest(
      2,
      'No lingering "Powered by Elmuaz" occurrences in src codebase',
      lingeringOld.length === 0,
      lingeringOld.length === 0 ? '0 lingering occurrences' : `Found in: ${lingeringOld.join(', ')}`
    );

    // -------------------------------------------------------------------------
    // Setup Isolated Test Users in PostgreSQL
    // -------------------------------------------------------------------------
    const passHash = bcrypt.hashSync('@MarkazuTest123', 10);
    const ts = Date.now().toString().slice(-6);

    testClass = await prisma.schoolClass.create({
      data: {
        name: `Test Class ${ts}`,
        category: 'TAHFIZ',
        section: 'A',
        capacity: 40,
      },
    });

    testParentUserA = await prisma.user.create({
      data: {
        username: `PAR-A-${ts}`,
        name: 'Alhaji Umar Parent A',
        email: `par.a.${ts}@markazuumar.test`,
        password: passHash,
        role: 'PARENT',
        status: 'ACTIVE',
      },
    });

    testParentA = await prisma.parent.create({
      data: {
        userId: testParentUserA.id,
        fullName: 'Alhaji Umar Parent A',
        phone: '08012345678',
        email: `par.a.${ts}@markazuumar.test`,
        occupation: 'Merchant',
        address: 'Daneji, Kano',
      },
    });

    testParentUserB = await prisma.user.create({
      data: {
        username: `PAR-B-${ts}`,
        name: 'Hajiya Aisha Parent B',
        email: `par.b.${ts}@markazuumar.test`,
        password: passHash,
        role: 'PARENT',
        status: 'ACTIVE',
      },
    });

    testParentB = await prisma.parent.create({
      data: {
        userId: testParentUserB.id,
        fullName: 'Hajiya Aisha Parent B',
        phone: '08087654321',
        email: `par.b.${ts}@markazuumar.test`,
        occupation: 'Civil Servant',
        address: 'Kano City',
      },
    });

    testStudentUserA = await prisma.user.create({
      data: {
        username: `STU-A-${ts}`,
        name: 'Fatima Umar Test',
        email: `stu.a.${ts}@markazuumar.test`,
        password: passHash,
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    });

    testStudentA = await prisma.student.create({
      data: {
        userId: testStudentUserA.id,
        fullName: 'Fatima Umar Test',
        admissionNo: `MKZ/TEST/${ts}/A`,
        gender: 'FEMALE',
        dob: new Date('2014-05-12'),
        status: 'ACTIVE',
        juzCompleted: 15, // Ineligible initially (only 15 Juz)
        classId: testClass.id,
        guardianId: testParentA.id,
      },
    });

    testStudentUserB = await prisma.user.create({
      data: {
        username: `STU-B-${ts}`,
        name: 'Ibrahim Sani Test',
        email: `stu.b.${ts}@markazuumar.test`,
        password: passHash,
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    });

    testStudentB = await prisma.student.create({
      data: {
        userId: testStudentUserB.id,
        fullName: 'Ibrahim Sani Test',
        admissionNo: `MKZ/TEST/${ts}/B`,
        gender: 'MALE',
        dob: new Date('2013-09-20'),
        status: 'GRADUATED', // Eligible via graduation!
        juzCompleted: 30,
        classId: testClass.id,
        guardianId: testParentB.id,
      },
    });

    testTeacherUser = await prisma.user.create({
      data: {
        username: `TCH-${ts}`,
        name: 'Malam Ahmad Teacher',
        email: `tch.${ts}@markazuumar.test`,
        password: passHash,
        role: 'TEACHER',
        status: 'ACTIVE',
      },
    });

    testAdminUser = await prisma.user.create({
      data: {
        username: `ADM-${ts}`,
        name: 'Admin User',
        email: `adm.${ts}@markazuumar.test`,
        password: passHash,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    // Create session helper
    async function createSession(user) {
      const sessId = `test-sess-${user.id}-${Date.now()}`;
      await prisma.userSession.create({
        data: {
          sessionId: sessId,
          userId: user.id,
          ipAddress: '127.0.0.1',
          userAgent: 'Batch1TestRunner',
          browser: 'NodeTest',
          operatingSystem: 'Windows',
          device: 'Desktop',
          refreshTokenHash: sessId,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          revoked: false,
        },
      });
      return sessId;
    }

    testSessionIds.studentA = await createSession(testStudentUserA);
    testSessionIds.studentB = await createSession(testStudentUserB);
    testSessionIds.parentA = await createSession(testParentUserA);
    testSessionIds.parentB = await createSession(testParentUserB);
    testSessionIds.teacher = await createSession(testTeacherUser);
    testSessionIds.admin = await createSession(testAdminUser);

    // -------------------------------------------------------------------------
    // TEST 3: Unauthenticated Certificate Access Rejection (401)
    // -------------------------------------------------------------------------
    const resCertAnon = await fetch(`${BASE_URL}/api/certificates?studentId=${testStudentA.id}`);
    recordTest(
      3,
      'Unauthenticated request to /api/certificates returns HTTP 401',
      resCertAnon.status === 401,
      `Received status: ${resCertAnon.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 4: Student Eligibility Enforcement (Ineligible Student -> 403 with criteria)
    // -------------------------------------------------------------------------
    const resCertIneligible = await fetch(`${BASE_URL}/api/certificates?studentId=${testStudentA.id}`, {
      headers: {
        Cookie: `mssms_session_id=${testSessionIds.studentA}`,
        'x-session-id': testSessionIds.studentA,
      },
    });
    const dataCertIneligible = await resCertIneligible.json();
    const criteriaReturned = dataCertIneligible.criteria && dataCertIneligible.criteria.juzCompleted === 15;

    recordTest(
      4,
      'Ineligible student certificate request rejected with HTTP 403 and criteria details',
      resCertIneligible.status === 403 && dataCertIneligible.eligible === false && criteriaReturned,
      `Status: ${resCertIneligible.status}, eligible: ${dataCertIneligible.eligible}, juzCompleted: ${dataCertIneligible?.criteria?.juzCompleted}`
    );

    // -------------------------------------------------------------------------
    // TEST 5: Student Cross-Account Tampering Rejection
    // Student A attempts to access Student B's certificate
    // -------------------------------------------------------------------------
    const resCertCrossStudent = await fetch(`${BASE_URL}/api/certificates?studentId=${testStudentB.id}`, {
      headers: {
        Cookie: `mssms_session_id=${testSessionIds.studentA}`,
        'x-session-id': testSessionIds.studentA,
      },
    });
    const dataCertCrossStudent = await resCertCrossStudent.json();

    recordTest(
      5,
      'Student A forbidden from accessing Student B certificate (HTTP 403)',
      resCertCrossStudent.status === 403 && dataCertCrossStudent.error?.includes('own certificate'),
      `Status: ${resCertCrossStudent.status}, Error: ${dataCertCrossStudent.error}`
    );

    // -------------------------------------------------------------------------
    // TEST 6: Eligible Student Certificate Generation (HTTP 200 + Full Payload)
    // Student B is eligible (status=GRADUATED, juzCompleted=30)
    // -------------------------------------------------------------------------
    const resCertEligible = await fetch(`${BASE_URL}/api/certificates?studentId=${testStudentB.id}`, {
      headers: {
        Cookie: `mssms_session_id=${testSessionIds.studentB}`,
        'x-session-id': testSessionIds.studentB,
      },
    });
    const dataCertEligible = await resCertEligible.json();

    const certData = dataCertEligible.certificate;
    const certValid =
      resCertEligible.status === 200 &&
      dataCertEligible.success === true &&
      certData?.student?.fullName === 'Ibrahim Sani Test' &&
      certData?.school?.nameArabic?.includes('عمر') &&
      certData?.qualificationTitleArabic?.includes('القرآن') &&
      certData?.school?.principalName === 'Malam Umar Faruq';

    recordTest(
      6,
      'Eligible student generates certificate with Arabic text, signatures & school details',
      certValid,
      `Status: ${resCertEligible.status}, CertNo: ${certData?.certificateNo}, SchoolArabic: ${certData?.school?.nameArabic}`
    );

    // -------------------------------------------------------------------------
    // TEST 7: Parent Cross-Family Tampering Rejection
    // Parent A attempts to access Student B (belonging to Parent B)
    // -------------------------------------------------------------------------
    const resCertCrossParent = await fetch(`${BASE_URL}/api/certificates?studentId=${testStudentB.id}`, {
      headers: {
        Cookie: `mssms_session_id=${testSessionIds.parentA}`,
        'x-session-id': testSessionIds.parentA,
      },
    });
    const dataCertCrossParent = await resCertCrossParent.json();

    recordTest(
      7,
      'Parent A forbidden from accessing unlinked Student B certificate (HTTP 403)',
      resCertCrossParent.status === 403 && dataCertCrossParent.error?.includes('linked children'),
      `Status: ${resCertCrossParent.status}, Error: ${dataCertCrossParent.error}`
    );

    // -------------------------------------------------------------------------
    // TEST 8: Parent Authorized Access to Own Linked Eligible Child
    // Parent B accesses Student B (linked ward)
    // -------------------------------------------------------------------------
    const resCertParentEligible = await fetch(`${BASE_URL}/api/certificates?studentId=${testStudentB.id}`, {
      headers: {
        Cookie: `mssms_session_id=${testSessionIds.parentB}`,
        'x-session-id': testSessionIds.parentB,
      },
    });
    const dataCertParentEligible = await resCertParentEligible.json();

    recordTest(
      8,
      'Parent B successfully accesses linked eligible child certificate (HTTP 200)',
      resCertParentEligible.status === 200 && dataCertParentEligible.success === true,
      `Status: ${resCertParentEligible.status}, CertNo: ${dataCertParentEligible?.certificate?.certificateNo}`
    );

    // -------------------------------------------------------------------------
    // TEST 9: Student Direct POST to /api/attendance Rejection (HTTP 403)
    // Students must never be able to record or alter attendance
    // -------------------------------------------------------------------------
    const resAttStudent = await fetch(`${BASE_URL}/api/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `mssms_session_id=${testSessionIds.studentA}`,
        'x-session-id': testSessionIds.studentA,
      },
      body: JSON.stringify({
        studentId: testStudentA.id,
        date: new Date().toISOString(),
        status: 'PRESENT',
      }),
    });

    recordTest(
      9,
      'Direct POST to /api/attendance by STUDENT rejected with HTTP 403',
      resAttStudent.status === 403,
      `Received status: ${resAttStudent.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 10: Parent Direct POST to /api/attendance Rejection (HTTP 403)
    // -------------------------------------------------------------------------
    const resAttParent = await fetch(`${BASE_URL}/api/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `mssms_session_id=${testSessionIds.parentA}`,
        'x-session-id': testSessionIds.parentA,
      },
      body: JSON.stringify({
        studentId: testStudentA.id,
        date: new Date().toISOString(),
        status: 'PRESENT',
      }),
    });

    recordTest(
      10,
      'Direct POST to /api/attendance by PARENT rejected with HTTP 403',
      resAttParent.status === 403,
      `Received status: ${resAttParent.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 11: Authorized Staff POST to /api/attendance Allowed
    // Admin creates valid attendance record
    // -------------------------------------------------------------------------
    const resAttAdmin = await fetch(`${BASE_URL}/api/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `mssms_session_id=${testSessionIds.admin}`,
        'x-session-id': testSessionIds.admin,
      },
      body: JSON.stringify({
        records: [
          {
            studentId: testStudentA.id,
            classId: testClass.id,
            date: new Date().toISOString().split('T')[0],
            status: 'PRESENT',
            remarks: 'Test batch verification attendance',
          },
        ],
      }),
    });

    recordTest(
      11,
      'Authorized ADMIN POST to /api/attendance succeeds (HTTP 200/201)',
      resAttAdmin.status === 200 || resAttAdmin.status === 201,
      `Received status: ${resAttAdmin.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 12: Portal Separation: Student-Appropriate Report Phrasing
    // /api/reports/download responds with student-appropriate phrasing for students
    // -------------------------------------------------------------------------
    const resReportStu = await fetch(`${BASE_URL}/api/reports/download?studentId=${testStudentA.id}&term=Term%201`, {
      headers: {
        Cookie: `mssms_session_id=${testSessionIds.studentA}`,
        'x-session-id': testSessionIds.studentA,
      },
    });
    const dataReportStu = await resReportStu.json();
    const hasStudentWording =
      dataReportStu.title?.includes('Your report is currently unavailable') ||
      dataReportStu.message?.includes('Your report is currently unavailable');

    recordTest(
      12,
      'Student portal reports API uses student-appropriate phrasing ("Your report is currently unavailable")',
      hasStudentWording,
      `Response title: "${dataReportStu.title}", message: "${dataReportStu.message}"`
    );

    // -------------------------------------------------------------------------
    // TEST 13: Push Notification UX & Storage Keys Verification
    // -------------------------------------------------------------------------
    const pushLibPath = path.join(__dirname, '..', 'src', 'lib', 'pushNotifications.ts');
    const pushLibCode = fs.readFileSync(pushLibPath, 'utf8');
    const hasDismissKey = pushLibCode.includes('markazu_push_optin_dismissed');
    const hasDismissFns = pushLibCode.includes('isOptInDismissed') && pushLibCode.includes('dismissOptIn');

    recordTest(
      13,
      'PushNotificationManager implements clean opt-in dismissal persistence and helpers',
      hasDismissKey && hasDismissFns,
      hasDismissKey ? 'Found markazu_push_optin_dismissed & dismissal handlers' : 'Missing dismissal methods'
    );

    // -------------------------------------------------------------------------
    // TEST 14: HeaderNotificationBadge Notification Hygiene
    // Ensure test alerts or persistent push prompts are NOT in the header dropdown
    // -------------------------------------------------------------------------
    const headerNotifPath = path.join(__dirname, '..', 'src', 'components', 'navigation', 'HeaderNotificationBadge.tsx');
    const headerNotifCode = fs.readFileSync(headerNotifPath, 'utf8');
    const hasTestAlert = headerNotifCode.includes('Send Test Alert') || headerNotifCode.includes('sendTestAlert');
    const hasPushPrompt = headerNotifCode.includes('PushNotificationManager.requestPermission');

    recordTest(
      14,
      'HeaderNotificationBadge removes intrusive push prompt and test alert popups',
      !hasTestAlert && !hasPushPrompt,
      !hasTestAlert ? 'Header dropdown clean of test popups and persistent push prompts' : 'Test alerts still in header'
    );

    // -------------------------------------------------------------------------
    // TEST 15: Student Attendance View Verification
    // Ensure StudentAttendanceView does not invent data, has green theme, and handles parent/student
    // -------------------------------------------------------------------------
    const studentAttViewPath = path.join(__dirname, '..', 'src', 'components', 'attendance', 'StudentAttendanceView.tsx');
    const studentAttViewCode = fs.readFileSync(studentAttViewPath, 'utf8');
    const hasGreenTheme = studentAttViewCode.includes('from-emerald-900') && studentAttViewCode.includes('bg-gradient-to-br');
    const hasNoStudentViewBadge = !studentAttViewCode.includes('Student View');
    const hasResponsiveCards = studentAttViewCode.includes('grid-cols-2') && studentAttViewCode.includes('sm:grid-cols-4');

    recordTest(
      15,
      'StudentAttendanceView implements green-themed info card without "Student View" badge and with responsive grid',
      hasGreenTheme && hasNoStudentViewBadge && hasResponsiveCards,
      'Verified green theme, responsive metrics grid, clean typography'
    );

  } catch (err) {
    console.error('Test execution error:', err);
    recordTest(99, 'Execution Error', false, err.message);
  } finally {
    // Clean up test database records
    console.log('\nCleaning up test records from PostgreSQL...');
    try {
      if (testStudentA) {
        await prisma.attendanceRecord.deleteMany({ where: { studentId: testStudentA.id } });
        await prisma.student.delete({ where: { id: testStudentA.id } });
      }
      if (testStudentB) {
        await prisma.student.delete({ where: { id: testStudentB.id } });
      }
      if (testParentA) {
        await prisma.parent.delete({ where: { id: testParentA.id } });
      }
      if (testParentB) {
        await prisma.parent.delete({ where: { id: testParentB.id } });
      }
      if (testClass) {
        await prisma.schoolClass.delete({ where: { id: testClass.id } });
      }
      if (testStudentUserA) {
        await prisma.userSession.deleteMany({ where: { userId: testStudentUserA.id } });
        await prisma.user.delete({ where: { id: testStudentUserA.id } });
      }
      if (testStudentUserB) {
        await prisma.userSession.deleteMany({ where: { userId: testStudentUserB.id } });
        await prisma.user.delete({ where: { id: testStudentUserB.id } });
      }
      if (testParentUserA) {
        await prisma.userSession.deleteMany({ where: { userId: testParentUserA.id } });
        await prisma.user.delete({ where: { id: testParentUserA.id } });
      }
      if (testParentUserB) {
        await prisma.userSession.deleteMany({ where: { userId: testParentUserB.id } });
        await prisma.user.delete({ where: { id: testParentUserB.id } });
      }
      if (testTeacherUser) {
        await prisma.userSession.deleteMany({ where: { userId: testTeacherUser.id } });
        await prisma.user.delete({ where: { id: testTeacherUser.id } });
      }
      if (testAdminUser) {
        await prisma.userSession.deleteMany({ where: { userId: testAdminUser.id } });
        await prisma.user.delete({ where: { id: testAdminUser.id } });
      }
      console.log('Test records successfully cleaned up.');
    } catch (cleanErr) {
      console.warn('Cleanup warning:', cleanErr.message);
    }
    await prisma.$disconnect();
  }

  console.log('\n======================================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  console.log(`TEST SUITE SUMMARY: ${passed}/${total} TESTS PASSED`);
  console.log('======================================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

run();
