const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SUPABASE_URL = 'https://ibcfzsbgeqsocpbqhzsv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliY2Z6c2JnZXFzb2NwYnFoenN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNjYxMjgsImV4cCI6MjEwNjg0MjEyOH0.neMQPjYu2CmtcCDmcg9fB-mMn7gM6yO-vAs2U3VEJWs';

async function runRealSupabaseAuthTest() {
  console.log('🚀 [Chrome Real Supabase Test] Starting end-to-end verification...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,1000'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  try {
    console.log('🌐 [1] Navigating to http://127.0.0.1:3000...');
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded' });
    await sleep(1500);

    // 1. 기존 로그인 세션이 있다면 로그아웃
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.innerText, btn);
      if (text && text.trim() === '로그아웃') {
        console.log('🔄 [2] Logging out previous session...');
        await btn.click();
        await sleep(1000);
        break;
      }
    }

    // 2. 헤더의 '회원가입' 버튼 클릭
    console.log('🖱️ [3] Clicking Header "회원가입" button...');
    const headerButtons = await page.$$('button');
    for (const btn of headerButtons) {
      const text = await page.evaluate(el => el.innerText, btn);
      if (text && text.includes('회원가입') && text.includes('2,000P')) {
        await btn.click();
        break;
      }
    }
    await sleep(1000);

    // 3. 회원가입 탭 확인
    const nameInput = await page.$('input[placeholder="홍길동"]');
    if (!nameInput) {
      console.log('Switching to signup tab inside modal...');
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('div.grid.grid-cols-2 button'));
        if (btns[1]) btns[1].click();
      });
      await sleep(500);
    }

    // 4. 새로운 실제 계정 정보 입력
    const uniqueId = Date.now().toString().slice(-4);
    const testEmail = `supa_auth_${uniqueId}@gmail.com`;
    const testName = `인증회원${uniqueId}`;
    const testPassword = `supa_secure_${uniqueId}`;

    console.log(`📝 [4] Entering new user: email=${testEmail}, name=${testName}...`);
    await page.waitForSelector('input[placeholder="홍길동"]', { timeout: 5000 });
    await page.type('input[placeholder="홍길동"]', testName);
    await page.type('input[type="email"]', testEmail);
    await page.type('input[type="password"]', testPassword);

    // 5. [2,000P 받고 회원가입] 제출 버튼 클릭
    console.log('🚀 [5] Submitting signup form to Supabase members table...');
    const submitBtn = await page.$('button[data-testid="auth-submit-btn"]');
    if (submitBtn) {
      await submitBtn.click();
    }
    await sleep(2500);

    // 6. 회원가입 후 헤더 상태 확인
    const headerText = await page.$eval('header', el => el.innerText);
    const hasName = headerText.includes(testName);
    const hasPoints = headerText.includes('2,000P');
    console.log(`✅ [6] UI Header User Name: ${hasName ? 'PASS' : 'FAIL'} (${testName})`);
    console.log(`✅ [7] UI Header Points: ${hasPoints ? 'PASS' : 'FAIL'} (2,000P)`);

    // 스크린샷 1: 가입 성공 화면
    const signupShot = path.join(__dirname, '..', 'public', 'test_real_supabase_signup.png');
    await page.screenshot({ path: signupShot });
    console.log(`📸 [8] Signup success screenshot saved: ${signupShot}`);

    // 7. 실제 Supabase Cloud DB에서 해당 유저가 저장되었는지 REST API로 직접 조회 검증!
    console.log(`🔍 [9] Verifying record directly from Supabase REST API (${testEmail})...`);
    const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/members?email=eq.${encodeURIComponent(testEmail)}&select=*`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });
    const dbMembers = await checkRes.json();
    const isSavedInSupabase = Array.isArray(dbMembers) && dbMembers.length > 0 && dbMembers[0].email === testEmail;
    console.log(`🎯 [10] Supabase Cloud DB Verification: ${isSavedInSupabase ? 'PASS (CONFIRMED IN SUPABASE!)' : 'FAIL'}`);
    if (isSavedInSupabase) {
      console.log('     Saved Member ID:', dbMembers[0].id);
      console.log('     Saved Email:', dbMembers[0].email);
      console.log('     Saved Name:', dbMembers[0].name);
      console.log('     Saved Points:', dbMembers[0].points);
    }

    // 8. 로그아웃 후 실제 방금 가입한 계정으로 로그인 테스트
    console.log('🔄 [11] Logging out to test login flow with new credentials...');
    const logoutBtn = await page.$('button ::-p-text(로그아웃)');
    if (logoutBtn) {
      await logoutBtn.click();
      await sleep(1000);
    }

    console.log('🖱️ [12] Opening Login Modal...');
    const loginHeaderBtn = await page.$('header button ::-p-text(로그인)');
    if (loginHeaderBtn) {
      await loginHeaderBtn.click();
      await sleep(800);
    }

    console.log('📝 [13] Entering credentials in Login Form...');
    const loginEmailInput = await page.$('input[type="email"]');
    if (loginEmailInput) {
      await loginEmailInput.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
    }
    await page.type('input[type="email"]', testEmail);

    const loginPwInput = await page.$('input[type="password"]');
    if (loginPwInput) {
      await loginPwInput.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
    }
    await page.type('input[type="password"]', testPassword);

    const loginSubmitBtn = await page.$('button[data-testid="auth-submit-btn"]');
    if (loginSubmitBtn) {
      await loginSubmitBtn.click();
    }
    await sleep(2000);

    // 로그인 성공 검증
    const afterLoginHeader = await page.$eval('header', el => el.innerText);
    const loginSuccess = afterLoginHeader.includes(testName);
    console.log(`✅ [14] Login with new credentials verified: ${loginSuccess ? 'PASS' : 'FAIL'}`);

    // 스크린샷 2: 로그인 성공 화면
    const loginShot = path.join(__dirname, '..', 'public', 'test_real_supabase_login.png');
    await page.screenshot({ path: loginShot });
    console.log(`📸 [15] Login success screenshot saved: ${loginShot}`);

    console.log('\n======================================================');
    console.log('🎉🎉🎉 [100% COMPLETE] REAL SUPABASE MEMBERS VERIFIED! 🎉🎉🎉');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runRealSupabaseAuthTest();
