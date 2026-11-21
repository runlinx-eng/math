import {initial, inspect, number, valid} from './phase5/b15-model.js';
import {
  hasExactKeys,
  isEvidenceContext,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

const sessionId = 'signedproducts';
const nodeId = 'mt_rxInpOQ74w';
const type = 'x-signwalk';
const reviewed = [
  {
    taskHash:'fa39239307090bdd2b1612509be1b77f92a7c415150525f14c250918072e8d19',
    task:{type,mode:'sequence',a:-3,reason:'plus3',
      prompt:'让−3乘的数从2、1、0接到−1、−2。每次只少一份，结果要怎样延续？'},
    question:'少一份 −3，结果每次怎样变？走过 0 以后会落在哪里？'
  },
  {
    taskHash:'014eace4356e307ff71c16ffcd44c6c83e01a36c62959859f967fa4f40b9f022',
    task:{type,mode:'cases',cases:[
      {a:6,b:2,op:'*'},{a:6,b:-2,op:'*'},{a:-6,b:2,op:'*'},{a:-6,b:-2,op:'*'},{a:0,b:-5,op:'*'}
    ],prompt:'同样的大小，分别换一个或两个方向。把每种结果接出来，0也试一次。'},
    question:'只改变一个因数的正负会怎样？两个因数都改变，结果又怎样？'
  },
  {
    taskHash:'d63b42bc76511488879485dde716eb4468bb948750d823213c00b4a92733b700',
    task:{type,mode:'cases',cases:[
      {a:12,b:3,op:'/'},{a:12,b:-3,op:'/'},{a:-12,b:3,op:'/'},{a:-12,b:-3,op:'/'}
    ],prompt:'除法可以问：后面的数乘几，会回到前面的数？四种方向都试一次。'},
    question:'商和有正负的除数相乘，能回到原来的被除数吗？'
  }
];

export const P090_SOURCES = Object.freeze(reviewed.map(({taskHash},index) =>
  Object.freeze({sessionId,index,nodeId,type,taskHash})
));

export function p090SignedProductRowsBinding(task,context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId ||
      !sameEvidence(task,reviewed[context.index]?.task) ||
      !matchesNativeEvidenceTask(task,context,{type,nodeId})) return null;
  return {nodeId,kind:'p090-signed-product-rows',method:null,question:reviewed[context.index].question};
}

export function replayP090SignedProductRowsEvidence(task,model,context) {
  try {
    const binding = p090SignedProductRowsBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        model.issue !== '' || !model.history.length ||
        Object.keys(model.history).length !== model.history.length) return null;

    const sequential = task.mode === 'sequence';
    const operands = sequential ? [2,1,0,-1,-2].map(b => ({a:task.a,b,op:'*'})) : task.cases;
    const attempts = [];
    let rows = [];
    let resets = 0;
    for (const {action,data} of model.history) {
      if (data.index !== null || data.value !== null) return null;
      if (action === 'b15-reset') {
        rows = [];
        resets++;
        continue;
      }
      const row = operands[rows.length];
      if (action !== 'b15-sign' || !row) return null;

      const {a,b,op} = row;
      const previous = rows.at(-1);
      const sameDirection = Math.sign(a) === Math.sign(b);
      const magnitude = op === '*' ? Math.abs(a)*Math.abs(b) : Math.abs(a)/Math.abs(b);
      const result = magnitude === 0 ? 0 : sameDirection ? magnitude : -magnitude;
      const change = sequential && previous ? -task.a : null;
      const expected = change === null ? result : previous.value + change;
      const raw = data.fields.result;
      const entered = number(raw);
      const accepted = entered === expected && (op !== '/' || b !== 0 && entered*b === a);
      attempts.push({row:rows.length,raw,expected,accepted});
      if (accepted) rows.push({...row,value:expected,magnitude,change,
        inverseProduct:op === '/' ? entered*b : null});
    }

    const saved = rows.map(({a,b,op,value}) => ({a,b,op,value}));
    if (rows.length !== operands.length || !sameEvidence(saved,model.board.rows) ||
        sequential && model.reason !== 'plus3' || !inspect(task,model).correct) return null;
    return {binding,rows,attempts,resets,reason:sequential ? model.reason : null};
  } catch {
    return null;
  }
}

export function submittedP090SignedProductRowsEvidence(task,model,record,context) {
  if (!latestSubmissionMatches(model,record)) return null;
  return replayP090SignedProductRowsEvidence(task,model,context);
}
