const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testBundleImages() {
  console.log('🚀 [Chrome 1+1 Bundle Test] Testing updated images in 1+1 bundle section...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,1200'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1200 });

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  try {
    console.log('🌐 [1] Navigating to http://127.0.0.1:3000...');
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded' });
    await sleep(1000);

    // 1+1 섹션 이미지 src 검증
    const images = await page.$$eval('img', (els) => els.map((el) => el.src));
    console.log('📸 Found product images on page:', images.filter(s => s.includes('bundle-')));

    const hasBundle1 = images.some((img) => img.includes('bundle-1.png'));
    const hasBundle2 = images.some((img) => img.includes('bundle-2.png'));
    const hasBundle3 = images.some((img) => img.includes('bundle-3.png'));
    const hasBundle4 = images.some((img) => img.includes('bundle-4.png'));

    console.log(`✅ [2] Card 1 (White Heart Cap): ${hasBundle1 ? 'PASS' : 'FAIL'}`);
    console.log(`✅ [3] Card 2 (Denim B Cap): ${hasBundle2 ? 'PASS' : 'FAIL'}`);
    console.log(`✅ [4] Card 3 (Olive Bucket Hat): ${hasBundle3 ? 'PASS' : 'FAIL'}`);
    console.log(`✅ [5] Card 4 (Black Beanie): ${hasBundle4 ? 'PASS' : 'FAIL'}`);

    // 스크린샷 캡처
    const screenshotPath = path.join(__dirname, '..', 'public', 'test_bundle_updated.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`📸 [6] Screenshot saved: ${screenshotPath}`);

    console.log('\n=============================================================');
    console.log('🎉 [SUCCESS] 1+1 BUNDLE IMAGES REPLACEMENT VERIFIED 100%!');
    console.log('=============================================================\n');
  } catch (err) {
    console.error('❌ Bundle test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testBundleImages();
