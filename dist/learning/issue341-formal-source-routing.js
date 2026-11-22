// Inert formal cutover wiring: no production entry imports this module.
// Only an independently approved, explicitly supplied formal manifest can select
// candidate sources. This module does NOT create or sign such a manifest.
import {createIsolatedThinkingFeedback} from './thinking-feedback.js';
import {ISSUE341_NORMALIZED_ADAPTERS,issue341GuideForBinding,
 issue341FeedbackForProof} from './issue341-candidate-feedback.js';
import {ISSUE341_FOLLOWUP_126_ADAPTERS} from './issue341-followup-126-candidates.js';
import {ISSUE341_FOLLOWUP_218_ADAPTERS} from './issue341-followup-218-candidates.js';
import {ISSUE342_A_P006_ADAPTERS} from './issue342-a355-p006-candidates.js';
import {ISSUE342_A_P001_P005_ADAPTERS} from './issue342-a355-next-66-candidates.js';

const allFrozenCandidates=Object.freeze([...ISSUE341_NORMALIZED_ADAPTERS,
 ...ISSUE341_FOLLOWUP_126_ADAPTERS,...ISSUE341_FOLLOWUP_218_ADAPTERS,
 ...ISSUE342_A_P006_ADAPTERS,...ISSUE342_A_P001_P005_ADAPTERS]);
const sourceKey=(sessionId,index)=>JSON.stringify([sessionId,index]);

export function createIssue341ManifestGatedRouting(formalManifest){
 if(formalManifest?.schema!=='math-evidence-reviewed-sources/1'||
    !Array.isArray(formalManifest.tasks))
  throw new TypeError('Explicit reviewed formal manifest required');
 const candidateSources=new Map();
 for(const family of allFrozenCandidates){
  for(const source of family.sources){
   const key=sourceKey(source.sessionId,source.index);
   if(candidateSources.has(key))throw new Error('Overlapping candidate source positions');
   candidateSources.set(key,{family,source});
  }
 }
 const approvedByFamily=new Map(),legacyPositions=new Set(),candidateEntries=[];
 for(const entry of formalManifest.tasks){
  if(!entry||typeof entry!=='object')throw new TypeError('Invalid formal entry');
  if(typeof entry.adapter==='string'&&entry.adapter.startsWith('issue341-'))
   candidateEntries.push(entry);
  else if(typeof entry.sessionId==='string'&&Number.isSafeInteger(entry.index))
   legacyPositions.add(sourceKey(entry.sessionId,entry.index));
 }
 const selectedPositions=new Set();
 for(const entry of candidateEntries){
  if(typeof entry.sessionId!=='string'||!entry.sessionId||
     !Number.isSafeInteger(entry.index)||entry.index<0||
     typeof entry.nodeId!=='string'||typeof entry.type!=='string'||
     typeof entry.taskHash!=='string'||!/^[0-9a-f]{64}$/.test(entry.taskHash)||
     entry.method!==null)
   throw new TypeError('Malformed or unreviewed candidate manifest entry');
  const key=sourceKey(entry.sessionId,entry.index), declared=candidateSources.get(key);
  if(!declared||declared.family.id!==entry.adapter||
     declared.source.nodeId!==entry.nodeId||
     declared.source.type!==entry.type||
     declared.source.taskHash!==entry.taskHash)
   throw new Error('Candidate manifest source does not match frozen original');
  if(legacyPositions.has(key)||selectedPositions.has(key))
   throw new Error('Duplicate or overlapping formal source position');
  selectedPositions.add(key);
  if(!approvedByFamily.has(entry.adapter))approvedByFamily.set(entry.adapter,new Map());
  approvedByFamily.get(entry.adapter).set(key,declared.source);
 }
 // Register each family at most once, but a binding can see only the exact
 // subset explicitly written to the independently approved formal manifest.
 const adapters=allFrozenCandidates.filter(f=>approvedByFamily.has(f.id))
  .map(family=>{
   const allowed=approvedByFamily.get(family.id);
   const sources=Object.freeze([...allowed.values()]);
   const types=Object.freeze([...new Set(sources.map(s=>s.type))]);
   return Object.freeze({...family,types,sources,binding:(task,context)=>{
    if(typeof context?.sessionId!=='string'||!Number.isSafeInteger(context.index))
     return null;
    const approved=allowed.get(sourceKey(context.sessionId,context.index));
    if(!approved||task?.type!==approved.type)return null;
    const original=family.binding(task,context);
    if(!original||original.candidateSource?.nodeId!==approved.nodeId||
       original.candidateSource?.taskHash!==approved.taskHash||
       original.candidateSource?.type!==approved.type)
     return null;
    // This field is only derived from a matching *formal manifest row*.
    return Object.freeze({...original,strictAApproved:true});
   }});
  });
 const routing=createIsolatedThinkingFeedback({adapters,
  guideForBinding:issue341GuideForBinding,
  feedbackForProof:(matched,proof,task,model,record,context)=>{
   const note=issue341FeedbackForProof(matched,proof,task,model,record,context);
   if(!note)return null;
   // The isolated proposal-only marker must not leak into a future
   // independently approved production feedback route.
   const {proposalStatus,candidateFamily,...formalNote}=note;
   return formalNote;
  }
 });
 return Object.freeze({
  approvedPositions:selectedPositions.size,
  approvedFamilies:adapters.length,
  adapters:Object.freeze(adapters),
  ...routing
 });
}
