import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const code=fs.readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
const release=code.match(/const CACHE = '([^']+)'/)?.[1];
assert.ok(release);
const base='https://math.example/';

function serviceWorkerFixture({cached={},fetchImpl,cacheOpenFails=false}={}){
  const handlers={};
  const fetches=[],writes=[];
  const store=new Map(Object.entries(cached));
  const cache={
    match:async(request)=>store.get(new URL(request.url??request).pathname),
    put:async(request,response)=>{writes.push(request.url);store.set(new URL(request.url).pathname,response);},
  };
  const caches={
    open:async name=>{assert.equal(name,release);if(cacheOpenFails)throw Error('CacheStorage blocked');return cache;},
    keys:async()=>[release],
    delete:async()=>false,
  };
  const self={
    location:{origin:'https://math.example'},
    registration:{scope:base},
    addEventListener:(kind,handler)=>{handlers[kind]=handler;},
  };
  const fetch=async request=>{
    fetches.push(request.url);
    return fetchImpl?fetchImpl(request):Promise.reject(Error('stopped HTTP origin'));
  };
  vm.runInNewContext(code,{self,caches,fetch,URL,Response,MessageChannel,
    setTimeout,clearTimeout});
  return {fetches,writes,store,async request(destination,file){
    const req={url:new URL(file,base).href,method:'GET',destination};
    const promises=[];
    let response;
    handlers.fetch({request:req,respondWith:p=>{response=p;},waitUntil:p=>{promises.push(p);}});
    assert.ok(response,'the real SW must settle this request');
    const result=await response;
    await Promise.allSettled(promises);
    return result;
  }};
}

const script='./learning/phase5/b18-view.js',document='./learn.html';
const cachedResponse=()=>new Response('/* fully cached ESM */',{headers:{'Content-Type':'text/javascript'}});

test('a complete precached module loads offline without contacting the stopped origin',async()=>{
  const fixture=serviceWorkerFixture({cached:{'/learning/phase5/b18-view.js':cachedResponse()}});
  const response=await fixture.request('script',script);
  assert.equal(await response.text(),'/* fully cached ESM */');
  assert.deepEqual(fixture.fetches,[],'a cached module must not initiate a failed network request');
  assert.deepEqual(fixture.writes,[],'the offline hit must not mutate cached resources');
});

test('multiple concurrent precached ESM requests never contact the stopped origin',async()=>{
  const files=['/learning/phase5/b16-view.js','/learning/phase5/b17-view.js','/learning/phase5/b18-view.js'];
  const fixture=serviceWorkerFixture({cached:Object.fromEntries(files.map(file=>[file,cachedResponse()]))});
  const responses=await Promise.all(files.map(file=>fixture.request('script',file)));
  assert.deepEqual(await Promise.all(responses.map(x=>x.text())),files.map(()=>'/* fully cached ESM */'));
  assert.equal(fixture.fetches.length,0);
});

test('a missing module still uses the live origin and is not silently treated as cached',async()=>{
  const fixture=serviceWorkerFixture({fetchImpl:async()=>new Response('export const active = true;',{
    headers:{'Content-Type':'text/javascript'}})});
  const response=await fixture.request('script',script);
  assert.equal(await response.text(),'export const active = true;');
  assert.equal(fixture.fetches.length,1);
  assert.equal(fixture.writes.length,1);
});

test('noncached offline ESM still returns an explicit 503 instead of a fake valid module',async()=>{
  const fixture=serviceWorkerFixture();
  const response=await fixture.request('script',script);
  assert.equal(response.status,503);
  assert.match(await response.text(),/尚未缓存/);
  assert.equal(fixture.fetches.length,1);
});

test('HTML navigations remain network first, then fall back to offline CacheStorage',async()=>{
  const cached={'/learn.html':new Response('cached document')};
  const online=serviceWorkerFixture({cached,fetchImpl:async()=>new Response('new document')});
  assert.equal(await (await online.request('document',document)).text(),'new document');
  assert.equal(online.fetches.length,1);
  assert.equal(online.writes.length,1);
  const offline=serviceWorkerFixture({cached});
  assert.equal(await (await offline.request('document',document)).text(),'cached document');
  assert.equal(offline.fetches.length,1);
});

test('when CacheStorage itself is blocked, a live module may still load from the origin',async()=>{
  const fixture=serviceWorkerFixture({cacheOpenFails:true,fetchImpl:async()=>new Response('export {};')});
  const response=await fixture.request('script',script);
  assert.equal(await response.text(),'export {};');
  assert.equal(fixture.fetches.length,1);
});
