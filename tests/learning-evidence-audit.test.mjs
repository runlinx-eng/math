import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
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
   'native:general34:2','native:general34:3',
   'native:reason34:1','native:tables34:0','native:tables34:2',
    'native:structure34:1','native:tables34:1',
    'native:derivepatterns:0','native:derivepatterns:3','native:derivepatterns:4',
    'native:derivepatterns:5','native:derivepatterns:6'
 ].sort((x,y)=>x.localeCompare(y,'en'));
 const guided=[...exact,'native:structure34:3'].sort((x,y)=>x.localeCompare(y,'en'));
 assert.deepEqual(a.map(r=>r.id),exact,'only the twelve reviewed strict sequence and array tasks reach A');
 assert.deepEqual(rows.filter(r=>r.replayVerified).map(r=>r.id),exact,
   'a shared type or mere history must not become strict process evidence');
 assert.deepEqual(rows.filter(r=>r.optionalThinkingGuide).map(r=>r.id),guided,
   'optional guidance is bounded to reviewed native lesson positions');
 assert.deepEqual(rows.filter(r=>r.thinkingFeedbackBinding).map(r=>r.id),guided,
   'explicit source binding must stay course-specific');
 assert.ok(rows.filter(r=>r.kind==='bridge').every(r=>!r.optionalThinkingGuide&&!r.thinkingFeedbackBinding&&!r.replayVerified));
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
