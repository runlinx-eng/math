import {initial,inspect,valid} from './phase5/b25-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

const source=Object.freeze({sessionId:'linenotation',index:2,nodeId:'mt_e4V6hvcuEJ',type:'x-g25-ticks',
  taskHash:'f586e383c91a66d9f4b592d237c834f39cb18230a3dfc4d26665eda597fff4c1'});
const original={type:source.type,prompt:'给两组等长的对边画刻痕：一组画一条，另一组画两条。',
  questions:[{label:'两条边有相同刻痕',value:'equal',
    options:[['equal','标出的这两条边等长'],['angle','它们一定互相垂直']]}]};
export const P054_SOURCES=Object.freeze([source]);

export function p054OppositeSideMarksBinding(task,context) {
  if (context?.sessionId!==source.sessionId || context.index!==source.index ||
      !sameEvidence(task,original) || !matchesNativeEvidenceTask(task,context,source)) return null;
  return {nodeId:source.nodeId,kind:'p054-opposite-side-marks',method:null,
    question:'哪两条边是一对等长的对边？为什么另外一对要用另一种刻痕？'};
}

export function replayP054OppositeSideMarksEvidence(task,model,context) {
  try {
    const binding=p054OppositeSideMarksBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task,1))) || !valid(task,model) ||
        model.issue!=='' || !model.history.length || Object.keys(model.history).length!==model.history.length) return null;
    const marks=[0,0,0,0], actions=[];
    for (const e of model.history) {
      if (!hasExactKeys(e,['a','f','d']) || e.a!=='markSide' || !hasExactKeys(e.f,[]) ||
          !hasExactKeys(e.d,['index']) || !/^[0-3]$/.test(e.d.index)) return null;
      const side=Number(e.d.index);
      marks[side]=(marks[side]+1)%3;
      actions.push({side,marks:marks[side]});
    }
    const oppositePairs=[[0,2],[1,3]];
    if (!oppositePairs.every(([a,b])=>marks[a]>0 && marks[a]===marks[b]) ||
        marks[0]===marks[1] || !sameEvidence(marks,model.board.marks) ||
        model.answers[0]!=='equal' || !inspect(task,model).correct) return null;
    return {binding,oppositePairs,marks,actions};
  } catch {
    return null;
  }
}

export function submittedP054OppositeSideMarksEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record) ? replayP054OppositeSideMarksEvidence(task,model,context) : null;
}
