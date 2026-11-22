#!/usr/bin/env python3
"""Read-only P001-P005 #342 31 independently tested original CI artifact ZIPs.

No seeded solutions, no new Check events, no repeated mathematical/Chromium tests.
Raw original State-v2 is only materialized in ignored verification directory.
"""
import argparse,hashlib,io,json,os,re,sys,zipfile,importlib.util
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
OUTPUT=ROOT/'verification/issue341-inputs'
FIXTURE=OUTPUT/'archived-checks-p001-p005.json'
RECEIPT=OUTPUT/'preparation-receipt-p001-p005.json'
FROZEN="""0 14692469354 44868390707 a373ada1be486b5d71d731f17e6317b6f7841d3d 33616 3157dde37ef5c0af00c5628d7940b5fac736a8c007ac9cccc48a110c5ff68ad3
1 14692524207 44868390707 82f07469947cb9861aced40eddd5a1f480ab8346 106609 e8c4fa4dae157bccfcb9b6311ec4854df7500d452f2d2a2f51071890b46df18d
2 14692966068 44868390707 dbc7e3560384737f8e491d33aaa9f5547fd494f1 45184 78c6edfb9a97fdc18e6e9c6d550941558035af87f029e9debcf017b7015f8d4b
3 14693420369 44868940955 3662ff0e7faa71a1c6830909ef064b141a8d5d4c 127584 909e7979d1550ceab6d6906aa9e7835503db7e5960681ee400574a332bc52cbf
4 14694020311 44869743089 4b1d888921330bbdb06654654787a30c70745bc6 42254 231239ed25488514cb07d8ce8be82466b7449c5c27b43ae59aa39a4cf0698ead
5 14693861446 44870586258 499bf5d343ce1e8af144e0a227e2400f9c2932e3 241312 bab5490af972b4798fcae131257f03c3fb844ed335b9abacb778640f91d84c9b
6 14694177424 44871354817 abd7f41bf763b6d84c567670a8069cbc82bf55c6 145839 7bf0ed634943667fcbf51d32e4fed084b73d1f7079359475390518b00984873b
7 14693803637 44872077125 99e07c4e2c9410125176b4a9f4a31105e0a53ac1 135021 9376f08dbb72128d84d5aebc4b72768a4c9c85af0572e5dc5d0b142bd9a19bbc
8 14694228219 44872383902 9b7f06d17268b208c332b23637988b5455e8b0c4 105989 ea91e9210d7d008fc837082a270595b3f12c37e80762aabe1c742e9fd70b91dc
9 14694422969 44872942169 d25a44e1c2a8fc8759bfb7e820eee97254f6904e 120668 114da5fc2df8f95031554e4ed80bd55a1b1dd43644c7f1aebc3e87753b17aa0a
10 14694678252 44873515775 2e4c7e119ab423ea956b365f4caf4c7e8e8d153c 37544 d6fb17ed77d6cfd0e2814cd92bcd039fdcd31c5f53a7b066e8e9cb4e3390fe41
11 14695505706 44873901796 f51b43b8c55ee99e7cc01da1b65d78c70a7883dd 38605 fac9cac64ed4daf7cb4c3b9cb40be8ef40d05b656d2c59faffaea80481ad9b9e
12 14694904061 44874445276 4ce45a5e652125a28f97016d32f35b7489df9aa8 37878 4ac6273e6729fe7e0bcec1c74aef3f61c061a71d738f963b00a64d1135933eec
13 14695212983 44875261210 d5a87dbcee564406cec432487fc64d958097651b 37714 fed5c0c2c449143779cf1c9ba95e79d8844c475d26ee2ea58d68d6762276247b
14 14695314453 44875415600 22c063ea8de2bbc94f592ad9c36c523251b37840 38278 106d4e31e78fd967c90bc71cbb878e2d9d0b6fb95954dcb4dcb8aaec69a5cd9d
15 14695957387 44875995616 d9c6f01ce19d6b93e698f5563c6ff48c029e9fb0 40401 96554306d2bd7cd99d80d16aa9111b752a3a74bc064c1fb9ff5f9b1ceec4e086
16 14695574332 44876148483 d0dd8b440e91cc2d7015dc8c7a856b6bc4c23e06 37074 1846e82c2281020d59ac0533c2b65f5884dee2a781a814abe01a21800a2a05c7
17 14695998408 44876766844 2f8bf2d715fabbc5c15e664de9c62780b70f71a3 34840 f0a73f9261915967f0ecbd3b633775d6f83580790152b15947de034c8a840e0a
18 14696331391 44877141497 8e595357d081d62c444861550d259996e15105dc 34654 66ef86f6b66e8f24f2c5c2703cdfb9aa9242a905aac5b3a1317505c7e7a4e836
19 14697380630 44878933302 ffae8774686b6a572f2f9eb488078ae6d0675e3d 85872 ec668d32741a66264c98d41ca5b3337259be40787506c50669bb1858488f3b41
20 14697735619 44880073176 5d08c89e98ee3c74ed4931fed8432b6fa44b3a05 119607 d089d5a80fad36ce90639d1f3a02d02312b0b4bac2ff763ab60a2e11e3f84765
21 14698036547 44880567705 22353075b55ebb81b055d35500e5eb281c866024 67812 d9a09a661ef0650d4f151d18b5a6cee70d73da3044b3277d9829fd7af1722dbd
22 14697474199 44881027550 60e083a100cbb3833fa968b4de1db67d0a3b8bc4 59447 9772ef88297c4215eb7e50bbad256ba1918622873e75af82c3c39a3bad37110f
23 14698038621 44881607481 7c62d3f5d80833a48c9459073c039901ab3d02e4 163094 93775bc8dc6360b5cc51c171c68043d6d656ad39ab3e3c6130f9bc42399c2785
24 14698567473 44882312982 cf4ec2258fe91793730cf319a9960e9d90eff8f6 104211 21f41807969e81dbe0cb9571fdee9e416fc9c67538c5a62b369134a2c44696c6
25 14699075841 44882983440 fa8554b539181bdc61b957e36428cc857a7de724 74859 393d0fe698744a2770b695ad6c4179df59025608859d5616fe4b0549834c97b5
26 14698654297 44883634201 95ff2bf5e337e0b240e8c219e07576186186b25b 161929 2c95c4d62a136d51248227767b1a2128cb763ec261a55194cc576df5aa3fd18f
27 14699242271 44884211202 e72a8a3689f7a8be3319c1c5e6d9f26bb968fa95 36261 d45626ec94299e03537ce010517c0a4b63fa0aa3ae2c818183b6ac7ef6f1b493
28 14699391807 44884823500 b92c976ce016b7ac562b22095d3007be1982b445 44423 0ca47981a81b9888e41798a74547e30876bf1979d51bcf019c24184c3b768317
29 14699701755 44885537558 89b87873c5b6f4d0d3f11c41fe66a1a2c7b28bd0 91868 1f8bd3b7bf294cd50ab3f9fdffc8c8ce479ec313ce9552231011c32b9f0ae79f
30 14700083010 44886388443 d0e5c27e9b737dfd12cfa39c3f22a5e8480df9c2 40718 d9ad29bf2c4b703990843946abbdbb5fa86fd889fdd30a644062c1c109011bf9"""
M=re.compile(r'/([a-zA-Z0-9_]+)-(\d+)-(correct-check|correct-checked|correct|canonical-check)-decoded\.json$')
def require(ok,msg):
 if not ok:raise ValueError('A355 original 66 Checks: '+msg)
def digest(b):return hashlib.sha256(b).hexdigest()
def data_json(v):return json.dumps(v,ensure_ascii=False,separators=(',',':'),allow_nan=False).encode('utf-8')
def download(artifact):
 spec=importlib.util.spec_from_file_location('frozen_341_transport',ROOT/'scripts/issue341-prepare-archived-inputs.py')
 module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
 token=os.environ.get('GITHUB_TOKEN','')
 require(bool(token),'GITHUB_TOKEN actions:read needed')
 return module.download_original({'id':artifact['id'],'bytes':artifact['size']},token)
def normalize_hashes(result,preflight):
 arr=result.get('nativeHashes') or []
 if isinstance(arr,dict):arr=list(arr.values())
 if preflight:arr=list(preflight.get('native',[])) or arr
 return arr
def main():
 args=argparse.ArgumentParser(description=__doc__)
 args.add_argument('--archive-dir',type=Path,help='Real original ZIPs already present; no network')
 opts=args.parse_args()
 OUTPUT.mkdir(parents=True,exist_ok=True)
 for f in (FIXTURE,RECEIPT,FIXTURE.with_suffix('.tmp')):f.unlink(missing_ok=True)
 try:
  archive_lines=[x.split() for x in FROZEN.strip().splitlines()]
  require(len(archive_lines)==31 and [int(x[0]) for x in archive_lines]==list(range(31)),
          'frozen source artifact inventory not exactly 31')
  official=json.loads((ROOT/'docs/spatial-learning/evidence-review-manifest.json').read_bytes())
  selected={f"{r['sessionId']}:{r['index']}":r for r in official['tasks']
    if str(r.get('adapter','')).startswith(tuple('issue341-A-P00'+str(x) for x in range(1,6)))}
  require(len(selected)==66,'66 exact P001-P005 candidate sources not formally staged')
  all_entries={};artifact_receipts=[]
  for position,indexline in enumerate(archive_lines):
   number,aid,run,head,size,sha=indexline; require(int(number)==position,'artifact ordering conflict')
   src={'id':int(aid),'size':int(size)}
   raw=(opts.archive_dir/f'a355-dev-{position:02}.zip').read_bytes() if opts.archive_dir else download(src)
   require(len(raw)==src['size'] and digest(raw)==sha,f'artifact {aid} bytes/full SHA mismatch')
   with zipfile.ZipFile(io.BytesIO(raw)) as z:
    names=z.namelist()
    require(len(names)==len(set(names)) and z.testzip() is None,'original ZIP CRC mismatch '+aid)
    require(sum(x.file_size for x in z.infolist())<30*1024*1024 and len(names)<200 and
       all(not n.startswith('/') and '..' not in Path(n).parts and '\\' not in n for n in names),
       'unsafe or oversized original ZIP '+aid)
    res_names=[n for n in names if n.endswith('/results.json')]
    require(len(res_names)==1,'missing real original Chromium results '+aid)
    results=json.loads(z.read(res_names[0]));provenance=results.get('provenance',{})
    require(str(provenance.get('runId'))==run and provenance.get('headSha')==head and
            results.get('errors')==[] and len(results.get('checks',[]))>0,
            'original CI run/head/Chromium result mismatch '+aid)
    preflight_paths=[n for n in names if n.endswith('native-preflight.json')]
    preflight=json.loads(z.read(preflight_paths[0])) if preflight_paths else None
    if preflight:
     require(preflight.get('status')=='PASS' and preflight.get('candidateHead')==head
             and preflight.get('errors')==[],'original preflight failed '+aid)
    hashed=normalize_hashes(results,preflight)
    normalized=[]
    for r in hashed:
     if not isinstance(r,dict):continue
     k=r.get('position') or (str(r.get('sessionId'))+':'+str(r.get('index')))
     normalized.append((k,r.get('actualSha256',r.get('sha256')),
                         r.get('nodeId')))
    direct=results.get('native') or {}
    if isinstance(direct,dict) and direct.get('taskSha256'):
     normalized.append((str(direct.get('id'))+':'+str(direct.get('index')),direct['taskSha256'],None))
    if results.get('position') and results.get('taskHash'):
     normalized.append((results['position'],results['taskHash'],results.get('node')))
    decoded=[]
    for member in names:
     m=M.search(member)
     if not m:continue
     ss,idx,phase=m.groups();key=ss+':'+idx
     require(key not in all_entries,'duplicate original Check '+key)
     source=selected.get(key)
     require(source is not None,'source not registered '+key)
     state_bytes=z.read(member);state=json.loads(state_bytes)
     require(state.get('schema')==2,'original State-v2 missing '+key)
     lesson=state['lessons'][ss];model=lesson['models'][idx];record=lesson['cases'][idx]
     attempts=record.get('attempts') if isinstance(record,dict) else None
     require(isinstance(model,dict) and isinstance(attempts,list) and len(attempts)>=2 and
             attempts[0].get('value')!=model and attempts[-1].get('value')==model,
             'wrong-then-correct original Check missing '+key)
     caps=[cap for cap in results.get('captures',[]) if cap.get('phase')==phase and
        cap.get('attempts',0)>=2 and
        (cap.get('position')==key or
          (cap.get('id')==ss and cap.get('index')==int(idx)) or
          (cap.get('position') is None and cap.get('id') is None and
           len([x for x in names if M.search(x)])==1))]
     require(len(caps)>=1,'original Chromium correct-Check capture missing '+key)
     match=[(h,n) for k,h,n in normalized if k==key]
     if match:
      require(any(h==source['taskHash'] and (n is None or n==source['nodeId'])
                  for h,n in match),'original runtime full-task source SHA conflict '+key)
     all_entries[key]={'packet':source['adapter'].split('-')[2][:4],
       'familyId':source['adapter'],'group':source['adapter'].split('-')[2][:4],
       'source':{'position':key,'sessionId':ss,'index':int(idx),'type':source['type'],
                 'nodeId':source['nodeId'],'taskHash':source['taskHash']},
       'model':model,'record':record,'provenance':{
           'transportOnly':True,'freshMathematicalEvaluation':False,
           'artifactId':int(aid),'run':int(run),'head':head,
           'member':member,'memberSha256':digest(state_bytes),
           'modelRecordSha256':digest(data_json({'model':model,'record':record}))}}
     decoded.append(key)
    require(decoded,'no original correct Check in artifact '+aid)
    require(len(decoded)==len(set(decoded)),'local original Check duplicate '+aid)
    artifact_receipts.append({'id':int(aid),'run':int(run),'head':head,'sha256':sha,
                              'bytes':len(raw),'positions':len(decoded)})
  require(set(all_entries)==set(selected) and len(all_entries)==66,
      'missing/extra P001-P005 original saved Check source')
  ordered=[all_entries[f"{r['sessionId']}:{r['index']}"] for r in official['tasks']
      if f"{r['sessionId']}:{r['index']}" in selected]
  data={'schema':'issue342-A-line-P001-P005-original-Check/1','requiredScope':{'families':31,'positions':66},
    'method':'Original GitHub CI ZIPs / authentic UI Check; no new verification playback',
    'rows':ordered}
  raw=data_json(data)+b'\n'
  temporary=FIXTURE.with_suffix('.tmp');temporary.write_bytes(raw);temporary.replace(FIXTURE)
  receipt={'schema':'issue342-P001-P005-original-preparation/1','status':'PASS_ORIGINAL_31_ZIPS_66_CHECKS',
     'artifacts':artifact_receipts,'originalCheckRecords':66,'families':31,
     'sha256':digest(raw),'rawRecordsPublished':False,'originalTestsRerun':0}
  RECEIPT.write_bytes(data_json(receipt)+b'\n')
  print('A355_P001_P005_ORIGINAL_CHECKS '+json.dumps({k:receipt[k] for k in
       ('status','originalCheckRecords','families','sha256','originalTestsRerun')}))
 except Exception as exc:
  for f in (FIXTURE,FIXTURE.with_suffix('.tmp')):f.unlink(missing_ok=True)
  print('A355_P001_P005_ORIGINAL_CHECKS_FAILED '+str(exc),file=sys.stderr)
  raise SystemExit(1)
if __name__=='__main__':main()
