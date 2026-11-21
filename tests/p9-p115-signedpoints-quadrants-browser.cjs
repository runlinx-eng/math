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
const out = path.resolve(process.env.MATH_P115_ARTIFACTS || path.join(root, 'verification/p9-p115-signedpoints-quadrants'));
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

async function routePosition(page, origin, row) {
  const url = origin.base + 'learn.html#' + row.id;
  if (page.url() !== url) {
    ok((await page.goto(url))?.fromServiceWorker() === true, row.index + ' original lesson with origin stopped');
  }
  await page.waitForFunction(id => window.mathLesson?.snapshot()?.id === id, row.id);
  // Select only a position in a fresh record. All mathematics is done through
  // the original place, revise and Check controls.
  await page.evaluate(async ({id,index}) => {
    const {packText, unpackText} = await import('./storage.js');
    const key = 'math-explorer-v2';
    const state = JSON.parse(unpackText(localStorage.getItem(key)));
    const lesson = state.lessons[id];
    if (!lesson || lesson.cases[index]?.attempts?.length) throw Error('Expected empty native case');
    lesson.index = index;
    lesson.view = 'task';
    localStorage.setItem(key, packText(JSON.stringify(state)));
  }, row);
  ok((await page.reload())?.fromServiceWorker() === true, row.index + ' original position loads from SW');
  await page.waitForFunction(i => window.mathLesson?.snapshot()?.index === i, row.index);
}

async function run() {
  fs.mkdirSync(out, {recursive:true});
  const {P115_SOURCES, replayP115QuadrantEvidence, submittedP115QuadrantEvidence} =
    await entry('dist/learning/p115-signedpoints-quadrants-evidence.js');
  const {sessionTaskFor} = await entry('dist/learning/bridges.js');
  const {inspect} = await entry('dist/learning/phase5/b24-model.js');
  const cases = P115_SOURCES.map(source => {
    const {sessionId, index} = source;
    return {source, id:sessionId, index, context:{sessionId,index}, task:sessionTaskFor(sessionId,index)};
  });
  const verified = [];
  let origin, browser, learner, restore, page, browserVersion = null, phase = 'startup';

  function proof(row, snap) {
    return submittedP115QuadrantEvidence(row.task, snap.model, snap.record, row.context);
  }
  async function observe(p, row, stage) {
    const result = await capture(p, out, 'signedpoints-' + row.index, row, stage);
    observations.push({
      index: row.index, stage, attempts: result.attempts.length,
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
  async function plot([x,y]) {
    await field(page, 'x', x);
    await field(page, 'y', y);
    await click(page, '#extra-controls [data-x="p24-plot"]');
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
    await warmAndStop(page, origin, release, ok, 'P115');

    for (const row of cases) {
      phase = 'signedpoints:' + row.index;
      const tag = 'signedpoints-' + row.index;
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

      await plot([-10, row.task.target[0][1]]);
      const rejected = await observe(page, row, 'invalid-placement');
      ok(rejected.model.board.placed.length === 0 && rejected.model.history[0].a === 'plot',
        tag + ' out-of-range input is retained without moving');

      const last = row.task.target.at(-1);
      for (const point of row.task.target.slice(0,-1)) await plot(point);
      const wrongPoint = [last[0]+1, last[1]];
      await plot(wrongPoint);
      const classification = ['II','IV','axis'][row.index];
      await field(page, 'answers.0', classification, true);
      await click(page, '#actions [data-do="check"]');
      const wrong = await observe(page, row, 'wrong-check');
      ok(wrong.attempts.length === 1 && !inspect(row.task, wrong.attempts[0].value).correct &&
        proof(row,wrong) === null, tag + ' incorrect original coordinates are preserved');
      await picture(page, tag + '-wrong-check.png');

      await click(page, '#extra-controls [data-x="p24-undo"]');
      const [xmin,xmax,ymin] = row.task.domain;
      const cell = last[0]-xmin+(last[1]-ymin)*(xmax-xmin+1);
      await click(page, '#extra-visual [data-x="p24-dot"][data-index="' + cell + '"]');
      const draft = await observe(page, row, 'corrected-draft');
      ok(replayP115QuadrantEvidence(row.task,draft.model,row.context) && !proof(row,draft),
        tag + ' corrected coordinates stay ineligible before Check');
      await click(page, '#actions [data-do="check"]');

      const good = await observe(page,row,'correct-check');
      const accepted = proof(row,good);
      ok(good.attempts.length === 2 && inspect(row.task,good.attempts.at(-1).value).correct &&
        accepted?.checkedClassification === classification, tag + ' actual Check proves classification');
      assert.deepEqual(accepted.observableActions.at(-2).removed,wrongPoint);
      assert.equal(accepted.observableActions.at(-1).action,'dot');
      assert.deepEqual(accepted.observableActions.at(-1).point,last);
      assert.deepEqual(accepted.classifiedPoints.map(point=>point.kind),
        [['II'],['IV'],['I','II','III','IV','axis']][row.index]);
      ok(!accepted.coordinateInputOrderAssessed && accepted.checkedClassification === classification,
        tag + ' observed Undo, SVG grid selection and exact coordinate signs');
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
    ok((await upload(bytes, 'p115-backup.json')).includes('备份已合并'), 'fresh context imports the backup');
    const restoredBytes = await restorePage.evaluate(() => localStorage.getItem('math-explorer-v2'));
    ok((await upload(bytes, 'p115-repeat.json')).includes('备份已合并'), 'repeat import succeeds');
    ok(await restorePage.evaluate(() => localStorage.getItem('math-explorer-v2')) === restoredBytes,
      'repeat import preserves exact bytes');
    ok(!(await upload(Buffer.from('{'), 'p115-corrupt.json')).includes('备份已合并'), 'corrupt backup is rejected');
    ok(await restorePage.evaluate(() => localStorage.getItem('math-explorer-v2')) === restoredBytes,
      'failed import preserves exact bytes');
    await restorePage.goto(origin.base + 'learn.html#signedpoints');
    await restorePage.waitForFunction(() => window.mathLesson?.snapshot()?.id === 'signedpoints');
    for (const {row, good, accepted} of verified) {
      const imported = await observe(restorePage,row,'restored-backup');
      assert.deepEqual(imported.model, good.model);
      assert.deepEqual(imported.record, good.record);
      assert.deepEqual(proof(row,imported), accepted);
      checks.push(row.index + ' restored model, correction and evidence match exactly');
    }

    phase = 'Retry';
    const last = verified.at(-1).row;
    await page.goto(origin.base + 'learn.html#signedpoints');
    await page.waitForFunction(i => window.mathLesson?.snapshot()?.index === i, last.index);
    await click(page, '[data-do="p3-retry"]');
    const retry = await observe(page, last, 'retry');
    ok(retry.model.history.length === 0 && retry.attempts.length === 2 &&
      proof(last,retry) === null, 'Retry keeps saved attempts and excludes the new blank draft');
    ok(errors.length === 0, 'no non-local requests or page errors');
    console.log('P115_CHROMIUM_OK ' + JSON.stringify({testedCheckoutSha:sha,chromium:browserVersion,checks:checks.length,captures:observations.length}));
  } catch (error) {
    errors.push(phase + ': ' + (error.stack || error));
    await page?.screenshot({path:path.join(out, 'failure.png')}).catch(() => {});
    throw error;
  } finally {
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
      schema:'math-p115-signedpoints-quadrants-browser/1', testedCheckoutSha:sha,
      originalControls:true, seededLessonPositionOnly:true, chromium:browserVersion,
      viewport:STANDARD_DESKTOP_VIEWPORT, sources:P115_SOURCES,
      checks, observations, screenshots, errors
    },null,2)+'\n');
    await restore?.close().catch(() => {});
    await learner?.close().catch(() => {});
    await browser?.close().catch(() => {});
    await origin?.close().catch(() => {});
  }
}

run().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
