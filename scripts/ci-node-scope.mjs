// #264: conservative, fail-closed Node scope selection. Retain every original test.
// Pure CI edits run CI contract tests; only explicitly reviewed independent families
// get targeted Node tests. All other changes and manual milestone runs use FULL Node.
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {appendFileSync,existsSync,readdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ciPath=/^(?:\.github\/(?:workflows\/[^/]+\.ya?ml|ci-probes\/[a-zA-Z0-9/_-]+\.(?:sh|py))|ci\/(?:math-families|live-browser-matrix)\.json|scripts\/(?:ci-[a-zA-Z0-9_-]+|required-browser-checks|check-new-browser-viewports)\.mjs|tests\/(?:ci-[a-zA-Z0-9_-]+|required-browser-checks|deployment-static|desktop-viewport-policy)\.test\.mjs|docs\/DEVELOPMENT-WORKFLOW\.md|AGENTS\.md)$/;
const ciAlways=[
 'tests/deployment-static.test.mjs',
 'tests/required-browser-checks.test.mjs',
 'tests/desktop-viewport-policy.test.mjs',
];
const mathInvariants=[
 'tests/p9-evidence-contract.test.mjs',
 'tests/p9-numeric-compat.test.mjs',
 'tests/p10-numeric-save-races.test.mjs'
];
// A targeted family requires a reviewed, closed set of owned changed paths.
// Shared math modules, source inventories, cross-family edits, or any unknown
// path fall back to FULL Node; no guessed code dependencies.
const independentFamilies=Object.freeze({
 area:{
  paths:['dist/learning/area-evidence.js','tests/p9-area-adapter-browser.cjs',
   'tests/fixtures/p9-area-cases.cjs','tests/p9-area-evidence-adapter.test.mjs',
   'tests/p9-area-navigation.test.mjs'],
  tests:['tests/p9-area-evidence-adapter.test.mjs','tests/p9-area-navigation.test.mjs']
 },
 multable:{
  paths:['dist/learning/multable-evidence.js','tests/p9-multable-adapter-browser.cjs',
   'tests/p9-multable-evidence.test.mjs','tests/p9-multable-navigation.test.mjs'],
  tests:['tests/p9-multable-evidence.test.mjs','tests/p9-multable-navigation.test.mjs']
 },
 unitcover:{
  paths:['dist/learning/unitcover-evidence.js','tests/p9-unitcover-adapter-browser.cjs',
   'tests/p9-unitcover-evidence.test.mjs','tests/p9-unitcover-navigation.test.mjs'],
  tests:['tests/p9-unitcover-evidence.test.mjs','tests/p9-unitcover-navigation.test.mjs']
 }
});
const isSafePath=p=>typeof p==='string'&&p.length>0&&!p.startsWith('/')&&
 !p.includes('\\')&&!p.includes('..')&&/^[a-zA-Z0-9._/-]+$/.test(p);
const unchanged=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

export function chooseNodeScope(event,changes){
 assert.ok(['pull_request','push','workflow_dispatch'].includes(event),'Unknown Node CI event');
 assert.ok(Array.isArray(changes),'Missing git change inventory');
 for(const item of changes){
  assert.ok(item&&typeof item==='object'&&!Array.isArray(item),'Invalid file change');
  assert.ok(isSafePath(item.path),'Invalid changed file path');
  assert.ok(typeof item.status==='string'&&item.status.length>0,'Missing git change status');
 }
 if(event==='workflow_dispatch')return {mode:'full',family:null,reason:'milestone-full'};
 if(changes.length===0)return {mode:'full',family:null,reason:'empty-diff'};
 if(changes.some(x=>!['A','M'].includes(x.status)))
  return {mode:'full',family:null,reason:'deleted-renamed-or-special-file'};
 const files=[...new Set(changes.map(c=>c.path))].sort();
 if(files.every(file=>ciPath.test(file)))
  return {mode:'ci-only',family:null,reason:'ci-files-only'};
 for(const [family,definition] of Object.entries(independentFamilies)){
  if(files.every(file=>definition.paths.includes(file)))
   return {mode:'family',family,reason:'reviewed-isolated-family'};
 }
 return {mode:'full',family:null,reason:'shared-cross-family-or-unknown'};
}
export function ciTestFiles(availableFiles){
 assert.ok(Array.isArray(availableFiles),'Missing current CI tests');
 const selected=[...ciAlways,
  ...availableFiles.filter(x=>/^tests\/ci-[a-zA-Z0-9_-]+\.test\.mjs$/.test(x))];
 return [...new Set(selected)].sort();
}
export function chosenTests(scope,allTests,availableCiFiles){
 assert.ok(scope&&['full','ci-only','family'].includes(scope.mode),'Invalid Node scope');
 assert.ok(Array.isArray(allTests)&&allTests.length>0,'Missing full Node test inventory');
 assert.ok(allTests.every(x=>isSafePath(x)&&x.startsWith('tests/')&&x.endsWith('.test.mjs')),
  'Unsafe full Node test entrypoint');
 if(scope.mode==='full')return [...new Set(allTests)];
 const selected=ciTestFiles(availableCiFiles);
 if(scope.mode==='family'){
  const family=independentFamilies[scope.family];
  assert.ok(family,'Unregistered isolated Node family');
  selected.push(...mathInvariants,...family.tests);
 }
 const present=[...new Set(selected)].sort();
 const baseline=new Set(allTests);
 // The fast path is allowed to add a new ci-*.test.mjs, never silently drop
 // an unregistered required math or CI test.
 assert.ok(present.every(x=>baseline.has(x)||/^tests\/ci-[a-zA-Z0-9_-]+\.test\.mjs$/.test(x)),
  'Selected file missing from full invariant inventory');
 return present;
}
export function readGitChanges(event=process.env.GITHUB_EVENT_NAME){
 if(event==='workflow_dispatch')return [];
 let args;
 if(event==='pull_request'){
  const name=process.env.GITHUB_BASE_REF;
  assert.ok(typeof name==='string'&&/^[a-zA-Z0-9/_-]+$/.test(name),'Missing safe PR base');
  args=['diff','--name-status','origin/'+name+'...HEAD'];
 }else if(event==='push'){
  args=['diff','--name-status','HEAD^','HEAD'];
 }else throw Error('Unknown GitHub event');
 const stdout=execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:1024*1024});
 const changes=[];
 for(const line of stdout.trim().split('\n').filter(Boolean)){
  const parts=line.split('\t'),status=parts[0];
  assert.ok(parts.length>=2&&typeof status==='string','Malformed Git change status');
  if(status.startsWith('R')||status.startsWith('C')){
   assert.ok(parts.length===3,'Malformed renamed path');
   changes.push({status,path:parts[1]},{status,path:parts[2]});
  }else{
   assert.ok(parts.length===2,'Unexpected Git file status');
   changes.push({status,path:parts[1]});
  }
 }
 return changes;
}
const currentScope=()=>chooseNodeScope(process.env.GITHUB_EVENT_NAME,readGitChanges());
const allCiTests=()=>{
 const dir=resolve(root,'tests');
 return readdirSync(dir).filter(p=>/^ci-[a-zA-Z0-9_-]+\.test\.mjs$/.test(p))
  .map(p=>'tests/'+p);
};
function main(args=process.argv.slice(2)){
 const [operation,...allTests]=args;
 assert.ok(['output','run'].includes(operation),'Expected output or run');
 const scope=currentScope();
 if(operation==='output'){
  assert.ok(process.env.GITHUB_OUTPUT,'Missing GitHub output file');
  appendFileSync(process.env.GITHUB_OUTPUT,'mode='+scope.mode+'\n');
  console.log('NODE_SCOPE '+JSON.stringify({...scope,changedCount:readGitChanges().length}));return;
 }
 assert.equal(process.env.MATH_NODE_EXPECTED_SCOPE,scope.mode,
  'Node scope does not match independently planned CI output');
 const files=chosenTests(scope,allTests,allCiTests());
 assert.ok(files.length>0,'Cannot run zero Node tests');
 for(const file of files)assert.ok(existsSync(resolve(root,file)),'Selected Node test does not exist: '+file);
 console.log('NODE_SCOPE_RUN '+JSON.stringify({mode:scope.mode,family:scope.family,
  selectedFiles:files.length,fullInventoryFiles:allTests.length,selected:files}));
 const result=spawnSync(process.execPath,['--test',...files],{cwd:root,stdio:'inherit'});
 if(result.error)throw result.error;
 if(result.signal)throw Error('Node test process killed by '+result.signal);
 if(result.status!==0)process.exitCode=result.status??1;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{main();}catch(error){console.error(error.stack||String(error));process.exitCode=1;}
}
