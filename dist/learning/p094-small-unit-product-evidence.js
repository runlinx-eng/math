import {number} from './phase5/b14-model.js';
import {initial, inspect, valid} from './phase5/b15-model.js';
import {equal} from './phase5/b16-model.js';
import {
  hasExactKeys,
  isEvidenceContext,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

const sessionId = 'decimalproduct';
const nodeId = 'mt_SoDP1fSQEB';
const type = 'x-decimalproduct';
const kind = 'p094-small-unit-product';
const reviewed = [
  {
    taskHash:'76fc2ef2eae98f51bbae60f7ff604ae6c072ffa74aa3ed1330beda6372cc6ea4',
    task:{type,decimal:'4.56',multiplier:7,estimate:500,prompt:'把4.56看成456个百分之一，逐位乘7，再换回原来的单位。'}
  },
  {
    taskHash:'7e5b910c9c757ea58babee2ff5c0994e2fd61ad9395ae1887243fbea50f6ea48',
    task:{type,decimal:'3.2',multiplier:5,estimate:30,prompt:'3.2是32个十分之一。计算5份，16.0与16都可以表示最后的量。'}
  }
];

export const P094_SOURCES = Object.freeze(reviewed.map(({taskHash},index) =>
  Object.freeze({sessionId,index,nodeId,type,taskHash})
));

export function p094SmallUnitProductBinding(task,context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId ||
      !sameEvidence(task,reviewed[context.index]?.task) ||
      !matchesNativeEvidenceTask(task,context,{type,nodeId})) return null;
  return {nodeId,kind,method:null,question:'积里有多少个原来的小单位？多少份这样的小单位合成 1？'};
}

const fresh = () => ({estimated:false,carry:0,pending:null,columns:[],row:null});

export function replayP094SmallUnitProductEvidence(task,model,context) {
  try {
    const binding = p094SmallUnitProductBinding(task,context);
    const blank = binding && initial(task);
    if (!binding || !hasExactKeys(model,Object.keys(blank)) ||
        !hasExactKeys(model.inner,Object.keys(blank.inner)) || !valid(task,model) ||
        model.issue !== '' || model.inner.issue !== '' || !model.inner.history.length ||
        Object.keys(model.inner.history).length !== model.inner.history.length ||
        !model.history.every(event => event.action === 'b15-reset' &&
          event.data.index === null && event.data.value === null)) return null;

    const [whole,fraction] = task.decimal.split('.');
    const unitsPerWhole = 10**fraction.length;
    const amount = Number(whole)*unitsPerWhole + Number(fraction);
    const product = amount*task.multiplier;
    const digits = [...String(amount)].reverse().map(Number);
    const actions = [];
    let state = fresh(), resets = 0;

    for (const [index,event] of model.inner.history.entries()) {
      const {action,data} = event;
      const f = data.fields;
      if (data.index !== null || data.side !== null || data.value !== null) return null;
      if (action === 'b14-reset') {
        resets++;
        state = fresh();
        actions.push({index,action});
        continue;
      }
      if (action === 'b14-estimate') {
        if (state.estimated) return null;
        state.estimated = number(f.estimate) === task.estimate*task.multiplier;
        actions.push({index,action,raw:f.estimate,accepted:state.estimated});
        continue;
      }
      if (!state.estimated || state.row) return null;
      const col = state.columns.length;
      if (action === 'b14-mul-count' && !state.pending && col < digits.length) {
        const raw = digits[col]*task.multiplier + state.carry;
        const accepted = number(f.raw) === raw;
        if (accepted) state.pending = {raw,loose:raw,bundles:0};
        actions.push({index,action,col,raw:f.raw,accepted});
        continue;
      }
      if (action === 'b14-trade' && state.pending && state.pending.loose >= 10) {
        state.pending.loose -= 10;
        state.pending.bundles++;
        actions.push({index,action,col,remaining:state.pending.loose,carried:state.pending.bundles});
        continue;
      }
      if (action === 'b14-digit' && state.pending) {
        const {raw,loose,bundles} = state.pending;
        const accepted = loose < 10 && number(f.digit) === loose;
        if (accepted) {
          if (raw !== loose + bundles*10) return null;
          state.columns.push({row:0,col,raw,loose,bundles,incoming:state.carry});
          state.carry = bundles;
          state.pending = null;
        }
        actions.push({index,action,col,raw:f.digit,accepted});
        continue;
      }
      if (action !== 'b14-row' || state.pending || col !== digits.length) return null;
      const accepted = number(f.shift) === 0 && number(f.rowvalue) === product;
      if (accepted) {
        const rowDigits = state.columns.map(column => column.loose);
        const composed = rowDigits.reduce((value,digit,place) => value+digit*10**place,0) +
          state.carry*10**rowDigits.length;
        if (composed !== product) return null;
        state.row = {value:product,shift:0,digits:rowDigits,carry:state.carry};
      }
      actions.push({index,action,shift:f.shift,raw:f.rowvalue,accepted});
    }

    const recorded = model.inner.board;
    if (!state.row || resets !== model.history.length || !sameEvidence(state.columns,recorded.work) ||
        !sameEvidence([state.row],recorded.rows) || number(model.inner.answer) !== product ||
        !equal(model.unit,unitsPerWhole) || !equal(model.answer,product,unitsPerWhole) ||
        !inspect(task,model).correct) return null;

    return {
      kind,nodeId,sessionId,index:context.index,
      operandInSmallUnits:amount,multiplier:task.multiplier,productInSmallUnits:product,unitsPerWhole,
      result:{numerator:product,denominator:unitsPerWhole},
      columns:state.columns,actions,resets,learnerMasteryAssessed:false
    };
  } catch {
    return null;
  }
}

export function submittedP094SmallUnitProductEvidence(task,model,record,context) {
  if (!latestSubmissionMatches(model,record)) return null;
  return replayP094SmallUnitProductEvidence(task,model,context);
}
