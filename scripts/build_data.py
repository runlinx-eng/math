#!/usr/bin/env python3
"""Reproducible, lossless mathematics projection of the pinned upstream graph."""
import hashlib
import json
import pathlib
import re
import shutil

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = ROOT / 'vendor/os-taxonomy'
OUT = ROOT / 'dist'

def read(path):
    return json.loads(path.read_text())

def normal(name):
    return re.sub(r'\s*\(age \d+\+\)', '', name).strip().lower()

names = {}
for line in (ROOT / 'scripts/zh_names.txt').read_text().splitlines():
    if line.strip() and not line.startswith('#'):
        en, zh = line.split('|', 1)
        names[normal(en)] = zh
names['adding three small numbers'] = '三个小整数相加'
names['dollars and cents'] = '元与分的换算'

domains = [
    ('Counting & Cardinality', '数与数量', 'counting', '从一眼看出数量，到有策略地数一大群。', '#638c65', '01'),
    ('Number Representation & Place Value', '数位与小数', 'place', '同一个数字，换个位置会发生什么？', '#b27e40', '02'),
    ('Addition & Subtraction', '加法与减法', 'add', '合起来、拿走、比较：寻找数量间的关系。', '#5a8f99', '03'),
    ('Multiplication & Division', '乘法与除法', 'multiply', '把一份变成几份，也把总数平均分开。', '#a16d89', '04'),
    ('Fractions', '分数', 'fractions', '从一个整体的一部分，发现更多数的样子。', '#d0783e', '05'),
    ('Ratio & Proportion', '比与比例', 'ratio', '大小改变时，什么关系始终不变？', '#a88e3b', '06'),
    ('Geometry', '图形与空间', 'geometry', '转一转、拼一拼，看见形状中的规律。', '#547aab', '07'),
    ('Measurement', '测量', 'measure', '用共同的单位，描述长短、时间和大小。', '#55918b', '08'),
    ('Algebra', '规律与代数', 'algebra', '用符号表达规律，寻找还不知道的数。', '#9180ad', '09'),
    ('Data & Statistics', '数据与统计', 'data', '向数据提问，用图表理解一群事物。', '#b87967', '10'),
    ('Probability', '可能性', 'chance', '预测会发生什么，再用实验检验猜想。', '#7b8e56', '11'),
    ('Mathematical Thinking', '数学思考', 'thinking', '解释你的想法，寻找另一种解法。', '#6c8291', '12'),
]
domain_meta = [dict(source=en, title=zh, id=id, description=desc, color=color, number=num)
               for en, zh, id, desc, color, num in domains]
domain_id = {d['source']: d['id'] for d in domain_meta}
all_topics = read(SRC / 'data/topics.json')['topics']
math = [t for t in all_topics if t['subject'] == 'Mathematics']
math_ids = {t['id'] for t in math}
missing = sorted({t['name'] for t in math if normal(t['name']) not in names})
if missing:
    raise SystemExit('Missing Chinese labels: ' + json.dumps(missing, ensure_ascii=False))
research = {r['topicId'] for r in read(SRC / 'data/teaching-research.json')['records']}
lessons = {'mt_ndGqFPWyen': 'meaning', 'mt_Ep7TDFuYUa': 'equivalent', 'mt_TqDq6jyOmL': 'decimal'}
overrides = {'mt_ndGqFPWyen': '分数的意义', 'mt_Ep7TDFuYUa': '数轴上的等值分数',
             'mt_TqDq6jyOmL': '分数与小数对应', 'mt__casygEB85': '小数的近似数',
             'mt_SoDP1fSQEB': '小数乘整数', 'mt_Fl7b8q9pI1': '一位小数取整',
             'mt_IegHBHERVa': '比较两位小数', 'mt_Ii1hV4V5ql': '两位小数的近似数',
             'mt_wPgpMJ0-PA': '乘除10、100与1000'}
nodes = []
for t in math:
    nodes.append({**t, 'title': overrides.get(t['id'], names[normal(t['name'])]),
                  'domainId': domain_id[t['domain']], 'lesson': lessons.get(t['id']),
                  'hasResearch': t['id'] in research})
edges = read(SRC / 'data/dependencies.json')['dependencies']
internal = [e for e in edges if e['topicId'] in math_ids and e['prerequisiteId'] in math_ids]
external = [e for e in edges if e['topicId'] in math_ids and e['prerequisiteId'] not in math_ids]
external_ids = {e['prerequisiteId'] for e in external}
assert len(nodes) == 587 and len(internal) == 1223 and len(external) == 32
for d in domain_meta:
    d['count'] = sum(t['domainId'] == d['id'] for t in nodes)
data = {'schema': 1, 'source': read(ROOT / 'vendor/upstream.json'),
        'licenses': {'database': 'ODbL-1.0', 'content': 'CC-BY-SA-4.0'},
        'domains': domain_meta, 'nodes': nodes, 'edges': internal,
        'externalEdges': external, 'externalNodes': [t for t in all_topics if t['id'] in external_ids],
        'sourceSha256': {f: hashlib.sha256((SRC / 'data' / f).read_bytes()).hexdigest()
                         for f in ['topics.json', 'dependencies.json', 'teaching-research.json']}}
(OUT / 'data').mkdir(exist_ok=True, parents=True)
(OUT / 'data/math.json').write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')))
(OUT / 'licenses').mkdir(exist_ok=True)
for f in ['LICENSE', 'LICENSE-CONTENT', 'PROVENANCE.md']:
    shutil.copy2(SRC / f, OUT / 'licenses' / f)
for example in ['hidden-cubes', 'bee-builder']:
    target = OUT / 'experiments' / example
    target.mkdir(parents=True, exist_ok=True)
    shutil.copy2(SRC / '.agents/skills/marble-builder/examples' / example / 'experience.html', target / 'index.html')
print(json.dumps({'nodes': len(nodes), 'edges': len(internal), 'externalEdges': len(external),
                  'research': sum(n['hasResearch'] for n in nodes), 'domains': len(domains),
                  'mathDataBytes': (OUT / 'data/math.json').stat().st_size}))
