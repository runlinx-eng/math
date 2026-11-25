import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {learningActionPlan,studyActionFocus} from '../dist/learning/workspace-flow.js';
import {WORKBENCH_BEATS,workbenchBeat,syncWorkbenchScroll,closeWorkbenchDrawer,describeWorkbenchCurriculum,syncWorkbenchLocation} from '../dist/learning/workbench-presentation.js';
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
