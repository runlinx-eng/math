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
const out = path.resolve(process.env.MATH_P116_ARTIFACTS || path.join(root, 'verification/issue341-navigation/p9-p116-integer-dotplot'));
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

async function field(page, name, value, select = false) {
  const loc = await openControl(page, '#extra-controls [data-xfield="' + name + '"]');
  if (select) await loc.selectOption(value);
  else await loc.fill(String(value));
  assert.equal(await loc.inputValue(), String(value));
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
  fs.mkdirSync(out, {recursive:true});
  const {P116_SOURCES, replayP116IntegerDotplotEvidence, submittedP116IntegerDotplotEvidence} =
    await entry('dist/learning/p116-integer-dotplot-evidence.js');
  const {sessionTaskFor} = await entry('dist/learning/bridges.js');
  const {inspect} = await entry('dist/learning/phase5/b20-model.js');
  const cases = P116_SOURCES.map(source => {
    const {sessionId, index} = source;
    return {source, id:sessionId, index, context:{sessionId,index}, task:sessionTaskFor(sessionId,index)};
  });
  const verified = [];
  let origin, browser, learner, restore, page, browserVersion = null, phase = 'startup';

  function proof(row, snap) {
    return submittedP116IntegerDotplotEvidence(row.task, snap.model, snap.record, row.context);
  }
  async function observe(p, row, stage) {
    const result = await capture(p, out, 'dotrecords-' + row.index, row, stage);
    observations.push({
      index: row.index, stage, attempts: result.attempts.length, cursor: result.model.board.cursor,
      placed: result.model.board.placed, historyLength: result.model.history.length,
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
  async function place(value) {
    await field(page, 'value', value);
    await click(page, '#extra-controls [data-x="b20-dot"]');
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
    await warmAndStop(page, origin, release, ok, 'P116');

    for (const row of cases) {
      phase = 'dotrecords:' + row.index;
      const tag = 'dotrecords-' + row.index;
      await routePosition(page, origin, row);
      const live = await page.evaluate(async ({id,index}) => {
        const {sessionTaskFor} = await import('./learning/bridges.js');
        const {LESSONS} = await import('./learning/catalog.js');
        return {task:sessionTaskFor(id,index), nodeId:LESSONS[id].topicId};
      }, row);
      const digest = createHash('sha256').update(JSON.stringify(ordered(live.task))).digest('hex');
      ok(live.nodeId === row.source.nodeId && digest === row.source.taskHash, tag + ' source fingerprint');
      assert.deepEqual(live.task, row.task);
      ok(await page.evaluate(() => innerWidth === 1920 && innerHeight === 1080), tag + ' standard viewport');

      await place('1/2');
      const rejected = await observe(page, row, 'invalid-placement');
      ok(rejected.model.board.cursor === 0 && rejected.model.board.placed[0] === null &&
        rejected.model.history[0].f.value === '1/2', tag + ' original off-tick attempt is retained without moving');
      for (const [index, value] of row.task.values.entries()) await place(index === 0 ? value + 1 : value);
      await field(page, 'answers.0', row.task.values.length);
      await field(page, 'answers.1', row.index === 0 ? 4 : 5);
      if (row.index === 0) await field(page, 'answers.2', 'gap', true);
      await click(page, '#actions [data-do="check"]');

      const wrong = await observe(page, row, 'wrong-check');
      ok(wrong.attempts.length === 1 && !inspect(row.task, wrong.attempts[0].value).correct &&
        proof(row,wrong) === null, tag + ' wrong placement persists in original attempt');
      await picture(page, tag + '-wrong-check.png');

      await click(page, '#extra-controls [data-x="b20-row"][data-index="0"]');
      await place(row.task.values[0]);
      const draft = await observe(page, row, 'corrected-draft');
      ok(replayP116IntegerDotplotEvidence(row.task, draft.model, row.context) &&
        !proof(row,draft), tag + ' corrected record is ineligible before Check');
      await click(page, '#actions [data-do="check"]');

      const good = await observe(page, row, 'correct-check');
      const accepted = proof(row,good);
      ok(good.attempts.length === 2 && inspect(row.task, good.attempts.at(-1).value).correct &&
        accepted?.recordCount === row.task.values.length, tag + ' latest correct Check proves the filled plot');
      assert.deepEqual(accepted.observablePlacements.at(-1), {
        eventIndex: good.model.history.length - 1, recordIndex: 0, accepted: true,
        from: row.task.values[0] + 1, to: row.task.values[0]
      });
      assert.deepEqual(accepted.modes,[5]);
      assert.deepEqual(accepted.zeroFrequencyTicks, row.index === 0 ? [7] : [0,4,6]);
      ok(accepted.frequencies.find(x => x.value === 3)?.count === (row.index===0 ? 4 : 2),
        tag + ' independently counted repeated dots and empty ticks');
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
    ok((await upload(bytes, 'p116-backup.json')).includes('备份已合并'), 'fresh context imports the backup');
    const restoredBytes = await restorePage.evaluate(() => localStorage.getItem('math-explorer-v2'));
    ok((await upload(bytes, 'p116-repeat.json')).includes('备份已合并'), 'repeat import succeeds');
    ok(await restorePage.evaluate(() => localStorage.getItem('math-explorer-v2')) === restoredBytes,
      'repeat import preserves exact bytes');
    ok(!(await upload(Buffer.from('{'), 'p116-corrupt.json')).includes('备份已合并'), 'corrupt backup is rejected');
    ok(await restorePage.evaluate(() => localStorage.getItem('math-explorer-v2')) === restoredBytes,
      'failed import preserves exact bytes');
    await restorePage.goto(origin.base + 'learn.html#dotrecords');
    await restorePage.waitForFunction(() => window.mathLesson?.snapshot()?.id === 'dotrecords');
    for (const {row, good, accepted} of verified) {
      const imported = await observe(restorePage,row,'restored-backup');
      assert.deepEqual(imported.model, good.model);
      assert.deepEqual(imported.record, good.record);
      assert.deepEqual(proof(row,imported), accepted);
      checks.push(row.index + ' restored model, correction and evidence match exactly');
    }

    phase = 'Retry';
    const last = verified.at(-1).row;
    await page.goto(origin.base + 'learn.html#dotrecords');
    await page.waitForFunction(i => window.mathLesson?.snapshot()?.index === i, last.index);
    await click(page, '[data-do="p3-retry"]');
    const retry = await observe(page, last, 'retry');
    ok(retry.model.history.length === 0 && retry.attempts.length === 2 &&
      proof(last,retry) === null, 'Retry keeps saved attempts and excludes the new blank draft');
    ok(errors.length === 0, 'no non-local requests or page errors');
    console.log('P116_CHROMIUM_OK ' + JSON.stringify({testedCheckoutSha:sha,chromium:browserVersion,checks:checks.length,captures:observations.length}));
  } catch (error) {
    errors.push(phase + ': ' + (error.stack || error));
    await page?.screenshot({path:path.join(out, 'failure.png')}).catch(() => {});
    throw error;
  } finally {
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
      schema:'math-p116-integer-dotplot-browser/1', testedCheckoutSha:sha,
      originalControls:true, seededLessonPositionOnly: navigationRoutes.some(x => x.method === 'seeded-only'), navigationRoutes, chromium:browserVersion,
      viewport:STANDARD_DESKTOP_VIEWPORT, sources:P116_SOURCES,
      checks, observations, screenshots, errors
    },null,2)+'\n');
    await restore?.close().catch(() => {});
    await learner?.close().catch(() => {});
    await browser?.close().catch(() => {});
    await origin?.close().catch(() => {});
  }
}

run().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
