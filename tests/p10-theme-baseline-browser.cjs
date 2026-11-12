// Reproduce the unchanged theme regression against a genuine main checkout.
// The current browser assertions and camera-roundoff helper remain in force.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {execFileSync,spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const out=process.env.P10_THEME_BASELINE_OUTPUT||path.join(root,'verification/p10-release-upgrade/theme-baseline');
const ref=process.env.P10_THEME_BASELINE_REF||'origin/main';
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const digest=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.wav':'audio/wav','.woff2':'font/woff2'};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 for(const file of ['results.json','baseline-provenance.json','chromium-log.txt','http-events.json','failure.png'])fs.rmSync(path.join(out,file),{force:true});
 const source=fs.mkdtempSync(path.join(os.tmpdir(),'math-p10-theme-main-'));
 const provenance={baselineRef:ref,baselineSha:git(['rev-parse',ref+'^{commit}']),
  testCheckoutSha:git(['rev-parse','HEAD']),testCheckoutTree:git(['rev-parse','HEAD^{tree}']),
  testFileSha256:digest(path.join(__dirname,'spatial-theme-overview-browser.cjs')),
  comparatorSha256:digest(path.join(__dirname,'camera-snapshot.cjs')),baselineModified:false};
 provenance.baselineTree=git(['rev-parse',provenance.baselineSha+'^{tree}']);
 let server,added=false;
 const requests=[];
 try{
  execFileSync('git',['worktree','add','--detach',source,provenance.baselineSha],{cwd:root,stdio:'pipe'});added=true;
  const dist=path.join(source,'dist');
  provenance.files={};
  for(const file of ['index.html','space.css','space.js','spatial-scene.js','spatial-labels.js','navigation-copy.js'])
   provenance.files[file]={baselineSha256:digest(path.join(dist,file)),currentSha256:digest(path.join(root,'dist',file))};
  server=http.createServer((req,res)=>{
   const pathname=new URL(req.url,'http://127.0.0.1').pathname;
   let rel;
   try{rel=decodeURIComponent(pathname).replace(/^\/+/, '')||'index.html';}catch{res.writeHead(400);return res.end('invalid path');}
   const filename=path.resolve(dist,rel);
   if(!filename.startsWith(dist+path.sep)){res.writeHead(400);return res.end('invalid path');}
   const evidence={time:new Date().toISOString(),method:req.method,path:pathname};requests.push(evidence);
   fs.readFile(filename,(error,data)=>{
    evidence.status=error?404:200;evidence.bytes=data?.length||0;
    if(error){res.writeHead(404,{'Cache-Control':'no-store'});return res.end('not found');}
    evidence.sha256=crypto.createHash('sha256').update(data).digest('hex');
    res.writeHead(200,{'Content-Type':mime[path.extname(filename)]||'application/octet-stream','Cache-Control':'no-store','Service-Worker-Allowed':'/'});
    res.end(data);
   });
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  provenance.url='http://127.0.0.1:'+server.address().port+'/';
  let output='';
  const result=await new Promise((resolve,reject)=>{
   const child=spawn(process.execPath,[path.join(__dirname,'spatial-theme-overview-browser.cjs')],{
    cwd:root,env:{...process.env,MATH_THEME_BASE_URL:provenance.url,MATH_THEME_SOURCE_ROOT:dist,MATH_THEME_OUTPUT:out},
    stdio:['ignore','pipe','pipe']
   });
   child.stdout.on('data',data=>{output+=data;process.stdout.write(data);});
   child.stderr.on('data',data=>{output+=data;process.stderr.write(data);});
   child.once('error',reject);
   child.once('exit',(code,signal)=>resolve({exitCode:code,signal}));
  });
  fs.writeFileSync(path.join(out,'chromium-log.txt'),output);
  Object.assign(provenance,result);
  provenance.baselineWorktreeStatus=execFileSync('git',['status','--porcelain'],{cwd:source,encoding:'utf8'}).trim();
  if(provenance.baselineWorktreeStatus)throw Error('baseline checkout was unexpectedly changed');
  const resultFile=path.join(out,'results.json');
  const checks=fs.existsSync(resultFile)?JSON.parse(fs.readFileSync(resultFile,'utf8')):null;
  provenance.passed=result.exitCode===0&&!checks?.failed;
  provenance.failure=checks?.failed||null;
  provenance.checksCompleted=checks?.checks?.length||0;
  provenance.sameLegendHoverObstruction=!!checks?.failed&&checks.failed.includes('locator.hover:')&&
   checks.failed.includes('network-guide')&&checks.failed.includes('intercepts pointer events');
  console.log('P10_THEME_MAIN_BASELINE '+JSON.stringify(provenance));
  if(!provenance.passed)process.exitCode=1;
 }catch(error){
  provenance.error=String(error);console.error(error.stack);process.exitCode=1;
 }finally{
  fs.writeFileSync(path.join(out,'baseline-provenance.json'),JSON.stringify(provenance,null,2));
  fs.writeFileSync(path.join(out,'http-events.json'),JSON.stringify({baselineSha:provenance.baselineSha,requests},null,2));
  if(server){server.closeAllConnections?.();await new Promise(resolve=>server.close(resolve));}
  if(added)execFileSync('git',['worktree','remove','--force',source],{cwd:root,stdio:'pipe'});
  else fs.rmSync(source,{recursive:true,force:true});
 }
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
