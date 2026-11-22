#!/usr/bin/env python3
"""Read only four source-frozen original B39 Check records from #343's Mac archive.

Never synthesize student work, run old Chromium again or commit State-v2 data.
A missing archive, changed hashes, foreign source or malformed attempt fails closed.
"""
import hashlib
import io
import json
from pathlib import Path
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'verification/issue341-inputs'
FROZEN = '348b9221562d8f4da66c3778f126481df7c56efe'
BASELINE = '1e9d270d7243b3519fabcfbe7f05f66f82cada73'
ARCHIVE_SHA = '8406bf77515db4ed3a33b25d7d540a02cbe46f50f886c4ae9e95198a478a4716'
ARCHIVE_BYTES = 10827844
URL = ('https://raw.githubusercontent.com/runlinx-eng/math/' + FROZEN +
       '/docs/math-parallel/issue-343-a214-execution/originals/native-chromium.zip')
FIXTURE = OUT / 'archived-checks-a214-b39.json'
RECEIPT = OUT / 'preparation-receipt-a214-b39.json'
# Family, exact original source, node, widget, full task hash, original child-commit,
# and SHA-256 of the correctly submitted Check extracted from the pinned archive.
SOURCES = (
 ('square-inclusion','structure39',2,'mt__Itf4aQZUj','x-s23-quad',
  '59c85cf7b19f96f967978b44a4e829775825dcc91967bffcf28040ca30f39689',
  '14650756246953f217220e22e565ddfee9c9ce17',
  '1516198755f140375507983cbba1b35a81b672f5bed8dc15c734d7612288ac0a','S'),
 ('quadrilateral-nesting','structure39',3,'mt__Itf4aQZUj','x-s23-nest',
  '31cc0267773b61a7cff693870b0b13c4d69a68449f2b8113f5085c291b69c117',
  'fbc493327260812cc7a85e8267ab339eea37a746',
  '0871401c7ef092a3c4ac59f0380e1eae995fb7e0a9a9b581c5aab476fbb68b59','N'),
 ('angle-estimate','representations39',2,'mt_IwEOCN6bL1','x-g25-estimate',
  '2e95b28676442bc8fc86c1bdfdeec5cfb3cff4d88efa1c546acbf6dfa3e06e35',
  'aaed413e60e290b5f14414b08a2fe8b8cae9dd6f',
  '0c2aca8c90b0d01612913c446e9b4f2603e2d40a631f36f6d4480cf25728befc','E'),
 ('protractor','representations39',3,'mt_IwEOCN6bL1','x-g25-protractor',
  '22361ebcab22ac8165f67ff67a8c8d3221ff90efe1140fed0e872c139beebc9a',
  'e88ba1190900e384a9768e2f2c63ff0cef821414',
  '76697233f36e4086f3d32b6137bd747a6022ed6aec84b856896be889171fcf85','P'),
)
def require(ok, why):
 if not ok: raise ValueError('B39 archive integrity: ' + why)
def sha(b): return hashlib.sha256(b).hexdigest()
def compact(v): return json.dumps(v, ensure_ascii=False, separators=(',', ':'),allow_nan=False).encode()
def main():
 OUT.mkdir(parents=True, exist_ok=True)
 FIXTURE.unlink(missing_ok=True)
 RECEIPT.unlink(missing_ok=True)
 try:
  req=urllib.request.Request(URL, headers={'User-Agent':'math-issue343-readonly-receipt/1'})
  with urllib.request.urlopen(req, timeout=120) as response: raw=response.read(ARCHIVE_BYTES+1)
  require(len(raw)==ARCHIVE_BYTES and sha(raw)==ARCHIVE_SHA,'frozen ZIP bytes/SHA mismatch')
  official=json.loads((ROOT/'docs/spatial-learning/evidence-review-manifest.json').read_bytes())
  rows_by_position={r['sessionId']+':'+str(r['index']):r for r in official['tasks']}
  require(official.get('schema')=='math-evidence-reviewed-sources/1','formal schema mismatch')
  require(len(official['tasks'])==1667 and len(rows_by_position)==1667,'official 1667 unique sources expected')
  with zipfile.ZipFile(io.BytesIO(raw)) as z:
   members=z.infolist()
   require(len(members)==1261 and len({m.filename for m in members})==1261,'archive member count/uniqueness drift')
   require(all(not m.filename.startswith('/') and '..' not in Path(m.filename).parts
      and chr(92) not in m.filename for m in members),'unsafe archived path')
   require(sum(m.file_size for m in members)<60000000,'archive expanded size bound exceeded')
   require(z.testzip() is None,'original archive CRC mismatch')
   verified=[]
   for family,sid,index,node,kind,hash_,candidate_sha,check_sha,suffix in SOURCES:
    position=sid+':'+str(index)
    formal=rows_by_position.get(position)
    adapter='issue341-A214-B39-'+suffix
    require(formal is not None and formal['adapter']==adapter and formal['nodeId']==node
      and formal['type']==kind and formal['taskHash']==hash_ and formal['method'] is None,
      'official manifest not identical '+position)
    folder=family+'-original/'
    report=json.loads(z.read(folder+'results.json'))
    require(report.get('testedCheckoutSha')==candidate_sha and report.get('baseline')==BASELINE
      and report.get('originalControls') is True and report.get('seededWork') is False
      and report.get('strictAApproved') is False and report.get('offline',{}).get('originStopped') is True,
      'authentic original Chromium receipt absent '+position)
    checked=folder+sid+'-'+str(index)+'-correct-check-decoded.json'
    data=z.read(checked)
    require(sha(data)==check_sha,'original Check digest mismatch '+position)
    state=json.loads(data)
    require(state.get('schema')==2 and isinstance(state.get('lessons'),dict),'State-v2 missing '+position)
    lesson=state['lessons'].get(sid,{})
    models=lesson.get('models',{})
    cases=lesson.get('cases',{})
    model=models.get(str(index))
    record=cases.get(str(index))
    require(isinstance(model,dict) and isinstance(record,dict),'original lesson/model absent '+position)
    attempts=record.get('attempts')
    require(isinstance(attempts,list) and len(attempts)==2 and
      attempts[0].get('value')!=model and attempts[1].get('value')==model,
      'original wrong-then-correct Check absent '+position)
    restored=json.loads(z.read(folder+sid+'-'+str(index)+'-restored-decoded.json'))
    restored_lesson=restored['lessons'][sid]
    require(restored_lesson['models'][str(index)]==model and restored_lesson['cases'][str(index)]==record,
      'stopped-origin restoration differs '+position)
    exported=json.loads(z.read(folder+'native-state-v2.json'))
    require(exported.get('version')==2 and exported.get('app')=='math-explorer',
      'not a genuine native State-v2 export '+position)
    exported_lesson=exported['state']['lessons'][sid]
    require(exported_lesson['models'][str(index)]==model and exported_lesson['cases'][str(index)]==record,
      'native export did not preserve Check '+position)
    source={'sessionId':sid,'index':index,'position':position,'nodeId':node,'type':kind,'taskHash':hash_}
    verified.append({'familyId':adapter,'source':source,'model':model,'record':record,
      'provenance':{'transportOnly':True,'freshMathOrBrowserReplay':False,'originalControls':True,
       'memberSha256':check_sha,'modelRecordSha256':sha(compact({'model':model,'record':record})),
       'candidateHead':candidate_sha,'archiveSha256':ARCHIVE_SHA,'member':checked}})
  content=compact({'schema':'issue343-a214-b39-original-Check/1','rows':verified})+b'\n'
  FIXTURE.write_bytes(content)
  RECEIPT.write_bytes(compact({'schema':'issue343-a214-b39-readonly-receipt/1',
    'status':'PASS','positions':[r['source']['position'] for r in verified],
    'archiveSha256':ARCHIVE_SHA,'fixtureSha256':sha(content),
    'originalCheckRecords':4,'freshMathOrBrowserRuns':0})+b'\n')
  print('A214_B39_ORIGINAL_CHECKS_OK '+json.dumps({'positions':4,'sha256':sha(content)}))
 except Exception:
  FIXTURE.unlink(missing_ok=True)
  RECEIPT.unlink(missing_ok=True)
  raise
if __name__=='__main__': main()
