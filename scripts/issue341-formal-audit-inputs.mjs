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
 requireExact(manifest.schema===ISSUE341_FORMAL_MANIFEST.schema&&manifest.tasks.length===1178&&
  candidates.length===365&&JSON.stringify(candidates)===JSON.stringify(ISSUE341_FORMAL_MANIFEST.tasks),
  'official manifest and frozen browser snapshot differ');
 const sourceRows=JSON.parse(readFileSync(new URL('../verification/issue341-inputs/archived-checks-365.json',import.meta.url),'utf8')).rows;
 requireExact(Array.isArray(sourceRows)&&sourceRows.length===365,'missing original 365 full Check records');
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
 requireExact(records.size===365,'incomplete exact original records');
 const route=createIssue341ManifestGatedRouting(ISSUE341_FORMAL_MANIFEST);
 requireExact(route.approvedPositions===365&&route.approvedFamilies===113,'wrong formal routing scope');
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
