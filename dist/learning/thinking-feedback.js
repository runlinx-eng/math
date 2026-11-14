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
import {storyLedgerBinding,replayStoryLedgerEvidence} from './storyledger-evidence.js';
import {joinStoryBinding,replayJoinStoryEvidence} from './joinstory-evidence.js';
import {transformBinding,replayTransformEvidence} from './transform-evidence.js';
import {groupsBinding,replayGroupsEvidence} from './groups-evidence.js';
import {fractionOrderBinding,replayFractionOrderEvidence} from './fraction-order-evidence.js';
import {isEvidenceContext,latestSubmissionMatches} from './evidence-contract.js';

// Prompts are reviewed native positions, never inferred from a widget type.
export function thinkingGuide(task,context={}){
  if(!isEvidenceContext(context))return null;
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
