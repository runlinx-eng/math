// Reviewed mathematical families, not validator batches or automatic type tags.
// Eligibility remains the exact native position and source checked by binding().
import {sequenceBinding,replaySequenceEvidence} from './sequence-evidence.js';
import {arrayBinding,replayArrayEvidence} from './array-evidence.js';
import {lineBinding,replayLineEvidence} from './line-evidence.js';
import {counterexampleBinding,replayCounterexampleEvidence} from './counterexample-evidence.js';
import {fractionBinding,replayFractionEvidence} from './fraction-evidence.js';
import {unitwalkBinding,replayUnitwalkEvidence} from './unitwalk-evidence.js';
import {placeBinding,replayPlaceEvidence} from './place-evidence.js';
import {groupwalkBinding,replayGroupwalkEvidence} from './groupwalk-evidence.js';
import {routeBinding,replayRouteEvidence} from './route-evidence.js';
import {transformBinding,replayTransformEvidence} from './transform-evidence.js';
import {groupsBinding,replayGroupsEvidence} from './groups-evidence.js';
import {fractionOrderBinding,replayFractionOrderEvidence} from './fraction-order-evidence.js';
import {fractionOperationsBinding,replayFractionOperationsEvidence} from './fraction-operations-evidence.js';
import {fractionCaseBinding,replayFractionCaseEvidence} from './fractioncase-evidence.js';

export const EVIDENCE_ADAPTERS=Object.freeze([
 {id:'sequence',type:'x-p34-sequence',binding:sequenceBinding,replay:replaySequenceEvidence},
 {id:'array',type:'x-mularray',binding:arrayBinding,replay:replayArrayEvidence},
 {id:'line',type:'x-s23-lines',binding:lineBinding,replay:replayLineEvidence},
 {id:'counterexample',type:'x-r38-counterexample',binding:counterexampleBinding,replay:replayCounterexampleEvidence},
 {id:'fraction',type:'x-fracrename',binding:fractionBinding,replay:replayFractionEvidence},
 {id:'unitwalk',type:'x-unitwalk',binding:unitwalkBinding,replay:replayUnitwalkEvidence},
 {id:'place',type:'x-placecalc',binding:placeBinding,replay:replayPlaceEvidence},
 {id:'groupwalk',type:'x-unitwalk',binding:groupwalkBinding,replay:replayGroupwalkEvidence},
 {id:'route',type:'x-routecalc',binding:routeBinding,replay:replayRouteEvidence},
 {id:'fraction-order',type:'x-fracorder',binding:fractionOrderBinding,replay:replayFractionOrderEvidence},
 {id:'groups',type:'x-mulgroups',binding:groupsBinding,replay:replayGroupsEvidence},
 {id:'transform',type:'x-p24-transform',binding:transformBinding,replay:replayTransformEvidence},
 {id:'fraction-operations',type:'x-fracoperations',binding:fractionOperationsBinding,replay:replayFractionOperationsEvidence},
 {id:'fractioncase',type:'x-fractioncase',binding:fractionCaseBinding,replay:replayFractionCaseEvidence}
].map(Object.freeze));
