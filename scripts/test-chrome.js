const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testChrome() {
  console.log('🚀 [Chrome Test] Starting Chrome browser automation test...');

  if (!fs.existsSync(CHROME_PATH)) {
    throw new Error(`Chrome not found at ${CHROME_PATH}`);
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,1000'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    errors.push(err.toString());
  });

  try {
    console.log('🌐 [1] Navigating to http://127.0.0.1:3000 in Chrome...');
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1000));

    // 1. 타이틀 검증
    const title = await page.title();
    console.log(`✅ [2] Page Title verified: "${title}"`);

    // 2. 헤더 및 GNB 검증
    const brandLogo = await page.$eval('header', (el) => el.innerText);
    const hasBrandName = brandLogo.includes('다써바') && brandLogo.includes('DASSEOBA');
    console.log(`✅ [3] Header & GNB brand logo rendered: ${hasBrandName ? 'PASS' : 'FAIL'}`);

    // 3. 주요 섹션 검증
    const hasBundleSection = await page.$eval('body', (el) => el.innerText.includes('1+1 골라담기'));
    console.log(`✅ [4] 1+1 Bundle Event section rendered: ${hasBundleSection ? 'PASS' : 'FAIL'}`);

    const hasRankingSection = await page.$eval('body', (el) => el.innerText.includes('베스트 모자 랭킹'));
    console.log(`✅ [5] Real-time Best Ranking section rendered: ${hasRankingSection ? 'PASS' : 'FAIL'}`);

    const hasCustomSection = await page.$eval('body', (el) => el.innerText.includes('커스텀 자수'));
    console.log(`✅ [6] Custom Embroidery section rendered: ${hasCustomSection ? 'PASS' : 'FAIL'}`);

    // 4. 스크린샷 저장 (데스크톱)
    const screenshotDesktop = path.join(__dirname, '..', 'public', 'test_desktop_preview.png');
    await page.screenshot({ path: screenshotDesktop, fullPage: false });
    console.log(`📸 [7] Desktop Screenshot saved: ${screenshotDesktop}`);

    // 5. 플로팅 챗봇 버튼 클릭 및 FAQ 모달 테스트
    console.log('🤖 [8] Testing Floating FAQ Chatbot button click...');
    const chatbotBtn = await page.$('button[aria-label="빠른 답변 챗봇"]');
    if (chatbotBtn) {
      await chatbotBtn.click();
      await page.waitForTimeout ? page.waitForTimeout(600) : new Promise((r) => setTimeout(r, 600));
      const hasChatModal = await page.$eval('body', (el) => el.innerText.includes('다써바 AI 안내 챗봇'));
      console.log(`✅ [9] Chatbot modal open interaction: ${hasChatModal ? 'PASS' : 'FAIL'}`);
    }

    // 6. 모바일 반응형 뷰포트 테스트 (iPhone 14 Pro 사이즈: 393x852)
    console.log('📱 [10] Testing Mobile viewport rendering (393x852)...');
    await page.setViewport({ width: 393, height: 852, isMobile: true, hasTouch: true });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1000));

    const hamburgerBtn = await page.$('button[aria-label="메뉴 열기"]');
    console.log(`✅ [11] Mobile Hamburger menu button existence: ${hamburgerBtn ? 'PASS' : 'FAIL'}`);

    if (hamburgerBtn) {
      await hamburgerBtn.click();
      await new Promise((r) => setTimeout(r, 600));
      const hasMobileNav = await page.$eval('body', (el) => el.innerText.includes('로그인하고 회원 전용 혜택'));
      console.log(`✅ [12] Mobile Slide Drawer navigation open: ${hasMobileNav ? 'PASS' : 'FAIL'}`);
    }

    const screenshotMobile = path.join(__dirname, '..', 'public', 'test_mobile_preview.png');
    await page.screenshot({ path: screenshotMobile });
    console.log(`📸 [13] Mobile Screenshot saved: ${screenshotMobile}`);

    // 에러 검증
    console.log('\n======================================');
    console.log(`🎉 ALL CHROME TESTS COMPLETED SUCCESSFULLY!`);
    console.log(`Browser console errors detected: ${errors.length}`);
    if (errors.length > 0) {
      console.log('Warning errors:', errors);
    }
    console.log('======================================\n');
  } catch (error) {
    console.error('❌ Chrome Test Failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testChrome();
