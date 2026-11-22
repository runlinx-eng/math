// The proposed registration is an in-memory audit simulation only. Reuse the
// successful original CI captures; never generate replacement mathematics or
// write candidates into the independently approved production manifest.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditEvidenceExpansion} from '../scripts/audit-evidence-expansion.mjs';
import {ISSUE341_CANDIDATE_FAMILIES} from '../dist/learning/issue341-candidate-descriptors.js';
import {ISSUE341_ISOLATED_ADAPTERS,issue341IsolatedRegistry,
 issue341IsolatedGuide,issue341IsolatedFeedback}
 from '../dist/learning/issue341-isolated-integration.js';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const fixtures=JSON.parse(read('../verification/issue341-inputs/archived-checks-365.json'));
const archived=new Map(fixtures.rows.map(row=>[row.source.position,row]));
const position=context=>context.sessionId+':'+context.index;
const proposed=Object.freeze({
 schema:'math-evidence-reviewed-sources/1',
 basis:'PROPOSED #341 contract simulation only; NOT mathematical approval or A admission',
 tasks:Object.freeze(ISSUE341_CANDIDATE_FAMILIES.flatMap(family=>family.sources.map(source=>{
  const original=archived.get(source.position);
  assert.ok(original,'missing preserved original Check: '+source.position);
  assert.equal(original.familyId,family.id);
  assert.equal(original.source.taskHash,source.taskHash);
  return Object.freeze({sessionId:source.sessionId,index:source.index,type:source.type,
   nodeId:source.nodeId,adapter:family.id,taskHash:source.taskHash,method:null});
 })))
});
const exampleFor=(task,context)=>archived.get(position(context))?.model??null;
const recordFor=(task,example,context)=>archived.get(position(context))?.record??null;

function candidateUi(adapters){
 const allowed=new Set(adapters.map(adapter=>adapter.id));
 const selected=(task,context)=>allowed.has(issue341IsolatedRegistry.resolve(task,context).match?.adapter.id);
 return {
  guideFor:(task,context)=>selected(task,context)?issue341IsolatedGuide(task,context):null,
  feedbackFor:(task,model,record,context)=>selected(task,context)?
   issue341IsolatedFeedback(task,model,record,context):null
 };
}
const optionsFor=adapters=>({adapters,
 manifest:{...proposed,tasks:proposed.tasks.filter(row=>adapters.some(adapter=>adapter.id===row.adapter))},
 exampleFor,...candidateUi(adapters)
});

test('proposed113-family/365-position audit accepts archived full Check records without admitting candidates',()=>{
 const officialBefore=read('../docs/spatial-learning/evidence-review-manifest.json');
 const evidenceBefore=JSON.stringify(fixtures.rows);
 const delivered=new Map();
 const report=auditEvidenceExpansion({...optionsFor(ISSUE341_ISOLATED_ADAPTERS),
  recordFor:(task,example,context)=>{
   const record=recordFor(task,example,context);
   if(record)delivered.set(position(context),record);
   return record;
  }
 });
 assert.deepEqual(report.defects,[]);
 assert.equal(report.summary.reviewedTasks,365);
 assert.equal(report.summary.boundTasks,365);
 assert.equal(report.summary.families,113);
 assert.equal(report.summary.nativeTasks,1996);
 assert.equal(report.summary.bridgeTasks,1552);
 assert.equal(report.summary.bridgeBindings,0);
 assert.equal(delivered.size,365);
 assert.ok(report.families.some(family=>family.types.length>1),'multi-widget families participate in the audit');
 for(const row of fixtures.rows){
  assert.ok(delivered.get(row.source.position)===row.record,'preserve the original complete record object');
  if(row.group==='P007')assert.equal(delivered.get(row.source.position).attempts.length,2);
 }
 assert.ok(JSON.stringify(fixtures.rows)===evidenceBefore,'audit must not mutate preserved evidence');
 assert.equal(read('../docs/spatial-learning/evidence-review-manifest.json'),officialBefore);
 assert.equal(JSON.parse(officialBefore).tasks.length,1335);
 assert.match(report.summary.caution,/never grants A classification/);
 console.log('ISSUE341_PROPOSED_AUDIT '+JSON.stringify({
  status:'PASS_PROPOSED_CONTRACT_SIMULATION_NOT_FORMAL_APPROVAL',...report.summary,
  originalArtifactRun:fixtures.sourceRun,originalArtifactHead:fixtures.sourceHead,
  formalStrictAGranted:0,officialManifestTasks:1335
 }));
});

test('omitting the archived record provider keeps P007 two-Check admission fail-closed',()=>{
 const adapter=ISSUE341_ISOLATED_ADAPTERS.find(row=>row.id==='issue341-P007A');
 const report=auditEvidenceExpansion(optionsFor([adapter]));
 assert.equal(report.summary.boundTasks,adapter.sources.length);
 assert.deepEqual(report.defects.map(row=>({kind:row.kind,id:row.id})).sort((a,b)=>a.id.localeCompare(b.id)),
  adapter.sources.map(source=>({kind:'reviewed-ui-binding-missing',id:source.position}))
   .sort((a,b)=>a.id.localeCompare(b.id)),
  'default one-Check records cannot replace the original wrong-to-correct pair');
});

test('multi-type declarations cannot hide a broad native binding from the existing wrong-widget gate',()=>{
 const original=ISSUE341_ISOLATED_ADAPTERS.find(row=>row.id==='issue341-P007A');
 const adapter={...original,types:['__not_the_original_widget__']};
 const report=auditEvidenceExpansion({...optionsFor([adapter]),recordFor});
 for(const source of original.sources){
  assert.ok(report.defects.some(row=>row.id===source.position&&row.kind==='native-binding-wrong-widget'));
  assert.ok(report.defects.some(row=>row.id===source.position&&row.kind==='reviewed-binding-missing-or-changed'));
 }
 assert.equal(report.summary.boundTasks,0);
});
