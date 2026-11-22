import {initial, valid} from './phase5/b24-model.js';
import {studioBase,studioParts,samePolygons} from './phase5/b24-geometry.js';
import {equal} from './phase5/b16-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask} from './evidence-contract.js';

export const P115S_SOURCES=Object.freeze([Object.freeze({
  sessionId:'geometrylab',index:3,nodeId:'mt_RdfzwInyAj',type:'x-p24-studio',
  taskHash:'35fdfaebdb96347e8d5e9f10d633f74b3067f95db3dcd87ea4a19935dd546739',
})]);

export function p115sStudioSymmetryBinding(task,context) {
  const [row]=P115S_SOURCES;
  if (context?.sessionId!==row.sessionId||context?.index!==row.index||
      !matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p115s-studio-symmetry',method:null,question:'沿哪些直线翻转会重合？转半圈呢？'};
}

export function replayP115SStudioSymmetryEvidence(task,model,context) {
  try {
    const binding=p115sStudioSymmetryBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task,1)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    let mirror=false;
    let rotated=false;
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','d','f'])||!hasExactKeys(event.d,[])||!hasExactKeys(event.f,[])) return null;
      if (event.a==='reset') {
        mirror=false;
        rotated=false;
      } else if (event.a==='studioMirror') {
        mirror=true;
      } else if (event.a==='studioRotate') {
        rotated ||= mirror;
      } else {
        return null;
      }
    }
    if (!mirror||!rotated||mirror!==model.board.mirror||rotated!==model.board.rotated) return null;
    const firstPair=[studioBase,studioBase.map(([x,y])=>[-x,y])];
    const parts=[...firstPair,...firstPair.map(shape=>shape.map(([x,y])=>[-x,-y]))];
    const transformed=map=>parts.map(shape=>shape.map(map));
    if (!samePolygons(parts,studioParts(true,true))||
        !samePolygons(parts,transformed(([x,y])=>[-x,y]))||
        !samePolygons(parts,transformed(([x,y])=>[x,-y]))||
        !samePolygons(parts,transformed(([x,y])=>[-x,-y]))||
        model.answers[0]!=='both'||!equal(model.answers[1],180)) return null;
    return {...binding,parts};
  } catch {
    return null;
  }
}

export function submittedP115SStudioSymmetryEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP115SStudioSymmetryEvidence(task,model,context):null;
}
