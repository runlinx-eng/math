import {fields,initial,number,stats,valid} from './phase5/b21-model.js';
import {rational} from './phase5/b16-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P110D_SOURCES=Object.freeze([
  {
    "sessionId": "meandistance",
    "index": 2,
    "nodeId": "mt_ZfpeI1CFyP",
    "type": "x-distribution",
    "taskHash": "04c772ee94c7ee5394f6175dc346a89a1bff3f3246b1cfb46eb74bd5551a3c0a"
  },
  {
    "sessionId": "averagestory",
    "index": 2,
    "nodeId": "mt_XSXnTQoQ4l",
    "type": "x-distribution",
    "taskHash": "cad364947b111c05617ec302ba7597fec3e5efe4b7f99cdc5258bf338de46ad3"
  },
  {
    "sessionId": "distributionlook",
    "index": 0,
    "nodeId": "mt_OwYms2tB1L",
    "type": "x-distribution",
    "taskHash": "4092e65b294b8f0897eaf23d913bb2c6040cc3ce75c37edb949b67d599ce0a85"
  },
  {
    "sessionId": "distributionlook",
    "index": 1,
    "nodeId": "mt_OwYms2tB1L",
    "type": "x-distribution",
    "taskHash": "9d620117f16fd1290cbb6d3fd2ef255f32378d4db8709b9c6c91b5466dda6948"
  },
  {
    "sessionId": "digitalsets",
    "index": 2,
    "nodeId": "mt_mn765HbXi1",
    "type": "x-distribution",
    "taskHash": "4f74fc5ab103cb2cfe11d2230a491bab1b29d553e51ff8d0b790923d073fceb0"
  },
  {
    "sessionId": "comparepeople",
    "index": 0,
    "nodeId": "mt_km4V6d5IAh",
    "type": "x-distribution",
    "taskHash": "d780c35776afa45e6e13bad1d0bbbdbf7541e2e055eed5d3059c2d0c70ad2218"
  },
  {
    "sessionId": "comparepeople",
    "index": 2,
    "nodeId": "mt_km4V6d5IAh",
    "type": "x-distribution",
    "taskHash": "9d9f1b50f15f3cdfc3943728f9b613a163774ea4025ff62c69b07d3f93b99d01"
  },
  {
    "sessionId": "comparegap",
    "index": 0,
    "nodeId": "mt_A2hKhHXgL5",
    "type": "x-distribution",
    "taskHash": "e3e0c9cec74b96ea3f7dd76f956d9e5fd95db7e97c7c65112ffcff0ffe676acf"
  },
  {
    "sessionId": "comparegap",
    "index": 1,
    "nodeId": "mt_A2hKhHXgL5",
    "type": "x-distribution",
    "taskHash": "1916e9ffa811cded6c1e8899d6f289eb9de4b44243342bf81ef225e22c27bf8c"
  },
  {
    "sessionId": "comparegap",
    "index": 2,
    "nodeId": "mt_A2hKhHXgL5",
    "type": "x-distribution",
    "taskHash": "2a819f16f73aee32bfd9f29f3d5eda9bcf789fa71d227a1ff99b43ab7205e171"
  }
].map(Object.freeze));

const keys=['lowA','highA','lowB','highB','outlier'];
function exact(raw,wanted) {
  if (!Number.isFinite(number(raw))||!Number.isFinite(wanted)) return false;
  const a=rational(raw),b=rational(wanted);
  return a!==null&&b!==null&&BigInt(a[0])*BigInt(b[1])===BigInt(b[0])*BigInt(a[1]);
}

function compare(a,b) {
  const x=stats(a),y=stats(b);
  const overlap=[Math.max(x.min,y.min),Math.min(x.max,y.max)];
  return {
    ranges:[[x.min,x.max],[y.min,y.max]],
    means:[x.mean,y.mean],medians:[x.median,y.median],modes:[x.modes,y.modes],
    distances:[x.mad,y.mad],overlap:overlap[0]<=overlap[1]?overlap:null,
  };
}

export function p110dDistributionRangeBinding(task,context) {
  const row=P110D_SOURCES.find(s=>s.sessionId===context?.sessionId&&s.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p110d-distribution-range',method:null,
    question:'从同一把尺上看，两组的范围、重叠或远点分别在哪里？'};
}

export function replayP110DDistributionRangeEvidence(task,model,context) {
  try {
    const binding=p110dDistributionRangeBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const allFieldKeys=Object.keys(fields(task));
    let {board}=initial(task);
    let markedFields=null;
    for (const e of model.history) {
      if (!hasExactKeys(e,['a','f','d'])||!hasExactKeys(e.d,[])) return null;
      const wanted=e.a==='mark'?keys:[];
      if (!(hasExactKeys(e.f,wanted)||hasExactKeys(e.f,allFieldKeys))) return null;
      board.first[e.a+'-0']??=e.f;
      if (e.a==='mark') {
        markedFields=e.f;
        board.marked=Object.fromEntries(keys.map(k=>{
          const value=number(e.f[k]);
          return [k,Number.isFinite(value)?value:null];
        }));
      } else if (e.a==='swap'&&task.swap&&!board.swapped) {
        [board.a,board.b]=task.alternate;
        board.swapped=true;
        board.marked=false;
        markedFields=null;
      } else if (e.a==='reset') {
        board={...initial(task).board,first:board.first};
        markedFields=null;
      } else return null;
    }
    if (!markedFields||!sameEvidence(board,model.board)||(task.swap&&!board.swapped)) return null;
    const cluster=task.mode==='cluster';
    const activeKeys=cluster?['lowA','highA','outlier']:keys.slice(0,4);
    if (!activeKeys.every(k=>exact(model[k],board.marked[k])&&
        exact(markedFields[k],board.marked[k]))) return null;
    let observation;
    if (cluster) {
      const {lowA,highA,outlier}=board.marked;
      const points=board.a.filter(v=>lowA<=v&&v<=highA);
      if (lowA<0.2||lowA>task.cluster[0]||highA<task.cluster[1]||highA>0.5||
          outlier!==task.unusual||points.length!==board.a.length-1||
          board.a.filter(v=>v<lowA||v>highA)[0]!==outlier) return null;
      observation={cluster:[lowA,highA],outlier,clusterCount:points.length,total:board.a.length};
    } else {
      const comparison=compare(board.a,board.b);
      if (!sameEvidence(comparison.ranges,[
        [board.marked.lowA,board.marked.highA],[board.marked.lowB,board.marked.highB],
      ])) return null;
      observation=board.swapped?{...comparison,beforeSwap:compare(task.a,task.b)}:comparison;
    }
    if (!(task.questions||[]).every((q,i)=>Array.isArray(q.value)
      ? q.value.includes(model.answers[i])
      : exact(model.answers[i],q.value))) return null;
    return {...binding,observation,answered:task.questions.length};
  } catch {
    return null;
  }
}

export function submittedP110DDistributionRangeEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP110DDistributionRangeEvidence(task,model,context):null;
}
