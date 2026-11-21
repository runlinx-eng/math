// Development-only machine receipt; test status never implies formal strict-A status.
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
const stage=key=>process.env[key]==='success'?'PASS':
 process.env[key]==='failure'?'FAIL':'NOT_RUN';
const stages={identity:stage('A_STEP_IDENTITY'),preflight:stage('A_STEP_PREFLIGHT'),
 node:stage('A_STEP_NODE'),chromium:stage('A_STEP_BROWSER')};
let preflight=null;try{preflight=JSON.parse(readFileSync('dev-results/native-preflight.json','utf8'));}catch{}
const passed=Object.values(stages).every(v=>v==='PASS')&&preflight?.status==='PASS';
const receipt={schema:'math-a-candidate-development-receipt/2',
 case:process.env.A_DEV_CASE||null,candidateHead:process.env.A_DEV_HEAD||null,
 infraHead:process.env.GITHUB_SHA||null,runId:process.env.GITHUB_RUN_ID||null,
 state:passed?'DEVELOPMENT_TEST_STEPS_PASS':'INCOMPLETE_OR_FAILED',
 stages,sourcePreflight:preflight,strictAApproved:false,
 formalCiRun:false,artifactIndependentAudit:'NOT_RUN',artifactRetentionDays:7};
const out=resolve('dev-results/development-receipt.json');
mkdirSync(dirname(out),{recursive:true});
writeFileSync(out,JSON.stringify(receipt,null,2)+'\n');
console.log('A_DEV_RECEIPT '+JSON.stringify({case:receipt.case,state:receipt.state,steps:stages,
 strictAApproved:false,artifactIndependentAudit:'NOT_RUN'}));
