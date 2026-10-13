const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testAdminProducts() {
  console.log('🚀 [Chrome Test] Starting Admin Products & Supabase Integration Test...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,1000'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  try {
    console.log('🌐 [1] Navigating to http://localhost:3000/admin/products...');
    await page.goto('http://localhost:3000/admin/products', { waitUntil: 'domcontentloaded' });
    await sleep(1500);

    // 1. 이미지의 8개 상품 표시 검증
    const expectedProducts = [
      '시그니처 딥핏 코튼 무지 볼캡',
      '빈티지 피그먼트 워싱 로우 볼캡',
      '와이드 브림 사파리 아웃도어 스트랩 버킷햇',
      '빅사이즈 대두 깊은 사계절 벙거지 버킷햇',
      '데일리 소프트 골지 숏비니 와치캡',
      '프로 에어로 쿨링 골프/테니스 선바이저 썬캡',
      '프리미엄 멜톤 플랫 스냅백 캡',
      '초경량 캠프캡 나일론 5패널 제트캡',
    ];

    const bodyText = await page.$eval('body', (el) => el.innerText);

    console.log('\n--- [2] Verifying 8 Master Products from image ---');
    let matchedCount = 0;
    for (const title of expectedProducts) {
      const exists = bodyText.includes(title);
      console.log(`- ${title}: ${exists ? '✅ PASS' : '❌ FAIL'}`);
      if (exists) matchedCount++;
    }

    console.log(`Matched products: ${matchedCount} / 8`);

    // 2. 신규 상품 등록 모달 열기 및 등록 테스트
    console.log('\n--- [3] Testing New Product Registration Modal & Submit ---');
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    await sleep(3000); // Hydration 완료 대기

    const addBtn = await page.waitForSelector('button[data-testid="open-add-modal-btn"]', { timeout: 10000 });
    await addBtn.click();
    console.log('Clicked add modal button via Puppeteer');
    await sleep(1500);

    await page.screenshot({ path: path.join(__dirname, '..', 'public', 'debug_after_click.png') });
    console.log('Saved debug screenshot to debug_after_click.png');

    const testProductTitle = '2026 에어 메쉬 런닝 캡 (Supabase 자동저장)';
    console.log(`📝 Entering product title: "${testProductTitle}"`);

    await page.waitForSelector('input[data-testid="product-title-input"]', { timeout: 10000 });
    await page.type('input[data-testid="product-title-input"]', testProductTitle);
    await sleep(300);

    const numberInputs = await page.$$('input[type="number"]');
    if (numberInputs.length > 0) {
      await numberInputs[0].click({ clickCount: 3 });
      await numberInputs[0].type('25000');
    }
    await sleep(300);

    // 모달 내의 제출 버튼 클릭
    console.log('🚀 Clicking submit product button...');
    await page.waitForSelector('button[data-testid="product-submit-btn"]', { timeout: 5000 });
    await page.click('button[data-testid="product-submit-btn"]');
    await sleep(1500);

    // 3. 등록된 상품이 테이블 목록 최상단에 반영되었는지 확인
    const updatedBodyText = await page.$eval('body', (el) => el.innerText);
    const isNewProductRendered = updatedBodyText.includes(testProductTitle);
    console.log(`✅ [4] Newly registered product in table: ${isNewProductRendered ? 'PASS' : 'FAIL'}`);

    // 스크린샷 캡처
    const screenshotPath = path.join(__dirname, '..', 'public', 'test_admin_products_supabase.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`📸 [5] Screenshot saved: ${screenshotPath}`);

    if (matchedCount === 8 && isNewProductRendered) {
      console.log('\n=============================================================');
      console.log('🎉 [SUCCESS] 이미지 8개 상품 표시 및 신규 등록 기능 100% 검증 통과!');
      console.log('=============================================================\n');
    } else {
      throw new Error('Some verification checks failed');
    }
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testAdminProducts();
