#!/usr/bin/env node
// #341: read-only preintegration source/registry audit; not a math-test rerun.
// Never write the approved review manifest, learner state, original tasks or main.
import {createHash} from 'node:crypto';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTaskFor} from '../dist/learning/bridges.js';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const path='docs/math-parallel/issue-341-formal-365/';
const read=name=>JSON.parse(readFileSync(resolve(root,name),'utf8'));
const stable=value=>Array.isArray(value)?value.map(stable):
  value&&typeof value==='object'?Object.fromEntries(
    Object.keys(value).sort((a,b)=>a.localeCompare(b,'en'))
      .map(key=>[key,stable(value[key])])):value;
const fingerprint=value=>createHash('sha256')
  .update(JSON.stringify(stable(value))).digest('hex');
const position=row=>row.sessionId+':'+row.index;
const indexOf=label=>{const i=label.lastIndexOf(':');return {
  sessionId:label.slice(0,i),index:Number(label.slice(i+1))
};};
const errorList=[],proposed=[],details=[];
const fail=(code,where,detail)=>errorList.push({code,where,detail:String(detail)});
const reportDir=resolve(root,'verification/issue341-preintegration-source-lock');
mkdirSync(reportDir,{recursive:true});
const auditSha=process.env.GITHUB_SHA||null;

try{
  await ensureB39Ready();
  const ledger=read(path+'issue-341-formal-365-intake.json');
  const catalog=read(path+'staging-integration/exports-all-113.json');
  const approved=read('docs/spatial-learning/evidence-review-manifest.json');

  if(ledger.rows?.length!==365||catalog.families?.length!==113||
     approved.schema!=='math-evidence-reviewed-sources/1'||approved.tasks?.length!==813)
    throw Error('Frozen input counts differ: ledger 365, families 113, existing A813 required');
  if(new Set(ledger.rows.map(row=>row.position)).size!==365)
    throw Error('Duplicate frozen candidate native position');
  if(new Set(catalog.families.map(row=>row.packet)).size!==113)
    throw Error('Duplicate proposed family/adapter identifier');

  const official=new Map();
  for(const row of approved.tasks){
    if(!Number.isInteger(row.index)||!row.sessionId)throw Error('Malformed existing approved entry');
    const key=position(row);
    if(official.has(key))throw Error('Duplicate approved main source: '+key);
    official.set(key,row);
  }
  const rowsByPacket=new Map();
  for(const row of ledger.rows){
    if(!rowsByPacket.has(row.packet))rowsByPacket.set(row.packet,[]);
    rowsByPacket.get(row.packet).push(row);
    if(official.has(row.position))
      fail('already-approved-position',row.position,'Would duplicate a reviewed A position');
  }
  const modules=[];
  for(const spec of catalog.families){
    const rs=rowsByPacket.get(spec.packet)||[];
    if(rs.length===0)fail('empty-family',spec.packet,'No candidate source positions');
    if(rs.some(row=>row.group!==spec.group))
      fail('family-group-mismatch',spec.packet,'Group differs from fixed ledger');
    const candidate=await import(pathToFileURL(resolve(root,spec.path)).href);
    for(const key of ['bindingExport','replayExport','submittedExport']){
      if(typeof candidate[spec[key]]!=='function')
        fail('missing-candidate-export',spec.packet,spec[key]+'='+spec[spec.key]);
    }
    const binding=candidate[spec.bindingExport];
    if(typeof binding!=='function')continue;
    modules.push({id:'issue341-'+spec.packet,packet:spec.packet,spec,binding});
  }
  if(modules.length!==113)
    fail('candidate-module-count','all','113 binding exports required; observed '+modules.length);

  for(const item of ledger.rows){
    const {sessionId,index}=indexOf(item.position);
    if(!sessionId||!Number.isSafeInteger(index)||index<0){
      fail('malformed-position',item.position,'Invalid native location');
      continue;
    }
    if(!Object.hasOwn(LESSONS,sessionId)||Object.hasOwn(BRIDGES,sessionId)){
      fail('non-native-position',item.position,'Session is absent or a related bridge');
      continue;
    }
    const task=sessionTaskFor(sessionId,index),nodeId=LESSONS[sessionId]?.topicId;
    if(!task||typeof task.type!=='string'){
      fail('missing-native-task',item.position,'Original native task not found');
      continue;
    }
    const sha=fingerprint(task);
    if(nodeId!==item.nodeId||sha!==item.taskSha256)
      fail('changed-original-task',item.position,
        'node='+nodeId+' sha='+sha+' expected node='+item.nodeId+' sha='+item.taskSha256);
    const matches=[];
    for(const candidate of modules){
      let result=null;
      try{result=candidate.binding(task,{sessionId,index});}
      catch(error){fail('candidate-binding-throws',item.position,candidate.id+': '+String(error));}
      if(result)matches.push({id:candidate.id,binding:result});
    }
    if(matches.length!==1||matches[0].id!=='issue341-'+item.packet)
      fail('nonexclusive-candidate-binding',item.position,
        matches.map(x=>x.id).join(',')||'No matching candidate binding');
    const existingMatches=[];
    for(const adapter of EVIDENCE_ADAPTERS){
      if(adapter.type!==task.type)continue;
      try{if(adapter.binding(task,{sessionId,index}))existingMatches.push(adapter.id);}
      catch(error){fail('existing-adapter-throws',item.position,
        adapter.id+': '+String(error));}
    }
    if(existingMatches.length)
      fail('old-runtime-overlap',item.position,existingMatches.join(','));
    const method=matches.length===1?matches[0].binding.method:null;
    if(method!==null&&method!==undefined)
      fail('method-review-needed',item.position,
        'Candidate advertises a thinking method; independent method label review required');
    const type=task.type,packet=item.packet;
    const summary={sessionId,index,type,nodeId:nodeId,adapter:'issue341-'+packet,
      taskHash:sha,method:null};
    proposed.push(summary);
    details.push({position:item.position,packet,nodeId,taskHash:sha,type,
      candidateBindingCount:matches.length,existingApprovedBindings:existingMatches,
      methodProposed:false,acceptedPriorEngineeringEvidence:
       item.group==='B'?item.existingEvidenceReuse==='ACCEPTED_CANDIDATE_ENGINEERING_ONLY':null,
      strictAApproved:false});
  }
  proposed.sort((a,b)=>a.sessionId.localeCompare(b.sessionId,'en')||a.index-b.index);
  const summary={
    schema:'issue-341-preintegration-source-lock/1',
    auditHead:auditSha,
    candidateHead:catalog.baseCandidateHead,
    currentApprovedManifest:approved.tasks.length,
    frozenCandidateFamilies:catalog.families.length,
    candidatePositions:ledger.rows.length,
    verifiedPositions:proposed.length,
    groupCounts:{
      P007:details.filter(r=>r.packet.startsWith('P007')).length,
      P009:details.filter(r=>r.packet.startsWith('P009')).length,
      B:details.filter(r=>!r.packet.startsWith('P007')&&!r.packet.startsWith('P009')).length
    },
    sourcesMatch:trueOnlyIfNoErrors:errorList.length===0,
    candidateRuntimeRegistered:false,
    approvedManifestModified:false,
    newStrictA:0,
    errors:errorList,items:details
  };
  writeFileSync(resolve(reportDir,'results.json'),JSON.stringify(summary,null,2)+'\n');
  writeFileSync(resolve(reportDir,'UNAPPROVED-proposed-manifest.json'),JSON.stringify({
    schema:'issue-341-candidate-proposal-not-approved/1',
    status:'NOT_FORMAL_A_APPROVED',manifestBaseCount:approved.tasks.length,
    rows:proposed
  },null,2)+'\n');
  console.log('ISSUE341_PREINTEGRATION_AUDIT '+JSON.stringify({
    candidateFamilies:summary.frozenCandidateFamilies,
    reviewedPositions:summary.verifiedPositions,
    existingStrictA:summary.currentApprovedManifest,
    groups:summary.groupCounts,
    errors:errorList.length,
    samples:errorList.slice(0,8),
    additionalMathTestsRun:0,
    approvedManifestChanges:0
  }));
  if(errorList.length)process.exitCode=1;
}catch(error){
  fail('preflight-exception','startup',error.stack||String(error));
  writeFileSync(resolve(reportDir,'results.json'),JSON.stringify({
    schema:'issue-341-preintegration-source-lock/1',errors:errorList,
    candidateRuntimeRegistered:false,newStrictA:0
  },null,2)+'\n');
  console.error(error.stack||String(error));process.exitCode=1;
}
