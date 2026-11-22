import {initial,valid} from './phase5/b24-model.js';
import {simple,tileAt} from './phase5/b24-geometry.js';
import {number} from './phase5/b20-model.js';
import {equal} from './phase5/b16-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P115T_SOURCES=Object.freeze([Object.freeze({
  sessionId:'patternfloor',index:1,nodeId:'mt_61Nhj8W78f',type:'x-p24-tiles',
  taskHash:'ec3e1b37bc41d0293310b06029f030ede413bb9b422e9db74069e52c49ab7911',
})]);

export function p115tComplementaryTilesBinding(task,context) {
  const [row]=P115T_SOURCES;
  if (context?.sessionId!==row.sessionId||context?.index!==row.index||
      !matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p115t-complementary-tiles',method:null,question:'相邻两块的边怎样完全接上？'};
}

function extentAt(vertices,height) {
  const hits=new Set();
  for (const [i,[x,y]] of vertices.entries()) {
    const [u,v]=vertices[(i+1)%vertices.length];
    if (height===y) hits.add(x);
    if (height>Math.min(y,v)&&height<Math.max(y,v)) hits.add(x+(height-y)*(u-x)/(v-y));
  }
  return [...hits].sort((a,b)=>a-b);
}

function fits(pieces) {
  // All boundaries are straight between these heights. At each seam compare
  // both ends of each segment and verify two distinct boundaries in between.
  for (let row=0;row<2;row++) {
    const [left,right]=pieces.slice(row*2,row*2+2);
    for (const y of [0,0.5,1,2,3,3.5,4].map(h=>h+4*row)) {
      const a=extentAt(left,y);
      const b=extentAt(right,y);
      if (a.length!==2||b.length!==2||a[0]>=a[1]||b[0]>=b[1]||a[1]!==b[0]) return false;
    }
  }
  return [0,1].every(i=>sameEvidence(extentAt(pieces[i],4),extentAt(pieces[i+2],4)));
}

function slot(raw) {
  const value=number(raw);
  return Number.isInteger(value)&&value>=0&&value<=3&&equal(raw,value)?value:null;
}

export function replayP115TComplementaryTilesEvidence(task,model,context) {
  try {
    const binding=p115tComplementaryTilesBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task,1)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    let amplitude=0;
    const rotations=[0,0,0,0];
    const placements=[null,null,null,null];
    for (const {a,d,f} of model.history) {
      if (!hasExactKeys(d,[])) return null;
      if (a==='reset'&&hasExactKeys(f,[])) {
        amplitude=0;
        rotations.fill(0);
        placements.fill(null);
      } else if (a==='design'&&hasExactKeys(f,['amplitude'])) {
        const value=number(f.amplitude);
        if ([-1,1].includes(value)&&equal(f.amplitude,value)) amplitude=value;
      } else if (a==='tileTurn'&&hasExactKeys(f,['item'])) {
        const i=slot(f.item);
        if (i!==null) rotations[i]=(rotations[i]+90)%360;
      } else if (a==='tilePlace'&&hasExactKeys(f,['item','slot'])) {
        const i=slot(f.item);
        const j=slot(f.slot);
        if (amplitude&&i!==null&&j!==null) {
          const old=placements.indexOf(i);
          if (old>=0) placements[old]=null;
          placements[j]=i;
        }
      } else {
        return null;
      }
    }
    if (!amplitude||amplitude!==model.board.amplitude||!equal(model.amplitude,amplitude)||
        !sameEvidence(rotations,model.board.rotations)||!sameEvidence(placements,model.board.placements)||
        placements.includes(null)||new Set(placements).size!==4||!rotations.includes(180)||
        !rotations.every(angle=>[0,180].includes(angle))) return null;
    const pieces=placements.map((piece,i)=>tileAt(amplitude,i%2,Math.floor(i/2),rotations[piece]));
    if (!pieces.every(simple)||!fits(pieces)||!equal(model.answers[0],pieces.length)||model.answers[1]!=='fit') return null;
    return {...binding,pieces};
  } catch {
    return null;
  }
}

export function submittedP115TComplementaryTilesEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP115TComplementaryTilesEvidence(task,model,context):null;
}
