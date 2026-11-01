"""Read-only structural audit for the S1 discussion; no prototype UI is tested.

Run from any directory: python3 docs/research/evidence/check_s1_structure.py
The JSON is written to stdout so a dated evidence file can be retained explicitly.
"""

from collections import Counter, deque
from pathlib import Path
import hashlib
import json


def summarize(nodes, edges):
    ids = set(nodes)
    assert len(ids) == len(nodes), "Duplicate source node IDs"
    assert all(e["prerequisiteId"] in ids and e["topicId"] in ids for e in edges)
    assert all(e["strength"] in {"hard", "soft"} for e in edges)
    hard = [e for e in edges if e["strength"] == "hard"]
    pairs = {(e["prerequisiteId"], e["topicId"]) for e in hard}
    assert len(pairs) == len(hard), "Repeated hard endpoint pairs affect degree counts"
    incoming = Counter(e["topicId"] for e in hard)
    outgoing = Counter(e["prerequisiteId"] for e in hard)
    next_nodes = {i: [] for i in ids}
    adjacent = {i: set() for i in ids}
    for e in hard:
        a, b = e["prerequisiteId"], e["topicId"]
        next_nodes[a].append(b)
        adjacent[a].add(b)
        adjacent[b].add(a)

    roots = sorted(i for i in ids if incoming[i] == 0)
    remaining = {i: incoming[i] for i in ids}
    layers = {i: 0 for i in ids}
    queue = deque(roots)
    visited = 0
    while queue:
        i = queue.popleft()
        visited += 1
        for j in next_nodes[i]:
            layers[j] = max(layers[j], layers[i] + 1)
            remaining[j] -= 1
            if remaining[j] == 0:
                queue.append(j)
    assert visited == len(ids), "Hard graph is not acyclic"

    unseen = set(ids)
    component_sizes = []
    while unseen:
        start = min(unseen)
        unseen.remove(start)
        stack, size = [start], 0
        while stack:
            i = stack.pop()
            size += 1
            for j in sorted(adjacent[i] & unseen):
                unseen.remove(j)
                stack.append(j)
        component_sizes.append(size)

    forest_edges = len(ids) - len(roots)
    additional = len(hard) - forest_edges
    assert additional == sum(max(0, incoming[i] - 1) for i in ids)
    return {
        "nodes": len(ids),
        "edges": len(edges),
        "hard_edges": len(hard),
        "soft_edges": len(edges) - len(hard),
        "direct_branch_nodes_outdegree_at_least_2": sum(outgoing[i] >= 2 for i in ids),
        "direct_merge_nodes_indegree_at_least_2": sum(incoming[i] >= 2 for i in ids),
        "hard_roots": len(roots),
        "hard_sinks": sum(outgoing[i] == 0 for i in ids),
        "hard_is_dag": visited == len(ids),
        "hard_weak_component_sizes": sorted(component_sizes, reverse=True),
        "max_hard_chain_edge_count": max(layers.values()),
        "layer_indices": sorted(set(layers.values())),
        "single_parent_forest_edge_count_preserving_original_roots": forest_edges,
        "additional_hard_edge_count_beyond_single_parent_forest": additional,
        "hard_edges_outside_forest_fraction": additional / len(hard),
    }


root = Path(__file__).resolve().parents[3]
source = root / "dist/data/atlas.json"
raw = source.read_bytes()
atlas = json.loads(raw)
node_ids = [n["id"] for n in atlas["nodes"]]
domain_ids = [n["id"] for n in atlas["nodes"] if n["domainId"] != "thinking"]
domain_set = set(domain_ids)
domain_edges = [
    e for e in atlas["edges"]
    if e["prerequisiteId"] in domain_set and e["topicId"] in domain_set
]
result = {
    "source": "dist/data/atlas.json",
    "source_sha256": hashlib.sha256(raw).hexdigest(),
    "scope": "Internal source edges only; externalEdges excluded. Direction is prerequisiteId -> topicId.",
    "definitions": {
        "branch": "At least two distinct direct outgoing hard neighbors; no transitive reduction or ranking filter.",
        "merge": "At least two distinct direct incoming hard neighbors; no transitive reduction or ranking filter.",
        "forest": "Choose one existing incoming hard edge per non-root; preserve direction and original hard roots.",
        "domain_only": "Induced subgraph on nodes with domainId != thinking; not the full project scope.",
    },
    "all_source_nodes": summarize(node_ids, atlas["edges"]),
    "domain_only": summarize(domain_ids, domain_edges),
    "limits": "No cloud prototype, mathematical explanation, usability or learning outcome was validated by this calculation.",
}
print(json.dumps(result, ensure_ascii=False, indent=2))
