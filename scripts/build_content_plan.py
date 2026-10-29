#!/usr/bin/env python3
"""Build a source-traceable authoring inventory, without touching app data/state.

Run: python3 scripts/build_content_plan.py [--check]
Editorial decisions live in content_plan_choices.py. Outputs are projections.
"""
import argparse
import collections
import hashlib
import json
from pathlib import Path

import content_plan_choices as choices

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'docs/content-plan'
TOPICS = 'vendor/os-taxonomy/data/topics.json'
RESEARCH = 'vendor/os-taxonomy/data/teaching-research.json'
DEPENDENCIES = 'vendor/os-taxonomy/data/dependencies.json'
ATLAS = 'dist/data/atlas.json'
INPUTS = [TOPICS, RESEARCH, DEPENDENCIES, ATLAS, 'vendor/upstream.json',
          'scripts/content_plan_choices.py', 'scripts/build_content_plan.py',
          'dist/exploration-content.js', 'dist/journey-model.js']
INPUTS = list(dict.fromkeys(INPUTS + [p for asset in choices.ASSETS.values() for p in asset['paths']]
                           + ['vendor/os-taxonomy/LICENSE', 'vendor/os-taxonomy/LICENSE-CONTENT']))
PREPARATION = ('批次是制作顺序，不是锁定孩子的学习顺序。入口先提供与当前任务有关的短操作；'
               '遇到基础困难时沿来源关系返回或补做。被引用的基础尚未制作时不得做空跳转，'
               '须补一个真实可操作的准备任务，且不因此自动给该源节点记完成。')
ACCEPTANCE = [
 '逐个源节点核对全部目标、关键操作、反馈和至少一种换条件或换表示的应用；不能只覆盖名称。',
 '保留首次尝试、提示及修正；浏览、任意拖动和跳到总结不能增加学习证据。',
 '检查数学边界、同节点去重、完成/未完成、草稿及备份恢复、桌面操作与本地资源。',
 '需要解释或开放作品的目标保留待评证据；程序检查不代替孩子试用和学习效果验证。',
]


def read(path):
    return json.loads((ROOT / path).read_text())


def digest(path):
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()


def chunks(items, size):
    return [items[i:i + size] for i in range(0, len(items), size)]


def edge_key(edge):
    return edge['prerequisiteId'], edge['topicId'], edge['strength'], edge['reason']


def hard_components(ids, edges):
    """Report cycles instead of silently treating the graph as a teaching order."""
    outgoing = collections.defaultdict(list)
    for e in edges:
        if e['strength'] == 'hard':
            outgoing[e['prerequisiteId']].append(e['topicId'])
    index, low, stack, active, components = {}, {}, [], set(), []

    def visit(v):
        index[v] = low[v] = len(index)
        stack.append(v)
        active.add(v)
        for w in outgoing[v]:
            if w not in index:
                visit(w)
                low[v] = min(low[v], low[w])
            elif w in active:
                low[v] = min(low[v], index[w])
        if low[v] == index[v]:
            comp = []
            while True:
                w = stack.pop()
                active.remove(w)
                comp.append(w)
                if w == v:
                    break
            if len(comp) > 1 or v in outgoing[v]:
                components.append(sorted(comp))

    for v in sorted(ids):
        if v not in index:
            visit(v)
    return components


def build():
    raw = read(TOPICS)['topics']
    raw_by_id = {n['id']: n for n in raw}
    math = {n['id']: n for n in raw if n['subject'] == 'Mathematics'}
    atlas = read(ATLAS)
    nodes = {n['id']: n for n in atlas['nodes']}
    packs = {p['id']: p for p in atlas['packs']}
    records = read(RESEARCH)['records']
    research = {r['topicId']: r for r in records}
    record_indices = {r['topicId']: i for i, r in enumerate(records)}
    topic_indices = {n['id']: i for i, n in enumerate(raw)}
    source_edges = read(DEPENDENCIES)['dependencies']
    edges = [e for e in source_edges if e['topicId'] in math and e['prerequisiteId'] in math]
    external = [e for e in source_edges if e['topicId'] in math and e['prerequisiteId'] not in math]
    assert len(raw_by_id) == len(raw), 'Duplicate source topic IDs'
    assert len(research) == len(records), 'Duplicate research IDs'
    assert set(nodes) == set(math) and len(math) == 587
    assert sorted(map(edge_key, edges)) == sorted(map(edge_key, atlas['edges']))
    assert sorted(map(edge_key, external)) == sorted(map(edge_key, atlas['externalEdges']))
    assert len(edges) == 1223 and len(external) == 32

    group_by_id, group_for_node = {}, {}
    for gid, title, family, pack, member_string in choices.GROUPS:
        assert gid not in group_by_id and family in choices.FAMILIES and pack in packs
        ids = member_string.split()
        group_by_id[gid] = dict(id=gid, title=title, familyId=family, packId=pack, topicIds=ids)
        for nid in ids:
            assert nid in nodes and nid not in group_for_node, f'Missing/duplicate assignment: {nid}'
            expected = choices.PLACEMENT_OVERRIDES.get(nid, (nodes[nid]['packId'],))[0]
            assert pack == expected, f'Unreviewed placement: {nid}'
            group_for_node[nid] = gid
    assert set(group_for_node) == set(nodes)

    families = {}
    for fid, (title, action, transfer, check, asset) in choices.FAMILIES.items():
        families[fid] = dict(id=fid, title=title, learnerAction=action,
                             transferRequirement=transfer, mathReview=check,
                             codeAssetId=asset, status='制作假设，待阶段2及各批验证')
    batches, units, assignment = [], [], {}

    def add_batch(bid, title, phase, items):
        batch = dict(id=bid, title=title, phase=phase, order=len(batches) + 1,
                     unitIds=[], topicIds=[], status='待制作', preparation=PREPARATION)
        for group_id, unit_title, ids in items:
            for part, members in enumerate(chunks(ids, choices.MAX_UNIT_NODES), 1):
                unit_id = f'{bid}-U{len(batch["unitIds"]) + 1:02}'
                title_suffix = f' · 任务组{part}' if len(ids) > choices.MAX_UNIT_NODES else ''
                unit = dict(id=unit_id, title=unit_title + title_suffix, batchId=bid,
                            topicIds=members, sourceGroupIds=list(dict.fromkeys(group_for_node[i] for i in members)),
                            familyIds=list(dict.fromkeys(group_by_id[group_for_node[i]]['familyId'] for i in members)),
                            status='拟共用情境/教具的任务组，尚非完成课程',
                            coverageRule='每个节点仍有独立目标和任务证据；其中一个任务通过不自动完成整组。')
                unit['localRouteId'] = group_id if group_id.startswith('S') else None
                units.append(unit)
                batch['unitIds'].append(unit_id)
                batch['topicIds'].extend(members)
                for nid in members:
                    assert nid not in assignment, f'Duplicate delivery assignment: {nid}'
                    assignment[nid] = (bid, unit_id)
        batches.append(batch)

    sample_items = [(sid, title, ids.split()) for sid, title, ids, _ in choices.SAMPLE_ROUTES]
    add_batch('B01', '三种制作样本', 2, sample_items)
    assert len(assignment) == 12 and set(choices.EXISTING) <= set(assignment)
    for bid, title, member_string in choices.FIRST50_BATCHES:
        ids = member_string.split()
        items = []
        for group in group_by_id.values():
            matches = [nid for nid in ids if nid in group['topicIds']]
            if matches:
                items.append((group['id'], group['title'], matches))
        add_batch(bid, title, 4, items)
    first50 = list(assignment)
    assert len(first50) == 50

    for pack_id in choices.PACK_ORDER:
        pending = []
        for group in group_by_id.values():
            if group['packId'] == pack_id:
                members = [nid for nid in group['topicIds'] if nid not in assignment]
                for part, part_ids in enumerate(chunks(members, choices.MAX_UNIT_NODES), 1):
                    label = group['title'] + (f' · 任务组{part}' if len(members) > choices.MAX_UNIT_NODES else '')
                    pending.append((group['id'], label, part_ids))
        packet, count, packet_number = [], 0, 0
        while pending:
            item = pending.pop(0)
            if packet and count + len(item[2]) > choices.MAX_BATCH_NODES:
                packet_number += 1
                add_batch(f'B{len(batches) + 1:02}', packs[pack_id]['title'] + f' · 批{packet_number}', 5, packet)
                packet, count = [], 0
            packet.append(item)
            count += len(item[2])
        if packet:
            packet_number += 1
            add_batch(f'B{len(batches) + 1:02}', packs[pack_id]['title'] + f' · 批{packet_number}', 5, packet)
    assert set(assignment) == set(math)

    batch_map = {b['id']: b for b in batches}
    catalog = []
    for nid, (bid, uid) in assignment.items():
        node, original = nodes[nid], math[nid]
        group = group_by_id[group_for_node[nid]]
        family = families[group['familyId']]
        record = research.get(nid)
        source_ref = dict(file=TOPICS, jsonPointer=f'/topics/{topic_indices[nid]}', topicId=nid)
        item = dict(id=nid, title=node['title'], sourceName=original['name'],
                    description=original['description'], learningGoals=original['evidence'],
                    originalAssessmentPrompt=original.get('assessmentPrompt'), source=source_ref,
                    currentPackId=node['packId'], plannedPackId=group['packId'],
                    plannedThemeId=packs[group['packId']]['themeId'],
                    placementReason=choices.PLACEMENT_OVERRIDES.get(nid, (None, '沿用现有本地分组。'))[1],
                    groupId=group['id'], unitId=uid, batchId=bid, phase=batch_map[bid]['phase'],
                    familyId=family['id'], learnerActionProposal=family['learnerAction'],
                    transferRequirement=family['transferRequirement'], mathReview=family['mathReview'],
                    codeAssetId=family['codeAssetId'],
                    implementation={'asOf': 'stage-1-baseline', 'currentCoverage': 'docs/phase2/coverage.json', 'state': '已有早期活动' if nid in choices.EXISTING else '预览' if nid in choices.PREVIEWS else '待制作',
                                    'activityId': choices.EXISTING.get(nid, (None,))[0],
                                    'sourceFile': choices.EXISTING.get(nid, (None, None))[1],
                                    'preview': choices.PREVIEWS.get(nid),
                                    'coverageAudit': '本次只核对活动与源ID关联；全部目标的当前对应另见 docs/phase2/coverage.json。'},
                    goalTaskMapping=[dict(goalIndex=i, goal=goal, unitId=uid,
                                         requirement='制作时须有此目标的操作/作品和反馈；不得由组内其他目标代替。',
                                         deliveryStatus='待逐目标实现与核对')
                                     for i, goal in enumerate(original['evidence'])],
                    prerequisiteRelations=[e for e in edges + external if e['topicId'] == nid],
                    nextRelations=[e for e in edges if e['prerequisiteId'] == nid])
        if record:
            path = f'/records/{record_indices[nid]}'
            acts = record['learn']['activities']
            item['teachingResource'] = dict(status='已有教学方案，待适配与内容核对', file=RESEARCH,
                jsonPointer=path, activityCount=len(acts),
                activityReferences=[dict(index=i, title=act['title'], jsonPointer=f'{path}/learn/activities/{i}') for i, act in enumerate(acts)],
                startingActivity=dict(index=0, title=acts[0]['title'], learnerActions=acts[0]['learnerActions'],
                                      intendedInsight=acts[0]['intendedInsight'],
                                      selectionStatus='作为适配起查项；不宣称首个活动覆盖全部目标'),
                keyRepresentations=record['pedagogy']['keyRepresentations'],
                commonMisconceptions=record['pedagogy']['commonMisconceptions'],
                constraints=record['learn']['constraints'],
                assessmentMethod=record['assess'].get('method'),
                assessmentPointer=f'{path}/assess',
                sourceBibliographyPointer=f'{path}/sources',
                publicationStatus='上游教学方案及其引用是素材，尚非本地实现或孩子有效性证据')
        else:
            item['teachingResource'] = dict(status='缺专门教学研究；仍有源目标和表现标准', file=RESEARCH,
                jsonPointer=None, activityCount=0, activityReferences=[], startingActivity=None)
        item['newWork'] = (['检查现有活动与全部源目标对应，补缺并适配共同记录方式。'] if nid in choices.EXISTING else
                           ['将逐项目标做成实际任务、反馈、换条件应用，并接入空间与保存。'])
        item['newWork'].append('保留原学术定义作总结依据；学习入口及操作使用通俗表达。')
        if not record:
            item['newWork'].insert(0, '先完成此节点的教学依据、活动步骤和验证方案，再开放学习。')
        if group['packId'] == 'money':
            item['newWork'].append('涉及英镑、美元、澳元或 GST 的目标保留币制/规则说明；可加人民币情境，但不能替代原目标后仍称已覆盖。')
        catalog.append(item)
    by_id = {n['id']: n for n in catalog}
    gap_records = []
    for item in catalog:
        if item['id'] in research:
            continue
        nid = item['id']
        adjacent = [e['prerequisiteId'] for e in item['prerequisiteRelations'] if e['prerequisiteId'] in research and e['prerequisiteId'] in math]
        same_group = [x for x in group_by_id[item['groupId']]['topicIds'] if x in research]
        same_pack = [x for x in assignment if by_id[x]['plannedPackId'] == item['plannedPackId'] and x in research]
        candidates = list(dict.fromkeys(adjacent + same_group + same_pack))[:3]
        gap = dict(order=len(gap_records) + 1, topicId=nid, title=item['title'], batchId=item['batchId'], phase=item['phase'],
                   due='本批内容制作和开放前补齐；相应内容此前不得计为完成',
                   goalSource=item['source'], learningGoals=item['learningGoals'],
                   adjacentResourceTopicIds=candidates,
                   referenceLimit='相邻目标的方案只作比较材料，不自动视为本节点已有研究。',
                   researchTasks=[
                    '以源定义和每条表现标准列出本节点独有目标，核对相邻节点不能代替的部分。',
                    '查找并记录可核查的数学定义、教学表示或研究依据，区分来源结论和本地设计判断。',
                    '写清学习操作、预期发现、常见错误的反馈以及换条件应用；开放解释另留待评记录。'],
                   proposedAction=item['learnerActionProposal'], validationMethod=item['mathReview'],
                   transferRequirement=item['transferRequirement'], status='已排期，研究未补齐')
        item['researchGapOrder'] = gap['order']
        gap_records.append(gap)

    cumulative = 0
    for batch in batches:
        ids = set(batch['topicIds'])
        batch['incomingRelations'] = [e for e in edges + external if e['topicId'] in ids and e['prerequisiteId'] not in ids]
        batch['internalRelations'] = [e for e in edges if e['topicId'] in ids and e['prerequisiteId'] in ids]
        batch['outgoingRelations'] = [e for e in edges if e['prerequisiteId'] in ids and e['topicId'] not in ids]
        hard_inside_targets = {e['topicId'] for e in batch['internalRelations'] if e['strength'] == 'hard'}
        batch['entryTopicIds'] = [i for i in batch['topicIds'] if i not in hard_inside_targets]
        batch['entryCaveat'] = '这些点在本批内部没有更前的硬依赖，不表示完全不需要基础。'
        batch['laterPrerequisites'] = [e for e in batch['incomingRelations'] if e['prerequisiteId'] in assignment and
            batch_map[assignment[e['prerequisiteId']][0]]['order'] > batch['order']]
        batch['researchCount'] = sum(i in research for i in ids)
        batch['missingResearchIds'] = [i for i in batch['topicIds'] if i not in research]
        batch['existingActivityIds'] = [i for i in batch['topicIds'] if i in choices.EXISTING]
        batch['newNodeCount'] = len(ids) - len(batch['existingActivityIds'])
        batch['topicCount'] = len(ids)
        cumulative += len(ids)
        batch['cumulativePlannedCoverage'] = cumulative
        batch['reuse'] = dict(researchTopicIds=[i for i in batch['topicIds'] if i in research],
                             codeAssetIds=sorted({by_id[i]['codeAssetId'] for i in ids if by_id[i]['codeAssetId']}))
        batch['newWork'] = ['逐目标适配已有方案，补齐本批缺研究项。',
                            '把拟合并的任务组做成简洁操作现场；验证后才计入实际覆盖。',
                            '检查入口和后续关联确实可用；需后批基础时落实准备任务。']
        batch['validation'] = ACCEPTANCE + list(dict.fromkeys(by_id[i]['mathReview'] for i in batch['topicIds']))
    for unit in units:
        ids = set(unit['topicIds'])
        unit['sourceRelations'] = [e for e in edges if e['topicId'] in ids and e['prerequisiteId'] in ids]
        unit['connectionRule'] = '组内无来源边的并列任务只共用教具或情境，不新增知识依赖，不自动点亮连线。'

    cycles = hard_components(math, edges)
    name_counts = collections.Counter(n['name'] for n in math.values())
    quality = dict(
        counts=dict(mathTopics=len(math), internalRelations=len(edges), externalReferences=len(external),
                    researchTopics=sum(n in research for n in math), missingResearchTopics=len(gap_records),
                    existingActivities=len(choices.EXISTING), previewOnly=len(choices.PREVIEWS),
                    nodesWithoutFullActivity=len(math) - len(choices.EXISTING),
                    firstSample=12, firstRelease=50, remainingAfterFirstRelease=537,
                    sharedAuthoringGroups=len(group_by_id), proposedTaskUnits=len(units), deliveryBatches=len(batches)),
        hardRelationCycles=cycles,
        duplicateSourceNames={name: count for name, count in name_counts.items() if count > 1},
        proposedPlacementChanges=[dict(topicId=i, title=nodes[i]['title'], before=nodes[i]['packId'],
                                       after=pack, reason=reason) for i, (pack, reason) in choices.PLACEMENT_OVERRIDES.items()],
        gapDistribution=[dict(batchId=b['id'], count=len(b['missingResearchIds'])) for b in batches if b['missingResearchIds']],
        limitation='计数与映射已核对；归并和交互是制作安排，尚未经孩子试用，不增加应用内可学习数量。')
    assert quality['counts']['researchTopics'] == 502 and len(gap_records) == 85
    return dict(schema='math-content-plan/1', version=choices.PLAN_VERSION, date=choices.PLAN_DATE,
        state='阶段1制作清单及实现基线；最新已制作覆盖另见 docs/phase2/coverage.json', source=read('vendor/upstream.json'),
        inputHashes={p: digest(p) for p in INPUTS},
        scope='固定来源587个数学节点；仅电脑、本地；年级与年龄字段不参与分组、抽样或批次排序。',
        authoringNotes=[PREPARATION, '分组是本地适配；来源边按原方向和理由保留。',
                       f'{len(group_by_id)} 个共用教具/情境方向可以继续拆分；实际课程数量在制作和试用后确定。',
                       '教学内容来源及许可保留 vendor/os-taxonomy/LICENSE、LICENSE-CONTENT 与各示例说明。',
                       '阶段2记录实耗后估算工期，本清单不虚报日期或课时。'],
        themes=atlas['themes'], packs=[{k: p[k] for k in ['id','themeId','title']} for p in atlas['packs']],
        families=families, assets=choices.ASSETS, groups=list(group_by_id.values()),
        sampleRoutes=[dict(id=s, title=t, topicIds=ids.split(), rationale=why) for s,t,ids,why in choices.SAMPLE_ROUTES],
        first50TopicIds=first50, batches=batches, workUnits=units, nodes=catalog,
        researchGaps=gap_records, sourceRelations=edges, externalReferences=external,
        externalReferenceTopics=[raw_by_id[i] for i in sorted({e['prerequisiteId'] for e in external})],
        audit=quality)


def esc(value):
    return str(value).replace('|', '\\|').replace('\n', ' ')


def node_name(nid, by_id):
    return f'{by_id[nid]["title"]}（`{nid}`）'


def write_views(plan):
    by_id = {n['id']: n for n in plan['nodes']}
    packs = {p['id']: p['title'] for p in plan['packs']}
    c = plan['audit']['counts']
    intro = [
        '# 数学全量内容制作清单', '', f'{plan["date"]} · 阶段 1 已完成清单核对，内容制作仍按阶段 2—5 推进。', '',
        '**587 个源节点都有制作去向：起始 3 → 样本累计 12 → 首批累计 50 → 全量 587。** 此清单保留阶段 1 的实现基线；当前已制作内容见 [阶段 2 覆盖](phase2/COVERAGE.md)。', '',
        f'502 个节点有教学方案，85 个缺专门研究。已逐项登记目标、活动引用、适合的操作、补充工作、验证要求和交付批次。', '',
        f'按内容整理为 **{c["sharedAuthoringGroups"]} 个共用教具或情境方向、{c["proposedTaskUnits"]} 个拟制作任务组、{c["deliveryBatches"]} 个批次**。这些是制作归并方案，不是已经完成的课程数量，也不是孩子每天要完成的数量。', '',
        '- [全部节点与拟合并任务](content-plan/ALL-NODES.md)：按批次、任务组查看 587 个节点。',
        '- [85 个研究缺口的补充顺序](content-plan/RESEARCH-GAPS.md)：目标、参考材料、验证方式和所属批次。',
        '- [完整机器清单](content-plan/catalog.json)：每个节点的所有源目标、操作建议、方案指针和关系。',
        '- [核对结果](content-plan/validation.json)：输入指纹、覆盖和边界检查。', '',
        '## 首批 12 个：阶段 2，新增 9 个', '',
        '| 小路线 | 节点 | 已有基础与新增工作 |', '| --- | --- | --- |',
    ]
    for route in plan['sampleRoutes']:
        names = '<br>'.join(node_name(i, by_id) for i in route['topicIds'])
        intro.append(f'| {route["id"]} {route["title"]} | {names} | {route["rationale"]} |')
    intro += ['', '这里明确做三类操作：分割与不同表示联动、三维拆层与填充、数据的记录和图表转换。S03 的两个缺研究节点先补资料再实现。A03 与旧的小数活动是不同源节点，不能重复或混淆计数。', '',
              '## 首批累计 50 个：阶段 4 再增加 38 个', '',
              'B01 的 12 个已在上表。下面逐批列出其余 38 个；合计覆盖全部五个主题。', '',
              '| 批次 | 主题任务 | 新增节点 |', '| --- | --- | --- |']
    for batch in plan['batches'][1:5]:
        intro.append(f'| {batch["id"]} | {batch["title"]}（{batch["topicCount"]}） | ' + '<br>'.join(node_name(i, by_id) for i in batch['topicIds']) + ' |')
    first_gaps = sum(1 for i in plan['first50TopicIds'] if not by_id[i]['teachingResource']['activityCount'])
    intro += ['', f'首批 50 个包含 **{first_gaps} 个缺研究节点**，资料缺口从样本阶段开始处理。其余 537 个全部进入下面的后续批次。阶段 3 的每日接续功能仍独立推进，不计作新增知识内容。', '',
              '## 全部批次及制作顺序', '',
              '后续单批暂以不超过 24 个源节点安排；同方向每个拟任务组暂不超过 6 个节点，各有独立任务证据。阶段 2 实测后可调整批次大小和归并，必须保持源节点去向完整。', '',
              '| 批次 | 内容 | 阶段 | 节点数 | 已有方案 / 缺研究 | 累计计划覆盖 |', '| --- | --- | --- | ---: | ---: | ---: |']
    for b in plan['batches']:
        intro.append(f'| [{b["id"]}](content-plan/ALL-NODES.md#{b["id"].lower()}) | {b["title"]} | {b["phase"]} | {b["topicCount"]} | {b["researchCount"]} / {len(b["missingResearchIds"])} | {b["cumulativePlannedCoverage"]} |')
    intro += ['', '## 关系和入口怎样使用', '', PREPARATION, '',
              '每批在全量清单中列出入口候选、后续关系、复用部分和验收；完整 JSON 保留所有进入、离开及指向后批基础的源关系。**制作顺序与学习关系分开记录**，不会为了凑一条路线伪造箭头。', '',
              '共同情境不等于存在知识依赖。两个节点没有源关系时，可以共用教具，但不显示成已打通的来源连线；每天连接点亮的实现仍在阶段 3。', '',
              '## 本次发现与调整', '',
              '现有分组主要可沿用；以下 5 项按说明和表现标准建议换组。只改变制作清单的归属，应用地图及确定性坐标保持现状，后续相关内容实现时再同步。', '',
              '| 节点 | 当前分组 → 拟分组 | 依据 |', '| --- | --- | --- |']
    for x in plan['audit']['proposedPlacementChanges']:
        intro.append(f'| {x["title"]}（`{x["topicId"]}`） | {packs[x["before"]]} → {packs[x["after"]]} | {x["reason"]} |')
    intro += ['', '相同或相近名称保留不同源 ID，按目标、数值范围、表示和验证要求区分，不能直接去重。钱的节点中存在具体币制和规则要求，中文情境改编须保留这些差异。', '',
              f'硬关系循环检测：{len(plan["audit"]["hardRelationCycles"])} 个循环分量。无论是否有循环，都不将来源箭头机械变成锁课顺序。', '',
              '## 复用边界与完成标准', '',
              '- 502 份研究的活动、表示、误解和评估均可逐项定位；它们还需要中文适配、交互实现和目标核对。',
              '- Hidden Cubes 直接锚定数单位立方体，其他体积内容借旋转、拆层、计数和反馈机制；展开图等需另做几何模型。',
              '- Bee Builder 可借精确平面图形、等面积比较和边界展开；不强制把平面目标放进三维操作。',
              '- 本地三个分数活动保留。所有新增源节点仍需实际任务；共同使用一个教具不自动让多个节点完成。',
              '- 每个节点保留全部目标与逐目标任务槽；制作时逐一填入操作、作品及反馈，检查换条件应用。',
              '- 阶段 1 通过的是清单完整性、来源一致性和批次可追溯性。数学任务质量、真实操作及孩子体验在后续验证。', '',
              '阶段 1 当时的下一项是 B01；目前已经实现，见 [阶段 2 覆盖](phase2/COVERAGE.md)。当前下一阶段为每日学习接续，完整状态见 [执行计划](EXECUTION-PLAN.md)。', '',
              '## 来源与重建', '',
              f'来源固定于 `{plan["source"]["commit"]}`；原库目标、关系与研究保持原文，分组、交互家族及批次是本地设计。许可与署名保留原库 `LICENSE`、`LICENSE-CONTENT` 和各示例说明。', '',
              '编辑 `scripts/content_plan_choices.py` 的明确选择；运行 `python3 scripts/build_content_plan.py` 重建。`--check` 只核对已生成文件是否与输入一致。不要手工编辑生成清单。', '']

    all_lines = ['# 全部 587 个源节点与拟合并任务', '', '这是内容制作资料，不是孩子端入口。下列分组是拟共用教具/情境的任务组；每个节点都有独立目标，不由同组其他任务代替。', '',
                 '[返回总览](../CONTENT-INVENTORY.md) · [机器清单](catalog.json) · [研究缺口](RESEARCH-GAPS.md)', '']
    unit_map = {u['id']: u for u in plan['workUnits']}
    for b in plan['batches']:
        all_lines += [f'<a id="{b["id"].lower()}"></a>', f'## {b["id"]} {b["title"]}', '',
                      f'阶段 {b["phase"]}；{b["topicCount"]} 个节点；已有方案 {b["researchCount"]}；缺研究 {len(b["missingResearchIds"])}；累计计划覆盖 {b["cumulativePlannedCoverage"]}。', '',
                      '**入口候选：** ' + '；'.join(by_id[i]['title'] + f' `{i}`' for i in b['entryTopicIds'][:3]) + '。' + b['entryCaveat'],
                      f'跨批基础关系 {len(b["incomingRelations"])} 条，其中 {len(b["laterPrerequisites"])} 条基础安排在后批；依赖清单和原理由保留在 JSON。开放本批前按实际需要提供准备任务。', '']
        if b['outgoingRelations']:
            example_edges = b['outgoingRelations'][:3]
            all_lines.append('**后续联系示例（源关系）：** ' + '；'.join(
                f'{by_id[e["prerequisiteId"]]["title"]} `{e["prerequisiteId"]}` → {by_id[e["topicId"]]["title"]} `{e["topicId"]}`（{e["strength"]}，{by_id[e["topicId"]]["batchId"]}）' for e in example_edges) + '。')
        else:
            all_lines.append('**后续联系：** 固定来源中没有从本批指向批外的数学关系；不补造依赖。')
        assets = b['reuse']['codeAssetIds']
        all_lines += ['', '**可复用：** ' + f'{b["researchCount"]} 个节点的已有活动/表示/评估；' + ('；'.join(plan['assets'][x]['label'] for x in assets) if assets else '没有直接匹配的现成完整代码示例，先复用方案，再制作操作组件。'),
                      '**需新做：** ' + ' '.join(b['newWork']),
                      '**验收：** ' + ' '.join(ACCEPTANCE), '']
        for uid in b['unitIds']:
            u = unit_map[uid]
            all_lines += [f'### {uid} {u["title"]}', '', '拟共同学习：' + '；'.join(node_name(i, by_id) for i in u['topicIds']) + '。', '']
            for fid in u['familyIds']:
                family = plan['families'][fid]
                all_lines += [f'- **{family["title"]}：** {family["learnerAction"]} {family["transferRequirement"]}',
                              f'- **数学核对：** {family["mathReview"]}']
            all_lines += ['', '| 节点与来源 ID | 全部目标的任务对应 | 资料及复用起查项 | 阶段 1 实现基线 |', '| --- | --- | --- | --- |']
            for nid in u['topicIds']:
                n = by_id[nid]
                goals = '<br>'.join(f'{i+1}. {esc(g)}' for i,g in enumerate(n['learningGoals']))
                res = n['teachingResource']
                source = f'{res["activityCount"]} 个方案；起查：{esc(res["startingActivity"]["title"])}；评估：{esc(res["assessmentMethod"])}' if res['activityCount'] else f'缺研究；补充顺序 {n["researchGapOrder"]}；已有源目标'
                all_lines.append(f'| {n["title"]}<br>`{nid}` | {goals} | {source} | {n["implementation"]["state"]} |')
            all_lines += ['', '以上各目标制作时分别对应操作/作品与反馈。源记录、全部活动标题和指针、起查活动动作、表示及误解见 `catalog.json` 同一 ID。', '']

    gaps = ['# 85 个教学研究缺口', '', '“缺研究”表示没有专门的 teaching-research 记录；每个节点仍有原库定义和学习表现标准。以下是补充安排，不表示研究已经完成。', '',
            '[返回总览](../CONTENT-INVENTORY.md) · [全部节点](ALL-NODES.md)', '',
            '按制作批次和任务组逐项补齐，从 B01 开始。每项在所属批次开放前完成：核对全部源目标 → 查可核查的教学依据 → 设计操作、反馈与换条件运用 → 检查数学与运行。相邻研究只供比较，不能直接当本节点已有研究。', '']
    for gap in plan['researchGaps']:
        gaps += [f'## {gap["order"]:02} · {gap["title"]} · {gap["batchId"]}', '',
                 f'源 ID：`{gap["topicId"]}`；阶段 {gap["phase"]}；状态：{gap["status"]}。', '',
                 '**需要覆盖的源目标：**', '']
        gaps += [f'- {g}' for g in gap['learningGoals']]
        gaps += ['', '**可先比较的已有研究：** ' + ('；'.join(node_name(i, by_id) for i in gap['adjacentResourceTopicIds']) or '无同组或相邻完整研究；需另行查找依据。'),
                 '**拟学习动作：** ' + gap['proposedAction'],
                 '**验证：** ' + gap['validationMethod'] + ' ' + gap['transferRequirement'], '']

    validation = dict(status='PASS', scope='阶段1资料与制作映射；不代表内容已实现或孩子已学会',
        date=plan['date'], counts=plan['audit']['counts'],
        checks=[
            dict(name='源数学节点逐项覆盖且每个只有一个主交付批次', passed=True),
            dict(name='原始1223条数学关系及32条外部参考的方向强弱理由一致', passed=True),
            dict(name='502份教学方案与85个缺研究节点按ID联接', passed=True),
            dict(name='12包含现有3；50包含12；余量537；新增9+38+537=584', passed=True),
            dict(name='所有源目标保留且逐项映射到任务组；不是实际实现声明', passed=True),
            dict(name='85项缺口均有补充顺序、批次与数学/迁移验证要求', passed=True),
            dict(name='分组无遗漏重复；年龄年级字段不参与选择和排序', passed=True),
        ], inputHashes=plan['inputHashes'],
        nextVerification='阶段2实现时验证数学内容、桌面交互和记录；真实孩子使用仍待阶段4。')
    return {
        ROOT / 'docs/CONTENT-INVENTORY.md': '\n'.join(intro),
        OUTPUT / 'catalog.json': json.dumps(plan, ensure_ascii=False, indent=2) + '\n',
        OUTPUT / 'ALL-NODES.md': '\n'.join(all_lines),
        OUTPUT / 'RESEARCH-GAPS.md': '\n'.join(gaps),
        OUTPUT / 'validation.json': json.dumps(validation, ensure_ascii=False, indent=2) + '\n',
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    plan = build()
    outputs = write_views(plan)
    if args.check:
        stale = [str(p.relative_to(ROOT)) for p, data in outputs.items() if not p.exists() or p.read_text() != data]
        if stale:
            raise SystemExit('Stale/missing generated files: ' + ', '.join(stale))
    else:
        OUTPUT.mkdir(parents=True, exist_ok=True)
        for path, data in outputs.items():
            path.write_text(data)
    print(json.dumps(dict(mode='check' if args.check else 'write', **plan['audit']['counts']), ensure_ascii=False))


if __name__ == '__main__':
    main()
