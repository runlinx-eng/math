import {merge} from './exploration-core.js';

// Each embedded work surface owns only its active activity's working copy.
// Persisted work in the other surface, bookmarks and immutable evidence survive.
export function mergeLiveActivity(local,stored,activeId){
  const out=merge(stored,local);
  out.bookmarks=[...stored.bookmarks];
  if(activeId&&local.activities[activeId]){
    out.activities[activeId]=merge(local,stored).activities[activeId];
    out.continuation=activeId;
    out.journeyContinuation=null;
    out.lessonContinuation=null;
  }
  return out;
}
