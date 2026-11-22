import {initial, valid} from './phase5/b24-model.js';
import {equal} from './phase5/b16-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

import {number} from './phase5/b20-model.js';
import {simple} from './phase5/b24-geometry.js';

export const P115G_SOURCES = Object.freeze([
  {
    "sessionId": "pointbuild",
    "index": 0,
    "nodeId": "mt_i5_HnoFOYw",
    "type": "x-p24-grid",
    "taskHash": "0ba7ff37a93d039608fe8c61be23910c6db795a01e8a0353de23b87639e7d90f"
  },
  {
    "sessionId": "pointbuild",
    "index": 1,
    "nodeId": "mt_i5_HnoFOYw",
    "type": "x-p24-grid",
    "taskHash": "261471586246a19595c3fff883730187033f78105907fbc69c972bee6401c160"
  },
  {
    "sessionId": "pointbuild",
    "index": 2,
    "nodeId": "mt_i5_HnoFOYw",
    "type": "x-p24-grid",
    "taskHash": "26f0865e339077f011a88d8cce0b4fb3e0d376f74787dfdddd4cf05d0bde03e9"
  },
  {
    "sessionId": "pointaxes",
    "index": 0,
    "nodeId": "mt_oDlduFnemk",
    "type": "x-p24-grid",
    "taskHash": "c3b3e1d71e872611634915dcf5da9d94b12eb99648d5a0d707c74d82b98aecb0"
  },
  {
    "sessionId": "pointaxes",
    "index": 1,
    "nodeId": "mt_oDlduFnemk",
    "type": "x-p24-grid",
    "taskHash": "c5c254dc112767ec7e4a6bbe9a0887b7b1db13ec99a85da13e518ed2e5f7053a"
  },
  {
    "sessionId": "pointaxes",
    "index": 2,
    "nodeId": "mt_oDlduFnemk",
    "type": "x-p24-grid",
    "taskHash": "ba39ec664b80769f388127c25044a59b9b0ca960168d0e911b0e4d3b4efba50e"
  },
  {
    "sessionId": "pointdistance",
    "index": 0,
    "nodeId": "mt_h7zVgCDVmx",
    "type": "x-p24-grid",
    "taskHash": "cd43f31da42ff261d50ecf45050036db836281ec81967f2f8d301dd06d02a824"
  },
  {
    "sessionId": "pointstory",
    "index": 0,
    "nodeId": "mt_snlqRCiA1R",
    "type": "x-p24-grid",
    "taskHash": "10a837fa383bb4d5ca2ab88b3f88373a787419608d983bc908080f26c32cf380"
  },
  {
    "sessionId": "pointstory",
    "index": 1,
    "nodeId": "mt_snlqRCiA1R",
    "type": "x-p24-grid",
    "taskHash": "d7741a4c44d48e4fe5a691d6e5263d1277f77618547be1756c04f9f9db8a1fcc"
  }
].map(Object.freeze));

export function p115gCoordinateConstructionBinding(task,context) {
  const row=P115G_SOURCES.find(source=>source.sessionId===context?.sessionId&&source.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p115g-coordinate-construction',method:null,question:'横纵坐标怎样确定点？连成的图形有哪些可以算出的量？'};
}

function questionsMatch(context,model,placed,polygon) {
  const {sessionId,index}=context;
  const answers=model.answers;
  const [first]=placed;
  if (sessionId==='pointaxes') {
    if (index===0) return sameEvidence(first,[0,0])&&sameEvidence(answers,['x','y']);
    if (index===2) return placed.length===2&&
      placed[0][0]===placed[1][1]&&placed[0][1]===placed[1][0]&&answers[0]==='different';
  }
  if (sessionId==='pointstory'&&index===1) return placed.some(point=>sameEvidence(point,[2,4]))&&answers[0]==='meaning';
  if (sessionId==='pointbuild'&&index===2) return equal(answers[0],polygon.length);
  if (sessionId==='pointbuild'&&index===1) {
    const square=polygon.map(([x,y],i)=>{
      const [a,b]=polygon[(i+1)%polygon.length];
      return (a-x)**2+(b-y)**2;
    });
    if (!square.every(side=>side===square[0])) return false;
  }
  if (sessionId==='pointdistance'||(sessionId==='pointbuild'&&index===0)) {
    const xs=polygon.map(p=>p[0]);
    const ys=polygon.map(p=>p[1]);
    const width=Math.max(...xs)-Math.min(...xs);
    const height=Math.max(...ys)-Math.min(...ys);
    const expected=[width,height,2*(width+height),width*height];
    return answers.every((answer,i)=>equal(answer,expected[i]));
  }
  return answers.length===2&&answers.every((answer,i)=>equal(answer,first[i]));
}

export function replayP115GCoordinateConstructionEvidence(task,model,context) {
  try {
    const binding=p115gCoordinateConstructionBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task,1)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    let placed=[];
    let closed=false;
    const [x0,x1,y0,y1]=task.domain;
    const width=x1-x0+1;
    const inRange=([x,y])=>Number.isSafeInteger(x)&&Number.isSafeInteger(y)&&x>=x0&&x<=x1&&y>=y0&&y<=y1;

    for (const event of model.history) {
      if (!hasExactKeys(event,['a','d','f'])) return null;
      let point;
      if (event.a==='plot'&&hasExactKeys(event.f,['x','y'])&&hasExactKeys(event.d,[])) {
        point=[number(event.f.x),number(event.f.y)];
        if (!inRange(point)) continue;
        if (!equal(event.f.x,point[0])||!equal(event.f.y,point[1])) return null;
      } else if (event.a==='dot'&&hasExactKeys(event.f,[])&&hasExactKeys(event.d,['index'])&&/^\d+$/.test(event.d.index)) {
        const i=Number(event.d.index);
        if (i>=width*(y1-y0+1)) return null;
        point=[x0+i%width,y0+Math.floor(i/width)];
      } else if (hasExactKeys(event.d,[])&&hasExactKeys(event.f,[])) {
        if (event.a==='undo') {
          placed.pop();
          closed=false;
        } else if (event.a==='reset') {
          placed=[];
          closed=false;
        } else if (event.a==='close'&&task.close) {
          closed ||= simple([...task.given,...placed]);
        } else {
          return null;
        }
        continue;
      } else {
        return null;
      }
      if (placed.length<16&&![...task.given,...placed].some(p=>sameEvidence(p,point))) {
        placed.push(point);
        closed=false;
      }
    }
    const polygon=[...task.given,...placed];
    if (!sameEvidence(placed,model.board.placed)||closed!==model.board.closed||
        placed.length!==task.target.length||!task.target.every(target=>placed.some(p=>sameEvidence(p,target)))||
        (task.close&&(!closed||!simple(polygon)))||!questionsMatch(context,model,placed,polygon)) return null;
    return {...binding,placed,closed};
  } catch {
    return null;
  }
}

export function submittedP115GCoordinateConstructionEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP115GCoordinateConstructionEvidence(task,model,context):null;
}
