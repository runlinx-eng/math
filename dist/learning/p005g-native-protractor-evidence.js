// #342 P005g: three original B25 protractor positions; isolated development evidence.
// No official A promotion, original grader change, or shared evidence registration.
import * as native from './phase5/b25-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const CASES={
 'angleprotractor:0':{
  nodeId:'mt_4MFUAsbx_6',prompt:'移动量角器，让中心和0°线对准，再读橙色边。',
  mode:'measure',amount:47,questions:[{label:'这个角是多少度',value:47}]
 },
 'angleprotractor:1':{
  nodeId:'mt_4MFUAsbx_6',prompt:'把量角器对准，画出135°的开口。',
  mode:'draw',amount:135,questions:[{label:'画出的角是多少度',value:135}]
 },
 'angleprotractor:2':{
  nodeId:'mt_4MFUAsbx_6',prompt:'这个角比直角大。对准量角器，从正确的0°方向读数。',
  mode:'measure',amount:130,questions:[
   {label:'这个角是多少度',value:130},
   {label:'读到50°时',value:'recheck',options:[
    ['recheck','与开口不符，要检查另一排刻度'],['accept','一定是对的']
   ]}
  ]
 }
};
const finiteIntegerText=s=>typeof s==='string'&&/^[1-9][0-9]*$/.test(s)&&
 Number.isSafeInteger(Number(s))?Number(s):null;
function source(task,context){
 if(!isEvidenceContext(context))return null;
 const spec=CASES[context.sessionId+':'+context.index];
 if(!spec||!matchesNativeEvidenceTask(task,context,{
  type:'x-g25-protractor',nodeId:spec.nodeId}))return null;
 if(!keys(task,['type','prompt','mode','amount','questions'])||
  task.prompt!==spec.prompt||task.mode!==spec.mode||task.amount!==spec.amount||
  !same(task.questions,spec.questions))return null;
 return spec;
}
function rayDegrees(angle){
 // Independent ray-based angular check; we do not treat a string answer as a measurement.
 if(!Number.isInteger(angle)||angle<=0||angle>=180)return null;
 const r=angle*Math.PI/180,u=[1,0],v=[Math.cos(r),Math.sin(r)];
 const cross=u[0]*v[1]-u[1]*v[0],dot=u[0]*v[0]+u[1]*v[1];
 const measured=Math.atan2(cross,dot)*180/Math.PI;
 return Number.isFinite(measured)?measured:null;
}
const exactAnswer=spec=>spec.questions.map(q=>String(q.value));
export function protractorBinding(task,context={}){
 const spec=source(task,context);
 return spec?{nodeId:spec.nodeId,kind:'native-protractor-alignment'}:null;
}
export function replayProtractorEvidence(task,model,context={}){
 try{
  const spec=source(task,context);
  if(!spec||!keys(model,Object.keys(native.initial(task,1)))||
   !keys(model.board,['first','x','y','rotation','drawn'])||
   !native.valid(task,model)||!native.inspect(task,model).correct||
   model.issue!==''||!same(model.answers,exactAnswer(spec))||
   !Array.isArray(model.history)||model.history.length<4||
   model.history.length>12||Object.keys(model.history).length!==model.history.length||
   model.board.x!==0||model.board.y!==0||model.board.rotation!==0)return null;
  const target=rayDegrees(spec.amount);
  if(target===null||Math.abs(target-spec.amount)>1e-8)return null;
  let x=-40,y=20,rotation=180,drawn=null,moves=0,flips=0;
  const events=[],draws=[];
  for(const [step,e] of model.history.entries()){
   if(!keys(e,['a','f','d']))return null;
   if(e.a==='move'){
    if(!keys(e.f,[])||!keys(e.d,['index'])||
     !['left','right','up','down'].includes(e.d.index))return null;
    const offsets={left:[-20,0],right:[20,0],up:[0,-20],down:[0,20]};
    const [dx,dy]=offsets[e.d.index],nx=x+dx,ny=y+dy;
    if(Math.abs(nx)>100||Math.abs(ny)>100)return null;
    x=nx;y=ny;drawn=null;moves++;
    events.push({step,action:'move',direction:e.d.index,x,y});
   }else if(e.a==='flip'){
    if(!keys(e.f,[])||!keys(e.d,[]))return null;
    rotation=(rotation+180)%360;drawn=null;flips++;
    events.push({step,action:'flip',rotation});
   }else if(e.a==='draw'&&spec.mode==='draw'){
    if(!keys(e.f,['angle'])||!keys(e.d,[])||
     x!==0||y!==0||rotation!==0)return null;
    const value=finiteIntegerText(e.f.angle);
    if(value===null||value>=180||value===drawn)return null;
    drawn=value;draws.push(value);
    events.push({step,action:'draw',degrees:value});
   }else return null;
  }
  // All original moves are meaningful: no circular undo/repositioning is inferred.
  if(moves!==3||flips!==1||x!==0||y!==0||rotation!==0||
   !same(model.board.first,{move:{},flip:{},
    ...(spec.mode==='draw'?{draw:{angle:String(draws[0])}}:{})})||
   (spec.mode==='measure'?(draws.length!==0||model.board.drawn!==null||model.angle!==''):
    (draws.length<1||draws.length>2||drawn!==spec.amount||
     model.board.drawn!==drawn||model.angle!==String(drawn))))return null;
  const uniqueMoves=events.filter(e=>e.action==='move').map(e=>e.direction).sort();
  if(!same(uniqueMoves,['right','right','up'].sort()))return null;
  const observed=spec.mode==='draw'?rayDegrees(drawn):target;
  if(observed===null||Math.abs(observed-target)>1e-8)return null;
  // Bound every field not exposed by this original protractor UI.
  if(['length','base','a','b','other','prose'].some(k=>model[k]!==''))return null;
  return {kind:'native-protractor-alignment',nodeId:spec.nodeId,
   sessionId:context.sessionId,index:context.index,mode:spec.mode,
   targetDegrees:target,independentlyObservedDegrees:observed,
   alignedCenter:[x,y],zeroLineRotationDegrees:rotation,
   originalControlEvents:events,measuredOrDrawnAfterAlignment:true,
   drawCorrectionObserved:draws.length===2&&draws[0]!==drawn,
   originalAnswersObserved:true,physicalProtractorAssessed:false,
   independentLearnerReasoningAssessed:false,verbalProofAssessed:false,
   generalMasteryAssessed:false,strictAApproved:false};
 }catch{return null;}
}
export function submittedProtractorEvidence(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?
  replayProtractorEvidence(task,model,context):null;
}
