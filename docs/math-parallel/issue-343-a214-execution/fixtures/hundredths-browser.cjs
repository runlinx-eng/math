'use strict';
module.exports = async ({entry}) => {
  const evidence = await entry('dist/learning/a214-hundredths-construction-evidence.js');
  const b17 = await entry('dist/learning/phase5/b17-model.js');
  return {
    targets: evidence.HUNDREDTHS_SOURCES.map(source => ({
      source, submitted: evidence.submittedHundredthsConstructionEvidence,
      async wrong(ui, task) {
        for (let row = 0; row < task.tenths; row++) await ui.act('b17-ten', {index: row});
        await ui.act('b17-layer', {index: 1});
        await ui.act('b17-cell', {index: 0});
        const tens = task.tenths * 10;
        const total = tens + task.hundredths;
        for (let cell = tens; cell < total; cell++) await ui.act('b17-cell', {index: cell});
        await ui.field('left', tens + '/100');
        await ui.field('decimal', (total / 100).toFixed(2));
        await ui.field('answer', total + '/110');
      },
      async correct(ui, task) {
        await ui.field('answer', (task.tenths * 10 + task.hundredths) + '/100');
      }
    })),
    async prerequisite(ui, task) { await ui.steps(b17.solveSteps(task)); }
  };
};
