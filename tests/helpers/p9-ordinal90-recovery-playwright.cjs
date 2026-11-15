// Isolated failure injection at the original 1280x720 fraction-order
// correction-reset #90 reload, without modifying the runner's maths steps.
const playwright=require('playwright'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'verification/p9-fraction-order-adapter');
const baseline='9b4d48c3174d005750845c60a5b468a91edcf0efab7f0d955368376087b8390e';
const sha=buf=>crypto.createHash('sha256').update(buf).digest('hex');
const runner=fs.readFileSync(path.join(root,'tests/p9-fraction-order-adapter-browser.cjs'));
if(sha(runner)!==baseline)throw Error('Original runner fingerprint changed; ordinal 90 is unproven');
const expectRecovery=process.env.MATH_EXPECT_RECOVERY!=='false';
const report={mode:expectRecovery?'candidate-recovery':'baseline-counterfactual',type:'real-Chromium-original-fraction-order-ordinal-90-fault',target:{width:1280,height:720,ordinal:90,
 scenario:'correction-reset',id:'fractionbench',index:0},originalRunnerSHA256:baseline,injected:0,results:[],errors:[]};
// Test-only worker overlay: never edits the shipped SW or original runner.
const workerSource=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8');
const testWorkerSource=workerSource
 .replace("self.addEventListener('fetch',event=>{",String.raw`let __testScriptFaultArmed=false,__testScriptFaults=0;
self.addEventListener('message',event=>{
 if(event.data?.type==='test-arm-entry-fault'){
  __testScriptFaultArmed=true;event.ports?.[0]?.postMessage({armed:true});
 }else if(event.data?.type==='test-entry-fault-count'){
  event.ports?.[0]?.postMessage({count:__testScriptFaults});
 }
});
self.addEventListener('fetch',event=>{`)
 .replace(workerSource.includes(" if(event.request.destination==='script'&&url.searchParams.has(MODULE_RECOVERY_KEY)){" )?
  " if(event.request.destination==='script'&&url.searchParams.has(MODULE_RECOVERY_KEY)){":
  " if(event.request.destination==='script'){",String.raw` if(__testScriptFaultArmed&&event.request.destination==='script'&&
    url.pathname.endsWith('/learning/learn.js')&&!url.searchParams.has('module-recovery')){
  __testScriptFaultArmed=false;__testScriptFaults++;
  event.respondWith(Promise.resolve(new Response('intentional resource failure',{status:503,
   headers:{'Content-Type':'text/plain'}})));return;
 }
 ${workerSource.includes('MODULE_RECOVERY_KEY')?"if(event.request.destination==='script'&&url.searchParams.has(MODULE_RECOVERY_KEY))":"if(event.request.destination==='script')"}{`);
if(testWorkerSource===workerSource||!testWorkerSource.includes('__testScriptFaults++'))
 throw Error('test-only SW overlay unavailable');
const originalReadFile=fs.readFile;
fs.readFile=function(file,...args){
 if(path.resolve(String(file))!==path.join(root,'dist/sw.js'))
  return Reflect.apply(originalReadFile,this,[file,...args]);
 const cb=args.pop();
 return Reflect.apply(originalReadFile,this,[file,...args,(error,data)=>cb(error,error?data:Buffer.from(testWorkerSource))]);
};
const workerMessage=(page,type)=>page.evaluate(type=>new Promise(resolve=>{
 const channel=new MessageChannel(),timer=setTimeout(()=>resolve(null),2000);
 channel.port1.onmessage=event=>{clearTimeout(timer);channel.port1.close();resolve(event.data);};
 navigator.serviceWorker.controller.postMessage({type},[channel.port2]);
}),type);
const mathHistory=raw=>{
 const a=JSON.parse(raw);
 const take=items=>Object.fromEntries(Object.entries(items||{}).map(([id,v])=>
  [id,{models:v.models,cases:v.cases,completed:v.completed}]));
 return JSON.stringify({lessons:take(a.lessons),bridges:take(a.daily?.bridges)});
};
function save(){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'ordinal90-recovery-injection.json'),JSON.stringify(report,null,2));}
function wrapBrowser(browser){
 const newContext=browser.newContext,close=browser.close;
 browser.newContext=async function(options,...rest){
  const context=await Reflect.apply(newContext,this,[options,...rest]);
  if(options?.viewport?.width!==1280||options?.viewport?.height!==720)return context;
  const newPage=context.newPage;
  context.newPage=async function(...args){
   const page=await Reflect.apply(newPage,this,args),originalReload=page.reload,originalWait=page.waitForFunction;
   let reloads=0;
   page.reload=async function(...args){
    reloads++;
    if(reloads!==90)return Reflect.apply(originalReload,this,args);
    const before=await page.evaluate(()=>({raw:localStorage.getItem('math-explorer-v2'),
     snapshot:window.mathLesson?.snapshot?.()||null}));
    report.before={ordinal:reloads,rawBytes:before.raw?.length,raw:before.raw,snapshot:before.snapshot};
    if(!before.raw||before.snapshot?.id!=='fractionbench'||before.snapshot?.index!==0)
     throw Error('Target is not the original fractionbench[0] correction-reset step');
    const armed=await workerMessage(page,'test-arm-entry-fault');
    if(!armed?.armed)throw Error('target worker refused controlled module failure');
    report.results.push({kind:'test-worker-armed',ordinal:reloads});
    const result=await Reflect.apply(originalReload,this,args);
    const count=await workerMessage(page,'test-entry-fault-count');
    report.injected=count?.count||0;
    report.results.push({kind:'original-reload-returned',ordinal:reloads,status:result?.status(),
     fromServiceWorker:result?.fromServiceWorker(),injected:report.injected});
    save();
    return result;
   };
   page.waitForFunction=async function(...args){
    try{
     const result=await Reflect.apply(originalWait,this,args);
     if(reloads===90&&args[1]?.id==='fractionbench'&&args[1]?.index===0){
      const after=await page.evaluate(()=>({raw:localStorage.getItem('math-explorer-v2'),
       snapshot:window.mathLesson?.snapshot?.()||null,
       recovery:window.mathStartupRecovery||null,
       warning:document.querySelector('#storage-warning')?.textContent||''}));
      report.after={rawBytes:after.raw?.length,mathematicalHistoryIdentical:mathHistory(after.raw)===mathHistory(report.before.raw),
       snapshot:after.snapshot,recovery:after.recovery,warning:after.warning};
      if(report.injected!==1||report.after.recovery?.status!=='recovered'||!report.after.mathematicalHistoryIdentical)
       {report.errors.push({stage:'target-acceptance',error:'target injection, recovery or preserved attempts failed'});process.exitCode=1;}
      save();
     }
     return result;
    }catch(error){if(reloads===90){
      const after=await page.evaluate(()=>({raw:localStorage.getItem('math-explorer-v2'),
       snapshot:window.mathLesson?.snapshot?.()||null,
       recovery:window.mathStartupRecovery||null,
       warning:document.querySelector('#storage-warning')?.textContent||''})).catch(err=>({error:String(err)}));
      report.after={rawBytes:after.raw?.length,mathematicalHistoryIdentical:after.raw?mathHistory(after.raw)===mathHistory(report.before.raw):false,
       snapshot:after.snapshot,recovery:after.recovery,warning:after.warning,error:after.error};
      report.errors.push({stage:'original-readiness',error:String(error)});save();
     }throw error;}
   };
   return page;
  };
  return context;
 };
 browser.close=async function(...args){
  save();
  if(report.injected!==1||report.after?.mathematicalHistoryIdentical!==true||
    (expectRecovery?report.after?.recovery?.status!=='recovered':
     report.after?.snapshot!==null||!report.after?.warning?.includes('程序未能加载')))
   {process.exitCode=1;report.errors.push({stage:'acceptance',error:'target fault was not single or stored bytes changed'});save();}
  return Reflect.apply(close,this,args);
 };
 return browser;
}
const chromium=playwright.chromium,launch=chromium.launch;
const proxied=new Proxy(chromium,{get(object,key){
 if(key==='launch')return async(...args)=>wrapBrowser(await Reflect.apply(launch,object,args));
 const value=Reflect.get(object,key,object);
 return typeof value==='function'?value.bind(object):value;
}});
module.exports=new Proxy(playwright,{get(object,key){return key==='chromium'?proxied:Reflect.get(object,key,object);}});
