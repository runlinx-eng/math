// The entry module supplies its own fixed source version. A shared helper or a
// new controller must not relabel a document that loaded an older entry module.
export function releaseWorkerURL(release){
 const url=new URL('./sw.js',import.meta.url);
 url.searchParams.set('release',release);
 return url.href;
}
export function isReleaseWorker(worker,release){
 return !!worker&&worker.scriptURL===releaseWorkerURL(release);
}
export function isCurrentReleaseReady({release,registration,controller,worker,report}){
 return isReleaseWorker(worker,release)&&worker.state==='activated'&&registration?.active===worker&&controller===worker&&
  report?.type==='math-explorer:cache-status'&&report.cache===release&&report.complete===true&&
  Number.isInteger(report.total)&&report.total>0&&report.cached===report.total;
}
export function registerClientRelease(RELEASE){
if('serviceWorker'in navigator){
 navigator.serviceWorker.addEventListener('message',event=>{
  if(event.data?.type==='math-explorer:client-release'&&event.ports?.[0])
   event.ports[0].postMessage({type:'math-explorer:client-release',cache:RELEASE});
 });
 const ask=(worker,type)=>new Promise(resolve=>{
  const channel=new MessageChannel();
  const finish=value=>{clearTimeout(timer);channel.port1.close();resolve(value);};
  const timer=setTimeout(()=>finish(null),4000);
  channel.port1.onmessage=event=>finish(event.data);
  try{worker.postMessage({type},[channel.port2]);}catch{finish(null);}
 });
 const sweep=async()=>{
  const worker=navigator.serviceWorker.controller;
  // Identify this protocol before sending anything. Even a status probe can
  // restart a retiring historical controller and delay the new activation.
  if(!isReleaseWorker(worker,RELEASE))return;
  if(worker.state==='activating'){
   worker.addEventListener('statechange',sweep,{once:true});
   return;
  }
  if(worker.state!=='activated')return;
  const registration=await navigator.serviceWorker.getRegistration().catch(()=>null);
  if(registration?.active!==worker||navigator.serviceWorker.controller!==worker||worker.state!=='activated')return;
  const status=await ask(worker,'math-explorer:cache-status');
  if(!isCurrentReleaseReady({release:RELEASE,registration,
   controller:navigator.serviceWorker.controller,worker,report:status}))return;
  await ask(worker,'math-explorer:cleanup-retired-caches');
 };
 // Deferred cleanup is retried on a later page load/controller change. It is
 // independent of read-only offline readiness and never touches learner data.
 if(document.readyState==='complete')sweep();
 else window.addEventListener('load',sweep,{once:true});
 navigator.serviceWorker.addEventListener('controllerchange',()=>{
  if(document.readyState==='complete')sweep();
 });
}
}
