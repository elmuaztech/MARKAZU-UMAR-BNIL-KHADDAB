/**
 * PHASE 1A — SECURITY & ACCOUNT PROTECTION AUTOMATED VERIFICATION SUITE
 * Markazu Umar bn Khattab Centre for Qura'an Memorization and Islamic Studies - Daneji
 *
 * Covers 24 required security test cases:
 * 1. Valid session -> allowed.
 * 2. Invalid session -> denied.
 * 3. Expired session -> denied.
 * 4. Revoked session -> denied.
 * 5. Logout -> database session revoked.
 * 6. Old logged-out session -> denied.
 * 7. User can change own password.
 * 8. User cannot change another user's password.
 * 9. Invalid current password -> denied.
 * 10. Password reset token works once.
 * 11. Expired reset token -> denied.
 * 12. Used reset token -> denied.
 * 13. Hardcoded reset backdoor does not work.
 * 14. Admin cannot create Super Admin.
 * 15. Admin cannot promote user to Super Admin.
 * 16. Teacher cannot change roles.
 * 17. Student cannot access admin pages.
 * 18. Parent cannot access admin pages.
 * 19. Unauthenticated direct URL -> denied.
 * 20. Unauthorized direct URL -> denied.
 * 21. Unauthenticated protected API -> denied.
 * 22. Changing URL IDs does not bypass access.
 * 23. Deactivated account cannot log in.
 * 24. Existing email sending still works.
 */

const assert = require('assert');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE_URL = 'http://localhost:3000';

const results = [];

function recordTest(id, name, passed, details) {
  results.push({ id, name, passed, details });
  const statusStr = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[TEST ${id.toString().padStart(2, '0')}] ${statusStr}: ${name}`);
  if (details) {
    console.log(`         Details: ${details}`);
  }
}

async function runSuite() {
  console.log('======================================================================');
  console.log('STARTING PHASE 1A SECURITY & ACCOUNT PROTECTION VERIFICATION SUITE');
  console.log('======================================================================\n');

  let testUser = null;
  let testAdmin = null;
  let testSessionId = `test-sess-${Date.now()}`;
  const initialPassword = '@Aa123456789';
  const initialHash = bcrypt.hashSync(initialPassword, 10);

  try {
    // Setup isolated test user in PostgreSQL
    const testEmail = `test.sec.${Date.now()}@markazuumar.test`;
    testUser = await prisma.user.create({
      data: {
        username: `TEST-SEC-${Date.now().toString().slice(-4)}`,
        name: 'Phase 1A Test User',
        email: testEmail,
        password: initialHash,
        role: 'TEACHER',
        status: 'ACTIVE',
        isFirstLogin: false,
        mustChangePassword: false,
      },
    });

    const testAdminEmail = `test.admin.${Date.now()}@markazuumar.test`;
    testAdmin = await prisma.user.create({
      data: {
        username: `TEST-ADM-${Date.now().toString().slice(-4)}`,
        name: 'Phase 1A Test Admin',
        email: testAdminEmail,
        password: initialHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        isFirstLogin: false,
        mustChangePassword: false,
      },
    });

    // Create a valid session
    const validSession = await prisma.userSession.create({
      data: {
        sessionId: testSessionId,
        userId: testUser.id,
        ipAddress: '127.0.0.1',
        userAgent: 'Phase1ATestRunner',
        browser: 'NodeTest',
        operatingSystem: 'Windows',
        device: 'Desktop',
        refreshTokenHash: testSessionId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        revoked: false,
      },
    });

    // -------------------------------------------------------------------------
    // 1. Valid session -> allowed
    // -------------------------------------------------------------------------
    const res1 = await fetch(`${BASE_URL}/api/users`, {
      headers: {
        Cookie: `mssms_session_id=${testSessionId}`,
        'x-session-id': testSessionId,
      },
    });
    // Even if role permissions restrict returning user list to ADMIN/SUPER_ADMIN,
    // authentication itself should succeed (status is 403 Forbidden by role, not 401 Unauthenticated)
    recordTest(
      1,
      'Valid session -> allowed (authenticated)',
      res1.status !== 401,
      `Status: ${res1.status} (Not 401 unauthenticated)`
    );

    // -------------------------------------------------------------------------
    // 2. Invalid session -> denied
    // -------------------------------------------------------------------------
    const res2 = await fetch(`${BASE_URL}/api/users`, {
      headers: {
        Cookie: `mssms_session_id=invalid-non-existent-session-id-12345`,
        'x-session-id': 'invalid-non-existent-session-id-12345',
      },
    });
    recordTest(
      2,
      'Invalid session -> denied (401)',
      res2.status === 401,
      `Status: ${res2.status} (Expected: 401)`
    );

    // -------------------------------------------------------------------------
    // 3. Expired session -> denied
    // -------------------------------------------------------------------------
    const expiredSessionId = `expired-sess-${Date.now()}`;
    await prisma.userSession.create({
      data: {
        sessionId: expiredSessionId,
        userId: testUser.id,
        ipAddress: '127.0.0.1',
        userAgent: 'Phase1ATestRunner',
        browser: 'NodeTest',
        operatingSystem: 'Windows',
        device: 'Desktop',
        refreshTokenHash: expiredSessionId,
        expiresAt: new Date(Date.now() - 1000 * 60), // Expired 1 min ago
        revoked: false,
      },
    });

    const res3 = await fetch(`${BASE_URL}/api/users`, {
      headers: {
        Cookie: `mssms_session_id=${expiredSessionId}`,
        'x-session-id': expiredSessionId,
      },
    });
    recordTest(
      3,
      'Expired session -> denied (401)',
      res3.status === 401,
      `Status: ${res3.status} (Expected: 401)`
    );

    // -------------------------------------------------------------------------
    // 4. Revoked session -> denied
    // -------------------------------------------------------------------------
    const revokedSessionId = `revoked-sess-${Date.now()}`;
    await prisma.userSession.create({
      data: {
        sessionId: revokedSessionId,
        userId: testUser.id,
        ipAddress: '127.0.0.1',
        userAgent: 'Phase1ATestRunner',
        browser: 'NodeTest',
        operatingSystem: 'Windows',
        device: 'Desktop',
        refreshTokenHash: revokedSessionId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        revoked: true, // REVOKED
      },
    });

    const res4 = await fetch(`${BASE_URL}/api/users`, {
      headers: {
        Cookie: `mssms_session_id=${revokedSessionId}`,
        'x-session-id': revokedSessionId,
      },
    });
    recordTest(
      4,
      'Revoked session -> denied (401)',
      res4.status === 401,
      `Status: ${res4.status} (Expected: 401)`
    );

    // -------------------------------------------------------------------------
    // 5. Logout -> database session revoked
    // -------------------------------------------------------------------------
    const logoutTargetSessionId = `logout-target-${Date.now()}`;
    await prisma.userSession.create({
      data: {
        sessionId: logoutTargetSessionId,
        userId: testUser.id,
        ipAddress: '127.0.0.1',
        userAgent: 'Phase1ATestRunner',
        browser: 'NodeTest',
        operatingSystem: 'Windows',
        device: 'Desktop',
        refreshTokenHash: logoutTargetSessionId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        revoked: false,
      },
    });

    const resLogout = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Cookie: `mssms_session_id=${logoutTargetSessionId}`,
        'x-session-id': logoutTargetSessionId,
      },
    });

    const checkDbSession = await prisma.userSession.findFirst({
      where: { sessionId: logoutTargetSessionId },
    });

    const isDbRevoked = checkDbSession && checkDbSession.revoked === true;
    recordTest(
      5,
      'Logout -> database session revoked in PostgreSQL',
      isDbRevoked && resLogout.status === 200,
      `Database revoked flag: ${checkDbSession?.revoked}, HTTP status: ${resLogout.status}`
    );

    // -------------------------------------------------------------------------
    // 6. Old logged-out session -> denied
    // -------------------------------------------------------------------------
    const res6 = await fetch(`${BASE_URL}/api/users`, {
      headers: {
        Cookie: `mssms_session_id=${logoutTargetSessionId}`,
        'x-session-id': logoutTargetSessionId,
      },
    });
    recordTest(
      6,
      'Old logged-out session -> denied (401)',
      res6.status === 401,
      `Status: ${res6.status} (Expected: 401)`
    );

    // -------------------------------------------------------------------------
    // 7. User can change own password
    // -------------------------------------------------------------------------
    const newPass = '@NewPass123456';
    const res7 = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `mssms_session_id=${testSessionId}`,
        'x-session-id': testSessionId,
      },
      body: JSON.stringify({
        currentPassword: initialPassword,
        newPassword: newPass,
      }),
    });
    const data7 = await res7.json();

    const refreshedUser = await prisma.user.findUnique({ where: { id: testUser.id } });
    const isNewPassValid = bcrypt.compareSync(newPass, refreshedUser.password);

    recordTest(
      7,
      'User can change own password',
      res7.status === 200 && isNewPassValid,
      `HTTP status: ${res7.status}, Password updated in DB: ${isNewPassValid}`
    );

    // -------------------------------------------------------------------------
    // 8. User cannot change another user's password
    // -------------------------------------------------------------------------
    // Even if caller submits userId of another user in body, endpoint must only change caller's password
    const res8 = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `mssms_session_id=${testSessionId}`,
        'x-session-id': testSessionId,
      },
      body: JSON.stringify({
        userId: testAdmin.id, // Trying to tamper and target testAdmin!
        email: testAdmin.email,
        currentPassword: initialPassword, // Wrong password for testUser (since testUser changed to newPass)
        newPassword: '@TamperedPass999',
      }),
    });
    const adminAfterAttempt = await prisma.user.findUnique({ where: { id: testAdmin.id } });
    const adminPasswordUntouched = bcrypt.compareSync(initialPassword, adminAfterAttempt.password);

    recordTest(
      8,
      "User cannot change another user's password via ID tampering",
      res8.status === 401 && adminPasswordUntouched,
      `HTTP status: ${res8.status}, Admin password safely untouched: ${adminPasswordUntouched}`
    );

    // -------------------------------------------------------------------------
    // 9. Invalid current password -> denied
    // -------------------------------------------------------------------------
    const res9 = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `mssms_session_id=${testSessionId}`,
        'x-session-id': testSessionId,
      },
      body: JSON.stringify({
        currentPassword: 'WrongIncorrectPassword123!',
        newPassword: '@AnotherPass456',
      }),
    });
    recordTest(
      9,
      'Invalid current password -> denied (401)',
      res9.status === 401,
      `Status: ${res9.status} (Expected: 401)`
    );

    // -------------------------------------------------------------------------
    // 10. Password reset token works once
    // -------------------------------------------------------------------------
    const rawResetCode = '748291';
    const hashedResetCode = crypto.createHash('sha256').update(rawResetCode).digest('hex');
    const resetTokenRecord = await prisma.passwordResetToken.create({
      data: {
        tokenHash: hashedResetCode,
        userId: testUser.id,
        email: testUser.email,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
        used: false,
      },
    });

    const res10 = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: rawResetCode,
        newPassword: '@ResetSuccess123',
      }),
    });

    const tokenAfterUse = await prisma.passwordResetToken.findUnique({
      where: { id: resetTokenRecord.id },
    });

    recordTest(
      10,
      'Password reset token works once',
      res10.status === 200 && tokenAfterUse?.used === true,
      `HTTP status: ${res10.status}, Token marked used: ${tokenAfterUse?.used}`
    );

    // -------------------------------------------------------------------------
    // 11. Expired reset token -> denied
    // -------------------------------------------------------------------------
    const expiredRawCode = '918273';
    const expiredHashedCode = crypto.createHash('sha256').update(expiredRawCode).digest('hex');
    await prisma.passwordResetToken.create({
      data: {
        tokenHash: expiredHashedCode,
        userId: testUser.id,
        email: testUser.email,
        expiresAt: new Date(Date.now() - 5 * 60 * 1000), // Expired 5 mins ago
        used: false,
      },
    });

    const res11 = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: expiredRawCode,
        newPassword: '@ExpiredAttempt123',
      }),
    });
    recordTest(
      11,
      'Expired reset token -> denied (400)',
      res11.status === 400,
      `Status: ${res11.status} (Expected: 400)`
    );

    // -------------------------------------------------------------------------
    // 12. Used reset token -> denied
    // -------------------------------------------------------------------------
    const res12 = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: rawResetCode, // Attempting to reuse token from Test 10
        newPassword: '@ReusedTokenFail123',
      }),
    });
    recordTest(
      12,
      'Used reset token cannot be reused -> denied (400)',
      res12.status === 400,
      `Status: ${res12.status} (Expected: 400)`
    );

    // -------------------------------------------------------------------------
    // 13. Hardcoded reset backdoor does not work
    // -------------------------------------------------------------------------
    // In the old backdoor, any arbitrary 4-digit code (e.g. "9999", "1234") would allow resetting Super Admin password
    const res13 = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: '4819', // Former test backdoor code
        newPassword: '@BackdoorHijackAttempt123',
      }),
    });
    recordTest(
      13,
      'Hardcoded reset backdoor is removed -> denied (400)',
      res13.status === 400,
      `Status: ${res13.status} (Expected: 400 rejection)`
    );

    // -------------------------------------------------------------------------
    // Setup Admin Session for Role Escalation Tests
    // -------------------------------------------------------------------------
    const adminSessionId = `admin-sess-${Date.now()}`;
    await prisma.userSession.create({
      data: {
        sessionId: adminSessionId,
        userId: testAdmin.id,
        ipAddress: '127.0.0.1',
        userAgent: 'Phase1ATestRunner',
        browser: 'NodeTest',
        operatingSystem: 'Windows',
        device: 'Desktop',
        refreshTokenHash: adminSessionId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        revoked: false,
      },
    });

    // -------------------------------------------------------------------------
    // 14. Admin cannot create Super Admin
    // -------------------------------------------------------------------------
    const res14 = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `mssms_session_id=${adminSessionId}`,
        'x-session-id': adminSessionId,
      },
      body: JSON.stringify({
        name: 'Malicious Super Admin',
        email: `malicious.superadmin.${Date.now()}@test.com`,
        role: 'SUPER_ADMIN', // Escalation attempt!
      }),
    });
    recordTest(
      14,
      'Admin cannot create Super Admin account -> denied (403)',
      res14.status === 403,
      `Status: ${res14.status} (Expected: 403 Forbidden)`
    );

    // -------------------------------------------------------------------------
    // 15. Admin cannot promote user to Super Admin
    // -------------------------------------------------------------------------
    const res15 = await fetch(`${BASE_URL}/api/users/${testUser.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `mssms_session_id=${adminSessionId}`,
        'x-session-id': adminSessionId,
      },
      body: JSON.stringify({
        role: 'SUPER_ADMIN', // Promotion attempt!
      }),
    });
    recordTest(
      15,
      'Admin cannot promote user to Super Admin -> denied (403)',
      res15.status === 403,
      `Status: ${res15.status} (Expected: 403 Forbidden)`
    );

    // -------------------------------------------------------------------------
    // 16. Teacher cannot change roles
    // -------------------------------------------------------------------------
    const res16 = await fetch(`${BASE_URL}/api/users/${testUser.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `mssms_session_id=${testSessionId}`,
        'x-session-id': testSessionId,
      },
      body: JSON.stringify({
        role: 'ADMIN', // Self-promotion attempt by teacher!
      }),
    });
    recordTest(
      16,
      'Teacher cannot change roles -> denied (403)',
      res16.status === 403,
      `Status: ${res16.status} (Expected: 403 Forbidden)`
    );

    // -------------------------------------------------------------------------
    // Setup Student & Parent Accounts
    // -------------------------------------------------------------------------
    const studentUser = await prisma.user.create({
      data: {
        username: `TEST-STU-${Date.now().toString().slice(-4)}`,
        name: 'Phase 1A Test Student',
        email: `test.stu.${Date.now()}@markazuumar.test`,
        password: initialHash,
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    });
    const studentSessionId = `stu-sess-${Date.now()}`;
    await prisma.userSession.create({
      data: {
        sessionId: studentSessionId,
        userId: studentUser.id,
        ipAddress: '127.0.0.1',
        userAgent: 'Phase1ATestRunner',
        browser: 'NodeTest',
        operatingSystem: 'Windows',
        device: 'Desktop',
        refreshTokenHash: studentSessionId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        revoked: false,
      },
    });

    const parentUser = await prisma.user.create({
      data: {
        username: `TEST-PAR-${Date.now().toString().slice(-4)}`,
        name: 'Phase 1A Test Parent',
        email: `test.par.${Date.now()}@markazuumar.test`,
        password: initialHash,
        role: 'PARENT',
        status: 'ACTIVE',
      },
    });
    const parentSessionId = `par-sess-${Date.now()}`;
    await prisma.userSession.create({
      data: {
        sessionId: parentSessionId,
        userId: parentUser.id,
        ipAddress: '127.0.0.1',
        userAgent: 'Phase1ATestRunner',
        browser: 'NodeTest',
        operatingSystem: 'Windows',
        device: 'Desktop',
        refreshTokenHash: parentSessionId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        revoked: false,
      },
    });

    // -------------------------------------------------------------------------
    // 17. Student cannot access admin pages / APIs
    // -------------------------------------------------------------------------
    const res17 = await fetch(`${BASE_URL}/api/users`, {
      headers: {
        Cookie: `mssms_session_id=${studentSessionId}`,
        'x-session-id': studentSessionId,
      },
    });
    recordTest(
      17,
      'Student cannot access admin APIs -> denied (403)',
      res17.status === 403,
      `Status: ${res17.status} (Expected: 403 Forbidden)`
    );

    // -------------------------------------------------------------------------
    // 18. Parent cannot access admin pages / APIs
    // -------------------------------------------------------------------------
    const res18 = await fetch(`${BASE_URL}/api/users`, {
      headers: {
        Cookie: `mssms_session_id=${parentSessionId}`,
        'x-session-id': parentSessionId,
      },
    });
    recordTest(
      18,
      'Parent cannot access admin APIs -> denied (403)',
      res18.status === 403,
      `Status: ${res18.status} (Expected: 403 Forbidden)`
    );

    // -------------------------------------------------------------------------
    // 19. Unauthenticated direct URL -> denied (redirect to login)
    // -------------------------------------------------------------------------
    const res19 = await fetch(`${BASE_URL}/dashboard`, {
      redirect: 'manual', // Do not follow redirects so we can inspect 307/302
    });
    const isRedirect19 = res19.status === 307 || res19.status === 302 || res19.status === 303;
    const location19 = res19.headers.get('location') || '';
    recordTest(
      19,
      'Unauthenticated direct URL (/dashboard) -> redirected to /login',
      isRedirect19 && location19.includes('/login'),
      `Status: ${res19.status}, Redirect Location: ${location19}`
    );

    // -------------------------------------------------------------------------
    // 20. Unauthorized direct URL -> denied (e.g. Student accessing /headmaster)
    // -------------------------------------------------------------------------
    const res20 = await fetch(`${BASE_URL}/headmaster`, {
      redirect: 'manual',
      headers: {
        Cookie: `mssms_session_id=${studentSessionId}`,
      },
    });
    const isRedirect20 = res20.status === 307 || res20.status === 302 || res20.status === 303;
    const location20 = res20.headers.get('location') || '';
    recordTest(
      20,
      'Unauthorized direct URL (/headmaster accessed by student) -> redirected away',
      isRedirect20 && !location20.includes('/headmaster'),
      `Status: ${res20.status}, Redirect Location: ${location20}`
    );

    // -------------------------------------------------------------------------
    // 21. Unauthenticated protected API -> denied
    // -------------------------------------------------------------------------
    const res21 = await fetch(`${BASE_URL}/api/users`, {
      headers: {}, // Zero auth headers or cookies
    });
    recordTest(
      21,
      'Unauthenticated protected API (/api/users) -> denied (401)',
      res21.status === 401,
      `Status: ${res21.status} (Expected: 401)`
    );

    // -------------------------------------------------------------------------
    // 22. Changing URL IDs does not bypass access (Session fallback removal test)
    // -------------------------------------------------------------------------
    // If someone passes a User ID in cookie or Bearer header without an active UserSession record:
    const res22 = await fetch(`${BASE_URL}/api/users`, {
      headers: {
        Cookie: `mssms_session_id=${testAdmin.id}`, // passing raw user ID instead of session
        Authorization: `Bearer ${testAdmin.id}`,
      },
    });
    recordTest(
      22,
      'Supplying user ID directly in cookie/Bearer does not bypass authentication -> denied (401)',
      res22.status === 401,
      `Status: ${res22.status} (Expected: 401 Unauthenticated)`
    );

    // -------------------------------------------------------------------------
    // 23. Deactivated account cannot log in
    // -------------------------------------------------------------------------
    const deactivatedEmail = `deactivated.${Date.now()}@markazuumar.test`;
    const deactUser = await prisma.user.create({
      data: {
        username: `DEACT-${Date.now().toString().slice(-4)}`,
        name: 'Deactivated User',
        email: deactivatedEmail,
        password: initialHash,
        role: 'TEACHER',
        status: 'DEACTIVATED',
        deletedAt: new Date(),
      },
    });

    const res23 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: deactivatedEmail,
        password: initialPassword,
      }),
    });
    recordTest(
      23,
      'Deactivated account cannot log in -> denied (403)',
      res23.status === 403,
      `Status: ${res23.status} (Expected: 403 Forbidden)`
    );

    // -------------------------------------------------------------------------
    // 24. Existing email sending still works (Verification via central service)
    // -------------------------------------------------------------------------
    // We import emailService and verify template generation and email client configuration
    const emailServicePath = '../src/lib/emailService';
    delete require.cache[require.resolve(emailServicePath)];
    const { generateEmailHtml } = require(emailServicePath);

    const testHtml = generateEmailHtml({
      to: 'test@example.com',
      recipientName: 'Test Recipient',
      subject: 'Test Subject',
      template: 'PASSWORD_RESET_REQUEST',
      metadata: {
        resetToken: '123456',
        portalUrl: 'http://localhost:3000',
      },
    });

    const emailServiceHealthy =
      typeof testHtml === 'string' &&
      testHtml.includes('MARKAZU UMAR') &&
      testHtml.includes('123456');

    recordTest(
      24,
      'Existing email template generation and architecture intact',
      emailServiceHealthy,
      `HTML generated successfully: ${testHtml.length} bytes, contains official school title and token`
    );

    // Clean up created test entities so no test records linger
    await prisma.passwordResetToken.deleteMany({
      where: { userId: { in: [testUser.id, testAdmin.id, studentUser.id, parentUser.id, deactUser.id] } },
    });
    await prisma.userSession.deleteMany({
      where: { userId: { in: [testUser.id, testAdmin.id, studentUser.id, parentUser.id, deactUser.id] } },
    });
    await prisma.passwordHistory.deleteMany({
      where: { userId: { in: [testUser.id, testAdmin.id, studentUser.id, parentUser.id, deactUser.id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [testUser.id, testAdmin.id, studentUser.id, parentUser.id, deactUser.id] } },
    });

  } catch (err) {
    console.error('\n❌ FATAL ERROR DURING TEST EXECUTION:', err);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n======================================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  console.log(`TEST SUITE SUMMARY: ${passed}/${total} PASSED, ${failed} FAILED`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSuite();
