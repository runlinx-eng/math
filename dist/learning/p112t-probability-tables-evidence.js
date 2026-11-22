import {initial, valid} from './phase5/b22-model.js';
import {equal} from './phase5/b16-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

export const P112T_SOURCES = Object.freeze([
  {
    "sessionId": "chancemodel",
    "index": 2,
    "nodeId": "mt_aCwj2PCoRV",
    "type": "x-p22-table",
    "taskHash": "f720aa2664d008933b69cf2c0a2561d25a2805c056c1be8ed876711dab774c3f"
  },
  {
    "sessionId": "chancenone",
    "index": 0,
    "nodeId": "mt_3fwYu7imd4",
    "type": "x-p22-table",
    "taskHash": "8b15eb58070aa04b8dfbf1c53a31c0a076382f4adab8db8dc8c50ade2d3f787c"
  },
  {
    "sessionId": "chancenone",
    "index": 2,
    "nodeId": "mt_3fwYu7imd4",
    "type": "x-p22-table",
    "taskHash": "5f2bc8b048e7e30f1e706dc76cf64dd6c603553ddfbcebf1a7a8902f23ead627"
  },
  {
    "sessionId": "chancecomplement",
    "index": 0,
    "nodeId": "mt_XfyqXLqzpx",
    "type": "x-p22-table",
    "taskHash": "fa3aa3ffb58335706e914c0e0d84250040091e7146060d68803e27160bdb557d"
  }
].map(Object.freeze));

export function p112tProbabilityTablesBinding(task,context) {
  const row=P112T_SOURCES.find(source=>source.sessionId===context?.sessionId&&source.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p112t-probability-tables',method:null,question:'每份占整体的几分之几？合起来怎样检查是否完整？'};
}

function answersMatch(context,answers) {
  if (context.sessionId==='chancemodel') {
    return answers[0].trim()==='unequal'&&answers[1].trim()==='check';
  }
  if (context.sessionId==='chancenone') {
    return context.index===0 ? equal(answers[0],1)&&answers[1].trim()==='partition' :
      equal(answers[0],3+2+2,6)&&answers[1].trim()==='over';
  }
  return equal(answers[0],1);
}

export function replayP112TProbabilityTablesEvidence(task,model,context) {
  try {
    const binding=p112tProbabilityTablesBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task,1)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    let build=null;
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','f','d'])||!hasExactKeys(event.d,[])) return null;
      if (event.a==='reset'&&hasExactKeys(event.f,[])) {
        build=null;
      } else if (event.a==='build'&&hasExactKeys(event.f,['values'])) {
        build=event.f.values;
      } else {
        return null;
      }
    }
    const total=task.weights.reduce((sum,weight)=>sum+weight,0);
    if (!build||!task.weights.every((weight,i)=>equal(build[i],weight,total)&&equal(model.values[i],weight,total))||
        !sameEvidence(task.weights.map(weight=>weight/total),model.board.built)||!answersMatch(context,model.answers)) return null;
    return {...binding,weights:[...task.weights],total};
  } catch {
    return null;
  }
}

export function submittedP112TProbabilityTablesEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP112TProbabilityTablesEvidence(task,model,context):null;
}
