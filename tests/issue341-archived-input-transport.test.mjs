// Security and failure gates for the new read-only input transport. These tests
// use metadata and tiny synthetic ZIPs only, never the old math/browser suites.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const prefix=String.raw`
import copy, importlib.util, io, json, tempfile, zipfile
from pathlib import Path
from unittest import mock
from urllib.error import HTTPError
spec=importlib.util.spec_from_file_location('transport', Path('scripts/issue341-prepare-archived-inputs.py'))
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
original_refs=json.loads(m.REFERENCES.read_text())
`;
function python(body){
 const result=spawnSync('python3',['-c',prefix+body],{cwd:root,encoding:'utf8',
  env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'},timeout:15000});
 assert.equal(result.error,undefined,'transport unit harness failed to start');
 assert.equal(result.status,0,result.stderr||result.stdout||'transport unit harness failed');
}

test('committed references contain source metadata and digests only; raw inputs are excluded from uploads',()=>{
 const bytes=readFileSync(new URL('./fixtures/issue341-archived-input-references.json',import.meta.url));
 const refs=JSON.parse(bytes);
 assert.ok(bytes.length<200000);
 assert.equal(refs.rows.length,365);assert.equal(refs.artifacts.length,12);
 assert.equal(new Set(refs.rows.map(row=>row.familyId)).size,113);
 const forbidden=new Set(['model','record','attempts','history','answers','support','value']);
 const inspect=value=>{
  if(Array.isArray(value))return value.forEach(inspect);
  if(value&&typeof value==='object')for(const [key,child] of Object.entries(value)){
   assert.equal(forbidden.has(key),false,'reference metadata must not contain raw record fields');inspect(child);
  }
 };
 inspect(refs);
 for(const row of refs.rows){
  for(const digest of [row.source.taskHash,row.memberSha256,row.modelRecordSha256])assert.match(digest,/^[a-f0-9]{64}$/);
 }
 const workflow=readFileSync(new URL('../.github/workflows/pull-request-baseline.yml',import.meta.url),'utf8');
 const uploadBlocks=workflow.split(/(?=      - name:)/).filter(block=>block.includes('actions/upload-artifact@'));
 const broad=uploadBlocks.filter(block=>/^\s+verification\/\s*$/m.test(block));
 assert.ok(broad.length,'the existing failure archive remains present');
 for(const block of broad)assert.match(block,/^\s+!verification\/issue341-inputs\/\*\*\s*$/m,
  'broad failure archives must exclude the local original Check inputs');
});

test('tampered ZIP size, digest, CRC, member and full-record digests fail with no replacement fixture',()=>python(String.raw`
def fails(mode, expected):
    refs=copy.deepcopy(original_refs)
    artifact=refs['artifacts'][0]
    row=next(r for r in refs['rows'] if r['artifactId']==artifact['id'])
    source=row['source']
    # Completely synthetic transport data; no mathematical fixture is evaluated.
    model={'syntheticTransportOnly':True}
    record={'attempts':[]}
    payload=m.json_bytes({'lessons':{source['sessionId']:{
        'models':{str(source['index']):model}, 'cases':{str(source['index']):record}}}})
    buffer=io.BytesIO()
    with zipfile.ZipFile(buffer,'w',compression=zipfile.ZIP_STORED) as z:
        z.writestr(row['member'],payload)
    data=buffer.getvalue()
    row['memberSha256']=m.sha256(payload)
    row['modelRecordSha256']=m.sha256(m.json_bytes({'model':model,'record':record}))
    if mode=='crc':
        data=bytearray(data)
        data[30+len(row['member'].encode())] ^= 1
        data=bytes(data)
    artifact['bytes']=len(data)
    artifact['sha256']=m.sha256(data)
    if mode=='size': artifact['bytes']+=1
    if mode=='digest': artifact['sha256']='0'*64
    if mode=='member': row['memberSha256']='0'*64
    if mode=='record': row['modelRecordSha256']='0'*64
    with tempfile.TemporaryDirectory() as temporary:
        folder=Path(temporary);zips=folder/'zips';zips.mkdir();out=folder/'out';out.mkdir()
        refpath=folder/'references.json';refpath.write_bytes(m.json_bytes(refs))
        (zips/artifact['fileName']).write_bytes(data)
        with mock.patch.object(m,'REFERENCES',refpath), mock.patch.object(m,'OUTPUT',out), \
             mock.patch.object(m,'download_original',side_effect=AssertionError('network forbidden')):
            try: m.prepare(zips)
            except ValueError as error: assert expected in str(error), str(error)
            else: raise AssertionError('tampered input was accepted')
        assert not (out/'archived-checks-365.json').exists()
for mode, message in [('size','byte size mismatch'),('digest','SHA256 mismatch'),
                      ('crc','ZIP CRC failed'),('member','decoded member hash mismatch'),
                      ('record','model/record digest mismatch')]:
    fails(mode,message)
`));

test('changed source identity, duplicate references, missing originals and missing read token fail explicitly',()=>python(String.raw`
for mode, expected in [('source','run identity changed'),('duplicate','Duplicate frozen'),
                       ('missing','is missing; do not rerun tests'),('token','actions:read is required')]:
    refs=copy.deepcopy(original_refs)
    if mode=='source': refs['sourceRun']+=1
    if mode=='duplicate': refs['rows'][1]=copy.deepcopy(refs['rows'][0])
    with tempfile.TemporaryDirectory() as temporary:
        folder=Path(temporary);refpath=folder/'references.json';refpath.write_bytes(m.json_bytes(refs))
        with mock.patch.object(m,'REFERENCES',refpath), mock.patch.dict(m.os.environ,{'GITHUB_TOKEN':''}), \
             mock.patch.object(m,'download_original',side_effect=AssertionError('network forbidden')):
            try: m.prepare(None if mode=='token' else folder)
            except ValueError as error: assert expected in str(error), str(error)
            else: raise AssertionError('unavailable or changed original input was accepted')
`));

test('HTTPS redirects strip authorization across hosts permanently and unavailable artifacts never trigger reruns',()=>python(String.raw`
class Response:
    status=200
    def __enter__(self): return self
    def __exit__(self,*args): pass
    def read(self,limit): return b'zip'
class Redirects:
    def __init__(self,locations): self.locations=list(locations);self.calls=[]
    def open(self,request,timeout):
        self.calls.append(request.has_header('Authorization'))
        if self.locations:
            raise HTTPError(request.full_url,302,'redirect',{'Location':self.locations.pop(0)},None)
        return Response()
artifact={'id':123,'bytes':3}
opener=Redirects(['https://artifacts.example.test/archive?signature=synthetic',
                  'https://api.github.com/return-to-api'])
with mock.patch.object(m,'build_opener',return_value=opener):
    assert m.download_original(artifact,'synthetic-unit-test-token')==b'zip'
assert opener.calls==[True,False,False], 'authorization crossed a host boundary or was reattached'
opener=Redirects(['http://artifacts.example.test/insecure'])
with mock.patch.object(m,'build_opener',return_value=opener):
    try: m.download_original(artifact,'synthetic-unit-test-token')
    except ValueError as error: assert 'HTTPS' in str(error)
    else: raise AssertionError('insecure redirect accepted')
assert opener.calls==[True], 'an insecure destination received a request'
for code in (404,410):
    opener=mock.Mock()
    opener.open.side_effect=HTTPError('https://api.github.com/placeholder',code,'unavailable',{},None)
    with mock.patch.object(m,'build_opener',return_value=opener):
        try: m.download_original(artifact,'synthetic-unit-test-token')
        except RuntimeError as error:
            assert f'HTTP {code}' in str(error) and 'Do not rerun original tests' in str(error)
        else: raise AssertionError('missing/expired artifact accepted')
`));
