#!/usr/bin/env python3
"""#341 independent frozen-base patch replay and native-position handoff audit."""
import csv
import hashlib
import io
import json
import re
import subprocess
import tempfile
from pathlib import Path

BASE = "f4be9f88da7af59b6df1819ae242cf134591c376"
HANDOFF = "3c4801f969f09a98c9f2bc4ed2f1cb953adbd530"
P007 = "ae6abcdf5a0a529d1cf6370b0c1378f6707b0b12"
ROOT = "docs/math-parallel/issue-341-handoff-335/"
OUT = Path("verification/issue-341-handoff-audit/results.json")


def git(*args, cwd=None, data=None):
    result = subprocess.run(["git", *args], cwd=cwd, input=data,
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode:
        raise RuntimeError(f"git {' '.join(args)}: {result.stderr.decode(errors='replace')[:1000]}")
    return result.stdout


def show(ref, path):
    return git("show", f"{ref}:{path}")


def sha256(blob):
    return hashlib.sha256(blob).hexdigest()


def audit():
    for rev in (BASE, HANDOFF, P007):
        git("fetch", "--no-tags", "origin", rev)

    manifest = json.loads(show(HANDOFF, ROOT + "manifest.json"))
    assert manifest["base"] == BASE
    assert manifest["candidates"] == 97 and manifest["positions"] == 335
    records = manifest["records"]
    assert len(records) == 97

    positions_csv = list(csv.DictReader(io.StringIO(show(HANDOFF, ROOT + "positions.csv").decode("utf-8"))))
    assert len(positions_csv) == 335
    indexed = {}
    expected_paths = set()
    for record in records:
        packet = record["packet"]
        for position in record["positions"]:
            key = (packet, position)
            assert key not in indexed
            indexed[key] = record
        for filename in record["files"]:
            assert filename not in expected_paths, f"duplicate candidate file {filename}"
            expected_paths.add(filename)

    assert len(indexed) == 335 and len(expected_paths) == 292
    for row in positions_csv:
        key = (row["题包"], row["原生题位"])
        assert key in indexed, f"CSV unknown position {key}"
        record = indexed.pop(key)
        for field, expected in (("候选分支", record["branch"]),
                                ("固定提交", record["commit"]),
                                ("代码补丁", record["patch"]),
                                ("测试回执", record["receipt"])):
            assert row[field] == expected, f"CSV {key} {field} mismatch"
    assert not indexed

    closeout = show(P007, "docs/math-parallel/P007-DEVELOPMENT-CLOSEOUT.md").decode()
    p007_rows = [line for line in closeout.splitlines()
                 if line.startswith("| P007") and "`" in line]
    p007_positions = [p.strip() for line in p007_rows
                      for p in line.split("|")[2].strip().split(",")]
    all_positions = {p for r in records for p in r["positions"]}
    assert len(p007_rows) == 16 and len(p007_positions) == len(set(p007_positions)) == 30
    assert not (set(p007_positions) & all_positions)
    assert len(set(p007_positions) | all_positions) == 365

    errors = []
    results = []
    with tempfile.TemporaryDirectory(prefix="math-341-") as temporary:
        tree = str(Path(temporary) / "base")
        git("worktree", "add", "--detach", tree, BASE)
        try:
            for rec in records:
                packet = rec["packet"]
                reasons = []
                try:
                    patch = show(HANDOFF, ROOT + rec["patch"])
                    receipt_bytes = show(HANDOFF, ROOT + rec["receipt"])
                    if sha256(patch) != rec["patchSha256"]:
                        raise AssertionError("patch SHA-256 mismatch")
                    if sha256(receipt_bytes) != rec["receiptSha256"]:
                        raise AssertionError("receipt SHA-256 mismatch")
                    receipt = json.loads(receipt_bytes)
                    if not (receipt.get("commit") == rec["commit"] and
                            receipt.get("base") == BASE and
                            receipt.get("branch") == rec["branch"] and
                            receipt.get("status") == "integration-ready" and
                            receipt.get("formalAIncrement") == 0):
                        raise AssertionError("receipt identity/status mismatch")
                    if receipt.get("formalCI") != "NOT_RUN":
                        raise AssertionError("local receipt unexpectedly claims formal CI")
                    if "position" in receipt and receipt["position"] not in rec["positions"]:
                        raise AssertionError("receipt native position mismatch")
                    if "sources" in receipt:
                        source_keys = {f"{s['sessionId']}:{s['index']}" for s in receipt["sources"]}
                        if source_keys != set(rec["positions"]):
                            raise AssertionError("receipt source position mismatch")
                        for source in receipt["sources"]:
                            if (not isinstance(source.get("nodeId"), str) or
                                    not re.fullmatch(r"[a-f0-9]{64}", str(source.get("taskHash", "")))):
                                raise AssertionError("missing source node/full task fingerprint")

                    git("reset", "--hard", BASE, cwd=tree)
                    git("clean", "-fdx", cwd=tree)
                    git("apply", "--check", "-", cwd=tree, data=patch)
                    git("apply", "-", cwd=tree, data=patch)
                    actual_paths = {p for p in git("ls-files", "--others",
                                                 "--exclude-standard", cwd=tree).decode().splitlines()}
                    if actual_paths != set(rec["files"]):
                        raise AssertionError(f"patch changed paths mismatch: {sorted(actual_paths ^ set(rec['files']))}")
                    for filename in rec["files"]:
                        match = re.search(
                            r"(?m)^diff --git a/" + re.escape(filename) +
                            r" b/" + re.escape(filename) +
                            r"\\nnew file mode 100644\\nindex 0{40}\\.\\.([a-f0-9]{40})",
                            patch.decode("utf-8"))
                        if not match:
                            raise AssertionError(f"missing additive Git Blob index: {filename}")
                        actual_blob = git("hash-object", filename, cwd=tree).decode().strip()
                        integrated_blob = git("rev-parse", f"HEAD:{filename}").decode().strip()
                        if not (actual_blob == match.group(1) == integrated_blob):
                            raise AssertionError(f"replayed/integrated Blob mismatch: {filename}")
                except Exception as exc:
                    reasons.append(str(exc))
                    errors.append({"packet": packet, "positions": rec["positions"], "reason": str(exc)})
                results.append({"packet": packet, "positions": rec["positions"],
                                "files": rec["files"], "status": "PASS" if not reasons else "FAIL",
                                "reasons": reasons})
        finally:
            git("worktree", "remove", "--force", tree)

    p007_files = git("diff", "--name-only", BASE + "...HEAD").decode().splitlines()
    staged_p007 = [p for p in p007_files if re.search(r"(?:/p007[a-p]-|/p9-p007[a-p]-)", p)]
    assert len(staged_p007) == 48, f"expected 48 staged P007 files, got {len(staged_p007)}"
    assert all(f in p007_files for f in expected_paths), "candidate file missing from integration HEAD"
    summary = {
        "schema": "issue-341-central-handoff-replay/1",
        "integratedHead": git("rev-parse", "HEAD").decode().strip(),
        "freezeBase": BASE, "handoffRef": HANDOFF,
        "positionTotals": {"P007": 30, "B": 308, "P009": 27, "deduplicated": 365},
        "candidatePackets": len(records), "passed": sum(r["status"] == "PASS" for r in results),
        "failed": len(errors), "errors": errors, "results": results,
        "formalAIncrement": 0, "independentBrowserArtifactAudit": "NOT_RUN"
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({k: v for k, v in summary.items() if k not in ("results", "errors")}, ensure_ascii=False))
    for error in errors:
        print("HANDOFF_FAIL", json.dumps(error, ensure_ascii=False))
    if errors:
        raise SystemExit(1)


if __name__ == "__main__":
    audit()
