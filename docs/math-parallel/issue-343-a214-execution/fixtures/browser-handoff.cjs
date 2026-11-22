'use strict';
// Isolated B-line development fixture. All work and Check/Next are dispatched
// through visible native controls; only the selected test lessons are visited.
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');

const root = process.cwd();
const spec = require(path.resolve(process.argv[2]));
const out = path.resolve(process.argv[3]);
const {chromium} = require(process.env.MATH_PLAYWRIGHT_MODULE || 'playwright');
const {capture, createOrigin, warmAndStop} = require(path.join(root, 'tests/helpers/p9-basic-artifact.cjs'));
const {newDesktopContext, STANDARD_DESKTOP_VIEWPORT} = require(path.join(root, 'tests/helpers/standard-desktop-viewport.cjs'));
const entry = relative => import(pathToFileURL(path.join(root, relative)));
const result = {
  baseline: process.env.A214_BASELINE || null,
  testedCheckoutSha: execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim(),
  fixture: path.basename(process.argv[2]), chromium: null, viewport: STANDARD_DESKTOP_VIEWPORT,
  originalControls: true, seededWork: false, strictAApproved: false, checks: [], positions: [], errors: []
};
let stage = 'startup';

function ok(condition, label) {
  assert.ok(condition, stage + ': ' + label);
  result.checks.push({stage, label});
}

async function visible(locator) {
  await locator.first().waitFor({state: 'attached'});
  assert.equal(await locator.count(), 1, stage + ': one original control: ' + locator);
  while (!(await locator.isVisible())) {
    const unopened = locator.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await unopened.count(), 1, stage + ': hidden original control: ' + locator);
    await unopened.locator(':scope > summary').click();
  }
  assert.ok(await locator.isEnabled(), stage + ': disabled original control: ' + locator);
  return locator;
}

async function main() {
  fs.mkdirSync(out, {recursive: true});
  const {sessionTaskFor} = await entry('dist/learning/bridges.js');
  const {prepareSessionRuntime} = await entry('dist/learning/phase4/async-batches.js');
  const {inspect} = await entry('dist/learning/tasks.js');
  const {taskFingerprint} = await entry('scripts/audit-evidence-expansion.mjs');
  const plan = await spec({entry});
  let origin, browser, context, page;
  try {
    origin = await createOrigin(root);
    browser = await chromium.launch({headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
    result.chromium = browser.version();
    context = await newDesktopContext(browser, {reducedMotion: 'reduce', serviceWorkers: 'allow', acceptDownloads: true});
    page = await context.newPage();
    page.setDefaultTimeout(6500);
    page.on('pageerror', e => result.errors.push(stage + ': ' + String(e)));
    context.on('request', request => {
      if (/^https?:/.test(request.url()) && !request.url().startsWith(origin.base)) {
        result.errors.push(stage + ': external request ' + request.url());
      }
    });
    const cache = fs.readFileSync(path.join(root, 'dist/sw.js'), 'utf8').match(/const CACHE = '([^']+)'/)?.[1];
    const warm = await warmAndStop(page, origin, cache, ok, 'A214');
    result.offline = warm;
    const driver = {
      async field(key, value) {
        const input = await visible(page.locator('#work [data-xfield="' + key + '"]'));
        const tag = await input.evaluate(e => ({tag: e.tagName, type: e.type}));
        if (tag.tag === 'SELECT') await input.selectOption(String(value));
        else if (tag.type === 'range') {
          assert.ok(Number.isInteger(value), 'choose sliders by native keyboard with an integer position');
          const start = Number(await input.inputValue());
          const min = Number(await input.getAttribute('min'));
          const max = Number(await input.getAttribute('max'));
          const step = Number(await input.getAttribute('step') || 1);
          assert.ok(value >= min && value <= max && (value - min) % step === 0, 'slider value is attainable');
          if (value === min) await input.press('Home');
          else if (value === max) await input.press('End');
          else {
            if (Math.abs(value - start) / step > 20) {
              const box = await input.boundingBox();
              await input.click({position: {x: 8 + (box.width - 16) * (value - min) / (max - min), y: box.height / 2}});
            }
            const afterClick = Number(await input.inputValue());
            const direction = afterClick > value ? 'ArrowLeft' : 'ArrowRight';
            for (let i = 0; i < Math.abs(value - afterClick) / step; i++) await input.press(direction);
          }
          assert.equal(Number(await input.inputValue()), value, 'slider reached the exact native value');
        } else {
          await input.fill(String(value));
          await input.press('Tab');
        }
      },
      async act(name, data = {}) {
        const attributes = Object.entries(data).map(([k, v]) => '[data-' + k + '="' + v + '"]').join('');
        await (await visible(page.locator('#work [data-x="' + name + '"]' + attributes))).click();
      },
      async read(selector) {
        return (await (await visible(page.locator(selector))).textContent()).trim();
      },
      async click(selector) {
        await (await visible(page.locator(selector))).click();
      },
      async steps(steps) {
        for (const step of steps) {
          if (step.field) await driver.field(step.field, step.value);
          else await driver.act(step.action, step.data);
        }
      }
    };
    const indices = new Map();
    for (const target of plan.targets.filter(t =>
        (!process.env.A214_TARGET_SESSION || t.source.sessionId === process.env.A214_TARGET_SESSION) &&
        (!process.env.A214_TARGET_POSITION || t.source.sessionId + ':' + t.source.index === process.env.A214_TARGET_POSITION))) {
      const {sessionId, index, nodeId, taskHash, type} = target.source;
      const position = sessionId + ':' + index;
      const selected = {id: sessionId, index};
      const label = sessionId + '-' + index;
      try {
        stage = 'native-' + position;
        await prepareSessionRuntime(sessionId);
        const task = sessionTaskFor(sessionId, index);
        if (!indices.has(sessionId)) {
          // Force a document navigation between lessons; a bare fragment change has no response.
          await page.goto(origin.base + 'v2.html#trail');
          ok((await page.goto(origin.base + 'learn.html#' + sessionId))?.fromServiceWorker() === true,
            'Native lesson loaded by the original Service Worker with its HTTP origin stopped');
          await page.waitForFunction(id => window.mathLesson?.snapshot()?.id === id, sessionId);
          const start = page.locator('[data-do="start"]');
          if (await start.isVisible()) await start.click();
          indices.set(sessionId, 0);
        }
        for (let i = indices.get(sessionId); i < index; i++) {
          stage = 'prerequisite-' + sessionId + ':' + i;
          const ui = page.locator('#actions [data-do="next"]');
          if (!(await ui.isVisible())) {
            assert.ok(plan.prerequisite, 'Native prerequisite fixture missing');
            await plan.prerequisite(driver, sessionTaskFor(sessionId, i), {sessionId, index: i});
            await driver.click('#actions [data-do="check"]');
          }
          await (await visible(ui)).click();
          indices.set(sessionId, i + 1);
        }
        stage = 'native-' + position;
        await page.waitForFunction(({id, index}) => {
          const snapshot = window.mathLesson?.snapshot();
          return snapshot?.id === id && snapshot?.index === index && snapshot?.view === 'task';
        }, selected);
        const native = await page.evaluate(async ({id, index}) => {
          const {sessionTaskFor} = await import('./learning/bridges.js');
          const {LESSONS} = await import('./learning/catalog.js');
          return {task: sessionTaskFor(id, index), nodeId: LESSONS[id].topicId};
        }, selected);
        ok(native.nodeId === nodeId && native.task.type === type && taskFingerprint(native.task) === taskHash &&
          taskFingerprint(task) === taskHash, 'Exact native source node, task type and full SHA-256');
        const initial = await capture(page, out, label, selected, 'fresh');
        ok(initial.attempts.length === 0, 'Target had no prior Check');
        stage = 'first-check-' + position;
        await target.wrong(driver, task);
        await driver.click('#actions [data-do="check"]');
        const wrong = await capture(page, out, label, selected, 'wrong-check');
        ok(wrong.attempts.length === 1 && !inspect(task, wrong.model).correct &&
          !target.submitted(task, wrong.model, wrong.record, target.source), 'Original failed Check retained');
        stage = 'second-check-' + position;
        await target.correct(driver, task);
        const draft = await capture(page, out, label, selected, 'corrected-draft');
        ok(inspect(task, draft.model).correct &&
          !target.submitted(task, draft.model, draft.record, target.source), 'Edited result needs its own Check');
        await driver.click('#actions [data-do="check"]');
        const good = await capture(page, out, label, selected, 'correct-check');
        const proof = target.submitted(task, good.model, good.record, target.source);
        ok(good.attempts.length === 2 && Boolean(proof), 'Fresh correct Check and independent evidence replay');
        fs.writeFileSync(path.join(out, label + '-proof.json'), JSON.stringify(proof, null, 2) + '\n');
        await page.screenshot({path: path.join(out, label + '-correct.png')});
        stage = 'restore-' + position;
        ok((await page.reload())?.fromServiceWorker() === true, 'Real offline refresh');
        await page.waitForFunction(({id, index}) => {
          const s = window.mathLesson?.snapshot();
          return s?.id === id && s?.index === index;
        }, selected);
        const restored = await capture(page, out, label, selected, 'restored');
        assert.deepEqual(restored.model, good.model);
        assert.deepEqual(restored.record, good.record);
        ok(Boolean(target.submitted(task, restored.model, restored.record, target.source)),
          'Original model and both Checks restored from serialized State-v2');
        result.positions.push({position, nodeId, taskHash, type, wrong: wrong.storage, correct: good.storage,
          restored: restored.storage, firstAttemptCorrect: false, latestAttemptCorrect: true, status: 'PASS'});
      } catch (error) {
        result.errors.push(stage + ': ' + error.message);
        result.positions.push({position, nodeId, taskHash, type, status: 'FAIL', stage});
        await page.screenshot({path: path.join(out, label + '-failure.png')}).catch(() => {});
      }
    }
    stage = 'native-backup-export';
    await page.goto(origin.base + 'v2.html#trail');
    const exportButton = page.locator('#main [data-do="export"]').first();
    await exportButton.waitFor();
    const downloading = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloading;
    await download.saveAs(path.join(out, 'native-state-v2.json'));
    const backup = JSON.parse(fs.readFileSync(path.join(out, 'native-state-v2.json'), 'utf8'));
    ok(backup.app === 'math-explorer' && backup.version === 2, 'Original State-v2 export');
    assert.equal(result.errors.length, 0, 'No failing target or browser exception');
  } finally {
    await context?.close().catch(() => {});
    await browser?.close().catch(() => {});
    await origin?.close().catch(() => {});
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(result, null, 2) + '\n');
  }
  console.log(JSON.stringify({sha: result.testedCheckoutSha, checks: result.checks.length, positions: result.positions.map(r => [r.position, r.status])}));
}

main().catch(error => { console.error(stage, error.stack); process.exitCode = 1; });
