import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {ACTIVITIES} from '../dist/exploration-content.js';

const root = new URL('../', import.meta.url);
const json = path => JSON.parse(fs.readFileSync(new URL(path, root)));
const plan = json('docs/content-plan/catalog.json');
const originalTopics = json('vendor/os-taxonomy/data/topics.json').topics;
const raw = originalTopics.filter(n => n.subject === 'Mathematics');
const originalResearch = json('vendor/os-taxonomy/data/teaching-research.json').records;
const research = new Map(originalResearch.map(r => [r.topicId, r]));
const rawById = new Map(raw.map(n => [n.id, n]));
const nodes = new Map(plan.nodes.map(n => [n.id, n]));
const batches = new Map(plan.batches.map(b => [b.id, b]));
const mathIds = new Set(raw.map(n => n.id));
const rawEdges = json('vendor/os-taxonomy/data/dependencies.json').dependencies;
const edges = rawEdges.filter(e => mathIds.has(e.topicId) && mathIds.has(e.prerequisiteId));
const external = rawEdges.filter(e => mathIds.has(e.topicId) && !mathIds.has(e.prerequisiteId));
const edgeKey = e => JSON.stringify([e.prerequisiteId, e.topicId, e.strength, e.reason]);
const keys = es => es.map(edgeKey).sort();
const sorted = xs => [...xs].sort();
const at = (obj, pointer) => pointer.slice(1).split('/').reduce((v, key) => v[key], obj);

test('all source topics have exactly one delivery, group and work-unit assignment', () => {
  assert.equal(raw.length, 587);
  assert.equal(nodes.size, 587);
  assert.deepEqual(sorted(nodes.keys()), sorted(mathIds));
  for (const container of [plan.groups, plan.workUnits, plan.batches]) {
    const assigned = container.flatMap(g => g.topicIds);
    assert.equal(assigned.length, 587);
    assert.equal(new Set(assigned).size, 587);
    assert.deepEqual(sorted(assigned), sorted(mathIds));
  }
  for (const n of plan.nodes) {
    assert.ok(plan.groups.find(g => g.id === n.groupId).topicIds.includes(n.id));
    assert.ok(plan.workUnits.find(u => u.id === n.unitId).topicIds.includes(n.id));
    assert.ok(batches.get(n.batchId).topicIds.includes(n.id));
    assert.equal(n.phase, batches.get(n.batchId).phase);
  }
});

test('every source definition and every learning goal survives with an explicit task slot', () => {
  for (const n of plan.nodes) {
    const source = rawById.get(n.id);
    assert.equal(n.description, source.description);
    assert.equal(n.sourceName, source.name);
    assert.deepEqual(n.learningGoals, source.evidence);
    assert.deepEqual(n.goalTaskMapping.map(x => x.goal), source.evidence);
    assert.deepEqual(at({topics: originalTopics}, n.source.jsonPointer), source);
    n.goalTaskMapping.forEach((g, index) => {
      assert.equal(g.goalIndex, index);
      assert.equal(g.unitId, n.unitId);
      assert.equal(g.deliveryStatus, '待逐目标实现与核对');
    });
  }
});

test('502 research records and 85 gaps reconcile by ID, with valid activity pointers', () => {
  let available = 0, missing = 0;
  for (const n of plan.nodes) {
    const r = research.get(n.id), resource = n.teachingResource;
    if (!r) {
      missing++;
      assert.equal(resource.activityCount, 0);
      assert.equal(resource.startingActivity, null);
      assert.equal(resource.jsonPointer, null);
      continue;
    }
    available++;
    assert.deepEqual(at({records: originalResearch}, resource.jsonPointer), r);
    assert.equal(resource.activityCount, r.learn.activities.length);
    for (const a of resource.activityReferences) {
      assert.equal(a.title, r.learn.activities[a.index].title);
      assert.deepEqual(at({records: originalResearch}, a.jsonPointer), r.learn.activities[a.index]);
    }
    assert.deepEqual(resource.startingActivity.learnerActions, r.learn.activities[0].learnerActions);
    assert.deepEqual(resource.keyRepresentations, r.pedagogy.keyRepresentations);
    assert.equal(resource.assessmentMethod, r.assess.method);
  }
  assert.deepEqual([available, missing], [502, 85]);
});

test('12 → 50 → 587 counts use distinct source nodes; A03 is not the old decimal activity', () => {
  const sample = plan.batches.filter(b => b.phase === 2).flatMap(b => b.topicIds);
  const release = plan.batches.filter(b => [2,4].includes(b.phase)).flatMap(b => b.topicIds);
  const remaining = plan.batches.filter(b => b.phase === 5).flatMap(b => b.topicIds);
  assert.deepEqual([sample.length, release.length, remaining.length], [12, 50, 537]);
  assert.equal(plan.batches.filter(b => b.phase === 4).reduce((s,b) => s+b.newNodeCount, 0), 38);
  assert.equal(plan.batches[0].newNodeCount, 9);
  assert.deepEqual(sorted(release), sorted(plan.first50TopicIds));
  assert.equal(new Set(release.map(id => nodes.get(id).plannedThemeId)).size, 5);
  assert.equal(plan.sampleRoutes.length, 3);
  assert.ok(plan.sampleRoutes.every(r => r.topicIds.length === 4));
  assert.deepEqual(sorted(plan.sampleRoutes.flatMap(r => r.topicIds)), sorted(sample));
  assert.ok(sample.includes('mt_DRlbMok2lT') && sample.includes('mt_TqDq6jyOmL'));
  assert.ok(sample.some(id => nodes.get(id).familyId === 'volume'));
  assert.ok(new Set(sample.map(id => nodes.get(id).familyId)).size >= 3);
  assert.equal(sample.filter(id => !research.has(id)).length, 2);
});

test('all 1223 internal and 32 external source relations retain direction, strength and reason', () => {
  assert.equal(edges.length, 1223);
  assert.equal(external.length, 32);
  assert.deepEqual(keys(plan.sourceRelations), keys(edges));
  assert.deepEqual(keys(plan.externalReferences), keys(external));
  for (const n of plan.nodes) {
    assert.deepEqual(keys(n.prerequisiteRelations), keys([...edges, ...external].filter(e => e.topicId === n.id)));
    assert.deepEqual(keys(n.nextRelations), keys(edges.filter(e => e.prerequisiteId === n.id)));
  }
});

test('batch entry and onward references do not invent prerequisites or hide later foundations', () => {
  let cumulative = 0;
  for (const b of plan.batches) {
    const ids = new Set(b.topicIds);
    const incoming = [...edges,...external].filter(e => ids.has(e.topicId) && !ids.has(e.prerequisiteId));
    const internal = edges.filter(e => ids.has(e.topicId) && ids.has(e.prerequisiteId));
    const outgoing = edges.filter(e => !ids.has(e.topicId) && ids.has(e.prerequisiteId));
    assert.deepEqual(keys(b.incomingRelations), keys(incoming));
    assert.deepEqual(keys(b.internalRelations), keys(internal));
    assert.deepEqual(keys(b.outgoingRelations), keys(outgoing));
    assert.deepEqual(keys(b.laterPrerequisites), keys(incoming.filter(e => nodes.has(e.prerequisiteId) &&
      batches.get(nodes.get(e.prerequisiteId).batchId).order > b.order)));
    const targets = new Set(internal.filter(e => e.strength === 'hard').map(e => e.topicId));
    assert.deepEqual(sorted(b.entryTopicIds), sorted([...ids].filter(id => !targets.has(id))));
    cumulative += ids.size;
    assert.equal(b.cumulativePlannedCoverage, cumulative);
    assert.ok(b.validation.length && b.newWork.length && b.preparation.length);
    assert.ok(ids.size <= 24);
  }
  for (const u of plan.workUnits) {
    const ids = new Set(u.topicIds);
    assert.deepEqual(keys(u.sourceRelations), keys(edges.filter(e => ids.has(e.topicId) && ids.has(e.prerequisiteId))));
    assert.ok(ids.size <= 6);
  }
  assert.equal(cumulative, 587);
});

test('85 research gaps have a release batch, individual goals and review/transfer requirements', () => {
  const missing = raw.filter(n => !research.has(n.id)).map(n => n.id);
  assert.deepEqual(sorted(plan.researchGaps.map(g => g.topicId)), sorted(missing));
  plan.researchGaps.forEach((gap, index) => {
    const n = nodes.get(gap.topicId);
    assert.equal(gap.order, index + 1);
    assert.equal(n.researchGapOrder, gap.order);
    assert.equal(gap.batchId, n.batchId);
    assert.deepEqual(gap.learningGoals, rawById.get(n.id).evidence);
    assert.ok(gap.researchTasks.length >= 3 && gap.validationMethod && gap.transferRequirement);
    assert.ok(gap.adjacentResourceTopicIds.every(id => mathIds.has(id) && research.has(id)));
    assert.equal(gap.status, '已排期，研究未补齐');
  });
  assert.equal(plan.researchGaps.filter(g => g.phase !== 5).length, 9);
});

test('reuse assets are real local sources; all proposed families specify action and validation', () => {
  for (const a of Object.values(plan.assets)) {
    assert.ok(a.reuse && a.limit);
    for (const path of a.paths) assert.ok(fs.statSync(new URL(path, root)).isFile(), path);
  }
  for (const n of plan.nodes) {
    const family = plan.families[n.familyId];
    assert.ok(family.learnerAction && family.transferRequirement && family.mathReview);
    if (n.codeAssetId) assert.ok(plan.assets[n.codeAssetId]);
  }
});

test('proposed placement fixes are isolated from the current atlas and documented by ID', () => {
  const atlas = json('dist/data/atlas.json');
  const changed = plan.nodes.filter(n => n.currentPackId !== n.plannedPackId).map(n => n.id);
  assert.deepEqual(sorted(changed), sorted(plan.audit.proposedPlacementChanges.map(c => c.topicId)));
  assert.equal(changed.length, 5);
  for (const n of atlas.nodes) assert.equal(nodes.get(n.id).currentPackId, n.packId);
  assert.equal(nodes.get('mt_MgsDabdnr1').plannedPackId, 'time');
  assert.equal(nodes.get('mt_snlqRCiA1R').plannedPackId, 'positions');
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL('dist/data/atlas.json',root))).digest('hex'),
    'b30b16783f518e47fed8dd6e412bb6ee6e323b5250834c0ee1c0bb68dff94caf');
});

test('stage-one baseline preserves its original three activities and preview, separate from current coverage', () => {
  const existing = plan.nodes.filter(n => n.implementation.state === '已有早期活动');
  assert.deepEqual(sorted(existing.map(n => n.id)), sorted(Object.values(ACTIVITIES).map(a => a.topicId)));
  assert.equal(existing.length, 3);
  for (const n of existing) assert.equal(ACTIVITIES[n.implementation.activityId].topicId, n.id);
  assert.equal(nodes.get('mt_DRlbMok2lT').implementation.state, '预览');
  assert.equal(plan.nodes.filter(n => n.implementation.state === '待制作').length, 583);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL('dist/exploration-content.js',root))).digest('hex'),
    '05d9974122025d7551af92208d86d586144545b940c10915c366d579c5d3a397');
});

test('cross-subject references remain references and do not become required new subject delivery', () => {
  const refs = new Set(external.map(e => e.prerequisiteId));
  assert.deepEqual(sorted(plan.externalReferenceTopics.map(n => n.id)), sorted(refs));
  for (const id of refs) assert.ok(!nodes.has(id));
  assert.ok(plan.nodes.every(n => rawById.get(n.id).subject === 'Mathematics'));
});

test('source fingerprints and all generated views are current and reproducible', () => {
  for (const [path, expected] of Object.entries(plan.inputHashes)) {
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL(path, root))).digest('hex'), expected, path);
  }
  const output = execFileSync('python3', ['scripts/build_content_plan.py','--check'],
    {cwd:fileURLToPath(root), encoding:'utf8', timeout:10000});
  assert.equal(JSON.parse(output).mathTopics, 587);
});
