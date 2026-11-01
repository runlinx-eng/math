// Reproducible, source-ID keyed import of the chosen full-graph prototype.
// This maps existing material; it does not claim that any teaching was audited.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {relationExplanation} from '../dist/spatial-reasons.js';
import {ROUTES,lessonForTopic} from '../dist/learning/catalog.js';
import {BRIDGES} from '../dist/learning/bridges.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const original=read('docs/spatial-learning/reference-original.html');
const atlasBytes=read('dist/data/atlas.json');
if(hash(original)!=='b293e87591935a94d85ec84cf709ad9c0efe5e65bdbbd32982b3697eef172109')throw Error('Prototype changed; review its identity mapping before importing.');
if(hash(atlasBytes)!=='b30b16783f518e47fed8dd6e412bb6ee6e323b5250834c0ee1c0bb68dff94caf')throw Error('Atlas changed; review the source snapshot before importing.');
const match=original.toString().match(/<script id="atlas" type="application\/json">([\s\S]*?)<\/script>/);
if(!match)throw Error('Prototype atlas was not found.');
const prototype=JSON.parse(match[1]),atlas=JSON.parse(atlasBytes),coverage=JSON.parse(read('docs/phase5/coverage.json'));
const byId=new Map(atlas.nodes.map(n=>[n.id,n])),byTopic=new Map(coverage.nodes.map(n=>[n.topicId,n]));
if(byId.size!==587||byTopic.size!==587)throw Error('Node identity or coverage is incomplete.');
const positions={},idByPrototype=new Map();
for(const p of prototype.nodes){
  const n=atlas.nodes[p.oldId];
  if(!n||n.domainId==='thinking'||n.title!==p.name||positions[n.id]||!Array.isArray(p.xyz)||p.xyz.length!==3||!p.xyz.every(Number.isFinite))throw Error('Prototype node cannot be mapped exactly: '+p.id);
  positions[n.id]=p.xyz;idByPrototype.set(p.id,n.id);
}
if(Object.keys(positions).length!==537||new Set(idByPrototype.values()).size!==537)throw Error('Expected 537 unique domain nodes.');
const edgeKey=e=>[e.prerequisiteId,e.topicId,e.strength].join('|');
const edgeMap=new Map(atlas.edges.map(e=>[edgeKey(e),e]));
if(edgeMap.size!==atlas.edges.length||atlas.edges.length!==1223)throw Error('Source edge identity is ambiguous.');
const presentEdges=atlas.edges.filter(e=>positions[e.prerequisiteId]&&positions[e.topicId]);
for(const [type,edges] of [['hard',prototype.hard],['soft',prototype.soft]]){
  const keys=edges.map(([from,to])=>[idByPrototype.get(from),idByPrototype.get(to),type].join('|'));
  const expected=presentEdges.filter(e=>e.strength===type).map(edgeKey);
  if(new Set(keys).size!==keys.length||keys.length!==expected.length||keys.some(k=>!edgeMap.has(k)))throw Error('Prototype '+type+' edges differ from the source.');
  if(type==='hard'&&edges.some(([from,to])=>positions[idByPrototype.get(from)][1]>=positions[idByPrototype.get(to)][1]))throw Error('Prototype hard edge does not rise.');
}
const scaffold=prototype.scaffold.map(([from,to])=>[idByPrototype.get(from),idByPrototype.get(to)]);
const scaffoldKeys=new Set(scaffold.map(([from,to])=>[from,to,'hard'].join('|')));
if(scaffold.length!==508||scaffoldKeys.size!==508||[...scaffoldKeys].some(k=>!edgeMap.has(k)))throw Error('Prototype outline contains an invalid or duplicated source edge.');
const bridges=new Map();
for(const b of coverage.bridges){const k=edgeKey(b.sourceEdge);if(!edgeMap.has(k)||!BRIDGES[b.id])throw Error('Joint activity or source edge is missing: '+b.id);if(!bridges.has(k))bridges.set(k,[]);bridges.get(k).push({id:b.id,title:b.title,taskCount:b.taskCount});}
const nodes=atlas.nodes.map(n=>{
  const c=byTopic.get(n.id);if(!c||!c.goals||lessonForTopic(n.id)!==c.lessonId||!ROUTES.some(r=>r.ids.includes(c.lessonId))||JSON.stringify(c.goals.map(g=>g.sourceGoal))!==JSON.stringify(n.evidence))throw Error('Missing or mismatched goal, lesson or route for '+n.id);
  return {id:n.id,sourceTitle:n.title,sourceName:n.name,domainId:n.domainId,packId:n.packId,themeId:n.themeId,spatial:n.domainId!=='thinking',position:positions[n.id]||null,entries:['search','pack-list','direct-relations','learning-activity'],lessonId:c.lessonId,lessonUrl:c.url,routeIds:ROUTES.filter(r=>r.ids.includes(c.lessonId)).map(r=>r.id),source:c.source,research:c.research,researchReferences:c.researchReferences,taskCount:c.taskCount,goals:c.goals.map(g=>({index:g.index,sourceGoal:g.sourceGoal,tasks:g.tasks,implementedAction:g.implementedAction,explanation:g.explanation,claim:g.claim})),audit:'mapping-only; operation and mathematics review pending'};
});
const edges=atlas.edges.map(e=>{const explanation=relationExplanation(e),joint=bridges.get(edgeKey(e))||[],inMainMap=!!positions[e.prerequisiteId]&&!!positions[e.topicId];return {from:e.prerequisiteId,to:e.topicId,strength:e.strength,sourceReason:e.reason,localReason:explanation.reviewed?explanation.text:null,reasonSourceMatched:explanation.reviewed,inMainMap,inOutline:scaffoldKeys.has(edgeKey(e)),entries:['both-endpoint-direct-relations',...(e.strength==='hard'?['hard-trace']:[]),...(inMainMap?['map-line']:[]),...(joint.length?['joint-activity']:[])],jointActivities:joint,possibleEndpointLessons:[byTopic.get(e.prerequisiteId).lessonId,byTopic.get(e.topicId).lessonId],useReview:'pending',mathematicalReview:'pending'};});
const summary={nodes:nodes.length,goals:nodes.reduce((a,n)=>a+n.goals.length,0),mainMapNodes:Object.keys(positions).length,contextNodes:nodes.filter(n=>!n.spatial).length,edges:edges.length,mainHard:edges.filter(e=>e.inMainMap&&e.strength==='hard').length,mainSoft:edges.filter(e=>e.inMainMap&&e.strength==='soft').length,contextHard:edges.filter(e=>!e.inMainMap&&e.strength==='hard').length,contextSoft:edges.filter(e=>!e.inMainMap&&e.strength==='soft').length,withJointActivity:edges.filter(e=>e.jointActivities.length).length,withoutJointActivity:edges.filter(e=>!e.jointActivities.length).length};
if(JSON.stringify(Object.values(summary))!==JSON.stringify([587,1772,537,50,1223,808,272,43,100,776,447]))throw Error('Unexpected inventory totals: '+JSON.stringify(summary));
const inventory={schema:1,source:'dist/data/atlas.json',sourceSha256:hash(atlasBytes),prototype:'docs/spatial-learning/reference-original.html',prototypeSha256:hash(original),coverage:'docs/phase5/coverage.json',summary,nodes,edges};
const outputs=new Map([
 ['dist/spatial-relationship-data.js','// Generated by scripts/build_spatial_relationship_inventory.mjs; keyed by source ID.\nexport const RELATIONSHIP_POSITIONS='+JSON.stringify(positions)+';\nexport const RELATIONSHIP_SCAFFOLD='+JSON.stringify(scaffold)+';\n'],
 ['docs/spatial-learning/inventory.json',JSON.stringify(inventory,null,2)+'\n']
]);
for(const [name,content] of outputs){const full=path.join(root,name);if(process.argv.includes('--check')){if(!fs.existsSync(full)||fs.readFileSync(full,'utf8')!==content)throw Error(name+' is stale.');}else fs.writeFileSync(full,content);}
console.log(JSON.stringify(summary));
