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
const out = path.resolve(process.env.MATH_P009C_ARTIFACTS || path.join(root, 'verification/p9-p009c-three-group-pairings'));
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
async function runSteps(page, steps) {
  for (const s of steps) {
    if (s.field) {
      const inp = await openControl(page, '#extra-controls [data-xfield="' + s.field + '"]');
      if (await inp.evaluate(el => el.tagName) === 'SELECT') await inp.selectOption(String(s.value));
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
  const {P009C_SOURCES, replayP009CThreeGroupPairingsEvidence, submittedP009CThreeGroupPairingsEvidence} = await entry('dist/learning/p009c-three-group-pairings-evidence.js');
  const {sessionTaskFor} = await entry('dist/learning/bridges.js');
  const b10 = await entry('dist/learning/phase5/b10-model.js');

const field=(field,value)=>({field,value:String(value)});
const act=(action,data)=>({action,data});
function tenSteps(task) {
  const add=task.op==='+';
  const head=add?10-task.a:task.a-10;
  const answer=task.a+(add?task.b:-task.b);
  const token=index=>act('ten-token',{index});
  return [field('guess',answer),act('ten-predict'),
    ...Array.from({length:head},(_,i)=>token(add?i:10+i)),act('ten-landmark'),
    ...Array.from({length:task.b-head},(_,i)=>token(add?i+head:i)),act('ten-finish'),
    field('firstPart',head),field('secondPart',task.b-head),field('equation',`${task.a}${task.op}${task.b}=${answer}`)];
}
function familySteps(task) {
  return b10.MODES.flatMap(mode=>{
    const [a,b,op]=b10.familyNumbers(task,mode);
    return [act('family-mode',{mode}),field('equation',`${a}${op}${b}=${a+(op==='+'?b:-b)}`),act('family-save')];
  });
}
function legacySteps(task) {
  if (task.type==='x-tenbridge') return tenSteps(task);
  if (task.type==='x-factfamily') return familySteps(task);
  if (task.type==='x-joinstory') {
    const answer=task.a+(task.op==='+'?task.b:-task.b);
    return [...Array.from({length:task.a},()=>act('story-counter',{group:'left',delta:1})),
      ...Array.from({length:task.b},()=>act('story-counter',{group:'right',delta:1})),
      field('op',task.op),field('guess',answer),act('story-do'),field('equation',`${task.a}${task.op}${task.b}=${answer}`)];
  }
  if (task.type==='x-splitbench') {
    let count=0;
    const steps=[];
    for (const [a,b] of task.pairs) {
      while (count>a) steps.push(act('split-token',{index:--count}));
      while (count<a) steps.push(act('split-token',{index:count++}));
      steps.push(field('equation',`${a}+${b}=${task.total}`),act('split-save'));
    }
    return steps;
  }
  throw new Error('Unexpected prerequisite: '+task.type);
}

const total=task=>task.values.reduce((a,b)=>a+b,0);
const pairSteps=(task,pair)=>[
  ...pair.map(index=>act('triple-pick',{index})),act('triple-merge'),
  field('sub',task.values[pair[0]]+task.values[pair[1]]),field('total',total(task)),act('triple-save'),
];
const wrongSteps=task=>pairSteps(task,[0,1]).map(step=>step.field==='total'?field('total','0'):step);
const correctSteps=task=>{
  const choices=[[1,2],[0,2]];
  const useful=pair=>task.values[pair[0]]+task.values[pair[1]]===10||task.values[pair[0]]===task.values[pair[1]];
  const second=task.useful&&!useful([0,1])?choices.find(useful):choices[0];
  return [field('total',total(task)),act('triple-save'),...pairSteps(task,second)];
};

  const cases = P009C_SOURCES.map(s => ({source: s, id: s.sessionId, index: s.index, context: {sessionId: s.sessionId, index: s.index}, task: sessionTaskFor(s.sessionId, s.index)}));
  const verified = [];
  let origin, browser, learner, restore, page, restorePage, browserVersion = null;
  const proof = (row, snap) => submittedP009CThreeGroupPairingsEvidence(row.task, snap.model, snap.record, row.context);
  async function observe(p, row, stage) {
    const r = await capture(p, out, row.id + '-' + row.index, row, stage);
    observations.push({index: row.index, stage, attempts: r.attempts.length, correct: b10.inspect(row.task, r.model).correct, evidence: Boolean(proof(row, r))});
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
    await warmAndStop(page, origin, release, ok, 'P009C');
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
        await runSteps(page,[b10].find(model => model.TYPES.has(prior.type))=== b10 ? legacySteps(prior) : [].find(model => model.TYPES.has(prior.type)).solveSteps(prior));
        await page.locator('#actions [data-do="check"]').click();
        await page.locator('#actions [data-do="next"]').click();
        cur++; await page.waitForFunction(i => window.mathLesson?.snapshot()?.index === i, cur);
      }
      const tag = row.id + '-' + row.index;
      ok(createHash('sha256').update(JSON.stringify(ordered(row.task))).digest('hex') === row.source.taskHash, tag + ' hash');
      await runSteps(page,wrongSteps(row.task));
      await page.locator('#actions [data-do="check"]').click();
      const wrong=await observe(page,row,'wrong-check');
      ok(wrong.attempts.length===1 && !b10.inspect(row.task,wrong.model).correct && !proof(row,wrong),
        'the incorrect first step fails the original Check');
      await picture(page,tag+'-wrong.png');
      await runSteps(page,correctSteps(row.task));
      const draft=await observe(page,row,'corrected-draft');
      const replayed=replayP009CThreeGroupPairingsEvidence(row.task,draft.model,row.context);
      ok(Boolean(replayed) && !proof(row,draft),'correction awaits a fresh Check');
      await page.locator('#actions [data-do="check"]').click();
      const good=await observe(page,row,'correct-check');
      const accepted=proof(row,good);
      ok(good.attempts.length===2 && Boolean(accepted),'new Check preserves all steps');
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
    ok((await upload(bytes, 'p009c.json')).includes('备份已合并'), 'import');
    const rb = await restorePage.evaluate(() => localStorage.getItem('math-explorer-v2'));
    ok((await upload(bytes, 'p009cr.json')).includes('备份已合并'), 'repeat');
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
    console.log('P009C_CHROMIUM_OK ' + JSON.stringify({testedCheckoutSha: sha, chromium: browserVersion, checks: checks.length, captures: observations.length}));
  } finally {
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({schema:'math-p009c-three-group-pairings-browser/1',testedCheckoutSha:sha,originalControls:true,seededLessonPositionOnly:false,chromium:browserVersion,viewport:STANDARD_DESKTOP_VIEWPORT,sources:P009C_SOURCES,checks,observations,screenshots,errors},null,2)+'\n');
    await restore?.close().catch(()=>{}); await learner?.close().catch(()=>{}); await browser?.close().catch(()=>{}); await origin?.close().catch(()=>{});
  }
}
run().catch(e => { console.error(e.stack || e); process.exitCode = 1; });
