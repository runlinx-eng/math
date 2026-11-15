// Read-only Chromium first-error probe for the authentic fraction-operations flow.
// Never retries navigation, clears caches, adjusts readiness timeouts or edits a learner record.
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

function createReloadStartupProbe({context,page,out,cache}){
 const events=[],requests=new Map();
 let session=null,savedFailure=false;
 const startedAt=new Date().toISOString();
 const push=(kind,payload)=>{
  events.push({kind,at:new Date().toISOString(),...payload});
  if(events.length>700)events.splice(0,events.length-700);
 };
 const relevant=entry=>/(?:learn\.js|module-recovery|sw\.js|learning\/)/i.test(entry?.url||'');
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
     mimeType:event.response?.mimeType,type:event.type,loaderId:event.loaderId});
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
  page.on('requestfailed',request=>push('playwrightRequestFailed',
   {url:request.url(),errorText:request.failure()?.errorText||null,
    resourceType:request.resourceType()}));
  page.on('console',message=>{
   if(message.type()==='error')push('consoleError',{text:message.text().slice(0,900)});
  });
  await session.send('Network.enable');
  push('probeStarted',{cache,startedAt});
 }
 const snapshot=async()=>page.evaluate(async release=>{
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
 const digest=s=>s==null?null:crypto.createHash('sha256').update(s).digest('hex');
 const metadata=value=>{
  if(!value)return null;
  const {raw,...details}=value;
  return {...details,rawBytes:typeof raw==='string'?Buffer.byteLength(raw):null,rawSha256:digest(raw)};
 };
 const persist=({label,before,after,error,status})=>{
  const prefix=path.join(out,label+'-native-startup');
  if(status==='failure'){
   if(typeof before?.raw==='string')fs.writeFileSync(prefix+'-before-storage.txt',before.raw);
   if(typeof after?.raw==='string')fs.writeFileSync(prefix+'-after-storage.txt',after.raw);
  }
  fs.writeFileSync(prefix+'.json',JSON.stringify({
   schema:'p9-fraction-operations-native-startup/1',label,status,
   probeStartedAt:startedAt,error:error?String(error):null,
   before:metadata(before),after:metadata(after),
   rawIdentical:typeof before?.raw==='string'&&typeof after?.raw==='string'?
    before.raw===after.raw:null,events
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
  if(session){await session.detach().catch(()=>{});session=null;}
 }
 return {start,snapshot,success,failure,close};
}
module.exports={createReloadStartupProbe};
