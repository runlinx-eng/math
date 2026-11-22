// #342 A-line P006: 31 exact original positions, 19 independently tested native contracts.
// Reuses development candidate math, negative cases, genuine native Check and State-v2.
// No same-type/sibling promotion: formal status is granted only by exact manifest rows.
import * as a from './p006a-category-frequency-count-evidence.js';
import * as b from './p006b-frequency-pair-ties-evidence.js';
import * as c from './p006c-native-frequency-scopes-evidence.js';
import * as d from './p006d-native-countif-records-evidence.js';
import * as e from './p006e-native-bounded-survey-plans-evidence.js';
import * as f from './p006f-native-inference-boundaries-evidence.js';
import * as g from './p006g-native-question-schema-evidence.js';
import * as h from './p006h-native-usage-vs-people-evidence.js';
import * as i from './p006i-native-studio-row-to-chart-evidence.js';
import * as j from './p006j-native-playground-three-day-usage-evidence.js';
import * as k from './p006k-native-simulated-survey-studio-evidence.js';
import * as l from './p006l-native-random-sample-record-evidence.js';
import * as m from './p006m-native-sampling-frame-contrast-evidence.js';
import * as n from './p006n-native-repeat-sampling-evidence.js';
import * as o from './p006o-native-club-vs-all-repeats-evidence.js';
import * as p from './p006p-native-sample-size-ranges-evidence.js';
import * as q from './p006q-native-sleep-means-vs-individual-evidence.js';
import * as r from './p006r-native-question-variation-evidence.js';
import * as s from './p006s-native-survey-frequency-evidence.js';
const declared=Object.freeze([
 {id:'issue341-A-P006A',group:'P006',type:"x-datacount",sources:[{"position":"categoryuse:0","sessionId":"categoryuse","index":0,"nodeId":"mt_1VSfm9yiLn","type":"x-datacount","taskHash":"945aa122537d0193ef311aadb9b1d47bd5c3bbe22f472c19163977e69b117fbe"}],binding:a.categoryFrequencyBinding,replay:a.replayCategoryFrequencyEvidence,submitted:a.submittedCategoryFrequencyEvidence},
 {id:'issue341-A-P006B',group:'P006',type:"x-datacount",sources:[{"position":"categoryuse:1","sessionId":"categoryuse","index":1,"nodeId":"mt_1VSfm9yiLn","type":"x-datacount","taskHash":"7986284102490a6eaaf5e3b5f2ca3be505ccfaac91feadc0c305e48fb590c680"},{"position":"categoryuse:2","sessionId":"categoryuse","index":2,"nodeId":"mt_1VSfm9yiLn","type":"x-datacount","taskHash":"d8a566016199a413177b13dc23eace3957cbecb5415167a162cd35eff31eb313"}],binding:b.nativeFrequencyCompareBinding,replay:b.replayNativeFrequencyCompare,submitted:b.submittedNativeFrequencyCompare},
 {id:'issue341-A-P006C',group:'P006',type:"x-datacount",sources:[{"position":"playgroundstudy:1","sessionId":"playgroundstudy","index":1,"nodeId":"mt_kxeuXm6EyC","type":"x-datacount","taskHash":"f0a5bb49744b71e2999b4cd02a6ccdad8687c20e8531100e31c3f3539c9b5be9"},{"position":"measurestory:0","sessionId":"measurestory","index":0,"nodeId":"mt_6gpryAnpoZ","type":"x-datacount","taskHash":"ed4ec76e97c65506709940aafd84b7adabba2cd9f05558ffc2f88f3ece5be500"},{"position":"ownstudy:2","sessionId":"ownstudy","index":2,"nodeId":"mt_Y6JmLjnfRP","type":"x-datacount","taskHash":"42fae338a6579eb8eb924ba776d3a156ec5ca5c4ee324b74ec0413b70f4a2e41"}],binding:c.nativeFrequencyScopesBinding,replay:c.replayNativeFrequencyScopes,submitted:c.submittedNativeFrequencyScopes},
 {id:'issue341-A-P006D',group:'P006',type:"x-datacount",sources:[{"position":"digitalstudy:2","sessionId":"digitalstudy","index":2,"nodeId":"mt_yrvYKSwSRZ","type":"x-datacount","taskHash":"772d795d586bc5e00f1eb0a20be87e5bccca909c46f6de2a622907030cbf01df"},{"position":"checkrecords:2","sessionId":"checkrecords","index":2,"nodeId":"mt_QHT16CrFO-","type":"x-datacount","taskHash":"387c9a4156b40d7e2143b716ccca795f815afcf18585996be6c2cf8c462a65e4"}],binding:d.nativeCountifRecordBinding,replay:d.replayNativeCountifRecord,submitted:d.submittedNativeCountifRecord},
 {id:'issue341-A-P006E',group:'P006',type:"x-dataplan",sources:[{"position":"studyplan:0","sessionId":"studyplan","index":0,"nodeId":"mt_SHVyE1CLUa","type":"x-dataplan","taskHash":"83f28a380491d9683372faf466c71c0ab8adf6e38ec691e4c473025ce70a22e6"},{"position":"betterquestion:0","sessionId":"betterquestion","index":0,"nodeId":"mt_O-U263ukg1","type":"x-dataplan","taskHash":"429d00abd6312dc3106e56cccf4a4cb7da38f8a7edb5a288464abe0a349211f6"}],binding:e.nativeBoundedSurveyPlanBinding,replay:e.replayNativeBoundedSurveyPlan,submitted:e.submittedNativeBoundedSurveyPlan},
 {id:'issue341-A-P006F',group:'P006',type:"x-dataplan",sources:[{"position":"studyplan:2","sessionId":"studyplan","index":2,"nodeId":"mt_SHVyE1CLUa","type":"x-dataplan","taskHash":"d961dacf687bbe09a860c314838adc89cc1ef382fdec40ffd6ab8aefe3f1d40e"},{"position":"betterquestion:2","sessionId":"betterquestion","index":2,"nodeId":"mt_O-U263ukg1","type":"x-dataplan","taskHash":"ad6950d2c3c35cde3e202def61672215e16a15be8fd195b8db019fc89dada00c"}],binding:f.nativeInferenceBoundaryBinding,replay:f.replayNativeInferenceBoundary,submitted:f.submittedNativeInferenceBoundary},
 {id:'issue341-A-P006G',group:'P006',type:"x-dataplan",sources:[{"position":"digitalstudy:1","sessionId":"digitalstudy","index":1,"nodeId":"mt_yrvYKSwSRZ","type":"x-dataplan","taskHash":"8a6ab9dade6db9c69df3522079c61190e5fddba7940162181553db02d582dc53"},{"position":"ownstudy:1","sessionId":"ownstudy","index":1,"nodeId":"mt_Y6JmLjnfRP","type":"x-dataplan","taskHash":"24d52fec334e5c24456dbbcdfddeba1a645863b650bee50527c68fec6fe8eedb"}],binding:g.nativeQuestionSchemaBinding,replay:g.replayNativeQuestionSchema,submitted:g.submittedNativeQuestionSchema},
 {id:'issue341-A-P006H',group:'P006',type:"x-dataplan",sources:[{"position":"playgroundstudy:2","sessionId":"playgroundstudy","index":2,"nodeId":"mt_kxeuXm6EyC","type":"x-dataplan","taskHash":"b982e6b2e7953fae44e694ed685f14442047ae9b20178cd1a8151e8b85b8d414"}],binding:h.nativeUsageCountBoundaryBinding,replay:h.replayNativeUsageCountBoundary,submitted:h.submittedNativeUsageCountBoundary},
 {id:'issue341-A-P006I',group:'P006',type:"x-datastudio",sources:[{"position":"studyplan:1","sessionId":"studyplan","index":1,"nodeId":"mt_SHVyE1CLUa","type":"x-datastudio","taskHash":"676bf2641fedbcc8df28921b43eea110f63ea07c7841c09e3374bd4928d22d51"},{"position":"betterquestion:1","sessionId":"betterquestion","index":1,"nodeId":"mt_O-U263ukg1","type":"x-datastudio","taskHash":"e53e0ff845065f9b5d80d0081102da7be09277257801ac5e6226b17b21ab3fd2"}],binding:i.nativeStudioRowChartBinding,replay:i.replayNativeStudioRowChart,submitted:i.submittedNativeStudioRowChart},
 {id:'issue341-A-P006J',group:'P006',type:"x-datastudio",sources:[{"position":"playgroundstudy:0","sessionId":"playgroundstudy","index":0,"nodeId":"mt_kxeuXm6EyC","type":"x-datastudio","taskHash":"271fc40982890e7b261ed64bf00b387dd8f4071d13db5098186b47ebe1ecadff"}],binding:j.nativeThreeDayUsageBinding,replay:j.replayNativeThreeDayUsage,submitted:j.submittedNativeThreeDayUsage},
 {id:'issue341-A-P006K',group:'P006',type:"x-datastudio",sources:[{"position":"digitalstudy:0","sessionId":"digitalstudy","index":0,"nodeId":"mt_yrvYKSwSRZ","type":"x-datastudio","taskHash":"24880cc3f5a04a8aff18ef85c521710c9423eb288a26ca4f95fcc285a00f9643"},{"position":"ownstudy:0","sessionId":"ownstudy","index":0,"nodeId":"mt_Y6JmLjnfRP","type":"x-datastudio","taskHash":"b4978e3896ff692b60f981377649494f13771bb8da24015e78985648fc6be32d"}],binding:k.nativeStudioRowFrequencyBinding,replay:k.replayNativeStudioRowFrequency,submitted:k.submittedNativeStudioRowFrequency},
 {id:'issue341-A-P006L',group:'P006',type:"x-samplelab",sources:[{"position":"fairdraw:0","sessionId":"fairdraw","index":0,"nodeId":"mt_4zgPzc6yu5","type":"x-samplelab","taskHash":"8fe9d888f53692c0c592ffe2b36e2f9d74ecc152349581edb5bb2948286f8da3"},{"position":"fairdraw:2","sessionId":"fairdraw","index":2,"nodeId":"mt_4zgPzc6yu5","type":"x-samplelab","taskHash":"e8ce0a04fca7daf066aebf3c2fd0e35cbca1c7299b8b494f96d0fe724087b38b"}],binding:l.nativeSampleBinding,replay:l.replayNativeSample,submitted:l.submittedNativeSample},
 {id:'issue341-A-P006M',group:'P006',type:"x-samplelab",sources:[{"position":"fairdraw:1","sessionId":"fairdraw","index":1,"nodeId":"mt_4zgPzc6yu5","type":"x-samplelab","taskHash":"852bacf9fa85cb2853d9bcbb39f3c83135bbb5b8cc431e297dd55bd05143e321"}],binding:m.nativeSamplingFrameBinding,replay:m.replayNativeSamplingFrames,submitted:m.submittedNativeSamplingFrames},
 {id:'issue341-A-P006N',group:'P006',type:"x-samplelab",sources:[{"position":"samplevary:0","sessionId":"samplevary","index":0,"nodeId":"mt_x7V1qrkiqH","type":"x-samplelab","taskHash":"66b47f1c9c7dd633e5538f40852a8bd12561d5a077633717a5f01cf03b3bb546"}],binding:n.nativeRepeatSamplingBinding,replay:n.replayNativeRepeatSampling,submitted:n.submittedNativeRepeatSampling},
 {id:'issue341-A-P006O',group:'P006',type:"x-samplelab",sources:[{"position":"samplevary:1","sessionId":"samplevary","index":1,"nodeId":"mt_x7V1qrkiqH","type":"x-samplelab","taskHash":"0a01bd8e8dd95df5a801bc216e7d0d60d3f19c5dcbe5d94c135b958604e6896a"}],binding:o.nativeClubVsAllRepeatsBinding,replay:o.replayNativeClubVsAllRepeats,submitted:o.submittedNativeClubVsAllRepeats},
 {id:'issue341-A-P006P',group:'P006',type:"x-samplelab",sources:[{"position":"samplevary:2","sessionId":"samplevary","index":2,"nodeId":"mt_x7V1qrkiqH","type":"x-samplelab","taskHash":"2a09fa4bc4b0a85e4f7855b02ccc9e7ed8f7140e0e81a4e25b36d37cd9311b3e"}],binding:p.nativeSizeRangesBinding,replay:p.replayNativeSizeRanges,submitted:p.submittedNativeSizeRanges},
 {id:'issue341-A-P006Q',group:'P006',type:"x-samplelab",sources:[{"position":"samplevary:3","sessionId":"samplevary","index":3,"nodeId":"mt_x7V1qrkiqH","type":"x-samplelab","taskHash":"3d675ec15ac349231bfff6609b098091f56c56506d9cb20c83b3546e35c03fc7"}],binding:q.nativeSleepMeansBinding,replay:q.replayNativeSleepMeans,submitted:q.submittedNativeSleepMeans},
 {id:'issue341-A-P006R',group:'P006',type:"x-questionbuild",sources:[{"position":"statquestions:1","sessionId":"statquestions","index":1,"nodeId":"mt_iykH2P5oFq","type":"x-questionbuild","taskHash":"1f654a820c65fc8586140e4977c599093e869fdc8ee54a1fdbb7265dd83f7bd3"},{"position":"statquestions:2","sessionId":"statquestions","index":2,"nodeId":"mt_iykH2P5oFq","type":"x-questionbuild","taskHash":"eb954fa3f8aead15a7e41265af49424e2dfb61a178e180c078069d32825a34a7"}],binding:r.nativeQuestionVariationBinding,replay:r.replayNativeQuestionVariation,submitted:r.submittedNativeQuestionVariation},
 {id:'issue341-A-P006S',group:'P006',type:"survey",sources:[{"position":"survey:0","sessionId":"survey","index":0,"nodeId":"mt_ebQURBOsM5","type":"survey","taskHash":"b408662903dcf4427dbd62cde33a67aed44713215040dfe2e1a315ed6d040712"},{"position":"survey:1","sessionId":"survey","index":1,"nodeId":"mt_ebQURBOsM5","type":"survey","taskHash":"62e70fbba828146520ab23b8f3e59738ddde922ff980cc3b79af83e2ce892595"}],binding:s.nativeSurveyFrequencyBinding,replay:s.replayNativeSurveyFrequency,submitted:s.submittedNativeSurveyFrequency}
]);
const key=(sessionId,index)=>JSON.stringify([sessionId,index]);
const union=new Set();
export const ISSUE342_A_P006_ADAPTERS=Object.freeze(declared.map(family=>{
 const sources=Object.freeze(family.sources.map(Object.freeze));
 const index=new Map(sources.map(row=>[key(row.sessionId,row.index),row]));
 for(const source of sources){
  const k=key(source.sessionId,source.index);
  if(union.has(k)||!/^[0-9a-f]{64}$/.test(source.taskHash))
   throw Error('Duplicate or invalid P006 source');
  union.add(k);
 }
 return Object.freeze({id:family.id,group:family.group,types:Object.freeze([family.type]),sources,
  binding:(task,context)=>{
   if(typeof context?.sessionId!=='string'||!Number.isSafeInteger(context.index))return null;
   const original=index.get(key(context.sessionId,context.index));
   if(!original||task?.type!==original.type)return null;
   const binding=family.binding(task,context);
   if(!binding||binding.method!=null||
      (binding.nodeId??binding.sourceNodeId)!==original.nodeId)return null;
   return Object.freeze({...binding,nodeId:original.nodeId,method:null,
    question:typeof binding.question==='string'&&binding.question?binding.question:
      '哪些实际保存的原生操作和 Check 支持这次数学核对？',
    candidateSource:original,strictAApproved:false});
  },replay:family.replay,submitted:family.submitted});
}));
if(ISSUE342_A_P006_ADAPTERS.length!==19||union.size!==31)
 throw Error('P006 admitted source count mismatch');
