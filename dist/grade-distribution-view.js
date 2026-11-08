// Read-only P2 stage list renderer. Node selection is delegated to existing space.js.
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export function renderGradeDistributionHTML(stats,{selectedStage='all',nodeTitle=()=>'',nodeRole=()=>''}={}){
  const e=escapeHtml;
  const stageLists=stats.stages.map(stage=>{
    const nodes=stage.nodeIds.map(id=>`<li><button type="button" class="grade-node-choice" data-action="choose" data-key="node:${e(id)}"><span>${e(nodeTitle(id))}</span><small>${e(nodeRole(id,stage.id))}</small></button></li>`).join('');
    return `<details class="grade-stage-list" data-stage="${e(stage.id)}" ${selectedStage===stage.id?'open':''}><summary>${e(stage.label)} · ${stage.nodeIds.length} 个知识点</summary><ol class="grade-node-list">${nodes||'<li class="grade-empty">当前范围没有该学段的映射节点。</li>'}</ol></details>`;
  }).join('');
  const unassigned=stats.unassignedNodeIds.length?`<details class="grade-stage-list" data-stage="unassigned"><summary>未分配小学学段 · ${stats.unassignedNodeIds.length} 个</summary><ol class="grade-node-list">${stats.unassignedNodeIds.map(id=>`<li><button type="button" class="grade-node-choice" data-action="choose" data-key="node:${e(id)}">${e(nodeTitle(id))}</button></li>`).join('')}</ol></details>`:'';
  const groups=stats.groups.length?`<details class="grade-group-list"><summary>逐知识群比较 · ${stats.groups.length} 组</summary><div class="grade-group-rows">${stats.groups.map(group=>`<button type="button" class="grade-group-choice" data-action="grade-open-pack" data-id="${e(group.id)}"><strong>${e(group.title)}</strong><span>${group.stageCounts.join(' / ')} · 跨阶段 ${group.overlapCount}</span></button>`).join('')}</div></details>`:'';
  return `<section class="grade-distribution" aria-label="小学学段分布" data-scope="${e(stats.scopeKind)}" data-id="${e(stats.scopeId)}">
  <h3>小学学段分布</h3><p class="grade-distribution-intro">根据每个领域知识点的课程映射统计，不将知识群研究判断套用于全部节点。</p>
  <div class="grade-distribution-stats" role="group" aria-label="选择学段并同步左侧观察">
    ${stats.stages.map(stage=>`<button type="button" class="grade-stage-choice" data-action="grade-map-stage" data-stage="${e(stage.id)}" aria-pressed="${selectedStage===stage.id}">${e(stage.label)}<strong>${stage.nodeIds.length}</strong></button>`).join('')}
  </div>
  <p class="grade-distribution-note">本范围 ${stats.domainNodeCount} 个领域知识点（去重），跨小学学段 ${stats.overlapNodeIds.length} 个${stats.tripleStageNodeIds.length?'，其中三学段共有 '+stats.tripleStageNodeIds.length+' 个':''}。不同学段的数量可重叠，不能相加为总数。</p>
  ${stageLists}${unassigned}
  ${stats.thinkingNodeCount?`<p class="grade-distribution-note">另有 ${stats.thinkingNodeCount} 个数学思维节点，不参与学段计数；仍可从搜索、关系及学习活动访问。</p>`:''}
  ${stats.missingMappingNodeIds.length?`<p class="grade-distribution-warning">缺少节点级映射 ${stats.missingMappingNodeIds.length} 个，不推断年级。</p>`:''}
  ${groups}
  <p class="grade-distribution-footnote">点击知识列表可在同一 3D 全景原位查看概念、节点学段角色、联系和来源。学段高亮不隐藏其他节点；23 群的 69 份整体研究判断不是节点数量来源。</p>
  </section>`;
}
