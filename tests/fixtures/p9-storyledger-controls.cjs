// Plans only original visible field edits and the existing b11-event button.
// Expected quantities use integer smallest units, independently of the adapter.
const methods=['mental','written','tool'];
function display(value,scale=1){let n=BigInt(value),negative=n<0n;if(negative)n=-n;const p=String(scale).length-1;return (negative?'-':'')+String(n/BigInt(scale))+(p?'.'+String(n%BigInt(scale)).padStart(p,'0'):'');}
function row(task,index,variant=0){const scale=task.scale??1,step=task.steps[index];let balance=BigInt(task.start);for(const s of task.steps.slice(0,index+1))balance+=BigInt(s.amount)*(s.op==='+'?1n:-1n);
 const name=n=>variant%2?'＋'+display(n,scale)+(scale===1?'.00':'00'):display(n,scale);
 return {op:step.op,amount:name(step.amount),result:name(balance),method:methods[(index+variant)%methods.length]};}
function wrongRow(task,index,kind='operation',variant=0){const value=row(task,index,variant),step=task.steps[index],scale=task.scale??1;
 if(kind==='operation')value.op=step.op==='+'?'-':'+';
 else if(kind==='amount')value.amount=display(BigInt(step.amount)+BigInt(scale),scale);
 else if(kind==='result'){let n=BigInt(task.start);for(const s of task.steps.slice(0,index+1))n+=BigInt(s.amount)*(s.op==='+'?1n:-1n);value.result=display(n+BigInt(scale),scale);}
 else if(kind==='empty-method')value.method='';
 else if(kind==='empty-operation')value.op='';
 else if(kind==='unparsed')value.amount='1e2';
 else if(kind==='overprecision')value.result=value.result.replace(/^＋/,'').replace(/\.0+$/,'')+(value.result.includes('.')?'000001':'.000001');
 else throw Error('Unknown deliberate wrong input');return value;}
const steps=values=>[...Object.entries(values).map(([field,value])=>({field,value})),{action:'b11-event'}];
module.exports={methods,display,row,wrongRow,steps};
