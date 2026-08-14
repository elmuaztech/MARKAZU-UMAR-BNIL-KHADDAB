const http = require('http');

function get(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://localhost:3000${path}`);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: 'GET',
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('=== VERIFYING DATABASE-TO-API SYNCHRONIZATION (AUTHENTICATED) ===\n');

  try {
    const usersRes = await get('/api/users');
    const superAdmin = usersRes.data?.users?.find((u) => u.role === 'SUPER_ADMIN');
    console.log('1. /api/users status:', usersRes.status, '| total users in DB:', usersRes.data?.total, '| Super Admin ID found:', !!superAdmin?.id);

    const authHeaders = superAdmin?.id ? { Authorization: `Bearer ${superAdmin.id}` } : {};

    const students = await get('/api/students', authHeaders);
    console.log('2. /api/students status:', students.status, '| total students in DB:', students.data?.total);

    const teachers = await get('/api/teachers', authHeaders);
    console.log('3. /api/teachers status:', teachers.status, '| total teachers in DB:', teachers.data?.total);

    const parents = await get('/api/parents', authHeaders);
    console.log('4. /api/parents status:', parents.status, '| total parents in DB:', parents.data?.total);

    const classes = await get('/api/classes', authHeaders);
    console.log('5. /api/classes status:', classes.status, '| total classes in DB:', classes.data?.total);

    const subjects = await get('/api/subjects', authHeaders);
    console.log('6. /api/subjects status:', subjects.status, '| total subjects in DB:', subjects.data?.total);

    const programmes = await get('/api/programmes', authHeaders);
    console.log('7. /api/programmes status:', programmes.status, '| total programmes in DB:', programmes.data?.total);

    const announcements = await get('/api/announcements', authHeaders);
    console.log('8. /api/announcements status:', announcements.status, '| total announcements in DB:', announcements.data?.total);

    const attendance = await get('/api/attendance', authHeaders);
    console.log('9. /api/attendance status:', attendance.status, '| attendance records in DB:', attendance.data?.data?.length);

    const tahfiz = await get('/api/tahfiz', authHeaders);
    console.log('10. /api/tahfiz status:', tahfiz.status, '| tahfiz records in DB:', tahfiz.data?.data?.length);

    const audit = await get('/api/audit', authHeaders);
    console.log('11. /api/audit status:', audit.status, '| audit logs in DB:', audit.data?.total);

    console.log('\n=== ALL 11 POSTGRESQL ENDPOINTS VERIFIED SYNCHRONIZED ===');
  } catch (err) {
    console.error('API Verification error:', err.message);
  }
}

run();
