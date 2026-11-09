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

export function stageGuidance(stage,{hasNext=true}={}){
  switch(stage){
    case 'revise':return '这次检查还没有通过。对照提示修改作品，再检查一次；以前的尝试会保留。';
    case 'recheck':return '作品已经改动，之前的检查结果不代表现在的作品。请重新检查。';
    case 'passed':return hasNext?'本题通过检查。想想为什么成立，再进入下一题。':'本题通过检查。想想为什么成立，再整理这次发现。';
    case 'reflect':return '用自己的话留下发现（可选），再回到原来的数学树继续探索。';
    default:return '可以直接动手尝试；只有点击检查才会产生一条提交记录。';
  }
}

// Checked examples can explain a mathematical relationship without inferring
// that the child independently understood, proved or mastered the method.
// The model is the submitted snapshot, never unsaved live edits.
export function checkedMathExplanation({id,task,model,checked}){
  if(id!=='equivalent'||!task||!model)return null;
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
