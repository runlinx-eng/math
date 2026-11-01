// A short optional orientation in the existing source graph. These are source
// edges, not new prerequisites and not evidence of learning completion.
export const GUIDE_ID='structure-v1';
const ROOT='mt_WcfaSfVT33',COUNT='mt_dmNvjroCPT',PLUS='mt_OvyoRo47K-',MINUS='mt_zuKAX6lcYR',MERGE='mt_PgsHGYJMH-',DIVIDE='mt_LpSuPgL31x',HALF='mt_-hTTat0mBR';
const sample=[
  {anchor:ROOT,title:'先从一个起点出发',text:'从“一一对应地数”出发：给每个物品对应一个数。这是一个起点，数学中还有其他起点。',prompt:'看一看：这一个想法连向了哪些不同的后续？',pairs:[[ROOT,COUNT],[ROOT,'mt_M5PPDJStGm'],[ROOT,'mt_yqAL6O5i_v']]},
  {anchor:COUNT,title:'一个基础可以继续生长',text:'“一一对应地数”连接到“一共有多少”。一个基础可以支持后面的多个想法。',prompt:'想一想：数每个物品，和知道一共有多少，有什么联系？',pairs:[[ROOT,COUNT]]},
  {anchor:COUNT,title:'从这里分出不同路线',text:'“一共有多少”分别连向合起来和拿走的想法。两条路线从共同基础出发。',prompt:'看一看：加进去和拿走，分别会让数量怎样变化？',pairs:[[COUNT,PLUS],[COUNT,MINUS]]},
  {anchor:MERGE,title:'不同路线也能汇合',text:'合起来和拿走的想法，都连接到“表示加减法”。汇合处可以有不止一个基础。',prompt:'想一想：同一组物品，能怎样用加法和减法表示？',pairs:[[PLUS,MERGE],[MINUS,MERGE]]},
  {anchor:DIVIDE,title:'沿另一条联系继续探索',text:'回到拿走与分开的路线，可以继续看平均分与除法，再看到二分之一。',prompt:'观察这些连接；你也可以从任何其他想法自由出发。',pairs:[[MINUS,DIVIDE],[DIVIDE,HALF]]}
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
