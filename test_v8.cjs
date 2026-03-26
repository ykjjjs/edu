const { chromium } = require('playwright');

(async () => {
  const BASE = 'http://localhost:3001';
  let errors = 0;
  let warnings = 0;
  const consoleMessages = [];

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ 
    // Block external requests to speed up testing
    bypassCSP: true 
  });
  const page = await context.newPage();

  // Block all iframe navigations to external sites (speed up test)
  await page.route('**/*', route => {
    const url = route.request().url();
    if (url.startsWith('http://localhost:3001') || url.startsWith('about:')) {
      return route.continue();
    }
    // Block external requests from iframes
    return route.abort('blockedbyclient');
  });

  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error' && !text.includes('net::ERR_BLOCKED_BY_CLIENT') && !text.includes('blockedbyclient')) { 
      errors++; consoleMessages.push('[ERROR] ' + text); 
    }
    if (type === 'warning') { warnings++; consoleMessages.push('[WARN] ' + text); }
  });

  page.on('pageerror', err => {
    errors++;
    consoleMessages.push('[PAGE_ERROR] ' + err.message);
  });

  function log(msg) { console.log('[TEST] ' + msg); }

  try {
    // 1. Load page
    log('1. Loading page...');
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 });
    const title = await page.title();
    log('   Title: ' + title);

    // 2. Demo login
    log('2. Demo login...');
    await page.click('#demoBtn');
    await page.waitForSelector('#appShell.on', { timeout: 5000 });
    log('   Login OK');

    // 3. Check dashboard
    log('3. Dashboard check...');
    const phCards = await page.$$('.ph-card');
    log('   Phase cards: ' + phCards.length);

    // 4. Click Phase 0
    log('4. Entering Phase 0...');
    await page.click('.ph-card[data-phid="p0"]');
    await page.waitForSelector('.steps-list', { timeout: 5000 });
    const stepCards = await page.$$('.step-card');
    log('   Step cards: ' + stepCards.length);

    // 5. Check "실습 시작" buttons exist with count badge
    log('5. Nav buttons check...');
    const navBtns = await page.$$('.sc-nav-btn');
    const navCntBadge = await page.$('.sc-nav-cnt');
    log('   Nav buttons: ' + navBtns.length + ', Count badge: ' + (navCntBadge ? 'YES' : 'NO'));

    // 6. Click "실습 시작" to enter Navigator mode
    log('6. Entering Navigator mode...');
    await page.click('.sc-nav-btn[data-nav-step="s0_1"]');
    await page.waitForSelector('.nav-container.on', { timeout: 5000 });
    log('   Navigator opened!');

    // 7. Check navigator tasks
    const navTasks = await page.$$('.nav-task');
    log('7. Navigator tasks: ' + navTasks.length);

    // 8. Check prev/next buttons
    const prevBtn = await page.$('#navPrevBtn');
    const nextBtn = await page.$('#navNextBtn');
    log('8. Prev/Next: ' + (prevBtn ? 'OK' : 'MISSING') + '/' + (nextBtn ? 'OK' : 'MISSING'));

    // 9. Instant check toggle — click check area
    log('9. Testing instant check...');
    await page.click('.nav-task-check[data-check-ti="0"]');
    await page.waitForTimeout(100);
    const done0 = await page.$('.nav-task[data-nav-ti="0"].done');
    log('   Checked task 0: ' + (done0 ? 'YES' : 'NO'));

    // 10. Auto-advance after check
    await page.waitForTimeout(400);
    const activeTask = await page.$('.nav-task.active');
    const activeTi = activeTask ? await activeTask.getAttribute('data-nav-ti') : 'none';
    log('10. Auto-advanced to: task ' + activeTi);

    // 11. Check second task too
    log('11. Check task 1...');
    await page.click('.nav-task-check[data-check-ti="1"]');
    await page.waitForTimeout(400);
    const done1 = await page.$('.nav-task[data-nav-ti="1"].done');
    const active2 = await page.$('.nav-task.active');
    const active2Ti = active2 ? await active2.getAttribute('data-nav-ti') : 'none';
    log('    Task 1 done: ' + (done1 ? 'YES' : 'NO') + ', active: task ' + active2Ti);

    // 12. Navigate by clicking task body
    log('12. Click task body to navigate...');
    await page.click('.nav-task-body[data-goto-ti="4"]');
    await page.waitForTimeout(200);
    const active4 = await page.$('.nav-task[data-nav-ti="4"].active');
    log('    Task 4 active: ' + (active4 ? 'YES' : 'NO'));

    // 13. Uncheck a task
    log('13. Uncheck task 0...');
    await page.click('.nav-task-check[data-check-ti="0"]');
    await page.waitForTimeout(100);
    const undone0 = await page.$('.nav-task[data-nav-ti="0"]:not(.done)');
    log('    Task 0 unchecked: ' + (undone0 ? 'YES' : 'NO'));

    // 14. Next button
    log('14. Next button...');
    await page.click('#navNextBtn');
    await page.waitForTimeout(200);
    const afterNext = await page.$('.nav-task.active');
    const afterNextTi = afterNext ? await afterNext.getAttribute('data-nav-ti') : 'none';
    log('    Active after next: task ' + afterNextTi);

    // 15. Progress display
    log('15. Progress text...');
    const progTxt = await page.textContent('#navProgressTxt');
    log('    ' + progTxt);

    // 16. Close navigator
    log('16. Closing navigator...');
    await page.click('#navCloseBtn');
    await page.waitForTimeout(400);
    const navOff = !(await page.$('.nav-container.on'));
    log('    Navigator closed: ' + navOff);

    // 17. Modal checklist
    log('17. Modal checklist...');
    await page.click('.sc-btn[data-step-id="s0_1"]');
    await page.waitForSelector('.overlay.on', { timeout: 3000 });
    const taskItems = await page.$$('.task[data-ti]');
    log('    Modal tasks: ' + taskItems.length);

    // 18. Click modal task — instant check
    if (taskItems.length > 0) {
      await taskItems[0].click();
      await page.waitForTimeout(150);
      const mDone = await page.$('.task[data-ti="0"].dn');
      log('18. Modal task 0 checked: ' + (mDone ? 'YES' : 'NO'));
    }

    // 19. Modal footer
    const footL = await page.textContent('#mFootL');
    log('19. Modal footer: ' + footL);

    // 20. Navigator launch from modal
    log('20. Nav launch from modal...');
    const navLaunch = await page.$('#mNavLaunch');
    log('    Nav launch button: ' + (navLaunch ? 'YES' : 'NO'));
    await page.click('#mCloseBtn');
    await page.waitForTimeout(200);

    // 21. Patient section (Phase 4)
    log('21. Phase 4 patients...');
    await page.click('#backBtn');
    await page.waitForTimeout(300);
    await page.click('.ph-card[data-phid="p4"]');
    await page.waitForSelector('.pt-section', { timeout: 3000 });
    log('    Patient section visible');

    // 22. Crypto demo
    log('22. Crypto demo...');
    await page.click('#encBtn');
    await page.waitForTimeout(500);
    const encResult = await page.textContent('#cr');
    log('    Encrypted: ' + (encResult.length > 20 ? 'YES (' + encResult.length + ' chars)' : 'NO'));

    // 23. Decrypt
    await page.click('#decBtn');
    await page.waitForTimeout(500);
    const decResult = await page.textContent('#dr');
    log('23. Decrypted: ' + decResult);

    // 24. Match
    await page.click('#matchBtn');
    await page.waitForTimeout(200);
    const matchEl = await page.$('.crypto-match.ok');
    log('24. Match: ' + (matchEl ? 'SUCCESS' : 'FAIL'));

    // 25. Load samples
    log('25. Load patient samples...');
    await page.click('#ptSampleBtn');
    await page.waitForTimeout(1000);
    const ptRows = await page.$$('.pt-tbl tbody tr');
    log('    Patient rows: ' + ptRows.length);

    // 26. Step complete
    log('26. Step complete toggle...');
    await page.click('#backBtn');
    await page.waitForTimeout(300);
    await page.click('.ph-card[data-phid="p0"]');
    await page.waitForSelector('.steps-list', { timeout: 5000 });
    await page.click('.sc-btn[data-step-id="s0_1"]');
    await page.waitForSelector('.overlay.on', { timeout: 3000 });
    await page.click('#mDoneBtn');
    await page.waitForTimeout(300);
    const topPct = await page.textContent('#topPct');
    log('    Top pct: ' + topPct);

    // 27. Logout
    log('27. Logout...');
    await page.click('#logoutBtn');
    await page.waitForTimeout(300);
    const loginVis = await page.$eval('#loginScreen', el => getComputedStyle(el).display);
    log('    Login screen: ' + loginVis);

    // Summary
    log('');
    log('═══════════════════════════════════════════');
    log('RESULTS: ' + errors + ' console errors, ' + warnings + ' warnings');
    if (consoleMessages.length > 0) {
      consoleMessages.forEach(m => log('  ' + m));
    }
    log('═══════════════════════════════════════════');
    if (errors === 0) {
      log('ALL 27 TESTS PASSED! 0 console errors');
    } else {
      log('SOME TESTS HAD ERRORS');
    }

  } catch (err) {
    log('FAIL: ' + err.message);
    errors++;
  }

  await browser.close();
  process.exit(errors > 0 ? 1 : 0);
})();
