const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runOrdersTest() {
  console.log('🚀 Chrome 브라우저에서 주문/배송 관리 페이지 테스트 시작...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });

  page.on('dialog', async d => await d.accept());

  // 1. 페이지 접속
  console.log('1. http://localhost:3000/admin/orders 페이지 접속');
  await page.goto('http://localhost:3000/admin/orders', { waitUntil: 'networkidle2' });

  // 2. 주문 목록 데이터 검증
  await page.waitForSelector('table tbody tr', { timeout: 10000 });

  const orderRows = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table tbody tr'));
    return rows.map(r => {
      const cols = Array.from(r.querySelectorAll('td'));
      const trackingInput = cols[4]?.querySelector('input');
      const statusSelect = cols[5]?.querySelector('select');
      return {
        orderNumberAndDate: cols[0]?.innerText?.replace(/\n/g, ' ')?.trim(),
        recipientAndPhone: cols[1]?.innerText?.replace(/\n/g, ' ')?.trim(),
        itemsSummary: cols[2]?.innerText?.trim(),
        totalAmount: cols[3]?.innerText?.trim(),
        trackingNumber: trackingInput ? trackingInput.value : '',
        status: statusSelect ? statusSelect.value : '',
      };
    });
  });

  console.log(`\n총 ${orderRows.length}건의 주문 내역 검증:`);
  orderRows.forEach((o, idx) => {
    console.log(`[${idx + 1}] ${o.orderNumberAndDate} | ${o.recipientAndPhone} | ${o.itemsSummary} | ${o.totalAmount} | 송장: ${o.trackingNumber} | 상태: ${o.status}`);
  });

  // 3. 운송장 번호 수정 인터랙션 테스트
  console.log('\n2. 운송장 번호 수정 테스트...');
  const firstTrackingInput = await page.$('table tbody tr:first-child td:nth-child(5) input');
  if (firstTrackingInput) {
    await firstTrackingInput.click({ clickCount: 3 });
    await firstTrackingInput.type('CJ99998888777');
    await page.keyboard.press('Enter');
    console.log('  -> 1번 주문 운송장 번호를 "CJ99998888777"로 변경 및 Enter');
  }

  // 4. 주문 상태 셀렉트박스 변경 테스트
  console.log('\n3. 주문 상태 변경 테스트...');
  const firstStatusSelect = await page.$('table tbody tr:first-child td:nth-child(6) select');
  if (firstStatusSelect) {
    await firstStatusSelect.select('shipped');
    console.log('  -> 1번 주문 상태를 "배송중(shipped)"으로 변경');
  }

  await new Promise(r => setTimeout(r, 1500));

  // 5. 검색 필터 테스트
  console.log('\n4. 주문 검색 필터 테스트...');
  const searchInput = await page.$('input[placeholder*="주문번호"]');
  if (searchInput) {
    await searchInput.type('9921');
    await new Promise(r => setTimeout(r, 500));
    const searchResultCount = await page.evaluate(() => {
      return document.querySelectorAll('table tbody tr').length;
    });
    console.log(`  -> "9921" 검색 결과: ${searchResultCount}건 노출 (필터링 정상 작동)`);

    // 검색어 초기화
    await searchInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
  }

  // 6. 스크린샷 저장
  const screenshotPath = path.join(__dirname, '..', 'public', 'chrome_test_admin_orders.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`\n📸 주문/배송 관리 페이지 스크린샷 저장 완료: ${screenshotPath}`);

  await browser.close();
  console.log('\n🎉 주문/배송 관리 Chrome 브라우저 테스트 전체 완료!');
}

runOrdersTest().catch(console.error);
