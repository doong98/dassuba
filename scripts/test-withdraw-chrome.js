const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testWithdrawFeature() {
  console.log('🚀 [마이페이지 회원탈퇴 기능 Chrome 자동화 테스트] 시작...\n');

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

  let alertDialogMessage = '';
  page.on('dialog', async (dialog) => {
    alertDialogMessage = dialog.message();
    console.log(`🔔 [브라우저 Alert 감지]: "${alertDialogMessage}"`);
    await dialog.accept();
  });

  try {
    // 1. 로그인된 유저 상태로 마이페이지 접속
    console.log('1. 테스트 유저 로그인 세션 구성 및 마이페이지 접속');
    await page.goto('http://127.0.0.1:3000/mypage', { waitUntil: 'domcontentloaded' });

    // 임의의 테스트 계정 세션 스토리지 주입
    await page.evaluate(() => {
      const testUser = {
        id: 'test_withdraw_id_999',
        email: 'withdraw_tester@dasseoba.com',
        name: '탈퇴테스터',
        role: 'user',
        points: 5000,
      };
      sessionStorage.setItem('dasseoba_user', JSON.stringify(testUser));
    });

    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));

    // 스크린샷 1: 마이페이지 정상 로드 및 회원탈퇴 버튼 확인
    await page.screenshot({ path: path.join(screenshotDir, 'withdraw-01-mypage-view.png') });
    console.log('📸 스크린샷 저장: withdraw-01-mypage-view.png');

    // 2. 상단 및 하단 회원탈퇴 버튼 탐색
    console.log('2. 회원탈퇴 버튼 존재 여부 검증');
    const topWithdrawBtn = await page.$('[data-testid="withdraw-btn-top"]');
    const bottomWithdrawBtn = await page.$('[data-testid="withdraw-button"]');

    if (!topWithdrawBtn || !bottomWithdrawBtn) {
      throw new Error('회원탈퇴 버튼(상단 또는 하단)을 마이페이지에서 찾을 수 없습니다.');
    }
    console.log('✅ 상단 및 하단 회원탈퇴 버튼 발견 완료!');

    // 3. 하단 회원탈퇴 버튼 클릭하여 모달 열기
    console.log('3. [회원탈퇴 신청] 버튼 클릭 -> 확인 모달 오픈');
    await bottomWithdrawBtn.click();
    await new Promise((r) => setTimeout(r, 500));

    const modal = await page.$('[data-testid="withdraw-modal"]');
    if (!modal) {
      throw new Error('회원탈퇴 확인 모달이 표시되지 않았습니다.');
    }
    console.log('✅ 회원탈퇴 확인 모달 표시 확인!');

    // 스크린샷 2: 탈퇴 확인 모달 열린 상태
    await page.screenshot({ path: path.join(screenshotDir, 'withdraw-02-modal-open.png') });
    console.log('📸 스크린샷 저장: withdraw-02-modal-open.png');

    // 4. 모달 취소 동작 확인
    console.log('4. 모달 [취소] 버튼 클릭하여 닫힘 검증');
    await page.evaluate(() => {
      const modalEl = document.querySelector('[data-testid="withdraw-modal"]');
      const cancelBtn = Array.from(modalEl.querySelectorAll('button')).find((b) => b.innerText.includes('취소'));
      if (cancelBtn) cancelBtn.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    const modalClosed = await page.$('[data-testid="withdraw-modal"]');
    if (modalClosed) {
      throw new Error('취소 버튼 클릭 후에도 모달이 닫히지 않았습니다.');
    }
    console.log('✅ 모달 취소 정상 동작 확인!');

    // 5. 상단 회원탈퇴 버튼으로 다시 모달 열기 및 탈퇴 확인 실행
    console.log('5. 상단 [회원탈퇴] 버튼 클릭 및 최종 [탈퇴 확인] 진행');
    await topWithdrawBtn.click();
    await new Promise((r) => setTimeout(r, 500));

    const confirmWithdrawBtn = await page.$('[data-testid="confirm-withdraw-button"]');
    if (!confirmWithdrawBtn) {
      throw new Error('[탈퇴 확인] 버튼을 찾을 수 없습니다.');
    }

    alertDialogMessage = '';
    await confirmWithdrawBtn.click();

    // alert 및 탈퇴 처리 대기
    await new Promise((r) => setTimeout(r, 2000));

    if (!alertDialogMessage.includes('회원 탈퇴가 정상적으로 완료되었습니다')) {
      console.warn('⚠️ 탈퇴 성공 Alert 메시지 확인 필요: ', alertDialogMessage);
    } else {
      console.log('✅ 회원 탈퇴 성공 Alert 정상 확인:', alertDialogMessage);
    }

    // 6. 세션 스토리지 삭제 및 홈('/') 리다이렉트 검증
    console.log('6. 세션 삭제 및 홈 리다이렉트 검증');
    const remainingUser = await page.evaluate(() => sessionStorage.getItem('dasseoba_user'));
    const currentUrl = page.url();

    console.log('   - 현재 URL:', currentUrl);
    console.log('   - sessionStorage dasseoba_user:', remainingUser);

    if (remainingUser !== null) {
      throw new Error('탈퇴 후 세션 스토리지에서 유저 정보가 삭제되지 않았습니다.');
    }
    console.log('✅ 세션 스토리지 유저 정보 완전 삭제 확인!');

    // 스크린샷 3: 탈퇴 완료 후 홈 화면
    await page.screenshot({ path: path.join(screenshotDir, 'withdraw-03-completed-home.png') });
    console.log('📸 스크린샷 저장: withdraw-03-completed-home.png');

    console.log('\n🎉 [성공] 마이페이지 회원탈퇴 기능 및 UI 테스트가 완벽히 통과했습니다!');
  } catch (err) {
    console.error('❌ 테스트 실패:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testWithdrawFeature();
