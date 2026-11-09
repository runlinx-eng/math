import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {lessonRecordTier,activityRecordTier,journeyRecordTier,tieredIds} from '../dist/learning/trail-priority.js';
import {freshLesson,modelForLesson} from '../dist/learning/state.js';

test('opening a session alone never creates a work artifact',()=>{
  const record={view:'play',index:0,cases:{},notes:[],draft:''};
  assert.equal(lessonRecordTier(record),'available');
  assert.deepEqual(tieredIds(['a'],{a:record},lessonRecordTier),{evidence:[],draft:[],available:['a']});
});
test('actual unsubmitted work is a draft, but just entering task mode is not',()=>{
  const opened=freshLesson('share');
  modelForLesson(opened); // an initial default task model is not a work artifact
  assert.equal(lessonRecordTier(opened),'available');
  modelForLesson(opened).selected=[0];
  assert.equal(lessonRecordTier(opened),'draft');
  const legacy=freshLesson('decimal');legacy.view='play';
  modelForLesson(legacy).selected=[1,2,3];
  assert.equal(lessonRecordTier(legacy),'draft','old ungraded work still appears as a draft');
  assert.equal(lessonRecordTier({view:'task',index:0,cases:{},notes:[],draft:''}),'available');
  assert.equal(lessonRecordTier({view:'play',index:0,cases:{},notes:[],draft:'a proof in progress'}),'draft');
  assert.equal(lessonRecordTier({view:'play',index:0,cases:{0:{support:true,attempts:[]}},notes:[],draft:''}),'draft');
});
test('actual attempts and saved notes have evidence priority without mastery claims',()=>{
  assert.equal(lessonRecordTier({cases:{0:{support:true,attempts:[{value:4}]}},notes:[]}), 'evidence');
  assert.equal(lessonRecordTier({cases:{},notes:[{text:'reason'}]}),'evidence');
  assert.deepEqual(tieredIds(['a','b','c'],{
    a:{cases:{},notes:[],view:'play',index:0,draft:''},
    b:{cases:{},notes:[],view:'task',index:0,draft:'unfinished thought'},
    c:{cases:{0:{attempts:[{}]}},notes:[]}
  },lessonRecordTier),{evidence:['c'],draft:['b'],available:['a']});
});
test('free exploration evidence requires saved actions or text, not a page visit',()=>{
  assert.equal(activityRecordTier({evidence:{},observations:[],notes:[],draft:'',stage:'play',lab:{changed:false}}),'available');
  assert.equal(activityRecordTier({evidence:{},observations:[],notes:[],draft:'',stage:'play',lab:{changed:true}}),'draft');
  assert.equal(activityRecordTier({evidence:{},observations:[{}],notes:[],draft:''}),'evidence');
  assert.equal(activityRecordTier({evidence:{'construct:0':{support:true,attempts:[{}]}},observations:[],notes:[]}), 'evidence');
});
test('early journey requires saved evidence, and its empty state is not a work',()=>{
  assert.equal(journeyRecordTier(null),'available');
  assert.equal(journeyRecordTier({attempts:[],notes:[],observations:[]}), 'draft');
  assert.equal(journeyRecordTier({attempts:[{}],notes:[],observations:[]}), 'evidence');
});

test('offline service worker includes the new trail classifier dependency',()=>{
  const sw=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
  assert.match(sw,/\.\/learning\/trail-priority\.js/);
});
