#!/usr/bin/env python3
"""Restore 11 *original* wrong->correct State-v2 Checks from five pinned CI ZIPs.

Read-only GitHub artifact transport; does not rerun or construct learner work.
Missing/mutated source, original Check, ZIP bytes, CRC, or head fails closed.
"""
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import re
import zipfile

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'verification/issue341-inputs'
FIXTURE = OUT / 'archived-checks-a258-next11.json'
RECEIPT = OUT / 'preparation-receipt-a258-next11.json'
# Frozen artifact id, CI commit, ZIP byte length, SHA-256, and exact family.
ARTIFACTS = (
 ('issue341-A-P030B', 14741149422, 'd13919f99937eab441aa3c80c7a73d2313785031', 259749, '35afb65297c717e8e6dc544bc312c0873bf965b7dc089da1bacc19a3685af725'),
 ('issue341-A-P034G', 14741706231, '19dd6507453a118d1dd813caad5ce51fd27c8d93', 305063, 'd94ca7437bf73d66be9cf72ed7d5164f57edadf97b767334428e7a35984902c2'),
 ('issue341-A-P038U', 14740328421, 'd91490b8aa73e77b9d66705566ef9543df0e6f17', 244477, '2b4b39c1c4ca72af363209884f2e13ab2f5064d0a6dc062ca501e2c0b5905f1f'),
 ('issue341-A-P052C', 14739959816, 'a0c8a0a4d2c469a74a0656dd1b12c88d7f1196f0', 222768, 'bc5223c841b7ea71ff58bad8ca6f40ee9e9f2b6b1c27ad9dc99872c059003912'),
 ('issue341-A-P056M', 14740941461, 'af2798d185a7674435e9367a3e3e1c23c51e4f1a', 203176, '74e5e4e5fdc4f1aca58cc78fc8a7a55589f257f120cc27a2b61a0967112fbd49')
)
EXPECTED={'issue341-A-P030B':3,'issue341-A-P034G':3,'issue341-A-P038U':3,
          'issue341-A-P052C':1,'issue341-A-P056M':1}
MEMBER=re.compile(r'/([A-Za-z0-9_]+)-(\\d+)-correct-check-decoded\\.json$')
def require(ok,description):
 if not ok:raise ValueError('A258 next11 original Check: '+description)
def sha(raw):return hashlib.sha256(raw).hexdigest()
def compact(x):return json.dumps(x,ensure_ascii=False,separators=(',',':'),allow_nan=False).encode('utf-8')
def download(artifact_id,expected_bytes):
 spec=importlib.util.spec_from_file_location('issue341_original_transport',
             ROOT/'scripts/issue341-prepare-archived-inputs.py')
 module=importlib.util.module_from_spec(spec)
 spec.loader.exec_module(module)
 token=os.environ.get('GITHUB_TOKEN','')
 require(token,'GitHub Actions read token required')
 return module.download_original({'id':artifact_id,'bytes':expected_bytes},token)
def main():
 OUT.mkdir(parents=True,exist_ok=True)
 FIXTURE.unlink(missing_ok=True)
 RECEIPT.unlink(missing_ok=True)
 try:
  manifest=json.loads((ROOT/'docs/spatial-learning/evidence-review-manifest.json').read_bytes())
  listed=[r for r in manifest['tasks'] if r.get('adapter') in EXPECTED]
  require(len(listed)==11,'formal manifest must contain exactly 11 frozen rows')
  bykey={r['sessionId']+':'+str(r['index']):r for r in listed}
  require(len(bykey)==11,'duplicate source in official manifest')
  require(all(sum(r['adapter']==family for r in listed)==count for family,count in EXPECTED.items()),
          'wrong frozen source family sizes')
  records,receipts={},[]
  for family,artifact_id,head,size,fullsha in ARTIFACTS:
   raw=download(artifact_id,size)
   require(len(raw)==size and sha(raw)==fullsha,'ZIP size/hash mismatch '+str(artifact_id))
   with zipfile.ZipFile(io.BytesIO(raw)) as z:
    names=z.namelist()
    require(len(names)==len(set(names)) and z.testzip() is None,'duplicate/CRC ZIP '+str(artifact_id))
    require(len(names)<500 and sum(x.file_size for x in z.infolist())<12000000 and
            all(not name.startswith('/') and '..' not in Path(name).parts and
                    '\\\\' not in name for name in names),'unsafe ZIP member '+str(artifact_id))
    results=[n for n in names if n.endswith('/results.json')]
    require(len(results)==1,'missing/ambiguous original Chromium results')
    result=json.loads(z.read(results[0]))
    require((result.get('testedCheckoutSha') or result.get('head'))==head and
            result.get('originalControls') is True and
            result.get('strictAApproved') is False and
            result.get('errors')==[] and len(result.get('checks',[]))>0,
            'original Chromium checkout, controls or result drift '+str(artifact_id))
    members=[name for name in names if name.endswith('-correct-check-decoded.json')]
    require(len(members)==EXPECTED[family],'wrong original Check count '+family)
    found=[]
    for member in members:
     m=MEMBER.search(member)
     require(m is not None,'bad State-v2 Check member '+member)
     sid,index=m.group(1),int(m.group(2))
     key=sid+':'+str(index)
     row=bykey.get(key)
     require(row is not None and row['adapter']==family and key not in records,
             'missing/foreign/duplicate original source '+key)
     data=z.read(member)
     state=json.loads(data)
     require(state.get('schema')==2 and isinstance(state.get('lessons'),dict),
             'not original State-v2 '+key)
     lesson=state['lessons'].get(sid)
     require(isinstance(lesson,dict),'original session absent '+key)
     model=lesson.get('models',{}).get(str(index))
     record=lesson.get('cases',{}).get(str(index))
     require(isinstance(model,dict) and isinstance(record,dict),
             'original model/attempt record absent '+key)
     attempts=record.get('attempts')
     require(isinstance(attempts,list) and len(attempts)==2 and
             all(isinstance(a,dict) and isinstance(a.get('value'),dict) for a in attempts) and
             attempts[0]['value']!=model and attempts[-1]['value']==model,
             'authentic wrong then corrected Check missing '+key)
     source={k:row[k] for k in ('sessionId','index','nodeId','type','taskHash')}
     source['position']=key
     records[key]={'familyId':family,'source':source,'model':model,'record':record,
      'provenance':{'transportOnly':True,'freshMathOrBrowserReplay':False,
       'originalControls':True,'originalArtifactsNotPublished':True,
       'artifactId':artifact_id,'testedHead':head,'member':member,
       'memberSha256':sha(data),'modelRecordSha256':sha(compact({'model':model,'record':record}))}}
     found.append(key)
    receipts.append({'familyId':family,'artifactId':artifact_id,'headSha':head,
                     'zipSha256':fullsha,'bytes':len(raw),'positions':sorted(found)})
  require(set(records)==set(bykey),'missing exact original 11 source positions')
  fixture={'schema':'issue342-a258-next11-original-Check/1',
           'source':'five immutable original GitHub CI Chromium artifacts',
           'rows':[records[row['sessionId']+':'+str(row['index'])] for row in listed]}
  content=compact(fixture)+b'\\n'
  FIXTURE.write_bytes(content)
  RECEIPT.write_bytes(compact({'schema':'issue342-a258-next11-input-receipt/1',
   'status':'PASS','originalCheckRecords':11,'families':5,'originalTestsRerun':0,
   'originalRecordsPublished':False,'artifacts':receipts,'fixtureSha256':sha(content)})+b'\\n')
  print('A258_NEXT11_ORIGINAL_CHECKS_OK '+json.dumps({'positions':11,
    'families':5,'zipArtifacts':5,'newChecksGenerated':0,'sha256':sha(content)}))
 except Exception:
  FIXTURE.unlink(missing_ok=True)
  RECEIPT.unlink(missing_ok=True)
  raise
if __name__=='__main__':
 main()
