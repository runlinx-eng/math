// P7-D3: an exhaustive, source-derived learning capability map. No UI or storage changes.
// Run: node scripts/build_p7_d3_inventory.mjs
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {LESSONS,ROUTES,lessonIds} from '../dist/learning/catalog.js';
import {TASKS,PRACTICE,defaultModel,validModel} from '../dist/learning/tasks.js';
import {BRIDGES,sourceBridge} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
// The developer inventory enumerates all real tasks, unlike the browser's lazy shell.
await ensureB39Ready();
import {ACTIVITIES,KINDS,task as oldTask,defaultModel as oldModel,modelIsValid as oldValid} from '../dist/exploration-content.js';

const here=dirname(fileURLToPath(import.meta.url));
const atlas=JSON.parse(readFileSync(resolve(here,'../dist/data/atlas.json'),'utf8'));
const fields=['group','source','id','originEntry','userTask','dataJudging','currentUI','uiRole','showWhen','accessGuarantee','recommendation','status','evidence','preservation'];
const sourceFile=meta=>meta?.batch
 ? 'dist/learning/'+(/^B0[2-5]$/.test(meta.batch)?'phase4/':'phase5/')+meta.batch.toLowerCase()+'.js'
 : 'dist/learning/catalog.js + dist/learning/tasks.js';
const judgeFile=t=>t.type.startsWith('x-')?'dist/learning/phase4/engine.js → batch TYPES/valid/inspect':'dist/learning/tasks.js → validModel/inspect';
const supports=t=>{try{const m=defaultModel(t);return m!==undefined&&validModel(t,m);}catch{return false;}};
const edgeKey=e=>e.prerequisiteId+'>'+e.topicId;
const linkTo=id=>'index.html#space/node/'+encodeURIComponent(id);
const assessment=(sourceFound,modelFound)=>sourceFound&&modelFound?'1 · 源码技术链路已接入（尚未儿童/视觉验收）':'4 · 未归类或模型链路待核查（保留入口与来源）';
// Placement describes user-facing exposure, not which mathematics or data may be deleted.
// A capability can exist without a permanent button; unverified legacy entry points remain
// separately recorded until a real reachable and equivalent replacement is proved.
export const UI_ROLES=Object.freeze({
 current:'当前操作',
 contextual:'按需辅助',
 background:'后台能力',
 retained:'待归类保留'
});
const placement={
 'node-task':{uiRole:UI_ROLES.current,showWhen:'仅当前节点的当前题目激活时，显示题目、专属教具、与实际状态对应的唯一主操作；其余任务不常驻。',accessGuarantee:'当前知识的「打开学习」直达运行器；旧提交、草稿和记录不可丢。'},
 'bridge-task':{uiRole:UI_ROLES.current,showWhen:'仅当从实际源关系/联合任务入口激活时显示双任务操作，完成后继续路径必须有已配置来源。',accessGuarantee:'3D 源关系与对应联合任务入口可追溯；不能为 UI 拼接虚构边。'},
 'source-edge':{uiRole:UI_ROLES.contextual,showWhen:'在 3D 选择节点或关系、主动查看联系时显示；不将 1,223 条关系常驻学习面板。',accessGuarantee:'真实 3D 源关系仍可选可查，已有联合任务保持可进入。'},
 'route':{uiRole:UI_ROLES.contextual,showWhen:'仅在选择学习路线或真实接续时提供适当路线信息；当前教具为主。',accessGuarantee:'任意节点与建议路线仍可从空间找到，不被强制按顺序学习。'},
 'legacy-practice':{uiRole:UI_ROLES.retained,showWhen:'不以新工作区已统一为理由判定旧自由操作重复；原可见 play 入口的现状须另行实测。',accessGuarantee:'保留 PRACTICE 与 models[-1]；若已无法可视访问，记为待修复，不标已合并。'},
 'legacy-activity':{uiRole:UI_ROLES.retained,showWhen:'不进入当前主操作的常驻菜单；旧工作面按其已有入口独立可达。',accessGuarantee:'保留 v2.html 原入口、原模型/变式与活动历史，等效替代前不删。'},
 'legacy-journey':{uiRole:UI_ROLES.retained,showWhen:'仅在原早期路线/恢复场景中显示，不能作为新学习的额外必经层。',accessGuarantee:'保留 journey.html 与 journeys 独立记录和恢复路径。'},
 experiment:{uiRole:UI_ROLES.retained,showWhen:'在原版实验室入口供主动探索，不在日常学题区堆两个固定入口。',accessGuarantee:'保留两个原版实验的真实 URL 与独立交互。'},
 'old-quiz':{uiRole:UI_ROLES.retained,showWhen:'不可冒充当前学习运行器；原独立入口尚未验证。',accessGuarantee:'保留源码及旧记录迁移；若原入口不可达应显式登记风险。'},
 persistence:{uiRole:UI_ROLES.background,showWhen:'判题、作品快照、自动保存、压缩、备份与数据兼容不常驻题面；只显示必要成功/异常状态。',accessGuarantee:'导入导出需经足迹/工具入口可达；保存失败明确提示并保留草稿。'},
 continuation:{uiRole:UI_ROLES.contextual,showWhen:'有真实待续任务或待续问题时才显示「继续」；恢复机制不生成第二套学习入口。',accessGuarantee:'恢复从同一知识/同一作品进入；本机记录、场景和相机不重置。'},
 feedback:{uiRole:UI_ROLES.contextual,showWhen:'检查对应当前提交作品且有实际证据时才出现；数学解释不应抢先替孩子回答。',accessGuarantee:'已经核验的思维证据可查；未经评估的自由解释仍按原文保留。'},
 application:{uiRole:UI_ROLES.contextual,showWhen:'完成当下任务或用户主动请求拓展时显示；不同时向孩子铺开全部五类入口。',accessGuarantee:'全部已配置应用入口仍在次级区可找到；模拟不等于现实已实践。'}
};
const placeFor=group=>placement[group]||{uiRole:UI_ROLES.retained,showWhen:'尚无可证实的前台展示规则，暂不增加主界面按钮。',accessGuarantee:'原入口及历史功能先保留，另行核对迁移与等效路径。'};
const row=data=>{const role=placeFor(data.group);return Object.fromEntries(fields.map(k=>[k,String(data[k]??role[k]??'')]));};

export function buildInventory(){
 const entries=[],errors=[],routeIndex=new Map(),bridgeIndex=new Map(),typeCount=new Map();
 const add=r=>entries.push(row(r));
 for(const r of ROUTES)for(const id of r.ids) {
   if(!routeIndex.has(id))routeIndex.set(id,[]);
   routeIndex.get(id).push(r.id);
 }
 for(const id of lessonIds){
   const meta=LESSONS[id],tasks=TASKS[id]||[],exists=atlas.nodes.some(n=>n.id===meta.topicId);
   if(!exists)errors.push('Source node absent: '+id+' / '+meta.topicId);
   if(!tasks.length)errors.push('No node tasks: '+id);
   if(!routeIndex.has(id))errors.push('No route: '+id);
   for(const [i,t] of tasks.entries()){
     const ok=supports(t);
     typeCount.set(t.type,(typeCount.get(t.type)||0)+1);
     if(!ok)errors.push('No default/validator: '+id+'#'+(i+1)+' '+t.type);
     add({group:'node-task',source:sourceFile(meta),id:id+'#'+(i+1)+' ('+meta.topicId+')',
       originEntry:linkTo(meta.topicId)+' → 开始/继续学习；learn.html#'+id+'；短路线 '+(routeIndex.get(id)||[]).join(','),
       userTask:t.prompt||meta.title||'',dataJudging:'TASKS.'+id+'['+i+'] / '+t.type+' / '+judgeFile(t),
       currentUI:'learn.html → #learning-interaction/#work；#learning-check/#actions；#learning-next',
       recommendation:'保留原教具/输入/判题；按具体活动观察实际操作与反馈',
       status:assessment(exists,ok),evidence:'目录 catalog → TASKS → defaultModel/validModel → engine/widget；实机待验',
       preservation:'不修改题目及判题；不将通过等同理解'});
   }
   const p=PRACTICE[id];
   if(p){
     const ok=supports(p);
     add({group:'legacy-practice',source:sourceFile(meta)+' → PRACTICE.'+id,
       id:id+'#play (-1)',originEntry:'旧版 learn.html 的 play 状态；旧备份 models[-1]（统一工作区不再直接展示）',
       userTask:p.prompt||'',dataJudging:'PRACTICE.'+id+' / '+p.type+' / '+judgeFile(p),
       currentUI:'state.js → enterUnifiedTask 仅在旧模型适配当期 TASKS 时复用；原 play 可见入口未证实',
       recommendation:'保留 PRACTICE 与历史模型；审查不同模型无法迁移时的可见性，不贸然恢复/删除',
       status:'4 · 已定义但未归类至当前可见操作（迁移兼容风险）',
       evidence:'PRACTICE + sessionTaskFor(index=-1) + enterUnifiedTask + validateLesson；model='+ok,
       preservation:'原自由操作内容与 models[-1] 不删除'});
   }
 }
 for(const [id,b] of Object.entries(BRIDGES)){
   const e=sourceBridge(id,atlas);
   const okEdge=!!e,route=routeIndex.get(b.to)||[];
   if(!okEdge)errors.push('Bridge without source edge: '+id);
   if(!Array.isArray(b.tasks)||b.tasks.length!==2)errors.push('Bridge task count != 2: '+id);
   const k=b.fromTopicId+'>'+b.topicId;
   if(!bridgeIndex.has(k))bridgeIndex.set(k,[]);
   bridgeIndex.get(k).push(id);
   for(const [i,t] of (b.tasks||[]).entries()){
     const ok=supports(t);
     typeCount.set(t.type,(typeCount.get(t.type)||0)+1);
     if(!ok)errors.push('No bridge default/validator: '+id+'#'+(i+1)+' '+t.type);
     add({group:'bridge-task',source:sourceFile(b)+' + dist/learning/bridges.js',
       id:id+'#'+(i+1)+' ('+k+')',
       originEntry:'源边 '+k+' → 3D 关系 / 已配置的“联合任务” / learn.html#'+id,
       userTask:t.prompt||b.title||'',dataJudging:'BRIDGES.'+id+'.tasks['+i+'] / '+t.type+' / '+judgeFile(t),
       currentUI:'learn.html → 相同 #work/#actions；p3-view.js → 更多知识联系（按条件展示）',
       recommendation:'保持真实源边与双任务，优先验证进入及完成后返回关系；不制造新来源关系',
       status:okEdge&&ok?'3 · 已接入，入口依赖条件/折叠，实际可发现性待验':'4 · 保留并核对来源/模型',
       evidence:'sourceBridge(bridge,atlas)='+okEdge+'；默认模型有效='+ok+'；浏览器待验',
       preservation:'原始 source edge、判题和独立学习记录不改变'});
   }
 }
 for(const e of atlas.edges){
   const k=edgeKey(e),bridges=bridgeIndex.get(k)||[];
   add({group:'source-edge',source:'dist/data/atlas.json → edges',id:k,
     originEntry:'同一 3D 知识空间 → 基础/后续关系；'+(bridges.length?'可从关联工作区进入联合任务':'尚无专门的联合任务'),
     userTask:'认识知识间源关系'+(bridges.length?'，尝试已配置联合任务 '+bridges.join(','):''),
     dataJudging:'atlas.edges/prerequisiteId/topicId；关联任务必须 sourceBridge 校验',
     currentUI:'index.html/space.js/spatial-relationship.js → 3D 关系线与联系；'+(bridges.length?'p3-view.js':'仅知识联系'),
     recommendation:bridges.length?'保留源边并核实桥接任务可达':'保留 3D 源边，不得为了凑联合任务凭空创造关系',
     status:bridges.length?'1 · 3D 源边有联合任务（入口待验）':'3 · 有 3D 源边，无专门联合任务（不是功能删除）',
     evidence:'atlas.edges '+k+'；匹配桥接数='+bridges.length,
     preservation:'1,223 条源边及原坐标不变'});
 }
 for(const route of ROUTES){
   add({group:'route',source:sourceFile(LESSONS[route.ids[0]])+' / ROUTES',id:route.id,
     originEntry:'3D 知识群 / 学习导航中的建议路线',
     userTask:route.title+'；'+route.ids.map(id=>LESSONS[id]?.title||id).join(' → '),
     dataJudging:'ROUTES.ids → LESSONS → TASKS；routeFor/nextRouteLessonId',
     currentUI:'space.js 学习入口，learn.js #route 与 #steps',
     recommendation:'保持可自由进入任意源节点；不误写为必经先后关系',
     status:'1 · 已接入（操作顺序及标题待儿童验收）',evidence:'ROUTES + routeFor + learn.js route',
     preservation:'原路线及原节点不删除'});
 }
 for(const id of Object.keys(ACTIVITIES)){
   const a=ACTIVITIES[id],exists=atlas.nodes.some(n=>n.id===a.topicId);
   if(!exists)errors.push('Legacy activity source missing: '+id);
   for(const kind of KINDS)for(const variant of [0,1]){
     const t=oldTask(id,kind,variant),ok=oldValid(t,oldModel(t));
     if(!ok)errors.push('Legacy model invalid: '+id+'/'+kind+'/'+variant);
     add({group:'legacy-activity',source:'dist/exploration-content.js / dist/exploration.js / dist/exploration-core.js',
       id:id+'/'+kind+'/v'+variant+' ('+a.topicId+')',
       originEntry:linkTo(a.topicId)+' → 旧工作面活动；v2.html?embedded=1#activity/'+id,
       userTask:t.instruction||t.title||'',dataJudging:'exploration-content.js task/inspect/modelIsValid；activities[id].cases',
       currentUI:'space.js renderPanelSection(activity) → iframe v2.html / 原构造、迁移、解释',
       recommendation:'保留独立作品/判题与旧入口；验证是否有等效替代，未经验证不得隐藏',
       status:ok?'3 · 功能可寻到但入口是单独旧工作面':'4 · 原模型待核实',
       evidence:'ACTIVITIES + KINDS + variants + modelIsValid='+ok+'；浏览器待验',
       preservation:'原活动、变式、解释及历史独立记录不合并'});
   }
 }
 const extras=[
   ['legacy-journey','dist/journey-model.js + dist/journey.js','早期路线 A','3D 原节点 / 原早期路线 A；journey.html#step','独立观察/倒杯/检查/原学习证据','journey-model.js + exploration-core.js journeys','index.html #journey-frame → journey.html','保留早期路线与存档，核对新流程等效性','4 · 暂不归并到新运行器'],
   ['experiment','dist/experiments/hidden-cubes/index.html','hidden-cubes','v2.html#lab → 原版实验室','旋转观察隐藏立方体（英文原版）','独立实验，不写新版学习掌握证据','v2.html → experiments/hidden-cubes/','保留原版，可选跳转','4 · 单独实验室入口'],
   ['experiment','dist/experiments/bee-builder/index.html','bee-builder','v2.html#lab → 原版实验室','拼搭六边形（英文原版）','独立实验，不写新版学习掌握证据','v2.html → experiments/bee-builder/','保留原版，可选跳转','4 · 单独实验室入口'],
   ['persistence','dist/learning/state.js','lesson-record','learn.html → 自动保存/打开任务','提交、提示、错误尝试、重试、解释草稿及文字记录','freshLesson/submitLesson/currentSubmission/lessonSummary/validateLesson/mergeLesson','学习区及足迹','保留提交快照，修改后必须重新检查','1 · 源码链路已接入'],
   ['continuation','dist/learning/daily.js','daily-continuation','3D 学习/问题/足迹','暂停、恢复现场、当日回顾、问题稍后再想','captureSession/resumeQuestion/continuation/mergeDaily','#continue-card / learn.js / v2.html#journal','保留场景与位姿恢复；人工验证跨刷新','1 · 源码链路已接入'],
   ['persistence','dist/storage.js + dist/exploration-core.js','backup-offline','3D 菜单/记录与依据','本机存储、压缩、离线、导出、导入和旧数据迁移','packText/unpackText/backup/parseBackup/merge/migrateLegacy','space.js / v2.html / sw.js','保留旧版数据与导入冲突保护','1 · 源码链路已接入'],
   ['feedback','dist/learning/thinking-feedback.js','thinking-feedback','提交通过后的学习反馈','MP.2 与具体反例/分数改名线索；非掌握认证','thinkingFeedback + 已检验当前作品','learn.js 反馈区','逐任务扩展前先验证证据边界','2 · 覆盖特定类型，其他类型不冒充有反馈'],
   ['application','dist/learning/p3-workflow.js','configured-applications','后续/可选拓展','五类模拟应用及未核验现实建议','configuredApplications/workflowFor','p3-view.js → 折叠拓展区','明确模拟不等于真实生活实践','3 · 有入口但需展开'],
   ['old-quiz','dist/lessons.js + dist/app.js','pre-v2-quiz','旧版 app.js 入口在现行首页未核实','早期三课选择/输入/判题代码','dist/lessons.js grade；core.js 历史数据迁移','legacy 备份与历史展示；当前独立课程入口未核实','保留原代码和迁移记录，不声明等效替代','4 · 旧代码保留，当前入口待核']
 ];
 for(const x of extras)add({group:x[0],source:x[1],id:x[2],originEntry:x[3],userTask:x[4],
   dataJudging:x[5],currentUI:x[6],recommendation:x[7],status:x[8],
   evidence:'来源文件/调用链静态核查；涉及交互的端到端仍需验证',
   preservation:'不删除、不改存储 schema、无儿童验证声明'});
 const counts={sourceNodes:atlas.nodes.length,sourceEdges:atlas.edges.length,lessonCount:lessonIds.length,
   nodeTasks:Object.values(TASKS).reduce((a,ts)=>a+ts.length,0),routes:ROUTES.length,
   bridgeCount:Object.keys(BRIDGES).length,bridgeTasks:Object.values(BRIDGES).reduce((a,b)=>a+b.tasks.length,0),
   bridgeSourceEdges:bridgeIndex.size,unbridgedSourceEdges:atlas.edges.filter(e=>!bridgeIndex.has(edgeKey(e))).length,
   legacyActivities:Object.keys(ACTIVITIES).length,legacyVariants:entries.filter(x=>x.group==='legacy-activity').length,
   oldPracticeCount:entries.filter(x=>x.group==='legacy-practice').length,
   taskTypeCount:typeCount.size,rows:entries.length,
   uiRoleCounts:Object.fromEntries(Object.values(UI_ROLES).map(role=>[role,entries.filter(e=>e.uiRole===role).length]))};
 return {basis:'main 097dd53bc09a673a97d6be8f229d446f0f2eeca3 / P7-D3-A',
   limitation:'Static source/validator coverage only. No child study or claim of full visual usability. Open PR #49 is not included.',
   counts,taskTypes:Object.fromEntries([...typeCount].sort((a,b)=>a[0].localeCompare(b[0]))),
   diagnostics:errors,entries};
}
export function writeInventory(out=resolve(here,'../verification/p7-d3')){
 const inventory=buildInventory();
 mkdirSync(out,{recursive:true});
 writeFileSync(resolve(out,'capability-map.json'),JSON.stringify(inventory,null,2)+'\n');
 const escapeCell=v=>'"'+String(v??'').replaceAll('"','""').replaceAll(/\r?\n/g,' ')+'"';
 const csv=[fields.join(','),...inventory.entries.map(r=>fields.map(k=>escapeCell(r[k])).join(','))].join('\r\n');
 writeFileSync(resolve(out,'capability-map.csv'),'\uFEFF'+csv+'\r\n');
 writeFileSync(resolve(out,'audit-counts.json'),JSON.stringify({counts:inventory.counts,diagnostics:inventory.diagnostics,taskTypes:inventory.taskTypes},null,2)+'\n');
 console.log('P7-D3 source inventory:',JSON.stringify(inventory.counts));
 if(inventory.diagnostics.length)console.warn('Diagnostics:',inventory.diagnostics.slice(0,30));
 return inventory;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))writeInventory();
