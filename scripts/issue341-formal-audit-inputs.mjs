// Consume original full Check Artifacts already verified by the existing Required workflow.
// Never commit or regenerate learner evidence. Missing or mismatched records fail closed.
import {readFileSync} from 'node:fs';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';
import {ISSUE341_FORMAL_MANIFEST} from '../dist/learning/issue341-formal-admissions.js';
import {createIssue341ManifestGatedRouting} from '../dist/learning/issue341-formal-source-routing.js';
const key=(s,i)=>JSON.stringify([s,i]);
const requireExact=(ok,reason)=>{if(!ok)throw Error('Issue341 original Check: '+reason);};
export function loadIssue341FormalAuditInputs({legacyExampleFor,legacyRecordFor}){
 requireExact(typeof legacyExampleFor==='function'&&typeof legacyRecordFor==='function','missing legacy providers');
 const manifest=JSON.parse(readFileSync(new URL('../docs/spatial-learning/evidence-review-manifest.json',import.meta.url),'utf8'));
 const candidates=manifest.tasks.filter(row=>row.adapter?.startsWith('issue341-'));
 requireExact(manifest.schema===ISSUE341_FORMAL_MANIFEST.schema&&manifest.tasks.length===1652&&
  candidates.length===839&&JSON.stringify(candidates)===JSON.stringify(ISSUE341_FORMAL_MANIFEST.tasks),
  'official manifest and frozen browser snapshot differ');
 const oldRows=JSON.parse(readFileSync(new URL('../verification/issue341-inputs/archived-checks-365.json',import.meta.url),'utf8')).rows;
 const followupRows=JSON.parse(readFileSync(new URL('../verification/issue341-inputs/archived-checks-126.json',import.meta.url),'utf8')).rows;
 const p006Rows=JSON.parse(readFileSync(new URL('../verification/issue341-inputs/archived-checks-p006.json',import.meta.url),'utf8')).rows;
 requireExact(Array.isArray(oldRows)&&oldRows.length===365&&Array.isArray(followupRows)&&followupRows.length===126,
  'original 365+126 frozen Check records missing');
 requireExact(Array.isArray(p006Rows)&&p006Rows.length===31&&
  new Set(p006Rows.map(row=>row.familyId)).size===19,'P006 19 families / 31 original Check records missing');
 const next66Rows=JSON.parse(readFileSync(new URL('../verification/issue341-inputs/archived-checks-p001-p005.json',import.meta.url),'utf8')).rows;
 requireExact(Array.isArray(next66Rows)&&next66Rows.length===66&&
  new Set(next66Rows.map(row=>row.familyId)).size===31,
  'P001-P005 31 original families / 66 distinct saved Check records missing');
 const b218Rows=JSON.parse(readFileSync(new URL('../verification/issue341-inputs/archived-checks-218.json',import.meta.url),'utf8')).rows;
 requireExact(Array.isArray(b218Rows)&&b218Rows.length===218&&
  new Set(b218Rows.map(row=>row.familyId)).size===52,
  'B218 52 original families / 218 exact saved Check records missing');
 for(const row of b218Rows)requireExact(
  row.provenance?.transportOnly===true&&row.provenance?.freshMathOrBrowserReplay===false&&
  Array.isArray(row.record?.attempts)&&row.record.attempts.length>0&&
  JSON.stringify(row.record.attempts.at(-1).value)===JSON.stringify(row.model),
  'B218 original Check source record failed integrity '+row?.source?.position);
 const a258Rows=JSON.parse(readFileSync(new URL('../verification/issue341-inputs/archived-checks-a258-first33.json',import.meta.url),'utf8')).rows;
 requireExact(Array.isArray(a258Rows)&&a258Rows.length===33&&
  new Set(a258Rows.map(row=>row.familyId)).size===4&&
  new Set(a258Rows.map(row=>row.source?.position)).size===33,
  'A258 exact 33 original CI correct-Check records and four math families missing');
 const sourceRows=[...oldRows,...followupRows,...p006Rows,...next66Rows,...b218Rows,...a258Rows];
 requireExact(sourceRows.length===839,'missing full 839 authentic original Check records');
 const byKey=new Map(candidates.map(row=>[key(row.sessionId,row.index),row]));
 const records=new Map();
 for(const row of sourceRows){
  const s=row?.source;
  requireExact(s&&typeof s.sessionId==='string'&&Number.isSafeInteger(s.index),'invalid source');
  const id=key(s.sessionId,s.index),candidate=byKey.get(id);
  requireExact(candidate&&!records.has(id),'missing/duplicate formal source '+id);
  requireExact(row.familyId===candidate.adapter&&s.nodeId===candidate.nodeId&&
   s.type===candidate.type&&s.taskHash===candidate.taskHash&&
   s.position===s.sessionId+':'+s.index,'frozen identity mismatch '+id);
  requireExact(row.model&&row.record&&Array.isArray(row.record.attempts)&&
   row.record.attempts.length>0,'full original Check unavailable '+id);
  records.set(id,row);
 }
 requireExact(records.size===839,'incomplete exact original records');
 for(const row of a258Rows){
  const identity=key(row.source.sessionId,row.source.index);
  requireExact(row.provenance?.transportOnly===true&&
   row.provenance?.freshMathOrBrowserReplay===false&&
   row.provenance?.originalControls===true&&
   /^[a-f0-9]{64}$/.test(row.provenance?.memberSha256??'')&&
   /^[a-f0-9]{64}$/.test(row.provenance?.modelRecordSha256??'')&&
   Array.isArray(row.record?.attempts)&&row.record.attempts.length===2&&
   JSON.stringify(row.record.attempts[0].value)!==JSON.stringify(row.model)&&
   JSON.stringify(row.record.attempts[1].value)===JSON.stringify(row.model),
   'A258 authentic original wrong-correct Check missing '+identity);
 }
 for(const row of next66Rows){
  const identity=key(row.source.sessionId,row.source.index);
  requireExact(row.provenance?.transportOnly===true&&row.provenance?.freshMathematicalEvaluation===false&&
   /^[a-f0-9]{64}$/.test(row.provenance?.memberSha256??'')&&
   /^[a-f0-9]{64}$/.test(row.provenance?.modelRecordSha256??'')&&
   Array.isArray(row.record?.attempts)&&row.record.attempts.length>=2&&
   JSON.stringify(row.record.attempts[0].value)!==JSON.stringify(row.model)&&
   JSON.stringify(row.record.attempts.at(-1).value)===JSON.stringify(row.model),
   'P001-P005 authentic original wrong-correct Check missing '+identity);
 }
 for(const row of p006Rows){
  const identity=key(row.source.sessionId,row.source.index);
  requireExact(row.provenance?.transportOnly===true&&
   row.provenance?.freshMathematicalEvaluation===false&&
   /^[a-f0-9]{64}$/.test(row.provenance?.memberSha256??'')&&
   /^[a-f0-9]{64}$/.test(row.provenance?.modelRecordSha256??'')&&
   Array.isArray(row.record?.attempts)&&row.record.attempts.length>=2&&
   JSON.stringify(row.record.attempts.at(-1).value)===JSON.stringify(row.model)&&
   JSON.stringify(row.record.attempts[0].value)!==JSON.stringify(row.model),
   'P006 true wrong-correct archived Check record unavailable '+identity);
 }
 const route=createIssue341ManifestGatedRouting(ISSUE341_FORMAL_MANIFEST);
 requireExact(route.approvedPositions===839&&route.approvedFamilies===254,'wrong formal routing scope');
 const original=context=>records.get(key(context?.sessionId,context?.index));
 const adapters=[...EVIDENCE_ADAPTERS,...route.adapters.map(adapter=>Object.freeze({...adapter,
  replay:(task,model,context)=>{
   const row=original(context);
   return row?adapter.submitted(task,model,row.record,context):null;
  }
 }))];
 return Object.freeze({
  adapters:Object.freeze(adapters),
  exampleFor:(task,context,adapter)=>original(context)?.model??legacyExampleFor(task,context,adapter),
  recordFor:(task,example,context,adapter)=>original(context)?.record??legacyRecordFor(task,example,context,adapter),
  // Formal candidate feedback uses method:null; existing legacy MP.3 output
  // remains separately covered by original P9 tests and the real UI.
  guideFor:(task,context)=>original(context)?route.guide(task,context):thinkingGuide(task,context),
  feedbackFor:(task,model,record,context)=>original(context)?
   route.feedback(task,model,record,context):thinkingFeedback(task,model,record,context)
 });
}
