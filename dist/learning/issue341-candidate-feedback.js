// Pure candidate bindings and presentation callbacks for all365.
// This module has no dependency on a shared default registry or feedback router.
// It does not register candidates, change the approved manifest or grant strict A.
import {ISSUE341_CANDIDATE_FAMILIES} from './issue341-candidate-descriptors.js';
import {ISSUE341_INACTIVE_ADAPTER_PROPOSALS,issue341ProposedObservation}
 from './issue341-inactive-shared-feedback.js';

export const ISSUE341_INTEGRATION_STATUS='ISOLATED_INTEGRATION_NOT_FORMALLY_APPROVED';
const neutralQuestion='你保存的哪些记录支持这次结果？';
const reviewedText=new Map(ISSUE341_INACTIVE_ADAPTER_PROPOSALS.map(row=>[row.id,row]));

export const ISSUE341_NORMALIZED_ADAPTERS=Object.freeze(ISSUE341_CANDIDATE_FAMILIES.map(family=>{
 const sources=new Map(family.sources.map(source=>[source.position,source]));
 return Object.freeze({...family,binding:(task,context)=>{
  const raw=family.binding(task,context);
  if(!raw)return null;
  if(raw.method!=null)return null;
  const source=sources.get(context?.sessionId+':'+context?.index);
  if(!source||source.type!==task?.type)return null;
  const declaredNode=raw.nodeId??raw.sourceNodeId;
  if(declaredNode!==source.nodeId)return null;
  // P007 uses sourceNodeId and intentionally has no method/question fields.
  // Normalize presentation metadata, leaving its original proof and submitted
  // functions intact, including the two actual wrong-to-correct Checks.
  return Object.freeze({...raw,nodeId:source.nodeId,method:null,
   question:typeof raw.question==='string'&&raw.question?raw.question:neutralQuestion,
   candidateSource:source,strictAApproved:false});
 }});
}));

export const issue341GuideForBinding=({adapter},task)=>({type:task.type,
  summary:reviewedText.get(adapter.id)?.summary??'想一想：这次保存的记录能说明什么？（可选）',
  // Some original contract questions contain numeric answers. Keep those
  // after the successful Check; the pre-Check guide must not reveal them.
  question:'哪些记录能帮助你核对这次结果？'});

export const issue341FeedbackForProof=({adapter,binding},proof,task,model,record)=>{
  const specific=reviewedText.get(adapter.id);
  const observation=specific?issue341ProposedObservation(adapter.id,proof):
   '这次检查对应的保存记录符合本题已核对的条件。';
  if(typeof observation!=='string'||!observation)return null;
  const detail=[
   ...(specific?[specific.limitation]:[]),
   '这里只描述与最近一次 Check 一致、且通过本题证据核对的已保存作品。',
   '这条反馈不评定自由解释、独立策略、理解或长期掌握。'
  ];
  if(record.attempts.length>1)detail.push('此前提交的记录保持原样；本次只描述最新一致的完整快照。');
  if(record.support)detail.push('这次学习记录显示曾查看可选提示或反馈。');
  return {title:'这次作品中的思考线索',observation,connection:binding.question,
   detail,method:null,proposalStatus:ISSUE341_INTEGRATION_STATUS,
   candidateFamily:adapter.id};
 };
