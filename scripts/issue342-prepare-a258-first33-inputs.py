#!/usr/bin/env python3
"""Restore only 33 original PR Chromium Check records from seven pinned CI ZIPs.

Read-only transport: no fabricated model, no generated Check, no old test replay.
No children's original work is published in the Git tree or release output.
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
FIXTURE = OUT / 'archived-checks-a258-first33.json'
RECEIPT = OUT / 'preparation-receipt-a258-first33.json'
REPO = 'runlinx-eng/math'
# Frozen ID, CI HEAD, bytes and independent full ZIP SHA256 from original
# successful Chromium runs. Any mismatch fails closed.
ARTIFACTS = (
 ('P008R0',14740293339,'16e3ab471a7e02df19edcc72fa7df84a7d21e915',239588,'44934320eca54e7ce672043a728633c34f02c608e26b09118a4e0073971cfc72'),
 ('P008R1',14740745748,'16e3ab471a7e02df19edcc72fa7df84a7d21e915',926053,'1f9779ffe565401c3accad16f148617ac9a2be08c1bf0b2d246a021084cec277'),
 ('P008R2',14740133739,'16e3ab471a7e02df19edcc72fa7df84a7d21e915',1139867,'be0f24313c7f52e74dd14d8f891d718bbc0cdceb19c9b0c66e3533d3ab072c56'),
 ('P008R3',14739633400,'16e3ab471a7e02df19edcc72fa7df84a7d21e915',1054681,'70a21a03d1e5e17bce9541f866a929306b9260de610a0287bd3fbfa1e4196f52'),
 ('P008E',14740041861,'d40148dc453fce8ad63a5e65d6b2072074466e51',295858,'908e4d8cb8e3d5fe3e8b11470f3d10d65887b1e2cde1c7922c5966c079306c42'),
 ('P010R',14739553365,'9f18a07568ebc5fbd3c02df689229a8f4f8075a1',189290,'b429e4f783aae6301360abc783bf4bd6dc4ed6a6b0e6be98b930605240bcf514'),
 ('P041B',14739674814,'aa25d05122fbe6de6fbcfbeb14faaacb68184e36',202140,'263c77007aa95e6d86f4e13e4f91aac46c82d43596d22e6d5c108e19e93c00c1'),
)
FAMILY = {
 'P008R0':'issue341-A-P008R','P008R1':'issue341-A-P008R',
 'P008R2':'issue341-A-P008R','P008R3':'issue341-A-P008R',
 'P008E':'issue341-A-P008E','P010R':'issue341-A-P010R',
 'P041B':'issue341-A-P041B'
}
EXPECTED = {'issue341-A-P008R':28,'issue341-A-P008E':1,
            'issue341-A-P010R':2,'issue341-A-P041B':2}
MEMBER = re.compile(r'/(?:([A-Za-z0-9_]+)-([0-9]+))-correct-check-decoded\.json$')
def require(condition,description):
 if not condition:raise ValueError('A258 original Check transport: '+description)
def digest(raw):return hashlib.sha256(raw).hexdigest()
def dump(value):return json.dumps(value,ensure_ascii=False,separators=(',',':'),
                                   allow_nan=False).encode('utf-8')
def download(artifact):
 spec=importlib.util.spec_from_file_location('issue341_original_transport',
      ROOT/'scripts/issue341-prepare-archived-inputs.py')
 module=importlib.util.module_from_spec(spec)
 spec.loader.exec_module(module)
 token=os.environ.get('GITHUB_TOKEN','')
 require(token,'GitHub Actions token (actions:read) required')
 return module.download_original({'id':artifact[1],'bytes':artifact[3]},token)

def main():
 OUT.mkdir(parents=True,exist_ok=True)
 FIXTURE.unlink(missing_ok=True)
 RECEIPT.unlink(missing_ok=True)
 try:
  manifest=json.loads((ROOT/'docs/spatial-learning/evidence-review-manifest.json').read_bytes())
  chosen=[row for row in manifest['tasks'] if row.get('adapter') in EXPECTED]
  require(len(chosen)==33,'exact 33 formal-source rows not registered')
  bykey={r['sessionId']+':'+str(r['index']):r for r in chosen}
  require(len(bykey)==33,'duplicate formal original position')
  require(all(sum(r['adapter']==f for r in chosen)==count
           for f,count in EXPECTED.items()),'frozen math family count drift')
  records={}
  receipts=[]
  for group,artifact_id,head,expected_bytes,zip_hash in ARTIFACTS:
   content=download((group,artifact_id,head,expected_bytes,zip_hash))
   require(len(content)==expected_bytes and digest(content)==zip_hash,
           'original ZIP digest or byte count mismatch '+str(artifact_id))
   with zipfile.ZipFile(io.BytesIO(content)) as zipfile_object:
    names=zipfile_object.namelist()
    info=zipfile_object.infolist()
    require(len(names)==len(set(names)) and zipfile_object.testzip() is None,
            'duplicate/CRC failure '+str(artifact_id))
    require(len(names)<500 and sum(e.file_size for e in info)<12000000 and
            all(not n.startswith('/') and '..' not in Path(n).parts
               and '\\' not in n for n in names),'unsafe ZIP members '+str(artifact_id))
    result_names=[n for n in names if n.endswith('/results.json')]
    require(len(result_names)==1,'not exactly one native browser results receipt')
    result=json.loads(zipfile_object.read(result_names[0]))
    require((result.get('testedCheckoutSha') or result.get('head'))==head
            and result.get('originalControls') is True
            and result.get('strictAApproved') is False
            and result.get('errors')==[]
            and len(result.get('checks',[]))>0,
            'original real Chromium HEAD/contract mismatch '+str(artifact_id))
    complete=[n for n in names if n.endswith('-correct-check-decoded.json')]
    require(len(complete)>0,'no original corrected Check '+str(artifact_id))
    batch=[]
    for name in complete:
     match=MEMBER.search(name)
     require(match is not None,'invalid original session/index member '+name)
     sid,index=match.group(1),int(match.group(2))
     pos=sid+':'+str(index)
     row=bykey.get(pos)
     require(row is not None and row['adapter']==FAMILY[group] and
             pos not in records,
             'missing/unlisted/duplicate source '+pos)
     state_bytes=zipfile_object.read(name)
     state=json.loads(state_bytes)
     require(state.get('schema')==2 and isinstance(state.get('lessons'),dict),
             'not authentic serialized original State-v2 '+pos)
     lesson=state['lessons'].get(sid)
     require(isinstance(lesson,dict),'original lesson missing '+pos)
     model=lesson.get('models',{}).get(str(index))
     record=lesson.get('cases',{}).get(str(index))
     require(isinstance(model,dict) and isinstance(record,dict),
             'original model or Check missing '+pos)
     attempts=record.get('attempts')
     require(isinstance(attempts,list) and len(attempts)==2 and
             all(isinstance(a,dict) and isinstance(a.get('value'),dict) for a in attempts)
             and attempts[0]['value']!=model and attempts[-1]['value']==model,
             'wrong then corrected original native Check missing '+pos)
     # The original checked model is still independently evaluated by
     # every exact-source JavaScript mathematical adapter in the formal audit.
     source={k:row[k] for k in ('sessionId','index','nodeId','type','taskHash')}
     source['position']=pos
     records[pos]={
      'group':group,'familyId':row['adapter'],'source':source,'model':model,'record':record,
      'provenance':{'transportOnly':True,'freshMathOrBrowserReplay':False,
       'originalControls':True,'originalArtifactsNotPublished':True,
       'artifactId':artifact_id,'testedHead':head,'member':name,
       'memberSha256':digest(state_bytes),
       'modelRecordSha256':digest(dump({'model':model,'record':record}))}
     }
     batch.append(pos)
    receipts.append({'group':group,'artifactId':artifact_id,'headSha':head,
                     'zipSha256':zip_hash,'bytes':len(content),'positions':sorted(batch)})
  require(set(records)==set(bykey),'not exactly the 33 native original Checks')
  require(all(sum(r['familyId']==f for r in records.values())==n
              for f,n in EXPECTED.items()),'archived family counts differ')
  output={'schema':'issue342-a258-first33-original-Check/1',
          'source':'seven immutable original Github CI Chromium Artifact ZIPs',
          'rows':[records[r['sessionId']+':'+str(r['index'])] for r in chosen]}
  raw=dump(output)+b'\n'
  FIXTURE.write_bytes(raw)
  RECEIPT.write_bytes(dump({
   'schema':'issue342-a258-first33-input-receipt/1','status':'PASS',
   'originalCheckRecords':33,'families':4,'artifacts':receipts,
   'fixtureSha256':digest(raw),'originalTestsRerun':0,
   'originalRecordsPublished':False})+b'\n')
  print('A258_FIRST33_ORIGINAL_CHECKS_OK '+json.dumps({
   'positions':33,'families':4,'zipArtifacts':len(ARTIFACTS),
   'newChecksGenerated':0,'sha256':digest(raw)}))
 except Exception:
  FIXTURE.unlink(missing_ok=True)
  RECEIPT.unlink(missing_ok=True)
  raise

if __name__=='__main__':
 main()
