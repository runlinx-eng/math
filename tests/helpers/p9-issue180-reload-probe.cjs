// Read-only Chromium first-error probe for the authentic fraction-operations flow.
// Never retries navigation, clears caches, adjusts readiness timeouts or edits a learner record.
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {createPassiveServiceWorkerObserver}=require('./p9-issue180-sw-runtime.cjs');

function createReloadStartupProbe({context,page,out,cache}){
 const events=[],requests=new Map(),firstFailures=[];
 let session=null,workerSession=null,savedFailure=false,eventCount=0,writtenCount=0,journalError=null;
 const watchedWorkers=new Set(),workerCloseListeners=new Map();
 let workerListener=null,requestFailureListener=null,consoleErrorListener=null,swNativeAvailable=false,closed=false;
 const startedAt=new Date().toISOString();
 const viewport=page.viewportSize()||{width:0,height:0};
 const journalFile=path.join(out,viewport.width+'x'+viewport.height+'-native-startup-network.jsonl');
 // The JSON snapshot is a bounded tail for quick inspection; the append-only
 // journal is the full first-to-last CDP stream, including the first error.
 const push=(kind,payload)=>{
  if(closed)return;
  const record={seq:++eventCount,kind,at:new Date().toISOString(),...payload};
  try{fs.appendFileSync(journalFile,JSON.stringify(record)+'\n');writtenCount++;}
  catch(error){if(!journalError)journalError=String(error);}
  if(['loadingFailed','playwrightRequestFailed','serviceWorkerError','serviceWorkerRuntimeError','serviceWorkerOwnedRequestFailed'].includes(kind)&&firstFailures.length<40)
   firstFailures.push(record);
  events.push(record);
  if(events.length>700)events.splice(0,events.length-700);
 };
 const journalSummary=()=>{
  try{
   const buffer=fs.readFileSync(journalFile),lines=buffer.toString('utf8').trimEnd().split('\n');
   const last=JSON.parse(lines.at(-1));
   return {file:path.basename(journalFile),bytes:buffer.length,
    sha256:crypto.createHash('sha256').update(buffer).digest('hex'),
    eventCount,writtenCount,lineCount:lines.length,
    complete:!journalError&&eventCount===writtenCount&&lines.length===eventCount&&last.seq===eventCount,
    error:journalError};
  }catch(error){return {file:path.basename(journalFile),eventCount,writtenCount,complete:false,
   error:journalError||String(error)};}
 };
 const relevant=entry=>/(?:learn\.js|module-recovery|sw\.js|learning\/)/i.test(entry?.url||'');
 const passiveWorker=process.env.MATH_ISSUE180_SW_RUNTIME_PROBE==='1'?
  createPassiveServiceWorkerObserver({context,note:push}):null;
 async function start(){
  session=await context.newCDPSession(page);
  session.on('Network.requestWillBeSent',event=>{
   const request={url:event.request?.url||'',type:event.type,frameId:event.frameId,
    loaderId:event.loaderId,initiator:event.initiator?.type||null};
   requests.set(event.requestId,request);
   if(requests.size>1200)requests.delete(requests.keys().next().value);
   if(event.type==='Script'||event.type==='Document')push('request',{requestId:event.requestId,...request});
  });
  session.on('Network.responseReceived',event=>{
   const request=requests.get(event.requestId);
   if(event.type==='Script'||(request&&relevant(request)))
    push('response',{requestId:event.requestId,url:event.response?.url||request?.url||'',
     status:event.response?.status,fromServiceWorker:event.response?.fromServiceWorker===true,
     fromDiskCache:event.response?.fromDiskCache===true,
     fromPrefetchCache:event.response?.fromPrefetchCache===true,
     recoveryHeader:event.response?.headers?.['x-math-module-recovery']||
       event.response?.headers?.['X-Math-Module-Recovery']||null,
     mimeType:event.response?.mimeType,type:event.type,loaderId:event.loaderId});
  });
  session.on('Network.requestServedFromCache',event=>{
   const request=requests.get(event.requestId);
   if(request&&(request.type==='Script'||relevant(request)))
    push('requestServedFromCache',{requestId:event.requestId,url:request.url,type:request.type});
  });
  session.on('Network.loadingFailed',event=>{
   push('loadingFailed',{requestId:event.requestId,request:requests.get(event.requestId)||null,
    errorText:event.errorText,canceled:event.canceled===true,blockedReason:event.blockedReason||null,
    corsErrorStatus:event.corsErrorStatus||null,type:event.type});
  });
  session.on('Network.loadingFinished',event=>{
   const request=requests.get(event.requestId);
   if(request?.type==='Script')push('loadingFinished',{requestId:event.requestId,url:request.url,
    encodedDataLength:event.encodedDataLength});
  });
  requestFailureListener=request=>push('playwrightRequestFailed',
   {url:request.url(),errorText:request.failure()?.errorText||null,
    resourceType:request.resourceType()});
  page.on('requestfailed',requestFailureListener);
  consoleErrorListener=message=>{
   if(message.type()==='error')push('consoleError',{text:message.text().slice(0,900)});
  };
  page.on('console',consoleErrorListener);
  await session.send('Network.enable');
  // Playwright worker events remain usable when Chromium omits the CDP
  // ServiceWorker domain. They do not expose internal SW errors or versions.
  const observeWorker=(worker,existing=false)=>{
   if(watchedWorkers.has(worker))return;
   watchedWorkers.add(worker);
   push('playwrightServiceWorker',{url:worker.url(),existing});
   const onClose=()=>push('playwrightServiceWorkerClosed',{url:worker.url()});
   workerCloseListeners.set(worker,onClose);
   worker.on('close',onClose);
  };
  workerListener=worker=>observeWorker(worker,false);
  context.on('serviceworker',workerListener);
  for(const worker of context.serviceWorkers())observeWorker(worker,true);
  try{
   workerSession=await context.browser()?.newBrowserCDPSession?.();
   if(workerSession){
    workerSession.on('ServiceWorker.workerErrorReported',event=>{
     const error=event.errorMessage||{};
     push('serviceWorkerError',{error:String(error.errorMessage||''),sourceURL:error.sourceURL||'',
      lineNumber:error.lineNumber||null});
    });
    workerSession.on('ServiceWorker.workerVersionUpdated',event=>{
     push('serviceWorkerVersion',{versions:(event.versions||[]).map(version=>({
      scriptURL:version.scriptURL,status:version.status,runningStatus:version.runningStatus,
      controlledClientCount:version.controlledClients?.length||0}))});
    });
    workerSession.on('ServiceWorker.workerRegistrationUpdated',event=>{
     push('serviceWorkerRegistration',{registrations:(event.registrations||[]).map(reg=>({
      scopeURL:reg.scopeURL,isDeleted:reg.isDeleted===true}))});
    });
    await workerSession.send('ServiceWorker.enable');
    swNativeAvailable=true;
   }else push('serviceWorkerSessionUnavailable',{});
  }catch(error){push('serviceWorkerSessionError',{error:String(error),fallback:'playwright-serviceworker-events-and-page-snapshots'});}
  push('serviceWorkerObservationCapabilities',{nativeCdpEvents:swNativeAvailable,playwrightWorkerEvents:true,
   limitation:swNativeAvailable?null:'No native ServiceWorker error/version stream; page registration/controller/cache snapshots still available'});
  if(passiveWorker)await passiveWorker.start().catch(error=>
   push('serviceWorkerRuntimeStartupFailed',{error:String(error)}));
  push('probeStarted',{cache,startedAt,passiveWorkerRequested:!!passiveWorker});
 }
 const snapshot=async()=>{
  const pageState=await page.evaluate(async release=>{
  const raw=localStorage.getItem('math-explorer-v2');
  const controller=navigator.serviceWorker?.controller;
  const registration=await navigator.serviceWorker?.getRegistration().catch(()=>null);
  const cacheKeys=await caches.keys().catch(()=>[]);
  const stored=await caches.open(release).catch(()=>null);
  const entry=await stored?.match(new URL('learning/learn.js',location.href)).catch(()=>null);
  const swStatus=controller?await new Promise(resolve=>{
   const channel=new MessageChannel();let finished=false;
   const finish=value=>{if(finished)return;finished=true;clearTimeout(timer);channel.port1.close();resolve(value);};
   const timer=setTimeout(()=>finish({timeout:true}),1500);
   channel.port1.onmessage=event=>finish(event.data);
   try{controller.postMessage({type:'math-explorer:cache-status'},[channel.port2]);}
   catch(error){finish({error:String(error)});}
  }):null;
  const current=window.mathLesson?.snapshot?.();
  const resources=performance.getEntriesByType('resource')
   .filter(item=>/\/learning\/.*\.js|module-recovery|\/sw\.js/i.test(item.name))
   .slice(-80).map(item=>({name:item.name,initiatorType:item.initiatorType,
    startTime:item.startTime,duration:item.duration,transferSize:item.transferSize,
    encodedBodySize:item.encodedBodySize,responseStatus:item.responseStatus||0}));
  return {capturedAt:new Date().toISOString(),href:location.href,readyState:document.readyState,
   controller:controller?{scriptURL:controller.scriptURL,state:controller.state}:null,
   activeWorker:registration?.active?{scriptURL:registration.active.scriptURL,
    state:registration.active.state}:null,cacheKeys,entryCached:!!entry,
   entryStatus:entry?.status||null,entryType:entry?.headers.get('content-type')||null,
   cacheStatus:swStatus,recovery:window.mathStartupRecovery||null,
   ready:current?{id:current.id,index:current.index,view:current.view}:null,
   warning:document.querySelector('#storage-warning')?.textContent||'',
   warningVisible:document.querySelector('#storage-warning')?.hidden===false,
   raw,resources};
 },cache).catch(error=>({captureError:String(error),raw:null}));
  if(passiveWorker)pageState.serviceWorkerRuntime=await passiveWorker.snapshot()
   .catch(error=>({unavailable:true,error:String(error)}));
  return pageState;
 };
 const digest=s=>s==null?null:crypto.createHash('sha256').update(s).digest('hex');
 const metadata=value=>{
  if(!value)return null;
  const {raw,...details}=value;
  return {...details,rawBytes:typeof raw==='string'?Buffer.byteLength(raw):null,rawSha256:digest(raw)};
 };
 const persist=({label,before,after,error,status})=>{
  // The journal and its digest must describe the same immutable event set.
  // A worker may close between persistence and listener cleanup.
  closed=true;
  const prefix=path.join(out,label+'-native-startup');
  if(status==='failure'){
   if(typeof before?.raw==='string')fs.writeFileSync(prefix+'-before-storage.txt',before.raw);
   if(typeof after?.raw==='string')fs.writeFileSync(prefix+'-after-storage.txt',after.raw);
  }
  fs.writeFileSync(prefix+'.json',JSON.stringify({
   schema:'p9-fraction-operations-native-startup/1',label,status,
   probeStartedAt:startedAt,error:error?String(error):null,
   before:metadata(before),after:metadata(after),
   serviceWorkerObservation:{nativeCdpEvents:swNativeAvailable,playwrightWorkerEvents:true,
    passiveWorkerRequested:!!passiveWorker,
    playwrightWorkersObserved:watchedWorkers.size},
   rawIdentical:typeof before?.raw==='string'&&typeof after?.raw==='string'?
    before.raw===after.raw:null,firstFailures,journal:journalSummary(),
   eventsTailTruncated:eventCount>events.length,events
  },null,2));
 };
 async function success({label,before}){
  const after=await snapshot();
  persist({label,before,after,error:null,status:'success'});
 }
 async function failure({label,before=null,error}){
  if(savedFailure)return;
  savedFailure=true;
  const after=await snapshot();
  persist({label,before,after,error,status:'failure'});
 }
 async function close(){
  closed=true;
  passiveWorker?.close();
  if(workerListener){context.off('serviceworker',workerListener);workerListener=null;}
  if(requestFailureListener){page.off('requestfailed',requestFailureListener);requestFailureListener=null;}
  if(consoleErrorListener){page.off('console',consoleErrorListener);consoleErrorListener=null;}
  for(const [worker,onClose] of workerCloseListeners)worker.off('close',onClose);
  workerCloseListeners.clear();
  if(session){await session.detach().catch(()=>{});session=null;}
  if(workerSession){await workerSession.detach().catch(()=>{});workerSession=null;}
 }
 return {start,snapshot,success,failure,close};
}
module.exports={createReloadStartupProbe};
