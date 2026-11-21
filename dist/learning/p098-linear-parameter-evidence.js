import {equal} from './phase5/b16-model.js';
import {initial, inspect, valid} from './phase5/b36-model.js';
import {
  hasExactKeys,
  isEvidenceContext,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

const sessionId = 'linear36';
const nodeId = 'mt_WBdHkc2HTf';
const type = 'x-f36-live';
const kind = 'p098-linear-parameter';
const mode = 'linear';
const originalParameters = {m:1,c:1};
const reviewed = [
  {
    taskHash:'714739071ef5ea036fc663475017f70e0d79c4a353dcd1d1ee34109007878655',
    task:{
      type,prompt:'先留下“每步变化＝1”的线，再试2和−1。起点保持不变，比较线的方向。',mode,
      initial:originalParameters,controls:['m'],required:[{m:1},{m:2},{m:-1}],
      questions:[{label:'每步变化为负时，从左往右看',value:'down',kind:'choice',options:[['down','线向下'],['up','线向上']]}]
    }
  },
  {
    taskHash:'7e02231a65ea7ee793066091285a3a107271de2854637340afb9e053f346ab2b',
    task:{
      type,prompt:'让每步变化保持1，分别留下起点为1、3和−1的线。线怎样移动？',mode,
      initial:originalParameters,controls:['c'],required:[{c:1},{c:3},{c:-1}],
      questions:[{label:'起点是3时，横向为0的位置有多高',value:3,kind:'number'}]
    }
  }
];

export const P098_SOURCES = Object.freeze(reviewed.map(({taskHash},index) =>
  Object.freeze({sessionId,index,nodeId,type,taskHash})
));

export function p098LinearParameterBinding(task,context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId ||
      !sameEvidence(task,reviewed[context.index]?.task) ||
      !matchesNativeEvidenceTask(task,context,{type,nodeId})) return null;
  return {nodeId,kind,method:null,question:'哪一个数改变了？每条线在横向为零的位置有多高，右移一步又怎样变化？'};
}

export function replayP098LinearParameterEvidence(task,model,context) {
  try {
    const binding = p098LinearParameterBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        model.issue !== '' || !model.history.length ||
        Object.keys(model.history).length !== model.history.length) return null;

    const [parameter] = task.controls;
    let current = task.initial[parameter];
    const views = new Map(), actions = [];
    for (const [index,event] of model.history.entries()) {
      if (!hasExactKeys(event,['a','i','v','w','z']) || event.v !== '' || event.w !== '' || event.z !== '') return null;
      if (event.a === 'change') {
        const parts = event.i.split(',');
        if (parts.length !== 2 || parts[0] !== parameter || !['1','-1'].includes(parts[1])) return null;
        const before = current;
        const next = before + Number(parts[1]);
        if (next >= -3 && next <= 3) current = next;
        actions.push({index,action:'change',before,after:current});
        continue;
      }
      if (event.a !== 'save' || event.i !== '') return null;
      const newView = !views.has(current);
      if (newView) views.set(current,index);
      actions.push({index,action:'save',value:current,newView});
    }

    if (!task.required.every(setting => views.has(setting[parameter])) || !views.has(current) ||
        !sameEvidence([...views.keys()].map(value => ({[parameter]:value})),model.board.views) ||
        model.board.m !== (parameter === 'm' ? current : task.initial.m) ||
        model.board.c !== (parameter === 'c' ? current : task.initial.c)) return null;

    const lines = [...views].map(([value,eventIndex]) => {
      const {m,c} = {...task.initial,[parameter]:value};
      const atZero = m*0+c, atOne = m+c;
      return {m,c,atZero,stepChange:atOne-atZero,eventIndex};
    });
    const answerMatches = parameter === 'm' ?
      lines.some(line => line.m === -1 && line.stepChange < 0) && model.answers[0] === 'down' :
      lines.some(line => line.c === 3 && equal(model.answers[0],line.atZero));
    if (!answerMatches || !inspect(task,model).correct) return null;

    return {
      kind,nodeId,sessionId,index:context.index,
      parameter,current,lines,actions,learnerMasteryAssessed:false
    };
  } catch {
    return null;
  }
}

export function submittedP098LinearParameterEvidence(task,model,record,context) {
  if (!latestSubmissionMatches(model,record)) return null;
  return replayP098LinearParameterEvidence(task,model,context);
}
