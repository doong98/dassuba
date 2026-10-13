const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('requestfailed', req => console.log('REQ FAILED:', req.url(), req.failure().errorText));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  console.log('--- Page loaded ---');
  // Check heart buttons count
  const count = await page.evaluate(() => {
    const btns = document.querySelectorAll('button[aria-label="위시리스트 토글"]');
    return btns.length;
  });
  console.log('Wish buttons found:', count);

  // Check initial state
  const beforeCheck = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="위시리스트 토글"]');
    const svg = btn ? btn.querySelector('svg') : null;
    const badge = document.querySelector('a[href="/mypage/wishlist"] .bg-red-500');
    return {
      svgClass: svg ? svg.getAttribute('class') : '',
      badgeText: badge ? badge.innerText : null,
      localStorage: localStorage.getItem('dasseoba_wishlist_usr-demo-01')
    };
  });
  console.log('Before check:', JSON.stringify(beforeCheck, null, 2));

  // Click first wish button
  const clickRes = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="위시리스트 토글"]');
    if (!btn) return 'button not found';
    btn.click();
    return 'clicked';
  });
  console.log('Click result:', clickRes);

  await new Promise(r => setTimeout(r, 2000));

  // Check state after click
  const afterCheck = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="위시리스트 토글"]');
    const svg = btn ? btn.querySelector('svg') : null;
    const badge = document.querySelector('a[href="/mypage/wishlist"] .bg-red-500');
    return {
      svgClass: svg ? svg.getAttribute('class') : '',
      badgeText: badge ? badge.innerText : null,
      localStorage: localStorage.getItem('dasseoba_wishlist_usr-demo-01')
    };
  });
  console.log('After check:', JSON.stringify(afterCheck, null, 2));

  await browser.close();
})();
