// #342 P052: 1 original legacy cup-fraction matching task, not any same-widget sibling.
// Only the final 3 actual water heights and submitted decimal names are observable.
// No fabricated height-slider chronology, real liquid measuring, or formal-A claim.
import {defaultModel,validModel,inspect} from './tasks.js';
import {isEvidenceContext,hasExactKeys,matchesNativeEvidenceTask,
 sameEvidence,latestSubmissionMatches} from './evidence-contract.js';
const SOURCE=Object.freeze({
 sessionId:'quarters',index:1,type:'match',nodeId:'mt_DRlbMok2lT',
 taskHash:'d8370861bdc5bd23c13d1abb550466a5892dcf202565df613de244d09f57c3fb'
});
const TASK=Object.freeze({
 type:'match',prompt:'给三个直筒杯倒入指定的量，再为它们配上小数名字。',
 fractions:[[1,2],[3,4],[1,4]]
});
export const P052_CUPS_SOURCE=SOURCE;
export function p052CupsBinding(task,context={}){
 if(!isEvidenceContext(context)||context.sessionId!==SOURCE.sessionId||
    context.index!==SOURCE.index||!sameEvidence(task,TASK)||
    !matchesNativeEvidenceTask(task,context,SOURCE))return null;
 return {position:'quarters:1',nodeId:SOURCE.nodeId,type:SOURCE.type,
  taskHash:SOURCE.taskHash,method:null,
  question:'杯中水位与二分之一、四分之三、四分之一的小数名字怎样对应？',
  strictAApproved:false};
}
function thousandths(raw){
 if(typeof raw!=='string'||raw.length>40)return null;
 const match=raw.trim().match(/^(?:(\d+)(?:\.(\d{1,3}))?|\.(\d{1,3}))$/);
 if(!match)return null;
 const digits=match[1]||'0',fraction=(match[2]||match[3]||'').padEnd(3,'0');
 if(digits.length>4)return null;
 return Number(digits)*1000+Number(fraction);
}
export function replayP052CupsEvidence(task,model,context={}){
 try{
  const source=p052CupsBinding(task,context);
  if(!source||!hasExactKeys(model,Object.keys(defaultModel(task)))||
    !validModel(task,model)||!inspect(task,model).correct||
    model.heights.length!==3||model.names.length!==3)return null;
  const observed=[];
  for(let i=0;i<task.fractions.length;i++){
   const [numerator,denominator]=task.fractions[i];
   const height=model.heights[i],name=model.names[i],display=thousandths(name);
   if(!Number.isSafeInteger(height)||height<0||height>100||
     height*denominator!==numerator*100||
     display===null||display*denominator!==numerator*1000)return null;
   observed.push({cupIndex:i,heightPercentage:height,decimalName:name,
    rationalNumerator:numerator,rationalDenominator:denominator});
  }
  return {kind:'p052-original-three-cup-fraction-decimal-matches',source,
   observedCups:observed,originalNativeCheckPassed:true,
   originalHeightMovementChronologyObserved:false,actualWaterMeasurementObserved:false,
   childrenMasteryAssessed:false,strictAApproved:false};
 }catch{return null;}
}
export function submittedP052CupsEvidence(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?
  replayP052CupsEvidence(task,model,context):null;
}
