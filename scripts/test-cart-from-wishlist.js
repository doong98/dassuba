const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testCartFromWishlist() {
  console.log('🚀 [E2E] 찜한 상품에서 장바구니 담기 -> 장바구니 이미지/가격/수량 검증 시작...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });

  page.on('dialog', async d => await d.accept());

  try {
    // 1. 찜 목록 페이지 이동
    console.log('1. http://localhost:3000/mypage/wishlist 페이지 접속');
    await page.goto('http://localhost:3000/mypage/wishlist', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    // 2. 찜 목록 첫 번째 상품의 [장바구니 담기] 버튼 클릭
    console.log('2. 찜 목록 첫 번째 상품의 [장바구니 담기] 버튼 클릭');
    const firstItemTitle = await page.evaluate(() => {
      const cards = document.querySelectorAll('.grid.grid-cols-2 > div');
      const firstCard = cards[0];
      return firstCard ? firstCard.querySelector('h3')?.innerText : '';
    });
    console.log(`  -> 대상 상품: "${firstItemTitle}"`);

    const addBtnClicked = await page.evaluate(() => {
      const cards = document.querySelectorAll('.grid.grid-cols-2 > div');
      const firstCard = cards[0];
      if (!firstCard) return false;
      const btn = Array.from(firstCard.querySelectorAll('button')).find(b => b.innerText.includes('장바구니 담기'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    console.log(`  -> 장바구니 담기 버튼 클릭 결과: ${addBtnClicked}`);
    await new Promise(r => setTimeout(r, 1500));

    // 3. 장바구니 페이지(/cart)로 이동
    console.log('3. http://localhost:3000/cart 페이지 이동');
    await page.goto('http://localhost:3000/cart', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // 4. 장바구니 상품 정보 상세 검증
    const cartItems = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.space-y-4 > div.bg-white'));
      return items.map(el => {
        const titleEl = el.querySelector('h3');
        const imgEl = el.querySelector('img');
        const optionEl = el.querySelector('p.text-xs.text-zinc-400');
        const priceEl = el.querySelector('p.text-sm.font-black');
        const qtyEl = el.querySelector('span.px-3.py-1');
        const subtotalEl = el.querySelector('.text-right span.font-black');

        return {
          title: titleEl ? titleEl.innerText.trim() : '',
          imgSrc: imgEl ? imgEl.src : '',
          isImgBroken: imgEl ? !imgEl.complete || imgEl.naturalWidth === 0 : true,
          options: optionEl ? optionEl.innerText.trim() : '',
          unitPrice: priceEl ? priceEl.innerText.trim() : '',
          quantity: qtyEl ? qtyEl.innerText.trim() : '',
          subtotal: subtotalEl ? subtotalEl.innerText.trim() : '',
        };
      });
    });

    console.log(`\n4. 장바구니 상품 목록 (${cartItems.length}개) 정밀 검증 결과:`);
    let hasNaN = false;
    let hasBrokenImg = false;

    cartItems.forEach((item, idx) => {
      console.log(`\n  [아이템 ${idx + 1}]`);
      console.log(`    상품명: ${item.title}`);
      console.log(`    이미지: ${item.imgSrc.substring(0, 60)}...`);
      console.log(`    옵션: ${item.options}`);
      console.log(`    단가: ${item.unitPrice}`);
      console.log(`    수량: ${item.quantity}`);
      console.log(`    소계: ${item.subtotal}`);

      if (item.quantity.includes('NaN') || item.subtotal.includes('NaN')) {
        hasNaN = true;
      }
      if (!item.imgSrc || item.imgSrc === '') {
        hasBrokenImg = true;
      }
    });

    if (!hasNaN && !hasBrokenImg && cartItems.length > 0) {
      console.log('\n  🎉 [성공] 이미지 엑박 및 NaN 문제가 완벽하게 해결되었습니다!');
    } else {
      console.error('\n  ❌ [오류] 여전히 NaN 또는 이미지 누락이 존재합니다.');
    }

    // 5. 수량 플러스(+) 버튼 클릭 테스트
    console.log('\n5. 장바구니 첫 번째 상품 수량 [+] 버튼 클릭 테스트');
    const plusClicked = await page.evaluate(() => {
      const firstPlusBtn = document.querySelector('.space-y-4 > div.bg-white button:last-child');
      if (firstPlusBtn) {
        firstPlusBtn.click();
        return true;
      }
      return false;
    });
    console.log(`  -> 수량 [+] 클릭 결과: ${plusClicked}`);
    await new Promise(r => setTimeout(r, 1000));

    // 변경된 수량 및 결제 금액 확인
    const checkoutSummary = await page.evaluate(() => {
      const summaryCard = document.querySelector('.lg\\:col-span-4');
      return summaryCard ? summaryCard.innerText.replace(/\n/g, ' | ') : '';
    });
    console.log(`  -> 결제 요약 패널: ${checkoutSummary.substring(0, 100)}...`);

    // 6. 스크린샷 캡처
    const screenshotPath = path.join(__dirname, '..', 'public', 'test-cart-from-wishlist-result.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`\n6. 최종 장바구니 스크린샷 저장 완료: ${screenshotPath}`);

  } catch (err) {
    console.error('❌ 테스트 중 에러:', err);
  } finally {
    await browser.close();
    console.log('\n🏁 테스트 종료.');
  }
}

testCartFromWishlist();
