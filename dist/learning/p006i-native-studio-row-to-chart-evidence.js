// #342 / P006i: source-bound B19 simulated rows -> counts -> chart -> bounded report.
// An event replay, not a claim about actual respondents, free prose or strict A.
import * as native from './phase5/b19-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as exact,sameEvidence as same} from './evidence-contract.js';

const CASES=[
 {id:'studyplan',index:1,node:'mt_SHVyE1CLUa',
  prompt:'这8份模拟记录问的是同一个上学日前夜。选一种表示，回答这组人记录的睡眠时长有什么不同。',
  title:'这组记录的上学日前夜睡眠时长',
  column:'时长（小时）',question:'昨晚入睡到今天起床约几小时？按整小时记录。',
  labels:['7','8','9','10'],values:['8','9','8','7','9','8','10','9'],
  who:'这组模拟参与者',when:'同一个上学日前夜',formula:false},
 {id:'betterquestion',index:1,node:'mt_O-U263ukg1',
  prompt:'把“大家喜欢运动吗”具体到一周和一组人。记录这10份模拟回答，再说说下一次怎样问得更可靠。',
  title:'这组人上周参加有组织运动的小时数',
  column:'运动时间（小时）',question:'上周一到周日，参加有组织运动约几小时？按整小时记录。',
  labels:['0','1','2','3','4'],values:['0','2','1','3','2','4','1','2','0','3'],
  who:'这10位模拟兴趣小组成员',when:'上周一到周日',formula:true}
];
const taskKeys=['type','prompt','title','cols','rows','analysis','unit',
 'who','when','how','formula','charts','numeric'];
const frequencies=s=>s.labels.map(label=>s.values.filter(value=>value===label).length);
const extremes=(counts,which)=>counts.flatMap((v,i)=>v===(which==='max'?
 Math.max(...counts):Math.min(...counts))?[i]:[]);
const fieldKeys=t=>Object.keys(native.fieldValues(t));
const eq=(v,w)=>same(v,w);
function original(s,t,ctx){
 if(!s||!matchesNativeEvidenceTask(t,ctx,{type:'x-datastudio',nodeId:s.node})||
    !exact(t,taskKeys)||t.prompt!==s.prompt||t.title!==s.title||
    t.unit!=='人'||t.numeric!==true||t.analysis!==0||
    t.who!==s.who||t.when!==s.when||t.how!=='每人独立回答一次'||
    t.formula!==s.formula||!eq(t.charts,['bar','dot','table'])||
    !eq(t.cols,[{label:s.column,question:s.question,values:s.labels}])||
    !eq(t.rows,s.values.map((value,i)=>({
     id:'R'+String(i+1).padStart(2,'0'),day:'同一次收集',values:[value]
    }))))return false;
 return true;
}
export function nativeStudioRowChartBinding(task,context={}){
 if(!isEvidenceContext(context))return null;
 const s=CASES.find(x=>x.id===context.sessionId&&x.index===context.index);
 return original(s,task,context)?{
  position:s.id+':'+s.index,sourceNodeId:s.node,rowCount:s.values.length,
  frequencyLabels:[...s.labels],formula:s.formula
 }:null;
}
export function replayNativeStudioRowChart(task,model,context={}){
 try{
  const binding=nativeStudioRowChartBinding(task,context);
  if(!binding||!model)return null;
  const s=CASES.find(x=>x.id===context.sessionId&&x.index===context.index);
  const frequenciesExpected=frequencies(s),max=extremes(frequenciesExpected,'max'),
   min=extremes(frequenciesExpected,'min'),
   gap=Math.max(...frequenciesExpected)-Math.min(...frequenciesExpected);
  const defaults=native.fieldValues(task),keys=fieldKeys(task),events=model.history;
  const allowed=new Set(['questions','scope','reason','draft','entry','counts',
   'formulas','total','chart','title','xaxis','yaxis','gap','limit','improve',
   'finding1','finding2']);
  if(!exact(model,[...keys,'board','history','issue'])||!Array.isArray(events)||
     model.issue!==''||!native.valid(task,model)||!native.inspect(task,model).correct||
     !events.length||!eq(model.board.rows,s.values.map(value=>[value]))||
     model.board.stage!==4||!eq(model.board.table?.counts,frequenciesExpected)||
     !eq(model.board.heights,frequenciesExpected)||
     model.board.table?.total!==s.values.length||
     !eq(model.board.max,max)||!eq(model.board.min,min)||
     model.board.report?.gap!==gap||model.board.report?.scope!=='records'||
     model.board.report?.meaningAssessed!==false||
     model.board.plot?.chart!=='bar'||model.board.plot?.reason!=='compare'||
     !eq(model.board.plot?.counts,frequenciesExpected)||
     !eq(model.board.plot?.x,s.column)||model.board.plot?.y!=='人')return null;
  for(const e of events){
   if(!exact(e,['a','d','f'])||!exact(e.f,keys)||
      !keys.filter(k=>!allowed.has(k)).every(k=>eq(e.f[k],defaults[k])))return null;
  }
  let i=0,planCount=0;
  const step=(action,data={})=>{
   const e=events[i++];
   return e&&e.a===action&&exact(e.d,Object.keys(data))&&eq(e.d,data)?e:null;
  };
  const first=step('plan');
  if(!first||!eq(first.f.questions,['clear'])&&!eq(first.f.questions,['lead'])||
     first.f.scope!=='defined'||first.f.reason!=='consistent')return null;
  planCount=1;
  let correction=false;
  if(first.f.questions[0]==='lead'){
   const corrected=step('plan');
   if(!corrected||!eq(corrected.f.questions,['clear'])||
      corrected.f.scope!=='defined'||corrected.f.reason!=='consistent'||
      corrected.f.draft!==first.f.draft)return null;
   planCount=2;correction=true;
  }
  for(let row=0;row<s.values.length;row++){
   const e=step('record');
   if(!e||!eq(e.f.entry,[s.values[row]])||
      !eq(e.f.questions,['clear'])||e.f.scope!=='defined'||
      e.f.reason!=='consistent')return null;
  }
  const table=step('table');
  if(!table||table.f.total!==String(s.values.length)||
     !eq(table.f.questions,['clear'])||table.f.scope!=='defined')return null;
  if(s.formula){
   const expected=s.labels.map(label=>
    '=COUNTIF(B2:B'+(s.values.length+1)+',"'+label+'")');
   if(!eq(table.f.formulas,expected))return null;
  }else if(!eq(table.f.counts,frequenciesExpected.map(String)))return null;
  for(let label=0;label<frequenciesExpected.length;label++)
   for(let k=0;k<frequenciesExpected[label];k++){
    const e=step('bar',{index:String(label),delta:'1'});
    if(!e||e.f.chart!=='bar'||e.f.title!=='question'||
       e.f.xaxis!=='variable'||e.f.yaxis!=='frequency'||
       e.f.reason!=='compare')return null;
   }
  const plot=step('plot');
  if(!plot||plot.f.chart!=='bar'||plot.f.title!=='question'||
     plot.f.xaxis!=='variable'||plot.f.yaxis!=='frequency'||
     plot.f.reason!=='compare'||plot.f.scope!=='defined')return null;
  for(const index of max)if(!step('max',{index:String(index)}))return null;
  for(const index of min)if(!step('min',{index:String(index)}))return null;
  const report=step('report');
  if(!report||i!==events.length||report.f.total!==String(s.values.length)||
     report.f.gap!==String(gap)||report.f.scope!=='records'||
     !['sample','time','recall'].includes(report.f.limit)||
     !['repeat','wider','precise'].includes(report.f.improve)||
     !eq(model.board.report.max,max)||!eq(model.board.report.min,min)||
     !eq(model.board.report.limit,report.f.limit)||
     !eq(model.board.report.improve,report.f.improve)||
     !keys.every(k=>eq(model[k],report.f[k]))||
     !eq(model.board.first.plan,first.f))return null;
  return{
   kind:'b19-native-studio-row-frequency-chart',
   originalPosition:binding.position,sourceNodeId:binding.sourceNodeId,
   sourceRowCount:s.values.length,independentFrequencyCounts:frequenciesExpected,
   frequencyTotal:frequenciesExpected.reduce((a,b)=>a+b,0),maximumCategoryIndices:max,
   minimumCategoryIndices:min,maximumMinusMinimum:gap,
   observedPlanClicks:planCount,wrongQuestionThenCorrectionObserved:correction,
   observedSourceRowRecordClicks:s.values.length,
   observedUnitBarClicks:frequenciesExpected.reduce((a,b)=>a+b,0),
   observedTableAndPlotClicks:true,observedBoundedReport:true,
   tableCalculation:s.formula?'source-scoped-countif':'independent-category-count',
   originalSimulatedRowsOnly:true,realRespondentsObserved:false,
   freeProseMeaningAssessed:false,representativenessVerified:false,
   causalInferenceVerified:false,longTermMasteryAssessed:false,strictAApproved:false
  };
 }catch{return null;}
}
export function submittedNativeStudioRowChart(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?
  replayNativeStudioRowChart(task,model,context):null;
}
