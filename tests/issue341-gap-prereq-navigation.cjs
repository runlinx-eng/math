'use strict';

// #341 incremental audit: ONLY eight missing navigation prerequisites (P111/P112/P113 here).
// All actions are sent through real native HTML controls; no storage-index edits,
// internal model mutations or reruns of already accepted target mathematics.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {execFileSync} = require('node:child_process');
const {pathToFileURL} = require('node:url');
const {chromium} = require(process.env.MATH_PLAYWRIGHT_MODULE || 'playwright');
const {createOrigin,warmAndStop,capture} = require('./helpers/p9-basic-artifact.cjs');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT} =
  require('./helpers/standard-desktop-viewport.cjs');

const root = path.resolve(__dirname,'..');
const packet = process.env.ISSUE341_GAP_PACKET;
const targets = Object.freeze({
  P111: [{id:'equations35',index:2}],
  P112: [
    {id:'chancecalc',index:1},
    {id:'chancescale',index:1},
    {id:'chancenone',index:1},
    {id:'chancecomplement',index:1}
  ],
  P113: [{id:'tenslarge',index:1},{id:'general34',index:1}]
});
if (!Object.hasOwn(targets,packet)) {
  console.error('ISSUE341_GAP_PACKET must be P111, P112 or P113');
  process.exit(2);
}

const out = path.resolve(process.env.ISSUE341_GAP_ARTIFACTS ||
  path.join(root,'verification/issue341-gap-nav',packet.toLowerCase()));
const head = execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const entry = name => import(pathToFileURL(path.join(root,name)).href);
const checks=[], routes=[], errors=[], prereqs=[], screenshots=[];
let phase = 'startup';

function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value==='object') return Object.fromEntries(
    Object.keys(value).sort((a,b)=>a.localeCompare(b,'en'))
      .map(k=>[k,ordered(value[k])]));
  return value;
}
const fingerprint = task => createHash('sha256')
  .update(JSON.stringify(ordered(task))).digest('hex');
function ok(condition,label) {assert.ok(condition,label);checks.push(label);}

async function control(page,selector) {
  const loc=page.locator(selector);
  assert.equal(await loc.count(),1,'unique original control '+selector);
  for(let n=0;n<10 && !(await loc.isVisible());n++) {
    const closed=loc.locator(
      'xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await closed.count(),1,'one closed ancestor for '+selector);
    await closed.locator(':scope > summary').click();
  }
  ok(await loc.isVisible(),'original visible control '+selector);
  return loc;
}
async function applyNativeStep(page,step) {
  if (Object.hasOwn(step,'field')) {
    const loc=await control(page,'#extra-controls [data-xfield="'+step.field+'"]');
    if (await loc.evaluate(e=>e.tagName.toLowerCase())==='select')
      await loc.selectOption(String(step.value));
    else await loc.fill(String(step.value));
    assert.equal(await loc.inputValue(),String(step.value));
    return;
  }
  assert.equal(typeof step.action,'string','native action');
  const data=step.data||{};
  let suffix='[data-x="'+step.action+'"]';
  if(data.index!==undefined) suffix+='[data-index="'+String(data.index)+'"]';
  if(data.dir!==undefined) suffix+='[data-dir="'+String(data.dir)+'"]';
  const loc=await control(page,
    '#extra-visual '+suffix+', #extra-controls '+suffix);
  ok(await loc.isEnabled(),'original enabled action '+step.action);
  await loc.click();
}
async function snapshot(page) {
  return await page.evaluate(() => {
    const s=window.mathLesson?.snapshot();
    return s&&{id:s.id,index:s.index,view:s.view,
      complete:s.summary?.cases?.[s.index]?.complete===true};
  });
}
async function navigateToLesson(page,origin,id) {
  // A same-document hash transition has no Service Worker network response.
  await page.goto(origin.base+'learn.html#'+id);
  await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,id);
  const s=await snapshot(page);
  ok(s?.id===id&&s?.index===0&&s?.view==='task',
    id+' starts at native initial task, not seeded');
}
async function visitTarget(page,origin,model,taskFor,lessons,intake,target) {
  const {id,index}=target,position=id+':'+index;
  const lock=intake.rows.find(r=>r.position===position && r.packet===packet);
  assert.ok(lock,'frozen #341 original-source intake for '+position);
  phase=position+' initial route';
  await navigateToLesson(page,origin,id);

  // Navigate the COMPLETE original prerequisite chain, never modifying storage.
  for(let i=0;i<index;i++) {
    phase=id+':'+i+' real prerequisite';
    const task=taskFor(id,i);
    ok(model.TYPES.has(task?.type),id+':'+i+' supports native prerequisite '+task?.type);
    const initial=await snapshot(page);
    ok(initial.id===id&&initial.index===i&&initial.view==='task'&&!initial.complete,
      id+':'+i+' is the uncompleted original task');

    const steps=model.solveSteps(task);
    ok(Array.isArray(steps)&&steps.length>0,id+':'+i+' has original-control instructions');
    for(const step of steps) await applyNativeStep(page,step);
    const check=await control(page,'#actions [data-do="check"]');
    ok(await check.isEnabled(),id+':'+i+' original Check is enabled');
    await check.click();
    const record=await capture(page,out,id+'-'+i,{id,index:i},'original-prerequisite-check');
    ok(record.attempts.length===1&&model.inspect(task,record.model).correct,
      id+':'+i+' original grader accepted original control actions');
    const after=await snapshot(page);
    ok(after.id===id&&after.index===i&&after.complete,
      id+':'+i+' original completion is independently visible');
    prereqs.push({
      position:id+':'+i,type:task.type,
      sourceNodeId:lessons[id].topicId,taskSha256:fingerprint(task),
      steps:steps.length,attempts:record.attempts.length,
      originalCheckCorrect:true,afterIndex:after.index,
      rawStorageSaved:true
    });
    const name=id+'-'+i+'-original-prerequisite.png';
    await page.screenshot({path:path.join(out,name)});screenshots.push(name);
    const next=await control(page,'#actions [data-do="next"]');
    ok(await next.isEnabled(),id+':'+i+' native Next is unlocked');
    await next.click();
    await page.waitForFunction(expected=>{
      const s=window.mathLesson?.snapshot();
      return s?.id===expected.id && s?.index===expected.index;
    },{id,index:i+1});
    const moved=await snapshot(page);
    ok(moved.index===i+1,id+':'+i+' Next advances exactly one original task');
  }

  phase=position+' native target arrival';
  const arrived=await snapshot(page);
  ok(arrived?.id===id&&arrived.index===index&&arrived.view==='task',
    position+' reached from native preceding Check/Next, no seeding');
  const original=taskFor(id,index);
  ok(lessons[id].topicId===lock.nodeId && fingerprint(original)===lock.taskSha256,
    position+' frozen original nodeId and full task hash');
  const before=await capture(page,out,id+'-'+index,{id,index},'original-arrival');
  const image=id+'-'+index+'-native-next-arrival.png';
  await page.screenshot({path:path.join(out,image)});screenshots.push(image);
  const offline=await page.reload();
  ok(offline?.fromServiceWorker()===true,
    position+' HTTP source stopped, real SW offline reload');
  await page.waitForFunction(expected=>{
    const s=window.mathLesson?.snapshot();
    return s?.id===expected.id && s?.index===expected.index;
  },{id,index});
  const after=await capture(page,out,id+'-'+index,{id,index},'offline-arrival');
  assert.deepEqual(after.model,before.model);
  assert.deepEqual(after.record,before.record);
  routes.push({position,method:'native-next-after-correct-check',
    startingIndex:index-1,previousTaskComplete:true,
    prerequisitePositions:Array.from({length:index},(_,i)=>id+':'+i),
    originalTargetNodeId:lock.nodeId,originalTargetTaskSha256:lock.taskSha256,
    stoppedOriginSWReload:true});
}

async function run() {
  fs.mkdirSync(out,{recursive:true});
  const [bridge,catalog,math]=await Promise.all([
    entry('dist/learning/bridges.js'),
    entry('dist/learning/catalog.js'),
    entry(packet==='P111'?'dist/learning/phase5/b35-model.js':
      packet==='P112'?'dist/learning/phase5/b22-model.js':
        'dist/learning/phase5/b11-model.js')
  ]);
  const intake=JSON.parse(fs.readFileSync(path.join(root,
    'docs/math-parallel/issue-341-formal-365/issue-341-formal-365-intake.json'),'utf8'));
  let origin,browser,context,page,chromiumVersion=null;
  try {
    origin=await createOrigin(root);
    browser=await chromium.launch({headless:true,
      args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
      ...(process.env.MATH_CHROMIUM_EXECUTABLE?
        {executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
    chromiumVersion=browser.version();
    context=await newDesktopContext(browser,{
      reducedMotion:'reduce',serviceWorkers:'allow',acceptDownloads:true});
    page=await context.newPage();
    page.setDefaultTimeout(15000);
    page.on('pageerror',e=>errors.push(phase+': '+e.message));
    context.on('request',req=>{
      if(/^https?:/.test(req.url())&&!req.url().startsWith(origin.base))
        errors.push('non-local request: '+req.url());
    });
    const release=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8')
      .match(/const CACHE = '([^']+)'/)[1];
    await page.goto(origin.base+'v2.html#trail');
    await page.locator('#main [data-do="export"]').first().waitFor();
    await warmAndStop(page,origin,release,ok,packet+' gap-only');
    for(const target of targets[packet])
      await visitTarget(page,origin,math,bridge.sessionTaskFor,
        catalog.LESSONS,intake,target);
    ok(routes.length===targets[packet].length,
      packet+' all previously missing positions proved');
    ok(errors.length===0,packet+' no page errors or network escapes');
    console.log('ISSUE341_GAP_NATIVE_NEXT_OK '+JSON.stringify({
      packet,head,chromium:chromiumVersion,positions:routes.length,
      prerequisites:prereqs.length,checks:checks.length
    }));
  } catch(err) {
    errors.push(phase+': '+(err.stack||err));
    await page?.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
    throw err;
  } finally {
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
      schema:'issue-341-targeted-native-prerequisites/1',
      packet,head,originalControls:true,
      storageIndexWrites:0,derivedFromNativeDemoSteps:true,
      viewport:STANDARD_DESKTOP_VIEWPORT,chromium:chromiumVersion,
      routes,prereqs,checks,screenshots,errors
    },null,2)+'\n');
    await context?.close().catch(()=>{});
    await browser?.close().catch(()=>{});
    await origin?.close().catch(()=>{});
  }
}
run().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
