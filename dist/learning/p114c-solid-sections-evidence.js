import {initial,valid} from './phase5/b27-model.js';
import {section} from './phase5/b27-geometry.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P114C_SOURCES=Object.freeze([
  {
    "sessionId": "crossparts",
    "index": 2,
    "nodeId": "mt_nRksLqt-iR",
    "type": "x-g27-cut",
    "taskHash": "c610a9b7bb64904498f16883c13153f465d7ea341dc9fe04c1fea1d7edb6cdea"
  },
  {
    "sessionId": "prismslices",
    "index": 0,
    "nodeId": "mt_h02-C8PRrj",
    "type": "x-g27-cut",
    "taskHash": "a25f80b4ce7785562916c04fba8d0179faa0bcf8eec0e6a978f7807671a5e3c0"
  },
  {
    "sessionId": "prismslices",
    "index": 1,
    "nodeId": "mt_h02-C8PRrj",
    "type": "x-g27-cut",
    "taskHash": "622e0fd5b30cdac43b4cf409e0b8819f6d7703541a324536885718737739e48d"
  },
  {
    "sessionId": "prismslices",
    "index": 2,
    "nodeId": "mt_h02-C8PRrj",
    "type": "x-g27-cut",
    "taskHash": "b03867e9d22883977531187df457f3d25d9ce9b34fc90f012e632d2466d7b5a8"
  }
].map(Object.freeze));

const required=card=>card.required||[1,3];
function expected(card) {
  if (card.mode==='shape') return section(card.shape,card.axis,required(card)[0])?.shape;
  const [lo,hi]=[...required(card)].sort((a,b)=>a-b).map(p=>section(card.shape,card.axis,p)?.scale);
  return lo===hi?'same':lo>hi?'smaller':null;
}

export function p114cSolidSectionsBinding(task,context) {
  const row=P114C_SOURCES.find(s=>s.sessionId===context?.sessionId&&s.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p114c-solid-sections',method:null,
    question:'沿题目指定的方向切过去，截面的形状或大小怎样改变？'};
}

export function replayP114CSolidSectionsEvidence(task,model,context) {
  try {
    const binding=p114cSolidSectionsBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task,1)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const bins=task.bins.map(b=>b.id);
    const targets=task.cards.map(expected);
    if (!targets.every(target=>bins.includes(target))) return null;
    let {board}=initial(task,model.seed);
    let issue='';
    let slider='2';
    for (const e of model.history) {
      if (!hasExactKeys(e,['a','d'])) return null;
      const {a,d}=e;
      issue='';
      if (hasExactKeys(d,[])) {
        if (a==='turn') board.turned=true;
        else if (a==='help') board.first.help=true;
        else if (a==='reset') board={...initial(task,model.seed).board,first:board.first,bad:board.bad};
        else return null;
        continue;
      }
      if (!hasExactKeys(d,['index'])) return null;
      const i=board.card, card=task.cards[i], value=d.index;
      if (a==='card'&&task.cards.some((_,j)=>value===String(j))) {
        board.card=Number(value);
        board.position=0;
      } else if (a==='predict'&&bins.includes(value)) {
        board.first['prediction'+i]??=value;
        board.predictions[i]=value;
        if (value!==targets[i]) board.bad=true;
        board.position=0;
        board.observations[i]=[];
        board.answers[i]=null;
      } else if (a==='cut'&&['1','2','3'].includes(value)) {
        const pos=Number(value);
        if (card.axis!=='vertical') slider=value;
        if (board.predictions[i]===null||!section(card.shape,card.axis,pos)) return null;
        board.position=pos;
        if (!board.observations[i].includes(pos)) board.observations[i].push(pos);
      } else if (a==='answer'&&bins.includes(value)) {
        if (!required(card).every(p=>board.observations[i].includes(p))) {
          issue='先移动切面，比较要求的位置。';
        } else {
          board.first['answer'+i]??=value;
          board.answers[i]=value;
          if (value!==targets[i]) board.bad=true;
        }
      } else return null;
    }
    if (issue||model.position!==slider||model.foldPosition!=='0'||
        !sameEvidence(board,model.board)||!sameEvidence(board.answers,targets)||
        (task.rotate&&!board.turned)||!task.cards.every((card,i)=>
          required(card).every(pos=>board.observations[i].includes(pos)))) return null;
    return {...binding,answers:targets,observations:board.observations.map((positions,i)=>
      positions.map(position=>{
        const {shape,axis}=task.cards[i];
        const cut=section(shape,axis,position);
        return {position,shape:cut.shape,scale:cut.scale};
      }))};
  } catch {
    return null;
  }
}

export function submittedP114CSolidSectionsEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP114CSolidSectionsEvidence(task,model,context):null;
}
