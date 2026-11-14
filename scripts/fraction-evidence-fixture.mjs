// Engineering fixture only. Keep the original B17 task, model and grader intact.
// Its historical example starts each target with rewind, including at the initial
// position. Omit that no-op here so the strict evidence audit tests genuine actions.
import * as fractions from '../dist/learning/phase5/b17-model.js';

export function fractionEvidenceExample(task){
 if(task?.type!=='x-fracrename')throw new TypeError('Expected a B17 fraction renaming task');
 const model=fractions.initial(task);
 for(const step of fractions.solveSteps(task)){
  if(step.field){model[step.field]=step.value;fractions.field(task,model,step.field);}
  else if(!(step.action==='b17-rewind'&&model.board.n===task.n&&model.board.d===task.d)){
   fractions.act(task,model,step.action,step.data);
  }
 }
 return model;
}
