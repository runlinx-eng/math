import {initial, inspect, valid} from './phase4/b03-model.js';
import {
  hasExactKeys,
  isEvidenceContext,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

const sessionId = 'folds';
const nodeId = 'mt_gC-6JXAG5S';
const type = 'x-foldpaper';
const kind = 'p106-paper-fold-counts';
const taskHash = '08c6c65183ab9198e858162af4a445107f9e2b791852044bfa2a9514257006b3';
const reviewed = {type,prompt:'把纸带对折、再对折、再对折，记录每次摊开有几份。'};

export const P106_SOURCES = Object.freeze([Object.freeze({sessionId,index:0,nodeId,type,taskHash})]);

export function p106PaperFoldCountsBinding(task, context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId || context.index !== 0 ||
      !sameEvidence(task,reviewed) || !matchesNativeEvidenceTask(task,context,{type,nodeId})) return null;
  return {nodeId,kind,method:null,question:'每次对折后，份数和上一次有什么关系？'};
}

export function replayP106PaperFoldCountsEvidence(task, model, context) {
  try {
    const binding = p106PaperFoldCountsBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        model.folds !== 3 || Object.keys(model.history).length !== model.folds ||
        Object.keys(model.labels).length !== model.folds) return null;

    const stages = [];
    let previous = 1;
    for (const [index, pieces] of model.history.entries()) {
      const label = model.labels[index];
      if (pieces !== previous * 2 || label !== pieces) return null;
      stages.push({fold:index+1,before:previous,after:pieces,label});
      previous = pieces;
    }
    if (!inspect(task, model).correct) return null;
    return {
      kind,nodeId,sessionId,index:context.index,
      stages,
      totalParts:previous,
      labelEntryTimingAssessed:false,
      physicalFoldingAssessed:false,
      learnerMasteryAssessed:false
    };
  } catch {
    return null;
  }
}

export function submittedP106PaperFoldCountsEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model,record)) return null;
  return replayP106PaperFoldCountsEvidence(task,model,context);
}
