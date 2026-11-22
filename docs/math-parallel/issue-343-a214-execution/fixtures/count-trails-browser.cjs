'use strict';
module.exports = async ({entry}) => {
  const evidence = await entry('dist/learning/a214-count-trails-evidence.js');
  return {
    targets: evidence.COUNT_TRAIL_SOURCES.map(source => ({
      source, submitted: evidence.submittedCountTrailEvidence,
      async wrong(ui, task) {
        if (source.sessionId === 'counttwenty') {
          for (let i = 0; i < task.n; i++) await ui.act('count-tap', {index: i});
          await ui.field('total', task.n - 1);
          return;
        }
        await ui.act('count-tap', {index: 0});
        await ui.act('count-tap', {index: 0});
      },
      async correct(ui, task) {
        if (source.sessionId === 'counttwenty') {
          await ui.field('total', task.n);
          return;
        }
        await ui.act('count-undo');
        for (let index = 1; index < task.n; index++) await ui.act('count-tap', {index});
        await ui.field('total', task.n);
        if (task.error) await ui.field('badStep', 4);
        if (task.rearrange) {
          await ui.field('prediction', task.n);
          await ui.act('count-move');
          await ui.field('after', task.n);
        }
        if (task.recount) for (let index = task.n - 1; index >= 0; index--) await ui.act('count-tap', {index});
        if (task.error || task.crooked || task.rearrange) {
          await ui.field('why', task.error ? 'twice' : task.crooked ? 'start' : 'same');
        }
      }
    }))
  };
};
