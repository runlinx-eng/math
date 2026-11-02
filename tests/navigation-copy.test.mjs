import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {applyNavigationCopy,THEME_COPY,GROUP_COPY} from '../dist/navigation-copy.js';
import {buildRelationshipSpace} from '../dist/spatial-relationship.js';

const source=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas.json',import.meta.url)));
const copy=()=>structuredClone(source);

test('the five themes and 23 knowledge groups are covered exactly by the navigation review',()=>{
  assert.equal(source.themes.length,5);
  assert.equal(source.packs.length,23);
  assert.deepEqual(Object.keys(THEME_COPY).sort(),source.themes.map(x=>x.id).sort());
  assert.deepEqual(Object.keys(GROUP_COPY).sort(),source.packs.map(x=>x.id).sort());
  const result=applyNavigationCopy(copy());
  for(const theme of result.themes){
    const expected=THEME_COPY[theme.id];
    assert.equal(theme.title,expected.title||source.themes.find(x=>x.id===theme.id).title);
    assert.equal(theme.description,expected.description);
  }
  for(const pack of result.packs){
    const expected=GROUP_COPY[pack.id],original=source.packs.find(x=>x.id===pack.id);
    assert.equal(pack.title,expected.title||original.title);
    assert.equal(pack.question,expected.question);
    assert.ok(pack.nodeIds.length>0);
  }
});
test('text overrides preserve all IDs, memberships, edges and 3D knowledge positions',()=>{
  const after=applyNavigationCopy(copy());
  assert.deepEqual(after.nodes,source.nodes);
  assert.deepEqual(after.edges,source.edges);
  assert.deepEqual(after.packs.map(x=>[x.id,x.themeId,x.nodeIds]),
    source.packs.map(x=>[x.id,x.themeId,x.nodeIds]));
  const beforeSpace=buildRelationshipSpace(source),afterSpace=buildRelationshipSpace(after);
  const coords=space=>space.objects.map(x=>[x.key,...x.position]);
  assert.deepEqual(coords(afterSpace),coords(beforeSpace));
  assert.equal(afterSpace.relationshipIds.size,537);
  assert.equal(afterSpace.nodes.size,587);
  assert.equal(after.edges.length,1223);
});
test('navigation terms remain accurate and do not conflate browsing with mastery',()=>{
  const after=applyNavigationCopy(copy());
  assert.equal(after.themes.find(x=>x.id==='measure').title,'测量与生活中的量');
  assert.equal(after.packs.find(x=>x.id==='add-subtract').title,'加法与减法');
  assert.equal(after.packs.find(x=>x.id==='groups').title,'乘法与除法');
  assert.equal(after.packs.find(x=>x.id==='area').title,'周长与面积');
  assert.equal(after.packs.find(x=>x.id==='volume').title,'体积与容积');
  for(const p of after.packs){
    assert.doesNotMatch(p.question,/已掌握|学习完成|已学会/);
    assert.ok(p.question.length<75);
  }
});
