import{readFileSync,writeFileSync}from'node:fs';
import{exampleModel}from'../dist/learning/tasks.js';
for(const batch of ['b03','b04','b05']){const{TASKS}=await import(`../dist/learning/phase4/${batch}.js`);const fixture=Object.fromEntries(Object.entries(TASKS).map(([id,ts])=>[id,ts.map(t=>({t,m:exampleModel(t)}))]));writeFileSync(`tests/phase4-${batch}-browser.js`,readFileSync('tests/phase4-browser-template.js','utf8').replace('FIXTURE',JSON.stringify(fixture)).replace('BATCH',batch.toUpperCase()));}
