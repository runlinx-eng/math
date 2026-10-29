import {MAX_BACKUP_BYTES} from './storage.js';
import {ACTIVITIES,activityIds,KINDS,STAGES,task,defaultModel,inspect,modelIsValid} from './exploration-content.js';
import {validateState as validateLegacy,KEY as OLD_KEY} from './core.js';
import {ROUTE_ID,routeStep,validateJourney,mergeJourney} from './journey-model.js';
import {LESSONS,lessonIds,lessonForTopic,topicIds} from './learning/catalog.js';
import {validateLesson,mergeLesson,lessonSummary} from './learning/state.js';
import {freshDaily,validateDaily,mergeDaily} from './learning/daily.js';
export {OLD_KEY};
export const KEY='math-explorer-v2';
export const now=()=>new Date().toISOString();
export const uid=()=>globalThis.crypto.randomUUID();
export const fresh=()=>({schema:2,daily:freshDaily(),visited:{},openedPacks:{},bookmarks:[],activities:{},lessons:{},lessonContinuation:null,journeys:{},journeyContinuation:null,continuation:null,legacy:null});
export function createActivity(id){
 if(!activityIds.includes(id))throw new Error('未知活动');
  return {id,stage:'play',variant:0,openedAt:now(),draft:'',lab:{cuts:[15,55,85],selected:[],n:2,d:3,changed:false,comparison:false},models:{},evidence:{},observations:[],notes:[]};
}
export function ensureActivity(state,id){if(!state.activities[id])state.activities[id]=createActivity(id);state.continuation=id;state.journeyContinuation=null;return state.activities[id];}
export const caseKey=(kind,variant)=>`${kind}:${variant}`;
export function modelFor(a,kind=a.stage){const key=caseKey(kind,a.variant);if(!a.models[key])a.models[key]=defaultModel(task(a.id,kind,a.variant));return a.models[key];}
function rowFor(a,kind=a.stage){const key=caseKey(kind,a.variant);if(!a.evidence[key])a.evidence[key]={support:false,attempts:[]};return a.evidence[key];}
export function addSupport(a){rowFor(a).support=true;}
export function submit(a){const t=task(a.id,a.stage,a.variant),value=structuredClone(modelFor(a)),row=rowFor(a),result=inspect(t,value);const record={id:uid(),at:now(),value,supported:row.support,exposed:row.attempts.length>0};row.attempts.push(record);return result;}
export function saveObservation(a){if(!a.lab.changed)return false;a.observations.push({id:uid(),at:now(),value:structuredClone(a.lab)});return true;}
export function saveNote(a,text){const clean=text.trim();if(!clean)return false;a.notes.push({id:uid(),at:now(),text:clean.slice(0,2000)});return true;}
export function evidenceSummary(a){
 const kinds=KINDS.map(kind=>{
  const records=[0,1].map(v=>({v,row:a?.evidence?.[caseKey(kind,v)]})).filter(x=>x.row?.attempts.length).sort((x,y)=>y.row.attempts.at(-1).at.localeCompare(x.row.attempts.at(-1).at));
  const chosen=records[0];if(!chosen)return {kind,status:'none'};
  const first=chosen.row.attempts[0],last=chosen.row.attempts.at(-1),t=task(a.id,kind,chosen.v);
  const independent=inspect(t,first.value).correct&&!first.supported&&!first.exposed&&!chosen.row.support;
  return {kind,status:independent&&inspect(t,last.value).correct?'independent':'supported',at:last.at,firstCorrect:inspect(t,first.value).correct,attempts:chosen.row.attempts.length};
 });
 const completed=kinds.every(k=>k.status!=='none');
 const demonstrated=kinds.every(k=>k.status==='independent');
 const last=kinds.map(k=>k.at).filter(Boolean).sort().at(-1);
 return {kinds,completed,demonstrated,needsSupport:kinds.some(k=>k.status==='supported'),explanation:a?.notes.length?'pending':'missing',reviewAt:last?new Date(Date.parse(last)+(demonstrated?7:1)*86400000).toISOString():null};
}
export function nodeState(state,id){
 const modernId=lessonForTopic(id),modern=state.lessons?.[modernId],ms=modern&&lessonSummary(modern);
 if(ms?.completed)return {progress:'completed',evidence:ms.independent?'demonstrated':'supported',explanation:ms.explanation};
 const key=activityIds.find(k=>ACTIVITIES[k].topicId===id),a=key&&state.activities[key];
 const step=routeStep(id),j=state.journeys?.[ROUTE_ID],finished=step?.step===2&&!!j?.finishedAt||step?.step===1&&!!j?.fairFinishedAt;
 if(a){const e=evidenceSummary(a);return {progress:e.completed||finished?'completed':'exploring',evidence:e.demonstrated?'demonstrated':e.needsSupport?'supported':'none',explanation:e.explanation};}
 if(step&&j?.started.includes(step.step))return {progress:finished?'completed':'exploring',evidence:'none',explanation:j.notes.length?'pending':'missing'};
 return {progress:modern?'exploring':state.visited[id]?'visited':'unseen',evidence:'none',explanation:ms?.explanation||'missing'};
}
// The learner sees two states. Browsing and evidence remain in the saved record.
export const PROGRESS={unseen:'未完成',visited:'未完成',exploring:'未完成',completed:'完成'};
export const completionClass=state=>state.progress==='completed'?'completed':'incomplete';
export function completionSummary(state,ids=topicIds){
 const available=[...new Set(ids)].filter(id=>topicIds.includes(id));
 return {done:available.filter(id=>nodeState(state,id).progress==='completed').length,total:available.length};
}
export function migrateLegacy(raw,ids){const state=fresh();state.legacy=validateLegacy(raw,ids);state.visited={...state.legacy.visited};state.bookmarks=[...state.legacy.bookmarks];return state;}
export function validate(raw,atlas){
 const fail=()=>{throw new Error('记录格式或内容无效，原有记录不会改变。');};
 const obj=x=>x&&typeof x==='object'&&!Array.isArray(x),date=x=>typeof x==='string'&&/^\d{4}-\d\d-\d\dT/.test(x)&&Number.isFinite(Date.parse(x));
 const ids=new Set(atlas.nodes.map(n=>n.id)),packs=new Set(atlas.packs.map(p=>p.id));
 if(!obj(raw)||raw.schema!==2||!obj(raw.visited)||!obj(raw.openedPacks)||!Array.isArray(raw.bookmarks)||!obj(raw.activities)||raw.bookmarks.some(id=>!ids.has(id)))fail();
 const out=fresh();out.daily=validateDaily(raw.daily,atlas);
 if(raw.lessons!==undefined){if(!obj(raw.lessons))fail();for(const[id,a]of Object.entries(raw.lessons))out.lessons[id]=validateLesson(a,id);}
 if(raw.lessonContinuation!==undefined&&raw.lessonContinuation!==null&&!lessonIds.includes(raw.lessonContinuation))fail();out.lessonContinuation=raw.lessonContinuation||null;
 for(const [id,at] of Object.entries(raw.visited)){if(!ids.has(id)||!date(at))fail();out.visited[id]=at;}
 for(const [id,at] of Object.entries(raw.openedPacks)){if(!packs.has(id)||!date(at))fail();out.openedPacks[id]=at;}
 out.bookmarks=[...new Set(raw.bookmarks)];
 if(raw.continuation!==null&&!activityIds.includes(raw.continuation))fail();out.continuation=raw.continuation;
 if(raw.journeys!==undefined){if(!obj(raw.journeys)||Object.keys(raw.journeys).some(k=>k!==ROUTE_ID))fail();if(raw.journeys[ROUTE_ID])out.journeys[ROUTE_ID]=validateJourney(raw.journeys[ROUTE_ID]);}
 if(raw.journeyContinuation!==undefined&&raw.journeyContinuation!==null&&raw.journeyContinuation!==ROUTE_ID)fail();out.journeyContinuation=raw.journeyContinuation||null;
 const validLab=l=>obj(l)&&modelIsValid({type:'partition',d:4},{cuts:l.cuts,selected:[]})&&Array.isArray(l.selected)&&l.selected.length<=100&&new Set(l.selected).size===l.selected.length&&l.selected.every(n=>Number.isInteger(n)&&n>=0&&n<100)&&Number.isInteger(l.d)&&l.d>=2&&l.d<=12&&Number.isInteger(l.n)&&l.n>=0&&l.n<=l.d&&typeof l.changed==='boolean'&&typeof l.comparison==='boolean';
 const cleanLab=l=>({cuts:[...l.cuts],selected:[...l.selected],n:l.n,d:l.d,changed:l.changed,comparison:l.comparison});
 const eventCheck=e=>obj(e)&&typeof e.id==='string'&&e.id.length>0&&e.id.length<=100&&date(e.at);
 for(const [id,a] of Object.entries(raw.activities)){
  if(!activityIds.includes(id)||!obj(a)||a.id!==id||!Object.hasOwn(STAGES,a.stage)||![0,1].includes(a.variant)||!date(a.openedAt)||!validLab(a.lab)||!obj(a.models)||!obj(a.evidence)||!Array.isArray(a.observations)||!Array.isArray(a.notes)||a.observations.length>1000||a.notes.length>1000)fail();
  if(a.draft!==undefined&&(typeof a.draft!=='string'||a.draft.length>2000))fail();
  const b=createActivity(id);b.openedAt=a.openedAt;b.stage=a.stage;b.variant=a.variant;b.draft=a.draft||'';b.lab=cleanLab(a.lab);
  const parseKey=key=>{if(!/^(construct|transfer):[01]$/.test(key))fail();const[k,v]=key.split(':');return task(id,k,Number(v));};
  for(const [key,m]of Object.entries(a.models)){if(!modelIsValid(parseKey(key),m))fail();b.models[key]=structuredClone(m);}
  for(const [key,r]of Object.entries(a.evidence)){
   const t=parseKey(key);if(!obj(r)||typeof r.support!=='boolean'||!Array.isArray(r.attempts)||r.attempts.length>1000)fail();
   const seen=new Set();b.evidence[key]={support:r.support,attempts:r.attempts.map((e,i)=>{if(!eventCheck(e)||seen.has(e.id)||!modelIsValid(t,e.value)||typeof e.supported!=='boolean'||typeof e.exposed!=='boolean')fail();seen.add(e.id);return {id:e.id,at:e.at,value:structuredClone(e.value),supported:e.supported,exposed:e.exposed||i>0};})};
  }
  b.observations=a.observations.map(e=>{if(!eventCheck(e)||!validLab(e.value))fail();return {id:e.id,at:e.at,value:cleanLab(e.value)};});
  b.notes=a.notes.map(e=>{if(!eventCheck(e)||typeof e.text!=='string'||e.text.length>2000)fail();return {id:e.id,at:e.at,text:e.text};});
  out.activities[id]=b;
 }
 if(raw.legacy!==null)out.legacy=validateLegacy(raw.legacy,ids);
 return out;
}
export const backup=state=>({app:'math-explorer',version:2,exportedAt:now(),state});
export function parseBackup(text,atlas){if(text.length>MAX_BACKUP_BYTES)throw new Error('备份超过 50 MB。');let b;try{b=JSON.parse(text);}catch{throw new Error('不是有效的 JSON 备份，原有记录没有改变。');}if(b?.app!=='math-explorer')throw new Error('这不是数学探索的备份。');if(b.version===1)return migrateLegacy(b.state,atlas.nodes.map(n=>n.id));if(b.version!==2)throw new Error('备份版本暂不支持。');return validate(b.state,atlas);}
function mergeEvents(a,b){const map=new Map(a.map(x=>[x.id,x]));for(const x of b)if(!map.has(x.id))map.set(x.id,x);return [...map.values()].sort((a,b)=>a.at.localeCompare(b.at));}
export function merge(current,incoming){
 const out=structuredClone(current);out.daily=mergeDaily(current.daily,incoming.daily);Object.assign(out.visited,incoming.visited);Object.assign(out.openedPacks,incoming.openedPacks);out.bookmarks=[...new Set([...out.bookmarks,...incoming.bookmarks])];
 out.lessons??={};for(const[id,a]of Object.entries(incoming.lessons||{}))out.lessons[id]=mergeLesson(out.lessons[id],a);
 out.lessonContinuation=current.lessonContinuation||incoming.lessonContinuation||null;
 out.journeys??={};for(const [id,j]of Object.entries(incoming.journeys||{}))out.journeys[id]=mergeJourney(out.journeys[id],j);
 out.journeyContinuation=current.journeyContinuation||incoming.journeyContinuation||null;
 for(const[id,a]of Object.entries(incoming.activities)){
  if(!out.activities[id]){out.activities[id]=structuredClone(a);continue;}
  const b=out.activities[id];
  for(const[key,r]of Object.entries(a.evidence)){if(!b.evidence[key])b.evidence[key]=structuredClone(r);else{const own=b.evidence[key];own.support=own.support||r.support;own.attempts=mergeEvents(own.attempts,r.attempts).map((e,i)=>({...e,exposed:e.exposed||i>0}));}}
  b.observations=mergeEvents(b.observations,a.observations);b.notes=mergeEvents(b.notes,a.notes);
  for(const[key,value]of Object.entries(a.models))if(!b.models[key])b.models[key]=structuredClone(value);
 }
 out.continuation=out.continuation||incoming.continuation;
 if(!out.legacy)out.legacy=incoming.legacy;
 else if(incoming.legacy){out.legacy.history=mergeEvents(out.legacy.history,incoming.legacy.history);out.legacy.visited={...incoming.legacy.visited,...out.legacy.visited};out.legacy.bookmarks=[...new Set([...out.legacy.bookmarks,...incoming.legacy.bookmarks])];for(const[k,v]of Object.entries(incoming.legacy.paused||{}))if(!out.legacy.paused[k])out.legacy.paused[k]=v;if(!out.legacy.active)out.legacy.active=incoming.legacy.active;else if(incoming.legacy.active&&incoming.legacy.active.lesson!==out.legacy.active.lesson&&!out.legacy.paused[incoming.legacy.active.lesson])out.legacy.paused[incoming.legacy.active.lesson]=incoming.legacy.active;}
 return out;
}
