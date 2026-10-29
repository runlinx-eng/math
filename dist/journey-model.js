// This is a local teaching route, not an order supplied by os-taxonomy.
export const ROUTE_ID='portions';
export const ROUTE_TITLE='分一份，换个名字';
export const ROUTE_STEPS=[
  {step:1,id:'mt_ndGqFPWyen',title:'先分得一样大',scope:'动手试一试'},
  {step:2,id:'mt_Ep7TDFuYUa',title:'分细了，会变多吗？',scope:'巧克力 → 果汁杯'},
  {step:3,id:'mt_DRlbMok2lT',title:'半杯，还能怎样记？',scope:'完整动手活动'},
];
export const routeStep=id=>ROUTE_STEPS.find(s=>s.id===id);
export const routeLinks=atlas=>[[0,1],[1,2]].map(([a,b])=>atlas.edges.find(e=>e.prerequisiteId===ROUTE_STEPS[a].id&&e.topicId===ROUTE_STEPS[b].id)).filter(Boolean);
export function freshJourney(){return {route:2,phase:'play',parts:2,taken:1,cut:30,cup:0,previewCup:false,visits:{},started:[],observations:[],attempts:[],notes:[],draft:'',fairFinishedAt:null,finishedAt:null,updatedAt:new Date().toISOString()};}
const event=values=>({id:globalThis.crypto.randomUUID(),at:new Date().toISOString(),...values});
export function actOnJourney(j,action,value){
  const at=new Date().toISOString();
  if(action==='visit'&&[1,2,3].includes(value)){j.route=value;j.visits[value]??=at;}
  else if(action==='split'&&j.parts<16){j.parts*=2;j.taken*=2;j.observations.push(event({parts:j.parts,taken:j.taken}));}
  else if(action==='less')j.taken=Math.max(0,j.taken-1);
  else if(action==='more')j.taken=Math.min(j.parts,j.taken+1);
  else if(action==='cut'&&Number.isInteger(value)&&value>=10&&value<=90)j.cut=value;
  else if(action==='finish-fair'&&j.route===1&&j.cut===50){j.fairFinishedAt??=at;if(!j.started.includes(1))j.started.push(1);}
  else if(action==='cup'&&Number.isInteger(value)&&value>=0&&value<=8)j.cup=value;
  else if(action==='transfer')j.phase='transfer';
  else if(action==='check')j.attempts.push(event({cup:j.cup,exposed:j.attempts.length>0||!!j.finishedAt}));
  else if(action==='summary'&&j.attempts.length){j.phase='summary';if(j.observations.length)j.finishedAt??=at;}
  else if(action==='back-play')j.phase='play';
  else if(action==='pour-half')j.previewCup=true;
  else if(action==='draft'&&typeof value==='string')j.draft=value.slice(0,2000);
  else if(action==='note'&&typeof value==='string'&&value.trim()){j.notes.push(event({text:value.trim().slice(0,2000)}));j.draft='';}
  if(['split','less','more','cut','cup','pour-half'].includes(action)&&!j.started.includes(j.route))j.started.push(j.route);
  j.updatedAt=at;return j;
}
export function validateJourney(j){
  const obj=x=>x&&typeof x==='object'&&!Array.isArray(x),int=(v,a,b)=>Number.isInteger(v)&&v>=a&&v<=b;
  const date=x=>typeof x==='string'&&/^\d{4}-\d\d-\d\dT/.test(x)&&Number.isFinite(Date.parse(x));
  const eventValid=x=>obj(x)&&typeof x.id==='string'&&x.id.length>0&&x.id.length<=100&&date(x.at);
  const events=(arr,check)=>Array.isArray(arr)&&arr.length<=2000&&new Set(arr.map(e=>e?.id)).size===arr.length&&arr.every(e=>eventValid(e)&&check(e));
  if(!obj(j)||![1,2,3].includes(j.route)||!['play','transfer','summary'].includes(j.phase)||![2,4,8,16].includes(j.parts)||!int(j.taken,0,j.parts)||!int(j.cut,10,90)||!int(j.cup,0,8)||typeof j.previewCup!=='boolean'||!date(j.updatedAt)||!obj(j.visits)||Object.entries(j.visits).some(([k,v])=>!['1','2','3'].includes(k)||!date(v))||!Array.isArray(j.started)||j.started.length>3||new Set(j.started).size!==j.started.length||j.started.some(s=>![1,2,3].includes(s))||!events(j.observations,e=>[4,8,16].includes(e.parts)&&int(e.taken,0,e.parts))||!events(j.attempts,e=>int(e.cup,0,8)&&typeof e.exposed==='boolean')||!events(j.notes,e=>typeof e.text==='string'&&e.text.length<=2000)||!(j.finishedAt===null||date(j.finishedAt))||(j.finishedAt&&(!j.attempts.length||!j.observations.length))||(j.phase==='summary'&&!j.attempts.length))throw new Error('路线记录无效，原有记录不会改变。');
  if(j.draft!==undefined&&(typeof j.draft!=='string'||j.draft.length>2000))throw new Error('路线草稿无效，原有记录不会改变。');
  if(j.fairFinishedAt!==undefined&&j.fairFinishedAt!==null&&(!date(j.fairFinishedAt)||!j.started.includes(1)))throw new Error('任务记录无效，原有记录不会改变。');
  return {route:j.route,phase:j.phase,parts:j.parts,taken:j.taken,cut:j.cut,cup:j.cup,previewCup:j.previewCup,updatedAt:j.updatedAt,visits:{...j.visits},started:[...j.started],observations:structuredClone(j.observations),attempts:j.attempts.map((e,i)=>({...e,exposed:e.exposed||i>0})),notes:structuredClone(j.notes),draft:j.draft||'',fairFinishedAt:j.fairFinishedAt||null,finishedAt:j.finishedAt};
}
// Merge immutable events while retaining the current working draft and first attempt.
export function mergeJourney(current,incoming){
  if(!current)return structuredClone(incoming);
  const out=structuredClone(current),events=(a,b)=>{const map=new Map(a.map(e=>[e.id,e]));for(const e of b)if(!map.has(e.id))map.set(e.id,e);return [...map.values()].sort((x,y)=>x.at.localeCompare(y.at));};
  for(const key of ['observations','attempts','notes'])out[key]=events(current[key],incoming[key]);
  out.attempts=out.attempts.map((e,i)=>({...e,exposed:e.exposed||i>0}));
  out.visits={...incoming.visits,...current.visits};out.started=[...new Set([...current.started,...incoming.started])];
  out.finishedAt=[current.finishedAt,incoming.finishedAt].filter(Boolean).sort()[0]||null;
  out.fairFinishedAt=[current.fairFinishedAt,incoming.fairFinishedAt].filter(Boolean).sort()[0]||null;
  return out;
}
