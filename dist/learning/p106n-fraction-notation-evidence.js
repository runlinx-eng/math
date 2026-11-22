import {equal,fields,initial,rational,valid} from './phase5/b16-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P106N_SOURCES=Object.freeze([
  {
    "sessionId": "precisefractions",
    "index": 0,
    "nodeId": "mt_HY8Yycu_rz",
    "type": "x-fractiontalk",
    "taskHash": "b745e0c23434ec260c393cf8ad64808f374e3893cb1a7d3eee296f8e13b8249c"
  },
  {
    "sessionId": "precisefractions",
    "index": 2,
    "nodeId": "mt_HY8Yycu_rz",
    "type": "x-fractiontalk",
    "taskHash": "baaea912bc6b72df66c81fb193e4515f777edfeb4c85f31ac8438995fd372020"
  }
].map(Object.freeze));

function correct(card,f) {
  if (card.kind==='unit') return equal(f.answer,card.n,card.d||1)&&f.unit===card.unit;
  if (card.kind==='vocab') return f.top==='numerator'&&f.bottom==='denominator'&&f.word==='equivalent';
  if (card.kind==='money') return equal(f.answer,card.n,100)&&f.unit===card.unit&&/^\d+\.\d{2}$/.test(f.answer);
  if (card.kind==='symbol') {
    const [an,ad]=rational(card.a), [bn,bd]=rational(card.b);
    return f.relation===(an*bd>bn*ad?'>':an*bd<bn*ad?'<':'=');
  }
  return false;
}

export function p106nFractionNotationBinding(task,context) {
  const row=P106N_SOURCES.find(s=>s.sessionId===context?.sessionId&&s.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p106n-fraction-notation',method:null,
    question:'怎样把数量、单位、金额格式和关系符号写清楚？'};
}

export function replayP106NFractionNotationEvidence(task,model,context) {
  try {
    const binding=p106nFractionNotationBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    let {board}=initial(task);
    for (const e of model.history) {
      if (!hasExactKeys(e,['action','data'])||!hasExactKeys(e.data,['fields'])||
          !hasExactKeys(e.data.fields,Object.keys(fields))) return null;
      const f=e.data.fields;
      if (e.action==='reset') {
        board={...initial(task).board,first:board.first};
      } else if (e.action==='talk'&&board.records.length<task.cases.length) {
        const card=task.cases[board.records.length];
        board.first??=f;
        if (correct(card,f)) board.records.push({kind:card.kind,fields:f});
      } else return null;
    }
    if (!sameEvidence(board,model.board)||board.records.length!==task.cases.length) return null;
    return {...binding,recordKinds:board.records.map(row=>row.kind),completed:board.records.length};
  } catch {
    return null;
  }
}

export function submittedP106NFractionNotationEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP106NFractionNotationEvidence(task,model,context):null;
}
