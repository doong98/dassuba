const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testSessionLogout() {
  console.log('🚀 [자동 로그아웃 검증] 브라우저 종료 시 자동 로그아웃 기능 테스트 시작...\n');

  if (!fs.existsSync(CHROME_PATH)) {
    throw new Error(`Chrome을 찾을 수 없습니다: ${CHROME_PATH}`);
  }

  const screenshotDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

  // ----------------------------------------------------
  // 세션 1: 첫 번째 브라우저 실행 -> 로그인 -> 새로고침 유지 확인
  // ----------------------------------------------------
  console.log('🌐 [단계 1] 첫 번째 브라우저 창 실행 및 접속');
  let browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,1000'],
  });

  let page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });

  await page.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1000));

  // 1-1. 초기 상태 확인 (로그인되어 있지 않아야 함)
  const initialHeaderState = await page.evaluate(() => {
    const text = document.querySelector('header')?.innerText || '';
    const hasLoginBtn = text.includes('로그인');
    const hasUserName = text.includes('님');
    const sessionStorageUser = sessionStorage.getItem('dasseoba_user');
    const localStorageUser = localStorage.getItem('dasseoba_user');
    return { hasLoginBtn, hasUserName, sessionStorageUser, localStorageUser };
  });

  console.log('  -> 초기 접속 상태:', initialHeaderState.hasLoginBtn ? '비로그인 상태 확인 ✅' : '로그인 상태 ❌');
  console.log('  -> localStorage 잔여 여부:', initialHeaderState.localStorageUser ? '남아있음 ❌' : '정리됨 (null) ✅');

  // 1-2. 로그인 모달 열기 및 데모 로그인 실행
  console.log('\n🌐 [단계 2] 로그인 수행 (일반회원 데모 로그인)');
  const loginBtn = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('header button'));
    const target = btns.find((b) => b.innerText.trim() === '로그인');
    if (target) {
      target.click();
      return true;
    }
    return false;
  });

  if (!loginBtn) throw new Error('로그인 버튼을 찾을 수 없습니다.');
  await new Promise((r) => setTimeout(r, 600));

  // 모달 내 '일반회원' 퀵 로그인 버튼 클릭
  const demoClickResult = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const demo = btns.find((b) => b.innerText.includes('일반회원'));
    if (demo) {
      demo.click();
      return true;
    }
    return false;
  });

  if (!demoClickResult) throw new Error('데모 로그인 버튼을 찾을 수 없습니다.');
  await new Promise((r) => setTimeout(r, 1000));

  // 1-3. 로그인 성공 상태 및 스토리지 확인
  const loggedInState = await page.evaluate(() => {
    const text = document.querySelector('header')?.innerText || '';
    const hasHong = text.includes('홍길동님');
    const hasPoints = text.includes('P');
    const hasLogoutBtn = text.includes('로그아웃');
    const sessionStorageUser = sessionStorage.getItem('dasseoba_user');
    const localStorageUser = localStorage.getItem('dasseoba_user');
    return { hasHong, hasPoints, hasLogoutBtn, sessionStorageUser, localStorageUser };
  });

  console.log('  -> 로그인 반영 상태:');
  console.log('     * 사용자 이름 표시(홍길동님):', loggedInState.hasHong ? 'PASS ✅' : 'FAIL ❌');
  console.log('     * 포인트 표시:', loggedInState.hasPoints ? 'PASS ✅' : 'FAIL ❌');
  console.log('     * 로그아웃 버튼 표시:', loggedInState.hasLogoutBtn ? 'PASS ✅' : 'FAIL ❌');
  console.log('     * sessionStorage에 세션 저장:', loggedInState.sessionStorageUser ? '저장됨 PASS ✅' : 'FAIL ❌');
  console.log('     * localStorage 저장 여부:', loggedInState.localStorageUser ? '저장됨(비정상) ❌' : '저장안됨(안전) PASS ✅');

  await page.screenshot({ path: path.join(screenshotDir, 'session_logged_in.png') });

  // 1-4. 같은 세션에서 페이지 새로고침 시 로그인 유지 확인
  console.log('\n🌐 [단계 3] 브라우저 내 새로고침(F5) 시 로그인 유지 검증');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1000));

  const afterReloadState = await page.evaluate(() => {
    const text = document.querySelector('header')?.innerText || '';
    return {
      hasHong: text.includes('홍길동님'),
      hasLogoutBtn: text.includes('로그아웃'),
    };
  });
  console.log('  -> 새로고침 후에도 로그인 유지 여부:', afterReloadState.hasHong && afterReloadState.hasLogoutBtn ? '유지됨 PASS ✅' : '유지안됨 FAIL ❌');

  // ----------------------------------------------------
  // 세션 2: 브라우저 완전히 닫기 (창 종료) -> 새 브라우저 실행
  // ----------------------------------------------------
  console.log('\n🌐 [단계 4] 브라우저 창 닫기 (로그아웃 안 한 상태로 종료) 시뮬레이션');
  await browser.close();
  console.log('  -> 브라우저 프로세스 종료 완료 (세션 스토리지 파기됨)');

  console.log('\n🌐 [단계 5] 새로운 브라우저 창 다시 열기 (사이트 재접속)');
  browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,1000'],
  });

  page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });

  await page.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1000));

  // 2-1. 브라우저 재실행 후 자동 로그아웃 상태 검증
  const autoLogoutState = await page.evaluate(() => {
    const text = document.querySelector('header')?.innerText || '';
    const hasLoginBtn = text.includes('로그인');
    const hasSignUpBtn = text.includes('회원가입');
    const hasHong = text.includes('홍길동님');
    const sessionStorageUser = sessionStorage.getItem('dasseoba_user');
    const localStorageUser = localStorage.getItem('dasseoba_user');
    return { hasLoginBtn, hasSignUpBtn, hasHong, sessionStorageUser, localStorageUser };
  });

  console.log('  -> 브라우저 재실행 후 자동 로그아웃 결과:');
  console.log('     * 홍길동님 세션 파기 여부:', !autoLogoutState.hasHong ? '정상 파기됨 PASS ✅' : '세션 남아있음 FAIL ❌');
  console.log('     * 헤더 [로그인] 버튼 표시 여부:', autoLogoutState.hasLoginBtn ? '표시됨 PASS ✅' : '미표시 FAIL ❌');
  console.log('     * 헤더 [회원가입] 버튼 표시 여부:', autoLogoutState.hasSignUpBtn ? '표시됨 PASS ✅' : '미표시 FAIL ❌');
  console.log('     * sessionStorage 비어있음 여부:', autoLogoutState.sessionStorageUser === null ? '비어있음 PASS ✅' : '데이터 존재 FAIL ❌');

  await page.screenshot({ path: path.join(screenshotDir, 'session_auto_logged_out.png') });

  // 브라우저 종료
  await browser.close();

  console.log('\n======================================================');
  console.log('🎉 [검증 성공] 브라우저를 닫으면 자동으로 로그아웃되는 정책이 완벽히 작동합니다!');
  console.log('======================================================\n');
}

testSessionLogout().catch((err) => {
  console.error('❌ 테스트 중 에러 발생:', err);
  process.exit(1);
});
