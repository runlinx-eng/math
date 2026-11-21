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
const out = path.resolve(process.env.MATH_P069_ARTIFACTS || path.join(root, 'verification/p9-p069-complex-steps'));
const entry = name => import(pathToFileURL(path.join(root, name)).href);
const sha = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim();
const checks = [], observations = [], screenshots = [], errors = [];
const ok = (v, l) => { assert.ok(v, l); checks.push(l); };
const ordered = v => Array.isArray(v) ? v.map(ordered) : (v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,ordered(v[k])])) : v);
async function openControl(page, sel) {
  let c = page.locator(sel);
  if (await c.count() === 0 && sel.startsWith('#extra-controls ')) c = page.locator(sel.replace('#extra-controls ', '#extra-visual '));
  assert.equal(await c.count(), 1, 'unique: ' + sel);
  for (let i = 0; i < 8 && !(await c.isVisible()); i++) {
    const cl = c.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await cl.count(), 1); await cl.locator(':scope > summary').click();
  }
  return c;
}
async function runSteps(page, steps) {
  for (const s of steps) {
    if (s.field) {
      const inp = await openControl(page, '#extra-controls [data-xfield="' + s.field + '"]');
      if (await inp.evaluate(el => el.tagName) === 'SELECT') await inp.selectOption(String(s.value)); else await inp.fill(String(s.value));
    } else {
      const sel = '#extra-controls [data-x="' + s.action + '"]' + Object.entries(s.data || {}).map(([k, v]) => '[data-' + k + '="' + v + '"]').join('');
      await (await openControl(page, sel)).click();
    }
  }
}
async function run() {
  fs.mkdirSync(out, {recursive: true});
  const {P069_SOURCES, replayP069ComplexStepsEvidence, submittedP069ComplexStepsEvidence} = await entry('dist/learning/p069-complex-steps-evidence.js');
  const {sessionTaskFor} = await entry('dist/learning/bridges.js');
  const b37 = await entry('dist/learning/phase5/b37-model.js');
  const [source] = P069_SOURCES;
  const row = {source, id: source.sessionId, index: source.index, context: {sessionId: source.sessionId, index: source.index}, task: sessionTaskFor(source.sessionId, source.index)};
  let origin, browser, learner, restore, page, restorePage, browserVersion = null;
  const proof = snap => submittedP069ComplexStepsEvidence(row.task, snap.model, snap.record, row.context);
  async function observe(p, stage) {
    const r = await capture(p, out, row.id + '-' + row.index, row, stage);
    observations.push({index: row.index, stage, attempts: r.attempts.length, correct: b37.inspect(row.task, r.model).correct, evidence: Boolean(proof(r))});
    return r;
  }
  async function picture(p, n) { await p.screenshot({path: path.join(out, n), fullPage: true}); screenshots.push(n); }
  try {
    origin = await createOrigin(root); browser = await chromium.launch({headless: true}); browserVersion = browser.version();
    learner = await newDesktopContext(browser); restore = await newDesktopContext(browser);
    page = await learner.newPage(); restorePage = await restore.newPage();
    for (const p of [page, restorePage]) {
      p.on('pageerror', err => errors.push(err.message));
      p.on('request', req => { if (!req.url().startsWith(origin.base) && !req.url().startsWith('data:') && !req.url().startsWith('blob:')) errors.push(req.url()); });
    }
    const release = fs.readFileSync(path.join(root, 'dist/sw.js'), 'utf8').match(/const CACHE = '([^']+)'/)[1];
    await page.goto(origin.base + 'v2.html#trail');
    await page.locator('#main [data-do="export"]').first().waitFor();
    await restorePage.goto(origin.base + 'v2.html#trail');
    await restorePage.locator('#main [data-do="import"]').first().waitFor();
    await restorePage.evaluate(async () => Boolean(await navigator.serviceWorker.ready));
    await restorePage.reload();
    await restorePage.waitForFunction(() => !!navigator.serviceWorker.controller);
    await warmAndStop(page, origin, release, ok, 'P069');
    ok((await page.goto(origin.base + 'learn.html#' + row.id))?.fromServiceWorker() === true, 'opens offline');
    await page.waitForFunction(() => window.mathLesson);
    const start = page.locator('[data-do="start"]'); if (await start.isVisible()) await start.click();
    for (let cur = 0; cur < row.index; cur++) {
      await runSteps(page, b37.solveSteps(sessionTaskFor(row.id, cur)));
      await page.locator('#actions [data-do="check"]').click();
      await page.locator('#actions [data-do="next"]').click();
      await page.waitForFunction(i => window.mathLesson?.snapshot()?.index === i, cur + 1);
    }
    ok(createHash('sha256').update(JSON.stringify(ordered(row.task))).digest('hex') === row.source.taskHash, 'hash');
    await (await openControl(page, '#extra-controls [data-xfield="value"]')).fill('99999');
    await (await openControl(page, '#extra-controls [data-x="r37-step"]')).click();
    await page.locator('#actions [data-do="check"]').click();
    ok(!proof(await observe(page, 'wrong-step')), 'wrong rejected');
    await picture(page, row.id + '-' + row.index + '-wrong.png');
    for (const s of row.task.steps) {
      await (await openControl(page, '#extra-controls [data-xfield="value"]')).fill(String(s.value));
      await (await openControl(page, '#extra-controls [data-x="r37-step"]')).click();
    }
    const draft = await observe(page, 'corrected-draft');
    ok(Boolean(replayP069ComplexStepsEvidence(row.task, draft.model, row.context)) && !proof(draft), 'needs Check');
    await page.locator('#actions [data-do="check"]').click();
    const good = await observe(page, 'correct-check');
    const accepted = proof(good);
    ok(good.attempts.length === 2 && Boolean(accepted), 'verified');
    await picture(page, row.id + '-' + row.index + '-correct.png');
    ok((await page.reload())?.fromServiceWorker() === true, 'reload');
    await page.waitForFunction(i => window.mathLesson?.snapshot()?.index === i, row.index);
    assert.deepEqual(proof(await observe(page, 'offline-reload')), accepted);
    await page.goto(origin.base + 'v2.html#trail');
    await page.locator('#main [data-do="export"]').first().waitFor();
    const saving = page.waitForEvent('download'); await page.locator('#main [data-do="export"]').first().click();
    const bytes = fs.readFileSync(await (await saving).path());
    fs.writeFileSync(path.join(out, 'native-state-v2.json'), bytes);
    const upload = async (buf, name) => {
      const ch = restorePage.waitForEvent('filechooser'); await restorePage.locator('#main [data-do="import"]').first().click();
      await (await ch).setFiles({name, mimeType: 'application/json', buffer: buf});
      await restorePage.waitForFunction(() => document.querySelector('#import-file')?.value === '');
      return restorePage.locator('#toast').innerText();
    };
    ok((await upload(bytes, 'p069.json')).includes('备份已合并'), 'import');
    const rb = await restorePage.evaluate(() => localStorage.getItem('math-explorer-v2'));
    ok((await upload(bytes, 'p069r.json')).includes('备份已合并'), 'repeat');
    ok(await restorePage.evaluate(() => localStorage.getItem('math-explorer-v2')) === rb, 'idempotent');
    ok(!(await upload(Buffer.from('{'), 'bad.json')).includes('备份已合并'), 'corrupt');
    await restorePage.goto(origin.base + 'learn.html#' + row.id);
    await restorePage.waitForFunction(i => window.mathLesson?.snapshot()?.index === i, row.index);
    assert.deepEqual(proof(await observe(restorePage, 'restored-backup')), accepted);
    await page.goto(origin.base + 'learn.html#' + row.id);
    await page.waitForFunction(i => window.mathLesson?.snapshot()?.index === i, row.index);
    await (await openControl(page, '[data-do="p3-retry"]')).click();
    ok(proof(await observe(page, 'retry')) === null, 'retry');
    ok(errors.length === 0, 'no errors');
    console.log('P069_CHROMIUM_OK ' + JSON.stringify({testedCheckoutSha: sha, chromium: browserVersion, checks: checks.length, captures: observations.length}));
  } finally {
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({schema:'math-p069-complex-steps-browser/1',testedCheckoutSha:sha,originalControls:true,seededLessonPositionOnly:false,chromium:browserVersion,viewport:STANDARD_DESKTOP_VIEWPORT,sources:P069_SOURCES,checks,observations,screenshots,errors},null,2)+'\n');
    await restore?.close().catch(()=>{}); await learner?.close().catch(()=>{}); await browser?.close().catch(()=>{}); await origin?.close().catch(()=>{});
  }
}
run().catch(e => { console.error(e.stack || e); process.exitCode = 1; });
