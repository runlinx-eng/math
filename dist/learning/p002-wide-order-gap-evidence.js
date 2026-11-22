// #342 / P002: independently checked order + range for two genuine B08 tasks.
// Candidate only: no shared registration, no A promotion, no grader changes.
import * as original from './phase5/b08-model.js';
import {
  isEvidenceContext, matchesNativeEvidenceTask, latestSubmissionMatches,
  hasExactKeys as keys, sameEvidence as same
} from './evidence-contract.js';

const SOURCES=Object.freeze({
  'placeproblems:1':Object.freeze({
    nodeId:'mt__sMrmOv3bx',taskSha256:'fe801fed3d8193d295850adbb8d19aacbdb0c33aee17f0de07f849849b04f1a2',
    prompt:'三个模拟路线长4850、4580、5080米。先排序，再算最长比最短多多少。',
    values:['4850','4580','5080'],min:4000,max:5500,scenario:'simulated-route-lengths',unit:'m'
  }),
  'bigproblems:2':Object.freeze({
    nodeId:'mt_xMt1TLTs--',taskSha256:'7a40c552e48ec98d9918c0eefa90dbb10e81ee3efa896710531eeee20fb6205f',
    prompt:'五座虚构城市的人口卡排队，再算最多与最少相差多少。',
    values:['125430','154230','152430','98000','165000'],min:0,max:200000,
    scenario:'fictional-city-populations',unit:'people'
  })
});
const whole=s=>typeof s==='string'&&/^(0|[1-9]\d{0,14})$/.test(s);
const exactGap=(s,n)=>{
  if(typeof s!=='string'||s.length>120||!/^[+]?(?:0|[1-9]\d*)(?:\.0+)?$/.test(s.trim()))return false;
  try{return BigInt(s.trim().replace(/^\+/, '').split('.')[0])===n;}catch{return false;}
};
function sourceFor(task,context){
  if(!isEvidenceContext(context))return null;
  const source=SOURCES[context.sessionId+':'+context.index];
  if(!source||!matchesNativeEvidenceTask(task,context,{type:'x-wideboard',nodeId:source.nodeId})||
    !keys(task,['type','mode','values','prompt','gap','min','max'])||
    task.mode!=='order'||task.gap!==true||task.prompt!==source.prompt||
    task.min!==source.min||task.max!==source.max||!same(task.values,source.values)||
    !source.values.every(whole))return null;
  return source;
}
export function wideOrderGapBinding(task,context={}){
  const source=sourceFor(task,context);
  return source?{
    nodeId:source.nodeId,kind:'wide-order-gap',method:null,
    question:'按原始数值从小到大排列，并用最大值减最小值求极差。'
  }:null;
}

export function replayWideOrderGapEvidence(task,model,context={}){
  try{
    const source=sourceFor(task,context);
    if(!source||!original.valid(task,model)||!original.inspect(task,model).correct||
      !keys(model,Object.keys(original.initial(task)))||
      !Array.isArray(model.orderTrace)||!model.orderTrace.length||
      model.orderTrace.length>512||model.orderTraceOverflow!==false||
      !model.touched.every(Boolean))return null;
    const pristine=original.initial(task);
    // These order tasks have no original visible digit/word/answer editing step.
    for(const field of ['rows','parts','answers','words','relation','first'])
      if(!same(model[field],pristine[field]))return null;
    const values=source.values.map(v=>BigInt(v));
    const order=[],events=[];
    for(const [step,event] of model.orderTrace.entries()){
      if(!keys(event,['index','kind'])||!Number.isInteger(event.index)||
        event.index<0||event.index>=values.length)return null;
      const at=order.indexOf(event.index);
      const kind=at<0?'pick':'remove';
      if(kind!==event.kind)return null;
      if(at<0)order.push(event.index);else order.splice(at,1);
      events.push({step,kind,index:event.index,after:[...order]});
    }
    const expected=values.map((value,index)=>({value,index}))
      .sort((a,b)=>a.value<b.value?-1:a.value>b.value?1:0).map(x=>x.index);
    if(order.length!==values.length||!same(order,model.order)||!same(order,expected))return null;
    for(let i=1;i<order.length;i++)if(values[order[i-1]]>=values[order[i]])return null;
    const span=BigInt(source.max-source.min),base=BigInt(source.min);
    if(span<=0n)return null;
    const finalAxisPositions=[];
    for(let index=0;index<values.length;index++){
      const position=model.positions[index];
      if(!Number.isSafeInteger(position)||position<0||position>1000)return null;
      const scaled=BigInt(position)*span-1000n*(values[index]-base);
      const absolute=scaled<0n?-scaled:scaled;
      if(absolute>6n*span)return null; // exact rational +/-6 tolerance
      finalAxisPositions.push({index,value:source.values[index],position,
        scaledErrorNumerator:String(absolute),errorDenominator:String(span)});
    }
    // Original +/-6 tolerance can accept swapped/tied close markers.
    for(let i=1;i<order.length;i++)
      if(!(model.positions[order[i-1]]<model.positions[order[i]]))return null;
    const range=values[order.at(-1)]-values[order[0]];
    if(!exactGap(model.gap,range))return null;
    return {
      kind:'wide-order-gap',nodeId:source.nodeId,sessionId:context.sessionId,index:context.index,
      frozenTaskSha256:source.taskSha256,scenario:source.scenario,unit:source.unit,
      originalValuesToolProvided:true,selectedSourceIndices:[...order],
      sortedOriginalValues:order.map(i=>source.values[i]),
      minimum:String(values[order[0]]),maximum:String(values[order.at(-1)]),
      exactRange:String(range),rawRange:model.gap,
      recordedPickRemoveEvents:events,finalAxisPositions,
      strictIncreasingNumericOrder:true,strictIncreasingFinalAxis:true,
      pickRemoveChronologyObserved:true,sliderMovementChronologyObserved:false,
      arithmeticCalculationStepsObserved:false,realWorldMeasurementsVerified:false,
      independentComparisonStrategyAssessed:false,learnerMasteryAssessed:false
    };
  }catch{return null;}
}

export function submittedWideOrderGapEvidence(task,model,record,context={}){
  return latestSubmissionMatches(model,record)?replayWideOrderGapEvidence(task,model,context):null;
}
