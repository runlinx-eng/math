import convert from './fixtures/p9-convert-cases.cjs';
import scale from './fixtures/p9-scale-cases.cjs';
import balance from './fixtures/p9-balance-cases.cjs';
import ruler from './fixtures/p9-ruler-cases.cjs';
import unitrefine from './fixtures/p9-unitrefine-cases.cjs';
import unitcover from './fixtures/p9-unitcover-cases.cjs';
import multable from './fixtures/p9-multable-cases.cjs';
import cubeFraction from './fixtures/p9-cubefraction-cases.cjs';
import money from './fixtures/p9-money-cases.cjs';
import order from './fixtures/p9-order-cases.cjs';
import area from './fixtures/p9-area-cases.cjs';
import time from './fixtures/p9-time-cases.cjs';
import pvbench from './fixtures/p9-pvbench-cases.cjs';
import wideShift from './fixtures/p9-wideshift-cases.cjs';
import paperlab from './fixtures/p9-paperlab-cases.cjs';
import mixedaxis from './fixtures/p9-mixedaxis-cases.cjs';
import decimalengine from './fixtures/p9-decimalengine-cases.cjs';
import fracdecompose from './fixtures/p9-fracdecompose-cases.cjs';
import mixedtrade from './fixtures/p9-mixedtrade-cases.cjs';
import fracshare from './fixtures/p9-fracshare-cases.cjs';
import fdpboard from './fixtures/p9-fdpboard-cases.cjs';
import scalechain from './fixtures/p9-scalechain-cases.cjs';
import storyLedger from './fixtures/p9-storyledger-cases.cjs';
import sameFraction from './fixtures/p9-samefraction-cases.cjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import expansion from './fixtures/p9-mature-expansion-cases.cjs';
import route from './fixtures/p9-route-cases.cjs';
import division from './fixtures/p9-division-cases.cjs';
import fractionCase from './fixtures/p9-fractioncase-cases.cjs';
import fractionOperations from './fixtures/p9-fraction-operations-cases.cjs';
import angle from './fixtures/p9-angle-cases.cjs';
import portion from './fixtures/p9-portiongroups-cases.cjs';
import estimate from './fixtures/p9-estimate-cases.cjs';
import joinStory from './fixtures/p9-joinstory-cases.cjs';
import transform from './fixtures/p9-transform-cases.cjs';
import groups from './fixtures/p9-groups-cases.cjs';
import fractionOrder from './fixtures/p9-fraction-order-cases.cjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const path=name=>new URL('../verification/learning-evidence-audit/'+name,import.meta.url);
const read=name=>JSON.parse(readFileSync(path(name),'utf8'));
const run=()=>execFileSync(process.execPath,['scripts/audit-learning-evidence.mjs'],{cwd:root,timeout:120000,encoding:'utf8'});
test('full native and bridge coverage, mutually exclusive stable task IDs',()=>{
 const output=run();
 assert.match(output,/LEARNING_EVIDENCE_AUDIT /);
 const s=read('summary.json'),rows=read('tasks.json').rows;
 assert.equal(s.sourceNodes,587);
 assert.equal(s.sourceEdges,1223);
 assert.equal(s.sourceThinkingNodes,50);
 assert.equal(s.nativeSessions,587);
 assert.equal(s.nativeCoreTasks,1996);
 assert.equal(s.bridgeSessions,776);
 assert.equal(s.bridgeTasks,1552);
 assert.equal(rows.length,3548);
 assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);
 assert.deepEqual(rows.map(r=>r.id),[...rows.map(r=>r.id)].sort((a,b)=>a.localeCompare(b,'en')));
 assert.equal(rows.filter(r=>r.kind==='native').length,1996);
 assert.equal(rows.filter(r=>r.kind==='bridge').length,1552);
 assert.ok(rows.every(r=>r.defaultModelValid&&r.graderCallable&&r.sourceMapped));
 assert.equal(s.uniqueInteractionTypes,read('types.json').rows.length);
 assert.equal(s.validatorFamilies,read('validator-families.json').rows.length);
 assert.equal(Object.values(s.evidenceLevelsNative).reduce((n,v)=>n+v.tasks,0),1996);
 assert.equal(read('types.json').rows.reduce((n,r)=>n+r.native,0),1996);
 assert.equal(read('types.json').rows.reduce((n,r)=>n+r.bridge,0),1552);
});
test('same type never implies replay evidence or cross-course thinking attribution',()=>{
 const rows=read('tasks.json').rows;
 const a=rows.filter(r=>r.evidenceLevel==='A');
 const exact=[
   ...Object.entries({compareheight:[0,1,2],ordermeasure:[0,2],indirectlength:[0,1,2],lengthdifference:[0,1,2]})
    .flatMap(([id,indices])=>indices.map(index=>'native:'+id+':'+index)),
   ...['indirectmass','ordermeasure','precisionunits'].map(id=>'native:'+id+':1'),
   ...[2,3].map(i=>'native:comparecap:'+i),
   ...[0,1].map(i=>'native:cupmeasure:'+i),
   ...[0,1,2].map(i=>'native:timecompare:'+i),
   'native:durationorder:1','native:durationwork:1','native:minuteclock:2',
   // Reviewed B28 plot positions are independent of production source bindings.
   ...Object.entries({measureplot:[0,1,2],quarterplot:[0,1,2],eighthplot:[0,1,2],
    modmoney:[2],modelChoice38:[2]}).flatMap(([id,indices])=>
     indices.map(index=>'native:'+id+':'+index)),
   ...convert.cases.map(({id,index})=>'native:'+id+':'+index),
   ...scale.cases.map(({id:sessionId,index})=>'native:'+sessionId+':'+index),
   ...balance.cases.map(({id:sessionId,index})=>'native:'+sessionId+':'+index),
   ...ruler.cases.map(({id:sessionId,index})=>'native:'+sessionId+':'+index),
   ...unitrefine.cases.map(({id:sessionId,index})=>'native:'+sessionId+':'+index),
   ...unitcover.cases.map(({id:sessionId,index})=>'native:'+sessionId+':'+index),
   ...multable.cases.map(({id:sessionId,index})=>'native:'+sessionId+':'+index),
   ...cubeFraction.cases.map(({id:sessionId,index})=>'native:'+sessionId+':'+index),
   ...money.cases.map(({id:sessionId,index})=>'native:'+sessionId+':'+index),
   ...order.cases.map(({id:sessionId,index})=>'native:'+sessionId+':'+index),
   ...area.cases.map(({sessionId,index})=>'native:'+sessionId+':'+index),
   ...time.cases.map(({sessionId,index})=>'native:'+sessionId+':'+index),
   ...pvbench.cases.map(({id,index})=>'native:'+id+':'+index),
   ...wideShift.cases.map(({sessionId,index})=>'native:'+sessionId+':'+index),
   ...paperlab.cases.map(({sessionId,index})=>'native:'+sessionId+':'+index),
   ...scalechain.cases.map(({sessionId,index})=>'native:'+sessionId+':'+index),
   ...fracdecompose.cases.map(({sessionId,index})=>'native:'+sessionId+':'+index),
   ...mixedtrade.cases.map(({sessionId,index})=>'native:'+sessionId+':'+index),
   ...fracshare.cases.map(({sessionId,index})=>'native:'+sessionId+':'+index),
   ...decimalengine.cases.map(({sessionId,index})=>'native:'+sessionId+':'+index),
   ...mixedaxis.cases.map(({sessionId,index})=>'native:'+sessionId+':'+index),
   ...fdpboard.cases.map(({sessionId,index})=>'native:'+sessionId+':'+index),
   ...storyLedger.cases.map(({sessionId,index})=>'native:'+sessionId+':'+index),
   ...sameFraction.cases.map(({sessionId,index})=>'native:'+sessionId+':'+index),
   ...division.cases.map(({id,index})=>'native:'+id+':'+index),
   ...fractionCase.cases.map(({id,index})=>'native:'+id+':'+index),
   ...fractionOperations.cases.map(({id,index})=>'native:'+id+':'+index),
   ...portion.cases.map(({sessionId,index})=>'native:'+sessionId+':'+index),
   ...estimate.cases.map(({sessionId,index})=>'native:'+sessionId+':'+index),
   ...joinStory.cases.map(({sessionId,index})=>'native:'+sessionId+':'+index),
   ...angle.map(({sessionId,index})=>'native:'+sessionId+':'+index),
   ...transform.cases.map(({sessionId,index})=>'native:'+sessionId+':'+index),
   ...groups.map(({sessionId,index})=>'native:'+sessionId+':'+index),
   ...fractionOrder.map(({id,index})=>'native:'+id+':'+index),
   ...route.cases.map(({id,index})=>'native:'+id+':'+index),
   ...[...expansion.sequence,...expansion.array].map(({id,index})=>'native:'+id+':'+index),
   'native:general34:2','native:general34:3',
   'native:reason34:1','native:tables34:0','native:tables34:2',
    'native:structure34:1','native:tables34:1',
    'native:derivepatterns:0','native:derivepatterns:3','native:derivepatterns:4',
    'native:derivepatterns:5','native:derivepatterns:6',
    'native:geometrynotation:2','native:linemark:1','native:structure34:3',
     'native:argument38:3','native:argument38:4',
    'native:pctIdeas37:0',
    ...[0,1,2].map(i=>'native:ratioProblem37:'+i),
    ...[0,1].map(i=>'native:rateWords37:'+i),
    'native:ratioNotation37:0',
    ...[1,2].map(i=>'native:ratioNotation37:'+i),
    ...[0,2,3].map(i=>'native:rateUnit37:'+i),
    ...[0,1,2].map(i=>'native:convertUnits37:'+i),
    'native:proportion37:2','native:ratioLink37:2',
    ...[0,1].map(i=>'native:proportion37:'+i),
    ...[0,1].map(i=>'native:ratioLink37:'+i),
    ...[0,1].map(i=>'native:recipeScale37:'+i),
    ...[0,1,2].map(i=>'native:ratioShare37:'+i),
    ...[0,1,2].map(i=>'native:ratioDivide37:'+i),
    'native:pctIdeas37:2','native:recipeScale37:2',
    'native:similar37:0','native:similar37:2','native:scaleArea37:0',
    'native:scaleArea37:1','native:scaleArea37:2',
    ...[0,1,2].map(i=>'native:scaleMap37:'+i),
    ...[0,1,2].map(i=>'native:pctChange37:'+i),
    ...[0,1,2].map(i=>'native:fractionOf37:'+i),
    ...[0,1,2].map(i=>'native:lineproperties:'+i),
    ...[0,1,2,3].map(i=>'native:lineorientation:'+i),
    ...[0,1,2].map(i=>'native:recutnames:'+i),
    ...[0,1,2].map(i=>'native:samenames:'+i),
    ...[0,2].map(i=>'native:simplestparts:'+i),
    ...[0,2].map(i=>'native:tenthtohundred:'+i),
    'native:thousandparts:1',
    ...[0,1].map(i=>'native:decimalstops:'+i),
    ...[0,1,2,3].map(i=>'native:lineplaces:'+i),
    ...[0,1,2].map(i=>'native:unitcopies:'+i),
    ...[1,2,3,4].map(i=>'native:wholefractions:'+i),
    'native:translateamount:3','native:storyfraction:2','native:tenpieces:0',
    'native:decimalnames:1','native:fractionmeasure:3',
    ...[0,1].map(i=>'native:mixedrename:'+i),
    ...[0,1,2].map(i=>'native:manycopies:'+i),
    ...[0,1,2].map(i=>'native:repeatfraction:'+i),
    ...[1,2,3,4].map(i=>'native:decimalsum:'+i),
    ...[1,2].map(i=>'native:decimalmeasure3:'+i),
    'native:fractionmeasure:1',
    ...[13,14].map(i=>'native:fractionfour:'+i),
    ...Object.entries({onesbridge:[0,1],tensmove:[3],decadetake:[2],twodigitpair:[0,1],flexhundred:[0,1],oneslarge:[3],tenslarge:[2,3],showwhy:[0,2],fourparts:[2],buildthousand:[0,1,2],columnthree:[1,3],flexthousand:[2,4],columnfour:[1,3],columnlarge:[1,3,4]})
      .flatMap(([id,indices])=>indices.map(i=>'native:'+id+':'+i))
 ].sort((x,y)=>x.localeCompare(y,'en'));
 const guided=[...exact].sort((x,y)=>x.localeCompare(y,'en'));
 assert.deepEqual(a.map(r=>r.id),exact,'only the 759 individually reviewed native tasks reach A');
 assert.equal(new Set(a.map(r=>r.nodeId)).size,282,'B37 proportional steps add two newly reviewed sources');
 assert.deepEqual(Object.fromEntries(['compare','vessels','cupfill','timecompare','ratiopair','ratioshare','ratioshape','ratiosteps','pctchange','fractionparts','rationotation','compoundunits','unitconversions','proportionalsteps','plot','sequence','array','line','counterexample','fraction','unitwalk','place','groupwalk','route','fraction-order','groups','transform','angle','joinstory','estimate','portiongroups','fraction-operations','fractioncase','division','samefraction','storyledger','fdpboard','scalechain','mixedaxis','decimalengine','fracshare','mixedtrade','fracdecompose','paperlab','wideshift','pvbench','time-order','time-parts','time-roman','time-stopwatch','time-steps','area-partition','area-design','area-compare','area-pieces','area-stadium','area-openbox','order','money-coins','money-cart','cubefraction','multable','unitcover','unitrefine','ruler','balance-compare','balance-weigh','scale-analog','scale-digital','convert-exact','convert-given-approximation'].map(id=>
   [id,a.filter(r=>r.evidenceAdapter===id).length])),{compare:11,vessels:3,cupfill:4,timecompare:6,ratiopair:13,ratioshare:6,ratioshape:5,ratiosteps:5,pctchange:3,fractionparts:3,rationotation:2,compoundunits:3,unitconversions:3,proportionalsteps:2,plot:11,sequence:16,array:49,line:10,counterexample:2,fraction:13,unitwalk:18,place:35,groupwalk:6,route:15,'fraction-order':20,groups:29,transform:23,angle:23,joinstory:41,estimate:24,portiongroups:13,'fraction-operations':10,fractioncase:38,division:21,'samefraction':8,storyledger:8,fdpboard:15,scalechain:10,mixedaxis:8,decimalengine:6,fracshare:5,mixedtrade:3,fracdecompose:3,paperlab:12,wideshift:26,pvbench:11,'time-order':5,'time-parts':5,'time-roman':1,'time-stopwatch':3,'time-steps':6,'area-partition':6,'area-design':1,'area-compare':4,'area-pieces':4,'area-stadium':1,'area-openbox':1,order:17,'money-coins':15,'money-cart':13,cubefraction:6,multable:10,unitcover:6,unitrefine:3,ruler:16,'balance-compare':4,'balance-weigh':2,'scale-analog':7,'scale-digital':1,'convert-exact':15,'convert-given-approximation':6});
 assert.deepEqual(Object.fromEntries(Object.entries(read('summary.json').evidenceLevelsNative).map(([level,s])=>
   [level,s.tasks])),{A:759,B:189,C:124,D:844,E:80});
 assert.deepEqual(rows.filter(r=>r.replayVerified).map(r=>r.id),exact,
   'a shared type or mere history must not become strict process evidence');
 assert.deepEqual(rows.filter(r=>r.optionalThinkingGuide).map(r=>r.id),guided,
   'optional guidance is bounded to reviewed native lesson positions');
 assert.deepEqual(rows.filter(r=>r.thinkingFeedbackBinding).map(r=>r.id),guided,
   'explicit source binding must stay course-specific');
 assert.ok(rows.filter(r=>r.kind==='bridge').every(r=>!r.optionalThinkingGuide&&!r.thinkingFeedbackBinding&&!r.replayVerified));
 const placeRows=a.filter(r=>r.evidenceAdapter==='place');
 assert.equal(placeRows.length,35);
 assert.ok(placeRows.every(r=>r.hasHistory&&!r.modelFields.includes('board')&&r.modelFields.includes('counts')&&r.modelFields.includes('remaining')),
   'A depends on independent mathematical replay, not a fabricated board field');
 const unitwalkBridges=rows.filter(r=>r.kind==='bridge'&&r.type==='x-unitwalk');
 assert.equal(unitwalkBridges.length,33);
 assert.ok(unitwalkBridges.every(r=>r.evidenceLevel!=='A'&&!r.evidenceAdapter),
   'all reused unitwalk bridge tasks retain their independent evidence attribution');
 const sequence=rows.find(r=>r.id==='native:tables34:2');
 assert.ok(sequence.hasHistory&&sequence.sourceMapped&&sequence.thinkingFeedbackBinding);
 assert.ok(rows.some(r=>r.type===sequence.type&&r.id!==sequence.id&&!r.replayVerified),
   'a shared type should not inherit sequence-specific replay evidence');
});
test('reruns are byte-for-byte deterministic without touching source tasks',()=>{
 run();
 const files=['summary.json','tasks.json','types.json','validator-families.json','uncertain.json','cross-course-risks.json','REPORT.md'];
 const before=files.map(name=>readFileSync(path(name)));
 run();
 for(let i=0;i<files.length;i++)assert.deepEqual(readFileSync(path(files[i])),before[i],files[i]);
});
