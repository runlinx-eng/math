import {initial, valid} from './phase5/b24-model.js';
import {equal} from './phase5/b16-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

import {motifMatches,motifs,rotate,samePolygons} from './phase5/b24-geometry.js';

export const P101S_SOURCES = Object.freeze([
  {
    "sessionId": "turnsym",
    "index": 0,
    "nodeId": "mt_NM5I3yN-Q6",
    "type": "x-p24-spin",
    "taskHash": "af2d9f7a67e72beeb017ef38da9794067475abdfd2787492879239691668e3f6"
  },
  {
    "sessionId": "turnsym",
    "index": 1,
    "nodeId": "mt_NM5I3yN-Q6",
    "type": "x-p24-spin",
    "taskHash": "581db9aa2035473a4628d56b096086fd0ae470efd72de16e7434952bda68ace3"
  },
  {
    "sessionId": "turnsym",
    "index": 2,
    "nodeId": "mt_NM5I3yN-Q6",
    "type": "x-p24-spin",
    "taskHash": "523af51fb09f8bff1f44d4d5093b99edb72f0bbf56c35884a28d5318c28c6f9c"
  }
].map(Object.freeze));

export function p101sRotationSymmetryBinding(task,context) {
  const row=P101S_SOURCES.find(source=>source.sessionId===context?.sessionId&&source.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p101s-rotation-symmetry',method:null,question:'转过多少角度时，整个图形才与原来的位置重合？'};
}

const toggle=(set,i)=>set.has(i)?set.delete(i):set.add(i);

function squareEvidence(history,board,answer) {
  let angle=0;
  let matches=[];
  for (const event of history) {
    if (!hasExactKeys(event.d,[])) return null;
    if (event.a==='reset') {
      angle=0;
      matches=[];
    } else if (event.a==='spin') {
      angle+=90;
      if (motifMatches('square',angle)) matches.push(angle);
    } else {
      return null;
    }
  }
  const withinTurn=matches.filter(value=>0<value&&value<=360);
  if (angle!==board.angle||!sameEvidence(matches,board.matches)||withinTurn.length!==4||
      !equal(answer,withinTurn.length)) return null;
  return {matches:withinTurn};
}

function classifyEvidence(history,board,answer) {
  const tested=new Set();
  const selected=new Set();
  let last=null;
  for (const event of history) {
    if (event.a==='reset'&&hasExactKeys(event.d,[])) {
      tested.clear();
      selected.clear();
      last=null;
      continue;
    }
    if (!hasExactKeys(event.d,['index'])||!['0','1','2'].includes(event.d.index)) return null;
    const i=Number(event.d.index);
    if (event.a==='spin') {
      tested.add(i);
      last=i;
    } else if (event.a==='choose') {
      toggle(selected,i);
    } else {
      return null;
    }
  }
  const expected=['pinwheel','heart','triangle'].flatMap((name,i)=>motifMatches(name,[90,180,120][i])?[i]:[]);
  if (tested.size!==3||last!==board.last||!sameEvidence([...tested],board.tested)||
      !sameEvidence([...selected],board.selected)||!sameEvidence([...selected].sort(),expected)||answer!=='no') return null;
  return {selected:expected};
}

function bladeEvidence(history,board,answer) {
  const rotations=[0,0,0,0];
  const placed=new Set();
  for (const event of history) {
    if (event.a==='reset'&&hasExactKeys(event.d,[])) {
      rotations.fill(0);
      placed.clear();
      continue;
    }
    if (!hasExactKeys(event.d,['index'])||!['0','1','2','3'].includes(event.d.index)) return null;
    const i=Number(event.d.index);
    if (event.a==='pieceTurn') rotations[i]=(rotations[i]+90)%360;
    else if (event.a==='piecePlace') toggle(placed,i);
    else return null;
  }
  if (placed.size!==4||new Set(rotations).size!==4||!sameEvidence(rotations,board.rotations)||
      !sameEvidence([...placed],board.placed)||!equal(answer,placed.size)) return null;
  const blades=rotations.map(angle=>motifs.pinwheel[0].map(point=>rotate(point,[0,0],angle)));
  const rotated=blades.map(blade=>blade.map(([x,y])=>[-y,x]));
  return samePolygons(blades,rotated)?{rotations}:null;
}

export function replayP101SRotationSymmetryEvidence(task,model,context) {
  try {
    const binding=p101sRotationSymmetryBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task,1)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length||
        !model.history.every(event=>hasExactKeys(event,['a','d','f'])&&hasExactKeys(event.f,[]))) return null;
    const check={square:squareEvidence,classify:classifyEvidence,build:bladeEvidence}[task.mode];
    const evidence=check(model.history,model.board,model.answers[0]);
    return evidence?{...binding,mode:task.mode,...evidence}:null;
  } catch {
    return null;
  }
}

export function submittedP101SRotationSymmetryEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP101SRotationSymmetryEvidence(task,model,context):null;
}
