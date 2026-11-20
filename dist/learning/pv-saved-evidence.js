// #321: only two source-bound, ordered saved visual representations are proved.
// Original B07 add/remove clicks and form resets are NOT chronological history.
import * as b07 from './phase5/b07-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,sameEvidence as same,hasExactKeys as keys} from './evidence-contract.js';

const SOURCES=Object.freeze({
 'twoproblems:2':{node:'mt_kJGCjnuelW',n:68,forms:['sticks','blocks'],expanded:true},
 'faces100:1':{node:'mt_9L3NQqgqRd',n:63,forms:['blocks','sticks'],chart:100},
 'faces120:1':{node:'mt_QguIGVMB1o',n:112,forms:['sticks','blocks'],firstEnd:[0,11,2,0]},
 'screen1000:0':{node:'mt_HczwO1sr-y',n:347,forms:['blocks','sticks'],expanded:true}
});
const WEIGHTS=[100,10,1,1000],MAX=[10,100,100,1];
const integer=n=>Number.isSafeInteger(n);
const unitArray=u=>Array.isArray(u)&&u.length===4&&u.every((v,i)=>integer(v)&&v>=0&&v<=MAX[i]);
const total=u=>u.reduce((sum,v,i)=>sum+v*WEIGHTS[i],0);
function sourceFor(task,context){
 if(!isEvidenceContext(context))return null;
 const key=context.sessionId+':'+context.index,source=SOURCES[key];
 if(!source||!matchesNativeEvidenceTask(task,context,{type:'x-pvbench',nodeId:source.node})||
    task.fixed===true||task.n!==source.n||!same(task.forms,source.forms)||
    task.saveCount!==undefined||task.exchanges!==undefined||task.start!==undefined||
    task.expanded!==source.expanded&&!(task.expanded===undefined&&source.expanded===undefined)||
    task.chart!==source.chart||
    !(task.firstEnd===undefined&&source.firstEnd===undefined||same(task.firstEnd,source.firstEnd)))return null;
 return source;
}
export function pvSavedBinding(task,context={}){
 const source=sourceFor(task,context);
 return source?{nodeId:source.node,kind:'two-saved-representations',
  method:null,question:'对照两次真正留下的表示：百、十、一各是多少？为什么两份总数相同？'}:null;
}
export function replayPVSavedEvidence(task,model,context={}){
 try{
  const source=sourceFor(task,context);
  if(!source||!keys(model,Object.keys(b07.initial(task)))||!b07.valid(task,model)||
     !b07.inspect(task,model).correct||model.answer!==source.n||
     !Array.isArray(model.history)||model.history.length!==0||
     !Array.isArray(model.saved)||model.saved.length!==2||
     !Array.isArray(model.words)||model.words.length!==0||
     model.mark!==0||model.touched!==false||model.packs!==null||
     model.remainder!==null||model.why!==''||!unitArray(model.u)||
     total(model.u)!==source.n||model.form!==source.forms[1])return null;
  const states=[];
  for(let i=0;i<2;i++){
   const value=model.saved[i];
   if(!keys(value,['u','form'])||value.form!==source.forms[i]||
      !unitArray(value.u)||total(value.u)!==source.n)return null;
   states.push({form:value.form,units:[...value.u],total:total(value.u)});
  }
  if(source.firstEnd){
   if(!same(states[0].units,source.firstEnd)||
      same(states[0].units,states[1].units))return null;
  }
  if(!same(model.u,states[1].units))return null;
  if(source.expanded){
   const expected=[Math.floor(source.n/100)*100,
    Math.floor(source.n/10)%10*10,source.n%10];
   if(!same(model.parts,expected))return null;
  }else if(!same(model.parts,[null,null,null]))return null;
  if(source.chart){
   if(model.cell!==source.n)return null;
  }else if(model.cell!==null)return null;
  return {kind:'two-saved-representations',sessionId:context.sessionId,
   index:context.index,nodeId:source.node,total:source.n,representations:states,
   formOrder:[...source.forms],sourceSpecificFirstUnits:source.firstEnd?[...source.firstEnd]:null,
   chartSelection:source.chart?model.cell:null,
   expanded:source.expanded?[...model.parts]:null,
   savedOrderObserved:true,addRemoveHistoryObserved:false,formChangeTimelineObserved:false,
   independentReasoningAssessed:false,learnerMasteryAssessed:false};
 }catch{return null;}
}
