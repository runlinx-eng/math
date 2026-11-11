// UI-only catalog: these files contain metadata snapshots, not task definitions.
import * as A from './metadata-b02-b11.js';
import * as B from './metadata-b12-b20.js';
import * as C from './metadata-b21-b29.js';
import * as D from './metadata-b30-b39.js';

const batches = [A, B, C, D];
export const EXTRA_LESSONS = Object.fromEntries(
  batches.flatMap(batch => Object.entries(batch.LESSONS).map(([id, lesson]) =>
    [id, {...lesson, id, question: lesson.title}]))
);
export const EXTRA_ROUTES = batches.flatMap(batch => batch.ROUTES);
export const EXTRA_REFLECTIONS = Object.fromEntries(
  Object.entries(EXTRA_LESSONS).map(([id, lesson]) => [id, lesson.reflection])
);
export const EXTRA_SECTIONS = batches.flatMap(batch => batch.SECTIONS);
