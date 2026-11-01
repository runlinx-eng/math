// Describe only the submitted, current, replay-validated work. These observations
// are not a score, an assessment of free text, or a claim of general mastery.
import * as fractions from './phase5/b17-model.js';
import * as arguments38 from './phase5/b38-model.js';

export function thinkingFeedback(task,model,record){
  const attempts=record?.attempts||[],lastAttempt=attempts.at(-1);
  if(!lastAttempt||JSON.stringify(lastAttempt.value)!==JSON.stringify(model))return null;
  const handler=task.type==='x-fracrename'?fractions:task.type==='x-r38-counterexample'?arguments38:null;
  if(!handler||!handler.valid(task,model)||!handler.inspect(task,model).correct)return null;
  const detail=[];
  if(attempts.slice(0,-1).some(a=>handler.valid(task,a.value)&&!handler.inspect(task,a.value).correct))detail.push('你修改后又试了一次。');
  if(record.support)detail.push('你看过提示或比较反馈。');
  if(task.type==='x-fracrename'){
    const names=model.board.saved.map(([n,d])=>`${n}/${d}`).join('、');
    return {title:'你刚才的办法',observation:`你把 ${task.n}/${task.d} 换成了 ${names}，并选择了“整体和选中的量都没变”。`,connection:'保持同一个量、换一种分法，也可以帮助比较分数或理解百分数。',detail};
  }
  const last=model.board.records.at(-1),comparison={less:'比原来的数更小',equal:'与原来的数一样大',greater:'比原来的数更大'}[last.actual],claim=task.rule==='strict'?'总会变大':'总不会变小';
  if(!comparison||!last.match||!last.breaks||!['strict','nonstrict'].includes(task.rule))return null;
  if(model.board.records.length>1)detail.push(`你一共试了 ${model.board.records.length} 次比较。`);
  return {title:'你刚才的办法',observation:`你试了 ${last.value} × ${last.factor}，结果${comparison}，与“${claim}”不一致。`,connection:'用一个反例可以检验这样的“总是”说法；说法改变后，需要重新检验。',detail};
}
