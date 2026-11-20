import {compareBinding,replayCompareEvidence} from './compare-evidence.js';
import {plotBinding,replayPlotEvidence} from './plot-evidence.js';
import {convertBinding,replayConvertEvidence} from './convert-evidence.js';
import {scaleBinding,replayScaleEvidence} from './scale-evidence.js';
import {balanceBinding,replayBalanceEvidence} from './balance-evidence.js';
import {rulerBinding,replayRulerEvidence} from './ruler-evidence.js';
import {unitrefineBinding,replayUnitrefineEvidence} from './unitrefine-evidence.js';
import {unitcoverBinding,replayUnitcoverEvidence} from './unitcover-evidence.js';
import {vesselsBinding,replayVesselsEvidence} from './vessels-evidence.js';
import {cupfillBinding,replayCupfillEvidence} from './cupfill-evidence.js';
import {multableBinding,replayMultableEvidence} from './multable-evidence.js';
import {cubeFractionBinding,replayCubeFractionEvidence} from './cubefraction-evidence.js';
import {moneyBinding,replayMoneyEvidence} from './money-evidence.js';
import {orderBinding,replayOrderEvidence} from './order-evidence.js';
import {areaBinding,replayAreaEvidence} from './area-evidence.js';
import {timeBinding,replayTimeEvidence} from './time-evidence.js';
import {timeCompareBinding,replayTimeCompareEvidence} from './timecompare-evidence.js';
import {ratioPairBinding,replayRatioPairEvidence} from './ratiopair-evidence.js';
import {ratioShareBinding,replayRatioShareEvidence} from './ratioshare-evidence.js';
import {pvbenchBinding,replayPVBenchEvidence} from './pvbench-evidence.js';
import {wideShiftBinding,replayWideShiftEvidence} from './wideshift-evidence.js';
import {paperLabBinding,replayPaperLabEvidence} from './paperlab-evidence.js';
import {mixedAxisBinding,replayMixedAxisEvidence} from './mixedaxis-evidence.js';
import {decimalEngineBinding,replayDecimalEngineEvidence} from './decimalengine-evidence.js';
import {fracShareBinding,replayFracShareEvidence} from './fracshare-evidence.js';
import {mixedTradeBinding,replayMixedTradeEvidence} from './mixedtrade-evidence.js';
import {fracDecomposeBinding,replayFracDecomposeEvidence} from './fracdecompose-evidence.js';
import {fdpBoardBinding,replayFdpBoardEvidence} from './fdpboard-evidence.js';
import {scaleChainBinding,replayScaleChainEvidence} from './scalechain-evidence.js';
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
import {angleBinding,replayAngleEvidence} from './angle-evidence.js';
import {portionGroupsBinding,replayPortionGroupsEvidence} from './portiongroups-evidence.js';
import {estimateBinding,replayEstimateEvidence} from './estimate-evidence.js';
import {joinStoryBinding,replayJoinStoryEvidence} from './joinstory-evidence.js';
import {transformBinding,replayTransformEvidence} from './transform-evidence.js';
import {groupsBinding,replayGroupsEvidence} from './groups-evidence.js';
import {fractionOrderBinding,replayFractionOrderEvidence} from './fraction-order-evidence.js';

import {fractionOperationsBinding,replayFractionOperationsEvidence} from './fraction-operations-evidence.js';

import {fractionCaseBinding,replayFractionCaseEvidence} from './fractioncase-evidence.js';

import {divisionBinding,replayDivisionEvidence} from './division-evidence.js';

import {sameFractionBinding,replaySameFractionEvidence} from './samefraction-evidence.js';

import {storyLedgerBinding,replayStoryLedgerEvidence} from './storyledger-evidence.js';

export const EVIDENCE_ADAPTERS=Object.freeze([
 {id:'compare',type:'x-m28-compare',binding:compareBinding,replay:replayCompareEvidence},
 {id:'plot',type:'x-m28-plot',binding:plotBinding,replay:replayPlotEvidence},
 ...['exact','given-approximation'].map(kind=>({id:'convert-'+kind,type:'x-m28-convert',
  binding:(task,context)=>{const source=convertBinding(task,context);return source?.kind===kind?source:null;},replay:replayConvertEvidence})),
 ...['analog','digital'].map(kind=>({id:'scale-'+kind,type:'x-m28-scale',
  binding:(task,context)=>{const source=scaleBinding(task,context);return source?.kind===kind?source:null;},replay:replayScaleEvidence})),
 ...['compare','weigh'].map(kind=>({id:'balance-'+kind,type:'x-m28-balance',
  binding:(task,context)=>{const source=balanceBinding(task,context);return source?.kind===kind?source:null;},replay:replayBalanceEvidence})),
 {id:'ruler',type:'x-m28-ruler',binding:rulerBinding,replay:replayRulerEvidence},
 {id:'unitrefine',type:'x-m28-refine',binding:unitrefineBinding,replay:replayUnitrefineEvidence},
 {id:'unitcover',type:'x-m28-units',binding:unitcoverBinding,replay:replayUnitcoverEvidence},
 {id:'vessels',type:'x-m28-vessels',binding:vesselsBinding,replay:replayVesselsEvidence},
 {id:'cupfill',type:'x-m31-fill',binding:cupfillBinding,replay:replayCupfillEvidence},
 {id:'multable',type:'x-multable',binding:multableBinding,replay:replayMultableEvidence},
 {id:'cubefraction',type:'x-m31-cubes',binding:cubeFractionBinding,replay:replayCubeFractionEvidence},
 ...['coins','cart'].map(kind=>({id:'money-'+kind,type:'x-m33-'+kind,
  binding:(task,context)=>task?.type==='x-m33-'+kind?moneyBinding(task,context):null,replay:replayMoneyEvidence})),
 {id:'order',type:'x-orderlab',binding:orderBinding,replay:replayOrderEvidence},
 ...[['partition','grid'],['design','grid'],['compare','compare'],['pieces','pieces'],['stadium','circle'],['openbox','solid']].map(([kind,type])=>({
  id:'area-'+kind,type:'x-a30-'+type,
  binding:(task,context)=>{const source=areaBinding(task,context);return source?.kind===kind?source:null;},
  replay:replayAreaEvidence
 })),
 ...['order','parts','roman','stopwatch','steps'].map(kind=>({
  id:'time-'+kind,type:'x-t32-'+kind,
  binding:(task,context)=>task?.type==='x-t32-'+kind?timeBinding(task,context):null,
  replay:replayTimeEvidence
 })),
 {id:'timecompare',type:'x-t32-compare',binding:timeCompareBinding,replay:replayTimeCompareEvidence},
 {id:'ratiopair',type:'x-r37-pair',binding:ratioPairBinding,replay:replayRatioPairEvidence},
 {id:'ratioshare',type:'x-r37-share',binding:ratioShareBinding,replay:replayRatioShareEvidence},
 {id:'pvbench',type:'x-pvbench',binding:pvbenchBinding,replay:replayPVBenchEvidence},
 {id:'wideshift',type:'x-wideshift',binding:wideShiftBinding,replay:replayWideShiftEvidence},
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
 {id:'angle',type:'x-g25-turn',binding:angleBinding,replay:replayAngleEvidence},
 {id:'joinstory',type:'x-joinstory',binding:joinStoryBinding,replay:replayJoinStoryEvidence},
 {id:'estimate',type:'x-estimatecheck',binding:estimateBinding,replay:replayEstimateEvidence},
 {id:'portiongroups',type:'x-portiongroups',binding:portionGroupsBinding,replay:replayPortionGroupsEvidence},
 {id:'fraction-operations',type:'x-fracoperations',binding:fractionOperationsBinding,replay:replayFractionOperationsEvidence},
 {id:'fractioncase',type:'x-fractioncase',binding:fractionCaseBinding,replay:replayFractionCaseEvidence},
 {id:'division',type:'x-divtable',binding:divisionBinding,replay:replayDivisionEvidence},
 {id:'samefraction',type:'x-samefraction',binding:sameFractionBinding,replay:replaySameFractionEvidence},
 {id:'storyledger',type:'x-storyledger',binding:storyLedgerBinding,replay:replayStoryLedgerEvidence},
 {id:'fdpboard',type:'x-fdpboard',binding:fdpBoardBinding,replay:replayFdpBoardEvidence},
 {id:'paperlab',type:'x-paperlab',binding:paperLabBinding,replay:replayPaperLabEvidence},
 {id:'fracdecompose',type:'x-fracdecompose',binding:fracDecomposeBinding,replay:replayFracDecomposeEvidence},
 {id:'mixedtrade',type:'x-mixedtrade',binding:mixedTradeBinding,replay:replayMixedTradeEvidence},
 {id:'fracshare',type:'x-fracshare',binding:fracShareBinding,replay:replayFracShareEvidence},
 {id:'decimalengine',type:'x-decimalengine',binding:decimalEngineBinding,replay:replayDecimalEngineEvidence},
 {id:'mixedaxis',type:'x-mixedaxis',binding:mixedAxisBinding,replay:replayMixedAxisEvidence},
 {id:'scalechain',type:'x-scalechain',binding:scaleChainBinding,replay:replayScaleChainEvidence},
].map(Object.freeze));
