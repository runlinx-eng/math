// Technical coverage ledger; no task count is interpreted as hands-on validation.
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildInventory} from './build_p7_d3_inventory.mjs';
import {taskInteractionContract,VERIFIED_STUDY_GATES} from '../dist/learning/workspace-flow.js';
const out=resolve(dirname(fileURLToPath(import.meta.url)),'../verification/p7-d7');
const inv=buildInventory();
const rows=Object.entries(inv.taskTypes).sort(([a],[b])=>a.localeCompare(b)).map(([type,instances])=>{
 const c=taskInteractionContract({type});
 return {type,instances,family:c.family,readiness:c.checkReadiness,
  evidence:c.checkReadiness==='基于原生模型状态'?'源码就绪规则与原教具模型；仍需浏览器逐实例检查':'保留既有检查/提示/记录；未补充就绪门槛',
  verifiedActivities:0};
});
const result={basis:'PR #58 stacked on PR #57',definition:'Source inventory and technical gating only; no per-question manual or child verification',counts:inv.counts,
 gatedTypes:VERIFIED_STUDY_GATES,taskTypes:rows,unadaptedTypes:rows.filter(r=>r.readiness==='沿用原检查路径').map(({type,instances})=>({type,instances})),
 browserSamples:['equivalent','shiftfine','solidstack','argument38','link-equivalent-quarters'],
 retainedCapabilities:'Original D3 legacy/unknown capabilities and all original inspection routes retained; no equivalent replacement claimed',
 diagnostics:inv.diagnostics,childVerified:false,mathPedagogyVerified:false,macVerified:false};
mkdirSync(out,{recursive:true});
writeFileSync(resolve(out,'coverage.json'),JSON.stringify(result,null,2)+'\n');
console.log('P7_D7_COVERAGE '+JSON.stringify({counts:inv.counts,gatedTypes:VERIFIED_STUDY_GATES.length,unadaptedTypes:result.unadaptedTypes.length,diagnostics:inv.diagnostics.length}));
if(inv.diagnostics.length)process.exitCode=1;
