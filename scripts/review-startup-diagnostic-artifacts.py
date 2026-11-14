#!/usr/bin/env python3
"""Read fixed GitHub diagnostic artifacts; never execute code from an artifact.

This is independent integrity/transport inspection, not a mathematics or P10
gate. Missing observations stay missing. A successful inspection does not fix
the observed product failure. The control constants were fixed before this
reader ran, from the separately reviewed PR 184 archive.
"""
import argparse
import base64
import collections
import datetime
import gzip
import hashlib
import io
import json
import os
import pathlib
import re
import stat
import struct
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
import zipfile

REPO = "runlinx-eng/math"
REPO_ID = 1437969099
API = "https://api.github.com/repos/" + REPO + "/"
MAX_ARCHIVE = 2 * 1024**3
MAX_UNCOMPRESSED = 8 * 1024**3
MAX_MEMBER = 3 * 1024**3
MAX_JSON = 256 * 1024**2
MAX_NATIVE = 128 * 1024**2
MAX_PNG = 2 * 1024**2
MAX_EXAMPLES = 12
CASES = {
    "control": {
        "run": 43633705670, "attempt": 1,
        "head": "773075c1b577a4da28a96cd1041b49eb22259bce",
        "checkout": "c2b63bedf3e3094d0e6a0d18d1ebffc5b6909a0e",
        "tree": "330b50f8c28898d3eab54ca37c03e15538b37232",
        "dist": "5da7aaa0f433ad68eed0f968338ab555be891e3f",
        "artifact": 14129971928,
        "name": "p9-fractioncase-startup-diagnostic-43633705670-1",
        "bytes": 119527304,
        "sha256": "35ed7181f8f61411c5bab31116842bf8693704268f39801f13562dd60618afb1",
        "prefix": "", "kind": "startup",
        "original": "tests/p9-fractioncase-adapter-browser.cjs",
        "original_sha256": "804a97e2a075822b1b8253928880089977093ac3b30a577cccfc4fa507a23c8c",
        "diagnostic": "tests/p9-fractioncase-startup-diagnostic.cjs",
        "netlog": "startup-diagnostics/browser-netlog.json",
        "pngs": [
            "1440x900-joinfractions-2-verified-offline.png",
            "1280x720-wrong-common-corrected.png",
            "1280x720-terminal-inner-failure-rebuilt.png",
        ],
    },
    "case169": {
        "run": 43634782563, "attempt": 1, "completed_job": 132570593839,
        "head": "f7c8f1103207be217af014163e086b007728d0d6",
        "checkout": "82ed9bd885656e63440fd306e010628f081f436f",
        "tree": "a92b049664c0eab17089436486ff197db60cb191",
        "dist": "43b01cc4725faaf07fb12df89b65953f8fb227c1",
        "artifact": 14130541172,
        "name": "math-required-checks-browser-evidence-evidence-expansion-1",
        "bytes": 39041173,
        "sha256": "17e53a80e7bfbd2541399a97d89e42e8a6fec92c03a19232a19b150c9f4226d7",
        "receipt_artifact": 14130725508,
        "receipt_name": "required-browser-result-evidence-expansion-attempt-1",
        "receipt_bytes": 525,
        "receipt_sha256": "89e8348b1707c78317325bed20dd0db107662f87601681c7ebd5336a03c73ee2",
        "prefix": "p9-mature-expansion/", "kind": "legacy",
        "original": "tests/p9-mature-expansion-browser.cjs",
    },
    "target": {
        "run": 43636333185, "attempt": 1,
        "head": "bea240e2027c35c170bd1bae471372a01568a64f",
        "checkout": "b1ae944142b4f4f3cc31e05afd2ecebeab897721",
        "tree": "53c418e88f57fc4c983ca213d1ba0e42dd16f694",
        "dist": "37dc6e429f073affa28d6eaac9db3157e07583cf",
        "artifact": None,
        "name": "p9-place-startup-diagnostic-43636333185-1",
        "prefix": "p9-wideshift-adapter/", "kind": "startup",
        "original": "tests/p9-wideshift-adapter-browser.cjs",
        "original_sha256": "52bdd8d7eeab5f8a633acf0b718d19520cebf1064f8d1668b158690fad8beae1",
        "diagnostic": "tests/p9-wideshift-startup-diagnostic.cjs",
        "netlog": "p9-wideshift-adapter/browser-netlog.json",
        "pngs": [
            "p9-wideshift-adapter/startup-diagnostics/first-native-failure.png",
            "p9-wideshift-adapter/1440x900-powerpattern-1-05-verified-offline.png",
            "p9-wideshift-adapter/1280x720-standardform-0-06-shared-retry.png",
            "p9-wideshift-adapter/1440x900-precision-disabled-disabled.png",
        ],
    },
}
CONTROL = {
    "zip_entries": 1325, "source_files": 282,
    "math_counts": {"checks": 8310, "observations": 76, "isolated": 112, "negatives": 42},
    "navigations": 716, "cdp_requests": 155882, "from_sw": 155652,
    "learn_requests": 714, "netlog_bytes": 1529143486,
    "netlog_sha256": "3112b5fc1aa92fa9bdef58f6f1f6f910e0371bf3c3502732607e9a56a67d32bd",
    "netlog_events": 10987833, "url_request_sources": 156686,
    "negative_codes": {-109: 1522, -102: 779550, -3: 4},
    "refused_types": {
        "TCP_CONNECT": 155910, "TRANSPORT_CONNECT_JOB_CONNECT": 155910,
        "SOCKET_POOL": 155910, "URL_REQUEST_START_JOB": 155910,
        "REQUEST_ALIVE": 155910,
    },
    "non_refused_types": {
        "UDP_CONNECT": 761, "SOCKET_CONNECT": 761,
        "QUIC_SESSION_POOL_CLOSE_ALL_SESSIONS": 4,
    },
    "local_url_negative_events": 311820,
    "ipv6_fresh": 761, "ipv6_cached": 312623,
    "trace_events": 221347, "trace_completions": 1297,
    "trace_retained_us": 9260213,
    "trace_raw_sha256": "3f79dc2319aa7ee1c4ba73f06253ad87235a1943883699df0f844a6280392ed9",
    "trace_gzip_sha256": "b695d6e516f2f9d56453fa1e30435361f7092f70463d06634e74429326f9d2b3",
}
ARRAY_KEYS = {
    "checks", "errors", "remote", "observations", "retries", "negatives",
    "isolated", "isolations", "explorationObservations",
}

def require(condition, message):
    if not condition:
        raise ValueError(message)

def sha256(data):
    return hashlib.sha256(data).hexdigest()

def emit(kind, value):
    encoded = json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    require(len(encoded.encode()) <= 192 * 1024, "summary exceeds its explicit output bound")
    print("ARTIFACT_REVIEW_" + kind + " " + encoded, flush=True)

def write_json(out, name, value):
    destination = out / name
    require(not destination.exists(), "do not overwrite an earlier review result")
    destination.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")

def api(suffix):
    require(not suffix.startswith("/") and ".." not in suffix, "invalid fixed API suffix")
    token = os.environ.get("GITHUB_TOKEN")
    require(bool(token), "read-only GitHub token is required")
    request = urllib.request.Request(API + suffix, headers={
        "Authorization": "Bearer " + token,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    })
    with urllib.request.build_opener(NoRedirect).open(request, timeout=60) as response:
        require(response.status == 200, "API did not return HTTP 200")
        data = response.read(16 * 1024**2 + 1)
    require(len(data) <= 16 * 1024**2, "API JSON exceeds review bound")
    return json.loads(data)

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, message, headers, newurl):
        return None

def archive_redirect(artifact_id):
    request = urllib.request.Request(API + "actions/artifacts/" + str(artifact_id) + "/zip",
        headers={"Authorization": "Bearer " + os.environ["GITHUB_TOKEN"],
                 "Accept": "application/vnd.github+json"})
    opener = urllib.request.build_opener(NoRedirect)
    try:
        with opener.open(request, timeout=60):
            raise ValueError("expected the official artifact download redirect")
    except urllib.error.HTTPError as error:
        require(error.code in (301, 302, 303, 307, 308), "artifact redirect was not returned")
        location = error.headers.get("Location", "")
        error.close()
    else:
        raise ValueError("expected the official artifact download redirect")
    parsed = urllib.parse.urlsplit(location)
    allowed = (parsed.hostname or "").endswith(".blob.core.windows.net")
    allowed = allowed or (parsed.hostname or "").endswith(".githubusercontent.com")
    require(parsed.scheme == "https" and allowed and parsed.port in (None, 443)
            and not parsed.username and not parsed.password and not parsed.fragment,
            "unexpected signed artifact storage host")
    return location

def validate_member_name(name):
    require(isinstance(name, str) and name and "\x00" not in name and "\\" not in name,
            "invalid ZIP member name")
    parts = name[:-1].split("/") if name.endswith("/") else name.split("/")
    require(all(part not in ("", ".", "..") for part in parts) and ":" not in parts[0],
            "unsafe or ambiguous ZIP member path")
    path = pathlib.PurePosixPath(name)
    require(not path.is_absolute() and str(path) == name.rstrip("/"), "noncanonical ZIP member path")
    return name.rstrip("/")

def validate_run(case):
    run = api("actions/runs/" + str(case["run"]))
    require(run["id"] == case["run"] and run["head_sha"] == case["head"],
            "workflow run identity changed")
    require(run["run_attempt"] == case["attempt"], "workflow attempt changed")
    job = None
    if case.get("completed_job"):
        job = api("actions/jobs/" + str(case["completed_job"]))
        require(job["run_id"] == case["run"] and job["head_sha"] == case["head"],
                "failed job identity changed")
        require(job["status"] == "completed" and job["conclusion"] == "failure",
                "the fixed failed job has not completed as observed")
    else:
        require(run["status"] == "completed", "fixed diagnostic run is not complete; do not poll or infer")
    return {"run": {k: run.get(k) for k in ("id", "head_sha", "run_attempt", "status", "conclusion", "html_url")},
            "job": {k: job.get(k) for k in ("id", "run_id", "head_sha", "status", "conclusion", "html_url")} if job else None}

def artifact_metadata(case, receipt=False):
    key = "receipt_" if receipt else ""
    expected_id, expected_name = case.get(key + "artifact"), case[key + "name"]
    found = []
    for page in range(1, 21):
        listing = api("actions/runs/" + str(case["run"]) + "/artifacts?per_page=100&page=" + str(page))
        rows = listing["artifacts"]
        found.extend(row for row in rows if row["name"] == expected_name)
        if len(rows) < 100:
            break
    else:
        raise ValueError("artifact pagination exceeded explicit bound")
    require(len(found) == 1, "expected exactly one fixed-name artifact")
    meta = found[0]
    require(expected_id is None or meta["id"] == expected_id, "artifact ID changed")
    identity = meta["workflow_run"]
    require(identity["id"] == case["run"] and identity["head_sha"] == case["head"],
            "artifact workflow/head differs")
    require(identity["repository_id"] == REPO_ID and identity["head_repository_id"] == REPO_ID,
            "artifact repository identity differs")
    require(not meta["expired"], "artifact expired")
    require(re.fullmatch(r"sha256:[a-f0-9]{64}", meta.get("digest", "")) is not None,
            "official archive digest is missing")
    require(0 < meta["size_in_bytes"] <= MAX_ARCHIVE, "archive outside review size bound")
    if key + "bytes" in case:
        require(meta["size_in_bytes"] == case[key + "bytes"], "fixed archive size changed")
        require(meta["digest"] == "sha256:" + case[key + "sha256"], "fixed archive SHA changed")
    return meta

def open_archive(case, directory, receipt=False):
    meta = artifact_metadata(case, receipt)
    destination = directory / (str(meta["id"]) + ".zip")
    require(not destination.exists(), "never overwrite an input archive")
    # The token-bearing API request never follows the redirect. This new request
    # contains no Authorization header; the signed URL is never logged.
    signed_url = archive_redirect(meta["id"])
    digest, size = hashlib.sha256(), 0
    try:
        with urllib.request.build_opener(NoRedirect).open(urllib.request.Request(signed_url), timeout=90) as response, destination.open("xb") as output:
            require(response.status == 200, "signed storage did not return HTTP 200")
            while True:
                data = response.read(1024**2)
                if not data:
                    break
                size += len(data)
                require(size <= meta["size_in_bytes"], "download exceeded official archive size")
                output.write(data)
                digest.update(data)
    except Exception as error:
        # Do not serialize a signed URL or token from urllib's exception text.
        raise ValueError("artifact download failed; class=" + type(error).__name__) from None
    actual = digest.hexdigest()
    require(size == meta["size_in_bytes"] and actual == meta["digest"].split(":", 1)[1],
            "download size or SHA does not match the official archive")
    archive = zipfile.ZipFile(destination)
    entries = archive.infolist()
    for info in entries:
        require(info.orig_filename == info.filename, "ZIP member name was altered by decoding or NUL truncation")
    names = [validate_member_name(info.orig_filename) for info in entries]
    require(len(names) == len(set(names)), "duplicate ZIP members")
    require(len(entries) <= 20000, "ZIP entry count exceeds review bound")
    require(sum(info.file_size for info in entries) <= MAX_UNCOMPRESSED, "ZIP uncompressed size exceeds review bound")
    for info in entries:
        require(info.file_size <= MAX_MEMBER, "ZIP member exceeds review bound")
        require(not (info.flag_bits & 1), "encrypted ZIP member is unsupported")
        require(stat.S_IFMT(info.external_attr >> 16) != stat.S_IFLNK, "ZIP symlink is unsupported")
    require(archive.testzip() is None, "ZIP CRC failure")
    return archive, {"id": meta["id"], "name": meta["name"], "bytes": size, "sha256": actual,
                     "entries": len(entries), "crc": "pass", "workflow_run": meta["workflow_run"]}

def member_bytes(archive, name, limit=MAX_JSON):
    validate_member_name(name)
    info = archive.getinfo(name)
    require(info.file_size <= limit, "member exceeds explicit read bound: " + name)
    data = archive.read(name)
    require(len(data) == info.file_size, "member length differs: " + name)
    return data

def load_member(archive, name):
    return json.loads(member_bytes(archive, name))

class Reader:
    """Strict incremental JSON values; no newline assumption for NetLog."""
    def __init__(self, stream, chunk=1024**2, value_limit=64*1024**2):
        self.stream, self.chunk, self.limit = stream, chunk, value_limit
        self.buffer, self.position, self.eof = "", 0, False
        self.decoder = json.JSONDecoder()

    def more(self):
        self.buffer, self.position = self.buffer[self.position:], 0
        part = self.stream.read(self.chunk)
        if part:
            self.buffer += part
            require(len(self.buffer) <= self.limit, "single JSON value exceeds review resource bound")
        else:
            self.eof = True

    def peek(self):
        while True:
            while self.position < len(self.buffer) and self.buffer[self.position].isspace():
                self.position += 1
            if self.position < len(self.buffer):
                return self.buffer[self.position]
            if self.eof:
                return ""
            self.more()

    def expect(self, token):
        require(self.peek() == token, "unexpected or truncated JSON delimiter")
        self.position += 1

    def value(self):
        require(bool(self.peek()), "truncated JSON value")
        while True:
            try:
                value, end = self.decoder.raw_decode(self.buffer, self.position)
            except json.JSONDecodeError:
                if self.eof:
                    raise ValueError("invalid or truncated JSON value") from None
                self.more()
                continue
            boundary = end < len(self.buffer) and self.buffer[end] in " \t\r\n,]}:"
            if not boundary and not self.eof:
                self.more()
                continue
            require(end == len(self.buffer) or boundary, "invalid JSON value boundary")
            require(end - self.position <= self.limit, "JSON value exceeds review bound")
            self.position = end
            return value

def root_records(stream, array_keys, chunk=1024**2, required_arrays=None):
    reader, seen = Reader(stream, chunk=chunk), set()
    reader.expect("{")
    if reader.peek() != "}":
        while True:
            key = reader.value()
            require(isinstance(key, str) and key not in seen, "duplicate or invalid root JSON key")
            seen.add(key)
            reader.expect(":")
            if key in array_keys:
                reader.expect("[")
                if reader.peek() != "]":
                    while True:
                        yield key, True, reader.value()
                        if reader.peek() == "]":
                            break
                        reader.expect(",")
                reader.expect("]")
                yield key, False, {"arrayEnd": True}
            else:
                yield key, False, reader.value()
            if reader.peek() == "}":
                break
            reader.expect(",")
    reader.expect("}")
    require(not reader.peek(), "trailing non-whitespace JSON")
    required = array_keys if required_arrays is None else required_arrays
    require(required.issubset(seen), "required root arrays are missing")

def reader_self_test():
    original = {"constants": {"text": '引号 " \\\\ [ ]'}, "events": [
        {"source": {"id": 1}, "value": 1e-123}, {"text": "second"}, None, [1, 2, 3]]}
    encoded = json.dumps(original, ensure_ascii=False, separators=(",", ":"))
    for chunk in (1, 2, 7, 19):
        rows = list(root_records(io.StringIO(encoded), {"events"}, chunk))
        require([value for key, item, value in rows if item] == original["events"], "cross-chunk parser test failed")
    for broken in (encoded[:-1], encoded + "junk", '{"events":[1,]}', '{"events":[],}', '{"events":[]}{"events":[]}'):
        try:
            list(root_records(io.StringIO(broken), {"events"}, 2))
        except (ValueError, json.JSONDecodeError):
            pass
        else:
            raise ValueError("malformed JSON self-test was accepted")
    # Exercise the actual result reader, including the rejected review example.
    for payload, accepted in [('{"checks":[],}', False), ('{"checks":[]}', True), ('{}', True)]:
        fixture = io.BytesIO()
        with zipfile.ZipFile(fixture, "w") as archive:
            archive.writestr("results.json", payload)
        fixture.seek(0)
        with zipfile.ZipFile(fixture) as archive:
            try:
                result = math_summary(archive, "results.json")
            except ValueError:
                require(not accepted, "valid result self-test was rejected")
            else:
                require(accepted, "malformed result self-test was accepted")
                expected = {"checks": 0} if payload == '{"checks":[]}' else {}
                require(result["counts"] == expected, "missing result arrays were synthesized")
    require(strict_snapshot_object(b'{"x":[1,0.5,true,null]}') == {"x": [1, 0.5, True, None]},
            "snapshot JSON self-test failed")
    for broken in (b'{"x":1,"x":2}', b'{"x":{"a":1,"a":2}}', b'{"x":NaN}',
                   b'{"x":Infinity}', b'{"x":1e999}', b'[]', b'{} trailing'):
        try:
            strict_snapshot_object(broken)
        except ValueError:
            pass
        else:
            raise ValueError("invalid snapshot JSON self-test was accepted")
    # Synthetic observation-reader test only: a burst of loading failures must
    # not crowd a later raw worker update out of the separate SW window.
    lifecycle = [{"kind": "ServiceWorker.workerVersionUpdated", "versions": [{"status": "running"}]},
                 {"kind": "Network.loadingFailed", "relevant": False}]
    lifecycle += [{"kind": "Network.loadingFailed", "relevant": True} for _ in range(30)]
    lifecycle += [{"kind": "ServiceWorker.workerVersionUpdated", "versions": [{"status": "stopped"}]}]
    fixture = io.BytesIO()
    with zipfile.ZipFile(fixture, "w") as archive:
        archive.writestr("lifecycle.jsonl", "".join(json.dumps(row) + "\n" for row in lifecycle))
    fixture.seek(0)
    with zipfile.ZipFile(fixture) as archive:
        result = cdp_summary(archive, "")
    require(result["firstLoadingFailure"]["sequence"] == 2 and result["firstCurrentLoaderFailure"]["sequence"] == 3,
            "lifecycle anchor self-test failed")
    require(result["relevantLifecycleCount"] == 2 and result["relevantLifecycle"][-1]["event"] == lifecycle[-1],
            "worker lifecycle self-test lost the later raw update")
    for unsafe in ("../x", "/x", "x//y", "x/./y", "x/../y", "x" + chr(0) + "y", "x" + chr(92) + "y"):
        try:
            validate_member_name(unsafe)
        except ValueError:
            pass
        else:
            raise ValueError("unsafe ZIP path self-test was accepted")
    require(validate_member_name("a/b.json") == "a/b.json" and validate_member_name("a/") == "a",
            "canonical ZIP path self-test failed")
    try:
        reader = Reader(io.StringIO('"' + "x"*65 + '"'), chunk=4, value_limit=32)
        reader.value()
    except ValueError:
        pass
    else:
        raise ValueError("resource bound self-test was accepted")

def git_output(*arguments):
    return subprocess.check_output(["git", *arguments], stderr=subprocess.DEVNULL)

def ensure_source(case):
    for commit in (case["head"], case["checkout"]):
        if subprocess.run(["git", "cat-file", "-e", commit + "^{commit}"],
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode:
            subprocess.run(["git", "fetch", "--no-tags", "origin", commit], check=True,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        require(git_output("rev-parse", commit + "^{tree}").decode().strip() == case["tree"],
                "fixed source commit tree differs")
    require(git_output("rev-parse", case["checkout"] + ":dist").decode().strip() == case["dist"],
            "fixed source dist tree differs")
    original = git_output("show", case["checkout"] + ":" + case["original"])
    if case.get("original_sha256"):
        require(sha256(original) == case["original_sha256"], "fixed original script SHA differs")
        diagnostic = git_output("show", case["checkout"] + ":" + case["diagnostic"])
        stripped = re.sub(rb"/\* ISSUE180 OBSERVE BEGIN \*/[\s\S]*?/\* ISSUE180 OBSERVE END \*/", b"", diagnostic)
        require(stripped == original, "diagnostic hooks do not strip to the original script")
    return {"head": case["head"], "checkout": case["checkout"], "tree": case["tree"], "dist": case["dist"],
            "originalFile": case["original"], "originalSHA256": sha256(original)}

def check_provenance(provenance, case):
    require(provenance["headSha"] == case["head"] and provenance["testedCheckoutSha"] == case["checkout"],
            "artifact provenance differs from the fixed source")
    if "treeSha" in provenance:
        require(provenance["treeSha"] == case["tree"], "artifact tree differs")
    if "productTreeSha" in provenance:
        require(provenance["productTreeSha"] == case["dist"], "artifact dist differs")
    if "runId" in provenance:
        require(str(provenance["runId"]) == str(case["run"]) and str(provenance["attempt"]) == str(case["attempt"]),
                "artifact run/attempt provenance differs")

def source_manifest(archive, name, case):
    manifest = load_member(archive, name)
    check_provenance(manifest["provenance"], case)
    rows = manifest["files"]
    expected = set(git_output("ls-tree", "-r", "--name-only", case["checkout"], "--", "dist").decode().splitlines())
    seen = set()
    for row in rows:
        file = validate_member_name(row["file"])
        require(file.startswith("dist/") and file not in seen, "invalid or duplicate product manifest entry")
        seen.add(file)
        data = git_output("show", case["checkout"] + ":" + file)
        require(len(data) == row["bytes"] and sha256(data) == row["sha256"], "product source bytes differ: " + file)
    require(seen == expected, "product manifest is incomplete or contains additional files")
    return {"files": len(rows), "allBytesAndHashesEqual": True}

def math_summary(archive, name):
    counts, metadata, previous = collections.Counter(), {}, []
    with archive.open(name) as binary, io.TextIOWrapper(binary, encoding="utf-8") as stream:
        # The same strict root parser serves both modern and older result files.
        # Known arrays are optional here: a missing field stays absent, not zero.
        for key, item, value in root_records(stream, ARRAY_KEYS, required_arrays=set()):
            if key in ARRAY_KEYS:
                counts.setdefault(key, 0)
                if not item:
                    continue
                counts[key] += 1
                if key in ("errors", "remote") and counts[key] <= MAX_EXAMPLES:
                    metadata.setdefault(key + "Examples", []).append(value)
                if key == "observations" and isinstance(value, dict):
                    previous.append({k: value.get(k) for k in ("id", "index", "family", "width", "height")})
                    previous = previous[-2:]
            elif key in ("at", "error", "stack", "provenance", "offline", "viewports", "originStopped"):
                metadata[key] = value
    return {"counts": dict(counts), "metadata": metadata,
            "lastCompletedObservationHeaders": previous,
            "limitation": "These are original-run counts, not a new mathematical replay. The last completed observation is not assumed to be the failing current case."}

def cdp_summary(archive, prefix):
    count = requests = from_sw = learn = learn_ok = 0
    status_counts, failure_samples, mismatches = collections.Counter(), [], []
    failures = unfinished = 0
    for name in archive.namelist():
        if not re.fullmatch(re.escape(prefix) + r"page-\d+-navigation-\d+\.json", name):
            continue
        row = load_member(archive, name)
        count += 1
        for request in row["requests"]:
            requests += 1
            if request.get("loaderId") != row["loaderId"]:
                mismatches.append({"file": name, "request": request.get("requestId"), "loader": request.get("loaderId"), "expected": row["loaderId"]})
            response = request.get("response") or {}
            status_counts[str(response.get("status", "missing"))] += 1
            from_sw += response.get("fromServiceWorker") is True
            finished = bool(request.get("finished"))
            unfinished += not finished
            if request.get("failure"):
                failures += 1
                if len(failure_samples) < MAX_EXAMPLES:
                    failure_samples.append({"file": name, "loaderId": row["loaderId"], "request": request})
            if urllib.parse.urlsplit(request["url"]).path == "/learning/learn.js":
                learn += 1
                learn_ok += finished and response.get("fromServiceWorker") is True and response.get("status") == 200
    lifecycle, first_failure, first_current_failure = collections.Counter(), None, None
    lifecycle_name = prefix + "lifecycle.jsonl"
    lifecycle_total = 0
    failure_kinds = {"loading-failed", "Network.loadingFailed"}
    # Keep the observer's exact raw records. Its spread order can replace the
    # label "loading-failed" with Network.loadingFailed; recognize both names.
    if lifecycle_name in archive.namelist():
        with archive.open(lifecycle_name) as stream:
            for line in stream:
                require(len(line) <= 4*1024**2, "lifecycle record exceeds bound")
                value = json.loads(line)
                lifecycle_total += 1
                lifecycle[value["kind"]] += 1
                if value["kind"] in failure_kinds:
                    located = {"sequence": lifecycle_total, "event": value}
                    if first_failure is None:
                        first_failure = located
                    if first_current_failure is None and value.get("relevant") is True:
                        first_current_failure = located
    anchor = first_current_failure or first_failure
    nearby, relevant_first, relevant_last = [], [], collections.deque(maxlen=6)
    relevant_before, relevant_after = collections.deque(maxlen=12), []
    relevant_count = 0
    if lifecycle_name in archive.namelist():
        with archive.open(lifecycle_name) as stream:
            for sequence, line in enumerate(stream, 1):
                require(len(line) <= 4*1024**2, "lifecycle record exceeds bound")
                value = json.loads(line)
                located = {"sequence": sequence, "event": value}
                if anchor and abs(sequence - anchor["sequence"]) <= 12:
                    nearby.append(located)
                kind = value["kind"]
                relevant = kind.startswith("ServiceWorker.") or kind in (
                    "pageerror",
                    "context-closing", "observation-boundary-before-browser-cleanup",
                    "source-server-closing", "source-server-closed",
                    "service-worker-domain-enabled", "page-observer-ready")
                if not relevant:
                    continue
                relevant_count += 1
                if len(relevant_first) < 6:
                    relevant_first.append(located)
                relevant_last.append(located)
                if anchor and sequence < anchor["sequence"]:
                    relevant_before.append(located)
                elif anchor and len(relevant_after) < 12:
                    relevant_after.append(located)
    selected = (list(relevant_before) + relevant_after) if anchor else (relevant_first + list(relevant_last))
    selected = list({row["sequence"]: row for row in selected}.values())
    return {"navigations": count, "requests": requests, "fromServiceWorker": from_sw,
            "responseStatuses": dict(status_counts), "unfinishedRequests": unfinished,
            "failedRequests": failures, "failureExamples": failure_samples,
            "failureExamplesOmitted": failures-len(failure_samples), "loaderMismatches": mismatches[:MAX_EXAMPLES],
            "loaderMismatchCount": len(mismatches), "learnRequests": learn, "learnFinishedViaSW": learn_ok,
            "lifecycleCounts": dict(lifecycle), "lifecycleTotal": lifecycle_total,
            "firstLoadingFailure": first_failure, "firstCurrentLoaderFailure": first_current_failure,
            "lifecycleWindow": nearby, "lifecycleWindowOmitted": lifecycle_total-len(nearby),
            "relevantLifecycle": selected, "relevantLifecycleCount": relevant_count,
            "relevantLifecycleOmitted": relevant_count-len(selected),
            "lifecycleSelection": ("12 preceding and 12 following raw sequence records; up to 12 preceding and 12 following SW/pageerror/boundary records around the first current-loader failure, or first loading failure if none is current"
                                   if anchor else "first and last six SW/pageerror/boundary records; no loading failure captured"),
            "lifecycleLimitation": "Sequence proximity is recorded for independent review; it is not a causal relationship."}

def native_summary(archive, prefix):
    name = prefix + "native-trace.json.gz"
    if name not in archive.namelist():
        return {"status": "missing", "errors": None, "reason": "No native trace was captured; absence is not success."}
    compressed = member_bytes(archive, name, MAX_NATIVE)
    with gzip.GzipFile(fileobj=io.BytesIO(compressed)) as stream:
        raw = stream.read(MAX_NATIVE+1)
    require(len(raw) <= MAX_NATIVE, "native JSON exceeds explicit read bound")
    document = json.loads(raw)
    manifest_name = prefix + "native-trace-manifest.json"
    manifest = load_member(archive, manifest_name) if manifest_name in archive.namelist() else None
    if manifest:
        require(manifest["uncompressedBytes"] == len(raw) and manifest["uncompressedSHA256"] == sha256(raw)
                and manifest["gzipSHA256"] == sha256(compressed), "native trace manifest hash mismatch")
    counts, completions, errors, times = collections.Counter(), collections.Counter(), [], []
    for event in document["traceEvents"]:
        counts[event.get("name", "")] += 1
        if event.get("ph") != "M" and isinstance(event.get("ts"), (int,float)):
            times.append(event["ts"])
        if event.get("name") == "ServiceWorkerSubresourceLoader::CommitCompleted" and event.get("ph") == "X":
            args = event.get("args", {})
            completions[str(args.get("error_code")) + " / " + str(args.get("reason"))] += 1
            if args.get("error_code") not in ("net::OK", "OK", "0", 0):
                errors.append(event)
    lifecycle_name = name + ".lifecycle.json"
    lifecycle = load_member(archive, lifecycle_name) if lifecycle_name in archive.namelist() else None
    return {"status":"captured", "gzipSHA256":sha256(compressed), "rawSHA256":sha256(raw),
            "rawBytes":len(raw), "events":len(document["traceEvents"]),
            "nonMetadataTimestampBoundsUs":[min(times),max(times)] if times else None,
            "retainedUs":max(times)-min(times) if times else None,
            "completion":manifest.get("completion") if manifest else None,
            "subresourceCompletions":dict(completions), "errorCount":len(errors),
            "rawErrorExamples":errors[:MAX_EXAMPLES], "rawErrorExamplesOmitted":max(0,len(errors)-MAX_EXAMPLES),
            "traceLifecycle":lifecycle.get("events") if lifecycle else None,
            "traceConfig":lifecycle.get("traceConfig") if lifecycle else None,
            "limitation":"Only counts and original callback events. No URL-flow or causal inference is made; circular retention is partial."}

def member_digest(archive, name):
    digest, size = hashlib.sha256(), 0
    with archive.open(name) as stream:
        while True:
            chunk = stream.read(1024**2)
            if not chunk:
                break
            size += len(chunk)
            digest.update(chunk)
    return size, digest.hexdigest()

def netlog_summary(archive, name, lifecycle):
    if name not in archive.namelist():
        return {"status":"missing","negativeCodes":None,"reason":"No NetLog captured; absence is not zero errors."}
    size,digest=member_digest(archive,name)
    constants=None
    reverse={}
    total=0
    negative,by_type,refused_types,other_types=(collections.Counter() for _ in range(4))
    source_ids,url_sets,negative_url_ids=set(),collections.defaultdict(set),set()
    negative_url_counts,negative_url_codes=collections.Counter(),collections.Counter()
    examples=collections.defaultdict(list)
    exceptional_sources=set()
    ipv6=collections.Counter()
    first_negative={}
    with archive.open(name) as binary,io.TextIOWrapper(binary,encoding="utf-8") as stream:
        for key,is_event,value in root_records(stream,{"events"}):
            if not is_event:
                if key=="constants":
                    constants=value
                    for table in ("logEventTypes","logSourceType","logEventPhase","netError"):
                        require(isinstance(constants.get(table),dict),"NetLog constants missing: "+table)
                        reverse[table]={number:label for label,number in constants[table].items()}
                    require("timeTickOffset" in constants,"NetLog timeTickOffset missing")
                continue
            require(constants is not None and isinstance(value,dict),"events preceded constants or malformed event")
            total+=1
            source=value.get("source",{})
            source_key=(source.get("type"),source.get("id"))
            source_name=reverse["logSourceType"].get(source.get("type"),"UNKNOWN_SOURCE_"+str(source.get("type")))
            event_name=reverse["logEventTypes"].get(value.get("type"),"UNKNOWN_EVENT_"+str(value.get("type")))
            params=value.get("params") or {}
            if source_name=="URL_REQUEST":
                source_ids.add(source_key)
                if isinstance(params.get("url"),str):
                    url_sets[source_key].add(params["url"])
            if event_name=="HOST_RESOLVER_MANAGER_IPV6_REACHABILITY_CHECK":
                ipv6[(params.get("cached"),params.get("ipv6_available"))]+=1
            code=params.get("net_error")
            if isinstance(code,int) and not isinstance(code,bool) and code<0:
                negative[code]+=1
                by_type[(code,event_name,source_name)]+=1
                first_negative.setdefault(code,value)
                if len(examples[code])<MAX_EXAMPLES:
                    examples[code].append(value)
                if code==-102:
                    refused_types[event_name]+=1
                else:
                    other_types[event_name]+=1
                    exceptional_sources.add(source_key)
                if source_name=="URL_REQUEST":
                    negative_url_ids.add(source_key)
                    negative_url_counts[source_key]+=1
                    negative_url_codes[code]+=1
    require(constants is not None,"NetLog constants missing")
    local=lambda url:urllib.parse.urlsplit(url).hostname in ("127.0.0.1","localhost","::1")
    unmapped=[key for key in source_ids if not url_sets[key]]
    nonlocal_sources=[key for key in source_ids if any(not local(url) for url in url_sets[key])]
    local_url_negative=sum(amount for key,amount in negative_url_counts.items()
                           if url_sets[key] and all(local(url) for url in url_sets[key]))
    # Re-read all events of every non-refused negative source, including its
    # earlier address/dependency events. No unknown negative code is discarded.
    source_events=collections.defaultdict(list)
    exceptional_event_count=0
    with archive.open(name) as binary,io.TextIOWrapper(binary,encoding="utf-8") as stream:
        for key,is_event,value in root_records(stream,{"events"}):
            if is_event:
                source=value.get("source",{})
                source_key=(source.get("type"),source.get("id"))
                if source_key in exceptional_sources:
                    exceptional_event_count+=1
                    require(exceptional_event_count<=100000,"exceptional source evidence exceeds review bound")
                    source_events[source_key].append(value)
    tick_offset=int(constants["timeTickOffset"])
    def normalized(event):
        return {"utc":datetime.datetime.fromtimestamp((tick_offset+int(event["time"]))/1000,datetime.timezone.utc).isoformat(),
                "time":event["time"],"type":reverse["logEventTypes"].get(event["type"],event["type"]),
                "phase":reverse["logEventPhase"].get(event.get("phase"),event.get("phase")),
                "source":{"type":reverse["logSourceType"].get(event["source"]["type"],event["source"]["type"]),
                          "id":event["source"]["id"]},"params":event.get("params",{})}
    relevant_sources=[]
    for key,events in source_events.items():
        if len(relevant_sources)<MAX_EXAMPLES:
            relevant_sources.append({"source":list(key),"events":[normalized(event) for event in events[:30]],
                                     "omittedEvents":max(0,len(events)-30)})
    quic=[normalized(event) for events in source_events.values() for event in events
          if reverse["logEventTypes"].get(event["type"])=="QUIC_SESSION_POOL_CLOSE_ALL_SESSIONS"
          and (event.get("params") or {}).get("net_error")==-3]
    return {"status":"captured","bytes":size,"sha256":digest,"events":total,"negativeCodes":dict(negative),
            "negativeEventTypes":[{"code":key[0],"name":reverse["netError"].get(key[0],"UNKNOWN"),
                                  "event":key[1],"sourceType":key[2],"events":amount}
                                 for key,amount in sorted(by_type.items())],
            "refusedEventTypes":dict(refused_types),"nonRefusedEventTypes":dict(other_types),
            "urlRequestSources":len(source_ids),"unmappedURLSources":len(unmapped),
            "nonLocalURLSources":len(nonlocal_sources),"urlNegativeEvents":sum(negative_url_counts.values()),
            "uniqueNegativeURLSources":len(negative_url_ids),"urlNegativeCodes":dict(negative_url_codes),
            "localURLNegativeEvents":local_url_negative,
            "firstNegativeByCode":{str(code):normalized(event) for code,event in first_negative.items()},
            "negativeExamples":{str(code):[normalized(event) for event in rows] for code,rows in examples.items()},
            "exceptionalSourceCount":len(source_events),"exceptionalSourceEventCount":exceptional_event_count,
            "exceptionalSourceExamples":relevant_sources,
            "exceptionalSourceExamplesOmitted":max(0,len(source_events)-len(relevant_sources)),
            "ipv6Checks":[{"cached":key[0],"available":key[1],"events":count} for key,count in ipv6.items()],
            "quicPoolClosureRawEvents":quic[:MAX_EXAMPLES],"quicPoolClosureCount":len(quic),
            "allNegativeEventsRetainedAsCounts":True,
            "limitation":"Negative event counts and original source events are kept without causal classification. The known codes are not an ignore list. Sample omissions are explicit; the original full archive remains the source."}

def cached_body_summary(archive, prefix, case):
    name = prefix + "first-native-failure-post-cache-bodies.json"
    if name not in archive.namelist():
        return {"status": "missing", "matches": None, "reason": "No first-failure body observation exists."}
    raw = load_member(archive, name)
    comparisons = []
    for body in raw.get("bodies", []):
        result = {"reported": body}
        if isinstance(body.get("url"), str):
            path = "dist/" + urllib.parse.urlsplit(body["url"]).path.lstrip("/")
            validate_member_name(path)
            try:
                data = git_output("show", case["checkout"] + ":" + path)
            except subprocess.CalledProcessError:
                result["source"] = None
            else:
                result["source"] = {"path": path, "bytes": len(data), "sha256": sha256(data)}
                result["browserReportedDigestEqualsGitSource"] = (
                    body.get("bytes") == len(data) and body.get("sha256") == sha256(data)
                ) if "sha256" in body else None
        comparisons.append(result)
    return {"status": "captured", "firstFailure": raw.get("firstFailure"), "controller": raw.get("controller"),
            "cacheKeys": raw.get("cacheKeys"), "diagnosticError": raw.get("diagnosticError"),
            "comparisons": comparisons[:MAX_EXAMPLES], "comparisonCount": len(comparisons),
            "limitation": "Browser-reported hashes are compared with immutable Git bytes. This post-failure snapshot cannot prove what was transferred before the failure."}

def startup_review(archive, case):
    prefix = case["prefix"] + "startup-diagnostics/"
    report_name = prefix + "report.json"
    if report_name not in archive.namelist():
        receipt_name = "p9-place-startup-diagnostic/command-results.json"
        receipt = load_member(archive, receipt_name) if receipt_name in archive.namelist() else None
        if receipt:
            check_provenance(receipt["provenance"], case)
        return {"status": "observer-report-missing", "commandReceipt": receipt,
                "native": {"status": "missing", "errors": None}, "netlog": {"status": "missing", "negativeCodes": None},
                "rootCauseEstablished": False}
    report = load_member(archive, report_name)
    check_provenance(report["provenance"], case)
    source = source_manifest(archive, prefix + "product-source-manifest.json", case)
    math = math_summary(archive, case["prefix"] + "results.json")
    if math["metadata"].get("provenance"):
        check_provenance(math["metadata"]["provenance"], case)
    cdp = cdp_summary(archive, prefix)
    native = native_summary(archive, prefix)
    netlog = netlog_summary(archive, case["netlog"], cdp["relevantLifecycle"])
    first_name = prefix + "first-native-failure.json"
    first = load_member(archive, first_name) if first_name in archive.namelist() else None
    first_summary = None
    if first:
        raw_failures = [request for request in first.get("currentRequests", []) if request.get("failure")]
        first_summary = {"first": first.get("first"), "currentLoaderId": first.get("currentLoaderId"),
                         "currentURL": first.get("currentURL"), "currentRequestCount": len(first.get("currentRequests", [])),
                         "alreadyFailedCurrentRequests": raw_failures[:MAX_EXAMPLES]}
    return {"status": "inspected", "originalOutcome": report.get("originalOutcome"),
            "originalError": report.get("originalError"), "reportedNativeFailures": report.get("nativeFailures"),
            "reportedDiagnosticErrors": report.get("diagnosticErrors"),
            "sourceManifest": source, "originalMath": math, "cdp": cdp, "native": native, "netlog": netlog,
            "firstCurrentLoaderFailure": first_summary, "cachedBodies": cached_body_summary(archive, prefix, case),
            "rootCauseEstablished": False, "mathematicalReplayPerformed": False, "countsTowardAcceptance": False}

def strict_snapshot_object(data):
    def unique_object(pairs):
        result = {}
        for key, value in pairs:
            require(key not in result, "duplicate key in original snapshot JSON")
            result[key] = value
        return result
    def invalid_constant(value):
        raise ValueError("non-JSON numeric constant in original snapshot")
    def finite_number(value):
        parsed = float(value)
        require(parsed not in (float("inf"), float("-inf")), "non-finite number in original snapshot")
        return parsed
    result = json.loads(data.decode("utf-8"), object_pairs_hook=unique_object,
                        parse_constant=invalid_constant, parse_float=finite_number)
    require(isinstance(result, dict), "original snapshot JSON must be an object")
    return result

def legacy_review(archive, receipt_archive, case):
    receipt_files = [name for name in receipt_archive.namelist() if name.endswith(".json")]
    require(len(receipt_files) == 1, "unexpected legacy group receipt inventory")
    receipt = load_member(receipt_archive, receipt_files[0])
    require(receipt.get("schema") == "math-required-browser-group/1" and receipt.get("required") is True and receipt.get("event") == "pull_request"
            and receipt["sha"] == case["checkout"] and str(receipt["runId"]) == str(case["run"])
            and receipt["attempt"] == case["attempt"] and receipt["group"] == "evidence-expansion",
            "legacy group receipt source differs")
    expected = ["tests/p9-mature-expansion-browser.cjs", "tests/p9-route-adapter-browser.cjs",
                "tests/p9-fraction-order-adapter-browser.cjs", "tests/p9-fraction-operations-adapter-browser.cjs"]
    require([item["file"] for item in receipt["commands"]] == expected, "legacy command inventory differs")
    require(receipt["status"] == "failure" and receipt["commands"][0]["outcome"] == "failure",
            "fixed mature failure receipt differs")
    for index, command in enumerate(receipt["commands"]):
        require(command["env"] == {} and command["outcome"] == ("failure" if index == 0 else "success")
                and command["exitCode"] == (1 if index == 0 else 0) and command["signal"] is None and command["error"] is None,
                "legacy command outcome differs from the observed original run")
    result = math_summary(archive, case["prefix"] + "results.json")
    label = result["metadata"].get("at")
    require(isinstance(label, str) and re.fullmatch(r"(1440x900|1280x720)-[A-Za-z0-9_-]{1,180}", label),
            "missing or unexpected original failure label")
    require(isinstance(result["metadata"].get("error"), str), "original failure message missing")
    png = case["prefix"] + label + "-failure.png"
    matches = [name for name in archive.namelist() if name.startswith(case["prefix"] + label + "-")]
    snapshots, snapshot_bytes = [], {}
    for phase in ("wrong-answer", "first-correct", "restored"):
        files = {}
        for kind, suffix in (("storage", "-storage.txt"), ("decoded", "-decoded.json")):
            name = case["prefix"] + label + "-" + phase + suffix
            data = member_bytes(archive, name, 64 * 1024)
            snapshot_bytes[(phase, kind)] = data
            files[kind] = {"name": name, "bytes": len(data), "sha256": sha256(data),
                           "parsedJSON": strict_snapshot_object(data)}
        snapshots.append({"phase": phase, "capturedBeforeFailingReload": True, "files": files,
                          "storageEqualsDecodedBytes": snapshot_bytes[(phase, "storage")] == snapshot_bytes[(phase, "decoded")]})
    pre_failure = {"snapshots": snapshots,
                   "firstCorrectEqualsRestoredBytes": {
                       kind: snapshot_bytes[("first-correct", kind)] == snapshot_bytes[("restored", kind)]
                       for kind in ("storage", "decoded")},
                   "timing": "All six original files were written before the failed reload at line 202. None is a read after that failure.",
                   "mathematicalReplayPerformed": False}
    return {"status": "inspected-original-failure", "exactGroupReceipt": receipt, "originalMath": result,
            "failurePNG": {"name": png, "exists": png in archive.namelist()},
            "preFailureSnapshots": pre_failure,
            "sameLabelArtifacts": [{"name": name, "bytes": archive.getinfo(name).file_size} for name in matches[:80]],
            "runtimeSourceManifest": "not captured by the original script",
            "snapshotTiming": "The restored capture at original line 199 precedes the edited draft and failed reload at line 202. It is not a model read after that failure.",
            "lineage": "official artifact metadata + exact group receipt + immutable Git checkout; results.json itself has no source-SHA field",
            "cdp": {"status": "not-captured", "failures": None},
            "native": {"status": "not-captured", "errors": None},
            "netlog": {"status": "not-captured", "negativeCodes": None},
            "rootCauseEstablished": False, "sameCauseAsIssue180Established": False,
            "mathematicalReplayPerformed": False, "countsTowardAcceptance": False}

def verify_control(summary):
    inspection, archive = summary["inspection"], summary["archive"]
    require(archive["entries"] == CONTROL["zip_entries"], "control ZIP inventory differs")
    require(inspection["status"] == "inspected" and inspection["originalOutcome"] == "success",
            "control original outcome differs")
    require(inspection["reportedNativeFailures"] == [] and inspection["reportedDiagnosticErrors"] == [],
            "control reported diagnostics differ")
    require(inspection["sourceManifest"]["files"] == CONTROL["source_files"], "control source-file count differs")
    for key, expected in CONTROL["math_counts"].items():
        require(inspection["originalMath"]["counts"].get(key) == expected, "control original count differs: " + key)
    cdp, native, netlog = inspection["cdp"], inspection["native"], inspection["netlog"]
    require(cdp["navigations"] == CONTROL["navigations"] and cdp["requests"] == CONTROL["cdp_requests"]
            and cdp["fromServiceWorker"] == CONTROL["from_sw"], "control CDP inventory differs")
    require(cdp["learnRequests"] == cdp["learnFinishedViaSW"] == CONTROL["learn_requests"], "control entry responses differ")
    require(cdp["responseStatuses"] == {"200": CONTROL["cdp_requests"]} and cdp["failedRequests"] == 0
            and cdp["unfinishedRequests"] == 0 and cdp["loaderMismatchCount"] == 0, "control request completion differs")
    require(netlog["bytes"] == CONTROL["netlog_bytes"] and netlog["sha256"] == CONTROL["netlog_sha256"],
            "control raw NetLog bytes differ")
    require(netlog["events"] == CONTROL["netlog_events"] and netlog["urlRequestSources"] == CONTROL["url_request_sources"]
            and netlog["unmappedURLSources"] == 0 and netlog["nonLocalURLSources"] == 0, "control NetLog URL inventory differs")
    require(netlog["negativeCodes"] == CONTROL["negative_codes"] and netlog["refusedEventTypes"] == CONTROL["refused_types"]
            and netlog["nonRefusedEventTypes"] == CONTROL["non_refused_types"], "control complete negative-event inventory differs")
    require(netlog["localURLNegativeEvents"] == CONTROL["local_url_negative_events"], "control local URL negative events differ")
    require(any(row == {"cached": False, "available": False, "events": CONTROL["ipv6_fresh"]} for row in netlog["ipv6Checks"])
            and any(row == {"cached": True, "available": False, "events": CONTROL["ipv6_cached"]} for row in netlog["ipv6Checks"]),
            "control IPv6 counts differ")
    require(netlog["quicPoolClosureCount"] == 4, "control QUIC raw event count differs")
    require(all(all(event["params"].get(field) == 0 for field in
                ("before_active_sessions_size","before_all_sessions_size","after_active_sessions_size","after_all_sessions_size"))
                for event in netlog["quicPoolClosureRawEvents"]), "control QUIC raw sizes differ")
    require(native["events"] == CONTROL["trace_events"] and native["retainedUs"] == CONTROL["trace_retained_us"],
            "control circular native trace coverage differs")
    require(native["rawSHA256"] == CONTROL["trace_raw_sha256"] and native["gzipSHA256"] == CONTROL["trace_gzip_sha256"],
            "control native trace hashes differ")
    require(native["subresourceCompletions"] == {"net::OK / Body reading completed": CONTROL["trace_completions"]},
            "control native completion counts differ")
    require(native["completion"]["dataLossOccurred"] is True and native["traceConfig"]["traceBufferSizeInKb"] == 8192,
            "control circular-buffer identity differs")
    require(sum(event["kind"] == "end-sent" for event in native["traceLifecycle"]) == 1,
            "control native stop identity differs")
    return {"status": "pass", "frozenExpectations": True,
            "meaning": "The new reader reproduced independently reviewed control facts. This is not a product fix or a new mathematics/P10 gate."}

def selected_pngs(archive, case):
    if case["kind"] == "legacy":
        result = math_summary(archive, case["prefix"] + "results.json")
        label = result["metadata"].get("at")
        require(isinstance(label, str) and re.fullmatch(r"(1440x900|1280x720)-[A-Za-z0-9_-]{1,180}", label),
                "cannot derive the exact original failure PNG")
        candidates = [case["prefix"] + label + "-failure.png", case["prefix"] + label + "-verified-offline.png"]
    else:
        candidates = case["pngs"]
    return [name for name in candidates if name in archive.namelist()][:3], [name for name in candidates if name not in archive.namelist()]

def emit_pngs(archive, identity, case_name):
    names, missing = selected_pngs(archive, CASES[case_name])
    for name in names:
        data = member_bytes(archive, name, MAX_PNG)
        require(len(data) >= 24 and data[:8] == b"\x89PNG\r\n\x1a\n" and data[12:16] == b"IHDR",
                "selected member is not a PNG")
        width, height = struct.unpack(">II", data[16:24])
        value = {"case": case_name, "artifactId": identity["id"], "archiveSHA256": identity["sha256"],
                 "name": name, "bytes": len(data), "sha256": sha256(data), "width": width, "height": height,
                 "uneditedOriginalBytes": True, "base64": base64.b64encode(data).decode("ascii")}
        print("ARTIFACT_ORIGINAL_PNG " + json.dumps(value, separators=(",", ":")), flush=True)
    emit("PNG_INVENTORY", {"case": case_name, "emitted": names, "missingSelected": missing,
                          "visualReviewPerformedByThisScript": False})

def run_case(case_name, out, png_only=False):
    case = CASES[case_name]
    identity = validate_run(case)
    source = ensure_source(case)
    with tempfile.TemporaryDirectory(prefix="fixed-artifact-review-") as temp:
        directory = pathlib.Path(temp)
        archive, integrity = open_archive(case, directory)
        try:
            if png_only:
                emit_pngs(archive, integrity, case_name)
                return
            receipt_integrity = None
            if case["kind"] == "legacy":
                receipt_archive, receipt_integrity = open_archive(case, directory, receipt=True)
                try:
                    inspection = legacy_review(archive, receipt_archive, case)
                finally:
                    receipt_archive.close()
            else:
                inspection = startup_review(archive, case)
            summary = {"case": case_name, "identity": identity, "source": source, "archive": integrity,
                       "receiptArchive": receipt_integrity, "inspection": inspection,
                       "readerCommit": os.environ.get("GITHUB_SHA"), "readerRun": os.environ.get("GITHUB_RUN_ID"),
                       "inspectionOnly": True, "countsTowardAcceptance": False, "rootCauseEstablished": False}
            write_json(out, case_name + "-observations-before-validation.json", summary)
            emit("OBSERVATIONS_BEFORE_VALIDATION", summary)
            if case_name == "control":
                summary["controlValidation"] = verify_control(summary)
            write_json(out, case_name + "-summary.json", summary)
            emit("SUMMARY", summary)
        finally:
            archive.close()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--case", choices=tuple(CASES), required=True)
    parser.add_argument("--next-case", choices=tuple(CASES))
    parser.add_argument("--png-only", action="store_true")
    parser.add_argument("--out", default="artifact-review-output")
    arguments = parser.parse_args()
    require(os.environ.get("GITHUB_REPOSITORY") == REPO, "run only in the fixed repository")
    out = pathlib.Path(arguments.out)
    out.mkdir(parents=True, exist_ok=True)
    try:
        reader_self_test()
        emit("PARSER_SELF_TEST", {"status": "pass", "scope": "stdlib parser and archive-name checks only; no Chromium or math acceptance"})
        run_case(arguments.case, out, arguments.png_only)
        if arguments.next_case:
            require(arguments.case == "control" and not arguments.png_only, "only a completed control exposes the next fixed case")
            with open(os.environ["GITHUB_OUTPUT"], "a") as stream:
                stream.write("next_case=" + arguments.next_case + "\n")
    except Exception as error:
        failure = {"case": arguments.case, "inspectionCompleted": False, "errorClass": type(error).__name__,
                   "error": str(error)[:2000], "productFixClaim": False, "controlExpectationsChanged": False}
        write_json(out, arguments.case + "-reader-failure.json", failure)
        emit("FAILED", failure)
        raise SystemExit(1)

if __name__ == "__main__":
    main()
