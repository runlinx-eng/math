import {number} from './phase5/b20-model.js';
import {initial, inspect, valid} from './phase5/b30-model.js';
import {
  hasExactKeys,
  isEvidenceContext,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

const sessionId = 'solidSurface';
const nodeId = 'mt_Sij9ByyHq6';
const type = 'x-a30-solid';
const index = 1;
const taskHash = '970821d3a492aa3c68cf9ed73f66707a082c8bd5758f8f2f864350bb5f544e10';
const reviewed = {
  type,kind:'stack',prompt:'2 cm 小立方体贴在 4×4×2 cm 的方块上。先分开再接上，找出外面与里面。',
  unit:'cm',faces:[
    {name:'下面的底面',dims:'4×4',area:16},
    {name:'下面四个侧面',dims:'4×8',area:32},
    {name:'下面露出的顶面',dims:'16−4',area:12},
    {name:'上面小块顶面',dims:'2×2',area:4},
    {name:'上面四个侧面',dims:'4×4',area:16}
  ],requiredFaces:[0,1,2,3,4],surface:80,canSplit:true,volumeRequired:true,baseArea:null,
  volume:40,calculations:[
    {label:'下面一块的体积',value:32},
    {label:'上面一块的体积',value:8}
  ],questions:[
    {label:'分开时两块表面积合起来',value:88},
    {label:'贴合时藏起来的两个面一共',value:8}
  ]
};

export const P086_SOURCES = Object.freeze([Object.freeze({sessionId,index,nodeId,type,taskHash})]);

export function p086JoinedSolidSurfacesBinding(task,context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId || context.index !== index ||
      !sameEvidence(task,reviewed) || !matchesNativeEvidenceTask(task,context,{type,nodeId})) return null;
  return {nodeId,kind:'p086-joined-solid-surfaces',method:null,
    question:'接合时哪两片面不再露在外面？为什么接合不改变两块占的体积？'};
}

function dimensions() {
  const [length,width,height] = [4,4,2];
  const side = 2;
  const bottom = length*width;
  const lowerSides = 2*(length+width)*height;
  const contact = side*side;
  const upperSides = 4*side*side;
  const separateSurface = 2*bottom + lowerSides + 6*contact;
  const hiddenSurface = 2*contact;
  const exposedAreas = [bottom,lowerSides,bottom-contact,contact,upperSides];
  const surface = exposedAreas.reduce((sum,area) => sum+area,0);
  const volumes = [bottom*height,side**3];
  return {contact,hiddenSurface,separateSurface,exposedAreas,surface,volumes,volume:volumes[0]+volumes[1]};
}

export function replayP086JoinedSolidSurfacesEvidence(task,model,context) {
  try {
    const binding = p086JoinedSolidSurfacesBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        model.issue !== '' || !model.history.length ||
        Object.keys(model.history).length !== model.history.length) return null;

    const geometry = dimensions();
    const selected = new Set();
    const changes = [];
    let split = false;
    let turns = 0;
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','i','f']) || !hasExactKeys(event.f,[])) return null;
      if (event.a === 'face' && /^[0-4]$/.test(event.i)) {
        const index = Number(event.i);
        if (!selected.delete(index)) selected.add(index);
      } else if (event.a === 'turn' && event.i === '') {
        turns++;
      } else if (event.a === 'split' && event.i === '') {
        split = !split;
        changes.push({split,surface:split ? geometry.separateSurface : geometry.surface,
          volume:geometry.volume});
      } else {
        return null;
      }
    }
    if (!changes.length || split || !turns || !model.board.splitSeen ||
        !sameEvidence([...selected],model.board.selected) ||
        !sameEvidence([...selected].sort(),[0,1,2,3,4])) return null;

    const {contact,hiddenSurface,separateSurface,exposedAreas,surface,volumes,volume} = geometry;
    if (surface !== separateSurface-hiddenSurface ||
        !sameEvidence(model.faceValues.map(number),exposedAreas) ||
        !sameEvidence(model.calcValues.map(number),volumes) ||
        !sameEvidence(model.answers.map(number),[separateSurface,hiddenSurface]) ||
        number(model.area) !== surface || number(model.volume) !== volume ||
        model.unit !== 'cm²' || model.volumeUnit !== 'cm³' ||
        !inspect(task,model).correct) return null;
    return {binding,contact,hiddenSurface,separateSurface,exposedAreas,surface,volumes,volume,turns,changes};
  } catch {
    return null;
  }
}

export function submittedP086JoinedSolidSurfacesEvidence(task,model,record,context) {
  if (!latestSubmissionMatches(model,record)) return null;
  return replayP086JoinedSolidSurfacesEvidence(task,model,context);
}
