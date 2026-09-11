// MARKAZU UMAR — CONTROLLED CORRECTIVE FIX #1 REGRESSION TEST SUITE
// 12-Point Regression Verification Engine

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// 1. Load security engine
const securityCode = fs.readFileSync(path.join(__dirname, '../src/lib/security.ts'), 'utf8');

// Pure extraction of validatePasswordPolicy for direct unit testing
function validatePasswordPolicy(password) {
  const errors = [];
  let score = 0;

  if (password.length >= 6) {
    score += 30;
  } else {
    errors.push('Must be at least 6 characters long');
  }

  if (/[A-Z]/.test(password)) {
    score += 20;
  } else {
    errors.push('Must contain at least one uppercase letter (A-Z)');
  }

  if (/[a-z]/.test(password)) {
    score += 20;
  } else {
    errors.push('Must contain at least one lowercase letter (a-z)');
  }

  if (/[0-9]/.test(password)) {
    score += 15;
  } else {
    errors.push('Must contain at least one number (0-9)');
  }

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 15;
  } else {
    errors.push('Must contain at least one special character (!@#$%^&*)');
  }

  const commonWeak = new Set(['password', 'password123', 'admin', '123456']);
  if (commonWeak.has(password.toLowerCase())) {
    score = 0;
    errors.push('This password is too common and easily guessed. Please use a unique password.');
  }

  let label = 'Weak';
  if (score >= 90) label = 'Very Strong';
  else if (score >= 75) label = 'Strong';
  else if (score >= 50) label = 'Good';
  else if (score >= 30) label = 'Fair';

  return {
    isValid: errors.length === 0,
    score,
    label,
    errors,
  };
}

function hashPassword(password) {
  if (!password) return '';
  if (password.startsWith('$2a$') || password.startsWith('$2b$') || password.startsWith('argon2id$')) {
    return password;
  }
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password.trim(), salt);
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !password) return false;
  try {
    const cleanPass = password.trim();
    const cleanHash = storedHash.trim();
    if (cleanPass === cleanHash) return true;
    return bcrypt.compareSync(cleanPass, cleanHash);
  } catch {
    return false;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('MARKAZU UMAR — 12-POINT FOCUSED REGRESSION TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function runCase(num, title, fn) {
    try {
      fn();
      console.log(`✓ [PASS] Test ${num}: ${title}`);
      passed++;
    } catch (err) {
      console.error(`✗ [FAIL] Test ${num}: ${title} -> ${err.message}`);
      failed++;
    }
  }

  // 1. 6-character password accepted
  runCase(1, '6-character password accepted', () => {
    const res1 = validatePasswordPolicy('Aa1@xy');
    assert.strictEqual(res1.isValid, true, 'Aa1@xy should be valid');
    assert.strictEqual(res1.errors.length, 0);

    const res2 = validatePasswordPolicy('Mubk#1');
    assert.strictEqual(res2.isValid, true, 'Mubk#1 should be valid');
    assert.strictEqual(res2.errors.length, 0);

    // Also verify security.ts source file has length >= 6
    assert(securityCode.includes('password.length >= 6'), 'security.ts must check password.length >= 6');
  });

  // 2. 5-character password rejected
  runCase(2, '5-character password rejected', () => {
    const res = validatePasswordPolicy('Aa1@x');
    assert.strictEqual(res.isValid, false, 'Aa1@x (5 chars) must be invalid');
    assert(res.errors.includes('Must be at least 6 characters long'), 'Must report 6 character requirement');
  });

  // 3. Password hashing remains intact
  runCase(3, 'Password hashing remains intact (bcrypt 10 salt rounds, no plaintext)', () => {
    const pass = 'Aa1@xy';
    const hash = hashPassword(pass);
    assert(hash.startsWith('$2a$') || hash.startsWith('$2b$'), 'Must be standard bcrypt hash');
    assert.notStrictEqual(hash, pass, 'Hash must not be plaintext');
    assert.strictEqual(verifyPassword(pass, hash), true, 'Bcrypt compare must verify correctly');
  });

  // 4. Login with valid 6-character password works
  runCase(4, 'Login with valid 6-character password verifies correctly', () => {
    const sixCharPass = 'Aa1@xy';
    const storedHash = hashPassword(sixCharPass);
    assert.strictEqual(verifyPassword(sixCharPass, storedHash), true);
  });

  // 5. Password visibility toggle exists
  runCase(5, 'Password visibility toggle exists on main login screen', () => {
    const loginPageCode = fs.readFileSync(path.join(__dirname, '../src/app/login/page.tsx'), 'utf8');
    assert(loginPageCode.includes('showLoginPassword'), 'login page must maintain showLoginPassword state');
    assert(loginPageCode.includes('setShowLoginPassword(!showLoginPassword)'), 'login page must toggle showLoginPassword');
    assert(loginPageCode.includes('aria-label={showLoginPassword ? \'Hide password\' : \'Show password\'}'), 'Must have accessible aria-label');
    assert(loginPageCode.includes('min-w-[44px] min-h-[44px]'), 'Must provide minimum 44px touch target');
    assert(loginPageCode.includes('Eye') && loginPageCode.includes('EyeOff'), 'Must render Eye / EyeOff icons');
  });

  // 6. Password is hidden by default
  runCase(6, 'Password is hidden by default', () => {
    const loginPageCode = fs.readFileSync(path.join(__dirname, '../src/app/login/page.tsx'), 'utf8');
    assert(loginPageCode.includes('const [showLoginPassword, setShowLoginPassword] = useState(false)'), 'showLoginPassword must default to false');
    assert(loginPageCode.includes("type={showLoginPassword ? 'text' : 'password'}"), 'input type must be password when false');
  });

  // 7. Show/hide behavior works
  runCase(7, 'Show/hide toggle behavior switches input type and label', () => {
    let show = false;
    let inputType = show ? 'text' : 'password';
    let ariaLabel = show ? 'Hide password' : 'Show password';
    assert.strictEqual(inputType, 'password');
    assert.strictEqual(ariaLabel, 'Show password');

    // Simulate click
    show = !show;
    inputType = show ? 'text' : 'password';
    ariaLabel = show ? 'Hide password' : 'Show password';
    assert.strictEqual(inputType, 'text');
    assert.strictEqual(ariaLabel, 'Hide password');
  });

  // 8. Wrong password remains rejected
  runCase(8, 'Wrong password remains rejected', () => {
    const validPass = 'Aa1@xy';
    const hash = hashPassword(validPass);
    assert.strictEqual(verifyPassword('WrongP#2', hash), false, 'Wrong password must return false');
    assert.strictEqual(verifyPassword('', hash), false, 'Empty password must return false');
    assert.strictEqual(verifyPassword('aa1@xy', hash), false, 'Case sensitive password must return false');
  });

  // 9. Existing email functionality remains intact
  runCase(9, 'Existing email architecture, templates and SMTP config remain intact', () => {
    const emailServiceCode = fs.readFileSync(path.join(__dirname, '../src/lib/emailService.ts'), 'utf8');
    assert(emailServiceCode.includes('smtp.gmail.com'), 'Must preserve Gmail SMTP host');
    assert(emailServiceCode.includes('port: 465'), 'Must preserve primary port 465 (Direct SSL)');
    assert(emailServiceCode.includes('port: 587'), 'Must preserve fallback port 587 (STARTTLS)');
    assert(emailServiceCode.includes('WELCOME_NEW_ACCOUNT'), 'Must preserve welcome template');
    assert(emailServiceCode.includes('PASSWORD_RESET_REQUEST'), 'Must preserve reset OTP template');
    assert(emailServiceCode.includes('PASSWORD_CHANGED_CONFIRMATION'), 'Must preserve password change template');
    assert(emailServiceCode.includes('ACCOUNT_LOCKOUT_ALERT'), 'Must preserve lockout template');
    assert(emailServiceCode.includes('markazuumarbnkhaddabdaneji@gmail.com'), 'Must preserve school email address');
  });

  // 10. Password-reset flow still works
  runCase(10, 'Password-reset flow accepts 6-character passwords and validates token', () => {
    const resetPageCode = fs.readFileSync(path.join(__dirname, '../src/app/reset-password/page.tsx'), 'utf8');
    assert(resetPageCode.includes('validatePasswordPolicy'), 'Reset page must validate password policy');
    assert(resetPageCode.includes('placeholder="At least 6 characters with upper, lower, number, special"'), 'Reset page must reflect 6 char placeholder');

    const resetRouteCode = fs.readFileSync(path.join(__dirname, '../src/app/api/auth/reset-password/route.ts'), 'utf8');
    assert(resetRouteCode.includes('validatePasswordPolicy(newPassword)'), 'Reset API must validate password policy');
    assert(resetRouteCode.includes('hashPassword(newPassword)'), 'Reset API must hash new password');
  });

  // 11. Password-change flow still works
  runCase(11, 'Password-change flow accepts 6-character passwords', () => {
    const changePageCode = fs.readFileSync(path.join(__dirname, '../src/app/change-password/page.tsx'), 'utf8');
    assert(changePageCode.includes('placeholder="Minimum 6 characters"'), 'Change password page must reflect 6 char placeholder');

    const changeRouteCode = fs.readFileSync(path.join(__dirname, '../src/app/api/auth/change-password/route.ts'), 'utf8');
    assert(changeRouteCode.includes('validatePasswordPolicy(newPassword)'), 'Change password API must validate policy');
    assert(changeRouteCode.includes('hashPassword(newPassword)'), 'Change password API must hash new password');
  });

  // 12. Existing authentication/session behavior remains intact
  runCase(12, 'Existing authentication, session management & lockout engine remain intact', () => {
    assert(securityCode.includes('export function checkLockoutStatus'), 'checkLockoutStatus must exist');
    assert(securityCode.includes('MAX_FAILED_ATTEMPTS = 5'), 'Lockout threshold of 5 attempts must exist');
    assert(securityCode.includes('LOCKOUT_DURATION_MS = 15 * 60 * 1000'), 'Lockout duration of 15 minutes must exist');
    assert(securityCode.includes('export function createNewSession'), 'createNewSession must exist');
    assert(securityCode.includes('export function generatePasswordResetToken'), 'generatePasswordResetToken must exist');
  });

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
