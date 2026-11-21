// #342 / P003: native percentpatterns:0, 25*n = (100*n)/4.
// Isolated candidate only. This module neither registers strict feedback nor changes the native grader.
import * as original from './phase5/b17-model.js';
import {
  isEvidenceContext, matchesNativeEvidenceTask, latestSubmissionMatches,
  hasExactKeys as keys, sameEvidence as same
} from './evidence-contract.js';

const NODE='mt_jCy07DyBNU';
// Source-constructed candidate SHA; runtime sessionTaskFor verification is NOT_RUN.
const SOURCE_CONSTRUCTED_SHA='860ef4c64b8993c38591ccf90ddf032c3e9aaa789f8a10e459b2362757436fce';
const PROMPT='每份25。试用“先乘100，再除4”搭规则；用不同份数检查它与每份25是否相同。';
const CONTEXT='每份25，4份、7份、16份';
const EXPECTED=[4,7,16];
const LIVE_FIELDS=new Set(['multiplier','offset','divisor','n','answer']);
const decimal=s=>typeof s==='string'&&/^-?(?:0|[1-9]\d*)$/.test(s)&&s.length<=24;
const exactInt=s=>decimal(s)&&Number.isSafeInteger(Number(s))?Number(s):null;

function sourceFor(task,context){
  if(!isEvidenceContext(context)||context.sessionId!=='percentpatterns'||context.index!==0||
    !matchesNativeEvidenceTask(task,context,{type:'x-rulejump',nodeId:NODE})||
    !keys(task,['type','a','b','inputs','exampleRule','context','prompt'])||
    task.a!==25||task.b!==0||task.prompt!==PROMPT||task.context!==CONTEXT||
    !same(task.inputs,EXPECTED)||!same(task.exampleRule,[100,0,4]))return null;
  return {nodeId:NODE,sourceConstructedSha256:SOURCE_CONSTRUCTED_SHA};
}

export function rulejumpEquivalentBinding(task,context={}){
  return sourceFor(task,context)?{
    nodeId:NODE,kind:'rulejump-times100-divide4',method:null,
    question:'本题的已记录规则是否把 25n 等价写成 100n÷4，并在原输入逐项核对？'
  }:null;
}

export function replayRulejumpEquivalentEvidence(task,model,context={}){
  try{
    if(!sourceFor(task,context)||!original.valid(task,model)||
       !original.inspect(task,model).correct)return null;
    const initial=original.initial(task),fieldNames=Object.keys(original.fields);
    if(!keys(model,Object.keys(initial))||!keys(model.board,['rule','records','first'])||
       model.issue!==''||!Array.isArray(model.history)||model.history.length<4||
       model.history.length>1500||Object.keys(model.history).length!==model.history.length)return null;
    for(const field of fieldNames){
      if(typeof model[field]!=='string'||model[field].length>500||
         !LIVE_FIELDS.has(field)&&model[field]!==initial[field])return null;
    }
    let rule=null,first=null,records=[];
    const events=[],canonicalRuns=[];
    for(const [step,event] of model.history.entries()){
      if(!keys(event,['a','d','f'])||!keys(event.d,[])||
         !keys(event.f,fieldNames)||!['rule','run','reset'].includes(event.a))return null;
      for(const field of fieldNames){
        if(typeof event.f[field]!=='string'||event.f[field].length>500||
           !LIVE_FIELDS.has(field)&&event.f[field]!==initial[field])return null;
      }
      const f=event.f;
      if(event.a==='reset'){
        rule=null;records=[];events.push({step,action:'reset'});
        continue;
      }
      if(event.a==='rule'){
        const mul=exactInt(f.multiplier),off=exactInt(f.offset),div=exactInt(f.divisor);
        if(mul===null||off===null||div===null||Math.abs(mul)>1000||
           Math.abs(off)>1000||div<1||div>1000)return null;
        rule=[mul,off,div];records=[];
        first??=[f.multiplier,f.offset,f.divisor];
        events.push({step,action:'rule',rule:[...rule]});
        continue;
      }
      if(!rule||f.multiplier!==String(rule[0])||
         f.offset!==String(rule[1])||f.divisor!==String(rule[2]))return null;
      const n=exactInt(f.n),answer=exactInt(f.answer);
      if(n===null||answer===null||!EXPECTED.includes(n)||
         BigInt(answer)*BigInt(rule[2])!==BigInt(rule[0])*BigInt(n)+BigInt(rule[1]))return null;
      records=records.filter(x=>x.n!==n);
      records.push({n,result:f.answer});
      events.push({step,action:'run',n,result:f.answer,rule:[...rule]});
    }
    if(!same(rule,[100,0,4])||!same(first,model.board.first)||
       !same({rule,records,first},model.board)||
       records.length!==EXPECTED.length||!EXPECTED.every(n=>records.some(r=>
         r.n===n&&BigInt(r.result)===25n*BigInt(n)))||
       model.multiplier!=='100'||model.offset!=='0'||model.divisor!=='4')return null;
    const last=model.history.at(-1);
    if(last.a!=='run'||last.f.n!==model.n||last.f.answer!==model.answer||
       last.f.multiplier!==model.multiplier||last.f.offset!==model.offset||
       last.f.divisor!==model.divisor)return null;
    const finalRuleStep=events.findLastIndex(e=>e.action==='rule');
    for(const e of events.slice(finalRuleStep+1)){
      if(e.action!=='run'||!same(e.rule,[100,0,4]))return null;
    }
    for(const n of EXPECTED){
      if(!events.slice(finalRuleStep+1).some(e=>e.action==='run'&&e.n===n))return null;
      canonicalRuns.push({input:n,firstMultiplyBy100:100*n,thenDivideBy4:25*n});
    }
    return {
      kind:'rulejump-times100-divide4',nodeId:NODE,sessionId:context.sessionId,index:context.index,
      sourceConstructedTaskSha256:SOURCE_CONSTRUCTED_SHA,taskFingerprintStatus:'NOT_RUN',originalInputs:[...EXPECTED],targetMultiplier:25,
      finalToolRule:[100,0,4],canonicalRuns,chronologicalControlEvents:events,
      observedFirstRule:first,firstRuleNecessarilyCanonical:same(first,['100','0','4']),
      equivalentArithmeticVerified:true,
      toolFieldChronologyObserved:true,mentalCalculationOrderObserved:false,
      generalizationToUnseenInputsAssessed:false,freeExplanationAssessed:false,
      learnerMasteryAssessed:false
    };
  }catch{return null;}
}

export function submittedRulejumpEquivalentEvidence(task,model,record,context={}){
  return latestSubmissionMatches(model,record)?replayRulejumpEquivalentEvidence(task,model,context):null;
}
