// P7-D1/D2: a single presentation contract for all existing activity runners.
// All stages are derived from the validated record and currentSubmission;
// this module never changes judging rules, completion or persisted schemas.
export function learningStage(record,checked){
  if(record?.view==='summary')return 'reflect';
  if(checked?.status==='correct')return 'passed';
  if(checked?.status==='revise')return 'revise';
  if(checked?.status==='modified')return 'recheck';
  return 'explore';
}


// One presentational learning sequence; mathematical activities retain their
// individual operations and original judging rules. These are not mode gates.
export const LEARNING_STEPS=Object.freeze([
  {id:'explore',label:'① 探索与操作'},
  {id:'check',label:'② 检查与修改'},
  {id:'reflect',label:'③ 发现与继续'}
]);

// Primary actions are derived from the current verified workpiece, not from
// which panel was last opened. A destination must be supplied by the caller
// from a configured route, source-backed bridge or the existing back path.
export function learningActionPlan({
  stage='explore',hasNextTask=false,p03=false,readyToCheck=true,
  hasDraft=false,destination=null
}={}){
  if(stage==='reflect'){
    const next=destination||{action:'back',label:'返回知识空间 →'};
    return {
      step:'reflect',
      primary:hasDraft?{action:'save-note',label:'保存我的发现'}:next,
      destination:next,
      hasDraft,
      secondary:hasDraft?[next]:[]
    };
  }
  if(stage==='passed'){
    return {
      step:'check',
      primary:{action:'next',label:hasNextTask?'进入下一题 →':p03?'完成三题，看看发现 →':'整理这次发现 →'},
      secondary:[{action:'check',label:'再检查一次'},...(p03?[]:[{action:'hint',label:'给一点帮助'}])]
    };
  }
  const isCorrection=stage==='revise'||stage==='recheck';
  return {
    step:isCorrection?'check':'explore',
    primary:{
      action:'check',
      label:stage==='recheck'?'重新检查':stage==='revise'?'修改后重新检查':p03?'检查本题':'检查我的作品',
      disabled:!readyToCheck
    },
    secondary:[{action:'hint',label:p03?'需要提示':'给一点帮助'}]
  };
}

// Follow only configured, ordered route lessons; a completed lesson is not
// presented as a new next step. This does not invent a knowledge relationship.
export function nextRouteLessonId(route,currentId,isCompleted=()=>false){
  const ids=route?.ids||[],index=ids.indexOf(currentId);
  if(index<0)return null;
  return ids.slice(index+1).find(id=>!isCompleted(id))||null;
}

export function stageGuidance(stage,{hasNext=true,hasFollowingLesson=false,hasRelatedPractice=false}={}){
  switch(stage){
    case 'revise':return '这次检查还没有通过。对照提示修改作品，再检查一次；以前的尝试会保留。';
    case 'recheck':return '作品已经改动，之前的检查结果不代表现在的作品。请重新检查。';
    case 'passed':return hasNext?'本题通过检查。想想为什么成立，再进入下一题。':'本题通过检查。想想为什么成立，再整理这次发现。';
    case 'reflect':return hasFollowingLesson?'发现可以保存（可选）；保存后直接学习下一处，或返回原知识空间。':hasRelatedPractice?'本组任务已完成。发现可以保存，也可以直接尝试一项真实关联练习；不写文字也能继续。':'本组任务已完成。发现可以保存（可选），或返回原知识空间选择下一处。';
    default:return '可以直接动手尝试；只有点击检查才会产生一条提交记录。';
  }
}

// P7: next-step help describes the current checked construction, rather
// than sending a learner through more navigation. It is not a second grader.
export function correctionGuidance({task,model,checked}={}){
 if(checked?.status!=='revise'||task?.type!=='grid'||!Array.isArray(model?.selected))return null;
 const whole=100,selected=model.selected.length,target=task.n+'/'+task.d,
       expected=task.n*whole/task.d;
 if(selected!==expected){
  return {title:'接下来先改涂色',
    observation:`你现在涂了 ${selected} 格（${selected}/100），题目要求表示 ${target}。`,
    action:`先把 100 格平均分成 ${task.d} 份，想一想取 ${task.n} 份该涂多少格；调整涂色，核对小数，再点击「检查我的作品」。`,
    method:'可以试试「连接不同表示方式」：用百格、分数和小数相互核对。这里只是在建议方法，不是在评价你是否掌握。'};
 }
 const actual=String(model.decimal??'').trim();
 const actualNumber=actual?Number(actual):NaN;
 if(!Number.isFinite(actualNumber)||Math.abs(actualNumber-task.n/task.d)>1e-9)
  return {title:'接下来核对小数',
    observation:`涂色格数已经与 ${target} 对应，但填写的小数「${actual||'空白'}」还没有表示相同的量。`,
    action:'每格表示 0.01，十格表示 0.1。根据涂色数修改小数，再点击「检查我的作品」。',
    method:'可以试试「连接不同表示方式」：数一数格子，再核对小数名字。'};
 if(task.reverse)return {title:'接下来核对百分数',
    observation:'百格和小数已经对应；还需要核对「百分之几」的写法。',
    action:'想想涂色占一百格中的几格，在百分数一栏填写百分号前面的数量，再点击「检查我的作品」。',
    method:'可以试试把同一个量的图形、分数、小数与百分数放在一起比较。'};
 return null;
}

// Checked examples can explain a mathematical relationship without inferring
// that the child independently understood, proved or mastered the method.
// The model is the submitted snapshot, never unsaved live edits.
export function checkedMathExplanation({id,task,model,checked}){
  if(!task||!model)return null;
  // Match activities join a concrete picture, a named fraction and a decimal.
  // Describe only the submitted work after the original grader accepts it.
  if(id==='quarters'&&task.type==='match'&&checked?.status==='correct'){
    const fractions=task.fractions;
    if(!Array.isArray(fractions)||!Array.isArray(model.names)||model.names.length!==fractions.length)return null;
    const pairs=fractions.map(([n,d],i)=>{
      if(!Number.isFinite(n)||!Number.isFinite(d)||d===0)return null;
      const count=n*100/d,parts=Number.isInteger(count)?' = '+count+'/100':'';
      return n+'/'+d+parts+' = '+String(model.names[i]).trim();
    });
    if(pairs.some(x=>x===null))return null;
    return {
      kind:'correct',title:'分数与小数为什么对得上',
      equation:pairs.join('；'),
      explanation:'把同样大小的一满杯看作 1，分数说的是把一杯平均分成几份、取其中几份；小数说的是占一杯的多少。每杯的水位、分数和小数表示的是同一杯中的同一个量，并不是三杯水都一样多。',
      question:'任选一杯，用自己的话说说它为什么可以换一种名字；如果杯子变大，分数与小数的关系会改变吗？',
      method:{nodeId:'mt_EBYGhd8X3x',label:'连接不同表示方式',code:'ccss-math:MP.2'}
    };
  }
  if(id!=='equivalent')return null;
  if(checked?.status==='correct'){
    if(task.type==='equivalent'){
      const names=model.rows.map(r=>r.n+'/'+r.d).join(' = ');
      return {kind:'correct',title:'这次为什么成立',
        equation:names+' = '+task.n+'/'+task.d,
        explanation:'每条纸带表示同一个整体。分得越细，每一小份越短；要表示相同的涂色长度，取的小份数也要相应增加。',
        question:'你能自己说说，什么改变了，什么没有变吗？'};
    }
    if(task.type==='line'){
      const target=task.n+'/'+task.d,current=model.mark+'/'+task.den;
      return {kind:'correct',title:'这两个分数为什么在同一点',
        equation:target+' = '+current,
        explanation:'上下数轴的 0 和 1 相同，表示同一个单位长度。虽然分成的份数不同，两个标记到 0 的距离占整个长度的比例相同。',
        question:'把一份再细分后，为什么必须同时改变所取的小份数？'};
    }
  }
  if(checked?.status==='revise'&&task.type==='equivalent'){
    const wrong=model.rows.map((r,i)=>r.n*task.d!==task.n*r.d?i+1:null).filter(Boolean);
    if(!wrong.length)return null;
    return {kind:'revise',title:'可以检查哪里',
      equation:'目标是 '+task.n+'/'+task.d,
      explanation:'第 '+wrong.join('、')+' 条纸带的涂色长度还没有对齐。先确认每条纸带都表示同一个整体，再比较涂色的末端。',
      question:'调整这些纸带，再检查。'};
  }
  if(checked?.status==='revise'&&task.type==='line'){
    return {kind:'revise',title:'再比较同一个整体',
      equation:'目标 '+task.n+'/'+task.d+'；当前标记 '+model.mark+'/'+task.den,
      explanation:'上下数轴都从 0 到 1。请比较两个标记相对于整条数轴的位置，而不是只比较分子。',
      question:'移动标记，再检查。'};
  }
  return null;
}


// P7-D7: task-aware presentation, not a second grader or persisted progress.
// A gate is added only for original, replayable model fields and native controls.
// The all-types inventory distinguishes verified gates from safe fallback.
export const VERIFIED_STUDY_GATES=Object.freeze([
 'x-wideshift','x-pvshift','x-parityjoin','x-r38-chain',
 'x-r38-counterexample','x-g27-build','x-g27-net','x-g27-sort',
 'x-g27-face','x-g27-cut','x-r37-pair','x-r37-shape'
]);
export function taskInteractionContract(task,{bridge=false}={}){
 const type=task?.type||'';
 const gated=VERIFIED_STUDY_GATES.includes(type);
 let family='原生操作与检查';
 if(bridge)family='真实知识联合任务';
 else if(['equivalent','partition','grid','fill','cube-plan','unit','decompose','irregular','x-g27-build'].includes(type))family='构造与直接操作';
 else if(['x-wideshift','x-pvshift','x-parityjoin'].includes(type))family='猜想后操作';
 else if(['x-r38-counterexample','x-g27-cut','x-g27-net'].includes(type))family='数学实验与反例';
 else if(['x-r38-chain','x-r37-steps'].includes(type))family='推理与论证';
 else if(['line','match','chart','compare','survey'].includes(type)||/measure|ruler|scale|unit|decimal|convert|capacity|length/.test(type))family='测量、计算与记录';
 else if(/solid|shape|geom|g27|net|cube|angle|polygon|coordinate/.test(type))family='几何与空间';
 else if(/pattern|grow|ratio|sequence|factor|r37|counter|rule/.test(type))family='规律、模型与反例';
 else if(/words|explain|story|reason|writing|sentence|r38/.test(type))family='文字解释与推理';
 return {type,family,checkReadiness:gated?'基于原生模型状态':'沿用原检查路径',nativeGrader:true,bridge:!!bridge};
}
const waiting=(cue,selector=null)=>selector
 ?{kind:'widget',selector,readyToCheck:false,cue}
 :{kind:'work',readyToCheck:false,cue};
// Only the task's own model can establish that a prediction, experiment,
// construction or argument was attempted. Empty text is never an accepted proof.
export function studyActionFocus({stage='explore',task=null,model=null,p03Ready=true}={}){
 if(stage==='passed'||stage==='reflect')return {kind:'continue',readyToCheck:true,cue:null};
 if(!p03Ready)return {kind:'check',readyToCheck:false,cue:null};
 const type=task?.type,board=model?.board;
 if(type==='x-wideshift'){
  if(model?.committed===null)return waiting('先写下猜想，用教具内的按钮确认。','[data-x="wide-predict"]');
  const moves=task.mode==='add'?model?.moves:model?.trace;
  if(Array.isArray(moves)&&moves.length===0)return waiting('猜想已经留下；用数位教具移动数字，再检查。');
 }
 if(type==='x-pvshift'){
  if(model?.committed===null)return waiting('先留下猜想，再进行数位添取或交换。','[data-x="pv-predict"]');
  if(Array.isArray(model?.moves)&&model.moves.length===0)return waiting('先在教具中添取或交换，形成可检查的作品。');
 }
 if(type==='x-parityjoin'&&board&&Object.hasOwn(board,'first')){
  if(!board.first)return waiting('选出猜想后，使用教具中的按钮展开配对。','[data-x="b14-predict"]');
  if(!board.joined)return waiting('猜想已留下；亲手把物品配成一对一对。','[data-x="b14-join"]');
 }
 if(type==='x-r38-counterexample'&&Array.isArray(board?.records)){
  const last=board.records.at(-1);
  if(!last||last.value!==model.value||last.factor!==model.second||last.prediction!==model.choice)
   return waiting('写出例子与猜测，按「试一试」观察比较结果；之后检查反例。','[data-x="r38-test"]');
 }
 if(type==='x-r38-chain'&&Array.isArray(board?.selected)&&board.selected.length===0)
  return waiting('在教具中选取能支持结论的推理卡，排好顺序，再检查。');
 if(type==='x-g27-build'&&Array.isArray(board?.parts)&&Array.isArray(task?.target)&&board.parts.length<task.target.length)
  return waiting('先从下往上搭出要求数量的立体块；可以转动观察。');
 if(type==='x-g27-net'&&Array.isArray(board?.parts)){
  if(board.parts.length<4)return waiting('先接上展开图需要的纸片。');
  if(board.prediction===null)return waiting('纸片已接好。选择是否能够折成盒子的猜想。');
  if(board.fold<100)return waiting('慢慢折合，或使用教具内的「直接折合」按钮。','[data-x="g27-fold"]');
 }
 if(['x-g27-sort','x-g27-face'].includes(type)&&Array.isArray(board?.choices)&&board.choices.every(v=>v===null))
  return waiting('先观察模型，选择它的性质；有需要时转动或点亮表面。');
 if(type==='x-g27-cut'&&Array.isArray(board?.predictions)&&board.predictions.every(v=>v===null))
  return waiting('先猜截面的形状或大小，再移动切面观察。');
 if(['x-r37-pair','x-r37-shape'].includes(type)&&Array.isArray(board?.records)){
  const last=board.records.at(-1);
  if(!last)return waiting('先在教具里摆出关系，并用原有的保存操作留下比较记录。');
  const stale=type==='x-r37-pair'
   ?(!board.preview||JSON.stringify(last.pair)!==JSON.stringify(board.preview)||last.guess!==model.choice)
   :(last.factor!==board.factor||last.width!==model.value||last.height!==model.second);
  if(stale)return waiting('当前数值或关系已改变。先用教具重新留下实验记录，再检查。');
 }
 return {kind:'check',readyToCheck:true,cue:null};
}

// P7-D4: task-type adapters only describe the already-configured widget.
// No new task, proof, assessment, persistence field or progression step.
export function executionCue({stage='explore',task=null,bridge=false,hasDraft=false,readyToCheck=true,repair=null}={}){
 if(stage==='reflect')return hasDraft?'文字草稿已保留。可以先保存发现，也可以直接继续。':'本组操作已通过检查。可以写下自己的发现，也可以直接继续。';
 if(stage==='passed')return '这件作品已通过检查。可以进入下一题，或整理这次发现。';
 if(stage==='recheck')return '作品已经修改。原检查结果不再适用，请重新检查。';
 if(stage==='revise')return repair?.action||'对照下方反馈修改作品，再重新检查；原尝试会保留。';
 if(!readyToCheck)return '先完成下方需要的选择、操作或填写，准备好后再检查。';
 switch(task?.type){
  case 'partition':return '拖动分界并选出需要的部分，再检查自己的构造。';
  case 'equivalent':return '调整纸带上涂色的部分，比较各条纸带，再检查。';
  case 'line':return '移动数轴上的标记，比较它们的位置，再检查。';
  case 'grid':return '在百格中涂色并填写相应的表示，再检查。';
  case 'match':return '调整每个杯子的水位和写法，再检查它们是否对应。';
  case 'x-r38-counterexample':return '在下方尝试能否找到反例，再检查你构造的证据。';
  case 'x-r38-chain':return '在下方连接你的推理步骤，再检查证据。';
  default:return bridge?'用下方实际配置的教具完成这条知识联系中的任务，再检查。':'按当前问题在下方直接操作、观察或填写，完成后检查。';
 }
}
export function activityTitle({stage='explore',task=null,bridge=false}={}){
 if(stage==='reflect')return '我的发现（可选）';
 if(bridge)return '关联知识的数学操作';
 if(task?.type==='x-r38-counterexample')return '寻找反例与证据';
 if(task?.type==='x-r38-chain')return '连接推理';
 if(task?.type==='line')return '在数轴上操作';
 if(task?.type==='grid')return '在百格上操作';
 if(task?.type==='match')return '比较与匹配';
 if(task?.type==='equivalent'||task?.type==='partition')return '构造与比较';
 return '数学操作与作品';
}
