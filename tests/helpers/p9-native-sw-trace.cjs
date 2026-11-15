// M141-only diagnostic protocol surface. This never retries a navigation,
// attaches to a worker, intercepts a request, or changes the readiness timeout.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const limited=async promise=>{
 let timer;
 try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('native trace diagnostic command exceeded 10000ms')),10000);})]);}
 finally{clearTimeout(timer);}
};
async function observeNativeSWTrace(browser,{out,label,note=()=>{}}){
 const report={status:'starting',file:'native-service-worker-trace.json',metadataFile:'native-service-worker-trace-meta.json',
  eventsFile:'native-service-worker-trace-events.jsonl',categories:['ServiceWorker'],
  wholeSequenceGuaranteed:false,dataLossOccurred:null,errors:[],bufferUsage:[]};
 let cdp,started=false,stopping=null,cleanup=false,complete;
 const persist=()=>{try{fs.writeFileSync(path.join(out,report.metadataFile),JSON.stringify(report,null,2));}catch(error){report.errors.push({stage:'metadata-write',error:String(error)});}};
 const record=(kind,data={})=>{
  const event={at:new Date().toISOString(),nodeMonotonicNs:process.hrtime.bigint().toString(),label:label(),kind,...data};
  try{fs.appendFileSync(path.join(out,report.eventsFile),JSON.stringify(event)+'\n');}catch(error){report.errors.push({stage:'event-write',error:String(error)});}
  try{note(kind,data);}catch(error){report.errors.push({stage:'lifecycle-marker',error:String(error)});}
 };
 const finish=reason=>{
  if(stopping)return stopping;
  if(!started){persist();return Promise.resolve(report);}
  report.status='stopping';report.stopReason=reason;
  record('native-trace-stop-requested',{reason});persist();
  // Send end immediately; do not wait for the original readiness timeout/dump.
  stopping=(async()=>{
   let descriptor;
   try{
    await limited(cdp.send('Tracing.end'));
    const finished=await limited(complete);report.tracingComplete=finished;
    report.dataLossOccurred=finished.dataLossOccurred;
    record('native-trace-complete',finished);
    if(!finished.stream)throw Error('Tracing.tracingComplete has no stream');
    if(finished.traceFormat&&finished.traceFormat!=='json')throw Error('unexpected trace format');
    if(finished.streamCompression&&finished.streamCompression!=='none')throw Error('unexpected trace compression');
    const hash=crypto.createHash('sha256');let bytes=0;
    descriptor=fs.openSync(path.join(out,report.file),'w');
    try{
     for(;;){
      const part=await limited(cdp.send('IO.read',{handle:finished.stream,size:1048576}));
      const data=Buffer.from(part.data,part.base64Encoded?'base64':'utf8');
      for(let offset=0;offset<data.length;){const written=fs.writeSync(descriptor,data,offset,data.length-offset);if(!written)throw Error('trace file write made no progress');offset+=written;}
      hash.update(data);bytes+=data.length;
      if(part.eof)break;
     }
    }finally{fs.closeSync(descriptor);descriptor=undefined;await limited(cdp.send('IO.close',{handle:finished.stream}));}
    report.bytes=bytes;report.sha256=hash.digest('hex');report.status='saved';
    record('native-trace-saved',{bytes,sha256:report.sha256,dataLossOccurred:report.dataLossOccurred});
   }catch(error){
    if(descriptor!==undefined)try{fs.closeSync(descriptor);}catch{}
    report.status='error';report.errors.push({stage:'trace-stop-or-stream',error:String(error)});
    record('native-trace-error',{error:String(error)});
   }
   persist();return report;
  })();
  return stopping;
 };
 try{
  cdp=await limited(browser.newBrowserCDPSession());
  complete=new Promise(resolve=>cdp.once('Tracing.tracingComplete',resolve));
  cdp.on('Tracing.bufferUsage',data=>{report.bufferUsage.push(data);record('native-trace-buffer-usage',data);});
  await limited(cdp.send('Tracing.start',{transferMode:'ReturnAsStream',streamFormat:'json',streamCompression:'none',
   bufferUsageReportingInterval:1000,traceConfig:{recordMode:'recordContinuously',
    includedCategories:['ServiceWorker'],excludedCategories:['*'],enableSampling:false,enableSystrace:false,enableArgumentFilter:false}}));
  started=true;report.status='recording';record('native-trace-started',{categories:report.categories});
 }catch(error){report.status='unavailable';report.errors.push({stage:'trace-start',error:String(error)});record('native-trace-unavailable',{error:String(error)});}
 persist();
 return {finish,report,beginCleanup(){cleanup=true;},async observePage(page,{base}){
  const state={closing:false,mainFrameId:null,targetLoader:null},requests=new Map();
  const observer={beforeClose(){state.closing=true;}};
  if(!started||stopping)return observer;
  try{
   const session=await limited(page.context().newCDPSession(page));
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
   await limited(session.send('Network.enable'));await limited(session.send('Page.enable'));
  }catch(error){report.errors.push({stage:'page-observer',error:String(error)});record('native-trace-page-observer-error',{error:String(error)});persist();}
  return observer;
 }};
}
module.exports={observeNativeSWTrace};
