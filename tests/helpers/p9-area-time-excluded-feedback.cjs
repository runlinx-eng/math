'use strict';
// Only use this on original family exclusions, never to replace native proof
// assertions or to authorize a new source. Keep separately reviewed feedback
// and original family coverage distinct.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {createHash}=require('node:crypto');
const pinned=require('../fixtures/p9-area-time-cross-family-boundaries.cjs');
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'
 ?Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const hash=t=>createHash('sha256').update(JSON.stringify(stable(t))).digest('hex');
const key=c=>JSON.stringify([c.sessionId??c.id,c.index]);

async function createExcludedFeedbackAudit(family,excluded,taskFor,rows=pinned[family]){
 assert.ok(Array.isArray(rows),'explicit original family and reviewed positions required');
 const approved=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../docs/spatial-learning/evidence-review-manifest.json'),'utf8')).tasks;
 const sourceMap=new Map(excluded.map(c=>[key(c),c]));
 const officialByPosition=new Map(approved.map(c=>[key(c),c]));
 const rowMap=new Map(rows.map(c=>[key(c),c]));
 assert.equal(rowMap.size,rows.length);
 for(const c of excluded){
  const official=officialByPosition.get(key(c)),row=rowMap.get(key(c));
  if(official)assert.deepEqual(row,official,'exact other-family admission must be reviewed and pinned separately');
  else assert.equal(row,undefined,'no permission for unapproved position');
 }
 for(const row of rows){
  const c=sourceMap.get(key(row));assert.ok(c,'not an original exclusion');
  const task=taskFor(c);assert.equal(hash(task),row.taskHash);assert.equal(task.type,row.type);
  assert.equal(c.taskHash,row.taskHash);
  // Some frozen prerequisite fixtures include the exact task/hash but omit
  // nodeId. In those cases the manifest's exact native binding below verifies
  // source identity; when a fixture specifies a node, retain its assertion.
  if(c.nodeId!==undefined)assert.equal(c.nodeId,row.nodeId);
  assert.deepEqual(officialByPosition.get(key(row)),row);
 }
 const {ISSUE341_FORMAL_MANIFEST}=await import('../../dist/learning/issue341-formal-admissions.js');
 const {createIssue341ManifestGatedRouting}=await import('../../dist/learning/issue341-formal-source-routing.js');
 const {thinkingGuide,thinkingFeedback}=await import('../../dist/learning/thinking-feedback.js');
 const {latestSubmissionMatches}=await import('../../dist/learning/evidence-contract.js');
 const {inspect}=await import('../../dist/learning/tasks.js');
 const formal=createIssue341ManifestGatedRouting(ISSUE341_FORMAL_MANIFEST);
 const norm=v=>String(v).replace(/\s+/g,' ').trim();

 return async function audit(page,c,model,record){
  const task=taskFor(c),context={sessionId:c.id,index:c.index},row=rowMap.get(key(c));
  const guide=page.locator('#thinking-guide'),hint=page.locator('#thinking-feedback');
  if(!row){
   assert.equal(await guide.count(),0,'unapproved exclusion must not receive another guide');
   assert.equal(await hint.count(),0,'unapproved exclusion must not receive another feedback');
   return {adapter:null,guide:false,feedback:false,strictOriginalFamily:false};
  }
  const resolved=formal.registry.resolve(task,context);
  assert.equal(resolved.status,'matched','exact approved position must resolve uniquely');
  const {adapter,binding}=resolved.match;
  assert.equal(adapter.id,row.adapter,'no same-widget or other-family borrowing');
  assert.ok(binding);
  const originalGuide=thinkingGuide(task,context);
  const expectedGuide=originalGuide||(row.adapter.startsWith('issue341-')?formal.guide(task,context):null);
  const originalNote=record?thinkingFeedback(task,model,record,context):null;
  const expectedNote=originalNote||(record&&row.adapter.startsWith('issue341-')?formal.feedback(task,model,record,context):null);
  assert.equal(await guide.count(),expectedGuide?1:0,'only the exact approved guide may appear');
  if(expectedGuide){
   assert.equal(await guide.isVisible(),true);
   assert.equal(await guide.evaluate(el=>el.open),false,'optional guide remains closed');
   assert.equal(norm(await guide.locator('summary').textContent()),norm(expectedGuide.summary));
   assert.equal(norm(await guide.locator('p').textContent()),norm(expectedGuide.question));
  }
  // Count is not the evidence gate. The frozen exact source, original grader,
  // latest submitted model and the actual adapter proof must all agree.
  const submitted=!!record&&latestSubmissionMatches(model,record)&&inspect(task,model).correct;
  const proof=submitted?(typeof adapter.submitted==='function'
   ?adapter.submitted(task,model,record,context):adapter.replay(task,model,context)):null;
  if(expectedNote)assert.ok(submitted&&proof,'other-family feedback must have its own exact mathematical proof');
  if(!submitted)assert.equal(expectedNote,null,'no feedback before a matching correct original submission');
  if(submitted&&proof)assert.ok(expectedNote,'a successful separate proof must render its existing feedback');
  assert.equal(await hint.count(),expectedNote?1:0,'rendered feedback must match the exact approved proof boundary');
  if(expectedNote){
   assert.equal(await hint.isVisible(),true);
   assert.equal(norm(await hint.locator(':scope > strong').textContent()),norm(expectedNote.title));
   assert.equal(norm(await hint.locator(':scope > p').nth(0).textContent()),norm(expectedNote.observation));
   assert.equal(norm(await hint.locator(':scope > p').nth(1).textContent()),norm(expectedNote.connection));
   assert.equal(await hint.locator(':scope > small').count(),expectedNote.detail.length?1:0);
   if(expectedNote.detail.length)assert.equal(norm(await hint.locator(':scope > small').textContent()),norm(expectedNote.detail.join(' ')));
   const method=hint.locator('[data-thinking-node-id]');
   assert.equal(await method.count(),expectedNote.method?1:0);
   if(expectedNote.method)assert.equal(await method.getAttribute('data-thinking-node-id'),expectedNote.method.nodeId);
  }
  return {adapter:row.adapter,taskHash:row.taskHash,guide:!!expectedGuide,feedback:!!expectedNote,proof:proof||null,strictOriginalFamily:false};
 };
}
module.exports={createExcludedFeedbackAudit};
