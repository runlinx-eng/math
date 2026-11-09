// P7-D1: secondary learning history, relationships and practice paths.
// No new progress state: everything comes from the original evidence model.
import {workflowFor,configuredApplications} from './p3-workflow.js';
import {currentSubmission} from './state.js';
import {learningStage} from './workspace-flow.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(act,label,attrs='')=>'<button type="button" data-do="'+act+'" '+attrs+'>'+esc(label)+'</button>';
export function renderP3Flow(host,{atlas,id,record,embedded=false}){
  if(!host||!record)return;
  const flow=workflowFor(atlas,id,record),stage=learningStage(record,currentSubmission(record));
  const latest=flow.latestCheck==='none'?'尚未提交检查':flow.latestCheck==='correct'?'最近一次操作通过检查':'最近一次操作需要修改';
  const proof=flow.attempts===0?'尚无当前任务的提交记录':flow.independent?'有首次独立正确的操作证据':flow.usedSupport?'本任务使用过提示或支持，不属于首次独立正确':flow.retried?'有重试记录，不属于首次独立正确':'有操作记录，尚无首次独立正确证据';
  const writing=flow.noteCount?'解释已保存，待确认':flow.hasDraft?'文字草稿已保存，尚未提交':'尚未提交文字解释';
  const routes=[
    flow.alternateIndex!==null?button('p3-variant','换一组已配置条件','data-index="'+flow.alternateIndex+'"'):'',
    flow.next?button('lesson','后续路线 · '+flow.next.title,'data-id="'+esc(flow.next.id)+'"'):'',
    ...flow.related.map(n=>button('p3-related',n.direction+' · '+n.title,'data-node="'+esc(n.nodeId)+'"')),
    ...flow.bridges.map(b=>button('lesson','联合任务 · '+b.title,'data-id="'+esc(b.id)+'"')),
    embedded?button('relations','观察地图联系'):button('back','返回知识空间')
  ].filter(Boolean).join('');
  const application=flow.currentApplication;
  const applications=flow.applications.map(p=>button('lesson',p.label+' · '+p.title,'data-id="'+esc(p.sessionId)+'"')).join('');
  const applicationHTML='<details class="p3-application"><summary>拓展与实践应用（模拟现实情境不等于真实生活实践）</summary>'+
    '<p>数学操作、模拟现实情境与真实生活实践是三类不同的活动。模拟检查通过不会自动记为真实实践。</p>'+
    (application?'<p><strong>当前关联：</strong>'+esc(application.label)+' · '+esc(application.kind)+'</p><p>现实尝试建议（未核验）：'+esc(application.real)+'</p>':'')+
    (applications?'<div class="p3-action-list">'+applications+'</div>':'')+
    '<details><summary>查看已配置的应用活动</summary><div class="p3-app-list">'+configuredApplications().map(p=>'<div><strong>'+esc(p.label)+'</strong><span>'+esc(p.kind)+'</span>'+button('lesson',p.title,'data-id="'+esc(p.sessionId)+'"')+'</div>').join('')+'</div><p>现实活动需本人实际操作并提供记录；当前版本不新增未经旧备份兼容验证的现实实践存储。</p></details></details>';
  const other='<details class="p3-followups p3-more"><summary>更多知识联系与探索方式（可选）</summary>'+
    '<div class="p3-action-list">'+((stage==='passed'||stage==='reflect')&&flow.attempts>0?button('p3-retry','再试当前条件'):'')+routes+'</div></details>'+applicationHTML;

  if(flow.attempts===0){
    host.innerHTML='<p class="p3-evidence p3-before-check" role="status">尚未提交检查，检查记录会在提交作品后出现。</p>'+other;
    return;
  }
  const evidence='<div class="p3-evidence" role="status"><p><strong>最近一次检查：</strong>'+esc(latest)+'</p>'+
    '<p><strong>历史完成：</strong>'+flow.done+'/'+flow.total+' 项通过；当前任务累计 '+flow.attempts+' 次提交。</p>'+
    '<details class="p3-evidence-details"><summary>查看尝试依据与解释状态</summary>'+
    '<p><strong>首次独立证据：</strong>'+esc(proof)+'</p><p><strong>解释状态：</strong>'+esc(writing)+'</p></details></div>';
  // Correct answers and reflection should lead to the single main action above,
  // not a second wall of "next" buttons. The full history stays available.
  const passed=stage==='passed'||stage==='reflect';
  const compact=passed?'<details class="p3-review"><summary>查看这次的检查记录</summary>'+evidence+'</details>':evidence;
  const retry=!passed?'<div class="p3-retry">'+button('p3-retry','重新尝试本题')+'</div>':'';
  host.innerHTML=compact+retry+other;
}
