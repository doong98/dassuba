const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testImageUpload() {
  console.log('🚀 [Chrome Test] Starting Image Upload & Supabase Storage Integration Test...');

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
    await sleep(2500);

    // 1. 신규 상품 등록 모달 열기
    console.log('🖱️ [2] Clicking "+ 신규 상품 등록" button...');
    const addBtn = await page.waitForSelector('button[data-testid="open-add-modal-btn"]', { timeout: 10000 });
    await addBtn.click();
    await sleep(1000);

    // 모달이 열렸는지 확인
    const modalHeader = await page.$eval('body', (el) => el.innerText.includes('신규 모자 상품 등록'));
    console.log(`✅ [3] Modal opened: ${modalHeader ? 'PASS' : 'FAIL'}`);

    // 2. 이미지 파일 업로드 테스트
    console.log('📁 [4] Uploading test image file to modal...');
    const fileInput = await page.waitForSelector('input[data-testid="product-image-file-input"]', { timeout: 5000 });
    
    // 테스트용 샘플 이미지 경로
    const testImageFilePath = path.join(__dirname, '..', 'public', 'images', 'products', 'bundle-2.png');
    await fileInput.uploadFile(testImageFilePath);
    await sleep(2000);

    // 업로드 후 미리보기 이미지 요소 확인
    const previewImg = await page.$('img[alt="업로드 미리보기"]');
    const hasPreview = Boolean(previewImg);
    console.log(`✅ [5] Image preview rendered after upload: ${hasPreview ? 'PASS' : 'FAIL'}`);

    // 업로드 모달 스크린샷 캡처
    const modalScreenshot = path.join(__dirname, '..', 'public', 'test_upload_modal.png');
    await page.screenshot({ path: modalScreenshot });
    console.log(`📸 [6] Modal Screenshot saved: ${modalScreenshot}`);

    // 3. 상품 정보 입력
    const testTitle = '2026 프리미엄 아웃도어 캠프캡 (이미지 업로드 연동)';
    console.log(`📝 [7] Entering title: "${testTitle}"`);
    await page.type('input[data-testid="product-title-input"]', testTitle);
    await sleep(300);

    // 4. Supabase 저장 버튼 클릭
    console.log('🚀 [8] Submitting new product with uploaded image...');
    const submitBtn = await page.waitForSelector('button[data-testid="product-submit-btn"]', { timeout: 5000 });
    await submitBtn.click();
    await sleep(2000);

    // 5. 상품 테이블에 등록되었는지 검증
    const bodyText = await page.$eval('body', (el) => el.innerText);
    const isProductInTable = bodyText.includes(testTitle);
    console.log(`✅ [9] New product with uploaded image listed in table: ${isProductInTable ? 'PASS' : 'FAIL'}`);

    // 최종 테이블 결과 스크린샷 캡처
    const completeScreenshot = path.join(__dirname, '..', 'public', 'test_upload_complete.png');
    await page.screenshot({ path: completeScreenshot });
    console.log(`📸 [10] Final Screenshot saved: ${completeScreenshot}`);

    if (modalHeader && hasPreview && isProductInTable) {
      console.log('\n=============================================================');
      console.log('🎉 [SUCCESS] 이미지 파일 업로드 및 상품 등록 E2E 테스트 100% 통과!');
      console.log('=============================================================\n');
    } else {
      throw new Error('Some verification checks failed');
    }
  } catch (err) {
    console.error('❌ Upload Test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testImageUpload();
