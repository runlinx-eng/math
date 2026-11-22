import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [family, familiesPath, artifactsPath] = process.argv.slice(2);
assert.ok(family && familiesPath && artifactsPath, 'family, families.json and extracted originals directory required');
const artifacts = resolve(artifactsPath);
const root = process.cwd();
const read = path => JSON.parse(readFileSync(path, 'utf8'));
const spec = read(resolve(familiesPath))[family];
assert.ok(spec, 'known family');
const entry = name => import(pathToFileURL(join(root, name)).href);
const head = execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim();
const parent = execFileSync('git', ['rev-parse', 'HEAD^'], {encoding: 'utf8'}).trim();
const {sessionTaskFor} = await entry('dist/learning/bridges.js');
const {prepareSessionRuntime} = await entry('dist/learning/phase4/async-batches.js');
const {inspect} = await entry('dist/learning/tasks.js');
const {unpackText} = await entry('dist/storage.js');
const {taskFingerprint} = await entry('scripts/audit-evidence-expansion.mjs');
const ev = await entry('dist/learning/a214-' + family + '-evidence.js');
const sourceRows = spec.single ? [ev.SOURCE] : ev[spec.sources || 'SOURCES'];
const submitted = ev[spec.submitted || 'submitted'];
const manifest = read(join(root, 'docs/spatial-learning/evidence-review-manifest.json'));
const officialPositions = new Set(manifest.tasks.map(t => t.sessionId + ':' + t.index));
assert.equal(officialPositions.size, 1663);
const receipts = spec.runs.map(run => ({run, summary: read(join(artifacts, run, 'results.json'))}));
for (const {summary} of receipts) {
  assert.equal(summary.testedCheckoutSha, head);
  assert.equal(summary.baseline, parent);
  assert.equal(summary.originalControls, true);
  assert.equal(summary.seededWork, false);
  assert.equal(summary.strictAApproved, false);
  assert.ok(summary.offline.originStopped && summary.offline.status.complete);
}
const outputs = [];
const fileDigest = path => createHash('sha256').update(readFileSync(path)).digest('hex');
for (const source of sourceRows) {
  const {sessionId, index} = source;
  const position = sessionId + ':' + index;
  assert.ok(!officialPositions.has(position));
  await prepareSessionRuntime(sessionId);
  const task = sessionTaskFor(sessionId, index);
  assert.equal(task?.type, source.type);
  assert.equal(taskFingerprint(task), source.taskHash);
  const passes = receipts.flatMap(({run, summary}) =>
    summary.positions.filter(row => row.position === position && row.status === 'PASS').map(row => ({run, row})));
  assert.equal(passes.length, 1, 'one original successful run for each position ' + position);
  const {run, row} = passes[0];
  for (const key of ['nodeId', 'type', 'taskHash']) assert.equal(row[key], source[key]);
  const path = name => join(artifacts, run, name);
  function checkNativeStorage(storage) {
    const json = readFileSync(path(storage.decoded), 'utf8');
    assert.equal(unpackText(readFileSync(path(storage.raw), 'utf8')), json);
    const lesson = JSON.parse(json).lessons[sessionId];
    assert.equal(lesson.index, index);
    return {model: lesson.models[index], record: lesson.cases[index]};
  }
  const wrong = checkNativeStorage(row.wrong);
  const correct = checkNativeStorage(row.correct);
  const restored = checkNativeStorage(row.restored);
  assert.equal(wrong.record.attempts.length, 1);
  assert.equal(correct.record.attempts.length, 2);
  assert.deepEqual(wrong.model, wrong.record.attempts[0].value);
  assert.deepEqual(correct.record.attempts[0], wrong.record.attempts[0]);
  assert.deepEqual(correct.model, correct.record.attempts[1].value);
  assert.deepEqual(restored, correct);
  assert.equal(inspect(task, wrong.model).correct, false);
  assert.equal(inspect(task, correct.model).correct, true);
  assert.equal(submitted(task, correct.model, wrong.record, source), null);
  assert.deepEqual(submitted(task, correct.model, correct.record, source),
    read(path(sessionId + '-' + index + '-proof.json')));
  const exported = read(path('native-state-v2.json'));
  assert.equal(exported.app, 'math-explorer');
  assert.equal(exported.version, 2);
  assert.deepEqual(exported.state.lessons[sessionId].cases[index], correct.record);
  assert.deepEqual(exported.state.lessons[sessionId].models[index], correct.model);
  outputs.push({
    position, ...source, run, checkPath: run + '/' + row.correct.decoded,
    checkSha256: fileDigest(path(row.correct.decoded)), restoredIdentical: true,
    screenshotPath: run + '/' + sessionId + '-' + index + '-correct.png',
    screenshotSha256: fileDigest(path(sessionId + '-' + index + '-correct.png'))
  });
}
console.log(JSON.stringify({family, head, parent, chromium: receipts[0].summary.chromium, checks: outputs}));
