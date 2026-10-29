#!/usr/bin/env python3
"""Local navigation adaptation, preserving every pinned math node and edge."""
import collections
import json
import pathlib
import re

ROOT=pathlib.Path(__file__).resolve().parents[1]
data=json.loads((ROOT/'dist/data/math.json').read_text())
research=json.loads((ROOT/'vendor/os-taxonomy/data/teaching-research.json').read_text())['records']
themes=[
 ('numbers','数与运算','多少、怎样分，以及数的不同样子。','01','#bd6b38'),
 ('space','图形与空间','拼一拼、转一转，发现形状的关系。','02','#537fa1'),
 ('measure','测量与变化','选一个单位，把世界的大小说清楚。','03','#54867c'),
 ('patterns','规律与推理','找到规律，也说清楚为什么。','04','#8b749e'),
 ('data','数据与可能性','向数据提问，探索不确定的事。','05','#8b8c50'),
]
packs=[
 ('number-sense','numbers','数的样子与大小','数量怎样变成数字？同一个数字换个位置会怎样？'),
 ('add-subtract','numbers','合起来与拿走','一种变化，怎样用加法或减法表示？'),
 ('groups','numbers','成组与平均分','一份变成几份，怎样分才一样多？'),
 ('same-amount','numbers','一份与同一个量','分法和名字变了，数量也会变吗？'),
 ('fraction-operations','numbers','分数也能运算','一份的一部分、几份合起来，怎么表示？'),
 ('scaling','numbers','放大、缩小与比例','数量改变时，有哪些关系保持不变？'),
 ('shapes','space','形状有什么共同点','边、角和形状的特征，能帮助我们怎样分类？'),
 ('positions','space','位置与变换','移动、翻转或旋转之后，什么变了？'),
 ('angles','space','转弯与角','转了多少？不同的角怎样相互联系？'),
 ('solids','space','从平面到立体','展开、拼搭、切开，从不同方向观察同一个物体。'),
 ('units','measure','用单位比较','选多大的单位，才能把大小说清楚？'),
 ('area','measure','边界与铺满','围一圈和铺满里面，测量的是同一件事吗？'),
 ('volume','measure','装得下多少','一层一层地装，怎样描述空间的大小？'),
 ('time','measure','时间怎样走','从什么时候开始，到什么时候结束？'),
 ('money','measure','钱与选择','数量、价格和预算怎样一起帮助我们作决定？'),
 ('patterns','patterns','寻找与创造规律','下一步是什么？能自己造一个规律吗？'),
 ('unknowns','patterns','相等与未知数','有一个数还不知道，关系能告诉我们什么？'),
 ('functions','patterns','一起变化的量','一个量改变时，另一个量怎样跟着变？'),
 ('reasoning','patterns','把想法说清楚','画出来、解释、找反例，检查一个想法能否成立。'),
 ('collect','data','问问题与收集','想知道什么？怎样得到可靠的数据？'),
 ('display','data','把数据画出来','同一组数据，怎样表示才看得清楚？'),
 ('summarize','data','比较与推断','数据有哪些共同点？一个样本能告诉我们多少？'),
 ('chance','data','可能与不一定','预测、实验，再看看结果怎样变化。'),
]
pack_map={p[0]:dict(id=p[0],themeId=p[1],title=p[2],question=p[3],origin='local-adaptation',nodeIds=[]) for p in packs}

def classify(t):
    name=t['name'].lower();domain=t['domain']
    has=lambda regex:bool(re.search(regex,name))
    if t['id'] in ['mt_ndGqFPWyen','mt_Ep7TDFuYUa','mt_TqDq6jyOmL']:return 'same-amount','core exploration anchor'
    if domain=='Counting & Cardinality':return 'number-sense','counting and quantity'
    if domain=='Number Representation & Place Value':
        if has('temperature'):return 'units','measurement context'
        if has('fraction'):return 'same-amount','fractions as numbers'
        return 'number-sense','number representation and magnitude'
    if domain=='Addition & Subtraction':
        if has('equation|equals|unknown|missing'):return 'unknowns','relations and unknowns'
        if has('negative|number line'):return 'number-sense','number magnitude'
        return 'add-subtract','addition and subtraction'
    if domain=='Multiplication & Division':return 'groups','grouping and multiplicative operations'
    if domain=='Ratio & Proportion':return 'scaling','ratio and proportional relationships'
    if domain=='Fractions':
        if has('percent|scaling'):return 'scaling','proportional representation'
        if t['id'] in ['mt_Fl7b8q9pI1','mt_Ii1hV4V5ql']:return 'number-sense','rounding decimals, clarified from original description'
        if has('adding|subtract|addition|sums|multipl|divid|division|word problem|area with'):return 'fraction-operations','operations with fractions'
        return 'same-amount','parts, number line and equivalent representations'
    if domain=='Geometry':
        if has('area|circumference'):return 'area','measurement of shape'
        if has('angle|turn|parallel|perpendicular|trigonometry|pythagoras'):return 'angles','angle and side relationships'
        if has('position|coordinate|movement|direction|translat|reflect|transform|symmetry|enlargement|tessellation'):return 'positions','position and transformations'
        if has('3-d|solid|vertic|vertices|nets|cross-section|spatial'):return 'solids','three dimensional structure'
        return 'shapes','shape properties and construction'
    if domain=='Measurement':
        if has(r'money|coin|\bpounds?\b|pence|dollar|\bcents?\b|budget|buy|purchase|\bchange\b|discount|gst|balance'):return 'money','money context'
        if has('time|duration|hours|minutes|seconds|clock|calendar|days|weeks|months|years|events'):return 'time','time measurement'
        if has('area|perimeter|tiling'):return 'area','area and boundary'
        if has('volume|capacity|cubes|cuboids|liquid'):return 'volume','volume and capacity'
        return 'units','units, scales and comparison'
    if domain=='Algebra':
        if has('sequence|pattern|repeating|algorithm|listing'):return 'patterns','patterns and generative rules'
        if has('graph|function|coordinates|formula'):return 'functions','covariation and representation'
        if has('estimating'):return 'reasoning','reasonableness and verification'
        if has('number line'):return 'number-sense','number representation'
        return 'unknowns','symbolic relations'
    if domain=='Mathematical Thinking':
        if has('fractions|equivalence'):return 'same-amount','fraction reasoning'
        if has('money'):return 'money','financial reasoning'
        if has('times tables|multiplication|order of operations'):return 'groups','multiplicative reasoning'
        if has('pattern|generalis|repeated reasoning'):return 'patterns','patterns and generalization'
        if has('number line'):return 'number-sense','number representation'
        return 'reasoning','reasoning applies across all themes'
    if domain=='Data & Statistics':
        if has('collect|sorting|categories|categorical|investigation|statistical questions|what was measured'):return 'collect','question and data collection'
        if has('graph|plot|chart|table|display|pictogram|histogram|data with digital'):return 'display','data representations'
        return 'summarize','summary, distributions and inference'
    if domain=='Probability':return 'chance','chance and uncertainty'
    raise ValueError(t['id'])

assignments=[]
for n in data['nodes']:
    pack,why=classify(n);n['packId']=pack;n['themeId']=pack_map[pack]['themeId']
    pack_map[pack]['nodeIds'].append(n['id'])
    assignments.append(dict(id=n['id'],name=n['name'],title=n['title'],pack=pack,rationale=why,sourceDomain=n['domain']))
by_id={n['id']:n for n in data['nodes']}
links=collections.defaultdict(list)
for e in data['edges']:
    a,b=by_id[e['prerequisiteId']]['packId'],by_id[e['topicId']]['packId']
    if a!=b:links[(a,b)].append(e)
for p in pack_map.values():
    assert p['nodeIds'],p['id']
    p['activityIds']=['fair','rename','decimal'] if p['id']=='same-amount' else []
    p['researchCount']=sum(by_id[id]['hasResearch'] for id in p['nodeIds'])
selected={'mt_ndGqFPWyen','mt_Ep7TDFuYUa','mt_TqDq6jyOmL'}
math_research=[r for r in research if r['topicId'] in by_id]
atlas={'schema':2,'source':data['source'],'themes':[dict(id=i,title=t,description=d,number=n,color=c) for i,t,d,n,c in themes],
       'packs':list(pack_map.values()),'nodes':data['nodes'],'edges':data['edges'],'externalEdges':data['externalEdges'],'externalNodes':data['externalNodes'],
       'packLinks':[dict(fromPack=a,toPack=b,edges=edges) for (a,b),edges in links.items()],
       'research':{r['topicId']:dict(hasActivities=bool(r['learn'].get('activities')),activityCount=len(r['learn'].get('activities',[])),assessmentMethod=(r.get('assess') or {}).get('method'),misconceptionCount=len(r['pedagogy'].get('commonMisconceptions',[]))) for r in math_research},
       'focusResearch':{r['topicId']:r for r in math_research if r['topicId'] in selected},
       'adaptation':{'classification':'Local semantic navigation groups; upstream IDs, domains and edges unchanged. Ages and curricula do not control routing.','reasoning':'Reasoning nodes have a primary home and retain cross-theme graph links.','missingResearchIds':[n['id'] for n in data['nodes'] if not n['hasResearch']]}}
(ROOT/'dist/data/atlas.json').write_text(json.dumps(atlas,ensure_ascii=False,separators=(',',':')))
(ROOT/'docs/classification-audit.json').write_text(json.dumps(assignments,ensure_ascii=False,indent=2))
report={'nodes':len(atlas['nodes']),'edges':len(atlas['edges']),'themes':len(themes),'packs':len(packs),'research':len(math_research),'missingResearch':len(atlas['adaptation']['missingResearchIds']),'packsSummary':[{k:p[k] for k in ['id','title','researchCount']}|{'nodes':len(p['nodeIds'])} for p in atlas['packs']]}
(ROOT/'docs/atlas-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False))
