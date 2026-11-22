import {initial,valid} from './phase5/b30-model.js';
import {polygonArea} from './phase5/b30-geometry.js';
import {equal} from './phase5/b16-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P086M_SOURCES=Object.freeze([
  {
    "sessionId": "solidSurface",
    "index": 0,
    "nodeId": "mt_Sij9ByyHq6",
    "type": "x-a30-solid",
    "taskHash": "b12960f77dff3c1471cb18cf98d497c17b8a6cdb478c2750b935d856cbcde93e"
  },
  {
    "sessionId": "solidSurface",
    "index": 2,
    "nodeId": "mt_Sij9ByyHq6",
    "type": "x-a30-solid",
    "taskHash": "135458801b6c73fe3e3d3e7986a091a148f7ca04dd4d6c3a28175a6b965764ae"
  }
].map(Object.freeze));

export function p086mPrismMeasuresBinding(task,context) {
  const row=P086M_SOURCES.find(s=>s.sessionId===context?.sessionId&&s.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p086m-prism-measures',method:null,
    question:'哪些面要算外表面积？底面和垂直深度各是多少？'};
}

export function replayP086MPrismMeasuresEvidence(task,model,context) {
  try {
    const binding=p086mPrismMeasuresBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const {board}=initial(task);
    for (const e of model.history) {
      if (!hasExactKeys(e,['a','i','f'])||!hasExactKeys(e.f,[])) return null;
      if (e.a==='turn'&&e.i==='') {
        board.turned=true;
      } else if (e.a==='face') {
        const i=task.faces.findIndex((_,index)=>e.i===String(index));
        if (i<0) return null;
        const at=board.selected.indexOf(i);
        if (at>=0) board.selected.splice(at,1);
        else board.selected.push(i);
        board.first.face??=i;
      } else return null;
    }
    if (!board.turned||!sameEvidence(board,model.board)||
        !sameEvidence([...board.selected].sort((a,b)=>a-b),task.requiredFaces)) return null;
    let base,volume,surface=null;
    if (task.kind==='prism') {
      const faces=task.net.map(row=>polygonArea(row.points));
      const [width,height,length]=task.size;
      base=width*height/2;
      volume=base*length;
      surface=faces.reduce((sum,area)=>sum+area,0);
      if (!faces.every((value,i)=>equal(model.faceValues[i],value))||
          !equal(model.area,surface)||model.unit!==task.unit+'²') return null;
    } else {
      // The source-locked L base is two non-overlapping rectangles and is
      // extruded half a metre in the original model.
      const areas=[3*1,2*3/2];
      base=areas[0]+areas[1];
      volume=base/2;
      if (!areas.every((value,i)=>equal(model.calcValues[i],value))||model.answers[0]!=='surface') return null;
    }
    if (!equal(model.base,base)||!equal(model.volume,volume)||model.volumeUnit!==task.unit+'³') return null;
    return {...binding,base,volume,surface,lengthUnit:task.unit};
  } catch {
    return null;
  }
}

export function submittedP086MPrismMeasuresEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP086MPrismMeasuresEvidence(task,model,context):null;
}
