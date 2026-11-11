import {completionApplies} from './phase5/b19-model.js';
import {LESSONS} from './catalog.js';
import {defaultModel,validModel,inspect} from './tasks.js';
import {BRIDGES,sessionTasks,sessionTaskFor as taskFor} from './bridges.js';
const stamp=()=>new Date().toISOString();
const event=v=>({id:globalThis.crypto.randomUUID(),at:stamp(),...v});
export function freshLesson(id){if(!LESSONS[id]&&!BRIDGES[id])throw new Error('未知学习活动');return {id,view:'task',index:0,models:{},cases:{},notes:[],draft:'',updatedAt:stamp(),ui:{spread:0,view:null,camera:null}};}
export function modelForLesson(a,index=a.view==='play'?-1:a.index){return a.models[index]??=defaultModel(taskFor(a.id,index));}
// Previous releases stored a separate ungraded 'play' view and models[-1].
 // There is now only one visible learning workspace. Keep the original practice
 // model for old backups and reuse it as an unsubmitted task draft only when
 // its structure is valid for the selected configured task.
export function enterUnifiedTask(a){
 if(a.view!=='play')return a;
 const pending=lessonSummary(a).cases.findIndex(c=>!c.complete);
 const index=pending<0?0:pending,former=a.models[-1],target=taskFor(a.id,index);
 if(!a.models[index]&&former&&validModel(target,former))a.models[index]=structuredClone(former);
 a.index=index;
 a.view='task';
 modelForLesson(a);
 return a;
}
// A historical successful attempt remains in the record, but its result is
// not automatically the result of a subsequently modified current workpiece.
export function currentSubmission(a){
 if(a.view!=='task')return {status:'unsubmitted'};
 const last=a.cases[a.index]?.attempts?.at(-1);
 if(!last)return {status:'unsubmitted'};
 const current=modelForLesson(a);
 if(JSON.stringify(current)!==JSON.stringify(last.value))return {status:'modified'};
 const result=inspect(taskFor(a.id,a.index),last.value);
 return {status:result.correct?'correct':'revise',result};
}
export function supportLesson(a){if(a.view!=='task')return;const r=a.cases[a.index]??={support:false,attempts:[]};r.support=true;a.updatedAt=stamp();}
export function submitLesson(a){if(a.view!=='task')throw new Error('请先进入实际任务');const t=taskFor(a.id,a.index),m=modelForLesson(a),r=a.cases[a.index]??={support:false,attempts:[]};if(!validModel(t,m))throw new Error('作品格式无效');const result=inspect(t,m);r.attempts.push(event({value:structuredClone(m),supported:r.support,exposed:r.attempts.length>0}));a.updatedAt=stamp();return result;}
export function lessonSummary(a){if(!a)return {completed:false,independent:false,done:0,total:0};const cases=sessionTasks(a.id).map((t,i)=>{const r=a.cases[i],attempts=r?.attempts||[],last=attempts.at(-1),first=attempts[0],complete=attempts.some(e=>inspect(t,e.value).correct&&completionApplies(t,a.models[i],e.value));return {complete,independent:complete&&!!first&&inspect(t,first.value).correct&&!first.supported&&!first.exposed&&!r.support&&inspect(t,last.value).correct&&(!/^x-(?:r3[78]|s39)-/.test(t.type)||inspect(t,a.models[i]).correct),attempts:attempts.length};});return {completed:cases.every(c=>c.complete),independent:cases.every(c=>c.independent),done:cases.filter(c=>c.complete).length,total:cases.length,cases,explanation:a.notes.length?'pending':'missing'};}
export function addLessonNote(a,text){if(text.trim()){a.notes.push(event({text:text.trim().slice(0,2000)}));a.draft='';a.updatedAt=stamp();}}
export function validateLesson(raw,id,{allowBridge=false}={}){const fail=()=>{throw new Error('新活动记录无效，原记录不会被覆盖。');};
 const obj=o=>o&&typeof o==='object'&&!Array.isArray(o),date=d=>typeof d==='string'&&/^\d{4}-\d\d-\d\dT/.test(d)&&Number.isFinite(Date.parse(d));
 const eventOk=e=>obj(e)&&typeof e.id==='string'&&e.id.length>0&&e.id.length<=100&&date(e.at);
 if((!LESSONS[id]&&!(allowBridge&&BRIDGES[id]))||!obj(raw)||raw.id!==id||!['play','task','summary'].includes(raw.view)||!Number.isInteger(raw.index)||raw.index<0||raw.index>=sessionTasks(id).length||!obj(raw.models)||!obj(raw.cases)||!Array.isArray(raw.notes)||raw.notes.length>1000||typeof raw.draft!=='string'||raw.draft.length>2000||!date(raw.updatedAt))fail();
 const out=freshLesson(id);if(raw.ui!==undefined){const u=raw.ui,v=x=>Array.isArray(x)&&x.length===3&&x.every(n=>Number.isFinite(n)&&Math.abs(n)<1000);if(!obj(u)||![0,1].includes(u.spread)||![null,'tally','picture','bar','block','table','list'].includes(u.view)||u.camera!==null&&(!obj(u.camera)||!v(u.camera.position)||!v(u.camera.target)))fail();out.ui=structuredClone(u);}Object.assign(out,{view:raw.view,index:raw.index,draft:raw.draft,updatedAt:raw.updatedAt});
 for(const [key,m] of Object.entries(raw.models)){if(!/^(?:-1|\d+)$/.test(key)||!taskFor(id,+key)||!validModel(taskFor(id,+key),m))fail();out.models[key]=structuredClone(m);}
 for(const [key,r] of Object.entries(raw.cases)){if(!/^\d+$/.test(key)||!sessionTasks(id)[+key]||!obj(r)||typeof r.support!=='boolean'||!Array.isArray(r.attempts)||r.attempts.length>1000||new Set(r.attempts.map(e=>e?.id)).size!==r.attempts.length)fail();out.cases[key]={support:r.support,attempts:r.attempts.map((e,i)=>{if(!eventOk(e)||!validModel(sessionTasks(id)[+key],e.value)||typeof e.supported!=='boolean'||typeof e.exposed!=='boolean')fail();return {id:e.id,at:e.at,value:structuredClone(e.value),supported:e.supported,exposed:e.exposed||i>0};})};}
 if(new Set(raw.notes.map(e=>e?.id)).size!==raw.notes.length)fail();out.notes=raw.notes.map(e=>{if(!eventOk(e)||typeof e.text!=='string'||e.text.length>2000)fail();return {id:e.id,at:e.at,text:e.text};});
 if(out.view==='summary'&&!lessonSummary(out).completed)out.view='task';
 return out;
}
// P10: two open learning surfaces may hold different versions of one workpiece.
// Check the persisted copy BEFORE merging it into the in-memory copy. Merging
// attempts is safe; silently replacing another tab's draft or workpiece is not.
export function assertNoConcurrentLessonOverwrite(local,persisted){
 const conflict=detail=>{throw new Error('此学习任务已在另一个页面发生变化（'+detail+'）。已停止保存，原记录未覆盖。请保留当前页面并另存备份，然后刷新以查看最新作品。');};
 if(!persisted){
  if(Object.keys(local.models||{}).length||Object.keys(local.cases||{}).length||local.notes?.length||local.draft)
   conflict('已保存的现场已被移走');
  return;
 }
 if(persisted.id!==local.id)conflict('任务 ID');
 if(persisted.view!==local.view||persisted.index!==local.index)conflict('当前任务位置');
 for(const [key,model] of Object.entries(local.models||{}))
  if(Object.hasOwn(persisted.models||{},key)&&JSON.stringify(model)!==JSON.stringify(persisted.models[key]))
   conflict('任务 '+key+' 的作品');
 if(local.draft&&persisted.draft&&local.draft!==persisted.draft)conflict('自由解释草稿');
 for(const [key,entry] of Object.entries(local.cases||{})){
  const other=persisted.cases?.[key];if(!other)continue;
  const byId=new Map((other.attempts||[]).map(item=>[item.id,item]));
  for(const attempt of entry.attempts||[]){
   const saved=byId.get(attempt.id);
   if(saved&&JSON.stringify(saved)!==JSON.stringify(attempt))conflict('任务 '+key+' 的历史提交');
  }
 }
 const notes=new Map((persisted.notes||[]).map(item=>[item.id,item]));
 for(const note of local.notes||[]){
  const saved=notes.get(note.id);
  if(saved&&JSON.stringify(saved)!==JSON.stringify(note))conflict('文字记录');
 }
}
const mergeEvents=(a,b)=>{const map=new Map(a.map(e=>[e.id,e]));for(const e of b)if(!map.has(e.id))map.set(e.id,e);return [...map.values()].sort((a,b)=>a.at.localeCompare(b.at));};
export function mergeLesson(a,b){if(!a)return structuredClone(b);const out=structuredClone(a);if(!out.draft&&b.draft){out.draft=b.draft;out.updatedAt=b.updatedAt>out.updatedAt?b.updatedAt:out.updatedAt;}for(const[k,r]of Object.entries(b.cases)){if(!out.cases[k])out.cases[k]=structuredClone(r);else{out.cases[k].support ||= r.support;out.cases[k].attempts=mergeEvents(out.cases[k].attempts,r.attempts).map((e,i)=>({...e,exposed:e.exposed||i>0}));}}out.notes=mergeEvents(a.notes,b.notes);for(const[k,m]of Object.entries(b.models))out.models[k]??=structuredClone(m);return out;}
