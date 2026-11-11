// Three independent Chromium processes and profiles, all running the complete
// historical-release upgrade acceptance. Diagnostic worker variants never count.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {spawnSync,execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p10-release-upgrade');
const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,
 testedTree:execFileSync('git',['rev-parse','HEAD^{tree}'],{cwd:root,encoding:'utf8'}).trim()};
fs.mkdirSync(out,{recursive:true});
const runs=[];
for(let repetition=1;repetition<=3;repetition++){
 const destination=path.join(out,'run-'+repetition);
 fs.mkdirSync(destination,{recursive:true});
 const result=spawnSync(process.execPath,[path.join(__dirname,'p10-release-upgrade-browser.cjs')],{
  cwd:root,encoding:'utf8',maxBuffer:20*1024*1024,timeout:300000,
  env:{...process.env,P10_SW_DIAGNOSTIC:'0',P10_UPGRADE_OUTPUT:destination,
   P10_UPGRADE_PORT:String(43828+repetition)}
 });
 const log=(result.stdout||'')+(result.stderr||'');
 fs.writeFileSync(path.join(destination,'chromium-log.txt'),log);
 process.stdout.write(log);
 const filename=path.join(destination,result.status===0?'results.json':'failure.json');
 const evidence=fs.existsSync(filename)?JSON.parse(fs.readFileSync(filename,'utf8')):null;
 const success=result.status===0&&evidence?.oldCommit==='96844424ceb534e7ca5f864a006b72a52efd0d60'&&
  evidence?.newCommit===checkoutSha&&Array.isArray(evidence?.checks)&&evidence.checks.length>0;
 runs.push({repetition,success,exitCode:result.status,signal:result.signal,error:result.error?.message,
  checks:evidence?.checks||[],oldCommit:evidence?.oldCommit,newCommit:evidence?.newCommit,
  evidence:path.relative(out,filename),historicalWorkerModified:false,diagnosticRuntimeInjection:false});
 console.log('P10_UPGRADE_REPETITION '+JSON.stringify({repetition,success,checks:evidence?.checks?.length}));
}
const complete=runs.every(run=>run.success);
fs.writeFileSync(path.join(out,complete?'results.json':'failure.json'),JSON.stringify({provenance,
 independentRuns:runs.length,successfulRuns:runs.filter(run=>run.success).length,runs,
 realHistoricalChildBackup:false,macManual:false,childTrial:false,independentTeaching:false},null,2));
assert.ok(complete,'all three complete, unmodified historical-release upgrades must pass');
console.log('P10_THREE_RELEASE_UPGRADES_OK');
