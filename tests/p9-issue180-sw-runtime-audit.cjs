'use strict';
const fs=require('node:fs'),path=require('node:path');
const suite=process.argv[2];
const config={
 place:{dir:'p9-place-adapter',label:'twodigitpair-1'},
 'fraction-order':{dir:'p9-fraction-order-adapter',label:'correction-reset'},
 'fraction-operations':{dir:'p9-fraction-operations-adapter',label:'explore-reset-preserves-first'}
}[suite];
if(!config)throw Error('Expected place, fraction-order or fraction-operations');
const root=path.resolve(__dirname,'..');
const observations=[];
for(const viewport of ['1440x900','1280x720']){
 const file=path.join(root,'verification',config.dir,viewport+'-'+config.label+'-native-startup.json');
 if(!fs.existsSync(file))throw Error('Missing authentic target-path native probe: '+file);
 const entry=JSON.parse(fs.readFileSync(file,'utf8'));
 const phases={};
 for(const phase of ['before','after']){
  const state=entry[phase]?.serviceWorkerRuntime;
  const live=state?.workers||[];
  phases[phase]={available:!!state&&live.length>0&&live.some(x=>x.installed===true),
   live:state?.liveWorkerCount||0,closed:state?.closedWorkerCount||0,
   errors:live.reduce((n,x)=>n+(x.eventCount||0),0),
   unavailable:live.filter(x=>x.unavailable).map(x=>x.error)};
 }
 const validJournal=entry.journal?.complete===true;
 observations.push({viewport,probeStatus:entry.status,phases,validJournal,
  firstFailures:entry.firstFailures?.length||0,rawIdentical:entry.rawIdentical});
 // Even if the mathematical flow fails naturally, the evidence must record
 // whether post-activation SW context was actually observable.
 if(!validJournal)throw Error('Incomplete CDP event stream at '+viewport);
 if(!phases.before.available)throw Error('Passive SW runtime not observable BEFORE original native path at '+viewport);
 if(entry.status==='success'&&!phases.after.available)
  throw Error('Passive SW runtime not observable AFTER successful native path at '+viewport);
}
const result={schema:'issue180-sw-observation-audit/1',suite,observations,diagnosticOnly:true};
const out=path.join(root,'verification','issue180-sw-runtime');
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,suite+'-audit.json'),JSON.stringify(result,null,2));
console.log('ISSUE180_SW_RUNTIME_AUDIT_OK '+JSON.stringify(result));