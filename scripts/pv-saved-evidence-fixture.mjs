// #321: review-only positive witnesses for four exact, native nonfixed B07 tasks.
// These are authentic B07 model actions, not fabricated add/remove history.
import * as b07 from '../dist/learning/phase5/b07-model.js';
import {pvSavedBinding} from '../dist/learning/pv-saved-evidence.js';
const ROWS=Object.freeze({
 'twoproblems:2':{first:[0,6,8,0],second:[0,6,8,0]},
 'faces100:1':{first:[0,6,3,0],second:[0,6,3,0]},
 'faces120:1':{first:[0,11,2,0],second:[1,1,2,0]},
 'screen1000:0':{first:[3,4,7,0],second:[3,4,7,0]}
});
export function pvSavedEvidenceSteps(task,context){
 if(!pvSavedBinding(task,context))throw new TypeError('Unreviewed B07 save position');
 const row=ROWS[context.sessionId+':'+context.index];
 if(!row)throw new TypeError('Missing exact reviewed save witness');
 const steps=[];
 for(let state=0;state<2;state++){
  if(state)steps.push({action:'pv-form',data:{form:task.forms[1]}});
  for(let unit=0;unit<3;unit++){
   const count=(state?row.second:row.first)[unit];
   for(let i=0;i<count;i++)steps.push({action:'pv-add',data:{index:unit,delta:1}});
  }
  steps.push({action:'pv-save',data:{}});
 }
 steps.push({field:'answer',value:task.n});
 if(task.expanded){
  [Math.floor(task.n/100)*100,Math.floor(task.n/10)%10*10,task.n%10]
   .forEach((value,i)=>steps.push({field:'parts.'+i,value}));
 }
 if(task.chart)steps.push({action:'pv-cell',data:{index:task.n}});
 return steps;
}
export function pvSavedEvidenceExample(task,context){
 const model=b07.initial(task),steps=pvSavedEvidenceSteps(task,context);
 for(const step of steps){
  if(step.field){
   const [key,index]=step.field.split('.');
   if(index===undefined)model[key]=step.value;
   else model[key][Number(index)]=step.value;
   b07.field(task,model,step.field);
  }else{
   const before=JSON.stringify(model);
   b07.act(task,model,step.action,step.data);
   if(JSON.stringify(model)===before)throw Error('A native save witness action had no effect');
  }
 }
 if(!b07.valid(task,model)||!b07.inspect(task,model).correct)
  throw Error('Original B07 grader rejected reviewed saved representation witness');
 return model;
}
