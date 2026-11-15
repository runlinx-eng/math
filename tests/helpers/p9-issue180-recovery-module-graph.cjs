'use strict';
// Issue #180: passive Chromium ESM module graph parser/evaluation evidence.
// Explicit diagnostic opt-in; never mutates fetch, source, SW, cache, or learner storage.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function createRecoveryModuleGraphTrace({context,page,out,label}){
 const events=[],startedAt=new Date().toISOString();
 let cdp=null,closed=false,seq=0,journalError=null;
 const journalPath=path.join(out,label+'-module-graph-cdp.jsonl');
 const note=(kind,detail={})=>{
  if(closed)return;
  const record={seq:++seq,at:new Date().toISOString(),kind,...detail};
  events.push(record);
  try{fs.appendFileSync(journalPath,JSON.stringify(record)+'\n');}
  catch(error){journalError??=String(error);}
 };
 const compactError=(details={})=>({
  text:details.text||null,
  description:details.exception?.description||null,
  exceptionClassName:details.exception?.className||null,
  exceptionValue:details.exception?.value??null,
  url:details.url||null,
  lineNumber:details.lineNumber??null,
  columnNumber:details.columnNumber??null,
  stack:(details.stackTrace?.callFrames||[]).slice(0,12).map(f=>({
   url:f.url,functionName:f.functionName,lineNumber:f.lineNumber,columnNumber:f.columnNumber}))
 });
 const shouldKeep=url=>/\/(?:learning\/|sw-client\.js|storage\.js|exploration-core\.js)/.test(url||'');
 let requestInfo=new Map();
 async function start(){
  cdp=await context.newCDPSession(page);
  cdp.on('Debugger.scriptParsed',event=>{
   if(shouldKeep(event.url))note('scriptParsed',{
    scriptId:event.scriptId,url:event.url,scriptLanguage:event.scriptLanguage||null,
    isModule:event.isModule??null,executionContextId:event.executionContextId,
    hash:event.hash||null,hasSourceURL:event.hasSourceURL===true});
  });
  cdp.on('Debugger.scriptFailedToParse',event=>note('scriptFailedToParse',{
   url:event.url||null,errorMessage:event.errorMessage||null,
   scriptId:event.scriptId||null,executionContextId:event.executionContextId||null}));
  cdp.on('Runtime.exceptionThrown',event=>
   note('runtimeExceptionThrown',compactError(event.exceptionDetails)));
  cdp.on('Runtime.consoleAPICalled',event=>{
   if(event.type==='error'||event.type==='warning')
    note('runtimeConsole',{type:event.type,args:(event.args||[]).slice(0,5)
     .map(a=>String(a.value??a.description??a.type).slice(0,750))});
  });
  cdp.on('Runtime.executionContextCreated',event=>{
   const context=event.context||{};
   note('executionContextCreated',{id:context.id,origin:context.origin,
    name:context.name,auxType:context.auxData?.type||null});
  });
  cdp.on('Runtime.executionContextDestroyed',event=>
   note('executionContextDestroyed',{id:event.executionContextId}));
  cdp.on('Page.frameNavigated',event=>{
   const frame=event.frame||{};
   note('frameNavigated',{id:frame.id,url:frame.url,loaderId:frame.loaderId,
    parentId:frame.parentId||null});
  });
  cdp.on('Network.requestWillBeSent',event=>{
   const request={url:event.request?.url||'',type:event.type,
    frameId:event.frameId,loaderId:event.loaderId,
    initiator:event.initiator?.type||null,monotonic:event.timestamp};
   requestInfo.set(event.requestId,request);
   if(requestInfo.size>1400)requestInfo.delete(requestInfo.keys().next().value);
   if(event.type==='Script')note('moduleRequest',{requestId:event.requestId,...request});
  });
  cdp.on('Network.responseReceived',event=>{
   const request=requestInfo.get(event.requestId);
   if(event.type==='Script')
    note('moduleResponse',{requestId:event.requestId,url:event.response?.url||request?.url||null,
     status:event.response?.status,mimeType:event.response?.mimeType,
     fromServiceWorker:event.response?.fromServiceWorker===true,
     loaderId:event.loaderId});
  });
  cdp.on('Network.loadingFailed',event=>note('networkLoadingFailed',{
   requestId:event.requestId,url:requestInfo.get(event.requestId)?.url||null,
   errorText:event.errorText,canceled:event.canceled===true,
   blockedReason:event.blockedReason||null,type:event.type}));
  cdp.on('Network.loadingFinished',event=>{
   const request=requestInfo.get(event.requestId);
   if(request?.type==='Script')
    note('moduleLoadingFinished',{requestId:event.requestId,url:request.url});
  });
  for(const domain of ['Page','Runtime','Debugger','Log','Network'])
   await cdp.send(domain+'.enable');
  cdp.on('Log.entryAdded',event=>{
   const e=event.entry||{};
   if(e.level==='error'||e.level==='warning')
    note('browserLog',{level:e.level,source:e.source,url:e.url||null,
     text:(e.text||'').slice(0,1500)});
  });
  note('traceStarted',{startedAt,label});
 }
 function summary(){
  const by=kind=>events.filter(x=>x.kind===kind);
  const urlOf=e=>e.url||'';
  const recovery=e=>urlOf(e).includes('module-recovery=');
  const request=by('moduleRequest').filter(recovery);
  const response=by('moduleResponse').filter(recovery);
  const finish=by('moduleLoadingFinished').filter(recovery);
  const parsed=by('scriptParsed').filter(recovery);
  const parseNames=new Set(parsed.map(x=>x.url));
  const requestedNames=[...new Set(request.map(x=>x.url))];
  return {label,startedAt,eventCount:events.length,traceWriteError:journalError,
   scriptParsedTotal:by('scriptParsed').length,
   recovery:{requested:request.length,uniqueRequested:requestedNames.length,
    received:response.length,http200:response.filter(x=>x.status===200).length,
    loaded:finish.length,parsed:parsed.length,uniqueParsed:parseNames.size,
    requestedButNotParsed:requestedNames.filter(x=>!parseNames.has(x)).slice(0,160),
    parseFailed:by('scriptFailedToParse').filter(recovery)},
   errors:{scriptFailedToParse:by('scriptFailedToParse'),
    runtimeExceptionThrown:by('runtimeExceptionThrown'),
    browserLog:by('browserLog').slice(-30),
    runtimeConsole:by('runtimeConsole').slice(-30),
    networkLoadingFailed:by('networkLoadingFailed').slice(-50)},
   executionContextDestroyed:by('executionContextDestroyed'),
   frameNavigated:by('frameNavigated')};
 }
 async function close(){
  if(closed)return;
  const report=summary();closed=true;
  const content=fs.existsSync(journalPath)?fs.readFileSync(journalPath):Buffer.alloc(0);
  report.journal={file:path.basename(journalPath),
   sha256:crypto.createHash('sha256').update(content).digest('hex'),
   bytes:content.length,complete:!journalError&&
    content.toString('utf8').trimEnd().split('\n').length===seq};
  fs.writeFileSync(path.join(out,label+'-module-graph-summary.json'),JSON.stringify(report,null,2));
  if(cdp)await cdp.detach().catch(()=>{});
  return report;
 }
 return {start,close,summary};
}
module.exports={createRecoveryModuleGraphTrace};
