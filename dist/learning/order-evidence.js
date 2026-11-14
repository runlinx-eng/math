// B15 operation trees: original strings are parsed independently with exact
// rational arithmetic. The old model is only the witness of saved UI behaviour;
// its rounded Number AST/value/equivalent helpers are never mathematical oracles.
import * as original from './phase5/b15-model.js';
import {matchesNativeEvidenceTask,hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const SOURCES=Object.freeze({
 bracketlab:{indices:[0,1,2],nodeId:'mt_8jFSnXxqQD'},
 orderlab:{indices:[0,1,2,3],nodeId:'mt_jHgRQ4hR0g'},
 powerorder:{indices:[0,1,2,3,4],nodeId:'mt_X5cypSGoGU'},
 signedproducts:{indices:[3],nodeId:'mt_rxInpOQ74w'},
 mentalchoices:{indices:[1,3,4],nodeId:'mt_vmW2cb5c7A'},
 storyfraction:{indices:[0],nodeId:'mt_dXq9VWm31W'}
});
export function orderBinding(task,context={}){
 if(!context||typeof context.sessionId!=='string'||!Number.isInteger(context.index))return null;
 const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
 if(!source||!source.indices.includes(context.index)||
    !matchesNativeEvidenceTask(task,context,{type:'x-orderlab',nodeId:source.nodeId}))return null;
 return{nodeId:source.nodeId,method:null,
  question:'这一块要用到哪几部分？先把它依赖的小块准备好，再核对每次亲手合出的量。括号、负号和幂各自抱住了谁？'};
}

// The original limits are 200 normalized characters and 2,000 saved events.
// Exact work additionally has a 4,096-bit intermediate budget and |power|<=64.
// Every native expression is far inside those bounds. An old accepted attempt
// outside them remains a real history event, with no claim of exact mathematics;
// a later reset/build starts fresh in memory without changing the saved schema.
const MAX_BITS=4096,MAX_POWER=64n;
const text=s=>typeof s==='string'&&s.length<=2000;
const abs=n=>n<0n?-n:n;
const bits=n=>abs(n).toString(2).length;
function gcd(a,b){a=abs(a);b=abs(b);while(b){[a,b]=[b,a%b];}return a||1n;}
function rational(n,d=1n){
 if(!d||bits(n)>MAX_BITS||bits(d)>MAX_BITS)return null;
 if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return[n/g,d/g];
}
const pair=q=>q&&q.map(String);
const eq=(a,b)=>!!a&&!!b&&a[0]===b[0]&&a[1]===b[1];
function decimal(raw){
 const m=/^([+-]?)(\d+)(?:\.(\d+))?$/.exec(raw);if(!m)return null;
 const fraction=m[3]||'',n=BigInt(m[2]+fraction)*(m[1]==='-'?-1n:1n);
 return rational(n,10n**BigInt(fraction.length));
}
function entry(raw){
 return text(raw)&&/^[+-]?\d{1,10}(?:\.\d{1,8})?$/.test(raw.trim())?decimal(raw.trim()):null;
}
function squareRoot(n){
 if(n<0n)return null;if(n<2n)return n;
 let x=1n<<BigInt(Math.ceil(bits(n)/2)),y=(x+n/x)/2n;
 while(y<x){x=y;y=(x+n/x)/2n;}return x*x===n?x:null;
}
function operation(op,a,b){
 if(!a||b===null)return null;
 if(op==='neg')return rational(-a[0],a[1]);
 if(op==='pos')return a;
 if(op==='sqrt'){
  const n=squareRoot(a[0]),d=squareRoot(a[1]);return n===null||d===null?null:rational(n,d);
 }
 if(!b)return null;
 if(op==='+')return rational(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
 if(op==='-')return rational(a[0]*b[1]-b[0]*a[1],a[1]*b[1]);
 if(op==='*')return rational(a[0]*b[0],a[1]*b[1]);
 if(op==='/')return rational(a[0]*b[1],a[1]*b[0]);
 if(op==='^'){
  if(b[1]!==1n||abs(b[0])>MAX_POWER)return null;
  const exponent=abs(b[0]);
  if(BigInt(bits(a[0]))*exponent>BigInt(MAX_BITS)||BigInt(bits(a[1]))*exponent>BigInt(MAX_BITS))return null;
  if(!a[0]&&b[0]<0n)return null;
  const n=a[0]**exponent,d=a[1]**exponent;return b[0]<0n?rational(d,n):rational(n,d);
 }
 return null;
}
const normalized=raw=>raw.replace(/\s/g,'').replace(/[×·]/g,'*').replace(/÷/g,'/')
 .replace(/[−–]/g,'-').replace(/²/g,'^2').replace(/³/g,'^3').replace(/（/g,'(').replace(/）/g,')');
const precedence={'+':10,'-':10,'*':20,'/':20,'^':30};
function parseRaw(raw){
 if(!text(raw)||/\d\s+\d/.test(raw))throw Error('Invalid source tokens');
 const source=normalized(raw);
 if(!source||source.length>200||/[^\d.+\-*/^()\[\]{}√]/.test(source))throw Error('Invalid source grammar');
 let cursor=0,nextId=0;
 function expression(threshold=0){
  let left;const token=source[cursor];
  if(['+','-','√'].includes(token)){
   cursor++;const id=nextId++,a=expression(25),op={'+':'pos','-':'neg','√':'sqrt'}[token];
   left={id,op,a,q:operation(op,a.q)};
  }else if('([{'.includes(token||'~')){
   cursor++;left=expression();if(source[cursor++]!=={'(':')','[':']','{':'}'}[token])throw Error('Unpaired group');
  }else{
   const match=/^\d+(?:\.\d+)?/.exec(source.slice(cursor));if(!match)throw Error('Missing literal');
   cursor+=match[0].length;left={id:nextId++,op:'num',raw:match[0],q:decimal(match[0])};
  }
  while(cursor<source.length){
   const op=source[cursor],power=precedence[op];if(!power||power<threshold)break;
   cursor++;const id=nextId++,right=expression(op==='^'?power:power+1);
   left={id,op,a:left,b:right,q:operation(op,left.q,right.q)};
  }
  return left;
 }
 const tree=expression();if(cursor!==source.length)throw Error('Unused source tokens');return tree;
}
const all=n=>n?[...all(n.a),...all(n.b),n]:[];
function canonical(n){
 if(n.op==='num')return n.q?'n('+pair(n.q).join('/')+')':null;
 const a=canonical(n.a),b=n.b?canonical(n.b):undefined;if(a===null||b===null)return null;
 const parts=n.b?[a,b]:[a];if(n.op==='+'||n.op==='*')parts.sort();return n.op+'('+parts.join(',')+')';
}
const publicTree=n=>n?{id:n.id,op:n.op,...(n.op==='num'?{raw:n.raw}:{a:publicTree(n.a),...(n.b?{b:publicTree(n.b)}:{})}),value:pair(n.q)}:null;
// A diagnostic view of this parser, not the source of expected test answers.
export function orderExactExpression(raw){
 try{const tree=parseRaw(raw);return{raw,normalized:normalized(raw),tree:publicTree(tree),value:pair(tree.q),canonical:canonical(tree)};}catch{return null;}
}
function numericProjection(n){
 if(n.op==='num')return{id:n.id,op:'num',v:Number(n.raw)};
 return{op:n.op,id:n.id,a:numericProjection(n.a),...(n.b?{b:numericProjection(n.b)}:{})};
}
function taskGood(t){
 if(!t||t.type!=='x-orderlab'||t.writeOnly)return false;
 const optional=['construct','insert','expected','target','writeOnly'].filter(k=>Object.hasOwn(t,k));
 return keys(t,['type','expression','prompt',...optional])&&text(t.expression)&&text(t.prompt)&&
  (t.construct===undefined||t.construct===true)&&(t.insert===undefined||t.insert===true&&t.construct===true)&&
  (t.expected===undefined||text(t.expected)&&t.construct===true)&&
  (t.target===undefined||typeof t.target==='number'&&Number.isFinite(t.target))&&
  (t.writeOnly===undefined||t.writeOnly===false);
}
const ROOT_FIELDS={answer:'',expression:'',result:'',reason:'',operator:'',amount:'',left:'',right:'',estimate:'',judgment:'',proof:'',method:'',entry:'',unit:'',base:'',q:'',used:'',rest:'',exchange:'',point:'',check:'',equation:'',angleB:'',angleC:'',angleD:'',numerator:'0',thousandths:'0',percent:'',skew:'30',n:'2',coeff:'',constant:'',count:'0',part:'0',extra:'0',addAnswer:'',quantity:'',meaning:''};
const FIELD_KEYS=Object.keys(ROOT_FIELDS),MODEL_KEYS=[...FIELD_KEYS,'history','board','issue'];
const fields=m=>Object.fromEntries(FIELD_KEYS.map(k=>[k,m[k]]));
function visibleFields(task,board){
 const out=new Set(task.construct?['expression']:[]);
 if(board.tree){
  if(board.selected!==null)out.add('result');
  if(Object.hasOwn(board.done,board.tree.id))out.add('answer');
 }
 return out;
}
function visibleOperations(board){
 const ids=[];function visit(n){
  if(!n||n.op==='num'||Object.hasOwn(board.done,n.id))return;
  visit(n.a);visit(n.b);ids.push(n.id);
 }visit(board.tree);return ids;
}
function legalFieldChange(previous,next,visible){
 return keys(next,FIELD_KEYS)&&FIELD_KEYS.every(k=>text(next[k])&&(next[k]===previous[k]||visible.has(k)));
}
function actionVisible(task,board,e){
 if(!keys(e,['action','data'])||!keys(e.data,['fields','index','value'])||e.data.value!==null)return false;
 if(e.action==='b15-op')return Number.isInteger(e.data.index)&&visibleOperations(board).includes(e.data.index);
 if(e.data.index!==null)return false;
 if(e.action==='b15-reset')return true;
 if(e.action==='b15-build')return task.construct===true;
 return e.action==='b15-reduce'&&!!board.tree&&board.selected!==null;
}

export function replayOrderEvidence(task,model){
 try{
  if(!taskGood(task)||!keys(model,MODEL_KEYS)||!text(model.issue)||
     !FIELD_KEYS.every(k=>text(model[k]))||!Array.isArray(model.history)||
     !model.history.length||model.history.length>2000)return null;
  const expected=parseRaw(task.expected||task.expression);if(!expected.q)return null;
  const shadow=original.initial(task);
  if(!same(fields(shadow),ROOT_FIELDS))return null;
  let tree=shadow.board.tree?parseRaw(task.expression):null,effective=[],qualified=new Map();
  const history=[],constructions=[];
  const setTree=raw=>{tree=raw===null?null:parseRaw(raw);effective=[];qualified=new Map();};
  for(let i=0;i<model.history.length;i++){
   const e=model.history[i],before=shadow.board;
   if(!actionVisible(task,before,e)||!legalFieldChange(fields(shadow),e.data.fields,visibleFields(task,before)))return null;
   for(const key of FIELD_KEYS)shadow[key]=e.data.fields[key];
   const selected=tree?all(tree).find(n=>n.id===before.selected):null;
   const previousSteps=before.steps.length;
   original.act(task,shadow,e.action,e.data.index===null?{}:{index:e.data.index});
   if(shadow.history.length!==i+1||!same(shadow.history[i],e))return null;
   const event={historyIndex:i,action:e.action,fields:structuredClone(e.data.fields),index:e.data.index,issue:shadow.issue};
   if(e.action==='b15-reset'){
    constructions.push({historyIndex:i,kind:'reset',retainedStepCount:effective.length});
    setTree(task.construct?null:task.expression);event.outcome='reset';
   }else if(e.action==='b15-build'){
    event.outcome=shadow.issue?'failed-build':'built';
    if(!shadow.issue){
     constructions.push({historyIndex:i,kind:'build',raw:e.data.fields.expression,retainedStepCount:effective.length});
     setTree(e.data.fields.expression);event.exactExpressionAvailable=!!tree.q;
    }
   }else if(e.action==='b15-op'){
    event.outcome=shadow.issue?'selected-unready':'selected';
   }else{
    const accepted=shadow.board.steps.length===previousSteps+1;event.outcome=accepted?'reduced':'failed-reduction';
    if(accepted){
     if(!selected||selected.op==='num')return null;
     const dependencies=[selected.a,selected.b].filter(Boolean).filter(n=>n.op!=='num').map(n=>n.id);
     const submitted=entry(e.data.fields.result),exact=eq(submitted,selected.q)&&dependencies.every(id=>qualified.get(id)===true);
     const step={historyIndex:i,id:selected.id,op:selected.op,dependencies,
      operands:[selected.a,selected.b].filter(Boolean).map(n=>pair(n.q)),
      expected:pair(selected.q),raw:e.data.fields.result,submitted:pair(submitted),exact};
     effective.push(step);qualified.set(selected.id,exact);event.operation=step;
    }
   }
   if(tree?!same(numericProjection(tree),shadow.board.tree):shadow.board.tree!==null)return null;
   history.push(event);
  }
  if(!legalFieldChange(fields(shadow),fields(model),visibleFields(task,shadow.board)))return null;
  for(const key of FIELD_KEYS)shadow[key]=model[key];
  if(!same(shadow,model)||!original.inspect(task,model).correct||!tree||!tree.q||
     canonical(tree)!==canonical(expected)||!qualified.get(tree.id)||
     effective.length!==all(tree).filter(n=>n.op!=='num').length||!effective.every(s=>s.exact)||
     !eq(entry(model.answer),tree.q))return null;
  let pending=null;
  if(task.construct){
   const edited=parseRaw(model.expression);
   if(!edited.q||canonical(edited)!==canonical(tree))return null;
   // Identical current text already has a concrete build witness. A distinct
   // text is only an unbuilt representation of that tree; intervening edit
   // order is not recorded and must never be invented by this proof.
   if(model.expression!==model.board.expression)pending={raw:model.expression,rawMatchesBuilt:false,
    exactStructureMatchesBuilt:true,appliedByBuild:false,editTimingKnown:false};
  }
  if(Object.hasOwn(task,'target')&&!eq(tree.q,decimal(String(task.target))))return null;
  return{evidenceScope:'visible-operation-dependencies-and-exact-reductions',
   built:{raw:model.board.expression,tree:publicTree(tree),value:pair(tree.q)},
   firstBuild:model.board.first,pending,effectiveSteps:effective,history,constructions,
   failedRequests:history.filter(e=>e.outcome.startsWith('failed-')||e.outcome==='selected-unready'),
   earlierInexactReductions:history.filter(e=>e.operation&&!e.operation.exact).map(e=>e.historyIndex),
   currentIssue:model.issue,submittedAnswer:{raw:model.answer,value:pair(entry(model.answer))},
   retainedHistoryCount:model.history.length,
   limits:{normalizedCharacters:200,historyEvents:2000,exactIntermediateBits:MAX_BITS,exactPowerMagnitude:Number(MAX_POWER)},
   unrecorded:['field-edit-order-between-actions','unbuilt-text-as-an-applied-expression','general-strategy-or-mastery']};
 }catch{return null;}
}
