import {factors,initial,valid} from './phase5/b14-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P105C_SOURCES=Object.freeze([
  {
    "sessionId": "factorcode",
    "index": 1,
    "nodeId": "mt_bZC-wqWX7Y",
    "type": "x-factorcode",
    "taskHash": "b24cacb73fa68511e1c44a0b91ddecc421257472e72de46a97d9da9eaeb8e75f"
  },
  {
    "sessionId": "factorcode",
    "index": 3,
    "nodeId": "mt_bZC-wqWX7Y",
    "type": "x-factorcode",
    "taskHash": "0f6c07e7d4c6abdc38b48afc8421a1f6601b2e9caff31fe69ad23b658fe4fe1e"
  }
].map(Object.freeze));

const sequence=['start','test','record','next','stop'];

function execute(task,blocks,condition) {
  if (!sameEvidence(blocks,sequence)) {
    return {ok:false,output:[],trace:[],message:'检查要在记录之前，每次往前走，再判断是否到终点。'};
  }
  const retain=task.mode==='factors'?condition==='zero':condition==='two';
  const trace=Array.from({length:task.n},(_,i)=>{
    const n=i+1;
    if (task.mode==='factors') {
      const r=task.n%n;
      return {n,r,keep:retain?r===0:r!==0};
    }
    const ds=factors(n),count=ds.length;
    return {n,factors:ds,count,keep:retain?count===2:condition==='one'?count===1:count>2};
  });
  return {ok:retain,output:trace.filter(row=>row.keep).map(row=>row.n),trace,
    message:retain?'这条办法把范围里的每个数都查过了。':'运行结果留下了不该留下的，或漏掉了一些。改一下记录条件再试。'};
}

export function p105cFactorProgramBinding(task,context) {
  const row=P105C_SOURCES.find(s=>s.sessionId===context?.sessionId&&s.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p105c-factor-program',method:null,
    question:'从第一个数到停止，要按什么顺序测试？哪一种数应该留下？'};
}

export function replayP105CFactorProgramEvidence(task,model,context) {
  try {
    const binding=p105cFactorProgramBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const conditions=task.mode==='factors'?['zero','nonzero']:['two','one','more'];
    let {board}=initial(task);
    for (const {action,data} of model.history) {
      const {index,side,value,fields}=data;
      if (index!==null||side!==null) return null;
      if (action==='b14-block'&&sequence.includes(value)&&board.blocks.length<5) {
        board.blocks.push(value);
      } else if (action==='b14-block-undo'&&value===null&&board.blocks.length) {
        board.blocks.pop();
      } else if (action==='b14-reset'&&value===null) {
        board=initial(task).board;
      } else if (action==='b14-run'&&value===null&&conditions.includes(fields.condition)) {
        const blocks=[...board.blocks], condition=fields.condition;
        board.runs.push({blocks,condition,...execute(task,blocks,condition)});
      } else return null;
    }
    const latest=board.runs.at(-1);
    if (!sameEvidence(board,model.board)||!latest?.ok||latest.condition!==model.condition||
        !sameEvidence(latest.blocks,board.blocks)) return null;
    return {...binding,mode:task.mode,checked:latest.trace.length,output:latest.output,condition:latest.condition};
  } catch {
    return null;
  }
}

export function submittedP105CFactorProgramEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP105CFactorProgramEvidence(task,model,context):null;
}
