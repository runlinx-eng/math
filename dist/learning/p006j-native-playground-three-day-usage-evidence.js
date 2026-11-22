// #342 / P006j: original B19 three-day equipment usage, exact source rows and event counts.
// Isolated development evidence only. Repeated uses must never be called unique people.
import * as native from './phase5/b19-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as exact,sameEvidence as same} from './evidence-contract.js';

const ID='playgroundstudy', INDEX=0, NODE='mt_kxeuXm6EyC';
const PROMPT='连续看三天午休的操场记录。同一人可以再次出现；统计的是使用次数。逐条记，再亲手搭一张图。';
const TITLE='三天午休器材使用次数';
const LABELS=['秋千','滑梯','攀爬架'];
const VALUES=['秋千','滑梯','秋千','攀爬架','滑梯','秋千',
 '滑梯','秋千','攀爬架','秋千','滑梯','秋千'];
const DAYS=VALUES.map((_,i)=>'第'+(Math.floor(i/4)+1)+'天午休');
const TASK_KEYS=['type','prompt','title','cols','rows','analysis',
 'unit','who','when','how','formula','charts'];
const SOURCE_ROWS=VALUES.map((value,i)=>({
 id:'R'+String(i+1).padStart(2,'0'),day:DAYS[i],values:[value]
}));
const frequency=rows=>LABELS.map(label=>rows.filter(row=>row===label).length);
const dailyCounts=()=>[0,1,2].map(day=>frequency(VALUES.slice(day*4,day*4+4)));
const counts=frequency(VALUES);
const eq=(a,b)=>same(a,b);
const fieldKeys=t=>Object.keys(native.fieldValues(t));

function isOriginal(task,context){
 return isEvidenceContext(context)&&context.sessionId===ID&&context.index===INDEX&&
  matchesNativeEvidenceTask(task,context,{type:'x-datastudio',nodeId:NODE})&&
  exact(task,TASK_KEYS)&&task.prompt===PROMPT&&task.title===TITLE&&
  task.analysis===0&&task.unit==='次使用'&&task.formula===false&&
  task.who==='这处操场三天午休的使用记录'&&
  task.when==='连续三天的午休'&&
  task.how==='每发生一次使用就记一次'&&
  eq(task.charts,['bar'])&&
  eq(task.cols,[{label:'器材',question:'这一次使用的是哪种器材？',values:LABELS}])&&
  eq(task.rows,SOURCE_ROWS);
}
export function nativeThreeDayUsageBinding(task,context={}){
 if(!isOriginal(task,context))return null;
 return {position:'playgroundstudy:0',sourceNodeId:NODE,recordCount:12,
  dayRecordCounts:[4,4,4],categoryLabels:[...LABELS],unit:'次使用'};
}
export function replayNativeThreeDayUsage(task,model,context={}){
 try{
  const binding=nativeThreeDayUsageBinding(task,context);
  if(!binding||!model)return null;
  const keys=fieldKeys(task),defaults=native.fieldValues(task),events=model.history;
  const allowed=new Set(['questions','scope','reason','draft','entry','counts',
   'formulas','total','chart','title','xaxis','yaxis','gap','limit','improve',
   'finding1','finding2']);
  if(!exact(model,[...keys,'board','history','issue'])||
     !Array.isArray(events)||!events.length||model.issue!==''||
     !native.valid(task,model)||!native.inspect(task,model).correct||
     model.board.stage!==4||
     !eq(model.board.rows,VALUES.map(value=>[value]))||
     !eq(model.board.table?.counts,counts)||
     model.board.table?.total!==12||
     !eq(model.board.heights,counts)||
     !eq(model.board.max,[0])||!eq(model.board.min,[2])||
     model.board.report?.gap!==4||
     model.board.report?.scope!=='records'||
     model.board.report?.meaningAssessed!==false||
     model.board.plot?.chart!=='bar'||
     model.board.plot?.reason!=='compare'||
     model.board.plot?.x!=='器材'||model.board.plot?.y!=='次使用'||
     !eq(model.board.plot?.counts,counts))return null;
  for(const event of events){
   if(!exact(event,['a','d','f'])||!exact(event.f,keys)||
      !keys.filter(k=>!allowed.has(k))
       .every(k=>eq(event.f[k],defaults[k])))return null;
  }
  let i=0,plans=0,wrongCorrected=false;
  const step=(action,data={})=>{
   const event=events[i++];
   return event&&event.a===action&&
    exact(event.d,Object.keys(data))&&eq(event.d,data)?event:null;
  };
  const first=step('plan');
  if(!first||!eq(first.f.questions,['lead'])&&!eq(first.f.questions,['clear'])||
     first.f.scope!=='defined'||first.f.reason!=='consistent')return null;
  plans=1;
  if(eq(first.f.questions,['lead'])){
   const corrected=step('plan');
   if(!corrected||!eq(corrected.f.questions,['clear'])||
      corrected.f.scope!=='defined'||corrected.f.reason!=='consistent'||
      corrected.f.draft!==first.f.draft)return null;
   plans=2;wrongCorrected=true;
  }
  for(const value of VALUES){
   const event=step('record');
   if(!event||!eq(event.f.questions,['clear'])||
      !eq(event.f.entry,[value])||event.f.scope!=='defined'||
      event.f.reason!=='consistent')return null;
  }
  const table=step('table');
  if(!table||table.f.total!=='12'||
     !eq(table.f.counts,counts.map(String))||
     !eq(table.f.questions,['clear'])||table.f.scope!=='defined')return null;
  for(let category=0;category<counts.length;category++)
   for(let n=0;n<counts[category];n++){
    const event=step('bar',{index:String(category),delta:'1'});
    if(!event||event.f.chart!=='bar'||event.f.title!=='question'||
       event.f.xaxis!=='variable'||event.f.yaxis!=='frequency'||
       event.f.reason!=='compare')return null;
   }
  const plot=step('plot');
  if(!plot||plot.f.chart!=='bar'||plot.f.title!=='question'||
     plot.f.xaxis!=='variable'||plot.f.yaxis!=='frequency'||
     plot.f.reason!=='compare'||plot.f.scope!=='defined')return null;
  if(!step('max',{index:'0'})||!step('min',{index:'2'}))return null;
  const report=step('report');
  if(!report||i!==events.length||report.f.total!=='12'||
     report.f.gap!=='4'||report.f.scope!=='records'||
     !['sample','time','recall'].includes(report.f.limit)||
     !['repeat','wider','precise'].includes(report.f.improve)||
     !eq(model.board.report.max,[0])||!eq(model.board.report.min,[2])||
     model.board.report.limit!==report.f.limit||
     model.board.report.improve!==report.f.improve||
     !keys.every(k=>eq(model[k],report.f[k]))||
     !eq(model.board.first.plan,first.f))return null;
  return {
   kind:'b19-native-three-day-usage-frequency',
   originalPosition:binding.position,sourceNodeId:NODE,
   observedOriginalRecordClicks:12,
   observedDays:3,observedUsesByDay:[4,4,4],
   independentDayCategoryCounts:dailyCounts(),
   independentFrequencyCounts:[...counts],
   frequencyTotal:12,maximumCategoryIndices:[0],minimumCategoryIndices:[2],
   maximumMinusMinimum:4,observedPlanClicks:plans,
   wrongQuestionThenCorrectionObserved:wrongCorrected,
   observedUnitBarClicks:12,observedTableAndPlotClicks:true,
   observedBoundedReport:true,unit:'usage-events',
   observedUniqueIndividuals:false,uniquePeopleCountInferable:false,
   actualRespondentsObserved:false,representativenessVerified:false,
   freeTextMeaningAssessed:false,causalInferenceVerified:false,
   longTermMasteryAssessed:false,strictAApproved:false
  };
 }catch{return null;}
}
export function submittedNativeThreeDayUsage(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?
  replayNativeThreeDayUsage(task,model,context):null;
}
