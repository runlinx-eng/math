// Standalone follow-up 126 integration gate; intentionally NOT imported by production.
// It cannot grant formal status without explicit exact source rows.
import {createIsolatedThinkingFeedback} from './thinking-feedback.js';
import {ISSUE341_FOLLOWUP_126_ADAPTERS} from './issue341-followup-126-candidates.js';
import {issue341GuideForBinding,issue341FeedbackForProof} from './issue341-candidate-feedback.js';
const key=(sessionId,index)=>JSON.stringify([sessionId,index]);

export function createIssue341Followup126StagedRouting(manifest){
 if(manifest?.schema!=='math-evidence-reviewed-sources/1'||!Array.isArray(manifest.tasks))
  throw new TypeError('Explicit formal source manifest required');
 const universe=new Map();
 for(const family of ISSUE341_FOLLOWUP_126_ADAPTERS)for(const source of family.sources){
  const id=key(source.sessionId,source.index);
  if(universe.has(id))throw new Error('Follow-up source collision');
  universe.set(id,{family,source});
 }
 const allowed=new Map(),chosen=new Set();
 for(const row of manifest.tasks){
  if(!row||typeof row!=='object')throw new TypeError('Invalid manifest entry');
  if(typeof row.adapter!=='string'||!row.adapter.startsWith('issue341-B126-'))continue;
  if(typeof row.sessionId!=='string'||!Number.isSafeInteger(row.index)||row.index<0||
   typeof row.nodeId!=='string'||typeof row.type!=='string'||
   typeof row.taskHash!=='string'||!/^[0-9a-f]{64}$/.test(row.taskHash)||row.method!==null)
   throw new TypeError('Malformed follow-up exact source');
  const id=key(row.sessionId,row.index),frozen=universe.get(id);
  if(!frozen||row.adapter!==frozen.family.id||row.nodeId!==frozen.source.nodeId||
   row.type!==frozen.source.type||row.taskHash!==frozen.source.taskHash)
   throw new Error('Follow-up source identity mismatch');
  if(chosen.has(id))throw new Error('Duplicate follow-up source');
  chosen.add(id);
  if(!allowed.has(frozen.family.id))allowed.set(frozen.family.id,new Map());
  allowed.get(frozen.family.id).set(id,frozen.source);
 }
 const adapters=ISSUE341_FOLLOWUP_126_ADAPTERS.filter(f=>allowed.has(f.id)).map(f=>{
  const selected=allowed.get(f.id),sources=Object.freeze([...selected.values()]);
  return Object.freeze({...f,sources,types:Object.freeze([...new Set(sources.map(s=>s.type))]),
   binding:(task,context)=>{
    if(typeof context?.sessionId!=='string'||!Number.isSafeInteger(context.index))return null;
    const approved=selected.get(key(context.sessionId,context.index));
    if(!approved||task?.type!==approved.type)return null;
    const original=f.binding(task,context);
    if(!original||original.candidateSource?.nodeId!==approved.nodeId||
     original.candidateSource?.type!==approved.type||
     original.candidateSource?.taskHash!==approved.taskHash)return null;
    return Object.freeze({...original,strictAApproved:true});
   }});
 });
 const routing=createIsolatedThinkingFeedback({
  adapters,guideForBinding:issue341GuideForBinding,
  feedbackForProof:(matched,proof,task,model,record,context)=>{
   const text=issue341FeedbackForProof(matched,proof,task,model,record,context);
   if(!text)return null;
   const {proposalStatus,candidateFamily,...bounded}=text;
   return bounded;
  }
 });
 return Object.freeze({selectedPositions:chosen.size,selectedFamilies:adapters.length,
  adapters:Object.freeze(adapters),...routing});
}
