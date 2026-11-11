// The entry module supplies its own fixed source version. A shared helper or a
// new controller must not relabel a document that loaded an older entry module.
export function isCurrentReleaseReady({release,registration,controller,worker,report}){
 return !!worker&&worker.state==='activated'&&registration?.active===worker&&controller===worker&&
  report?.type==='math-explorer:cache-status'&&report.cache===release&&report.complete===true;
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
  if(!worker)return;
  // A new document can still be controlled by an older worker. Never invoke
  // that worker's legacy cleanup implementation against the installing cache.
  const status=await ask(worker,'math-explorer:cache-status');
  if(status?.type!=='math-explorer:cache-status'||status.cache!==RELEASE||!status.complete||
   navigator.serviceWorker.controller!==worker||worker.state!=='activated')return;
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
