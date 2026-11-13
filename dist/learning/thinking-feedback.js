// Describe only the submitted, current, replay-validated work. These observations
// are not a score, an assessment of free text, or a claim of general mastery.
import {inspect as inspectTask,validModel as validTask} from './tasks.js';
import * as fractions from './phase5/b17-model.js';
import * as arguments38 from './phase5/b38-model.js';
import * as patterns34 from './phase5/b34-model.js';
import {sequenceBinding,replaySequenceEvidence} from './sequence-evidence.js';
import {arrayBinding,replayArrayEvidence} from './array-evidence.js';
import {lineBinding,replayLineEvidence} from './line-evidence.js';
import {counterexampleBinding,replayCounterexampleEvidence} from './counterexample-evidence.js';

// Prompts are reviewed native positions, never inferred from a widget type.
export function thinkingGuide(task,context={}){
  if(task?.type==='x-r38-counterexample'){
    const source=counterexampleBinding(task,context);
    return source?{type:task.type,summary:'想一想：怎样检验“总是”？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-s23-lines'){
    const source=lineBinding(task,context);
    return source?{type:task.type,summary:'想一想：怎样检查两条边？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-mularray'){
    const source=arrayBinding(task,context);
    return source?{type:task.type,summary:'想一想：这幅阵列怎样变化？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-p34-sequence'){
    const source=sequenceBinding(task,context);
    return source?{type:task.type,summary:'想一想：怎样找出这一步的规律？（可选）',question:source.question}:null;
  }
  return null;
}
// A shared card widget appears in several thinking domains. Link MP.3 only
// for these inspected B38 lesson positions, never solely from task.type.
const VERIFIED_REASONING={show38:[2],because38:[1,2],argument38:[0,2]};

export function thinkingFeedback(task,model,record,context={}){
  const attempts=record?.attempts||[],lastAttempt=attempts.at(-1);
  if(!lastAttempt||JSON.stringify(lastAttempt.value)!==JSON.stringify(model))return null;
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
  const arraySource=arrayBinding(task,context);
  if(arraySource){
    const proof=replayArrayEvidence(task,model);
    if(!proof)return null;
    let observation=`你实际摆出了 ${proof.rows} 行、每行 ${proof.cols} 格；每格代表 ${proof.unit}，这幅阵列共表示 ${proof.total}。`;
    if(proof.turned)observation+=`你实际转向后看到了 ${proof.cols} 行、每行 ${proof.rows} 格，总量仍是 ${proof.total}。`;
    if(proof.cut!==null)observation+=`你实际在第 ${proof.cut} 列后切开，核对得到左边 ${proof.left}、右边 ${proof.right}，合起来仍是 ${proof.total}。`;
    return {title:'这次作品中的思考线索',observation,
      connection:proof.cut!==null?'为什么左右两边都保留了同样的行数？试着把等式说给别人听。':
        proof.turned?'转向只换了行和列，为什么格子总数没有变化？':'如果每格代表的数量再变化，这幅阵列又会表示多少？',
      detail:['这里只检查本次阵列、实际操作和当前提交；不能据此判断独立解释、一般证明、归纳能力或长期掌握。'],
      method:{nodeId:arraySource.nodeId,label:arraySource.label,code:arraySource.code}};
  }
  const lineSource=lineBinding(task,context);
  if(lineSource){
    const proof=replayLineEvidence(task,model);
    if(!proof)return null;
    const pair=x=>`边${x.first+1}与边${x.second+1}`;
    const relations=proof.tests.map(x=>pair(x)+(x.parallel?'的所在直线平行':x.perpendicular?'的所在直线垂直':'的所在直线既不平行也不垂直'));
    const detail=['这里只核对本题屏幕上实际选出的边与当前提交；不能推断独立解释、一般证明或长期掌握。'];
    if(attempts.slice(0,-1).some(a=>a.value&&replayLineEvidence(task,a.value)===null))detail.unshift('你修改后又试了一次。');
    if(record.support)detail.push('你看过提示或比较反馈。');
    return {title:'这次作品中的思考线索',
      observation:`你实际检查了 ${proof.tests.length} 次边之间的关系：${relations.join('；')}。`,
      connection:'转动整个图形后，哪些关系没有变？试着说明你会怎样检查。',
      detail,method:lineSource.method||null};
  }
  const counterexampleSource=counterexampleBinding(task,context);
  if(counterexampleSource){
    const proof=replayCounterexampleEvidence(task,model);
    if(!proof)return null;
    const comparison={less:'比原来的数更小',equal:'与原来的数一样大',greater:'比原来的数更大'}[proof.actual];
    return {
      title:'这次作品中的思考线索',
      observation:`你实际检验了 ${proof.comparisons} 次乘法比较；最后一次 ${proof.value} × ${proof.factor} 的结果${comparison}，与题目中的“${proof.rule==='strict'?'总会变大':'总不会变小'}”说法矛盾。`,
      connection:'一个符合条件的反例可以推翻“总是”的说法。改变乘数或者命题，再试一次，结果还矛盾吗？',
      detail:['这里只核查本次确实执行且经检查的有理数比较；不评价独立论证、一般证明或学习迁移。'],
      method:{nodeId:counterexampleSource.nodeId,label:'构建数学论证',code:'ccss-math:MP.3'}
    };
  }
  const sequenceSource=sequenceBinding(task,context);
  const verifiedSequence=!!sequenceSource;
  const verifiedChain=task.type==='x-r38-chain'&&VERIFIED_REASONING[context.sessionId]?.includes(context.index);
  const handler=verifiedSequence?patterns34:task.type==='x-fracrename'?fractions:
    verifiedChain?arguments38:null;
  if(!handler||!handler.valid(task,model)||!handler.inspect(task,model).correct)return null;
  const detail=[];
  if(attempts.slice(0,-1).some(a=>handler.valid(task,a.value)&&!handler.inspect(task,a.value).correct))detail.push('你修改后又试了一次。');
  if(record.support)detail.push('你看过提示或比较反馈。');
  if(verifiedSequence){
    const proof=replaySequenceEvidence(task,model);
    if(!proof)return null;
    const increment=task.step/proof.scale;
    const move=task.op==='add'?(increment>=0?'加'+increment:'减'+Math.abs(increment)):
      task.op==='multiply'?'按乘'+task.step+'的规则':task.op==='affine'?'按乘'+task.a+'再加'+task.b+'的规则':'按位置规则';
    const steps=proof.advances+' 次'+move;
    const undo=proof.undos?'，其中还实际撤回了 '+proof.undos+' 次':'';
    const numericPrediction=task.questions?.length===1&&task.questions[0].kind==='number';
    const checked=numericPrediction?'预测下一项是 '+model.answers[0]:'填写的回答与题目条件相符';
    detail.push('这里只核对可重放的逐项操作与当前答案；不能据此判断独立归纳、一般证明、自由解释或长期掌握。');
    return {title:'这次作品中的思考线索',
      observation:'你从'+proof.displayValues[0]+'出发，实际留下了 '+proof.displayValues.join('、')+
        '，逐步做了 '+steps+undo+'，并在本次检查中'+checked+'。',
      connection:task.op==='add'?'换个起点后，相邻两项仍怎样变化？你能说明为什么吗？':
        '换一个起点或运算规则，这些步骤还能照搬吗？你会先检查哪一步？',
      detail,
      method:{nodeId:sequenceSource.nodeId,label:sequenceSource.label,code:'ccss-math:MP.8'}
    };
  }
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
