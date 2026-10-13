const puppeteer = require('puppeteer-core');

async function testSubmitTarget() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new'
  });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

  await page.goto('http://localhost:3000/admin/materials', { waitUntil: 'networkidle2' });

  // 초기 발주서 목록 수 확인
  const initialCount = await page.evaluate(() => {
    return document.querySelectorAll('table')[1]?.querySelectorAll('tbody tr').length || 0;
  });
  console.log('1. 작성 전 발주서 목록 수:', initialCount);

  // 모달 열기
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text.includes('거래처 발주서 생성')) {
      await b.click();
      break;
    }
  }

  await page.waitForSelector('#purchase-order-form', { visible: true });
  console.log('2. #purchase-order-form 모달 정상 노출 확인');

  // 외주 협력사명 입력
  const supplierInput = await page.$('#purchase-order-form input[type="text"]');
  if (supplierInput) {
    await supplierInput.click({ clickCount: 3 });
    await supplierInput.type('(주)신세계패브릭');
  }

  // 발주 수량 입력
  const qtyInput = await page.$('#purchase-order-form input[type="number"]');
  if (qtyInput) {
    await qtyInput.click({ clickCount: 3 });
    await qtyInput.type('150');
  }

  console.log('3. 폼 제출 버튼 (#submit-purchase-order-btn) 클릭 실행');
  await page.click('#submit-purchase-order-btn');

  // 대기 및 응답 대기
  await new Promise(r => setTimeout(r, 2500));

  // 발주서 목록 재조회
  const finalCount = await page.evaluate(() => {
    return document.querySelectorAll('table')[1]?.querySelectorAll('tbody tr').length || 0;
  });
  console.log('4. 작성 후 발주서 목록 수:', finalCount);

  const rows = await page.evaluate(() => {
    const table = document.querySelectorAll('table')[1];
    return Array.from(table.querySelectorAll('tbody tr')).map(tr => {
      const cols = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim());
      return cols.join(' | ');
    });
  });

  console.log('5. 현재 발주 대장 목록 전체:');
  rows.forEach((r, idx) => console.log(`   [${idx + 1}] ${r}`));

  await browser.close();
  console.log('🎉 테스트 완료!');
}

testSubmitTarget().catch(console.error);
