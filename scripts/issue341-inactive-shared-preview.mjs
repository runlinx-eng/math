#!/usr/bin/env node
// #341: INACTIVE five-family preview; neither math reruns nor runtime registration.
import {createHash} from 'node:crypto';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTaskFor} from '../dist/learning/bridges.js';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const prefix='docs/math-parallel/issue-341-formal-365/';
const load=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const canonical=x=>Array.isArray(x)?x.map(canonical):
 x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,canonical(x[k])])):x;
const fingerprint=x=>createHash('sha256').update(JSON.stringify(canonical(x))).digest('hex');
const errors=[],rows=[];const fail=(code,position)=>errors.push({code,position});
const dir=resolve(root,'verification/issue341-inactive-shared-preview');
mkdirSync(dir,{recursive:true});
let result;
try{
 await ensureB39Ready();
 const proposal=load(prefix+'b-first-12-INACTIVE-integration-proposal.json');
 const stage=load(prefix+'staging-integration/INACTIVE-shared-5x12-preparation.json');
 const ledger=load(prefix+'issue-341-formal-365-intake.json');
 const official=load('docs/spatial-learning/evidence-review-manifest.json');
 if(proposal.status!=='NOT_APPROVED_NOT_RUNTIME_REGISTERED'||
    stage.status!=='INACTIVE_PREPARATION_ONLY_NOT_APPROVED_NOT_RUNTIME_REGISTERED'||
    proposal.proposedManifestEntries.length!==12||stage.families.length!==5||
    ledger.rows.length!==365||official.tasks.length!==813)
    throw Error('Frozen preview counts/status changed');
 const approved=new Set(official.tasks.map(x=>x.sessionId+':'+x.index));
 const frozen=new Map(ledger.rows.map(x=>[x.position,x]));
 const candidates=[];
 for(const f of stage.families){
   if(f.method!==null||f.adapterId!=='issue341-'+f.packet||!f.questionOnly||
     !f.feedbackCopy?.summary||!f.feedbackCopy?.detail||!f.feedbackCopy?.question)
     fail('method-or-feedback-boundary',f.packet);
   const mod=await import(pathToFileURL(resolve(root,f.path)).href);
   for(const k of ['bindingExport','replayExport','submittedExport'])
     if(typeof mod[f[k]]!=='function')fail('missing-module-export',f.packet+':'+k);
   candidates.push({f,bind:mod[f.bindingExport]});
 }
 for(const item of proposal.proposedManifestEntries){
   const key=item.sessionId+':'+item.index;
   const fixed=frozen.get(key),task=sessionTaskFor(item.sessionId,item.index);
   const node=LESSONS[item.sessionId]?.topicId;
   if(!fixed||!task||Object.hasOwn(BRIDGES,item.sessionId)){fail('not-native',key);continue;}
   const sha=fingerprint(task);
   if(node!==fixed.nodeId||item.nodeId!==node||sha!==fixed.taskSha256||
      item.taskHash!==sha||item.type!==task.type||item.method!==null||
      fixed.formalStrictA!=='NOT_GRANTED'||approved.has(key))
     fail('source-or-official-grant-conflict',key);
   const matched=[];
   for(const c of candidates){
     try{const b=c.bind(task,{sessionId:item.sessionId,index:item.index});if(b)matched.push({c,b});}
     catch(e){fail('candidate-binding-exception',key+':'+e);}
   }
   if(matched.length!==1||matched[0].c.f.adapterId!==item.adapter||
      matched[0].b.method!==null)fail('nonexclusive-or-method',key);
   for(const adapter of EVIDENCE_ADAPTERS){
     if(adapter.type!==task.type)continue;
     try{if(adapter.binding(task,{sessionId:item.sessionId,index:item.index}))
       fail('already-runtime-registered',key);}
     catch(e){fail('existing-binding-exception',key+':'+e);}
   }
   rows.push({position:key,nodeId:node,taskHash:sha,adapter:item.adapter,method:null});
 }
 if(rows.length!==12||new Set(rows.map(x=>x.position)).size!==12)fail('position-count',rows.length);
 for(const f of stage.families)
   if(rows.filter(x=>x.adapter===f.adapterId).length!==f.count)fail('family-count',f.packet);
 result={schema:'issue-341-inactive-shared-preview/1',
  status:errors.length?'FAIL':'PASS_INACTIVE_PREVIEW_ONLY',head:process.env.GITHUB_SHA||null,
  checkedPositions:rows.length,checkedFamilies:stage.families.length,
  existingBengineeringAccepted:308,currentApprovedA:official.tasks.length,newStrictA:0,
  mathematicalRetestsRun:0,chromiumRetestsRun:0,approvedManifestModified:false,
  candidateRuntimeRegistered:false,methodLabelsApproved:false,errors,rows};
}catch(error){
 fail('startup-exception',String(error.stack||error));
 result={status:'FAIL',newStrictA:0,mathematicalRetestsRun:0,
  approvedManifestModified:false,candidateRuntimeRegistered:false,errors,rows};
}
writeFileSync(resolve(dir,'results.json'),JSON.stringify(result,null,2)+'\n');
console.log('ISSUE341_INACTIVE_PREVIEW',result.status,'positions',rows.length,'errors',errors.length);
if(errors.length)process.exitCode=1;
