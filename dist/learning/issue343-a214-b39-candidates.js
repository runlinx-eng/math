// #343 frozen B39 subset: explicit original node/index/task hash per source.
// Only a reviewed manifest entry can enable these candidates at runtime.
import * as S from './a214-square-inclusion-evidence.js';
import * as N from './a214-quadrilateral-nesting-evidence.js';
import * as E from './a214-angle-estimate-evidence.js';
import * as P from './a214-protractor-evidence.js';
const definitions=[
 {id:'issue341-A214-B39-S',module:S},
 {id:'issue341-A214-B39-N',module:N},
 {id:'issue341-A214-B39-E',module:E},
 {id:'issue341-A214-B39-P',module:P},
];
const seen=new Set();
export const ISSUE343_B39_FIRST4_ADAPTERS=Object.freeze(definitions.map(({id,module:m})=>{
 const source=Object.freeze({...m.SOURCE,position:m.SOURCE.sessionId+':'+m.SOURCE.index});
 const key=JSON.stringify([source.sessionId,source.index]);
 if(seen.has(key)||!/^mt_[A-Za-z0-9_-]+$/.test(source.nodeId)||
   !/^[0-9a-f]{64}$/.test(source.taskHash)||!source.type)throw Error('B39 frozen source drift '+key);
 seen.add(key);
 return Object.freeze({id,types:Object.freeze([source.type]),sources:Object.freeze([source]),
  replay:m.replay,submitted:m.submitted,
  binding:(task,context)=>{
   if(context?.sessionId!==source.sessionId||context.index!==source.index||task?.type!==source.type)return null;
   const raw=m.binding(task,context);
   if(!raw||raw.nodeId!==source.nodeId||raw.method!=null)return null;
   return Object.freeze({...raw,method:null,candidateSource:source,strictAApproved:false});
  }});
}));
if(seen.size!==4||ISSUE343_B39_FIRST4_ADAPTERS.length!==4)throw Error('B39 expected four exact sources');
