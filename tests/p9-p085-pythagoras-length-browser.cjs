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
const out = path.resolve(process.env.MATH_P085_ARTIFACTS || path.join(root, 'verification/p9-p085-pythagoras-length'));
const entry = name => import(pathToFileURL(path.join(root, name)).href);
const sha = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim();
const checks = [], observations = [], screenshots = [], errors = [];
const ok = (value, label) => { assert.ok(value, label); checks.push(label); };

function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort((a, b) => a.localeCompare(b, 'en'))
      .map(key => [key, ordered(value[key])]));
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

async function clickBtn(page, selector) {
  await (await openControl(page, selector)).click();
}

async function field(page, key, value) {
  const input = await openControl(page, '#extra-controls [data-xfield="' + key + '"]');
  if (await input.evaluate(el => el.tagName) === 'SELECT') await input.selectOption(String(value));
  else await input.fill(String(value));
  assert.equal(await input.inputValue(), String(value));
}

async function completePrecursors(page, origin) {
  const url = origin.base + 'learn.html#pythagoras';
  ok((await page.goto(url))?.fromServiceWorker() === true, 'original pythagoras lesson opens offline');
  await page.waitForFunction(() => window.mathLesson);
  const start = page.locator('[data-do="start"]');
  if (await start.isVisible()) await start.click();

  // Precursor 0: x-g26-area
  await clickBtn(page, '#extra-controls button[data-x="g26-hyp"][data-index="1"]');
  await clickBtn(page, '#extra-controls button[data-x="g26-look"]');
  await field(page, 'scale', '2');
  await clickBtn(page, '#extra-controls button[data-x="g26-scale"]');
  await clickBtn(page, '#extra-controls button[data-x="g26-look"]');
  await field(page, 'answers.0', '25');
  await field(page, 'answers.1', '100');
  await page.locator('#actions [data-do="check"]').click();
  await page.locator('#actions [data-do="next"]').click();
  await page.waitForFunction(() => window.mathLesson?.snapshot()?.index === 1);

  // Precursor 1: x-g26-check
  await clickBtn(page, '#extra-controls button[data-x="g26-probe"][data-index="0"]');
  await clickBtn(page, '#extra-controls button[data-x="g26-probe"][data-index="1"]');
  await clickBtn(page, '#extra-controls button[data-x="g26-choose"][data-index="0"]');
  await field(page, 'answers.0', 'right');
  await page.locator('#actions [data-do="check"]').click();
  await page.locator('#actions [data-do="next"]').click();
  await page.waitForFunction(() => window.mathLesson?.snapshot()?.index === 2);
  checks.push('pythagoras precursors 0 and 1 completed through original Check and Next');
}

async function run() {
  fs.mkdirSync(out, {recursive: true});
  const {P085_SOURCES, replayP085PythagorasLengthEvidence, submittedP085PythagorasLengthEvidence} =
    await entry('dist/learning/p085-pythagoras-length-evidence.js');
  const {sessionTaskFor} = await entry('dist/learning/bridges.js');
  const {inspect, lengthGoal} = await entry('dist/learning/phase5/b26-model.js');
  const cases = P085_SOURCES.map(source => {
    const {sessionId, index} = source;
    return {source, id: sessionId, index, context: {sessionId, index}, task: sessionTaskFor(sessionId, index)};
  });
  const verified = [];
  let origin, browser, learner, restore, page, restorePage, browserVersion = null, phase = 'startup';

  const proof = (row, snap) => submittedP085PythagorasLengthEvidence(row.task, snap.model, snap.record, row.context);
  async function observe(p, row, stage) {
    const result = await capture(p, out, row.id + '-' + row.index, row, stage);
    observations.push({
      index: row.index, stage, attempts: result.attempts.length,
      correct: inspect(row.task, result.model).correct,
      evidence: Boolean(proof(row, result))
    });
    return result;
  }
  async function picture(p, name) {
    await p.screenshot({path: path.join(out, name), fullPage: true});
    screenshots.push(name);
  }
  const check = () => page.locator('#actions [data-do="check"]').click();

  try {
    origin = await createOrigin(root);
    browser = await chromium.launch({headless: true});
    browserVersion = browser.version();
    learner = await newDesktopContext(browser);
    restore = await newDesktopContext(browser);
    page = await learner.newPage();
    restorePage = await restore.newPage();
    for (const p of [page, restorePage]) {
      p.on('pageerror', err => errors.push('pageerror: ' + err.message));
      p.on('request', req => {
        if (!req.url().startsWith(origin.base) && !req.url().startsWith('data:') && !req.url().startsWith('blob:')) {
          errors.push('non-local request: ' + req.url());
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
    await warmAndStop(page, origin, release, ok, 'P085');

    phase = 'native pythagoras length cases';
    await completePrecursors(page, origin);

    for (const row of cases) {
      const tag = row.id + '-' + row.index;
      const goal = lengthGoal(row.task);
      const hash = createHash('sha256').update(JSON.stringify(ordered(row.task))).digest('hex');
      ok(hash === row.source.taskHash, tag + ' source fingerprint matches');

      await page.waitForFunction(i => window.mathLesson?.snapshot()?.index === i, row.index);
      if (row.task.coord) {
        await clickBtn(page, '#extra-controls button[data-x="g26-corner"][data-index="hfirst"]');
      }
      await clickBtn(page, '#extra-controls button[data-x="g26-hyp"][data-index="1"]');
      const wrongOp = goal.op === 'add' ? 'subtract' : 'add';
      await clickBtn(page, '#extra-controls button[data-x="g26-op"][data-index="' + wrongOp + '"]');
      await field(page, 'square', String(goal.square + 10));
      await field(page, 'result', String(goal.result + 1));
      await clickBtn(page, '#extra-controls button[data-x="g26-save"]');
      await field(page, 'answers.0', row.task.questions[0].value);
      await check();
      const wrong = await observe(page, row, 'wrong-op-check');
      ok(wrong.attempts.length === 1 && !inspect(row.task, wrong.attempts[0].value).correct && !proof(row, wrong),
        tag + ' rejects wrong operation and area');
      await picture(page, tag + '-wrong-check.png');

      await clickBtn(page, '#extra-controls button[data-x="g26-op"][data-index="' + goal.op + '"]');
      await field(page, 'square', String(goal.square));
      await field(page, 'result', String(goal.result));
      await clickBtn(page, '#extra-controls button[data-x="g26-save"]');
      const draft = await observe(page, row, 'corrected-draft');
      const replayed = replayP085PythagorasLengthEvidence(row.task, draft.model, row.context);
      ok(replayed?.square === goal.square && replayed?.result === goal.result && !proof(row, draft),
        tag + ' corrected draft requires a fresh Check');

      await check();
      const good = await observe(page, row, 'correct-check');
      const accepted = proof(row, good);
      ok(good.attempts.length === 2 && inspect(row.task, good.attempts.at(-1).value).correct &&
        accepted?.square === goal.square && accepted?.result === goal.result && accepted?.operation === goal.op,
        tag + ' latest Check verifies exact Pythagorean square and length');
      ok(await page.locator('#thinking-feedback').count() === 0, tag + ' candidate has no global registration');
      await picture(page, tag + '-correct-check.png');

      ok((await page.reload())?.fromServiceWorker() === true, tag + ' stopped-origin reload');
      await page.waitForFunction(i => window.mathLesson?.snapshot()?.index === i, row.index);
      const reloaded = await observe(page, row, 'offline-reload');
      assert.deepEqual(reloaded.model, good.model);
      assert.deepEqual(reloaded.record, good.record);
      assert.deepEqual(proof(row, reloaded), accepted);
      checks.push(tag + ' raw model and both Checks survive reload');
      verified.push({row, good, accepted});

      if (row.index < 4) {
        await page.locator('#actions [data-do="next"]').click();
      }
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
      await (await chooser).setFiles({name, mimeType: 'application/json', buffer});
      await restorePage.waitForFunction(() => document.querySelector('#import-file')?.value === '');
      return restorePage.locator('#toast').innerText();
    }
    ok((await upload(bytes, 'p085-backup.json')).includes('备份已合并'), 'fresh context imports the backup');
    const restoredBytes = await restorePage.evaluate(() => localStorage.getItem('math-explorer-v2'));
    ok((await upload(bytes, 'p085-repeat.json')).includes('备份已合并'), 'repeat import succeeds');
    ok(await restorePage.evaluate(() => localStorage.getItem('math-explorer-v2')) === restoredBytes, 'repeat import preserves exact bytes');
    ok(!(await upload(Buffer.from('{'), 'p085-corrupt.json')).includes('备份已合并'), 'corrupt backup is rejected');
    ok(await restorePage.evaluate(() => localStorage.getItem('math-explorer-v2')) === restoredBytes, 'failed import preserves exact bytes');

    await restorePage.goto(origin.base + 'learn.html#pythagoras');
    await restorePage.waitForFunction(() => window.mathLesson?.snapshot()?.id === 'pythagoras');
    const lastEntry = verified.at(-1);
    const imported = await observe(restorePage, lastEntry.row, 'restored-backup');
    assert.deepEqual(imported.model, lastEntry.good.model);
    assert.deepEqual(imported.record, lastEntry.good.record);
    assert.deepEqual(proof(lastEntry.row, imported), lastEntry.accepted);
    checks.push('restored backup preserves final pythagoras task model, attempts and evidence');

    phase = 'Retry';
    await page.goto(origin.base + 'learn.html#pythagoras');
    await page.waitForFunction(i => window.mathLesson?.snapshot()?.index === i, lastEntry.row.index);
    await (await openControl(page, '[data-do="p3-retry"]')).click();
    const retry = await observe(page, lastEntry.row, 'retry');
    ok(retry.model.history.length === 0 && retry.attempts.length === 2 && proof(lastEntry.row, retry) === null,
      'Retry keeps saved attempts and excludes the new blank draft');
    ok(errors.length === 0, 'no non-local requests or page errors');
    console.log('P085_CHROMIUM_OK ' + JSON.stringify({testedCheckoutSha: sha, chromium: browserVersion, checks: checks.length, captures: observations.length}));
  } catch (error) {
    errors.push(phase + ': ' + (error.stack || error));
    await page?.screenshot({path: path.join(out, 'failure.png')}).catch(() => {});
    throw error;
  } finally {
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({
      schema: 'math-p085-pythagoras-length-browser/1', testedCheckoutSha: sha,
      originalControls: true, seededLessonPositionOnly: false, chromium: browserVersion,
      viewport: STANDARD_DESKTOP_VIEWPORT, sources: P085_SOURCES,
      checks, observations, screenshots, errors
    }, null, 2) + '\n');
    await restore?.close().catch(() => {});
    await learner?.close().catch(() => {});
    await browser?.close().catch(() => {});
    await origin?.close().catch(() => {});
  }
}

run().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
