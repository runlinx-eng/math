'use strict';
// Read-only post-activation Service Worker diagnostics for Issue #180.
// The browser-level ServiceWorker.enable command is absent on the pinned
// Chromium runner. This observer instead inspects the already-running SW
// through the public Playwright Worker API. It never changes fetch handlers,
// request responses, cache contents, the original SW file or learning storage.
// Listeners only observe errors occurring AFTER successful attachment.
const RUNTIME_TIMEOUT_MS=1500;

function withTimeout(promise, ms=RUNTIME_TIMEOUT_MS) {
 let timer;
 return Promise.race([
  promise,
  new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('service-worker-observation-timeout')),ms);})
 ]).finally(()=>clearTimeout(timer));
}

function installInsideWorker() {
 const key='__mathIssue180PassiveRuntime';
 let state=self[key];
 if(!state){
  state={installedAt:new Date().toISOString(),count:0,dropped:0,events:[]};
  // Ephemeral, diagnostic-only in-memory data. Never persisted in CacheStorage.
  Object.defineProperty(self,key,{value:state,configurable:true});
  const record=(kind,detail)=>{
   const entry={seq:++state.count,kind,at:new Date().toISOString(),...detail};
   if(state.events.length>=128){state.events.shift();state.dropped++;}
   state.events.push(entry);
  };
  self.addEventListener('error',event=>{
   record('error',{message:String(event.message||''),filename:event.filename||'',
    line:event.lineno||0,column:event.colno||0});
   // No preventDefault: preserve original error behavior.
  });
  self.addEventListener('unhandledrejection',event=>{
   const reason=event.reason;
   record('unhandledrejection',{reason:String(reason?.stack||reason?.message||reason).slice(0,1500)});
   // No preventDefault: preserve original rejection behavior.
  });
  self.addEventListener('messageerror',()=>record('messageerror',{}));
  // Deliberately do NOT add a late fetch listener or wrap respondWith; either
  // can change worker dispatch behavior and invalidate a timing diagnosis.
 }
 return {installed:!!self[key],scriptURL:self.location.href,
  registrationScope:self.registration?.scope||null,installedAt:state.installedAt};
}

async function readInsideWorker() {
 const data=self.__mathIssue180PassiveRuntime||null;
 const cacheNames=await caches.keys().catch(()=>[]);
 const resources=performance.getEntriesByType('resource').slice(-40)
  .map(e=>({name:e.name,initiatorType:e.initiatorType,duration:e.duration,transferSize:e.transferSize}));
 return {scriptURL:self.location.href,registrationScope:self.registration?.scope||null,
  activeScriptURL:self.registration?.active?.scriptURL||null,
  installed:!!data,installedAt:data?.installedAt||null,
  eventCount:data?.count||0,droppedEvents:data?.dropped||0,
  events:data?.events||[],cacheNames,workerResourceTail:resources};
}

function createPassiveServiceWorkerObserver({context,note}) {
 const workers=new Map();
 let started=false,closed=false;
 const safeUrl=worker=>{try{return worker.url();}catch{return null;}};
 const workerForRequest=request=>{
  try{return request.serviceWorker?.()||null;}catch{return null;}
 };
 const observe=async(worker,existing)=>{
  if(workers.has(worker))return workers.get(worker).attached;
  const url=safeUrl(worker),info={url,closed:false,seen:0,attached:null,closeListener:null};
  workers.set(worker,info);
  info.closeListener=()=>{info.closed=true;note('serviceWorkerRuntimeClosed',{url});};
  worker.on('close',info.closeListener);
  info.attached=withTimeout(worker.evaluate(installInsideWorker)).then(detail=>{
   note('serviceWorkerRuntimeAttached',{url,existing,...detail});
   return detail;
  }).catch(error=>{
   note('serviceWorkerRuntimeAttachFailed',{url,existing,error:String(error)});
   return {installed:false,error:String(error)};
  });
  return info.attached;
 };
 const onWorker=worker=>{void observe(worker,false);};
 const onRequest=request=>{
  const worker=workerForRequest(request);
  if(worker)note('serviceWorkerOwnedRequest',{url:request.url(),
   workerUrl:safeUrl(worker),resourceType:request.resourceType()});
 };
 const onFailed=request=>{
  const worker=workerForRequest(request);
  if(worker)note('serviceWorkerOwnedRequestFailed',{url:request.url(),
   workerUrl:safeUrl(worker),errorText:request.failure()?.errorText||null});
 };
 const onResponse=response=>{
  const request=response.request(),worker=workerForRequest(request);
  if(worker)note('serviceWorkerOwnedResponse',{url:response.url(),
   workerUrl:safeUrl(worker),status:response.status()});
 };
 const onConsole=message=>{
  if(message.type()!=='error'&&message.type()!=='warning')return;
  let worker=null,source='';
  try{worker=typeof message.worker==='function'?message.worker():null;}catch{}
  try{source=message.location()?.url||'';}catch{}
  if(worker||/\/sw\.js(?:\?|$)/.test(source))
   note('serviceWorkerConsole',{type:message.type(),source,workerUrl:worker?safeUrl(worker):null,
    text:message.text().slice(0,1500)});
 };
 async function start(){
  if(started)return;started=true;
  context.on('serviceworker',onWorker);
  context.on('request',onRequest);
  context.on('requestfailed',onFailed);
  context.on('response',onResponse);
  context.on('console',onConsole);
  await Promise.all(context.serviceWorkers().map(worker=>observe(worker,true)));
  note('serviceWorkerRuntimeCapabilities',{
   method:'Playwright Worker.evaluate + passive error/unhandledrejection + SW-owned network events',
   initialWorkers:workers.size,
   limitation:'Only post-attachment JS errors; cached fetch dispatch and native SW version stream are not observable here'});
 }
 async function snapshot(){
  const active=context.serviceWorkers();
  const results=[];
  for(const worker of active){
   if(!workers.has(worker))await observe(worker,false);
   const info=workers.get(worker),url=safeUrl(worker);
   try{
    const value=await withTimeout(worker.evaluate(readInsideWorker));
    for(const event of value.events||[])if(event.seq>info.seen)
     note('serviceWorkerRuntimeError',{workerUrl:url,...event});
    info.seen=Math.max(info.seen,value.eventCount||0);
    results.push({url,...value});
   }catch(error){results.push({url,unavailable:true,error:String(error)});}
  }
  return {observedAt:new Date().toISOString(),method:'playwright-worker-evaluate',
   knownWorkerCount:workers.size,liveWorkerCount:active.length,
   closedWorkerCount:[...workers.values()].filter(item=>item.closed).length,
   workers:results};
 }
 function close(){
  if(closed)return;closed=true;
  if(started){
   context.off('serviceworker',onWorker);
   context.off('request',onRequest);
   context.off('requestfailed',onFailed);
   context.off('response',onResponse);
   context.off('console',onConsole);
  }
  for(const [worker,info]of workers)worker.off('close',info.closeListener);
  workers.clear();
 }
 return {start,snapshot,close};
}
module.exports={createPassiveServiceWorkerObserver};
