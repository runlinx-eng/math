// Engineering fixture only. Use the original visible share controls; never
// sanitize an existing record, alter the original grader or seed checked work.
import * as shares from '../dist/learning/phase5/b18-model.js';
import * as view from '../dist/learning/phase5/b18-view.js';

const gcd=(a,b)=>{while(b)[a,b]=[b,a%b];return a;};
const fraction=(n,d)=>{n=BigInt(n);d=BigInt(d);const g=gcd(n,d);return[n/g,d/g];};
const name=([n,d])=>d===1n?String(n):n+'/'+d;

export function fracShareSolveSteps(task,{factor=task?.people,guess,story,reverse=false}={}){
 if(task?.type!=='x-fracshare')throw new TypeError('Expected a B18 fraction-sharing task');
 const count=Number(factor);
 if(!Number.isSafeInteger(count)||count<1||count>40||task.d*count>120||task.n*count%task.people)
  throw new TypeError('Expected a legal source subdivision factor');
 const result=fraction(task.n,task.d*task.people),perPerson=task.n*count/task.people,steps=[],
  field=(key,value)=>steps.push({field:key,value:String(value)}),
  action=(name,data={})=>steps.push({action:'b18-'+name,data});
 field('guess',guess??name(result));if(task.story)field('story',story??task.exampleStory);
 action('start');field('factor',factor);action('cut');
 const people=Array.from({length:task.people},(_,index)=>index);if(reverse)people.reverse();
 for(const person of people){
  action('person',{index:person});
  const pieces=Array.from({length:perPerson},(_,index)=>person*perPerson+index);if(reverse)pieces.reverse();
  for(const index of pieces)action('give',{index});
 }
 field('answer',name(result));field('equation',name(result)+'×'+task.people+'='+task.n+'/'+task.d);
 return steps;
}

export function fracShareEvidenceExample(task,options){
 const model=shares.initial(task);
 for(const step of fracShareSolveSteps(task,options)){
  const html=view.render(task,model);
  if(step.field){
   const inputs=[...html.matchAll(/<(?:input|select|textarea)\b[^>]*data-xfield="([^"]+)"[^>]*>/g)]
    .filter(match=>match[1]===step.field);
   if(inputs.length!==1||/\bdisabled\b|\breadonly\b/.test(inputs[0][0]))
    throw new Error('Fixture field is not available: '+step.field);
   const maximum=inputs[0][0].match(/maxlength="(\d+)"/);
   if(maximum&&step.value.length>Number(maximum[1]))throw new Error('Fixture text exceeds the visible input range');
   model[step.field]=step.value;shares.field(task,model,step.field);
  }else{
   const buttons=[...html.matchAll(/<button\b[^>]*>/g)].map(match=>match[0]).filter(button=>
    button.includes('data-x="'+step.action+'"')&&Object.entries(step.data||{})
     .every(([key,value])=>button.includes('data-'+key+'="'+value+'"')));
   if(buttons.length!==1||/\bdisabled\b/.test(buttons[0]))
    throw new Error('Fixture action is not available: '+step.action);
   shares.act(task,model,step.action,step.data);
  }
 }
 if(!shares.valid(task,model))throw new Error('Fixture does not preserve the original model contract');
 return model;
}
