// Guided actions point only to real source IDs and hard prerequisite edges.
// Observing a relation never means it has been learned or completed.
export const GUIDE_ID='structure-v1';
const ROOT='mt_WcfaSfVT33',COUNT='mt_dmNvjroCPT',PLUS='mt_OvyoRo47K-',MINUS='mt_zuKAX6lcYR',MERGE='mt_PgsHGYJMH-',DIVIDE='mt_LpSuPgL31x';
const sample=[
  {anchor:ROOT,overview:true,title:'先找到入口',hint:'看五大主题，我们先从「数与运算」出发。',pairs:[]},
  {anchor:ROOT,title:'走出第一段路',hint:'先点起点，再沿连接走到「一共有多少」。',pairs:[[ROOT,COUNT],[ROOT,'mt_M5PPDJStGm'],[ROOT,'mt_yqAL6O5i_v']]},
  {anchor:COUNT,title:'一条路分成两条',hint:'从共同基础出发，分别看看加法和减法。',pairs:[[COUNT,PLUS],[COUNT,MINUS]]},
  {anchor:MERGE,title:'两条路又汇合',hint:'点亮汇合的知识，看看它需要哪些基础。',pairs:[[PLUS,MERGE],[MINUS,MERGE]]},
  {anchor:MINUS,choice:true,title:'现在由你选路',hint:'选一个真实相邻的知识，开始自己探索。',pairs:[[MINUS,DIVIDE]]}
];
export const GUIDE_STEP_COUNT=sample.length;

export function buildStructureGuide(atlas){
  const nodes=new Set(atlas.nodes.map(n=>n.id)),domainNodes=new Set(atlas.nodes.filter(n=>n.domainId!=='thinking').map(n=>n.id));
  const edges=new Map(atlas.edges.filter(e=>e.strength==='hard').map(e=>[e.prerequisiteId+'>'+e.topicId,e]));
  return sample.map((step,i)=>{
    if(!nodes.has(step.anchor))throw Error('导览起点不在当前来源中。');
    // The final step offers real alternate branches, never invented shortcuts.
    const options=i===4?[...step.pairs,
      ...atlas.edges.filter(e=>e.strength==='hard'&&e.prerequisiteId===MINUS&&e.topicId!==DIVIDE&&e.topicId!==MERGE&&domainNodes.has(e.topicId))
        .sort((a,b)=>a.topicId.localeCompare(b.topicId)).slice(0,2).map(e=>[MINUS,e.topicId])]:step.pairs;
    const links=options.map(([from,to])=>{const edge=edges.get(from+'>'+to);if(!edge)throw Error('导览联系与当前来源不一致。');return edge;});
    return {...step,edges:links,nodes:step.overview?[]:[...new Set([step.anchor,...options.flat()])]};
  });
}

// Pure, source-keyed guidance state: guides do not write mastery or progress.
export function guideNextTargets(steps,index,visited=[],themeId=null){
  const step=steps[index];if(!step)return [];
  const seen=new Set(visited);
  if(index===0)return themeId?[{key:'theme:'+themeId,label:'从这里进入'}]:[];
  if(index===1){const root='node:'+steps[1].anchor;
    return seen.has(root)?seen.has('node:'+COUNT)?[]:[{key:'node:'+COUNT,label:'沿连接到这里'}]:[{key:root,label:'从这个起点开始'}];}
  if(index===2)return step.edges.map((e,i)=>({key:'node:'+e.topicId,label:i===0?'看看加法':'再看看减法'})).filter(t=>!seen.has(t.key));
  if(index===3)return seen.has('node:'+step.anchor)?[]:[{key:'node:'+step.anchor,label:'两条路线到这里'}];
  return step.edges.map((e,i)=>({key:'node:'+e.topicId,label:i===0?'沿这条路走':'也可以从这里走'}));
}
export function guideStepReady(steps,index,visited=[],themeId=null){
  return index<4&&guideNextTargets(steps,index,visited,themeId).length===0;
}

// Every suggestion comes from an outgoing source edge and an available local
// activity. Pending questions and unfinished activities affect ordering only.
export function linkedSuggestions(atlas,id,{hasActivity=()=>true,isComplete=()=>false,pendingNodes=[]}={}){
  if(!atlas.nodes.some(n=>n.id===id))return [];
  const pending=new Set(pendingNodes),nodes=new Set(atlas.nodes.map(n=>n.id));
  return atlas.edges.filter(e=>e.prerequisiteId===id&&nodes.has(e.topicId)&&hasActivity(e.topicId)).sort((a,b)=>
    Number(pending.has(b.topicId))-Number(pending.has(a.topicId))||Number(isComplete(a.topicId))-Number(isComplete(b.topicId))||Number(b.strength==='hard')-Number(a.strength==='hard')||a.topicId.localeCompare(b.topicId));
}
