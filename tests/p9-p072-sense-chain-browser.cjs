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
const out = path.resolve(process.env.MATH_P072_ARTIFACTS || path.join(root, 'verification/p9-p072-sense-chain'));
const entry = name => import(pathToFileURL(path.join(root, name)).href);
const sha = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim();
const checks = [], observations = [], screenshots = [], errors = [];
const ok = (v, label) => { assert.ok(v, label); checks.push(label); };
const ordered = v => Array.isArray(v) ? v.map(ordered) : (v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,ordered(v[k])])) : v);

async function openControl(page, selector) {
  let c = page.locator(selector);
  if (await c.count() === 0 && selector.startsWith('#extra-controls ')) c = page.locator(selector.replace('#extra-controls ', '#extra-visual '));
  assert.equal(await c.count(), 1, 'unique: ' + selector);
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
      if (await inp.evaluate(el => el.tagName) === 'SELECT') await inp.selectOption(String(s.value));
      else await inp.fill(String(s.value));
    } else {
      const sel = '#extra-controls [data-x="' + s.action + '"]' + Object.entries(s.data || {}).map(([k, v]) => '[data-' + k + '="' + v + '"]').join('');
      await (await openControl(page, sel)).click();
    }
  }
}

async function run() {
  fs.mkdirSync(out, {recursive: true});
  const {P072_SOURCES, replayP072SenseChainEvidence, submittedP072SenseChainEvidence} = await entry('dist/learning/p072-sense-chain-evidence.js');
  const {sessionTaskFor} = await entry('dist/learning/bridges.js');
  const b38 = await entry('dist/learning/phase5/b38-model.js');
  const b37 = await entry('dist/learning/phase5/b37-model.js');
  const b30 = await entry('dist/learning/phase5/b30-model.js');
  const cases = P072_SOURCES.map(s => ({source: s, id: s.sessionId, index: s.index, context: {sessionId: s.sessionId, index: s.index}, task: sessionTaskFor(s.sessionId, s.index)}));
  const verified = [];
  let origin, browser, learner, restore, page, restorePage, browserVersion = null, phase = 'startup';
  const proof = (row, snap) => submittedP072SenseChainEvidence(row.task, snap.model, snap.record, row.context);
  async function observe(p, row, stage) {
    const r = await capture(p, out, row.id + '-' + row.index, row, stage);
    observations.push({index: row.index, stage, attempts: r.attempts.length, correct: b38.inspect(row.task, r.model).correct, evidence: Boolean(proof(row, r))});
    return r;
  }
  async function picture(p, n) { await p.screenshot({path: path.join(out, n), fullPage: true}); screenshots.push(n); }
  const solveAny = task => b38.TYPES.has(task.type) ? b38.solveSteps(task) : b37.TYPES.has(task.type) ? b37.solveSteps(task) : b30.solveSteps(task);
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
    await warmAndStop(page, origin, release, ok, 'P072');
    phase = 'native';
    const sid = cases[0].id;
    ok((await page.goto(origin.base + 'learn.html#' + sid))?.fromServiceWorker() === true, sid + ' offline');
    await page.waitForFunction(() => window.mathLesson);
    const start = page.locator('[data-do="start"]'); if (await start.isVisible()) await start.click();
    let cur = 0;
    for (const row of cases) {
      while (cur < row.index) {
        await runSteps(page, solveAny(sessionTaskFor(sid, cur)));
        await page.locator('#actions [data-do="check"]').click();
        await page.locator('#actions [data-do="next"]').click();
        cur++; await page.waitForFunction(i => window.mathLesson?.snapshot()?.index === i, cur);
      }
      const tag = row.id + '-' + row.index;
      ok(createHash('sha256').update(JSON.stringify(ordered(row.task))).digest('hex') === row.source.taskHash, tag + ' hash');
      const decoy = row.task.cards.find(c => !row.task.paths[0].includes(c.id));
      if (decoy) await (await openControl(page, '#extra-controls [data-x="r38-card"][data-index="' + decoy.id + '"]')).click();
      await page.locator('#actions [data-do="check"]').click();
      const wrong = await observe(page, row, 'wrong-check');
      ok(wrong.attempts.length === 1 && !proof(row, wrong), tag + ' wrong rejected');
      await picture(page, tag + '-wrong.png');
      if (decoy) await (await openControl(page, '#extra-controls [data-x="r38-undo"]')).click();
      if (row.task.lines) await (await openControl(page, '#extra-controls [data-x="r38-mark"][data-index="' + row.task.error + '"]')).click();
      for (const cid of row.task.paths[0]) await (await openControl(page, '#extra-controls [data-x="r38-card"][data-index="' + cid + '"]')).click();
      const draft = await observe(page, row, 'corrected-draft');
      ok(Boolean(replayP072SenseChainEvidence(row.task, draft.model, row.context)) && !proof(row, draft), tag + ' needs Check');
      await page.locator('#actions [data-do="check"]').click();
      const good = await observe(page, row, 'correct-check');
      const accepted = proof(row, good);
      ok(good.attempts.length === 2 && Boolean(accepted), tag + ' verified');
      await picture(page, tag + '-correct.png');
      ok((await page.reload())?.fromServiceWorker() === true, tag + ' reload');
      await page.waitForFunction(i => window.mathLesson?.snapshot()?.index === i, row.index);
      assert.deepEqual(proof(row, await observe(page, row, 'offline-reload')), accepted);
      verified.push({row, good, accepted});
      if (row !== cases.at(-1)) {
        await page.locator('#actions [data-do="next"]').click(); cur++;
        await page.waitForFunction(i => window.mathLesson?.snapshot()?.index === i, cur);
      }
    }
    phase = 'backup';
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
    ok((await upload(bytes, 'p072.json')).includes('备份已合并'), 'import');
    const rb = await restorePage.evaluate(() => localStorage.getItem('math-explorer-v2'));
    ok((await upload(bytes, 'p072r.json')).includes('备份已合并'), 'repeat');
    ok(await restorePage.evaluate(() => localStorage.getItem('math-explorer-v2')) === rb, 'idempotent');
    ok(!(await upload(Buffer.from('{'), 'bad.json')).includes('备份已合并'), 'corrupt');
    const last = verified.at(-1);
    await restorePage.goto(origin.base + 'learn.html#' + last.row.id);
    await restorePage.waitForFunction(i => window.mathLesson?.snapshot()?.index === i, last.row.index);
    assert.deepEqual(proof(last.row, await observe(restorePage, last.row, 'restored-backup')), last.accepted);
    await page.goto(origin.base + 'learn.html#' + last.row.id);
    await page.waitForFunction(i => window.mathLesson?.snapshot()?.index === i, last.row.index);
    await (await openControl(page, '[data-do="p3-retry"]')).click();
    ok(proof(last.row, await observe(page, last.row, 'retry')) === null, 'retry');
    ok(errors.length === 0, 'no errors');
    console.log('P072_CHROMIUM_OK ' + JSON.stringify({testedCheckoutSha: sha, chromium: browserVersion, checks: checks.length, captures: observations.length}));
  } finally {
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({schema:'math-p072-sense-chain-browser/1',testedCheckoutSha:sha,originalControls:true,seededLessonPositionOnly:false,chromium:browserVersion,viewport:STANDARD_DESKTOP_VIEWPORT,sources:P072_SOURCES,checks,observations,screenshots,errors},null,2)+'\n');
    await restore?.close().catch(()=>{}); await learner?.close().catch(()=>{}); await browser?.close().catch(()=>{}); await origin?.close().catch(()=>{});
  }
}
run().catch(e => { console.error(e.stack || e); process.exitCode = 1; });
