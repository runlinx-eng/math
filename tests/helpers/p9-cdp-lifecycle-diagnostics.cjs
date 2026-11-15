// Observe Chromium's page/SW lifecycle without routing, pausing, evaluating in
// the page, changing cache policy, or attaching to the Service Worker target.
// Keep the stream open through browser.close(): cleanup aborts are evidence of
// cleanup, and must not be mistaken for the first failed module request.
const fs=require('node:fs'),path=require('node:path');
async function observeCDPLifecycle(page,{out,base,label,file}){
 const stream=fs.createWriteStream(path.join(out,file)),requests=new Set();
 let sequence=0,closed=false,writeError=null;
 stream.on('error',error=>{writeError=String(error);});
 const mark=(kind,data={})=>{
  if(closed||writeError)return;
  stream.write(JSON.stringify({sequence:++sequence,at:new Date().toISOString(),
   nodeMonotonicNs:process.hrtime.bigint().toString(),label:label(),kind,...data})+'\n');
 };
 const result={file,mark,async finish(){
  mark('diagnostic-stream-end',{writeError});closed=true;
  await new Promise(resolve=>{if(stream.destroyed)resolve();else {stream.once('error',resolve);stream.end(resolve);}});
  return {file,events:sequence,writeError};
 }};
 mark('diagnostic-stream-start',{base});
 try{
  const cdp=await page.context().newCDPSession(page);
  cdp.on('Network.requestWillBeSent',event=>{
   if(!event.request.url.startsWith(base)&&!requests.has(event.requestId))return;
   requests.add(event.requestId);
   const {requestId,loaderId,frameId,timestamp,wallTime,documentURL,type,initiator,redirectResponse}=event;
   mark('Network.requestWillBeSent',{requestId,loaderId,frameId,timestamp,wallTime,documentURL,type,
    request:{url:event.request.url,method:event.request.method},
    initiator:{type:initiator.type,url:initiator.url,lineNumber:initiator.lineNumber,
     stack:initiator.stack?.callFrames?.slice(0,4)},
    redirectResponse:redirectResponse?{url:redirectResponse.url,status:redirectResponse.status}:undefined});
  });
  cdp.on('Network.responseReceived',event=>{
   if(!requests.has(event.requestId))return;
   const {requestId,loaderId,frameId,timestamp,type,response:r}=event;
   mark('Network.responseReceived',{requestId,loaderId,frameId,timestamp,type,response:{
    url:r.url,status:r.status,mimeType:r.mimeType,protocol:r.protocol,
    fromServiceWorker:r.fromServiceWorker,serviceWorkerResponseSource:r.serviceWorkerResponseSource,
    cacheStorageCacheName:r.cacheStorageCacheName,fromDiskCache:r.fromDiskCache,
    fromPrefetchCache:r.fromPrefetchCache,encodedDataLength:r.encodedDataLength,timing:r.timing}});
  });
  for(const event of ['Network.dataReceived','Network.loadingFinished','Network.loadingFailed'])cdp.on(event,data=>{
   if(!requests.has(data.requestId))return;mark(event,data);
   if(event!=='Network.dataReceived')requests.delete(data.requestId);
  });
  for(const event of ['Page.frameAttached','Page.frameNavigated','Page.frameDetached','Page.lifecycleEvent',
   'Runtime.executionContextCreated','Runtime.executionContextDestroyed','Runtime.executionContextsCleared',
   'ServiceWorker.workerVersionUpdated','ServiceWorker.workerRegistrationUpdated','ServiceWorker.workerErrorReported',
   'Inspector.targetCrashed','Inspector.detached'])cdp.on(event,data=>mark(event,data));
  page.on('crash',()=>mark('playwright-page-crash'));
  page.on('close',()=>mark('playwright-page-close'));
  // These only enable observation. Never setCacheDisabled, bypassServiceWorker,
  // route, auto-attach/waitForDebugger, or wake/stop a worker for this recording.
  for(const [method,params] of [['Network.enable',{}],['Page.enable',{}],
   ['Runtime.enable',{}],['Page.setLifecycleEventsEnabled',{enabled:true}],['ServiceWorker.enable',{}]]){
   try{await cdp.send(method,params);mark('cdp-observer-enabled',{method});}
   catch(error){mark('cdp-observer-unavailable',{method,error:String(error)});}
  }
 }catch(error){mark('cdp-observer-unavailable',{error:String(error)});}
 return result;
}
module.exports={observeCDPLifecycle};
