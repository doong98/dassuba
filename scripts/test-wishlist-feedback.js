const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testWishlistFeedback() {
  console.log('🚀 [테스트] 메인 및 서브 페이지 찜하기 클릭 피드백 & 토스트 검증 시작...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });

  try {
    // 1. 메인 페이지 접속
    console.log('\n1. 메인 페이지(http://localhost:3000) 접속');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    // 2. 메인 페이지 베스트 모자 섹션 하트 버튼 클릭
    console.log('2. 메인 페이지 첫 번째 상품 하트(찜) 클릭');
    const firstHeart = await page.$('button[aria-label="위시리스트 토글"]');
    if (!firstHeart) {
      throw new Error('하트 버튼을 찾을 수 없습니다.');
    }
    await firstHeart.click();
    console.log('  -> 하트 버튼 클릭 완료!');

    // 3. 토스트 팝업 노출 여부 확인
    await new Promise(r => setTimeout(r, 600));
    const toastInfo = await page.evaluate(() => {
      const toastEl = document.querySelector('.fixed.bottom-6.left-1\\/2');
      if (!toastEl) return null;
      return {
        text: toastEl.innerText.replace(/\n/g, ' '),
        hasLink: !!toastEl.querySelector('a[href="/mypage/wishlist"]'),
      };
    });

    console.log('  -> 화면 하단 토스트 팝업 검증 결과:', toastInfo);
    if (toastInfo) {
      console.log('  ✅ 전역 찜 토스트 알림이 화면에 즉각 표시되었습니다!');
    } else {
      console.error('  ❌ 토스트 알림이 표시되지 않았습니다.');
    }

    // 4. 스크린샷 캡처 (메인 페이지 토스트 노출 상태)
    const toastScreenshotPath = path.join(__dirname, '..', 'public', 'toast-feedback-main.png');
    await page.screenshot({ path: toastScreenshotPath });
    console.log(`  -> 스크린샷 저장: ${toastScreenshotPath}`);

    // 5. 서브 페이지(카테고리 /category/ballcap) 이동
    console.log('\n3. 서브 페이지(http://localhost:3000/category/ballcap) 접속');
    await page.goto('http://localhost:3000/category/ballcap', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    // 6. 서브 페이지에서 하트 클릭
    console.log('4. 서브 페이지 첫 번째 모자 하트(찜) 클릭');
    const subHeart = await page.$('button[aria-label="위시리스트 토글"]');
    if (subHeart) {
      await subHeart.click();
      console.log('  -> 서브 페이지 하트 클릭 완료!');
      await new Promise(r => setTimeout(r, 600));

      const subToastInfo = await page.evaluate(() => {
        const toastEl = document.querySelector('.fixed.bottom-6.left-1\\/2');
        return toastEl ? toastEl.innerText.replace(/\n/g, ' ') : null;
      });
      console.log('  -> 서브 페이지 토스트 검증 결과:', subToastInfo);
    }

    // 7. 서브 페이지 스크린샷 캡처
    const subScreenshotPath = path.join(__dirname, '..', 'public', 'toast-feedback-sub.png');
    await page.screenshot({ path: subScreenshotPath });
    console.log(`  -> 서브 페이지 스크린샷 저장: ${subScreenshotPath}`);

    // 8. 찜 목록 페이지 이동 (/mypage/wishlist)
    console.log('\n5. 찜 목록 페이지(http://localhost:3000/mypage/wishlist) 이동');
    await page.goto('http://localhost:3000/mypage/wishlist', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    const totalCountText = await page.evaluate(() => {
      const summary = document.querySelector('.text-sm.font-bold.text-zinc-900');
      return summary ? summary.innerText : '';
    });
    console.log(`  -> 찜 목록 요약: ${totalCountText}`);

    const finalScreenshotPath = path.join(__dirname, '..', 'public', 'wishlist-final-view.png');
    await page.screenshot({ path: finalScreenshotPath, fullPage: true });
    console.log(`  -> 찜 목록 최종 스크린샷 저장: ${finalScreenshotPath}`);

  } catch (err) {
    console.error('❌ 테스트 중 오류:', err);
  } finally {
    await browser.close();
    console.log('\n🏁 테스트 완료.');
  }
}

testWishlistFeedback();
