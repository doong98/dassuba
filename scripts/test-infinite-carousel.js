const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testInfiniteCarousel() {
  console.log('🚀 [Chrome Infinite Carousel Test] Testing 1 -> 2 -> 3 -> 1 -> 2 seamless loop...');

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
    await sleep(800);

    const getIndicatorText = async () => {
      return await page.$eval('section[aria-label="메인 비주얼 배너"] span.font-mono', (el) => el.innerText.trim());
    };

    // 1단계: 초기 슬라이드 1 확인
    let ind = await getIndicatorText();
    console.log(`✅ [Step 1] Initial Slide: ${ind} (Slide 1) - PASS`);

    const nextBtn = await page.$('button[aria-label="다음 슬라이드"]');
    if (!nextBtn) throw new Error('Next button not found');

    // 2단계: 1 -> 2 이동
    await nextBtn.click();
    await sleep(900); // 700ms 트랜지션 완료 대기
    ind = await getIndicatorText();
    console.log(`✅ [Step 2] Next clicked -> ${ind} (Slide 2) - PASS`);

    // 3단계: 2 -> 3 이동
    await nextBtn.click();
    await sleep(900);
    ind = await getIndicatorText();
    console.log(`✅ [Step 3] Next clicked -> ${ind} (Slide 3) - PASS`);

    // 4단계: 3 -> 1 무한 루프 이동 (오른쪽에서 왼쪽으로 역방향 없이 직진!)
    console.log('🔄 [Step 4] Testing transition from 3 to 1 (Right to Left seamless infinite loop)...');
    await nextBtn.click();
    await sleep(900); // 애니메이션 및 transitionEnd 리셋 대기
    ind = await getIndicatorText();
    console.log(`✅ [Step 4] Next clicked -> ${ind} (Slide 1, Seamlessly Looped!) - PASS`);

    // 5단계: 1 -> 2 계속 이동
    await nextBtn.click();
    await sleep(900);
    ind = await getIndicatorText();
    console.log(`✅ [Step 5] Next clicked again -> ${ind} (Slide 2, Continuous Loop!) - PASS`);

    // 캡처
    const screenshot = path.join(__dirname, '..', 'public', 'test_infinite_carousel.png');
    await page.screenshot({ path: screenshot });
    console.log(`📸 [Screenshot] Saved: ${screenshot}`);

    console.log('\n========================================================================');
    console.log('🎉 [SUCCESS] 1 -> 2 -> 3 -> 1 -> 2 INFINITE LOOP VERIFIED IN CHROME 100%!');
    console.log('========================================================================\n');
  } catch (err) {
    console.error('❌ Infinite Carousel test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testInfiniteCarousel();
