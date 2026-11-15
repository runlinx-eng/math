// Diagnostic-only adapter for MATH_PLAYWRIGHT_MODULE. Keep the original runner,
// its real objects, parameters, navigation count and mathematical checks intact.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const playwright=require('playwright');
const {observeNativeSWTrace}=require('./p9-native-sw-trace.cjs');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'verification/p9-fraction-order-adapter');
const verdictFile='native-diagnostic-result.json';
const lifecycleFile='native-shim-lifecycle.jsonl';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');

async function instrument(browser){
 const errors=[],pages=[],lifecycle=[],contexts=new WeakSet();
 let native,activeLabel='setup',originalRunner=null,browserClose={attempted:false,completed:false};
 const recordError=(stage,error)=>errors.push({stage,error:String(error)});
 const mark=(kind)=>{
  const event={at:new Date().toISOString(),nodeMonotonicNs:process.hrtime.bigint().toString(),label:activeLabel,kind};
  lifecycle.push(event);
  try{fs.appendFileSync(path.join(out,lifecycleFile),JSON.stringify(event)+'\n');}
  catch(error){recordError('lifecycle-write',error);}
  return event;
 };
 const failExit=()=>{if(!Number(process.exitCode))process.exitCode=1;};
 const label=()=>activeLabel;
 const metadata={source:'original fraction-order runner through MATH_PLAYWRIGHT_MODULE',
  traceCoverage:'bounded-tail',wholeSequenceGuaranteed:false,labelSource:'viewport/page/url; correlate the original CDP log for the runner scenario'};
 try{
  fs.mkdirSync(out,{recursive:true});
  const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
  metadata.testedCheckoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
  metadata.headSha=event.pull_request?.head?.sha||metadata.testedCheckoutSha;
  metadata.originalRunnerSHA256=sha(fs.readFileSync(path.join(root,'tests/p9-fraction-order-adapter-browser.cjs')));
 }catch(error){recordError('provenance',error);}
 try{native=await observeNativeSWTrace(browser,{out,label});}
 catch(error){recordError('native-start',error);}

 const beforeClose=state=>{
  if(state.closing)return;state.closing=true;
  try{state.observer?.beforeClose();}catch(error){recordError('native-page-close',error);}
 };
 const instrumentContext=(context,options)=>{
  if(contexts.has(context))return context;contexts.add(context);
  const owned=[],newPage=context.newPage,close=context.close;
  context.newPage=async function(...args){
   const page=await Reflect.apply(newPage,this,args),goto=page.goto;
   const state={index:pages.length+1,viewport:options?.viewport||null,base:null,url:null,observer:null,closing:false,attached:false};
   pages.push(state);owned.push(state);
   page.goto=async function(...navigationArgs){
    state.url=String(navigationArgs[0]);
    activeLabel=(state.viewport?state.viewport.width+'x'+state.viewport.height:'viewport-unknown')+'-page-'+state.index+' '+state.url;
    if(!state.attached){
     // Observe this existing page before its first real navigation. Never add
     // a goto/reload, inspect learner state, or change any page timeout.
     state.attached=true;
     try{
      state.base=new URL(state.url).origin+'/';
      if(native)state.observer=await native.observePage(page,{base:state.base});
     }catch(error){recordError('native-page-observer',error);}
    }
    return Reflect.apply(goto,this,navigationArgs);
   };
   return page;
  };
  context.close=async function(...args){
   for(const state of owned)beforeClose(state);
   return Reflect.apply(close,this,args);
  };
  return context;
 };
 const newContext=browser.newContext,close=browser.close;
 browser.newContext=async function(...args){
  return instrumentContext(await Reflect.apply(newContext,this,args),args[0]);
 };
 browser.close=async function(...args){
  // The original runner writes its own result before its finally calls close.
  // Read it without changing the product error or any mathematical evidence.
  try{
   const bytes=fs.readFileSync(path.join(out,'results.json')),result=JSON.parse(bytes.toString('utf8'));
   originalRunner={file:'results.json',bytes:bytes.length,sha256:sha(bytes),
    status:result.error||Number(process.exitCode)?'failure':'reported-success',
    error:result.error||null,at:result.at||null,checks:result.checks?.length,
    taskViewportPairs:result.observations?.length,correctionViewportPairs:result.correctionObservations?.length};
  }catch(error){recordError('original-result-read',error);}
  for(const state of pages)beforeClose(state);
  try{native?.beginCleanup();}catch(error){recordError('native-cleanup',error);}
  mark('native-finish-await-start');
  try{
   if(native)await native.finish({kind:'original-runner-browser-close',label:activeLabel,
    originalError:originalRunner?.error||null,originalAt:originalRunner?.at||null});
   mark('native-finish-await-complete');
  }catch(error){recordError('native-finish',error);mark('native-finish-await-failed');}

  let value,closeError,closeFailed=false;
  browserClose.attempted=true;
  // The original CDP browser-close-start marks entry into this wrapper. These
  // separate markers delimit the real close call after native export finishes.
  browserClose.started=mark('actual-browser-close-start');
  try{value=await Reflect.apply(close,this,args);browserClose.completed=true;browserClose.finished=mark('actual-browser-close-complete');}
  catch(error){closeFailed=true;closeError=error;browserClose.error=String(error);browserClose.finished=mark('actual-browser-close-failed');}
  // Diagnostic failures only add a separate verdict and a nonzero exit. The
  // real browser close still runs, and its exact exception is rethrown below.
  let nativeCaptureSaved=false,windowIntegrity='unknown',diagnosticOutcome='incomplete',status='failure';
  const report=native?.report;
  if(report?.status==='saved')try{
   if(!report.tracingComplete?.stream)throw Error('native trace is missing its completed stream');
   const bytes=fs.readFileSync(path.join(out,report.file));
   if(!bytes.length||bytes.length!==report.bytes||sha(bytes)!==report.sha256)throw Error('native trace bytes or SHA-256 do not match the saved stream');
   nativeCaptureSaved=true;
  }catch(error){recordError('native-artifact',error);}
  else recordError('native-status',Error('native trace was not saved: '+(report?.status||'missing')));
  if(report?.errors?.length)errors.push({stage:'native-helper',error:'native helper reported diagnostic errors',details:report.errors});
  if(nativeCaptureSaved){
   if(report.dataLossOccurred===false)windowIntegrity='no-loss-reported';
   else if(report.dataLossOccurred===true)windowIntegrity='not-proven';
   else recordError('native-integrity',Error('native trace data loss status is unknown'));
  }
  if(nativeCaptureSaved&&!errors.length&&browserClose.completed)
   diagnosticOutcome=windowIntegrity==='not-proven'?'partial':'saved';
  const originalSucceeded=originalRunner?.status==='reported-success'&&!Number(process.exitCode);
  if(originalSucceeded&&diagnosticOutcome==='saved')status='success';
  else if(originalSucceeded&&diagnosticOutcome==='partial')status='partial';
  if(status!=='success')failExit();
  const verdict=()=>({...metadata,status,diagnosticOutcome,nativeCaptureSaved,windowIntegrity,
   originalRunner,browserClose,errors,lifecycleFile,lifecycle,pages:pages.map(({observer,...state})=>state),nativeTrace:report||null});
  let verdictSaved=false;
  try{fs.writeFileSync(path.join(out,verdictFile),JSON.stringify(verdict(),null,2));verdictSaved=true;}
  catch(error){recordError('verdict-write',error);status='failure';diagnosticOutcome='incomplete';failExit();}
  console.log('P9_FRACTION_NATIVE_DIAGNOSTIC '+JSON.stringify({status,diagnosticOutcome,nativeCaptureSaved,
   windowIntegrity,originalRunnerStatus:originalRunner?.status||'unknown',originalError:originalRunner?.error||null,
   browserCloseCompleted:browserClose.completed,verdictFile,verdictSaved,errors}));
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
