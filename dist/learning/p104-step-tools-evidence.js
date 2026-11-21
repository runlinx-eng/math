import {equal, parse} from './phase5/b09-math.js';
import {initial, inspect, valid} from './phase5/b09-model.js';
import {
  hasExactKeys,
  isEvidenceContext,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

const sessionId = 'toolchoice';
const nodeId = 'mt_zMEvtigoM3';
const type = 'x-toolwork';
const kind = 'p104-step-tools';
const mode = 'calculate';
const reviewed = [
  {
    taskHash:'f737425d54111adc53d3a5b1525b5cfa9ade58ff320f70ef0075cf48167f808b',
    task:{type,mode,start:34,change:28,prompt:'算34+28。选数轴或百数表，用十和一走到结果；也可以换工具比较。'}
  },
  {
    taskHash:'b370a5b450a6c320a6a883e3c0ce8f1c96646b7c3c54f1cd9b6355f1bbf7eaf6',
    task:{type,mode,start:72,change:-36,prompt:'换成72−36，选一个工具实际做一遍。'}
  }
];

export const P104_SOURCES = Object.freeze(reviewed.map(({taskHash},index) =>
  Object.freeze({sessionId,index,nodeId,type,taskHash})
));

export function p104StepToolsBinding(task,context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId ||
      !sameEvidence(task,reviewed[context.index]?.task) ||
      !matchesNativeEvidenceTask(task,context,{type,nodeId})) return null;
  return {nodeId,kind,method:null,question:'你走了多少个十和一？从原起点出发，最终在哪个数上？'};
}

export function replayP104StepToolsEvidence(task,model,context) {
  try {
    const binding = p104StepToolsBinding(task,context);
    const blank = binding && initial(task);
    if (!binding || !hasExactKeys(model,Object.keys(blank)) || !valid(task,model) ||
        !model.history.length || Object.keys(model.history).length !== model.history.length ||
        !['red','blue','zero','length','segments','unit'].every(key => sameEvidence(model[key],blank[key]))) return null;

    const {start,change} = task;
    const end = start+change;
    const routes = {
      line:{position:start, steps:[]},
      hundred:{position:start, steps:[]}
    };
    if (!Object.hasOwn(routes,model.tool)) return null;
    for (const [index,event] of model.history.entries()) {
      if (!hasExactKeys(event,['tool','value']) || !Object.hasOwn(routes,event.tool) ||
          ![-10,-1,1,10].includes(event.value)) return null;
      const path = routes[event.tool];
      const from = path.position;
      const to = from+event.value;
      if (to<0 || to>100) return null;
      path.steps.push({index,from,delta:event.value,to});
      path.position = to;
    }
    if (!sameEvidence(routes.line.steps.map(step => step.delta),model.line) ||
        !sameEvidence(routes.hundred.steps.map(step => step.delta),model.grid)) return null;
    const active = routes[model.tool];
    if (!active.steps.length || active.position !== end || !equal(parse(model.answer),[end,1]) ||
        !inspect(task,model).correct) return null;

    return {
      kind,nodeId,sessionId,index:context.index,
      start,change,end,tool:model.tool,routes,
      toolSelectionTimingAssessed:false,
      learnerMasteryAssessed:false
    };
  } catch {
    return null;
  }
}

export function submittedP104StepToolsEvidence(task,model,record,context) {
  if (!latestSubmissionMatches(model,record)) return null;
  return replayP104StepToolsEvidence(task,model,context);
}
