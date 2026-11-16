// Engineering fixture using only the original visible B18 controls. It does
// not fill hidden inputs, replace the grader or manufacture saved attempts.
import * as original from '../dist/learning/phase5/b18-model.js';
import * as view from '../dist/learning/phase5/b18-view.js';

const gcd=(a,b)=>{while(b)[a,b]=[b,a%b];return a;};
const name=(n,d)=>{n=BigInt(n);d=BigInt(d);const g=gcd(n,d);n/=g;d/=g;return d===1n?String(n):n+'/'+d;};

export function mixedTradeSolveSteps(task,{guess,allPieces=false}={}){
 if(task?.type!=='x-mixedtrade')throw new TypeError('Expected a B18 mixed-unit task');
 const units=task.a[0]*task.d+task.a[1]+(task.op==='+'?1:-1)*(task.b[0]*task.d+task.b[1]),steps=[],
  field=(key,value)=>steps.push({field:key,value:String(value)}),
  action=name=>steps.push({action:'b18-'+name,data:{}});
 field('guess',guess??name(units,task.d));action('start');
 let w=task.a[0]+(task.op==='+'?task.b[0]:0),p=task.a[1]+(task.op==='+'?task.b[1]:0);
 if(allPieces&&w){action('all-pieces');p+=w*task.d;w=0;}
 if(task.op==='-'){
  for(let i=0;i<task.b[0];i++){action('take-whole');if(w)w--;else p-=task.d;}
  for(let i=0;i<task.b[1];i++){
   if(!p){action('split');w--;p+=task.d;}
   action('take-part');p--;
  }
 }
 while(p>=task.d){action('merge');p-=task.d;w++;}
 field('whole',w);field('part',name(p,task.d));field('answer',name(units,task.d));
 return steps;
}

export function mixedTradeEvidenceExample(task,options){
 const model=original.initial(task);
 for(const step of mixedTradeSolveSteps(task,options)){
  const html=view.render(task,model);
  if(step.field){
   const inputs=[...html.matchAll(/<(?:input|select|textarea)\b[^>]*data-xfield="([^"]+)"[^>]*>/g)]
    .filter(match=>match[1]===step.field);
   if(inputs.length!==1||/\bdisabled\b|\breadonly\b/.test(inputs[0][0]))throw new Error('Unavailable fixture field: '+step.field);
   const maximum=inputs[0][0].match(/maxlength="(\d+)"/);
   if(step.value.length>1000||maximum&&step.value.length>Number(maximum[1]))throw new Error('Fixture text exceeds the original input range');
   model[step.field]=step.value;original.field(task,model,step.field);
  }else{
   const buttons=[...html.matchAll(/<button\b[^>]*>/g)].map(match=>match[0])
    .filter(button=>button.includes('data-x="'+step.action+'"'));
   if(buttons.length!==1||/\bdisabled\b/.test(buttons[0]))throw new Error('Unavailable fixture action: '+step.action);
   original.act(task,model,step.action,step.data);
  }
 }
 if(!original.valid(task,model))throw new Error('Fixture violates the original B18 record contract');
 return model;
}
