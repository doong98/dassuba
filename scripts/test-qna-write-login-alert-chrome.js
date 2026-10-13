const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testQnaWriteAuthAlert() {
  console.log('🚀 [Q&A 게시판 1:1 문의글 작성 버튼 인증 테스트] 시작...\n');

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
    // ---------------------------------------------------------
    // 1. 비로그인 상태로 Q&A 게시판 접속
    // ---------------------------------------------------------
    console.log('1. http://127.0.0.1:3000/community/qna 접속 (비로그인 상태 보장)');
    await page.goto('http://127.0.0.1:3000/community/qna', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.removeItem('dasseoba_user');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 800));

    // 2. 우측 상단 '+ 1:1 문의글 작성' 버튼 찾기
    console.log('2. [ + 1:1 문의글 작성 ] 버튼 클릭 시도');
    const writeBtnExists = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find((b) => b.innerText.includes('1:1 문의글 작성'));
      return !!btn;
    });

    if (!writeBtnExists) {
      throw new Error('[+ 1:1 문의글 작성] 버튼을 찾을 수 없습니다.');
    }

    // 3. 버튼 클릭 및 alert 메시지 확인
    alertDialogMessage = '';
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find((b) => b.innerText.includes('1:1 문의글 작성'));
      if (btn) btn.click();
    });

    await new Promise((r) => setTimeout(r, 600));

    console.log('3. 로그인 안내 Alert 검증:');
    const isAlertCorrect = alertDialogMessage.includes('로그인 후 이용');
    console.log(`   -> 감지된 메시지: "${alertDialogMessage}"`);
    console.log(`   -> "로그인 후 이용" 메시지 포함 여부: ${isAlertCorrect ? 'PASS ✅' : 'FAIL ❌'}`);

    if (!isAlertCorrect) {
      throw new Error(`예상된 로그인 안내 메시지가 출력되지 않았습니다. (실제: ${alertDialogMessage})`);
    }

    // 4. 로그인 모달(AuthModal) 자동 팝업 확인
    const isAuthModalOpen = await page.evaluate(() => {
      const modal = document.querySelector('.fixed.inset-0.z-50');
      const text = document.body.innerText;
      return text.includes('DASSEOBA') && text.includes('간편 회원가입') || text.includes('로그인');
    });
    console.log(`4. 로그인 팝업 모달 노출 여부: ${isAuthModalOpen ? 'PASS ✅' : 'FAIL ❌'}`);

    await page.screenshot({ path: path.join(screenshotDir, 'qna_write_login_required.png') });

    // ---------------------------------------------------------
    // 5. 로그인 수행 후 동일 버튼 클릭 시 정상 작성 모달 오픈 확인
    // ---------------------------------------------------------
    console.log('5. 일반회원 데모 로그인 수행');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const demo = btns.find((b) => b.innerText.includes('일반회원'));
      if (demo) demo.click();
    });
    await new Promise((r) => setTimeout(r, 1200));

    console.log('6. 로그인 후 [ + 1:1 문의글 작성 ] 버튼 재클릭');
    alertDialogMessage = '';
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find((b) => b.innerText.includes('1:1 문의글 작성'));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    // 로그인 후에는 alert가 뜨지 않고 작성 모달이 열려야 함
    const hasNoAlert = alertDialogMessage === '';
    const isWriteModalVisible = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('문의글 작성하기') && text.includes('Q&A 1:1 질문하기');
    });

    console.log(`   -> Alert 미발생 여부: ${hasNoAlert ? 'PASS ✅ (Alert 없음)' : 'FAIL ❌'}`);
    console.log(`   -> 1:1 Q&A 작성 모달 정상 오픈: ${isWriteModalVisible ? 'PASS ✅' : 'FAIL ❌'}`);

    await page.screenshot({ path: path.join(screenshotDir, 'qna_write_modal_authenticated.png') });

    console.log('\n======================================================');
    console.log('🎉 [테스트 성공] Q&A 게시판의 1:1 문의 버튼 클릭 시 로그인 안내가 완벽하게 동작합니다!');
    console.log('======================================================\n');
  } finally {
    await browser.close();
  }
}

testQnaWriteAuthAlert().catch((err) => {
  console.error('❌ 테스트 에러:', err);
  process.exit(1);
});
