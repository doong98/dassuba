const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testHeaderMyPageRemoval() {
  console.log('🚀 [헤더 맨 위 마이페이지 글자 메뉴 삭제 검증] 시작...\n');

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
    console.log('1. http://127.0.0.1:3000 접속');
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1000));

    // 2. 헤더 맨 위 최상단 유틸리티 바 검증
    console.log('2. 헤더 맨 위 유틸리티 바 요소 검증:');
    const utilityBarCheck = await page.evaluate(() => {
      // 최상단 유틸리티 바 div 탐색
      const topBar = document.querySelector('header .bg-zinc-50\\/70') || document.querySelector('header > div:nth-child(2)');
      if (!topBar) return { error: '최상단 유틸리티 바를 찾지 못함' };

      const links = Array.from(topBar.querySelectorAll('a')).map((a) => ({
        text: a.innerText.trim(),
        href: a.getAttribute('href'),
      }));

      const topBarText = topBar.innerText;

      const hasMyPageText = links.some((l) => l.text === '마이페이지');
      const hasOrderTrackingText = links.some((l) => l.text === '주문배송조회');
      const hasQnaText = links.some((l) => l.text === 'Q&A게시판');
      const hasCsText = links.some((l) => l.text === '고객센터');

      // 우측 퀵 유틸리티(아이콘 마이페이지) 탐색
      const quickIcons = Array.from(document.querySelectorAll('header a')).filter((a) =>
        a.getAttribute('href') === '/mypage'
      );

      return {
        links,
        topBarText,
        hasMyPageText,
        hasOrderTrackingText,
        hasQnaText,
        hasCsText,
        quickIconCount: quickIcons.length,
      };
    });

    console.log('   - 최상단 유틸리티 바 메뉴 목록:', utilityBarCheck.links.map((l) => l.text).join(' | '));
    console.log(`   - 최상단 [주문배송조회] 링크 유지: ${utilityBarCheck.hasOrderTrackingText ? 'PASS ✅' : 'FAIL ❌'}`);
    console.log(`   - 최상단 [Q&A게시판] 링크 유지: ${utilityBarCheck.hasQnaText ? 'PASS ✅' : 'FAIL ❌'}`);
    console.log(`   - 최상단 [고객센터] 링크 유지: ${utilityBarCheck.hasCsText ? 'PASS ✅' : 'FAIL ❌'}`);
    console.log('----------------------------------------------------');
    console.log(`   - 최상단 [마이페이지] 글자 메뉴 삭제 여부: ${!utilityBarCheck.hasMyPageText ? 'PASS ✅ (정상 삭제됨)' : 'FAIL ❌ (아직 남아있음)'}`);
    console.log(`   - 우측 아이콘 마이페이지(퀵메뉴) 보존: ${utilityBarCheck.quickIconCount > 0 ? 'PASS ✅' : 'FAIL ❌'}`);

    if (utilityBarCheck.hasMyPageText) {
      throw new Error('헤더 최상단에 마이페이지 글자 메뉴가 여전히 존재합니다.');
    }

    // 3. 스크린샷 저장
    const screenshotPath = path.join(screenshotDir, 'header_top_bar_mypage_removed.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`\n📸 스크린샷 저장 완료: ${screenshotPath}`);

    console.log('\n======================================================');
    console.log('🎉 [검증 성공] 헤더 맨 위의 마이페이지 글자 메뉴가 완벽하게 삭제되었습니다!');
    console.log('======================================================\n');
  } finally {
    await browser.close();
  }
}

testHeaderMyPageRemoval().catch((err) => {
  console.error('❌ 테스트 에러:', err);
  process.exit(1);
});
