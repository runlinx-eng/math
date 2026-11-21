import {initial, inspect, valid} from './phase5/b27-model.js';
import {
  hasExactKeys,
  isEvidenceContext,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

const sessionId = 'foldprism';
const nodeId = 'mt_REwgr0d_ss';
const type = 'x-g27-net';
const index = 1;
const taskHash = '83a0880b9b15d44dc40014d7e2601d24b6694349a5e1ee5632a01e5cac631126';
const reviewed = {
  type,
  prompt:'自己把三片长方形和两片三角形接起来，试着合成两头是三角形的盒子。',
  rotate:true
};

export const P093_SOURCES = Object.freeze([Object.freeze({sessionId,index,nodeId,type,taskHash})]);

export function p093TriangularPrismNetBinding(task,context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId || context.index !== index ||
      !sameEvidence(task,reviewed) || !matchesNativeEvidenceTask(task,context,{type,nodeId})) return null;
  return {
    nodeId,kind:'p093-triangular-prism-net',method:null,
    question:'三片长方形怎样围成侧面？还要把两片三角形接在哪里，才能合上两头？'
  };
}

// Vertices 0, 1, 2 belong to one end and 3, 4, 5 to the other.
// The first face is fixed. Button indices select the following four faces.
const faces = [[0,1,4,3],[1,2,5,4],[2,0,3,5],[0,1,2],[3,4,5]];

function foldedShell(parts) {
  const attached = [faces[0],...parts.map(part => faces[part+1])];
  const vertices = new Set();
  const edgeUses = new Map();
  let rectangles = 0;
  let triangles = 0;
  for (const face of attached) {
    if (face.length === 4) rectangles++;
    if (face.length === 3) triangles++;
    face.forEach((from,i) => {
      const to = face[(i+1)%face.length];
      const key = Math.min(from,to) + ':' + Math.max(from,to);
      vertices.add(from);
      edgeUses.set(key,(edgeUses.get(key) || 0) + 1);
    });
  }
  const openEdges = [...edgeUses.values()].filter(count => count === 1).length;
  const closed = rectangles === 3 && triangles === 2 && vertices.size === 6 &&
    edgeUses.size === 9 && [...edgeUses.values()].every(count => count === 2);
  return {rectangles,triangles,vertices:vertices.size,edges:edgeUses.size,openEdges,closed};
}

function hasIndex(data, pattern) {
  return hasExactKeys(data,['index']) &&
    typeof data.index === 'string' && pattern.test(data.index);
}

export function replayP093TriangularPrismNetEvidence(task,model,context) {
  try {
    const binding = p093TriangularPrismNetBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task,1))) || !valid(task,model) ||
        model.issue !== '' || !model.history.length ||
        Object.keys(model.history).length !== model.history.length) return null;

    const attached = new Set();
    const folds = [];
    const observations = [];
    let prediction = null;
    let fold = 0;
    let turns = 0;
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','d'])) return null;
      const {a,d} = event;
      if (a === 'piece' && hasIndex(d,/^[0-3]$/)) {
        const part = Number(d.index);
        if (fold !== 0) {
          observations.push({action:a,part,accepted:false});
          continue;
        }
        if (!attached.delete(part)) attached.add(part);
        prediction = null;
        observations.push({action:a,part,accepted:true,attached:attached.has(part)});
      } else if (a === 'predict' && fold === 0 && hasIndex(d,/^(yes|no)$/)) {
        prediction = d.index;
        observations.push({action:a,prediction});
      } else if (a === 'fold' && prediction !== null &&
          (hasExactKeys(d,[]) || hasIndex(d,/^(0|[1-9]\d?|100)$/))) {
        const position = Number(d.index ?? 100);
        if (position === 100 && fold !== 100) {
          const parts = [...attached].sort();
          folds.push({parts,prediction,...foldedShell(parts)});
        }
        fold = position;
        observations.push({action:a,position});
      } else if (a === 'unfold' && fold === 100 && hasExactKeys(d,[])) {
        fold = 0;
        prediction = null;
        observations.push({action:a});
      } else if (a === 'turn' && hasExactKeys(d,[])) {
        turns++;
      } else if (!(a === 'probe' && hasExactKeys(d,[]))) {
        return null;
      }
    }

    const parts = [...attached].sort();
    const geometry = foldedShell(parts);
    const last = folds.at(-1);
    const board = model.board;
    if (!geometry.closed || !last?.closed || last.prediction !== 'yes' ||
        prediction !== 'yes' || fold !== 100 || !turns ||
        !sameEvidence(parts,board.parts) || fold !== board.fold ||
        prediction !== board.prediction || board.turned !== true ||
        !sameEvidence(folds.map(({parts,prediction}) => ({parts,prediction})),board.attempts) ||
        !inspect(task,model).correct) return null;
    return {binding,geometry,folds,turns,observations};
  } catch {
    return null;
  }
}

export function submittedP093TriangularPrismNetEvidence(task,model,record,context) {
  if (!latestSubmissionMatches(model,record)) return null;
  return replayP093TriangularPrismNetEvidence(task,model,context);
}
