// #342 P041 exact original B08 boundary trials, independent decimal math.
// Bounded to native lower-closed/upper-open rounding intervals; no formal A.
import * as b08 from './phase5/b08-model.js';
import {isEvidenceContext,hasExactKeys,matchesNativeEvidenceTask,
 sameEvidence,latestSubmissionMatches} from './evidence-contract.js';
const frozen=[
 {sessionId:'estbounds',index:1,type:'x-boundinterval',nodeId:'mt_VVn1IXjkzn',
 taskHash:'0736bd85a62fcb4247ee1a2469433c0b64a7fed3b4e77866cdc4be703710bf1a',
 task:{type:'x-boundinterval',value:'12',unit:'1',
 prompt:'长度报为12米，原长可能在哪段？自己写两端，试两次边界，再决定两端包不包括。'}},
 {sessionId:'estbounds',index:2,type:'x-boundinterval',nodeId:'mt_VVn1IXjkzn',
 taskHash:'a95592f3f90890b776091c1c9eec8aae7424251a9783ce5345991220e1a9fc75',
 task:{type:'x-boundinterval',value:'3.2',unit:'0.1',
 prompt:'长度报为3.2米，是按0.1米记录的。找原长范围，亲自测试下端和上端。'}}
];
export const P041_BOUND_SOURCES=Object.freeze(frozen.map(({task,...s})=>Object.freeze({...s,position:s.sessionId+':'+s.index})));
const Q=1000000n;
function ticks(raw){
 if(typeof raw!=='string'&&typeof raw!=='number')return null;
 const s=String(raw);
 if(!/^\d+(?:\.\d{1,6})?$/.test(s))return null;
 const [a,b='']=s.split('.');
 return BigInt(a)*Q+BigInt(b.padEnd(6,'0'));
}
export function p041BoundBinding(task,context={}){
 if(!isEvidenceContext(context))return null;
 const source=frozen.find(s=>s.sessionId===context.sessionId&&s.index===context.index);
 if(!source||!sameEvidence(source.task,task)||!matchesNativeEvidenceTask(task,context,source))return null;
 return {position:source.sessionId+':'+source.index,type:source.type,nodeId:source.nodeId,
  taskHash:source.taskHash,method:null,question:'精度的两个边界分别会被四舍五入到哪里？',
  strictAApproved:false};
}
export function replayP041BoundEvidence(task,model,context={}){
 try{
  const source=p041BoundBinding(task,context);
  if(!source||!hasExactKeys(model,Object.keys(b08.initial(task)))||
    !b08.valid(task,model)||!b08.inspect(task,model).correct)return null;
  const v=ticks(task.value),unit=ticks(task.unit),lower=ticks(model.low),upper=ticks(model.high);
  if(v===null||unit===null||unit<=0n||unit%2n!==0n||lower!==v-unit/2n||
    upper!==v+unit/2n||model.left!=='closed'||model.right!=='open')return null;
  let lowerSeen=false,upperSeen=false;
  if(!Array.isArray(model.trials)||!model.trials.length)return null;
  const checked=[];
  for(const t of model.trials){
   if(!hasExactKeys(t,['value','inside']))return null;
   const x=ticks(t.value);
   if(x===null||typeof t.inside!=='boolean')return null;
   const observedResult=(x/unit)*unit+((x%unit)*2n>=unit?unit:0n);
   const inside=observedResult===v;
   if(t.inside!==inside)return null;
   if(x===lower&&inside)lowerSeen=true;
   if(x===upper&&!inside)upperSeen=true;
   checked.push({value:t.value,inside});
  }
  if(!lowerSeen||!upperSeen)return null;
  return {kind:'p041-native-rounded-interval-endpoint-probes',source,
   lower:model.low,upper:model.high,leftInclusive:true,rightInclusive:false,
   originalOrderedProbeRecords:checked,verifiedProbeCount:checked.length,
   generatedOriginalCheckNotYetApproved:true,freeIntervalProofAssessed:false,
   childrenMasteryAssessed:false,strictAApproved:false};
 }catch{return null;}
}
export function submittedP041BoundEvidence(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?replayP041BoundEvidence(task,model,context):null;
}
