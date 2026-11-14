// Exact replay of the B17 fraction-operation construction. Event indices and
// reset epochs are neutral facts: a later wrapper may create prediction events
// automatically, so the core never assigns them to a particular actor.
import * as fractions from './phase5/b17-model.js';
import {matchesNativeEvidenceTask,sameEvidence as same,hasExactKeys as keys} from './evidence-contract.js';

const SOURCES=Object.freeze({
 fractionchoices:{indices:[3],nodeId:'mt_SsLWS_APM7'},
 mixedrename:{indices:[2],nodeId:'mt_o_p-3tCxiM'},
 fractionfour:{indices:[0,1,2,3,4,5,6,7],nodeId:'mt_gNUE4B3vuk'}
});
export function fractionOperationsBinding(task,context={}){
 if(!context||typeof context!=='object'||Array.isArray(context)||
    typeof context.sessionId!=='string'||!Number.isInteger(context.index))return null;
 const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
 if(!source||!source.indices.includes(context.index)||
    !matchesNativeEvidenceTask(task,context,{type:'x-fracoperations',nodeId:source.nodeId}))return null;
 const question=task.op==='*'?'横着、竖着选择的份相交后，每小格表示多少？整体超过1时，单位会改变吗？':
  task.op==='/'?'每一组和原来的整体分别有多大？余下的量占原来单位多少，又占一组多少？':
  '两边的小份一样大了吗？每个原来的量怎样保持，接起来或拿走时又数的是什么？';
 return {nodeId:source.nodeId,question,method:null};
}

const fieldKeys=Object.keys(fractions.fields),text=s=>typeof s==='string'&&s.length<=500;
const integer=(n,lo=0,hi=1000000)=>Number.isSafeInteger(n)&&n>=lo&&n<=hi;
const gcd=(a,b)=>{while(b)[a,b]=[b,a%b];return a<0n?-a:a;};
const reduce=([n,d])=>{const g=gcd(n,d);return[n/g,d/g];};
const equal=(a,b)=>!!a&&!!b&&a[0]*b[1]===b[0]*a[1];
const pair=r=>r.map(Number),unit=n=>[1,n];
const add=(a,b,sign=1n)=>reduce([a[0]*b[1]+sign*b[0]*a[1],a[1]*b[1]]);
const multiply=(a,b)=>reduce([a[0]*b[0],a[1]*b[1]]);
const size=r=>r[0]<0n?'negative':r[0]===0n?'zero':r[0]<r[1]?'part':r[0]===r[1]?'one':'more';
// Keep unreduced fraction forms, but reduce decimal/percent names as the
// original input contract does. Read the lexical sign before converting -0.
function amount(raw){
 if(!text(raw))return null;
 let s=raw.trim().replace(/[−–]/g,'-'),percent=s.endsWith('%');
 if(percent)s=s.slice(0,-1).trim();
 let n,d,m;
 if((m=/^(-?)(\d{1,12})\s+(\d{1,12})\/(\d{1,12})$/.exec(s))){
  const whole=BigInt(m[2]),part=BigInt(m[3]);d=BigInt(m[4]);
  if(!d||part>=d)return null;n=whole*d+part;if(m[1])n=-n;
 }else if((m=/^(-?\d{1,12})\/(\d{1,12})$/.exec(s))){n=BigInt(m[1]);d=BigInt(m[2]);}
 else if((m=/^([+-]?)(\d{1,12})(?:\.(\d{1,32}))?$/.exec(s))){
  d=10n**BigInt((m[3]||'').length);n=BigInt(m[2])*d+BigInt(m[3]||'0');if(m[1]==='-')n=-n;
 }else return null;
 if(d<=0n)return null;if(percent)d*=100n;
 if(percent||s.includes('.'))[n,d]=reduce([n,d]);
 if(n< -1000000000000n||n>1000000000000n||d>10000000000n)return null;
 return[n,d];
}
const decimalInteger=(raw,min,max)=>{
 if(!text(raw)||!/^\+?\d+(?:\.\d+)?$/.test(raw.trim()))return null;
 const r=amount(raw);if(!r||r[0]%r[1])return null;
 const n=Number(r[0]/r[1]);return integer(n,min,max)?n:null;
};
const index=(raw,max)=>text(raw)&&/^(?:0|[1-9]\d*)$/.test(raw)&&integer(Number(raw),0,max)?Number(raw):null;
const toggle=(xs,i)=>xs.includes(i)?xs.filter(x=>x!==i):[...xs,i];
const fresh=first=>({first,prediction:null,forms:null,denom:0,left:[],right:[],combined:false,columns:[],rows:[],fits:0,rest:false});
const visible=(t,b)=>!b.prediction?['prediction']:!b.forms?['aform','bform']:
 ['answer','reason',...(t.op==='*'?[]:['denom']),...(t.op==='/'&&b.rest?['whole','part']:[])];
const capacity=(form,denominator=form[1])=>Math.ceil(form[0]/form[1])*denominator;
const counts=b=>b.forms.map(([n,d])=>n*b.denom/d);
const contiguous=xs=>xs.length<2||Math.max(...xs)-Math.min(...xs)+1===xs.length;

export function replayFractionOperationsEvidence(task,model){
 try{
  if(!keys(task,['type','a','b','op','prompt'])||task.type!=='x-fracoperations'||
     !text(task.prompt)||!['+','-','*','/'].includes(task.op)||
     !keys(model,[...fieldKeys,'board','history','issue'])||!fieldKeys.every(k=>text(model[k]))||
     model.issue!==''||!Array.isArray(model.history)||!model.history.length||model.history.length>1500)return null;
  const a=amount(task.a),c=amount(task.b);
  if(!a||!c||a[0]<0n||c[0]<0n||task.op==='/'&&c[0]===0n)return null;
  const result=task.op==='+'?add(a,c):task.op==='-'?add(a,c,-1n):task.op==='*'?multiply(a,c):multiply(a,[c[1],c[0]]);
  // This construction shows quantities taken away, not directed negative bars.
  if(result[0]<0n||!fractions.valid(task,model)||!fractions.inspect(task,model).correct)return null;
  let b=fresh(null),previous={...fractions.fields},epoch=0,constructionAfterIndex=-1;
  const events=[],predictions=[],resets=[],epochs=[{epoch:0,startIndex:0,endExclusive:null}];
  for(let historyIndex=0;historyIndex<model.history.length;historyIndex++){
   const e=model.history[historyIndex];
   if(!keys(e,['a','d','f'])||!keys(e.f,fieldKeys)||!fieldKeys.every(k=>text(e.f[k])))return null;
   const allowed=visible(task,b);
   if(fieldKeys.some(k=>!allowed.includes(k)&&e.f[k]!==previous[k]))return null;
   previous={...e.f};
   const expected=e.a==='shade'?['row','index']:['column','row'].includes(e.a)?['index']:[];
   if(!keys(e.d,expected))return null;
   const event={index:historyIndex,epoch,action:e.a,effect:true};
   if(e.a==='reset'){
    event.effect=!!(b.prediction||b.forms);event.nextEpoch=epoch+1;
    resets.push({index:historyIndex,fromEpoch:epoch,toEpoch:epoch+1,preservedFirst:b.first});
    epochs[epoch].endExclusive=historyIndex;epochs[epoch].resetAfterIndex=historyIndex;
    b=fresh(b.first);constructionAfterIndex=historyIndex;epoch++;epochs.push({epoch,startIndex:historyIndex+1,endExclusive:null});
   }else if(e.a==='predict-op'){
    if(b.prediction||!['negative','zero','part','one','more'].includes(e.f.prediction))return null;
    b.first??=e.f.prediction;b.prediction=e.f.prediction;
    event.value=e.f.prediction;predictions.push({index:historyIndex,epoch,value:e.f.prediction});
   }else if(e.a==='forms'){
    if(!b.prediction||b.forms)return null;
    const aa=amount(e.f.aform),bb=amount(e.f.bform);
    if(!equal(aa,a)||!equal(bb,c)||[aa,bb].some(r=>r[0]<0n||r[0]>100n||r[1]<1n||r[1]>100n))return null;
    // BigInt establishes the mathematics; the original parser additionally
    // establishes that this exact input really created these forms in the tool.
    // In particular its raw decimal denominator limit applies before reduction.
    // The forms action also uses B16's raw equality parser, which does not
    // accept percent notation even though the general B17 frac helper does.
    if(e.f.aform.trim().endsWith('%')||e.f.bform.trim().endsWith('%')||
       !same(fractions.frac(e.f.aform),pair(aa))||!same(fractions.frac(e.f.bform),pair(bb)))return null;
    b.forms=[pair(aa),pair(bb)];event.forms=b.forms.map(x=>[...x]);
    constructionAfterIndex=historyIndex;
   }else if(e.a==='common'){
    const den=decimalInteger(e.f.denom,1,240);
    if(!b.forms||task.op==='*'||den===null||b.forms.some(([,d])=>den%d))return null;
    event.effect=den!==b.denom||b.left.length>0||b.right.length>0||b.fits>0||b.rest||b.combined;
    b.denom=den;b.left=[];b.right=[];b.fits=0;b.rest=false;b.combined=false;event.denominator=den;
    constructionAfterIndex=historyIndex;
   }else if(e.a==='shade'){
    if(!b.forms||task.op==='*'||!b.denom||!['left','right'].includes(e.d.row))return null;
    const form=b.forms[e.d.row==='left'?0:1],i=index(e.d.index,capacity(form,b.denom)-1);
    if(i===null)return null;
    b[e.d.row]=toggle(b[e.d.row],i);b.combined=false;b.fits=0;b.rest=false;
    event.row=e.d.row;event.part=i;event.selected=b[e.d.row].includes(i);event.denominator=b.denom;
    constructionAfterIndex=historyIndex;
   }else if(e.a==='combine'){
    if(!b.forms||!['+','-'].includes(task.op)||!b.denom)return null;
    const [A,B]=counts(b);if(b.left.length!==A||b.right.length!==B)return null;
    event.effect=!b.combined;b.combined=true;
    event.counts=[A,B];event.resultCount=task.op==='+'?A+B:A-B;event.denominator=b.denom;
   }else if(e.a==='column'||e.a==='row'){
    if(!b.forms||task.op!=='*')return null;
    const side=e.a==='column'?0:1,list=e.a==='column'?'columns':'rows',i=index(e.d.index,capacity(b.forms[side])-1);
    if(i===null)return null;b[list]=toggle(b[list],i);event.part=i;event.selected=b[list].includes(i);
   }else if(e.a==='fit'){
    if(!b.forms||task.op!=='/'||!b.denom)return null;
    const [A,B]=counts(b);if(B<=0||b.left.length!==A||b.right.length!==B||(b.fits+1)*B>A)return null;
    event.before=b.fits;b.fits++;event.after=b.fits;event.remainingPieces=A-b.fits*B;event.groupPieces=B;event.denominator=b.denom;
   }else if(e.a==='rest'){
    if(!b.forms||task.op!=='/'||!b.denom)return null;
    const [A,B]=counts(b);if(B<=0||b.left.length!==A||b.right.length!==B||b.fits!==Math.floor(A/B))return null;
    event.effect=!b.rest;b.rest=true;event.remainingPieces=A-b.fits*B;event.groupPieces=B;event.denominator=b.denom;
   }else return null;
   events.push(event);
  }
  epochs[epoch].endExclusive=model.history.length;
  const currentVisible=visible(task,b);
  if(fieldKeys.some(k=>!currentVisible.includes(k)&&model[k]!==previous[k])||!same(b,model.board)||
     !b.prediction||!b.forms||!equal(amount(model.answer),result)||
     model.reason!==(['+','-'].includes(task.op)?'same-parts':task.op==='*'?'scale':'groups')||
     !equal(amount(model.aform),a)||!equal(amount(model.bform),c))return null;
  // Common-unit changes and reversible shading invalidate previous fits or
  // combinations without erasing their history. Only later events describe
  // the currently displayed construction; all earlier facts remain in events.
  const currentEvents=events.filter(e=>e.epoch===epoch&&e.index>constructionAfterIndex),common=task.op==='*'?null:{
   denominator:b.denom,unit:unit(b.denom),left:[...b.left],right:[...b.right],counts:counts(b)
  };
  let combination=null,product=null,division=null;
  if(task.op==='*'){
   if(b.columns.length!==b.forms[0][0]||b.rows.length!==b.forms[1][0])return null;
   const cellCount=b.columns.length*b.rows.length,den=b.forms[0][1]*b.forms[1][1];
   if(!equal([BigInt(cellCount),BigInt(den)],result))return null;
   product={columns:[...b.columns],rows:[...b.rows],cellCount,cellArea:unit(den),area:pair(result),
    contiguousColumns:contiguous(b.columns),contiguousRows:contiguous(b.rows)};
  }else{
   if(!b.denom||decimalInteger(model.denom,1,240)!==b.denom)return null;
   const [A,B]=counts(b);if(b.left.length!==A||b.right.length!==B)return null;
   if(task.op==='/'){
    const R=A-b.fits*B;
    if(B<=0||!b.rest||b.fits!==Math.floor(A/B)||R<0||R>=B||
       !equal(amount(model.whole),[BigInt(b.fits),1n])||!equal(amount(model.part),[BigInt(R),BigInt(B)]))return null;
    division={wholeGroups:b.fits,originalPieces:A,groupPieces:B,remainingPieces:R,
     remainingAmount:pair(reduce([BigInt(R),BigInt(b.denom)])),
     fractionOfGroup:pair(reduce([BigInt(R),BigInt(B)])),
     fitIndices:currentEvents.filter(e=>e.action==='fit').map(e=>e.index),
     restIndices:currentEvents.filter(e=>e.action==='rest').map(e=>e.index),toolDisplaysRemainder:true};
   }else{
    if(!b.combined)return null;
    const resultCount=task.op==='+'?A+B:A-B;
    if(!equal([BigInt(resultCount),BigInt(b.denom)],result))return null;
    combination={operator:task.op,leftCount:A,rightCount:B,resultCount,
     combineIndices:currentEvents.filter(e=>e.action==='combine').map(e=>e.index),toolGeneratesResult:true};
   }
  }
  return {operator:task.op,quantities:{a:pair(reduce(a)),b:pair(reduce(c)),result:pair(result)},
   forms:b.forms.map(x=>[...x]),firstPrediction:b.first,currentPrediction:b.prediction,resultKind:size(result),
   predictions,resets,epochs,currentEpoch:epoch,constructionAfterIndex,events,common,combination,product,division,
   submitted:{answer:model.answer,reason:model.reason,whole:task.op==='/'?model.whole:null,part:task.op==='/'?model.part:null},
   predictionAttribution:'recorded-field',independentExplanationAssessed:false};
 }catch{return null;}
}
