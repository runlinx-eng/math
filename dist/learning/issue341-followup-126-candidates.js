// B-line follow-up #341 candidates: frozen original source identity, no formal A activation.
// The official manifest and production learner do not import this module.
import {FAMILIES as one} from './issue341-followup-126-families-1.js';
import {FAMILIES as two} from './issue341-followup-126-families-2.js';
import {FAMILIES as three} from './issue341-followup-126-families-3.js';
import {FAMILIES as four} from './issue341-followup-126-families-4.js';
import {FAMILIES as five} from './issue341-followup-126-families-5.js';

export const ISSUE341_FOLLOWUP_126_FAMILIES=Object.freeze([...one,...two,...three,...four,...five]);
export const ISSUE341_FOLLOWUP_126_ADAPTERS=Object.freeze(ISSUE341_FOLLOWUP_126_FAMILIES.map(family=>{
 const byPosition=new Map(family.sources.map(s=>[JSON.stringify([s.sessionId,s.index]),s]));
 return Object.freeze({...family,binding:(task,context)=>{
  if(typeof context?.sessionId!=='string'||!Number.isSafeInteger(context.index))return null;
  const source=byPosition.get(JSON.stringify([context.sessionId,context.index]));
  if(!source||task?.type!==source.type)return null;
  const raw=family.binding(task,context);
  if(!raw||raw.method!=null||(raw.nodeId??raw.sourceNodeId)!==source.nodeId)return null;
  return Object.freeze({...raw,nodeId:source.nodeId,method:null,
   question:typeof raw.question==='string'&&raw.question?raw.question:'哪些保存的记录可以支持这次计算？',
   candidateSource:source,strictAApproved:false});
 }});
}));
const all=ISSUE341_FOLLOWUP_126_FAMILIES.flatMap(f=>f.sources);
if(ISSUE341_FOLLOWUP_126_FAMILIES.length!==35||all.length!==126||
 new Set(all.map(s=>JSON.stringify([s.sessionId,s.index]))).size!==126)
 throw new Error('Incorrect frozen follow-up 126 source cardinality');
