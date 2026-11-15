// Read-only failure evidence for stopped-origin browser checks. A failed ESM
// dependency can leave an HTML shell without emitting a pageerror. Do not retry
// the failed operation, alter learner storage, or extend the test's readiness
// timeout while collecting the missing network and Service Worker evidence.
const fs=require('node:fs'),path=require('node:path');
const bounded=async(promise,ms)=>{
 let timer;
 try{return await Promise.race([promise,new Promise(resolve=>{timer=setTimeout(()=>resolve({diagnosticTimeoutMs:ms}),ms);})]);}
 catch(error){return {diagnosticError:String(error)};}
 finally{clearTimeout(timer);}
};
function observeBrowserDiagnostics(page,{out,base,label}){
 const events=[],byKind={},pending=new Map(),context=page.context();
 const currentResources=new Map(),requestResources=new WeakMap();
 const note=(kind,data={})=>{
  const entry={at:new Date().toISOString(),label:label(),kind,...data};
  events.push(entry);if(events.length>200)events.shift();
  const bucket=byKind[kind]??=[];bucket.push(entry);if(bucket.length>100)bucket.shift();
 };
 const details=request=>{
  let worker=null;try{worker=request.serviceWorker?.()?.url()||null;}catch{}
  return {url:request.url(),resourceType:request.resourceType(),method:request.method(),navigation:request.isNavigationRequest(),serviceWorker:worker};
 };
 context.on('request',request=>{
  if(!request.url().startsWith(base))return;
  const data={...details(request),startedAt:new Date().toISOString(),label:label()};pending.set(request,data);
  if(data.navigation&&!data.serviceWorker)currentResources.clear();
  const resource={...data};requestResources.set(request,resource);
  if(currentResources.size<1000)currentResources.set(request,resource);
  if(data.navigation)note('navigation-request',data);
 });
 context.on('requestfinished',request=>{pending.delete(request);const resource=requestResources.get(request);if(resource)resource.finishedAt=new Date().toISOString();});
 context.on('requestfailed',request=>{
  pending.delete(request);const resource=requestResources.get(request);if(resource){resource.failedAt=new Date().toISOString();resource.failure=request.failure();}
  note('requestfailed',{...details(request),failure:request.failure()});
 });
 context.on('response',response=>{
  const request=response.request(),resource=requestResources.get(request),headers=response.headers();
  const data={url:response.url(),status:response.status(),fromServiceWorker:response.fromServiceWorker(),
   headers:Object.fromEntries(['content-type','content-length','cache-control','etag'].filter(k=>headers[k]!==undefined).map(k=>[k,headers[k]]))};
  if(resource)resource.response={...data,at:new Date().toISOString()};
  if(response.status()<200||response.status()>=300)note('response',data);
 });
 context.on('weberror',event=>note('weberror',{error:String(event.error())}));
 page.on('console',message=>{if(['error','warning','warn'].includes(message.type()))note('console',{type:message.type(),text:message.text(),location:message.location()});});
 page.on('framenavigated',frame=>{if(frame===page.mainFrame())note('framenavigated',{url:frame.url()});});
 page.on('domcontentloaded',()=>note('domcontentloaded',{url:page.url()}));
 page.on('load',()=>note('load',{url:page.url()}));
 return {async dump(error){
  const name=label()+'-failure-diagnostics';
  // Persist storage before asynchronous cache/body diagnostics. A broken cache
  // read must not swallow the current page's already available learner bytes.
  const storageStartedAt=new Date().toISOString();
  const initialStorage=await bounded(page.evaluate(()=>({raw:localStorage.getItem('math-explorer-v2')})),1000);
  let storage=null;
  const storageCapture={source:'before-cache-diagnostics',startedAt:storageStartedAt,
   completedAt:new Date().toISOString(),...Object.fromEntries(Object.entries(initialStorage).filter(([key])=>key!=='raw'))};
  if(typeof initialStorage.raw==='string'){
   storage=name+'-storage.txt';fs.writeFileSync(path.join(out,storage),initialStorage.raw);
   storageCapture.bytes=Buffer.byteLength(initialStorage.raw,'utf8');
  }else if(initialStorage.raw===null)storageCapture.missing=true;
  const failedResources=[...currentResources.values()].filter(resource=>resource.failure).map(resource=>resource.url);
  const state=await bounded(page.evaluate(async failedURLs=>{
   const limit=async(promise,ms=1500)=>{
    let timer;try{return await Promise.race([promise,new Promise(resolve=>{timer=setTimeout(()=>resolve({diagnosticTimeoutMs:ms}),ms);})]);}
    catch(error){return {diagnosticError:String(error)};}finally{clearTimeout(timer);}
   };
   const worker=w=>w?{scriptURL:w.scriptURL,state:w.state}:null;
   let snapshot=null,snapshotError=null,raw=null,storageError=null;
   try{snapshot=window.mathLesson?.snapshot()||null;}catch(error){snapshotError=String(error);}
   try{raw=localStorage.getItem('math-explorer-v2');}catch(error){storageError=String(error);}
   const controller=navigator.serviceWorker?.controller;
   const [registration,cacheKeys,cacheStatus]=await Promise.all([
    limit(navigator.serviceWorker.getRegistration()),limit(caches.keys()),
    controller?new Promise(resolve=>{
     const channel=new MessageChannel();
     const finish=data=>{clearTimeout(timer);channel.port1.close();resolve(data);};
     const timer=setTimeout(()=>finish({diagnosticTimeoutMs:1500}),1500);
     channel.port1.onmessage=event=>finish(event.data);
     try{controller.postMessage({type:'math-explorer:cache-status'},[channel.port2]);}catch(error){finish({diagnosticError:String(error)});}
    }):Promise.resolve({controllerMissing:true})
   ]);
   // Check bytes only after the test has failed. cache-status alone proves
   // presence, not the MIME type or integrity of a cancelled module response.
   const cacheResponses=[];
   if(Array.isArray(cacheKeys))for(const key of cacheKeys){
    const cache=await caches.open(key);
    for(const url of new Set([location.href.split('#')[0],new URL('./learning/learn.js',location.href).href,...failedURLs])){
     const response=await cache.match(url,{ignoreSearch:true});
     if(!response){cacheResponses.push({cache:key,url,missing:true});continue;}
     const bytes=await response.arrayBuffer(),sha256=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
     cacheResponses.push({cache:key,url,status:response.status,contentType:response.headers.get('content-type'),bytes:bytes.byteLength,sha256});
    }
   }
   return {url:location.href,readyState:document.readyState,snapshot,snapshotError,raw,storageError,cacheResponses,
    dom:{title:document.querySelector('#title')?.textContent,warning:document.querySelector('#storage-warning')?.textContent,
     warningHidden:document.querySelector('#storage-warning')?.hidden,work:document.querySelector('#work')?.textContent,
     actions:document.querySelector('#actions')?.textContent,check:document.querySelector('#check-feedback')?.textContent},
    controller:worker(controller),registration:registration&&('active'in registration)?{
     scope:registration.scope,active:worker(registration.active),waiting:worker(registration.waiting),installing:worker(registration.installing)
    }:registration||null,cacheKeys,cacheStatus,
    resources:performance.getEntriesByType('resource').map(({name,initiatorType,duration,transferSize,decodedBodySize})=>({name,initiatorType,duration,transferSize,decodedBodySize}))};
  },failedResources),4000);
  const {raw,...details}=state;
  if(!Object.hasOwn(initialStorage,'raw')&&typeof raw==='string'){
   storage=name+'-storage.txt';fs.writeFileSync(path.join(out,storage),raw);
   storageCapture.fallback={source:'after-cache-diagnostics',at:new Date().toISOString(),bytes:Buffer.byteLength(raw,'utf8')};
  }
  if(Object.hasOwn(initialStorage,'raw')&&Object.hasOwn(state,'raw'))
   storageCapture.changedDuringDiagnostics=initialStorage.raw!==raw;
  const html=await bounded(page.content(),2000),documentFile=typeof html==='string'?name+'.html':null;
  if(documentFile)fs.writeFileSync(path.join(out,documentFile),html);
  const report={at:new Date().toISOString(),label:label(),error:String(error),...details,storage,storageCapture,documentFile,
   ...(!documentFile?{documentDiagnostic:html}:{}),events:[...events],eventsByKind:byKind,
   currentNavigationResources:[...currentResources.values()],pendingSameOrigin:[...pending.values()]};
  fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(report,null,2));
  return name+'.json';
 }};
}
module.exports={observeBrowserDiagnostics};
