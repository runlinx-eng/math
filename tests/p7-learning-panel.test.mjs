import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {freshLesson,modelForLesson,enterUnifiedTask,currentSubmission,submitLesson} from '../dist/learning/state.js';
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
  assert.match(js,/checkFeedback\.textContent=message/);
  assert.match(js,/checked\.status==='modified'/);
  assert.match(js,/enterUnifiedTask\(r\)/);
  assert.match(js,/t\.prompt/);
  assert.ok(Object.keys(LESSONS).length>200);
  assert.ok(Object.keys(BRIDGES).length>100);
});


test('P7 a new lesson is one directly checkable workspace',()=>{
  const a=freshLesson('equivalent');
  assert.equal(a.view,'task');
  assert.equal(a.index,0);
  assert.equal(currentSubmission(a).status,'unsubmitted');
  assert.deepEqual(modelForLesson(a).rows.map(r=>r.d),[4,6,8]);
  assert.equal(a.cases[0],undefined,'opening and manipulating is not a submission');
});

test('P7 old free-exploration records are preserved and mapped only when compatible',()=>{
  const old=freshLesson('decimal');
  old.view='play';
  const practice=modelForLesson(old);
  practice.selected=[1,2,3];
  const original=structuredClone(practice);
  enterUnifiedTask(old);
  assert.equal(old.view,'task');
  assert.deepEqual(old.models[-1],original,'original free exploration persists in old record');
  assert.deepEqual(old.models[0],original,'compatible unsubmitted practice can be resumed');

  const other=freshLesson('equivalent');
  other.view='play';
  modelForLesson(other).rows[0].n=1;
  const originalOther=structuredClone(other.models[-1]);
  enterUnifiedTask(other);
  assert.equal(other.view,'task');
  assert.deepEqual(other.models[-1],originalOther);
  assert.deepEqual(other.models[0].rows.map(r=>r.d),[4,6,8],'incompatible fractions are not misreported as task answers');
  assert.equal(other.cases[0],undefined);
});

test('P7 changing a submitted workpiece requires a fresh check, without discarding history',()=>{
  const a=freshLesson('share');
  a.models[0]={cuts:[20,40,60,80],selected:[0]};
  const result=submitLesson(a);
  assert.equal(result.correct,true);
  assert.equal(currentSubmission(a).status,'correct');
  a.models[0].selected=[1];
  assert.equal(currentSubmission(a).status,'modified');
  assert.equal(a.cases[0].attempts.length,1);
  a.models[0].selected=[0];
  assert.equal(currentSubmission(a).status,'correct');
});


test('P7 navigation contract: a single entry, conditional resumption and stable 3D return',()=>{
  const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
  const js=readFileSync(new URL('../dist/space.js',import.meta.url),'utf8');
  assert.match(html,/data-action="close-journey">返回知识空间 ×/);
  assert.match(html,/data-action="close-learning-hub">返回知识空间 ×/);
  assert.match(html,/data-action="close-utility"[^>]*>返回知识空间 ×/);
  assert.doesNotMatch(html,/返回学习 ×|回到探索 ×|接着学习/);
  assert.doesNotMatch(js,/返回学习 ×|回到探索 ×|继续活动|接着学习/);
  assert.match(js,/function continuationNav\(next\)/);
  assert.match(js,/label:'回到待续问题'/);
  assert.match(js,/label:'继续上次学习'/);
  assert.match(js,/label:'开始学习'/);
  assert.match(js,/sameTask\?''/,'current node does not repeat the same recommended session');
  assert.match(js,/setTaskSurfaceUrl\('explore',\{replace:true\}\);restoreTaskSurface\(\)/,'explicit close always returns to exploration');
  assert.match(js,/function suspendJourney\(\)/,'switching to other surfaces keeps the live iframe');
  assert.match(js,/function resumeJourney\(\)/,'learning tab reopens the same live iframe');
  const lesson=readFileSync(new URL('../dist/learning/learn.js',import.meta.url),'utf8');
  const standalone=readFileSync(new URL('../dist/learn.html',import.meta.url),'utf8');
  const optional=readFileSync(new URL('../dist/learning/p3-view.js',import.meta.url),'utf8');
  assert.match(lesson,/返回知识空间 →/);
  assert.match(standalone,/← 返回知识空间/);
  assert.doesNotMatch(optional,/button\('back','返回知识空间'\)/,'secondary learning tools no longer duplicate the already visible exit');
  assert.doesNotMatch(lesson,/回到数学树继续探索/);
});
