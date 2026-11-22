'use strict';
module.exports = async ({entry}) => {
  const evidence = await entry('dist/learning/a214-affine-rulejump-evidence.js');
  const b17 = await entry('dist/learning/phase5/b17-model.js');
  const b35 = await entry('dist/learning/phase5/b35-model.js');
  const targets = evidence.AFFINE_RULE_SOURCES.map(source => ({
    source, submitted: evidence.submittedAffineRulejumpEvidence,
    async wrong(ui, task) {
      await ui.field('multiplier', task.a);
      await ui.field('offset', task.b);
      await ui.field('divisor', 1);
      await ui.act('b17-rule');
      await ui.field('n', task.inputs[0]);
      await ui.field('answer', source.firstTerm + 1);
      await ui.act('b17-run');
    },
    async correct(ui, task) {
      for (const input of task.inputs) {
        await ui.field('n', input);
        await ui.field('answer', source.firstTerm + (input - 1) * source.difference);
        await ui.act('b17-run');
      }
    }
  }));
  return {
    targets,
    async prerequisite(ui, task) {
      if (task.type === 'x-rulejump') await ui.steps(b17.solveSteps(task));
      else await ui.steps(b35.solveSteps(task));
    }
  };
};
