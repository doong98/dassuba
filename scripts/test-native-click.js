const puppeteer = require('puppeteer-core');

async function testNativeClick() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new'
  });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

  await page.goto('http://localhost:3000/admin/materials', { waitUntil: 'networkidle2' });

  // 상단 버튼 클릭
  console.log('1. 모달 열기 버튼 찾기 및 클릭');
  const openButtons = await page.$$('button');
  for (const b of openButtons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text.includes('거래처 발주서 생성')) {
      await b.click();
      break;
    }
  }

  console.log('2. 폼 대기');
  await page.waitForSelector('form button[type="submit"]', { visible: true });

  console.log('3. 제출 버튼 실제 마우스 클릭');
  await page.click('form button[type="submit"]');

  console.log('4. 응답 대기');
  await new Promise(r => setTimeout(r, 2500));

  const rows = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('table')[1]?.querySelectorAll('tbody tr')).map(tr => tr.textContent.trim());
  });
  console.log('제출 후 대장 행 수:', rows.length);
  console.log('최신 발주서:', rows[0]);

  await browser.close();
}

testNativeClick().catch(console.error);
