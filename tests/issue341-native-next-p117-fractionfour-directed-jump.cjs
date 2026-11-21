'use strict';

const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require(process.env.MATH_PLAYWRIGHT_MODULE || 'playwright');
const {createOrigin, capture, warmAndStop} = require('./helpers/p9-basic-artifact.cjs');
const {STANDARD_DESKTOP_VIEWPORT, newDesktopContext} = require('./helpers/standard-desktop-viewport.cjs');

const root = path.resolve(__dirname, '..');
const out = path.resolve(process.env.MATH_P117_ARTIFACTS ||
  path.join(root, 'verification/issue341-navigation/p9-p117-fractionfour-directed-jump'));
const entry = name => import(pathToFileURL(path.join(root, name)).href);
const sha = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim();
const checks = [], observations = [], screenshots = [], errors = [];
const ok = (condition, description) => {
  assert.ok(condition, description);
  checks.push(description);
};

function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en'))
      .map(key=>[key, ordered(value[key])]));
  }
  return value;
}

async function click(page, selector) {
  const control = page.locator(selector);
  assert.equal(await control.count(), 1, 'unique original control: ' + selector);
  for (let i = 0; i < 8 && !(await control.isVisible()); i++) {
    const closed = control.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await closed.count(), 1);
    await closed.locator(':scope > summary').click();
  }
  await control.click();
}

async function field(page, name, value, kind = 'text') {
  const control = page.locator('#extra-controls [data-xfield="' + name + '"]');
  assert.equal(await control.count(), 1, 'original field: ' + name);
  if (kind === 'range') {
    await control.focus();
    await control.press('Home');
    for (let step = -10; step < value; step++) await control.press('ArrowRight');
  } else if (kind === 'select') {
    await control.selectOption(String(value));
  } else {
    await control.fill(String(value));
  }
  assert.equal(await control.inputValue(), String(value));
}

const navigationRoutes = [];

async function routePosition(page, origin, row) {
  const url = origin.base + 'learn.html#' + row.id;
  if (page.url() !== url) {
    const navigation = await page.goto(url);
    ok(navigation?.fromServiceWorker() === true,
      row.id + ':' + row.index + ' original lesson navigated offline');
  }
  await page.waitForFunction(id => window.mathLesson?.snapshot()?.id === id, row.id);
  const before = await page.evaluate(() => {
    const snap = window.mathLesson?.snapshot();
    return {
      index: snap?.index, view: snap?.view,
      completed: snap?.summary?.cases?.[snap?.index]?.complete === true
    };
  });
  let method;
  if (before.index === row.index && before.view === 'task') {
    method = row.index === 0 ? 'native-first-position' : 'native-retained-position';
  } else if (before.view === 'task' && before.completed && before.index + 1 === row.index) {
    const next = page.locator('#actions [data-do="next"]');
    await next.waitFor({state: 'visible', timeout: 10000});
    await next.click();
    await page.waitForFunction(i => window.mathLesson?.snapshot()?.index === i, row.index);
    method = 'native-next-after-correct-check';
  } else {
    // Do not claim navigation coverage for a target that still needs seeding.
    // Original candidate source, original model actions and grader stay untouched.
    await page.evaluate(async ({id,index}) => {
      const {packText, unpackText} = await import('./storage.js');
      const key = 'math-explorer-v2';
      const state = JSON.parse(unpackText(localStorage.getItem(key)));
      const lesson = state.lessons[id];
      if (!lesson || lesson.cases[index]?.attempts?.length)
        throw Error('Expected empty original native case');
      lesson.index = index;
      lesson.view = 'task';
      localStorage.setItem(key, packText(JSON.stringify(state)));
    }, row);
    method = 'seeded-only';
  }
  const offline = await page.reload();
  ok(offline?.fromServiceWorker() === true,
    row.id + ':' + row.index + ' stopped-origin native task reload');
  await page.waitForFunction(i => window.mathLesson?.snapshot()?.index === i, row.index);
  navigationRoutes.push({
    position: row.id + ':' + row.index, method,
    startingIndex: before.index, previousTaskComplete: before.completed
  });
  ok(method !== 'native-next-after-correct-check' || before.completed,
    row.id + ':' + row.index + ' Next never bypassed original Check');
}

async function run() {
  fs.mkdirSync(out, {recursive: true});
  const {P117_SOURCE, replayP117DirectedJumpEvidence, submittedP117DirectedJumpEvidence} =
    await entry('dist/learning/p117-fractionfour-directed-jump-evidence.js');
  const {sessionTaskFor} = await entry('dist/learning/bridges.js');
  const {inspect} = await entry('dist/learning/phase5/b09-model.js');
  const context = {sessionId: P117_SOURCE.sessionId, index: P117_SOURCE.index};
  const original = sessionTaskFor(context.sessionId, context.index);
  const row = {id: context.sessionId, index: context.index};
  const proof = state => submittedP117DirectedJumpEvidence(original, state.model, state.record, context);
  let origin, browser, learner, restore, page, browserVersion = null;
  let current = 'startup';

  async function saveImage(name) {
    await page.screenshot({path: path.join(out, name)});
    screenshots.push(name);
  }

  async function captureWork(phase) {
    const result = await capture(page, out, 'fractionfour-8', row, phase);
    observations.push({
      phase,
      attempts: result.attempts.length,
      jumps: result.model.jumps,
      history: result.model.history,
      answer: result.model.answer,
      acceptedProof: proof(result),
      storage: result.storage
    });
    return result;
  }

  async function selectAnchorAndPredict() {
    await field(page, 'anchor', -5, 'range');
    await field(page, 'guess', '0');
    await click(page, '#extra-controls [data-x="direct-predict"]');
  }

  async function jump(change) {
    await field(page, 'size', Math.abs(change));
    await field(page, 'dir', change > 0 ? 'right' : 'left', 'select');
    await click(page, '#extra-controls [data-x="direct-jump"]');
  }

  try {
    origin = await createOrigin(root);
    browser = await chromium.launch({
      headless: true,
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
      ...(process.env.MATH_CHROMIUM_EXECUTABLE ? {executablePath: process.env.MATH_CHROMIUM_EXECUTABLE} : {})
    });
    browserVersion = browser.version();
    learner = await newDesktopContext(browser, {reducedMotion: 'reduce', serviceWorkers: 'allow', acceptDownloads: true});
    restore = await newDesktopContext(browser, {reducedMotion: 'reduce', serviceWorkers: 'allow'});
    page = await learner.newPage();
    const restorePage = await restore.newPage();

    for (const p of [page, restorePage]) {
      p.setDefaultTimeout(15000);
      p.on('pageerror', error => errors.push(current + ': ' + error.message));
    }
    for (const c of [learner, restore]) {
      c.on('request', request => {
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
    ok(await restorePage.evaluate(() => !!navigator.serviceWorker.controller), 'independent backup context is SW-controlled');
    await warmAndStop(page, origin, release, ok, 'P117');

    current = 'source';
    await routePosition(page, origin, row);
    const live = await page.evaluate(async ({id,index}) => {
      const {sessionTaskFor} = await import('./learning/bridges.js');
      const {LESSONS} = await import('./learning/catalog.js');
      return {task: sessionTaskFor(id,index), nodeId: LESSONS[id].topicId};
    }, row);
    assert.deepEqual(live.task, original);
    const digest = createHash('sha256').update(JSON.stringify(ordered(live.task))).digest('hex');
    ok(live.nodeId === P117_SOURCE.nodeId && digest === P117_SOURCE.taskHash, 'runtime source and complete task fingerprint');
    ok(await page.evaluate(() => innerWidth === 1920 && innerHeight === 1080), 'standard desktop viewport');

    current = 'wrong-then-correct';
    await selectAnchorAndPredict();
    await jump(3);
    await field(page, 'zero', 'reference', 'select');
    await field(page, 'answer', -1);
    await click(page, '#actions [data-do="check"]');
    const wrong = await captureWork('wrong-check');
    ok(wrong.attempts.length === 1 && !inspect(original, wrong.attempts[0].value).correct &&
      proof(wrong) === null, 'original wrong Check is preserved and rejected by candidate');
    await saveImage('wrong-check.png');

    await field(page, 'answer', -2);
    const draft = await captureWork('correct-unsubmitted-draft');
    ok(replayP117DirectedJumpEvidence(original, draft.model, context)?.end === -2 &&
      proof(draft) === null, 'corrected draft cannot reuse the previous wrong Check');

    await click(page, '#actions [data-do="check"]');
    const good = await captureWork('correct-check');
    const accepted = proof(good);
    ok(good.attempts.length === 2 && inspect(original, good.attempts.at(-1).value).correct &&
      accepted?.start === -5 && accepted?.end === -2 && accepted.signedChange === 3,
    'latest actual Check accepts exactly the signed integer displacement');
    assert.deepEqual(accepted.observableSuccessfulJumps, [
      {index: 0, from: -5, change: 3, direction: 'right', unitLength: 3, to: -2}
    ]);
    ok(accepted.initialGuessCorrectnessAssessed === false && good.model.committed === '0',
      'actual guess is retained independently of verified jumps');
    ok(await page.locator('#thinking-feedback').count() === 0, 'standalone candidate has no registered strict feedback');
    await saveImage('correct-check.png');

    ok((await page.reload())?.fromServiceWorker() === true, 'stopped-origin Chromium reload');
    await page.waitForFunction(i => window.mathLesson?.snapshot()?.index === i, row.index);
    const reloaded = await captureWork('offline-reload');
    assert.deepEqual(reloaded.model, good.model);
    assert.deepEqual(reloaded.record, good.record);
    assert.deepEqual(proof(reloaded), accepted);
    checks.push('original v2 active model, both attempts and evidence survive reload');

    current = 'backup';
    await page.goto(origin.base + 'v2.html#trail');
    await page.locator('#main [data-do="export"]').first().waitFor();
    const download = page.waitForEvent('download');
    await page.locator('#main [data-do="export"]').first().click();
    const bytes = fs.readFileSync(await (await download).path());
    const envelope = JSON.parse(bytes);
    ok(envelope.app === 'math-explorer' && envelope.version === 2, 'native offline State-v2 export');
    fs.writeFileSync(path.join(out, 'native-state-v2.json'), bytes);

    async function upload(buffer, name) {
      const chooser = restorePage.waitForEvent('filechooser');
      await restorePage.locator('#main [data-do="import"]').first().click();
      await (await chooser).setFiles({name, mimeType: 'application/json', buffer});
      await restorePage.waitForFunction(() => document.querySelector('#import-file')?.value === '');
      return restorePage.locator('#toast').innerText();
    }

    ok((await upload(bytes, 'p117-backup.json')).includes('备份已合并'), 'native empty-context import accepts the backup');
    const restoredRaw = await restorePage.evaluate(() => localStorage.getItem('math-explorer-v2'));
    ok((await upload(bytes, 'p117-repeat.json')).includes('备份已合并'), 'native repeat import succeeds');
    ok(await restorePage.evaluate(() => localStorage.getItem('math-explorer-v2')) === restoredRaw,
      'reimport preserves exact stored bytes');
    ok(!(await upload(Buffer.from('{'), 'p117-invalid.json')).includes('备份已合并'), 'corrupt backup is rejected');
    ok(await restorePage.evaluate(() => localStorage.getItem('math-explorer-v2')) === restoredRaw,
      'rejected import leaves exact restored bytes');
    await restorePage.goto(origin.base + 'learn.html#' + row.id);
    await restorePage.waitForFunction(i => window.mathLesson?.snapshot()?.index === i, row.index);
    const restored = await capture(restorePage, out, 'fractionfour-8', row, 'restored-backup');
    assert.deepEqual(restored.model, good.model);
    assert.deepEqual(restored.record, good.record);
    assert.deepEqual(proof(restored), accepted);
    observations.push({phase: 'restored-backup', acceptedProof: proof(restored), storage: restored.storage});
    await restorePage.screenshot({path: path.join(out, 'restored-backup.png')});
    screenshots.push('restored-backup.png');
    checks.push('restored original model, history, and correction independently match');

    current = 'retry-and-undo';
    await page.goto(origin.base + 'learn.html#' + row.id);
    await page.waitForFunction(i => window.mathLesson?.snapshot()?.index === i, row.index);
    await click(page, '[data-do="p3-retry"]');
    const retried = await captureWork('retry-new-draft');
    ok(retried.model.history.length === 0 && retried.attempts.length === good.attempts.length &&
      proof(retried) === null, 'native Retry keeps attempts and clears eligibility on the new draft');
    await selectAnchorAndPredict();
    await jump(-1);
    await click(page, '#extra-controls [data-x="direct-undo"]');
    await jump(3);
    await field(page, 'zero', 'reference', 'select');
    await field(page, 'answer', -2);
    await click(page, '#actions [data-do="check"]');
    const undone = await captureWork('undo-correct-original-check');
    assert.deepEqual(undone.model.history, [-1,3]);
    assert.deepEqual(undone.model.jumps, [3]);
    ok(undone.attempts.length === 3 && inspect(original, undone.attempts.at(-1).value).correct &&
      proof(undone) === null, 'real Undo diverges from retained history and is excluded despite original success');
    await saveImage('undo-correct-original-check.png');
    ok(errors.length === 0, 'no page errors or non-local HTTP requests');

    console.log('P117_CHROMIUM_OK ' + JSON.stringify({
      testedCheckoutSha: sha, chromium: browserVersion, checks: checks.length, captures: observations.length
    }));
  } catch (error) {
    errors.push(current + ': ' + (error.stack || error));
    await page?.screenshot({path: path.join(out, 'failure.png')}).catch(() => {});
    throw error;
  } finally {
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({
      schema: 'math-p117-fractionfour-directed-jump-browser/1',
      testedCheckoutSha: sha, originalControls: true, seededLessonPositionOnly: navigationRoutes.some(x => x.method === 'seeded-only'), navigationRoutes,
      chromium: browserVersion, viewport: STANDARD_DESKTOP_VIEWPORT, source: P117_SOURCE,
      checks, observations, screenshots, errors
    }, null, 2) + '\n');
    await restore?.close().catch(() => {});
    await learner?.close().catch(() => {});
    await browser?.close().catch(() => {});
    await origin?.close().catch(() => {});
  }
}

run().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
