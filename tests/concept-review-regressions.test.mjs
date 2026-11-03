import test from 'node:test';
import assert from 'node:assert/strict';
import {conceptHelpFor} from '../dist/concept-explanations.js';

test('number-line changes distinguish the distance moved from the destination',()=>{
  const help=conceptHelpFor('mt_19j_5AuuQI');
  assert.equal(52-24,28);
  assert.match(help.counterexample,/移动24，终点是28/);
  assert.match(help.counterexample,/不要把移动距离24误当作终点/);
  const plan=conceptHelpFor('mt_CDa5AVakLE');
  assert.equal(20+3-12,11);
  assert.match(plan.example,/已有12.*需要20.*还差8.*需要3.*还差11/);
});

test('geometry descriptions preserve conditions and do not reverse implications',()=>{
  const line=conceptHelpFor('mt_-3udyo6VyB');
  assert.match(line.definition,/非零的横向变化量/);
  assert.match(line.definition,/竖直直线.*梯度没有定义/);
  assert.match(conceptHelpFor('mt_oqziWKry-L').counterexample,/对顶角一定相等，但其他角也可能相等/);
  assert.match(conceptHelpFor('mt_oqziWKry-L').counterexample,/不相邻的两个角也可能合计 180°/);
  assert.match(conceptHelpFor('mt_4bc3EAxhlY').definition,/不同形状或大小/);
  assert.match(conceptHelpFor('mt_REwgr0d_ss').definition,/多面体.*球等曲面立体/);
});

test('fraction constructions state the allowed counts and enough halving steps',()=>{
  assert.match(conceptHelpFor('mt_ebPelt-qAl').definition,/同一个正整数/);
  assert.match(conceptHelpFor('mt_09sySPqM9Z').definition,/a为非负整数、b为正整数/);
  assert.match(conceptHelpFor('mt_rCMdwG-YOE').definition,/单位分数除以正整数.*非负整数除以单位分数/);
  const simpler=conceptHelpFor('mt_gC-6JXAG5S').simpler;
  assert.match(simpler,/得到4份.*4份各自再对半.*得到8份/);
  assert.deepEqual([1,2,4,8],Array.from({length:4},(_,i)=>2**i));
});

test('statistical comparisons retain sampling and division-by-zero limits',()=>{
  const sample=conceptHelpFor('mt_km4V6d5IAh');
  assert.match(sample.example,/平均绝对偏差.*多次独立重抽.*谨慎推测.*不能由有限样本确定/);
  const comparison=conceptHelpFor('mt_A2hKhHXgL5');
  assert.match(comparison.tryIt,/实际分布和重叠位置/);
  assert.match(comparison.why,/平均绝对偏差为0时不能作为除数/);
  for(const id of ['mt_t0g2SlP404','mt_vmQJAtAFuy']){
    assert.match(conceptHelpFor(id).definition,/有限且每个基本结果机会都大于0/);
  }
});

test('ratio and unit examples identify the quantities and conversion conditions',()=>{
  assert.match(conceptHelpFor('mt_yK51ZnKA8m').definition,/b 不为 0.*a\/b/);
  assert.match(conceptHelpFor('mt_5mIcmKRCgA').why,/k为非零常数、x和y均不为零/);
  assert.match(conceptHelpFor('mt_tpT9brpI6D').simpler,/1小时是60分钟、1天是24小时/);
  assert.match(conceptHelpFor('mt_ALUrJpY0cZ').example,/分别从100元出发/);
});

test('selected practice prompts use new quantities instead of repeating worked examples',()=>{
  const cases=[
    ['mt_lvaSGHwvQ5',/1又1\/3杯/],
    ['mt_o_p-3tCxiM',/13个四分之一/],
    ['mt_1PAWhRhpdg',/3个整体各分成4份/],
    ['mt_R4AY0LKxfl',/－2,3.*4,－1/],
    ['mt_mqgu72aCMz',/y＝x＋2.*y＝8－2x/],
  ];
  for(const [id,pattern] of cases){
    const help=conceptHelpFor(id);
    assert.match(help.tryIt,pattern,id);
    assert.doesNotMatch(help.example,pattern,id);
  }
  assert.equal(2+2,8-2*2);
});
