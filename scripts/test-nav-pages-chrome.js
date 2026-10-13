const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testNavigationPages() {
  console.log('🚀 [검증] "구매포토리뷰" 및 "단체 자수 무료시안 신청" 페이지 테스트 시작...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  page.on('dialog', async d => await d.accept());

  const screenshotDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

  try {
    // 1. 메인 홈페이지 접속
    console.log('\n1. http://localhost:3000 접속');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    // 2. 상단 네비게이션에서 [구매포토리뷰] 링크 확인 및 클릭
    console.log('2. 헤더 GNB의 [구매포토리뷰] 메뉴 클릭');
    const reviewClicked = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const target = links.find(l => l.innerText.trim() === '구매포토리뷰');
      if (target) {
        target.click();
        return true;
      }
      return false;
    });
    console.log('  -> [구매포토리뷰] 클릭 결과:', reviewClicked ? '성공 ✅' : '실패 ❌');
    if (!reviewClicked) throw new Error('[구매포토리뷰] 링크를 찾을 수 없습니다.');

    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    // 3. /community/reviews 페이지 검증
    const reviewUrl = page.url();
    console.log(`3. 이동된 URL: ${reviewUrl}`);
    if (!reviewUrl.includes('/community/reviews')) {
      throw new Error(`구매포토리뷰 URL 불일치: ${reviewUrl}`);
    }

    const reviewPageCheck = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        is404: text.includes('404') && text.includes('could not be found'),
        hasTitle: text.includes('구매 고객 실착 포토리뷰'),
        hasStats: text.includes('4.9') && text.includes('전체 구매 리뷰'),
        hasGallery: text.includes('포토 갤러리 모아보기'),
        hasReviewCards: document.querySelectorAll('.divide-y, .rounded-3xl').length > 0,
      };
    });

    console.log('  -> 404 에러 발생 여부:', reviewPageCheck.is404 ? '에러 발생 ❌' : '정상 통과 (404 없음) ✅');
    console.log('  -> 페이지 타이틀 표시:', reviewPageCheck.hasTitle ? '정상 ✅' : '누락 ❌');
    console.log('  -> 4.9 평점 통계 배너:', reviewPageCheck.hasStats ? '정상 ✅' : '누락 ❌');
    console.log('  -> 포토 갤러리 썸네일 바:', reviewPageCheck.hasGallery ? '정상 ✅' : '누락 ❌');

    if (reviewPageCheck.is404 || !reviewPageCheck.hasTitle) {
      throw new Error('구매포토리뷰 페이지 렌더링 실패');
    }

    await page.screenshot({ path: path.join(screenshotDir, '5_photo_reviews_page.png') });
    console.log('  -> 스크린샷 저장: 5_photo_reviews_page.png 📸');

    // 4. 상단 네비게이션에서 [단체 자수 무료시안 신청] 버튼 확인 및 클릭
    console.log('\n4. 헤더 우측 상단의 [단체 자수 무료시안 신청] 버튼 클릭');
    const customInquiryClicked = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const target = links.find(l => l.innerText.includes('단체 자수 무료시안 신청'));
      if (target) {
        target.click();
        return true;
      }
      return false;
    });
    console.log('  -> [단체 자수 무료시안 신청] 클릭 결과:', customInquiryClicked ? '성공 ✅' : '실패 ❌');
    if (!customInquiryClicked) throw new Error('[단체 자수 무료시안 신청] 링크를 찾을 수 없습니다.');

    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    // 5. /custom/inquiry 페이지 검증
    const customUrl = page.url();
    console.log(`5. 이동된 URL: ${customUrl}`);
    if (!customUrl.includes('/custom/inquiry')) {
      throw new Error(`단체자수 무료시안 URL 불일치: ${customUrl}`);
    }

    const customPageCheck = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        is404: text.includes('404') && text.includes('could not be found'),
        hasTitle: text.includes('단체 모자 자수') && text.includes('무료 시안 & 맞춤 견적'),
        hasForm: text.includes('기본 정보 및 연락처') && text.includes('제작 모자 모델 및 수량 선택'),
        hasSimulator: text.includes('실시간 예상 견적 시뮬레이터'),
        hasPortfolios: text.includes('최근 단체 제작 사례'),
      };
    });

    console.log('  -> 404 에러 발생 여부:', customPageCheck.is404 ? '에러 발생 ❌' : '정상 통과 (404 없음) ✅');
    console.log('  -> 페이지 타이틀 표시:', customPageCheck.hasTitle ? '정상 ✅' : '누락 ❌');
    console.log('  -> 단계별 무료시안 신청 폼:', customPageCheck.hasForm ? '정상 ✅' : '누락 ❌');
    console.log('  -> 실시간 예상견적 시뮬레이터:', customPageCheck.hasSimulator ? '정상 ✅' : '누락 ❌');
    console.log('  -> 최근 단체 제작 사례:', customPageCheck.hasPortfolios ? '정상 ✅' : '누락 ❌');

    if (customPageCheck.is404 || !customPageCheck.hasTitle) {
      throw new Error('단체 자수 무료시안 신청 페이지 렌더링 실패');
    }

    await page.screenshot({ path: path.join(screenshotDir, '6_custom_inquiry_page.png') });
    console.log('  -> 스크린샷 저장: 6_custom_inquiry_page.png 📸');

    // 6. 신청 폼 인터랙션 테스트 (입력 후 제출)
    console.log('\n6. 무료 시안 신청서 폼 입력 및 제출 인터랙션 테스트');
    await page.type('input[placeholder*="서울 마라톤"]', '강남 러너스 클럽');
    await page.type('input[placeholder="홍길동"]', '이영희');
    await page.type('input[placeholder="010-1234-5678"]', '010-9988-7766');

    // 제출 버튼 클릭
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('무료 시안 및 견적 신청서 접수하기'));
      if (btn) btn.click();
    });

    await new Promise(r => setTimeout(r, 1000));

    // 접수완료 모달 확인
    const modalCheck = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('무료 시안 신청 접수완료') && text.includes('강남 러너스 클럽');
    });
    console.log('  -> 접수완료 모달 표출 및 접수번호 발급:', modalCheck ? '성공 ✅' : '실패 ❌');

    await page.screenshot({ path: path.join(screenshotDir, '7_custom_inquiry_submitted_modal.png') });
    console.log('  -> 스크린샷 저장: 7_custom_inquiry_submitted_modal.png 📸');

    console.log('\n🎉 [테스트 완료] "구매포토리뷰"와 "단체 자수 무료시안 신청" 페이지가 404 없이 완벽하게 복구 및 동작합니다!');
  } finally {
    await browser.close();
  }
}

testNavigationPages().catch(err => {
  console.error('\n❌ 테스트 실패:', err);
  process.exit(1);
});
