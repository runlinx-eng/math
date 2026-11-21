// #341 candidate-only shared feedback composition for already-tested B math contracts.
// This file is deliberately NOT imported by thinking-feedback.js or evidence-adapters.js.
// NO new runtime binding or reviewed manifest entry is authorized by its existence.
import {p116IntegerDotplotBinding,replayP116IntegerDotplotEvidence,submittedP116IntegerDotplotEvidence} from './p116-integer-dotplot-evidence.js';
import {p109CommonFactorBinding,replayP109CommonFactorEvidence,submittedP109CommonFactorEvidence} from './p109-common-factor-evidence.js';
import {p107FactorPairsBinding,replayP107FactorPairsEvidence,submittedP107FactorPairsEvidence} from './p107-factor-pairs-evidence.js';
import {p105PrimeDivisorsBinding,replayP105PrimeDivisorsEvidence,submittedP105PrimeDivisorsEvidence} from './p105-prime-divisors-evidence.js';
import {p091OneSidedRangeBinding,replayP091OneSidedRangeEvidence,submittedP091OneSidedRangeEvidence} from './p091-one-sided-range-evidence.js';

export const ISSUE341_FEEDBACK_PROPOSAL_STATUS='INACTIVE_NOT_APPROVED_NOT_RUNTIME_REGISTERED';
export const ISSUE341_INACTIVE_ADAPTER_PROPOSALS=Object.freeze([
  {id:'issue341-P116',type:'x-dotdraw',binding:p116IntegerDotplotBinding,replay:replayP116IntegerDotplotEvidence,submitted:submittedP116IntegerDotplotEvidence,
    summary:'想一想：整数刻度与点的个数怎样对应？（可选）',
    limitation:'只核对本次保存的点和频数；没有自动评定自由解释、选择过程或长期掌握。'},
  {id:'issue341-P109',type:'x-a35-factor',binding:p109CommonFactorBinding,replay:replayP109CommonFactorEvidence,submitted:submittedP109CommonFactorEvidence,
    summary:'想一想：提出最大公因式后怎样乘回去？（可选）',
    limitation:'只核本题已保存的展开和最大公因式，未证明自由推理或通用代数能力。'},
  {id:'issue341-P107',type:'x-factorrects',binding:p107FactorPairsBinding,replay:replayP107FactorPairsEvidence,submitted:submittedP107FactorPairsEvidence,
    summary:'想一想：怎样找齐不同的长方形因数对？（可选）',
    limitation:'转向后的相同因数对只算一次；只核这道原题的保存记录。'},
  {id:'issue341-P105',type:'x-numbersearch',binding:p105PrimeDivisorsBinding,replay:replayP105PrimeDivisorsEvidence,submitted:submittedP105PrimeDivisorsEvidence,
    summary:'想一想：试除余数怎样决定因数？（可选）',
    limitation:'只核固定原题实际试除的余数与分类，不说明学生能证明所有整数的分类。'},
  {id:'issue341-P091',type:'x-allowedrange',binding:p091OneSidedRangeBinding,replay:replayP091OneSidedRangeEvidence,submitted:submittedP091OneSidedRangeEvidence,
    summary:'想一想：开闭端点和不等号怎样配合？（可选）',
    limitation:'历史 probe 仅记录当时真假判断，没有保存每次图形的端点位置和开闭样式；不可将其重建为操作轨迹。'}
].map(Object.freeze));

const byType=new Map(ISSUE341_INACTIVE_ADAPTER_PROPOSALS.map(row=>[row.type,row]));
const recognized=(task,context)=>{
  const row=byType.get(task?.type);
  if(!row)return null;
  try {
    const bound=row.binding(task,context);
    return bound?.nodeId&&bound.method===null?{row,bound}:null;
  }catch{return null;}
};

// Proposed optional guide text. This is NOT a function called by the live UI.
export function issue341ProposedGuide(task,context){
  const found=recognized(task,context);
  if(!found)return null;
  return {type:task.type,summary:found.row.summary,question:found.bound.question};
}

export const issue341ProposedObservation=(id,proof)=>{
  if(id==='issue341-P116')
    return '本次点图实际保存了 '+proof.recordCount+' 条整数记录；众数为 '+proof.modes.join('、')+
      '，没有点的刻度包括 '+proof.zeroFrequencyTicks.join('、')+'。';
  if(id==='issue341-P109')
    return '最后一次保存的展开与原式逐项一致，核对的最大共同因式为 '+
      proof.greatestFactor.coefficient+(proof.greatestFactor.degree===1?'x':'')+
      '；这里不推断独立发现一般分解方法。';
  if(id==='issue341-P107')
    return '本次已保存并核对 '+proof.pairs.length+' 种不重复因数对，乘积都是 '+
      proof.total+'；行列互换不另外计数。';
  if(id==='issue341-P105'){
    const name={prime:'质数',composite:'合数',neither:'既非质数也非合数'}[proof.classification];
    if(!name)return null;
    return '本次在原题范围内核对了 '+proof.checkedDivisors.length+' 个试除候选数；'+
      proof.value+' 的不同因数为 '+proof.factors.join('、')+'，本题分类为'+name+'。';
  }
  if(id==='issue341-P091')
    return '本次最终数轴端点为 '+proof.bound+'、方向向右，端点'+
      (proof.inclusive?'包含':'不包含')+'；保存的 '+proof.trials.length+
      ' 次试数的题意结果已经按本题的不等号核对。';
  return null;
};

// Candidate-only rendering of newly proposed feedback, not additional math adjudication.
// The existing B submitted replay performs the original task, latest Check, and
// strict source-bound mathematical evidence checks. Never infer unrecorded actions.
export function issue341ProposedFeedback(task,model,record,context){
  const found=recognized(task,context);
  if(!found)return null;
  try {
    const proof=found.row.submitted(task,model,record,context);
    if(!proof)return null;
    const line=issue341ProposedObservation(found.row.id,proof);
    if(!line)return null;
    const detail=[found.row.limitation,
      '这里只使用原题真实保存的事件与最近一次完整 Check，不评定自由解释、独立策略或长期掌握。'];
    if(record.attempts.length>1)
      detail.push('此前提交的记录保持原样；本次只描述最新一致的完整快照。');
    if(record.support)
      detail.push('这次学习记录显示曾查看可选提示或反馈。');
    return {title:'这次作品中的思考线索',observation:line,
      connection:found.bound.question,detail,method:null,
      proposalStatus:ISSUE341_FEEDBACK_PROPOSAL_STATUS};
  }catch{return null;}
}
