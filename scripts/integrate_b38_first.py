from pathlib import Path

def change(path, old, new, count=1):
    p=Path(path)
    data=p.read_text()
    actual=data.count(old)
    if actual != count:
        raise RuntimeError(f'{path}: expected {count} occurrences of {old!r}, got {actual}')
    p.write_text(data.replace(old,new))

change('dist/learning/phase4/engine.js', 'const engine=t=>b37.TYPES', 'const engine=t=>b38.TYPES.has(t.type)?b38:b37.TYPES')
change('dist/learning/phase4/engine.js', '(b37.TYPES.has(t.type)?v37:', '(b38.TYPES.has(t.type)?v38:b37.TYPES.has(t.type)?v37:', 3)
change('dist/learning/state.js', "(!t.type.startsWith('x-r37-')||inspect(t,a.models[i]).correct)", "(!/^x-r3[78]-/.test(t.type)||inspect(t,a.models[i]).correct)")
change('dist/learning/learn.js', "if(m.board?.bad&&act.startsWith('r37-'))supportLesson(r);", "if(m.board?.bad&&act.startsWith('r37-'))supportLesson(r);if(act==='r38-test'&&m.board?.records?.length)supportLesson(r);")
for name in ['dist/sw.js','dist/space.js','dist/exploration.js']:
    p=Path(name);data=p.read_text();assert 'learning-v42' in data;data=data.replace('learning-v42','learning-v43');p.write_text(data)
change('dist/sw.js', "const FILES = [", "const FILES = ['./learning/phase5/b38.js','./learning/phase5/b38-model.js','./learning/phase5/b38-view.js','./learning/phase5/b38.css',")
change('dist/space.js', "['learning/phase5/b36.js'", "['learning/phase5/b38.js','learning/phase5/b38-model.js','learning/phase5/b38-view.js','learning/phase5/b38.css','learning/phase5/b36.js'")
change('dist/learning/phase5/b38.js', '6列一组有10组，拿走两组。', '每列有6个点，一共有10列，拿走两列。')

change('scripts/build_phase5_coverage.mjs', "import{map as b37}from'./phase5-b37-goals.mjs';", "import{map as b37}from'./phase5-b37-goals.mjs';\nimport{map as b38}from'./phase5-b38-goals.mjs';")
change('scripts/build_phase5_coverage.mjs', "B36:b36,B37:b37},current='B37'", "B36:b36,B37:b37,B38:b38},current='B38'")
change('scripts/build_phase5_coverage.mjs', "assert.equal(nodes.length,559);", "assert.equal(nodes.length,562);")
change('scripts/build_phase5_coverage.mjs', "plan.batches.slice(0,37).flatMap(b=>b.topicIds).sort()", "[...plan.batches.slice(0,37).flatMap(b=>b.topicIds),...Object.values(LESSONS).filter(l=>l.batch==='B38').map(l=>l.topicId)].sort()")
change('scripts/build_phase5_coverage.mjs', "阶段 5 · B37：放大、缩小与比例·批1", "阶段 5 · B38：把想法说清楚·第一条路线")
change('scripts/build_phase5_coverage.mjs', '本批按三种方向提供七条短路线，原I路线仍可进入；节点间的联合任务仅采用上游已有连接。', '本批先制作一条三节点短路线；节点间的联合任务仅采用上游已有连接。B38其余17个计划节点尚未制作。')
