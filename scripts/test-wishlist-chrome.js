const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runWishlistTest() {
  console.log('🚀 Chrome 브라우저에서 찜(Wishlist) 기능 E2E 테스트 시작...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });

  page.on('dialog', async d => await d.accept());

  try {
    // 1. 메인 페이지 접속
    console.log('1. http://localhost:3000 메인 페이지 접속');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    // 2. 초기 헤더 찜 상태 확인
    const initialBadge = await page.evaluate(() => {
      const link = document.querySelector('a[href="/mypage/wishlist"]');
      const badge = link ? link.querySelector('span') : null;
      return badge ? badge.innerText.trim() : '0';
    });
    console.log(`  -> 초기 헤더 찜 카운트: ${initialBadge}`);

    // 3. 베스트 모자 랭킹 섹션 찜 버튼 클릭
    console.log('2. 베스트 상품 카드의 하트(찜) 버튼 클릭');
    const firstHeartBtn = await page.$('button[aria-label="위시리스트 토글"]');
    if (firstHeartBtn) {
      await firstHeartBtn.click();
      console.log('  -> 1번째 상품 찜 버튼 클릭 완료!');
      await new Promise(r => setTimeout(r, 1200));
    } else {
      console.warn('  -> 위시리스트 토글 버튼을 찾지 못함. fallback 탐색');
    }

    // 4. 헤더 뱃지 변경 확인
    const updatedBadge = await page.evaluate(() => {
      const link = document.querySelector('a[href="/mypage/wishlist"]');
      const badge = link ? link.querySelector('span.bg-red-500') : null;
      return badge ? badge.innerText.trim() : '0';
    });
    console.log(`  -> 찜 추가 후 헤더 찜 카운트: ${updatedBadge}`);

    // 5. 찜 목록 페이지 이동 (/mypage/wishlist)
    console.log('3. http://localhost:3000/mypage/wishlist 페이지 이동');
    await page.goto('http://localhost:3000/mypage/wishlist', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // 6. 찜 목록 아이템 데이터 추출 및 검증
    const wishlistItems = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.grid > div'));
      return cards.map(c => {
        const titleEl = c.querySelector('h3');
        const priceEl = c.querySelector('span.text-zinc-950');
        const imgEl = c.querySelector('img');
        return {
          title: titleEl ? titleEl.innerText.trim() : '',
          price: priceEl ? priceEl.innerText.trim() : '',
          img: imgEl ? imgEl.src : '',
        };
      }).filter(c => c.title !== '');
    });

    console.log(`\n4. 찜한 상품 목록 확인 (총 ${wishlistItems.length}개):`);
    wishlistItems.forEach((item, idx) => {
      console.log(`  [${idx + 1}] ${item.title} | ${item.price}`);
    });

    if (wishlistItems.length > 0) {
      console.log('  ✅ 찜한 상품 목록이 정상적으로 렌더링되었습니다!');
    } else {
      console.log('  ⚠️ 찜 목록이 비어있거나 불러오지 못함');
    }

    // 7. 장바구니 담기 버튼 인터랙션 테스트
    console.log('\n5. 찜 목록에서 첫 번째 상품 [장바구니 담기] 클릭 테스트');
    const addedToCart = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const cartBtn = btns.find(b => b.innerText.includes('장바구니 담기'));
      if (cartBtn) {
        cartBtn.click();
        return true;
      }
      return false;
    });
    console.log(`  -> 장바구니 담기 버튼 클릭 결과: ${addedToCart}`);
    await new Promise(r => setTimeout(r, 1200));

    // 8. 스크린샷 캡처
    const screenshotDir = path.join(__dirname, '..', 'public');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    const screenshotPath = path.join(screenshotDir, 'wishlist-test-result.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`\n6. 찜 목록 페이지 스크린샷 저장 완료: ${screenshotPath}`);

  } catch (err) {
    console.error('❌ 테스트 중 오류 발생:', err);
  } finally {
    await browser.close();
    console.log('🏁 Chrome 브라우저 테스트 완료.');
  }
}

runWishlistTest();
