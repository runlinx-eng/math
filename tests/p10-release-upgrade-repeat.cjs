// Three independent Chromium processes and profiles, all running the complete
// historical-release upgrade acceptance. Diagnostic worker variants never count.
// An additional retry-only process always runs, even if all full runs fail early.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {spawnSync,execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p10-release-upgrade');
const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,
 testedTree:execFileSync('git',['rev-parse','HEAD^{tree}'],{cwd:root,encoding:'utf8'}).trim()};
fs.mkdirSync(out,{recursive:true});
for(const file of ['results.json','failure.json'])fs.rmSync(path.join(out,file),{force:true});
const runPhase=({phase,folder,port,repetition=null})=>{
 const destination=path.join(out,folder);
 fs.mkdirSync(destination,{recursive:true});
 for(const file of ['results.json','failure.json'])fs.rmSync(path.join(destination,file),{force:true});
 let result;
 try{
  result=spawnSync(process.execPath,[path.join(__dirname,'p10-release-upgrade-browser.cjs')],{
   cwd:root,encoding:'utf8',maxBuffer:20*1024*1024,timeout:300000,
   env:{...process.env,P10_SW_DIAGNOSTIC:'0',P10_UPGRADE_PHASE:phase,
    P10_UPGRADE_OUTPUT:destination,P10_UPGRADE_PORT:String(port)}
  });
 }catch(error){result={status:null,error};}
 const log=(result.stdout||'')+(result.stderr||'');
 fs.writeFileSync(path.join(destination,'chromium-log.txt'),log);
 process.stdout.write(log);
 const filename=path.join(destination,result.status===0?'results.json':'failure.json');
 let evidence=null,evidenceError=null;
 try{if(fs.existsSync(filename))evidence=JSON.parse(fs.readFileSync(filename,'utf8'));}
 catch(error){evidenceError=String(error);}
 const success=result.status===0&&evidence?.oldCommit==='96844424ceb534e7ca5f864a006b72a52efd0d60'&&
  evidence?.newCommit===checkoutSha&&evidence?.phase===phase&&evidence?.retryCompleted===true&&
  evidence?.fullUpgradeCompleted===(phase==='full')&&evidence?.workerDiagnostic===false&&
  evidence?.provenance?.historicalWorkerModified===false&&!!evidence?.provenance?.profileId&&
  Array.isArray(evidence?.checks)&&evidence.checks.length>0;
 const run={phase,repetition,countsTowardThreeFullRuns:phase==='full',success,
  exitCode:result.status,signal:result.signal,error:result.error?.message,evidenceError,
  checks:evidence?.checks||[],oldCommit:evidence?.oldCommit,newCommit:evidence?.newCommit,
  profileId:evidence?.provenance?.profileId,profiles:evidence?.provenance?.profiles||[],
  fullUpgradeCompleted:evidence?.fullUpgradeCompleted===true,retryCompleted:evidence?.retryCompleted===true,
  evidence:path.relative(out,filename),historicalWorkerModified:false,diagnosticRuntimeInjection:false};
 console.log((phase==='full'?'P10_UPGRADE_REPETITION ':'P10_RETRY_INDEPENDENT ')+JSON.stringify({phase,repetition,success,checks:evidence?.checks?.length}));
 return run;
};
const runs=[];
for(let repetition=1;repetition<=3;repetition++){
 runs.push(runPhase({phase:'full',repetition,folder:'run-'+repetition,port:43828+repetition}));
}
const retryIndependent=runPhase({phase:'retry',folder:'retry-independent',port:43832});
const allRuns=[...runs,retryIndependent];
const independentProfiles=allRuns.every(run=>!!run.profileId)&&new Set(allRuns.map(run=>run.profileId)).size===allRuns.length;
const complete=runs.every(run=>run.success)&&retryIndependent.success&&independentProfiles;
fs.writeFileSync(path.join(out,complete?'results.json':'failure.json'),JSON.stringify({provenance,
 independentRuns:runs.length,successfulRuns:runs.filter(run=>run.success).length,runs,
 independentRetryRequired:true,retryIndependent,independentProfiles,
 realHistoricalChildBackup:false,macManual:false,childTrial:false,independentTeaching:false},null,2));
assert.ok(complete,'all three complete historical-release upgrades and the independent retry must pass with separate profiles');
console.log('P10_THREE_RELEASE_UPGRADES_AND_INDEPENDENT_RETRY_OK');
