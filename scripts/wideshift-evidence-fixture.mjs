// Engineering fixture: use visible B08 controls, preserving the original model
// and example. The historical example fills fields hidden in the current mode.
import * as M from '../dist/learning/phase5/b08-model.js';
import {decimal} from '../dist/learning/phase5/b08-math.js';

export function wideShiftEvidenceSteps(task,{guess='-1',trace}={}){
 if(task?.type!=='x-wideshift'||!['scale','shift','scientific'].includes(task.mode))throw new TypeError('Expected a non-additive B08 shift');
 const shift=M.targetShift(task),moves=trace??Array.from({length:Math.abs(shift)},()=>Math.sign(shift));
 const steps=[{field:'guess',value:guess},{action:'wide-predict',data:{}},
  ...moves.map(delta=>({action:'wide-move',data:{delta}})),{field:'answer',value:decimal(M.shifted(task.start,shift))}];
 if(task.mode==='scientific')steps.push({field:'exponent',value:String(-shift)});
 else steps.push({field:'factor',value:String(10**Math.abs(shift))},{field:'direction',value:shift>0?'times':'divide'});
 return steps;
}

export function wideShiftEvidenceExample(task,options){
 const model=M.initial(task);
 for(const step of wideShiftEvidenceSteps(task,options)){
  if(step.field){model[step.field]=String(step.value);M.field(task,model,step.field);}
  else{
   const before=model.trace.length;M.act(task,model,step.action,step.data);
   if(step.action==='wide-predict'&&model.committed!==model.guess||
      step.action==='wide-move'&&model.trace.length!==before+1)
    throw new Error('Requested positive sample control did not leave its original record');
  }
 }
 return model;
}
