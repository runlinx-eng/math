// Strict ledger evidence follows every retained submission, including failed
// submissions which do not advance the original cursor. It changes no grading,
// source task or v2 record; method selections remain self-report only.
import * as original from './phase5/b11-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

const SOURCES=Object.freeze({
 storymoney:{indices:[0,1,2],nodeId:'mt_wzAZ8qFDc4'},
 storylarger:{indices:[0,2,4],nodeId:'mt_-F_Lv_apzH'},
 storymillion:{indices:[1,3],nodeId:'mt_M1tnXqmYbn'}
});
export function storyLedgerBinding(task,context={}){
 if(!isEvidenceContext(context))return null;
 const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
 if(!source||!source.indices.includes(context.index)||
    !matchesNativeEvidenceTask(task,context,{type:'x-storyledger',nodeId:source.nodeId}))return null;
 const role=context.sessionId==='storymoney'&&context.index===2?'smaller-comparison':
  context.sessionId==='storylarger'&&context.index===2?'remaining-goal':
  context.sessionId==='storymoney'&&context.index===1?'remaining-length':'ledger-balance';
 const question=role==='smaller-comparison'?'要找的较小数量怎样与已知数量和两者的差联系？':
  role==='remaining-goal'?'这一步留下的是距离目标还差的数量；又收集一些以后，这个差额怎样变化？':
  '这一件事正在改变哪个数量？下一件事要从哪个中间结果继续？';
 return {nodeId:source.nodeId,question,role,method:null};
}

const methods=['mental','written','tool'],rowKeys=['op','amount','result','method'];
const keys=(v,ks)=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===ks.length&&ks.every(k=>Object.hasOwn(v,k));
const text=s=>typeof s==='string'&&s.length<=2000;
const assert={ok:value=>{if(!value)throw Error('Unsupported ledger record');},equal:(a,b)=>{if(a!==b)throw Error('Ledger state mismatch');}};
const same=(a,b)=>assert.ok(sameEvidence(a,b));
// Follow the original lexical capability without Number arithmetic: unsigned
// coefficient + optional sign, explicit decimal scale, trailing zero aliases.
// Invalid typed values are ordinary rejected attempts, not an illegal history.
function units(raw,scale){
 if(!text(raw)||![1,10,100,1000].includes(scale))return null;
 const s=raw.trim().replace(/[−–－]/g,'-').replace(/＋/g,'+'),m=s.match(/^([+-]?)(\d{1,10})(?:\.(\d{1,6}))?$/);if(!m)return null;
 const places=String(scale).length-1,frac=m[3]||'';if(/[^0]/.test(frac.slice(places)))return null;
 const n=BigInt(m[2])*BigInt(scale)+BigInt(frac.slice(0,places).padEnd(places,'0')||'0');if(n>1000000000n)return null;return m[1]==='-'?-n:n;
}
function reconstructLedger(task,model){
 assert.ok(keys(task,['type','start','steps','unit','prompt',...(Object.hasOwn(task,'scale')?['scale']:[])]));
 assert.equal(task.type,'x-storyledger');assert.ok(Number.isSafeInteger(task.start)&&task.start>=0&&task.start<=1000000000);assert.ok(text(task.unit)&&text(task.prompt));
 const scale=task.scale??1;assert.ok([1,10,100,1000].includes(scale));assert.ok(Array.isArray(task.steps)&&task.steps.length>0&&task.steps.length<=100);
 for(const step of task.steps){assert.ok(keys(step,['text','op','amount']));assert.ok(text(step.text)&&['+','-'].includes(step.op)&&Number.isSafeInteger(step.amount)&&step.amount>=0&&step.amount<=1000000000);}
 assert.ok(keys(model,['history','issue','cursor','saved','op','amount','result','method','first']));assert.ok(text(model.issue));assert.ok(rowKeys.every(k=>text(model[k])));assert.ok(['','+','-'].includes(model.op)&&['',...methods].includes(model.method));
 assert.ok(Array.isArray(model.history)&&model.history.length<=10000&&Array.isArray(model.saved)&&Array.isArray(model.first));
 let cursor=0,balance=BigInt(task.start);const saved=[],first=[],events=[],accepted=[],failed=[];
 for(const [historyIndex,e]of model.history.entries()){
  assert.ok(keys(e,['action','index',...rowKeys]));assert.equal(e.action,'b11-event');assert.equal(e.index,cursor);assert.ok(cursor<task.steps.length,'no visible event button after completion');
  assert.ok(rowKeys.every(k=>text(e[k])));assert.ok(['','+','-'].includes(e.op)&&['',...methods].includes(e.method),'only offered selector values');
  const raw=Object.fromEntries(rowKeys.map(k=>[k,e[k]]));first[cursor]??=structuredClone(raw);
  const step=task.steps[cursor],amount=units(e.amount,scale),submitted=units(e.result,scale),delta=BigInt(step.amount)*(step.op==='+'?1n:-1n),expected=balance+delta;
  const failures=[];if(e.op!==step.op)failures.push('operation-does-not-match-source-event');if(amount!==BigInt(step.amount))failures.push(amount===null?'amount-not-an-exact-smallest-unit':'amount-does-not-match-source-event');if(submitted!==expected)failures.push(submitted===null?'result-not-an-exact-smallest-unit':'result-does-not-continue-current-balance');if(!methods.includes(e.method))failures.push('method-choice-missing');
  const event={historyIndex,stepIndex:cursor,balanceBefore:Number(balance),expectedOperation:step.op,expectedAmount:step.amount,expectedResult:Number(expected),raw,submittedAmount:amount===null?null:Number(amount),submittedResult:submitted===null?null:Number(submitted),accepted:failures.length===0,cursorBefore:cursor,cursorAfter:cursor,balanceAfter:Number(balance),failures,methodChoiceAttribution:'self-report-only'};
  if(event.accepted){saved.push(structuredClone(raw));balance=expected;cursor++;event.cursorAfter=cursor;event.balanceAfter=Number(balance);accepted.push(event);}else failed.push(event);
  events.push(event);
 }
 assert.equal(model.cursor,cursor);same(model.saved,saved);same(model.first,first);
 const complete=cursor===task.steps.length;if(complete){for(const k of rowKeys)assert.equal(model[k],'','successful final commit clears fields which are no longer visible');assert.equal(model.issue,'');}
 return {scale,unit:task.unit,start:task.start,end:Number(balance),complete,cursor,events,accepted,failed,first:structuredClone(first),signedTotal:Number(balance-BigInt(task.start)),methodAssessed:false,mentalStrategyAssessed:false,physicalManipulationAssessed:false};
}
export function replayStoryLedgerEvidence(task,model){
 try{
  const proof=reconstructLedger(task,model);
  if(!proof.complete||!original.valid(task,model)||!original.inspect(task,model).correct)return null;
  return proof;
 }catch{return null;}
}
