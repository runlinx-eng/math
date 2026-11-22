import {initial, valid} from './phase5/b24-model.js';
import {baseMotif,reflectedMotif,motifAt} from './phase5/b24-geometry.js';
import {equal} from './phase5/b16-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

export const P101F_SOURCES=Object.freeze([Object.freeze({
  sessionId:'patternfloor',index:2,nodeId:'mt_61Nhj8W78f',type:'x-p24-frieze',
  taskHash:'c4fbd3c4e84f77c338faa746ceb82a4c7a3a453a8c20a87ef7b2af4aaca47305',
})]);

export function p101fFriezeBinding(task,context) {
  const [row]=P101F_SOURCES;
  if (context?.sessionId!==row.sessionId||context?.index!==row.index||
      !matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p101f-frieze',method:null,question:'哪一步翻了方向？哪一步只改变位置？'};
}

export function replayP101FFriezeEvidence(task,model,context) {
  try {
    const binding=p101fFriezeBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task,1)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    let mirror=false;
    let repeated=false;
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','d','f'])||!hasExactKeys(event.d,[])||!hasExactKeys(event.f,[])) return null;
      if (event.a==='reset') {
        mirror=false;
        repeated=false;
      } else if (event.a==='friezeMirror') {
        mirror=true;
      } else if (event.a==='friezeRepeat') {
        repeated ||= mirror;
      } else {
        return null;
      }
    }
    if (!mirror||!repeated||mirror!==model.board.mirror||repeated!==model.board.repeated) return null;
    const flipped=baseMotif.map(([x,y])=>[4-x,y]);
    const right=[baseMotif,flipped].map(shape=>shape.map(([x,y])=>[x+4,y]));
    if (!sameEvidence(flipped,reflectedMotif)||
        !sameEvidence(right,[motifAt(baseMotif,4),motifAt(flipped,4)])) return null;
    const parts=[baseMotif.map(point=>[...point]),flipped,...right];
    if (!equal(model.answers[0],parts.length)||model.answers[1]!=='both') return null;
    return {...binding,parts};
  } catch {
    return null;
  }
}

export function submittedP101FFriezeEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP101FFriezeEvidence(task,model,context):null;
}
