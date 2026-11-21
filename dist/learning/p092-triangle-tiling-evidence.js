import {initial, inspect, number, valid} from './phase5/b23-model.js';
import {
  hasExactKeys,
  isEvidenceContext,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

const sessionId = 'shapepieces';
const nodeId = 'mt_XjwUlmxdCT';
const type = 'x-s23-tile';
const reviewed = [
  {
    taskHash:'b12e3327abcb31e228519271d2d5bdbf9ec76cd1574608f71a575347fb4a2fab',
    task:{type,prompt:'把两块相同的直角三角形转一转，铺满长方形轮廓。',pattern:'rect',
      slots:2,questions:[{label:'用了几块三角形',value:2}]},
    question:'两块小三角形怎样沿着同一条对角线接起来？'
  },
  {
    taskHash:'bbf4e6c129b8e76d1382d4371158628879659769933d587e85b7fa9de553a766',
    task:{type,prompt:'六块相同的三角形围在一起，铺满一个六边形。',pattern:'hex',
      slots:6,questions:[{label:'六边形的外边有几条',value:6}]},
    question:'每块三角形哪一条边露在外面？围一圈共有几条这样的边？'
  }
];

export const P092_SOURCES = Object.freeze(reviewed.map(({taskHash},index) =>
  Object.freeze({sessionId,index,nodeId,type,taskHash})
));

export function p092TriangleTilingBinding(task,context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId ||
      !sameEvidence(task,reviewed[context.index]?.task) ||
      !matchesNativeEvidenceTask(task,context,{type,nodeId})) return null;
  return {nodeId,kind:'p092-triangle-tiling',method:null,question:reviewed[context.index].question};
}

// A half-turn takes the first right triangle across the shared diagonal.
// For the regular hexagon, consecutive center-to-vertex rays are 60° apart.
// Each triangular sector contributes one outer edge; the radial seams are inside.
const patterns = {
  rect:{step:90,regions:[0,180],outerEdges:4,internalSeams:1},
  hex:{step:60,regions:[0,60,120,180,240,300],outerEdges:6,internalSeams:6}
};

function partition(regions, inOutline, rotations) {
  const pieces = [];
  const outside = [];
  const uses = new Map(regions.map(angle => [angle,0]));
  for (const [piece, placed] of inOutline.entries()) {
    if (!placed) continue;
    const degrees = rotations[piece];
    pieces.push({piece,degrees});
    if (uses.has(degrees)) uses.set(degrees,uses.get(degrees)+1);
    else outside.push(piece);
  }
  const gaps = regions.filter(angle => uses.get(angle) === 0);
  const overlaps = regions.filter(angle => uses.get(angle) > 1);
  return {pieces,outside,gaps,overlaps,complete:!outside.length && !gaps.length && !overlaps.length};
}

export function replayP092TriangleTilingEvidence(task,model,context) {
  try {
    const binding = p092TriangleTilingBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task,1))) || !valid(task,model) ||
        model.issue !== '' || !model.history.length ||
        Object.keys(model.history).length !== model.history.length) return null;

    const {step,regions,outerEdges,internalSeams} = patterns[task.pattern];
    const rotations = Array(task.slots).fill(0);
    const inOutline = Array(task.slots).fill(false);
    const actions = [];
    let shape = partition(regions,inOutline,rotations);
    let assembledOnce = false;

    for (const event of model.history) {
      if (!hasExactKeys(event,['a','f','d']) || !['rotate','place'].includes(event.a) ||
          !hasExactKeys(event.f,['piece']) || !hasExactKeys(event.d,[])) return null;
      const {a, f:{piece:raw}} = event;
      if (raw === '') {
        actions.push({action:a,piece:null,accepted:false});
        continue;
      }
      if (!/^[0-5]$/.test(raw)) return null;
      const piece = Number(raw);
      if (piece >= task.slots) return null;

      if (a === 'rotate') rotations[piece] = (rotations[piece]+step)%360;
      else inOutline[piece] = true;
      shape = partition(regions,inOutline,rotations);
      assembledOnce ||= shape.complete;
      actions.push({action:a,piece,accepted:true,degrees:rotations[piece],onBoard:inOutline[piece],
        gaps:shape.gaps,overlaps:shape.overlaps,outside:shape.outside});
    }

    const board = model.board;
    const slots = inOutline.map((placed,piece) => placed ? piece : null);
    const answer = task.pattern === 'rect' ? shape.pieces.length : outerEdges;
    if (!shape.complete || !sameEvidence(rotations,board.rotations) || !sameEvidence(slots,board.slots) ||
        assembledOnce !== board.assembledOnce || board.separated ||
        number(model.answers[0]) !== answer || !inspect(task,model).correct) return null;
    return {binding,pattern:task.pattern,pieces:shape.pieces,outerEdges,internalSeams,answer,actions};
  } catch {
    return null;
  }
}

export function submittedP092TriangleTilingEvidence(task,model,record,context) {
  if (!latestSubmissionMatches(model,record)) return null;
  return replayP092TriangleTilingEvidence(task,model,context);
}
