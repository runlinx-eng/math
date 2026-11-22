'use strict';
module.exports = async ({entry}) => {
  const evidence = await entry('dist/learning/a214-integer-walk-evidence.js');
  async function complete(ui, task) {
    if (task.infer) await ui.field('step', task.step);
    if (task.reason) await ui.field('why', task.reason === 'ones' ? 'ones' : 'carry');
    for (let step = 1; step <= task.count; step++) {
      await ui.field('next', task.start + step * task.step);
      await ui.act('walk-hop');
    }
  }
  return {
    targets: evidence.INTEGER_WALK_SOURCES.map(source => ({
      source, submitted: evidence.submittedIntegerWalkEvidence,
      async wrong(ui, task) {
        await ui.field('next', task.start);
        await ui.act('walk-hop');
      },
      async correct(ui, task) {
        await ui.act('walk-undo');
        await complete(ui, task);
      }
    })).sort((a, b) => a.source.sessionId.localeCompare(b.source.sessionId) || a.source.index - b.source.index),
    async prerequisite(ui, task) {
      if (task.type === 'x-countboard') {
        for (const [index, value] of task.holes.entries()) await ui.field('values.' + index, value);
      } else await complete(ui, task);
    }
  };
};
