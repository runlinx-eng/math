// B10 records demonstration snapshots and swaps, not the individual counter
// edits. Prove exactly those displays; never reconstruct an unrecorded path.
import * as stories from './phase5/b10-model.js';
import {matchesNativeEvidenceTask,hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const SOURCES=Object.freeze({
 jointhings:{indices:[0,1],nodeId:'mt_OvyoRo47K-'},
 takethings:{indices:[0,1,2],nodeId:'mt_zuKAX6lcYR'},
 showactions:{indices:[0,1,2],nodeId:'mt_PgsHGYJMH-'},
 smallstories:{indices:[0,1,2,3],nodeId:'mt_yJmvUCCym7'},
 screenstories:{indices:[0,1,2],nodeId:'mt_Y6_cq3UMyy'},
 signsfirst:{indices:[0,1,2],nodeId:'mt_8RmpkDxT9L'},
 basicadd:{indices:[0,1,2,3],nodeId:'mt_mr_Vk7FGzK'},
 earlyunknown:{indices:[0,1,2],nodeId:'mt_VAWV_l7J0D'},
 partnersten:{indices:[0,1],nodeId:'mt_e8CZ7E5qW7'},
 swapadd:{indices:[0,2],nodeId:'mt_QCgbiVrwnp'},
 scaleadd:{indices:[1],nodeId:'mt_3e_PQxwC12'},
 undoadd:{indices:[0],nodeId:'mt_ehGS_uVSJv'},
 plansteps:{indices:[0],nodeId:'mt_CDa5AVakLE'},
 notice34:{indices:[0],nodeId:'mt_uG2mjHFOlO'},
 show38:{indices:[0,1],nodeId:'mt_nyK25mNOeR'},
 words38:{indices:[0],nodeId:'mt_lMz9nAs7VO'},
 sense38:{indices:[1],nodeId:'mt_WkKkb7W9Qd'},
 story38:{indices:[0,1],nodeId:'mt_IM1G_7QzTa'},
 objects38:{indices:[0,1],nodeId:'mt_fLOkq-HfPB'}
});

export function joinStoryBinding(task,context={}){
 if(!context||typeof context!=='object'||Array.isArray(context)||
    typeof context.sessionId!=='string'||!Number.isInteger(context.index))return null;
 const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
 if(!source||!source.indices.includes(context.index)||
    !matchesNativeEvidenceTask(task,context,{type:'x-joinstory',nodeId:source.nodeId}))return null;
 const question=task.compare?'两排配对后，没有配到的是哪一部分？让演示中的数量和你写的算式对应。':
  task.swap?'交换这两部分的位置再看一看：合起来的总数会怎样？取走时，原来的一堆还够吗？':
  task.balance?'你演示的两部分，和工具给出的另一边一样多吗？把这两个数量关系写在等号两边。':
  task.hidden?'故事里藏起来的是原来的一堆，还是另一部分？先猜，再用一次完整演示和算式核对。':
  '先猜一猜，再选择两部分和动作。让实际触发的演示与写下的算式对应；数量为零时也仔细看变化。';
 return{nodeId:source.nodeId,question,method:null};
}

const text=s=>typeof s==='string'&&s.length<=2000;
const integer=(n,min=0,max=40)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const snapshotKeys=['a','b','op','result'];
const modelKeys=['history','issue','left','right','op','guess','first','done','equation','swapped','otherEquation','shortage'];
const calculate=(a,b,op)=>BigInt(a)+(op==='+'?BigInt(b):-BigInt(b));

// Guess is a raw integer field in B10, not an expression. Its sign and the
// hidden quantity's role must survive independently of the original parser.
function guess(raw){
 if(!text(raw)||!/^\s*-?\d{1,4}\s*$/.test(raw))return null;
 return BigInt(raw.trim());
}

function taskGood(t){
 if(!t||t.type!=='x-joinstory')return false;
 const optional=['compare','rep','hidden','target','balance','swap'].filter(k=>Object.hasOwn(t,k));
 if(!keys(t,['type','a','b','op','prompt',...optional])||!integer(t.a)||!integer(t.b)||
    !['+','-'].includes(t.op)||!text(t.prompt)||calculate(t.a,t.b,t.op)<0n)return false;
 if(t.rep!==undefined&&!['dots','frame','fingers'].includes(t.rep))return false;
 if(t.compare!==undefined&&(t.compare!==true||t.op!=='-'))return false;
 if(t.swap!==undefined&&t.swap!==true)return false;
 if(t.hidden!==undefined){
  if(!['a','b'].includes(t.hidden)||!integer(t.target,0,80)||BigInt(t.target)!==calculate(t.a,t.b,t.op))return false;
 }else if(t.target!==undefined)return false;
 if(t.balance!==undefined&&(!Array.isArray(t.balance)||t.balance.length!==2||
    !t.balance.every(n=>integer(n))||t.op!=='+'||
    BigInt(t.balance[0])+BigInt(t.balance[1])!==calculate(t.a,t.b,t.op)))return false;
 if(t.rep==='fingers'&&(t.a>5||t.b>5||t.op!=='+'||t.compare))return false;
 // These are the reviewed native combinations, not a general future grammar.
 if([!!t.compare,!!t.swap,!!t.balance,!!t.hidden].filter(Boolean).length>1)return false;
 return true;
}

// Tokenize before removing any whitespace. "1 4" must never become fourteen.
// The current grader only accepts a single binary relation (or the two given
// additions for balance); this deliberately does not evaluate arbitrary text.
function equation(raw){
 if(!text(raw))return null;
 const s=raw.trim().replace(/＋/g,'+').replace(/[−–－]/g,'-').replace(/＝/g,'=');
 if(!s||!/^[\d\s+\-=]+$/.test(s))return null;
 const tokens=s.match(/\d+|[+\-=]/g)||[],equal=tokens.indexOf('=');
 if(equal<0||tokens.lastIndexOf('=')!==equal)return null;
 const side=parts=>{
  if(parts.length!==1&&parts.length!==3)return null;
  if(!/^(?:0|[1-9]\d{0,2})$/.test(parts[0]))return null;
  if(parts.length===1)return{terms:[Number(BigInt(parts[0]))],value:BigInt(parts[0])};
  if(!['+','-'].includes(parts[1])||!/^(?:0|[1-9]\d{0,2})$/.test(parts[2]))return null;
  const a=Number(BigInt(parts[0])),b=Number(BigInt(parts[2]));
  return{terms:[a,parts[1],b],value:calculate(a,b,parts[1])};
 };
 const left=side(tokens.slice(0,equal)),right=side(tokens.slice(equal+1));
 if(!left||!right||left.value!==right.value)return null;
 return{left:left.terms,right:right.terms,value:Number(left.value),raw};
}
function matchesEquation(q,a,b,op){
 if(!q)return false;
 const result=Number(calculate(a,b,op)),terms=[[a,op,b],...(op==='+'?[[b,'+',a]]:[])];
 return terms.some(term=>same(q.left,term)&&same(q.right,[result])||same(q.right,term)&&same(q.left,[result]));
}

function display(t,a,b,op,swapped=false){
 if(t.compare){
  if(op!=='-'||a<b)return null;
  return{kind:'comparison',left:a,right:b,paired:b,leftUnpaired:a-b,rightUnpaired:0,difference:a-b};
 }
 // The current hand renderer has five fingers per part and does not draw
 // crossed-out fingers. Keep misleading past displays out of strict evidence.
 if(t.rep==='fingers'&&(a>5||b>5||op==='-'&&b!==0))return null;
 if(op==='+')return{kind:'join',parts:[a,b],total:a+b,zeroChange:b===0};
 if(a<b){
  // Only an explicitly recorded exchange may be evidence of the task's
  // insufficient-objects boundary; a direct impossible take is not a take.
  if(!swapped)return null;
  return{kind:'insufficient',available:a,requested:b,shownRemoved:a,remaining:0,missing:b-a,physicalResult:null};
 }
 return{kind:'take',whole:a,taken:b,remaining:a-b,zeroChange:b===0};
}

export function replayJoinStoryEvidence(task,model){
 try{
  if(!taskGood(task)||!keys(model,modelKeys)||model.issue!==''||
     !['guess','first','equation','otherEquation','shortage'].every(k=>text(model[k]))||
     !Array.isArray(model.history)||!model.history.length||model.history.length>1500||
     !keys(model.done,snapshotKeys)||typeof model.swapped!=='boolean'||
     !stories.valid(task,model)||!stories.inspect(task,model).correct)return null;
  if(!task.swap&&(model.otherEquation!==''||model.shortage!==''||model.swapped)||
     task.swap&&task.op==='+'&&model.shortage!==''||
     task.swap&&task.op==='-'&&model.otherEquation!=='')return null;
  const role=task.hidden||'result',expected=role==='result'?Number(calculate(task.a,task.b,task.op)):task[role];
  const demonstrations=[],swaps=[];let current=null,swapped=false,first=null,lastGuess=null;
  for(let i=0;i<model.history.length;i++){
   const e=model.history[i];
   if(keys(e,[...snapshotKeys,'guess'])){
    if(!integer(e.a)||!integer(e.b)||!['+','-'].includes(e.op)||
       !integer(e.result,-40,80)||BigInt(e.result)!==calculate(e.a,e.b,e.op)||guess(e.guess)===null)return null;
    const shown=display(task,e.a,e.b,e.op);if(!shown)return null;
    first??=e.guess;lastGuess=e.guess;
    const snapshot={a:e.a,b:e.b,op:e.op,result:e.result},displayExpected=role==='result'?e.result:e[role];
    demonstrations.push({historyIndex:i,...snapshot,display:shown,
     guess:{raw:e.guess,value:Number(guess(e.guess)),role,scope:'task-question',expected,correct:guess(e.guess)===BigInt(expected),
      displayExpected,matchesDisplay:guess(e.guess)===BigInt(displayExpected)},
     matchesTask:e.a===task.a&&e.b===task.b&&e.op===task.op,
     // Counter/op edits between records are unknown. This compares only with
     // the previous recorded display, never the immediately preceding screen.
     sameAsPreviousRecordedDisplay:!!current&&!swapped&&same(current,snapshot)});
    current=snapshot;swapped=false;
   }else if(keys(e,['action','swapped'])&&e.action==='swap'){
    if(!task.swap||!current||typeof e.swapped!=='boolean'||e.swapped===swapped)return null;
    swapped=e.swapped;
    const a=swapped?current.b:current.a,b=swapped?current.a:current.b;
    const shown=display(task,a,b,current.op,swapped);if(!shown)return null;
    swaps.push({historyIndex:i,swapped,parts:[a,b],op:current.op,display:shown});
   }else return null;
  }
  if(!current||!same(current,model.done)||model.left!==current.a||model.right!==current.b||
     model.op!==current.op||model.swapped!==swapped||model.first!==first||model.guess!==lastGuess||
     current.a!==task.a||current.b!==task.b||current.op!==task.op)return null;
  const submitted=equation(model.equation);let reference=null,other=null;
  if(task.balance){
   if(!submitted)return null;
   const left=[task.a,'+',task.b],right=[task.balance[0],'+',task.balance[1]];
   if(!(same(submitted.left,left)&&same(submitted.right,right)||same(submitted.right,left)&&same(submitted.left,right)))return null;
   reference={parts:[...task.balance],total:task.balance[0]+task.balance[1],providedBy:'tool'};
  }else if(!matchesEquation(submitted,task.a,task.b,task.op))return null;
  if(task.swap){
   if(!swapped||!swaps.length)return null;
   if(task.op==='+'){
    other=equation(model.otherEquation);if(!matchesEquation(other,task.b,task.a,'+'))return null;
   }else if(model.shortage!=='not-enough'||task.a<=task.b)return null;
  }
  return{
   evidenceScope:'recorded-demonstrations-and-swaps',representation:task.rep||'counters',
   demonstrations,swaps,firstPrediction:{role,scope:'task-question',expected,raw:first,value:Number(guess(first)),correct:guess(first)===BigInt(expected)},
   latest:{...current,display:display(task,current.a,current.b,current.op),guess:lastGuess},
   currentDisplay:display(task,swapped?current.b:current.a,swapped?current.a:current.b,current.op,swapped),
   submitted:{equation:submitted,otherEquation:other,shortage:task.swap&&task.op==='-'?model.shortage:null},
   reference,quantityRole:task.compare?'comparison':task.hidden?'hidden-'+task.hidden:'result',
   unrecorded:['individual-counter-edits','operator-edits','guess-edits','unsuccessful-clicks','equation-edit-order','shortage-choice-edits']
  };
 }catch{return null;}
}
