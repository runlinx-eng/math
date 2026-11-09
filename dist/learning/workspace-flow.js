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

// Follow only configured, ordered route lessons; a completed lesson is not
// presented as a new next step. This does not invent a knowledge relationship.
export function nextRouteLessonId(route,currentId,isCompleted=()=>false){
  const ids=route?.ids||[],index=ids.indexOf(currentId);
  if(index<0)return null;
  return ids.slice(index+1).find(id=>!isCompleted(id))||null;
}

export function stageGuidance(stage,{hasNext=true,hasFollowingLesson=false}={}){
  switch(stage){
    case 'revise':return '这次检查还没有通过。对照提示修改作品，再检查一次；以前的尝试会保留。';
    case 'recheck':return '作品已经改动，之前的检查结果不代表现在的作品。请重新检查。';
    case 'passed':return hasNext?'本题通过检查。想想为什么成立，再进入下一题。':'本题通过检查。想想为什么成立，再整理这次发现。';
    case 'reflect':return hasFollowingLesson?'发现可以保存（可选）；保存后直接学习下一处，或返回原知识空间。':'发现可以保存（可选）；保存后返回原知识空间继续探索。';
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
