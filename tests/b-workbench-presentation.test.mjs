import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TASKS,PRACTICE,defaultModel} from '../dist/learning/tasks.js';
import {BRIDGES} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import {learningActionPlan,studyActionFocus} from '../dist/learning/workspace-flow.js';
import {WORKBENCH_BEATS,workbenchBeat,syncWorkbenchScroll,closeWorkbenchDrawer,describeWorkbenchCurriculum,syncWorkbenchLocation,studyActionFocusForWorkbench,workbenchProcessPresentation} from '../dist/learning/workbench-presentation.js';
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('B: four visual beats map existing stages without making a new gate',()=>{
 assert.deepEqual(WORKBENCH_BEATS.map(x=>x.id),['read','try','check','record']);
 for(const [stage,beat] of [['explore','try'],['revise','check'],['recheck','check'],['passed','check'],['reflect','record']])assert.equal(workbenchBeat(stage),beat);
 assert.equal(learningActionPlan({stage:'explore',readyToCheck:true}).primary.action,'check');
 assert.equal(learningActionPlan({stage:'explore',readyToCheck:false}).primary.disabled,true);
 assert.equal(studyActionFocus({stage:'explore',task:{type:'x-wideshift'},model:{committed:null}}).kind,'widget');
 assert.equal(learningActionPlan({stage:'reflect',hasDraft:false}).primary.action,'back');
});
test('B: one original workpiece, action bar, iframe and focus toggle',()=>{
 const html=source('dist/learn.html'),index=source('dist/index.html'),space=source('dist/space.js');
 for(const id of ['work','actions','learning-problem','learning-interaction','learning-check','learning-next','workbench-beats'])assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1);
 for(const id of ['journey-frame','workbench-focus-toggle'])assert.equal((index.match(new RegExp('id="'+id+'"','g'))||[]).length,1);
 const focus=space.slice(space.indexOf('function setWorkbenchForeground('),space.indexOf('function renderLearningMapContext('));
 assert.match(focus,/dataset\.workbenchForeground/);
 assert.doesNotMatch(focus,/replaceEmbeddedFrame\(|\.src\s*=|writeStored\(|scene\.select\(|setHash\(|setTaskSurfaceUrl\(|scheduleSave\(/);
 assert.match(space,/e\.data\.sessionId===activeSessionId\)setWorkbenchForeground\('learn'\)/);
});

test('B: display module is loaded by the learning entry and cached for offline use',()=>{
 assert.match(source('dist/learning/learn.js'),/from '\.\/workbench-presentation\.js'/);
 assert.ok(source('dist/sw.js').includes('./learning/workbench-presentation.js'));
});

test('B: fixed shell moves original containers and keeps standalone layout',()=>{
 const runtime=source('dist/learning/learn.js'),module=source('dist/learning/workbench-presentation.js'),style=source('dist/learning/learn.css');
 assert.match(runtime,/parent\.document\.body\?\.dataset\.world==='network'&&parent\.document\.querySelector\('#journey-frame'\)\?\.contentWindow===window\)mountWorkbenchShell\(document\)/);
 assert.match(module,/stage\.append\(\.\.\.stageItems\)/);
 assert.match(module,/scene\.insertBefore\(stage,command\)/);
 assert.match(module,/doc\.querySelector\('#workbench-stage'\)/);
 assert.doesNotMatch(module,/cloneNode|innerHTML|writeStored|localStorage/);
 assert.match(style,/#workbench-stage\{[\s\S]*?overflow:auto/);
 assert.match(style,/#scene \.execution-command\{[\s\S]*?position:static;flex:none/);
 assert.match(runtime,/syncWorkbenchScroll\(document,\{sessionId:id,index:a\.index,view:a\.view,stage\}\)/);
 assert.match(runtime,/document\.body\.dataset\.workbenchShell!=='fixed'&&typeof ResizeObserver/);
 assert.match(source('dist/space.css'),/\[data-workbench-foreground\] #journey-surface\{\s*height:calc\(100dvh - 188px\)/);
});

test('B: scroll presentation follows actual task identity and first passed stage without changing controls',()=>{
 const surface={scrollTop:92,clientHeight:300},calls=[];
 const feedback={hidden:false,scrollIntoView:options=>calls.push(options)};
 const doc={getElementById:id=>id==='workbench-stage'?surface:id==='check-feedback'?feedback:null};
 const show=(index,stage,view='task',sessionId='equivalent')=>syncWorkbenchScroll(doc,{sessionId,index,view,stage});
 show(0,'explore');assert.equal(surface.scrollTop,0);
 surface.scrollTop=91;show(0,'revise');show(0,'recheck');assert.equal(surface.scrollTop,91);assert.equal(calls.length,0);
 show(0,'passed');show(0,'passed');assert.deepEqual(calls,[{block:'nearest'}]);
 show(1,'explore');assert.equal(surface.scrollTop,0);
 surface.scrollTop=54;show(1,'reflect','summary');assert.equal(surface.scrollTop,0);
 surface.scrollTop=61;show(1,'explore','task','quarters');assert.equal(surface.scrollTop,0);
 assert.doesNotThrow(()=>syncWorkbenchScroll({getElementById:()=>null},{sessionId:'x',index:0,view:'task',stage:'explore'}));
});

test('B: the auxiliary drawer reuses real optional controls and closes on actual task change',()=>{
 const module=source('dist/learning/workbench-presentation.js'),runtime=source('dist/learning/learn.js'),style=source('dist/learning/learn.css');
 assert.match(module,/mountWorkbenchDrawer\(doc,stage,command\)/);
 assert.match(module,/panel\.append\(\.\.\.Array\.from\(el\.childNodes\)/);
 assert.match(module,/el\.append\(panel\);el\.setAttribute\('name','workbench-auxiliary'\);dock\.append\(el\)/);
 assert.match(module,/stage\.inert=fixed\.matches&&!!opened\(\)/);
 assert.match(runtime,/if\(\$\('#workbench-drawer'\)\)\$\('#learning-next'\)\.append\(explanation\)/);
 assert.match(style,/#workbench-drawer \.workbench-drawer-panel\{[\s\S]*?overflow:auto/);
 const details=[{open:true},{open:true}],stage={inert:true,scrollTop:40,clientHeight:300};
 const dock={querySelectorAll:()=>details.filter(el=>el.open)};
 const doc={getElementById:id=>id==='workbench-drawer'?dock:id==='workbench-stage'?stage:null};
 closeWorkbenchDrawer(doc);assert.ok(details.every(el=>!el.open));assert.equal(stage.inert,false);
 syncWorkbenchScroll(doc,{sessionId:'equivalent',index:0,view:'task',stage:'explore'});
 details[0].open=true;stage.inert=true;stage.scrollTop=42;
 syncWorkbenchScroll(doc,{sessionId:'equivalent',index:1,view:'task',stage:'explore'});
 assert.equal(details[0].open,false);assert.equal(stage.inert,false);assert.equal(stage.scrollTop,0);
});

test('B: stage location uses only the exact curriculum mapping, with explicit exceptions',()=>{
 const data=JSON.parse(source('dist/data/grade-panorama-lite.json')),before=JSON.stringify(data);
 const equivalent=describeWorkbenchCurriculum(data,'mt_Ep7TDFuYUa');
 assert.deepEqual(equivalent.stageIds,['stage-2','stage-3']);
 assert.equal(equivalent.text,'知识学段：3—4年级（延伸） / 5—6年级（主要）');
 assert.equal(equivalent.evidence,'conceptual');
 assert.equal(describeWorkbenchCurriculum(data,'mt_ndGqFPWyen').text,'知识学段：3—4年级（主要）');
 assert.equal(describeWorkbenchCurriculum(data,'mt_DRlbMok2lT',{bridge:true}).text,'关联任务目标知识学段：3—4年级（延伸） / 5—6年级（主要）');
 assert.equal(describeWorkbenchCurriculum(data,'mt_9QzSnn8m80').text,'知识学段：5—6年级（延伸） / 初中后续（主要）');
 assert.equal(describeWorkbenchCurriculum(data,'mt_h02-C8PRrj').state,'unassigned');
 assert.equal(describeWorkbenchCurriculum(data,'mt_b4lbTOJYwI').state,'unresolved');
 assert.equal(describeWorkbenchCurriculum(data,'mt_lMz9nAs7VO').state,'thinking');
 assert.equal(describeWorkbenchCurriculum(data,'nonexistent').state,'missing');
 assert.equal(describeWorkbenchCurriculum(null,'mt_Ep7TDFuYUa').state,'unavailable');
 for(const record of data.nodeMappings){
  const label=describeWorkbenchCurriculum(data,record.nodeId);
  if(record.nodeId===data.specialRisks.unresolvedNode.id){
   assert.deepEqual(label.stageIds,[]);continue;
  }
  assert.deepEqual(label.stageIds,data.stages.filter(stage=>record.curriculum.primaryStages.includes(stage.id)).map(stage=>stage.id));
 }
 assert.equal(JSON.stringify(data),before,'source data must stay byte-for-byte unchanged');
 const sw=source('dist/sw.js');
 assert.ok(sw.includes('./grade-node-filter.js')&&sw.includes('./data/grade-panorama-lite.json'));
});

test('B: location follows the actual session and task, rejecting stale and unavailable metadata without gates',async()=>{
 const data=JSON.parse(source('dist/data/grade-panorama-lite.json'));
 const host={hidden:true,dataset:{},textContent:''},status={dataset:{},textContent:'任务 1 / 3'};
 const doc={getElementById:id=>id==='workbench-curriculum'?host:id==='status'?status:null};
 const native={sessionId:'equivalent',topicId:'mt_Ep7TDFuYUa',index:0,view:'task',total:3};
 let finishOld;
 const old=syncWorkbenchLocation(doc,native,()=>new Promise(resolve=>{finishOld=resolve;}));
 assert.equal(host.dataset.state,'loading');
 assert.equal(status.dataset.taskOrdinal,'1');
 await Promise.resolve();
 const bridge={sessionId:'link-decimal-quarters',topicId:'mt_DRlbMok2lT',bridge:true,index:0,view:'task',total:2};
 await syncWorkbenchLocation(doc,bridge,()=>Promise.resolve(data));
 assert.equal(host.dataset.scope,'bridge-target');
 assert.equal(host.dataset.topicId,'mt_DRlbMok2lT');
 assert.equal(status.textContent,'任务 1 / 2');
 finishOld(data);await old;
 assert.equal(host.dataset.sessionId,bridge.sessionId,'late data from prior session cannot relabel current work');
 const existing=syncWorkbenchLocation(doc,{...bridge,index:1},()=>{throw Error('unneeded metadata reload');});
 await existing;assert.equal(status.textContent,'任务 2 / 2');
 status.textContent='操作检查已通过';
 await syncWorkbenchLocation(doc,{...bridge,index:1,view:'summary'},()=>{throw Error('unneeded metadata reload');});
 assert.equal(status.dataset.taskOrdinal,undefined);assert.equal(status.dataset.taskTotal,'2');
 assert.equal(status.textContent,'操作检查已通过','reflection is not an invented next task');
 await syncWorkbenchLocation(doc,native,()=>Promise.reject(Error('source unavailable')));
 assert.equal(host.dataset.state,'unavailable');assert.equal(host.textContent,'知识学段：暂不可读');
 assert.equal(status.textContent,'任务 1 / 3');
 status.textContent='三项已完成';
 await syncWorkbenchLocation(doc,{...native,index:2},()=>{throw Error('unneeded metadata reload');});
 assert.equal(status.textContent,'任务 3 / 3 · 三项已完成');
 assert.equal(syncWorkbenchLocation({getElementById:()=>null},native,()=>{throw Error('standalone should not load');}),undefined);
});

test('V54 readiness overlays the original shared action controller, without answer checks',()=>{
 const cases=[
  [{type:'x-net'},{fold:0,runs:[]},{fold:100,runs:[{guess:true}]}],
  [{type:'x-fracdecompose',required:[[8,8,1]]},{board:{saved:[]}},{board:{saved:[{parts:[1,16]}]}}],
  [{type:'x-rulejump',inputs:[1,50],a:4,b:-1},{board:{rule:[4,3,1],records:[{n:50,result:'203'}]}},{board:{rule:[4,3,1],records:[{n:50,result:'203'},{n:1,result:'7'}]}}],
  [{type:'x-g27-net',rotate:true},{board:{parts:[0,1,2,3],fold:100,prediction:'no',turned:false}},{board:{parts:[0,1,2,3],fold:100,prediction:'no',turned:true}}]
 ];
 for(const [task,incomplete,complete] of cases){
  for(const model of [incomplete,complete]){
   const context={task,model,stage:'explore'},before=structuredClone(context);
   assert.deepEqual(studyActionFocusForWorkbench(context),studyActionFocus(context));
   assert.deepEqual(studyActionFocusForWorkbench({...context,v54:false}),studyActionFocus(context));
   assert.equal(studyActionFocusForWorkbench({...context,v54:true}).readyToCheck,model===complete);
   assert.deepEqual(context,before);
  }
 }
 const oldGate={task:{type:'x-g27-net',rotate:true},model:{board:{parts:[0],fold:0,prediction:null,turned:false}}};
 assert.deepEqual(studyActionFocusForWorkbench({...oldGate,v54:true}),studyActionFocus(oldGate));
 const unknown={task:{type:'equivalent'},model:{rows:[]}};
 assert.deepEqual(studyActionFocusForWorkbench({...unknown,v54:true}),studyActionFocus(unknown));
 for(const stage of ['passed','reflect'])
  assert.deepEqual(studyActionFocusForWorkbench({stage,v54:true}),studyActionFocus({stage}));
});

test('V54 four beats distinguish existing pristine and edited work without making a gate',async()=>{
 await ensureB39Ready();
 const entries=[
  ...Object.entries(TASKS).flatMap(([id,tasks])=>tasks.map((task,i)=>[id+':'+i,task])),
  ...Object.entries(PRACTICE),
  ...Object.entries(BRIDGES).flatMap(([id,bridge])=>bridge.tasks.map((task,i)=>[id+':'+i,task]))
 ];
 const beat=(task,model,stage='explore')=>workbenchBeat(stage,{v54:true,task,model,initialModel:defaultModel});
 for(const [id,task] of entries){
  const initial=defaultModel(task),before=structuredClone(initial);
  assert.ok(initial,id+' actual initial model');
  assert.equal(beat(task,initial),'read',id+' initial model shows read: '+task.type);
  assert.deepEqual(initial,before,id+' status is read-only');
 }
 assert.ok(entries.length>500,'cover configured native, practice and linked work, not mock types');
 console.log(JSON.stringify({v54ReadBeatInitialModels:entries.length}));
 const line=TASKS.equivalent[1],lineModel=defaultModel(line);
 lineModel.mark=3;
 assert.equal(beat(line,JSON.parse(JSON.stringify(lineModel))),'try','restored wrong draft is still work');
 assert.equal(workbenchBeat('explore',{task:line,model:lineModel,initialModel:defaultModel}),'try','old layout unchanged');
 const frac=TASKS.splitfraction[0],fracModel=defaultModel(frac);
 fracModel.equation='3/8=1/8+2/8';
 assert.equal(beat(frac,fracModel),'try','typed work before saving');
 const net=TASKS.foldprism[1],netModel=defaultModel(net);
 const forbidden=()=>{throw Error('random initializer must not be called');};
 assert.equal(workbenchBeat('explore',{v54:true,task:net,model:netModel,initialModel:forbidden}),'read');
 const stochastic=entries.filter(([,t])=>['x-experiment','x-spinner','x-simulation','x-p22-mapping'].includes(t.type));
 assert.ok(stochastic.length>=4);
 for(const [id,t] of stochastic){
  const m=defaultModel(t);
  assert.equal(workbenchBeat('explore',{v54:true,task:t,model:m,initialModel:forbidden}),'read',id);
 }
 for(const stage of ['revise','recheck','passed','reflect'])assert.equal(beat(frac,fracModel,stage),stage==='reflect'?'record':'check');
 assert.equal(beat({type:'future-unknown'},{seed:10}),'try','unknown seeded model does not guess');
});

test('V54 sampling readiness counts original completed operations, never final answers',()=>{
 const cases=[
  [{type:'x-samplelab',runs:5,mode:'proportion'},{board:{runs:[{}],pending:{}}},{board:{runs:Array(5).fill({estimate:99}),pending:null},answers:['wrong']}],
  [{type:'x-samplelab',runs:1,mode:'mean'},{board:{runs:[],pending:null}},{board:{runs:[{estimate:99}],pending:null},answers:['wrong']}],
  [{type:'x-experiment',count:20},{draws:[0]},{draws:Array(20).fill(0),counts:[0,20],comparison:'lower'}],
  [{type:'x-simulation'},{runs:Array.from({length:14},(_,i)=>({n:[10,100,1000][Math.floor(i/5)]}))},{runs:[10,100,1000].flatMap(n=>Array.from({length:5},()=>({n,hits:0}))),trend:'exact',guarantee:'yes'}],
  [{type:'x-p22-experiment',targets:[10,100]},{board:{started:true,checkpoints:[10]}},{board:{started:true,checkpoints:[10,100]},rate:'2',answers:['wrong']}]
 ];
 for(const [task,incomplete,complete] of cases){
  for(const model of [incomplete,complete]){
   const context={task,model,stage:'explore'},before=structuredClone(context);
   assert.deepEqual(studyActionFocusForWorkbench(context),studyActionFocus(context));
   assert.equal(studyActionFocusForWorkbench({...context,v54:true}).readyToCheck,model===complete);
   assert.deepEqual(context,before);
  }
 }
 // Mapping itself has a correctness-dependent execution gate in the original
 // widget; never add a blanket gate here. An unreviewed type keeps its contract.
 const mapping={stage:'explore',task:{type:'x-p22-mapping',targetRuns:50},model:{board:{selected:[9],runs:[],pending:[]}}};
 assert.deepEqual(studyActionFocusForWorkbench({...mapping,v54:true}),studyActionFocus(mapping));
});
test('V54 initial readiness inventory: classify every configured task position; unreviewed types retain their original path',async()=>{
 await ensureB39Ready();
 const reviewed=new Set(['x-net','x-g27-net','x-fracdecompose','x-rulejump','x-samplelab','x-experiment','x-simulation','x-p22-experiment']);
 const inventory={};
 const all=[
  ...Object.entries(TASKS).flatMap(([id,tasks])=>tasks.map((task,i)=>({task,kind:'native',id,index:i}))),
  ...Object.entries(PRACTICE).map(([id,task])=>({task,kind:'practice',id,index:-1})),
  ...Object.entries(BRIDGES).flatMap(([id,bridge])=>bridge.tasks.map((task,i)=>({task,kind:'bridge',id,index:i})))
 ];
 for(const {task,kind,id,index} of all){
  const model=defaultModel(task),context={stage:'explore',task,model};
  const original=studyActionFocus(context),v54=studyActionFocusForWorkbench({...context,v54:true});
  const row=inventory[task.type]??={native:0,practice:0,bridge:0,originallyLocked:0,additionalInitialLocks:0,reviewedOverlay:reviewed.has(task.type)};
  row[kind]++;
  if(!original.readyToCheck)row.originallyLocked++;
  if(original.readyToCheck&&!v54.readyToCheck)row.additionalInitialLocks++;
  if(!reviewed.has(task.type)||!original.readyToCheck)assert.deepEqual(v54,original,id+':'+index+' shared readiness must stay unchanged');
 }
 const types=Object.keys(inventory).sort(),pending=types.filter(t=>!inventory[t].reviewedOverlay&&!inventory[t].originallyLocked);
 const counts=kind=>all.filter(x=>x.kind===kind).length;
 console.log(JSON.stringify({v54ReadinessInventory:{native:counts('native'),practice:counts('practice'),bridge:counts('bridge'),types:types.length,overlayTypes:types.filter(t=>inventory[t].reviewedOverlay).map(t=>({type:t,...inventory[t]})),existingInitialGateTypes:types.filter(t=>inventory[t].originallyLocked),unreviewedTypes:pending,scope:'initial UI gate inventory only; not a source or interaction verdict; P03 contextual gate not counted'}}));
});

test('V54 active process owns guidance without changing a saved Check or old path',()=>{
 const task={type:'x-net'},cells=[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]];
 const cases=[
  [{cells:[],guess:null,fold:0,runs:[]},'先画出六个相连的方格。'],
  [{cells,guess:null,fold:0,runs:[]},'先判断这张纸能否合成盒子。'],
  [{cells,guess:false,fold:0,runs:[]},'点击「试着合起来」，观察纸片。'],
  [{cells,guess:false,fold:27,runs:[{}]},'继续合拢，观察纸片是否重叠。']
 ];
 for(const [model,cue] of cases){
  const context={stage:'recheck',task,model},before=structuredClone(context);
  const focus=studyActionFocusForWorkbench({...context,v54:true});
  assert.equal(focus.readyToCheck,false);assert.equal(focus.cue,cue);
  const p=workbenchProcessPresentation({...context,v54:true,focus});
  assert.deepEqual(p,{hideHistoricalFeedback:true,hideHistoricalExplanation:true,hideNext:true,hidePassedCue:false,lockCue:cue});
  assert.equal(workbenchProcessPresentation({...context,v54:true,focus,hasFeedback:true}).hideHistoricalFeedback,false,'explicit help remains available');
  assert.deepEqual(context,before);
  assert.deepEqual(studyActionFocusForWorkbench(context),studyActionFocus(context));
 }
 const focus=studyActionFocusForWorkbench({v54:true,stage:'recheck',task,model:{cells,guess:false,fold:100,runs:[{}]}});
 assert.equal(focus.readyToCheck,true);
 assert.equal(workbenchProcessPresentation({v54:true,stage:'recheck',task,focus}).hideHistoricalFeedback,false);
 assert.equal(workbenchProcessPresentation({stage:'recheck',task,focus:{readyToCheck:false}}).hideNext,false);
 assert.equal(workbenchProcessPresentation({v54:true,stage:'passed',task}).hidePassedCue,true);
 assert.equal(workbenchProcessPresentation({v54:true,stage:'passed',task:{type:'match'}}).hideNext,false);
});
