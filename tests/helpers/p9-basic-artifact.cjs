// Preserve actual v2 bytes alongside complete models/attempts for independent
// artifact replay. Decoding here is transport only; it does not certify math.
const fs=require('node:fs'),path=require('node:path');
const http=require('node:http');
async function createOrigin(root){
 const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
 const server=http.createServer((req,res)=>{const rel=new URL(req.url,'http://localhost').pathname.replace(/^\/+/, '')||'index.html';fs.readFile(path.join(root,'dist',rel),(error,data)=>{res.writeHead(error?404:200,{'Content-Type':mime[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store'});res.end(error?'missing':data);});});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 return {base:'http://127.0.0.1:'+server.address().port+'/',server,close:async()=>{if(server.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});}};
}
async function warmAndStop(page,origin,cache,ok,label){
 await page.goto(origin.base+'v2.html#trail');await page.locator('#import-file').waitFor({state:'attached'});
 let status=null;
 for(let i=0;i<300;i++){
  status=await page.evaluate(async()=>{if(!navigator.serviceWorker.controller)return null;return new Promise(resolve=>{const ch=new MessageChannel(),timer=setTimeout(()=>{ch.port1.close();resolve(null);},1200);ch.port1.onmessage=e=>{clearTimeout(timer);ch.port1.close();resolve(e.data);};navigator.serviceWorker.controller.postMessage({type:'math-explorer:cache-status'},[ch.port2]);});});
  if(status?.cache===cache&&status.complete&&status.cached===status.total)break;await page.waitForTimeout(100);
 }
 ok(status?.cache===cache&&status.complete===true&&status.cached===status.total,label+' complete current offline cache');
 await origin.close();ok(!origin.server.listening,label+' HTTP origin stops before all mathematical controls');
 return {cache,status,originStopped:!origin.server.listening};
}
async function capture(page,out,label,spec,phase){
 const data=await page.evaluate(async({id,index})=>{
  const {unpackText}=await import('./storage.js');
  const raw=localStorage.getItem('math-explorer-v2'),decoded=unpackText(raw),state=JSON.parse(decoded);
  const lesson=state.lessons[id]||state.daily?.bridges?.[id];
  return {raw,decoded,model:lesson.models[index],record:lesson.cases[index],lesson};
 },spec);
 const prefix=label+'-'+phase;
 fs.writeFileSync(path.join(out,prefix+'-storage.txt'),data.raw);
 fs.writeFileSync(path.join(out,prefix+'-decoded.json'),data.decoded);
 return {phase,model:data.model,record:data.record,attempts:data.record?.attempts||[],lesson:data.lesson,
  storage:{raw:prefix+'-storage.txt',decoded:prefix+'-decoded.json'}};
}
module.exports={capture,createOrigin,warmAndStop};
