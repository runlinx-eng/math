#!/usr/bin/env python3
"""Read fixed B33 label artifacts without running artifact code or a math solver.

This is a math-result integrity/display inspection, not a startup diagnostic,
a full mathematics replay, a P10 review, or acceptance of every Required artifact.
"""
import argparse
import base64
import collections
import hashlib
import importlib.util
import io
import json
import os
import pathlib
import re
import struct
import tempfile

CORE_SHA256 = "cb0c5ec3cced4a497e127c9801aa60f0de10b4d8e26bb65ffe7cb081c9d94efa"
BROWSER_SHA256 = "e7585075c1f7ddf598729bf008b354910a94c8826bad61f0f3131ad5eff469fb"
CASE = {
    "run": 43636915372, "attempt": 1, "money_job": 132576834150,
    "head": "b07d95fe2de1fae613db0404af0d4eae72a67083",
    "checkout": "dc215797d8e3705d1c038133239e848750853367",
    "tree": "729aa62d52e92fd3dbd09c340ab20b1085cabc73",
    "dist": "6a8e3cda6a5fea84356ebb5d6dfbfc7db6334bef",
    "base": "8435f32cda20b5bee1764280df67dab3f9c4503a",
    "artifact": 14131725950,
    "name": "math-required-checks-browser-evidence-evidence-money-1",
    "bytes": 26716024,
    "sha256": "7b38eb5d13a7677ff628328cc6a8f187c80047852d415c16cfeb841a5c9fecc7",
    "receipt_artifact": 14131840217,
    "receipt_name": "required-browser-result-evidence-money-attempt-1",
    "receipt_bytes": 446,
    "receipt_sha256": "6f1051519ccca88e513e52368df9ec8b730dc5f7227e37fb4c78bcc0f183c046",
    "kind": "math-result",
    "original": "tests/p9-money-adapter-browser.cjs",
}
SOURCE_FILES = {
    "dist/learning/money-evidence.js", "dist/learning/thinking-feedback.js",
    "dist/learning/evidence-adapters.js", "dist/learning/state.js",
    "dist/exploration-core.js", "dist/storage.js",
    "tests/p9-money-adapter-browser.cjs", "tests/fixtures/p9-money-cases.cjs",
    "dist/learning/phase5/b33-model.js", "dist/learning/phase5/b33-view.js",
    "dist/learning/phase5/b33.js", "dist/learning/phase5/b38-more.js",
    "dist/learning/phase5/b38.js", "dist/learning/phase5/b16-model.js",
}
# Labels and question indices are frozen from the original b33/b38 task sources,
# not obtained by executing the adapter, fixtures, or code inside an artifact.
CHOICES = {
    ("coincombo", 2): {"questionIndex": 0, "questionLabel": "两组摆法的总额",
                      "raw": "same", "displayed": "一样", "clearPhase": "cleared"},
    ("auscoins", 2): {"questionIndex": 1, "questionLabel": "$10够吗",
                     "raw": "yes", "displayed": "够", "clearPhase": "basket-rebuilt"},
    ("modmoney", 1): {"questionIndex": 2, "questionLabel": "£1.50表示",
                     "raw": "change", "displayed": "找回的钱", "clearPhase": "basket-rebuilt"},
    ("lifemath38", 2): {"questionIndex": 2, "questionLabel": "£1.50表示",
                       "raw": "change", "displayed": "找回的钱", "clearPhase": "basket-rebuilt"},
}
SELECTED = [("coincombo", 2), ("auscoins", 2), ("modmoney", 1)]
ARRAYS = {"checks", "errors", "remote", "observations", "isolated",
          "boundaries", "forgeries", "backups", "offline"}
EXPECTED_COUNTS = {"checks": 25283, "errors": 0, "remote": 0, "observations": 56,
                   "isolated": 60, "boundaries": 16, "forgeries": 224, "backups": 2, "offline": 2}
LABEL_SUFFIX = " choice feedback shows the original visible option label and preserves the raw enum only in evidence"
R = None


def load_reader():
    path = pathlib.Path(__file__).with_name("review-startup-diagnostic-artifacts.py")
    if hashlib.sha256(path.read_bytes()).hexdigest() != CORE_SHA256:
        raise ValueError("reviewed read-only reader dependency changed")
    spec = importlib.util.spec_from_file_location("fixed_artifact_transport", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def same_json(left, right):
    options = {"ensure_ascii": False, "sort_keys": True, "allow_nan": False, "separators": (",", ":")}
    return json.dumps(left, **options) == json.dumps(right, **options)


def validate_identity():
    # No completed_job shortcut: this successful mathematics group is read only
    # after its whole fixed Required run has naturally completed successfully.
    identity = R.validate_run(CASE)
    R.require(identity["run"]["conclusion"] == "success", "fixed complete Required run is not successful")
    job = R.api("actions/jobs/" + str(CASE["money_job"]))
    R.require(job["id"] == CASE["money_job"] and job["run_id"] == CASE["run"]
              and job["head_sha"] == CASE["head"] and job["name"] == "browser (evidence-money)"
              and job["status"] == "completed" and job["conclusion"] == "success",
              "fixed money job identity or successful result changed")
    identity["job"] = {key: job.get(key) for key in
                       ("id", "run_id", "head_sha", "name", "status", "conclusion", "html_url")}
    source = R.ensure_source(CASE)
    R.require(source["originalSHA256"] == BROWSER_SHA256, "fixed money browser source changed")
    parents = R.git_output("show", "-s", "--format=%P", CASE["checkout"]).decode().strip().split()
    R.require(parents == [CASE["base"], CASE["head"]], "actual money checkout parents changed")
    source["checkoutParents"] = parents
    return identity, source


def exact_receipt(archive):
    names = archive.namelist()
    expected_name = "evidence-money-attempt-1.json"
    R.require(names == [expected_name], "money receipt ZIP must contain its one original JSON")
    receipt = R.strict_snapshot_object(R.member_bytes(archive, expected_name, 64 * 1024))
    expected = {"schema": "math-required-browser-group/1", "group": "evidence-money",
                "sha": CASE["checkout"], "event": "pull_request", "runId": str(CASE["run"]),
                "attempt": 1, "required": True, "status": "success"}
    R.require(set(receipt) == set(expected) | {"commands"}, "money receipt fields differ")
    for key, value in expected.items():
        R.require(type(receipt[key]) is type(value) and receipt[key] == value,
                  "money receipt identity differs: " + key)
    commands = receipt["commands"]
    R.require(isinstance(commands, list) and len(commands) == 1, "money command inventory differs")
    command = commands[0]
    R.require(set(command) == {"file", "env", "outcome", "exitCode", "signal", "error", "elapsedMs"},
              "money command fields differ")
    R.require(command["file"] == CASE["original"] and command["env"] == {}
              and command["outcome"] == "success" and type(command["exitCode"]) is int
              and command["exitCode"] == 0 and command["signal"] is None and command["error"] is None,
              "original money command did not succeed as observed")
    R.require(type(command["elapsedMs"]) is int and command["elapsedMs"] >= 0,
              "money command duration is not an original integer duration")
    return receipt


def provenance_review(value, standalone):
    R.require(same_json(value, standalone), "result and standalone provenance differ")
    expected = {"headSha": CASE["head"], "testedCheckoutSha": CASE["checkout"],
                "runId": str(CASE["run"]), "runAttempt": str(CASE["attempt"]),
                "childTrial": False, "independentTeachingReview": False,
                "syntheticCompatibilityFixturesAreChildRecords": False}
    for key, field in expected.items():
        R.require(type(value.get(key)) is type(field) and value[key] == field,
                  "money provenance differs: " + key)
    hashes = value["sourceFiles"]
    R.require(set(hashes) == SOURCE_FILES, "money explicit source-file inventory differs")
    rows = []
    for name in sorted(SOURCE_FILES):
        data = R.git_output("show", CASE["checkout"] + ":" + name)
        R.require(hashes[name] == R.sha256(data), "money source bytes differ: " + name)
        rows.append({"file": name, "bytes": len(data), "sha256": R.sha256(data)})
    return {"files": rows, "allListedSourceHashesEqual": True,
            "scope": "14 source files explicitly captured by the original money script; not a full runtime dist manifest"}


def label_observation(observation):
    R.require(type(observation["index"]) is int, "native question index is not an integer")
    key = (observation["id"], observation["index"])
    question = CHOICES[key]
    expected_phases = {"corrected", "repeated-check", "prose-rechecked",
                       question["clearPhase"], "retry-corrected"}
    phases = observation["phases"]
    actual_strict = [phase["phase"] for phase in phases if phase.get("strict") is True]
    rows = []
    for phase in phases:
        if phase["phase"] not in expected_phases:
            continue
        words = phase.get("words")
        desired = "本次提交的“" + question["questionLabel"] + "”是“" + question["displayed"] + "”"
        raw_phrase = "本次提交的“" + question["questionLabel"] + "”是“" + question["raw"] + "”"
        choices = [answer for answer in (phase.get("proof") or {}).get("answers", [])
                   if answer.get("kind") == "choice"]
        source_answers_match = len(choices) == 1 and all(
            type(answer.get("index")) is int and answer.get("index") == question["questionIndex"]
            and answer.get("label") == question["questionLabel"]
            and answer.get("raw") == question["raw"] for answer in choices)
        has_label = isinstance(words, str) and desired in words
        row = {name: observation[name] for name in ("width", "height", "id", "index", "taskHash")}
        row.update({"phase": phase["phase"], "strict": phase.get("strict"), "correct": phase.get("correct"),
                    "constructedCompatibilityFixture": phase.get("constructedCompatibilityFixture"),
                    "originalChoiceAnswers": choices, "sourceAnswerFieldsMatch": source_answers_match,
                    "visibleTextContainsSourceLabel": has_label,
                    "visibleTextContainsRawEnumPhrase": isinstance(words, str) and raw_phrase in words,
                    "matchedOriginalText": words[words.index(desired):words.index(desired) + len(desired)] if has_label else None,
                    "wordsSHA256": R.sha256(words.encode()) if isinstance(words, str) else None})
        rows.append(row)
    return {"header": {name: observation[name] for name in ("width", "height", "id", "index", "taskHash")},
            "actualStrictPhases": actual_strict, "expectedStrictPhases": sorted(expected_phases),
            "strictPhaseNamesMatch": len(actual_strict) == 5 and set(actual_strict) == expected_phases,
            "phases": rows}


def read_result(archive):
    counts, metadata, label_checks, label_groups, selected = collections.Counter(), {}, [], [], {}
    isolated_kinds, counterfactual_flags, runtime_errors = collections.Counter(), collections.Counter(), {}
    with archive.open("results.json") as binary, io.TextIOWrapper(binary, encoding="utf-8") as stream:
        for key, item, value in R.root_records(stream, ARRAYS):
            if key not in ARRAYS:
                metadata[key] = value
                continue
            counts.setdefault(key, 0)
            if not item:
                continue
            counts[key] += 1
            if key == "checks" and isinstance(value, str) and value.endswith(LABEL_SUFFIX):
                label_checks.append(value)
            elif key in ("errors", "remote"):
                runtime_errors.setdefault(key, []).append(value)
            elif key == "isolated":
                isolated_kinds[value.get("kind")] += 1
            elif key == "forgeries":
                counterfactual_flags["explicitCounterfactual"] += value.get("counterfactual") is True
                counterfactual_flags["notActualBrowserAction"] += value.get("actualBrowserAction") is False
            elif key == "observations" and (value["id"], value["index"]) in CHOICES:
                label_groups.append(label_observation(value))
                if value["width"] == 1280 and value["height"] == 720 and (value["id"], value["index"]) in SELECTED:
                    selection = (value["id"], value["index"])
                    R.require(selection not in selected, "duplicate selected native observation")
                    selected[selection] = value
            elif key == "offline":
                metadata.setdefault("offline", []).append(value)
    return {"counts": dict(counts), "metadata": metadata, "originalVisibleLabelCheckMessages": label_checks,
            "choiceGroups": label_groups, "isolatedKinds": dict(isolated_kinds),
            "counterfactualFlags": dict(counterfactual_flags), "runtimeErrors": runtime_errors}, selected


def selected_states(archive, selected):
    rows = []
    for key in SELECTED:
        observation = selected[key]
        matches = [phase for phase in observation["phases"] if phase["phase"] == "corrected"]
        R.require(len(matches) == 1, "selected original corrected phase is missing or duplicated")
        phase, prefix = matches[0], "1280x720-" + key[0] + "-" + str(key[1]) + "-corrected"
        names = {"raw": prefix + "-storage.txt", "decoded": prefix + "-state.json"}
        R.require(phase["storage"] == names, "selected original state paths differ from source")
        data = {kind: R.member_bytes(archive, name) for kind, name in names.items()}
        state = R.strict_snapshot_object(data["decoded"])
        raw = R.strict_snapshot_object(data["raw"])
        R.require(state.get("schema") == 2, "selected decoded state is not original schema 2")
        lesson = state["lessons"][key[0]]
        model, record = lesson["models"][str(key[1])], lesson["cases"][str(key[1])]
        R.require(same_json(model, phase["model"]) and same_json(record, phase["record"]) and same_json(lesson, phase["lesson"]),
                  "selected original state differs from its result capture")
        R.require(same_json(record["attempts"], phase["attempts"]), "selected attempt array differs")
        compressed = raw.get("format") == "math-storage/lzw16-v1"
        if not compressed:
            R.require(same_json(raw, state), "plain original raw state differs from decoded JSON")
        rows.append({"id": key[0], "index": key[1], "width": 1280, "height": 720, "phase": "corrected",
                     "files": {kind: {"name": names[kind], "bytes": len(value), "sha256": R.sha256(value)}
                               for kind, value in data.items()},
                     "rawTransport": {"kind": "lzw16-envelope" if compressed else "plain-json",
                                      "decodedByThisReader": not compressed,
                                      "rawEqualsDecodedJSONObject": None if compressed else True},
                     "originalModelFields": {name: model.get(name) for name in ("answers", "prose", "board")},
                     "originalHistoryActions": [event.get("action") for event in model.get("history", [])],
                     "originalRecordSupport": record.get("support"),
                     "originalAttempts": [{"id": a.get("id"), "at": a.get("at"), "supported": a.get("supported"),
                                           "exposed": a.get("exposed"), "answers": a.get("value", {}).get("answers")}
                                          for a in record["attempts"]],
                     "originalVisibleWords": phase["words"], "correct": phase["correct"], "strict": phase["strict"],
                     "stateMatchesOriginalCapture": True, "mathematicalReplayPerformed": False})
    return rows


def png_value(archive, integrity, key, include_bytes=False):
    name = "1280x720-" + key[0] + "-" + str(key[1]) + "-corrected.png"
    data = R.member_bytes(archive, name, R.MAX_PNG)
    R.require(len(data) >= 24 and data[:8] == b"\x89PNG\r\n\x1a\n" and data[12:16] == b"IHDR",
              "selected original member is not a PNG")
    width, height = struct.unpack(">II", data[16:24])
    R.require(width == 1280 and height >= 720, "selected original PNG dimensions differ from its viewport")
    value = {"case": "money-b07-labels", "kind": "math-result", "artifactId": integrity["id"],
             "archiveSHA256": integrity["sha256"], "name": name, "bytes": len(data), "sha256": R.sha256(data),
             "width": width, "height": height, "uneditedOriginalBytes": True}
    if include_bytes:
        value["base64"] = base64.b64encode(data).decode("ascii")
    return value


def validate_observations(review):
    R.require(review["counts"] == EXPECTED_COUNTS, "actual money result counts differ from the fixed successful run")
    metadata = review["metadata"]
    R.require(not any(name in metadata for name in ("error", "at", "failureDiagnostic")),
              "original money result records a failure")
    R.require(metadata["viewports"] == [[1440, 900], [1280, 720]]
              and metadata["nativeTasks"] == 28 and metadata["nativeNodes"] == 12
              and metadata["nativeViewportPairs"] == 56 and metadata["childTrial"] is False
              and metadata["independentTeachingReview"] is False, "original money root metadata differs")
    expected_messages = collections.Counter({
        str(width) + "x" + str(height) + "-" + key[0] + "-" + str(key[1]) + LABEL_SUFFIX: 5
        for width, height in ((1440, 900), (1280, 720)) for key in CHOICES})
    R.require(collections.Counter(review["originalVisibleLabelCheckMessages"]) == expected_messages,
              "the forty original visible-label check messages differ")
    R.require(review["isolatedKinds"] == {"associated": 40, "old-practice-compatibility": 20},
              "original associated and practice classifications differ")
    R.require(review["counterfactualFlags"] == {"explicitCounterfactual": 224, "notActualBrowserAction": 224},
              "original counterfactual classification differs")
    groups = review["choiceGroups"]
    expected_headers = {(width, height, *key) for width, height in ((1440, 900), (1280, 720)) for key in CHOICES}
    headers = [(g["header"]["width"], g["header"]["height"], g["header"]["id"], g["header"]["index"]) for g in groups]
    R.require(len(headers) == 8 and set(headers) == expected_headers, "choice observation identities differ")
    R.require(all(group["strictPhaseNamesMatch"] and len(group["phases"]) == 5 for group in groups),
              "choice phase inventory differs")
    for group in groups:
        for phase in group["phases"]:
            R.require(phase["strict"] is True and phase["correct"] is True and phase["sourceAnswerFieldsMatch"]
                      and phase["visibleTextContainsSourceLabel"] and not phase["visibleTextContainsRawEnumPhrase"]
                      and phase["constructedCompatibilityFixture"] is False,
                      "original visible words or unchanged choice evidence fields do not match source labels")


def main():
    global R
    parser = argparse.ArgumentParser()
    parser.add_argument("--png-only", action="store_true")
    parser.add_argument("--out", default="money-label-review-output")
    arguments = parser.parse_args()
    out = pathlib.Path(arguments.out)
    out.mkdir(parents=True, exist_ok=True)
    try:
        R = load_reader()
        R.require(os.environ.get("GITHUB_REPOSITORY") == R.REPO, "use the fixed repository only")
        identity, source = validate_identity()
        with tempfile.TemporaryDirectory(prefix="money-label-review-") as temp:
            directory = pathlib.Path(temp)
            archive, integrity = R.open_archive(CASE, directory)
            try:
                receipt_archive, receipt_integrity = R.open_archive(CASE, directory, receipt=True)
                try:
                    receipt = exact_receipt(receipt_archive)
                finally:
                    receipt_archive.close()
                if arguments.png_only:
                    for key in SELECTED:
                        print("ARTIFACT_ORIGINAL_PNG " + json.dumps(png_value(archive, integrity, key, True), separators=(",", ":")), flush=True)
                    return
                review, selected = read_result(archive)
                provenance = R.strict_snapshot_object(R.member_bytes(archive, "provenance.json", 64 * 1024))
                manifest = provenance_review(review["metadata"]["provenance"], provenance)
                states = selected_states(archive, selected)
                pngs = [png_value(archive, integrity, key) for key in SELECTED]
                summary = {"case": "money-b07-labels", "kind": "math-result", "identity": identity,
                           "source": source, "archive": integrity, "receiptArchive": receipt_integrity,
                           "exactGroupReceipt": receipt, "explicitSourceManifest": manifest,
                           "originalResults": review, "selectedCorrectedStates": states, "selectedOriginalPNGs": pngs,
                           "readerCommit": os.environ.get("GITHUB_SHA"), "readerRun": os.environ.get("GITHUB_RUN_ID"),
                           "inspectionOnly": True, "mathematicalReplayPerformed": False, "p10ReviewPerformed": False,
                           "wholeRequiredAccepted": False, "otherArtifactPackagesReviewed": False,
                           "visualReviewPerformedByThisScript": False, "artifactCodeExecuted": False}
                R.write_json(out, "money-label-observations-before-validation.json", summary)
                R.emit("MONEY_LABEL_OBSERVATIONS_BEFORE_VALIDATION", summary)
                validate_observations(review)
                summary["displayRecordInspection"] = "forty original visible-label records consistent with frozen source labels"
                R.write_json(out, "money-label-summary.json", summary)
                R.emit("MONEY_LABEL_SUMMARY", summary)
            finally:
                archive.close()
    except Exception as error:
        failure = {"case": "money-b07-labels", "kind": "math-result", "inspectionCompleted": False,
                   "errorClass": type(error).__name__, "error": str(error)[:2000],
                   "mathematicalReplayPerformed": False, "wholeRequiredAccepted": False}
        destination = out / "money-label-reader-failure.json"
        if destination.exists():
            raise RuntimeError("refuse to overwrite an earlier reader failure") from None
        destination.write_text(json.dumps(failure, ensure_ascii=False, indent=2) + "\n")
        print("ARTIFACT_REVIEW_MONEY_LABEL_FAILED " + json.dumps(failure, ensure_ascii=False), flush=True)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
