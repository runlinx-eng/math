// Presentation only. Derived from existing validated learning attempts and source tasks.
import {workflowFor,configuredApplications} from './p3-workflow.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(act,label,attrs='')=>'<button type="button" data-do="'+act+'" '+attrs+'>'+esc(label)+'</button>';
export function renderP3Flow(host,{atlas,id,record,embedded=false}){
  if(!host||!record)return;
  const flow=workflowFor(atlas,id,record);
  const latest=flow.latestCheck==='none'?'尚未提交检查':flow.latestCheck==='correct'?'最近一次操作通过检查':'最近一次操作需要修改';
  const proof=flow.attempts===0?'尚无当前任务的提交记录':flow.independent?'有首次独立正确的操作证据':flow.usedSupport?'本任务使用过提示或支持，不属于首次独立正确':flow.retried?'有重试记录，不属于首次独立正确':'有操作记录，尚无首次独立正确证据';
  const writing=flow.noteCount?'解释已保存，待确认':flow.hasDraft?'文字草稿已保存，尚未提交':'尚未提交文字解释';
  const actions=[
    button('p3-retry','再试当前条件'),
    flow.alternateIndex!==null?button('p3-variant','换一组已配置条件','data-index="'+flow.alternateIndex+'"'):'',
    flow.next?button('lesson','后续路线 · '+flow.next.title,'data-id="'+esc(flow.next.id)+'"'):'',
    ...flow.related.map(n=>button('p3-related',n.direction+' · '+n.title,'data-node="'+esc(n.nodeId)+'"')),
    ...flow.bridges.map(b=>button('lesson','联合任务 · '+b.title,'data-id="'+esc(b.id)+'"')),
    embedded?button('relations','观察地图联系'):button('back','返回数学树')
  ].filter(Boolean).join('');
  const application=flow.currentApplication;
  const applications=flow.applications.map(p=>button('lesson',p.label+' · '+p.title,'data-id="'+esc(p.sessionId)+'"')).join('');
  host.innerHTML='<div class="p3-flow-heading"><h2>验证与下一步</h2><small>活动完成不等于掌握知识</small></div>'+
    '<div class="p3-evidence" role="status"><p><strong>最近一次检查：</strong>'+esc(latest)+'</p>'+
    '<p><strong>历史完成：</strong>'+flow.done+'/'+flow.total+' 项通过；当前任务累计 '+flow.attempts+' 次提交。</p>'+
    '<p><strong>首次独立证据：</strong>'+esc(proof)+'</p>'+
    '<p><strong>解释状态：</strong>'+esc(writing)+'</p></div>'+
    '<div class="p3-followups"><h3>接下来可以</h3><div class="p3-action-list">'+actions+'</div></div>'+
    '<div class="p3-application"><h3>实践应用</h3><p>数学操作、模拟现实情境与真实生活实践是三类不同的活动。模拟检查通过不会自动记为真实实践。</p>'+
    (application?'<p><strong>当前关联：</strong>'+esc(application.label)+' · '+esc(application.kind)+'</p><p>现实尝试建议（未核验）：'+esc(application.real)+'</p>':'')+
    (applications?'<div class="p3-action-list">'+applications+'</div>':'')+
    '<details><summary>查看已配置的应用活动</summary><div class="p3-app-list">'+configuredApplications().map(p=>'<div><strong>'+esc(p.label)+'</strong><span>'+esc(p.kind)+'</span>'+button('lesson',p.title,'data-id="'+esc(p.sessionId)+'"')+'</div>').join('')+'</div><p>现实活动需本人实际操作并提供记录；当前版本不新增未经旧备份兼容验证的现实实践存储。</p></details></div>';
}
