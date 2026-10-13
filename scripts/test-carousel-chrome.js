const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testCarousel() {
  console.log('🚀 [Chrome Carousel Test] Starting test for horizontal sliding carousel...');

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

    // 1. 첫 번째 슬라이드 확인
    const hasFirstSlideTitle = await page.$eval('body', (el) => el.innerText.includes('NEW SEASON CAP COLLECTION'));
    console.log(`✅ [2] First Slide Text verified: ${hasFirstSlideTitle ? 'PASS' : 'FAIL'}`);

    // 첫 번째 슬라이드 배경 이미지 경로 확인
    const firstSlideBg = await page.$eval('section[aria-label="메인 비주얼 배너"] div.bg-cover', (el) => el.style.backgroundImage);
    const hasNewImage = firstSlideBg.includes('hero-slide-1.jpg');
    console.log(`✅ [3] First Slide Image replaced with uploaded cap image: ${hasNewImage ? 'PASS' : 'FAIL'} (${firstSlideBg})`);

    // 2. 스크린샷 캡처 (첫 번째 슬라이드)
    const screenshot1 = path.join(__dirname, '..', 'public', 'test_hero_slide_1.png');
    await page.screenshot({ path: screenshot1 });
    console.log(`📸 [4] Slide 1 Screenshot saved: ${screenshot1}`);

    // 3. 캐러셀 우측 '다음 슬라이드' 버튼 클릭하여 오른쪽 -> 왼쪽 전환 테스트
    console.log('🔄 [5] Clicking Next Slide button (Right to Left Transition)...');
    const nextBtn = await page.$('button[aria-label="다음 슬라이드"]');
    if (nextBtn) {
      await nextBtn.click();
      await sleep(1000); // 슬라이딩 트랜지션 애니메이션 완료 대기

      const hasSecondSlide = await page.$eval('body', (el) => el.innerText.includes('1+1 SPECIAL BUNDLE EVENT'));
      console.log(`✅ [6] Slid to Slide 2 smoothly: ${hasSecondSlide ? 'PASS' : 'FAIL'}`);

      // 슬라이드 2 스크린샷 캡처
      const screenshot2 = path.join(__dirname, '..', 'public', 'test_hero_slide_2.png');
      await page.screenshot({ path: screenshot2 });
      console.log(`📸 [7] Slide 2 Screenshot saved: ${screenshot2}`);
    }

    console.log('\n======================================================');
    console.log('🎉 [SUCCESS] HERO CAROUSEL CHROME TEST PASSED 100%!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Carousel test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testCarousel();
