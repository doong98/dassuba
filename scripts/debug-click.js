const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function test() {
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: 'new' });
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err));

  await page.goto('http://127.0.0.1:3000/admin/products');
  await new Promise(r => setTimeout(r, 3000));

  const res = await page.evaluate(() => {
    const btn = document.querySelector('button[data-testid="open-add-modal-btn"]');
    if (!btn) return { found: false };
    const rect = btn.getBoundingClientRect();
    return {
      found: true,
      html: btn.outerHTML,
      text: btn.innerText,
      rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height }
    };
  });
  console.log('Res:', res);

  await new Promise(r => setTimeout(r, 1000));
  const hasModal = await page.evaluate(() => {
    return !!document.querySelector('input[data-testid="product-title-input"]');
  });
  console.log('HasModal:', hasModal);
  await browser.close();
}
test();
