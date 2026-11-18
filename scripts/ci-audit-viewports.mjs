// Issue #239 read-only migration inventory audit. Does not run Chromium or alter CI scopes.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {BROWSER_GROUPS,GROUP_NAMES} from './required-browser-checks.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(readFileSync(resolve(root,'ci/issue239-legacy-browser-inventory.json'),'utf8'));
const capacitySplit=JSON.parse(readFileSync(resolve(root,'ci/issue239-p10-capacity-split.json'),'utf8'));
const same=(a,b)=>assert.deepEqual(a,b);
const expectedSha='0231280c506309f3487f0d4a8dfe2f266068a9bf';
const pilotMarkers={
 area:['const viewports=[[1440,900],[1280,720]]','boundaryRetries','navigationTransitions','backupImportsCompleted','origin stops'],
 unitcover:['viewports=[[1440,900],[1280,720]]','unitcoverNativeFlow','capacity','forgeries','nativeBackupImportsCompleted'],
 multable:['viewports=[[1440,900],[1280,720]]','multableNativeFlow','capacity','forgeries','Promise.allSettled(viewports.map(runViewport)']
};
export function validateFrozenInventory(){
 assert.equal(manifest.schema,'math-ci-issue239-legacy-browser-inventory/1');
 assert.equal(manifest.source.checkoutSha,expectedSha);
 assert.equal(manifest.source.inventoryBlobSha,'70f0806d4365149fc95cc81ab1f6efd8383493eb');
 assert.equal(manifest.standardContentBox.state,'pending semantic/layout/coordinate review');
 assert.deepEqual(manifest.standardContentBox.candidate,[1440,900]);
 // Frozen source remains the original 12 groups/86 commands; the separate
 // reviewed capacity contract authorizes exactly one 6+2 split, no omissions.
 assert.equal(manifest.groups.length,12);
 assert.equal(capacitySplit.schema,'math-ci-p10-capacity-split/1');
 assert.equal(capacitySplit.legacySourceSha,expectedSha);
 assert.equal(capacitySplit.from,'p10-learning');
 same(capacitySplit.groupCuts,[{id:'p10-learning',start:0,end:6},{id:'p10-learning-tail',start:6,end:8}]);
 const sourceGroup=manifest.groups.find(x=>x.id===capacitySplit.from);
 assert.equal(sourceGroup.commands.length,8);
 assert.equal(sourceGroup.evidenceDirs.length,8);
 const reviewedGroups=manifest.groups.flatMap(group=>group.id!==capacitySplit.from?[group]:
  capacitySplit.groupCuts.map(cut=>({id:cut.id,
   commands:group.commands.slice(cut.start,cut.end),
   evidenceDirs:group.evidenceDirs.slice(cut.start,cut.end)})));
 same(GROUP_NAMES,reviewedGroups.map(x=>x.id));
 for(const group of reviewedGroups){
  same(BROWSER_GROUPS[group.id].commands,group.commands.map(c=>({file:c.entry,env:c.env})));
  same(BROWSER_GROUPS[group.id].artifacts,group.evidenceDirs);
 }
 const expected=manifest.groups.flatMap(group=>group.commands.map(c=>({entry:c.entry,env:c.env})));
 const actual=GROUP_NAMES.flatMap(id=>BROWSER_GROUPS[id].commands.map(c=>({entry:c.file,env:c.env})));
 same(actual,expected);
 same(GROUP_NAMES.flatMap(id=>BROWSER_GROUPS[id].artifacts),manifest.groups.flatMap(x=>x.evidenceDirs));
 assert.equal(actual.length,86);
 assert.equal(new Set(actual.map(x=>x.entry)).size,85);
 const outputDirs=manifest.groups.flatMap(x=>x.evidenceDirs);
 assert.equal(new Set(outputDirs).size,outputDirs.length);
 assert.equal(outputDirs.length,83);
 assert.deepEqual(manifest.pilots.map(x=>x.family),['area','unitcover','multable']);
 for(const entry of expected)assert.ok(existsSync(resolve(root,entry.entry)),entry.entry);
 for(const pilot of manifest.pilots){
  assert.equal(pilot.sceneMapping,'pending','Pilot cannot claim scenario equivalence');
  const source=readFileSync(resolve(root,pilot.entry),'utf8');
  for(const marker of pilotMarkers[pilot.family])assert.ok(source.includes(marker),pilot.family+' lost protected legacy marker: '+marker);
 }
 return {groups:GROUP_NAMES.length,commands:actual.length,distinctScripts:85,evidenceDirs:outputDirs.length};
}
const selected=/\b(?:1440|900|1280|720|980|760|620|800|1920|1080|1000|1350|1024|1365)\b/;
const viewportPattern=/viewports?|setViewportSize|newContext|innerWidth|scrollWidth|boundingBox|screenshot|width|height/i;
export function scanViewports(){
 const entries=[...new Set(manifest.groups.flatMap(g=>g.commands.map(c=>c.entry)))];
 return entries.map(entry=>{
  const source=readFileSync(resolve(root,entry),'utf8'),matches=[];
  source.split('\n').forEach((line,index)=>{
   if((selected.test(line)&&viewportPattern.test(line))||/setViewportSize\s*\(|viewports\s*=/.test(line))
    matches.push({line:index+1,excerpt:line.trim().slice(0,240)});
  });
  return {entry,candidate1440:source.includes('1440'),secondary1280:source.includes('1280'),
   needsManualSceneReview:matches.length>0,viewportEvidence:matches,
   note:'Static source references only; no claim that every viewport or scenario was executed'};
 });
}
export function audit(){
 const locked=validateFrozenInventory(),scripts=scanViewports();
 assert.equal(scripts.length,85);
 const unresolved=scripts.filter(x=>!x.needsManualSceneReview).map(x=>x.entry);
 return {schema:'math-ci-issue239-viewport-static-audit/1',
  baseline:manifest.source,locked,standardContentBox:manifest.standardContentBox,
  statuses:{semanticScenarioMap:'pending',layoutObstructionAudit:'pending',browserPilot:'not-run',requiredGate:'unchanged'},
  unresolvedStaticReferences:unresolved, scripts};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const report=audit();
 process.stdout.write(JSON.stringify(report,null,2)+'\n');
}
