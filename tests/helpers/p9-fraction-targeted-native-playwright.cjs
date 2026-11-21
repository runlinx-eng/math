// Diagnostic-only MATH_PLAYWRIGHT_MODULE adapter. The original fraction runner
// stays byte-identical: same real objects, actions, navigations and 20s waits.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const playwright=require('playwright');
const {observeNativeSWTrace}=require('./p9-native-sw-trace.cjs');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'verification/p9-fraction-order-adapter');
const target={width:1280,height:720,completedReloadsBeforeGoto:88,firstReload:89,secondReload:90,
 id:'fractionbench',index:0,scenario:'correction-reset',
 originalRunnerSHA256:'9b4d48c3174d005750845c60a5b468a91edcf0efab7f0d955368376087b8390e'};
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');

async function instrument(browser){
 const errors=[],pages=[],lifecycle=[],contexts=new WeakSet();
 let activeLabel='setup',native=null,finishPending=null,originalRunner=null;
 const window={status:'not-reached',target,started:null,readinessStarted:null,readinessCompleted:null};
 const browserClose={attempted:false,completed:false};
 const metadata={source:'unchanged fraction-order runner with a selected native window',
  traceCoverage:'1280x720-correction-reset-only',wholeSequenceGuaranteed:false,
  countsTowardAcceptance:false,rootCauseEstablished:false};
 const recordError=(stage,error)=>errors.push({stage,error:String(error)});
 const mark=(kind,data={})=>{
  const event={at:new Date().toISOString(),nodeMonotonicNs:process.hrtime.bigint().toString(),label:activeLabel,kind,...data};
  lifecycle.push(event);
  try{fs.appendFileSync(path.join(out,'targeted-native-lifecycle.jsonl'),JSON.stringify(event)+'\n');}
  catch(error){recordError('lifecycle-write',error);}
  return event;
 };
 const stop=reason=>{
  if(!native||finishPending)return finishPending;
  // Invoke finish now, including inside the exact failed operation callback.
  // Do not delay the original mathematical assertions for a trace export.
  finishPending=native.finish(reason).catch(error=>{recordError('native-finish',error);});
  return finishPending;
 };
 try{
  fs.mkdirSync(out,{recursive:true});
  const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
  metadata.testedCheckoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
  metadata.headSha=event.pull_request?.head?.sha||metadata.testedCheckoutSha;
  metadata.originalRunnerSHA256=sha(fs.readFileSync(path.join(root,'tests/p9-fraction-order-adapter-browser.cjs')));
  if(metadata.originalRunnerSHA256!==target.originalRunnerSHA256)throw Error('original runner changed; selected ordinals require a new evidence review');
 }catch(error){recordError('provenance',error);}

 const beforeClose=state=>{
  if(state.closing)return;state.closing=true;
  try{state.observer?.beforeClose();}catch(error){recordError('native-page-close',error);}
 };
 const instrumentContext=(context,options)=>{
  if(contexts.has(context))return context;contexts.add(context);
  const owned=[],newPage=context.newPage,close=context.close;
  context.newPage=async function(...args){
   const page=await Reflect.apply(newPage,this,args),goto=page.goto,reload=page.reload,wait=page.waitForFunction;
   const state={index:pages.length+1,viewport:options?.viewport||null,url:null,observer:null,closing:false,
    gotoCalls:0,reloadCalls:0,completedReloads:0};
   pages.push(state);owned.push(state);
   const selectedViewport=()=>state.viewport?.width===target.width&&state.viewport?.height===target.height;
   page.goto=async function(...navigationArgs){
    state.url=String(navigationArgs[0]);state.gotoCalls++;
    activeLabel=(state.viewport?state.viewport.width+'x'+state.viewport.height:'unknown')+' goto '+state.gotoCalls+' '+state.url;
    const url=new URL(state.url);
    if(!native&&window.status==='not-reached'&&selectedViewport()&&state.completedReloads===target.completedReloadsBeforeGoto&&
     state.reloadCalls===target.completedReloadsBeforeGoto&&url.pathname==='/learn.html'&&url.hash==='#'+target.id){
     window.status='starting';window.selectedPage=state.index;
     window.startRequested=mark('target-window-start-requested',{completedReloads:state.completedReloads,url:state.url});
     try{
      native=await observeNativeSWTrace(browser,{out,label:()=>activeLabel});
      state.observer=await native.observePage(page,{base:url.origin+'/'});
      window.status=native.report.status==='recording'?'recording':'unavailable';
      window.started=mark('target-window-started',{nativeStatus:native.report.status});
     }catch(error){window.status='unavailable';recordError('native-start',error);}
    }
    try{return await Reflect.apply(goto,this,navigationArgs);}
    catch(error){if(window.selectedPage===state.index)stop({kind:'original-goto-failed',error:String(error)});throw error;}
   };
   page.reload=async function(...reloadArgs){
    state.reloadCalls++;
    activeLabel=(state.viewport?state.viewport.width+'x'+state.viewport.height:'unknown')+' reload '+state.reloadCalls+' '+state.url;
    if(window.selectedPage===state.index&&[target.firstReload,target.secondReload].includes(state.reloadCalls))
     mark('target-original-reload-start',{ordinal:state.reloadCalls});
    try{
     const response=await Reflect.apply(reload,this,reloadArgs);state.completedReloads++;
     if(window.selectedPage===state.index&&[target.firstReload,target.secondReload].includes(state.reloadCalls))
      mark('target-original-reload-returned',{ordinal:state.reloadCalls});
     return response;
    }catch(error){if(window.selectedPage===state.index)stop({kind:'original-reload-failed',ordinal:state.reloadCalls,error:String(error)});throw error;}
   };
   page.waitForFunction=async function(...waitArgs){
    const isTarget=window.selectedPage===state.index&&state.reloadCalls===target.secondReload&&
     waitArgs[1]?.id===target.id&&waitArgs[1]?.index===target.index&&!window.readinessStarted;
    if(isTarget)window.readinessStarted=mark('target-original-readiness-start',{ordinal:state.reloadCalls});
    try{
     const value=await Reflect.apply(wait,this,waitArgs);
     if(isTarget){
      window.readinessCompleted=mark('target-original-readiness-complete',{ordinal:state.reloadCalls});window.status='completed';
      stop({kind:'target-second-reload-original-readiness-complete',ordinal:state.reloadCalls});
     }
     return value;
    }catch(error){
     if(isTarget){window.status='readiness-failed';window.error=String(error);mark('target-original-readiness-failed',{error:String(error)});
      stop({kind:'target-original-readiness-failed',ordinal:state.reloadCalls,error:String(error)});}
     throw error;
    }
   };
   return page;
  };
  context.close=async function(...args){for(const state of owned)beforeClose(state);return Reflect.apply(close,this,args);};
  return context;
 };
 const newContext=browser.newContext,close=browser.close;
 browser.newContext=async function(...args){return instrumentContext(await Reflect.apply(newContext,this,args),args[0]);};
 browser.close=async function(...args){
  try{
   const bytes=fs.readFileSync(path.join(out,'results.json')),result=JSON.parse(bytes.toString('utf8'));
   originalRunner={file:'results.json',bytes:bytes.length,sha256:sha(bytes),status:result.error||Number(process.exitCode)?'failure':'reported-success',
    error:result.error||null,at:result.at||null,checks:result.checks?.length,
    taskViewportPairs:result.observations?.length,correctionViewportPairs:result.correctionObservations?.length};
  }catch(error){recordError('original-result-read',error);}
  for(const state of pages)beforeClose(state);
  native?.beginCleanup();
  await stop({kind:'original-browser-close-before-target-completed',windowStatus:window.status});
  let value,closeError,closeFailed=false;
  browserClose.attempted=true;browserClose.started=mark('actual-browser-close-start');
  try{value=await Reflect.apply(close,this,args);browserClose.completed=true;browserClose.finished=mark('actual-browser-close-complete');}
  catch(error){closeFailed=true;closeError=error;browserClose.error=String(error);browserClose.finished=mark('actual-browser-close-failed');}
  const report=native?.report;
  let nativeCaptureSaved=false,nativeIntegrity=null,diagnosticOutcome='incomplete',status='failure';
  if(report?.status==='saved')try{
   const bytes=fs.readFileSync(path.join(out,report.file));
   if(!bytes.length||bytes.length!==report.bytes||sha(bytes)!==report.sha256)throw Error('native bytes or SHA256 mismatch');
   const trace=JSON.parse(bytes.toString('utf8')),stats=trace.metadata?.trace_processor_stats;
   const buffers=stats?.traced_buf;
   if(!Array.isArray(buffers)||!buffers.length)throw Error('native Perfetto buffer statistics missing');
   nativeIntegrity={buffers,tokenizerSkippedPackets:stats.tokenizer_skipped_packets,
    noBufferLoss:buffers.every(b=>b.bytes_overwritten===0&&b.chunks_overwritten===0&&b.chunks_discarded===0&&
     b.sequence_packet_loss===0&&b.trace_writer_packet_loss===0)};
   nativeCaptureSaved=true;
  }catch(error){recordError('native-artifact',error);}
  else recordError('native-status',Error('native trace not saved: '+(report?.status||'not-reached')));
  if(report?.errors?.length)errors.push({stage:'native-helper',error:'native helper reported errors',details:report.errors});
  if(!window.started||!window.readinessStarted)recordError('target-coverage',Error('original selected reset/reload window was not completed'));
  if(nativeCaptureSaved&&!errors.length&&browserClose.completed){
   const lossless=report.dataLossOccurred===false&&!report.capacityExceeded&&nativeIntegrity.noBufferLoss;
   diagnosticOutcome=lossless?'saved':'partial';
   if(originalRunner?.status==='reported-success'&&window.status==='completed')status=lossless?'success':'partial';
  }
  if(status!=='success'&&!Number(process.exitCode))process.exitCode=1;
  const verdict={...metadata,status,diagnosticOutcome,nativeCaptureSaved,nativeIntegrity,window,originalRunner,browserClose,
   errors,lifecycleFile:'targeted-native-lifecycle.jsonl',lifecycle,pages:pages.map(({observer,...state})=>state),nativeTrace:report||null};
  try{fs.writeFileSync(path.join(out,'targeted-native-result.json'),JSON.stringify(verdict,null,2));}
  catch(error){recordError('verdict-write',error);status='failure';if(!Number(process.exitCode))process.exitCode=1;}
  console.log('P9_FRACTION_TARGETED_NATIVE '+JSON.stringify({status,diagnosticOutcome,windowStatus:window.status,
   nativeCaptureSaved,nativeDataLoss:report?.dataLossOccurred,capacityExceeded:report?.capacityExceeded,originalRunnerStatus:originalRunner?.status,errors}));
  if(closeFailed)throw closeError;
  return value;
 };
 return browser;
}

const chromium=playwright.chromium,launch=chromium.launch;
const wrappedChromium=new Proxy(chromium,{get(target,key){
 if(key==='launch')return async function(...args){return instrument(await Reflect.apply(launch,target,args));};
 const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;
}});
module.exports=new Proxy(playwright,{get(target,key){return key==='chromium'?wrappedChromium:Reflect.get(target,key,target);}});
