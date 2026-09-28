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

  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
  console.log('Final URL after navigating to /dashboard:', page.url());

  const title = await page.title();
  console.log('Page Title:', title);

  const text = await page.evaluate(() => document.body.innerText);
  console.log('Text length:', text.length);
  console.log('Content snippet:', text.slice(0, 400));

  await browser.close();
  await p.$disconnect();
}

main().catch(err => {
  console.error(err);
  p.$disconnect();
});
