// #342 A-line P001-P005: 66 independently source-locked, developer-tested native contracts.
// Inert unless an exact source+full-task SHA appears in formal evidence-review manifest.
// Never infer permission from shared task type, same node family, or identical problem text.
import {ISSUE342_A_P001_P003_ADAPTERS as early} from './issue342-a355-p001-p003-candidates.js';
import {ISSUE342_A_P004_VERIFIED_ADAPTERS as polygon} from './issue342-a355-p004-tested-candidates.js';
import {ISSUE342_A_P004_LATE_ADAPTERS as polygonLate} from './issue342-a355-p004-late-candidates.js';
import {ISSUE342_A_P004B_ADAPTERS as polygonNest} from './issue342-a355-p004b-candidate.js';
import {ISSUE342_A_P005_EARLY_ADAPTERS as angles} from './issue342-a355-p005-early-candidates.js';
import {ISSUE342_A_P005_LATE_ADAPTERS as anglesLate} from './issue342-a355-p005-late-candidates.js';
const all=[...early,...polygon,...polygonLate,...polygonNest,...angles,...anglesLate];
const keys=new Set();
for(const family of all){
 if(typeof family.binding!=='function'||typeof family.replay!=='function'||typeof family.submitted!=='function'||!family.sources.length)
  throw Error('Incomplete A-line math contract '+family.id);
 for(const src of family.sources){const k=JSON.stringify([src.sessionId,src.index]);
  if(keys.has(k)||!/^mt_[A-Za-z0-9_-]+$/.test(src.nodeId)||!/^[0-9a-f]{64}$/.test(src.taskHash))throw Error('Duplicate or invalid source '+k);
  keys.add(k);
 }
}
if(all.length!==31||keys.size!==66)throw Error('A-line P001-P005 staged family/source count drift');
export const ISSUE342_A_P001_P005_ADAPTERS=Object.freeze(all);
