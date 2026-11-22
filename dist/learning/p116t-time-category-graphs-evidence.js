import {initial, number, valid} from './phase5/b20-model.js';
import {equal} from './phase5/b16-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

export const P116T_SOURCES = Object.freeze([
  {
    "sessionId": "timeorcategory",
    "index": 1,
    "nodeId": "mt_ChjMU2GDJa",
    "type": "x-timeplot",
    "taskHash": "52bd14122cd049fcf5c2762b11f0426c23a59208f8ae6593a0572d019f9c78aa"
  },
  {
    "sessionId": "timeorcategory",
    "index": 2,
    "nodeId": "mt_ChjMU2GDJa",
    "type": "x-timeplot",
    "taskHash": "a94a5dec308400fd968d2a165e828531686cc6f047c0292c8598112c5bcaeaae"
  },
  {
    "sessionId": "timebuilder",
    "index": 0,
    "nodeId": "mt_HlNSurPVDp",
    "type": "x-timeplot",
    "taskHash": "855a3e2a5f45acae5d171b053cf04b45aeee5166a6050bd22c4ff828e8567a75"
  },
  {
    "sessionId": "timebuilder",
    "index": 1,
    "nodeId": "mt_HlNSurPVDp",
    "type": "x-timeplot",
    "taskHash": "b464f6e140fc3796fa1264b2c8e9771e44c9c2ed1a4c9d1e5f3881ed4c702ab8"
  },
  {
    "sessionId": "timebuilder",
    "index": 2,
    "nodeId": "mt_HlNSurPVDp",
    "type": "x-timeplot",
    "taskHash": "1a426cad60963ba5303c2eb7c931b9559c80951f4d7dffd3ff278eafbc55389f"
  }
].map(Object.freeze));

export function p116tTimeCategoryGraphsBinding(task,context) {
  const row=P116T_SOURCES.find(source=>source.sessionId===context?.sessionId&&source.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p116t-time-category-graphs',method:null,question:'时间间隔、数轴刻度和记录值各自决定什么？'};
}

function answersMatch(context,answers,points) {
  const [a,b,c,d]=points;
  if (context.sessionId==='timeorcategory') return equal(answers[0],context.index===1?c[1]:a[1]-b[1]);
  if (context.index===0) return equal(answers[0],points.at(-1)[1]);
  if (context.index===2) return equal(answers[0],b[1]-a[1])&&answers[1]==='look';
  const [rise,run]=[c[1]-b[1],c[0]-b[0]];
  const twiceRun=2*run;
  const atHalfHour=twiceRun*b[1]+rise;
  const slopes=[[b[1]-a[1],b[0]-a[0]],[rise,run],[d[1]-c[1],d[0]-c[0]]];
  const fastest=slopes.reduce((best,[r,w],i)=>r*slopes[best][1]>slopes[best][0]*w?i:best,0);
  return equal(answers[0],atHalfHour,twiceRun)&&equal(answers[1],rise,run)&&
    answers[2]===String(fastest)&&answers[3]==='estimate';
}

export function replayP116TTimeCategoryGraphsEvidence(task,model,context) {
  try {
    const binding=p116tTimeCategoryGraphsBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const fresh=()=>task.build?task.points.map(()=>null):task.points.map(point=>[...point]);
    let points=fresh();
    const entries=Array(task.points.length).fill(null);
    let connected=!task.build;
    let cursor=0;
    let scale=task.yTicks[0];
    let scales=[scale];
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','d','f'])) return null;
      if (event.a==='row'&&hasExactKeys(event.d,['index'])&&task.build) {
        const i=number(event.d.index);
        if (!Number.isInteger(i)||i<0||i>=points.length||!equal(event.d.index,i)) return null;
        cursor=i;
        continue;
      }
      if (!hasExactKeys(event.d,[])) return null;
      if (event.a==='reset') {
        points=fresh();
        entries.fill(null);
        connected=!task.build;
        cursor=0;
        scale=task.yTicks[0];
        scales=[scale];
      } else if (event.a==='scale') {
        const tick=number(event.f.tick);
        if (!task.yTicks.includes(tick)) continue;
        if (!equal(event.f.tick,tick)) return null;
        scale=tick;
        if (!scales.includes(tick)) scales.push(tick);
      } else if (event.a==='point'&&task.build) {
        const x=number(event.f.x);
        const y=number(event.f.y);
        if (!(x>=task.xDomain[0]&&x<=task.xDomain[1]&&y>=task.yDomain[0]&&y<=task.yDomain[1])) continue;
        points[cursor]=[x,y];
        entries[cursor]=[event.f.x,event.f.y];
        connected=false;
        const next=points.indexOf(null);
        if (next>=0) cursor=next;
      } else if (event.a==='connect'&&task.build&&task.kind==='time') {
        if (points.every(Boolean)) connected=true;
      } else {
        return null;
      }
    }
    if (!sameEvidence(points,task.points)||!sameEvidence(points,model.board.points)||connected!==model.board.connected||
        cursor!==model.board.cursor||scale!==model.board.scale||!sameEvidence(scales,model.board.scales)) return null;
    if (task.build) {
      if (model.chart!==(task.kind==='time'?'line':'bar')||model.xaxis!=='x'||model.yaxis!=='y'||
          (task.kind==='time'&&!connected)) return null;
      if (!entries.every((entry,i)=>entry&&equal(entry[0],points[i][0])&&equal(entry[1],points[i][1]))) return null;
    }
    if ((task.changeScale&&scales.length<2)||!answersMatch(context,model.answers,points)) return null;
    return {...binding,points,chart:task.kind,scales};
  } catch {
    return null;
  }
}

export function submittedP116TTimeCategoryGraphsEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP116TTimeCategoryGraphsEvidence(task,model,context):null;
}
