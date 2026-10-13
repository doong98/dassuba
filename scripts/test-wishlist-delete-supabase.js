const puppeteer = require('puppeteer-core');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SUPABASE_URL = 'https://ibcfzsbgeqsocpbqhzsv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliY2Z6c2JnZXFzb2NwYnFoenN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNjYxMjgsImV4cCI6MjEwNjg0MjEyOH0.neMQPjYu2CmtcCDmcg9fB-mMn7gM6yO-vAs2U3VEJWs';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runWishlistDeleteTest() {
  console.log('🚀 [E2E] 찜한 상품 페이지 삭제 시 Supabase DB 삭제 연동 테스트 시작...');

  // 1. 테스트 전 Supabase의 wishlist 테이블 상태 확인
  const beforeDb = await supabase.from('wishlist').select('*');
  console.log(`\n1. 테스트 전 Supabase wishlist 테이블 행 개수: ${beforeDb.data?.length}개`);
  beforeDb.data?.forEach((row, i) => {
    console.log(`   [${i + 1}] ID: ${row.id} | 유저: ${row.user_id} | 상품: ${row.product_title} (${row.product_id})`);
  });

  // 테스트를 위해 전용 테스트 상품 1건을 Supabase에 확실하게 추가
  const testId = `wish-e2e-${Date.now()}`;
  const testProdId = `prod-e2e-${Date.now()}`;
  await supabase.from('wishlist').insert({
    id: testId,
    user_id: 'usr-demo-01',
    product_id: testProdId,
    product_title: '⚡ E2E 삭제 테스트용 모자',
    product_price: 28000,
    product_image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=600',
    category: 'ballcap'
  });
  console.log(`\n2. 테스트용 찜 상품 Supabase DB에 등록 완료: ${testId}`);

  // 2. 크롬 브라우저 구동
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });

  page.on('dialog', async d => await d.accept());

  try {
    // 3. 찜한 상품 페이지 접속
    console.log('\n3. http://localhost:3000/mypage/wishlist 접속');
    await page.goto('http://localhost:3000/mypage/wishlist', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // 4. 테스트 상품 카드가 화면에 존재하는지 확인
    const foundCard = await page.evaluate((title) => {
      const cards = Array.from(document.querySelectorAll('.grid > div'));
      const target = cards.find(c => c.innerText.includes('E2E 삭제 테스트용 모자'));
      return !!target;
    }, '⚡ E2E 삭제 테스트용 모자');

    console.log(`  -> 브라우저 화면에 테스트 상품 카드 렌더링 확인: ${foundCard}`);

    // 5. 테스트 상품의 삭제(휴지통) 버튼 클릭
    console.log('\n4. 브라우저에서 테스트 상품의 [삭제] 버튼 클릭 인터랙션');
    const deleteClicked = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.grid > div'));
      const target = cards.find(c => c.innerText.includes('E2E 삭제 테스트용 모자'));
      if (!target) return false;
      const trashBtn = target.querySelector('button[title="삭제"]');
      if (trashBtn) {
        trashBtn.click();
        return true;
      }
      return false;
    });

    console.log(`  -> 삭제 버튼 클릭 결과: ${deleteClicked}`);
    await new Promise(r => setTimeout(r, 2000));

    // 6. 브라우저 화면에서 제거되었는지 확인
    const stillOnScreen = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.grid > div'));
      return cards.some(c => c.innerText.includes('E2E 삭제 테스트용 모자'));
    });
    console.log(`  -> 브라우저 화면에서 카드 사라짐 확인: ${!stillOnScreen}`);

    // 7. Supabase DB에서 실제로 삭제되었는지 쿼리로 직접 검증!
    console.log('\n5. Supabase wishlist 테이블에서 실제로 삭제되었는지 DB 직접 검증...');
    const afterDb = await supabase.from('wishlist').select('*').eq('id', testId);
    console.log(`  -> Supabase 테이블에서 조회된 해당 행 개수: ${afterDb.data?.length}개`);

    if (afterDb.data?.length === 0) {
      console.log('  🎉 [성공] Supabase wishlist 테이블에서도 해당 데이터가 완전히 삭제되었습니다!');
    } else {
      console.error('  ❌ [실패] Supabase 테이블에 아직 데이터가 남아있습니다.');
    }

    // 8. 스크린샷 캡처
    const screenshotPath = path.join(__dirname, '..', 'public', 'test-wishlist-delete-verified.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`\n6. 최종 검증 스크린샷 저장 완료: ${screenshotPath}`);

  } catch (err) {
    console.error('❌ 테스트 중 에러:', err);
  } finally {
    await browser.close();
    console.log('🏁 크롬 E2E 테스트 종료.');
  }
}

runWishlistDeleteTest();
