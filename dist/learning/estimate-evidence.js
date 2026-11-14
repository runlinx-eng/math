// B11 estimation evidence: only the saved estimate is an interaction event.
// Bounds are derived by the system; inverse checks and claim judgments are
// submitted fields, not independently observed calculations or explanations.
import * as estimates from './phase5/b11-model.js';
import {matchesNativeEvidenceTask,sameEvidence as same,hasExactKeys as keys} from './evidence-contract.js';

const SOURCES=Object.freeze({
 columnthree:{indices:[0,2],nodeId:'mt_SrrsLiJkr3'},
 flexthousand:{indices:[3],nodeId:'mt_HFRYjTb-Z5'},
 columnfour:{indices:[0,2],nodeId:'mt_mpS-JK_p_m'},
 columnlarge:{indices:[0,2],nodeId:'mt_Yw1_4Nfsql'},
 decimalsum:{indices:[0],nodeId:'mt_JH_6RpNWjr'},
 storylarger:{indices:[1,3],nodeId:'mt_-F_Lv_apzH'},
 storymillion:{indices:[0,2],nodeId:'mt_M1tnXqmYbn'},
 checkrough:{indices:[0,1,2],nodeId:'mt_QaYfeVL-0C'},
 checkpurpose:{indices:[0,1,2,3],nodeId:'mt_G3sVFQNCme'},
 decimalmeasure3:{indices:[0],nodeId:'mt_sA2OvTiech'},
 fractionfour:{indices:[12],nodeId:'mt_gNUE4B3vuk'},
 plan38:{indices:[2],nodeId:'mt_O_UOTiMvT_'},
 multi38:{indices:[1,2],nodeId:'mt_RKeheOL9uo'}
});

export function estimateBinding(task,context={}){
 if(!context||typeof context!=='object'||Array.isArray(context)||
    typeof context.sessionId!=='string'||!Number.isInteger(context.index)||context.index<0)return null;
 const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
 if(!source||!source.indices.includes(context.index)||
    !matchesNativeEvidenceTask(task,context,{type:'x-estimatecheck',nodeId:source.nodeId}))return null;
 const question=task.claimed!==undefined?
  '先把两个数取到多细？一个结果落在估计范围内，为什么仍要精算和倒着检查？':task.accuracy!==undefined?
  '想让粗略结果足够接近，两个数应该取到多细？怎样用相反的动作检查精算的结果？':
  '先把两个数取到哪里，粗略结果是多少？精算以后，怎样用相反的动作回到原来的数？';
 return {nodeId:source.nodeId,question,method:null};
}

const text=value=>typeof value==='string'&&value.length<=2000;
const integer=(value,min=-1000000000,max=1000000000)=>Number.isSafeInteger(value)&&value>=min&&value<=max;
const scales=[1,10,100,1000],selectionKeys=['unit','roundedA','roundedB','estimate'];
// The original accepted input spelling is preserved. Convert to fixed-point
// integers first; decimal residues are never rounded into mathematical proof.
function units(value,scale){
 if(!text(value)||!scales.includes(scale))return null;
 const input=value.trim().replace(/[−–－]/g,'-').replace(/＋/g,'+');
 if(!/^[+-]?\d{1,10}(?:\.\d{1,6})?$/.test(input))return null;
 const negative=input[0]==='-',[whole,fraction='']=input.replace(/^[+-]/,'').split('.');
 const places=String(scale).length-1;
 if(fraction.slice(places)&&!/^0+$/.test(fraction.slice(places)))return null;
 const n=BigInt(whole)*BigInt(scale)+BigInt(fraction.slice(0,places).padEnd(places,'0')||'0');
 return n>1000000000n?null:negative?-n:n;
}
const fixed=(value,scale)=>{
 const places=String(scale).length-1,sign=value<0n?'-':'',n=value<0n?-value:value,s=BigInt(scale);
 return sign+String(n/s)+(places?'.'+String(n%s).padStart(places,'0'):'');
};
const halfFixed=(twice,scale)=>twice%2n===0n?fixed(twice/2n,scale):fixed(twice*5n,scale*10);
const nearest=(n,u)=>((2n*n+u)/(2n*u))*u;
const nonnegative=n=>n<0n?0n:n;

export function replayEstimateEvidence(task,model){
 try{
  if(task?.type!=='x-estimatecheck'||!integer(task.a,0)||!integer(task.b,0)||
     !['+','-'].includes(task.op)||!text(task.prompt)||
     Object.keys(task).some(key=>!['type','a','b','op','units','prompt','scale','claimed','accuracy'].includes(key))||
     !Array.isArray(task.units)||!task.units.length||task.units.length>100||
     task.units.some(unit=>!integer(unit,1))||new Set(task.units).size!==task.units.length||
     task.claimed!==undefined&&!integer(task.claimed)||
     task.accuracy!==undefined&&!integer(task.accuracy,1))return null;
  const scale=task.scale??1;
  if(!scales.includes(scale)||!keys(model,['history','issue',...selectionKeys,'first','locked','answer',
     'inverseStart','inverseOp','inversePart','inverseResult','judgment'])||model.issue!==''||
     ![...selectionKeys,'answer','inverseStart','inverseOp','inversePart','inverseResult','judgment'].every(key=>text(model[key]))||
     !Array.isArray(model.history)||model.history.length!==1)return null;
  const event=model.history[0];
  if(!keys(event,['action',...selectionKeys])||event.action!=='b11-estimate'||
     !selectionKeys.every(key=>text(event[key]))||!keys(model.first,selectionKeys)||!keys(model.locked,selectionKeys))return null;
  const selected=Object.fromEntries(selectionKeys.map(key=>[key,event[key]]));
  if(!same(model.first,selected)||!same(model.locked,selected)||
     !same(Object.fromEntries(selectionKeys.map(key=>[key,model[key]])),selected))return null;
  // A real select supplies one configured integer value, not Number() aliases
  // such as hexadecimal or exponent notation that were never UI options.
  const unit=task.units.find(value=>String(value)===event.unit);
  if(unit===undefined||task.accuracy!==undefined&&unit>task.accuracy)return null;
  const a=BigInt(task.a),b=BigInt(task.b),u=BigInt(unit),add=task.op==='+';
  const roundedA=nearest(a,u),roundedB=nearest(b,u),estimate=roundedA+(add?roundedB:-roundedB),answer=a+(add?b:-b);
  if(units(event.roundedA,scale)!==roundedA||units(event.roundedB,scale)!==roundedB||
     units(event.estimate,scale)!==estimate||units(model.answer,scale)!==answer)return null;

  const start=units(model.inverseStart,scale),part=units(model.inversePart,scale),result=units(model.inverseResult,scale);
  const inverseOp=add?'-':'+';
  if(start!==answer||part===null||result===null||model.inverseOp!==inverseOp||
     !(part===b&&result===a||add&&part===a&&result===b)||
     start+(inverseOp==='+'?part:-part)!==result)return null;

  // Twice-unit bounds keep odd units and half-unit endpoints exact. The lower
  // end is closed for a sum and open for a difference; upper ends are open.
  const loA=nonnegative(2n*roundedA-u),hiA=2n*roundedA+u;
  const loB=nonnegative(2n*roundedB-u),hiB=2n*roundedB+u;
  const lowTwice=add?loA+loB:loA-hiB,highTwice=add?hiA+hiB:hiA-loB;
  const lowerInclusive=add;
  let claim=null;
  if(task.claimed!==undefined){
   const value=BigInt(task.claimed),twice=2n*value;
   const plausible=(lowerInclusive?twice>=lowTwice:twice>lowTwice)&&twice<highTwice;
   const judgment=plausible?'plausible':'impossible';
   if(model.judgment!==judgment)return null;
   claim={value:task.claimed,judgment,plausible,exactCorrect:value===answer};
  }else if(model.judgment!=='')return null;

  // Original validity and completion are independent gates, never replaced.
  if(!estimates.valid(task,model)||!estimates.inspect(task,model).correct)return null;
  return {operation:task.op,scale,values:[task.a,task.b],unit,
   rounded:[Number(roundedA),Number(roundedB)],estimate:Number(estimate),answer:Number(answer),estimateEventCount:1,
   bounds:{lowTwice:Number(lowTwice),highTwice:Number(highTwice),denominator:2,lowerInclusive,upperInclusive:false,systemDerived:true},
   inverse:{start:Number(start),operation:inverseOp,part:Number(part),result:Number(result),submissionOnly:true},
   claim,accuracy:task.accuracy===undefined?null:{limit:task.accuracy,selectedUnit:unit,withinLimit:true},
   display:{values:[fixed(a,scale),fixed(b,scale)],unit:fixed(u,scale),
    rounded:[fixed(roundedA,scale),fixed(roundedB,scale)],estimate:fixed(estimate,scale),answer:fixed(answer,scale),
    low:halfFixed(lowTwice,scale),high:halfFixed(highTwice,scale),
    inverse:`${fixed(start,scale)} ${inverseOp==='+'?'+':'−'} ${fixed(part,scale)} = ${fixed(result,scale)}`,
    claim:claim===null?null:fixed(BigInt(claim.value),scale)}};
 }catch{return null;}
}
