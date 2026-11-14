// This native scope records actual nonzero removals from named place values.
// It does not expand the independently reviewed decimal/exchange bindings.
import {matchesNativeEvidenceTask} from './evidence-contract.js';
export {replayPlaceRemovalEvidence} from './place-evidence.js';

const SOURCES=Object.freeze({
 tensmove:{indices:[1],nodeId:'mt_I5j1ZWo2cn'},
 decadetake:{indices:[0,1],nodeId:'mt_HJTuIGHvcR'},
 tenslarge:{indices:[1],nodeId:'mt_aHQ9kNt3is'},
 hundredsmove:{indices:[1],nodeId:'mt_xPqczp7zPX'},
 general34:{indices:[1],nodeId:'mt_fZTn0W_iZR'}
});

export function placeRemovalBinding(task,context={}){
 if(!context||typeof context!=='object'||Array.isArray(context))return null;
 const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
 if(!source||!source.indices.includes(context.index)||task?.op!=='-'||(task.scale??1)!==1||
    !matchesNativeEvidenceTask(task,context,{type:'x-placecalc',nodeId:source.nodeId}))return null;
 return {nodeId:source.nodeId,method:null,scope:'integer-removal',scale:1,
  question:'要拿走的数由哪些数位单位组成？从一列拿走几份时，实际少了多少？看看其余各列和还没拿走的量怎样变化。'};
}
