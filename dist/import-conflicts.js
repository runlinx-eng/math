// P5 backup-import guard. A merge may union distinct events, but must not
// silently discard conflicting user-authored drafts or reuse an ID for
// different evidence. Call this only for an explicit backup import: ordinary
// in-session view changes are not backup conflicts.
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function equal(a,b){
  if(Object.is(a,b))return true;
  if(Array.isArray(a)||Array.isArray(b))
    return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>equal(v,b[i]));
  if(!object(a)||!object(b))return false;
  const ka=Object.keys(a).sort(),kb=Object.keys(b).sort();
  return ka.length===kb.length&&ka.every((k,i)=>k===kb[i]&&equal(a[k],b[k]));
}
const label=id=>String(id).replace(/[\r\n]/g,' ').slice(0,100);
export function findImportConflicts(local,incoming){
  const conflicts=[];
  const add=(kind,path)=>conflicts.push({kind,path});
  const draft=(a,b,path)=>{
    if(typeof a==='string'&&typeof b==='string'&&a.trim()&&b.trim()&&a!==b)
      add('草稿',path);
  };
  const mapOverlap=(a={},b={},cb)=>{
    for(const [id,item] of Object.entries(a||{}))
      if(Object.hasOwn(b||{},id))cb(item,b[id],label(id));
  };
  const events=(a=[],b=[],path)=>{
    const byId=new Map((a||[]).map(item=>[item.id,item]));
    for(const item of b||[]){
      const old=byId.get(item.id);
      if(old&&!equal(old,item))add('同 ID 证据',path+' / '+label(item.id));
    }
  };
  const models=(a={},b={},path)=>mapOverlap(a,b,(x,y,k)=>{
    if(!equal(x,y))add('未完成工作模型',path+' / '+k);
  });
  const lesson=(a,b,path)=>{
    draft(a.draft,b.draft,path+' / 草稿');
    models(a.models,b.models,path+' / 工作模型');
    mapOverlap(a.cases,b.cases,(x,y,key)=>events(x.attempts,y.attempts,path+' / 任务 '+key));
    events(a.notes,b.notes,path+' / 文字记录');
  };
  mapOverlap(local.lessons,incoming.lessons,(a,b,id)=>lesson(a,b,'学习 '+id));
  mapOverlap(local.daily?.bridges,incoming.daily?.bridges,(a,b,id)=>lesson(a,b,'联合任务 '+id));
  mapOverlap(local.activities,incoming.activities,(a,b,id)=>{
    const path='旧活动 '+id;
    draft(a.draft,b.draft,path+' / 草稿');
    if(a.lab?.changed&&b.lab?.changed&&!equal(a.lab,b.lab))
      add('自由探索现场',path+' / 工作现场');
    models(a.models,b.models,path+' / 工作模型');
    mapOverlap(a.evidence,b.evidence,(x,y,key)=>events(x.attempts,y.attempts,path+' / 任务 '+key));
    events(a.notes,b.notes,path+' / 文字记录');
    events(a.observations,b.observations,path+' / 自由探索作品');
  });
  const byQuestion=new Map((local.daily?.questions||[]).map(q=>[q.id,q]));
  for(const q of incoming.daily?.questions||[]){
    const a=byQuestion.get(q.id);
    if(!a)continue;
    const path='待续问题 '+label(q.id);
    for(const k of ['text','at','nodeId'])
      if(!equal(a[k],q[k]))add('同 ID 问题内容',path+' / '+k);
    for(const k of ['scene','world'])
      if(a[k]!=null&&q[k]!=null&&!equal(a[k],q[k]))
        add('同 ID 问题现场',path+' / '+k);
    events(a.events,q.events,path+' / 行动');
  }
  mapOverlap(local.journeys,incoming.journeys,(a,b,id)=>{
    const path='历史路线 '+id;
    draft(a.draft,b.draft,path+' / 草稿');
    for(const k of ['observations','attempts','notes'])events(a[k],b[k],path+' / '+k);
  });
  if(local.legacy&&incoming.legacy){
    events(local.legacy.history,incoming.legacy.history,'V1 历史答题');
    mapOverlap(local.legacy.paused,incoming.legacy.paused,(a,b,id)=>{
      if(!equal(a,b))add('V1 未完现场','V1 暂停 '+id);
    });
    if(local.legacy.active&&incoming.legacy.active&&
       local.legacy.active.lesson===incoming.legacy.active.lesson&&
       !equal(local.legacy.active,incoming.legacy.active))
      add('V1 未完现场','V1 当前活动 '+label(local.legacy.active.lesson));
  }
  return conflicts;
}
export class ImportConflictError extends Error{
  constructor(conflicts){
    const preview=conflicts.slice(0,3).map(c=>c.kind+'：'+c.path).join('；');
    super('发现 '+conflicts.length+' 处不能安全自动合并的记录冲突（'+preview+
      (conflicts.length>3?'；另有 '+(conflicts.length-3)+' 处':'')+
      '）。已取消导入，当前学习记录未覆盖。请先导出本机备份、保留待导入文件，再人工核对。');
    this.name='ImportConflictError';
    this.conflicts=conflicts;
  }
}
export function assertNoImportConflicts(local,incoming){
  const conflicts=findImportConflicts(local,incoming);
  if(conflicts.length)throw new ImportConflictError(conflicts);
}
