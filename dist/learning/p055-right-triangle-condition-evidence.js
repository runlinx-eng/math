import {initial, inspect, valid} from './phase5/b26-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const source=Object.freeze({sessionId:'pythagoras',index:1,nodeId:'mt_1VmTUxBrNd',type:'x-g26-check',
  taskHash:'26539f6dcbf85c9df81d08b9de9ceaf4112cec899e8c586b6eea6f252c6c1c8c'});
const original={type:source.type,prompt:'先检查两幅图的角，选出可以使用这个面积关系的图形。',
  shapes:[[[0,0],[4,0],[0,3]],[[0,0],[4,0],[2,3]]],
  questions:[{label:'这个关系适用于',value:'right',options:[['right','直角三角形'],['all','所有三角形']]}]};
export const P055_SOURCES=Object.freeze([source]);

export function p055RightTriangleConditionBinding(task,context) {
  if (context?.sessionId!==source.sessionId || context.index!==source.index ||
      !sameEvidence(task,original) || !matchesNativeEvidenceTask(task,context,source)) return null;
  return {nodeId:source.nodeId,kind:'p055-right-triangle-condition',method:null,
    question:'两个图形都试过后，哪个图形有直角？这个面积关系需要什么条件？'};
}

export function replayP055RightTriangleConditionEvidence(task,model,context) {
  try {
    const binding=p055RightTriangleConditionBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task,1))) || !valid(task,model) ||
        model.issue!=='' || !model.history.length || Object.keys(model.history).length!==model.history.length) return null;
    const angleProducts=task.shapes.map(points=>points.map(([x,y],i)=>{
      const [ax,ay]=points[(i+1)%3], [bx,by]=points[(i+2)%3];
      return (ax-x)*(bx-x)+(ay-y)*(by-y);
    }));
    const eligible=angleProducts.flatMap((angles,i)=>angles.includes(0)?[i]:[]);
    const probed=new Set(), actions=[];
    let chosen=null;
    for (const e of model.history) {
      if (!hasExactKeys(e,['a','f','d']) || !hasExactKeys(e.f,[]) ||
          !hasExactKeys(e.d,['index']) || !/^[01]$/.test(e.d.index)) return null;
      const i=Number(e.d.index);
      if (e.a==='probe') probed.add(i);
      else if (e.a==='choose') chosen=i;
      else return null;
      actions.push({action:e.a,shape:i});
    }
    if (eligible.length!==1 || chosen!==eligible[0] || probed.size!==task.shapes.length ||
        !sameEvidence([...probed],model.board.tested) || chosen!==model.board.choice ||
        model.answers[0]!=='right' || !inspect(task,model).correct) return null;
    return {binding,chosen,angleProducts,tested:[...probed],actions};
  } catch {
    return null;
  }
}

export function submittedP055RightTriangleConditionEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record) ? replayP055RightTriangleConditionEvidence(task,model,context) : null;
}
