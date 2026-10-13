const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runMaterialsTest() {
  console.log('🚀 Chrome 브라우저에서 원부자재/발주 관리 페이지 테스트 시작...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });

  // 1. 관리자 원부자재 페이지 접속
  console.log('1. http://localhost:3000/admin/materials 페이지 접속');
  await page.goto('http://localhost:3000/admin/materials', { waitUntil: 'networkidle2', timeout: 30000 });

  // 2. 원부자재 테이블 검증
  await page.waitForSelector('table', { timeout: 10000 });
  const tables = await page.$$('table');
  console.log(`발견된 테이블 개수: ${tables.length}`);

  const materialsData = await page.evaluate(() => {
    const table = document.querySelectorAll('table')[0];
    if (!table) return [];
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    return rows.map(r => {
      const cols = Array.from(r.querySelectorAll('td')).map(td => td.textContent.trim());
      return {
        name: cols[0],
        code: cols[1],
        unit: cols[2],
        currentStock: cols[3],
        safetyStock: cols[4],
        status: cols[5],
      };
    });
  });

  console.log('\n[공장 현장 원부자재 재고 현황 검증]');
  materialsData.forEach((m, i) => {
    console.log(`  (${i + 1}) 자재명: ${m.name} | 코드: ${m.code} | 현재고: ${m.currentStock} | 안전재고: ${m.safetyStock} | 상태: ${m.status}`);
  });

  // 3. 발주 대장 테이블 검증
  const poData = await page.evaluate(() => {
    const table = document.querySelectorAll('table')[1];
    if (!table) return [];
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    return rows.map(r => {
      const cols = Array.from(r.querySelectorAll('td')).map(td => td.textContent.trim());
      return {
        date: cols[0],
        supplier: cols[1],
        item: cols[2],
        qty: cols[3],
        amount: cols[4],
        status: cols[5],
        action: cols[6] || '',
      };
    });
  });

  console.log('\n[거래처 발주서 발행 대장 검증]');
  poData.forEach((po, i) => {
    console.log(`  (${i + 1}) 일자: ${po.date} | 거래처: ${po.supplier} | 품목: ${po.item} | 수량: ${po.qty} | 금액: ${po.amount} | 상태: ${po.status} | 입고버튼: ${po.action || '없음'}`);
  });

  // 4. 스크린샷 캡처
  const screenshotPath = path.join(__dirname, '..', 'public', 'chrome_test_admin_materials.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`\n📸 관리자 원부자재 페이지 스크린샷 저장 완료: ${screenshotPath}`);

  // 5. 모달 열기 및 발주서 추가 테스트
  console.log('\n[거래처 발주서 생성 모달 테스트]');
  const clicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.includes('거래처 발주서 생성'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });

  if (clicked) {
    console.log('  -> 거래처 발주서 생성 버튼 클릭 완료');
    await page.waitForSelector('form', { timeout: 5000 });
    console.log('  -> 발주서 폼 모달 정상 렌더링 확인');

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const cancelBtn = buttons.find(b => b.textContent && b.textContent.includes('취소'));
      if (cancelBtn) cancelBtn.click();
    });
    console.log('  -> 모달 취소 닫기 확인');
  }

  await browser.close();
  console.log('\n🎉 원부자재/발주관리 Chrome 브라우저 테스트 완료!');
}

runMaterialsTest().catch(console.error);
