/**
 * STELLAR EDU v8.2 — Open Tab Navigator Test Suite
 */
const { chromium } = require('playwright');

(async () => {
  const BASE = 'http://localhost:3001';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const consoleErrors = [];
  const sandboxWarnings = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
    if (msg.text().includes('sandbox')) sandboxWarnings.push(msg.text());
  });

  let passed = 0, failed = 0, aborted = false;
  function ok(name) { passed++; console.log(`  ✅ ${passed}. ${name}`); }
  function fail(name, err) { failed++; console.log(`  ❌ FAIL: ${name} — ${err}`); }

  async function test(name, fn, critical) {
    if (aborted) { console.log(`  ⏭️ SKIP: ${name}`); return; }
    try { await fn(); ok(name); }
    catch (e) {
      fail(name, e.message.substring(0, 120));
      if (critical) { aborted = true; console.log('  🛑 Critical failure — aborting remaining tests'); }
    }
  }

  console.log('\n🚀 STELLAR EDU v8.2 Test Suite\n');

  // 1-2. Page load + Login (critical)
  await test('Page loads and demo login works', async () => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForSelector('#demoBtn', { timeout: 10000 });
    await page.click('#demoBtn');
    // Wait for data to load and render
    await page.waitForSelector('.ph-card', { timeout: 10000 });
  }, true);

  // 3. Dashboard
  await test('Dashboard shows 9 phase cards', async () => {
    const cards = await page.$$('.ph-card');
    if (cards.length !== 9) throw new Error('Found ' + cards.length);
  });

  // 4. Phase 0
  await test('Phase 0 has 3 step cards', async () => {
    await page.click('.ph-card[data-phid="p0"]');
    await page.waitForSelector('.step-card', { timeout: 5000 });
    const steps = await page.$$('.step-card');
    if (steps.length !== 3) throw new Error('Found ' + steps.length);
  });

  // 5. Nav buttons
  await test('Navigator buttons with count badge', async () => {
    const btns = await page.$$('.sc-nav-btn');
    if (btns.length === 0) throw new Error('No nav buttons');
    const cnt = await page.$eval('.sc-nav-cnt', el => el.textContent);
    if (!cnt) throw new Error('No count badge');
  });

  // 6. Navigator opens
  await test('Navigator mode opens with task list + right panel', async () => {
    await page.click('.sc-nav-btn');
    await page.waitForSelector('.nav-container.on', { timeout: 3000 });
    const tasks = await page.$$('.nav-task');
    if (tasks.length === 0) throw new Error('No tasks');
    const inner = await page.$('.nr-inner');
    if (!inner) throw new Error('No .nr-inner');
  }, true);

  // 7. Right panel site card
  await test('Right panel: site card with name', async () => {
    const card = await page.$('.nr-site-card');
    if (!card) throw new Error('No site card');
    const name = await page.$eval('.nr-site-name', el => el.textContent);
    if (!name || name.length < 2) throw new Error('Bad name: ' + name);
  });

  // 8. Right panel hint
  await test('Right panel: hint box', async () => {
    const hint = await page.$eval('.nr-hint-text', el => el.textContent);
    if (!hint || hint.length < 3) throw new Error('Empty hint');
  });

  // 9. Open button
  await test('Right panel: open site button', async () => {
    const btn = await page.$('#navOpenSiteBtn');
    if (!btn) throw new Error('No open site button');
    const text = await btn.textContent();
    if (!text.includes('열기')) throw new Error('Button text: ' + text);
  });

  // 10. Check button
  await test('Right panel: check button toggles task', async () => {
    await page.click('#navCheckCurBtn');
    await page.waitForTimeout(350);
    const task0 = await page.$('.nav-task[data-nav-ti="0"]');
    const done = await task0.evaluate(el => el.classList.contains('done'));
    if (!done) throw new Error('Task 0 not done');
  });

  // 11. Progress
  await test('Progress bar updates (1/N)', async () => {
    const txt = await page.$eval('#navProgressTxt', el => el.textContent);
    if (!txt.includes('1 /')) throw new Error('Progress: ' + txt);
  });

  // 12. Auto-advance
  await test('Auto-advances to next unchecked task', async () => {
    const active = await page.$('.nav-task.active');
    if (!active) throw new Error('No active task');
    const ti = await active.evaluate(el => el.getAttribute('data-nav-ti'));
    if (ti === '0') throw new Error('Still on task 0');
  });

  // 13. Open buttons in task list
  await test('Open buttons in task list', async () => {
    const btns = await page.$$('.nav-open-btn');
    if (btns.length === 0) throw new Error('No open buttons');
  });

  // 14. Keyboard hints
  await test('Keyboard hints shown', async () => {
    const keys = await page.$$('.nr-key');
    if (keys.length < 3) throw new Error('Found ' + keys.length);
  });

  // 15. Prev/Next
  await test('Prev/Next navigation', async () => {
    const next = await page.$('#navNextBtn');
    const prev = await page.$('#navPrevBtn');
    if (!next || !prev) throw new Error('Missing buttons');
    await next.click();
    await page.waitForTimeout(200);
    await prev.click();
    await page.waitForTimeout(200);
  });

  // 16. Exit nav
  await test('Exit navigator', async () => {
    await page.click('#navCloseBtn');
    await page.waitForTimeout(500);
    const navOn = await page.$('.nav-container.on');
    if (navOn) throw new Error('Still open');
  });

  // 17. Modal
  await test('Modal checklist', async () => {
    const hdr = await page.$('.step-card-hdr[data-step-id]');
    if (!hdr) throw new Error('No step header');
    await hdr.click();
    await page.waitForSelector('.overlay.on', { timeout: 3000 });
    const tasks = await page.$$('.task');
    if (tasks.length > 0) {
      await tasks[0].click();
      await page.waitForTimeout(200);
      const done = await tasks[0].evaluate(el => el.classList.contains('dn'));
      if (!done) throw new Error('Task not checked');
    }
    await page.click('#mCancelBtn');
    await page.waitForTimeout(300);
  });

  // 18. Patient section
  await test('Phase 4 patient section', async () => {
    const backBtn = await page.$('#backBtn');
    if (backBtn) await backBtn.click();
    await page.waitForTimeout(400);
    await page.click('.ph-card[data-phid="p4"]');
    await page.waitForSelector('.pt-section', { timeout: 5000 });
  });

  // 19. Sample patients
  await test('Add sample patients (5 rows)', async () => {
    await page.click('#ptSampleBtn');
    await page.waitForTimeout(1500);
    const rows = await page.$$('.pt-tbl tbody tr');
    if (rows.length < 5) throw new Error('Found ' + rows.length);
  });

  // 20. Crypto
  await test('Encrypt → Decrypt roundtrip', async () => {
    await page.click('#encBtn');
    await page.waitForTimeout(600);
    const enc = await page.$eval('#cr', el => el.textContent);
    if (enc.length < 20) throw new Error('Short encrypted');
    await page.click('#decBtn');
    await page.waitForTimeout(600);
    const dec = await page.$eval('#dr', el => el.textContent);
    if (dec !== '010-1234-5678') throw new Error('Dec: ' + dec);
  });

  // 21. Top pct
  await test('Top percentage', async () => {
    const pct = await page.$eval('#topPct', el => el.textContent);
    if (!pct.includes('%')) throw new Error('Pct: ' + pct);
  });

  // 22. Sidebar
  await test('Sidebar shows 9 phases', async () => {
    const hdrs = await page.$$('.sb-phase-hdr');
    if (hdrs.length < 9) throw new Error('Found ' + hdrs.length);
  });

  // 23. State persistence
  await test('Navigator preserves check state', async () => {
    const backBtn = await page.$('#backBtn');
    if (backBtn) await backBtn.click();
    await page.waitForTimeout(400);
    await page.click('.ph-card[data-phid="p0"]');
    await page.waitForSelector('.sc-nav-btn', { timeout: 5000 });
    await page.click('.sc-nav-btn');
    await page.waitForSelector('.nav-container.on', { timeout: 3000 });
    const task0 = await page.$('.nav-task[data-nav-ti="0"]');
    const done = await task0.evaluate(el => el.classList.contains('done'));
    if (!done) throw new Error('Check not persisted');
    await page.click('#navCloseBtn');
    await page.waitForTimeout(300);
  });

  // 24. Logout
  await test('Logout returns to login', async () => {
    await page.click('#logoutBtn');
    await page.waitForTimeout(500);
    const loginVisible = await page.$eval('#loginScreen', el => el.style.display !== 'none');
    if (!loginVisible) throw new Error('Login not visible');
  });

  // Summary
  console.log('\n📊 Results');
  console.log(`   Console errors: ${consoleErrors.length}`);
  consoleErrors.forEach(e => console.log(`     ⚠️ ${e.substring(0, 100)}`));
  console.log(`   Sandbox warnings: ${sandboxWarnings.length} (non-critical)`);
  console.log(`   Passed: ${passed} / ${passed + failed}`);
  console.log(`   ${failed === 0 ? '🎉 ALL TESTS PASSED!' : '❌ ' + failed + ' FAILED'}\n`);

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})();
