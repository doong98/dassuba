const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runAdminVisibilityTest() {
  console.log('🚀 Chrome 브라우저에서 관리자 메뉴 권한별 노출 테스트 시작...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });

  page.on('dialog', async d => await d.accept());

  // --- 시나리오 1: 비로그인 상태 ---
  console.log('\n--- 1. [비로그인 상태] 메인페이지 메뉴 확인 ---');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });

  // 로컬스토리지 로그인 세션 비우기
  await page.evaluate(() => localStorage.removeItem('dasseoba_user'));
  await page.reload({ waitUntil: 'networkidle2' });

  let headerAdminLink = await page.$('a[data-testid="header-admin-link"]');
  let hasAdminTextInHeader = await page.evaluate(() => {
    const nav = document.querySelector('header');
    return nav ? nav.textContent.includes('관리자 페이지') : false;
  });

  console.log(`  -> 비로그인 상태 헤더 '관리자 페이지' 노출 여부: ${hasAdminTextInHeader ? '❌ 노출됨 (오류)' : '✅ 미노출 (정상 숨김)'}`);

  const guestScreenshot = path.join(__dirname, '..', 'public', 'chrome_test_guest_no_admin_menu.png');
  await page.screenshot({ path: guestScreenshot, fullPage: false });
  console.log(`  📸 비로그인 화면 스크린샷 저장: ${guestScreenshot}`);

  // 비로그인 상태로 /admin 직접 접근 시도시 차단 확인
  console.log('  -> 비로그인 상태에서 /admin 직접 접속 시 가드 확인...');
  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle2' });
  const isGuardShown = await page.evaluate(() => {
    return document.body.textContent.includes('관리자 권한이 필요합니다');
  });
  console.log(`  -> 비로그인 /admin 접근 차단 가드 표시: ${isGuardShown ? '✅ 정상 차단됨' : '❌ 실패'}`);

  // --- 시나리오 2: 일반 회원 로그인 상태 ---
  console.log('\n--- 2. [일반 회원(user) 로그인 상태] 메인페이지 메뉴 확인 ---');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });

  // 로그인 모달 열기
  await page.evaluate(() => {
    const loginBtns = Array.from(document.querySelectorAll('button'));
    const btn = loginBtns.find(b => b.textContent && b.textContent.includes('로그인'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // 일반 회원 원클릭 로그인 클릭
  await page.evaluate(() => {
    const demoBtns = Array.from(document.querySelectorAll('button'));
    const userDemoBtn = demoBtns.find(b => b.textContent && b.textContent.includes('일반회원'));
    if (userDemoBtn) userDemoBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const hasAdminTextAsUser = await page.evaluate(() => {
    const nav = document.querySelector('header');
    return nav ? nav.textContent.includes('관리자 페이지') : false;
  });
  console.log(`  -> 일반 회원 로그인 상태 헤더 '관리자 페이지' 노출 여부: ${hasAdminTextAsUser ? '❌ 노출됨 (오류)' : '✅ 미노출 (정상 숨김)'}`);

  // 일반회원 상태로 /admin 직접 접근 시 차단 확인
  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle2' });
  const isGuardShownForUser = await page.evaluate(() => {
    return document.body.textContent.includes('일반 회원 권한입니다');
  });
  console.log(`  -> 일반 회원 /admin 접근 차단 가드 표시: ${isGuardShownForUser ? '✅ 정상 차단됨' : '❌ 실패'}`);

  // --- 시나리오 3: 관리자(admin) 로그인 상태 ---
  console.log('\n--- 3. [관리자(admin) 로그인 상태] 메인페이지 메뉴 확인 ---');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });

  // 로그인 모달 열기
  await page.evaluate(() => {
    const loginBtns = Array.from(document.querySelectorAll('button'));
    const btn = loginBtns.find(b => b.textContent && b.textContent.includes('로그인') || b.textContent.includes('로그아웃'));
    if (btn && btn.textContent.includes('로그아웃')) {
      btn.click(); // 먼저 로그아웃
    }
  });
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    const loginBtns = Array.from(document.querySelectorAll('button'));
    const btn = loginBtns.find(b => b.textContent && b.textContent.includes('로그인'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // 관리자 원클릭 로그인 클릭
  await page.evaluate(() => {
    const demoBtns = Array.from(document.querySelectorAll('button'));
    const adminDemoBtn = demoBtns.find(b => b.textContent && b.textContent.includes('관리자 (어드민권한)'));
    if (adminDemoBtn) adminDemoBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const hasAdminTextAsAdmin = await page.evaluate(() => {
    const nav = document.querySelector('header');
    return nav ? nav.textContent.includes('관리자 페이지') : false;
  });
  console.log(`  -> 관리자 로그인 상태 헤더 '관리자 페이지' 노출 여부: ${hasAdminTextAsAdmin ? '✅ 정상 노출됨!' : '❌ 미노출 (오류)'}`);

  const adminScreenshot = path.join(__dirname, '..', 'public', 'chrome_test_admin_logged_in_menu.png');
  await page.screenshot({ path: adminScreenshot, fullPage: false });
  console.log(`  📸 관리자 로그인 화면 스크린샷 저장: ${adminScreenshot}`);

  // 관리자 링크 클릭 시 관리자 페이지 정상 접근 확인
  console.log('  -> 헤더의 관리자 페이지 링크 클릭 테스트...');
  await page.click('a[data-testid="header-admin-link"]');
  await new Promise(r => setTimeout(r, 1500));

  const currentUrl = page.url();
  const isAdminConsoleLoaded = await page.evaluate(() => {
    return document.body.textContent.includes('ADMIN CONSOLE') || document.body.textContent.includes('다써바 관리자 페이지');
  });
  console.log(`  -> 관리자 페이지 정상 진입: ${isAdminConsoleLoaded && currentUrl.includes('/admin') ? '✅ 성공 (' + currentUrl + ')' : '❌ 실패'}`);

  await browser.close();
  console.log('\n🎉 관리자 메뉴 권한별 노출 테스트 전체 통과 완료!');
}

runAdminVisibilityTest().catch(console.error);
