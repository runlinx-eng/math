// Issue 166: original rendered controls and models produce the histories.
// Independent assertions below distinguish a request from an effective move.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sessionTasks} from '../../dist/learning/bridges.js';
const clone=structuredClone;
const attr=(s,k)=>s.match(new RegExp('\\b'+k+'="([^"]*)"'))?.[1];
const decode=s=>s.replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&').replaceAll('&quot;','"');
const manifest=JSON.parse(readFileSync(new URL('../../docs/spatial-learning/evidence-review-manifest.json',import.meta.url))).tasks;
function controls(t,M,V,m){
 const trace=[];
 const field=(key,value)=>{
  const html=V.render(t,m),tags=[...html.matchAll(/<(?:input|select|textarea)\b[^>]*>/g)].map(x=>x[0]).filter(s=>attr(s,'data-xfield')===key);
  assert.equal(tags.length,1,'one rendered field '+key);const tag=tags[0];assert.ok(!/\sdisabled(?:\s|=|>)/.test(tag));
  if(tag.startsWith('<select')){const start=html.indexOf(tag),part=html.slice(start,html.indexOf('</select>',start));
   assert.ok([...part.matchAll(/<option\b[^>]*value="([^"]*)"/g)].some(x=>decode(x[1])===String(value)),'real select option '+key);}
  m[key]=String(value);M.field(t,m,key);trace.push({field:key,value:String(value)});
 };
 const act=(action,data={})=>{
  const tags=[...V.render(t,m).matchAll(/<[^>]*\bdata-x="[^"]+"[^>]*>/g)].map(x=>x[0]).filter(s=>attr(s,'data-x')===action&&Object.entries(data).every(([k,v])=>attr(s,'data-'+k)===String(v)));
  assert.equal(tags.length,1,'one rendered action '+action+' '+JSON.stringify(data));assert.ok(!/\sdisabled(?:\s|=|>)/.test(tags[0]),'enabled action '+action);
  const before=clone(m.board);M.act(t,m,action,data);
  trace.push({action,data,before,after:clone(m.board),issue:m.issue});
 };
 return {field,act,trace,step:s=>s.field?field(s.field,s.value):act(s.action,s.data||{})};
}
function rational(raw){
 let s=String(raw).trim(),percent=s.endsWith('%');if(percent)s=s.slice(0,-1);
 let n,d,m;
 if((m=/^(-?)(\d+)\s+(\d+)\/(\d+)$/.exec(s))){d=BigInt(m[4]);n=BigInt(m[2])*d+BigInt(m[3]);if(m[1])n=-n;}
 else if((m=/^(-?\d+)\/(\d+)$/.exec(s))){n=BigInt(m[1]);d=BigInt(m[2]);}
 else{m=/^([+-]?)(\d+)(?:\.(\d+))?$/.exec(s);assert.ok(m);d=10n**BigInt((m[3]||'').length);n=BigInt(m[2])*d+BigInt(m[3]||'0');if(m[1]==='-')n=-n;}
 return[n,percent?d*100n:d];
}
const equalAmount=(a,b)=>a[0]*b[1]===b[0]*a[1];
function independent(t,p){
 for(const e of p.history.events){
  const a=e.before,b=e.after;
  if(t.type==='x-unitwalk'){
   if(e.action==='walk'&&e.accepted){assert.equal(b.steps.length-a.steps.length,t.chunk||1);assert.equal(a.parts,b.parts);}
   if(e.action==='walk-back'&&e.accepted){assert.equal(b.steps.length,a.steps.length-1);assert.equal(a.parts,b.parts);}
   if(!e.accepted)assert.deepEqual(a,b);
   if(['reset','partition'].includes(e.action)&&e.accepted){assert.equal(b.steps.length,0);assert.equal(b.first,a.first);}
   assert.deepEqual(b.steps,Array.from({length:b.steps.length},(_,i)=>i+1));
  }else if(t.type==='x-fracrename'){
   assert.equal(BigInt(a.n)*BigInt(b.d),BigInt(b.n)*BigInt(a.d));
   assert.equal(BigInt(b.n)*BigInt(t.d),BigInt(t.n)*BigInt(b.d));
   if(!e.accepted){assert.deepEqual([a.n,a.d,a.saved,a.moves,a.tested,a.opened],[b.n,b.d,b.saved,b.moves,b.tested,b.opened]);}
  }else if(t.type==='x-mulgroups'){
   assert.ok(b.homes.every(x=>x>=-1&&x<b.buckets));
   const counts=Array.from({length:b.buckets},(_,i)=>b.homes.filter(x=>x===i).length),pool=b.homes.filter(x=>x===-1).length;
   assert.equal(counts.reduce((sum,x)=>sum+BigInt(x),BigInt(pool)),BigInt(b.homes.length));
   if(!e.accepted)assert.deepEqual(a,b);
   if(t.mode!=='build')assert.equal(b.homes.length,t.total);
  }
 }
 if(t.type==='x-fracorder')for(const x of p.history.placementAttempts)
  assert.equal(x.matchesCard,equalAmount(rational(x.position),rational(t.cards[x.index])));
}

export async function verifyVisibleCorrections(family,replay,feedback){
 const batch=['unitwalk','groupwalk'].includes(family)?'b16':family==='groups'?'b13':'b17';
 const M=await import('../../dist/learning/phase5/'+batch+'-model.js'),V=await import('../../dist/learning/phase5/'+batch+'-view.js');
 const cases=manifest.filter(c=>c.adapter===family);assert.ok(cases.length);
 let paths=0,actions=0,fields=0,failed=0,forgeries=0;
 for(const c of cases){
  const t=sessionTasks(c.sessionId)[c.index],solution=M.solveSteps(t),prefix=batch+'-';
  const check=(m,ui)=>{assert.ok(M.valid(t,m));assert.ok(M.inspect(t,m).correct);const p=replay(t,m);assert.ok(p,c.sessionId+':'+c.index);assert.equal(p.history.events.length,m.history.length);independent(t,p);
   const actual=ui.trace.filter(s=>s.action);assert.equal(actual.length,p.history.events.length);
   for(const [i,e] of p.history.events.entries()){
    assert.deepEqual(e.before,actual[i].before,'every original pre-action state');
    assert.deepEqual(e.after,actual[i].after,'every original post-action state');
    assert.equal(e.issue,actual[i].issue,'every original action issue');
   }
   assert.ok(feedback(t,m,{attempts:[{value:clone(m)}]},c));const restored=JSON.parse(JSON.stringify(m));assert.deepEqual(replay(t,restored),p);
   const forged=clone(m);forged.issue=m.issue?'':'forged error';assert.equal(replay(t,forged),null,'latest issue must be the actual action result');forgeries++;
   const malformed=clone(m),event=malformed.history[0];event.extra=true;assert.equal(replay(t,malformed),null);forgeries++;
   const foreign=clone(m);M.act(t,foreign,batch==='b13'?'b13-turn':batch==='b16'?'b16-fold':'b17-pad');assert.ok(M.valid(t,foreign));assert.equal(replay(t,foreign),null,'a hidden foreign control is never admitted');forgeries++;
   const stale={attempts:[{value:clone(m)}]},edited=clone(m);edited.answer+=' ';assert.equal(feedback(t,edited,stale,c),null);
   paths++;actions+=ui.trace.filter(s=>s.action).length;fields+=ui.trace.filter(s=>s.field).length;failed+=p.history.failedRequests.length;return p;};
  // Inject real failed fields at all relevant stages of the genuine solve path.
  {
   const m=M.initial(t),ui=controls(t,M,V,m);if(t.type==='x-unitwalk')ui.act(prefix+'walk-back');
   if(t.type==='x-fracorder')ui.act('b17-predict');
   for(const s of solution){
    const a=s.action,changes=[];
    if(family==='fraction'){
     if(a==='b17-open-decimal')changes.push(['fraction','0/1']);
     if(['b17-split','b17-merge'].includes(a))changes.push(['factor','0']);
     if(a==='b17-remember')changes.push(['fraction','0/1']);
    }
    if(t.type==='x-unitwalk'&&a===prefix+'partition')changes.push(['parts','0']);
    if(family==='groups'&&a==='b13-pour')changes.push(['amount','0']);
    if(family==='fraction-order'){
     if(a==='b17-place')changes.push(['position',String((t.min||0)-1)],['position',t.cards[(m.board.selected+1)%t.cards.length]]);
     if(a==='b17-common')changes.push(['denom','0']);
     if(a==='b17-rename')changes.push(['fraction','0/1']);
     if(a==='b17-landmark')changes.push(t.gaps?['answer','-1']:['relation',m.relation==='<'?'>':'<']);
    }
    for(const [key,value] of changes){const saved=m[key];ui.field(key,value);ui.act(a,s.data||{});ui.field(key,saved);}
    ui.step(s);
    if(family==='fraction-order'&&a==='b17-predict'&&t.mismatch)ui.act('b17-shade',{row:0,index:0});
   }
   check(m,ui);
  }
  // Reset is an explicit epoch boundary. Previous first attempts are retained.
  {
   const m=M.initial(t),ui=controls(t,M,V,m);
   for(const s of solution){ui.step(s);if(s.action)break;}
   ui.act(prefix+'reset');for(const s of solution)ui.step(s);
   const p=check(m,ui);assert.equal(p.history.resetCount,1);
  }
  // A final genuine failed request may leave the completed construction valid.
  // Merely editing the pending field back does not erase the original issue.
  {
   const m=M.initial(t),ui=controls(t,M,V,m);for(const s of solution)ui.step(s);
   let key,value,action,data={};
   if(family==='fraction'){key='factor';value='0';action='b17-split';}
   else if(t.type==='x-unitwalk'){key='parts';value='0';action=prefix+'partition';}
   else if(family==='groups'){key='amount';value='0';action='b13-pour';data={bucket:0};}
   else{key='position';value=String((t.min||0)-1);action='b17-place';}
   const saved=m[key],before=clone(m.board);ui.field(key,value);ui.act(action,data);ui.field(key,saved);
   assert.deepEqual(m.board,before);assert.ok(m.issue);const p=check(m,ui);assert.equal(p.history.failedRequests.at(-1).issue,m.issue);
  }
 }
 return {family,nativeTasks:cases.length,paths,actions,fields,failedRequests:failed,forgeriesRejected:forgeries,browserExecuted:false};
}
