import {eq,fn,initial,val,valid} from './phase5/b36-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P098P_SOURCES=Object.freeze([
  {
    "sessionId": "plot36",
    "index": 0,
    "nodeId": "mt_-3udyo6VyB",
    "type": "x-f36-plot",
    "taskHash": "139ac557b035860387eb5db2e25ccb02655583db2786f4ff5460929df30ec55f"
  },
  {
    "sessionId": "quadratic36",
    "index": 0,
    "nodeId": "mt_GZuoYaDdWd",
    "type": "x-f36-plot",
    "taskHash": "628dbe45e9d82d984a049a95e1fe04a39ce2c7ed0070b158e00c63a838f92f4a"
  },
  {
    "sessionId": "quadratic36",
    "index": 2,
    "nodeId": "mt_GZuoYaDdWd",
    "type": "x-f36-plot",
    "taskHash": "b9c69b762412c340305b658862f703414bc93b3a371ac0875007e661bcc6c3f6"
  }
].map(Object.freeze));

export function p098pGraphPlotBinding(task,context) {
  const row=P098P_SOURCES.find(s=>s.sessionId===context?.sessionId&&s.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p098p-graph-plot',method:null,
    question:'每个点的纵坐标怎样由横坐标算出？图在哪些地方过横轴？'};
}

export function replayP098PGraphPlotEvidence(task,model,context) {
  try {
    const binding=p098pGraphPlotBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const {board}=initial(task);
    let rejected=false;
    for (const e of model.history) {
      if (!hasExactKeys(e,['a','i','v','w','z'])) return null;
      rejected=false;
      if (e.a==='point'&&e.i==='') {
        const x=val(e.v), actual=fn(task,e.v);
        board.first.point??=[e.v,e.w];
        if (!task.xs.includes(x)||!actual||!eq(e.w,actual)) {
          rejected=true;
        } else if (!board.points.some(p=>p[0]===x)) {
          board.points.push([x,val(actual)]);
        }
      } else if (e.a==='undo'&&e.i==='') {
        board.points.pop();
        board.roots=[];
      } else if (e.a==='root'&&task.rootSelect) {
        const i=board.points.findIndex((_,j)=>e.i===String(j));
        if (i<0) return null;
        board.first.root??=e.i;
        const old=board.roots.indexOf(i);
        if (old!==-1) board.roots.splice(old,1);
        else if (board.points[i][1]===0) board.roots.push(i);
        else rejected=true;
      } else return null;
      if (rejected) board.bad=true;
    }
    if (rejected||!sameEvidence(board,model.board)||board.points.length!==task.xs.length) return null;
    const xIntercepts=board.roots.map(i=>board.points[i][0]).sort((a,b)=>a-b);
    if (task.rootSelect&&(!sameEvidence(xIntercepts,task.xs.filter(x=>eq(fn(task,x),0)))||
        xIntercepts.length!==task.rootCount)) return null;
    if (!task.questions.every((q,i)=>{
      if (q.kind==='approx') {
        const expected=(i===0?-1:1)*Math.sqrt(-task.c/task.a);
        return Math.abs(val(model.answers[i])-expected)<=q.tolerance;
      }
      return q.kind==='number'&&eq(model.answers[i],task.b);
    })) return null;
    return {...binding,pointCount:board.points.length,selectedIntercepts:xIntercepts};
  } catch {
    return null;
  }
}

export function submittedP098PGraphPlotEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP098PGraphPlotEvidence(task,model,context):null;
}
