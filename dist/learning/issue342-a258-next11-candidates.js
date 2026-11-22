// #342 Next 11 source-locked candidate families; only the official manifest can approve.
// No same-session, same-widget or sibling auto-promotion.
import * as balance from './p030-native-balance-evidence.js';
import * as growing from './p034-native-growing-evidence.js';
import * as unknown from './p038-native-unknown-evidence.js';
import * as cups from './p052-native-fraction-cups-evidence.js';
import * as mosaic from './p056-original-mosaic-evidence.js';
const definitions=[
 {id:'issue341-A-P030B',sources:balance.P030_BALANCE_SOURCES,
  binding:balance.p030BalanceBinding,replay:balance.replayP030BalanceEvidence,
  submitted:balance.submittedP030BalanceEvidence},
 {id:'issue341-A-P034G',sources:growing.P034_GROWING_SOURCES,
  binding:growing.p034GrowingBinding,replay:growing.replayP034GrowingEvidence,
  submitted:growing.submittedP034GrowingEvidence},
 {id:'issue341-A-P038U',sources:unknown.P038_UNKNOWN_SOURCES,
  binding:unknown.p038UnknownBinding,replay:unknown.replayP038UnknownEvidence,
  submitted:unknown.submittedP038UnknownEvidence},
 {id:'issue341-A-P052C',sources:[cups.P052_CUPS_SOURCE],
  binding:cups.p052CupsBinding,replay:cups.replayP052CupsEvidence,
  submitted:cups.submittedP052CupsEvidence},
 {id:'issue341-A-P056M',sources:[mosaic.P056_MOSAIC_SOURCE],
  binding:mosaic.p056MosaicBinding,replay:mosaic.replayP056MosaicEvidence,
  submitted:mosaic.submittedP056MosaicEvidence}
];
const seen=new Set();
export const ISSUE342_A_NEXT11_ADAPTERS=Object.freeze(definitions.map(family=>{
 const sources=Object.freeze(family.sources.map(original=>{
  const s=Object.freeze({sessionId:original.sessionId,index:original.index,
   position:original.sessionId+':'+original.index,nodeId:original.nodeId,
   type:original.type,taskHash:original.taskHash});
  const key=JSON.stringify([s.sessionId,s.index]);
  if(seen.has(key)||!s.sessionId||!Number.isInteger(s.index)||s.index<0||
    !/^mt_[A-Za-z0-9_-]+$/.test(s.nodeId)||!/^[0-9a-f]{64}$/.test(s.taskHash)||!s.type)
   throw Error('Next11 frozen position drift '+key);
  seen.add(key);return s;
 }));
 const exact=new Map(sources.map(s=>[JSON.stringify([s.sessionId,s.index]),s]));
 return Object.freeze({id:family.id,types:Object.freeze([...new Set(sources.map(s=>s.type))]),
  sources,replay:family.replay,submitted:family.submitted,
  binding:(task,context={})=>{
   if(typeof context.sessionId!=='string'||!Number.isInteger(context.index))return null;
   const source=exact.get(JSON.stringify([context.sessionId,context.index]));
   if(!source||task?.type!==source.type)return null;
   const binding=family.binding(task,context);
   if(!binding||binding.nodeId!==source.nodeId||binding.taskHash!==source.taskHash||
      binding.type!==undefined&&binding.type!==source.type)return null;
   return Object.freeze({...binding,method:null,candidateSource:source,strictAApproved:false});
  }});
}));
if(ISSUE342_A_NEXT11_ADAPTERS.length!==5||seen.size!==11||
   ISSUE342_A_NEXT11_ADAPTERS.reduce((n,f)=>n+f.sources.length,0)!==11)
 throw Error('Next11 frozen families/positions mismatch');
