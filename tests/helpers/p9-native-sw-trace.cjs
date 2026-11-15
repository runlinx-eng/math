// M141-only diagnostic protocol surface. This never retries a navigation,
// attaches to a worker, intercepts a request, or changes the readiness timeout.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const limited=async (promise,stage)=>{
 let timer;
 try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(`native trace ${stage} exceeded 10000ms`)),10000);})]);}
 finally{clearTimeout(timer);}
};
async function observeNativeSWTrace(browser,{out,label,note=()=>{}}){
 const report={status:'starting',file:'native-service-worker-trace.json',metadataFile:'native-service-worker-trace-meta.json',
  eventsFile:'native-service-worker-trace-events.jsonl',categories:['ServiceWorker'],
  recordMode:'recordContinuously',traceBufferSizeInKb:16384,
  wholeSequenceGuaranteed:false,dataLossOccurred:null,errors:[],bufferUsage:[]};
 let cdp,started=false,stopping=null,cleanup=false,complete;
 const persist=()=>{try{fs.writeFileSync(path.join(out,report.metadataFile),JSON.stringify(report,null,2));}catch(error){report.errors.push({stage:'metadata-write',error:String(error)});}};
 const record=(kind,data={})=>{
  const event={at:new Date().toISOString(),nodeMonotonicNs:process.hrtime.bigint().toString(),label:label(),kind,...data};
  try{fs.appendFileSync(path.join(out,report.eventsFile),JSON.stringify(event)+'\n');}catch(error){report.errors.push({stage:'event-write',error:String(error)});}
  try{note(kind,data);}catch(error){report.errors.push({stage:'lifecycle-marker',error:String(error)});}
  return event;
 };
 const fail=(stage,error)=>{
  report.status='error';report.errors.push({stage,error:String(error)});
  record('native-trace-error',{stage,error:String(error)});
 };
 const finish=reason=>{
  if(stopping)return stopping;
  if(!started){persist();return Promise.resolve(report);}
  report.status='stopping';report.stopReason=reason;
  report.stopRequested=record('native-trace-stop-requested',{reason});persist();
  // Send end immediately; do not wait for the original readiness timeout/dump.
  stopping=(async()=>{
   let descriptor,stream,stage='trace-end-ack',bytes,sha256;
   try{
    report.endCommandSent=record('native-trace-end-command-sent');persist();
    // Record acknowledgement at receipt, even if it arrives after our deadline.
    await limited(cdp.send('Tracing.end').then(response=>{
     report.endAcknowledged=record('native-trace-end-acknowledged',{response});persist();return response;
    }),stage);
    stage='trace-complete-wait';
    const finished=await limited(complete,stage);
    stage='trace-stream-validation';stream=finished.stream;
    if(!finished.stream)throw Error('Tracing.tracingComplete has no stream');
    if(typeof finished.dataLossOccurred!=='boolean')throw Error('Tracing.tracingComplete has no boolean dataLossOccurred');
    if(finished.traceFormat&&finished.traceFormat!=='json')throw Error('unexpected trace format');
    if(finished.streamCompression&&finished.streamCompression!=='none')throw Error('unexpected trace compression');
    const hash=crypto.createHash('sha256');bytes=0;stage='trace-file-open';
    descriptor=fs.openSync(path.join(out,report.file),'w');
    record('native-trace-stream-read-started',{stream});
    for(;;){
     stage='trace-stream-read';
     const part=await limited(cdp.send('IO.read',{handle:stream,size:1048576}),stage);
     const data=Buffer.from(part.data,part.base64Encoded?'base64':'utf8');stage='trace-file-write';
     for(let offset=0;offset<data.length;){const written=fs.writeSync(descriptor,data,offset,data.length-offset);if(!written)throw Error('trace file write made no progress');offset+=written;}
     hash.update(data);bytes+=data.length;
     if(part.eof)break;
    }
    sha256=hash.digest('hex');record('native-trace-stream-read-complete',{bytes,sha256});
   }catch(error){fail(stage,error);}
   // Preserve the first failure if closing the file or protocol stream also fails.
   if(descriptor!==undefined)try{fs.closeSync(descriptor);}catch(error){fail('trace-file-close',error);}
   stream=stream||report.tracingComplete?.stream;
   if(stream)try{
    await limited(cdp.send('IO.close',{handle:stream}),'trace-stream-close');
    record('native-trace-stream-closed',{stream});
   }catch(error){fail('trace-stream-close',error);}
   if(!report.errors.length){
    report.bytes=bytes;report.sha256=sha256;report.status='saved';
    record('native-trace-saved',{bytes,sha256,dataLossOccurred:report.dataLossOccurred});
    if(report.errors.length)report.status='error';
   }else report.status='error';
   persist();return report;
  })();
  return stopping;
 };
 try{
  cdp=await limited(browser.newBrowserCDPSession(),'browser-session');
  complete=new Promise(resolve=>cdp.once('Tracing.tracingComplete',finished=>{
   // This callback can precede the end acknowledgement or follow a deadline.
   // Persist what CDP actually delivered without changing an earlier error.
   report.tracingComplete=finished;
   report.dataLossOccurred=typeof finished.dataLossOccurred==='boolean'?finished.dataLossOccurred:null;
   report.tracingCompleteReceived=record('native-trace-complete',finished);persist();resolve(finished);
  }));
  cdp.on('Tracing.bufferUsage',data=>{report.bufferUsage.push(data);record('native-trace-buffer-usage',data);});
  report.startRequested=record('native-trace-start-requested');persist();
  // M141 supports an explicit KiB buffer. Keep a 16 MiB tail window instead of
  // the 200 MiB default; this does not promise full-sequence or lossless capture.
  await limited(cdp.send('Tracing.start',{transferMode:'ReturnAsStream',streamFormat:'json',streamCompression:'none',
   bufferUsageReportingInterval:1000,traceConfig:{recordMode:report.recordMode,traceBufferSizeInKb:report.traceBufferSizeInKb,
    includedCategories:['ServiceWorker'],excludedCategories:['*'],enableSampling:false,enableSystrace:false,enableArgumentFilter:false}}),'trace-start');
  started=true;report.status='recording';report.started=record('native-trace-started',{categories:report.categories});
 }catch(error){report.status='unavailable';report.errors.push({stage:'trace-start',error:String(error)});record('native-trace-unavailable',{error:String(error)});}
 persist();
 return {finish,report,beginCleanup(){cleanup=true;},async observePage(page,{base}){
  const state={closing:false,mainFrameId:null,targetLoader:null},requests=new Map();
  const observer={beforeClose(){state.closing=true;}};
  if(!started||stopping)return observer;
  try{
   const session=await limited(page.context().newCDPSession(page),'page-session');
   session.on('Page.frameNavigated',({frame})=>{
    if(!frame.parentId){state.mainFrameId=frame.id;if(!state.targetLoader)state.targetLoader=frame.loaderId;}
   });
   session.on('Network.requestWillBeSent',event=>{
    if(!event.request.url.startsWith(base))return;
    const request={requestId:event.requestId,loaderId:event.loaderId,frameId:event.frameId,
     type:event.type,url:event.request.url,timestamp:event.timestamp,wallTime:event.wallTime};
    requests.set(event.requestId,request);
    if(event.type==='Document'&&event.frameId&&event.loaderId&&(!state.mainFrameId||event.frameId===state.mainFrameId)){
     state.mainFrameId=event.frameId;state.targetLoader=event.loaderId;
    }
   });
   session.on('Network.responseReceived',event=>{const request=requests.get(event.requestId);if(request)request.response={
    status:event.response.status,mimeType:event.response.mimeType,fromServiceWorker:event.response.fromServiceWorker,
    serviceWorkerResponseSource:event.response.serviceWorkerResponseSource,cacheStorageCacheName:event.response.cacheStorageCacheName};});
   session.on('Network.loadingFinished',event=>requests.delete(event.requestId));
   session.on('Network.loadingFailed',event=>{
    const request=requests.get(event.requestId);requests.delete(event.requestId);
    if(cleanup||state.closing||stopping||!request||request.type!=='Script'||!request.loaderId||!request.frameId||
     request.loaderId!==state.targetLoader||request.frameId!==state.mainFrameId)return;
    void finish({kind:'first-current-main-loader-script-failure',request,event,
     mainFrameId:state.mainFrameId,targetLoader:state.targetLoader});
   });
   await limited(session.send('Network.enable'),'network-enable');await limited(session.send('Page.enable'),'page-enable');
  }catch(error){report.errors.push({stage:'page-observer',error:String(error)});record('native-trace-page-observer-error',{error:String(error)});persist();}
  return observer;
 }};
}
module.exports={observeNativeSWTrace};
