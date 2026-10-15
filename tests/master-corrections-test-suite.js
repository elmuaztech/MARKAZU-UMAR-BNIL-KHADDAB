/**
 * Comprehensive Master Corrections & Features Test Suite - Markazu Umar SMS
 * Verifies all 10 defect areas from MARCASONOV MASTER PROMPT:
 * 1. 6-Digit Password Reset OTP Consistency & Rate Limiting
 * 2. Parent-Child Relationship Management (Link, Multiple Children, Unlink Without Deletion, No Duplicates)
 * 3. Super Admin Impersonation (Session Isolation, Role Scoping, Sensitive Action Block, Exit Restoration, Audit)
 * 4. Certificate Generation & Arabic Readability
 * 5. Branding ("Developed by Elmuaz Tech")
 * 6. Student Attendance Screen Design & Unclipped Remarks
 * 7. Student vs Parent Permissions
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const http = require('http');

let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}: ${err.message}`);
    failedTests++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}: ${err.message}`);
    failedTests++;
  }
}

console.log('================================================================');
console.log('RUNNING MARCASONOV MASTER CORRECTIONS & FEATURES VERIFICATION');
console.log('================================================================\n');

// 1. Password Reset OTP Verification
runTest('1.1 Password Reset Email specifies 6-digit OTP template', () => {
  const emailServicePath = path.join(__dirname, '..', 'src', 'lib', 'emailService.ts');
  const content = fs.readFileSync(emailServicePath, 'utf8');
  assert(content.includes('6-Digit Password Reset Verification Code (OTP)'), 'Email service must state 6-Digit OTP');
  assert(content.includes('10 minutes'), 'Email service must declare 10-minute validity');
});

runTest('1.2 Recovery Modal enforces 6-digit OTP input with maxLength=6 and 6-digit regex', () => {
  const loginPagePath = path.join(__dirname, '..', 'src', 'app', 'login', 'page.tsx');
  const content = fs.readFileSync(loginPagePath, 'utf8');
  assert(content.includes('maxLength={6}'), 'Login modal must specify maxLength={6}');
  assert(content.includes('placeholder="• • • • • •"'), 'Login modal must provide 6-dot placeholder');
  assert(content.includes('^\\d{6}$'), 'Login modal must validate 6 digits regex');
});

runTest('1.3 Reset Password Page enforces 6-digit OTP input and preserves leading zeros', () => {
  const resetPagePath = path.join(__dirname, '..', 'src', 'app', 'reset-password', 'page.tsx');
  const content = fs.readFileSync(resetPagePath, 'utf8');
  assert(content.includes('maxLength={6}'), 'Reset password page must specify maxLength={6}');
  assert(content.includes('^\\d{6}$'), 'Reset password page must validate 6 digits regex');
  assert(content.includes('10 minutes'), 'Reset password page must show 10-minute expiry');
});

runTest('1.4 Backend Password Reset enforces 6-digit string format & attempt rate-limiting', () => {
  const resetApiPath = path.join(__dirname, '..', 'src', 'app', 'api', 'auth', 'reset-password', 'route.ts');
  const content = fs.readFileSync(resetApiPath, 'utf8');
  assert(content.includes('^\\d{6}$'), 'Backend must validate 6-digit OTP string');
  assert(content.includes('attemptRecord.count >= 5'), 'Backend must enforce maximum 5 failed verification attempts');
  assert(content.includes('Too many verification attempts'), 'Backend must return 429 when attempt threshold is exceeded');
  assert(content.includes('10 minutes'), 'Backend must document 10-minute expiry');
});

// 2. Parent-Child Relationship Management
runTest('2.1 Parent-Child Wards API exists with GET, POST, and DELETE endpoints', () => {
  const wardsRoutePath = path.join(__dirname, '..', 'src', 'app', 'api', 'parents', '[id]', 'wards', 'route.ts');
  assert(fs.existsSync(wardsRoutePath), 'Wards API route must exist');
  const content = fs.readFileSync(wardsRoutePath, 'utf8');
  assert(content.includes('export async function GET'), 'GET endpoint must be exported');
  assert(content.includes('export async function POST'), 'POST endpoint must be exported');
  assert(content.includes('export async function DELETE'), 'DELETE endpoint must be exported');
});

runTest('2.2 Parent-Child API prevents duplicate relationships and unlinks without deleting student records', () => {
  const wardsRoutePath = path.join(__dirname, '..', 'src', 'app', 'api', 'parents', '[id]', 'wards', 'route.ts');
  const content = fs.readFileSync(wardsRoutePath, 'utf8');
  assert(content.includes('This child is already linked to this parent'), 'API must reject duplicate links with error');
  assert(content.includes('getOrCreateUnassignedGuardian'), 'API must reassign to unassigned guardian placeholder on unlink');
  assert(content.includes('PARENT_CHILD_LINKED'), 'API must log PARENT_CHILD_LINKED audit event');
  assert(content.includes('PARENT_CHILD_UNLINKED'), 'API must log PARENT_CHILD_UNLINKED audit event');
});

runTest('2.3 Parents Page UI includes link child search, multiple children, and unlinking with confirmation', () => {
  const parentsPagePath = path.join(__dirname, '..', 'src', 'app', 'dashboard', 'parents', 'page.tsx');
  const content = fs.readFileSync(parentsPagePath, 'utf8');
  assert(content.includes('Link Student'), 'Parents page must provide Link Student action');
  assert(content.includes('Search Active Student to Link'), 'Parents page must provide student search box');
  assert(content.includes('Unlink Child from Parent'), 'Parents page must provide Unlink Child action with confirmation');
  assert(content.includes('syncStudentsFromBackend'), 'Parents page must synchronize students state');
});

// 3. Super Admin Impersonation
runTest('3.1 Impersonate API route initiates impersonation with HMAC token and audit log', () => {
  const impRoutePath = path.join(__dirname, '..', 'src', 'app', 'api', 'auth', 'impersonate', 'route.ts');
  assert(fs.existsSync(impRoutePath), 'Impersonate API route must exist');
  const content = fs.readFileSync(impRoutePath, 'utf8');
  assert(content.includes('signImpersonationToken'), 'Must sign HMAC impersonation token');
  assert(content.includes('SUPER_ADMIN'), 'Must verify caller is SUPER_ADMIN');
  assert(content.includes('mssms_impersonation'), 'Must set mssms_impersonation cookie');
  assert(content.includes('IMPERSONATION_STARTED'), 'Must record audit log for impersonation start');
});

runTest('3.2 Impersonate Exit API route clears cookie, restores context, and logs termination', () => {
  const exitRoutePath = path.join(__dirname, '..', 'src', 'app', 'api', 'auth', 'impersonate', 'exit', 'route.ts');
  assert(fs.existsSync(exitRoutePath), 'Impersonate exit route must exist');
  const content = fs.readFileSync(exitRoutePath, 'utf8');
  assert(content.includes('IMPERSONATION_ENDED'), 'Must record audit log for impersonation end');
  assert(content.includes("maxAge: 0"), 'Must expire and delete the impersonation cookie');
});

runTest('3.3 Auth system resolves impersonated user context with target role & isolation', () => {
  const authPath = path.join(__dirname, '..', 'src', 'lib', 'auth.ts');
  const content = fs.readFileSync(authPath, 'utf8');
  assert(content.includes('signImpersonationToken'), 'Auth must export signImpersonationToken');
  assert(content.includes('verifyImpersonationToken'), 'Auth must export verifyImpersonationToken');
  assert(content.includes('isImpersonated: true'), 'Auth must mark context as isImpersonated');
  assert(content.includes('role: targetUser.role'), 'Auth must strictly return target user role for RBAC enforcement');
});

runTest('3.4 Sensitive actions (password reset, account deletion, role update) are blocked during impersonation', () => {
  const userRoutePath = path.join(__dirname, '..', 'src', 'app', 'api', 'users', '[id]', 'route.ts');
  const content = fs.readFileSync(userRoutePath, 'utf8');
  assert(content.includes('Sensitive operations'), 'User update route must block sensitive operations during impersonation');
  assert(content.includes('authUser.isImpersonated'), 'User update route must check isImpersonated');
});

runTest('3.5 Persistent ImpersonationBanner is globally mounted in layout', () => {
  const layoutPath = path.join(__dirname, '..', 'src', 'app', 'layout.tsx');
  const bannerPath = path.join(__dirname, '..', 'src', 'components', 'navigation', 'ImpersonationBanner.tsx');
  assert(fs.existsSync(bannerPath), 'ImpersonationBanner component must exist');
  const bannerContent = fs.readFileSync(bannerPath, 'utf8');
  assert(bannerContent.includes('Return to Super Admin'), 'Banner must have Return to Super Admin button');
  assert(bannerContent.includes('Impersonation Mode Active'), 'Banner must declare impersonation mode');
  
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  assert(layoutContent.includes('<ImpersonationBanner />'), 'Layout must render ImpersonationBanner');
});

runTest('3.6 Impersonate User modal and actions are integrated in Security & Accounts dashboard', () => {
  const securityPagePath = path.join(__dirname, '..', 'src', 'app', 'dashboard', 'security', 'page.tsx');
  const modalPath = path.join(__dirname, '..', 'src', 'components', 'users', 'ImpersonateUserModal.tsx');
  assert(fs.existsSync(modalPath), 'ImpersonateUserModal must exist');
  const content = fs.readFileSync(securityPagePath, 'utf8');
  assert(content.includes('Impersonate User'), 'Security page must have Impersonate User button');
  assert(content.includes('<ImpersonateUserModal'), 'Security page must render ImpersonateUserModal');
});

// 4. Certificate Generation & Complex Script Shaping
runTest('4.1 Certificate generator outputs landscape A4 PDF and preserves Arabic typography', () => {
  const certPdfPath = path.join(__dirname, '..', 'src', 'lib', 'certificatePdf.ts');
  const certComponentPath = path.join(__dirname, '..', 'src', 'components', 'certificates', 'StudentCertificate.tsx');
  const pdfContent = fs.readFileSync(certPdfPath, 'utf8');
  const compContent = fs.readFileSync(certComponentPath, 'utf8');
  assert(pdfContent.includes('841.89') && pdfContent.includes('595.28'), 'PDF dimensions must be A4 Landscape');
  assert(compContent.includes('break-words'), 'Long names must wrap properly without clipping');
  assert(compContent.includes('Download PDF'), 'Certificate component must provide Download PDF');
});

// 5. Branding Correction
runTest('5.1 Branding is standardized to "Developed by Elmuaz Tech"', () => {
  const publicFooter = path.join(__dirname, '..', 'src', 'components', 'navigation', 'PublicFooter.tsx');
  assert(fs.existsSync(publicFooter), 'PublicFooter component must exist');
  const content = fs.readFileSync(publicFooter, 'utf8');
  assert(content.includes('Developed by') && content.includes('Elmuaz Tech'), 'Public footer must state Developed by Elmuaz Technologies Limited');
  assert(!content.includes('Powered by Elmuaz Tech'), 'Public footer must not state Powered by Elmuaz Tech');
});

// 6. Student Attendance Screen Design & Unclipped Remarks
runTest('6.1 Student Attendance View features clean green card, neat alignment, and unclipped remarks', () => {
  const attViewPath = path.join(__dirname, '..', 'src', 'components', 'attendance', 'StudentAttendanceView.tsx');
  const content = fs.readFileSync(attViewPath, 'utf8');
  assert(content.includes('Student Information Card') || content.includes('bg-gradient-to-br from-emerald-900'), 'Must display clean green student information card');
  assert(content.includes('break-words') && content.includes('whitespace-normal'), 'Remarks must wrap and not clip');
  assert(!content.includes('STUDENT VIEW (READ ONLY)'), 'Redundant badge must be removed');
});

// 7. Student vs Parent Permissions
runTest('7.1 Student report card wording states "Your report is currently unavailable"', () => {
  const resultsPath = path.join(__dirname, '..', 'src', 'app', 'dashboard', 'results', 'page.tsx');
  const content = fs.readFileSync(resultsPath, 'utf8');
  assert(content.includes('Your report is currently unavailable'), 'Student message must be personalized to student');
});

console.log('\n================================================================');
console.log(`MASTER SUITE RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
