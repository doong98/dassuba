const puppeteer = require('puppeteer-core');

async function test() {
  const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new' });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/admin/materials', { waitUntil: 'networkidle2' });

  // 모달 열기
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text.includes('거래처 발주서 생성')) {
      await b.click();
      break;
    }
  }

  await page.waitForSelector('form');
  const formHtml = await page.evaluate(() => document.querySelector('form').outerHTML);
  console.log('FORM HTML:\n', formHtml);
  await browser.close();
}

test().catch(console.error);
