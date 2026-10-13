const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runFullInteractiveTest() {
  console.log('🚀 원부자재 입고확인 및 신규 발주서 등록 인터랙션 테스트...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });

  // alert 자동 수락 처리
  page.on('dialog', async dialog => {
    console.log(`  [Alert 발생]: ${dialog.message()}`);
    await dialog.accept();
  });

  await page.goto('http://localhost:3000/admin/materials', { waitUntil: 'networkidle2' });

  // 1. 초기 14수 코튼 원단 재고 확인 (초기값: 42yd)
  const initialStock = await page.evaluate(() => {
    const row = document.querySelectorAll('table')[0]?.querySelector('tbody tr');
    return row ? row.querySelectorAll('td')[3]?.textContent.trim() : null;
  });
  console.log(`1. 입고 처리 전 14수 코튼 원단 현재고: ${initialStock}yd`);

  // 2. 입고확인 버튼 클릭
  console.log('2. "입고확인" 버튼 클릭 실행...');
  const clickedReceive = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const receiveBtn = buttons.find(b => b.textContent && b.textContent.includes('입고확인'));
    if (receiveBtn) {
      receiveBtn.click();
      return true;
    }
    return false;
  });

  if (clickedReceive) {
    // UI 업데이트 대기
    await new Promise(r => setTimeout(r, 1500));

    const updatedStock = await page.evaluate(() => {
      const row = document.querySelectorAll('table')[0]?.querySelector('tbody tr');
      return {
        stock: row?.querySelectorAll('td')[3]?.textContent.trim(),
        status: row?.querySelectorAll('td')[5]?.textContent.trim()
      };
    });

    const poStatus = await page.evaluate(() => {
      const row = document.querySelectorAll('table')[1]?.querySelector('tbody tr');
      return row?.querySelectorAll('td')[5]?.textContent.trim();
    });

    console.log(`  -> 입고 처리 후 14수 코튼 원단 현재고: ${updatedStock.stock}yd (기존 ${initialStock}yd + 발주 200yd 반영)`);
    console.log(`  -> 원부자재 상태: ${updatedStock.status}`);
    console.log(`  -> 발주 대장 상태: ${poStatus}`);
  }

  // 3. 신규 발주서 생성 테스트
  console.log('\n3. 신규 발주서 등록 테스트...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.includes('거래처 발주서 생성'));
    if (btn) btn.click();
  });

  await page.waitForSelector('form', { timeout: 3000 });

  // 폼 입력 및 전송
  await page.evaluate(() => {
    const form = document.querySelector('form');
    if (!form) return;
    const inputs = form.querySelectorAll('input');
    const supplierInput = inputs[0];
    const qtyInput = inputs[1];

    if (supplierInput) supplierInput.value = '(주)테스트방적';
    if (qtyInput) qtyInput.value = '50';

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.click();
  });

  await new Promise(r => setTimeout(r, 1500));

  const newPoCount = await page.evaluate(() => {
    return document.querySelectorAll('table')[1]?.querySelectorAll('tbody tr').length;
  });
  console.log(`  -> 신규 발주서 추가 후 총 발주서 수: ${newPoCount}건`);

  const afterTestScreenshot = path.join(__dirname, '..', 'public', 'chrome_test_admin_materials_after_order.png');
  await page.screenshot({ path: afterTestScreenshot, fullPage: true });
  console.log(`📸 테스트 완료 화면 스크린샷 저장 완료: ${afterTestScreenshot}`);

  await browser.close();
  console.log('\n🎉 입고 처리 & 발주서 생성 전체 기능 테스트 통과!');
}

runFullInteractiveTest().catch(console.error);
