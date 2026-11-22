// #342 P008: 28 exact native roundwork positions, development candidate only.
// Immutable original task signatures; no manifest, feedback, grade, source graph or State-v2 edits.
import * as native from './phase5/b08-model.js';
import {hasExactKeys as keys,isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,sameEvidence as same} from './evidence-contract.js';
const reviewed = [
  {
    "sessionId": "roundwhole",
    "index": 0,
    "nodeId": "mt_NLSfvB9vUl",
    "type": "x-roundwork",
    "taskHash": "928a2d8e48b61a40b8c0fac5f0cb5c108f9d17e5fc519e8be811ffbf8d8bffe1",
    "task": {
      "type": "x-roundwork",
      "values": [
        "4367"
      ],
      "unit": "10",
      "prompt": "4367离哪个整十更近？找相邻两站，放点，再记结果。"
    }
  },
  {
    "sessionId": "roundwhole",
    "index": 1,
    "nodeId": "mt_NLSfvB9vUl",
    "type": "x-roundwork",
    "taskHash": "7ce8c29c11416d073cefd7114ae4a05dc5777f39ae110c6c4eed80aa6ea7818d",
    "task": {
      "type": "x-roundwork",
      "values": [
        "4367"
      ],
      "unit": "100",
      "prompt": "仍从原来的4367出发，这次报到整百。"
    }
  },
  {
    "sessionId": "roundwhole",
    "index": 2,
    "nodeId": "mt_NLSfvB9vUl",
    "type": "x-roundwork",
    "taskHash": "2290f7ce9b274df53a82fd6107d5df3c3359e9c831bc67d83ded49522d8ef916",
    "task": {
      "type": "x-roundwork",
      "values": [
        "4367"
      ],
      "unit": "1000",
      "prompt": "仍用4367，这次报到整千。"
    }
  },
  {
    "sessionId": "roundwhole",
    "index": 3,
    "nodeId": "mt_NLSfvB9vUl",
    "type": "x-roundwork",
    "taskHash": "c19bc70c9a286e9d12cb3c09022a2da0e1d0379ff86bbcd55d881f0c474a7c42",
    "task": {
      "type": "x-roundwork",
      "values": [
        "347",
        "281"
      ],
      "unit": "100",
      "prompt": "估算两组人数。各自报到整百，再加起来。",
      "calc": "+"
    }
  },
  {
    "sessionId": "placeproblems",
    "index": 0,
    "nodeId": "mt__sMrmOv3bx",
    "type": "x-roundwork",
    "taskHash": "1aea320e4e64d626f6e0c86124dfbd3d0339d2e58bbbfe4965bdd748ed5491d1",
    "task": {
      "type": "x-roundwork",
      "values": [
        "4682"
      ],
      "unit": "1000",
      "prompt": "模拟活动预报4682人。用整千人数报个大概。"
    }
  },
  {
    "sessionId": "bigproblems",
    "index": 1,
    "nodeId": "mt_xMt1TLTs--",
    "type": "x-roundwork",
    "taskHash": "38ae2ab3765742007eaa7c84a78dab23d343f49cbbb5300f3a8469adda057dff",
    "task": {
      "type": "x-roundwork",
      "values": [
        "67450"
      ],
      "unit": "1000",
      "prompt": "模拟球场有67450个座位。按整千报容量。"
    }
  },
  {
    "sessionId": "roundlarge",
    "index": 0,
    "nodeId": "mt_5NwqN6pf_A",
    "type": "x-roundwork",
    "taskHash": "cf6c09b359983f41581bf752154e6d0efc2bf8a8d0087c74f6deb750eafc86ec",
    "task": {
      "type": "x-roundwork",
      "values": [
        "456782"
      ],
      "unit": "10000",
      "prompt": "456782报到整万，离哪站近？"
    }
  },
  {
    "sessionId": "roundlarge",
    "index": 1,
    "nodeId": "mt_5NwqN6pf_A",
    "type": "x-roundwork",
    "taskHash": "18d580a89c4e37929ffe85dcc6256d808dd0578dce2256d652218677019ffb61",
    "task": {
      "type": "x-roundwork",
      "values": [
        "950500"
      ],
      "unit": "100000",
      "prompt": "950500报到十万。点越过中点了吗？"
    }
  },
  {
    "sessionId": "roundlarge",
    "index": 2,
    "nodeId": "mt_5NwqN6pf_A",
    "type": "x-roundwork",
    "taskHash": "7781480a305cdacde5ce6773e32474456475499d27b15a21a514dc67652fbd8d",
    "task": {
      "type": "x-roundwork",
      "values": [
        "387412",
        "214560"
      ],
      "unit": "10000",
      "prompt": "先各自报到整万，再估这两数的和。",
      "calc": "+"
    }
  },
  {
    "sessionId": "tenmillion",
    "index": 0,
    "nodeId": "mt_XNmGwNggdU",
    "type": "x-roundwork",
    "taskHash": "d2723bb357676a33fe6781617e8e0dc7130e40af0b2026a041a67ac2581a7d10",
    "task": {
      "type": "x-roundwork",
      "values": [
        "8274500"
      ],
      "unit": "1000000",
      "prompt": "模拟城市有8274500人，按整百万报个大概。"
    }
  },
  {
    "sessionId": "tenmillion",
    "index": 2,
    "nodeId": "mt_XNmGwNggdU",
    "type": "x-roundwork",
    "taskHash": "a6463dc6e211c53294fc3a8223dacff8c0c9154154613903fd8d16687549dc52",
    "task": {
      "type": "x-roundwork",
      "values": [
        "827450",
        "614200",
        "983600"
      ],
      "unit": "100000",
      "prompt": "三次模拟活动的人次，分别报到十万，再估总人次。",
      "calc": "+"
    }
  },
  {
    "sessionId": "rounddecimal",
    "index": 0,
    "nodeId": "mt_Fl7b8q9pI1",
    "type": "x-roundwork",
    "taskHash": "38ab2b57fa6c03b1073b5420b4503f004bd5e49e7d47b6f4867bdd8ca85231a7",
    "task": {
      "type": "x-roundwork",
      "values": [
        "3.7"
      ],
      "unit": "1",
      "prompt": "把3.7放在相邻整站间，报到最近整数。"
    }
  },
  {
    "sessionId": "rounddecimal",
    "index": 1,
    "nodeId": "mt_Fl7b8q9pI1",
    "type": "x-roundwork",
    "taskHash": "20188e027718c11ebe820bdd27fc4289677985b2a01d86962fc53d6585a79695",
    "task": {
      "type": "x-roundwork",
      "values": [
        "3.2"
      ],
      "unit": "1",
      "prompt": "换成3.2，哪边更近？"
    }
  },
  {
    "sessionId": "rounddecimal",
    "index": 2,
    "nodeId": "mt_Fl7b8q9pI1",
    "type": "x-roundwork",
    "taskHash": "cde8edc609303f821a906fc9b266096b9c118441ec449374b379f75c1802ff1c",
    "task": {
      "type": "x-roundwork",
      "values": [
        "6.5"
      ],
      "unit": "1",
      "prompt": "6.5恰好一半。这次按一半取较大数的约定。"
    }
  },
  {
    "sessionId": "rounddecimal",
    "index": 3,
    "nodeId": "mt_Fl7b8q9pI1",
    "type": "x-roundwork",
    "taskHash": "439e19d3577a822ede6e8abd4180c53a851b086c8d9357c12268eed98d3dc6a8",
    "task": {
      "type": "x-roundwork",
      "values": [
        "8.4"
      ],
      "unit": "1",
      "prompt": "换一个数8.4，再独立做一次。"
    }
  },
  {
    "sessionId": "roundtenths",
    "index": 0,
    "nodeId": "mt_Ii1hV4V5ql",
    "type": "x-roundwork",
    "taskHash": "a147b25abd57f10a6c9a00ea27cc619fb0ae5e6163ba2ff76561d1f2b4e72eee",
    "task": {
      "type": "x-roundwork",
      "values": [
        "3.47"
      ],
      "unit": "1",
      "prompt": "3.47直接报到整数。"
    }
  },
  {
    "sessionId": "roundtenths",
    "index": 1,
    "nodeId": "mt_Ii1hV4V5ql",
    "type": "x-roundwork",
    "taskHash": "9ec3c7f5cfb5646bee4fe4c040619878e47c8174746699943ddebb3791d5709e",
    "task": {
      "type": "x-roundwork",
      "values": [
        "3.47"
      ],
      "unit": "0.1",
      "prompt": "从原数3.47重新出发，保留一位小数。"
    }
  },
  {
    "sessionId": "roundtenths",
    "index": 2,
    "nodeId": "mt_Ii1hV4V5ql",
    "type": "x-roundwork",
    "taskHash": "1a1e0ce5f925b6007be48e8350b99a33155de5681176fe429bab8f6edec617e4",
    "task": {
      "type": "x-roundwork",
      "values": [
        "12.95"
      ],
      "unit": "0.1",
      "prompt": "12.95取一位小数。进到13时，也留下表示精度的0。"
    }
  },
  {
    "sessionId": "roundtenths",
    "index": 3,
    "nodeId": "mt_Ii1hV4V5ql",
    "type": "x-roundwork",
    "taskHash": "847f721f11938232739b63ff65d94d13f4208a3bb628f10a6b2d33ecf18db109",
    "task": {
      "type": "x-roundwork",
      "values": [
        "4.83",
        "2.17"
      ],
      "unit": "1",
      "prompt": "各自报到整数后估计相加。再算准确和，比一比，两者也可能相同。",
      "calc": "+",
      "exact": true
    }
  },
  {
    "sessionId": "roundprecise",
    "index": 0,
    "nodeId": "mt__casygEB85",
    "type": "x-roundwork",
    "taskHash": "b0efb062f766d159072e82132b340242e7948d122ef9011e730abf1da721868b",
    "task": {
      "type": "x-roundwork",
      "values": [
        "3.4567"
      ],
      "unit": "0.01",
      "prompt": "3.4567保留两位小数。一次找最近的百分位。"
    }
  },
  {
    "sessionId": "roundprecise",
    "index": 1,
    "nodeId": "mt__casygEB85",
    "type": "x-roundwork",
    "taskHash": "461fcb9c3926c5e1468061c9d5e94de232e5efc4906df28b69fe91d201fda3fd",
    "task": {
      "type": "x-roundwork",
      "values": [
        "7654321"
      ],
      "unit": "100000",
      "prompt": "7654321报到十万。"
    }
  },
  {
    "sessionId": "roundprecise",
    "index": 2,
    "nodeId": "mt__casygEB85",
    "type": "x-roundwork",
    "taskHash": "42796d824bf617e4590ab176c8b39382c6065230b9719d111d958c77aa2891b2",
    "task": {
      "type": "x-roundwork",
      "values": [
        "4.83",
        "2.17"
      ],
      "unit": "1",
      "prompt": "先各自报到整数，再估乘积。这个估计不是准确乘积。",
      "calc": "*"
    }
  },
  {
    "sessionId": "accuracy",
    "index": 0,
    "nodeId": "mt_U9sme87C32",
    "type": "x-roundwork",
    "taskHash": "a94a1f8afcd3b3d9cd6e5e1236c26528830fa16b2b3dbce47c2495d4f576757e",
    "task": {
      "type": "x-roundwork",
      "values": [
        "0.004982"
      ],
      "unit": "0.01",
      "prompt": "把0.004982保留两位小数。点后数两位。"
    }
  },
  {
    "sessionId": "accuracy",
    "index": 1,
    "nodeId": "mt_U9sme87C32",
    "type": "x-roundwork",
    "taskHash": "a34983a57c9d361ce35e17dd6c1d29fc034cf3d830c51c0f555cdac505eddbd2",
    "task": {
      "type": "x-roundwork",
      "values": [
        "0.004982"
      ],
      "unit": "0.0001",
      "prompt": "同一个0.004982，这次从第一个非零数字开始，留下两个有用的数字。先点出它们。",
      "sf": 2
    }
  },
  {
    "sessionId": "accuracy",
    "index": 2,
    "nodeId": "mt_U9sme87C32",
    "type": "x-roundwork",
    "taskHash": "e6cb865b3484f00dc76762b055e68edf22105c5d75d335ff88608bcfb0e01897",
    "task": {
      "type": "x-roundwork",
      "values": [
        "2.895"
      ],
      "unit": "0.01",
      "prompt": "把2.895留下三个有效数字。进位后，末尾的0也留下。",
      "sf": 3
    }
  },
  {
    "sessionId": "accuracy",
    "index": 3,
    "nodeId": "mt_U9sme87C32",
    "type": "x-roundwork",
    "taskHash": "dbd8f360e6cecc4730ea39f2cc814fcd33f1c363d7ffd478f19e6380902bace7",
    "task": {
      "type": "x-roundwork",
      "values": [
        "2.736"
      ],
      "unit": "0.01",
      "prompt": "要按这把卷尺的最小刻度0.01米记录2.736米。先选合适的记录间隔，再取近似值。",
      "units": [
        "1",
        "0.1",
        "0.01"
      ]
    }
  },
  {
    "sessionId": "accuracy",
    "index": 4,
    "nodeId": "mt_U9sme87C32",
    "type": "x-roundwork",
    "taskHash": "195e0ca4cc98bb39ff0c2fac6c8a49355bca3fdc18df153a1e8a909732fa93ff",
    "task": {
      "type": "x-roundwork",
      "values": [
        "34962"
      ],
      "unit": "1000",
      "prompt": "让34962留下两个有效数字。其他位置用0保住大小。",
      "sf": 2
    }
  },
  {
    "sessionId": "estbounds",
    "index": 0,
    "nodeId": "mt_VVn1IXjkzn",
    "type": "x-roundwork",
    "taskHash": "a92bd1455aa8488701611f89f3a3fbc93c9495aaa37417e10c403ab45f61479d",
    "task": {
      "type": "x-roundwork",
      "values": [
        "49.7",
        "20.2"
      ],
      "unit": "1",
      "prompt": "这两块模拟材料总长大约多少？各报到整数，再估总长。",
      "calc": "+"
    }
  }
];

export const P008_ROUNDWORK_SOURCES = Object.freeze(reviewed.map(({task,...source})=>Object.freeze(source)));
const originalByPosition = new Map(reviewed.map(row=>[row.sessionId+':'+row.index,row]));
const Q = 1000000n;

// Independent base-ten arithmetic; native grading is an additional, not sole, check.
function ticks(raw) {
  if(typeof raw!=='string'&&typeof raw!=='number')return null;
  const s=String(raw);
  if(!/^\d+(?:\.\d{1,6})?$/.test(s))return null;
  const [whole,part='']=s.split('.');
  return BigInt(whole)*Q+BigInt(part.padEnd(6,'0'));
}
function display(n,places) {
  if(typeof n!=='bigint'||n<0n||!Number.isInteger(places)||places<0||places>6)return null;
  return String(n/Q)+(places?'.'+String(n%Q).padStart(6,'0').slice(0,places):'');
}
function roundOne(input,unit) {
  const value=ticks(input),spacing=ticks(unit);
  if(value===null||spacing===null||value<0n||spacing<=0n)return null;
  const low=(value/spacing)*spacing,high=low+spacing,offset=value-low;
  return {
    low,high,result:offset*2n<spacing?low:high,
    position:Number((offset*2000n+spacing)/(spacing*2n)),
    half:offset*2n===spacing
  };
}
function significantPositions(value,count) {
  const first=value.search(/[1-9]/),indexes=[];
  if(first<0)return null;
  for(let i=first;i<value.length&&indexes.length<count;i++)if(/[0-9]/.test(value[i]))indexes.push(i);
  return indexes.length===count?indexes:null;
}
export function p008RoundworkBinding(task,context={}) {
  if(!isEvidenceContext(context))return null;
  const row=originalByPosition.get(context.sessionId+':'+context.index);
  if(!row||!same(row.task,task)||!matchesNativeEvidenceTask(task,context,row))return null;
  return {position:context.sessionId+':'+context.index,nodeId:row.nodeId,
    type:row.type,taskHash:row.taskHash,method:null,strictAApproved:false};
}
export function replayP008RoundworkEvidence(task,model,context={}) {
  try{
    const source=p008RoundworkBinding(task,context);
    if(!source||!keys(model,Object.keys(native.initial(task)))||
       !native.valid(task,model)||model.unit!==task.unit||
       !Array.isArray(model.steps)||model.steps.length!==task.values.length)return null;
    const unit=ticks(task.unit),places=task.unit.includes('.')?task.unit.split('.')[1].length:0;
    if(!unit||places>6||!Array.isArray(model.sig))return null;
    const expectedSig=task.sf?significantPositions(task.values[0],task.sf):[];
    if(!expectedSig||!same([...model.sig].sort((a,b)=>a-b),expectedSig))return null;
    const independentlyRounded=[],bounds=[];
    for(let i=0;i<task.values.length;i++){
      const step=model.steps[i],math=roundOne(task.values[i],task.unit);
      if(!math||!keys(step,['low','high','mark','touched','result'])||
         step.touched!==true||ticks(step.low)!==math.low||ticks(step.high)!==math.high||
         step.result!==display(math.result,places)||
         !Number.isInteger(step.mark)||Math.abs(step.mark-math.position)>6||
         (math.position===500?step.mark!==500:math.position<500?step.mark>=500:step.mark<=500))return null;
      independentlyRounded.push(math.result);
      bounds.push({low:display(math.low,places),high:display(math.high,places),
        mark:step.mark,midpointTie:math.half,rounded:step.result});
    }
    let approx=null,exact=null,relation=null;
    if(task.calc){
      approx=task.calc==='*'?
        independentlyRounded[0]*independentlyRounded[1]/Q:
        independentlyRounded.reduce((a,b)=>a+b,0n);
      if(ticks(model.estimate)!==approx)return null;
    }else if(model.estimate!=='')return null;
    if(task.exact){
      exact=task.values.map(ticks).reduce((a,b)=>a+b,0n);
      relation=approx===exact?'=':approx<exact?'<':'>';
      if(ticks(model.exact)!==exact||model.relation!==relation)return null;
    }else if(model.exact!==''||model.relation!=='')return null;
    if(!native.inspect(task,model).correct)return null;
    return {kind:'p008-native-roundwork-final-construction',source,
      verifiedOriginalPositions:task.values.length,observedFinalSliderMarks:bounds,
      calculatedEstimate:approx===null?null:display(approx,6),
      calculatedExact:exact===null?null:display(exact,6),
      estimateRelation:relation,significantDigitIndexes:expectedSig,
      actionSequenceObserved:false,freeStrategyObserved:false,
      childrenMasteryAssessed:false,strictAApproved:false};
  }catch{return null;}
}
export function submittedP008RoundworkEvidence(task,model,record,context={}) {
  return latestSubmissionMatches(model,record)?
    replayP008RoundworkEvidence(task,model,context):null;
}
