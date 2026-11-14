import pvbench from './fixtures/p9-pvbench-cases.cjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import expansion from './fixtures/p9-mature-expansion-cases.cjs';
import route from './fixtures/p9-route-cases.cjs';
import angle from './fixtures/p9-angle-cases.cjs';
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
   ...pvbench.cases.map(({id,index})=>'native:'+id+':'+index),
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
 assert.deepEqual(a.map(r=>r.id),exact,'only the 270 reviewed native tasks reach A');
 assert.equal(new Set(a.map(r=>r.nodeId)).size,109);
 assert.deepEqual(Object.fromEntries(['sequence','array','line','counterexample','fraction','unitwalk','place','groupwalk','route','fraction-order','groups','transform','angle','pvbench'].map(id=>
   [id,a.filter(r=>r.evidenceAdapter===id).length])),{sequence:16,array:49,line:10,counterexample:2,fraction:13,unitwalk:18,place:35,groupwalk:6,route:15,'fraction-order':20,groups:29,transform:23,angle:23,pvbench:11});
 assert.deepEqual(Object.fromEntries(Object.entries(read('summary.json').evidenceLevelsNative).map(([level,s])=>
   [level,s.tasks])),{A:270,B:248,C:150,D:1175,E:153});
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
