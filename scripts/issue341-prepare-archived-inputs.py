#!/usr/bin/env python3
"""Read existing #341 artifacts into ignored local integration inputs only.

This script never uploads records, changes GitHub state, or reruns old tests.
The committed reference file contains identities and digests, not saved work.
"""
import argparse
import hashlib
import io
import json
import os
from pathlib import Path
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener
import zipfile


ROOT = Path(__file__).resolve().parent.parent
REFERENCES = ROOT / 'tests/fixtures/issue341-archived-input-references.json'
OUTPUT = ROOT / 'verification/issue341-inputs'
REPOSITORY = 'runlinx-eng/math'


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def json_bytes(value):
    # Keep insertion order, Unicode, complete attempts, IDs and timestamps.
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'),
                      allow_nan=False).encode('utf-8')


def require(condition, message):
    if not condition:
        raise ValueError(message)


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, new_url):
        return None


def https_origin(url):
    parsed = urlsplit(url)
    require(parsed.scheme == 'https' and parsed.hostname and
            not parsed.username and not parsed.password and
            parsed.port in (None, 443), 'Artifact URL must use HTTPS without credentials')
    return parsed.hostname, parsed.port or 443


def download_original(artifact, token):
    artifact_id = artifact['id']
    url = f'https://api.github.com/repos/{REPOSITORY}/actions/artifacts/{artifact_id}/zip'
    opener = build_opener(NoRedirect())
    authenticated_origin = https_origin(url)
    send_auth = True
    for _ in range(6):
        origin = https_origin(url)
        headers = {'Accept': 'application/vnd.github+json',
                   'User-Agent': 'math-issue341-read-only-archive-inputs'}
        if send_auth and origin == authenticated_origin:
            headers['Authorization'] = 'Bearer ' + token
        try:
            with opener.open(Request(url, headers=headers, method='GET'), timeout=45) as response:
                require(response.status == 200, f'Artifact {artifact_id}: unexpected HTTP status')
                return response.read(artifact['bytes'] + 1)
        except HTTPError as error:
            if error.code in (301, 302, 303, 307, 308):
                location = error.headers.get('Location')
                require(location, f'Artifact {artifact_id}: redirect has no destination')
                next_url = urljoin(url, location)
                next_origin = https_origin(next_url)
                # A fresh Request is built at every hop. Once a redirect leaves
                # api.github.com, the token is never attached again.
                send_auth = send_auth and next_origin == origin
                url = next_url
                continue
            raise RuntimeError(f'Artifact {artifact_id}: HTTP {error.code}; original input '
                               'is unavailable or expired. Do not rerun original tests.') from None
        except (URLError, TimeoutError):
            # Do not print signed redirect URLs or authentication headers.
            raise RuntimeError(f'Artifact {artifact_id}: network/TLS download failed; '
                               'no replacement evidence was generated.') from None
    raise RuntimeError(f'Artifact {artifact_id}: too many redirects')


def prepare(archive_dir=None):
    reference_bytes = REFERENCES.read_bytes()
    refs = json.loads(reference_bytes)
    require(refs.get('schema') == 'issue-341-archived-input-references/1',
            'Unsupported archived-input reference schema')
    require(refs.get('repository') == REPOSITORY, 'Unexpected artifact repository')
    require(refs.get('sourceRun') == 44909628782 and
            refs.get('sourceHead') == '0cafdaed5aad3d32bf09ab1d9abf6e77130a069d',
            'Original successful run identity changed')
    require(refs.get('requiredScope') == {'families': 113, 'positions': 365},
            'Unexpected frozen input scope')
    require(len(refs['rows']) == 365 and len(refs['artifacts']) == 12,
            'Expected all365 references and12 original browser shards')
    artifacts = {a['id']: a for a in refs['artifacts']}
    require(len(artifacts) == 12, 'Duplicate artifact identity')
    require(len({row['familyId'] for row in refs['rows']}) == 113,
            'Frozen family inventory differs')
    rows_by_archive = {artifact_id: [] for artifact_id in artifacts}
    positions = set()
    for row in refs['rows']:
        source = row['source']
        position = f"{source['sessionId']}:{source['index']}"
        require(position not in positions, 'Duplicate frozen native position')
        require(row['artifactId'] in artifacts, 'Unlisted original artifact')
        positions.add(position)
        rows_by_archive[row['artifactId']].append(row)
    token = os.environ.get('GITHUB_TOKEN', '')
    require(archive_dir is not None or token,
            'GITHUB_TOKEN with actions:read is required, or pass --archive-dir for original ZIPs')
    extracted = {}
    verified = []
    for artifact_id, artifact in artifacts.items():
        require(artifact['runId'] == refs['sourceRun'] and
                artifact['headSha'] == refs['sourceHead'], 'Artifact run/HEAD identity differs')
        require(Path(artifact['fileName']).name == artifact['fileName'], 'Unsafe artifact basename')
        if archive_dir is not None:
            path = archive_dir / artifact['fileName']
            require(path.is_file(), f'Original artifact {artifact_id} is missing; do not rerun tests')
            data = path.read_bytes()
        else:
            data = download_original(artifact, token)
        require(len(data) == artifact['bytes'], f'Artifact {artifact_id}: byte size mismatch')
        require(sha256(data) == artifact['sha256'], f'Artifact {artifact_id}: SHA256 mismatch')
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            require(len(archive.namelist()) == len(set(archive.namelist())),
                    f'Artifact {artifact_id}: duplicate ZIP member')
            require(archive.testzip() is None, f'Artifact {artifact_id}: ZIP CRC failed')
            for row in rows_by_archive[artifact_id]:
                source = row['source']
                position = f"{source['sessionId']}:{source['index']}"
                decoded_bytes = archive.read(row['member'])
                require(sha256(decoded_bytes) == row['memberSha256'],
                        f'{position}: decoded member hash mismatch')
                state = json.loads(decoded_bytes)
                lesson = state['lessons'][source['sessionId']]
                index = str(source['index'])
                model, record = lesson['models'][index], lesson['cases'][index]
                digest = sha256(json_bytes({'model': model, 'record': record}))
                require(digest == row['modelRecordSha256'], f'{position}: model/record digest mismatch')
                require(isinstance(record, dict) and isinstance(record.get('attempts'), list),
                        f'{position}: original complete Check record is missing')
                extracted[position] = {
                    'packet': row['packet'], 'familyId': row['familyId'], 'group': row['group'],
                    'source': {'position': position, **source}, 'model': model, 'record': record,
                    'provenance': {'run': refs['sourceRun'], 'head': refs['sourceHead'],
                                   'artifactId': artifact_id, 'member': row['member'],
                                   'memberSha256': row['memberSha256'],
                                   'modelRecordSha256': digest, 'transportOnly': True,
                                   'freshMathematicalEvaluation': False}}
        verified.append({'artifactId': artifact_id, 'bytes': len(data), 'sha256': sha256(data),
                         'officialSizeMatch': True, 'officialSha256Match': True, 'zipCrc': 'PASS'})
    require(len(extracted) == 365, 'Original archived extraction is incomplete')
    fixture = {'schema': 'issue-341-archived-original-check-fixtures/1',
               'method': 'Original archived model and complete Check record read locally; '
                         'no raw record publication, synthesis or original test rerun',
               'sourceRun': refs['sourceRun'], 'sourceHead': refs['sourceHead'],
               'requiredScope': refs['requiredScope'],
               'rows': [extracted[f"{r['source']['sessionId']}:{r['source']['index']}"]
                        for r in refs['rows']]}
    fixture_bytes = json_bytes(fixture) + b'\n'
    fixture_path = OUTPUT / 'archived-checks-365.json'
    temporary_path = OUTPUT / 'archived-checks-365.json.tmp'
    temporary_path.write_bytes(fixture_bytes)
    temporary_path.replace(fixture_path)
    receipt = {'schema': 'issue-341-archived-input-preparation/1',
               'status': 'PASS_ORIGINAL_ARTIFACT_TRANSPORT_ONLY',
               'sourceRun': refs['sourceRun'], 'sourceHead': refs['sourceHead'],
               'referencesSha256': sha256(reference_bytes), 'fixtureSha256': sha256(fixture_bytes),
               'fixtureBytes': len(fixture_bytes), 'families': 113, 'positions': 365,
               'originalZipCount': len(verified), 'artifacts': verified,
               'rawRecordsPublished': False, 'originalMathOrBrowserTestsRerun': 0,
               'inputMode': 'local-original-zips' if archive_dir is not None else 'github-actions-read-only'}
    (OUTPUT / 'preparation-receipt.json').write_bytes(json_bytes(receipt) + b'\n')
    return receipt


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive-dir', type=Path,
                        help='Use already verified original ZIPs; no network or token needed')
    args = parser.parse_args()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    # A failed fresh preparation cannot leave a stale fixture available to tests.
    for name in ('archived-checks-365.json', 'archived-checks-365.json.tmp', 'preparation-receipt.json'):
        (OUTPUT / name).unlink(missing_ok=True)
    try:
        receipt = prepare(args.archive_dir.resolve() if args.archive_dir is not None else None)
    except Exception as error:
        for name in ('archived-checks-365.json', 'archived-checks-365.json.tmp'):
            (OUTPUT / name).unlink(missing_ok=True)
        print('ISSUE341_ARCHIVED_INPUTS_FAILED ' + str(error), file=sys.stderr)
        return 1
    print('ISSUE341_ARCHIVED_INPUTS ' + json.dumps({
        key: receipt[key] for key in ('status', 'positions', 'families', 'originalZipCount',
                                     'fixtureSha256', 'rawRecordsPublished', 'originalMathOrBrowserTestsRerun')}))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
