import {initial, valid} from './phase5/b24-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask} from './evidence-contract.js';

export const P115P_SOURCES = Object.freeze([
  {
    "sessionId": "placewords",
    "index": 0,
    "nodeId": "mt_qeZYF6HZ4o",
    "type": "x-p24-place",
    "taskHash": "b6ac538d257c82f0b67274f0a7e28b18586aae56b4e49b2fc8b71d88b1522428"
  },
  {
    "sessionId": "placewords",
    "index": 1,
    "nodeId": "mt_qeZYF6HZ4o",
    "type": "x-p24-place",
    "taskHash": "6052624bb82f9ea509ee9bbb729966505a3acc03a8effdf906d65f53c8b4febe"
  },
  {
    "sessionId": "placewords",
    "index": 2,
    "nodeId": "mt_qeZYF6HZ4o",
    "type": "x-p24-place",
    "taskHash": "87e347c95cbac40e7b2e713d3d287057f4f855072d3c1f3623d892585a5a7e98"
  },
  {
    "sessionId": "placewords",
    "index": 3,
    "nodeId": "mt_qeZYF6HZ4o",
    "type": "x-p24-place",
    "taskHash": "b6d58b80d8f228166140e1865378739849b99fd79b9f34aec41cb83e001da779"
  },
  {
    "sessionId": "words38",
    "index": 3,
    "nodeId": "mt_lMz9nAs7VO",
    "type": "x-p24-place",
    "taskHash": "b6ac538d257c82f0b67274f0a7e28b18586aae56b4e49b2fc8b71d88b1522428"
  }
].map(Object.freeze));

export function p115pRelativePositionBinding(task, context) {
  const row = P115P_SOURCES.find(source => source.sessionId === context?.sessionId && source.index === context?.index);
  if (!row || !matchesNativeEvidenceTask(task, context, row)) return null;
  return {nodeId: row.nodeId, kind: 'p115p-relative-position', method: null, question: '相对哪件东西或哪位观察者，才能确定小球的位置？'};
}

const positions = {
  table: ['on', 'under'],
  depth: ['behind', 'front'],
  side: ['left', 'right'],
};
const interpretations = {on:'on', behind:'far', left:'viewer', right:'may-change'};

export function replayP115PRelativePositionEvidence(task, model, context) {
  try {
    const binding = p115pRelativePositionBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task, 1))) || !valid(task, model) ||
        model.issue !== '' || Object.keys(model.history).length !== model.history.length) return null;
    let zone = null;
    for (const event of model.history) {
      if (!hasExactKeys(event, ['a','d','f']) || !hasExactKeys(event.f, [])) return null;
      if (event.a === 'reset' && hasExactKeys(event.d, [])) {
        zone = null;
        continue;
      }
      if (event.a !== 'place' || !hasExactKeys(event.d, ['index']) || !['0','1'].includes(event.d.index)) return null;
      zone = positions[task.scene][Number(event.d.index)];
    }
    if (zone !== task.want || zone !== model.board.zone || model.answers[0] !== interpretations[zone]) return null;
    return {...binding, zone};
  } catch {
    return null;
  }
}

export function submittedP115PRelativePositionEvidence(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replayP115PRelativePositionEvidence(task, model, context) : null;
}
