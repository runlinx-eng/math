import {initial, inspect, number, valid} from './phase5/b24-model.js';
import {
  hasExactKeys,
  isEvidenceContext,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

const sessionId = 'mirrorfold';
const nodeId = 'mt_hR2Y7NhMSY';
const type = 'x-p24-mirror';
const kind = 'p101-axis-mirror';
const line = 'y';
const domain = [-6,6,-1,7];
const reviewed = [
  {
    taskHash:'40f8eab798f40af53c9e0bcf223b65f7cfa1f0ad144df855adfd5dfcfd9a067f',
    task:{
      type,
      prompt:'沿竖线把右边的点翻到左边，再折过去检查。',
      half:[[0,0],[2,1],[3,3],[0,4]],
      line,domain,
      questions:[{label:'对应点离镜线',value:'equal',options:[['equal','垂直距离相等'],['samey','只需在同一边']]}]
    }
  },
  {
    taskHash:'a46791954d61e3a9ea3e4b6c53bdbf49d7294ae820d1e4a5c7aeb4ae0c8e7cd4',
    task:{
      type,
      prompt:'换一半翅膀，找出镜线另一侧的对应点。',
      half:[[0,1],[1,2],[3,4],[0,5]],
      line,domain,
      questions:[{label:'画在镜线另一侧的点有几个',value:2}]
    }
  },
  {
    taskHash:'4e81e54df8a8b4b6e369fc53a5fe22380e0293f4d727b3c9ab2c1c60b084215a',
    task:{
      type,
      prompt:'这次从左半边补全，观察翻过去是否重合。',
      half:[[0,0],[-2,1],[-3,3],[0,5]],
      line,domain,
      questions:[{label:'折回检查',value:'match',options:[['match','对应部分完全重合'],['area','只要面积一样']]}]
    }
  }
];

export const P101_SOURCES = Object.freeze(reviewed.map(({taskHash},index) =>
  Object.freeze({sessionId,index,nodeId,type,taskHash})
));

export function p101AxisMirrorBinding(task,context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId ||
      !sameEvidence(task,reviewed[context.index]?.task) ||
      !matchesNativeEvidenceTask(task,context,{type,nodeId})) return null;
  return {nodeId,kind,method:null,question:'折过竖轴后，每个原点和对应点的横、纵坐标有什么关系？'};
}

// The source accepts integers written as decimals, fractions or mixed numbers.
function isExactInteger(raw, value) {
  const text = raw.trim();
  const integer = /^(-?\d+)(?:\.0+)?$/.exec(text);
  if (integer) return BigInt(integer[1]) === BigInt(value);
  const fraction = /^(-?\d+)(?:\s+(\d+))?\/(\d+)$/.exec(text);
  if (!fraction) return false;
  const [, leading, part, divisor] = fraction;
  const bottom = BigInt(divisor);
  const top = part === undefined ? BigInt(leading) :
    BigInt(leading) * bottom + (leading.startsWith('-') ? -1n : 1n) * BigInt(part);
  return bottom > 0n && top === BigInt(value) * bottom;
}

const pointKey = point => point.join(',');

export function replayP101AxisMirrorEvidence(task,model,context) {
  try {
    const binding = p101AxisMirrorBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task,1))) || !valid(task,model) ||
        model.issue !== '' || !model.history.length ||
        Object.keys(model.history).length !== model.history.length) return null;

    const [xmin,xmax,ymin,ymax] = task.domain;
    const width = xmax-xmin+1, height = ymax-ymin+1;
    const mappings = task.half.map(([x,y]) => ({original:[x,y],image:[x === 0 ? 0 : -x,y],fixed:x === 0}));
    const given = new Set(task.half.map(pointKey));
    const targets = new Set(mappings.filter(mapping => !mapping.fixed).map(mapping => pointKey(mapping.image)));
    const placed = [], events = [];
    let fold = null;
    for (const [index,event] of model.history.entries()) {
      if (!hasExactKeys(event,['a','f','d'])) return null;
      const {a,f,d} = event;
      if (a === 'fold' || a === 'undo') {
        if (!hasExactKeys(f,[]) || !hasExactKeys(d,[])) return null;
        if (a === 'undo') {
          events.push({index,action:a,removed:placed.pop() || null});
          fold = null;
        } else {
          const matched = placed.length === targets.size && placed.every(point => targets.has(pointKey(point)));
          fold = {index,action:a,matched,points:placed.map(point => [...point])};
          events.push(fold);
        }
        continue;
      }

      let x,y;
      if (a === 'dot') {
        if (!hasExactKeys(f,[]) || !hasExactKeys(d,['index']) || !/^(0|[1-9]\d*)$/.test(d.index)) return null;
        const cell = Number(d.index);
        if (cell >= width*height) return null;
        x = xmin + cell % width;
        y = ymin + Math.floor(cell / width);
      } else if (a === 'plot' && hasExactKeys(f,['x','y']) && hasExactKeys(d,[])) {
        x = number(f.x);
        y = number(f.y);
      } else return null;

      const point = [x,y], key = pointKey(point);
      const inGrid = Number.isInteger(x) && Number.isInteger(y) && x>=xmin && x<=xmax && y>=ymin && y<=ymax;
      const accepted = inGrid && placed.length<16 && !given.has(key) &&
        !placed.some(existing => pointKey(existing) === key);
      if (accepted) {
        if (a === 'plot' && (!isExactInteger(f.x,x) || !isExactInteger(f.y,y))) return null;
        placed.push(point);
        fold = null;
      }
      events.push({index,action:a,point:inGrid ? point : null,accepted});
    }

    if (!fold?.matched || !model.board.folded || !sameEvidence(placed,model.board.placed) ||
        !task.questions.every((q,i) => q.options ? model.answers[i] === q.value :
          q.value === targets.size && isExactInteger(model.answers[i],targets.size)) ||
        !inspect(task,model).correct) return null;
    return {
      kind,nodeId,sessionId,index:context.index,
      axis:'x=0',mappings,placed,fold,events,
      physicalFoldingAssessed:false,
      learnerMasteryAssessed:false
    };
  } catch {
    return null;
  }
}

export function submittedP101AxisMirrorEvidence(task,model,record,context) {
  if (!latestSubmissionMatches(model,record)) return null;
  return replayP101AxisMirrorEvidence(task,model,context);
}
