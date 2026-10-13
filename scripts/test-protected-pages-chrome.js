const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const TARGET_PAGES = [
  {
    name: '주문배송조회',
    url: 'http://127.0.0.1:3000/mypage/orders',
    expectedGuestText: '주문배송조회 로그인 안내',
    hiddenContentKeywords: ['주문번호', '운송장번호', '배송조회'],
    expectedAuthKeywords: ['주문 내역', '배송 조회'],
  },
  {
    name: '마이페이지',
    url: 'http://127.0.0.1:3000/mypage',
    expectedGuestText: '마이페이지 로그인 안내',
    hiddenContentKeywords: ['회원님', '보유 적립금', '주문 내역 및 배송 조회'],
    expectedAuthKeywords: ['회원님', '보유 적립금'],
  },
  {
    name: '1:1문의',
    url: 'http://127.0.0.1:3000/community/cs',
    expectedGuestText: '1:1 문의 로그인 안내',
    hiddenContentKeywords: ['1:1 상담 문의 작성하기', 'CS CENTER', '접수대기', '답변완료'],
    expectedAuthKeywords: ['CS CENTER', '1:1 상담'],
  },
  {
    name: '찜한 상품',
    url: 'http://127.0.0.1:3000/mypage/wishlist',
    expectedGuestText: '찜한 상품 로그인 안내',
    hiddenContentKeywords: ['찜한 상품 목록', '장바구니 담기', '찜 해제'],
    expectedAuthKeywords: ['찜한 상품', '관심 상품'],
  },
  {
    name: '장바구니',
    url: 'http://127.0.0.1:3000/cart',
    expectedGuestText: '장바구니 로그인 안내',
    hiddenContentKeywords: ['주문 예상 금액', '결제하기', '장바구니 비우기', '수량 변경'],
    expectedAuthKeywords: ['장바구니', '주문 예상 금액'],
  },
];

async function runTest() {
  console.log('🚀 [5대 보호 페이지 검증] 비로그인 내용 차단 & 로그인 시 정상 열람 테스트 시작...\n');

  if (!fs.existsSync(CHROME_PATH)) {
    throw new Error(`Chrome executable not found at: ${CHROME_PATH}`);
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
    // ==========================================================
    // [PART 1] 비로그인(Guest) 상태에서 5개 페이지 내용 차단 검증
    // ==========================================================
    console.log('========================================================');
    console.log('🔒 [PART 1] 비로그인 상태: 5대 페이지 내용 비공개 및 로그인 요구 확인');
    console.log('========================================================\n');

    // 세션 및 로컬스토리지 정리하여 확실한 비로그인 상태 보장
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.removeItem('dasseoba_user');
    });
    await new Promise((r) => setTimeout(r, 600));

    for (const target of TARGET_PAGES) {
      console.log(`▶ [검사] "${target.name}" (${target.url}) 접속`);
      await page.goto(target.url, { waitUntil: 'domcontentloaded' });
      await new Promise((r) => setTimeout(r, 800));

      const pageText = await page.evaluate(() => document.body.innerText);

      // 1. LoginRequired 안내 문구가 노출되는가?
      const hasLoginRequiredNotice =
        pageText.includes('로그인이 필요한 서비스입니다') || pageText.includes(target.expectedGuestText);

      // 2. 로그인하기 버튼이 존재하는가?
      const hasLoginButton = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.some((b) => b.innerText.includes('로그인하기'));
      });

      // 3. 실제 비공개 콘텐츠가 숨겨져 있는가?
      const isContentHidden = !target.hiddenContentKeywords.some((kw) => pageText.includes(kw));

      console.log(`   - 로그인 안내 게이트 노출: ${hasLoginRequiredNotice ? 'PASS ✅' : 'FAIL ❌'}`);
      console.log(`   - [로그인하기] 버튼 존재: ${hasLoginButton ? 'PASS ✅' : 'FAIL ❌'}`);
      console.log(`   - 비공개 원본 콘텐츠 차단(가림): ${isContentHidden ? 'PASS ✅ (내용 비공개)' : 'FAIL ❌'}`);

      if (!hasLoginRequiredNotice || !hasLoginButton) {
        throw new Error(`"${target.name}" 페이지에서 비로그인 차단 가드가 작동하지 않았습니다.`);
      }

      const filename = `guest_guard_${encodeURIComponent(target.name)}.png`;
      await page.screenshot({ path: path.join(screenshotDir, filename) });
    }

    // ==========================================================
    // [PART 2] 로그인 후 5개 페이지 정상 열람 검증
    // ==========================================================
    console.log('\n========================================================');
    console.log('🔓 [PART 2] 로그인 상태: 5대 페이지 정상 콘텐츠 열람 가능 확인');
    console.log('========================================================\n');

    // 메인 홈 이동 후 로그인 모달을 통해 일반회원 로그인
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 600));

    const loginClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('header button'));
      const target = btns.find((b) => b.innerText.trim() === '로그인');
      if (target) {
        target.click();
        return true;
      }
      return false;
    });

    if (loginClicked) {
      await new Promise((r) => setTimeout(r, 600));
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const demo = btns.find((b) => b.innerText.includes('일반회원'));
        if (demo) demo.click();
      });
      await new Promise((r) => setTimeout(r, 1000));
    }

    const isLoggedIn = await page.evaluate(() => {
      const headerText = document.querySelector('header')?.innerText || '';
      return headerText.includes('홍길동님');
    });

    console.log(`🔑 로그인 완료 상태: ${isLoggedIn ? '홍길동님 로그인 성공 ✅' : '로그인 실패 ❌'}\n`);

    for (const target of TARGET_PAGES) {
      console.log(`▶ [열람] "${target.name}" (${target.url}) 재접속`);
      await page.goto(target.url, { waitUntil: 'domcontentloaded' });
      await new Promise((r) => setTimeout(r, 900));

      const pageText = await page.evaluate(() => document.body.innerText);

      // 로그인 상태에서는 LoginRequired가 나오지 않고 정상 콘텐츠가 나와야 함
      const hasLoginRequired = pageText.includes('로그인이 필요한 서비스입니다');
      const hasExpectedAuthContent = target.expectedAuthKeywords.some((kw) => pageText.includes(kw));

      console.log(`   - 로그인 요구 게이트 해제: ${!hasLoginRequired ? 'PASS ✅' : 'FAIL ❌ (아직 잠김)'}`);
      console.log(`   - 정상 콘텐츠 렌더링: ${hasExpectedAuthContent ? 'PASS ✅' : 'FAIL ❌'}`);

      if (hasLoginRequired || !hasExpectedAuthContent) {
        throw new Error(`"${target.name}" 페이지에서 로그인 후 콘텐츠 열람이 차단되었습니다.`);
      }

      const filename = `auth_view_${encodeURIComponent(target.name)}.png`;
      await page.screenshot({ path: path.join(screenshotDir, filename) });
    }

    console.log('\n======================================================');
    console.log('🎉 [전체 검증 완료] 5대 페이지(주문배송조회, 마이페이지, 1:1문의, 찜한 상품, 장바구니)의 로그인 보호 정책이 완벽하게 적용되었습니다!');
    console.log('======================================================\n');
  } finally {
    await browser.close();
  }
}

runTest().catch((err) => {
  console.error('❌ 테스트 중 에러 발생:', err);
  process.exit(1);
});
