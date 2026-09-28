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
  
  // Listen to console and page errors
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.setCookie({
    name: 'mssms_session_id',
    value: sessionId,
    domain: 'localhost',
    path: '/',
  });

  const res = await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
  console.log('HTTP Status:', res.status());
  console.log('Final URL:', page.url());
  const html = await page.content();
  console.log('HTML length:', html.length);
  console.log('HTML snippet:', html.slice(0, 500));

  await browser.close();
  await p.$disconnect();
}

main().catch(err => {
  console.error(err);
  p.$disconnect();
});
