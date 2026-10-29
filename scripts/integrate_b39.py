from pathlib import Path
def replace(path,old,new,count=1):
    p=Path(path);s=p.read_text();n=s.count(old)
    if n!=count: raise RuntimeError(f'{path}: expected {count} occurrences, got {n}: {old!r}')
    p.write_text(s.replace(old,new))
replace('dist/learning/phase4/engine.js','const engine=t=>b38.TYPES','const engine=t=>b39.TYPES.has(t.type)?b39:b38.TYPES')
replace('dist/learning/phase4/engine.js','(b38.TYPES.has(t.type)?v38:','(b39.TYPES.has(t.type)?v39:b38.TYPES.has(t.type)?v38:',3)
replace('dist/learning/state.js',"!/^x-r3[78]-/.test(t.type)","!/^x-(?:r3[78]|s39)-/.test(t.type)")
replace('dist/learning/learn.js',"if(act==='r38-test'&&(m.issue||m.board?.records?.length))supportLesson(r);","if(act==='r38-test'&&(m.issue||m.board?.records?.length))supportLesson(r);if(act==='s39-run'||act==='s39-hop'||act==='s39-estimate'&&m.issue)supportLesson(r);")
replace('dist/learning/learn.js',"$('#lesson').addEventListener('change',e=>{if(e.target.matches('[data-xfield=\"position\"]')", "$('#lesson').addEventListener('change',e=>{if(e.target.matches('[data-xfield=\"method\"]')&&task().type==='x-s39-choose')render();if(e.target.matches('[data-xfield=\"position\"]')")
for name in ['dist/sw.js','dist/space.js','dist/exploration.js']:
    p=Path(name);s=p.read_text();assert 'learning-v43' in s;p.write_text(s.replace('learning-v43','learning-v44'))
replace('dist/sw.js',"const FILES = [","const FILES = ['./learning/phase5/b39.js','./learning/phase5/b39-model.js','./learning/phase5/b39-view.js','./learning/phase5/b39.css',")
replace('dist/space.js',"['learning/phase5/b38-more.js'","['learning/phase5/b39.js','learning/phase5/b39-model.js','learning/phase5/b39-view.js','learning/phase5/b39.css','learning/phase5/b38-more.js'")
