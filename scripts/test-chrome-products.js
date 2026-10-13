const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runChromeTest() {
  console.log('🚀 Chrome 브라우저 테스트 시작...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const testResults = {
    adminProducts: { success: false, items: [], errors: [] },
    publicProducts: { success: false, items: [], errors: [] }
  };

  // 1. 관리자 상품 관리 페이지 테스트
  try {
    console.log('\n--- 1. 관리자 페이지 (http://localhost:3000/admin/products) 테스트 ---');
    await page.goto('http://localhost:3000/admin/products', { waitUntil: 'networkidle2', timeout: 30000 });
    
    // 테이블 내 이미지 로드 대기
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const adminRows = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      return rows.map(r => {
        const titleEl = r.querySelector('td:nth-child(2) div.font-medium') || r.querySelector('td:nth-child(2)');
        const imgEl = r.querySelector('td:nth-child(1) img');
        return {
          title: titleEl ? titleEl.textContent.trim() : '알 수 없음',
          imgSrc: imgEl ? imgEl.src : null,
          imgComplete: imgEl ? imgEl.complete : false,
          imgNaturalWidth: imgEl ? imgEl.naturalWidth : 0
        };
      });
    });

    console.log(`총 ${adminRows.length}개 상품 행 발견:`);
    adminRows.forEach((item, idx) => {
      const isSupabase = item.imgSrc && item.imgSrc.includes('supabase.co/storage/v1/object/public/products');
      const isLoaded = item.imgNaturalWidth > 0;
      console.log(`[${idx + 1}] 상품명: ${item.title}`);
      console.log(`    이미지 URL: ${item.imgSrc}`);
      console.log(`    Supabase Storage 여부: ${isSupabase ? '✅ YES' : '❌ NO'}`);
      console.log(`    이미지 렌더링 정상: ${isLoaded ? '✅ 정상 로드' : '⚠️ 로드 실패'}`);
    });

    testResults.adminProducts.items = adminRows;
    testResults.adminProducts.success = adminRows.length > 0 && adminRows.every(r => r.imgNaturalWidth > 0);

    const screenshotDir = path.join(__dirname, '..', 'public');
    const adminScreenshotPath = path.join(screenshotDir, 'chrome_test_admin_products.png');
    await page.screenshot({ path: adminScreenshotPath, fullPage: true });
    console.log(`📸 관리자 페이지 스크린샷 저장 완료: ${adminScreenshotPath}`);
  } catch (err) {
    console.error('관리자 페이지 테스트 오류:', err.message);
    testResults.adminProducts.errors.push(err.message);
  }

  // 2. 고객 쇼핑몰 메인 페이지 및 카테고리 페이지 테스트
  try {
    console.log('\n--- 2. 고객 쇼핑몰 메인 페이지 (http://localhost:3000/) 테스트 ---');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2', timeout: 30000 });

    const mainImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.map(img => ({
        src: img.src,
        alt: img.alt || '',
        naturalWidth: img.naturalWidth
      })).filter(i => i.src.includes('supabase.co/storage/v1/object/public/products'));
    });

    console.log(`메인 페이지에서 Supabase Storage 상품 이미지 ${mainImages.length}개 발견:`);
    mainImages.forEach((img, idx) => {
      console.log(`[${idx + 1}] alt: "${img.alt}" | 렌더링 정상: ${img.naturalWidth > 0 ? '✅ 성공' : '❌ 실패'}`);
    });

    const mainScreenshotPath = path.join(__dirname, '..', 'public', 'chrome_test_main_page.png');
    await page.screenshot({ path: mainScreenshotPath });
    console.log(`📸 메인 페이지 스크린샷 저장 완료: ${mainScreenshotPath}`);
  } catch (err) {
    console.error('메인 페이지 테스트 오류:', err.message);
  }

  // 3. 카테고리 페이지 (http://localhost:3000/category/all 또는 ballcap)
  try {
    console.log('\n--- 3. 카테고리 페이지 (http://localhost:3000/category/ballcap) 테스트 ---');
    await page.goto('http://localhost:3000/category/ballcap', { waitUntil: 'networkidle2', timeout: 30000 });

    const categoryImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.map(img => ({
        src: img.src,
        alt: img.alt || '',
        naturalWidth: img.naturalWidth
      })).filter(i => i.src.includes('supabase.co/storage/v1/object/public/products'));
    });

    console.log(`카테고리 페이지에서 Supabase Storage 상품 이미지 ${categoryImages.length}개 발견:`);
    categoryImages.forEach((img, idx) => {
      console.log(`[${idx + 1}] alt: "${img.alt}" | 렌더링 정상: ${img.naturalWidth > 0 ? '✅ 성공' : '❌ 실패'}`);
    });

    const catScreenshotPath = path.join(__dirname, '..', 'public', 'chrome_test_category_page.png');
    await page.screenshot({ path: catScreenshotPath });
    console.log(`📸 카테고리 페이지 스크린샷 저장 완료: ${catScreenshotPath}`);
  } catch (err) {
    console.error('카테고리 페이지 테스트 오류:', err.message);
  }

  await browser.close();
  console.log('\n🎉 Chrome 브라우저 테스트 완료!');
}

runChromeTest().catch(console.error);
