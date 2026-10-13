const puppeteer = require('puppeteer-core');

async function test() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new'
  });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

  await page.goto('http://localhost:3000/admin/materials', { waitUntil: 'networkidle2' });

  // 모달 열기
  const clickedOpen = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && b.textContent.includes('거래처 발주서 생성'));
    if (btn) { btn.click(); return true; }
    return false;
  });
  console.log('Open modal clicked:', clickedOpen);

  await page.waitForSelector('form');

  // Submit button 클릭
  const submitResult = await page.evaluate(() => {
    const form = document.querySelector('form');
    if (!form) return 'no form';
    const btn = form.querySelector('button[type="submit"]');
    if (!btn) return 'no submit btn';
    btn.click();
    return 'submit btn clicked: ' + btn.textContent.trim();
  });
  console.log('Submit button clicked:', submitResult);

  await new Promise(r => setTimeout(r, 2000));

  // 테이블 행 수 확인
  const rows = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('table')[1]?.querySelectorAll('tbody tr')).map(tr => tr.textContent.trim());
  });
  console.log('PO Rows count after submit:', rows.length);
  rows.forEach((r, idx) => console.log(` [${idx + 1}] ${r}`));

  await browser.close();
}

test().catch(console.error);
