import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {WORKBENCH_BEATS,workbenchBeat,learningActionPlan,studyActionFocus} from '../dist/learning/workspace-flow.js';
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('B: four visual beats map existing stages without making a new gate',()=>{
 assert.deepEqual(WORKBENCH_BEATS.map(x=>x.id),['read','try','check','record']);
 for(const [stage,beat] of [['explore','try'],['revise','check'],['recheck','check'],['passed','check'],['reflect','record']])assert.equal(workbenchBeat(stage),beat);
 assert.equal(learningActionPlan({stage:'explore',readyToCheck:true}).primary.action,'check');
 assert.equal(learningActionPlan({stage:'explore',readyToCheck:false}).primary.disabled,true);
 assert.equal(studyActionFocus({stage:'explore',task:{type:'x-wideshift'},model:{committed:null}}).kind,'widget');
 assert.equal(learningActionPlan({stage:'reflect',hasDraft:false}).primary.action,'back');
});
test('B: one original workpiece, action bar, iframe and focus toggle',()=>{
 const html=source('dist/learn.html'),index=source('dist/index.html'),space=source('dist/space.js');
 for(const id of ['work','actions','learning-problem','learning-interaction','learning-check','learning-next','workbench-beats'])assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1);
 for(const id of ['journey-frame','workbench-focus-toggle'])assert.equal((index.match(new RegExp('id="'+id+'"','g'))||[]).length,1);
 const focus=space.slice(space.indexOf('function setWorkbenchForeground('),space.indexOf('function renderLearningMapContext('));
 assert.match(focus,/dataset\.workbenchForeground/);
 assert.doesNotMatch(focus,/replaceEmbeddedFrame\(|\.src\s*=|writeStored\(|scene\.select\(|setHash\(|setTaskSurfaceUrl\(|scheduleSave\(/);
 assert.match(space,/e\.data\.sessionId===activeSessionId\)setWorkbenchForeground\('learn'\)/);
});
