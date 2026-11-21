// #342 P006c: three native B19 simulated tally scopes; isolated development evidence.
import * as native from './phase5/b19-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as exact,sameEvidence as same} from './evidence-contract.js';

const CASES=[
 {id:'playgroundstudy',index:1,node:'mt_kxeuXm6EyC',scope:'third-day-playground-use-events',
  task:{type:'x-datacount',labels:['秋千','滑梯','攀爬架'],counts:[2,1,1],
   prompt:'只看第三天的4次使用。和三天合起来的问题相比，回答的范围变了。',
   unit:'次使用',compare:[0,1],scope:'visits'}},
 {id:'measurestory',index:0,node:'mt_6gpryAnpoZ',scope:'observations-represented-by-four-rows',
  task:{type:'x-datacount',labels:['A','B','C','D'],counts:[3,7,6,4],
   prompt:'频数表只有4行，每一行代表多条观察。搭出各行的数量，再数一共多少条。',
   unit:'条观察',compare:[0,1]}},
 {id:'ownstudy',index:2,node:'mt_Y6JmLjnfRP',scope:'one-column-of-fifteen-simulated-respondents',
  task:{type:'x-datacount',labels:['0小时','1小时','2小时','3小时'],counts:[3,6,4,2],
   prompt:'15人各答3题，总共45个值。现在只整理时长这一列，总数应该是什么？',
   unit:'人',compare:[0,1],extremes:true}}
];
const sorted=a=>a.slice().sort((x,y)=>x-y);
export function nativeFrequencyScopesBinding(task,context={}){
 if(!isEvidenceContext(context))return null;
 const spec=CASES.find(s=>s.id===context.sessionId&&s.index===context.index);
 if(!spec||!matchesNativeEvidenceTask(task,context,{type:'x-datacount',nodeId:spec.node})||
    !exact(task,Object.keys(spec.task))||!same(task,spec.task))return null;
 return {position:spec.id+':'+spec.index,nodeId:spec.node,scope:spec.scope};
}
export function replayNativeFrequencyScopes(task,model,context={}){
 try{
  const binding=nativeFrequencyScopesBinding(task,context);
  if(!binding||!model||!exact(model,[...Object.keys(native.fieldValues(task)),
      'board','history','issue'])||!exact(model.board,['first','counts','pairs','max','min'])||
     !same(model.board.first,{})||model.issue!==''||!native.valid(task,model)||
     !native.inspect(task,model).correct||!Array.isArray(model.history))return null;
  const count=task.counts,expectedTotal=count.reduce((a,b)=>a+b,0);
  const expectedGap=Math.abs(count[task.compare[0]]-count[task.compare[1]]);
  const expectedFields={...native.fieldValues(task),total:String(expectedTotal),
   gap:String(expectedGap),scope:task.scope||''};
  const originalFields=native.fieldValues(task),keys=Object.keys(originalFields);
  if(!keys.every(k=>same(model[k],expectedFields[k])))return null;
  const maxExpected=task.extremes?native.extremes(count,'max'):[];
  const minExpected=task.extremes?native.extremes(count,'min'):[];
  const tallies=count.map(()=>0),chosenMax=[],chosenMin=[];
  const expectedEvents=expectedTotal+maxExpected.length+minExpected.length;
  if(model.history.length!==expectedEvents)return null;
  let phase='tally';
  for(const e of model.history){
   if(!exact(e,['a','d','f'])||!exact(e.f,keys)||
      !keys.every(k=>same(e.f[k],originalFields[k])))return null;
   if(e.a==='bar'){
    if(phase!=='tally'||!exact(e.d,['index','delta'])||
       !/^(0|[1-9][0-9]*)$/.test(e.d.index)||e.d.delta!=='1')return null;
    const i=Number(e.d.index);
    if(!Number.isSafeInteger(i)||i>=count.length||++tallies[i]>count[i])return null;
    continue;
   }
   if(!same(tallies,count)||!task.extremes||!exact(e.d,['index'])||
      !/^(0|[1-9][0-9]*)$/.test(e.d.index))return null;
   phase='extremes';
   const i=Number(e.d.index);
   if(e.a==='max'&&maxExpected.includes(i)&&!chosenMax.includes(i))chosenMax.push(i);
   else if(e.a==='min'&&minExpected.includes(i)&&!chosenMin.includes(i))chosenMin.push(i);
   else return null;
  }
  if(!same(tallies,count)||!same(model.board.counts,tallies)||
    !same(model.board.max,maxExpected)||!same(model.board.min,minExpected)||
     model.board.pairs!==0||!same(sorted(chosenMax),maxExpected)||
     !same(sorted(chosenMin),minExpected))return null;
  return {kind:'b19-native-simulated-frequency-by-scope',
   originalPosition:binding.position,sourceNodeId:binding.nodeId,
   statisticalScope:binding.scope,unit:task.unit,
   simulatedCounts:tallies,originalIncrementEvents:expectedTotal,
   independentlyCountedTotal:expectedTotal,independentCategoryDifference:expectedGap,
   originalMaxSelections:sorted(chosenMax),originalMinSelections:sorted(chosenMin),
   originalDistinctRespondentsObserved:false,actualChildrenSurveyed:false,
   outsideSampleInferenceAssessed:false,freeExplanationAssessed:false,
   longTermMasteryAssessed:false,strictAApproved:false};
 }catch{return null;}
}
export function submittedNativeFrequencyScopes(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?
  replayNativeFrequencyScopes(task,model,context):null;
}
