const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runEndToEndProductTest() {
  console.log('🚀 신규 상품 등록 후 메인페이지 및 서브페이지 실시간 표시 E2E 테스트 시작...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });

  page.on('dialog', async d => await d.accept());
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('POST') || text.includes('등록') || text.includes('상품')) {
      console.log('  [Browser Log]:', text);
    }
  });

  const randomTag = Date.now().toString().slice(-4);
  const testProductTitle = `2026 프리미엄 아웃도어 캠프 볼캡 (${randomTag})`;

  // 1. 관리자 상품 관리 페이지 접속 및 신규 상품 등록
  console.log('\n--- 1. 관리자 페이지에서 신규 상품 등록 ---');
  await page.goto('http://localhost:3000/admin/products', { waitUntil: 'networkidle2' });

  // 모달 열기 버튼 클릭
  const openModalBtn = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(el => el.textContent && el.textContent.includes('신규 상품 등록'));
    if (b) { b.click(); return true; }
    return false;
  });
  console.log('  -> 신규 상품 등록 모달 열기:', openModalBtn);

  await page.waitForSelector('#admin-product-create-form', { visible: true, timeout: 5000 });
  console.log('  -> #admin-product-create-form 모달 확인');

  // 상품명 입력
  const titleInput = await page.$('input[data-testid="product-title-input"]');
  if (titleInput) {
    await titleInput.click({ clickCount: 3 });
    await titleInput.type(testProductTitle);
  }

  // 판매가 입력
  const priceInput = await page.$('#admin-product-create-form input[type="number"]');
  if (priceInput) {
    await priceInput.click({ clickCount: 3 });
    await priceInput.type('35000');
  }

  // 1+1 기획전 체크박스 클릭
  await page.evaluate(() => {
    const checkbox = document.querySelector('#admin-product-create-form input[type="checkbox"]');
    if (checkbox && !checkbox.checked) checkbox.click();
  });

  console.log('  -> 폼 입력 완료, 등록 버튼 클릭 실행');
  await page.click('button[data-testid="product-submit-btn"]');

  await new Promise(r => setTimeout(r, 2500));

  // 관리자 테이블에 반영 확인
  const isFoundInAdmin = await page.evaluate((title) => {
    const tableText = document.querySelector('table')?.textContent || '';
    return tableText.includes(title);
  }, testProductTitle);
  console.log(`  -> 관리자 상품 목록 테이블 반영: ${isFoundInAdmin ? '✅ 성공' : '❌ 실패'}`);

  // 2. 메인 페이지 (http://localhost:3000/) 검증
  console.log('\n--- 2. 메인페이지 (http://localhost:3000/) 실시간 표시 검증 ---');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  const mainPageHasProduct = await page.evaluate((title) => {
    const bodyText = document.body.textContent || '';
    return bodyText.includes(title);
  }, testProductTitle);
  console.log(`  -> 메인페이지에 등록 상품 "${testProductTitle}" 노출 여부:`, mainPageHasProduct ? '✅ 성공 (정상 표시됨)' : '❌ 실패');

  const mainScreenshot = path.join(__dirname, '..', 'public', 'chrome_test_main_after_new_product.png');
  await page.screenshot({ path: mainScreenshot, fullPage: false });
  console.log(`  📸 메인페이지 스크린샷 저장: ${mainScreenshot}`);

  // 3. 서브페이지: 볼캡 카테고리 페이지 (http://localhost:3000/category/ballcap) 검증
  console.log('\n--- 3. 서브페이지: 볼캡 카테고리 (http://localhost:3000/category/ballcap) 실시간 표시 검증 ---');
  await page.goto('http://localhost:3000/category/ballcap', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  const categoryPageHasProduct = await page.evaluate((title) => {
    const bodyText = document.body.textContent || '';
    return bodyText.includes(title);
  }, testProductTitle);
  console.log(`  -> 볼캡 서브페이지에 등록 상품 "${testProductTitle}" 노출 여부:`, categoryPageHasProduct ? '✅ 성공 (정상 표시됨)' : '❌ 실패');

  const catScreenshot = path.join(__dirname, '..', 'public', 'chrome_test_category_after_new_product.png');
  await page.screenshot({ path: catScreenshot, fullPage: false });
  console.log(`  📸 카테고리 서브페이지 스크린샷 저장: ${catScreenshot}`);

  // 4. 서브페이지: 1+1 기획전 페이지 (http://localhost:3000/category/bundle1plus1) 검증
  console.log('\n--- 4. 서브페이지: 1+1 기획전 (http://localhost:3000/category/bundle1plus1) 검증 ---');
  await page.goto('http://localhost:3000/category/bundle1plus1', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  const bundlePageHasProduct = await page.evaluate((title) => {
    const bodyText = document.body.textContent || '';
    return bodyText.includes(title);
  }, testProductTitle);
  console.log(`  -> 1+1 서브페이지에 등록 상품 "${testProductTitle}" 노출 여부:`, bundlePageHasProduct ? '✅ 성공 (정상 표시됨)' : '❌ 실패');

  await browser.close();
  console.log('\n🎉 E2E 테스트 전체 통과 완료!');
}

runEndToEndProductTest().catch(console.error);
