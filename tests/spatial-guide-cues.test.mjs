import test from 'node:test';
import assert from 'node:assert/strict';
import {placeGuideCue,overlaps} from '../dist/spatial-labels.js';

const arrange=(points,viewport,blocked=[])=>{
  const occupied=[...blocked],placed=[];
  for(const p of points){
    const rect=placeGuideCue({...p,viewport,occupied});
    assert.ok(rect,'every guide cue has a visible location');
    assert.ok(!occupied.some(o=>overlaps(o,rect,10)),'all guide cues are independently clickable');
    assert.ok(rect.x>=14&&rect.y>=152&&rect.x+rect.w<=viewport.w-92&&rect.y+rect.h<=viewport.h-105);
    occupied.push(rect);placed.push(rect);
  }
  return placed;
};

test('a tightly clustered fork yields two non-overlapping clickable targets',()=>{
  const viewport={w:1440,h:900},panel={x:30,y:155,w:228,h:210};
  const input=[{x:805,y:600,w:158,h:66},{x:818,y:614,w:170,h:66}];
  const placed=arrange(input,viewport,[panel]);
  assert.ok(!overlaps(placed[0],placed[1],10));
  assert.deepEqual(arrange(input,viewport,[panel]),placed,'layout is stable for the same camera');
});

test('guide targets avoid the instruction panel without moving graph coordinates',()=>{
  const viewport={w:900,h:720},panel={x:30,y:155,w:228,h:250};
  const input=[{x:220,y:270,w:160,h:65},{x:235,y:275,w:160,h:65},{x:250,y:285,w:165,h:65}];
  const original=structuredClone(input);
  arrange(input,viewport,[panel]);
  assert.deepEqual(input,original,'cue layout must not modify source screen projections');
});

test('screen-edge targets remain inside an ordinary desktop viewport',()=>{
  const viewport={w:800,h:600};
  arrange([{x:75,y:570,w:148,h:65},{x:780,y:175,w:150,h:65}],viewport,[{x:20,y:155,w:200,h:160}]);
});
