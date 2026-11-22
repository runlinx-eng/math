#!/usr/bin/env python3
"""Pin and transport #343 remaining 95 real Chromium Checks and State-v2 backups.

The frozen source lock derives from #343's 99-row Mac handoff. Never generate
new learner attempts: extract exact SHA-locked original bytes, fail closed.
"""
import hashlib
import io
import json
from pathlib import Path
import urllib.request
import zipfile

ROOT=Path(__file__).resolve().parent.parent
LOCK=ROOT/'docs/math-parallel/issue343-a214-next95-original-lock.json'
OUT=ROOT/'verification/issue341-inputs'
FROZEN='348b9221562d8f4da66c3778f126481df7c56efe'
BASELINE='1e9d270d7243b3519fabcfbe7f05f66f82cada73'
URL='https://raw.githubusercontent.com/runlinx-eng/math/'+FROZEN+'/docs/math-parallel/issue-343-a214-execution/originals/native-chromium.zip'
DATA=OUT/'archived-checks-a214-next95.json'
RECEIPT=OUT/'preparation-receipt-a214-next95.json'
def require(value,message):
 if not value: raise ValueError('issue343 95 frozen originals: '+message)
def digest(data): return hashlib.sha256(data).hexdigest()
def compact(obj): return json.dumps(obj,ensure_ascii=False,separators=(',',':'),allow_nan=False).encode('utf-8')
def run():
 OUT.mkdir(parents=True,exist_ok=True)
 DATA.unlink(missing_ok=True);RECEIPT.unlink(missing_ok=True)
 prior_exports=list(OUT.glob('b39-next95-original-export-*.json'))
 for p in prior_exports:p.unlink()
 try:
  lock=json.loads(LOCK.read_bytes())
  rows=lock['rows']
  require(lock['schema']=='issue343-a214-next95-original-source-lock/1' and
    lock['frozen']==FROZEN and lock['baseline']==BASELINE and
    len(rows)==95 and len({r['position'] for r in rows})==95 and
    len({r['family'] for r in rows})==21,'95 exact source identities missing')
  official=json.loads((ROOT/'docs/spatial-learning/evidence-review-manifest.json').read_bytes())
  approved={r['sessionId']+':'+str(r['index']):r for r in official['tasks']}
  require(len(approved)==1762 and len(official['tasks'])==1762,'main must contain 1762 unique A sources')
  expected_arch=lock['archive']
  with urllib.request.urlopen(urllib.request.Request(URL,headers={'User-Agent':'math-source-locked-originals/1'}),timeout=120) as stream:
   raw=stream.read(expected_arch['bytes']+1)
  require(len(raw)==expected_arch['bytes'] and digest(raw)==expected_arch['sha256'],
    'immutable original ZIP digest/bytes differ')
  with zipfile.ZipFile(io.BytesIO(raw)) as z:
   members=z.infolist()
   require(len(members)==expected_arch['members'] and len({x.filename for x in members})==len(members),
    'ZIP member inventory drift')
   require(all(not m.filename.startswith('/') and '..' not in Path(m.filename).parts
    and chr(92) not in m.filename for m in members),'unsafe member path')
   require(sum(m.file_size for m in members)<60000000 and z.testzip() is None,
    'archive CRC/size is untrustworthy')
   reports={}; exports={}; proven=[]
   for row in rows:
    family,sid,index=row['family'],row['sessionId'],row['index']
    position=sid+':'+str(index)
    require(position==row['position'],'position/index drift')
    exact=approved.get(position)
    require(exact is not None and exact['adapter']=='issue341-A214-'+family and
      exact['nodeId']==row['nodeId'] and exact['type']==row['type'] and
      exact['taskHash']==row['taskHash'] and exact['method'] is None,
      'formal manifest differs '+position)
    member=row['checkPath'];run_name=member.split('/')[0]
    require(member==run_name+'/'+sid+'-'+str(index)+'-correct-check-decoded.json',
      'archive member path mismatch '+position)
    if run_name not in reports:
     reports[run_name]=json.loads(z.read(run_name+'/results.json'))
     exports[run_name]=z.read(run_name+'/native-state-v2.json')
    report=reports[run_name]
    require(report.get('testedCheckoutSha')==row['candidateSha'] and
      report.get('baseline')==BASELINE and report.get('originalControls') is True and
      report.get('seededWork') is False and report.get('strictAApproved') is False and
      report.get('offline',{}).get('originStopped') is True,
      'native Chromium/offline receipt invalid '+position)
    passes=[v for v in report.get('positions',[]) if
     v.get('position')==position and v.get('status')=='PASS']
    require(len(passes)==1 and passes[0]['nodeId']==row['nodeId'] and
      passes[0]['type']==row['type'] and passes[0]['taskHash']==row['taskHash'],
      'original Chromium PASS identity missing '+position)
    require(run_name+'/'+passes[0]['correct']['decoded']==member,
      'Check path not referenced by native PASS '+position)
    content=z.read(member)
    require(digest(content)==row['checkSha256'],'original Check SHA mismatch '+position)
    original=json.loads(content)
    require(original.get('schema')==2 and sid in original.get('lessons',{}),
      'native State-v2 decoded lesson missing '+position)
    lesson=original['lessons'][sid]
    model=lesson['models'][str(index)]
    record=lesson['cases'][str(index)]
    attempts=record.get('attempts')
    require(isinstance(attempts,list) and len(attempts)==2 and
     attempts[0].get('value')!=model and attempts[1].get('value')==model,
     'wrong-then-correct historical native Checks missing '+position)
    restored=json.loads(z.read(run_name+'/'+sid+'-'+str(index)+'-restored-decoded.json'))
    restored_lesson=restored['lessons'][sid]
    require(restored_lesson['models'][str(index)]==model and
      restored_lesson['cases'][str(index)]==record,
      'offline restoration mismatch '+position)
    backup=json.loads(exports[run_name])
    require(backup.get('version')==2 and backup.get('app')=='math-explorer',
      'State-v2 native backup invalid '+position)
    backed=backup['state']['lessons'][sid]
    require(backed['models'][str(index)]==model and backed['cases'][str(index)]==record,
      'export not equal to original Check '+position)
    source={k:row[k] for k in ('sessionId','index','position','nodeId','type','taskHash')}
    proven.append({'familyId':'issue341-A214-'+family,'source':source,'model':model,'record':record,
      'provenance':{'transportOnly':True,'freshMathOrBrowserReplay':False,'originalControls':True,
       'memberSha256':row['checkSha256'],'modelRecordSha256':digest(compact({'model':model,'record':record})),
       'candidateHead':row['candidateSha'],'archiveSha256':expected_arch['sha256'],'member':member}})
  require(len(proven)==95 and len(exports)>=21,'missing B39 family evidence or exports')
  contents=compact({'schema':'issue343-a214-next95-original-Check/1','rows':proven})+b'\n'
  DATA.write_bytes(contents)
  for name,data in exports.items():
   (OUT/('b39-next95-original-export-'+name+'.json')).write_bytes(data)
  RECEIPT.write_bytes(compact({'schema':'issue343-a214-next95-readonly-receipt/1','status':'PASS',
    'originalCheckRecords':95,'familyCount':21,'authenticNativeExports':len(exports),
    'freshMathOrBrowserRuns':0,'archiveSha256':lock['archive']['sha256'],
    'fixtureSha256':digest(contents)})+b'\n')
  print('A214_NEXT95_ORIGINAL_CHECKS_OK '+json.dumps({'count':95,'exports':len(exports),'sha256':digest(contents)}))
 except Exception:
  DATA.unlink(missing_ok=True);RECEIPT.unlink(missing_ok=True)
  for p in OUT.glob('b39-next95-original-export-*.json'):p.unlink()
  raise
if __name__=='__main__':run()
