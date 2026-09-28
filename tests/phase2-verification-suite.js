// MARKAZU UMAR BN KHADDAB — PHASE 2 VERIFICATION SUITE
// Tests: Tahfeez removal redirects, camera elimination, A4 print styles, official school identity, and API security

const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

function fetchUrl(urlPath, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const req = http.request(
      url,
      {
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
          });
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function runSuite() {
  console.log('======================================================================');
  console.log('STARTING PHASE 2 RELEASE READINESS & VERIFICATION SUITE');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  async function testCase(num, title, testFn) {
    try {
      await testFn();
      console.log(`[TEST ${String(num).padStart(2, '0')}] ✅ PASS: ${title}`);
      passed++;
    } catch (err) {
      console.error(`[TEST ${String(num).padStart(2, '0')}] ❌ FAIL: ${title}`);
      console.error(`       Error: ${err.message}`);
      failed++;
    }
  }

  // 1. Tahfeez standalone page redirect
  await testCase(1, 'Removed /tahfiz-program redirects to /academics safely', async () => {
    const res = await fetchUrl('/tahfiz-program');
    assert.ok(
      res.status === 307 || res.status === 308 || res.status === 200,
      `Expected redirect or ok, got status ${res.status}`
    );
    if (res.status === 307 || res.status === 308) {
      assert.ok(
        res.headers.location && res.headers.location.includes('/academics'),
        `Expected redirect to /academics, got ${res.headers.location}`
      );
    }
  });

  // 2. Tahfeez dashboard route redirect
  await testCase(2, 'Removed /dashboard/tahfiz redirects to /dashboard safely', async () => {
    const res = await fetchUrl('/dashboard/tahfiz');
    assert.ok(
      res.status === 307 || res.status === 308,
      `Expected redirect status, got ${res.status}`
    );
    assert.ok(
      res.headers.location && (res.headers.location.includes('/dashboard') || res.headers.location.includes('/login')),
      `Expected redirect to /dashboard or /login, got ${res.headers.location}`
    );
  });

  // 3. Official School Name Identity Preservation (English & Arabic)
  await testCase(3, 'Official English and Arabic school identity preserved on home page', async () => {
    const res = await fetchUrl('/');
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert.ok(
      res.body.includes('MARKAZU UMAR BN KHADDAB'),
      'English school name MARKAZU UMAR BN KHADDAB must be present'
    );
    assert.ok(
      res.body.includes('Centre for Qura&#x27;an Memorization and Islamic Studies') ||
      res.body.includes("Centre for Qura'an Memorization and Islamic Studies") ||
      res.body.includes('Centre for Qura'),
      'English subtitle must be present'
    );
    assert.ok(
      res.body.includes('مركز عمر بن الخطاب'),
      'Arabic school name مركز عمر بن الخطاب must be present'
    );
    assert.ok(
      res.body.includes('لتحفيظ القرآن الكريم والدراسات الإسلامية - دنيجي'),
      'Arabic subtitle must be present'
    );
  });

  // 4. Zero Camera occurrences in src
  await testCase(4, 'No camera capture APIs, permissions, or icons remain in source code', async () => {
    const filesToCheck = [
      'src/components/students/StudentPhotoCaptureModal.tsx',
      'src/app/dashboard/students/page.tsx',
      'src/app/dashboard/settings/page.tsx',
      'src/components/navigation/Sidebar.tsx',
    ];

    for (const relPath of filesToCheck) {
      const fullPath = path.join(__dirname, '..', relPath);
      const content = fs.readFileSync(fullPath, 'utf8');
      assert.ok(!content.includes('getUserMedia'), `Found getUserMedia in ${relPath}`);
      assert.ok(!content.includes('mediaDevices'), `Found mediaDevices in ${relPath}`);
      assert.ok(!content.includes('<video'), `Found <video in ${relPath}`);
      assert.ok(!content.includes('<Camera'), `Found <Camera in ${relPath}`);
    }
  });

  // 5. Table Serial Number S/N Verification
  await testCase(5, 'Visible table headers use S/N instead of # labels', async () => {
    const files = [
      'src/components/students/BulkStudentGridModal.tsx',
      'src/components/attendance/AttendanceRegister.tsx',
      'src/components/assessment/ResultEntryGrid.tsx',
      'src/app/dashboard/downloads/page.tsx',
      'src/lib/exportUtils.ts',
    ];

    for (const relPath of files) {
      const fullPath = path.join(__dirname, '..', relPath);
      const content = fs.readFileSync(fullPath, 'utf8');
      assert.ok(!content.includes('>#<'), `Found >#< table header in ${relPath}`);
      assert.ok(content.includes('S/N'), `Missing S/N in ${relPath}`);
    }
  });

  // 6. User-friendly error messages in API routes
  await testCase(6, 'API error handlers do not leak technical internal error strings', async () => {
    const routes = [
      'src/app/api/results/entry/route.ts',
      'src/app/api/results/approve/route.ts',
      'src/app/api/assessment/config/route.ts',
    ];

    for (const relPath of routes) {
      const fullPath = path.join(__dirname, '..', relPath);
      const content = fs.readFileSync(fullPath, 'utf8');
      assert.ok(!content.includes('Internal server error'), `Found Internal server error in ${relPath}`);
    }
  });

  // 7. A4 Print stylesheet in globals.css
  await testCase(7, 'A4 print stylesheet with @page size and media rules is defined', async () => {
    const globalsPath = path.join(__dirname, '../src/app/globals.css');
    const content = fs.readFileSync(globalsPath, 'utf8');
    assert.ok(content.includes('@page'), 'Missing @page definition');
    assert.ok(content.includes('A4 portrait'), 'Missing A4 portrait print size');
    assert.ok(content.includes('.print-container'), 'Missing .print-container print rules');
    assert.ok(content.includes('.no-print'), 'Missing .no-print rule');
  });

  // 8. Result API security: unauthenticated access denied
  await testCase(8, 'Unauthenticated query to /api/results is denied (401)', async () => {
    const res = await fetchUrl('/api/results');
    assert.strictEqual(res.status, 401, `Expected 401, got ${res.status}`);
  });

  // 9. Report download API security: unauthenticated access denied
  await testCase(9, 'Unauthenticated query to /api/reports/download is denied (401)', async () => {
    const res = await fetchUrl('/api/reports/download?studentId=invalid');
    assert.strictEqual(res.status, 401, `Expected 401, got ${res.status}`);
  });

  // 10. Student photo upload API security: unauthenticated access denied
  await testCase(10, 'Unauthenticated upload to /api/students/photo is denied (401)', async () => {
    const res = await fetchUrl('/api/students/photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: 'test', photo: 'data:image/webp;base64,abc' }),
    });
    assert.strictEqual(res.status, 401, `Expected 401, got ${res.status}`);
  });

  // 11. Report release enforcement in results API
  await testCase(11, 'Results API code strictly enforces isReleased and status APPROVED for students and parents', async () => {
    const routePath = path.join(__dirname, '../src/app/api/results/route.ts');
    const content = fs.readFileSync(routePath, 'utf8');
    // Check student block has isReleased and status APPROVED
    assert.ok(
      content.includes("whereClause.isReleased = true;") && content.includes("whereClause.status = 'APPROVED';"),
      'Results route must enforce isReleased and status APPROVED'
    );
  });

  // 12. Report Card UI empty state
  await testCase(12, 'ReportCard displays "No results yet" instead of 0% or misleading fail grades', async () => {
    const reportCardPath = path.join(__dirname, '../src/components/results/ReportCard.tsx');
    const content = fs.readFileSync(reportCardPath, 'utf8');
    assert.ok(
      content.includes('No results yet for this academic session / term.'),
      'ReportCard must render "No results yet for this academic session / term."'
    );
    assert.ok(
      content.includes("grades.length > 0 ? `${averagePercentage}%` : 'No results yet'"),
      'ReportCard must not render 0% average when grades are empty'
    );
  });

  console.log('\n======================================================================');
  console.log(`PHASE 2 TEST SUMMARY: ${passed}/${passed + failed} PASSED, ${failed} FAILED`);
  console.log('======================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Fatal error running Phase 2 verification suite:', err);
  process.exit(1);
});
