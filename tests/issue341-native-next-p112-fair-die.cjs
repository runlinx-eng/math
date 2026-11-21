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
const out = path.resolve(process.env.MATH_P112_ARTIFACTS || path.join(root, 'verification/issue341-navigation/p9-p112-fair-die'));
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

const navigationRoutes = [];

async function routePosition(page, origin, row) {
  const url = origin.base + 'learn.html#' + row.id;
  if (page.url() !== url) {
    // Hash-only lesson switching does not issue a new network response.
    // Stopped-origin SW coverage is verified by the explicit page.reload below.
    await page.goto(url);
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
  const {P112_SOURCES, replayP112FairDieEvidence, submittedP112FairDieEvidence} =
    await entry('dist/learning/p112-fair-die-evidence.js');
  const {sessionTaskFor} = await entry('dist/learning/bridges.js');
  const {inspect} = await entry('dist/learning/phase5/b22-model.js');
  const expectedFaces = [[6], [2,4,6], [3], [1,2,4,5,6], [1,2,3,4,5], [2,3,4,5,6]];
  const cases = P112_SOURCES.map((source, i) => {
    const {sessionId, index} = source;
    return {source, id:sessionId, index, context:{sessionId,index},
      task:sessionTaskFor(sessionId,index), faces:expectedFaces[i]};
  });
  const verified = [];
  let origin, browser, learner, restore, page, browserVersion = null, phase = 'startup';

  function proof(row, snap) {
    return submittedP112FairDieEvidence(row.task, snap.model, snap.record, row.context);
  }
  async function observe(p, row, stage) {
    const result = await capture(p, out, row.id + '-' + row.index, row, stage);
    observations.push({
      sessionId: row.id, index: row.index, stage, attempts: result.attempts.length,
      selected: result.model.board.selected, historyLength: result.model.history.length,
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
    if (select) await loc.selectOption(value);
    else await loc.fill(String(value));
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
    await warmAndStop(page, origin, release, ok, 'P112');

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

      const toggle = async face => {
        const selector = '#extra-visual [data-x="p22-toggle"][data-index="' + (face - 1) + '"]';
        const button = await openControl(page, selector);
        assert.equal(await button.innerText(), String(face));
        await button.click();
        return button.getAttribute('aria-pressed');
      };
      const misses = [1,2,3,4,5,6].filter(face => !row.faces.includes(face));
      ok(await toggle(misses[0]) === 'true', tag + ' actual wrong face is selected');
      for (const face of [...row.faces].reverse()) await toggle(face);
      await field(page, 'kind', 'equal', true);
      await field(page, 'prob', row.faces.length + '/6');
      for (const [i, question] of row.task.questions.entries()) {
        await field(page, 'answers.' + i, String(question.value), Boolean(question.options));
      }
      await click(page, '#actions [data-do="check"]');
      const wrong = await observe(page, row, 'wrong-check');
      ok(wrong.attempts.length === 1 && !inspect(row.task, wrong.attempts[0].value).correct &&
        proof(row, wrong) === null, tag + ' actual wrong Check preserves the extra face');
      await picture(page, tag + '-wrong-check.png');

      ok(await toggle(misses[0]) === 'false', tag + ' actual wrong face is removed');
      const draft = await observe(page, row, 'corrected-draft');
      const candidate = replayP112FairDieEvidence(row.task, draft.model, row.context);
      assert.deepEqual(candidate?.selectedFaces, row.faces);
      ok(candidate.favorableCount === row.faces.length && candidate.sampleCount === 6 &&
        !proof(row, draft), tag + ' correct face set stays ineligible before Check');
      await click(page, '#actions [data-do="check"]');

      const good = await observe(page, row, 'correct-check');
      const accepted = proof(row, good);
      ok(good.attempts.length === 2 && inspect(row.task, good.attempts.at(-1).value).correct &&
        accepted?.sampleCount === 6, tag + ' latest original Check with exact probability');
      assert.deepEqual(accepted.selectedFaces, row.faces);
      assert.deepEqual(accepted.toggles, [
        {face:misses[0], selected:true},
        ...[...row.faces].reverse().map(face => ({face, selected:true})),
        {face:misses[0], selected:false}
      ]);
      if (row.id === 'chancecomplement' && row.index === 2) {
        ok(accepted.favorableCount === 5 && good.model.answers[2] === 'once',
          tag + ' shared face 2 contributes a single outcome');
      }
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
    ok((await upload(bytes, 'p112-backup.json')).includes('备份已合并'), 'fresh context imports the backup');
    const restoredBytes = await restorePage.evaluate(() => localStorage.getItem('math-explorer-v2'));
    ok((await upload(bytes, 'p112-repeat.json')).includes('备份已合并'), 'repeat import succeeds');
    ok(await restorePage.evaluate(() => localStorage.getItem('math-explorer-v2')) === restoredBytes,
      'repeat import preserves exact bytes');
    ok(!(await upload(Buffer.from('{'), 'p112-corrupt.json')).includes('备份已合并'), 'corrupt backup is rejected');
    ok(await restorePage.evaluate(() => localStorage.getItem('math-explorer-v2')) === restoredBytes,
      'failed import preserves exact bytes');
    await restorePage.goto(origin.base + 'learn.html#' + cases.at(-1).id);
    await restorePage.waitForFunction(id => window.mathLesson?.snapshot()?.id === id, cases.at(-1).id);
    for (const {row, good, accepted} of verified) {
      const imported = await observe(restorePage,row,'restored-backup');
      assert.deepEqual(imported.model, good.model);
      assert.deepEqual(imported.record, good.record);
      assert.deepEqual(proof(row,imported), accepted);
      checks.push(row.id + ':' + row.index + ' restored model, correction and evidence match exactly');
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
    console.log('P112_CHROMIUM_OK ' + JSON.stringify({testedCheckoutSha:sha,chromium:browserVersion,checks:checks.length,captures:observations.length}));
  } catch (error) {
    errors.push(phase + ': ' + (error.stack || error));
    await page?.screenshot({path:path.join(out, 'failure.png')}).catch(() => {});
    throw error;
  } finally {
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
      schema:'math-p112-fair-die-browser/1', testedCheckoutSha:sha,
      originalControls:true, seededLessonPositionOnly: navigationRoutes.some(x => x.method === 'seeded-only'), navigationRoutes, chromium:browserVersion,
      viewport:STANDARD_DESKTOP_VIEWPORT, sources:P112_SOURCES,
      checks, observations, screenshots, errors
    },null,2)+'\n');
    await restore?.close().catch(() => {});
    await learner?.close().catch(() => {});
    await browser?.close().catch(() => {});
    await origin?.close().catch(() => {});
  }
}

run().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
