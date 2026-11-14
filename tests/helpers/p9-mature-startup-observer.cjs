// Issue #180 diagnostic only. No routing, retries, emulation, worker attachment,
// learner actions, cache writes, or response-body reads during normal loading.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const assert=require('node:assert/strict'),crypto=require('node:crypto'),zlib=require('node:zlib');
const {execFileSync}=require('node:child_process'),{once}=require('node:events'),{pipeline}=require('node:stream/promises');
const baseline='f7c8f1103207be217af014163e086b007728d0d6';
const originalFile='tests/p9-mature-expansion-browser.cjs',originalSHA256='9c710a88067b11c37c209bface4fc2530105d410588546127d8d5a61a9f28a6a';
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const write=(file,value)=>fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');
const bounded=async(promise,ms,label)=>{let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(label+' timed out')),ms);})]);}finally{clearTimeout(timer);}};
const stripHooks=source=>source.replace(/\/\* ISSUE180 OBSERVE BEGIN \*\/[\s\S]*?\/\* ISSUE180 OBSERVE END \*\//g,'');
function verifySource(root,diagnosticFile){
 const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
 const original=fs.readFileSync(path.join(root,originalFile),'utf8'),diagnostic=fs.readFileSync(diagnosticFile,'utf8');
 assert.equal(hash(original),originalSHA256,'freeze the exact original full mature expansion script');
 assert.equal(stripHooks(diagnostic),original,'removing observation hooks must reproduce the original script byte for byte');
 git(['diff','--exit-code','HEAD','--','dist']);
 const productTreeSha=git(['rev-parse','HEAD:dist']);assert.equal(productTreeSha,git(['rev-parse',baseline+':dist']),'serve the exact failing PR169 product tree');
 const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
 const checkout=git(['rev-parse','HEAD']);
 return {headSha:event.pull_request?.head?.sha||checkout,testedCheckoutSha:checkout,treeSha:git(['rev-parse','HEAD^{tree}']),productBaselineSha:baseline,productTreeSha,
  runId:process.env.GITHUB_RUN_ID||null,attempt:process.env.GITHUB_RUN_ATTEMPT||null,originalFile,originalSHA256,diagnosticSHA256:hash(diagnostic),originalRestoredByteForByte:true,
  originalViewports:[[1440,900],[1280,720]],originalNativePositions:53,originalAssociatedPositions:2,originalExplorationPathsPerViewport:4,readinessTimeoutMs:20000,automaticRetries:0,
  diagnosticOnly:true,countsTowardAcceptance:false,productModified:false,swDebuggerOrRuntimeAttached:false,networkEmulated:false,
  observerInfluence:'CDP Network/ServiceWorker subscriptions, native trace, NetLog and sparse host sampling can affect timing. Post-failure body reads occur only after the first observed failure.'};
}
function runnerSnapshot(){
 const read=file=>{try{return fs.readFileSync(file,'utf8');}catch(error){return {unavailable:String(error)};}};
 const rows=execFileSync('ps',['-eo','pid=,ppid=,rss=,vsz=,nlwp=,comm='],{encoding:'utf8'}).trim().split('\n').map(line=>{
  const [pid,ppid,rssKiB,virtualKiB,threads,...command]=line.trim().split(/\s+/);return {pid:Number(pid),ppid:Number(ppid),rssKiB:Number(rssKiB),virtualKiB:Number(virtualKiB),threads:Number(threads),command:command.join(' ')};
 });
 const owned=new Set([process.pid]);let prior=0;while(prior!==owned.size){prior=owned.size;for(const row of rows)if(owned.has(row.ppid))owned.add(row.pid);}
 const processes=rows.filter(row=>owned.has(row.pid)).map(row=>{try{return {...row,openFDs:fs.readdirSync('/proc/'+row.pid+'/fd').length};}catch(error){return {...row,openFDError:String(error)};}});
 const disk=fs.statfsSync(process.cwd());
 return {at:new Date().toISOString(),processes,hostMemory:{totalBytes:os.totalmem(),freeBytes:os.freemem()},disk:{blockSize:disk.bsize,availableBlocks:disk.bavail,freeFiles:disk.ffree},
  meminfo:read('/proc/meminfo'),memoryPressure:read('/proc/pressure/memory'),cgroupMemoryEvents:read('/sys/fs/cgroup/memory.events'),cgroupMemoryCurrent:read('/sys/fs/cgroup/memory.current'),cgroupMemoryMax:read('/sys/fs/cgroup/memory.max')};
}
function nativeTraceCapture(cdp,file,categories,diagnosticError){
 const lifecycle={file:path.basename(file),categories,traceConfig:{recordMode:'recordContinuously',traceBufferSizeInKb:8192,includedCategories:categories.selected,excludedCategories:['*']},events:[]};
 const note=(kind,data={})=>{lifecycle.events.push({at:new Date().toISOString(),kind,...data});write(file+'.lifecycle.json',lifecycle);};
 let resolveComplete,rejectComplete,stopState,abandoned=null,streamHandle=null;
 const completed=new Promise((resolve,reject)=>{resolveComplete=resolve;rejectComplete=reject;});completed.catch(()=>{});
 const onComplete=value=>{note('tracing-complete',value);resolveComplete(value);};cdp.on('Tracing.tracingComplete',onComplete);note('listener-registered');
 return {
  async start(){note('start-sent');await cdp.send('Tracing.start',{transferMode:'ReturnAsStream',traceConfig:lifecycle.traceConfig});note('start-acknowledged');},
  stop(reason){
   if(stopState)return stopState;
   note('end-sent',{reason});const acknowledged=cdp.send('Tracing.end').then(()=>note('end-acknowledged'));
   const completionCheck=acknowledged.then(()=>bounded(completed,10000,'native trace completion')).catch(error=>{diagnosticError('native-trace-completion',error);});
   const exported=(async()=>{
    await acknowledged;const completion=await completed;assert.equal(typeof completion.stream,'string');streamHandle=completion.stream;if(abandoned)throw abandoned;
    const gzip=zlib.createGzip(),destination=fs.createWriteStream(file),finished=pipeline(gzip,destination);finished.catch(()=>{});
    const digest=crypto.createHash('sha256');let bytes=0;note('stream-read-started');
    try{
     for(;;){if(abandoned)throw abandoned;const chunk=await cdp.send('IO.read',{handle:completion.stream,size:1024*1024});if(abandoned)throw abandoned;const data=Buffer.from(chunk.data,chunk.base64Encoded?'base64':'utf8');bytes+=data.length;digest.update(data);if(!gzip.write(data))await once(gzip,'drain');if(chunk.eof)break;}
     gzip.end();await finished;const result={file:path.basename(file),uncompressedBytes:bytes,uncompressedSHA256:digest.digest('hex'),gzipSHA256:hash(fs.readFileSync(file)),completion,
      retention:'8 MiB native circular buffer; recent events only, not a full history'};note('stream-saved',result);return result;
    }catch(error){gzip.destroy();await finished.catch(()=>{});throw error;}
    finally{await cdp.send('IO.close',{handle:completion.stream}).catch(error=>note('stream-close-error',{error:String(error)}));}
   })();
   exported.catch(error=>{diagnosticError('native-trace-export',error);note('capture-error',{error:String(error)});}).finally(()=>cdp.off('Tracing.tracingComplete',onComplete));
   stopState={completionCheck,exported};return stopState;
  },
  abandon(error){abandoned=error;note('preservation-abandoned',{error:String(error)});rejectComplete(error);cdp.off('Tracing.tracingComplete',onComplete);if(streamHandle)cdp.send('IO.close',{handle:streamHandle}).catch(problem=>note('abandon-stream-close-error',{error:String(problem)}));}
 };
}
function createStartupObserver({root,out,diagnosticFile}){
 const provenance=verifySource(root,diagnosticFile);
 assert.ok(!fs.existsSync(out),'never overwrite an earlier diagnostic');fs.mkdirSync(out,{recursive:true});
 const manifest=execFileSync('git',['ls-files','dist'],{cwd:root,encoding:'utf8'}).trim().split('\n').map(file=>({file,bytes:fs.statSync(path.join(root,file)).size,sha256:hash(fs.readFileSync(path.join(root,file)))}));
 write(path.join(out,'product-source-manifest.json'),{provenance,files:manifest});
 const errors=[],pages=[],nativeFailures=[],pendingCaptures=[],removeListeners=[];let trace,browserCDP,originalOutcome='incomplete',originalError=null,originalCounts=null,finished=false;
 const fail=(phase,error)=>{const item={at:new Date().toISOString(),phase,error:String(error)};errors.push(item);write(path.join(out,'diagnostic-errors.json'),errors);if(finished)save();};
 const host=name=>{if(finished)return;try{write(path.join(out,'runner-'+name+'.json'),runnerSnapshot());}catch(error){fail('host-'+name,error);}};
 const eventFile=fs.openSync(path.join(out,'lifecycle.jsonl'),'wx');
 const event=(kind,data={})=>{if(!finished)fs.writeSync(eventFile,JSON.stringify({at:new Date().toISOString(),kind,...data})+'\n');};
 const listen=(target,name,listener)=>{target.on(name,listener);removeListeners.push(()=>target.off(name,listener));};
 const save=()=>write(path.join(out,'report.json'),{provenance,originalOutcome,originalError,originalCounts,nativeFailures,diagnosticErrors:errors,pages:pages.map(value=>value.summary),rootCauseResolved:false,acceptanceClaim:false});
 const stop=reason=>{if(trace)trace.stop(reason);};
 async function afterNativeFailure(page,cdp,base,failed,requests){
  // The first CDP failure and its preceding ring are already frozen on disk.
  // These later observations cannot certify what the cache contained earlier.
  const prefix='first-native-failure',failedRequests=[...requests.values()].filter(value=>value.failure),successful=[...requests.values()].filter(value=>value.finished&&!value.failure&&value.url.endsWith('.js')).slice(0,3);
  const urls=[...new Set([...failedRequests.map(value=>value.url),base+'learn.html',base+'learning/learn.js',...successful.map(value=>value.url)])];
  const state=await bounded(page.evaluate(async urls=>{
   const limit=async promise=>{let timer;try{return await Promise.race([promise,new Promise(resolve=>{timer=setTimeout(()=>resolve({diagnosticTimeoutMs:3000}),3000);})]);}catch(error){return {diagnosticError:String(error)};}finally{clearTimeout(timer);}};
   const controller=navigator.serviceWorker.controller,release=controller?new URL(controller.scriptURL).searchParams.get('release'):null,keys=await caches.keys();
   const cache=release&&keys.includes(release)?await caches.open(release):null;
   const bodies=await Promise.all(urls.map(url=>limit((async()=>{
    if(!cache)return {url,release,missingCurrentCache:true};const response=await cache.match(url);if(!response)return {url,release,missing:true};
    const body=await response.arrayBuffer(),digest=await crypto.subtle.digest('SHA-256',body);
    return {url,release,status:response.status,headers:Object.fromEntries(response.headers),bytes:body.byteLength,sha256:Array.from(new Uint8Array(digest)).map(value=>value.toString(16).padStart(2,'0')).join('')};
   })())));
   return {at:new Date().toISOString(),url:location.href,readyState:document.readyState,controller:controller?.scriptURL||null,cacheKeys:keys,release,bodies,
    snapshot:window.mathLesson?.snapshot()||null,title:document.querySelector('#title')?.textContent,work:document.querySelector('#work')?.textContent,raw:localStorage.getItem('math-explorer-v2'),
    resources:performance.getEntriesByType('resource').map(({name,duration,transferSize,encodedBodySize,decodedBodySize})=>({name,duration,transferSize,encodedBodySize,decodedBodySize}))};
  },urls),5000,'post-failure cache body observations').catch(error=>({diagnosticError:String(error)}));
  if(typeof state.raw==='string'){fs.writeFileSync(path.join(out,prefix+'-storage.txt'),state.raw);state.storage=prefix+'-storage.txt';delete state.raw;}
  if(state.bodies)for(const body of state.bodies){if(!body.url)continue;const file='dist/'+new URL(body.url).pathname.replace(/^\//,'');body.source=manifest.find(value=>value.file===file)||null;body.matchesSource=body.source&&typeof body.sha256==='string'?body.sha256===body.source.sha256&&body.bytes===body.source.bytes:null;}
  write(path.join(out,prefix+'-post-cache-bodies.json'),{provenance,firstFailure:failed,postFailureOnly:true,cacheModified:false,...state});
  const responseBodies=await Promise.all(failedRequests.map(async request=>{try{const body=await bounded(cdp.send('Network.getResponseBody',{requestId:request.requestId}),1500,'failed response body'),bytes=Buffer.from(body.body,body.base64Encoded?'base64':'utf8');return {requestId:request.requestId,url:request.url,bytes:bytes.length,sha256:hash(bytes)};}catch(error){return {requestId:request.requestId,url:request.url,error:String(error)};}}));
  write(path.join(out,prefix+'-failed-response-bodies.json'),{postFailureOnly:true,responses:responseBodies});
  const html=await bounded(page.content(),2000,'post-failure document').catch(error=>({diagnosticError:String(error)}));if(typeof html==='string')fs.writeFileSync(path.join(out,prefix+'.html'),html);else write(path.join(out,prefix+'-document-error.json'),html);
  await page.screenshot({path:path.join(out,prefix+'.png'),fullPage:true}).catch(error=>fail('first-failure-screenshot',error));
 }
 return {
  launchArguments:['--log-net-log='+path.join(out,'browser-netlog.json')],
  async startBrowser(browser){
   provenance.browserVersion=browser.version();provenance.playwrightVersion=require((process.env.MATH_PLAYWRIGHT_MODULE||'playwright')+'/package.json').version;host('before-product');
   browserCDP=await browser.newBrowserCDPSession();
   try{
    const available=(await browserCDP.send('Tracing.getCategories')).categories,requested=['ServiceWorker','CacheStorage','loading','Blob','disabled-by-default-v8.compile'];
    const categories={available,requested,selected:requested.filter(value=>available.includes(value)),missing:requested.filter(value=>!available.includes(value))};
    write(path.join(out,'native-trace-categories.json'),categories);assert.equal(categories.missing.length,0,'record all explicitly requested trace categories');
    trace=nativeTraceCapture(browserCDP,path.join(out,'native-trace.json.gz'),categories,fail);await trace.start();
   }catch(error){fail('native-trace-start',error);trace=null;}
   save();
  },
  async observePage(page,{base,label}){
   const number=pages.length+1,summary={number,viewport:page.viewportSize(),base,navigations:0,contextClosing:false},entry={summary,page};pages.push(entry);
   const cdp=await page.context().newCDPSession(page),recent=[],pending=new Map();let cursor=0,currentLoaderId=null,currentURL=null,currentLabel=null,requests=new Map();
   const mainFrameId=(await cdp.send('Page.getFrameTree')).frameTree.frame.id;
   const ring=value=>{if(recent.length<4000)recent.push(value);else{recent[cursor]=value;cursor=(cursor+1)%4000;}};
   const navigationSnapshot=reason=>{if(currentLoaderId)write(path.join(out,`page-${number}-navigation-${String(summary.navigations).padStart(4,'0')}.json`),{provenance,at:new Date().toISOString(),navigationLabel:currentLabel,observedLabel:label(),reason,loaderId:currentLoaderId,url:currentURL,requests:[...requests.values()]});};
   entry.close=()=>{summary.contextClosing=true;navigationSnapshot('before-context-close');event('context-closing',{number,label:label()});};
   // Freeze the current request state at the original assertion failure, even
   // when Chromium has emitted neither loadingFailed nor a pageerror.
   entry.captureOriginalFailure=async error=>{
    const frozen=JSON.parse(JSON.stringify({provenance,at:new Date().toISOString(),error:String(error),number,
     navigationLabel:currentLabel,observedLabel:label(),pageURL:page.url(),currentLoaderId,currentURL,
     currentRequests:[...requests.values()],unfinishedCurrentRequests:[...requests.values()].filter(value=>!value.finished&&!value.failure),
     pendingRequestsAllLoaders:[...pending.values()],contextClosing:summary.contextClosing,
     postOriginalFailureOnly:true,requestStateFrozenBeforeDOMRead:true,diagnosticOnly:true,acceptanceClaim:false}));
    const destination=path.join(out,'original-failure.json');write(destination,frozen);
    const state=await bounded(page.evaluate(()=>{
     const warning=document.querySelector('#storage-warning'),style=warning?getComputedStyle(warning):null;
     const warningVisible=!!warning&&!warning.hidden&&style.display!=='none'&&style.visibility!=='hidden'&&warning.getClientRects().length>0;
     let snapshot=null,snapshotError=null;try{snapshot=window.mathLesson?.snapshot()||null;}catch(error){snapshotError=String(error);}
     let raw=null,storageError=null;try{raw=localStorage.getItem('math-explorer-v2');}catch(error){storageError=String(error);}
     return {at:new Date().toISOString(),url:location.href,readyState:document.readyState,
      mathLessonPresent:typeof window.mathLesson!=='undefined',mathLessonSnapshot:snapshot,snapshotError,
      warning:warning?{present:true,hidden:warning.hidden,visible:warningVisible,text:warning.textContent,display:style.display,visibility:style.visibility}:{present:false,visible:false},
      title:document.querySelector('#title')?.textContent||null,work:document.querySelector('#work')?.textContent||null,
      controller:navigator.serviceWorker.controller?.scriptURL||null,raw,storageError};
    }),5000,'post-original-failure DOM observation').catch(error=>({diagnosticError:String(error)}));
    if(typeof state.raw==='string'){const file='original-failure-storage.txt';fs.writeFileSync(path.join(out,file),state.raw);state.storage={file,bytes:Buffer.byteLength(state.raw),sha256:hash(state.raw)};delete state.raw;}
    write(destination,{...frozen,domReadAttemptedAfterRequestFreeze:true,domReadCompleted:!state.diagnosticError,state});event('original-failure-captured',{number,label:label(),file:path.basename(destination)});
   };
   const handle=(kind,payload)=>{
    if(finished)return;
    let request=pending.get(payload.requestId);
    if(kind==='Network.requestWillBeSent'){
     if(payload.type==='Document'&&payload.frameId===mainFrameId){navigationSnapshot('next-document');currentLoaderId=payload.loaderId;currentURL=payload.request.url;currentLabel=label();requests=new Map();summary.navigations++;if(summary.navigations%100===0){const index=summary.navigations;setImmediate(()=>host('page-'+number+'-navigation-'+index));}}
     request={requestId:payload.requestId,url:payload.request.url,method:payload.request.method,frameId:payload.frameId,loaderId:payload.loaderId,type:payload.type,initiator:payload.initiator,startedAt:payload.timestamp,wallTime:payload.wallTime};pending.set(payload.requestId,request);
     if(payload.loaderId===currentLoaderId)requests.set(payload.requestId,request);
    }else if(kind==='Network.responseReceived'&&request){request.response=payload.response;request.responseAt=payload.timestamp;}
    else if(kind==='Network.loadingFinished'&&request){request.finished={timestamp:payload.timestamp,encodedDataLength:payload.encodedDataLength};}
    else if(kind==='Network.loadingFailed'&&request){request.failure={...payload};}
    const record={at:new Date().toISOString(),label:label(),kind,request:request?{requestId:request.requestId,url:request.url,loaderId:request.loaderId,type:request.type}:null,
     ...(kind==='Network.requestWillBeSent'?{timestamp:payload.timestamp,wallTime:payload.wallTime,initiator:payload.initiator}:payload)};ring(record);
    if(kind==='Network.loadingFailed'){
     const relevant=!summary.contextClosing&&currentURL?.startsWith(base+'learn.html')&&request?.loaderId===currentLoaderId;
     event('loading-failed',{number,relevant,...record});
     if(relevant){nativeFailures.push(record);write(path.join(out,'native-failures.json'),nativeFailures);
      if(nativeFailures.length===1){
       write(path.join(out,'first-native-failure.json'),{provenance,first:record,currentLoaderId,currentURL,currentRequests:[...requests.values()],precedingEvents:[...recent.slice(cursor),...recent.slice(0,cursor)]});
       stop('first current-document loading failure');host('first-native-failure');
       const firstRequests=requests;
       const capture=new Promise(resolve=>setImmediate(resolve)).then(()=>afterNativeFailure(page,cdp,base,record,firstRequests)).catch(error=>fail('post-native-failure',error));pendingCaptures.push(capture);
      }
     }
    }
    if(kind==='Network.loadingFinished'||kind==='Network.loadingFailed')pending.delete(payload.requestId);
   };
   for(const name of ['Network.requestWillBeSent','Network.responseReceived','Network.loadingFinished','Network.loadingFailed'])listen(cdp,name,payload=>handle(name,payload));
   for(const name of ['ServiceWorker.workerRegistrationUpdated','ServiceWorker.workerVersionUpdated','ServiceWorker.workerErrorReported'])listen(cdp,name,payload=>event(name,{number,label:label(),...payload}));
   listen(page,'pageerror',error=>{event('pageerror',{number,label:label(),error:String(error)});stop('first pageerror');});
   listen(page,'console',message=>event('console',{number,label:label(),type:message.type(),text:message.text(),location:message.location()}));
   listen(page,'load',()=>navigationSnapshot('load'));
   await cdp.send('Network.enable');
   try{await cdp.send('ServiceWorker.enable');event('service-worker-domain-enabled',{number,attachedToWorker:false,debuggerEnabled:false,runtimeEnabled:false});}catch(error){fail('service-worker-observer',error);}
   event('page-observer-ready',{number,label:label()});save();
  },
  beforeContextClose(page){pages.find(value=>value.page===page)?.close();},
  noteOriginalSuccess(counts){originalOutcome='success';originalCounts=counts;save();},
  noteOriginalFailure(error){originalOutcome='failure';originalError=String(error);stop('original assertion failure');host('original-failure');save();},
  async captureOriginalFailure(page,error){
   const entry=pages.find(value=>value.page===page);
   try{
    if(entry?.captureOriginalFailure)await entry.captureOriginalFailure(error);
    else write(path.join(out,'original-failure.json'),{provenance,at:new Date().toISOString(),error:String(error),pageURL:page&&!page.isClosed()?page.url():null,
     observerUnavailable:true,requestState:null,domState:null,postOriginalFailureOnly:true,diagnosticOnly:true,acceptanceClaim:false});
   }catch(problem){fail('original-failure-capture',problem);}
  },
  async finish(){
   if(trace){const capture=trace.stop('all original cases finished');await capture.completionCheck;
    try{const result=await bounded(capture.exported,20000,'native trace export or late preservation');write(path.join(out,'native-trace-manifest.json'),result);}
    catch(error){fail('native-trace-preservation',error);trace.abandon(error);}
   }
   await Promise.allSettled(pendingCaptures);host('after-original-path');
   for(const page of pages)page.summary.contextClosing=true;
   event('observation-boundary-before-browser-cleanup',{listenersRemoved:removeListeners.length});for(const remove of removeListeners)remove();finished=true;save();fs.closeSync(eventFile);
   if(errors.length||nativeFailures.length)process.exitCode=1;
  }
 };
}
module.exports={createStartupObserver,verifySource,stripHooks,nativeTraceCapture};
