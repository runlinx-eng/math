import {initial,valid} from './phase5/b34-model.js';
import {rational} from './phase5/b16-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P103T_SOURCES=Object.freeze([
  {
    "sessionId": "trace34",
    "index": 0,
    "nodeId": "mt_zQfWqImxva",
    "type": "x-p34-program",
    "taskHash": "0dc393d18025bc6b94aa12ccf20c6641a404506f792377b8d0a4b2bb550cd136"
  },
  {
    "sessionId": "trace34",
    "index": 1,
    "nodeId": "mt_zQfWqImxva",
    "type": "x-p34-program",
    "taskHash": "174fc76cca3b87849dd95c0cd6ca427401c42106d9f731beb643fe5e9be9a7d9"
  },
  {
    "sessionId": "trace34",
    "index": 2,
    "nodeId": "mt_zQfWqImxva",
    "type": "x-p34-program",
    "taskHash": "3e76d246e5e966c5a55cae2327b0df6a9f886df2c9bab9a3d134866d889d7ce1"
  },
  {
    "sessionId": "generate34",
    "index": 0,
    "nodeId": "mt_QeKWt4BZn3",
    "type": "x-p34-program",
    "taskHash": "f089f2b20b5e4067ab79da7f1ed61acef080127c9c6c564c38022d7f8536f92a"
  },
  {
    "sessionId": "generate34",
    "index": 1,
    "nodeId": "mt_QeKWt4BZn3",
    "type": "x-p34-program",
    "taskHash": "6fee96e3bae0412e7fbde8a9e0d3816af0b96630a245f6d2fe2ffdae39b6d0b6"
  },
  {
    "sessionId": "design34",
    "index": 0,
    "nodeId": "mt_nx4a3kH-59",
    "type": "x-p34-program",
    "taskHash": "3cbd5146577df2cb9b773c430ca53039a285bd431b1ea77faf7b0ec77b397c8c"
  },
  {
    "sessionId": "design34",
    "index": 1,
    "nodeId": "mt_nx4a3kH-59",
    "type": "x-p34-program",
    "taskHash": "e30f6370df100ab654f2776554a988537838729d67e5304050b82d488318d4fe"
  }
].map(Object.freeze));

const bucket=n=>n%15===0?'both':n%3===0?'three':n%5===0?'five':'neither';

function run(mode,blocks) {
  if (mode==='classify'&&blocks.length===4) {
    const output=Array.from({length:30},(_,i)=>{
      const n=i+1;
      const matches={both:n%15===0,three:n%3===0,five:n%5===0,neither:true};
      return {n,group:blocks.find(b=>matches[b])};
    });
    return {output,correct:output.every(({n,group})=>group===bucket(n))};
  }
  if (mode==='loop'&&blocks.length===3&&blocks[0]==='repeat') {
    const output=[1];
    for (let i=0;i<10;i++) {
      output.push(blocks.slice(1).reduce((n,b)=>b==='double'?2*n:n+1,output.at(-1)));
    }
    return {output,correct:output.every((n,i)=>n===2**(i+1)-1)};
  }
  return null;
}

function answers(mode,board) {
  const last=board.values.at(-1);
  if (mode==='walk') return [board.values.length-1,last];
  if (mode==='threshold') return [50,80].map(n=>board.records.find(row=>row.n===n)?.out);
  if (mode==='sort10') return ['low','high'].map(c=>board.records.filter(row=>row.choice===c).length);
  if (mode==='double') return [last];
  if (mode==='add7') return [last,board.values.includes(84)?'yes':'no'];
  const result=run(mode,board.blocks);
  if (!result?.correct) return [];
  if (mode==='classify') return [result.output.filter(x=>x.group==='both').length,result.output[14].group];
  return [result.output.at(-1),result.output.every(n=>n%2===1)?'odd':'even'];
}

export function p103tProgramTraceBinding(task,context) {
  const row=P103T_SOURCES.find(s=>s.sessionId===context?.sessionId&&s.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p103t-program-trace',method:null,
    question:'每一步用哪条条件决定？到了哪里才应该停止？'};
}

export function replayP103TProgramTraceEvidence(task,model,context) {
  try {
    const binding=p103tProgramTraceBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const {mode}=task;
    const {board}=initial(task);
    const repeat=['double','add7'].includes(mode), design=['classify','loop'].includes(mode);
    const canContinue=n=>mode==='double'?n<=100:n+7<80;
    let rejected=false;
    for (const e of model.history) {
      if (!hasExactKeys(e,['a','i','v','w'])||e.v||e.w) return null;
      rejected=false;
      const {a,i}=e, n=board.values.at(-1);
      if (mode==='walk'&&a==='step'&&!board.done&&['half','plus'].includes(i)) {
        const choice=n%2===0?'half':'plus';
        board.first.step??=i;
        rejected=i!==choice;
        if (!rejected) {
          const next=choice==='half'?n/2:n+1;
          board.values.push(next);
          board.done=next===1;
        }
      } else if ((mode==='threshold'||mode==='sort10')&&a==='branch'&&!board.done) {
        const threshold=mode==='threshold', input=task.inputs[board.records.length];
        if (!(threshold?['yes','no']:['low','high']).includes(i)) return null;
        const choice=threshold?(input>50?'yes':'no'):(input<10?'low':'high');
        board.first.branch??={n:input,choice:i};
        rejected=i!==choice;
        if (!rejected) {
          board.records.push({n:input,choice,out:threshold?input+(input>50?-10:10):choice});
          board.done=board.records.length===task.inputs.length;
        }
      } else if (repeat&&(a==='step'||a==='stop')&&!i&&!board.done) {
        if (a==='step') {
          rejected=!canContinue(n);
          if (!rejected) board.values.push(mode==='double'?n*2:n+7);
        } else {
          board.first.stop??=n;
          rejected=canContinue(n);
          board.done=!rejected;
        }
      } else if (design&&a==='block'&&!board.blocks.includes(i)&&task.blocks.some(block=>block.id===i)) {
        board.blocks.push(i);
        board.done=false;
      } else if (design&&!i&&['undo','clear','run'].includes(a)) {
        if (a==='clear') board.blocks=[];
        if (a==='undo') board.blocks.pop();
        board.done=false;
        if (a==='run') {
          const result=run(mode,board.blocks);
          board.first.blocks??=[...board.blocks];
          rejected=!result?.correct;
          if (result&&board.runs.length<30) board.runs.push({blocks:[...board.blocks],...result});
          board.done=!rejected;
        }
      } else return null;
      if (rejected) board.bad=true;
    }
    if (rejected||!board.done||!sameEvidence(board,model.board)) return null;
    const conclusions=answers(mode,board);
    if (conclusions.length!==task.questions.length||!conclusions.every((answer,i)=>{
      const raw=model.answers[i].trim();
      if (typeof answer==='string') return raw===answer;
      const pair=rational(raw);
      return pair!==null&&BigInt(pair[0])===BigInt(answer)*BigInt(pair[1]);
    })) return null;
    return {...binding,mode,conclusions,values:board.values,records:board.records,run:design?run(mode,board.blocks):null};
  } catch {
    return null;
  }
}

export function submittedP103TProgramTraceEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP103TProgramTraceEvidence(task,model,context):null;
}
