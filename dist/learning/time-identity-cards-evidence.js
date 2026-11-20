// #331: source-locked preflight for three original B32 time-identity card tasks.
// Not registered for formal A until live browser, artifact and new-main gates pass.
// The cards and labels are tool-supplied; clicking a card does not prove
// independently derived twelve/twenty-four-hour conversion.
import * as native from './phase5/b32-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const CASES=Object.freeze({
 'ampmclock:2':{
  nodeId:'mt_4m8BimI4G5',prompt:'区分中午后的12:20和午夜后的00:20。',
  labels:['中午后 12:20','午夜后 00:20'],
  questions:[{label:'午夜后是',value:'night',kind:'choice',
   options:[['night','00:20'],['noon','12:20']]}]
 },
 'romanclock:2':{
  nodeId:'mt_5J2quSTspi',prompt:'把四个时刻的两种写法对起来。',
  labels:['下午3:20','上午7:05','中午后12:20','午夜后12:20'],
  questions:[
   {label:'下午3:20的24小时写法',value:920,kind:'time24'},
   {label:'上午7:05的24小时写法',value:425,kind:'time24'},
   {label:'中午后12:20的24小时写法',value:740,kind:'time24'},
   {label:'午夜后12:20的24小时写法',value:20,kind:'time24'}
  ]
 },
 'clockconvert:2':{
  nodeId:'mt_WfrE_4r-kY',prompt:'看看午夜后和中午后的12点。',
  labels:['午夜后 12:20','中午后 12:20'],
  questions:[
   {label:'午夜后12:20',value:20,kind:'time24'},
   {label:'中午后12:20',value:740,kind:'time24'}
  ]
 }
});
const number=s=>/^(0|[1-9][0-9]*)$/.test(s)&&Number.isSafeInteger(Number(s))?Number(s):null;
const asTime=(s)=>{
 if(typeof s!=='string')return null;
 const m=/^(上午|下午|中午后|午夜后)\s*(\d{1,2}):(\d{2})$/.exec(s);
 if(!m)return null;
 const h=Number(m[2]),minutes=Number(m[3]);
 if(h>12||minutes>59)return null;
 let hour;
 if(m[1]==='上午'||m[1]==='下午'){
  if(h<1||h>12)return null;
  hour=(h%12)+(m[1]==='下午'?12:0);
 }else if(m[1]==='中午后'){
  if(h!==12)return null;
  hour=12;
 }else{
  if(h!==12&&h!==0)return null;
  hour=0;
 }
 return hour*60+minutes;
};
const parsed24=s=>{
 if(typeof s!=='string')return null;
 const m=/^\s*(\d{1,2}):(\d{2})\s*$/.exec(s);
 if(!m)return null;
 const h=Number(m[1]),minutes=Number(m[2]);
 return h<=23&&minutes<=59?h*60+minutes:null;
};
function sourceFor(task,context){
 if(!isEvidenceContext(context))return null;
 const c=CASES[context.sessionId+':'+context.index];
 if(!c||!matchesNativeEvidenceTask(task,context,{type:'x-t32-units',nodeId:c.nodeId})||
    !keys(task,['type','prompt','parts','questions'])||
    task.prompt!==c.prompt||
    !same(task.parts,c.labels.map(label=>({label})))||
    !same(task.questions,c.questions))return null;
 const values=c.labels.map(asTime);
 if(values.some(v=>v===null))return null;
 if(context.sessionId==='ampmclock'){
  if(values[0]!==740||values[1]!==20||
     parsed24(c.questions[0].options[0][1])!==values[1]||
     parsed24(c.questions[0].options[1][1])!==values[0])return null;
 }else if(c.questions.length!==values.length||
    c.questions.some((q,i)=>q.kind!=='time24'||q.value!==values[i]))return null;
 return {nodeId:c.nodeId,labels:c.labels,values,questions:c.questions};
}
export function timeIdentityCardsBinding(task,context={}){
 const source=sourceFor(task,context);
 return source?{nodeId:source.nodeId,kind:'time-identity-cards',method:null,
  question:'这些是上午、下午、正午后还是午夜后？选过哪些原卡片，两种写法各代表一天中的第几分钟？'}:null;
}
export function replayTimeIdentityCardsEvidence(task,model,context={}){
 try{
  const source=sourceFor(task,context);
  if(!source||!keys(model,['hour','minute','jump','prose','answers','board','history','issue'])||
     model.hour!=='12'||model.minute!=='0'||model.jump!==''||model.issue!==''||
     typeof model.prose!=='string'||model.prose.length>1200||
     !Array.isArray(model.answers)||model.answers.length!==source.questions.length||
     !Array.isArray(model.history)||model.history.length<source.labels.length||
     model.history.length>1200||!native.valid(task,model)||!native.inspect(task,model).correct)return null;
  if(context.sessionId==='ampmclock'){
   if(model.answers[0]!=='night')return null;
  }else if(model.answers.some((answer,i)=>parsed24(answer)!==source.values[i]))return null;
  const board={first:{},bad:false,selected:[]},events=[],picked=new Set();
  for(const [at,e] of model.history.entries()){
   if(!keys(e,['a','i','v'])||e.a!=='unit'||e.v!==''||
      typeof e.i!=='string')return null;
   const index=number(e.i);
   if(index===null||index>=source.labels.length)return null;
   const before=[...board.selected],pos=board.selected.indexOf(index);
   if(pos<0){board.selected.push(index);picked.add(index);}
   else board.selected.splice(pos,1);
   board.selected.sort((a,b)=>a-b);
   events.push({at,index,kind:pos<0?'select':'unselect',
    label:source.labels[index],minuteOfDay:source.values[index],
    before,after:[...board.selected]});
  }
  const expected=source.labels.map((_,i)=>i);
  if(picked.size!==expected.length||!same(board.selected,expected)||!same(board,model.board))return null;
  return {kind:'time-identity-cards',nodeId:source.nodeId,
   sessionId:context.sessionId,index:context.index,
   cards:source.labels.map((label,i)=>({label,minuteOfDay:source.values[i],
    hour24:Math.floor(source.values[i]/60),minute:source.values[i]%60})),
   observedEvents:events,selectedOriginalCardIdentities:[...board.selected],
   originalToggleHistoryReplayed:true,independentTimeNormalizationVerified:true,
   originalCardsToolProvided:true,learnerConversionDerivationAssessed:false,
   independentExplanationAssessed:false,learnerMasteryAssessed:false,method:null};
 }catch{return null;}
}
