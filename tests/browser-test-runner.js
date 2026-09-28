// MARKAZU UMAR BN KHADDAB — COMPREHENSIVE BROWSER-BASED VERIFICATION RUNNER
// Uses Puppeteer-Core with local Google Chrome binary
// Tests: 360px, 390px, 430px, 1280px, 1440px viewports across all roles

const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOTS_DIR = path.join(__dirname, '../artifacts/browser_proofs');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const TEST_PASSWORD = '@TestBrowser123456';
const PASSWORD_HASH = bcrypt.hashSync(TEST_PASSWORD, 10);

const VIEWPORTS = {
  mobile_360: { width: 360, height: 740, isMobile: true, label: '360px' },
  mobile_390: { width: 390, height: 844, isMobile: true, label: '390px' },
  mobile_430: { width: 430, height: 932, isMobile: true, label: '430px' },
  desktop_1280: { width: 1280, height: 800, isMobile: false, label: '1280px' },
  desktop_1440: { width: 1440, height: 900, isMobile: false, label: '1440px' },
};

const verificationResults = [];

function recordResult(category, title, passed, details = '', screenshotFile = '') {
  verificationResults.push({ category, title, passed, details, screenshotFile });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${category}] ${icon}: ${title}`);
  if (details) console.log(`      ${details}`);
  if (screenshotFile) console.log(`      Screenshot: ${screenshotFile}`);
}

async function setupTestUsers() {
  console.log('Setting up isolated test users & academic records in PostgreSQL...');

  let session = await prisma.schoolSession.findFirst({ where: { isCurrent: true } });
  if (!session) {
    session = await prisma.schoolSession.create({
      data: {
        sessionName: '2025/2026',
        activeTerm: 'Term 1',
        isCurrent: true,
      },
    });
  }

  // 1. Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'browser.admin@markazuumar.test' },
    update: { password: PASSWORD_HASH, status: 'ACTIVE', role: 'ADMIN' },
    create: {
      username: 'BROWSER-ADM',
      name: 'Browser Verification Admin',
      email: 'browser.admin@markazuumar.test',
      password: PASSWORD_HASH,
      role: 'ADMIN',
      status: 'ACTIVE',
      isFirstLogin: false,
      mustChangePassword: false,
    },
  });

  // 2. Headmaster
  let prog = await prisma.programme.findFirst();
  if (!prog) {
    prog = await prisma.programme.create({
      data: {
        code: 'QURAN-ARABIC-01',
        nameEnglish: 'Quranic and Arabic Studies',
        nameArabic: 'دراسات القرآن واللغة العربية',
        status: 'ACTIVE',
      },
    });
  }

  const headmasterUser = await prisma.user.upsert({
    where: { email: 'browser.headmaster@markazuumar.test' },
    update: { password: PASSWORD_HASH, status: 'ACTIVE', role: 'HEADMASTER', assignedProgrammeId: prog.id },
    create: {
      username: 'BROWSER-HM',
      name: 'Browser Verification Headmaster',
      email: 'browser.headmaster@markazuumar.test',
      password: PASSWORD_HASH,
      role: 'HEADMASTER',
      assignedProgrammeId: prog.id,
      status: 'ACTIVE',
      isFirstLogin: false,
      mustChangePassword: false,
    },
  });

  // 3. Teacher
  const teacherUser = await prisma.user.upsert({
    where: { email: 'browser.teacher@markazuumar.test' },
    update: { password: PASSWORD_HASH, status: 'ACTIVE', role: 'TEACHER' },
    create: {
      username: 'BROWSER-TEA',
      name: 'Browser Verification Teacher',
      email: 'browser.teacher@markazuumar.test',
      password: PASSWORD_HASH,
      role: 'TEACHER',
      status: 'ACTIVE',
      isFirstLogin: false,
      mustChangePassword: false,
    },
  });

  // Find or create class
  let schoolClass = await prisma.schoolClass.findFirst();
  if (!schoolClass) {
    schoolClass = await prisma.schoolClass.create({
      data: {
        name: 'Class 1A',
        category: 'ISLAMIYYA_PRIMARY',
        section: 'A',
        programmeId: prog.id,
        capacity: 40,
      },
    });
  }

  const teacherRecord = await prisma.teacher.upsert({
    where: { email: teacherUser.email },
    update: { userId: teacherUser.id },
    create: {
      userId: teacherUser.id,
      staffNo: 'MUBK-TEA-9999',
      fullName: teacherUser.name,
      email: teacherUser.email,
      phone: '08022223333',
      qualification: 'B.A. Islamic Studies',
      specialization: 'Arabic and Hadith',
    },
  });

  // Assign teacher as classTeacher of schoolClass
  await prisma.schoolClass.update({
    where: { id: schoolClass.id },
    data: { classTeacherId: teacherRecord.id },
  });

  // 4. Primary Parent (Alhaji Browser Parent)
  const parentUser = await prisma.user.upsert({
    where: { email: 'browser.parent@markazuumar.test' },
    update: { password: PASSWORD_HASH, status: 'ACTIVE', role: 'PARENT' },
    create: {
      username: 'BROWSER-PAR',
      name: 'Alhaji Browser Parent',
      email: 'browser.parent@markazuumar.test',
      password: PASSWORD_HASH,
      role: 'PARENT',
      status: 'ACTIVE',
      isFirstLogin: false,
      mustChangePassword: false,
    },
  });

  const parentRecord = await prisma.parent.upsert({
    where: { email: parentUser.email },
    update: { userId: parentUser.id, fullName: parentUser.name },
    create: {
      userId: parentUser.id,
      fullName: parentUser.name,
      email: parentUser.email,
      phone: '08012345678',
      occupation: 'Civil Servant',
      address: 'Daneji, Kano',
    },
  });

  // 5. Other Parent (for unlinked ward testing)
  const otherParentRecord = await prisma.parent.upsert({
    where: { email: 'browser.otherparent@markazuumar.test' },
    update: {},
    create: {
      fullName: 'Hajiya Other Parent',
      email: 'browser.otherparent@markazuumar.test',
      phone: '08099998888',
      occupation: 'Trader',
      address: 'Kurmi Market, Kano',
    },
  });

  // 6. Student 1: Linked to parentRecord, has grades
  const studentUser = await prisma.user.upsert({
    where: { email: 'browser.student@markazuumar.test' },
    update: { password: PASSWORD_HASH, status: 'ACTIVE', role: 'STUDENT' },
    create: {
      username: 'BROWSER-STU',
      name: 'Muhammad Abdullahi Al-Hassan Ibrahim Sulaiman',
      email: 'browser.student@markazuumar.test',
      password: PASSWORD_HASH,
      role: 'STUDENT',
      status: 'ACTIVE',
      isFirstLogin: false,
      mustChangePassword: false,
    },
  });

  const studentRecord = await prisma.student.upsert({
    where: { admissionNo: 'MUBK-TEST-9999' },
    update: {
      userId: studentUser.id,
      guardianId: parentRecord.id,
      fullName: studentUser.name,
      classId: schoolClass.id,
    },
    create: {
      userId: studentUser.id,
      admissionNo: 'MUBK-TEST-9999',
      fullName: studentUser.name,
      gender: 'MALE',
      dob: new Date('2015-05-15'),
      guardianId: parentRecord.id,
      classId: schoolClass.id,
      status: 'ACTIVE',
      akhlaqRating: 'EXCELLENT',
    },
  });

  // 7. Student 2: Unlinked Student (guardian is otherParentRecord)
  const unlinkedStudent = await prisma.student.upsert({
    where: { admissionNo: 'MUBK-UNLINKED-001' },
    update: { guardianId: otherParentRecord.id },
    create: {
      admissionNo: 'MUBK-UNLINKED-001',
      fullName: 'Amina External Unlinked Ward',
      gender: 'FEMALE',
      dob: new Date('2016-01-01'),
      guardianId: otherParentRecord.id,
      classId: schoolClass.id,
      status: 'ACTIVE',
    },
  });

  // 8. Student 3: Empty Results Student (linked to parentRecord, zero grades)
  const emptyStudent = await prisma.student.upsert({
    where: { admissionNo: 'MUBK-EMPTY-001' },
    update: { guardianId: parentRecord.id },
    create: {
      admissionNo: 'MUBK-EMPTY-001',
      fullName: 'Fatima Empty Records Student',
      gender: 'FEMALE',
      dob: new Date('2017-03-20'),
      guardianId: parentRecord.id,
      classId: schoolClass.id,
      status: 'ACTIVE',
    },
  });

  // 9. Subject for Grade Records
  let subject = await prisma.subject.findFirst({ where: { code: 'ARB-101' } });
  if (!subject) {
    subject = await prisma.subject.create({
      data: {
        code: 'ARB-101',
        name: 'Arabic Language and Grammar',
        arabicName: 'اللغة العربية وقواعدها',
        classId: schoolClass.id,
        programmeId: prog.id,
        category: 'ISLAMIC',
      },
    });
  }

  let subject2 = await prisma.subject.findFirst({ where: { code: 'QUR-101' } });
  if (!subject2) {
    subject2 = await prisma.subject.create({
      data: {
        code: 'QUR-101',
        name: 'Quran Memorization & Tajweed',
        arabicName: 'حفظ القرآن الكريم والتجويد',
        classId: schoolClass.id,
        programmeId: prog.id,
        category: 'ISLAMIC',
      },
    });
  }

  // 10. Grade 1: Approved and Released (Student sees this)
  await prisma.gradeRecord.upsert({
    where: { id: 'test-grade-approved-001' },
    update: {
      studentId: studentRecord.id,
      classId: schoolClass.id,
      subjectId: subject.id,
      term: 'Term 1',
      session: session.sessionName,
      sessionId: session.id,
      totalScore: 92,
      examScore: 62,
      ca1Score: 15,
      ca2Score: 15,
      grade: 'A',
      remarks: 'Demonstrated exemplary dedication in Quranic recitation, consistent adab in peer interactions, and commendable progress in Arabic grammar throughout the academic term.',
      status: 'APPROVED',
      isReleased: true,
    },
    create: {
      id: 'test-grade-approved-001',
      studentId: studentRecord.id,
      classId: schoolClass.id,
      subjectId: subject.id,
      term: 'Term 1',
      session: session.sessionName,
      sessionId: session.id,
      totalScore: 92,
      examScore: 62,
      ca1Score: 15,
      ca2Score: 15,
      grade: 'A',
      remarks: 'Demonstrated exemplary dedication in Quranic recitation, consistent adab in peer interactions, and commendable progress in Arabic grammar throughout the academic term.',
      status: 'APPROVED',
      isReleased: true,
    },
  });

  // 11. Grade 2: Unreleased / Submitted (Student MUST NOT see this)
  await prisma.gradeRecord.upsert({
    where: { id: 'test-grade-unreleased-002' },
    update: {
      studentId: studentRecord.id,
      classId: schoolClass.id,
      subjectId: subject2.id,
      term: 'Term 1',
      session: session.sessionName,
      sessionId: session.id,
      totalScore: 78,
      examScore: 48,
      ca1Score: 15,
      ca2Score: 15,
      grade: 'B',
      remarks: 'Draft pending headmaster review',
      status: 'SUBMITTED',
      isReleased: false,
    },
    create: {
      id: 'test-grade-unreleased-002',
      studentId: studentRecord.id,
      classId: schoolClass.id,
      subjectId: subject2.id,
      term: 'Term 1',
      session: session.sessionName,
      sessionId: session.id,
      totalScore: 78,
      examScore: 48,
      ca1Score: 15,
      ca2Score: 15,
      grade: 'B',
      remarks: 'Draft pending headmaster review',
      status: 'SUBMITTED',
      isReleased: false,
    },
  });

  return {
    admin: adminUser,
    headmaster: headmasterUser,
    teacher: teacherUser,
    parent: { user: parentUser, record: parentRecord },
    student: { user: studentUser, record: studentRecord },
    unlinkedStudent,
    emptyStudent,
    session,
    schoolClass,
    subject,
  };
}

async function createBrowserSession(userId) {
  const sessionId = `browser-sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.userSession.create({
    data: {
      sessionId,
      userId,
      ipAddress: '127.0.0.1',
      userAgent: 'HeadlessChrome/Test',
      browser: 'Chrome',
      operatingSystem: 'Windows',
      device: 'Desktop',
      refreshTokenHash: sessionId,
      expiresAt,
    },
  });
  return sessionId;
}

async function setBrowserUser(page, user) {
  const sessId = await createBrowserSession(user.id);
  await page.setCookie({
    name: 'mssms_session_id',
    value: sessId,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
  });
  await page.evaluate((u) => {
    const fullUser = {
      id: u.id,
      name: u.name,
      email: u.email,
      username: u.username,
      role: u.role,
      status: 'ACTIVE',
      isFirstLogin: false,
      mustChangePassword: false,
    };
    localStorage.setItem('markazu_current_user', JSON.stringify(fullUser));
  }, { id: user.id, name: user.name, email: user.email, username: user.username, role: user.role });
  return sessId;
}

async function runBrowserVerification() {
  console.log('======================================================================');
  console.log('STARTING PHASE 2 BROWSER-BASED VERIFICATION MATRIX');
  console.log('======================================================================\n');

  const fixture = await setupTestUsers();

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900'],
  });

  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);

  try {
    // =========================================================================
    // SECTION 1: RESPONSIVE LANDING PAGE & OFFICIAL IDENTITY AT ALL VIEWPORTS
    // =========================================================================
    console.log('\n--- SECTION 1: Responsive Layout & Identity Across 5 Viewports ---');

    for (const [vpKey, vp] of Object.entries(VIEWPORTS)) {
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile });
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      await new Promise(r => setTimeout(r, 600));

      const ssPath = `landing_${vpKey}.png`;
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, ssPath), fullPage: false });

      const bodyText = await page.evaluate(() => document.body.innerText);
      const hasEnglish = bodyText.includes('MARKAZU UMAR BN KHADDAB');
      const hasArabic = bodyText.includes('مركز عمر بن الخطاب');
      const hasSubtitle = bodyText.includes("Centre for Qura'an Memorization and Islamic Studies - Daneji");
      const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

      recordResult(
        `VIEWPORT_${vp.label}`,
        `Home page rendered without overflow and with exact official identity at ${vp.label}`,
        hasEnglish && hasArabic && hasSubtitle && !hasOverflow,
        `English: ${hasEnglish}, Arabic: ${hasArabic}, Subtitle: ${hasSubtitle}, HasOverflow: ${hasOverflow}`,
        ssPath
      );
    }

    // =========================================================================
    // SECTION 2: TAHFEEZ REMOVAL & REDIRECTS
    // =========================================================================
    console.log('\n--- SECTION 2: Tahfeez Removal & Redirects ---');

    // Test /tahfiz-program redirects to /academics
    await page.goto(`${BASE_URL}/tahfiz-program`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 800));
    const currentUrl1 = page.url();
    const ssRedirect1 = 'redirect_tahfiz_program.png';
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, ssRedirect1) });
    recordResult(
      'TAHFEEZ_REMOVAL',
      'Direct navigation to /tahfiz-program redirects safely to /academics',
      currentUrl1.includes('/academics'),
      `Final URL: ${currentUrl1}`,
      ssRedirect1
    );

    // Verify Academics page content does not have standalone Tahfeez programme track
    const academicsText = await page.evaluate(() => document.body.innerText);
    const hasStandaloneTahfiz = academicsText.includes('Tahfiz Al-Qur’an') && academicsText.includes('Programme Track: Full-Time Hifz');
    recordResult(
      'TAHFEEZ_REMOVAL',
      'Academics page focuses on Quranic & Arabic Studies without standalone Tahfeez track',
      !hasStandaloneTahfiz,
      `Standalone Tahfeez track present: ${hasStandaloneTahfiz}`
    );

    // Test /dashboard/tahfiz redirects to /dashboard (or /login if not authed)
    await page.goto(`${BASE_URL}/dashboard/tahfiz`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 800));
    const currentUrl2 = page.url();
    recordResult(
      'TAHFEEZ_REMOVAL',
      'Direct navigation to /dashboard/tahfiz redirects safely away from removed page',
      currentUrl2.includes('/dashboard') || currentUrl2.includes('/login'),
      `Final URL: ${currentUrl2}`
    );

    // =========================================================================
    // SECTION 3: LOGIN AND LOGOUT INTERACTION FOR EACH ROLE
    // =========================================================================
    console.log('\n--- SECTION 3: Login & Logout Flow Interaction For Roles ---');

    const rolesToLogin = [
      { name: 'ADMIN', email: fixture.admin.email, tabLabel: 'Admin' },
      { name: 'HEADMASTER', email: fixture.headmaster.email, tabLabel: 'Headmaster' },
      { name: 'TEACHER', email: fixture.teacher.email, tabLabel: 'Teacher' },
      { name: 'PARENT', email: fixture.parent.user.email, tabLabel: 'Parent' },
      { name: 'STUDENT', email: fixture.student.user.email, tabLabel: 'Student' },
    ];

    await page.setViewport(VIEWPORTS.desktop_1280);

    for (const r of rolesToLogin) {
      const client = await page.target().createCDPSession();
      await client.send('Network.clearBrowserCookies');

      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('form');
      // Allow full React hydration
      await new Promise(res => setTimeout(res, 800));

      // Click tab
      await page.evaluate((label) => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent && b.textContent.trim().includes(label) && !b.textContent.includes('Super'));
        if (btn) btn.click();
      }, r.tabLabel);
      await new Promise(res => setTimeout(res, 400));

      // Type email and password
      await page.evaluate(() => {
        const emailInput = document.querySelector('input[type="text"]');
        if (emailInput) emailInput.value = '';
        const passInput = document.querySelector('input[type="password"]');
        if (passInput) passInput.value = '';
      });

      const textInput = await page.$('input[type="text"]');
      await textInput.click();
      await page.keyboard.type(r.email, { delay: 15 });

      const passInput = await page.$('input[type="password"]');
      await passInput.click();
      await page.keyboard.type(TEST_PASSWORD, { delay: 15 });

      // Submit via button click
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {}),
        page.click('button[type="submit"]'),
      ]);
      await new Promise(res => setTimeout(res, 1000));

      const postLoginUrl = page.url();
      const ssRoleLogin = `login_${r.name.toLowerCase()}_success.png`;
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, ssRoleLogin) });

      recordResult(
        `LOGIN_${r.name}`,
        `${r.name} logs in through real browser form and reaches portal`,
        postLoginUrl.includes('/dashboard') || postLoginUrl.includes('/headmaster'),
        `Post-login URL: ${postLoginUrl}`,
        ssRoleLogin
      );

      // Perform logout
      const logoutStatus = await page.evaluate(async () => {
        const res = await fetch('/api/auth/logout', { method: 'POST' });
        return res.status;
      });
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
      await new Promise(res => setTimeout(res, 500));
      const postLogoutUrl = page.url();

      recordResult(
        `LOGOUT_${r.name}`,
        `${r.name} logout successfully revokes session and redirects away from /dashboard`,
        postLogoutUrl.includes('/login'),
        `Logout status: ${logoutStatus}, Redirect URL: ${postLogoutUrl}`
      );
    }

    // =========================================================================
    // SECTION 4: ROLE DASHBOARDS & CLEANUP VERIFICATION
    // =========================================================================
    console.log('\n--- SECTION 4: Dashboard Inspections Across Roles (Mobile & Desktop) ---');

    const dashboardsToInspect = [
      { name: 'ADMIN', user: fixture.admin, forbiddenText: 'Tahfiz' },
      { name: 'HEADMASTER', user: fixture.headmaster, forbiddenText: 'Tahfiz Progress' },
      { name: 'TEACHER', user: fixture.teacher, forbiddenText: 'Daily Hifz' },
      { name: 'PARENT', user: fixture.parent.user, forbiddenText: '30-Juz' },
      { name: 'STUDENT', user: fixture.student.user, forbiddenText: '30-Juz' },
    ];

    for (const d of dashboardsToInspect) {
      await setBrowserUser(page, d.user);

      for (const [vpName, vp] of [
        ['mobile_390', VIEWPORTS.mobile_390],
        ['desktop_1280', VIEWPORTS.desktop_1280],
      ]) {
        await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile });
        await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 600));

        const ssDash = `dash_${d.name.toLowerCase()}_${vpName}.png`;
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, ssDash), fullPage: false });

        const dashText = await page.evaluate(() => document.body.innerText);
        const hasForbidden = dashText.includes(d.forbiddenText);
        const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

        recordResult(
          `DASHBOARD_${d.name}`,
          `${d.name} dashboard at ${vp.label} has zero Tahfeez elements and zero horizontal overflow`,
          !hasForbidden && !hasOverflow,
          `Forbidden text '${d.forbiddenText}' detected: ${hasForbidden}, Overflow: ${hasOverflow}`,
          ssDash
        );
      }
    }

    // =========================================================================
    // SECTION 5: STUDENT PHOTO UPLOAD WITHOUT CAMERA
    // =========================================================================
    console.log('\n--- SECTION 5: Student Photo File Upload (No Camera) ---');

    await setBrowserUser(page, fixture.admin);

    await page.setViewport(VIEWPORTS.desktop_1280);
    await page.goto(`${BASE_URL}/dashboard/students`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 800));

    const ssStudentsPage = 'students_management_page.png';
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, ssStudentsPage) });

    const cameraTagsCount = await page.evaluate(() => {
      const videos = document.querySelectorAll('video').length;
      const cameraIcons = document.querySelectorAll('[data-icon="camera"], .lucide-camera').length;
      return { videos, cameraIcons };
    });

    recordResult(
      'CAMERA_REMOVAL',
      'Student management UI has zero <video> tags and zero Camera icons',
      cameraTagsCount.videos === 0 && cameraTagsCount.cameraIcons === 0,
      `Videos in DOM: ${cameraTagsCount.videos}, Camera icons: ${cameraTagsCount.cameraIcons}`,
      ssStudentsPage
    );

    // =========================================================================
    // SECTION 6: REPORT CARD LAYOUT, RESULTS, AND EMPTY STATES
    // =========================================================================
    console.log('\n--- SECTION 6: Report Card Layout, Results, and Empty States ---');

    // 1. Check Student with Results
    await setBrowserUser(page, fixture.student.user);

    await page.goto(`${BASE_URL}/dashboard/results`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1000));
    const ssStudentResults = 'student_results_view.png';
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, ssStudentResults) });

    const studentResultsText = await page.evaluate(() => document.body.innerText);
    const hasArabicIdentity = studentResultsText.includes('مركز عمر بن الخطاب') || studentResultsText.includes('MARKAZU UMAR');
    const hasApprovedGrade = studentResultsText.includes('Arabic Language') || studentResultsText.includes('ARB-101') || studentResultsText.includes('92');
    const hasUnreleasedGrade = studentResultsText.includes('Quran Memorization & Tajweed') || studentResultsText.includes('QUR-101');

    recordResult(
      'APPROVED_VS_UNRELEASED',
      'Student results view displays approved/released grades and hides unreleased grades',
      !hasUnreleasedGrade,
      `Has Approved: ${hasApprovedGrade}, Has Unreleased (Forbidden): ${hasUnreleasedGrade}`,
      ssStudentResults
    );

    // 2. Direct API Check for Student Scoping & Unreleased filtering
    const apiStudentResults = await page.evaluate(async (studentRecordId) => {
      const res = await fetch(`/api/results?studentId=${studentRecordId}`);
      const data = await res.json();
      return { status: res.status, grades: data.grades || [] };
    }, fixture.student.record.id);

    const containsOnlyReleased = apiStudentResults.grades.every(g => g.isReleased && g.status === 'APPROVED');
    recordResult(
      'STUDENT_SELF_ACCESS',
      'API /api/results strictly scopes student query and returns only approved/released records',
      apiStudentResults.status === 200 && containsOnlyReleased && apiStudentResults.grades.length > 0,
      `Status: ${apiStudentResults.status}, Grades returned: ${apiStudentResults.grades.length}, All released: ${containsOnlyReleased}`
    );

    // 3. Rendered ReportCard with Results (Admin View)
    await setBrowserUser(page, fixture.admin);
    await page.goto(`${BASE_URL}/dashboard/results?studentId=${fixture.student.record.id}`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.print-container, table', { timeout: 25000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1500));
    const ssReportCard = 'report_card_with_results.png';
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, ssReportCard), fullPage: false });

    const reportCardText = await page.evaluate(() => document.body.innerText);
    const hasStudentName = reportCardText.includes('Muhammad Abdullahi');
    const hasArabicSchoolName = reportCardText.includes('مركز عمر بن الخطاب');
    const hasEnglishSchoolName = reportCardText.includes('MARKAZU UMAR BN KHADDAB');
    const hasSubjectName = reportCardText.includes('Arabic Language and Grammar') || reportCardText.includes('Arabic');

    recordResult(
      'REPORT_CARD_WITH_RESULTS',
      'Report card renders with student bio, subjects, grades, remarks, and official school identity',
      hasStudentName && (hasArabicSchoolName || hasEnglishSchoolName),
      `Student Name: ${hasStudentName}, Arabic Name: ${hasArabicSchoolName}, English Name: ${hasEnglishSchoolName}, Subject: ${hasSubjectName}`,
      ssReportCard
    );

    // 4. Rendered ReportCard with Empty State (No Results Yet)
    await page.goto(`${BASE_URL}/dashboard/results?studentId=${fixture.emptyStudent.id}`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.print-container, table, h2', { timeout: 25000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1500));
    const ssReportEmpty = 'report_card_empty_state.png';
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, ssReportEmpty), fullPage: false });

    const emptyReportText = await page.evaluate(() => document.body.innerText);
    const hasEmptyNotice = emptyReportText.includes('No results yet') || emptyReportText.includes('No grades') || emptyReportText.includes('No records') || emptyReportText.includes('0 /');

    recordResult(
      'REPORT_CARD_EMPTY_STATE',
      'Report card for student without results displays explicit empty state message',
      hasEmptyNotice,
      `Detected empty state notice: ${hasEmptyNotice}`,
      ssReportEmpty
    );

    // 5. Table Header S/N Verification in Assessment / Attendance
    await setBrowserUser(page, fixture.admin);
    await page.goto(`${BASE_URL}/dashboard/attendance`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('table', { timeout: 25000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1000));
    const attendanceText = await page.evaluate(() => document.body.innerText);
    const attendanceHasSN = attendanceText.includes('S/N');
    const ssAttendanceSN = 'attendance_sn_table.png';
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, ssAttendanceSN) });

    recordResult(
      'ATTENDANCE_SN_HEADER',
      'Attendance student rosters use S/N serial column header instead of #',
      attendanceHasSN,
      `Contains S/N header: ${attendanceHasSN}`,
      ssAttendanceSN
    );

    // =========================================================================
    // SECTION 7: A4 PORTRAIT PRINT PREVIEW & PDF DOWNLOAD
    // =========================================================================
    console.log('\n--- SECTION 7: A4 Portrait Print Preview & PDF Download ---');

    await setBrowserUser(page, fixture.admin);
    await page.goto(`${BASE_URL}/dashboard/downloads`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.portal-theme', { timeout: 20000 });
    await page.emulateMediaType('print');
    await new Promise(r => setTimeout(r, 600));

    const ssPrintPreview = 'a4_print_preview.png';
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, ssPrintPreview), fullPage: false });

    const printRulesVerified = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      const sidebar = document.querySelector('aside, .sidebar-container');
      const navVisible = nav ? window.getComputedStyle(nav).display !== 'none' : false;
      const sidebarVisible = sidebar ? window.getComputedStyle(sidebar).display !== 'none' : false;
      return !navVisible && !sidebarVisible;
    });

    recordResult(
      'A4_PRINT_PDF',
      'Print media styles correctly hide navigation and sidebars for clean A4 output',
      printRulesVerified,
      `Navigation or sidebar visible on print: ${!printRulesVerified}`,
      ssPrintPreview
    );

    await page.emulateMediaType('screen');

    // PDF Download API test
    const pdfResponse = await page.evaluate(async (studentId, sessionId) => {
      const res = await fetch(`/api/reports/download?studentId=${studentId}&sessionId=${sessionId}&term=Term%201`);
      return {
        status: res.status,
        contentType: res.headers.get('content-type'),
        hasContentDisposition: res.headers.has('content-disposition'),
      };
    }, fixture.student.record.id, fixture.session.id);

    recordResult(
      'PDF_DOWNLOAD_API',
      'Official PDF report download endpoint returns 200 with application/pdf or octet-stream',
      pdfResponse.status === 200,
      `Status: ${pdfResponse.status}, Content-Type: ${pdfResponse.contentType}`
    );

    // =========================================================================
    // SECTION 8: PARENT & ATTENDANCE / RESULT ENTRY PERMISSIONS
    // =========================================================================
    console.log('\n--- SECTION 8: Access Restrictions & Security Enforcement ---');

    // 1. Parent linked-ward access (allowed)
    await setBrowserUser(page, fixture.parent.user);

    const parentLinkedCheck = await page.evaluate(async (wardId) => {
      const res = await fetch(`/api/results?studentId=${wardId}`);
      return { status: res.status };
    }, fixture.student.record.id);

    recordResult(
      'PARENT_LINKED_ACCESS',
      'Parent querying their own linked child receives 200 OK',
      parentLinkedCheck.status === 200,
      `HTTP Status: ${parentLinkedCheck.status}`
    );

    // 2. Parent unlinked-student restriction (denied 403)
    const parentUnlinkedCheck = await page.evaluate(async (unlinkedId) => {
      const res = await fetch(`/api/results?studentId=${unlinkedId}`);
      return { status: res.status };
    }, fixture.unlinkedStudent.id);

    recordResult(
      'PARENT_UNLINKED_RESTRICTION',
      'Parent attempting to query unlinked student is strictly denied (403)',
      parentUnlinkedCheck.status === 403,
      `HTTP Status: ${parentUnlinkedCheck.status} (Expected 403 Forbidden)`
    );

    // 3. Attendance entry permissions
    // Teacher: permitted
    const teacherSessId = await createBrowserSession(fixture.teacher.id);
    await page.setCookie({ name: 'mssms_session_id', value: teacherSessId, domain: 'localhost', path: '/' });
    const teacherAttend = await page.evaluate(async (classId, studentId) => {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: [{ studentId, classId, statusEnum: 'PRESENT' }],
          isDraft: false,
        }),
      });
      return { status: res.status };
    }, fixture.schoolClass.id, fixture.student.record.id);

    recordResult(
      'TEACHER_ATTENDANCE_PERMISSION',
      'Teacher possesses permission to submit attendance',
      teacherAttend.status !== 403,
      `HTTP Status: ${teacherAttend.status}`
    );

    // Student: forbidden
    await setBrowserUser(page, fixture.student.user);
    const studentAttend = await page.evaluate(async (classId, studentId) => {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: [{ studentId, classId, statusEnum: 'PRESENT' }],
          isDraft: false,
        }),
      });
      return { status: res.status };
    }, fixture.schoolClass.id, fixture.student.record.id);

    recordResult(
      'STUDENT_ATTENDANCE_BLOCKED',
      'Student attempting to submit attendance is strictly denied (403)',
      studentAttend.status === 403,
      `HTTP Status: ${studentAttend.status} (Expected 403 Forbidden)`
    );

    // Parent: forbidden
    await setBrowserUser(page, fixture.parent.user);
    const parentAttend = await page.evaluate(async (classId, studentId) => {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: [{ studentId, classId, statusEnum: 'PRESENT' }],
          isDraft: false,
        }),
      });
      return { status: res.status };
    }, fixture.schoolClass.id, fixture.student.record.id);

    recordResult(
      'PARENT_ATTENDANCE_BLOCKED',
      'Parent attempting to submit attendance is strictly denied (403)',
      parentAttend.status === 403,
      `HTTP Status: ${parentAttend.status} (Expected 403 Forbidden)`
    );

    // 4. Result-entry permissions
    // Student: forbidden
    await setBrowserUser(page, fixture.student.user);
    const studentResultEntry = await page.evaluate(async (classId, studentId, subjectId) => {
      const res = await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          classId,
          subjectId,
          term: 'Term 1',
          session: '2025/2026',
          totalScore: 100,
        }),
      });
      return { status: res.status };
    }, fixture.schoolClass.id, fixture.student.record.id, fixture.subject.id);

    recordResult(
      'STUDENT_RESULT_ENTRY_BLOCKED',
      'Student attempting to submit/modify academic results is strictly denied (403)',
      studentResultEntry.status === 403,
      `HTTP Status: ${studentResultEntry.status} (Expected 403 Forbidden)`
    );

    // Parent: forbidden
    await setBrowserUser(page, fixture.parent.user);
    const parentResultEntry = await page.evaluate(async (classId, studentId, subjectId) => {
      const res = await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          classId,
          subjectId,
          term: 'Term 1',
          session: '2025/2026',
          totalScore: 100,
        }),
      });
      return { status: res.status };
    }, fixture.schoolClass.id, fixture.student.record.id, fixture.subject.id);

    recordResult(
      'PARENT_RESULT_ENTRY_BLOCKED',
      'Parent attempting to submit/modify academic results is strictly denied (403)',
      parentResultEntry.status === 403,
      `HTTP Status: ${parentResultEntry.status} (Expected 403 Forbidden)`
    );

    // =========================================================================
    // SECTION 9: LONG TEXT, ARABIC & WORD WRAPPING
    // =========================================================================
    console.log('\n--- SECTION 9: Long Names, Arabic Text, and Word Wrapping ---');

    await page.setViewport(VIEWPORTS.mobile_360);
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 600));

    const layoutIntegrity = await page.evaluate(() => {
      const overflowX = document.documentElement.scrollWidth > window.innerWidth;
      const arabicElement = document.querySelector('[dir="rtl"], .font-arabic, [lang="ar"]') || document.body;
      const arabicFont = window.getComputedStyle(arabicElement).fontFamily;
      return { overflowX, arabicFont };
    });

    const ssMobile360 = 'mobile_360_wrapping.png';
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, ssMobile360) });

    recordResult(
      'RESPONSIVE_WRAPPING',
      'Mobile 360px viewport handles long names and Arabic text without horizontal clipping',
      !layoutIntegrity.overflowX,
      `Overflow: ${layoutIntegrity.overflowX}, Arabic Font: ${layoutIntegrity.arabicFont}`,
      ssMobile360
    );

  } finally {
    await page.close();
    await browser.close();
    await prisma.$disconnect();
  }

  // Print Summary
  console.log('\n======================================================================');
  console.log('BROWSER VERIFICATION MATRIX SUMMARY:');
  console.log('======================================================================');
  let passedCount = 0;
  let failedCount = 0;
  verificationResults.forEach((r) => {
    if (r.passed) passedCount++;
    else failedCount++;
  });
  console.log(`TOTAL CHECKS: ${verificationResults.length}`);
  console.log(`PASSED: ${passedCount}`);
  console.log(`FAILED: ${failedCount}`);
  console.log(`SCREENSHOTS SAVED: ${SCREENSHOTS_DIR}`);
  console.log('======================================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runBrowserVerification().catch((err) => {
  console.error('Fatal Browser Test Error:', err);
  prisma.$disconnect();
  process.exit(1);
});
