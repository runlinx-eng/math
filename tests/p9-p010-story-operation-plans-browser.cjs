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
const out = path.resolve(process.env.MATH_P010_ARTIFACTS || path.join(root, 'verification/p9-p010-story-operation-plans'));
const entry = name => import(pathToFileURL(path.join(root, name)).href);
const sha = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim();
const checks = [], observations = [], screenshots = [], errors = [];
const ok = (v, l) => { assert.ok(v, l); checks.push(l); };
const ordered = v => Array.isArray(v) ? v.map(ordered) : (v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,ordered(v[k])])) : v);

async function openControl(page, sel) {
  let c = page.locator(sel);
  if (!(await c.count())) c = page.locator(sel.replace('#extra-controls ', '#extra-visual '));
  assert.equal(await c.count(), 1, 'unique: ' + sel);
  for (let i = 0; i < 8 && !(await c.isVisible()); i++) {
    const cl = c.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await cl.count(), 1); await cl.locator(':scope > summary').click();
  }
  return c;
}
async function placeRange(input, target) {
  const start = Number(await input.inputValue());
  const step = Number(await input.getAttribute('step'));
  const min = Number(await input.getAttribute('min'));
  const max = Number(await input.getAttribute('max'));
  assert.ok(target >= min && target <= max && (target-min)%step === 0);
  let current = start;
  if (target === current) {
    await input.press(target === max ? 'ArrowLeft' : 'ArrowRight');
    current = Number(await input.inputValue());
  }
  while (Math.abs(target-current) > Math.max(2*step,(max-min)/10)) {
    await input.press(target > current ? 'PageUp' : 'PageDown');
    const next = Number(await input.inputValue());
    if (next === current || Math.abs(target-next) >= Math.abs(target-current)) {
      current = next;
      break;
    }
    current = next;
  }
  while (current !== target) {
    const key = target > current ? 'ArrowRight' : 'ArrowLeft';
    await input.press(key);
    const next = Number(await input.inputValue());
    assert.equal(next,current+(key==='ArrowRight'?step:-step));
    current = next;
  }
}

async function runSteps(page, steps) {
  for (const s of steps) {
    if (s.field) {
      const inp = await openControl(page, '#extra-controls [data-xfield="' + s.field + '"]');
      if (await inp.getAttribute('type') === 'range') await placeRange(inp,Number(s.value));
      else if (await inp.evaluate(el => el.tagName) === 'SELECT') await inp.selectOption(String(s.value));
      else await inp.fill(String(s.value));
    } else {
      const sel = '#extra-controls [data-x="' + s.action + '"]' +
        Object.entries(s.data || {}).map(([key,value]) => '[data-' + key + '="' + value + '"]').join('');
      await (await openControl(page, sel)).click();
    }
  }
}
async function run() {
  fs.mkdirSync(out, {recursive: true});
  const {P010_SOURCES, replayP010StoryOperationPlansEvidence, submittedP010StoryOperationPlansEvidence} = await entry('dist/learning/p010-story-operation-plans-evidence.js');
  const {sessionTaskFor} = await entry('dist/learning/bridges.js');
  const b12 = await entry('dist/learning/phase5/b12-model.js');
  const b15 = await entry('dist/learning/phase5/b15-model.js');
  const b14 = await entry('dist/learning/phase5/b14-model.js');
  const b35 = await entry('dist/learning/phase5/b35-model.js');
  const b33 = await entry('dist/learning/phase5/b33-model.js');
  const b17 = await entry('dist/learning/phase5/b17-model.js');
  const modelFor = task => [b12, b15, b14, b35, b33, b17].find(model => model.TYPES.has(task.type));
const equalNumbers = task => task.type==='x-storychain' && task.values.join(',')==='2,2,3';
const wrongSteps=(task,model)=>model.solveSteps(task).map(step=>{
  if (equalNumbers(task)) return step.field==='operator' && step.value==='*' ? {...step,value:'+'} : step;
  return step.field==='answer' ? {...step,value:'0'} : step;
});
const correctSteps=(task,model)=>equalNumbers(task)
  ? [{action:'b15-back'},{action:'b15-back'},...model.solveSteps(task)]
  : model.solveSteps(task).filter(step=>step.field==='answer');

const joinStory = task => {
  const answer = task.a + (task.op==='+' ? task.b : -task.b);
  const counter = group => ({action:'story-counter',data:{group,delta:1}});
  return [
    ...Array.from({length:task.a},()=>counter('left')),
    ...Array.from({length:task.b},()=>counter('right')),
    {field:'op',value:task.op}, {field:'guess',value:answer}, {action:'story-do'},
    {field:'equation',value:task.balance ? `${task.a}+${task.b}=${task.balance[0]}+${task.balance[1]}` : `${task.a}${task.op}${task.b}=${answer}`},
    ...(task.swap ? [{action:'story-swap'},{field:'otherEquation',value:`${task.b}+${task.a}=${answer}`},{field:'shortage',value:'not-enough'}] : []),
  ];
};

  const cases = P010_SOURCES.map(s => ({source: s, id: s.sessionId, index: s.index, context: {sessionId: s.sessionId, index: s.index}, task: sessionTaskFor(s.sessionId, s.index)}));
  const verified = [];
  let origin, browser, learner, restore, page, restorePage, browserVersion = null;
  const proof = (row, snap) => submittedP010StoryOperationPlansEvidence(row.task, snap.model, snap.record, row.context);
  async function observe(p, row, stage) {
    const r = await capture(p, out, row.id + '-' + row.index, row, stage);
    observations.push({index: row.index, stage, attempts: r.attempts.length, correct: modelFor(row.task).inspect(row.task, r.model).correct, evidence: Boolean(proof(row, r))});
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
    await warmAndStop(page, origin, release, ok, 'P010');
    let lastSid = null, cur = 0;
    for (const row of cases) {
      if (row.id !== lastSid) {
        if (lastSid) await page.goto(origin.base + 'v2.html#trail');
        ok((await page.goto(origin.base + 'learn.html#' + row.id))?.fromServiceWorker() === true, row.id + ' offline');
        await page.waitForFunction(() => window.mathLesson);
        const start = page.locator('[data-do="start"]'); if (await start.isVisible()) await start.click();
        lastSid = row.id; cur = 0;
      }
      while (cur < row.index) {
        const prior=sessionTaskFor(row.id,cur);
        await runSteps(page,prior.type==='x-joinstory' ? joinStory(prior) : modelFor(prior).solveSteps(prior));
        await page.locator('#actions [data-do="check"]').click();
        await page.locator('#actions [data-do="next"]').click();
        cur++; await page.waitForFunction(i => window.mathLesson?.snapshot()?.index === i, cur);
      }
      const tag = row.id + '-' + row.index;
      ok(createHash('sha256').update(JSON.stringify(ordered(row.task))).digest('hex') === row.source.taskHash, tag + ' hash');
      await runSteps(page,wrongSteps(row.task,modelFor(row.task)));
      await page.locator('#actions [data-do="check"]').click();
      const wrong=await observe(page,row,'wrong-check');
      ok(wrong.attempts.length===1 && !modelFor(row.task).inspect(row.task,wrong.model).correct && !proof(row,wrong),
        'the incorrect first step fails the original Check');
      await picture(page,tag+'-wrong.png');
      await runSteps(page,correctSteps(row.task,modelFor(row.task)));
      const draft=await observe(page,row,'corrected-draft');
      const replayed=replayP010StoryOperationPlansEvidence(row.task,draft.model,row.context);
      ok(Boolean(replayed) && !proof(row,draft),'correction awaits a fresh Check');
      await page.locator('#actions [data-do="check"]').click();
      const good=await observe(page,row,'correct-check');
      const accepted=proof(row,good);
      ok(good.attempts.length===2 && (Boolean(accepted)),'new Check preserves all steps');
      await picture(page, tag + '-correct.png');
      ok((await page.reload())?.fromServiceWorker() === true, tag + ' reload');
      await page.waitForFunction(i => window.mathLesson?.snapshot()?.index === i, row.index);
      assert.deepEqual(proof(row, await observe(page, row, 'offline-reload')), accepted);
      verified.push({row, good, accepted});
      const next = cases[cases.indexOf(row) + 1];
      if (next && next.id === row.id) {
        await page.locator('#actions [data-do="next"]').click(); cur++;
        await page.waitForFunction(i => window.mathLesson?.snapshot()?.index === i, cur);
      }
    }
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
    ok((await upload(bytes, 'p010.json')).includes('备份已合并'), 'import');
    const rb = await restorePage.evaluate(() => localStorage.getItem('math-explorer-v2'));
    ok((await upload(bytes, 'p010r.json')).includes('备份已合并'), 'repeat');
    ok(await restorePage.evaluate(() => localStorage.getItem('math-explorer-v2')) === rb, 'idempotent');
    ok(!(await upload(Buffer.from('{'), 'bad.json')).includes('备份已合并'), 'corrupt');
    ok(await restorePage.evaluate(() => localStorage.getItem('math-explorer-v2')) === rb,
      'corrupt import preserves exact bytes');
    const last = verified.at(-1);
    await restorePage.goto(origin.base + 'learn.html#' + last.row.id);
    await restorePage.waitForFunction(i => window.mathLesson?.snapshot()?.index === i, last.row.index);
    for (const {row, good, accepted} of verified) {
      const stage = row.index === last.row.index ? 'restored-backup' : 'restored-storage';
      const imported = await observe(restorePage, row, stage);
      assert.deepEqual(imported.record, good.record);
      assert.deepEqual(proof(row, imported), accepted);
      checks.push(row.index + ' imported history and rechecked proof match');
    }
    await page.goto(origin.base + 'learn.html#' + last.row.id);
    await page.waitForFunction(i => window.mathLesson?.snapshot()?.index === i, last.row.index);
    await (await openControl(page, '[data-do="p3-retry"]')).click();
    ok(proof(last.row, await observe(page, last.row, 'retry')) === null, 'retry');
    ok(errors.length === 0, 'no errors');
    console.log('P010_CHROMIUM_OK ' + JSON.stringify({testedCheckoutSha: sha, chromium: browserVersion, checks: checks.length, captures: observations.length}));
  } finally {
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({schema:'math-p010-story-operation-plans-browser/1',testedCheckoutSha:sha,originalControls:true,seededLessonPositionOnly:false,chromium:browserVersion,viewport:STANDARD_DESKTOP_VIEWPORT,sources:P010_SOURCES,checks,observations,screenshots,errors},null,2)+'\n');
    await restore?.close().catch(()=>{}); await learner?.close().catch(()=>{}); await browser?.close().catch(()=>{}); await origin?.close().catch(()=>{});
  }
}
run().catch(e => { console.error(e.stack || e); process.exitCode = 1; });
