import {unitrefineBinding,replayUnitrefineEvidence} from './unitrefine-evidence.js';
import {unitcoverBinding,replayUnitcoverEvidence} from './unitcover-evidence.js';
import {multableBinding,replayMultableEvidence} from './multable-evidence.js';
import {cubeFractionBinding,replayCubeFractionEvidence} from './cubefraction-evidence.js';
import {moneyBinding,replayMoneyEvidence} from './money-evidence.js';
import {orderBinding,replayOrderEvidence} from './order-evidence.js';
import {areaBinding,replayAreaEvidence} from './area-evidence.js';
import {timeBinding,replayTimeEvidence} from './time-evidence.js';
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
import {storyLedgerBinding,replayStoryLedgerEvidence} from './storyledger-evidence.js';
// Describe only the submitted, current, replay-validated work. These observations
// are not a score, an assessment of free text, or a claim of general mastery.
import {inspect as inspectTask,validModel as validTask} from './tasks.js';
import * as arguments38 from './phase5/b38-model.js';
import * as patterns34 from './phase5/b34-model.js';
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
import {isEvidenceContext,latestSubmissionMatches} from './evidence-contract.js';

// Prompts are reviewed native positions, never inferred from a widget type.
export function thinkingGuide(task,context={}){
  if(task?.type==='x-pvbench'){
    const source=pvbenchBinding(task,context);
    return source?{type:task.type,summary:'想一想：换个装法，数量怎样保持？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-wideshift'){
    const source=wideShiftBinding(task,context);
    return source?{type:task.type,summary:'想一想：数字换到什么单位？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-paperlab'){
    const source=paperLabBinding(task,context);
    return source?{type:task.type,summary:'想一想：这些小份真的相等吗？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-scalechain'){
    const source=scaleChainBinding(task,context);
    return source?{type:task.type,summary:'想一想：这一轮的整体是哪个量？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-mixedaxis'){
    const source=mixedAxisBinding(task,context);
    return source?{type:task.type,summary:'想一想：不同写法的数怎样共用一条数轴？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-decimalengine'){
    const source=decimalEngineBinding(task,context);
    return source?{type:task.type,summary:'想一想：余数怎样帮助检验小数的预测？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-fracshare'){
    const source=fracShareBinding(task,context);
    return source?{type:task.type,summary:'想一想：这一小份怎样平均分给每个人？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-mixedtrade'){
    const source=mixedTradeBinding(task,context);
    return source?{type:task.type,summary:'想一想：整体和小份怎样换，拿走的量怎样核对？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-fracdecompose'){
    const source=fracDecomposeBinding(task,context);
    return source?{type:task.type,summary:'想一想：怎样留下真正不同的拆法？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-fdpboard'){
    const source=fdpBoardBinding(task,context);
    return source?{type:task.type,summary:'想一想：这些名字表示哪一部分？（可选）',question:source.question}:null;
  }
  if(!isEvidenceContext(context))return null;
  if(task?.type==='x-m28-refine'){
    const source=unitrefineBinding(task,context);
    return source?{type:task.type,summary:'想一想：单位大小改变时，完整单位数和余量怎样对应？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-m28-units'){
    const source=unitcoverBinding(task,context);
    return source?{type:task.type,summary:'想一想：每块一样长，怎样正好盖住这段长度？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-multable'){
    const source=multableBinding(task,context);
    return source?{type:task.type,summary:'想一想：换成一捆以后，数量去了哪一位？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-m31-cubes'){
    const source=cubeFractionBinding(task,context);
    return source?{type:task.type,summary:'想一想：小块、层与体积怎样对应？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-m33-coins'||task?.type==='x-m33-cart'){
    const source=moneyBinding(task,context);
    return source?{type:task.type,summary:task.type==='x-m33-coins'?
      '想一想：面值、枚数与合计怎样对应？（可选）':'想一想：选了哪些东西，钱的数量怎样对应？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-orderlab'){
    const source=orderBinding(task,context);
    return source?{type:task.type,summary:'想一想：这一小块要先准备什么？（可选）',question:source.question}:null;
  }
  if(typeof task?.type==='string'&&task.type.startsWith('x-a30-')){
    const source=areaBinding(task,context);
    return source?{type:task.type,summary:'想一想：这次图形中的部分、面积和外边（可选）',question:source.question}:null;
  }
  if(typeof task?.type==='string'&&task.type.startsWith('x-t32-')){
    const source=timeBinding(task,context);
    return source?{type:task.type,summary:'想一想：这次构造中的时间关系（可选）',question:source.question}:null;
  }
  if(task?.type==='x-samefraction'){
    const source=sameFractionBinding(task,context);
    return source?{type:task.type,summary:'想一想：同样大的整体怎样比较？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-divtable'){
    const source=divisionBinding(task,context);
    return source?{type:task.type,summary:'想一想：每一位的余量和最后的答案各表示什么？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-fractioncase'){
    const source=fractionCaseBinding(task,context);
    return source?{type:task.type,summary:'想一想：情境中的量与图上的份怎样对应？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-fracoperations'){
    const source=fractionOperationsBinding(task,context);
    return source?{type:task.type,summary:'想一想：这次运算数的是什么单位？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-portiongroups'){
    const source=portionGroupsBinding(task,context);
    return source?{type:task.type,summary:'想一想：几组和几颗怎样对应？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-estimatecheck'){
    const source=estimateBinding(task,context);
    return source?{type:task.type,summary:'想一想：粗略结果怎样帮助检查？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-storyledger'){
    const source=storyLedgerBinding(task,context);
    return source?{type:task.type,summary:'想一想：每件事从哪个数量继续？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-joinstory'){
    const source=joinStoryBinding(task,context);
    return source?{type:task.type,summary:'想一想：演示和算式怎样对应？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-g25-turn'){
    const source=angleBinding(task,context);
    return source?{type:task.type,summary:'想一想：开口和边的长短怎样比较？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-p24-transform'){
    const source=transformBinding(task,context);
    return source?{type:task.type,summary:'想一想：每个点怎样对应？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-mulgroups'){
    const source=groupsBinding(task,context);
    return source?{type:task.type,summary:'想一想：每份、份数和总量怎样对应？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-fracorder'){
    const source=fractionOrderBinding(task,context);
    return source?{type:task.type,summary:'想一想：这些量怎样比较？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-routecalc'){
    const source=routeBinding(task,context);
    return source?{type:task.type,summary:'想一想：每一步怎样接起来？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-placecalc'){
    const source=placeBinding(task,context);
    return source?{type:task.type,summary:source.scope==='decimal'?
      '想一想：小数怎样对齐和换单位？（可选）':'想一想：换了单位，总量会变吗？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-unitwalk'){
    const grouped=groupwalkBinding(task,context);
    if(grouped)return {type:task.type,summary:'想一想：一次接几小份？（可选）',question:grouped.question};
    const source=unitwalkBinding(task,context);
    return source?{type:task.type,summary:'想一想：每一小步表示多少？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-fracrename'){
    const source=fractionBinding(task,context);
    return source?{type:task.type,summary:'想一想：换个分法，量会变吗？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-r38-counterexample'){
    const source=counterexampleBinding(task,context);
    return source?{type:task.type,summary:'想一想：怎样检验“总是”？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-s23-lines'){
    const source=lineBinding(task,context);
    return source?{type:task.type,summary:'想一想：怎样检查两条边？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-mularray'){
    const source=arrayBinding(task,context);
    return source?{type:task.type,summary:'想一想：这幅阵列怎样变化？（可选）',question:source.question}:null;
  }
  if(task?.type==='x-p34-sequence'){
    const source=sequenceBinding(task,context);
    return source?{type:task.type,summary:'想一想：怎样找出这一步的规律？（可选）',question:source.question}:null;
  }
  return null;
}
// A shared card widget appears in several thinking domains. Link MP.3 only
// for these inspected B38 lesson positions, never solely from task.type.
const VERIFIED_REASONING={show38:[2],because38:[1,2],argument38:[0,2]};

export function thinkingFeedback(task,model,record,context={}){
  // The pre-existing grid observation is context-free and remains outside the
  // strict source-bound adapters. Its original grading and snapshot gate stay.
  if((task?.type!=='grid'&&!isEvidenceContext(context))||!latestSubmissionMatches(model,record))return null;
  const attempts=record.attempts;
  if(task?.type==='x-m28-refine'){
    const source=unitrefineBinding(task,context);if(!source)return null;
    const proof=replayUnitrefineEvidence(task,model);if(!proof)return null;
    const c=proof.construction,detail=[
      '图上的单位大小、连续排放、完整单位数和余量由工具提供；这里核对当前两份有效保存记录。',
      ...c.runs.map(r=>`使用“${r.label}”（大小 ${r.size}）的保存记录为 ${r.count} 个完整单位：${r.count} × ${r.size} + ${r.remainder} = ${c.total}。`),
      `当前选择的单位是“${c.current.label}”，完整单位数为 ${c.current.count}，余量为 ${c.current.remainder}；本次填写的数量与完整单位数精确相等。`,
      '每种单位第一次记录的原文和已有操作记录仍保留；这里核对当前两份有效保存，没有替换最早的原文。'
    ];
    if(proof.issue)detail.push('作品末尾仍保留工具的提示；这里没有把失败请求当作新放入的单位或新保存。');
    if(proof.historyAtCapacity)detail.push('这份作品的操作记录已到可保存的上限；这里只核对已经保留的两份保存。');
    if(attempts.length>1)detail.push('此前提交原样保留，这里只描述与当前完整模型一致的最新提交。');
    if(record.support)detail.push('你看过提示或比较反馈。');
    return{title:'这次作品中的思考线索',observation:'已核对两种单位的有效保存：完整单位所占数量加上余量，都等于同一个总量。',
      connection:'同一个总量，换一种大小的单位后，完整单位数和余量怎样对应？',detail,method:null};
  }
  if(task?.type==='x-m28-units'){
    const source=unitcoverBinding(task,context);if(!source)return null;
    const proof=replayUnitcoverEvidence(task,model);if(!proof)return null;
    const c=proof.construction,detail=[
      '图上的网格、每块长度和“已放”块数由工具提供；这里描述当前摆放和保存的记录。',
      `当前 ${c.count} 个“${c.unit}”各占 ${c.size} 个小格，首尾相接，正好覆盖 ${c.length} 个小格；每个小格只盖一次。`,
      `保存的数量原文是“${c.saved.measure}”，单位是“${c.saved.unit}”；它们与当前摆放表示的数量和单位精确一致。`,
      `这份作品最早保留的数字记录是“${c.firstMeasure.raw}”；这里核对当前保存的记录，没有替换最早的原文。`
    ];
    if(proof.removals.length||proof.clears.length)detail.push('取回和清空的操作记录仍保留；这里描述最后保存的覆盖。');
    if(proof.historyAtCapacity)detail.push('这份作品的操作记录已到可保存的上限；这里只描述已经保存的这份作品。');
    if(attempts.length>1)detail.push('此前提交原样保留，这里只描述与当前完整模型一致的最新提交。');
    if(record.support)detail.push('你看过提示或比较反馈。');
    return{title:'这次作品中的思考线索',observation:`当前 ${c.count} 个相同长度的“${c.unit}”正好覆盖这段长度，保存的数量和单位也与当前摆放一致。`,
      connection:'每块一样长时，怎样检查起点、终点和中间都刚好接上？',detail,method:null};
  }
  if(task?.type==='x-multable'){
    const source=multableBinding(task,context);if(!source)return null;
    const proof=replayMultableEvidence(task,model);if(!proof)return null;
    const c=proof.construction,detail=[
      '列位、计数片和写法由工具给定；这里核对已记录的十换一、进位与部分积，不据此评价独立排版、文字解释或通用算法掌握。',
      `当前重建的作品里有 ${c.trades.length} 次十换一：每次少十个这一位的单位、多一个相邻高位的单位，表示的数量保持不变。`,
      `这份模型最早保留的估计是“${c.firstEstimate.raw}”；当前这段按题目给定的近似数核对 ${c.estimate.estimatedMultiplicand} × ${c.estimate.multiplier} = ${c.estimate.product}，没有替换最早的填写。`
    ];
    for(const row of c.rows)detail.push(`第 ${row.row+1} 行：${c.multiplicand} × ${row.multiplierDigit} × ${row.rowScale} = ${row.value}；这里的 ${row.rowScale} 表示这一行的位值，填写的部分积是“${row.rawValue}”。`);
    detail.push(`当前填写的结果“${proof.submittedAnswer.raw}”与这些部分积的合计相符；这里只核对填写的量，没有把它算作另一个独立的加法过程。`);
    if(proof.resets.length)detail.push(`历史里保留了 ${proof.resets.length} 次重新开始板面的动作和最早估计；这里的换十、进位与部分积只描述最后重新建成的作品。`);
    if(proof.historyAtCapacity)detail.push('这份作品的操作记录已到可保存的上限；这里只描述已经保存的这份作品。');
    if(attempts.length>1)detail.push('此前提交原样保留，这里只描述与当前完整模型一致的最新提交。');
    if(record.support)detail.push('你看过提示或比较反馈。');
    return{title:'这次作品中的思考线索',observation:`当前作品的十换一、逐列进位与 ${c.rows.length} 行部分积相符，各行的位值和当前结果也对应。`,
      connection:c.rows.length>1?'把十个这一位的单位换成一个相邻高位的单位时，数量为什么不变？第二行乘的是几份一，还是几份十？':'把十个这一位的单位换成一个相邻高位的单位时，数量为什么不变？',detail,method:null};
  }
  if(task?.type==='x-m31-cubes'){
    const source=cubeFractionBinding(task,context);if(!source)return null;
    const proof=replayCubeFractionEvidence(task,model);if(!proof)return null;
    const c=proof.construction,square=proof.squareUnit,cubic=proof.cubicUnit;
    const detail=[
      '网格、尺寸和小块边长由工具给定；这里核对已记录的填入、取回和保存量，不据此评价独立乘法过程、空间想象、文字解释或实际测量。',
      `当前每层 ${c.perLayer} 块，共 ${c.layers} 层：${c.perLayer} × ${c.layers} = ${c.total} 块。`,
      `每小块边长 ${c.edge.text} ${proof.unit}，三个方向相乘得到 ${c.oneCube.text} ${cubic}；${c.total} 块合计 ${c.volume.text} ${cubic}。`,
      `底面积 ${c.base.text} ${square}，高 ${c.dimensions[2].text} ${proof.unit}；底面积与高相乘也对应 ${c.baseTimesHeight.text} ${cubic}。`,
      `你曾打开各层；当前${c.currentlySpread?'各层仍展开':'各层已合起'}，保存过的块数和大小分别保留。`,
      `本次填写的“小块加起来的体积”是“${model.volume}”，“按长宽高算出的体积”是“${model.product}”，单位是 ${model.unit}；这里只核对当前填写，没有把它们算作两条独立乘法过程。`
    ];
    if(c.failedPlans)detail.push(`本轮保留了 ${c.failedPlans} 次块数保存未通过的请求；第一次填写是每层“${c.first.plan.perLayer}”、层数“${c.first.plan.layers}”、总块数“${c.first.plan.total}”，没有改写成后来的结果。`);
    if(c.failedParts)detail.push(`本轮保留了 ${c.failedParts} 次大小保存未通过的请求；第一次填写是小块体积“${c.first.part.oneCube}”、底面积“${c.first.part.base}”。`);
    const removed=proof.events.filter(e=>e.outcome==='cell-removed').length;
    if(removed)detail.push(`历史保留了 ${removed} 次实际取回；之后的块数和大小经过重新保存。`);
    if(c.emptyRemovals)detail.push(`还有 ${c.emptyRemovals} 次在空盒子上请求取回；这些请求没有拿走任何小块。`);
    if(proof.historyAtCapacity)detail.push('本轮保留的操作记录已达原上限；这里只核对已经保存的历史，不把后续未记录的点击补成操作。');
    if(attempts.length>1)detail.push('此前提交原样保留，这里只描述与当前完整模型一致的最新提交。');
    if(record.support)detail.push('你看过提示或比较反馈。');
    return{title:'这次作品中的思考线索',observation:`当前盒子保留了 ${c.total} 个小立方体，逐块身份与分层块数相符，保存的块数和体积记录也对应。`,
      connection:'如果小块的边长再分成更多份，一小块的体积、每层块数和总块数会怎样一起变化？',detail,method:null};
  }
  if(task?.type==='x-m33-coins'||task?.type==='x-m33-cart'){
    const source=moneyBinding(task,context);if(!source)return null;
    const proof=replayMoneyEvidence(task,model);if(!proof)return null;
    const c=proof.construction,unit=proof.minorUnit;
    const detail=['合计和余款由工具显示；这里核对本次记录的摆放或选择与当前提交，不据此评价独立心算、文字解释、真实付款或长期掌握。'];
    if(attempts.slice(0,-1).some(a=>replayMoneyEvidence(task,a.value)===null))
      detail.unshift('此前的提交原样保留，下面只描述本次重新检查的作品。');
    if(record.support)detail.push('你看过提示或比较反馈。');
    let observation;
    if(proof.kind==='coins'){
      observation=`你保存了 ${c.distinctAccepted} 种不同的合格摆法，每种合计 ${c.targetMinorUnits} ${unit}。下面按当时保存的面值和枚数核对。`;
      // A later clear or failed save need not invalidate earlier qualifying
      // saved compositions. Never describe the current table as that proof.
      for(const savedIndex of c.acceptedSavedIndices){
        const s=c.saves.find(entry=>entry.savedIndex===savedIndex&&entry.qualifies);
        detail.push(`第 ${savedIndex+1} 次保存：${s.terms.map(term=>`${term.count} × ${term.minorUnits}`).join(' + ')} = ${s.totalMinorUnits} ${unit}，共 ${s.coinCount} 枚（或张）。`);
      }
      if(task.mustCounts?.length)detail.push(`题目指定的面额数量也已核对：${task.mustCounts.map(([i,count])=>`${task.denoms[i].label} ${count} 枚（或张）`).join('、')}。`);
      if(c.minimum)detail.push(`这次合格摆法用了 ${c.minimum.coins} 枚；核对器用整数面值检验了最少枚数。这不表示记录里包含你独立证明“不能更少”的过程。`);
      const wrong=c.saves.filter(s=>!s.amountMatches).length,limited=c.saves.filter(s=>!s.stored).length;
      if(wrong)detail.push(`历史保留了 ${wrong} 次金额尚未对上的保存请求及原填写，没有把这些请求算作合格摆法。`);
      if(limited)detail.push(`还有 ${limited} 次保存请求发生在已保存 12 次之后；请求仍在历史里，没有新增保存的摆法。`);
      const capped=proof.events.filter(e=>e.reason==='per-denomination-capacity').length;
      if(capped)detail.push(`历史保留了 ${capped} 次某一面额已达 50 枚后的放入请求；这些请求没有增加枚数。`);
      detail.push(`当前桌面是 ${c.current.coinCount} 枚（或张），工具合计 ${c.current.totalMinorUnits} ${unit}；这与此前保存的摆法分别记录。`);
      if(proof.issue)detail.push('当前保存提示仍在，之前合格的保存记录没有被改写。');
      if(c.relation){const r=c.relation;
        detail.push(r.role==='change'?`题目给定付款 ${r.paid} ${unit}、价格 ${r.price} ${unit}；已保存的 ${r.resultMinorUnits} ${unit} 对应两者之差。`:
          `题目给定价格 ${r.price} ${unit}、已有 ${r.held} ${unit}；已保存的 ${r.resultMinorUnits} ${unit} 对应还差的数量。`);
      }
    }else{
      observation=`你选择了 ${c.items.length} 件商品：${c.items.map(item=>item.name).join('、')}。工具合计 ${c.totalMinorUnits} ${unit}，本次选择记录与这些价格相符。`;
      detail.push(`所选价格按题目中的商品逐项对应：${c.items.map(item=>item.minorUnits).join(' + ')} = ${c.totalMinorUnits} ${unit}。`);
      if(c.requiredItems.length)detail.push('题目要求的商品都在当前篮子里。');
      if(c.budget)detail.push(`当前选择不少于 ${c.minimumItems} 件，合计 ${c.totalMinorUnits} ${unit} 不超过预算 ${c.budget.minorUnits} ${unit}。工具显示余下 ${c.budget.remainingMinorUnits} ${unit}；这条显示不作为一次独立的余款作答。`);
      if(c.payment)detail.push(`题目给定付款 ${c.payment.minorUnits} ${unit}，与当前所选总价之差为 ${c.payment.changeMinorUnits} ${unit}。这是按题意核对的数量关系，没有额外记为一次付款操作。`);
    }
    const clears=proof.events.filter(e=>e.action==='m33-clear').length;
    if(clears)detail.push(`本轮历史保留了 ${clears} 次${proof.kind==='coins'?'重新摆':'重新选'}及前后的数量，旧提交没有删除。`);
    for(const answer of proof.answers){
      const option=answer.kind==='choice'?task.questions[answer.index].options.find(([value])=>value===answer.raw):null;
      const displayed=option?option[1]:answer.raw;
      detail.push(`本次提交的“${answer.label}”是“${displayed}”，与这次记录及题目中的数量关系相符；输入修改的具体时序没有单独记录。`);
    }
    return {title:'这次作品中的思考线索',observation,
      connection:proof.kind==='coins'?'如果换一组面值或枚数，怎样说明合计仍相同，或者已经改变？':'如果拿出或换进一件商品，哪些金额会改变？怎样根据当前选择说明？',detail,method:null};
  }
  if(task?.type==='x-orderlab'){
    const source=orderBinding(task,context);if(!source)return null;
    const proof=replayOrderEvidence(task,model);if(!proof)return null;
    const result=proof.built.value[1]==='1'?proof.built.value[0]:proof.built.value.join('/');
    const detail=['这里只核对当前运算树中每一小块的依赖、亲手合成的精确量和本次结果；没有自动评价心算方法、自由解释、故事理解或长期掌握。'];
    if(attempts.slice(0,-1).some(a=>replayOrderEvidence(task,a.value)===null))detail.unshift('你修改后又试了一次。');
    if(record.support)detail.push('你看过提示或比较反馈。');
    if(proof.failedRequests.length)detail.push(`保留的记录中有 ${proof.failedRequests.length} 次未完成的请求；先选了还没准备好的部分、未成功的合成或摆树仍按原样保留，没有当成成功操作。`);
    if(proof.earlierInexactReductions.length)detail.push('旧构造中工具接受过的近似数仍保留；这次核对的是后来重新摆出并逐块精确完成的构造。');
    if(proof.constructions.some(e=>e.kind==='reset'))detail.push('重新做保留了原来的字段、操作与尝试；本轮每一块已经重新核对。');
    if(proof.pending&&!proof.pending.rawMatchesBuilt)detail.push('输入框中的文字与已摆出的关系精确对应，但没有把未点击摆出的文字当成另一轮操作。');
    if(proof.currentIssue)detail.push('末次请求的原提示仍保留；它没有改变已完成的运算树，这次检查核对的是当前完整作品。');
    return{title:'这次作品中的思考线索',observation:`你在当前关系中亲手合过 ${proof.effectiveSteps.length} 块；每块所需的部分先准备好，填写的量与原算式精确对应。最后得到 ${result}，与这次提交的结果一致。`,connection:'如果先换到另一块，它需要的量是否都已准备好？哪些小块互不依赖，哪些必须先后接起来？',detail,method:null};
  }
  if(typeof task?.type==='string'&&task.type.startsWith('x-a30-')){
    const source=areaBinding(task,context);if(!source)return null;
    const proof=replayAreaEvidence(task,model);if(!proof)return null;
    const c=proof.construction,h=proof.history,detail=[];let observation,connection;
    if(proof.kind==='partition'||proof.kind==='design'){
      const pieces=c.rectangles.map(r=>`${r.width}×${r.height}=${r.area}`).join('，');
      observation=proof.kind==='partition'?`你实际放下了 ${c.rectangles.length} 块长方形：${pieces}。这些格位没有重叠或遗漏，合起来是 ${c.totalArea} ${c.unit}²，与这次填写的面积相符。`:
        `你实际放下的 ${c.rectangles.length} 块长方形组成一个 L 形。包围它的长方形是 ${c.shape.box.width}×${c.shape.box.height}，缺去一个角的 ${c.shape.removedCorner.width}×${c.shape.removedCorner.height}；当前外边一圈为 ${c.perimeter} ${c.unit}，内部的分界不计入这一圈。`;
      detail.push('这里只核对你实际放下的矩形、格位和当前数量；没有把工具显示的方格或边界计算说成你已经写出的独立推导。');
      if(proof.pending.unapplied)detail.push(`当前还有 ${proof.pending.corners.length} 个待放的角点；它们尚未形成新的矩形，不计入已经放好的部分。`);
      connection=proof.kind==='partition'?'如果换一种切法，怎样确认面积合计仍相同，且没有重叠或遗漏？':'转动或翻转这个 L 形后，哪些长度保持？怎样分清外边和内部的接缝？';
    }else if(proof.kind==='compare'){
      observation=`你实际摆出的两个长方形是 ${c.dimensions[0]}×${c.dimensions[1]} 和 ${c.dimensions[2]}×${c.dimensions[3]}。它们的面积分别是 ${c.areas.join('、')} cm²，周长分别是 ${c.perimeters.join('、')} cm，满足${c.condition==='area'?'面积相同而周长不同':'周长相同而面积不同'}的两个条件。`;
      detail.push('这里的尺寸来自最近实际摆出并保留的矩形；图和读数由工具显示，没有据此评价独立心算过程。');
      if(proof.pending.unapplied)detail.push('输入框还有未重新摆出的填写；这里只按已摆出的长和宽核对，没有把待应用输入当作新的精确边长。');
      connection='只知道面积或周长，能确定另一个量吗？试着用另一个具体长方形说明。';
    }else if(proof.kind==='pieces'){
      const terms=c.parts.map(p=>`${p.name} ${p.area}`).join('，');
      observation=`你实际记下了这些部分的面积：${terms}。${c.operation==='subtract'?`外框 ${c.outerArea} 减去这些角的合计 ${c.partsTotal}`:`各部分相加 ${c.parts.map(p=>p.area).join(' + ')}`} = ${c.area} ${c.unit}，与当前合计相符。`;
      detail.push('这些预切部分来自工具；这里只核对各部分身份、逐次记下的面积与当前合计，没有把预切图形说成你亲自完成了分割。');
      if(proof.pending.unapplied)detail.push('当前“这一块的面积”还有待应用的填写；尚未点击记下，不替代已经保留的各部分记录。');
      connection='怎样用每一部分在图上的位置解释相加或相减？如果重复算一块，会多算多少？';
    }else if(proof.kind==='stadium'){
      observation=`你选定的外边是上直边、下直边和两段半圆弧，内部接缝不计入周长。两个半圆合成一个圆，按题目给定 π≈3.14，外边约 ${c.displayPerimeter} ${c.unit}，长方形与两个半圆的面积合计约 ${c.displayArea} ${c.unit}²。`;
      detail.push('这里核对真实选择和指定近似值；预切部分与圆周拉直来自工具，不据此声称你自己切分或推导了圆的公式。');
      connection='内部接缝为什么不属于整个图形的外边？它对分块面积又有什么作用？';
    }else{
      observation=`你当前选中底面和四个侧面，没有把上盖计入。当前各面的面积是 ${c.faces.map(f=>`${f.name} ${f.area}`).join('，')}，合计 ${c.surface} ${c.unit}。`;
      detail.push('这里只核对所选面的身份、当前各面填写与合计；立体与展开图由工具提供，记录没有保存每个面积字段的唯一编辑时刻。');
      if(c.storedUnselected[0].raw!=='')detail.push('以前选过又取消的上盖仍保留原填写，但它没有计入当前盒子的表面积。');
      connection='如果加上盖子，表面积会增加哪一块？为什么这和盒子里面的体积不是同一个量？';
    }
    if(h.failedRequests.length)detail.push(`记录保留了 ${h.failedRequests.length} 次当时未达到条件的请求；这些错误与后来的纠正都没有删除，未改变的成功部分仍按实际保留值核对。`);
    if(h.approximateAccepted.length)detail.push('先前填写过与精确数量不完全相同的数；旧请求仍保留，这里只采用后来实际重新摆出或记下的精确数量。');
    if(h.clears.length||h.undone.length)detail.push('重新搭或撤回只改变当前作品，旧操作与首次记录仍保留；已撤去的矩形不计入当前面积。');
    if(attempts.length>1)detail.push('以前的检查快照仍保留；这里对应最新一次检查的完整作品。');
    detail.push('这里只描述本次可核对的构造关系，没有自动评价自由解释、独立证明或长期掌握。');
    if(record.support)detail.push('你打开过提示或比较反馈。');
    return {title:'这次作品中的思考线索',observation,connection,detail,method:null};
  }
  if(typeof task?.type==='string'&&task.type.startsWith('x-t32-')){
    const source=timeBinding(task,context);if(!source)return null;
    const proof=replayTimeEvidence(task,model);if(!proof)return null;
    const c=proof.construction,h=proof.history,detail=[];let observation,connection;
    if(proof.kind==='order'){
      const references={'relative-day':'以故事中的今天为参照','time-of-day':'同一天内的时刻',duration:'同为分钟的时长',weekday:'题目指定从周一开始的一周',month:'题目指定从1月开始的一年'};
      observation=`你逐张放入项目，当前排列是 ${c.labels.join(' → ')}。按${references[c.reference]}核对，对应的${c.unit}数为 ${c.values.join(' ≤ ')}。`;
      detail.push('这里只核对实际放入的身份和当前顺序，没有记录每次比较的理由，也没有据此判断独立比较策略。');
      if(h.wrongOrders.length)detail.push(`先前留下过 ${h.wrongOrders.length} 次尚未按要求排好的完整排列；原顺序和后来的调整都保留。`);
      connection='如果只改变一个项目所表示的时间，相邻的顺序需要怎样重新核对？';
    }else if(proof.kind==='parts'){
      observation=`工具给定的一整段是 ${c.whole} ${c.unit}，平均分成 ${c.equalParts} 份。你实际选中了第 ${c.identities.map(i=>i+1).join('、')} 份，共 ${c.count} 份，是这个整体的 ${c.fraction}，对应 ${c.amount} ${c.unit}，与当前回答相符。`;
      detail.push(`每份对应 ${c.unitPart} ${c.unit}；等分来自工具，这里没有把选择一份说成自己完成了分割或写出了除法推导。`);
      if(task.requiredParts)detail.push('这道题还核对了所选区域的先后位置：相同份量不能替代题目指定的前半场。');
      else detail.push('题目没有指定必须选哪一块等份；这里核对份量，不把所选区域说成特定起点开始的计时路径。');
      connection='整体变长或变短时，同样的一份会是多少？怎样用整个活动与所选区域说明？';
    }else if(proof.kind==='roman'){
      observation=`你把十二个符号分别放到了钟面的对应位置：${c.positions.map(p=>`${p.label} → ${p.position||12}`).join('，')}。每个符号只有一个位置；当前填写的 IIII = ${c.four} 也已核对。`;
      detail.push('这里记录的是选符号、摆放、移动或重新摆，不是从最后的钟面补写一条操作路径。');
      if(proof.first.place){const first=proof.first.place;detail.push(`第一次实际摆放把 ${['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'][first.numeral]} 放到第 ${first.position||12} 个位置；这次最初摆放仍保留，不称作事先预测。`);}
      connection='换一种数字写法，哪些位置保持不变？把一个符号移走时，原来的位置怎样处理？';
    }else if(proof.kind==='stopwatch'){
      observation=`你用按钮让模拟计时实际前进 ${c.ticks.length} 次：${c.ticks.join(' + ')} = ${c.elapsed} 秒，也就是 ${c.minutes} 分钟，最后在 ${c.elapsed} 秒停表。`;
      detail.push(`首次实际停止在 ${c.firstStop} 秒；如果当时活动尚未结束，暂停和后来的继续分别保留。`);
      detail.push('这是手动推进的模拟活动，显示读数由工具生成，没有据此评价真实活动计时或独立实测。');
      if(h.failedRequests.some(e=>e.action==='tick'))detail.push('超过终点的前进请求没有推进任何秒数；没有截取其中一部分，也没有把请求步长计入总时长。');
      connection='暂时停下以后继续，哪些已经经过的秒数要保留？怎样核对秒与分钟的关系？';
    }else{
      observation=`你当前保留下来的分段是 ${c.segments.map(s=>s.step).join(' + ')} = ${c.duration} 分钟，从 ${c.startClock} 接到 ${c.endClock}。${c.answerRole==='end-time'?`当前回答的结束时刻为 ${proof.answers[0].expected}。`:`当前回答表示经过的 ${c.duration} 分钟。`}`;
      detail.push(`这些段依次对应 ${c.segments.map(s=>`${s.fromClock} ＋ ${s.step} 分钟 → ${s.toClock}`).join('；')}。时间坐标由工具显示，这里核对实际分段与这些坐标的关系，不称作已经记录了独立时刻换算。`);
      if(h.undone.length)detail.push(`实际退回过 ${h.undone.length} 个末段；退回记录保留，但那些段不计入当前保留的合计。`);
      if(proof.jumpInput.pending)detail.push('当前步长框还有待应用的输入；它与最后一次走段请求不同，没有形成新的已记录分段，不计入上述合计。');
      connection='如果换一种分段，怎样保持起点、终点与合计时间一致？跨过整点时要留意什么？';
    }
    detail.push(`记录中保留了 ${h.events.length} 次原控件请求；这里只描述当前构造，未自动评价自由解释、独立证明或长期掌握。`);
    if(h.clears.length)detail.push(`你请求重新构造 ${h.clears.length} 次；先前的操作与首次记录没有删除，当前关系只使用最后保留下来的作品。`);
    if(h.failedRequests.length)detail.push(`其中 ${h.failedRequests.length} 次请求当时没有达到相应条件；原输入、实际结果和提示逐条保留，不把这些请求说成成功完成。`);
    if(h.noops.length)detail.push(`另有 ${h.noops.length} 次请求没有改变构造；这些真实点击保留，但不增加份量、时长或新的摆放。`);
    if(attempts.length>1)detail.push('以前的检查快照仍保留；这里对应最新一次检查的完整作品。');
    if(record.support)detail.push('你打开过提示或比较反馈。');
    return {title:'这次作品中的思考线索',observation,connection,detail,method:null};
  }
  if(task?.type==='x-pvbench'){
    const source=pvbenchBinding(task,context);if(!source)return null;
    const proof=replayPVBenchEvidence(task,model);if(!proof)return null;
    const units={hundreds:'百',tens:'十',ones:'一',thousands:'千'};
    const form=u=>[3,0,1,2].filter(i=>u[i]>0).map(i=>`${u[i]} 个 ${units[proof.unitOrder[i]]}`).join('、');
    const examples=proof.swaps.slice(0,3).map(s=>`${s.fromCount} 个 ${units[s.fromUnit]} 换成 ${s.toCount} 个 ${units[s.toUnit]}（都是 ${s.quantity}）`);
    const detail=['这里只核对记录中的成功交换和当前提交；没有自动评价自由解释、独立证明或长期掌握。',
      '没有留下交换记录的点击，不据此判断有没有尝试或为什么没有变化。'];
    if(attempts.slice(0,-1).some(a=>replayPVBenchEvidence(task,a.value)===null))detail.unshift('你修改后又试了一次。');
    if(record.support)detail.push('你看过提示或比较反馈。');
    if(proof.saved){
      detail.push(`已保存 ${proof.saved.count} 种装法：${proof.saved.representations.map(s=>form(s.units)).join('；')}。它们都表示 ${proof.total}，保存顺序可以与记录中的交换路径对应。`);
      detail.push('这里只核对保存装法与交换路径的对应关系，不能确定每次保存发生在第几次交换之后。');
      if(proof.saved.goal==='specified-end')detail.push(`留下的装法中包含题目要求的 ${form(proof.final)}。`);
      if(proof.saved.goal==='before-after-one-ten')detail.push('保存记录中有原装法，也有把其中1个十换成10个一后的装法。');
    }
    if(proof.submitted.packReport)detail.push(`你这次提交的记录是 ${proof.submitted.packReport.packs} 包十颗，余 ${proof.submitted.packReport.remainder} 颗；这里核对的是一共可装的整十包数。`);
    if(proof.submitted.expanded)detail.push(`你这次提交的展开记录是 ${proof.submitted.expanded.join(' + ')} = ${proof.total}，这些填写值与当前总量相符。`);
    return {title:'这次作品中的思考线索',
      observation:`本次记录里有 ${proof.swapCount} 次成功交换：合并 ${proof.combined} 次、拆开 ${proof.split} 次。${examples.join('；')}${proof.swapCount>3?'；其余已记录交换也逐条核对':''}。每条记录中的交换前后，总量都是 ${proof.total}。当前装法为 ${form(proof.final)}，与你这次填写的总量 ${proof.submitted.answer} 相符。`,
      connection:task.packReport?'一共能装多少包十颗，与十位上的数字有什么不同？试着用现在的装法说明。':
       '块数或条数变了，总量为什么还能保持？试着说明十个小单位和一个相邻大单位之间的关系。',
      detail,method:null};
  }
  if(task?.type==='x-wideshift'){
    const source=wideShiftBinding(task,context);if(!source)return null;
    const proof=replayWideShiftEvidence(task,model);if(!proof)return null;
    const detail=['这里只核对记录到的成功移动，没有核对每一次点击；不据此评价自由解释、独立作图或长期掌握。',
      `你最初留下的猜想是 ${proof.display.guess}，${proof.guess.matchesResult?'与这次得到的数相符':'与这次得到的数不同'}；猜想和后来的移动分别保留。`,
      '小数点固定在个位和十分位之间，数位行由工具按当前的数自动画出。'];
    if(attempts.slice(0,-1).some(a=>replayWideShiftEvidence(task,a.value)===null))detail.unshift('你修改后又试了一次。');
    if(record.support)detail.push('你看过提示或比较反馈。');
    if(proof.leftMoves&&proof.rightMoves)detail.push(`记录保留了向左 ${proof.leftMoves} 次、向右 ${proof.rightMoves} 次的来回探索；总的变化按全部成功移动一起核对。`);
    const relation=proof.scientific?`${proof.display.end} × 10^${proof.scientific.exponent} = ${proof.display.start}`:
      `${proof.display.start} ${proof.direction==='times'?'×':'÷'} ${proof.display.factor} = ${proof.display.end}`;
    return {title:'这次作品中的思考线索',
      observation:`从 ${proof.display.start} 出发，记录里有 ${proof.successfulMoves} 次成功移动。每次向左一格乘10，向右一格除10；现在表示 ${proof.display.end}，与你这次填写的数一致。${proof.scientific?'第一部分至少1、小于10，用填写的指数乘回去得到原数：':'合起来的数量关系是：'}${relation}。`,
      connection:proof.scientific?'第一部分向左放大时，为什么需要负指数把它还原？试着把这个表示乘回原数。':'如果先向左再向右移动，数字所代表的单位怎样变化？试着用原数和现在的数核对总的倍数。',
      detail,method:null};
  }
  if(task?.type==='x-paperlab'){
    const source=paperLabBinding(task,context);if(!source)return null;
    const proof=replayPaperLabEvidence(task,model);if(!proof)return null;
    const details=['工具预先画出的纸格和折痕不算独立作图；这里只核对实际按下的对折、切分、选取、判断、涂色与保存记录。'];
    let observation='',connection='';
    if(proof.mode==='paint'){
      const draft=proof.currentDraft;
      const state=draft.valid?(draft.alreadySaved?'当前涂色与已经保存的一种分界相同。':'当前草稿达到每色4格，但还没有保存成另一种作品。'):'当前未保存草稿还没有做到每种颜色各4格，不能混入已经保存的作品。';
      observation='你在最后一轮已经保存 '+proof.savedWork.length+' 种不同的等面积分法；每种保存作品的四种颜色都各占16格中的4格。'+state;
      connection='只是交换颜色名称，为什么不能算新的等面积分界？试着比一比各组真正占着哪些格。';
      for(const [i,saved]of proof.savedWork.entries())details.push('已保存第 '+(i+1)+' 种：四组分别占 '+saved.groups.map(g=>g.length).join('、')+' 格，分界按格子的身份比较，而不是看颜色名称。');
    }else if(proof.mode==='classify'){
      const correct=proof.judgements.filter(j=>j.correct);
      observation='你在最后一轮逐张核对了 '+correct.length+' 种分法：除了分成几份，还检查了各份大小是否相同。';
      connection='如果切成了规定的块数，但其中一块比另一块大，为什么不能把每一块都叫作整个的 1/'+proof.d+'？';
      for(const j of correct){
        const count=j.observedShares.length,equalSized=j.observedShares.every(n=>n===j.observedShares[0]);
        const conclusion=j.truth?'是题目要求的 '+proof.d+' 个相等份':equalSized?
          '这 '+count+' 份大小相同，但题目要求 '+proof.d+' 个相等份':
          count===proof.d?'份数是要求的 '+proof.d+' 份，但各份大小不同':
          '共有 '+count+' 份，题目要求 '+proof.d+' 份，而且各份大小不同';
        details.push('第 '+(j.caseIndex+1)+' 张：各份占 '+j.observedShares.join('、')+' 格；'+conclusion+'。');
      }
      if(proof.first!==null)details.push('第一次判断的原选择是“'+({yes:'是',no:'不是'}[proof.first]||'未选择')+'”，以后纠正没有覆盖这条历史。');
    }else{
      observation='你把一个整体实际分成 '+proof.d+' 个单位份，选中了 '+proof.selectedIds.length+' 份，提交的量与 '+proof.answer[0]+'/'+proof.answer[1]+' 对上了。';
      connection='为什么分出来的每一份必须一样大？所选小份全部拼回去，还能和原来的整体对上吗？';
      if(proof.mode==='fold')details.push('操作记录留下 '+proof.folds.length+' 次当前轮对折按钮操作，系统显示的折痕方向与单位份数分别核对；不表示实际折过实体纸张。');
      if(proof.mode==='build')details.push('行、列和选中小格的真实身份已独立核对；改变分法必须重新核算单位份，不能只看最后填写的名字。');
    }
    if(proof.failures.length)details.push('记录保留了 '+proof.failures.length+' 次不成立的切分、判断或保存请求；正确作品没有抹去先前失败。');
    if(proof.resets.length)details.push('记录保留了 '+proof.resets.length+' 次重摆，第一次判断与原历史没有被当作新结果覆盖。');
    if(proof.issue)details.push('上次操作提示仍保留；当前提交依据已经完成的作品核对，没有把失败请求改成成功。');
    details.push('这里只描述当前完整提交与记录，不核验自由解释或长期掌握；历史最多保留2000条动作，不能恢复未记录的按键顺序或后续点击。');
    if(record.support)details.push('你曾查看可选提示或比较反馈，不能据此认定没有获得工具帮助。');
    return {title:'这次作品中的思考线索',observation,connection,detail:details,method:null};
  }
  if(task?.type==='x-scalechain'){
    const source=scaleChainBinding(task,context);if(!source)return null;
    const proof=replayScaleChainEvidence(task,model);if(!proof)return null;
    const unit=proof.unit||'',name=r=>{
      const scaled=BigInt(r[0])*100n,den=BigInt(r[1]);
      if(unit==='元'&&scaled%den===0n){
        const cents=scaled/den,absolute=cents<0n?-cents:cents;
        return `${cents<0n?'-':''}${absolute/100n}.${String(absolute%100n).padStart(2,'0')}`;
      }
      return r[1]===1?String(r[0]):r.join('/');
    };
    const observations=proof.stages.map((step,index)=>{
      const ending=step.mode==='off'?'从本轮整体减去这部分，留下':step.mode==='add'?'把这部分加回本轮整体，得到':'把取出的量作为本轮结果，得到';
      const relation=step.decimalRequired?`你填写的 ${step.submitted.decimal} 倍与题目的 ${step.percent}%（${step.ratio.join('/')}）等值。`:
        `本轮按题目取整体的 ${step.ratio.join('/')}。`;
      return `第 ${index+1} 轮以 ${name(step.before)}${unit} 为整体，平均分成 ${step.denominator} 份，每份 ${name(step.pieceValue)}${unit}。你选了 ${step.selectedCount} 份，取出 ${name(step.amount)}${unit}；${ending} ${name(step.result)}${unit}。${relation}`;
    });
    const detail=['框和等分格由工具显示；这里只核对保留的选份、数量记录与当前提交，不判断独立作图、建模或长期掌握。'];
    if(attempts.slice(0,-1).some(a=>replayScaleChainEvidence(task,a.value)===null))detail.unshift('你修改后又试了一次。');
    if(record.support)detail.push('你看过提示或比较反馈。');
    if(proof.failedRequests.length)detail.push(`记录保留了 ${proof.failedRequests.length} 次未成功的请求；这些请求没有被当成成功完成的一轮，后来的纠正仍能核对。`);
    if(proof.resets.length)detail.push('重做前的操作和最初填写仍保留；上面的各轮对应当前留下的结果。');
    if(proof.stages.length>1)detail.push('后一轮使用前一轮留下的结果作为新整体，不能直接沿用最初的整体。');
    return {title:'这次作品中的思考线索',observation:observations.join(' '),
      connection:'选出的部分与最后的结果有什么不同？用每小份的量，说明这一轮的整体和取量关系。',detail,method:null};
  }
  if(task?.type==='x-mixedaxis'){
    const source=mixedAxisBinding(task,context);if(!source)return null;
    const proof=replayMixedAxisEvidence(task,model);if(!proof)return null;
    const quantity=value=>value[1]===1?String(value[0]):value.join('/');
    const ordered=proof.order.indices.map(index=>task.cards[index]).join(' → ');
    const detail=['系统根据已经放下的坐标绘制数轴、刻度和点；这里只核对现存操作与提交，没有自动评价独立画图、自由解释或长期掌握。'];
    if(attempts.slice(0,-1).some(attempt=>replayMixedAxisEvidence(task,attempt.value)===null))detail.unshift('你修改后又试了一次。');
    if(record.support)detail.push('你看过提示或比较反馈。');
    for(const group of proof.order.equalValueGroups)detail.push(`卡片 ${group.indices.map(index=>task.cards[index]).join('、')} 表示同一个数 ${quantity(group.value)}，落在同一点；它们之间的先后不改变大小关系。`);
    if(proof.comparisons.length)detail.push(`已确认的 ${proof.comparisons.length} 句比较同时核对了两边的数值与题目指定的说法，包括“严格”和“允许相等”的区别。`);
    const draft=proof.currentDraft;
    if(draft.status==='invalid-number')detail.push('当前输入还不是工具可接受的数轴坐标；图中这张卡仍保留在已经放下的位置。');
    else if(draft.status==='outside-axis')detail.push('当前输入超出这条数轴的范围；图中这张卡仍保留在已经放下的位置。');
    else if(draft.status==='different-from-card')detail.push('当前输入与这张卡已经放下的正确坐标不同；这份反馈核对的是已经应用的落点，当前输入尚未改变它。');
    else if(!draft.matchesLastPlacementInput)detail.push('当前输入与这张卡的落点数值相同，但写法不同；这里只确认已经留下的落点，当前写法尚未成为新的放置记录。');
    else detail.push('当前输入与最近一次放下这张卡时留下的输入一致。');
    const wrongPlacements=proof.events.filter(event=>event.action==='place'&&event.accepted&&!event.placement.matchesCard).length;
    const invalidPlacements=proof.failedRequests.filter(event=>event.action==='place').length;
    const rejectedComparisons=proof.failedRequests.filter(event=>event.action==='symbol').length;
    if(wrongPlacements)detail.push(`历史保留了 ${wrongPlacements} 次曾经放错的位置；当前每张卡的落点已重新核对，旧错误没有删去。`);
    if(invalidPlacements)detail.push(`还有 ${invalidPlacements} 次无效或越界的坐标请求；当时没有放下新点，也没有把它们算成首次落点。`);
    if(rejectedComparisons)detail.push(`记录保留了 ${rejectedComparisons} 次未通过的比较请求及其输入和提示，后来确认的正确比较分别核对。`);
    if(proof.resets.length){
      const first=proof.firstPlacement,current=proof.currentRoundFirstPlacement;
      detail.push(`记录保留了 ${proof.resets.length} 次重摆。最早实际放下的是卡片 ${first.card}，当时坐标为 ${quantity(first.value)}；本轮第一次实际放下的是卡片 ${current.card}，坐标为 ${quantity(current.value)}。首次位置即使曾经放错也仍保留。`);
    }
    return {title:'这次作品中的思考线索',
      observation:`本次已经把 ${proof.cards.length} 张卡放在 ${proof.axis.min} 到 ${proof.axis.max} 的同一条数轴上，各卡的数值与已应用坐标相符。留下的从小到大顺序是 ${ordered}。`,
      connection:'如果两张卡写法不同却落在同一点，怎样说明它们的量相同？再看看输入框：改了文字之后，图上的点什么时候才会移动？',
      detail,method:null};
  }

  if(task?.type==='x-decimalengine'){
    const source=decimalEngineBinding(task,context);if(!source)return null;
    const proof=replayDecimalEngineEvidence(task,model);if(!proof)return null;
    const quantity=value=>value[1]===1?String(value[0]):value.join('/');
    const prediction=value=>value==='stop'?'会分完':'会循环';
    const detail=['下一行输入、单位、重复余数检测和循环提示由工具生成；这里只核对保留的输入与逐行数量关系，没有自动评价独立约分、自由解释、一般证明或长期掌握。'];
    if(attempts.slice(0,-1).some(attempt=>replayDecimalEngineEvidence(task,attempt.value)===null))detail.unshift('你修改后又试了一次。');
    if(record.support)detail.push('你看过提示或比较反馈。');
    detail.push(`本轮输入的表示是 ${proof.reduction.raw}，工具保存为 ${quantity(proof.simple)}；这里只核对提交表示与原量相同。`);
    if(proof.reduction.toolNormalized)detail.push('这个输入经过工具规范化；记录没有包含逐步求公因数或分子分母同除的过程。');
    const last=proof.rows.at(-1);
    detail.push(`最后一行记录为 ${last.input} = ${last.quotient} × ${proof.simple[1]} + ${last.remainder}，这一行每个单位是 ${quantity(last.unit)}。`);
    if(proof.expansion.kind==='stop')detail.push('最后余数为0，本次记录的除法在这里分完。');
    else{
      const prefix=proof.expansion.nonrepeatingDigits;
      detail.push(`记录中的余数 ${proof.expansion.firstRepeatedRemainder} 再次出现，工具标出的重复段为 ${proof.expansion.repeatingDigits}，从小数第 ${proof.expansion.cycleStartFractionalPlace} 位开始。${prefix?'前面的 '+prefix+' 是不重复的一段。':'循环前没有不重复的小数位。'}`);
    }
    const first=proof.firstPrediction,current=proof.currentRoundFirstPrediction;
    detail.push(`最早实际留下的预测是“${prediction(first.value)}”，${first.matchesExpected?'与本题核对结果相符。':'它与本题核对结果不同，原预测仍保留。'}`);
    if(proof.resets.length)detail.push(`保留了 ${proof.resets.length} 次重做；本轮第一次实际留下的预测是“${prediction(current.value)}”。重做没有删除最早预测或旧操作。`);
    if(proof.failedRequests.length)detail.push(`历史保留了 ${proof.failedRequests.length} 次没有推进构造的请求；当时的输入和提示分别保留，后来成功的步骤另行核对。`);
    const wrongPredictions=proof.events.filter(event=>event.action==='predict-stop'&&event.accepted&&!event.mathematicallyCorrect).length;
    if(wrongPredictions)detail.push(`记录中有 ${wrongPredictions} 次与结果不符的预测，最后实际记录的判断已与逐行结果核对。`);
    detail.push('关于10的质因子和重复余数的说明是本次选择的固定选项；独立解释需要另外观察。');
    return {title:'这次作品中的思考线索',
      observation:`你留下的分母因子是 ${proof.factorization.factors.join(' × ')}。逐行商位和余数核对得到 ${task.n}/${task.d} = ${proof.expansion.notation}。`,
      connection:proof.expansion.kind==='stop'?'为什么要先看最简分母？用每一行余数说明，这次怎样走到了0？':'找一找第一次重复的余数：从它继续计算，哪几步会再次出现？',
      detail,method:null};
  }

  if(task?.type==='x-fracshare'){
    const source=fracShareBinding(task,context);if(!source)return null;
    const proof=replayFracShareEvidence(task,model);if(!proof)return null;
    const name=r=>r[1]===1?String(r[0]):r.join('/'),unit=proof.unit||'个整体';
    const detail=[
      '整条、等分、归属颜色和每人块数由工具显示；这里只核对保留的分配操作与当前提交，不评价独立作图、实物分享、自由解释或长期掌握。',
      `最初填写的猜测“${proof.firstGuess.raw}”仍保留；本轮开始时填写的是“${proof.currentGuess.raw}”。猜测和最后提交分别记录。`
    ];
    if(attempts.slice(0,-1).some(a=>replayFracShareEvidence(task,a.value)===null))detail.unshift('你修改后又试了一次。');
    if(record.support)detail.push('你看过提示或比较反馈。');
    if(proof.failedRequests.length)detail.push(`记录保留了 ${proof.failedRequests.length} 次未成功的开始或细分请求；这些请求没有被当成成功分配，后来的纠正仍能核对。`);
    if(proof.cutRequests.filter(request=>request.accepted).length>1)detail.push('重新切分后，小块需要重新分配；较早的分配仍保留在操作记录中。');
    if(proof.resets.length)detail.push('重做保留了原输入和最初猜测；这里核对的是本轮留下的分配和最新提交。');
    if(proof.issue)detail.push('最后一次细分请求的提示仍保留；这里核对的是已有小块和改回合法分法后的当前提交，没有把那次失败说成成功。');
    if(proof.story.required)detail.push('你填写的故事原文仍保留；这里没有判断故事语义、作者或解释是否充分。');
    return {title:'这次作品中的思考线索',
      observation:`整条表示 1${unit}，原来要分的是 ${name(proof.originalQuantity)}${unit}。当前的 ${proof.totalPieces} 个小块全部分给了 ${proof.people} 人，每人 ${proof.recipients[0].count} 块；每小块是 ${name(proof.pieceValue)}${unit}，每人得到 ${name(proof.result)}${unit}。你本次提交的答案“${proof.answer.raw}”与各人的量等值；逆算“${proof.inverse.raw}”把每人的量乘回人数，回到原来的 ${name(proof.originalQuantity)}${unit}。`,
      connection:'如果再把每小块切细，块数和每块大小会怎样一起变化？为什么每人的量乘回人数应回到原来要分的那一小份？',
      detail,method:null};
  }
  if(task?.type==='x-mixedtrade'){
    const source=mixedTradeBinding(task,context);if(!source)return null;
    const proof=replayMixedTradeEvidence(task,model);if(!proof)return null;
    const name=r=>r[1]===1?String(r[0]):r.join('/'),b=proof.finalConstruction,
      detail=[
        proof.operation==='+'?'最初两部分合在一起的图由工具摆出；这里只核对后来的实际换单位操作和当前提交。':'最初的量、整体图和数量说明由工具显示；这里只核对实际换单位、拿走的量和当前提交。',
        `首次成功摆图时留下的猜测“${proof.firstGuess.raw}”仍保留；本轮开始时填写的是“${proof.currentGuess.raw}”。猜测与最后提交分别记录。`,
        '这些记录没有自动评价独立作图、自由解释或长期掌握。'
      ];
    if(attempts.slice(0,-1).some(a=>replayMixedTradeEvidence(task,a.value)===null))detail.unshift('你修改后又试了一次。');
    if(record.support)detail.push('你看过提示或比较反馈。');
    const failedStarts=proof.failedRequests.filter(event=>event.action==='start').length,
      failedRemovals=proof.failedRequests.filter(event=>event.action!=='start').length;
    if(failedStarts)detail.push(`记录保留了 ${failedStarts} 次没有成功摆出图的请求；这些填写没有被当成有效的首次猜测。`);
    if(failedRemovals)detail.push(`记录保留了 ${failedRemovals} 次小份不足等未成功的拿取和原提示；之后的换开与纠正仍逐步核对。`);
    if(proof.removals.some(event=>event.removedAs==='fraction-pieces'&&event.action==='take-whole'))
      detail.push(`有一次或多次拿走一个整体时，工具直接拿走了 ${proof.denominator} 个小份；没有另算一次“合成整体”的操作。`);
    if(proof.exchanges.some(event=>event.action==='all-pieces'&&event.wholesExchanged>1))
      detail.push('“全部换成小份”的一次请求可以换开多个整体；按钮次数和换开的整体数分别保留。');
    if(proof.resets.length)detail.push('重摆前的输入、最初猜测和全部操作仍保留；这里核对最后一轮的作品和最新提交。');
    const operation=proof.operation==='+'?
      `工具先把 ${name(proof.operandA)} 与 ${name(proof.operandB)} 摆在一起，初始总量是 ${name(proof.initialQuantity)}。`:
      `从 ${name(proof.operandA)} 出发，记录实际拿走 ${b.takenW} 个整体和 ${b.takenP} 个小份，共 ${name(proof.removedQuantity)}。`;
    return {title:'这次作品中的思考线索',
      observation:`${operation}每个小份是 1/${proof.denominator}。当前剩下 ${b.w} 个整体、${b.p} 个小份，总量为 ${name(proof.result)}。本次填写的整体“${proof.whole.raw}”、零头“${proof.part.raw}”和总量“${proof.answer.raw}”分别与当前图一致。`,
      connection:proof.operation==='+'?'先全部换成小份，与先把够一整个的小份合起来，有什么相同和不同？怎样核对换单位前后的总量不变？':'先全部换成小份，与只在小份不够时换开一个整体，有什么相同和不同？怎样核对留下的量与拿走的量仍合成原来的量？',
      detail,method:null};
  }
  if(task?.type==='x-fracdecompose'){
    const source=fracDecomposeBinding(task,context);if(!source)return null;
    const proof=replayFracDecomposeEvidence(task,model);if(!proof)return null;
    const q=value=>value[1]===1?String(value[0]):value.join('/'),draft=proof.currentDraft;
    const draftMessage=draft.savedSnapshotMatches?'当前分组和等式与已有的一种保存记录一致。':
      !draft.isSplit?'当前草稿还没有拆成两组，未作为新的拆法保存。':
      !draft.equation.valid?'当前草稿的等式还没有与当前分组对上；这里只确认已保存的作品。':
      draft.sameDecompositionSavedIndices.length?'当前草稿只是已有分组的顺序或写法变化，没有增加一种新的拆法。':
      '当前草稿的分组与等式已经对上，但还没有保存成新的作品。';
    const detail=[
      '工具提供等大的小份，并按切口画出分组、显示每组小份数；这里核对实际切口和保存等式，不评价独立作图、自由解释或长期掌握。',
      ...proof.savedDecompositions.map((saved,index)=>`已保存第 ${index+1} 种：各组有 ${saved.parts.join('、')} 个小份，对应的量为 ${saved.groupQuantities.map(q).join('、')}；你留下的等式是“${saved.equation.raw}”。等式各项与这些组一一对应，但记录没有把书写先后指定为图上组的顺序。`)
    ];
    const first=proof.firstAttempt;
    detail.push(`第一次保存请求的分组是 ${first.decomposition.parts.join('、')} 个小份，填写“${first.fields.equation||'（空）'}”；${first.accepted?'当时已成功保存':'当时未保存成功，原填写和提示仍保留'}。`);
    if(proof.failedRequests.length)detail.push(`记录保留了 ${proof.failedRequests.length} 次未保存成功的请求，包括当时的分组、等式和提示，没有把这些请求算作新拆法。`);
    if(proof.issue)detail.push('最后一次保存未成功的提示仍保留；已经保存的作品与这次未成功的请求分别核对。');
    if(proof.newGroups.length)detail.push('“换一种分组”只清开当前切口，先前保存的拆法和原填写仍保留。');
    if(proof.resets.length)detail.push(`记录保留了 ${proof.resets.length} 次重摆。这里列出最后一轮的保存成果；更早的保存与失败仍在操作记录中，第一次保存请求也没有被替换。`);
    if(attempts.slice(0,-1).some(a=>replayFracDecomposeEvidence(task,a.value)===null))detail.push('你修改后又检查了一次；较早的检查记录仍保留。');
    if(record.support)detail.push('你看过提示或比较反馈。');
    return {title:'这次作品中的思考线索',
      observation:`你已经保存 ${proof.savedDecompositions.length} 种不同的分组；每个小份是 ${q(proof.unitValue)}，每种保存作品的分组与等式都拼回原来的 ${q(proof.totalQuantity)}。${draftMessage}`,
      connection:'把分组交换先后，为什么还是同一种拆法？试着指出等式中的每一项分别对应哪些小份。',
      detail,method:null};
  }
  if(task?.type==='x-fdpboard'){
    const source=fdpBoardBinding(task,context);if(!source)return null;
    const proof=replayFdpBoardEvidence(task,model);if(!proof)return null;
    const shape=proof.baseRepresentation==='hundred-grid'?'百格图':'圆图';
    const submitted=proof.fraction.submitted;
    const detail=['这里只核对本次记录中的涂色、擦除和当前提交；没有自动评价自由解释、独立换算、作图能力或长期掌握。'];
    if(attempts.slice(0,-1).some(a=>replayFdpBoardEvidence(task,a.value)===null))detail.unshift('你修改后又试了一次。');
    if(record.support)detail.push('你看过提示或比较反馈。');
    const displays=[proof.systemRepresentations.line?'数轴位置':null,
      proof.systemRepresentations.additionalCircle?'附加圆图':null].filter(Boolean);
    if(displays.length)detail.push(`系统按当前涂出的 ${proof.selectedCount}/${proof.denominator} 自动显示${displays.join('和')}；视图请求只确认显示，图中的量会随涂色更新。`);
    if(proof.viewRequests.some(view=>!view.addedToDisplay))detail.push('重复请求视图只确认显示，不增加涂色操作。');
    if(proof.resets.length)detail.push('重摆前的操作和输入记录仍保留；这里核对的是最后涂出的部分和当前提交。');
    return {title:'这次作品中的思考线索',
      observation:`当前${shape}平均分成 ${proof.denominator} 份，实际涂了 ${proof.selectedCount} 份，还有 ${proof.unselectedCount} 份未涂。你本次提交的分数 ${submitted.numerator}/${submitted.denominator}、小数 ${proof.decimal.raw} 和百分数 ${proof.percent.raw}% 都与图中涂出的 ${proof.selectedCount}/${proof.denominator} 表示同一部分。`,
      connection:'如果擦去一份，哪些名字需要一起改变？试着说明整体和涂出的部分分别对应哪个数。',
      detail,method:null};
  }
  if(task?.type==='x-samefraction'){
    const source=sameFractionBinding(task,context);if(!source)return null;
    const proof=replaySameFractionEvidence(task,model);if(!proof)return null;
    const left=proof.left.fraction.join('/'),right=proof.right.fraction.join('/'),detail=[
      '这里只核对本次实际选份、显示请求和当前提交；没有自动评价自由解释、独立证明或长期掌握。',
      `你本轮留下的预测是“${proof.currentPrediction.value}”；本次最终提交的比较是“${proof.relation}”。`
    ];
    if(attempts.slice(0,-1).some(a=>replaySameFractionEvidence(task,a.value)===null))detail.unshift('你修改后又试了一次。');
    if(record.support)detail.push('你看过提示或比较反馈。');
    const emptyPredictions=proof.failedRequests.filter(e=>e.action==='predict').length,
      failedRefinements=proof.failedRequests.filter(e=>e.action==='refine').length;
    if(emptyPredictions)detail.push(`记录还保留了 ${emptyPredictions} 次尚未选择比较符号的请求；空选择没有被计为第一次或本轮预测。`);
    if(failedRefinements)detail.push(`记录保留了 ${failedRefinements} 次未画出新共同网格的请求及原填写和提示；当时已有的选份与网格没有改变。`);
    if(proof.issue)detail.push('最后一次细分请求的提示仍保留；这里核对的是已有共同网格和本次提交，没有把那次失败说成成功。');
    if(proof.resets.length)detail.push(`记录保留了 ${proof.resets.length} 次重摆；第一次留下的预测“${proof.firstPrediction.value}”与本轮预测分别保留。`);
    if(proof.overlays.some(request=>request.left[0]!==proof.left.selectedCount||request.right[0]!==proof.right.selectedCount))
      detail.push('较早请求的叠图显示当时所选的量；系统随后会按你的新选择更新显示。');
    if(proof.common)detail.push(`你请求显示 ${proof.common.denominator} 等份的共同网格，由系统画出。你本次提交的新分数 ${proof.common.left.join('/')} 和 ${proof.common.right.join('/')}，分别与 ${left} 和 ${right} 等值。`);
    return {title:'这次作品中的思考线索',
      observation:`工具提供了同样大的两个整体。你当前在上边 ${proof.left.denominator} 个等份中选了 ${proof.left.selectedCount} 份（${left}），在下边 ${proof.right.denominator} 个等份中选了 ${proof.right.selectedCount} 份（${right}）。系统按当前选择自动显示叠图；你本次提交的比较是 ${left} ${proof.relation} ${right}，并选择了“两边整体一样大”。`,
      connection:'如果两边每一小份大小不同，怎样从同一个整体出发比较所选的量？试着说明，为什么只看分母还不能比较所有分数。',
      detail,method:null};
  }
  if(task?.type==='x-divtable'){
    const source=divisionBinding(task,context);if(!source)return null;
    const proof=replayDivisionEvidence(task,model);if(!proof)return null;
    const unit=power=>power>=0?['一','十','百','千','万'][power]:['十分之一','百分之一','千分之一','万分之一','十万分之一','百万分之一'][-power-1];
    const notation=proof.method.value==='short'?'紧凑':'展开乘减';
    const detail=[proof.method.origin==='task-default'?`本题题目给定${notation}记法；本轮没有记录选择记法的操作。`:
      `你在这一轮选择了${notation}记法。这表示本次使用的记录形式。`,
      '工具显示本次带下和换单位的数值示意；这里核对填写的数值，不据此评价独立画图、逐物分配或长期掌握。'];
    if(attempts.slice(0,-1).some(a=>replayDivisionEvidence(task,a.value)===null))detail.unshift('你修改后又检查了一次。');
    if(record.support)detail.push('你看过提示或比较反馈。');
    const wrongDigits=proof.failedRequests.filter(e=>e.action==='b14-div-step').length,
      emptyMethods=proof.failedRequests.filter(e=>e.action==='b14-method').length,
      containerLimits=proof.failedRequests.filter(e=>e.action==='b14-container').length;
    if(wrongDigits)detail.push(`记录保留了 ${wrongDigits} 次尚未对上的逐位请求，原填写和提示仍在；它们没有增加已完成位数。下面只描述后来实际完成的逐位关系。`);
    if(emptyMethods)detail.push(`记录保留了 ${emptyMethods} 次尚未选择记法的请求，没有把空选择当作一种记法。`);
    if(containerLimits)detail.push(`记录保留了 ${containerLimits} 次份数已到工具上限后的添份请求；当时份数没有变化，也不计作一次容器增加。`);
    for(const s of proof.steps)detail.push(`第${s.position+1}步，单位是${unit(s.power)}：${s.current} = ${s.quotientDigit} × ${proof.divisor} + ${s.remainder}；乘回填写 ${s.used}，余数 ${s.remainder} 小于 ${proof.divisor}。`);
    detail.push(`提交的倒算核对了整数商、除数和原单位余数：${proof.integerQuotient} × ${proof.divisor} + ${proof.remainingOriginal} = ${proof.dividend}。`);
    if(proof.answer.role==='keep')detail.push(`你提交的整数商是 ${proof.integerQuotient}，剩下 ${proof.remainingOriginal} 个原来的单位。`);
    if(proof.answer.role==='fraction')detail.push(`你提交的每份结果 ${proof.answer.raw} 与 ${proof.dividend}/${proof.divisor} 精确相等。整数部分后余 ${proof.remainingOriginal} 个原来的单位；继续平均分到每份，对应 ${proof.answer.fractionalShare.join('/')}。`);
    if(proof.answer.role==='decimal')detail.push(`你提交的每份小数 ${proof.answer.raw} 与 ${proof.dividend}/${proof.divisor} 精确相等。逐位记录到${unit(-proof.calculated.places)}，这一位的余数已经是0。`);
    if(proof.rounding){
      const r=proof.rounding,c=proof.calculated;
      detail.push(`逐位记录只到 ${c.written}，此时还余 ${c.remainder} 个${unit(-c.places)}的原量。按题目要求保留${r.places}位小数，提交的近似结果是 ${r.formatted}。`);
      detail.push(`近似值按精确分数 ${proof.dividend}/${proof.divisor} 核对，恰在中点时向上取；实际逐位操作范围仍是已记录的${c.places}位小数。`);
      if(r.precisionChosen)detail.push(`当前精度选择是${r.places}位小数，与题目要求相符。`);
    }
    if(proof.containers){
      const c=proof.containers;
      if(task.interpret==='down'&&proof.events.some(e=>e.action==='b14-container'&&e.accepted&&!e.allSelectedCanBeFull))
        detail.push('记录保留了曾经试添超过原量可装满的份数及后续调整；中间状态不作为所有份都已装满的证据。这里只核对记录的份数和数量关系，不据此还原当时的说明文字。');
      detail.push(c.minimumSufficient?`当前 ${c.count} 份每份最多 ${c.perContainer}，可放 ${c.capacity}，足够安排 ${proof.dividend}；少一份只能放 ${c.adjacentCapacity}，还不够。`:
        `当前 ${c.count} 份都是完整的 ${c.perContainer}，用去 ${c.capacity}，剩 ${proof.remainingOriginal}；再加一整份需要 ${c.adjacentCapacity}，超过原来的 ${proof.dividend}。`);
      detail.push(`本轮记录了 ${c.events.length} 次容器增减，最后份数是 ${c.count}。容器示意由工具按份数自动填充，不据此评价逐个物品的分配。`);
    }
    if(proof.resets.length)detail.push(`历史保留了 ${proof.resets.length} 次重新做；上面的逐位步骤对应最近一轮。`);
    return {title:'这次作品中的思考线索',
      observation:`你为 ${proof.dividend} ÷ ${proof.divisor} 逐位填写了商、乘回量和余数。当前商的逐位记录为 ${proof.calculated.written}${proof.steps.some(s=>s.quotientDigit===0)?'，其中的0也保留在相应数位':''}。每一步的单位和数量关系已核对。`,
      connection:'换一个用途时，余量能继续分、需要另添一份，还是只能留下完整份？怎样用当前记录说明答案的含义？',detail,method:null};
  }
  if(task?.type==='x-fractioncase'){
    const source=fractionCaseBinding(task,context);if(!source)return null;
    const proof=replayFractionCaseEvidence(task,model);if(!proof)return null;
    const core=proof.construction,name=r=>r[1]===1?String(r[0]):r.join('/'),result=name(proof.quantities.result);
    const kinds={negative:'比0小',zero:'等于0',part:'在0与1之间',one:'等于1',more:'比1大'};
    const detail=['这里只核对本次记录中的选择、图示和当前提交；工具生成的图和读数不等于独立构造或证明，没有自动评价自由解释、故事的意义或长期掌握。'];
    if(attempts.slice(0,-1).some(a=>replayFractionCaseEvidence(task,a.value)===null))detail.unshift('你修改后又试了一次。');
    if(record.support)detail.push('你看过提示或比较反馈。');
    if(proof.failedRequests.length)detail.push(`记录保留了 ${proof.failedRequests.length} 次未被工具接受的开始或换算请求；最初填写、失败提示和原操作记录仍在，没有把失败算成成功开始或正确换算。后续纠正与当前作品分别核对。`);
    if(core.failedRequests.length)detail.push(`图示记录还保留了 ${core.failedRequests.length} 次未被工具接受的请求；这些请求没有改变当时的构造，也不计作成功接合、放组或余量显示。`);
    if(proof.estimate){
      const e=proof.estimate;
      detail.push(`最初开始时填写的范围是 ${proof.firstAttempt.low||'未填写'} 到 ${proof.firstAttempt.high||'未填写'}；本轮填写的范围是 ${e.bounds[0]} 到 ${e.bounds[1]}，包含两个端点。工具根据本轮区间中点自动记下量级估计，这不是额外一次作答。当前图示表示 ${result}，${e.inside?'在':'不在'}本轮区间内，与本次提交的判断相符；范围没有包含结果也可以如实核对。`);
    }else{
      detail.push(`最初填写的量级猜想是“${kinds[proof.firstAttempt.guess]||'未选择'}”；本轮开始填写的是“${kinds[proof.currentStart.guess]}”。工具把本轮猜想带入图示，未把它算作第二次预测；当前构造得到的量${kinds[core.resultKind]}，猜想和后来的操作分别保留。`);
    }
    if(proof.resets.length)detail.push(`你重新摆放了 ${proof.resets.length} 次，之前的记录和最初猜想仍保留；下面只描述当前留下的有效构造。`);
    let observation,connection;
    if(core.product){
      const p=core.product;
      observation=`你实际选择了 ${p.columns.length} 列和 ${p.rows.length} 行，每个小格表示 ${name(p.cellArea)} 个面积单位。工具显示交集有 ${p.cellCount} 小格，合计 ${result} 个面积单位；行列选择、交集面积与当前填写的答案分别核对。`;
      connection='情境中的两个量各对应哪一边的小份？换一种等值分法时，每格的面积和格数怎样一起改变？';
      if(!p.contiguousColumns||!p.contiguousRows)detail.push('这次包含不连续的行或列；核对的是所有交集小格的面积，没有把它们当作一块连续长方形。');
    }else if(core.division){
      const d=core.division;
      observation=`你选中了 ${d.originalPieces} 小份作为原来的量、${d.groupPieces} 小份作为一组的量，每小份是 ${name(core.common.unit)}。当前构造记录了 ${d.wholeGroups} 次有效放组，工具显示余下 ${d.remainingPieces} 小份；余量是原单位的 ${name(d.remainingAmount)}，也是一组的 ${name(d.fractionOfGroup)}。${d.wholeGroups} 整组加上这一部分，与当前填写的 ${result} 相符。`;
      connection='在这个情境里，答案数的是多少个什么？不足一组的余量，相对原单位和相对一组各怎样命名？';
    }else{
      const c=core.combination,unit=name(core.common.unit);
      observation=`你把情境中的两个量分别表示为 ${c.leftCount} 个 ${unit} 和 ${c.rightCount} 个 ${unit}。点击“${c.operator==='+'?'把两部分接起来':'从第一部分拿走第二部分'}”后，工具显示 ${c.resultCount} 个 ${unit}，表示 ${result}；原量、实际选份、共同单位与当前答案分别核对。`;
      connection='情境中哪些量被接起来或拿走？换成同样大的小份时，怎样保持每个原量不变？';
    }
    if(proof.simple)detail.push(`本次提交的最简名字 ${proof.simple.raw} 与图示结果等值；这里只核对填写的名字，没有把它记成一次独立约分操作。`);
    if(proof.mixed)detail.push(`本次提交的整份 ${proof.mixed.submitted.whole} 和余下部分 ${proof.mixed.submitted.part}，分别表示 ${proof.mixed.whole} 整与 ${name(proof.mixed.part)} 个原单位，合在一起与当前结果相符。`);
    if(proof.tile)detail.push(`本次提交的每格面积 ${proof.tile.submitted.tile} 和格数 ${proof.tile.submitted.count}，与实际交集的单位 ${name(proof.tile.unit)}、${proof.tile.count} 小格相符；填写这些数本身不是额外一次构造。`);
    if(proof.inverse)detail.push(`本次提交的算式 ${proof.inverse.raw} 已核对：组数 ${name(proof.inverse.result)} 与每组的量 ${name(proof.inverse.group)} 相乘，等于原来的量 ${name(proof.inverse.total)}。这里只核对提交的关系，没有把算式当成另外一次计算操作。`);
    if(proof.normalized){
      const n=proof.normalized,factor=name(n.factor);
      detail.push(`你请求工具显示换算；本次记录的两边同乘 ${factor}：${name(proof.quantities.a)} × ${factor} = ${name(n.scaledA)}，${name(proof.quantities.b)} × ${factor} = 1。两边使用相同倍数，商保持不变。这里核对的是与已完成图示兼容的换算关系，不能确定换算发生的精确时刻。`);
    }
    if(proof.storyProvided)detail.push('你填写的故事仍然保留；这里没有自动判断故事是否完整说明了数学关系。');
    return {title:'这次作品中的思考线索',observation,connection,detail,method:null};
  }
  if(task?.type==='x-fracoperations'){
    const source=fractionOperationsBinding(task,context);if(!source)return null;
    const proof=replayFractionOperationsEvidence(task,model);if(!proof)return null;
    const name=r=>r[1]===1?String(r[0]):r.join('/'),result=name(proof.quantities.result);
    const detail=['这里只核对本次记录中的选份、操作和当前提交；工具生成的结果图不等于独立构造或证明，没有自动评价自由解释或长期掌握。'];
    if(attempts.slice(0,-1).some(a=>replayFractionOperationsEvidence(task,a.value)===null))detail.unshift('你修改后又试了一次。');
    if(record.support)detail.push('你看过提示或比较反馈。');
    const kinds={negative:'比0小',zero:'等于0',part:'在0与1之间',one:'等于1',more:'比1大'};
    detail.push(`最初记录的估计是“${kinds[proof.firstPrediction]}”；当前构造得到的量${kinds[proof.resultKind]}。估计与构造结果分别保留。`);
    if(proof.resets.length)detail.push(`你重置了 ${proof.resets.length} 次，之前的操作和最初估计仍保留；下面只描述当前留下的有效构造。`);
    const emptyPredictions=proof.failedRequests.filter(e=>e.action==='predict-op').length,
      unfinishedRequests=proof.failedRequests.length-emptyPredictions;
    if(emptyPredictions)detail.push(`记录保留了 ${emptyPredictions} 次空选择请求；它们没有留下估计，也没有改变作品。`);
    if(unfinishedRequests)detail.push(`记录保留了 ${unfinishedRequests} 次尚未完成的请求；这些请求没有改变当时的构造，也不计作成功接合、放组或余量显示。后续实际纠正与当前作品分别核对。`);
    let observation,connection;
    if(proof.product){
      const p=proof.product;
      observation=`你实际选择了 ${p.columns.length} 列和 ${p.rows.length} 行，每个小格表示 ${name(p.cellArea)}。工具显示两种选择的交集共 ${p.cellCount} 小格，表示 ${result}；所选行列、交集面积与当前答案已分别核对。`;
      connection='如果把行或列的小份再细分，怎样确认交集表示的量不变？整体超过1时，每个小格的单位会改变吗？';
      if(!p.contiguousColumns||!p.contiguousRows)detail.push('这次有不连续的选择；核对的是所有交集小格的面积，不把它们冒充一块连续的长方形。');
    }else if(proof.division){
      const d=proof.division;
      observation=`你选出了 ${d.originalPieces} 小份作为被分的量、${d.groupPieces} 小份作为每组的量，每小份是 ${name(proof.common.unit)}。当前构造记录了 ${d.wholeGroups} 次有效放组；工具显示还余 ${d.remainingPieces} 小份。余量是原来单位的 ${name(d.remainingAmount)}，也是一组的 ${name(d.fractionOfGroup)}；${d.wholeGroups} 整组加上这一部分，与填写的 ${result} 相符。`;
      connection='剩下的量相对原来的整体和相对一组，为什么可以有两个分数名字？还不够一整组时，怎样记录它？';
    }else{
      const c=proof.combination,unit=name(proof.common.unit);
      observation=`你在同一单位下分别选中了 ${c.leftCount} 个 ${unit} 和 ${c.rightCount} 个 ${unit}。点击“${c.operator==='+'?'把两部分接起来':'从第一部分拿走第二部分'}”后，工具显示 ${c.resultCount} 个 ${unit}，表示 ${result}；两边原量、共同单位和当前答案已分别核对。`;
      connection='换用另一种同样小的份，选中的份数会怎样变，表示的原量又怎样保持？试着说明这次接起来或拿走的是什么单位。';
    }
    return {title:'这次作品中的思考线索',observation,connection,detail,method:null};
  }
  if(task?.type==='x-portiongroups'){
    const source=portionGroupsBinding(task,context);if(!source)return null;
    const proof=replayPortionGroupsEvidence(task,model);if(!proof)return null;
    const detail=['这里只核对本次记录中物品的身份、分放、所选的组和当前提交；没有自动评价自由解释、独立计算步骤或长期掌握。'];
    if(attempts.slice(0,-1).some(a=>replayPortionGroupsEvidence(task,a.value)===null))detail.unshift('你修改后又试了一次。');
    if(record.support)detail.push('你看过提示或比较反馈。');
    detail.push(`按组来看，当前选了 ${proof.fraction.groups[0]}/${proof.fraction.groups[1]}；按物品来看，当前选了 ${proof.fraction.tokens[0]}/${proof.fraction.tokens[1]}。这里的整体都是全部 ${proof.total} 颗物品，不能只把未选中的物品当作整体。`);
    if(proof.fraction.submitted){
      const name=proof.fraction.submitted;
      detail.push(`你提交的分数 ${name.numerator}/${name.denominator} 与这部分等值；这个分数的写法和实际选中的 ${proof.selectedGroups.length} 组、全部 ${proof.partitions} 组已分别核对。`);
    }
    if(proof.equation)detail.push(`你提交的等式 ${proof.equation.raw} 与当前分组数量相符；等式是本次填写的关系，本控件没有记录一个独立的计算过程。`);
    if(proof.confirmations.length)detail.push(`记录中还有 ${proof.confirmations.length} 次点击已在当前组里的物品；这些点击没有换组，也没有增加或取走物品，不算新的移动。`);
    if(proof.resets.length)detail.push(`你按过 ${proof.resets.length} 次重新摆；之前的事件仍保留，当前分组按最后留下的物品位置核对。`);
    return {title:'这次作品中的思考线索',
      observation:`这次的 ${proof.total} 颗物品最终分成 ${proof.partitions} 组，每组 ${proof.each} 颗。你当前选中了 ${proof.selectedGroups.length} 组，包含 ${proof.selectedTotal} 颗；未选中的还有 ${proof.unselectedTotal} 颗。每颗物品只有一个位置；每次分放后，各组里的物品加上尚未分放的物品，总量保持一致。`,
      connection:'如果整体的物品变多，仍取相同的分数，取出的颗数会怎样变化？试着用组数和物品数分别解释。',
      detail,method:null};
  }
  if(task?.type==='x-estimatecheck'){
    const source=estimateBinding(task,context);if(!source)return null;
    const proof=replayEstimateEvidence(task,model);if(!proof)return null;
    const detail=[`这里只核对保留的 ${proof.estimateEventCount} 次估计提交、最后成功锁定的估计与这次提交的数值关系；没有自动评价自由解释、独立逆算过程或长期掌握。`];
    if(proof.failedEstimateCount)detail.unshift(`记录中保留了 ${proof.failedEstimateCount} 次尚未锁定的估计提交；你随后更正并成功锁定。首尝试仍然保留，没有被后来的估计覆盖。`);
    if(attempts.slice(0,-1).some(a=>replayEstimateEvidence(task,a.value)===null))detail.unshift('你修改后又试了一次。');
    if(record.support)detail.push('你看过提示或比较反馈。');
    detail.push(`系统依据你选择的间隔推得范围：结果${proof.bounds.lowerInclusive?'不小于':'大于'} ${proof.display.low}，小于 ${proof.display.high}。这个范围由系统推导，没有据此判断你已自行构造或证明了范围。`);
    detail.push(`你提交的逆运算等式是 ${proof.display.inverse}，其中的数量关系成立；本控件没有记录一个独立的逆运算操作过程。`);
    if(proof.accuracy)detail.push('这次选择的间隔满足题目事先要求的误差保证；不能只凭这一次碰巧接近就换用更粗的间隔。');
    if(proof.claim)detail.push(proof.claim.plausible?
      `给出的 ${proof.display.claim} 落在这个估计范围内，属于可能的结果。${proof.claim.exactCorrect?'它也与本题精确结果相同。':`但 ${proof.display.claim} 不等于本题精确结果 ${proof.display.answer}，可能并不代表精确正确。`}`:
      `给出的 ${proof.display.claim} 不在这个估计范围内；本次提交的“不可能”与这个范围相符。`);
    return {title:'这次作品中的思考线索',
      observation:`你最后成功锁定的间隔是 ${proof.display.unit}，把 ${proof.display.values[0]}、${proof.display.values[1]} 分别取为 ${proof.display.rounded[0]}、${proof.display.rounded[1]}，留下估计 ${proof.display.rounded[0]} ${proof.operation==='+'?'+':'−'} ${proof.display.rounded[1]} = ${proof.display.estimate}。当前填写的精确结果是 ${proof.display.answer}；估计记录和精算结果已分别核对。`,
      connection:'如果把间隔换细一些，估计范围会怎样变化？一个数落在范围内，为什么还需要精算？',
      detail,method:null};
  }
  if(task?.type==='x-storyledger'){
    const source=storyLedgerBinding(task,context);if(!source)return null;
    const proof=replayStoryLedgerEvidence(task,model);if(!proof)return null;
    const places=String(proof.scale).length-1,display=n=>{
      const value=BigInt(n),negative=value<0n,a=negative?-value:value;
      return (negative?'-':'')+String(a/BigInt(proof.scale))+(places?'.'+String(a%BigInt(proof.scale)).padStart(places,'0'):'');
    };
    const equations=proof.accepted.map(e=>`${display(e.balanceBefore)} ${e.expectedOperation==='+'?'+':'−'} ${display(e.expectedAmount)} = ${display(e.balanceAfter)}`);
    const quantity=source.role==='remaining-goal'?'距离目标还差的数量':source.role==='smaller-comparison'?'比较中要找的较小数量':source.role==='remaining-length'?'余下的长度':'账本里留下的数量';
    const observation=`这次保留的记录从 ${display(proof.start)} ${proof.unit} 开始，依次提交了 ${equations.join('；')}。${quantity}最后是 ${display(proof.end)} ${proof.unit}；每条被保存的结果都与下一件事的起点接上。`;
    const detail=['这里只描述保留的逐步提交与当前已检查作品，不把填写结果当作逐件操作、独立证明或长期掌握；没有自动评价自由解释。'];
    if(proof.failed.length)detail.push(`保留的记录中有 ${proof.failed.length} 次未推进的提交：它们没有改变当时的数量或进入下一件事；随后同一步的更正仍保留，首尝试与后来保存的正确条目分别核对。`);
    if(record.support)detail.push('你看过提示或比较反馈。');
    if(source.role==='smaller-comparison')detail.push('这里用已知较大的数量减去两者的差，求较小数量；提交的减法不表示实际拿走了物品。');
    if(source.role==='remaining-goal')detail.push('这里追踪距离目标还差多少；继续收集会减小这个差额，没有把它当成已收集数量在减少。');
    detail.push('你选择的“在心里想”“画一画或写下来”或“借助计算工具”只作为自己的方法记录保留，这里没有验证实际心算、书写或工具使用过程。');
    return {title:'这次作品中的思考线索',observation,detail,connection:source.role==='remaining-goal'?'如果再收集一些，剩余差额怎样变？怎样用目标和已收集量检查它？':'如果漏掉中间一件事，后面的起点会怎样变化？你可以怎样检查每一步的数量关系？',method:null};
  }
  if(task?.type==='x-joinstory'){
    const source=joinStoryBinding(task,context);if(!source)return null;
    const proof=replayJoinStoryEvidence(task,model);if(!proof)return null;
    const d=proof.latest,p=proof.firstPrediction,first=proof.demonstrations[0];
    const role=p.role==='a'?'原来的一堆':p.role==='b'?(task.op==='+'?'另一部分':'要取走的数量'):task.compare?'两排相差的数量':'合并或取走后的数量';
    const relation=r=>`${r.a} ${r.op==='+'?'+':'−'} ${r.b} = ${r.result}`;
    const detail=[
      `记录中保留了 ${proof.demonstrations.length} 次演示请求和 ${proof.swaps.length} 次交换显示；数量图和演示结果由系统生成。`,
      `首次留下的猜想是 ${p.value}。本题要找的是${role}，当前作品核对得到 ${p.expected}，与这个猜想${p.correct?'相同':'不同'}。`,
      '这里只核对保存的演示请求、交换和当前提交；没有记录逐颗操作或每一次尝试，也没有自动评价自由解释、独立证明或长期掌握。'
    ];
    if(!first.matchesTask&&first.guess.displayExpected!==null)detail.push(`最初那次探索记录的是 ${relation(first)}；其中对应猜想框的量是 ${first.guess.displayExpected}，与当时猜想${first.guess.matchesDisplay?'相同':'不同'}。这次探索与本题所求的量分别核对。`);
    if(proof.insufficientAttempts.length)detail.push(`记录中还保留了 ${proof.insufficientAttempts.length} 次物品不够拿的尝试；这些请求没有被当作成功取走，也没有把负数说成实物剩余。后面的演示和当前算式另外核对。`);
    if(proof.limitedDisplays.length)detail.push(`有 ${proof.limitedDisplays.length} 次早先预览没有完整对应请求的数量或动作；这些记录仍然保留，不用它们判断数量关系。这里核对的是最后与题目对应的演示和算式。`);
    if(proof.demonstrations.some(e=>!e.matchesTask))detail.push('其他数量或动作的探索仍保留在记录中；当前算式核对最新一次符合题目条件的演示。');
    if(proof.demonstrations.some(e=>e.sameAsPreviousRecordedDisplay))detail.push('你又请求过相同数量和动作的演示；这些请求没有被累计成更多物品。');
    if(proof.reference)detail.push(`另一边的 ${proof.reference.parts[0]} 与 ${proof.reference.parts[1]} 是工具给定的参照，共 ${proof.reference.total}；你当前提交的等式把演示中的两部分与这个参照对应。`);
    if(proof.swaps.length){
      const current=proof.currentDisplay;
      if(current.kind==='insufficient')detail.push(`交换后的当前显示从 ${current.available} 个中尝试取走 ${current.requested} 个。系统最多划去已有的 ${current.shownRemoved} 个，仍少 ${current.missing} 个，实物不够；你提交的选择也表示“不够”。`);
      else detail.push(`交换后的当前显示是 ${current.parts[0]} 与 ${current.parts[1]}，系统显示总数仍为 ${current.total}。你提交的交换后算式是「${proof.submitted.otherEquation.raw}」。`);
    }
    if(attempts.length>1)detail.push('以前的提交仍保留；这里描述的是最新一次检查的完整作品。');
    if(record.support)detail.push('你打开过提示或比较反馈。');
    const observation=d.display.kind==='comparison'?
      `最后一次记录的演示使用 ${d.a} 与 ${d.b} 两排。系统配对显示 ${d.display.paired} 对，第一排还多 ${d.display.leftUnpaired} 个；这是数量比较。当前提交的算式「${proof.submitted.equation.raw}」与这些数量对应。`:
      d.op==='+'?`最后一次记录的演示选择 ${d.a} 与 ${d.b} 两部分，系统显示合起来共 ${d.result} 个${d.b===0?'；增加0个，数量保持不变':''}。当前提交的算式「${proof.submitted.equation.raw}」与这次演示对应。`:
      `最后一次记录的演示从 ${d.a} 个中表示取走 ${d.b} 个，系统图显示还剩 ${d.result} 个${d.b===0?'；取走0个，数量保持不变':''}。当前提交的算式「${proof.submitted.equation.raw}」与这次演示对应。`;
    return{title:'这次作品中的思考线索',observation,
      connection:task.compare?'如果两排一样多，配对后会留下多少？怎样用算式说明？':
        task.swap?'交换两部分后，合并与取走各会怎样？试着说明数量相同与实物够不够的区别。':
        task.hidden?'把找到的那一部分代回完整故事，怎样核对它和已知数量的关系？':
        '如果只改变其中一部分，演示的结果和写下的算式怎样一起改变？',detail,method:null};
  }
  if(task?.type==='x-g25-turn'){
    const source=angleBinding(task,context);if(!source)return null;
    const proof=replayAngleEvidence(task,model);if(!proof)return null;
    const detail=['这里只核对本次指定并留下的开口、边长等级与当前回答；没有自动评价自由解释、独立连续推导或长期掌握。'];
    if(proof.failedRequests.length)detail.push(`记录中保留了 ${proof.failedRequests.length} 次没有改变开口或边长的失败请求；原来的输入和提示仍在，这些请求没有被算作转动或新增记录。`);
    if(proof.confirmations)detail.push(`相同开口、边长或记录的重复确认也已保留，没有重复累计角度或记录。`);
    if(attempts.slice(0,-1).some(a=>replayAngleEvidence(task,a.value)===null))detail.unshift('你修改后又试了一次。');
    if(record.support)detail.push('你看过提示或比较反馈。');
    if(proof.lengthComparison)detail.push(`你分别留下了短边、长边时同为 ${proof.lengthComparison.angle}° 的记录；改变边的长短没有改变这两份记录中的开口。`);
    if(proof.cross)detail.push(`按当前 ${proof.cross.angle}° 的开口核对，对顶角为 ${proof.cross.opposite}°，邻角为 ${proof.cross.adjacent}°；相邻两角合计180°，交点周围四角合计360°。`);
    if(proof.differences.length)detail.push(`本题指定的目标记录之间的差为：${proof.differences.map(r=>`${r.to}° − ${r.from}° = ${r.difference}°`).join('；')}。这些是记录间的数量关系。`);
    if(proof.triangle)detail.push(`按这些累计开口得到的三部分为 ${proof.triangle.parts.join('°、')}°，合计 ${proof.triangle.sum}°，超过三角形内角和180°。本次没有实际构造三角形。`);
    if(proof.advances.length)detail.push(`按钮留下的实际变化包括：${proof.advances.slice(0,5).map(r=>r.wrapped?'从整圈到下一圈的90°位置':`${r.from}° 到 ${r.to}°，增加 ${r.degrees}°`).join('；')}${proof.advances.length>5?'；其余变化也已逐条核对':''}。`);
    return {title:'这次作品中的思考线索',
      observation:`你按先后留下了本题要求的开口 ${proof.targetRecords.map(r=>r.angle+'°').join('、')}；当前控件的开口为 ${proof.angle}°。实际操作、保存的记录与这次填写的关系已分别核对。`,
      connection:proof.lengthComparison?'保持开口不动，只把两条边画长些，哪些记录会变？':'如果换一个开口，怎样用已记录的角度解释它与半圈、整圈或相邻开口的关系？',
      detail,method:null};
  }
  if(task?.type==='x-p24-transform'){
    const source=transformBinding(task,context);if(!source)return null;
    const proof=replayTransformEvidence(task,model);if(!proof)return null;
    const detail=['这里只核对本次选择的变换参数、工具生成的对应坐标和当前提交；没有自动评价自由解释、独立作图、独立量取或长期掌握。'];
    if(proof.failedRequests.length)detail.push(`记录中保留了 ${proof.failedRequests.length} 次尚未形成预测或变换的请求；这些失败没有被当作成功变换，也没有覆盖首次留下的输入。`);
    if(proof.confirmations)detail.push(`相同图形或读数的重复确认仍在记录中，没有被累计成新的图形变化或独立测量。`);
    if(attempts.slice(0,-1).some(a=>replayTransformEvidence(task,a.value)===null))detail.unshift('你修改后又试了一次。');
    if(record.support)detail.push('你看过提示或比较反馈。');
    detail.push(proof.prediction.correct?'你留下的有效坐标猜想与这次第一个对应点相符。':'你留下的有效坐标猜想与这次第一个对应点不同；猜想和后来的操作已分别核对。');
    if(proof.invariants.edgeSquared.length)detail.push(`按实际对应点核对，对应边长是原来的 ${proof.display.lengthFactor} 倍；边长平方是原来的 ${proof.display.squaredLengthFactor} 倍。`);
    if(proof.invariants.anglesPreserved)detail.push('这些对应点形成的角保持相同；这只核对本次图形。');
    if(proof.measurementCount)detail.push(`你请求工具显示过 ${proof.measurementCount} 次读数；这些读数由工具生成，没有据此判断你已独立量取。`);
    const pairs=proof.display.sourcePoints.map((point,i)=>`${point} → ${proof.display.imagePoints[i]}`);
    return {title:'这次作品中的思考线索',
      observation:`你最后选择了${proof.display.operation}。工具每次都从原图计算，当前对应点是 ${pairs.join('；')}。实际记录中的 ${proof.operationCount} 次变换参数与对应坐标已逐一核对。`,
      connection:'如果换一个点或换一种参数，怎样先猜它的对应位置？试着说明哪些量会改变，哪些量会保持。',
      detail,method:null};
  }
  if(task?.type==='x-mulgroups'){
    const source=groupsBinding(task,context);if(!source)return null;
    const proof=replayGroupsEvidence(task,model);if(!proof)return null;
    const detail=[proof.total===0?'这里只核对本次记录中空容器的数量、每份0和当前提交；没有自动评价自由解释、独立建模或长期掌握。':'这里只核对本次记录中物品的身份、实际分放和当前提交；没有自动评价自由解释、独立建模或长期掌握。'];
    if(proof.history.resetCount)detail.push(`你重新摆了 ${proof.history.resetCount} 次。下面核对最后一轮的物品；前面的摆放和重新开始记录也已逐条核对。`);
    if(proof.history.failedRequests.length)detail.push(`记录中有 ${proof.history.failedRequests.length} 次请求没有被教具采纳；它们保留在尝试中，没有算作物品移动或增加。`);
    if(attempts.slice(0,-1).some(a=>replayGroupsEvidence(task,a.value)===null))detail.unshift('你修改后又试了一次。');
    if(record.support)detail.push('你看过提示或比较反馈。');
    if(proof.rounds)detail.push(`你实际逐轮分了 ${proof.rounds} 轮，每轮给每份一个；每个物品的去向都已核对。`);
    if(proof.remainder)detail.push(`桌上剩下 ${proof.remainder} 个，比 ${proof.groups} 份少，已经不够每份再分一个。`);
    if(proof.each===0)detail.push(`你实际建立了 ${proof.groups} 份空的容器；每份0个，合在一起仍是0个。`);
    const role=proof.resultRole==='total'?'全部物品的总量':proof.resultRole==='each'?'每份的数量':'份数';
    return {title:'这次作品中的思考线索',
      observation:proof.total===0?`你实际建立了 ${proof.groups} 份空容器，每份0个，合计0个。填写的 ${proof.result} 表示${role}；容器数量、等量关系和算式已分别核对。`:`你${proof.mode==='build'?'实际建立并放入物品':'实际分放原有的物品'}，最后有 ${proof.groups} 份，每份 ${proof.each} 个${proof.remainder?`，桌上剩下 ${proof.remainder} 个`:''}，合计 ${proof.total} 个。每个物品只在一个位置，分放时没有漏算或重复计算。填写的 ${proof.result} 表示${role}；分放、等量关系和算式已分别核对。`,
      connection:proof.mode==='build'?'如果份数不变、每份多一个，总量会怎样改变？每份都是0时又怎样？':'同一个总量，已知份数与已知每份数量时，答案分别在说什么？试着用实际物品说明。',
      detail,method:null};
  }
  if(task?.type==='x-fracorder'){
    const source=fractionOrderBinding(task,context);if(!source)return null;
    const proof=replayFractionOrderEvidence(task,model);if(!proof)return null;
    const sign=proof.direction==='descending'?' ≥ ':' ≤ ',detail=[
      '这里只核对本次记录中的涂份、定位和比较操作；没有自动评价自由解释、独立证明或长期掌握。'
    ];
    if(proof.history.resetCount)detail.push(`你重新摆了 ${proof.history.resetCount} 次；先前预测和操作都保留，下面描述最后一轮的构造。`);
    if(proof.history.failedRequests.length)detail.push(`有 ${proof.history.failedRequests.length} 次请求未改变相应构造；失败请求与后来的有效操作分别核对，没有把它们当成成功定位或改名。`);
    if(proof.history.placementAttempts.some(p=>!p.matchesCard))detail.push('记录中曾试过其他位置；这些尝试与当前核对正确的位置分别保留。');
    if(attempts.slice(0,-1).some(a=>replayFractionOrderEvidence(task,a.value)===null))detail.unshift('你修改后又试了一次。');
    if(record.support)detail.push('你看过提示或比较反馈。');
    if(proof.aligned)detail.push('你实际把原来不一样长的整体对齐，再比较它们表示的量。');
    if(proof.common)detail.push(`你把每个整体分成 ${proof.common.denominator} 个相同的小份，并记录等量的新名字：${proof.common.renames.map(r=>`${r.card} = ${r.name}`).join('；')}。`);
    if(proof.gaps)detail.push(`你分别核对了离1的差：${proof.gaps.map(r=>`${r.card} 还差 ${r.distance}`).join('；')}。`);
    if(proof.benchmarks)detail.push(`你还实际记录了与一半的比较：${proof.benchmarks.map(r=>`${r.card} ${r.relation} 1/2`).join('；')}。在一半的同一边时，只凭这一点还不能决定完整顺序。`);
    return {title:'这次作品中的思考线索',
      observation:`你实际构造并在同一单位的数轴上定位了 ${proof.cards.join('、')}；每个量的涂份和位置已分别核对。当前排出的顺序是 ${proof.ordered.join(sign)}。`,
      connection:'如果两个分数的小份大小不同，怎样换成可以直接比较的表示？试着说明为什么换名字或改变写法不改变原来的量。',
      detail,method:null};
  }
  if(task?.type==='x-routecalc'){
    const source=routeBinding(task,context);if(!source)return null;
    const proof=replayRouteEvidence(task,model);if(!proof)return null;
    const route=proof.display.hops.slice(0,6).map(h=>`${h.from} ${h.delta.startsWith('-')?'− '+h.delta.slice(1):'+ '+h.delta} = ${h.to}`);
    const detail=['这里只核对本次记录中的数轴操作和当前提交；没有自动评价自由解释、独立心算、方法是否最优或长期掌握。'];
    if(proof.failedRequests.length)detail.push(`还保留了 ${proof.failedRequests.length} 次没有走成的跳跃请求；每次仍停在原落点，失败没有被计入步数或路程。后续改正和撤回分别核对。`);
    if(attempts.slice(0,-1).some(a=>replayRouteEvidence(task,a.value)===null))detail.unshift('你修改后又试了一次。');
    if(record.support)detail.push('你看过提示或比较反馈。');
    if(proof.undos)detail.push(`你实际撤回了 ${proof.undos} 步；撤回操作和保留路径已分别核对。`);
    if(proof.compensation)detail.push('保留路径确实先越过目标，随后净返回目标；多走的量与随后净退还的量相等。');
    return {title:'这次作品中的思考线索',
      observation:`你从 ${proof.display.origin} 出发，实际向右走 ${proof.forwardMoves} 次、向左走 ${proof.backwardMoves} 次。保留路径是：${route.join('；')}${proof.hops.length>6?'；其余步骤也已逐条核对':''}。最后到达 ${proof.display.target}。${proof.countup?`两端的差是 ${proof.display.answer}；终点和两端的差已分别核对。`:`所有保留步子的净变化是 ${proof.display.netChange}；起点 ${proof.display.origin} 加上这个净变化，得到填写的结果 ${proof.display.answer}。`}`,
      connection:proof.countup?'如果换成别的步子，两端的位置与它们的差会变吗？试着说明每一步为什么要从上一步的落点出发。':'如果改变步子的大小或拆分方式，怎样确认最后仍到同一个地方？试着说明多走再退还时，哪些量抵消了。',
      detail,method:null};
  }
  if(task?.type==='x-placecalc'){
    const source=placeBinding(task,context);
    if(!source)return null;
    const proof=replayPlaceEvidence(task,model);
    if(!proof)return null;
    const examples=proof.exchanges.slice(0,3).map(e=>
      `${e.from.count} 个 ${proof.scale>1?e.from.unitLabel:e.from.unit} 换成 ${e.to.count} 个 ${proof.scale>1?e.to.unitLabel:e.to.unit}`);
    const detail=['这里只核对本次记录中的数位操作和当前提交；没有自动评价自由解释、独立论证、心算策略或长期掌握。'];
    if(proof.failedActions)detail.push(`保留的记录中还有 ${proof.failedActions} 次未能开始、交换或拿走的请求；这些没有算作成功操作，最初猜想仍保留。`);
    if(attempts.slice(0,-1).some(a=>replayPlaceEvidence(task,a.value)===null))detail.unshift('你修改后又试了一次。');
    if(record.support)detail.push('你看过提示或比较反馈。');
    if(task.written)detail.push('对应数位上写下的数字与最后各列留下的数量相符。');
    return {title:'这次作品中的思考线索',
      observation:`你实际向高位合并 ${proof.up} 次、向低位拆开 ${proof.down} 次：${examples.join('；')}${proof.exchanges.length>3?'；其余交换也已逐条核对':''}。每次交换前后数量守恒。${proof.operation==='-'?`从 ${proof.display.values[0]} 中实际拿走 ${proof.display.removed}，`:`合并的数量是 ${proof.display.values.join(' + ')}，`}最后各列与填写的结果 ${proof.display.total} 相符。`,
      connection:'如果改变交换或拿走的先后顺序，哪些条件仍要满足？试着说明为什么十个小单位和一个相邻的大单位表示同一个量。',
      detail,method:null};
  }
  const groupedSource=task?.type==='x-unitwalk'?groupwalkBinding(task,context):null;
  if(groupedSource){
    const proof=replayGroupwalkEvidence(task,model);if(!proof)return null;
    const name=pair=>pair.join('/'),detail=[
      '这里只核对本次记录中的成组移动和当前提交；没有自动评价自由解释、独立论证、情境建模能力或长期掌握。',
      `最后位置含 ${proof.whole} 个完整的1，零头是 ${name(proof.remainder)}。`,
      `乘法记录核对的是每组 ${name(proof.group)}、共 ${proof.groups} 组，得到 ${name(proof.end)}；题目的组数与来回探索的前进次数分别计算。`
    ];
    if(proof.history.epochs.length>2||proof.history.epochs[0].steps.length)detail.push('先前的等分、来回探索与重新开始都保留；下面只计算最后一次等分后的移动次数，各轮使用的小份分别核对。');
    if(proof.history.failedRequests.length)detail.push(`有 ${proof.history.failedRequests.length} 次分份请求未被采纳，没有改变当时的小份。`);
    if(proof.history.ineffectiveRequests.length)detail.push(`有 ${proof.history.ineffectiveRequests.length} 次边界处的请求没有移动位置，已保留但未算作前进或后退。`);
    if(attempts.slice(0,-1).some(a=>replayGroupwalkEvidence(task,a.value)===null))detail.unshift('你修改后又试了一次。');
    if(record.support)detail.push('你看过提示或比较反馈。');
    if(proof.bounds)detail.push(`你核对了最后位置左右相邻的整数 ${proof.bounds[0]} 和 ${proof.bounds[1]}。`);
    if(proof.purchase!==null)detail.push(`按整个购买时，至少需要 ${proof.purchase} 个；购买个数与实际用量分别核对。`);
    return {title:'这次作品中的思考线索',
      observation:`你把0到1分成 ${task.d} 个等长间隔，每一小份是 ${name(proof.unit)}。实际整组前进 ${proof.advances} 次，每次接上 ${task.chunk} 小份（${name(proof.group)}）；退回 ${proof.retreats} 小份，每次只退 ${name(proof.unit)}。每次位置变化已逐条核对，最后到达 ${name(proof.end)}。`,
      connection:'如果多接一组，要退回几小份才能回到原来的位置？每组的量和组数怎样一起决定总量？',
      detail,method:null};
  }
  if(task?.type==='x-unitwalk'){
    const source=unitwalkBinding(task,context);
    if(!source)return null;
    const proof=replayUnitwalkEvidence(task,model);
    if(!proof)return null;
    const name=r=>r.join('/'),detail=[
      '这里只核对本次记录中的逐步移动和当前提交；没有自动评价自由解释、独立论证、表示转换能力或长期掌握。'
    ];
    if(proof.history.epochs.length>2||proof.history.epochs[0].steps.length)detail.push('先前的等分、来回探索与重新开始都保留；下面只计算最后一次等分后的移动次数，各轮使用的小份分别核对。');
    if(proof.history.failedRequests.length)detail.push(`有 ${proof.history.failedRequests.length} 次分份请求未被采纳，没有改变当时的小份。`);
    if(proof.history.ineffectiveRequests.length)detail.push(`有 ${proof.history.ineffectiveRequests.length} 次边界处的请求没有移动位置，已保留但未算作前进或后退。`);
    if(attempts.slice(0,-1).some(a=>replayUnitwalkEvidence(task,a.value)===null))detail.unshift('你修改后又试了一次。');
    if(record.support)detail.push('你看过提示或比较反馈。');
    if(task.copies)detail.push(`你填写的加法包含 ${task.n} 个 ${name(proof.unit)}，与最后位置相符。`);
    if(task.whole)detail.push(`最后位置含 ${proof.whole} 个完整的1，零头是 ${name(proof.remainder)}。`);
    if(proof.decimal)detail.push(`填写的 ${proof.decimal} 与最后位置表示同一个量；这只核对了本次对应关系。`);
    if(proof.bounds)detail.push(`你核对了相邻整数 ${proof.bounds[0]} 和 ${proof.bounds[1]}${task.halfBound?'，最后位置在1/2的左边':''}。`);
    return {title:'这次作品中的思考线索',
      observation:`你把0到1分成 ${task.d} 个等长间隔，每一小步是 ${name(proof.unit)}。从0出发，实际前进 ${proof.advances} 次、后退 ${proof.retreats} 次；每一步的位置变化已逐条核对，最后到达 ${name(proof.end)}。`,
      connection:'如果先多走一小步，再退回一小步，位置会怎样？换一种等分时，同样的步数还表示同一个量吗？',
      detail,method:source.method};
  }
  // A checked representation can be described without claiming the child has
  // independently explained the equivalence or mastered a thinking ability.
  if(task?.type==='grid'){
    if(!validTask(task,model)||!inspectTask(task,model).correct)return null;
    const method=task.reverse?
      {nodeId:'mt_CUmjcE7W6c',label:'连接分数、小数与百分数的表示',code:'ccss-math:MP.2'}:
      {nodeId:'mt_EBYGhd8X3x',label:'连接不同表示方式',code:'ccss-math:MP.2'};
    const count=model.selected.length;
    return {
      title:'这次作品中的思考线索',
      observation:`你提交的百格涂了 ${count} 格，并写出小数 ${model.decimal}；检查显示它们表示同一个量。`,
      connection:'试着用自己的话说明：为什么换了表示方法，量没有变？你可以再用另一个分数试一试。',
      detail:['这里只确认当前作品的对应关系；没有自动判断你的自由解释，也不代表已经掌握这种思考方法。'],
      method
    };
  }
  if(task?.type==='x-fracrename'){
    const source=fractionBinding(task,context);
    if(!source)return null;
    const proof=replayFractionEvidence(task,model);
    if(!proof)return null;
    const name=r=>r.join('/');
    const changes=proof.transformations.slice(0,3).map(s=>
      `${name(s.from)} → ${name(s.to)}（${s.action==='split'?'每份再分'+s.factor+'份':'每'+s.factor+'份合成1份'}）`);
    const actions=[proof.splits?`细分 ${proof.splits} 次`:null,proof.merges?`合并 ${proof.merges} 次`:null].filter(Boolean).join('、');
    const names=proof.saved.slice(0,6).map(name).join('、')+(proof.saved.length>6?`等 ${proof.saved.length} 个名字`:'');
    const detail=['这里只核对本次分数操作和当前提交；没有自动评价自由解释、一般证明或长期掌握。'];
    if(proof.history.resetCount)detail.push(`你重新摆了 ${proof.history.resetCount} 次；前面的尝试保留，下面描述最后一轮留下的分法和名字。`);
    if(proof.history.failedRequests.length)detail.push(`记录中有 ${proof.history.failedRequests.length} 次请求未被采纳；这些尝试没有算作成功细分、合并或新名字。`);
    if(attempts.slice(0,-1).some(a=>a?.value&&replayFractionEvidence(task,a.value)===null))detail.unshift('你修改后又试了一次。');
    if(record.support)detail.push('你看过提示或比较反馈。');
    if(proof.rewinds)detail.push(`你还实际回到原分法 ${proof.rewinds} 次。`);
    if(proof.addition)detail.push(`上下各加1得到 ${name(proof.addition.to)}，核对显示${proof.addition.relation==='same'?'这次仍与原量相同':'它与原量不同'}。`);
    if(proof.decimalStart)detail.push(`你核对了 ${proof.decimalStart} 与 ${name(proof.start)} 的对应关系；这里没有判断你是否独立解释了小数转换。`);
    else if(proof.decimal)detail.push(`填写的小数 ${proof.decimal} 也与原量相等；只填对小数不能代替上面的分数操作。`);
    return {title:'这次作品中的思考线索',
      observation:`你从 ${name(proof.start)} 出发，实际${actions}：${changes.join('；')}${proof.transformations.length>3?'；其余步骤也已逐条核对':''}。记下的 ${names} 与原分数表示同一个量。`,
      connection:'比较分数时，这些不同的名字能帮你做什么？试着说明为什么分法变了，整体和选中的量都没有变。',
      detail,method:null};
  }
  const arraySource=arrayBinding(task,context);
  if(arraySource){
    const proof=replayArrayEvidence(task,model);
    if(!proof)return null;
    let observation=`你实际摆出了 ${proof.rows} 行、每行 ${proof.cols} 格；每格代表 ${proof.unit}，这幅阵列共表示 ${proof.total}。`;
    if(proof.turned)observation+=`你实际转向后看到了 ${proof.currentRows} 行、每行 ${proof.currentCols} 格，总量仍是 ${proof.total}。`;
    if(proof.cut!==null)observation+=`你实际在第 ${proof.cut} 列后切开，核对得到左边 ${proof.left}、右边 ${proof.right}，合起来仍是 ${proof.total}。`;
    const detail=['这里只检查本次阵列、实际操作和当前提交；不能据此判断独立解释、一般证明、归纳能力或长期掌握。'];
    if(proof.failedActions)detail.push(`保留的记录中有 ${proof.failedActions} 次摆放或切分请求没有改变阵列，随后保留的构造已逐步核对。`);
    if(proof.shapes>1||proof.turns>1||proof.cuts>1)detail.push(`保留的探索包含 ${proof.shapes} 次摆放、${proof.turns} 次转向和 ${proof.cuts} 次切分；上面描述的是最后保留的阵列。`);
    if(proof.confirmations.length)detail.push(`还有 ${proof.confirmations.length} 次确认了相同的阵列或切线，画面中的构造没有改变，没有算作新的摆放或切分。`);
    if(proof.retainedPrediction&&proof.retainedPrediction!=='same')detail.push(`最初保留的转向猜想是“${proof.retainedPrediction==='more'?'变多':'变少'}”；实际转向前后格数相等，没有把这个猜想说成正确推理。`);
    if(proof.unknown)detail.push(`题目中的未知量是${{a:'份数',b:'每份的量',p:'总量'}[proof.unknown.kind]}，你填写的 ${proof.unknown.value}${proof.unknown.original?' 已代回原来的 '+proof.unknown.original+' 核对':' 与阵列对应'}。`);
    if(proof.addition)detail.push(`你按当前的 ${proof.addition.length} 行写出连加，每一项是 ${proof.addition[0]}，合计 ${proof.total}。`);
    if(proof.reversedEquation)detail.push('你把总量写在等号左边，等号两边仍与这幅阵列对应。');
    if(proof.approximate){
      // The only reviewed estimate is tensproducts[3], whose given box amount
      // is approximate. Exact model arithmetic does not measure its real boxes.
      observation=`你按题目中“每箱大约200个”摆出 ${proof.rows} 行、每行 ${proof.cols} 格，每格代表 ${proof.unit}；估算模型表示 ${proof.total}，所以5箱大约有 ${proof.total} 个。`;
      detail.push('题目给出的每箱数量本来就是估计；这里只核对估算阵列和 ≈ 关系，没有验证实际箱子的精确总数。');
    }
    return {title:'这次作品中的思考线索',observation,
      connection:proof.approximate?'如果每箱实际数量比估计多一点或少一点，实际总量会怎样？为什么这里要保留“大约”？':
        proof.cut!==null?'为什么左右两边都保留了同样的行数？试着把等式说给别人听。':
        proof.turned?'转向只换了行和列，为什么格子总数没有变化？':'如果每格代表的数量再变化，这幅阵列又会表示多少？',
      detail,method:arraySource.method};
  }
  const lineSource=lineBinding(task,context);
  if(lineSource){
    const proof=replayLineEvidence(task,model);
    if(!proof)return null;
    const pair=x=>`边${x.first+1}与边${x.second+1}`;
    const relations=proof.tests.map(x=>pair(x)+(x.parallel?'的所在直线平行':x.perpendicular?'的所在直线垂直':'的所在直线既不平行也不垂直'));
    const detail=['这里只核对本题屏幕上实际选出的边与当前提交；不能推断独立解释、一般证明或长期掌握。'];
    if(proof.failedComparisons)detail.push(`保留的记录中有 ${proof.failedComparisons} 次尚未选出两条不同边的请求，这些没有算作边之间的比较。`);
    if(proof.repeatedComparisons)detail.push(`其中 ${proof.repeatedComparisons} 次重新比较了已选过的一对边；重复检查没有算作新的边对。`);
    if(attempts.slice(0,-1).some(a=>a.value&&replayLineEvidence(task,a.value)===null))detail.unshift('你修改后又试了一次。');
    if(record.support)detail.push('你看过提示或比较反馈。');
    return {title:'这次作品中的思考线索',
      observation:`你实际检查了 ${proof.tests.length} 次边之间的关系：${relations.join('；')}。`,
      connection:'转动整个图形后，哪些关系没有变？试着说明你会怎样检查。',
      detail,method:lineSource.method||null};
  }
  const counterexampleSource=counterexampleBinding(task,context);
  if(counterexampleSource){
    const proof=replayCounterexampleEvidence(task,model);
    if(!proof)return null;
    const comparison={less:'比原来的数更小',equal:'与原来的数一样大',greater:'比原来的数更大'}[proof.actual];
    const detail=['这里只核查本次确实执行且经检查的有理数比较；不评价独立论证、一般证明或学习迁移。'];
    if(proof.failedRequests)detail.push(`保留的记录中有 ${proof.failedRequests} 次输入或选择未完成的请求，没有生成乘法比较。`);
    if(proof.wrongPredictions)detail.push(`实际比较中有 ${proof.wrongPredictions} 次猜想与结果不符；最初猜想仍保留，只有最后保留的正确比较用于核对反例。`);
    return {
      title:'这次作品中的思考线索',
      observation:`你实际检验了 ${proof.comparisons} 次乘法比较；最后一次 ${proof.value} × ${proof.factor} 的结果${comparison}，与题目中的“${proof.rule==='strict'?'总会变大':'总不会变小'}”说法矛盾。`,
      connection:'一个符合条件的反例可以推翻“总是”的说法。改变乘数或者命题，再试一次，结果还矛盾吗？',
      detail,
      method:{nodeId:counterexampleSource.nodeId,label:'构建数学论证',code:'ccss-math:MP.3'}
    };
  }
  const sequenceSource=sequenceBinding(task,context);
  const verifiedSequence=!!sequenceSource;
  const verifiedChain=task.type==='x-r38-chain'&&VERIFIED_REASONING[context.sessionId]?.includes(context.index);
  const handler=verifiedSequence?patterns34:verifiedChain?arguments38:null;
  if(!handler||!handler.valid(task,model)||!handler.inspect(task,model).correct)return null;
  const detail=[];
  if(attempts.slice(0,-1).some(a=>handler.valid(task,a.value)&&!handler.inspect(task,a.value).correct))detail.push('你修改后又试了一次。');
  if(record.support)detail.push('你看过提示或比较反馈。');
  if(verifiedSequence){
    const proof=replaySequenceEvidence(task,model);
    if(!proof)return null;
    const increment=task.step/proof.scale;
    const move=task.op==='add'?(increment>=0?'加'+increment:'减'+Math.abs(increment)):
      task.op==='multiply'?'按乘'+task.step+'的规则':task.op==='affine'?'按乘'+task.a+'再加'+task.b+'的规则':'按位置规则';
    const steps=proof.advances+' 次'+move;
    const undo=proof.undos?'，其中还实际撤回了 '+proof.undos+' 次':'';
    const checked=(task.questions||[]).map((question,index)=>question.kind==='number'?
      `核对了“${question.label}”：${model.answers[index]}`:
      `“${question.label}”的回答符合题目条件`).join('；')||'当前数列符合题目条件';
    detail.push('这里只核对可重放的逐项操作与当前答案；不能据此判断独立归纳、一般证明、自由解释或长期掌握。');
    if(proof.failedSteps)detail.push(`保留的记录中有 ${proof.failedSteps} 次输入没有接上数列；这些没有算作前进，最初输入仍保留。`);
    if(proof.noOpUndos)detail.push(`还有 ${proof.noOpUndos} 次在起点请求退回，没有拿掉任何一项。`);
    return {title:'这次作品中的思考线索',
      observation:'你从'+proof.displayValues[0]+'出发，实际留下了 '+proof.displayValues.join('、')+
        '，逐步做了 '+steps+undo+'，并在本次检查中'+checked+'。',
      connection:task.op==='add'?'换个起点后，相邻两项仍怎样变化？你能说明为什么吗？':
        '换一个起点或运算规则，这些步骤还能照搬吗？你会先检查哪一步？',
      detail,
      method:sequenceSource.method
    };
  }
  if(task.type==='x-r38-chain'){
    // These are replay-verified card selections / model actions, not a graded
    // spoken argument. A correct ordered path alone does not prove reasoning.
    const hasError=Array.isArray(task.lines)&&typeof task.error==='string';
    const selected=model.board.selected.length;
    const mistaken=hasError?task.lines.find(line=>line.id===model.board.marked)?.text:null;
    const actions=task.scene==='exchange'?'，并把一捆十拆成十个一':
      task.scene==='array'?'，还从十列中移走了两列':'';
    const observation=`这次提交按顺序摆出了 ${selected} 个推理步骤${mistaken?`，标记“${mistaken}”为需要修正的一步`:''}${actions}；检查核对了当前步骤与题目条件的对应关系。`;
    detail.push('步骤卡和教具操作能够复核；你的自由文字或口头解释尚未自动判断。');
    return {
      title:'你刚才的办法',observation,
      connection:hasError?'试着说明：标记的那一步为什么不成立？怎样从前面的事实修正？':'试着说说：每一步依据哪个已知条件，为什么下一步能够成立？',
      detail,
      method:hasError?
        {nodeId:'mt_pyMD_SIiYO',label:'说明推理的依据 · 跟随推理并找错',code:'ccss-math:MP.3'}:
        {nodeId:'mt_nyK25mNOeR',label:'展示解题过程',code:'ccss-math:MP.3'}
    };
  }
  const last=model.board.records.at(-1),comparison={less:'比原来的数更小',equal:'与原来的数一样大',greater:'比原来的数更大'}[last.actual],claim=task.rule==='strict'?'总会变大':'总不会变小';
  if(!comparison||!last.match||!last.breaks||!['strict','nonstrict'].includes(task.rule))return null;
  if(model.board.records.length>1)detail.push(`你一共试了 ${model.board.records.length} 次比较。`);
  return {title:'你刚才的办法',observation:`你试了 ${last.value} × ${last.factor}，结果${comparison}，与“${claim}”不一致。`,connection:'用一个反例可以检验这样的“总是”说法；说法改变后，需要重新检验。',detail,
    method:{nodeId:'mt_j5YqQnN6xe',label:'构建数学论证',code:'ccss-math:MP.3'}};
}
