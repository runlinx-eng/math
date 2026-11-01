// A short optional orientation in the existing source graph. These are source
// edges, not new prerequisites and not evidence of learning completion.
export const GUIDE_ID='structure-v1';
const ROOT='mt_WcfaSfVT33',COUNT='mt_dmNvjroCPT',PLUS='mt_OvyoRo47K-',MINUS='mt_zuKAX6lcYR',MERGE='mt_PgsHGYJMH-',DIVIDE='mt_LpSuPgL31x',HALF='mt_-hTTat0mBR';
const sample=[
  // Start from the real five-theme panorama, not an isolated cluster.
  {anchor:ROOT,overview:true,title:'先看整张数学地图',
   text:'不同颜色表示五大数学主题。小点是知识，位置与连线反映真实联系；数学不只有一条学习路线。',
   prompt:'先找一找五个主题的位置：整张图一直在这里，接下来只会让少量联系变亮。',
   pairs:[]},
  {anchor:ROOT,title:'找到一个真实起点',
   text:'“一一对应地数”是一个起点：把物品与数对应起来。它还能支持多个后续想法；数学中也有其他起点。',
   prompt:'观察这一个起点向外连接的不同知识。它不是整棵树唯一的根。',
   pairs:[[ROOT,COUNT],[ROOT,'mt_M5PPDJStGm'],[ROOT,'mt_yqAL6O5i_v']]},
  {anchor:COUNT,title:'观察一个基础怎样分叉',
   text:'“一共有多少”可以继续发展到合起来的加法，也可以发展到拿走与分开的减法。共同基础能支持不同方向。',
   prompt:'看两条从同一个点分出的真实连线：它们为什么不是同一道题？',
   pairs:[[COUNT,PLUS],[COUNT,MINUS]]},
  {anchor:MERGE,title:'观察不同基础怎样汇合',
   text:'合起来和拿走两种想法，都能帮助我们“表示加减法”。一个新知识也可能由多个基础共同支持。',
   prompt:'看两条汇入同一个知识的连线：它们各自提供了什么？',
   pairs:[[PLUS,MERGE],[MINUS,MERGE]]},
  {anchor:DIVIDE,title:'轮到你自己探索',
   text:'现在可以任选知识点，看它从哪里来、还会连接到哪里。图中再展示一段真实联系：从减法的意义走向平均分与除法，再连接到二分之一。',
   prompt:'试着点击一个知识点，自己追溯基础或查看后续。所有知识都仍在原来的地图中。',
   pairs:[[MINUS,DIVIDE],[DIVIDE,HALF]]}
];
export const GUIDE_STEP_COUNT=sample.length;

export function buildStructureGuide(atlas){
  const nodes=new Set(atlas.nodes.map(n=>n.id)),edges=new Map(atlas.edges.filter(e=>e.strength==='hard').map(e=>[e.prerequisiteId+'>'+e.topicId,e]));
  return sample.map(step=>{
    if(!nodes.has(step.anchor))throw Error('导览起点不在当前来源中。');
    const links=step.pairs.map(([from,to])=>{const edge=edges.get(from+'>'+to);if(!edge)throw Error('导览联系与当前来源不一致。');return edge;});
    return {...step,edges:links,nodes:[...new Set([step.anchor,...step.pairs.flat()])]};
  });
}

// Every suggestion comes from an outgoing source edge and an available local
// activity. Pending questions and unfinished activities affect ordering only.
export function linkedSuggestions(atlas,id,{hasActivity=()=>true,isComplete=()=>false,pendingNodes=[]}={}){
  if(!atlas.nodes.some(n=>n.id===id))return [];
  const pending=new Set(pendingNodes),nodes=new Set(atlas.nodes.map(n=>n.id));
  return atlas.edges.filter(e=>e.prerequisiteId===id&&nodes.has(e.topicId)&&hasActivity(e.topicId)).sort((a,b)=>
    Number(pending.has(b.topicId))-Number(pending.has(a.topicId))||Number(isComplete(a.topicId))-Number(isComplete(b.topicId))||Number(b.strength==='hard')-Number(a.strength==='hard')||a.topicId.localeCompare(b.topicId));
}
