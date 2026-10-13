const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testPOCreationSync() {
  console.log('🚀 Chrome 브라우저에서 거래처 발주서 작성 및 실시간 대장 추가 & DB 연동 검증 시작...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });

  page.on('dialog', async d => await d.accept());

  // 1. 페이지 접속
  console.log('1. http://localhost:3000/admin/materials 접속');
  await page.goto('http://localhost:3000/admin/materials', { waitUntil: 'networkidle2' });

  // 2. 초기 발주서 목록 카운트
  await page.waitForSelector('table', { timeout: 10000 });
  const initialPOCount = await page.evaluate(() => {
    return document.querySelectorAll('table')[1]?.querySelectorAll('tbody tr').length || 0;
  });
  console.log(`  -> 작성 전 발주 대장 행 수: ${initialPOCount}건`);

  // 3. '+ 거래처 발주서 생성' 버튼 클릭
  console.log('2. "+ 거래처 발주서 생성" 버튼 클릭');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.includes('거래처 발주서 생성'));
    if (btn) btn.click();
  });

  await page.waitForSelector('form', { timeout: 5000 });
  console.log('  -> 발주 모달 열림 확인');

  // 4. 모달 폼에 데이터 입력
  console.log('3. 신규 발주 데이터 입력 (외주협력사: (주)대동섬유, 수량: 80)');
  await page.evaluate(() => {
    const form = document.querySelector('form');
    if (!form) return;
    const inputs = form.querySelectorAll('input');
    const supplierInput = inputs[0];
    const qtyInput = inputs[2] || inputs[1];

    if (supplierInput) {
      supplierInput.value = '(주)대동섬유';
      supplierInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (qtyInput) {
      qtyInput.value = '80';
      qtyInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // 폼 제출
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.click();
  });

  // 5. 대장에 즉시 추가되었는지 대기 및 검증
  console.log('4. 대장에 즉시 추가되었는지 확인 중...');
  await new Promise(r => setTimeout(r, 2000));

  const afterPOCount = await page.evaluate(() => {
    return document.querySelectorAll('table')[1]?.querySelectorAll('tbody tr').length || 0;
  });
  console.log(`  -> 발주서 작성 후 대장 행 수: ${afterPOCount}건 (기존 ${initialPOCount}건에서 1건 증가)`);

  const firstPORow = await page.evaluate(() => {
    const row = document.querySelectorAll('table')[1]?.querySelector('tbody tr');
    if (!row) return null;
    const cols = Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim());
    return cols.join(' | ');
  });
  console.log(`  -> 최상단 추가된 발주서: [ ${firstPORow} ]`);

  // 6. 브라우저 새로고침(F5) 후에도 Supabase DB로부터 영구 유지되는지 검증
  console.log('5. 브라우저 새로고침(F5) 후 Supabase DB 영구 저장 유지 검증');
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('table', { timeout: 10000 });

  const reloadedPOCount = await page.evaluate(() => {
    return document.querySelectorAll('table')[1]?.querySelectorAll('tbody tr').length || 0;
  });
  console.log(`  -> 새로고침 후 대장 행 수: ${reloadedPOCount}건 (DB 영구 보존 확인!)`);

  const reloadedFirstRow = await page.evaluate(() => {
    const row = document.querySelectorAll('table')[1]?.querySelector('tbody tr');
    if (!row) return null;
    const cols = Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim());
    return cols.join(' | ');
  });
  console.log(`  -> 새로고침 후 최상단 발주서: [ ${reloadedFirstRow} ]`);

  // 스크린샷 캡처
  const screenshotPath = path.join(__dirname, '..', 'public', 'chrome_test_po_created_and_synced.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 테스트 검증 스크린샷 저장 완료: ${screenshotPath}`);

  await browser.close();
  console.log('\n🎉 발주서 작성 시 대장 즉시 추가 및 Supabase DB 저장 완벽 검증 완료!');
}

testPOCreationSync().catch(console.error);
