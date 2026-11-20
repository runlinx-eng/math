// #306: narrow, unregistered clock-setting candidate. Never grant A until
// frozen native hashes, adversarial tests, original Chromium and new-main gates.
// Replays actual hour/minute controls; correct displayed time alone is insufficient.
import * as clock from './phase5/b32-model.js';
import {matchesNativeEvidenceTask,hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const CASES=Object.freeze({
 hourclock:{index:2,nodeId:'mt_0XxyaQLRhn',target:150,minute:30},
 fiveclock:{index:2,nodeId:'mt_HNOPGJYiRK',target:220,minute:40},
 quarterclock:{index:1,nodeId:'mt_MgsDabdnr1',target:405,minute:45}
});
const exact=(s,min,max)=>typeof s==='string'&&/^(0|[1-9][0-9]*)$/.test(s)&&
 Number.isSafeInteger(Number(s))&&Number(s)>=min&&Number(s)<=max;

export function clockSettingBinding(task,context={}){
 const c=Object.hasOwn(CASES,context?.sessionId)?CASES[context.sessionId]:null;
 if(!c||context.index!==c.index||!matchesNativeEvidenceTask(task,context,
  {type:'x-t32-clock',nodeId:c.nodeId})||task.mode!=='set'||
  task.initial!==65||task.value!==c.target)return null;
 return {nodeId:c.nodeId,kind:'clock-setting',method:null,
  question:'长针每前进一分钟，短针为什么也会缓慢前进？最后短针应落在两个整点之间的哪里？'};
}
export function replayClockSettingEvidence(task,model,context={}){
 try{
  const binding=clockSettingBinding(task,context);
  if(!binding||!keys(model,['hour','minute','jump','prose','answers','board','history','issue'])||
    !Array.isArray(model.history)||model.history.length<2||model.history.length>1200||
    !clock.valid(task,model)||!clock.inspect(task,model).correct||
    model.issue!==''||!exact(model.hour,1,12)||!exact(model.minute,0,59))return null;
  let hour=1,minute=5,firstHour=null,firstMinute=null;
  let changedHour=false,changedMinute=false;
  const steps=[];
  for(const [at,e] of model.history.entries()){
   if(!keys(e,['a','i','v'])||e.v!==''||!['hour','minute'].includes(e.a))return null;
   const before={hour,minute};
   if(e.a==='hour'){
    if(!exact(e.i,1,12))return null;
    hour=Number(e.i)%12;firstHour??=Number(e.i);
    changedHour||=before.hour!==hour;
   }else{
    if(!exact(e.i,0,59))return null;
    minute=Number(e.i);firstMinute??=Number(e.i);
    changedMinute||=before.minute!==minute;
   }
   steps.push({at,control:e.a,from:before,to:{hour,minute},
    hourHandHalfDegrees:hour*60+minute,minuteHandDegrees:minute*6});
  }
  const finalMinutes=hour*60+minute;
  if(!changedHour||!changedMinute||firstHour===null||firstMinute===null||
     finalMinutes!==task.value%720||minute!==CASES[context.sessionId].minute||
     model.hour!==String(hour||12)||model.minute!==String(minute)||
     !same(model.board,{first:{hour:firstHour,minute:firstMinute},
       bad:false,hour,minute,changed:true}))return null;
  return {kind:'clock-setting',nodeId:binding.nodeId,sessionId:context.sessionId,index:context.index,
   initialMinutes:65,finalMinutes,hour,minute,
   hourHandHalfDegrees:hour*60+minute,minuteHandDegrees:minute*6,
   chronologicalControls:steps,sourceClockReplayed:true,
   continuousHourHandVerified:true,independentClockReadingAssessed:false,
   actualHandDrawingAssessed:false,learnerMasteryAssessed:false};
 }catch{return null;}
}
