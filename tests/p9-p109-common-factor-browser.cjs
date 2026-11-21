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
const out = path.resolve(process.env.MATH_P109_ARTIFACTS || path.join(root, 'verification/p9-p109-common-factor'));
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
  if (page.url() !== url) {
    await page.goto(url);
  }
  await page.waitForFunction(id => window.mathLesson?.snapshot()?.id === id, row.id);
  // Select only a position in a fresh record. All mathematics is done through
  // the original factor, expansion and Check controls.
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
  ok((await page.reload())?.fromServiceWorker() === true,
    row.id + ':' + row.index + ' original position loads from SW');
  await page.waitForFunction(i => window.mathLesson?.snapshot()?.index === i, row.index);
}

async function run() {
  fs.mkdirSync(out, {recursive:true});
  const {P109_SOURCES, replayP109CommonFactorEvidence, submittedP109CommonFactorEvidence} =
    await entry('dist/learning/p109-common-factor-evidence.js');
  const {sessionTaskFor} = await entry('dist/learning/bridges.js');
  const {inspect} = await entry('dist/learning/phase5/b35-model.js');
  const facts = [
    {correct:[3,'1',2,3], smaller:[1,'1',6,9], terms:[[6,1],[9,0]]},
    {correct:[6,'1',2,-3], smaller:[1,'1',12,-18], terms:[[12,1],[-18,0]]},
    {correct:[4,'x',2,3], smaller:[2,'x',4,6], terms:[[8,2],[12,1]]}
  ];
  const cases = P109_SOURCES.map((source, i) => {
    const {sessionId, index} = source;
    return {source, id:sessionId, index, context:{sessionId,index},
      task:sessionTaskFor(sessionId,index), ...facts[i]};
  });
  const verified = [];
  let origin, browser, learner, restore, page, browserVersion = null, phase = 'startup';

  function proof(row, snap) {
    return submittedP109CommonFactorEvidence(row.task, snap.model, snap.record, row.context);
  }
  async function observe(p, row, stage) {
    const result = await capture(p, out, row.id + '-' + row.index, row, stage);
    observations.push({
      index: row.index, stage, attempts: result.attempts.length,
      expansions: result.model.board.trials, historyLength: result.model.history.length,
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
    await warmAndStop(page, origin, release, ok, 'P109');

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

      const enter = async ([factor,power,a,b]) => {
        await field(page,'value',factor);
        await field(page,'second',power,true);
        await field(page,'third',a);
        await field(page,'fourth',b);
      };
      const expand = () => click(page,'#extra-controls [data-x="a35-factor"]');
      await enter([0,row.correct[1],0,0]);
      await expand();
      const invalid = await observe(page,row,'invalid-zero-factor');
      ok(invalid.model.board.trials.length === 0 && invalid.model.history.length === 1,
        tag + ' original expansion refuses a zero factor');

      if (row.index === 2) {
        await enter([4,'1',2,3]);
        await expand();
        const missingX = await observe(page,row,'missing-common-x');
        ok(!inspect(row.task,missingX.model).correct &&
          !replayP109CommonFactorEvidence(row.task,missingX.model,row.context),
          tag + ' an omitted common x is ineligible even with correct coefficients');
      }

      await enter(row.smaller);
      await expand();
      await click(page,'#actions [data-do="check"]');
      const wrong = await observe(page,row,'wrong-check');
      const smaller = wrong.model.board.trials.at(-1);
      assert.deepEqual(smaller.restored,row.task.terms);
      ok(wrong.attempts.length === 1 && !smaller.ok &&
        !inspect(row.task,wrong.attempts[0].value).correct && !proof(row,wrong),
        tag + ' original Check refuses a smaller factor despite matching expansion');
      await picture(page, tag + '-wrong-check.png');

      await enter(row.correct);
      const unexpanded = await observe(page,row,'correct-unexpanded');
      ok(!replayP109CommonFactorEvidence(row.task,unexpanded.model,row.context),
        tag + ' editing the factors requires an actual expansion');
      await expand();
      const draft = await observe(page,row,'correct-expanded-draft');
      const revised = replayP109CommonFactorEvidence(row.task,draft.model,row.context);
      ok(revised?.expansion.accepted && !proof(row,draft),
        tag + ' completed expansion stays ineligible before Check');
      await click(page,'#actions [data-do="check"]');

      const good = await observe(page,row,'correct-check');
      const accepted = proof(row,good);
      ok(good.attempts.length === 2 && inspect(row.task,good.attempts.at(-1).value).correct &&
        accepted?.greatestFactor.coefficient === row.correct[0], tag + ' actual latest Check and maximal coefficient');
      assert.deepEqual(accepted.expansion.expanded.map(({coefficient,degree}) => [coefficient,degree]),row.terms);
      ok(accepted.attempts.some(attempt => attempt.restoresOriginal && !attempt.maximum) &&
        accepted.greatestFactor.degree === (row.correct[1] === 'x' ? 1 : 0),
        tag + ' original signs, degrees and smaller factor are accounted for');
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
    ok((await upload(bytes, 'p109-backup.json')).includes('备份已合并'), 'fresh context imports the backup');
    const restoredBytes = await restorePage.evaluate(() => localStorage.getItem('math-explorer-v2'));
    ok((await upload(bytes, 'p109-repeat.json')).includes('备份已合并'), 'repeat import succeeds');
    ok(await restorePage.evaluate(() => localStorage.getItem('math-explorer-v2')) === restoredBytes,
      'repeat import preserves exact bytes');
    ok(!(await upload(Buffer.from('{'), 'p109-corrupt.json')).includes('备份已合并'), 'corrupt backup is rejected');
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
    console.log('P109_CHROMIUM_OK ' + JSON.stringify({testedCheckoutSha:sha,chromium:browserVersion,checks:checks.length,captures:observations.length}));
  } catch (error) {
    errors.push(phase + ': ' + (error.stack || error));
    await page?.screenshot({path:path.join(out, 'failure.png')}).catch(() => {});
    throw error;
  } finally {
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
      schema:'math-p109-common-factor-browser/1', testedCheckoutSha:sha,
      originalControls:true, seededLessonPositionOnly:true, chromium:browserVersion,
      viewport:STANDARD_DESKTOP_VIEWPORT, sources:P109_SOURCES,
      checks, observations, screenshots, errors
    },null,2)+'\n');
    await restore?.close().catch(() => {});
    await learner?.close().catch(() => {});
    await browser?.close().catch(() => {});
    await origin?.close().catch(() => {});
  }
}

run().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
