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
import {isEvidenceContext,latestSubmissionMatches} from './evidence-contract.js';

// Prompts are reviewed native positions, never inferred from a widget type.
export function thinkingGuide(task,context={}){
  if(!isEvidenceContext(context))return null;
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
