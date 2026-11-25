// Fixed arithmetic below is a set of visible-control instructions, never a
// native-model or position seed. The browser entry point is below the pure
// route exports so independent reviews can drive the original State and UI.
const fixture=require('./fixtures/p9-cubefraction-cases.cjs');
const navigationFixture=require('./fixtures/p9-cubefraction-navigation.cjs');
function orderedCubeFractionTargets(){
 const selected=[...fixture.cases.map(c=>({...c,role:'native'})),...fixture.associated.map(c=>({...c,role:'associated'})),...fixture.excluded.map(c=>({...c,role:'excluded'}))];
 return[...new Set(selected.map(c=>c.id))].flatMap(id=>selected.filter(c=>c.id===id).sort((a,b)=>a.index-b.index));
}
const planFields=spec=>Object.entries({perLayer:spec.math.perLayer,layers:spec.math.layers,total:spec.math.total}).map(([field,value])=>({field,value:String(value)}));
const partFields=spec=>[{field:'oneCube',value:spec.math.oneCube},{field:'base',value:spec.math.base}];
function cubeFractionOperationPlan(spec,model){
 if(spec.type==='x-m31-product')return spec.plan.map(step=>({...step}));
 const b=model.board,steps=[];
 for(let index=0;index<spec.math.total;index++)if(!b.filled.includes(index))steps.push({action:'m31-fill',data:{index:String(index)}});
 if(!b.opened)steps.push({action:'m31-spread'});
 if(!b.turned)steps.push({action:'turn-extra'});
 if(!b.plan)steps.push(...planFields(spec),{action:'m31-plan'});
 if(!b.part)steps.push(...partFields(spec),{action:'m31-part'});
 steps.push({field:'volume',value:spec.math.volume},{field:'product',value:spec.math.volume},{field:'unit',value:spec.math.unit});return steps;
}
const cubeFractionBoundaryKindsFor=spec=>spec.id!=='fractionvolume'?[]:spec.index===0?['blank-saves','exact-spellings','unit-choices','history-limit']:spec.index<3?['exact-spellings']:[];
async function fillAll(spec,{action,model}){const filled=(await model()).board.filled;for(let index=0;index<spec.math.total;index++)if(!filled.includes(index))await action('m31-fill',{index:String(index)});}
async function savePlan(spec,{field,action}){for(const step of planFields(spec))await field(step.field,step.value);await action('m31-plan');}
async function savePart(spec,{field,action}){for(const step of partFields(spec))await field(step.field,step.value);await action('m31-part');}
async function cubeFractionNativeFlow(spec,api){
 const{field,action,solve,check,capture,retry,model,checkpoint,assert}=api,phases=[];
 await fillAll(spec,api);await checkpoint('filled-before-opening',phases);await savePlan(spec,api);
 phases.push(await check(false,false,'first-plan-before-opening'));
 assert((await model()).board.first.plan.total===String(spec.math.total)&&(await model()).board.bad,'a visible unopened-plan failure retains its actual first fields');
 await action('m31-spread');await checkpoint('opened',phases);await action('turn-extra');await checkpoint('turned',phases);await savePlan(spec,api);
 await field('oneCube',spec.math.edge);await field('base',spec.math.base);await action('m31-part');
 phases.push(await check(false,false,'edge-is-not-cube-volume'));
 await savePart(spec,api);await field('volume','999');await field('product',spec.math.volume);await field('unit',spec.math.unit);
 phases.push(await check(false,false,'wrong-current-volume'));
 await field('volume',spec.math.volume);await field('prose','按原来的小块和层数核对；先前未通过的记录保留。');
 phases.push(await capture('correct-unsubmitted',false));await checkpoint('correct-unsubmitted',phases);
 phases.push(await check(true,true,'corrected'));await checkpoint('corrected',phases);
 assert(phases.at(-1).proof.construction.failedPlans===1&&phases.at(-1).proof.construction.failedParts===1,'both actual first failures remain in the strict proof');
 phases.push(await check(true,true,'repeated-check'));
 await field('prose','这是新写的原话，不把文字自动判成解释正确。');phases.push(await capture('unsubmitted-prose',false));await checkpoint('modified-prose',phases);
 phases.push(await check(true,true,'prose-rechecked'));
 await action('m31-spread');phases.push(await capture('unsubmitted-closed-layers',false));await checkpoint('closed-unsubmitted',phases);
 phases.push(await check(true,true,'closed-layers-rechecked'));assert(phases.at(-1).proof.construction.currentlySpread===false,'previous opening is distinct from the currently closed layers');
 const beforeRemove=await model();await action('m31-remove');phases.push(await check(false,false,'saved-work-taken-back'));
 assert((await model()).board.plan===null&&(await model()).board.part===null,'taking a cell back invalidates both saved quantities');
 assert(JSON.stringify((await model()).board.first)===JSON.stringify(beforeRemove.board.first),'taking a cell back retains the first plan and part');
 await solve();phases.push(await check(true,true,'taken-back-cell-rebuilt'));
 await retry('native');phases.push(await capture('shared-retry',false));await checkpoint('shared-retry',phases);
 await solve();phases.push(await check(true,true,'retry-corrected'));await checkpoint('final',phases);return phases;
}
async function cubeFractionBoundaryFlow(kind,spec,api){
 const{field,action,solve,check,capture,model,assert}=api,phases=[];
 if(kind==='blank-saves'){
  await action('m31-remove');phases.push(await capture('empty-remove-recorded',false));
  assert((await model()).history.length===1&&(await model()).board.filled.length===0,'visible remove on empty space is a recorded no-op');
  await fillAll(spec,api);await action('m31-spread');await action('turn-extra');await action('m31-plan');
  phases.push(await check(false,false,'blank-plan'));
  await savePlan(spec,api);await action('m31-part');phases.push(await check(false,false,'blank-part'));
  await solve();phases.push(await check(true,true,'blank-saves-corrected'));
  const p=phases.at(-1).proof.construction;assert(p.emptyRemovals===1&&p.first.plan.total===''&&p.first.part.oneCube===''&&p.failedPlans===1&&p.failedParts===1,'empty fields and both failed saves are not replaced by later correct fields');
 }else if(kind==='exact-spellings'){
  await solve();const pairs=[['1.00000000','+1'],['3 3/4','3.75'],['0 1/4','2/8']],pair=pairs[spec.index];
  await field('volume',pair[0]);await field('product',pair[1]);phases.push(await check(true,true,'exact-equivalent-spellings'));
  assert(phases.at(-1).proof.submittedValues[0].raw===pair[0]&&phases.at(-1).proof.submittedValues[1].raw===pair[1],'raw equivalent fractions and decimals are retained');
  await field('volume','1e0');phases.push(await check(false,false,'unsupported-scientific-spelling'));
  await field('volume',pair[0]);phases.push(await check(true,true,'exact-spelling-restored'));
 }else if(kind==='unit-choices'){
  await solve();for(const[value,phase]of[['cm²','square-unit'],['ft³','foreign-cubic-unit'],['','empty-unit']]){await field('unit',value);phases.push(await check(false,false,phase));}
  await field('unit',spec.math.unit);phases.push(await check(true,true,'source-cubic-unit-restored'));
 }else if(kind==='history-limit'){
  await solve();phases.push(await check(true,true,'before-history-cap'));
  const count=(await model()).history.length;for(let i=count;i<1200;i++)await action('m31-spread');
  phases.push(await check(true,true,'at-history-cap'));const before=await model();
  for(const[name,phase]of[['m31-remove','unrecorded-remove'],['m31-spread','unrecorded-spread'],['turn-extra','unrecorded-turn']]){
   await action(name);assert(JSON.stringify(await model())===JSON.stringify(before),'the original 1200-event ceiling leaves the whole model unchanged');
   phases.push(await capture(phase,true));assert(phases.at(-1).proof.eventCount===1200,'no event is invented for the capped request');
  }
  await field('prose','历史达到上限之后，原输入栏仍可修改；没有把未记录的点击补进过程。');phases.push(await capture('cap-prose-unsubmitted',false));
  await field('volume','0');phases.push(await check(false,false,'cap-current-volume-wrong'));
  await field('volume',spec.math.volume);phases.push(await check(true,true,'cap-current-volume-corrected'));
 }else throw Error('Unknown cubefraction boundary '+kind);
 return phases;
}
module.exports={orderedCubeFractionTargets,cubeFractionOperationPlan,cubeFractionBoundaryKindsFor,cubeFractionNativeFlow,cubeFractionBoundaryFlow};

async function main(){
 const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),assert=require('node:assert/strict');
 const {execFileSync}=require('node:child_process'),{chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
 const {observeBrowserDiagnostics}=require('./helpers/p9-browser-diagnostics.cjs');
 const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-cubefraction-adapter');fs.mkdirSync(out,{recursive:true});
 const {cases,associated,practice,excluded}=fixture,targets=orderedCubeFractionTargets(),viewports=[[1440,900],[1280,720]];
 const checks=[],errors=[],remote=[],observations=[],isolated=[],boundaries=[],forgeries=[],backups=[],offline=[],preparations=[],retries=[],navigations=[],checkedLedger=[],captures=[],visuals=[];
 const cp=structuredClone,digest=value=>crypto.createHash('sha256').update(value).digest('hex');
 const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])):value;
 const hash=value=>digest(JSON.stringify(stable(value))),ok=(value,message,detail={})=>{assert.ok(value,message);checks.push({message,...detail});};
 const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
 const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
 const sourceFiles=['dist/learning/cubefraction-evidence.js','dist/learning/thinking-feedback.js','dist/learning/evidence-adapters.js','dist/exploration-core.js','tests/p9-cubefraction-adapter-browser.cjs','tests/fixtures/p9-cubefraction-cases.cjs','tests/fixtures/p9-cubefraction-navigation.cjs',...Object.keys({...fixture.sourceHashes,...navigationFixture.sourceHashes})];
 const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,githubSha:process.env.GITHUB_SHA||null,runId:process.env.GITHUB_RUN_ID||null,runAttempt:process.env.GITHUB_RUN_ATTEMPT||null,
  workflow:process.env.GITHUB_WORKFLOW||null,workingTreeDirty:!!execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim(),nodeVersion:process.version,cache,
  sourceFiles:Object.fromEntries(sourceFiles.map(file=>[file,digest(fs.readFileSync(path.join(root,file)))])),childTrial:false,independentTeachingReview:false,seededCorrectWork:false,seededLessonPositions:false,
  syntheticCompatibilityFixturesAreChildRecords:false,nativeBackupImportsCompleted:0,compatibilityImportsCompleted:0,corruptImportsRejected:0};
 const {ensureB39Ready}=await import('../dist/learning/phase4/async-batches.js');await ensureB39Ready();
 const {sessionTaskFor,BRIDGES}=await import('../dist/learning/bridges.js'),M=await import('../dist/learning/phase5/b31-model.js');
 const Tasks=await import('../dist/learning/tasks.js'),Engine=await import('../dist/learning/phase4/engine.js'),{setField}=await import('../dist/learning/phase4/ui.js');
 const {thinkingFeedback}=await import('../dist/learning/thinking-feedback.js');
 const State=await import('../dist/learning/state.js'),Core=await import('../dist/exploration-core.js'),{studyActionFocus}=await import('../dist/learning/workspace-flow.js');
 const {cubeFractionBinding:binding,replayCubeFractionEvidence:replay}=await import('../dist/learning/cubefraction-evidence.js'),atlas=JSON.parse(fs.readFileSync(path.join(root,'dist/data/atlas.json'),'utf8'));
 const taskFor=c=>sessionTaskFor(c.id,c.index),ctx=c=>({sessionId:c.id,index:c.index}),originalState=value=>{assert.deepEqual(Core.validate(value,atlas),value);return value;};
 const lessonFrom=(value,c)=>Object.hasOwn(BRIDGES,c.id)?value.daily.bridges[c.id]:value.lessons[c.id];
 const {createExcludedFeedbackAudit}=require('./helpers/p9-area-time-excluded-feedback.cjs');
 const approvedOther=require('./fixtures/p9-regression-cross-family-boundaries.cjs').cubefraction;
 const isOther=c=>approvedOther.some(row=>row.sessionId===c.id&&row.index===c.index);
 const auditOther=await createExcludedFeedbackAudit('cubefraction',[...excluded,...navigationFixture.navigation],taskFor,approvedOther);
 for(const c of[...cases,...associated,...practice,...excluded])assert.equal(hash(taskFor(c)),c.taskHash);
 for(const c of navigationFixture.navigation){assert.deepEqual(taskFor(c),c.task);assert.equal(hash(taskFor(c)),c.taskHash);}
 for(const[file,sha]of Object.entries({...fixture.sourceHashes,...navigationFixture.sourceHashes}))assert.equal(digest(fs.readFileSync(path.join(root,file))),sha,file);
 const artifactPaths=new Set(),uniqueFile=name=>{assert.ok(!artifactPaths.has(name),'one immutable raw artifact: '+name);artifactPaths.add(name);return path.join(out,name);};
 fs.writeFileSync(uniqueFile('fixed-source-cases.json'),JSON.stringify(fixture,null,2));fs.writeFileSync(uniqueFile('fixed-navigation.json'),JSON.stringify(navigationFixture,null,2));
 let browser,server,activePage,label='setup';const openContexts=new Set(),diagnostics=new Map();
 const report=()=>({provenance,viewports,checks,errors,remote,observations,isolated,boundaries,forgeries,backups,offline,preparations,retries,navigations,checkedLedger,captures,visuals,
  nativeTasks:6,nativeNodes:4,associatedTasks:4,excludedTasks:1,practiceCompatibilityPositions:2,targets:11,sessions:8,childTrial:false,independentTeachingReview:false});
 try{
  browser=await chromium.launch({headless:true,...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});provenance.browserVersion=browser.version();
  for(const[width,height]of viewports){
   const prefix=width+'x'+height;label=prefix+'-cache';
   const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
   server=http.createServer((req,res)=>{const rel=new URL(req.url,'http://localhost').pathname.replace(/^\/+/, '')||'index.html';fs.readFile(path.join(root,'dist',rel),(error,data)=>{res.writeHead(error?404:200,{'Content-Type':mime[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store'});res.end(error?'missing':data);});});
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port+'/';
   const profiles=[];
   for(const role of['source','native-restore-target','constructed-compatibility']){
    const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',acceptDownloads:true,serviceWorkers:'allow'});openContexts.add(context);
    context.on('request',request=>{if(/^https?:/.test(request.url())&&!request.url().startsWith(base))remote.push(request.url());});
    const page=await context.newPage();page.setDefaultTimeout(20000);page.on('pageerror',error=>errors.push({label,role,error:String(error)}));diagnostics.set(page,observeBrowserDiagnostics(page,{out,base,label:()=>label}));profiles.push({role,context,page});
   }
   const[sourceProfile,restoreProfile,compatibilityProfile]=profiles,restorePage=restoreProfile.page;
   let page=sourceProfile.page,contextRole='source';activePage=page;let guide=page.locator('#thinking-guide'),hint=page.locator('#thinking-feedback');
   const read=target=>target.evaluate(async()=>{const{readStored}=await import('./storage.js');return{raw:localStorage.getItem('math-explorer-v2'),text:readStored('math-explorer-v2')};});
   const state=async(target=page)=>JSON.parse((await read(target)).text);
   const current=async c=>{const lesson=lessonFrom(await state(),c);return{lesson,model:lesson.models[c.index],record:lesson.cases[c.index]||null};};
   const model=async c=>(await current(c)).model;
   const wait=(c,target=page)=>target.waitForFunction(({id,index})=>{const s=window.mathLesson?.snapshot();return s?.id===id&&s.index===index&&s.view==='task';},c);
   const keepRecords=(before,after)=>{
    for(const[left,right]of[[before.lessons,after.lessons],[before.daily.bridges,after.daily.bridges]])for(const[id,record]of Object.entries(left)){
     assert.ok(right[id]);assert.deepEqual(right[id].cases,record.cases);assert.deepEqual(right[id].notes,record.notes);assert.equal(right[id].draft,record.draft);
     for(const[index,value]of Object.entries(record.models))assert.deepEqual(right[id].models[index],value);
    }
   };
   const rawSnapshot=async(suffix,target=page)=>{
    const value=await read(target),decoded=originalState(JSON.parse(value.text)),stem=label+'-'+suffix,raw=stem+'-storage.txt',stateFile=stem+'-state.json';
    assert.equal(typeof value.raw,'string');fs.writeFileSync(uniqueFile(raw),value.raw);fs.writeFileSync(uniqueFile(stateFile),value.text);
    return{raw,state:stateFile,decoded:stateFile,rawBytes:Buffer.byteLength(value.raw),rawSHA256:digest(value.raw),stateSHA256:digest(value.text),decodedState:decoded};
   };
   const storageOnly=value=>{const{decodedState,...storage}=value;return storage;};
   const shot=async(suffix,target=page)=>{await target.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));const file=label+'-'+suffix+'.png';await target.screenshot({path:uniqueFile(file),fullPage:true});return file;};
   const reload=async c=>{const before=originalState(await state()),response=await page.reload();await wait(c);assert.equal(response?.fromServiceWorker(),true);keepRecords(before,originalState(await state()));};
   const navigate=async(c,target=page)=>{
    const before=originalState(await state(target)),oldURL=new URL(target.url()),url=new URL(base+'learn.html#'+c.id),response=await target.goto(url.href);await wait(c,target);
    if(response)assert.equal(response.fromServiceWorker(),true);else{assert.equal(oldURL.origin,url.origin);assert.equal(oldURL.pathname,url.pathname);assert.notEqual(oldURL.hash,url.hash);}
    keepRecords(before,originalState(await state(target)));
   };
   const reveal=async control=>{
    for(let count=0;count<10;count++){
     const closed=control.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
     if(!(await closed.count())){await control.scrollIntoViewIfNeeded();assert.equal(await control.isVisible(),true);return;}
     assert.equal(await closed.count(),1);await closed.locator(':scope > summary').click();
    }
    assert.fail('too many nested disclosures');
   };
   const field=async(c,key,value,coreField=false)=>{
    const attribute=coreField?'data-field':'data-xfield',control=page.locator(`[${attribute}="${key}"]`);assert.equal(await control.count(),1);await reveal(control);assert.equal(await control.isEnabled(),true);
    const before=await model(c),expected=cp(before),tag=await control.evaluate(e=>e.tagName),type=await control.getAttribute('type'),numeric=['number','range'].includes(type)||(coreField?key==='choice':key.startsWith('pair.'));
    const applyValue=raw=>{let value=numeric?(String(raw)===''?null:Number(raw)):String(raw);if(coreField){if(numeric&&value!==null)value=Math.max(0,Math.min(999,Math.trunc(value)));expected[key]=value;}else{setField(expected,key,value);Engine.fieldExtra(taskFor(c),expected,key);}};
    if(tag==='SELECT'){
     assert.equal(await control.locator('option').evaluateAll((options,want)=>options.filter(option=>option.value===want&&!option.disabled).length,String(value)),1);await control.selectOption(String(value));applyValue(value);
    }else if(type==='range'){
     const min=Number(await control.getAttribute('min')),max=Number(await control.getAttribute('max')),stride=Number(await control.getAttribute('step')||1),end=Number(value),start=Number(await control.inputValue());
     assert.ok(end>=min&&end<=max&&Number.isInteger((end-min)/stride));await control.focus();await control.press('Home');if(start!==min)applyValue(min);assert.deepEqual(await model(c),expected);
     for(let v=min+stride;v<=end;v+=stride){await control.press('ArrowRight');applyValue(v);assert.deepEqual(await model(c),expected);}assert.equal(Number(await control.inputValue()),end);
    }else{const limit=await control.getAttribute('maxlength');if(limit!==null)assert.ok(String(value).length<=Number(limit));await control.fill(String(value));applyValue(value);}
    assert.deepEqual(await model(c),expected);assert.equal(Tasks.validModel(taskFor(c),expected),true);return expected;
   };
   const action=async(c,name,data={})=>{
    const suffix=Object.entries(data).map(([key,value])=>`[data-${key}="${value}"]`).join('');let control=page.locator(`[data-x="${name}"]${suffix}`);
    const buttons=page.locator(`button[data-x="${name}"]${suffix}`);if(await buttons.count())control=buttons;
    assert.equal(await control.count(),1,label+' one visible '+name+suffix);await reveal(control);assert.equal(await control.isEnabled(),true);
    const before=await model(c),expected=cp(before),t=taskFor(c),cameraBefore=name==='turn-extra'?await page.evaluate(()=>window.mathLesson.snapshot().extra):null;
    await control.click();Engine.actExtra(t,expected,name==='turn-extra'?'m31-turn':name,data);const after=await model(c);assert.deepEqual(after,expected);
    if(name==='turn-extra'){
     const current=await page.evaluate(()=>window.mathLesson.snapshot().extra),[x,y,z]=cameraBefore.camera.map((v,i)=>v-cameraBefore.target[i]),s=Math.SQRT1_2;
     const rotated=[x*s+z*s,y,-x*s+z*s].map((v,i)=>v+cameraBefore.target[i]);assert.deepEqual(current.target,cameraBefore.target);
     rotated.forEach((v,i)=>assert.ok(Math.abs(current.camera[i]-v)<1e-7,'actual original camera turns by 45 degrees'));assert.notDeepEqual(current.camera,cameraBefore.camera);
    }
    if(t.type==='x-m31-cubes'||t.type==='x-m31-product'){
     if(before.history.length===1200){assert.deepEqual(after,before);ok(true,label+' enabled capped request changes no recorded model field or event');return after;}
     assert.equal(after.history.length,before.history.length+1);assert.deepEqual(after.history.slice(0,before.history.length),before.history);
     const a=name==='turn-extra'?'turn':name.replace(/^m31-/,''),captured=a==='plan'?['perLayer','layers','total']:a==='part'?['oneCube','base']:[];
     assert.deepEqual(after.history.at(-1),{a,i:String(data.index??''),f:Object.fromEntries(captured.map(key=>[key,before[key]]))});
     if(t.type==='x-m31-cubes'){
      const cells=cp(before.board.filled);if(name==='m31-fill')cells.push(Number(data.index));if(name==='m31-remove')cells.pop();assert.deepEqual(after.board.filled,cells);
      if(name==='m31-fill'||name==='m31-remove'&&before.board.filled.length){assert.equal(after.board.plan,null);assert.equal(after.board.part,null);}
     }
    }
    return after;
   };
   const solve=async c=>{for(const step of cubeFractionOperationPlan(c,await model(c)))step.field?await field(c,step.field,step.value):await action(c,step.action,step.data);};
   // Read the actual canvas image and original public scene snapshot. Image
   // decoding uses a detached canvas, never the learner's WebGL renderer.
   const visual=async(c,phase)=>{
    const task=taskFor(c),m=await model(c),canvas=page.locator('#extra-world canvas');assert.equal(await canvas.count(),1);await canvas.scrollIntoViewIfNeeded();assert.equal(await canvas.isVisible(),true);
    const box=await canvas.boundingBox();assert.ok(box&&box.width>100&&box.height>100);const scene=await page.evaluate(()=>window.mathLesson.snapshot().extra);assert.ok(scene&&scene.camera.every(Number.isFinite)&&scene.target.every(Number.isFinite));
    if(task.type==='x-m31-cubes'){
     const[w,d,h]=task.grid,total=w*d*h;assert.equal(scene.shape,'fraction-cubes');assert.equal(scene.objects,total);assert.equal(scene.cells.length,total);
     for(let i=0;i<total;i++){const x=i%w,y=Math.floor(i/(w*d)),z=Math.floor(i/w)%d;assert.deepEqual(scene.cells[i].cell,[x,y,z]);assert.deepEqual(scene.cells[i].position,[x-(w-1)/2,y+.5+(m.board.spread?y*.5:0),z-(d-1)/2]);}
    }
    const file=label+'-visual-'+phase+'.png',bytes=await canvas.screenshot({path:uniqueFile(file)});
    const pixels=await page.evaluate(async encoded=>{
     const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)),bitmap=await createImageBitmap(new Blob([bytes],{type:'image/png'})),image=new OffscreenCanvas(bitmap.width,bitmap.height),context=image.getContext('2d');context.drawImage(bitmap,0,0);bitmap.close();
     const raw=context.getImageData(0,0,image.width,image.height).data,colors=new Set();let chromatic=0,min=255,max=0;
     for(let i=0;i<raw.length;i+=4){const r=raw[i],g=raw[i+1],b=raw[i+2];colors.add((r>>4)*256+(g>>4)*16+(b>>4));min=Math.min(min,r,g,b);max=Math.max(max,r,g,b);if(Math.max(r,g,b)-Math.min(r,g,b)>40)chromatic++;}
     return{width:image.width,height:image.height,quantizedColors:colors.size,chromaticPixels:chromatic,channelRange:max-min};
    },bytes.toString('base64'));
    assert.ok(pixels.quantizedColors>=12&&pixels.channelRange>30,'actual WebGL screenshot has visible geometry, not a flat/blank rectangle');
    if(task.type==='x-m31-cubes'&&m.board.filled.length)assert.ok(pixels.chromaticPixels>64,'filled cube faces have a positive visible colored area');
    const item={width,height,id:c.id,index:c.index,label,phase,file,sha256:digest(bytes),bytes:bytes.length,box,pixels,scene,model:m};visuals.push(item);return item;
   };
   const capture=async(c,phase,strict,{role,checked=false}={})=>{
    const raw=await rawSnapshot(phase),lesson=lessonFrom(raw.decodedState,c),m=lesson.models[c.index],record=lesson.cases[c.index]||null,task=taskFor(c),proof=replay(task,m);
    assert.equal(Tasks.validModel(task,m),true);const expectedFeedback=thinkingFeedback(task,m,record,ctx(c)),native=!!binding(task,ctx(c));
    assert.equal(native&&!!expectedFeedback,strict);if(role!=='prerequisite')assert.equal(!!expectedFeedback,strict);
    const otherFamily=(role==='prerequisite'||role==='excluded')&&isOther(c)?await auditOther(page,c,m,record):null;
    if(otherFamily)assert.equal(native,false,'separate native proof is not original family coverage');
    const hasFeedback=!!expectedFeedback||!!otherFamily?.feedback;
    assert.equal(await hint.count(),hasFeedback?1:0);if(hasFeedback)assert.equal(await hint.isVisible(),true);const words=hasFeedback?await hint.innerText():null;
    if(strict){
     assert.ok(proof&&native);assert.deepEqual(record.attempts.at(-1).value,m);assert.equal(expectedFeedback.method,null);
     assert.ok(words.includes('网格、尺寸和小块边长由工具给定')&&words.includes('没有把它们算作两条独立乘法过程'));assert.doesNotMatch(words,/MP\.\d/);assert.equal(await hint.locator('[data-thinking-node-id]').count(),0);
     assert.ok(words.includes(`当前每层 ${proof.construction.perLayer} 块，共 ${proof.construction.layers} 层`));
    }
    const value={width,height,contextRole,id:c.id,index:c.index,label,phase,role,checked,model:m,record,attempts:record?.attempts||[],storage:storageOnly(raw),correct:Tasks.inspect(task,m).correct,strict,proof,words,
     existingOtherFeedback:!native&&!!expectedFeedback,otherFamily,constructedCompatibilityFixture:contextRole==='constructed-compatibility'};captures.push(value);return value;
   };
   const check=async(c,correct,strict,phase,role)=>{
    const before=await current(c),control=page.locator('#actions [data-do="check"]');assert.equal(await control.count(),1);await reveal(control);assert.equal(await control.isEnabled(),true);await control.click();
    assert.equal(await page.locator('#check-feedback').getAttribute('data-state'),correct?'correct':'revise');const after=await current(c),attempt=after.record.attempts.at(-1);
    assert.equal(after.record.attempts.length,(before.record?.attempts?.length??0)+1);assert.deepEqual(after.record.attempts.slice(0,-1),before.record?.attempts??[]);assert.deepEqual(after.model,before.model);assert.deepEqual(attempt.value,before.model);
    assert.equal(Tasks.inspect(taskFor(c),after.model).correct,correct);assert.ok(attempt.id&&attempt.at&&typeof attempt.supported==='boolean'&&typeof attempt.exposed==='boolean');
    const value=await capture(c,phase,strict,{role,checked:true});value.attempt=attempt;checkedLedger.push(value);return value;
   };
   const retry=async(c,kind,role)=>{
    const before=await current(c),control=page.locator('[data-do="p3-retry"]');assert.equal(await control.count(),1);await reveal(control);assert.equal(await control.isEnabled(),true);await control.click();await wait(c);const after=await current(c);
    assert.deepEqual(after.model,Tasks.defaultModel(taskFor(c)));assert.deepEqual(after.lesson.cases,before.lesson.cases);assert.deepEqual(after.lesson.notes,before.lesson.notes);assert.equal(after.lesson.draft,before.lesson.draft);
    for(const[index,value]of Object.entries(before.lesson.models))if(Number(index)!==c.index)assert.deepEqual(after.lesson.models[index],value);assert.equal(await hint.count(),0);
    const storage=kind==='native'?null:(await capture(c,'retry-'+kind,false,{role})).storage;
    const item={width,height,contextRole,id:c.id,index:c.index,kind,beforeRecord:before.record,afterRecord:after.record,emptyModel:after.model,storage,constructedCompatibilityFixture:contextRole==='constructed-compatibility'};retries.push(item);return item;
   };
   const open=async c=>{
    const atPage=await page.evaluate(()=>window.mathLesson?.snapshot());if(atPage?.id!==c.id)await navigate({id:c.id,index:0});
    let at=(await current({id:c.id,index:0})).lesson.index;assert.ok(at<=c.index,'only forward original Next navigation');
    while(at<c.index){
     const previous={id:c.id,index:at},saved=await current(previous);
     if(!saved.record?.attempts?.some(a=>Tasks.inspect(taskFor(previous),a.value).correct)){
      const prep=navigationFixture.navigation.find(x=>x.id===c.id&&x.index===at);assert.ok(prep);assert.equal(binding(taskFor(previous),ctx(previous)),null);
      if(isOther(previous))await auditOther(page,previous,saved.model,saved.record??null);
      for(const step of prep.steps)step.field||step.coreField?await field(previous,step.field||step.coreField,step.value,!!step.coreField):await action(previous,step.action,step.data);
      const checked=await check(previous,true,false,'navigation-prerequisite-'+at,'prerequisite');preparations.push({width,height,...prep,checked,strictCubefractionCoverage:false});
     }
     const before=originalState(await state()),next=page.locator('#actions [data-do="next"]');assert.equal(await next.count(),1);assert.equal(await next.isEnabled(),true);await next.click();
     const from=at;at++;await wait({id:c.id,index:at});keepRecords(before,originalState(await state()));navigations.push({width,height,id:c.id,from,to:at,originalNext:true});
    }
    const fresh=await current(c);assert.deepEqual(fresh.model,Tasks.defaultModel(taskFor(c)));assert.equal(fresh.record?.attempts?.length??0,0);assert.equal(await page.locator('[data-do="p3-retry"]').count(),0);
    assert.equal(await page.locator('#actions [data-do="check"]').isEnabled(),studyActionFocus({task:taskFor(c),model:fresh.model}).readyToCheck);
    ok(true,label+' first arrival is the original untouched work without any injected storage or index');
   };
   const cacheReady=async profile=>{
    const target=profile.page;
    try{
     await target.goto(base+'v2.html#trail');await target.locator('#import-file').waitFor({state:'attached'});await target.locator('#main [data-do="export"]').first().waitFor();
     let status={ready:false};
     for(let i=0;i<300;i++){
      status=await target.evaluate(async expected=>{
       const registration=await navigator.serviceWorker.getRegistration(),worker=navigator.serviceWorker.controller;
       const identity={controller:worker?.scriptURL||null,active:registration?.active?.scriptURL||null,state:worker?.state||null,waiting:registration?.waiting?.scriptURL||null,installing:registration?.installing?.scriptURL||null};
       if(!worker||worker!==registration?.active||worker.state!=='activated'||new URL(worker.scriptURL).searchParams.get('release')!==expected)return{ready:false,...identity};
       const report=await new Promise(resolve=>{const channel=new MessageChannel(),timer=setTimeout(()=>{channel.port1.close();resolve(null);},1200);channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();resolve(e.data);};worker.postMessage({type:'math-explorer:cache-status'},[channel.port2]);});
       return{...identity,report,ready:report?.cache===expected&&report.complete===true&&report.cached===report.total&&report.total>0};
      },cache);if(status.ready)break;await target.waitForTimeout(100);
     }
     const moduleNames=[...new Set(['storage.js','v2.html','learn.html','exploration.js','exploration-core.js','data/atlas.json','learning/evidence-contract.js','learning/evidence-adapters.js','learning/thinking-feedback.js','learning/cubefraction-evidence.js','learning/p3-workflow.js','learning/phase4/async-batches.js','learning/phase5/b39.js','learning/phase5/b39-model.js','learning/phase5/b39-view.js','vendor/three/three.module.min.js','vendor/three/OrbitControls.js',...sourceFiles.filter(file=>file.startsWith('dist/')).map(file=>file.slice(5))])];
     const modules=await target.evaluate(async({expected,names})=>{const store=await caches.open(expected);return Promise.all(names.map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));},{expected:cache,names:moduleNames});
     const empty=originalState(await state(target));assert.deepEqual(empty.lessons,{});assert.deepEqual(empty.daily.bridges,{});
     const item={width,height,role:profile.role,cache,status,modules,missing:modules.filter(x=>!x.cached).map(x=>x.name),originStopped:false,emptyLearningState:true,emptyStorage:storageOnly(await rawSnapshot('empty-'+profile.role,target))};
     ok(status.ready&&item.missing.length===0,prefix+' '+profile.role+' active complete cache and genuine empty learning state',item);offline.push(item);return item;
    }catch(error){activePage=target;error.diagnosticPage=target;throw error;}
   };
   const warmed=await Promise.all(profiles.map(cacheReady));await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});for(const item of warmed)item.originStopped=!server.listening;
   ok(!server.listening,prefix+' origin stops before all mathematical controls and real file imports');
   const api=(c,role)=>({field:(key,value)=>field(c,key,value),action:(name,data)=>action(c,name,data),solve:()=>solve(c),model:()=>model(c),
    check:(correct,strict,phase)=>check(c,correct,strict,phase,role),capture:(phase,strict)=>capture(c,phase,strict,{role}),retry:kind=>retry(c,kind,role),assert:(value,message)=>ok(value,label+' '+message)});
   const runBoundary=async(c,kind)=>{
    label=prefix+'-'+c.id+'-'+c.index+'-boundary-'+kind;await retry(c,'boundary-'+kind,'boundary');
    const phases=await cubeFractionBoundaryFlow(kind,c,api(c,'boundary'));await reload(c);assert.deepEqual(await model(c),phases.at(-1).model);assert.equal(await hint.isVisible(),true);
    const rendered=await visual(c,'final'),screenshot=await shot('boundary');boundaries.push({width,height,kind,id:c.id,index:c.index,phases,rendered,screenshot,constructedCompatibilityFixture:false});
   };
   const runNative=async c=>{
    label=prefix+'-'+c.id+'-'+c.index;await open(c);assert.equal(binding(taskFor(c),ctx(c))?.nodeId,c.nodeId);
    assert.equal(await guide.isVisible(),true);assert.equal(await guide.evaluate(e=>e.open),false);assert.equal(await hint.count(),0);const before=await current(c),images={initial:await visual(c,'initial')};
    await guide.locator(':scope > summary').click();assert.equal(await guide.locator('p').isVisible(),true);
    await page.waitForFunction(async({id,index})=>{const{readStored}=await import('./storage.js');return JSON.parse(readStored('math-explorer-v2')).lessons[id]?.cases[index]?.support===true;},c);
    await guide.locator(':scope > summary').click();const supported=await current(c);assert.deepEqual(supported.model,before.model);assert.equal(supported.record.attempts.length,0);
    const phases=await cubeFractionNativeFlow(c,{...api(c,'native'),checkpoint:async(stage,items)=>{
     if(['filled-before-opening','opened','turned'].includes(stage)){
      images[stage]=await visual(c,stage);
      if(stage==='filled-before-opening'){assert.notEqual(images[stage].sha256,images.initial.sha256);assert.ok(images[stage].pixels.chromaticPixels>images.initial.pixels.chromaticPixels+64,'actual filled faces have more colored area than the empty ghost cells');}
      if(stage==='opened')assert.notDeepEqual(images.opened.scene.cells,images['filled-before-opening'].scene.cells,'upper layers actually separate');
      if(stage==='turned'){assert.deepEqual(images.turned.scene.cells,images.opened.scene.cells);assert.notDeepEqual(images.turned.scene.camera,images.opened.scene.camera);}
     }
     if(stage==='correct-unsubmitted')assert.equal(await hint.count(),0);
     if(stage==='corrected'){await shot('corrected');await reload(c);assert.equal(await hint.isVisible(),true);assert.deepEqual(await model(c),items.at(-1).model);}
     if(['modified-prose','closed-unsubmitted','shared-retry'].includes(stage)){await reload(c);assert.equal(await hint.count(),0);if(stage==='shared-retry')images.retry=await visual(c,'shared-retry');}
     if(stage==='final'){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);images.final=await visual(c,'retry-corrected');}
    }});
    const final=phases.at(-1),actual=phases.filter(x=>x.checked);assert.equal(actual.length,10);assert.equal(phases.length,14);assert.deepEqual(final.record.attempts,actual.map(x=>x.attempt));
    for(const kind of['extra-root','extra-event','false-issue','hidden-plan-root','hidden-part-root','foreign-action','duplicate-cell','hidden-part-save']){
     const forged=cp(final.model),task=taskFor(c);
     if(kind==='extra-root')forged.unrecorded=1;else if(kind==='extra-event')forged.history[0].unrecorded=1;else if(kind==='false-issue')forged.issue='not the recorded issue';
     else if(kind==='hidden-plan-root')forged.perLayer+=' ';else if(kind==='hidden-part-root')forged.oneCube+=' ';else if(kind==='foreign-action')M.act(task,forged,'m31-clear');
     else if(kind==='duplicate-cell')M.act(task,forged,'m31-fill',{index:0});else M.act(task,forged,'m31-part');
     assert.equal(replay(task,forged),null);forgeries.push({width,height,id:c.id,index:c.index,kind,counterfactual:true,actualBrowserAction:false,model:forged,originalValid:M.valid(task,forged),strict:false});
    }
    observations.push({width,height,id:c.id,index:c.index,nodeId:c.nodeId,taskHash:c.taskHash,phases,images});for(const kind of cubeFractionBoundaryKindsFor(c))await runBoundary(c,kind);
   };
   for(const c of targets){
    if(c.role==='native')await runNative(c);
    else{label=prefix+'-'+c.role+'-'+c.id+'-'+c.index;await open(c);
     if(c.role==='excluded'&&isOther(c)){const initial=await current(c);await auditOther(page,c,initial.model,initial.record??null);}else{assert.equal(await guide.count(),0);assert.equal(await hint.count(),0);}
     await solve(c);const snapshot=await check(c,true,false,c.role+'-checked',c.role);assert.equal(!!snapshot.proof,c.role==='associated');assert.equal(binding(taskFor(c),ctx(c)),null);await reload(c);
     if(snapshot.otherFamily){const restored=await current(c);assert.deepEqual(await auditOther(page,c,restored.model,restored.record),snapshot.otherFamily);}else assert.equal(await hint.count(),0);assert.deepEqual(await model(c),snapshot.model);
     const rendered=await visual(c,'checked');isolated.push({width,height,kind:c.role,id:c.id,index:c.index,taskHash:c.taskHash,snapshot,rendered});}
   }
   const mapCaptures=(rows,finalState)=>rows.map(value=>{
    const lesson=lessonFrom(finalState,value),prior=value.record?.attempts||[];assert.ok(lesson);assert.deepEqual(lesson.cases[value.index].attempts.slice(0,prior.length),prior);
    if(value.checked){assert.deepEqual(lesson.cases[value.index].attempts[prior.length-1],value.attempt);assert.deepEqual(value.model,value.attempt.value);}
    return{id:value.id,index:value.index,label:value.label,phase:value.phase,storage:value.storage,attemptPrefixLength:prior.length,checkedAttemptId:value.checked?value.attempt.id:null,
     currentModelIncludedAsAttempt:value.checked,constructedCompatibilityFixture:value.constructedCompatibilityFixture};
   });
   const downloadBackup=async suffix=>{
    const before=originalState(await state()),response=await page.goto(base+'v2.html#trail');assert.equal(response?.fromServiceWorker(),true);
    await page.locator('#main [data-do="export"]').first().waitFor();keepRecords(before,originalState(await state()));
    const pending=page.waitForEvent('download');await page.locator('[data-do="export"]').first().click();const downloaded=await pending,file=label+'-'+suffix+'.json';await downloaded.saveAs(uniqueFile(file));
    const payload=fs.readFileSync(path.join(out,file),'utf8'),backup=JSON.parse(payload);assert.equal(backup.version,2);assert.deepEqual(backup.state,originalState(await state()));
    return{file,payload,backup,bytes:Buffer.byteLength(payload),sha256:digest(payload)};
   };
   label=prefix+'-actual-backup';const actual=await downloadBackup('v2'),sourceRows=checkedLedger.filter(x=>x.width===width&&x.contextRole==='source'),sourceCaptures=captures.filter(x=>x.width===width&&x.contextRole==='source');
   assert.equal(sourceRows.length,95);assert.equal(sourceCaptures.length,130);const positions=[...new Set(sourceRows.map(x=>x.id+':'+x.index))];assert.equal(positions.length,21);
   for(const key of positions){const rows=sourceRows.filter(x=>x.id+':'+x.index===key),last=rows.at(-1),lesson=lessonFrom(actual.backup.state,last);assert.deepEqual(lesson.cases[last.index].attempts,rows.map(x=>x.attempt));assert.deepEqual(lesson.models[last.index],last.model);}
   for(const c of cases)assert.ok(replay(taskFor(c),actual.backup.state.lessons[c.id].models[c.index]));
   const sourceCaptureMap=mapCaptures(sourceCaptures,actual.backup.state),exportedScreenshot=await shot('exported');
   const importFile=async(target,text,name)=>{
    const button=target.locator('[data-do="import"]').first();await button.waitFor({state:'visible'});assert.equal(await button.isEnabled(),true);
    const choosing=target.waitForEvent('filechooser');await button.click();const chooser=await choosing;await chooser.setFiles({name,mimeType:'application/json',buffer:Buffer.from(text)});
    await target.waitForFunction(()=>document.querySelector('#import-file')?.value==='');return target.locator('#toast').innerText();
   };
   activePage=restorePage;const targetReload=await restorePage.reload();assert.equal(targetReload?.fromServiceWorker(),true);await restorePage.locator('#main [data-do="export"]').first().waitFor();
   const empty=originalState(await state(restorePage));assert.deepEqual(empty.lessons,{});assert.deepEqual(empty.daily.bridges,{});const emptyBeforeImport=storageOnly(await rawSnapshot('empty-before-import',restorePage));
   assert.ok((await importFile(restorePage,actual.payload,actual.file)).includes('备份已合并'));const imported=await read(restorePage);assert.deepEqual(originalState(JSON.parse(imported.text)),actual.backup.state);
   const firstImportStorage=storageOnly(await rawSnapshot('first-import',restorePage));provenance.nativeBackupImportsCompleted++;
   assert.ok((await importFile(restorePage,actual.payload,'cubefraction-identical-repeat-v2.json')).includes('备份已合并'));const repeated=await read(restorePage);assert.equal(repeated.raw,imported.raw);assert.deepEqual(originalState(JSON.parse(repeated.text)),actual.backup.state);
   const repeatedImportStorage=storageOnly(await rawSnapshot('repeated-import',restorePage));provenance.nativeBackupImportsCompleted++;
   assert.ok(!(await importFile(restorePage,'{','cubefraction-corrupt-native.json')).includes('备份已合并'));assert.equal((await read(restorePage)).raw,imported.raw);
   const corruptImportStorage=storageOnly(await rawSnapshot('corrupt-import-rejected',restorePage));provenance.corruptImportsRejected++;
   const last=cases.at(-1);await navigate(last,restorePage);assert.equal(await restorePage.locator('#thinking-feedback').isVisible(),true);
   const restoredReload=await restorePage.reload();assert.equal(restoredReload?.fromServiceWorker(),true);await wait(last,restorePage);keepRecords(actual.backup.state,originalState(await state(restorePage)));assert.equal(await restorePage.locator('#thinking-feedback').isVisible(),true);
   const restoredStorage=storageOnly(await rawSnapshot('restored-lesson',restorePage)),restoredScreenshot=await shot('restored',restorePage);
   backups.push({width,height,kind:'actual-browser-v2',backupFile:actual.file,bytes:actual.bytes,backupSha256:actual.sha256,originalState:actual.backup.state,
    emptyBeforeImport,firstImportStorage,repeatedImportStorage,corruptImportStorage,restoredStorage,exportedScreenshot,restoredScreenshot,sourceCaptureMap,
    independentEmptyContext:true,originStopped:!server.listening,wholeStateFirstImportExact:true,repeatByteIdempotent:true,corruptRejectedWithoutWrite:true,checked:95,currentModelCaptures:130,positions:21});

   // Old practice positions have no dedicated current practice page. This
   // third independent context receives explicitly constructed compatibility
   // data, never a fabricated native attempt or a seed into the source route.
   contextRole='constructed-compatibility';page=compatibilityProfile.page;activePage=page;guide=page.locator('#thinking-guide');hint=page.locator('#thinking-feedback');label=prefix+'-constructed-practice-compatibility';
   const legacyState=Core.fresh();
   for(const c of practice){const t=taskFor(c),m=Tasks.defaultModel(t);for(const step of cubeFractionOperationPlan(c,m))if(step.field){setField(m,step.field,String(step.value));M.field(t,m,step.field);}else M.act(t,m,step.action==='turn-extra'?'m31-turn':step.action,step.data||{});
    assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);assert.ok(replay(t,m));assert.equal(binding(t,ctx(c)),null);const a=legacyState.lessons[c.id]??=State.freshLesson(c.id);a.models[-1]=m;assert.deepEqual(a.cases,{});}
   originalState(legacyState);const legacyPayload=JSON.stringify(Core.backup(legacyState)),legacyFile=label+'-v2.json';fs.writeFileSync(uniqueFile(legacyFile),legacyPayload);
   const legacyResponse=await page.reload();assert.equal(legacyResponse?.fromServiceWorker(),true);await page.locator('#main [data-do="export"]').first().waitFor();
   const emptyLegacy=originalState(await state());assert.deepEqual(emptyLegacy.lessons,{});assert.deepEqual(emptyLegacy.daily.bridges,{});const legacyEmptyStorage=storageOnly(await rawSnapshot('independent-empty-target'));
   assert.ok((await importFile(page,legacyPayload,legacyFile)).includes('备份已合并'));const legacyImported=await read(page);assert.deepEqual(originalState(JSON.parse(legacyImported.text)),legacyState);
   const legacyImportStorage=storageOnly(await rawSnapshot('imported-original-practice'));provenance.compatibilityImportsCompleted++;
   assert.ok(!(await importFile(page,'{','cubefraction-corrupt-practice.json')).includes('备份已合并'));assert.equal((await read(page)).raw,legacyImported.raw);
   const legacyCorruptStorage=storageOnly(await rawSnapshot('corrupt-import-rejected'));provenance.corruptImportsRejected++;
   const practiceSnapshots=[];
   for(const c of practice){
    label=prefix+'-constructed-practice-'+c.id;await navigate({id:c.id,index:0});const raw=await rawSnapshot('retained-original-model'),lesson=raw.decodedState.lessons[c.id];
    assert.deepEqual(lesson.models[-1],legacyState.lessons[c.id].models[-1]);assert.equal(binding(taskFor(c),ctx(c)),null);assert.equal(lesson.cases[0]?.attempts?.length??0,0);assert.equal(await hint.count(),0);
    const item={width,height,kind:'old-practice-compatibility',id:c.id,index:-1,taskHash:c.taskHash,model:lesson.models[-1],storage:storageOnly(raw),nativePositionOpened:0,strict:false,constructedCompatibilityFixture:true};practiceSnapshots.push(item);isolated.push(item);
   }
   label=prefix+'-constructed-practice-final-backup';const legacyFinal=await downloadBackup('v2');
   for(const c of practice){assert.deepEqual(legacyFinal.backup.state.lessons[c.id].models[-1],legacyState.lessons[c.id].models[-1]);assert.equal(legacyFinal.backup.state.lessons[c.id].cases[0]?.attempts?.length??0,0);}
   backups.push({width,height,kind:'constructed-practice-final-v2',constructedCompatibilityFixture:true,fixture:legacyFile,fixtureSHA256:digest(legacyPayload),legacyEmptyStorage,legacyImportStorage,legacyCorruptStorage,
    backupFile:legacyFinal.file,bytes:legacyFinal.bytes,backupSha256:legacyFinal.sha256,originalState:legacyFinal.backup.state,practiceSnapshots,importedConstructedSubmissions:0,actualUIChecksAfterImport:0,oldPractice:2,independentContext:true,originStopped:!server.listening});
   for(const profile of profiles){await profile.context.close();openContexts.delete(profile.context);}activePage=null;
  }
  assert.equal(errors.length,0);assert.equal(remote.length,0);assert.equal(observations.length,12);assert.equal(forgeries.length,96);assert.equal(preparations.length,20);assert.equal(navigations.length,26);
  assert.equal(isolated.filter(x=>x.kind==='associated').length,8);assert.equal(isolated.filter(x=>x.kind==='excluded').length,2);assert.equal(isolated.filter(x=>x.kind==='old-practice-compatibility').length,4);assert.equal(boundaries.length,12);
  assert.equal(checkedLedger.length,190);assert.equal(captures.length,260);assert.equal(retries.length,24);assert.ok(checkedLedger.every(x=>x.contextRole==='source'&&!x.constructedCompatibilityFixture));
  assert.equal(backups.filter(x=>x.kind==='actual-browser-v2').length,2);assert.equal(backups.filter(x=>x.kind==='constructed-practice-final-v2').length,2);
  assert.equal(provenance.nativeBackupImportsCompleted,4);assert.equal(provenance.compatibilityImportsCompleted,2);assert.equal(provenance.corruptImportsRejected,4);
  const attemptCounts=Object.fromEntries(['native','boundary','associated','excluded','prerequisite'].map(role=>[role,checkedLedger.filter(x=>x.role===role).length]));
  assert.deepEqual(attemptCounts,{native:120,boundary:40,associated:8,excluded:2,prerequisite:20});
  const checkedPaths=checkedLedger.flatMap(x=>[x.storage.raw,x.storage.state]),capturePaths=captures.flatMap(x=>[x.storage.raw,x.storage.state]);assert.equal(new Set(checkedPaths).size,380);assert.equal(new Set(capturePaths).size,520);
  fs.writeFileSync(path.join(out,'provenance.json'),JSON.stringify(provenance,null,2));fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({...report(),attemptCounts,uniqueCheckedFiles:380,uniqueCaptureFiles:520,originStopped:offline.every(x=>x.originStopped)},null,2));
  console.log('P9_CUBEFRACTION_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,nativeTasks:6,taskViewportPairs:12,checked:190,captures:260,oldPractice:4,retries:24,next:26,forgeries:96,nativeBackups:2,compatibilityBackups:2,visuals:visuals.length}));
 }catch(error){
  if(error.diagnosticPage)activePage=error.diagnosticPage;const diagnosticFile=activePage&&diagnostics.has(activePage)?await diagnostics.get(activePage).dump(error).catch(reason=>({diagnosticError:String(reason)})):null;
  if(activePage){await activePage.screenshot({path:path.join(out,label+'-failure.png'),fullPage:true}).catch(()=>{});fs.writeFileSync(path.join(out,label+'-failure.html'),await activePage.content().catch(()=>''));}
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({...report(),error:String(error),stack:error.stack,at:label,diagnosticFile},null,2));console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});for(const context of openContexts)await context.close();if(browser)await browser.close();
 }
}
if(require.main===module)main().catch(error=>{console.error(error.stack);process.exitCode=1;});
