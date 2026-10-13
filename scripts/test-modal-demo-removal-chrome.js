const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testModalRemoval() {
  console.log('🚀 [로그인 모달 일반회원/관리자 버튼 삭제 검증] 시작...\n');

  if (!fs.existsSync(CHROME_PATH)) {
    throw new Error(`Chrome을 찾을 수 없습니다: ${CHROME_PATH}`);
  }

  const screenshotDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,1000'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });

  try {
    console.log('1. http://127.0.0.1:3000 접속 (비로그인 상태)');
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.removeItem('dasseoba_user');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 800));

    console.log('2. 헤더의 [로그인] 버튼 클릭하여 로그인 모달 오픈');
    const loginClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('header button'));
      const btn = btns.find((b) => b.innerText.trim() === '로그인');
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    if (!loginClicked) throw new Error('헤더 로그인 버튼을 찾을 수 없습니다.');
    await new Promise((r) => setTimeout(r, 800));

    console.log('3. 로그인 모달 내부 요소 검증:');
    const checkResult = await page.evaluate(() => {
      const text = document.body.innerText;
      const modal = document.querySelector('.fixed.inset-0.z-50');

      const hasModal = !!modal;
      const hasEmailInput = !!document.querySelector('input[type="email"]');
      const hasPasswordInput = !!document.querySelector('input[type="password"]');
      const hasLoginSubmitBtn = Array.from(document.querySelectorAll('button')).some(
        (b) => b.getAttribute('data-testid') === 'auth-submit-btn'
      );

      // 삭제 대상 키워드 검사
      const hasQuickDemoText = text.includes('빠른 기능 체험');
      const hasOneClickText = text.includes('원클릭 테스트');
      const hasUserDemoBtn = Array.from(document.querySelectorAll('button')).some((b) =>
        b.innerText.includes('일반회원 (2,000P)')
      );
      const hasAdminDemoBtn = Array.from(document.querySelectorAll('button')).some((b) =>
        b.innerText.includes('관리자 (어드민권한)')
      );

      return {
        hasModal,
        hasEmailInput,
        hasPasswordInput,
        hasLoginSubmitBtn,
        hasQuickDemoText,
        hasOneClickText,
        hasUserDemoBtn,
        hasAdminDemoBtn,
      };
    });

    console.log(`   - 로그인 모달 표출: ${checkResult.hasModal ? 'PASS ✅' : 'FAIL ❌'}`);
    console.log(`   - 이메일 입력창 존재: ${checkResult.hasEmailInput ? 'PASS ✅' : 'FAIL ❌'}`);
    console.log(`   - 비밀번호 입력창 존재: ${checkResult.hasPasswordInput ? 'PASS ✅' : 'FAIL ❌'}`);
    console.log(`   - 로그인 제출 버튼 존재: ${checkResult.hasLoginSubmitBtn ? 'PASS ✅' : 'FAIL ❌'}`);
    console.log('----------------------------------------------------');
    console.log(`   - [빠른 기능 체험] 텍스트 삭제 여부: ${!checkResult.hasQuickDemoText ? 'PASS ✅ (삭제됨)' : 'FAIL ❌ (남아있음)'}`);
    console.log(`   - [일반회원 (2,000P)] 버튼 삭제 여부: ${!checkResult.hasUserDemoBtn ? 'PASS ✅ (삭제됨)' : 'FAIL ❌ (남아있음)'}`);
    console.log(`   - [관리자 (어드민권한)] 버튼 삭제 여부: ${!checkResult.hasAdminDemoBtn ? 'PASS ✅ (삭제됨)' : 'FAIL ❌ (남아있음)'}`);

    const isAllRemoved =
      !checkResult.hasQuickDemoText &&
      !checkResult.hasOneClickText &&
      !checkResult.hasUserDemoBtn &&
      !checkResult.hasAdminDemoBtn;

    if (!isAllRemoved) {
      throw new Error('일반회원 및 관리자 데모 버튼이 아직 모달에 남아있습니다.');
    }

    // 스크린샷 캡처
    const screenshotPath = path.join(screenshotDir, 'modal_without_demo_buttons.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`\n📸 검증 스크린샷 저장 완료: ${screenshotPath}`);

    console.log('\n======================================================');
    console.log('🎉 [검증 성공] 로그인 창 아래 일반회원 및 어드민 버튼이 깔끔하게 삭제되었습니다!');
    console.log('======================================================\n');
  } finally {
    await browser.close();
  }
}

testModalRemoval().catch((err) => {
  console.error('❌ 테스트 에러:', err);
  process.exit(1);
  process.exit(1);
});
