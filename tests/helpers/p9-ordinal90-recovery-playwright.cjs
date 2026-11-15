// Isolated failure injection at the original 1280x720 fraction-order
// correction-reset #90 reload, without modifying the runner's maths steps.
const playwright=require('playwright'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'verification/p9-fraction-order-adapter');
const baseline='9b4d48c3174d005750845c60a5b468a91edcf0efab7f0d955368376087b8390e';
const sha=buf=>crypto.createHash('sha256').update(buf).digest('hex');
const runner=fs.readFileSync(path.join(root,'tests/p9-fraction-order-adapter-browser.cjs'));
if(sha(runner)!==baseline)throw Error('Original runner fingerprint changed; ordinal 90 is unproven');
const report={type:'real-Chromium-original-fraction-order-ordinal-90-fault',target:{width:1280,height:720,ordinal:90,
 scenario:'correction-reset',id:'fractionbench',index:0},originalRunnerSHA256:baseline,injected:0,results:[],errors:[]};
function save(){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'ordinal90-recovery-injection.json'),JSON.stringify(report,null,2));}
function wrapBrowser(browser){
 const newContext=browser.newContext,close=browser.close;
 browser.newContext=async function(options,...rest){
  const context=await Reflect.apply(newContext,this,[options,...rest]);
  if(options?.viewport?.width!==1280||options?.viewport?.height!==720)return context;
  const newPage=context.newPage;
  context.newPage=async function(...args){
   const page=await Reflect.apply(newPage,this,args),originalReload=page.reload;
   let reloads=0;
   page.reload=async function(...args){
    reloads++;
    if(reloads!==90)return Reflect.apply(originalReload,this,args);
    const before=await page.evaluate(()=>({raw:localStorage.getItem('math-explorer-v2'),
     snapshot:window.mathLesson?.snapshot?.()||null}));
    report.before={ordinal:reloads,rawBytes:before.raw?.length,snapshot:before.snapshot};
    if(!before.raw||before.snapshot?.id!=='fractionbench'||before.snapshot?.index!==0)
     throw Error('Target is not the original fractionbench[0] correction-reset step');
    const cdp=await context.newCDPSession(page);
    let failures=0;
    const listener=async event=>{
     const url=new URL(event.request.url);
     try{
      if(url.pathname==='/learning/learn.js'&&!url.searchParams.has('module-recovery')&&failures===0){
       failures++;report.injected++;report.results.push({kind:'original-module-aborted',url:event.request.url,
        requestId:event.requestId});
       await cdp.send('Fetch.failRequest',{requestId:event.requestId,errorReason:'Aborted'});
      }else await cdp.send('Fetch.continueRequest',{requestId:event.requestId});
     }catch(error){report.errors.push({stage:'Fetch',error:String(error)});}
    };
    cdp.on('Fetch.requestPaused',listener);
    await cdp.send('Fetch.enable',{patterns:[{urlPattern:'*learning/learn.js*',requestStage:'Request'}]});
    try{
     const result=await Reflect.apply(originalReload,this,args);
     // The runner retains the original 20-second waitForFunction and maths checks.
     report.results.push({kind:'original-reload-returned',status:result?.status(),
      fromServiceWorker:result?.fromServiceWorker()});
     return result;
    }finally{
     await cdp.send('Fetch.disable').catch(error=>report.errors.push({stage:'disable',error:String(error)}));
     const after=await page.evaluate(()=>({raw:localStorage.getItem('math-explorer-v2'),
      snapshot:window.mathLesson?.snapshot?.()||null,recovery:window.mathStartupRecovery||null,
      warning:document.querySelector('#storage-warning')?.textContent||''})).catch(error=>({error:String(error)}));
     report.after={rawBytes:after.raw?.length,storageIdentical:after.raw===before.raw,
      snapshot:after.snapshot,recovery:after.recovery,warning:after.warning,error:after.error};
     report.results.push({kind:'target-reload-verified',injected:failures});
     save();
    }
   };
   return page;
  };
  return context;
 };
 browser.close=async function(...args){
  save();
  if(report.injected!==1||report.after?.storageIdentical!==true)
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
