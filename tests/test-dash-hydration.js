const puppeteer = require('puppeteer-core');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const user = await p.user.findFirst({ where: { role: 'ADMIN' } });
  const sessionId = 'test-debug-' + Date.now();
  await p.userSession.create({
    data: {
      sessionId,
      userId: user.id,
      ipAddress: '127.0.0.1',
      userAgent: 'test',
      browser: 'Chrome',
      operatingSystem: 'Win',
      device: 'PC',
      refreshTokenHash: sessionId,
      expiresAt: new Date(Date.now() + 86400000),
    },
  });

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
  });
  const page = await browser.newPage();
  await page.setCookie({
    name: 'mssms_session_id',
    value: sessionId,
    domain: 'localhost',
    path: '/',
  });

  await page.evaluateOnNewDocument((u) => {
    localStorage.setItem('markazu_current_user', JSON.stringify(u));
    localStorage.setItem('markazu_session_token', 'jwt-token-' + u.id);
  }, {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role,
    status: 'ACTIVE',
  });

  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  const text = await page.evaluate(() => document.body.innerText);
  console.log('Text length with localStorage:', text.length);
  console.log('Snippet:', text.slice(0, 300));

  await browser.close();
  await p.$disconnect();
}

main().catch(err => {
  console.error(err);
  p.$disconnect();
});
