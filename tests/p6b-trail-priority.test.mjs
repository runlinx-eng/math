import test from 'node:test';
import assert from 'node:assert/strict';
import {lessonRecordTier,activityRecordTier,journeyRecordTier,tieredIds} from '../dist/learning/trail-priority.js';

test('opening a session alone never creates a work artifact',()=>{
  const record={view:'play',index:0,cases:{},notes:[],draft:''};
  assert.equal(lessonRecordTier(record),'available');
  assert.deepEqual(tieredIds(['a'],{a:record},lessonRecordTier),{evidence:[],draft:[],available:['a']});
});
test('a saved draft is resumable, not a submitted artifact',()=>{
  assert.equal(lessonRecordTier({view:'task',index:0,cases:{},notes:[],draft:''}),'draft');
  assert.equal(lessonRecordTier({view:'play',index:0,cases:{},notes:[],draft:'a proof in progress'}),'draft');
  assert.equal(lessonRecordTier({view:'play',index:0,cases:{0:{support:true,attempts:[]}},notes:[],draft:''}),'draft');
});
test('actual attempts and saved notes have evidence priority without mastery claims',()=>{
  assert.equal(lessonRecordTier({cases:{0:{support:true,attempts:[{value:4}]}},notes:[]}), 'evidence');
  assert.equal(lessonRecordTier({cases:{},notes:[{text:'reason'}]}),'evidence');
  assert.deepEqual(tieredIds(['a','b','c'],{
    a:{cases:{},notes:[],view:'play',index:0,draft:''},
    b:{cases:{},notes:[],view:'task',index:0,draft:''},
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
