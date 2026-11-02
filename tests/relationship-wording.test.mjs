import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {relationExplanation,reviewedRelationKeys} from '../dist/spatial-reasons.js';
import {RELATION_COPY,relationHeading,relationStrength} from '../dist/navigation-copy.js';
import {makeKnowledgeNames} from '../dist/spatial-names.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const math=JSON.parse(read('dist/data/math.json'));
test('source math relations remain directional and fully traceable',()=>{
  assert.equal(math.nodes.length,587);
  assert.equal(math.edges.length,1223);
  assert.equal(math.edges.filter(e=>e.strength==='hard').length,851);
  assert.equal(math.edges.filter(e=>e.strength==='soft').length,372);
  const keys=new Set(reviewedRelationKeys());
  assert.equal(keys.size,1223);
  for(const edge of math.edges){
    assert.ok(keys.has(edge.prerequisiteId+'>'+edge.topicId));
    const explanation=relationExplanation(edge);
    assert.equal(explanation.reviewed,true,'exact source reason must match its keyed translation');
    assert.ok(explanation.text?.trim(),'Chinese rationale must not be empty');
    assert.equal(relationExplanation({...edge,reason:edge.reason+' changed'}).reviewed,false);
  }
});
test('relationship headings distinguish direction from required/optional link strength',()=>{
  assert.equal(relationHeading('before'),'相关基础');
  assert.equal(relationHeading('after'),'相关后续');
  assert.equal(relationStrength('hard'),'关键基础');
  assert.equal(relationStrength('soft'),'辅助联系');
  assert.notEqual(RELATION_COPY.before,RELATION_COPY.hard);
});
test('both map views share exact revised source titles, preserve original searches and task semantics',()=>{
  const space=read('dist/space.js');
  const olderView=read('dist/exploration.js');
  const labels=makeKnowledgeNames({nodes:math.nodes});
  assert.equal(labels.get('mt_e8CZ7E5qW7'),'凑成10的数的分与合');
  assert.match(space,/relationHeading\(side\)/);
  assert.match(olderView,/relationHeading\('before'\)/);
  assert.match(olderView,/relationHeading\('after'\)/);
  assert.match(olderView,/knowledgeNames=makeKnowledgeNames\(atlas\)/);
  assert.match(olderView,/n\.title\+' '\+n\.name\+' '\+displayNode\(n\)/);
  assert.doesNotMatch(space,/这里会用到|还会连到哪里/);
  assert.doesNotMatch(olderView,/探索包/);
  assert.match(olderView,/活动完成 \$\{s\.done\} \/ \$\{s\.total\}/);
  assert.match(olderView,/不代表所有源目标都已完整评估/);
});


// Content-boundary regression examples: these protect reviewed conditions,
// but a passing wording test is not an independent mathematics audit.
test('selected mathematics explanations retain their necessary conditions',()=>{
  const boundaryCases=[
    ['mt_MyGblah2yY','mt_FbDKeLfBCo',/同一个整体.*二分之一.*四分之二/],
    ['mt_4bc3EAxhlY','mt_167X6Ax8P7',/任意两边之和.*大于第三边.*未必能唯一确定/],
    ['mt_AabJisinfi','mt_ML5t7n2-U8',/底.*垂直高.*除以2/],
    ['mt_ebPelt-qAl','mt_b7T-CjOYUR',/分子和分母.*同时除以.*公因数.*大小不变/],
    ['mt_ebPelt-qAl','mt_NaqEP8xDhZ',/十分之三.*百分之三十.*量不变/],
    ['mt_sHJqh6UUya','mt_aCwj2PCoRV',/相对频率.*估计概率.*新的观察/],
    ['mt_GzcJEVkNRn','mt_aivrWs6jrS',/一条边.*2倍.*另一条边不变.*两条边.*4倍/],
    ['mt_oqziWKry-L','mt_bESTSBB0wK',/扇形统计图.*不重叠也不遗漏.*360°/]
  ];
  for(const [prerequisiteId,topicId,condition] of boundaryCases){
    const edge=math.edges.find(e=>e.prerequisiteId===prerequisiteId&&e.topicId===topicId);
    assert.ok(edge,'reviewed relationship must exist: '+prerequisiteId+'>'+topicId);
    const explanation=relationExplanation(edge);
    assert.equal(explanation.reviewed,true);
    assert.match(explanation.text,condition,'do not omit a mathematics condition');
  }
});


// This set protects mathematical prerequisites that short UI explanations
// must not silently omit. It does not certify pedagogy or learning outcomes.
test('statistical and proportional explanations keep inference and formula boundaries',()=>{
  const cases=[
    ['mt_WBdHkc2HTf','mt_5mIcmKRCgA',/正比例关系.*y＝kx.*k为不等于0.*经过原点/],
    ['mt_FspV_imUGK','mt_5mIcmKRCgA',/正比例.*经过原点.*反比例.*x不为0/],
    ['mt_Cg8VPguS_V','mt_ZfpeI1CFyP',/平均数.*绝对值.*距离不会是负数.*平均数/],
    ['mt_Cg8VPguS_V','mt_fQ9Rw10fss',/随机抽取.*代表性.*估计总体平均数.*不是.*精确/],
    ['mt_xAf2bu9wYK','mt_fQ9Rw10fss',/样本.*随机抽取.*代表性.*估计总体数量/],
    ['mt_xSgAgg9Ej_','mt_4zgPzc6yu5',/简单随机抽取.*相同.*仍可能.*不能代表总体/],
    ['mt_XSXnTQoQ4l','mt_KCS9GbZgU_',/四分位距＝上四分位数－下四分位数.*中间一半/],
    ['mt_KCS9GbZgU_','mt_A2hKhHXgL5',/中位数.*四分位距.*不能只凭.*重叠/]
  ];
  for(const [prerequisiteId,topicId,required] of cases){
    const edge=math.edges.find(e=>e.prerequisiteId===prerequisiteId&&e.topicId===topicId);
    assert.ok(edge,'source edge missing: '+prerequisiteId+'>'+topicId);
    const explanation=relationExplanation(edge);
    assert.equal(explanation.reviewed,true);
    assert.match(explanation.text,required,'mathematics qualification must be retained');
  }
});


// These checks prevent losing the stated mathematical conditions during copy edits.
// They are not a replacement for teaching review or real-world child comprehension.
test('measurement and geometry explanations preserve their mathematical boundaries',()=>{
  const cases=[
    ['mt_NSC3LT_-ch','mt_IuHa5UI5od',/容积.*固体.*体积.*当前液体.*不一定等于/],
    ['mt_4lp_b5Pzik','mt_e7tLi9SCIE',/刻度足够细.*更小.*只更换单位名称.*不会/],
    ['mt_cqSf213hSa','mt_e7tLi9SCIE',/更小而等长.*不留缝.*不重叠.*只更换单位名称/],
    ['mt_EXlmTURK_o','mt_d8al9JcajP',/60秒＝1分钟.*各月天数.*不能.*固定/],
    ['mt_MFfYcnv6Tv','mt_h0CVtqI2xo',/锐角.*0°.*90°.*钝角.*小于180°/],
    ['mt_YUJ5pwalqL','mt_8H2kO4k2B9',/正多边形.*所有边等长.*所有内角相等.*仅比较/],
    ['mt_KwdjWEmMNo','mt_J03RFlVdas',/不自交.*n至少为3.*n−2.*自交.*不能直接/],
    ['mt_y1n0Zwhoca','mt_Jvvh5P06NV',/单位正方形.*无空隙.*不重叠.*长方形/],
    ['mt_IuHa5UI5od','mt_d7XktBQPxm',/单位立方体.*不留空隙.*不重叠.*看不见/],
    ['mt_GzcJEVkNRn','mt_eMtV6tBSJm',/组合图形.*完整.*不重叠.*重叠或遗漏/],
    ['mt_tpT9brpI6D','mt_kLQOzZYrd5',/千米\/时.*米\/秒.*1000\/3600/],
    ['mt_KaF0SQvaiu','mt_cqSf213hSa',/等长单位.*首尾相接.*不留空隙.*不重叠/]
  ];
  for(const [prerequisiteId,topicId,required] of cases){
    const edge=math.edges.find(e=>e.prerequisiteId===prerequisiteId&&e.topicId===topicId);
    assert.ok(edge,'source edge missing: '+prerequisiteId+'>'+topicId);
    const explanation=relationExplanation(edge);
    assert.equal(explanation.reviewed,true);
    assert.match(explanation.text,required,'math boundary should remain in UI copy');
  }
});
