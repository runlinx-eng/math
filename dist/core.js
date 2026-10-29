import { LESSONS, questions, grade } from './lessons.js';
export const KEY = 'math-explorer-v1';
export const VERSION = 1;
export const freshState = () => ({schema:VERSION,visited:{},bookmarks:[],history:[],active:null,paused:{}});
export const timestamp = () => new Date().toISOString();
const uuid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function createSession(lesson, variant=0) {
  if (!Object.hasOwn(LESSONS,lesson)) throw new Error('未知课程');
  return {id:uuid(),lesson,variant,stage:'placement',index:0,answers:{placement:[],practice:[],check:[]},startedAt:timestamp(),experiment:{d:4,n:3,k:2,cells:30}};
}
export function recordAnswer(session, answer) {
  const q = questions(session.lesson,session.stage,session.variant)[session.index];
  const list = session.answers[session.stage];
  let row = list.find(r=>r.questionId===q.id);
  if (!row) { row={questionId:q.id,hintUsed:false,attempts:[]}; list.push(row); }
  row.attempts.push({answer,correct:grade(q,answer),at:timestamp()});
  return row;
}
export function hint(session) {
  const q = questions(session.lesson,session.stage,session.variant)[session.index];
  let row = session.answers[session.stage].find(r=>r.questionId===q.id);
  if (!row) { row={questionId:q.id,hintUsed:true,attempts:[]}; session.answers[session.stage].push(row); }
  row.hintUsed=true;
}
export function allIndependent(session, phase='check') {
  const qs = questions(session.lesson,phase,session.variant);
  return qs.every(q=>session.answers[phase].some(r=>r.questionId===q.id&&!r.hintUsed&&r.attempts.length>0&&grade(q,r.attempts[0].answer)));
}
export function finishSession(state, session) {
  const status=allIndependent(session)?'independent':'review';
  const at=timestamp();
  const reviewAt=new Date(Date.parse(at)+(status==='independent'?7:1)*86400000).toISOString();
  const record={id:session.id,lesson:session.lesson,variant:session.variant,at,reviewAt,status,answers:structuredClone(session.answers)};
  if (!state.history.some(x=>x.id===record.id)) state.history.push(record);
  session.stage='result'; session.index=0;
  return record;
}
export function latest(state, topicId) {
  return state.history.filter(h=>LESSONS[h.lesson].topicId===topicId).sort((a,b)=>b.at.localeCompare(a.at))[0];
}
export function topicStatus(state,id,now=Date.now()) {
  const h=latest(state,id);
  if(h) return h.status==='review'||Date.parse(h.reviewAt)<=now?'review':'independent';
  if([state.active,...Object.values(state.paused||{})].some(s=>s&&LESSONS[s.lesson].topicId===id&&s.stage!=='result')) return 'working';
  return state.visited[id]?'visited':'new';
}
export const STATUS = {new:'未探索',visited:'看过地图',working:'探索中',review:'值得再试试',independent:'本次独立做出'};

// Validate an entire import before touching the live state; never trust stored scores.
export function validateState(raw, validIds) {
  const ids=new Set(validIds), fail=()=>{throw new Error('备份格式或内容不正确，原有记录没有改变。');};
  const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
  const date=x=>typeof x==='string'&&/^\d{4}-\d\d-\d\dT/.test(x)&&Number.isFinite(Date.parse(x));
  if(!object(raw)||raw.schema!==VERSION||!object(raw.visited)||!Array.isArray(raw.bookmarks)||!Array.isArray(raw.history)||raw.history.length>10000) fail();
  const result=freshState();
  for(const [id,at] of Object.entries(raw.visited)) {if(!ids.has(id)||!date(at))fail();result.visited[id]=at;}
  if(raw.bookmarks.some(id=>!ids.has(id)))fail(); result.bookmarks=[...new Set(raw.bookmarks)];
  function answers(value,lesson,variant) {
    if(!object(value)) fail();
    const out={};
    for(const phase of ['placement','practice','check']) {
      const qs=questions(lesson,phase,variant);
      if(!Array.isArray(value[phase])||value[phase].length>qs.length)fail();
      const seen=new Set();
      out[phase]=value[phase].map(row=>{
        const q=qs.find(q=>q.id===row?.questionId);
        if(!q||seen.has(q.id)||typeof row.hintUsed!=='boolean'||!Array.isArray(row.attempts)||row.attempts.length>100) fail();
        seen.add(q.id);
        return {questionId:q.id,hintUsed:row.hintUsed,attempts:row.attempts.map(a=>{
          if(!object(a)||!date(a.at))fail();
          const answer=a.answer;
          if(q.type==='choice'&&(!Number.isInteger(answer)||answer<0||answer>=q.options.length))fail();
          if(q.type==='input'&&(typeof answer!=='string'||answer.length>100))fail();
          if(q.type==='shade'&&(!Array.isArray(answer)||answer.length>q.d||new Set(answer).size!==answer.length||answer.some(n=>!Number.isInteger(n)||n<0||n>=q.d)))fail();
          return {answer,correct:grade(q,answer),at:a.at};
        })};
      });
    }
    return out;
  }
  const checkLesson=x=>{if(!object(x)||!Object.hasOwn(LESSONS,x.lesson)||!Number.isInteger(x.variant)||x.variant<0||x.variant>100000||typeof x.id!=='string'||x.id.length>100)fail();};
  const seen=new Set();
  for(const h of raw.history) {
    checkLesson(h);if(!date(h.at)||!date(h.reviewAt)||seen.has(h.id))fail();seen.add(h.id);
    const a=answers(h.answers,h.lesson,h.variant);
    const s={lesson:h.lesson,variant:h.variant,answers:a};
    if(!questions(h.lesson,'check',h.variant).every(q=>a.check.some(r=>r.questionId===q.id&&r.attempts.length)))fail();
    const status=allIndependent(s)?'independent':'review';
    result.history.push({id:h.id,lesson:h.lesson,variant:h.variant,at:h.at,reviewAt:new Date(Date.parse(h.at)+(status==='independent'?7:1)*86400000).toISOString(),status,answers:a});
  }
  if(raw.active!==null) {
    const s=raw.active; checkLesson(s);
    if(!['placement','placement-summary','explore','practice','check','result'].includes(s.stage)||!Number.isInteger(s.index)||s.index<0||!date(s.startedAt)||!object(s.experiment))fail();
    if(['placement','practice','check'].includes(s.stage)&&s.index>=questions(s.lesson,s.stage,s.variant).length)fail();
    const e=s.experiment;
    if(!Number.isInteger(e.d)||e.d<2||e.d>10||!Number.isInteger(e.n)||e.n<0||e.n>e.d||!Number.isInteger(e.k)||e.k<1||e.k>4||!Number.isInteger(e.cells)||e.cells<0||e.cells>100)fail();
    result.active={id:s.id,lesson:s.lesson,variant:s.variant,stage:s.stage,index:s.index,startedAt:s.startedAt,answers:answers(s.answers,s.lesson,s.variant),experiment:{d:e.d,n:e.n,k:e.k,cells:e.cells}};
    if(s.stage==='result'&&!result.history.some(h=>h.id===s.id))fail();
  }
  if(raw.paused!==undefined) {
    if(!object(raw.paused)||Object.keys(raw.paused).some(k=>!Object.hasOwn(LESSONS,k)))fail();
    for(const [key,s] of Object.entries(raw.paused)) {
      if(s?.lesson!==key)fail();
      result.paused[key]=validateState({...freshState(),history:raw.history,active:s},validIds).active;
    }
  }
  return result;
}
export function makeBackup(state) {return {app:'math-explorer',version:VERSION,exportedAt:timestamp(),state};}
export function parseBackup(text,ids) {
  if(text.length>8_000_000)throw new Error('备份文件过大，尚未导入。');
  let data;try{data=JSON.parse(text);}catch{throw new Error('不是有效的 JSON 备份，原有记录没有改变。');}
  if(data?.app!=='math-explorer'||data.version!==VERSION)throw new Error('这不是此版本数学探索的备份。');
  return validateState(data.state,ids);
}
export function mergeBackup(current,incoming) {
  const histories=new Map(current.history.map(h=>[h.id,h]));
  for(const h of incoming.history) if(!histories.has(h.id))histories.set(h.id,h);
  const active=current.active?.stage!=='result'&&current.active?current.active:incoming.active||current.active;
  const paused={...incoming.paused,...current.paused};
  if(incoming.active&&incoming.active.lesson!==active?.lesson&&!paused[incoming.active.lesson])paused[incoming.active.lesson]=incoming.active;
  return {schema:VERSION,visited:{...incoming.visited,...current.visited},bookmarks:[...new Set([...current.bookmarks,...incoming.bookmarks])],history:[...histories.values()].sort((a,b)=>a.at.localeCompare(b.at)),active,paused};
}
