// Describe only the submitted, current, replay-validated work. These observations
// are not a score, an assessment of free text, or a claim of general mastery.
import {inspect as inspectTask,validModel as validTask} from './tasks.js';
import * as fractions from './phase5/b17-model.js';
import * as arguments38 from './phase5/b38-model.js';
import * as patterns34 from './phase5/b34-model.js';
import * as tools39 from './phase5/b39-model.js';

// A shared card widget appears in several thinking domains. Link MP.3 only
// for these inspected B38 lesson positions, never solely from task.type.
const VERIFIED_REASONING={show38:[2],because38:[1,2],argument38:[0,2]};

// An explicit lesson position and task signature prevent generic widgets shared
// across source domains from inventing a method label.
const VERIFIED_READING={sessionId:'sense38',index:0,ids:'a,b,ask,wrong'};
const VERIFIED_RULES={
  2:{start:0,answer:'zero-five'},
  3:{start:2,answer:'two-seven'}
};
function attemptDetails(task,record,attempts,handler){
  const detail=[];
  if(attempts.slice(0,-1).some(a=>handler.valid(task,a.value)&&!handler.inspect(task,a.value).correct))
    detail.push('你修改后又提交检查了一次。');
  if(record?.support)detail.push('你看过提示或比较反馈。');
  return detail;
}
function secondRoundFeedback(task,model,record,context,attempts){
  if(task?.type==='x-r38-chain'&&context.sessionId===VERIFIED_READING.sessionId&&
    context.index===VERIFIED_READING.index&&task.cards?.map(c=>c.id).join(',')===VERIFIED_READING.ids&&
    task.prompt==='原有3颗，又来4颗。先别算：知道什么，想找什么？'){
    if(!arguments38.valid(task,model)||!arguments38.inspect(task,model).correct)return null;
    const selected=model.board.selected.map(id=>task.cards.find(c=>c.id===id)?.text);
    if(selected.length!==3||selected.some(x=>!x))return null;
    return {
      title:'你刚才的办法',
      observation:`你在卡片里先选出“${selected.slice(0,2).join('”和“')}”，再放入“${selected[2]}”；检查核对了这次排列。`,
      connection:'先分开题目已知的数量和要找的问题，可以避免拿错条件。下次遇到多余的信息，试着指出哪条用不上。',
      detail:[...attemptDetails(task,record,attempts,arguments38),'这里核对的是已提供卡片的选择与顺序，还没有验证你能独立读懂其他文字题。'],
      method:{nodeId:'mt_WkKkb7W9Qd',label:'读懂问题',code:'ccss-math:MP.1'}
    };
  }
  if(task?.type==='x-s39-choose'&&context.sessionId==='tools39'&&
    [0,1].includes(context.index)&&task.operator==='*'&&
    (context.index===0?JSON.stringify(task.operands)==='[25,4]':JSON.stringify(task.operands)==='[167,3]')){
    if(!tools39.valid(task,model)||!tools39.inspect(task,model).correct||model.method!=='calculator')return null;
    const action=[...model.history].reverse().find(e=>e.a==='run');
    const run=model.board.runs.at(-1);
    if(!action||action.c!=='calculator'||action.w!==model.entry||!run?.matched||run.entry!==model.entry)return null;
    return {
      title:'你刚才的办法',
      observation:`这次做 ${task.display}，你选择了计算器，实际输入“${model.entry}”并运行，得到 ${run.value}；检查核对了输入的数字与运算。`,
      connection:'计算器可以帮你核对运算，但要先确认输入的式子对应题目。下次可以先估一个范围，再决定是否需要工具。',
      detail:[...attemptDetails(task,record,attempts,tools39),'这里只验证这次选用并运行计算器；没有验证心算、笔算过程或以后会不会选最合适的工具。'],
      method:{nodeId:'mt_d-WZC2OyMB',label:'选择合适的数学工具',code:'ccss-math:MP.5'}
    };
  }
  const rule=context.sessionId==='general34'?VERIFIED_RULES[context.index]:null;
  if(task?.type==='x-p34-sequence'&&rule&&task.start===rule.start&&task.step===5&&
    task.op==='add'&&task.questions?.length===1&&task.questions[0].value===rule.answer){
    if(!patterns34.valid(task,model)||!patterns34.inspect(task,model).correct)return null;
    const values=model.board.values;
    if(values.length!==task.length||values.length<3||model.history.filter(e=>e.a==='next').length<values.length-1)return null;
    const digits=rule.answer==='zero-five'?'0和5交替':'2和7交替';
    return {
      title:'你刚才的办法',
      observation:`你从 ${values[0]} 开始，连续 ${values.length-1} 次每次加 5，留下 ${values.join('、')}；然后在给出的选项中选择了“个位${digits}”。`,
      connection:'把每次变化记录下来，再比较个位，可以看见重复。下次换一个起点，看看重复的数字会不会变化。',
      detail:[...attemptDetails(task,record,attempts,patterns34),'这里只核对连续操作与固定选项，不等于已经独立概括或证明所有数列规律。'],
      method:{nodeId:'mt_fZTn0W_iZR',label:'从规律中概括结论',code:'ccss-math:MP.8'}
    };
  }
  return null;
}

export function thinkingFeedback(task,model,record,context={}){
  const attempts=record?.attempts||[],lastAttempt=attempts.at(-1);
  if(!lastAttempt||JSON.stringify(lastAttempt.value)!==JSON.stringify(model))return null;
  const second=secondRoundFeedback(task,model,record,context,attempts);
  if(second)return second;
  // A checked representation can be described without claiming the child has
  // independently explained the equivalence or mastered a thinking ability.
  if(task?.type==='grid'){
    if(!validTask(task,model)||!inspectTask(task,model).correct)return null;
    const method=task.reverse?
      {nodeId:'mt_CUmjcE7W6c',label:'连接分数、小数与百分数的表示',code:'ccss-math:MP.2'}:
      {nodeId:'mt_EBYGhd8X3x',label:'连接不同表示方式',code:'ccss-math:MP.2'};
    const count=model.selected.length;
    return {
      title:'这次作品中的思考线索',
      observation:`你提交的百格涂了 ${count} 格，并写出小数 ${model.decimal}；检查显示它们表示同一个量。`,
      connection:'试着用自己的话说明：为什么换了表示方法，量没有变？你可以再用另一个分数试一试。',
      detail:['这里只确认当前作品的对应关系；没有自动判断你的自由解释，也不代表已经掌握这种思考方法。'],
      method
    };
  }
  const verifiedChain=task.type==='x-r38-chain'&&VERIFIED_REASONING[context.sessionId]?.includes(context.index);
  const handler=task.type==='x-fracrename'?fractions:
    (verifiedChain||task.type==='x-r38-counterexample')?arguments38:null;
  if(!handler||!handler.valid(task,model)||!handler.inspect(task,model).correct)return null;
  const detail=[];
  if(attempts.slice(0,-1).some(a=>handler.valid(task,a.value)&&!handler.inspect(task,a.value).correct))detail.push('你修改后又试了一次。');
  if(record.support)detail.push('你看过提示或比较反馈。');
  if(task.type==='x-fracrename'){
    const names=model.board.saved.map(([n,d])=>`${n}/${d}`).join('、');
    return {title:'你刚才的办法',observation:`你把 ${task.n}/${task.d} 换成了 ${names}，并选择了“整体和选中的量都没变”。`,connection:'保持同一个量、换一种分法，也可以帮助比较分数或理解百分数。',detail,
      method:{nodeId:'mt_EBYGhd8X3x',label:'连接不同表示方式',code:'ccss-math:MP.2'}};
  }
  if(task.type==='x-r38-chain'){
    // These are replay-verified card selections / model actions, not a graded
    // spoken argument. A correct ordered path alone does not prove reasoning.
    const hasError=Array.isArray(task.lines)&&typeof task.error==='string';
    const selected=model.board.selected.length;
    const mistaken=hasError?task.lines.find(line=>line.id===model.board.marked)?.text:null;
    const actions=task.scene==='exchange'?'，并把一捆十拆成十个一':
      task.scene==='array'?'，还从十列中移走了两列':'';
    const observation=`这次提交按顺序摆出了 ${selected} 个推理步骤${mistaken?`，标记“${mistaken}”为需要修正的一步`:''}${actions}；检查核对了当前步骤与题目条件的对应关系。`;
    detail.push('步骤卡和教具操作能够复核；你的自由文字或口头解释尚未自动判断。');
    return {
      title:'你刚才的办法',observation,
      connection:hasError?'试着说明：标记的那一步为什么不成立？怎样从前面的事实修正？':'试着说说：每一步依据哪个已知条件，为什么下一步能够成立？',
      detail,
      method:hasError?
        {nodeId:'mt_pyMD_SIiYO',label:'说明推理的依据 · 跟随推理并找错',code:'ccss-math:MP.3'}:
        {nodeId:'mt_nyK25mNOeR',label:'展示解题过程',code:'ccss-math:MP.3'}
    };
  }
  const last=model.board.records.at(-1),comparison={less:'比原来的数更小',equal:'与原来的数一样大',greater:'比原来的数更大'}[last.actual],claim=task.rule==='strict'?'总会变大':'总不会变小';
  if(!comparison||!last.match||!last.breaks||!['strict','nonstrict'].includes(task.rule))return null;
  if(model.board.records.length>1)detail.push(`你一共试了 ${model.board.records.length} 次比较。`);
  return {title:'你刚才的办法',observation:`你试了 ${last.value} × ${last.factor}，结果${comparison}，与“${claim}”不一致。`,connection:'用一个反例可以检验这样的“总是”说法；说法改变后，需要重新检验。',detail,
    method:{nodeId:'mt_j5YqQnN6xe',label:'构建数学论证',code:'ccss-math:MP.3'}};
}
