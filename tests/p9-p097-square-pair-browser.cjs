'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const {pathToFileURL} = require('node:url');
const {chromium} = require(process.env.MATH_PLAYWRIGHT_MODULE || 'playwright');
const {createOrigin, warmAndStop, capture} = require('./helpers/p9-basic-artifact.cjs');
const {newDesktopContext, STANDARD_DESKTOP_VIEWPORT} = require('./helpers/standard-desktop-viewport.cjs');

const root = path.resolve(__dirname, '..');
const out = path.resolve(process.env.MATH_P097_ARTIFACTS || path.join(root, 'verification/p9-p097-square-pair'));
const entry = name => import(pathToFileURL(path.join(root, name)).href);
const sha = execFileSync('git', ['rev-parse', 'HEAD'], {cwd:root, encoding:'utf8'}).trim();
const checks = [], observations = [], screenshots = [], errors = [];
const ok = (value, label) => { assert.ok(value, label); checks.push(label); };

function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en'))
      .map(key=>[key, ordered(value[key])]));
  }
  return value;
}

async function openControl(page, selector) {
  const control = page.locator(selector);
  assert.equal(await control.count(), 1, 'unique original control: ' + selector);
  for (let i = 0; i < 8 && !(await control.isVisible()); i++) {
    const closed = control.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await closed.count(), 1);
    await closed.locator(':scope > summary').click();
  }
  return control;
}

async function routePosition(page, origin, row, field, click) {
  const url = origin.base + 'learn.html#' + row.id;
  ok((await page.goto(url))?.fromServiceWorker() === true, 'original lesson opens without the origin');
  const expectPosition = index => page.waitForFunction(({id,index}) => {
    const snapshot = window.mathLesson?.snapshot();
    return snapshot?.id === id && snapshot.index === index;
  }, {id:row.id,index});
  await expectPosition(0);
  const start = page.locator('[data-do="start"]');
  if (await start.isVisible()) await start.click();

  for (const [i,dividend] of [156,8,9].entries()) {
    const source = await page.evaluate(async ({id,index}) => {
      const {sessionTaskFor} = await import('./learning/bridges.js');
      return sessionTaskFor(id,index);
    },{id:row.id,index:i});
    assert.equal(source.type,'x-numbersearch');
    assert.equal(source.mode,'divisible');
    assert.deepEqual(source.ns,[dividend]);
    assert.deepEqual(source.divisors,[2,3,6]);
    assert.equal(source.by,6);
    for (const d of source.divisors) {
      await field(page,'candidate',d);
      await field(page,'remainder',dividend%d);
      await click(page,'#extra-visual [data-x="b14-test"][data-side="0"]');
    }
    await field(page,'answer',dividend%source.by === 0 ? 'yes' : 'no',true);
    await click(page,'#actions [data-do="check"]');
    await page.locator('#actions [data-do="next"]').click();
    await expectPosition(i+1);
    checks.push('original completed prerequisite ' + i + ' advances with Next');
  }
  await expectPosition(row.index);
}

async function run() {
  fs.mkdirSync(out, {recursive:true});
  const {P097_SOURCES, replayP097SquarePairEvidence, submittedP097SquarePairEvidence} =
    await entry('dist/learning/p097-square-pair-evidence.js');
  const {sessionTaskFor} = await entry('dist/learning/bridges.js');
  const {inspect} = await entry('dist/learning/phase5/b14-model.js');
  const cases = P097_SOURCES.map(source => {
    const {sessionId, index} = source;
    return {source, id:sessionId, index, context:{sessionId,index},
      task:sessionTaskFor(sessionId,index)};
  });
  const verified = [];
  let origin, browser, learner, restore, page, browserVersion = null, phase = 'startup';

  function proof(row, snap) {
    return submittedP097SquarePairEvidence(row.task, snap.model, snap.record, row.context);
  }
  async function observe(p, row, stage) {
    const result = await capture(p, out, row.id + '-' + row.index, row, stage);
    observations.push({
      index: row.index, stage, attempts: result.attempts.length,
      trials: result.model.board.trials, pair: result.model.board.pair, historyLength: result.model.history.length,
      proof: proof(row, result), storage: result.storage
    });
    return result;
  }
  async function picture(p, name) {
    await p.screenshot({path: path.join(out, name)});
    screenshots.push(name);
  }
  async function click(p, selector) {
    await (await openControl(p, selector)).click();
  }
  async function field(p, name, value, select = false) {
    const loc = await openControl(p, '#extra-controls [data-xfield="' + name + '"]');
    if (await loc.getAttribute('type') === 'range') {
      const min = Number(await loc.getAttribute('min'));
      const max = Number(await loc.getAttribute('max'));
      const fromEnd = max-value < value-min;
      await loc.press(fromEnd ? 'End' : 'Home');
      for (let remaining = fromEnd ? max-value : value-min; remaining > 0; remaining--) {
        await loc.press(fromEnd ? 'ArrowLeft' : 'ArrowRight');
      }
    } else if (select) {
      await loc.selectOption(String(value));
    } else {
      await loc.fill(String(value));
    }
    assert.equal(await loc.inputValue(), String(value));
  }

  try {
    origin = await createOrigin(root);
    browser = await chromium.launch({
      headless: true,
      args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
      ...(process.env.MATH_CHROMIUM_EXECUTABLE ? {executablePath:process.env.MATH_CHROMIUM_EXECUTABLE} : {})
    });
    browserVersion = browser.version();
    learner = await newDesktopContext(browser, {reducedMotion:'reduce', serviceWorkers:'allow', acceptDownloads:true});
    restore = await newDesktopContext(browser, {reducedMotion:'reduce', serviceWorkers:'allow'});
    page = await learner.newPage();
    const restorePage = await restore.newPage();
    for (const p of [page, restorePage]) {
      p.setDefaultTimeout(15000);
      p.on('pageerror', error => errors.push(phase + ': ' + error.message));
    }
    for (const context of [learner, restore]) {
      context.on('request', request => {
        if (/^https?:/.test(request.url()) && !request.url().startsWith(origin.base)) {
          errors.push('non-local request: ' + request.url());
        }
      });
    }

    const release = fs.readFileSync(path.join(root, 'dist/sw.js'), 'utf8').match(/const CACHE = '([^']+)'/)[1];
    await page.goto(origin.base + 'v2.html#trail');
    await page.locator('#main [data-do="export"]').first().waitFor();
    await restorePage.goto(origin.base + 'v2.html#trail');
    await restorePage.locator('#main [data-do="import"]').first().waitFor();
    await restorePage.evaluate(async () => Boolean(await navigator.serviceWorker.ready));
    await restorePage.reload();
    await restorePage.waitForFunction(() => !!navigator.serviceWorker.controller);
    await warmAndStop(page, origin, release, ok, 'P097');

    for (const row of cases) {
      phase = row.id + ':' + row.index;
      const tag = row.id + '-' + row.index;
      await routePosition(page,origin,row,field,click);
      const live = await page.evaluate(async ({id,index}) => {
        const {sessionTaskFor} = await import('./learning/bridges.js');
        const {LESSONS} = await import('./learning/catalog.js');
        return {task:sessionTaskFor(id,index), nodeId:LESSONS[id].topicId};
      }, row);
      const digest = createHash('sha256').update(JSON.stringify(ordered(live.task))).digest('hex');
      ok(live.nodeId === row.source.nodeId && digest === row.source.taskHash, tag + ' source fingerprint');
      assert.deepEqual(live.task, row.task);
      ok(await page.evaluate(() => innerWidth === 1920 && innerHeight === 1080), tag + ' standard viewport');

      const testPair = () => click(page,'#extra-controls [data-x="b14-square"]');
      await field(page,'sideB',10);
      await testPair();
      const zero = await observe(page,row,'zero-side');
      ok(zero.model.board.trials.length === 0 && zero.model.history.length === 1,
        'a real zero side does not count as a square pair');

      await field(page,'sideA',6);
      await field(page,'sideB',7);
      await testPair();
      await click(page,'#actions [data-do="check"]');
      const wrong = await observe(page,row,'insufficient-area-check');
      ok(wrong.attempts.length === 1 && wrong.model.board.pair === null &&
        !inspect(row.task,wrong.attempts[0].value).correct && !proof(row,wrong),
        'original Check rejects 36 plus 49');
      await picture(page,tag + '-insufficient-area.png');

      await field(page,'sideB',8);
      const pending = await observe(page,row,'unapplied-side');
      ok(pending.model.board.pair === null && !replayP097SquarePairEvidence(row.task,pending.model,row.context),
        'a real slider move has not yet saved the pair');
      await testPair();
      const draft = await observe(page,row,'saved-pair');
      ok(replayP097SquarePairEvidence(row.task,draft.model,row.context)?.target === 100 &&
        !proof(row,draft),'saved areas require a new Check');
      await click(page,'#actions [data-do="check"]');
      const good = await observe(page,row,'correct-check');
      const accepted = proof(row,good);
      ok(good.attempts.length === 2 && inspect(row.task,good.attempts.at(-1).value).correct && accepted?.target === 100,
        'latest original Check confirms 36 plus 64');
      assert.deepEqual(accepted.squares,[{side:6,area:36},{side:8,area:64}]);
      const squares = page.locator('#extra-visual .b14-square-pair .b14-square');
      assert.equal(await squares.nth(0).locator('i').count(),36);
      assert.equal(await squares.nth(1).locator('i').count(),64);
      ok(accepted.attempts[0].recorded === false && accepted.attempts[1].sum === 85,
        'wrong original attempts and visible square cells are preserved');
      ok(await page.locator('#thinking-feedback').count() === 0, tag + ' candidate has no global registration');
      await picture(page, tag + '-correct-check.png');

      ok((await page.reload())?.fromServiceWorker() === true, tag + ' stopped-origin reload');
      await page.waitForFunction(i => window.mathLesson?.snapshot()?.index === i, row.index);
      const reloaded = await observe(page, row, 'offline-reload');
      assert.deepEqual(reloaded.model, good.model);
      assert.deepEqual(reloaded.record, good.record);
      assert.deepEqual(proof(row,reloaded), accepted);
      checks.push(tag + ' raw model and both Checks survive reload');
      verified.push({row, good, accepted});
    }

    phase = 'State-v2 backup';
    await page.goto(origin.base + 'v2.html#trail');
    await page.locator('#main [data-do="export"]').first().waitFor();
    const saving = page.waitForEvent('download');
    await page.locator('#main [data-do="export"]').first().click();
    const bytes = fs.readFileSync(await (await saving).path());
    const envelope = JSON.parse(bytes);
    ok(envelope.app === 'math-explorer' && envelope.version === 2, 'real offline State-v2 export');
    fs.writeFileSync(path.join(out, 'native-state-v2.json'), bytes);

    async function upload(buffer, name) {
      const chooser = restorePage.waitForEvent('filechooser');
      await restorePage.locator('#main [data-do="import"]').first().click();
      await (await chooser).setFiles({name, mimeType:'application/json', buffer});
      await restorePage.waitForFunction(() => document.querySelector('#import-file')?.value === '');
      return restorePage.locator('#toast').innerText();
    }
    ok((await upload(bytes, 'p097-backup.json')).includes('备份已合并'), 'fresh context imports the backup');
    const restoredBytes = await restorePage.evaluate(() => localStorage.getItem('math-explorer-v2'));
    ok((await upload(bytes, 'p097-repeat.json')).includes('备份已合并'), 'repeat import succeeds');
    ok(await restorePage.evaluate(() => localStorage.getItem('math-explorer-v2')) === restoredBytes,
      'repeat import preserves exact bytes');
    ok(!(await upload(Buffer.from('{'), 'p097-corrupt.json')).includes('备份已合并'), 'corrupt backup is rejected');
    ok(await restorePage.evaluate(() => localStorage.getItem('math-explorer-v2')) === restoredBytes,
      'failed import preserves exact bytes');
    await restorePage.goto(origin.base + 'learn.html#' + cases.at(-1).id);
    await restorePage.waitForFunction(id => window.mathLesson?.snapshot()?.id === id, cases.at(-1).id);
    for (const {row, good, accepted} of verified) {
      const imported = await observe(restorePage,row,'restored-backup');
      assert.deepEqual(imported.model, good.model);
      assert.deepEqual(imported.record, good.record);
      assert.deepEqual(proof(row,imported), accepted);
      checks.push(row.index + ' restored model, correction and evidence match exactly');
    }

    phase = 'Retry';
    const last = verified.at(-1).row;
    await page.goto(origin.base + 'learn.html#' + last.id);
    await page.waitForFunction(i => window.mathLesson?.snapshot()?.index === i, last.index);
    await click(page, '[data-do="p3-retry"]');
    const retry = await observe(page, last, 'retry');
    ok(retry.model.history.length === 0 && retry.attempts.length === 2 &&
      proof(last,retry) === null, 'Retry keeps saved attempts and excludes the new blank draft');
    ok(errors.length === 0, 'no non-local requests or page errors');
    console.log('P097_CHROMIUM_OK ' + JSON.stringify({testedCheckoutSha:sha,chromium:browserVersion,checks:checks.length,captures:observations.length}));
  } catch (error) {
    errors.push(phase + ': ' + (error.stack || error));
    await page?.screenshot({path:path.join(out, 'failure.png')}).catch(() => {});
    throw error;
  } finally {
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
      schema:'math-p097-square-pair-browser/1', testedCheckoutSha:sha,
      originalControls:true, seededLessonPositionOnly:false, chromium:browserVersion,
      viewport:STANDARD_DESKTOP_VIEWPORT, sources:P097_SOURCES,
      checks, observations, screenshots, errors
    },null,2)+'\n');
    await restore?.close().catch(() => {});
    await learner?.close().catch(() => {});
    await browser?.close().catch(() => {});
    await origin?.close().catch(() => {});
  }
}

run().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
