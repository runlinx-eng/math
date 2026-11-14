// Shared admission gates only. Each adapter still owns its mathematical replay.
// These checks neither grade a task nor change the v2 learning record schema.
import {LESSONS} from './catalog.js';
import {BRIDGES,sessionTasks} from './bridges.js';

const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);

// Validate raw JSON types before any source-map property lookup can coerce
// a malformed session or position into a JavaScript property key.
export function isEvidenceContext(context){
 return object(context)&&typeof context.sessionId==='string'&&
  Number.isInteger(context.index)&&context.index>=0;
}

// Keep the existing serialized snapshot comparison, including property order.
// Malformed/cyclic values must fail closed instead of breaking the learning UI.
export function sameEvidence(a,b){
 try{
  const serialized=JSON.stringify(a);
  return typeof serialized==='string'&&serialized===JSON.stringify(b);
 }catch{return false;}
}

export function hasExactKeys(value,keys){
 return object(value)&&Array.isArray(keys)&&
  sameEvidence(Object.keys(value).sort(),[...keys].sort());
}

export function matchesNativeEvidenceTask(task,context,binding){
 if(!object(task)||!isEvidenceContext(context)||!object(binding))return false;
 const {sessionId,index}=context,{type,nodeId}=binding;
 if(typeof sessionId!=='string'||!Number.isInteger(index)||index<0||
    typeof type!=='string'||typeof nodeId!=='string'||task.type!==type||
    !Object.hasOwn(LESSONS,sessionId)||Object.hasOwn(BRIDGES,sessionId)||
    LESSONS[sessionId]?.topicId!==nodeId)return false;
 const original=sessionTasks(sessionId)?.[index];
 return original?.type===type&&sameEvidence(original,task);
}

export function latestSubmissionMatches(model,record){
 if(!object(model)||!object(record)||!Array.isArray(record.attempts)||
    !record.attempts.length||!record.attempts.every(a=>object(a)&&object(a.value)))return false;
 const last=record.attempts.at(-1);
 return object(last)&&object(last.value)&&sameEvidence(last.value,model);
}
