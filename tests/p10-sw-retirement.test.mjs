import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {MessageChannel} from 'node:worker_threads';

const source=fs.readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
const release=source.match(/const CACHE = '([^']+)'/)[1];
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
  assert.equal(entry.match(/registerClientRelease\('([^']+)'\)/)[1],release);
 }
 assert.ok(source.includes("'./sw-client.js'"));
 assert.ok(!page.includes('localStorage'),'cleanup coordination cannot touch learner storage');
});
test('new page never invokes an older controller cleanup implementation',async()=>{
 const pageSource=fs.readFileSync(new URL('../dist/sw-client.js',import.meta.url),'utf8');
 const sent=[],listeners={};
 const oldWorker={state:'activated',postMessage(message,ports){sent.push(message.type);
  ports[0].postMessage({type:'math-explorer:cache-status',cache:'older-release',complete:true});ports[0].close();}};
 vm.runInNewContext(pageSource.replace('export function','function')+'\nregisterClientRelease('+JSON.stringify(release)+');',{navigator:{serviceWorker:{controller:oldWorker,addEventListener:(name,fn)=>listeners[name]=fn}},
  document:{readyState:'loading'},window:{addEventListener:(name,fn)=>listeners[name]=fn},MessageChannel,setTimeout,clearTimeout});
 await listeners.load();
 assert.deepEqual(sent,['math-explorer:cache-status']);
});
