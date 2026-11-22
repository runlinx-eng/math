// #342 / P006k: two original B19 simulated survey studios.
// Native row -> full-column COUNTIF -> chart -> bounded finding; no real respondents.
import * as native from './phase5/b19-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as exact,sameEvidence as same} from './evidence-contract.js';

const SAMPLES=[
 {id:'digitalstudy',node:'mt_yrvYKSwSRZ',
  prompt:'先选一个不暗示答案的问题，再逐条录入模拟答卷。用表格数出喜欢每项运动的人数。',
  title:'这组回答里最喜欢的运动',
  cols:[{label:'运动',question:'在这些选项中，你目前最喜欢哪项运动？只选一项。',
   values:['足球','游泳','羽毛球','其他']}],
  values:['足球','游泳','足球','羽毛球','其他','游泳','足球','羽毛球','游泳','足球'],
  unit:'份回答',who:'这组模拟参与者',when:'同一次收集',charts:['bar','table']},
 {id:'ownstudy',node:'mt_Y6JmLjnfRP',
  prompt:'为15份模拟答卷安排三个问题。每次记一人的三条回答，再研究昨天的屏幕时长。',
  title:'这15份回答中的昨天屏幕时长',
  cols:[
   {label:'时长（小时）',question:'昨天使用屏幕总共约几小时？按整小时记录。',
    values:['0','1','2','3']},
   {label:'主要用途',question:'昨天使用屏幕最多用于哪件事？只选一项。',
    values:['学习','游戏','视频','未使用']},
   {label:'主要设备',question:'昨天使用最多的设备是什么？只选一项。',
    values:['平板','手机','电脑','未使用']}],
  values:[[1,'学习','平板'],[2,'游戏','电脑'],[0,'未使用','未使用'],
   [1,'视频','手机'],[3,'游戏','电脑'],[2,'学习','平板'],
   [1,'学习','电脑'],[0,'未使用','未使用'],[2,'视频','手机'],
   [1,'学习','平板'],[3,'视频','手机'],[0,'未使用','未使用'],
   [1,'游戏','平板'],[2,'学习','电脑'],[1,'视频','平板']],
  unit:'人',who:'这15份模拟答卷中的人',when:'记录昨天，今天收集',
  charts:['bar','dot','table'],numeric:true}
];
const sourceRows=s=>s.values.map((v,i)=>({
 id:'R'+String(i+1).padStart(2,'0'),day:'同一次收集',
 values:(Array.isArray(v)?v:[v]).map(String)
}));
function originalTask(s){
 const t={type:'x-datastudio',prompt:s.prompt,title:s.title,cols:s.cols,
  rows:sourceRows(s),analysis:0,unit:s.unit,who:s.who,when:s.when,
  how:'每人独立回答一次',formula:true,charts:s.charts};
 if(s.numeric)t.numeric=true;
 return t;
}
const count=(rows,labels)=>labels.map(label=>rows.filter(r=>r[0]===label).length);
const extrema=(numbers,kind)=>{
 const target=kind==='max'?Math.max(...numbers):Math.min(...numbers);
 return numbers.flatMap((n,i)=>n===target?[i]:[]);
};
const eq=(a,b)=>same(a,b);
const eventFields=t=>Object.keys(native.fieldValues(t));
const editable=new Set(['questions','scope','reason','draft','entry','counts','formulas',
 'total','chart','title','xaxis','yaxis','gap','limit','improve','finding1','finding2']);

function source(task,context){
 if(!isEvidenceContext(context)||context.index!==0)return null;
 const s=SAMPLES.find(item=>item.id===context.sessionId);
 if(!s)return null;
 const expected=originalTask(s);
 return exact(task,Object.keys(expected))&&eq(task,expected)&&
  matchesNativeEvidenceTask(task,context,{type:'x-datastudio',nodeId:s.node})
  ?{s,expected}:null;
}
export function nativeStudioRowFrequencyBinding(task,context={}){
 const hit=source(task,context);
 if(!hit)return null;
 const {s}=hit;
 return {position:s.id+':0',sourceNodeId:s.node,recordCount:s.values.length,
  questionCount:s.cols.length,categoryLabels:[...s.cols[0].values],
  unit:s.unit,syntheticSource:true};
}
export function replayNativeStudioRowFrequency(task,model,context={}){
 try{
  const hit=source(task,context);
  if(!hit||!model)return null;
  const {s,expected}=hit,rows=expected.rows.map(r=>r.values);
  const labels=s.cols[0].values,counts=count(rows,labels),n=rows.length;
  const max=extrema(counts,'max'),min=extrema(counts,'min');
  const gap=Math.max(...counts)-Math.min(...counts);
  const formulas=labels.map(label=>'=COUNTIF(B2:B'+String(n+1)+',"'+label+'")');
  const defaults=native.fieldValues(task),keys=eventFields(task);
  if(!exact(model,[...keys,'board','history','issue'])||
     !Array.isArray(model.history)||!model.history.length||model.issue!==''||
     !native.valid(task,model)||!native.inspect(task,model).correct||
     model.board.stage!==4||!eq(model.board.rows,rows)||
     !eq(model.board.table?.counts,counts)||model.board.table?.total!==n||
     !eq(model.board.table?.formulas,formulas)||
     !eq(model.board.heights,counts)||!eq(model.board.max,max)||
     !eq(model.board.min,min)||model.board.report?.gap!==gap||
     model.board.report?.scope!=='records'||
     model.board.report?.meaningAssessed!==false||
     model.board.plot?.chart!=='bar'||model.board.plot?.reason!=='compare'||
     model.board.plot?.x!==s.cols[0].label||
     model.board.plot?.y!==s.unit||
     !eq(model.board.plot?.counts,counts))return null;
  const events=model.history;
  for(const e of events){
   if(!exact(e,['a','d','f'])||!exact(e.f,keys)||
      !keys.filter(k=>!editable.has(k)).every(k=>eq(e.f[k],defaults[k])))return null;
  }
  let i=0;
  const step=(a,d={})=>{
   const e=events[i++];
   return e&&e.a===a&&exact(e.d,Object.keys(d))&&eq(e.d,d)?e:null;
  };
  const clear=Array(s.cols.length).fill('clear');
  const first=step('plan');
  if(!first||first.f.scope!=='defined'||first.f.reason!=='consistent')return null;
  let corrected=false,plans=1;
  if(eq(first.f.questions,['lead',...clear.slice(1)])){
   const second=step('plan');
   if(!second||!eq(second.f.questions,clear)||second.f.scope!=='defined'||
      second.f.reason!=='consistent'||second.f.draft!==first.f.draft)return null;
   corrected=true;plans++;
  }else if(!eq(first.f.questions,clear))return null;
  for(const expectedRow of rows){
   const event=step('record');
   if(!event||!eq(event.f.entry,expectedRow)||
      !eq(event.f.questions,clear)||event.f.scope!=='defined'||
      event.f.reason!=='consistent')return null;
  }
  const table=step('table');
  if(!table||!eq(table.f.formulas,formulas)||table.f.total!==String(n)||
     !eq(table.f.questions,clear)||table.f.scope!=='defined')return null;
  for(let k=0;k<counts.length;k++)
   for(let click=0;click<counts[k];click++){
    const e=step('bar',{index:String(k),delta:'1'});
    if(!e||e.f.chart!=='bar'||e.f.title!=='question'||
       e.f.xaxis!=='variable'||e.f.yaxis!=='frequency'||e.f.reason!=='compare')return null;
   }
  const plot=step('plot');
  if(!plot||plot.f.chart!=='bar'||plot.f.title!=='question'||
     plot.f.xaxis!=='variable'||plot.f.yaxis!=='frequency'||
     plot.f.reason!=='compare')return null;
  for(const k of max)if(!step('max',{index:String(k)}))return null;
  for(const k of min)if(!step('min',{index:String(k)}))return null;
  const report=step('report');
  if(!report||i!==events.length||report.f.total!==String(n)||
     report.f.gap!==String(gap)||report.f.scope!=='records'||
     !['sample','time','recall'].includes(report.f.limit)||
     !['repeat','wider','precise'].includes(report.f.improve)||
     model.board.report.limit!==report.f.limit||
     model.board.report.improve!==report.f.improve||
     !keys.every(k=>eq(model[k],report.f[k]))||
     !eq(model.board.first.plan,first.f))return null;
  return {kind:'b19-native-studio-row-frequency',originalPosition:s.id+':0',
   sourceNodeId:s.node,observedOriginalRecordClicks:n,
   observedQuestionCount:s.cols.length,observedQuestionCells:n*s.cols.length,
   independentFrequencyCounts:[...counts],frequencyTotal:n,
   maximumCategoryIndices:max,minimumCategoryIndices:min,maximumMinusMinimum:gap,
   observedPlanClicks:plans,wrongQuestionThenCorrectionObserved:corrected,
   observedUnitBarClicks:n,observedTableAndPlotClicks:true,
   observedBoundedReport:true,simulatedRespondentCount:n,
   actualRespondentsObserved:false,uniquePeopleCountInferable:false,
   simulatedData:true,freeTextMeaningAssessed:false,
   representativenessVerified:false,causalInferenceVerified:false,
   longTermMasteryAssessed:false,strictAApproved:false};
 }catch{return null;}
}
export function submittedNativeStudioRowFrequency(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?
  replayNativeStudioRowFrequency(task,model,context):null;
}
