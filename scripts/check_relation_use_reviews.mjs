import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {TASKS} from '../dist/learning/tasks.js';
import {BRIDGES} from '../dist/learning/bridges.js';

const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
export const REVIEW_FILES=['dist/learning/bridges.js','dist/learning/catalog.js','dist/learning/tasks.js','dist/learning/state.js','dist/learning/learn.js','dist/learning/phase4/engine.js','dist/learning/phase4/b03.js','dist/learning/phase4/b03-model.js','dist/learning/phase4/b03-view.js','dist/learning/phase5/b13.js','dist/learning/phase5/b13-model.js','dist/learning/phase5/b13-view.js','dist/learning/phase5/b16.js','dist/learning/phase5/b16-model.js','dist/learning/phase5/b16-view.js','dist/learning/phase5/b17.js','dist/learning/phase5/b17-model.js','dist/learning/phase5/b17-view.js','dist/learning/phase5/b38.js','dist/learning/phase5/b38-model.js','dist/learning/phase5/b38-view.js','dist/learning/phase5/b39.js','dist/learning/phase5/b39-model.js','dist/learning/phase5/b39-view.js'];
export const codeHashes=()=>Object.fromEntries(REVIEW_FILES.map(p=>[p,hash(fs.readFileSync(p))]));

// A matching identifier alone does not prove coverage. These checks keep the
// locally documented evidence attached to the same source and task code.
export function validateRelationReviews(review,inventory,tasks=TASKS,bridges=BRIDGES,code=codeHashes()){
  assert.equal(review.schema,'math-relation-use-review/1');
  assert.deepEqual(Object.keys(review.codeFingerprints).sort(),[...REVIEW_FILES].sort(),'review implementation files missing');
  for(const p of REVIEW_FILES)assert.equal(review.codeFingerprints[p],code[p],`implementation changed; review ${p}`);
  const nodes=new Map(inventory.nodes.map(n=>[n.id,n])),edges=new Map(inventory.edges.map(e=>[`${e.from}>${e.to}`,e])),seen=new Set();
  const counts={'joint-limited':0,'endpoint-limited':0,'insufficient':0};
  for(const r of review.records){
    const key=`${r.from}>${r.to}`,edge=edges.get(key);assert.ok(edge,`unknown source edge ${key}`);assert.ok(!seen.has(key),`duplicate review ${key}`);seen.add(key);
    assert.equal(r.sourceFingerprint,hash(JSON.stringify([edge.from,edge.to,edge.strength,edge.sourceReason,edge.localReason])),`source changed; review ${key}`);
    assert.ok(Object.hasOwn(counts,r.classification),`unknown classification ${key}`);counts[r.classification]++;
    assert.equal(r.independentMathematicalReview,'pending');assert.ok(r.note&&Array.isArray(r.evidence)&&r.evidence.length,`missing evidence ${key}`);
    const endpointIds=[nodes.get(r.from)?.lessonId,nodes.get(r.to)?.lessonId],jointIds=edge.jointActivities.map(a=>a.id),used=new Set();let jointUsed=false;
    for(const evidence of r.evidence){
      assert.ok(!used.has(evidence.key),`duplicate task ${evidence.key}`);used.add(evidence.key);
      const match=/^(.+):(\d+)$/.exec(evidence.key);assert.ok(match,`invalid task key ${evidence.key}`);
      const id=match[1],index=Number(match[2]),task=tasks[id]?.[index]??bridges[id]?.tasks?.[index];
      assert.ok(task&&[...endpointIds,...jointIds].includes(id),`unbound task ${evidence.key}`);
      assert.equal(evidence.sha256,hash(JSON.stringify(task)),`task changed; review ${evidence.key}`);
      if(jointIds.includes(id))jointUsed=true;
    }
    if(r.classification==='joint-limited')assert.ok(jointUsed,`joint evidence missing ${key}`);
    else assert.equal(jointIds.length,0,`existing joint activity requires review ${key}`);
  }
  return {sourceEdges:edges.size,reviewed:seen.size,unreviewed:edges.size-seen.size,...counts,independentMathematicalReview:'pending'};
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===fs.realpathSync(process.argv[1])){
  const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
  console.log(JSON.stringify(validateRelationReviews(read('docs/spatial-learning/relation-use-review.json'),read('docs/spatial-learning/inventory.json'))));
}
