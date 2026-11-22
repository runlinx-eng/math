// B-line development candidate for the exact #343 source positions below.
import * as original from './phase4/b03-model.js';
import {
  hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask
} from './evidence-contract.js';

export const SOURCES = Object.freeze([
  Object.freeze({sessionId: 'amounts', index: 2, nodeId: 'mt_cFltwUQi-d',
    type: 'x-fline', taskHash: 'cb6d391909eb03d32e497fb606ccccdbdddac10ce8f1428a4534feb04e61e9fe'}),
  Object.freeze({sessionId: 'fractionline', index: 0, nodeId: 'mt_NoB20kVa4w',
    type: 'x-fline', taskHash: '8a175970fa8a18651b90658374c28f3c2090f922fbecaab8ccc49c082a8642f3'}),
  Object.freeze({sessionId: 'fractionline', index: 1, nodeId: 'mt_NoB20kVa4w',
    type: 'x-fline', taskHash: '3827efb90e4d6d7865fd6468043a40742b9ee1ce8a3192298f8a987657ce054f'}),
  Object.freeze({sessionId: 'fractionline', index: 2, nodeId: 'mt_NoB20kVa4w',
    type: 'x-fline', taskHash: '29a9db37f7eec6e7ae5dac15afbe1cc56530c9c06bee7a80c6937ef503ce0e93'}),
  Object.freeze({sessionId: 'fractionline', index: 3, nodeId: 'mt_NoB20kVa4w',
    type: 'x-fline', taskHash: 'b18a6ad495f0fa34948439a429c497177175f4abcb849f92df5b6713ff0f974f'}),
  Object.freeze({sessionId: 'fractionline', index: 4, nodeId: 'mt_NoB20kVa4w',
    type: 'x-fline', taskHash: 'f5b23dcb275139cdd57e07c08ec805404695f050310a23fc9a04579666254ba8'}),
  Object.freeze({sessionId: 'hundredths', index: 1, nodeId: 'mt_doX1BhmFgk',
    type: 'x-fline', taskHash: '5a4012756795c19fba461bdeb81a8cee24479b87c643bd1a6da64922dedd782e'}),
  Object.freeze({sessionId: 'hundredths', index: 2, nodeId: 'mt_doX1BhmFgk',
    type: 'x-fline', taskHash: '2d960beed1d624f55e5528d322a707b5169c4982b3cfb2356d9c37a306646e16'}),
  Object.freeze({sessionId: 'hundredths', index: 3, nodeId: 'mt_doX1BhmFgk',
    type: 'x-fline', taskHash: '8bf9e29f404f9a3dd7b69950e87773a2b65c55cd141688a552105da7f907646e'}),
]);

function sourceFor(task, context) {
  if (!isEvidenceContext(context)) return null;
  const source = SOURCES.find(row => row.sessionId === context.sessionId && row.index === context.index);
  return source && matchesNativeEvidenceTask(task, context, source) ? source : null;
}

export function binding(task, context) {
  const source = sourceFor(task, context);
  return source ? {nodeId: source.nodeId, method: null, question: '核对等长小段及保存的逐段落点。'} : null;
}

export function submitted(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replay(task, model, context) : null;
}

export function replay(task, model, context) {
  try {
    const source = sourceFor(task, context);
    if (!source || !hasExactKeys(model, Object.keys(original.initial(task))) || !original.valid(task, model)) return null;
    const tenthsWindow = task.end === 0.1;
    const denominator = task.d * (tenthsWindow ? 10 : 1);
    if (model.parts !== task.d || model.jumps.length !== task.n ||
        !model.jumps.every((mark, i) => mark === i + 1) || model.mark !== model.jumps.at(-1) ||
        model.unitDen !== denominator || model.n !== model.mark || model.d !== denominator ||
        !original.inspect(task, model).correct) return null;
    return {...source, method: null, rightEndpoint: tenthsWindow ? '1/10' : '1',
      segments: model.parts, step: [1, denominator],
      retainedMarks: model.jumps.map(n => [n, denominator]), location: [model.n, denominator]};
  } catch {
    return null;
  }
}
