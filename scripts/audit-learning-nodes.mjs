// Read-only learning-task and entrance audit. Does not read or write user records.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {LESSONS,ROUTES} from '../dist/learning/catalog.js';
import {TASKS,PRACTICE,defaultModel,validModel} from '../dist/learning/tasks.js';
import {BRIDGES,sessionTasks,sourceBridge} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import {ACTIVITIES,activityIds,KINDS,task as oldTask,defaultModel as oldModel,modelIsValid as oldValid} from '../dist/exploration-content.js';
import {routeStep} from '../dist/journey-model.js';
import {decideLearningEntry} from '../dist/learning/entry-decision.js';
import {RELATIONSHIP_POSITIONS} from '../dist/spatial-relationship-data.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const source=read('dist/data/math.json'),atlas=read('dist/data/atlas.json');
await ensureB39Ready();
const nativeByTopic=new Map(),legacyByTopic=new Map(),bridgeByTopic=new Map(),packByTopic=new Map();
function add(map,key,value){const rows=map.get(key)||[];rows.push(value);map.set(key,rows);}
for(const [id,l] of Object.entries(LESSONS))add(nativeByTopic,l.topicId,id);
for(const id of activityIds)add(legacyByTopic,ACTIVITIES[id].topicId,id);
for(const [id,b] of Object.entries(BRIDGES)){
  add(bridgeByTopic,b.fromTopicId,id);
  if(b.topicId!==b.fromTopicId)add(bridgeByTopic,b.topicId,id);
}
for(const p of atlas.packs)for(const id of p.nodeIds)add(packByTopic,id,p);
const atlasIds=new Set(atlas.nodes.map(n=>n.id));
const canValidate=t=>{try{return !!t&&validModel(t,defaultModel(t))}catch{return false}};
const validEarly=id=>{try{return KINDS.every(kind=>[0,1].every(variant=>{
  const t=oldTask(id,kind,variant);return !!t&&oldValid(t,oldModel(t));
}))}catch{return false}};
const rows=[],issues=[];
const emptyState={lessons:{},activities:{},daily:{questions:[],bridges:{},continuation:null}};
function problem(n,priority,code,detail,evidence,fix){
  issues.push({nodeId:n.id,nodeName:n.title,priority,code,detail,evidence,
    reproduction:'node scripts/audit-learning-nodes.mjs; inspect nodes.json record '+n.id,
    minimumFix:fix});
}
for(const n of source.nodes){
  const native=nativeByTopic.get(n.id)||[],legacy=legacyByTopic.get(n.id)||[],
    bridges=bridgeByTopic.get(n.id)||[],packs=packByTopic.get(n.id)||[];
  const goodNative=native.filter(id=>sessionTasks(id)?.length&&sessionTasks(id).every(canValidate));
  const badNative=native.filter(id=>!goodNative.includes(id));
  const goodLegacy=legacy.filter(validEarly),badLegacy=legacy.filter(id=>!goodLegacy.includes(id));
  const goodBridges=bridges.filter(id=>sourceBridge(id,atlas)&&sessionTasks(id)?.length&&sessionTasks(id).every(canValidate));
  const badBridges=bridges.filter(id=>!goodBridges.includes(id));
  const thinking=n.domainId==='thinking',inAtlas=atlasIds.has(n.id);
  const position=RELATIONSHIP_POSITIONS[n.id]||null;
  const hasPosition=Array.isArray(position)&&position.length===3&&position.every(Number.isFinite);
  const decision=decideLearningEntry({selected:{kind:'node',id:n.id,title:n.title},state:emptyState});
  const direct=(decision.kind==='lesson'&&goodNative.includes(decision.lessonId))||
    (decision.kind==='legacy'&&goodLegacy.includes(decision.legacyId))||
    (decision.kind==='journey'&&!!routeStep(n.id));
  const taskPresent=!!(goodNative.length||goodLegacy.length||goodBridges.length);
  const mapped=inAtlas&&packs.length>0&&(thinking||hasPosition);
  const status=!mapped?'mapping_issue':!taskPresent?'task_unproven':direct?'static_entry_mapped':'entry_unproven';
  if(!mapped)problem(n,'P1','map_mapping_missing','源节点没有匹配地图节点、知识群或领域节点的空间坐标','dist/data/math.json; dist/data/atlas.json; dist/spatial-relationship-data.js','核对生成索引，不修改源节点和关系');
  if(badNative.length)problem(n,'P1','native_model_invalid','原生课程任务或默认模型未通过静态检查: '+badNative.join(','),'dist/learning/tasks.js; dist/learning/phase4/async-batches.js','核对动态装载与任务模型');
  if(badLegacy.length)problem(n,'P2','legacy_model_invalid','早期活动初始模型不满足原验证器: '+badLegacy.join(','),'dist/exploration-content.js','核对旧工作面的模型和入口');
  if(badBridges.length)problem(n,'P2','bridge_task_invalid','联合任务缺少真实边或有效任务模型: '+badBridges.join(','),'dist/learning/bridges.js; dist/data/atlas.json','核实原引用，保留源关系');
  if(native.length>1)problem(n,'待核查','multiple_native_mappings','多个原生课程指向同一节点: '+native.join(','),'dist/learning/catalog.js','判定是否为预期多课程，不自动删除');
  if(!taskPresent)problem(n,'待核查','no_usable_task_proven','已检查目录没有证实可用任务；尚未排除其他历史入口','dist/learning/catalog.js; dist/exploration-content.js; dist/learning/bridges.js','检查旧入口并复验，再确定是否缺课');
  else if(!direct)problem(n,'待核查','entry_not_proven','存在任务但主入口未证实直接进入: '+decision.kind,'dist/learning/entry-decision.js; dist/space.js','用 Chromium 检查真实入口，不把静态目录当成可达');
  const routeIds=ROUTES.filter(r=>r.ids.some(id=>native.includes(id))).map(r=>r.id);
  rows.push({
    id:n.id,name:n.title,domain:thinking?'thinking':'domain',domainId:n.domainId,
    themeIds:[...new Set(packs.map(p=>p.themeId))],packIds:packs.map(p=>p.id),
    sourceExists:true,atlasExists:inAtlas,position:hasPosition?position:null,
    spatialNote:thinking&&!hasPosition?'thinking_not_independent_3d_by_design':null,
    sourceEdgeCount:atlas.edges.filter(e=>e.topicId===n.id||e.prerequisiteId===n.id).length,
    lessonIds:native,validLessonIds:goodNative,invalidLessonIds:badNative,
    lessonTaskCounts:Object.fromEntries(goodNative.map(id=>[id,TASKS[id].length])),
    practiceIds:goodNative.filter(id=>!!PRACTICE[id]),
    earlyActivityIds:legacy,validEarlyActivityIds:goodLegacy,invalidEarlyActivityIds:badLegacy,
    bridgeIds:bridges,validBridgeIds:goodBridges,invalidBridgeIds:badBridges,
    routeIds,earlyJourneyStep:routeStep(n.id)?.step??null,
    primaryEntryKind:decision.kind,primarySessionId:decision.lessonId||null,
    entryPath:decision.kind==='lesson'?'node -> learn -> learn.html#'+decision.lessonId:
      decision.kind==='legacy'?'node -> learn -> early activity '+decision.legacyId:
      decision.kind==='journey'?'node -> learn -> journey.html#'+decision.step:
      'node -> learn -> no direct session',
    taskPresent,staticStatus:status,browserVerified:false,
    browserEvidence:null,finalStatus:'pending_browser_verification',
    coreTaskEvidence:goodNative.length?'Native task order: state.js lessonSummary + workspace-flow.js next on passed':'unverified',
    optionalGradedTaskEvidence:'pending_review',
    fourStateSupport:'pending_record_and_optional_task_mapping_audit',
    evidence:['dist/data/math.json#nodes/'+n.id,'dist/data/atlas.json#nodes/'+n.id,
      'dist/learning/catalog.js','dist/learning/entry-decision.js','dist/space.js'],
    reviewReason:status==='static_entry_mapped'?'逐节点真实点击未验证；核心/可选题边界尚未独立证实':'静态任务/映射/入口证据不足'
  });
}
function invariant(ok,message){if(!ok)throw Error(message);}
invariant(source.nodes.length===587,'Expected 587 source nodes, got '+source.nodes.length);
invariant(new Set(source.nodes.map(n=>n.id)).size===587,'Duplicate source ID');
invariant(source.edges.length===1223,'Expected 1223 source edges');
invariant(source.nodes.filter(n=>n.domainId==='thinking').length===50,'Expected 50 thinking nodes');
invariant(rows.length===587&&new Set(rows.map(n=>n.id)).size===587,'Audit coverage mismatch');
const count=fn=>rows.filter(fn).length;
const summary={
  inspected:rows.length,sourceNodes:source.nodes.length,sourceEdges:source.edges.length,
  domainNodes:count(r=>r.domain==='domain'),thinkingNodes:count(r=>r.domain==='thinking'),
  sourceNodesInAtlas:count(r=>r.atlasExists),independent3dPositions:count(r=>!!r.position),
  staticallyConfiguredTaskNodes:count(r=>r.taskPresent),
  staticallyMappedDirectEntryNodes:count(r=>r.staticStatus==='static_entry_mapped'),
  taskButEntryNotProven:count(r=>r.taskPresent&&r.staticStatus!=='static_entry_mapped'),
  taskNotProven:count(r=>!r.taskPresent),
  browserConfirmedReachable:0,browserConfirmedBroken:0,
  browserUnverified:rows.length,coreOptionalFullyProven:0,coreOptionalPending:rows.length,
  issuesByPriority:Object.fromEntries(['P0','P1','P2','待核查'].map(k=>[k,issues.filter(x=>x.priority===k).length])),
  caveat:'Static maps are not click evidence. No per-node Chromium results are claimed. No optional graded question subgroup is inferred.'
};
invariant(summary.domainNodes+summary.thinkingNodes===587,'Domain counts mismatch');
invariant(summary.browserConfirmedReachable+summary.browserConfirmedBroken+summary.browserUnverified===587,'Verification counts mismatch');
const output=resolve(root,'verification/learning-node-audit');
mkdirSync(output,{recursive:true});
const write=(name,value)=>writeFileSync(resolve(output,name),JSON.stringify(value,null,2)+'\n');
write('nodes.json',{schema:'math-learning-node-audit/1',source:'dist/data/math.json',rows});
write('summary.json',summary);
write('issues.json',issues);
const guide=[
  '# 587 节点学习任务与入口静态审计','','运行：node scripts/audit-learning-nodes.mjs',
  '不读取本地个人学习记录，不写入任何学习数据；输出来自当前源码。','',
  '| 统计 | 数量 |','| --- | ---: |',
  ...Object.entries(summary).filter(([,v])=>typeof v==='number').map(([k,v])=>'| '+k+' | '+v+' |'),
  '', '## 证据限制',
  '- 静态入口映射仅是源码事实，不代表真实 3D 点击成功。',
  '- 浏览器逐节点验收数为 0；代表性 Chromium 回归单独记录，不能转算为 587 个节点全部可点击。',
  '- 50 个数学思维节点没有独立 3D 坐标是既有设计，不直接当成缺课。',
  '- 原生题目检查通过后才能下一步；额外发现文字是可选。其他评分可选题是否存在以及旧活动四态标准仍待核查。',
  '- 有效作答尝试包括答错并保存的提交；打开节点、纯草稿不算有效作答。',
  '- 无证据的配置一律待核查；报告不把“待核查”伪装成确认无任务或已可达。',
  '', '## 文件','- nodes.json：587 节点完整映射及每条证据。',
  '- summary.json：互斥汇总统计。','- issues.json：按真实 ID 列出的异常与待核查。',
  '', '## 下一轮最小修复顺序',
  'P0：若出现真实记录丢失，先停修改保留证据。',
  'P1：只修实测核心入口不可达或完成判定错误的节点。',
  'P2：保留旧入口前提下修真实非核心配置问题。',
  '待核查：只补证据，不改变判题、任务或历史记录。',
  ''
];
writeFileSync(resolve(output,'README.md'),guide.join('\n'));
console.log('LEARNING_NODE_AUDIT '+JSON.stringify(summary));
