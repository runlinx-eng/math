'use strict';
module.exports = async ({entry}) => {
  const family = process.env.A214_GEOMETRY_FAMILY;
  const ev = await entry('dist/learning/a214-' + family + '-evidence.js');
  const b14 = await entry('dist/learning/phase5/b14-model.js');
  const b23 = await entry('dist/learning/phase5/b23-model.js');
  const b25 = await entry('dist/learning/phase5/b25-model.js');
  const b39 = await entry('dist/learning/phase5/b39-model.js');

  async function wrong(ui, task) {
    if (family === 'square-inclusion') {
      await ui.steps(b23.solveSteps(task));
      await ui.field('answers.0', 'no');
    } else if (family === 'quadrilateral-nesting') {
      await ui.steps(b23.solveSteps(task));
      await ui.field('item', '0');
      await ui.field('slot', '0');
      await ui.act('g23-sort');
    } else if (family === 'angle-estimate') {
      await ui.field('angle', 70);
      await ui.act('g25-guess');
      await ui.act('g25-reveal');
      await ui.field('answers.0', 'less');
    } else {
      await ui.steps(b25.solveSteps(task));
      await ui.field('answers.0', '50');
    }
  }
  async function correct(ui, task) {
    if (family === 'square-inclusion') {
      await ui.field('answers.0', 'yes');
    } else if (family === 'quadrilateral-nesting') {
      await ui.field('item', '0');
      await ui.field('slot', '2');
      await ui.act('g23-sort');
    } else if (family === 'angle-estimate') {
      await ui.field('angle', task.amount);
      await ui.act('g25-guess');
      await ui.act('g25-reveal');
      await ui.field('answers.0', 'more');
    } else {
      await ui.field('answers.0', '130');
    }
  }

  return {
    targets: [{source: ev.SOURCE, submitted: ev.submitted, wrong, correct}],
    async prerequisite(ui, task) {
      if (task.type === 'x-areaproduct') await ui.steps(b14.solveSteps(task));
      else if (task.type === 'x-s39-choose') await ui.steps(b39.solveSteps(task));
      else if (task.type === 'x-s23-quad') await ui.steps(b23.solveSteps(task));
      else if (task.type === 'x-g25-estimate') await ui.steps(b25.solveSteps(task));
      else if (task.type === 'x-wideshift') {
        await ui.field('guess', 25);
        await ui.act('wide-predict');
        await ui.act('wide-move', {delta: 1});
        await ui.field('answer', 25);
        await ui.field('factor', 10);
        await ui.field('direction', 'times');
      } else throw new Error('Unexpected native prerequisite ' + task.type);
    }
  };
};
