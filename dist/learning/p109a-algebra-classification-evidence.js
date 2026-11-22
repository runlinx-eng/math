import {equationEqual,initial,polyEqual,polynomial,sameNumber,valid} from './phase5/b35-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P109A_SOURCES=Object.freeze([
  {
    "sessionId": "writing35",
    "index": 2,
    "nodeId": "mt_i9rJbuFO3p",
    "type": "x-a35-sort",
    "taskHash": "a6404c98f13455e6887094f66466fb5fbd1efc3b099cbe57749fdf231a85682a"
  },
  {
    "sessionId": "notation35",
    "index": 0,
    "nodeId": "mt_KwdjWEmMNo",
    "type": "x-a35-sort",
    "taskHash": "722620a6a371d7d3781fca6b6e2e6aa97f8280cb3785c975f75506822c8fe7bb"
  },
  {
    "sessionId": "notation35",
    "index": 1,
    "nodeId": "mt_KwdjWEmMNo",
    "type": "x-a35-sort",
    "taskHash": "9b3046d6f8256e4b88e88522750c38b6a59f75fe35add2c653002e4d1bedee57"
  },
  {
    "sessionId": "words35",
    "index": 0,
    "nodeId": "mt_g_fkAqmz72",
    "type": "x-a35-sort",
    "taskHash": "319b19f581397c7c2934a9daf3fdba1de43853e29347800ba67ff8d78336e6c1"
  },
  {
    "sessionId": "words35",
    "index": 1,
    "nodeId": "mt_g_fkAqmz72",
    "type": "x-a35-sort",
    "taskHash": "23a0e831baa78517b8578571b2e1197e0a4aa37394c7bcb9cdc8f343e912bc04"
  },
  {
    "sessionId": "words35",
    "index": 2,
    "nodeId": "mt_g_fkAqmz72",
    "type": "x-a35-sort",
    "taskHash": "ef6a8d8e8075d885110636f4d21b4a42ed0b0d3541d5e7befe90c6dc90aea9d9"
  },
  {
    "sessionId": "terms35",
    "index": 0,
    "nodeId": "mt_nNNVrLqPW3",
    "type": "x-a35-sort",
    "taskHash": "bc6cbd02e0840868672010246bfdda39af464ab7e80d21aaccf25a5c0abd4349"
  },
  {
    "sessionId": "terms35",
    "index": 1,
    "nodeId": "mt_nNNVrLqPW3",
    "type": "x-a35-sort",
    "taskHash": "bb6ff64d08824aec18d70251f5231121dc4271424976eea893c5b911ca15251e"
  },
  {
    "sessionId": "terms35",
    "index": 2,
    "nodeId": "mt_nNNVrLqPW3",
    "type": "x-a35-sort",
    "taskHash": "f2c29444683e3b30601ce76cbfab6ddbc9a262420bb93ff3df2de638838b0728"
  },
  {
    "sessionId": "linear36",
    "index": 2,
    "nodeId": "mt_WBdHkc2HTf",
    "type": "x-a35-sort",
    "taskHash": "2f5e25238d15e0bb563633ca505547c3e57d2a0c3fd3c4adc280601eab0b9aa2"
  },
  {
    "sessionId": "rearrange36",
    "index": 0,
    "nodeId": "mt_3qrCtdoVAU",
    "type": "x-a35-sort",
    "taskHash": "f99047124f05de2a1456dd20fb11dd0709d5bb49d8f8bbdd389df953398610cb"
  },
  {
    "sessionId": "advancedWords38",
    "index": 1,
    "nodeId": "mt_3rTIyJDw7-",
    "type": "x-a35-sort",
    "taskHash": "623d808e41977720b3995b893c41781a87ccd8191e6eed67e3e4a9bdb2043aca"
  }
].map(Object.freeze));

function category(label,groups) {
  const s=label.normalize('NFKC').replace(/[−–]/g,'-');
  if (groups.has('coefficient')) {
    return {'3x里的3':'coefficient','3x+2里的3x':'term','3×x里的x':'factor'}[s];
  }
  if (groups.has('line')) {
    const formula=polynomial(s.split('=')[1]?.replaceAll('x2','x^2'));
    if (!formula) return null;
    return formula.x2[0]===0?'line':'curve';
  }
  if (groups.has('P')) return s.split('=')[0];
  if (groups.has('x2')) {
    const raw=label.replaceAll('²','^2');
    const terms=polynomial(raw);
    if (!terms) return null;
    const nonzero=Object.keys(terms).filter(key=>terms[key][0]!==0);
    return nonzero.length===1?nonzero[0]:null;
  }
  if (groups.has('mul')) {
    if (/^\d+x$/.test(s)) return 'mul';
    if (s==='x2') return 'square';
    return s==='x/2'?'divide':null;
  }
  if (groups.has('same')) {
    if (polyEqual(s,'3x+2')) return 'same';
    return s==='3(x+2)'?'other':null;
  }
  if (groups.has('formula')&&s==='面积=长×宽') return 'formula';
  if (/[<>≤≥]/.test(s)) return 'ineq';
  return s.includes('=')?'eq':'expr';
}

function checkAnswer(question,value) {
  if (question.kind==='equation') return equationEqual(value,question.value);
  if (question.kind==='poly') return polyEqual(value,question.value,{simplified:question.simplified});
  if (question.kind==='number') return sameNumber(value,question.value);
  return question.kind==='choice'&&value.trim()===question.value;
}

export function p109aAlgebraClassificationBinding(task,context) {
  const row=P109A_SOURCES.find(s=>s.sessionId===context?.sessionId&&s.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p109a-algebra-classification',method:null,
    question:'你是根据关系符号、运算结构，还是字母和次数来分组？'};
}

export function replayP109AAlgebraClassificationEvidence(task,model,context) {
  try {
    const binding=p109aAlgebraClassificationBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const groups=new Set(task.groups.map(g=>g.id));
    const categories=task.items.map(item=>category(item.label,groups));
    if (!categories.every(c=>groups.has(c))) return null;
    const {board}=initial(task);
    for (const e of model.history) {
      if (!hasExactKeys(e,['a','i','v','w','z','k'])||e.v||e.w||e.z||e.k) return null;
      if (e.a==='choose'&&task.items.some((_,i)=>e.i===String(i)&&!board.assigned[i])) {
        board.selected=Number(e.i);
      } else if (e.a==='group'&&board.selected!==null&&groups.has(e.i)) {
        board.first.group??={item:board.selected,group:e.i};
        if (e.i!==categories[board.selected]) board.bad=true;
        else {
          board.assigned[board.selected]=e.i;
          board.selected=null;
        }
      } else return null;
    }
    if (board.selected!==null||!sameEvidence(board,model.board)||
        !sameEvidence(board.assigned,categories)||
        !task.questions.every((q,i)=>checkAnswer(q,model.answers[i]))) return null;
    return {...binding,categories,answered:task.questions.length};
  } catch {
    return null;
  }
}

export function submittedP109AAlgebraClassificationEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP109AAlgebraClassificationEvidence(task,model,context):null;
}
