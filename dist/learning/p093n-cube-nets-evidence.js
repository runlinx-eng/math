import {initial,valid} from './phase4/b02-model.js';
import {foldedNet} from './phase4/geometry.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P093N_SOURCES=Object.freeze([
  {
    "sessionId": "nets",
    "index": 0,
    "nodeId": "mt_vnJEztczji",
    "type": "x-net",
    "taskHash": "f42bbc7b3e31a495fe4f7e1c1539c77cffc900990b6c37e66f5652f0c484a8da"
  },
  {
    "sessionId": "nets",
    "index": 1,
    "nodeId": "mt_vnJEztczji",
    "type": "x-net",
    "taskHash": "aeb0bb16299d8bc9d23d820709d9943a8e7ff9d8841aece32d59643fa422f143"
  },
  {
    "sessionId": "nets",
    "index": 2,
    "nodeId": "mt_vnJEztczji",
    "type": "x-net",
    "taskHash": "2cfb329225ce1150813fa0e19c180026ca618189dbb57dff0b2ab9fa16346970"
  },
  {
    "sessionId": "foldprism",
    "index": 0,
    "nodeId": "mt_REwgr0d_ss",
    "type": "x-net",
    "taskHash": "7384afd56f0a567fa6d2f41a0351e02219544190817c26dcce7e2985bfd610ce"
  },
  {
    "sessionId": "crossparts",
    "index": 3,
    "nodeId": "mt_nRksLqt-iR",
    "type": "x-net",
    "taskHash": "2bbbc9a0ca791d88f67f7da61e23d607937a325fd44ece4a1fa540ddf806ce05"
  }
].map(Object.freeze));

export function p093nCubeNetsBinding(task,context) {
  const row=P093N_SOURCES.find(s=>s.sessionId===context?.sessionId&&s.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p093n-cube-nets',method:null,
    question:'折起来时，六块分别落在哪一面？哪两面相对，或者哪两面重叠？'};
}

export function replayP093NCubeNetsEvidence(task,model,context) {
  try {
    const binding=p093nCubeNetsBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        !hasExactKeys(model.counts,['faces','edges','vertices'])||
        Object.keys(model.runs).length!==model.runs.length) return null;
    const runs=[];
    for (const run of model.runs) {
      if (!hasExactKeys(run,['cells','guess','pair','why'])||run.cells.length!==6||
          (task.preset&&!sameEvidence(run.cells,task.preset))||
          run.pair.some(i=>i!==null&&i>=run.cells.length)) return null;
      const fold=foldedNet(run.cells);
      runs.push({fold,record:run});
    }
    const last=runs.at(-1);
    if (!last||!sameEvidence(last.record.cells,model.cells)||last.record.guess!==model.guess||
        !sameEvidence(last.record.pair,model.pair)||model.fold!==100||
        last.fold.valid!==last.record.guess||last.fold.tree.length!==5) return null;
    let opposite=null;
    if (last.fold.valid) {
      const [a,b]=model.pair;
      opposite=a<b?[a,b]:[b,a];
      if (!last.fold.opposite.some(pair=>sameEvidence(pair,opposite))||
          !sameEvidence(model.counts,{faces:6,edges:12,vertices:8})) return null;
    } else if (model.reason!=='overlap'||
        new Set(last.fold.normals.filter(Boolean).map(v=>v.join(','))).size===6) return null;
    return {...binding,foldable:last.fold.valid,opposite,recordedFolds:runs.length,cells:model.cells.map(p=>[...p])};
  } catch {
    return null;
  }
}

export function submittedP093NCubeNetsEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP093NCubeNetsEvidence(task,model,context):null;
}
