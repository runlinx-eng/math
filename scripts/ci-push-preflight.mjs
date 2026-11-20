// Quick, read-only checks before the first remote push for a math-family PR.
// These checks already exist individually; run them together so registry/capacity
// and release/hash mistakes are found before they create another CI attempt.
import {spawnSync} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const contractTests=Object.freeze([
 'tests/ci-release-sync.test.mjs',
 'tests/ci-plan-math-families.test.mjs',
 'tests/ci-live-matrix.test.mjs',
 'tests/ci-matrix-bridge.test.mjs',
 'tests/ci-targeted-checks.test.mjs',
 'tests/ci-node-scope.test.mjs',
 'tests/p9-evidence-contract.test.mjs'
]);
export const PREFLIGHT_STEPS=Object.freeze([
 Object.freeze({id:'release-and-reviewed-hashes',args:Object.freeze(['scripts/ci-release-sync.mjs','check'])}),
 Object.freeze({id:'registered-browser-capacity',args:Object.freeze(['scripts/ci-live-browser-matrix.mjs','inspect'])}),
 Object.freeze({id:'registry-and-source-contract-tests',args:Object.freeze(['--test',...contractTests])})
]);

const runNode=(args,cwd)=>spawnSync(process.execPath,args,{cwd,stdio:'inherit',timeout:180000});

export function runPushPreflight({cwd=root,run=runNode,report=console.log}={}){
 const passed=[];
 for(const step of PREFLIGHT_STEPS){
  report('PUSH_PREFLIGHT_START '+step.id);
  const result=run(step.args,cwd);
  if(!result||result.error||result.signal||result.status!==0){
   const reason=result?.error?.message||result?.signal||('exit '+String(result?.status));
   throw Error(step.id+' failed ('+reason+'); fix before pushing; do not weaken tests');
  }
  passed.push(step.id);
 }
 const summary={passed,readOnly:true,remotePushes:0};
 report('PUSH_PREFLIGHT_OK '+JSON.stringify(summary));
 return summary;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  if(process.argv.length!==2)throw Error('Usage: node scripts/ci-push-preflight.mjs');
  runPushPreflight();
 }catch(error){
  console.error('PUSH_PREFLIGHT_FAILED '+error.message);
  process.exitCode=1;
 }
}
