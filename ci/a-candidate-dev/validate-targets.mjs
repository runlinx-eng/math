// A-line development-only target admission. Do not use as a formal A registration gate.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const sha40=/^[a-f0-9]{40}$/;
const sha64=/^[a-f0-9]{64}$/;
const name=/^P[0-9]{3}[a-z]?-[a-z0-9-]+$/;
const pathRule=/^tests\/p9-[a-z0-9-]+\.(?:test\.mjs|cjs)$/;
const idRule=/^[a-z][a-z0-9]*$/;
const uiAction=/^(?:g(?:23|25)|b(?:15|16|19))-[a-z][a-zA-Z-]*$/;
function reject(condition,message){if(!condition)throw new Error('A_DEV_TARGET_INVALID: '+message);}
function exactKeys(value,want,where){
 reject(value!==null&&typeof value==='object'&&!Array.isArray(value),where+' must be object');
 reject(Object.keys(value).sort().join(',')===want.slice().sort().join(','),where+' unexpected/missing fields');
}
export function validateTargets(value){
 exactKeys(value,['schema','targets'],'root');
 reject(value.schema==='math-a-candidate-targets/2','wrong schema');
 reject(Array.isArray(value.targets)&&value.targets.length>=1&&value.targets.length<=12,'target count');
 const usedCases=new Set(),usedPositions=new Set();
 for(const [j,target] of value.targets.entries()){
  const where='targets['+j+']';
  exactKeys(target,['case','sha','node_test','browser_test','native'],where);
  reject(typeof target.case==='string'&&name.test(target.case),where+' unsafe case');
  reject(!usedCases.has(target.case),where+' duplicate case');usedCases.add(target.case);
  reject(typeof target.sha==='string'&&sha40.test(target.sha),where+' invalid immutable commit SHA');
  reject(typeof target.node_test==='string'&&pathRule.test(target.node_test)&&target.node_test.endsWith('.test.mjs'),where+' unsafe Node test path');
  reject(typeof target.browser_test==='string'&&pathRule.test(target.browser_test)&&target.browser_test.endsWith('.cjs'),where+' unsafe browser path');
  reject(Array.isArray(target.native)&&target.native.length>=1&&target.native.length<=16,where+' native count');
  for(const [i,s] of target.native.entries()){
   const at=where+'.native['+i+']';
   exactKeys(s,['sessionId','index','nodeId','taskSha256','type','view','controls'],at);
   reject(typeof s.sessionId==='string'&&idRule.test(s.sessionId),at+' sessionId');
   reject(Number.isInteger(s.index)&&s.index>=0&&s.index<1000,at+' index');
   reject(typeof s.nodeId==='string'&&/^mt_[A-Za-z0-9_-]{6,30}$/.test(s.nodeId),at+' nodeId');
   reject(typeof s.taskSha256==='string'&&sha64.test(s.taskSha256),at+' full task SHA256');
   reject(typeof s.type==='string'&&/^x-[a-z0-9-]{2,45}$/.test(s.type),at+' task type');
   reject(['b15','b16','b19','b23','b25',null].includes(s.view),at+' view adapter');
   reject(Array.isArray(s.controls)&&s.controls.length<=30&&s.controls.every(a=>typeof a==='string'&&uiAction.test(a)),at+' control IDs');
   reject((s.view!==null||s.controls.length===0),at+' controls need a view adapter');
   const key=s.sessionId+':'+s.index;
   reject(!usedPositions.has(key),at+' duplicate native position');usedPositions.add(key);
  }
 }
 return {include:value.targets};
}
function cli(){
 try{
  const filename=process.argv[2];
  reject(!!filename,'missing JSON path');
  process.stdout.write(JSON.stringify(validateTargets(JSON.parse(readFileSync(filename,'utf8'))))+'\n');
 }catch(error){process.stderr.write(String(error.message||error)+'\n');process.exitCode=1;}
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))cli();
