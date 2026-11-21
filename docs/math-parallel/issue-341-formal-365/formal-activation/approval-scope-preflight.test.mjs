// Only the current request metadata and hypothetical source edits are used.
// Do not execute original B/P007/P009 math, browser or archived-Check suites.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inspectIssue341ApprovalScope} from './approval-scope-preflight.mjs';

const requests=JSON.parse(readFileSync(new URL('./admission-requests-365.json',import.meta.url),'utf8'));
const copy=()=>JSON.parse(JSON.stringify(requests));

test('all 365 frozen native positions are distinct and no approval is granted',()=>{
 const report=inspectIssue341ApprovalScope(requests);
 assert.equal(report.allCandidates.positions,365);
 assert.equal(report.allCandidates.families,113);
 assert.equal(new Set(requests.rows.map(r=>JSON.stringify([r.sessionId,r.index]))).size,365);
 assert.equal(report.activationAllowed,false);
 assert.equal(report.newFormalAGrants,0);
 assert.equal(report.independentHumanApproval,'PENDING');
});

test('cross-packet native alias is rejected even when old packet-scoped key stays unique',()=>{
 const altered=copy();
 const first=altered.rows.find(r=>r.group==='B');
 const second=altered.rows.find(r=>r.group==='B'&&r.packet!==first.packet);
 assert.ok(first&&second&&first.packet!==second.packet);
 Object.assign(second,{sessionId:first.sessionId,index:first.index,position:first.position,
  nodeId:first.nodeId,taskHash:first.taskHash,type:first.type});
 assert.equal(new Set(altered.rows.map(r=>JSON.stringify([r.packet,r.sessionId,r.index]))).size,365,
  'the old packet-scoped uniqueness check fails to detect this alias');
 assert.equal(new Set(altered.rows.map(r=>JSON.stringify([r.sessionId,r.index]))).size,364);
 assert.throws(()=>inspectIssue341ApprovalScope(altered),/duplicate native position across packets/);
});

test('a coordinated rewrite of request and row HEAD cannot impersonate reviewed source',()=>{
 const altered=copy();
 altered.sourceSnapshot.head='0'.repeat(40);
 for(const row of altered.rows)row.currentWindowCodeHead=altered.sourceSnapshot.head;
 assert.throws(()=>inspectIssue341ApprovalScope(altered),/request HEAD differs from reviewed PR #351 source/);
});
