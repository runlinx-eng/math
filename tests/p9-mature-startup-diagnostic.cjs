// Issue #180 diagnostic only. Keep the four original evidence-expansion commands,
// order, isolated child processes and failure continuation. Only command one
// substitutes a source-checked observer copy; this receipt is never a gate.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {execFileSync,spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-mature-startup-diagnostic');
const baseline='f7c8f1103207be217af014163e086b007728d0d6';
const mature='tests/p9-mature-expansion-browser.cjs',observedMature='tests/p9-mature-expansion-startup-diagnostic.cjs';
const originals=[mature,'tests/p9-route-adapter-browser.cjs',
 'tests/p9-fraction-order-adapter-browser.cjs','tests/p9-fraction-operations-adapter-browser.cjs'];
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
async function main(){
 const {BROWSER_GROUPS,commandEnvironment,runBrowserGroup}=await import('../scripts/required-browser-checks.mjs');
 const definition=BROWSER_GROUPS['evidence-expansion'];
 assert.deepEqual(definition.commands,originals.map(file=>({file,env:{}})),'preserve the exact original four-command inventory');
 const unchanged=[...originals,'scripts/required-browser-checks.mjs'];
 const sources=unchanged.map(file=>{const actual=fs.readFileSync(path.join(root,file)),frozen=execFileSync('git',['show',baseline+':'+file],{cwd:root});assert.deepEqual(actual,frozen,file+' must remain byte-for-byte equal to PR169');return {file,bytes:actual.length,sha256:hash(actual)};});
 const {verifySource}=require('./helpers/p9-mature-startup-observer.cjs');
 const provenance=verifySource(root,path.join(root,observedMature));
 const sha=git(['rev-parse','HEAD']);assert.equal(process.env.GITHUB_SHA,sha,'checkout matches the actual triggering SHA');
 assert.equal(process.env.MATH_BROWSER_REQUIRED,'true');assert.equal(process.env.MATH_BROWSER_GROUP,'evidence-expansion');
 const context={sha,event:process.env.GITHUB_EVENT_NAME,runId:process.env.GITHUB_RUN_ID,attempt:Number(process.env.GITHUB_RUN_ATTEMPT)};
 fs.mkdirSync(out,{recursive:true});const destination=path.join(out,'command-results.json');assert.ok(!fs.existsSync(destination),'never overwrite an earlier command receipt');
 const receipt={schema:'math-p9-mature-startup-diagnostic/1',diagnosticOnly:true,countsTowardAcceptance:false,provenance,context,
  originalCommandSources:sources,originalGroup:'evidence-expansion',originalGroupDefinition:definition,
  substitutedOriginal:mature,substitutedActual:observedMature,status:'incomplete',commands:[],originalRunnerStatus:null};
 const save=()=>fs.writeFileSync(destination,JSON.stringify(receipt,null,2)+'\n');save();
 const report=runBrowserGroup({group:'evidence-expansion',scope:'true',context,log:console.log,execute:command=>{
  const actualFile=command.file===mature?observedMature:command.file,environment=commandEnvironment(process.env,command);
  // Chromium stderr is observed for the target command; subsequent workloads
  // receive the unchanged commandEnvironment without an extra DEBUG setting.
  if(command.file===mature)environment.DEBUG='pw:browser';
  const entry={originalFile:command.file,actualFile,actualSHA256:hash(fs.readFileSync(path.join(root,actualFile))),
   diagnosticSubstitution:command.file===mature,commandEnv:command.env,diagnosticEnv:command.file===mature?{DEBUG:'pw:browser'}:{},
   startedAt:new Date().toISOString(),status:'running'};
  receipt.commands.push(entry);save();console.log('DIAGNOSTIC_ACTUAL_COMMAND '+JSON.stringify(entry));
  const started=Date.now(),result=spawnSync(process.execPath,[actualFile],{cwd:root,stdio:'inherit',env:environment});
  Object.assign(entry,{finishedAt:new Date().toISOString(),elapsedMs:Date.now()-started,exitCode:result.status,signal:result.signal||null,error:result.error?String(result.error):null,
   status:result.status===0&&!result.signal&&!result.error?'success':'failure'});save();
  return result;
 }});
 assert.equal(receipt.commands.length,originals.length);assert.deepEqual(receipt.commands.map(value=>value.originalFile),originals);
 receipt.originalRunnerStatus=report.status;receipt.status=report.status;save();
 console.log('P9_MATURE_STARTUP_DIAGNOSTIC '+JSON.stringify({status:receipt.status,commands:receipt.commands.length,requiredGate:false,headSha:provenance.headSha,testedCheckoutSha:sha}));
 if(receipt.status!=='success')process.exitCode=1;
}
if(require.main===module)main().catch(error=>{console.error(error.stack);process.exitCode=1;});
