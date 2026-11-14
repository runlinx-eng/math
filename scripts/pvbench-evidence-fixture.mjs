// Engineering samples for the eleven explicitly reviewed fixed B07 tasks.
// The historical example fills hidden fields and fabricates some save paths.
// These samples instead exercise the unchanged model's actual swap/save actions.
import {TASKS} from '../dist/learning/phase5/b07.js';
import * as place from '../dist/learning/phase5/b07-model.js';

const REVIEWED={tenexchange:[0,1],rename:[0,1,2],hundredexchange:[0,1],
 problems1000:[0,2],faces1000:[3],screen1000:[2]};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function pvbenchEvidenceSteps(task){
 if(task?.type!=='x-pvbench'||task.fixed!==true)throw new TypeError('Expected a reviewed fixed B07 task');
 let source;
 for(const [id,indices] of Object.entries(REVIEWED))for(const index of indices)
  if(same(task,TASKS[id][index]))source=id+':'+index;
 if(!source)throw new TypeError('Unreviewed fixed B07 task');
 const swap=kind=>({action:'pv-swap',data:{kind}}),save=()=>({action:'pv-save',data:{}});
 let steps;
 if(source==='rename:0')steps=[swap('down1'),save()];
 else if(source==='rename:1')steps=[save(),swap('down1'),save(),swap('down1'),save()];
 else if(source==='problems1000:2')steps=[save(),swap('down1'),save()];
 else steps=task.exchanges.map(swap);
 steps.push({field:'answer',value:task.n});
 if(task.expanded)[Math.floor(task.n/100)*100,Math.floor(task.n/10)%10*10,task.n%10]
  .forEach((value,i)=>steps.push({field:'parts.'+i,value}));
 if(task.packReport)steps.push({field:'packs',value:Math.floor(task.n/10)},{field:'remainder',value:task.n%10});
 if(task.why)steps.push({field:'why',value:task.why});
 return steps;
}

export function pvbenchEvidenceExample(task){
 if(task?.type!=='x-pvbench')throw new TypeError('Expected a B07 place-value bench task');
 if(task.fixed!==true)return place.example(task); // Unchanged nonfixed samples never bind this family.
 const model=place.initial(task);
 for(const step of pvbenchEvidenceSteps(task)){
  if(step.field){
   const [key,index]=step.field.split('.');if(index===undefined)model[key]=step.value;else model[key][index]=step.value;
   place.field(task,model,step.field);
  }else{
   const count=step.action==='pv-swap'?model.history.length:model.saved.length;
   place.act(task,model,step.action,step.data);
   if((step.action==='pv-swap'?model.history.length:model.saved.length)!==count+1)
    throw new Error('Reviewed B07 sample action did not take effect');
  }
 }
 return model;
}
