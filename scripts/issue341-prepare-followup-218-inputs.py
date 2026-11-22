#!/usr/bin/env python3
"""Restore frozen B-line 218 original Checks from an immutable GitHub Git blob.

No browser/Node replay and no learner-record publication. The ZIP is read from
the separate evidence commit; its full states are reduced to only the original
model and complete Check record in an ignored verification directory.
"""
import hashlib
import io
import json
from pathlib import Path
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parent.parent
EVIDENCE_COMMIT = 'c453c7cd570c608205867a91132c86848b35400f'
EVIDENCE_BLOB = 'e4dc821ece91cc27fbea30543f0e0374f602424d'
EVIDENCE_ZIP_SHA256 = '97334088cd3b805c9d3830ebe61284c493242f26f93c068d71a92e22cc6d8350'
FREEZE_BASE = 'docs/math-parallel/issue-341-handoff-218/'
ZIP_PATH = FREEZE_BASE + 'mac-check-records-218.zip'
MANIFEST_PATH = FREEZE_BASE + 'manifest.json'
OUT = ROOT / 'verification/issue341-inputs'
FIXTURE = OUT / 'archived-checks-218.json'
RECEIPT = OUT / 'preparation-receipt-218.json'


def require(condition, reason):
    if not condition:
        raise ValueError('Issue341 B218 followup original Check: ' + reason)


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def json_bytes(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'), allow_nan=False).encode('utf-8')


def git(*args):
    return subprocess.run(['git', *args], cwd=ROOT, check=True,
                          stdout=subprocess.PIPE, stderr=subprocess.PIPE).stdout


def from_frozen_commit(path):
    try:
        return git('show', EVIDENCE_COMMIT + ':' + path)
    except subprocess.CalledProcessError:
        # GitHub Actions checkout may not fetch this separate evidence branch.
        git('fetch', '--no-tags', 'origin', EVIDENCE_COMMIT)
        return git('show', EVIDENCE_COMMIT + ':' + path)


def extract():
    data = from_frozen_commit(ZIP_PATH)
    require(git('rev-parse', EVIDENCE_COMMIT).decode().strip() == EVIDENCE_COMMIT and
            git('rev-parse', EVIDENCE_COMMIT + ':' + ZIP_PATH).decode().strip() == EVIDENCE_BLOB,
            'original immutable evidence identity changed')
    require(len(data) <= 32 * 1024 * 1024 and data[:2] == b'PK', 'invalid ZIP bytes')
    require(sha256(data) == EVIDENCE_ZIP_SHA256, 'frozen Mac original ZIP SHA256 mismatch')
    manifest_bytes = from_frozen_commit(MANIFEST_PATH)
    manifest = json.loads(manifest_bytes)
    records = manifest.get('records')
    require(isinstance(records, list) and len(records) == 52, 'expected frozen 35 families')

    originals = {}
    expected = set()
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        members = archive.namelist()
        require(len(members) == len(set(members)), 'duplicate ZIP members')
        require(len([p for p in members if p.endswith('/results.json')]) == 52,
                'expected exactly 52 original batch results')
        require(archive.testzip() is None, 'original ZIP CRC mismatch')
        require(len(members) == 270 and all(not p.startswith('/') and '..' not in p.split('/')
                and '\\' not in p for p in members), 'unsafe/unexpected ZIP members')
        require(sum(info.file_size for info in archive.infolist()) <= 32 * 1024 * 1024,
                'unexpected expanded ZIP size')
        for family in records:
            packet = family['batch']
            require(isinstance(packet, str) and packet.startswith('p') and
                    isinstance(family['positions'], list), 'invalid frozen packet')
            receipt = json.loads(from_frozen_commit(FREEZE_BASE + 'receipts/' + packet + '.json'))
            # Batch folder is matched by the frozen SHA, not an assumed Mac path.
            result_paths = [p for p in members if p.endswith('/results.json')
                            and sha256(archive.read(p)) == receipt['artifacts']['results.json']]
            require(len(result_paths) == 1, 'missing/ambiguous frozen batch result: ' + packet)
            result_path = result_paths[0]
            folder = result_path[:-len('results.json')]
            expected.add(result_path)
            require(receipt.get('commit') == family['commit'] and
                    receipt.get('state') == 'local-development-tested',
                    'frozen original receipt provenance differs: ' + packet)
            results_bytes = archive.read(result_path)
            require(sha256(results_bytes) == receipt['artifacts']['results.json'],
                    'original results SHA256 differs from frozen Mac receipt: ' + packet)
            results = json.loads(results_bytes)
            require(results.get('testedCheckoutSha') == family['commit'] and
                    results.get('originalControls') is True and
                    results.get('seededLessonPositionOnly') is False and
                    results.get('errors') == [], 'not an original successful Chromium result: ' + packet)
            result_sources = {(s['sessionId'], s['index']): s for s in results['sources']}
            require(len(result_sources) == len(family['positions']) and
                    len(result_sources) == len(results['sources']),
                    'duplicate/missing frozen result source: ' + packet)
            require(len(results.get('checks') or []) == family['chromiumChecks'],
                    'frozen Chromium checks count differs: ' + packet)
            require(results.get('checks') and
                    results['checks'].count('new Check preserves all steps') == len(family['positions']),
                    'correct Check was not witnessed for every native position: ' + packet)
            for pos in family['positions']:
                label = pos['原生题位']
                session_id, index_text = label.rsplit(':', 1)
                index = int(index_text)
                ident = (session_id, index)
                require(label not in originals and ident in result_sources,
                        'duplicate/unlisted original Check: ' + label)
                source = {'position': label, 'sessionId': session_id, 'index': index,
                          'nodeId': pos['来源节点'], 'type': family['type'],
                          'taskHash': pos['原题SHA256']}
                require(all(result_sources[ident].get(k) == source[k] for k in
                        ('sessionId', 'index', 'nodeId', 'type', 'taskHash')),
                        'source identity differs from frozen original: ' + label)
                member = folder + session_id + '-' + str(index) + '-correct-check-decoded.json'
                expected.add(member)
                member_bytes = archive.read(member)
                require(sha256(member_bytes) == receipt['artifacts'][Path(member).name],
                        'original Check SHA256 differs from frozen Mac receipt: ' + label)
                state = json.loads(member_bytes)
                require(state.get('schema') == 2, 'unexpected original storage schema ' + label)
                lesson = state.get('lessons', {}).get(session_id)
                if lesson is None:
                    lesson = state.get('daily', {}).get('bridges', {}).get(session_id)
                require(isinstance(lesson, dict), 'original session missing ' + label)
                model = lesson.get('models', {}).get(str(index))
                record = lesson.get('cases', {}).get(str(index))
                require(isinstance(model, dict) and isinstance(record, dict) and
                        isinstance(record.get('attempts'), list) and
                        len(record['attempts']) >= 1, 'full original Check unavailable ' + label)
                require(record['attempts'][-1].get('value') == model,
                        'latest original Check does not match saved model ' + label)
                evidence_events = [o for o in results.get('observations', [])
                                   if o.get('index') == index and o.get('stage') == 'correct-check'
                                   and o.get('evidence') is True]
                require(evidence_events, 'missing authentic correct-Check observation ' + label)
                digest = sha256(json_bytes({'model': model, 'record': record}))
                originals[label] = {'packet': packet, 'familyId': 'issue341-B218-' + packet,
                                    'group': pos['题包'], 'source': source,
                                    'model': model, 'record': record,
                                    'provenance': {
                                        'commit': EVIDENCE_COMMIT, 'blob': EVIDENCE_BLOB,
                                        'originalHead': family['commit'], 'member': member,
                                        'memberSha256': sha256(member_bytes),
                                        'modelRecordSha256': digest,
                                        'transportOnly': True, 'freshMathOrBrowserReplay': False}}
        require(set(members) == expected, 'unexpected/missing original ZIP members')
    require(len(originals) == 218 and len(set(r['familyId'] for r in originals.values())) == 52,
            'original 126 source/family count mismatch')
    ordered = [originals[pos['原生题位']] for family in records for pos in family['positions']]
    fixture = {'schema': 'issue-341-archived-original-check-fixtures/1',
               'sourceCommit': EVIDENCE_COMMIT, 'sourceBlob': EVIDENCE_BLOB,
               'originalPerFamilyHead': True,
               'requiredScope': {'families': 52, 'positions': 218},
               'method': 'Original immutable Mac Check snapshots, no simulation or rerun',
               'rows': ordered}
    OUT.mkdir(parents=True, exist_ok=True)
    fixture_bytes = json_bytes(fixture) + b'\n'
    (OUT / 'archived-checks-218.json.tmp').write_bytes(fixture_bytes)
    (OUT / 'archived-checks-218.json.tmp').replace(FIXTURE)
    receipt = {'schema': 'issue-341-followup-archived-input-preparation/1',
               'status': 'PASS_ORIGINAL_MAC_CHECK_TRANSPORT_ONLY',
               'families': 52, 'positions': 218, 'sourceCommit': EVIDENCE_COMMIT,
               'sourceBlob': EVIDENCE_BLOB, 'sourceZipSha256': sha256(data),
               'sourceManifestSha256': sha256(manifest_bytes), 'fixtureSha256': sha256(fixture_bytes),
               'rawRecordsPublished': False, 'originalMathOrBrowserTestsRerun': 0}
    RECEIPT.write_bytes(json_bytes(receipt) + b'\n')
    return receipt


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    for p in (FIXTURE, OUT / 'archived-checks-218.json.tmp', RECEIPT):
        p.unlink(missing_ok=True)
    try:
        result = extract()
        print('ISSUE341_FOLLOWUP_218_ORIGINAL_CHECKS ' + json.dumps(result))
    except Exception as error:
        for p in (FIXTURE, OUT / 'archived-checks-218.json.tmp', RECEIPT):
            p.unlink(missing_ok=True)
        print('ISSUE341_FOLLOWUP_218_ORIGINAL_CHECKS_FAILED ' + str(error), file=sys.stderr)
        sys.exit(1)
