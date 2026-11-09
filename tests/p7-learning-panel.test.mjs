import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {freshLesson,submitLesson} from '../dist/learning/state.js';
import {renderP3Flow} from '../dist/learning/p3-view.js';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES} from '../dist/learning/bridges.js';

test('P7 initial study shows one task before secondary follow-ups',()=>{
  const record=freshLesson('share'),host={innerHTML:''};
  renderP3Flow(host,{atlas:{nodes:[],edges:[]},id:'share',record,embedded:true});
  assert.match(host.innerHTML,/尚未提交检查/);
  assert.doesNotMatch(host.innerHTML,/历史完成/);
  assert.doesNotMatch(host.innerHTML,/首次独立证据/);
  assert.doesNotMatch(host.innerHTML,/p3-flow-heading/);
  assert.doesNotMatch(host.innerHTML,/data-do="p3-retry"/);
  assert.match(host.innerHTML,/拓展与实践应用/);
  assert.match(host.innerHTML,/模拟现实情境不等于真实生活实践/);
  assert.match(host.innerHTML,/更多知识联系与探索方式/);
});

test('P7 shows retry and saves first invalid submission without erasing earlier attempts',()=>{
  const record=freshLesson('share');
  record.view='task';
  const result=submitLesson(record);
  assert.equal(result.correct,false);
  const host={innerHTML:''};
  renderP3Flow(host,{atlas:{nodes:[],edges:[]},id:'share',record,embedded:true});
  assert.match(host.innerHTML,/需要修改/);
  assert.match(host.innerHTML,/当前任务累计 1 次提交/);
  assert.match(host.innerHTML,/p3-evidence-details/);
  assert.match(host.innerHTML,/data-do="p3-retry"/);
  assert.equal(record.cases[0].attempts.length,1);
});

test('P7 source data and storage model stay outside the UI-only diff',()=>{
  const html=readFileSync(new URL('../dist/learn.html',import.meta.url),'utf8');
  const js=readFileSync(new URL('../dist/learning/learn.js',import.meta.url),'utf8');
  assert.match(html,/id="check-feedback"/);
  assert.match(js,/checkFeedback\.textContent=feedback/);
  assert.match(js,/t\.prompt/);
  assert.ok(Object.keys(LESSONS).length>200);
  assert.ok(Object.keys(BRIDGES).length>100);
});
