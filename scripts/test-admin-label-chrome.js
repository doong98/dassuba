const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testAdminLabel() {
  console.log('🚀 [Chrome Test] Starting Admin Page Label Verification...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,1000'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  try {
    console.log('🌐 [1] Navigating to http://127.0.0.1:3000...');
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded' });
    await sleep(1000);

    // 1. 헤더에서 '관리자 페이지' 확인 및 '백오피스' 부재 확인
    const headerText = await page.$eval('header', (el) => el.innerText);
    const hasAdminInHeader = headerText.includes('관리자 페이지');
    const hasBackofficeInHeader = headerText.includes('백오피스');
    console.log(`✅ [Header Check] '관리자 페이지' 포함 여부: ${hasAdminInHeader ? 'PASS' : 'FAIL'}`);
    console.log(`✅ [Header Check] '백오피스' 제거 여부: ${!hasBackofficeInHeader ? 'PASS' : 'FAIL'}`);

    // 헤더 영역 스크린샷 캡처
    const headerElement = await page.$('header');
    if (headerElement) {
      const headerScreenshot = path.join(__dirname, '..', 'public', 'test_header_admin_page.png');
      await headerElement.screenshot({ path: headerScreenshot });
      console.log(`📸 Saved Header Screenshot: ${headerScreenshot}`);
    }

    // 2. 푸터에서 '관리자 페이지' 확인
    const footerText = await page.$eval('footer', (el) => el.innerText);
    const hasAdminInFooter = footerText.includes('관리자 페이지');
    const hasBackofficeInFooter = footerText.includes('백오피스');
    console.log(`✅ [Footer Check] '관리자 페이지' 포함 여부: ${hasAdminInFooter ? 'PASS' : 'FAIL'}`);
    console.log(`✅ [Footer Check] '백오피스' 제거 여부: ${!hasBackofficeInFooter ? 'PASS' : 'FAIL'}`);

    // 3. 관리자 페이지(/admin) 접속 후 사이드바 로고 영역 명칭 확인
    console.log('🌐 [2] Navigating to http://127.0.0.1:3000/admin...');
    await page.goto('http://127.0.0.1:3000/admin', { waitUntil: 'domcontentloaded' });
    await sleep(1000);

    const adminBodyText = await page.$eval('body', (el) => el.innerText);
    const hasAdminInConsole = adminBodyText.includes('다써바 관리자 페이지');
    const hasBackofficeInConsole = adminBodyText.includes('다써바 백오피스');
    console.log(`✅ [Admin Console Check] '다써바 관리자 페이지' 포함 여부: ${hasAdminInConsole ? 'PASS' : 'FAIL'}`);
    console.log(`✅ [Admin Console Check] '백오피스' 제거 여부: ${!hasBackofficeInConsole ? 'PASS' : 'FAIL'}`);

    const adminScreenshot = path.join(__dirname, '..', 'public', 'test_admin_page_nav.png');
    await page.screenshot({ path: adminScreenshot });
    console.log(`📸 Saved Admin Page Screenshot: ${adminScreenshot}`);

    // 4. 모바일 네비게이션 드로어 검증
    console.log('📱 [3] Testing Mobile Nav drawer...');
    await page.setViewport({ width: 393, height: 852, isMobile: true, hasTouch: true });
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded' });
    await sleep(1000);

    const hamburgerBtn = await page.$('button[aria-label="메뉴 열기"]');
    if (hamburgerBtn) {
      await hamburgerBtn.click();
      await sleep(600);
      const mobileDrawerText = await page.$eval('body', (el) => el.innerText);
      const hasAdminInMobile = mobileDrawerText.includes('관리자 페이지');
      const hasBackofficeInMobile = mobileDrawerText.includes('백오피스');
      console.log(`✅ [Mobile Nav Check] '관리자 페이지' 포함 여부: ${hasAdminInMobile ? 'PASS' : 'FAIL'}`);
      console.log(`✅ [Mobile Nav Check] '백오피스' 제거 여부: ${!hasBackofficeInMobile ? 'PASS' : 'FAIL'}`);
    }

    if (hasAdminInHeader && !hasBackofficeInHeader && hasAdminInFooter && !hasBackofficeInFooter && hasAdminInConsole && !hasBackofficeInConsole) {
      console.log('\n=============================================================');
      console.log('🎉 [SUCCESS] "관리자 페이지" 명칭 수정 및 크롬 브라우저 검증 100% 완료!');
      console.log('=============================================================\n');
    } else {
      throw new Error('Some label checks failed!');
    }
  } catch (err) {
    console.error('❌ Label Test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testAdminLabel();
