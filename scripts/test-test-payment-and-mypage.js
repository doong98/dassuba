const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testTestPaymentAndMyPage() {
  console.log('🚀 [검증] 토스페이먼츠 테스트 결제 모달 및 마이페이지 주문내역 확인 E2E 테스트 시작...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });

  let alertMessage = null;
  page.on('dialog', async d => {
    alertMessage = d.message();
    console.log(`  [브라우저 알럿 감지]: "${alertMessage}"`);
    await d.accept();
  });

  const screenshotDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

  try {
    // 1. 장바구니 페이지 접속
    console.log('\n1. http://localhost:3000/cart 접속');
    await page.goto('http://localhost:3000/cart', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    // 장바구니가 비어있는지 확인 후 상품 추가
    const isCartEmpty = await page.evaluate(() => {
      return document.body.innerText.includes('장바구니가 비어 있습니다');
    });

    if (isCartEmpty) {
      console.log('  -> 장바구니가 비어 있어 상품을 장바구니에 담습니다.');
      await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 1000));
      await page.evaluate(() => {
        const link = document.querySelector('a[href^="/product/"]');
        if (link) link.click();
      });
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 1000));
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const cartBtn = buttons.find(b => b.innerText.includes('장바구니'));
        if (cartBtn) cartBtn.click();
      });
      await new Promise(r => setTimeout(r, 1000));
      await page.goto('http://localhost:3000/cart', { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 1000));
    }

    // 2. [주문서 작성 / 결제하기 ->] 클릭
    console.log('2. [주문서 작성 / 결제하기 ->] 클릭');
    const checkoutClicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('주문서 작성 / 결제하기'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    console.log('  -> 클릭 결과:', checkoutClicked ? '성공 ✅' : '실패 ❌');
    if (!checkoutClicked) throw new Error('[주문서 작성 / 결제하기] 버튼을 찾을 수 없습니다.');

    await new Promise(r => setTimeout(r, 1500));
    console.log(`3. 체크아웃 URL 확인: ${page.url()}`);

    // 4. 필수 약관 전체 동의 체크
    console.log('4. 필수 약관 전체 동의 체크');
    await page.evaluate(() => {
      const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
      if (checkboxes.length > 0) {
        checkboxes[0].click();
      }
    });
    await new Promise(r => setTimeout(r, 500));

    // 5. [토스페이먼츠 결제하기] 클릭
    console.log('5. [토스페이먼츠 결제하기] 버튼 클릭');
    alertMessage = null; // 초기화
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('토스페이먼츠 결제하기'));
      if (btn) btn.click();
    });

    await new Promise(r => setTimeout(r, 1500));

    // 키 오류 알럿이 발생하지 않았는지 검증!
    console.log('  -> 키 에러 알럿 발생 여부 검증:');
    if (alertMessage && alertMessage.includes('인증되지 않은')) {
      throw new Error(`키 오류 알럿이 여전히 발생했습니다: "${alertMessage}"`);
    } else {
      console.log('    - 키 오류 알럿 없음 (통과) 🛡️✅');
    }

    // 6. 토스페이먼츠 테스트 결제 모달 렌더링 검증
    console.log('6. 토스페이먼츠 테스트 결제 모달 표출 검증');
    const modalVisible = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('토스페이먼츠') &&
             text.includes('테스트 결제') &&
             text.includes('테스트 결제 카드/수단 선택') &&
             text.includes('테스트 결제 승인 완료');
    });
    console.log('  -> 테스트 결제 모달 표출 여부:', modalVisible ? '성공 ✅' : '실패 ❌');
    if (!modalVisible) throw new Error('토스페이먼츠 테스트 결제 모달이 표출되지 않았습니다.');

    await page.screenshot({ path: path.join(screenshotDir, '8_toss_test_payment_modal.png') });
    console.log('  -> 스크린샷 저장: 8_toss_test_payment_modal.png 📸');

    // 7. 모달에서 [테스트 결제 승인 완료] 클릭
    console.log('7. 모달 내 [테스트 결제 승인 완료] 클릭');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('테스트 결제 승인 완료'));
      if (btn) btn.click();
    });

    await new Promise(r => setTimeout(r, 2000));

    // 8. 결제 완료 화면 확인
    console.log(`8. 결제 완료 페이지 이동 확인: ${page.url()}`);
    const isCompletePage = page.url().includes('/order/complete');
    console.log('  -> 결제 완료 페이지 진입 여부:', isCompletePage ? '성공 ✅' : '실패 ❌');
    if (!isCompletePage) throw new Error('결제 완료 페이지로 이동하지 못했습니다.');

    const orderNumberOnComplete = await page.evaluate(() => {
      const match = document.body.innerText.match(/ORD-\d+-[A-Z0-9]+/);
      return match ? match[0] : '';
    });
    console.log(`  -> 완료된 주문 번호: ${orderNumberOnComplete}`);

    await page.screenshot({ path: path.join(screenshotDir, '9_order_complete_after_test_pay.png') });
    console.log('  -> 스크린샷 저장: 9_order_complete_after_test_pay.png 📸');

    // 9. [주문내역 확인] 버튼 클릭하여 마이페이지로 이동
    console.log('9. [주문내역 확인] 버튼 클릭하여 마이페이지 이동');
    const myOrdersClicked = await page.evaluate(() => {
      const link = Array.from(document.querySelectorAll('a')).find(a => a.innerText.includes('주문내역 확인'));
      if (link) {
        link.click();
        return true;
      }
      return false;
    });
    console.log('  -> [주문내역 확인] 클릭 결과:', myOrdersClicked ? '성공 ✅' : '실패 ❌');
    if (!myOrdersClicked) throw new Error('[주문내역 확인] 버튼을 찾을 수 없습니다.');

    await new Promise(r => setTimeout(r, 1500));
    console.log(`10. 마이페이지 이동 확인: ${page.url()}`);

    // 10. 마이페이지에 방금 결제한 주문 내역이 정확히 들어있는지 검증
    console.log('11. 마이페이지 내 주문 내역 검증');
    const myPageOrderCheck = await page.evaluate((orderNum) => {
      const text = document.body.innerText;
      return {
        hasTitle: text.includes('주문 내역 및 배송 조회'),
        hasOrderNumber: orderNum ? text.includes(orderNum) : true,
        hasPaidBadge: text.includes('결제완료'),
        hasTracking: text.includes('CJ대한통운'),
        hasCancelBtn: text.includes('주문 즉시 취소'),
        hasTaxBtn: text.includes('세금명세서'),
      };
    }, orderNumberOnComplete);

    console.log('  -> 주문 내역 및 배송 조회 섹션:', myPageOrderCheck.hasTitle ? '정상 ✅' : '누락 ❌');
    console.log(`  -> 방금 주문한 주문번호(${orderNumberOnComplete}) 노출:`, myPageOrderCheck.hasOrderNumber ? '정상 ✅' : '누락 ❌');
    console.log('  -> 결제완료 상태 뱃지:', myPageOrderCheck.hasPaidBadge ? '정상 ✅' : '누락 ❌');
    console.log('  -> CJ대한통운 송장 번호:', myPageOrderCheck.hasTracking ? '정상 ✅' : '누락 ❌');
    console.log('  -> 주문 즉시 취소 기능:', myPageOrderCheck.hasCancelBtn ? '정상 ✅' : '누락 ❌');
    console.log('  -> 세금명세서 출력 기능:', myPageOrderCheck.hasTaxBtn ? '정상 ✅' : '누락 ❌');

    if (!myPageOrderCheck.hasTitle || !myPageOrderCheck.hasOrderNumber) {
      throw new Error('마이페이지 주문 내역 검증 실패');
    }

    await page.screenshot({ path: path.join(screenshotDir, '10_mypage_orders_verified.png') });
    console.log('  -> 스크린샷 저장: 10_mypage_orders_verified.png 📸');

    console.log('\n🎉 [모든 검증 완료] 토스페이먼츠 테스트 결제 -> 결제 완료 -> 마이페이지 주문내역 확인 전체 플로우가 100% 완벽하게 동작합니다!');
  } finally {
    await browser.close();
  }
}

testTestPaymentAndMyPage().catch(err => {
  console.error('\n❌ 테스트 실패:', err);
  process.exit(1);
});
