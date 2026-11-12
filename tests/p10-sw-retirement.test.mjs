import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {MessageChannel} from 'node:worker_threads';
import {releaseWorkerURL,isReleaseWorker,isCurrentReleaseReady} from '../dist/sw-client.js';

const source=fs.readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
const release=source.match(/const CACHE = '([^']+)'/)[1];
const clientSource=fs.readFileSync(new URL('../dist/sw-client.js',import.meta.url),'utf8');
const browserClientSource=clientSource.replaceAll('export function','function')
 .replaceAll('import.meta.url',JSON.stringify('https://math.test/app/sw-client.js'));
const browserWorkerURL='https://math.test/app/sw.js?release='+encodeURIComponent(release);
function entryOfflineProgram(file){
 const entry=fs.readFileSync(new URL('../dist/'+file,import.meta.url),'utf8');
 const start=entry.indexOf(file==='space.js'?'async function offline(){':" if('serviceWorker'in navigator){");
 const end=entry.indexOf(file==='space.js'?'\nasync function boot(){':'\n }catch(error){main.innerHTML',start);
 assert.ok(start>=0&&end>start);
 return file==='space.js'?entry.slice(start,end)+'\noffline();':'(async()=>{'+entry.slice(start,end)+'})();';
}
function lifecycleEvents(){
 const handlers=new Map();
 return {
  addEventListener(type,callback,options={}){
   const rows=handlers.get(type)||[];
   if(!rows.some(row=>row.callback===callback))rows.push({callback,once:options.once===true});
   handlers.set(type,rows);
  },
  listenerCount:type=>(handlers.get(type)||[]).length,
  async emit(type){
   for(const row of [...(handlers.get(type)||[])]){
    if(row.once)handlers.set(type,handlers.get(type).filter(item=>item!==row));
    await row.callback({type});
   }
  }
 };
}
const old='math-explorer-historical-release',other='unrelated-origin-cache';
const client=(id,version=release)=>({id,url:'https://math.test/learn.html',postMessage(message,ports){
 if(version===null)return;
 ports[0].postMessage({type:'math-explorer:client-release',cache:version});ports[0].close();
}});
function worker({clients=[client('new-page')],missing=false,enumerate,registration={},store=new Set([old,release,other])}={}){
 const handlers={},deleted=[],calls={claim:0,list:0};
 const self={registration:{scope:'https://math.test/',...registration},location:{origin:'https://math.test'},
  addEventListener:(name,handler)=>handlers[name]=handler,
  clients:{claim:async()=>{calls.claim++;},matchAll:async()=>enumerate?enumerate(++calls.list):clients}};
 vm.runInNewContext(source,{self,URL,Response,MessageChannel,setTimeout,clearTimeout,
  caches:{keys:async()=>[...store],open:async()=>({match:async url=>missing&&String(url).endsWith('b39-model.js')?undefined:new Response('cached resource')}),
   delete:async key=>{deleted.push(key);return store.delete(key);}}});
 const activate=async()=>{let pending;handlers.activate({waitUntil:p=>pending=p});await pending;};
 const cleanup=async()=>{let pending,result;handlers.message({data:{type:'math-explorer:cleanup-retired-caches'},
  ports:[{postMessage:value=>result=value}],waitUntil:p=>pending=p});await pending;return result;};
 return {activate,cleanup,deleted,calls,store};
}
test('activation claims clients without deleting any historical offline resources',async()=>{
 const w=worker();await w.activate();assert.equal(w.calls.claim,1);assert.deepEqual(w.deleted,[]);assert.ok(w.store.has(old));
});
test('a controlled old document cannot certify the new release and cleanup defers',async()=>{
 const w=worker({clients:[client('new'),client('old','previous-release')]});
 const result=await w.cleanup();assert.equal(result.deferred,true);assert.equal(result.complete,false);assert.deepEqual(w.deleted,[]);
});
test('a silent historical document preserves resources and receives a bounded deferred reply',async()=>{
 const w=worker({clients:[client('old',null)]});const result=await w.cleanup();
 assert.equal(result.reason,'legacy-or-unknown-client');assert.equal(result.deferred,true);assert.deepEqual(w.deleted,[]);
});
test('missing current resources prevent retiring a complete historical cache',async()=>{
 const w=worker({missing:true});const result=await w.cleanup();
 assert.equal(result.reason,'current-cache-incomplete');assert.equal(result.complete,false);assert.deepEqual(w.deleted,[]);
});
test('an installing or waiting future release prevents deleting its cache',async()=>{
 for(const state of ['installing','waiting']){
  const w=worker({registration:{[state]:{state}}});const result=await w.cleanup();
  assert.equal(result.reason,'update-in-progress');assert.deepEqual(w.deleted,[]);
 }
});
test('a newly appearing unknown client defers cleanup before any deletion',async()=>{
 const ready=client('ready'),late=client('late','old');
 const w=worker({enumerate:n=>n===1?[ready]:[ready,late]});const result=await w.cleanup();
 assert.equal(result.reason,'client-set-changed');assert.deepEqual(w.deleted,[]);
});
test('worker restart rechecks old documents; closing them permits a later safe sweep',async()=>{
 const store=new Set([old,release,other]);
 for(let restart=0;restart<2;restart++){
  const w=worker({clients:[client('legacy','old')],store});assert.equal((await w.cleanup()).deferred,true);assert.ok(store.has(old));
 }
 const current=worker({store});const result=await current.cleanup();
 assert.equal(result.complete,true);assert.equal(result.deferred,false);assert.deepEqual(current.deleted,[old]);
 assert.deepEqual([...store],[release,other]);
});
test('loaded page release certificate matches the worker and is precached',()=>{
 const page=fs.readFileSync(new URL('../dist/sw-client.js',import.meta.url),'utf8');
 for(const file of ['space.js','exploration.js','learning/learn.js']){
  const entry=fs.readFileSync(new URL('../dist/'+file,import.meta.url),'utf8');
  const fixedRelease=entry.match(/const RELEASE='([^']+)'/)?.[1]||entry.match(/registerClientRelease\('([^']+)'\)/)?.[1];
  assert.equal(fixedRelease,release);
 }
 assert.ok(source.includes("'./sw-client.js'"));
 assert.ok(!page.includes('localStorage'),'cleanup coordination cannot touch learner storage');
});
test('release worker identity comes from the helper location, never a learning document subdirectory',()=>{
 const expected=new URL('../dist/sw.js',import.meta.url);expected.searchParams.set('release',release);
 assert.equal(releaseWorkerURL(release),expected.href);
 for(const href of ['https://math.test/app/index.html','https://math.test/app/learning/learn.html']){
  const actual=vm.runInNewContext(browserClientSource+'\nreleaseWorkerURL('+JSON.stringify(release)+');',
   {URL,location:{href},document:{baseURI:href}});
  assert.equal(actual,browserWorkerURL);
 }
 assert.equal(isReleaseWorker({scriptURL:expected.href},release),true);
 for(const scriptURL of [new URL('../dist/sw.js',import.meta.url).href,expected.href+'&old=1',releaseWorkerURL('older-release')])
  assert.equal(isReleaseWorker({scriptURL},release),false);
 assert.equal(isReleaseWorker(null,release),false);
});
test('client cleanup sends zero messages to historical or wrong-release controllers',async()=>{
 for(const scriptURL of ['https://math.test/app/sw.js','https://math.test/app/sw.js?release=older-release'])for(const state of ['activating','activated']){
  const sent=[],listeners={},observed=[];
  const oldWorker={state,scriptURL,postMessage:message=>sent.push(message.type),addEventListener:type=>observed.push(type)};
  vm.runInNewContext(browserClientSource+'\nregisterClientRelease('+JSON.stringify(release)+');',{
   navigator:{serviceWorker:{controller:oldWorker,getRegistration:async()=>({active:oldWorker}),addEventListener:(name,fn)=>listeners[name]=fn}},
   document:{readyState:'loading'},window:{addEventListener:(name,fn)=>listeners[name]=fn},URL,MessageChannel,setTimeout,clearTimeout});
  await listeners.load();
  assert.deepEqual(sent,[],'even a read-only status probe must not restart the retiring controller');
  assert.deepEqual(observed,[],'unknown historical workers must not be monitored for protocol retries');
 }
});
test('both entry status checks register the fixed release and never probe a legacy controller',async()=>{
 for(const file of ['space.js','exploration.js'])for(const state of ['activating','activated']){
  const program=entryOfflineProgram(file);
  const sent=[],registrations=[],observed=[],status={textContent:''},legacy={state,scriptURL:'https://math.test/app/sw.js',postMessage:message=>sent.push(message.type),addEventListener:type=>observed.push(type)};
  const serviceWorker={controller:legacy,ready:Promise.resolve(),addEventListener(){},
   async register(url,options){registrations.push({url,options});return {active:legacy};}};
  await vm.runInNewContext(browserClientSource+'\nconst RELEASE='+JSON.stringify(release)+';\n'+program,
   {navigator:{serviceWorker},$:()=>status,URL,MessageChannel,setTimeout,clearTimeout});
  assert.deepEqual(sent,[],file+' must identify the controller before requesting cache status');
  assert.deepEqual(observed,[],file+' must not monitor an unknown historical worker');
  assert.equal(registrations.length,1);assert.equal(registrations[0].url,browserWorkerURL);
  assert.equal(registrations[0].options.updateViaCache,'none');
  assert.match(status.textContent,/正在升级离线资源/);
 }
});
for(const file of ['helper','space.js','exploration.js'])test(file+' resumes readiness after the current controller finishes activating',async()=>{
 const sent=[],status={textContent:''},document={readyState:'loading'},window=lifecycleEvents();
 const current={...lifecycleEvents(),state:'activating',scriptURL:browserWorkerURL,postMessage(message,ports){
  assert.equal(this.state,'activated','activating controllers receive no protocol messages');
  sent.push(message.type);ports[0].postMessage({type:message.type,cache:release,complete:true,cached:2,total:2});ports[0].close();
 }};
 const registration={active:current};
 const serviceWorker={...lifecycleEvents(),controller:current,ready:Promise.resolve(registration),
  register:async()=>registration,getRegistration:async()=>registration};
 const program=file==='helper'?'registerClientRelease(RELEASE);':entryOfflineProgram(file);
 await vm.runInNewContext(browserClientSource+'\nconst RELEASE='+JSON.stringify(release)+';\n'+program,
  {navigator:{serviceWorker},document,window,$:()=>status,URL,MessageChannel,setTimeout,clearTimeout});
 document.readyState='complete';
 await serviceWorker.emit('controllerchange');
 await serviceWorker.emit('controllerchange');
 assert.deepEqual(sent,[],'controllerchange during activating does not start a premature status request');
 assert.equal(current.listenerCount('statechange'),1,'the activating current controller needs one completion listener');
 current.state='activated';
 await current.emit('statechange');
 assert.deepEqual(sent,file==='helper'?['math-explorer:cache-status','math-explorer:cleanup-retired-caches']:['math-explorer:cache-status'],
  'activation statechange resumes the original strict checks without another controllerchange');
 assert.equal(current.listenerCount('statechange'),0,'the activation completion listener runs once');
 if(file!=='helper')assert.match(status.textContent,/就绪/);
});
test('current controller cleanup requires matching active identity and a complete resource report',async()=>{
 for(const [activeMatches,complete,expected] of [[false,true,[]],[true,false,['math-explorer:cache-status']],
  [true,true,['math-explorer:cache-status','math-explorer:cleanup-retired-caches']]]){
  const sent=[],listeners={};
  const current={state:'activated',scriptURL:browserWorkerURL,postMessage(message,ports){
   sent.push(message.type);ports[0].postMessage({type:message.type,cache:release,complete,cached:complete?2:1,total:2});ports[0].close();
  }};
  vm.runInNewContext(browserClientSource+'\nregisterClientRelease('+JSON.stringify(release)+');',{
   navigator:{serviceWorker:{controller:current,getRegistration:async()=>({active:activeMatches?current:{}}),addEventListener:(name,fn)=>listeners[name]=fn}},
   document:{readyState:'loading'},window:{addEventListener:(name,fn)=>listeners[name]=fn},URL,MessageChannel,setTimeout,clearTimeout});
  await listeners.load();assert.deepEqual(sent,expected);
 }
});
test('offline readiness requires this loaded release and its current activated controller',()=>{
 const worker={state:'activated',scriptURL:releaseWorkerURL(release)},replacement={state:'activated',scriptURL:releaseWorkerURL(release)};
 const current={release,registration:{active:worker},controller:worker,worker,
  report:{type:'math-explorer:cache-status',cache:release,complete:true,cached:2,total:2}};
 assert.equal(isCurrentReleaseReady(current),true);
 assert.equal(isCurrentReleaseReady({...current,report:{...current.report,cache:'older-release'}}),false,'a complete older cache cannot certify a failed new installation');
 assert.equal(isCurrentReleaseReady({...current,report:{...current.report,complete:false}}),false,'missing resources never count as ready');
 assert.equal(isCurrentReleaseReady({...current,report:{...current.report,cached:1}}),false,'a complete flag without the entire manifest is not ready');
 assert.equal(isCurrentReleaseReady({...current,report:{...current.report,cached:0,total:0}}),false,'an empty manifest does not certify offline learning');
 assert.equal(isCurrentReleaseReady({...current,controller:null}),false,'a complete active cache without actual page control is not ready');
 assert.equal(isCurrentReleaseReady({...current,controller:replacement}),false,'a stale reply from a previous controller is not ready');
 assert.equal(isCurrentReleaseReady({...current,registration:{active:replacement}}),false,'registration active and page controller must agree');
 const originalURL=worker.scriptURL;worker.scriptURL=releaseWorkerURL('older-release');
 assert.equal(isCurrentReleaseReady(current),false,'a plausible cache reply from the wrong worker URL is not ready');
 worker.scriptURL=originalURL;
 worker.state='activating';
 assert.equal(isCurrentReleaseReady(current),false,'activation must finish');
});
