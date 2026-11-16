// Engineering fixture only. Follow the original visible B18 controls without
// altering original examples, graders or stored records. Independent tests
// provide their own mathematical oracle and alternative user paths.
import * as scales from '../dist/learning/phase5/b18-model.js';
import * as view from '../dist/learning/phase5/b18-view.js';

const gcd=(a,b)=>{while(b)[a,b]=[b,a%b];return a;};
const reduce=(n,d)=>{const g=gcd(n,d);return[n/g,d/g];};
const multiply=(a,b)=>reduce(a[0]*b[0],a[1]*b[1]);
const add=(a,b,sign=1n)=>reduce(a[0]*b[1]+sign*b[0]*a[1],a[1]*b[1]);
const name=([n,d])=>d===1n?String(n):n+'/'+d;
function quantity(raw){
 const match=/^(\d+)(?:\/(\d+))?$/.exec(String(raw));
 if(!match||BigInt(match[2]||'1')===0n)throw new TypeError('Expected a positive source quantity');
 return reduce(BigInt(match[1]),BigInt(match[2]||'1'));
}
function decimal([n,d]){
 let out=String(n/d),remainder=n%d;if(!remainder)return out;
 out+='.';let places=0;
 while(remainder){
  if(++places>8)throw new TypeError('Source ratio has no supported finite decimal');
  remainder*=10n;out+=remainder/d;remainder%=d;
 }
 return out;
}

export function scaleChainSolveSteps(task){
 if(task?.type!=='x-scalechain'||!Array.isArray(task.stages)||!task.stages.length)
  throw new TypeError('Expected a B18 scale chain');
 const steps=[],field=(key,value)=>steps.push({field:key,value:String(value)}),
  action=(name,data={})=>steps.push({action:'b18-'+name,data});
 let current=quantity(task.start);
 for(const stage of task.stages){
  if(!['take','off','add'].includes(stage.mode))throw new TypeError('Unknown scale mode');
  const ratio=quantity(stage.ratio),taken=multiply(current,ratio),
   result=stage.mode==='off'?add(current,taken,-1n):stage.mode==='add'?add(current,taken):taken;
  field('denom',ratio[1]);action('cut');
  for(let index=0;index<Number(ratio[0]);index++)action('piece',{index});
  field('unit',name(reduce(current[0],current[1]*ratio[1])));
  field('amount',name(taken));if(stage.decimal)field('decimal',decimal(ratio));
  field('result',name(result));action('commit');current=result;
 }
 return steps;
}

export function scaleChainEvidenceExample(task){
 const model=scales.initial(task);
 for(const step of scaleChainSolveSteps(task)){
  const html=view.render(task,model);
  if(step.field){
   const inputs=[...html.matchAll(/<(?:input|select|textarea)\b[^>]*data-xfield="([^"]+)"[^>]*>/g)]
    .filter(match=>match[1]===step.field);
   if(inputs.length!==1||/\bdisabled\b|\breadonly\b/.test(inputs[0][0]))
    throw new Error('Fixture field is not available: '+step.field);
   model[step.field]=step.value;scales.field(task,model,step.field);
  }else{
   const buttons=[...html.matchAll(/<button\b[^>]*>/g)].map(match=>match[0]).filter(button=>
    button.includes('data-x="'+step.action+'"')&&Object.entries(step.data||{})
     .every(([key,value])=>button.includes('data-'+key+'="'+value+'"')));
   if(buttons.length!==1||/\bdisabled\b/.test(buttons[0]))
    throw new Error('Fixture action is not available: '+step.action);
   scales.act(task,model,step.action,step.data);
  }
 }
 if(!scales.valid(task,model))throw new Error('Fixture does not preserve the original model contract');
 return model;
}
