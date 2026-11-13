// Issue #85: source-backed, read-only attribution experiment. No production progress or storage writes.
import {execFileSync} from 'node:child_process';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks,sourceBridge} from '../dist/learning/bridges.js';
import {validModel,inspect} from '../dist/learning/tasks.js';
import {lessonSummary} from '../dist/learning/state.js';
import {ACTIVITIES,KINDS,task as earlyTask,modelIsValid as earlyValid} from '../dist/exploration-content.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const out=resolve(root,'verification/learning-node-audit');
const read=name=>JSON.parse(readFileSync(resolve(out,name),'utf8'));
const source=()=>JSON.parse(readFileSync(resolve(root,'dist/data/math.json'),'utf8'));
const atlas=()=>JSON.parse(readFileSync(resolve(root,'dist/data/atlas.json'),'utf8'));
const invariant=(ok,message)=>{if(!ok)throw Error(message);};
const edgeKey=b=>b.fromTopicId+'>'+b.topicId;
const lessonByTopic=()=>new Map(Object.entries(LESSONS).map(([id,l])=>[l.topicId,id]));
const hasPass=(task,value)=>{try{return validModel(task,value)&&inspect(task,value).correct}catch{return false}};
const validAttempt=(task,event)=>!!event&&hasValue(event)&&safeValid(task,event.value);
const hasValue=event=>Object.prototype.hasOwnProperty.call(event,'value');
const safeValid=(task,value)=>{try{return validModel(task,value)}catch{return false}};

// Pure evidence derivation; never updates state, models, or persisted records.
// Attribution is an explicit hypothetical parameter, not a product default.
export function readOnlyNodeEvidence(state,nodeId,attribution='unassigned'){
  invariant(['unassigned','from','to','both','edge'].includes(attribution),'Unknown candidate attribution');
  const sessionId=lessonByTopic().get(nodeId);
  invariant(!!sessionId,'Unknown source node: '+nodeId);
  const tasks=sessionTasks(sessionId)||[];
  const record=state?.lessons?.[sessionId]||null;
  const nativeAttempts=tasks.reduce((sum,task,index)=>sum+(record?.cases?.[index]?.attempts||[])
    .filter(event=>validAttempt(task,event)).length,0);
  const historicalCorePass=record?lessonSummary(record).completed:false;
  const currentWorksChecked=!!record&&tasks.every((task,index)=>{
    const last=record.cases?.[index]?.attempts?.at(-1);
    const model=record.models?.[index];
    return !!last&&model!==undefined&&JSON.stringify(model)===JSON.stringify(last.value)&&hasPass(task,model);
  });
  const related=Object.values(BRIDGES).filter(b=>b.fromTopicId===nodeId||b.topicId===nodeId);
  const optional=attribution==='unassigned'?null:related.filter(b=>
    attribution==='from'?b.fromTopicId===nodeId:
    attribution==='to'?b.topicId===nodeId:
    attribution==='both'?true:false).map(b=>b.id);
  const candidateAttemptCount=optional?.reduce((sum,id)=>{
    const bridge=state?.daily?.bridges?.[id];
    return sum+(sessionTasks(id)||[]).reduce((n,t,i)=>n+(bridge?.cases?.[i]?.attempts||[])
      .filter(event=>validAttempt(t,event)).length,0);
  },0)??null;
  const candidateOptionalComplete=optional?.length?
    optional.every(id=>!!state?.daily?.bridges?.[id]&&lessonSummary(state.daily.bridges[id]).completed):null;
  const legacy=Object.entries(ACTIVITIES).filter(([,a])=>a.topicId===nodeId)
    .map(([id])=>{
      const activity=state?.activities?.[id];
      const validAttemptCount=KINDS.reduce((total,kind)=>total+[0,1].reduce((n,variant)=>{
        const task=earlyTask(id,kind,variant);
        return n+(activity?.evidence?.[kind+':'+variant]?.attempts||[]).filter(event=>{
          try{return hasValue(event)&&earlyValid(task,event.value)}catch{return false}
        }).length;
      },0),0);
      return {id,recorded:!!activity,validAttemptCount};
    });
  const legacyAttempts=legacy.reduce((n,row)=>n+row.validAttemptCount,0);
  const effectiveAttemptCount=nativeAttempts+legacyAttempts;
  const approvedTier=historicalCorePass&&currentWorksChecked?3:effectiveAttemptCount>0?2:1;
  return {
    nodeId,sessionId,attribution,coreTaskCount:tasks.length,nativeAttempts,
    // History and the current edited workpiece are intentionally separate facts.
    historicalCorePass,currentWorksChecked,
    nativeStage:nativeAttempts===0?'no_native_attempt':historicalCorePass?'core_pass_in_history':'learning',
    legacyAttempts,validNodeAttempts:effectiveAttemptCount,
    approvedTier,activeFourthTier:false,
    candidateBridgeIds:optional,candidateAttemptCount,candidateOptionalComplete,
    // Empty optional set is NOT promoted to a fourth tier without a product decision.
    candidateLevel4:optional?.length?historicalCorePass&&currentWorksChecked&&candidateOptionalComplete:null,
    legacy,legacyRequiresSeparateInterpretation:legacy.some(x=>x.recorded)
  };
}

export function optionalSetCompleted(assignedIds,completedIds){
  if(!assignedIds.length)return null; // empty-set policy is explicitly unresolved
  const passed=new Set(completedIds);
  return assignedIds.every(id=>passed.has(id));
}

function distributions(nodes,bridges){
  const modes=['from','to','both','edge'];
  return Object.fromEntries(modes.map(mode=>{
    const counts=Object.fromEntries(nodes.map(n=>[n.nodeId,0]));
    for(const b of bridges){
      if(mode==='from'||mode==='both')counts[b.fromTopicId]++;
      if(mode==='to'||mode==='both')counts[b.toTopicId]++;
    }
    const values=Object.values(counts);
    const histogram={zero:0,one:0,two:0,three:0,four:0,fiveOrMore:0};
    for(const n of values)histogram[n>=5?'fiveOrMore':['zero','one','two','three','four'][n]]++;
    const leaders=Object.entries(counts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))
      .slice(0,5).map(([nodeId,bridgeCount])=>({nodeId,bridgeCount,
        nodeName:nodes.find(n=>n.nodeId===nodeId)?.nodeName}));
    const nodeBridgeAssignments=values.reduce((a,b)=>a+b,0);
    return [mode,{scope:mode==='edge'?'relation_only':'node_hypothesis',
      assignedNodeBridgeRefs:nodeBridgeAssignments,
      assignedNodeTaskRefs:nodeBridgeAssignments*2,
      uniqueBridgeSessions:bridges.length,uniqueScoredTasks:bridges.reduce((n,b)=>n+b.taskCount,0),
      duplicateNodeTaskReferences:Math.max(0,nodeBridgeAssignments*2-bridges.reduce((n,b)=>n+b.taskCount,0)),
      histogram,maxBridgesPerNode:Math.max(...values),leaders}];
  }));
}

function makeSamples(nodes,bridges){
  const byCount=new Map(nodes.map(n=>[n.nodeId,n.relatedBridgeSessions.length]));
  const samples=[];
  const add=(role,row)=>{if(row)samples.push({role,nodeId:row.nodeId,nodeName:row.nodeName,sessionId:row.primarySessionId,
    nativeCoreTaskCount:row.taskCount,relatedBridgeCount:byCount.get(row.nodeId),
    bridgeIds:row.relatedBridgeSessions.map(b=>b.id),legacyActivityIds:row.earlyActivities.map(a=>a.id),
    sourcePath:'dist/data/math.json#nodes/'+row.nodeId,
    nativeTaskIndexes:row.coreTaskIndexes,
    nativeRecordPath:'lessons['+row.primarySessionId+'].cases[index].attempts'});
    else samples.push({role,available:false,reason:'No matching real node in current source; do not create a test-only node.'});};
  add('native_only',nodes.find(n=>n.relatedBridgeSessions.length===0));
  add('exactly_one_bridge',nodes.find(n=>n.relatedBridgeSessions.length===1));
  add('multiple_bridges',nodes.filter(n=>n.relatedBridgeSessions.length>1)
    .sort((a,b)=>b.relatedBridgeSessions.length-a.relatedBridgeSessions.length||a.nodeId.localeCompare(b.nodeId))[0]);
  add('no_approved_optional_attribution',nodes.find(n=>n.relatedBridgeSessions.length>0)||nodes[0]);
  for(const legacy of ['fair','rename','decimal'])
    add('legacy_'+legacy,nodes.find(n=>n.earlyActivities.some(a=>a.id===legacy)));
  const shared=bridges.find(b=>b.id==='link-equivalent-quarters')||bridges[0];
  add('shared_edge_from',nodes.find(n=>n.nodeId===shared.fromTopicId));
  add('shared_edge_to',nodes.find(n=>n.nodeId===shared.toTopicId));
  return {samples,sharedBridge:shared};
}

function makeReport(output){
  const {summary,attributions,samples,sharedBridge,legacy,classification,conflicts}=output;
  const lines=[
    '# Issue #85｜联合评分练习归属与四级进度只读试点','',
    '执行：node scripts/issue-85-attribution-pilot.mjs；node --test tests/learning-task-rules.test.mjs。',
    '已批准产品边界（2026-11-13）：未答题=一级；至少一次真实有效作答（含错误）=二级；原生全部必做题通过=三级并允许单独实现第三级光；第四级光暂时关闭，不能被任何候选归属自动点亮。',
    '本脚本只计算已批准前三层的只读候选状态及尚待核查的第四层假设，不开发进度 UI、不读取真实个人学习记录。',
    '',
    '## 源码事实与 A/B/C/D 分类','',
    '| 类别 | 真实来源 | 评分与状态 |',
    '| --- | --- | --- |',
    '| A 核心 | '+summary.sourceNodes+' 个原生节点 / '+summary.nativeCoreTasks+' 道题，sessionId:index | 原生 lessonSummary 与继续门槛，不变 |',
    '| B 候选可选评分 | '+summary.bridgeSessions+' 个独立联合 session / '+summary.bridgeTasks+' 道题 | 各自检查与 daily.bridges 保存；不等于已归属节点第四级 |',
    '| C 探索导航 | '+summary.sourceEdges+' 条真实知识关系及路线、知识入口 | 不记独立题分 |',
    '| D 不评分 | 草稿、个人发现、反思、旧自由试玩 | 不阻塞核心题，不增加可选评分题数 |',
    '',
    '源码追踪：dist/learning/bridges.js#sourceBridge、dist/learning/state.js#lessonSummary、dist/learning/daily.js#sessionRecord、dist/exploration-core.js#nodeState、dist/data/math.json。',
    '原始 source edge 无独立稳定 id；使用 prerequisiteId>topicId 作为逻辑边键，并同时记录 math.json 的数组索引与 session ID。',
    '源关系键冲突：'+conflicts.duplicateSourceEdgeKeys+'；不同 bridge 共享关系键：'+conflicts.multiBridgeEdgeKeys+'；找不到唯一来源：'+conflicts.ambiguousBridgeSourceEdges+'。',
    '',
    '## 真实样本（同一节点可承担多个角色）','',
    '| 场景 | 源节点 ID | 原生 session | 原生题数 | 关联联合任务数 |',
    '| --- | --- | --- | ---: | ---: |',
    ...samples.map(s=>'| '+s.role+' | '+(s.nodeId||'未找到')+' | '+(s.sessionId||'—')+' | '+(s.nativeCoreTaskCount??'—')+' | '+(s.relatedBridgeCount??'—')+' |'),
    '',
    '双端实例：'+sharedBridge.id+'，'+sharedBridge.fromTopicId+' → '+sharedBridge.toTopicId+
      '，edge='+sharedBridge.sourceEdgeKey+'，来源='+sharedBridge.sourceEdgePath+
      '，题号='+sharedBridge.taskIndexes.join(',')+'，记录='+sharedBridge.recordPath+'。',
    '全部 776 个映射及样本的相关任务列表见同目录 issue-85-attribution-pilot.json。',
    '',
    '## 四种联合任务归属候选（纯假设）','',
    '| 模式 | 节点-联合任务引用数 | 节点-题引用数 | 跨节点重复题引用 | 零关联节点数 | 单节点最大联合任务数 |',
    '| --- | ---: | ---: | ---: | ---: | ---: |',
    ...['from','to','both','edge'].map(m=>{
      const x=attributions[m];
      return '| '+m+' | '+x.assignedNodeBridgeRefs+' | '+x.assignedNodeTaskRefs+
        ' | '+x.duplicateNodeTaskReferences+' | '+x.histogram.zero+' | '+x.maxBridgesPerNode+' |';
    }),
    '',
    '- from：不会跨节点重复计数，但只计起点，不符合所有学习入口和双知识目标；起点密集的节点第四级成本较高。',
    '- to：不会跨节点重复计数，但只计终点；终点密集的节点第四级成本较高，且浏览入口不能直接证明归属。',
    '- both：两端节点都承担练习，若直接汇总节点题数会重复计入；必须定义总量去重与每节点分母，容易提高高连接节点负担。',
    '- edge：按真实 A—B 关系独立记录与检查，最贴合联合练习和现有 daily.bridges 存储，不污染节点核心完成；但无法自动生成节点独立第四级。',
    '',
    '**试点推荐（不是已批准的产品规则）：**优先采用 edge 独立归属作为关系证据；若今后希望联合题也计入某节点第四级，需要逐项经过数学目的审查和明确的归属/去重规则，而非批量自动认领。',
    '',
    '## 进度证据与限制','',
    '- 已确认产品决策：第一级=无已保存有效作答；第二级=至少一次有效作答（包含错误），早期活动的有效提交也可证明开始；不凭访问或草稿升级。',
    '- 已确认产品决策：第三级=原生全部必做题通过并显示第三级光；先保守核查当前作品是否仍为已提交检查的正确版本。历史已通过与当前作品修改状态分别展示为证据。',
    '- 已确认产品决策：第四级光全局暂不启用，直到未来明确可选评分练习的节点归属；试点内的 from/to/both/edge 均为研究假设，绝非已启用规则。',
    '- 两端原生核心都通过，不构成 A—B 联合 session 完成；联合任务独立通过也不会改写两端原生核心。',
    '- 若后来新增可选题，历史旧任务的通过记录保留，当前集合的全部完成候选可重新计算；历史徽标是否保留需用户决定。',
    '',
    '## 旧活动兼容','',
    '| 活动 | 节点 | 现代 session | 区别 | 优先级 |',
    '| --- | --- | --- | --- | --- |',
    ...legacy.map(l=>'| '+l.id+' | '+l.nodeId+' | '+l.sessionId+' | 两类历史尝试可达旧 completed，未证明现代核心题通过 | 待核查 |'),
    '',
    '只读推导不读取真实用户备份、不更改 schema。旧活动是否提交、检查通过、旧完成、原生完成应为不同字段。新用户 fair 旧入口缺失为此前审计的 P2 观察，不应自动升 P1。',
    '',
    '## 风险级别与证据层次','',
    '- P0：本只读试点未发现、也不能声称排除真实设备上的数据丢失；P10 兼容由独立 CI 复验。',
    '- P1：本试点尚无真实用户路径核心阻断证据；若 Chromium 或备份回归失败，应按实际原因另行判级。',
    '- P2：此前 fair 无独立旧入口的代表性发现，仍需在专项交互任务确认影响。',
    '- 待核查：3 个旧活动的旧完成与现代核心状态不一致、所有节点第四级归属/空集规则、旧备份真实样本兼容。',
    '- 已从源码确认：目录、来源边、任务分类和记录归属；已通过隔离测试：以最新 HEAD CI 输出为准；本脚本执行的真实 Chromium 点击：0。',
    '- main/PR 现有 Chromium 回归另有报告与截图，不得自动当作本试点真实点击。',
    '',
    '## 仍待未来决定（不阻塞前三层光）','',
    '1. 关系题归属边、A、B 还是双端；是否允许人工指定少数节点的可选题。',
    '2. 双端进度分母和总体总量去重方法；一个节点多个联合任务时如何定义全部完成。',
    '3. 经确认没有可选评分练习的节点：核心完成是否直接显示最高级。',
    '4. 早期活动已提交、旧完成与新核心完成如何分别展示；不迁移或删除原记录。',
    '5. 新增可选评分题后：显示「历史完成过」和「当前任务集合未全部完成」的方式。',
    '',
    '## 下一最小实施与回归','',
    '本轮仅归属研究与只读隔离测试。下一独立最小 UI PR 可以先实现第 1/2/3 级标记与第三级光，并确保第四级光始终关闭；联合任务归属、四级 UI 与关系线完成效果保留后续。另可独立开发「学习 A 时探索 B，右侧 A 学习现场不变」及名称可读性。',
    '回归清单：Node 审计/隔离测试、source edge 映射唯一性、P7/P9/P10 历史与备份安全、P8/P11 地图与学习入口、Chromium 真实点击/错误提交/刷新恢复、最新 HEAD Required 与合并后 main。',
    ''
  ];
  return lines.join('\n');
}

export async function buildIssue85Pilot(){
  await ensureB39Ready();
  execFileSync(process.execPath,['scripts/audit-learning-task-rules.mjs'],{cwd:root,timeout:120000,stdio:'pipe'});
  const nodes=read('task-classification.json').rows;
  const math=source(),map=atlas();
  const lookup=new Map();
  math.edges.forEach((e,index)=>{
    const key=e.prerequisiteId+'>'+e.topicId;
    if(!lookup.has(key))lookup.set(key,[]);
    lookup.get(key).push(index);
  });
  const bridges=Object.values(BRIDGES).map(b=>{
    const key=edgeKey(b),indices=lookup.get(key)||[],verified=sourceBridge(b.id,map);
    invariant(!!verified&&indices.length>=1,'Bridge without source edge: '+b.id);
    const tasks=sessionTasks(b.id)||[];
    return {id:b.id,sessionId:b.id,fromSessionId:b.from,toSessionId:b.to,
      fromTopicId:b.fromTopicId,toTopicId:b.topicId,sourceEdgeKey:key,
      sourceEdgeIndex:indices.length===1?indices[0]:null,
      sourceEdgePath:indices.length===1?'dist/data/math.json#edges['+indices[0]+']':null,
      sourceEdgeVerified:true,taskCount:tasks.length,
      taskIndexes:tasks.map((_,i)=>i),taskIds:tasks.map((_,i)=>b.id+':'+i),
      taskTypes:tasks.map(t=>t.type),recordPath:'daily.bridges['+b.id+'].cases[index].attempts',
      independentCoreGate:'not_required_for_native_lesson',
      sourceEdgeCandidateCount:indices.length};
  });
  invariant(nodes.length===587&&bridges.length===776,'Source inventory changed, audit before accepting pilot');
  invariant(bridges.reduce((n,b)=>n+b.taskCount,0)===1552,'Bridge task count changed');
  const edgeUses=new Map();
  bridges.forEach(b=>edgeUses.set(b.sourceEdgeKey,(edgeUses.get(b.sourceEdgeKey)||0)+1));
  const conflicts={
    duplicateSourceEdgeKeys:[...lookup.values()].filter(indexes=>indexes.length>1).length,
    multiBridgeEdgeKeys:[...edgeUses.values()].filter(count=>count>1).length,
    ambiguousBridgeSourceEdges:bridges.filter(b=>b.sourceEdgeCandidateCount!==1).length
  };
  const attributions=distributions(nodes,bridges);
  const {samples,sharedBridge}=makeSamples(nodes,bridges);
  const legacy=['fair','rename','decimal'].map(id=>{
    const row=nodes.find(n=>n.earlyActivities.some(a=>a.id===id));
    invariant(row,'Legacy activity not found: '+id);
    return {id,nodeId:row.nodeId,nodeName:row.nodeName,sessionId:row.primarySessionId,
      evidencePath:'activities['+id+'].evidence[kind:variant].attempts',
      legacyDefinition:'construct and transfer attempted (not necessarily passed)',
      currentNativeRecordPath:'lessons['+row.primarySessionId+'].cases[index].attempts'};
  });
  const summary={sourceNodes:nodes.length,sourceEdges:math.edges.length,
    nativeCoreTasks:nodes.reduce((n,x)=>n+x.taskCount,0),
    nativeOptionalScoredTasks:nodes.reduce((n,x)=>n+x.optionalScoredTaskIds.length,0),
    bridgeSessions:bridges.length,bridgeTasks:bridges.reduce((n,b)=>n+b.taskCount,0),
    legacyActivities:legacy.length,approvedNodeOptionalAttributions:0,
    realChromiumClicksFromThisScript:0};
  const classification={A:'native sequential scored and gated',B:'independent scored bridge; node attribution pending',
    C:'source relationships, navigation, route and reference are not scored tasks',
    D:'notes, drafts, reflection and old play are not independent scored optional tasks'};
  const output={schema:'math-issue-85-readonly-attribution-pilot/1',
    sourceMain:'dist/data/math.json',summary,classification,attributions,conflicts,
    samples,sharedBridge,legacy,bridges,
    caveat:'Candidate only; never read/mutate actual user records or infer browser clicks. Source edge has no native ID.'};
  mkdirSync(out,{recursive:true});
  writeFileSync(resolve(out,'issue-85-attribution-pilot.json'),JSON.stringify(output,null,2)+'\n');
  writeFileSync(resolve(out,'ISSUE-85-PILOT.md'),makeReport(output));
  console.log('ISSUE_85_PILOT '+JSON.stringify({summary,conflicts,attributions,
    sampleNodes:samples.map(s=>({role:s.role,nodeId:s.nodeId,sessionId:s.sessionId,relatedBridgeCount:s.relatedBridgeCount})),
    sharedBridge:{id:sharedBridge.id,from:sharedBridge.fromTopicId,to:sharedBridge.toTopicId,edge:sharedBridge.sourceEdgeKey}}));
  return output;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  await buildIssue85Pilot();
}
