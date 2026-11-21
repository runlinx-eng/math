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
const out = path.resolve(process.env.MATH_P093_ARTIFACTS || path.join(root, 'verification/p9-p093-triangular-prism-net'));
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

async function routePosition(page, origin, row) {
  const url = origin.base + 'learn.html#' + row.id;
  ok((await page.goto(url))?.fromServiceWorker() === true, 'original prism lesson opens offline');
  await page.waitForFunction(() => window.mathLesson);
  const start = page.locator('[data-do="start"]');
  if (await start.isVisible()) await start.click();
  await page.locator('[data-x="guess"][data-value="false"]').click();
  await page.locator('[data-xfield="pair.0"]').selectOption('0');
  await page.locator('[data-xfield="pair.1"]').selectOption('1');
  await page.locator('[data-x="fold"]').click();
  await page.locator('[data-xfield="reason"]').selectOption('overlap');
  await page.locator('#actions [data-do="check"]').click();
  await page.locator('#actions [data-do="next"]').click();
  checks.push('native Check and Next complete the cube-net prerequisite');
  await page.waitForFunction(({id,index}) => {
    const snap = window.mathLesson?.snapshot();
    return snap?.id === id && snap.index === index;
  },row);
}

async function run() {
  fs.mkdirSync(out, {recursive:true});
  const {P093_SOURCES, replayP093TriangularPrismNetEvidence, submittedP093TriangularPrismNetEvidence} =
    await entry('dist/learning/p093-triangular-prism-net-evidence.js');
  const {sessionTaskFor} = await entry('dist/learning/bridges.js');
  const {inspect} = await entry('dist/learning/phase5/b27-model.js');
  const cases = P093_SOURCES.map(source => {
    const {sessionId, index} = source;
    return {source, id:sessionId, index, context:{sessionId,index},
      task:sessionTaskFor(sessionId,index)};
  });
  const verified = [];
  let origin, browser, learner, restore, page, browserVersion = null, phase = 'startup';

  function proof(row, snap) {
    return submittedP093TriangularPrismNetEvidence(row.task, snap.model, snap.record, row.context);
  }
  async function observe(p, row, stage) {
    const result = await capture(p, out, row.id + '-' + row.index, row, stage);
    observations.push({
      index: row.index, stage, attempts: result.attempts.length,
      board: result.model.board, historyLength: result.model.history.length,
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
    await warmAndStop(page, origin, release, ok, 'P093');

    for (const row of cases) {
      phase = row.id + ':' + row.index;
      const tag = row.id + '-' + row.index;
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

      const control = (action,value) => click(page,'#extra-controls [data-x="g27-' + action + '"]' +
        (value === undefined ? '' : '[data-index="' + value + '"]'));
      const check = () => click(page,'#actions [data-do="check"]');
      const turn = () => click(page,'#extra-controls [data-x="turn-extra"]');
      const canvas = page.locator('#extra-world canvas');
      await canvas.waitFor({state:'visible'});
      const initial = await observe(page,row,'initial');
      ok(initial.model.board.parts.length === 0 && initial.lesson.cases[0].attempts.length === 1,
        'initial base and native prerequisite are preserved');

      for (const part of [0,1,2]) await control('piece',part);
      await control('predict','yes');
      await control('fold');
      await turn();
      const missing = await observe(page,row,'missing-end');
      assert.deepEqual(missing.model.board.attempts,[{parts:[0,1,2],prediction:'yes'}]);
      ok(missing.attempts.length === 0 && !inspect(row.task,missing.model).correct &&
        await page.locator('#actions [data-do="check"]').isDisabled() && !proof(row,missing),
      'native Check is disabled while a triangular end is missing');
      await picture(page,tag + '-missing-end.png');

      await control('piece',3);
      const blocked = await observe(page,row,'folded-edit');
      ok(blocked.model.issue.includes('摊开') && blocked.model.board.parts.length === 3,
        'trying to attach a panel while folded changes no panel');
      await control('unfold');
      await control('piece',3);
      await control('predict','no');
      await control('fold');
      await check();
      const wrong = await observe(page,row,'wrong-prediction-check');
      ok(wrong.attempts.length === 1 && !inspect(row.task,wrong.attempts[0].value).correct &&
        !proof(row,wrong), 'actual Check records the incorrect prediction for the closed shell');
      await picture(page,tag + '-wrong-prediction-check.png');

      await control('unfold');
      await control('predict','yes');
      const flat = await canvas.screenshot();
      const slider = await openControl(page,'#extra-controls [data-xfield="foldPosition"]');
      await slider.fill('50');
      const halfway = await observe(page,row,'half-fold');
      ok(halfway.model.board.fold === 50 && !proof(row,halfway), 'the real range control leaves the fold halfway');
      ok(!flat.equals(await canvas.screenshot()), 'half-fold changes the actual 3D rendering');
      await picture(page,tag + '-half-fold.png');

      const getCamera = () => page.evaluate(() => window.mathLesson.snapshot().extra.camera);
      const beforeDrag = await getCamera();
      const box = await canvas.boundingBox();
      const x = box.x + box.width*0.5, y = box.y + box.height*0.5;
      await page.mouse.move(x,y);
      await page.mouse.down();
      await page.mouse.move(x+box.width*0.06,y+box.height*0.08,{steps:8});
      await page.mouse.up();
      const camera = await getCamera();
      ok(camera.some((value,i) => Math.abs(value-beforeDrag[i]) > 0.01), 'real canvas drag changes the 3D viewpoint');
      ok((await page.reload())?.fromServiceWorker() === true, 'half-fold reloads with the origin stopped');
      await page.waitForFunction(i => window.mathLesson?.snapshot()?.index === i, row.index);
      const resumed = await observe(page,row,'half-fold-reload');
      ok(resumed.model.board.fold === 50 &&
        (await getCamera()).every((value,i) => Math.abs(value-camera[i]) < 1e-6),
      'half-fold and viewpoint persist across a reload');

      await control('fold');
      const draft = await observe(page,row,'closed-draft');
      const complete = replayP093TriangularPrismNetEvidence(row.task,draft.model,row.context);
      assert.deepEqual(complete?.geometry,
        {rectangles:3,triangles:2,vertices:6,edges:9,openEdges:0,closed:true});
      ok(!proof(row,draft), 'the closed shell still needs a fresh Check');
      await check();
      const good = await observe(page,row,'closed-check');
      const accepted = proof(row,good);
      ok(good.attempts.length === 2 && inspect(row.task,good.attempts.at(-1).value).correct &&
        accepted?.geometry.closed, 'latest actual Check accepts the five-face prism');
      assert.deepEqual(accepted.folds.map(fold => [fold.triangles,fold.openEdges,fold.closed,fold.prediction]),
        [[1,3,false,'yes'],[2,0,true,'no'],[2,0,true,'yes']]);
      checks.push('evidence matches both the open shell and the corrected closed shell');
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
    ok((await upload(bytes, 'p093-backup.json')).includes('备份已合并'), 'fresh context imports the backup');
    const restoredBytes = await restorePage.evaluate(() => localStorage.getItem('math-explorer-v2'));
    ok((await upload(bytes, 'p093-repeat.json')).includes('备份已合并'), 'repeat import succeeds');
    ok(await restorePage.evaluate(() => localStorage.getItem('math-explorer-v2')) === restoredBytes,
      'repeat import preserves exact bytes');
    ok(!(await upload(Buffer.from('{'), 'p093-corrupt.json')).includes('备份已合并'), 'corrupt backup is rejected');
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
    console.log('P093_CHROMIUM_OK ' + JSON.stringify({testedCheckoutSha:sha,chromium:browserVersion,checks:checks.length,captures:observations.length}));
  } catch (error) {
    errors.push(phase + ': ' + (error.stack || error));
    await page?.screenshot({path:path.join(out, 'failure.png')}).catch(() => {});
    throw error;
  } finally {
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
      schema:'math-p093-triangular-prism-net-browser/1', testedCheckoutSha:sha,
      originalControls:true, seededLessonPositionOnly:false, chromium:browserVersion,
      viewport:STANDARD_DESKTOP_VIEWPORT, sources:P093_SOURCES,
      checks, observations, screenshots, errors
    },null,2)+'\n');
    await restore?.close().catch(() => {});
    await learner?.close().catch(() => {});
    await browser?.close().catch(() => {});
    await origin?.close().catch(() => {});
  }
}

run().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
