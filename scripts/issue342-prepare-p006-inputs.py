#!/usr/bin/env python3
"""Read P006 #342 original 19 successful GitHub CI ZIPs. Never mint/replay Checks.

Every frozen ZIP is verified byte-for-byte against its SHA256, then each actual
native preflight/full SHA, wrong->correct Check record and real Chromium result
is matched to the formal manifest. Original records stay in ignored local
verification/issue341-inputs and are never published by this script.
"""
import argparse
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import sys
import zipfile

ROOT=Path(__file__).resolve().parent.parent
OUTPUT=ROOT/'verification/issue341-inputs'
FIXTURE=OUTPUT/'archived-checks-p006.json'
RECEIPT=OUTPUT/'preparation-receipt-p006.json'
FROZEN="""a 14700247843 44886629564 dd4459d4daaa394674ee8a8e7d9b24614f77cef7 34634 f26115062243789aa8f905f73de2971bbb6f657d4e3eeb6c04f35b361bfbd5ec
b 14699404670 44887007021 232a4da940d97bda0bc6320229e111ed33dd95ce 69541 2c399cfc21088865d0110116192a1537b4e57d7c3f624d334613b3f60284492a
c 14700990783 44887736294 21ac6f9ef4f089a2847c295eaa5e03cac67f1158 114025 33df23413aa92bc28503f07930f155c8f35b85595ce5d12be406693302674fd2
d 14701555094 44888265350 8acf9eddee78e610ec971e8b0212eda5f1adfd86 81738 e88c8e4bdcca1baaf97d4cb894bddea382622e6d2c06f30437a6f754bc475833
e 14701576369 44888953363 906fe4cb54c3029b387811453d3557e63d83054a 58558 f80c784f7c0a352ba278d5f6fce695e2f5924cac0f56086212c2ea9aa8d5a522
f 14701386922 44889511308 69795ef4ebce224a8affcde9c7e493c0afea9fce 58246 9e8fc5ea19c77bbd14d5e94cc7c03dfaed9c931a4f76a4a5c9029b19cb34dbfb
g 14700549529 44890178710 ed56d6f5577e6518d416dbe825ac085753fca520 60677 2656197f025ddd646230b2b71c55c84692ffb37ef6cdc110e4a04f5193a8383d
h 14701573135 44890804365 39bc0c1e0eaacd37ad47d8830323970371bf092d 33842 d8db922ca28763a4ef3023ad56446a320410aa9b2ec88294225e0c512a3ba57e
i 14702586414 44891830214 d96595613af91d749d6f8b726286433a057466db 99187 9f99246542e885bed62d23662601f948f003b7dcd3aa4eb9cfdc933981f2fbfc
j 14702173929 44892443032 71b46ed648896ced73d63d8682e1c2d4f07af70b 43856 c47127d4bf3d5e0ff91ee7eeced986c7cc6c672d35a2e785b9f7fad2478cf8f3
k 14703255511 44893139872 4b4e9f3ce653de51f5e5d9851fadf5e1446a73a6 96337 fee68527a03d30fb7157e16335c3b3f91e7bf9e88603c7998cda0e5fac323725
l 14703540745 44893982138 6f25ed7bb4902fec9e15f3eb8b10aaf034698728 87428 7b5cab1342f3fc214c63f9f383b0eee098a556db80ae83a3a29285c7b48b55ac
m 14703432852 44894696675 bc2c99deec41bcc32adbca98648e27ee057a05be 52197 9e46dcacd66a1d2f4c64991ca57f10a4c1feb1eab5e5c36370f6d5f0ac410556
n 14703741077 44895300031 52508d2d32a4d338e59641643a653c2aecf01e3c 67232 9f45522036e323a7540d985638366794398aa1e27f285561de98ef1884a733e4
o 14704076941 44896068925 cf67a5b63c606cf0166f58da1ba7e80fdc4912a0 79383 711cedcf48e4462449b1dccfab057db6cc46795025136ed086e7d9299b2e6ca4
p 14703909293 44896586607 fc260379a78d188662f95d05e2e08a77c25bfb82 118237 06984cd4a64a7c4d8aaec74d89d3629e674f37afabb9bad4850ac3c7ab332bd2
q 14704117648 44897322461 408437d602bcdebc24e9f642d5f584209f67cf24 72733 9c6b1bce1c229ef596d28cc5e925f8f0572235715aa3643b053acf21079bf973
r 14705045299 44897922352 6738eb3bdcde508a43a042ead5218e42742f9994 55006 5f8e301c3b5a49b109df618d5aa71726ae00e155f26bcad3bf7f5662aaa044f6
s 14705200501 44898720834 90f899455006eff1e99761b91b3586eefb017834 63822 750be63fa9479210cc4c72d2d5fe88fb63d2910a0231a5ee83c1265234835264"""
def require(ok,reason):
    if not ok: raise ValueError('P006 original Check: '+reason)
def digest(data): return hashlib.sha256(data).hexdigest()
def json_bytes(value): return json.dumps(value,ensure_ascii=False,separators=(',',':'),allow_nan=False).encode('utf-8')
def fetch_from_github(artifact):
    spec=importlib.util.spec_from_file_location('issue341_original_transport',ROOT/'scripts/issue341-prepare-archived-inputs.py')
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    token=os.environ.get('GITHUB_TOKEN','')
    require(bool(token),'GITHUB_TOKEN actions:read missing; no fabricated substitute')
    return module.download_original({'id':artifact['id'],'bytes':artifact['bytes']},token)
def source_key(row): return row['sessionId']+':'+str(row['index'])
def prepare(folder=None):
    metadata=[line.split() for line in FROZEN.strip().splitlines()]
    require(len(metadata)==19 and ''.join(x[0] for x in metadata)=='abcdefghijklmnopqrs','frozen 19-original-ZIP inventory altered')
    official=json.loads((ROOT/'docs/spatial-learning/evidence-review-manifest.json').read_bytes())
    selected={source_key(r):r for r in official['tasks'] if str(r.get('adapter','')).startswith('issue341-A-P006')}
    require(len(selected)==31,'official exact P006 sources not 31')
    all_records={};zip_receipts=[]
    for letter,aid,run,head,size,sha in metadata:
        artifact={'id':int(aid),'bytes':int(size)}
        data=(folder/('p006'+letter+'-original-check.zip')).read_bytes() if folder else fetch_from_github(artifact)
        require(len(data)==artifact['bytes'] and digest(data)==sha,'artifact '+aid+' size/SHA mismatch')
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            names=archive.namelist()
            require(len(names)==len(set(names)) and archive.testzip() is None,'artifact '+aid+' damaged ZIP')
            require(len(names)<=120 and all(not n.startswith('/') and '..' not in Path(n).parts and '\\' not in n for n in names),'artifact '+aid+' unsafe names')
            require(sum(item.file_size for item in archive.infolist())<10*1024*1024,'artifact '+aid+' expanded too large')
            development=json.loads(archive.read('dev-results/development-receipt.json'))
            preflight=json.loads(archive.read('dev-results/native-preflight.json'))
            require(str(development.get('runId'))==run and development.get('candidateHead')==head and
                    development.get('state')=='DEVELOPMENT_TEST_STEPS_PASS' and
                    all(development.get('stages',{}).get(k)=='PASS' for k in ('identity','preflight','node','chromium')),
                    'artifact '+aid+' original tested HEAD/stages disagree')
            require(preflight.get('status')=='PASS' and preflight.get('candidateHead')==head and
                    not preflight.get('errors') and len(preflight.get('native',[]))>=1,
                    'artifact '+aid+' original native preflight mismatch')
            results_paths=[n for n in names if n.endswith('/results.json')]
            require(len(results_paths)==1,'artifact '+aid+' original Chromium result missing')
            results=json.loads(archive.read(results_paths[0]))
            provenance=results.get('provenance',{})
            require(str(provenance.get('runId'))==run and provenance.get('headSha')==head and
                    results.get('errors')==[] and isinstance(results.get('checks'),list) and
                    results.get('checks'),'artifact '+aid+' original browser result failed')
            sources=preflight['native']
            captures=results.get('captures',[])
            require(len([n for n in names if n.endswith('-correct-check-decoded.json')])==len(sources),
                    'artifact '+aid+' original Check snapshot count mismatch')
            for native in sources:
                position=native['position']
                row=selected.get(position)
                require(row is not None and position not in all_records,
                        position+' unlisted/duplicate original source')
                require(row['adapter']=='issue341-A-P006'+letter.upper() and
                        native.get('hashMatched') is True and
                        native.get('actualSha256')==native.get('expectedSha256')==row['taskHash'] and
                        native.get('type')==row['type'] and native.get('nodeId')==row['nodeId'],
                        position+' original full SHA, type, node, family mismatch')
                session_id,index_text=position.rsplit(':',1)
                index=int(index_text)
                require(row['sessionId']==session_id and row['index']==index and
                        isinstance(native.get('uiActionsChecked'),list),
                        position+' original native source UI-action inventory missing')
                member=[name for name in names if name.endswith('/'+session_id+'-'+str(index)+'-correct-check-decoded.json')]
                require(len(member)==1,position+' original Check snapshot not unique')
                member_bytes=archive.read(member[0])
                state=json.loads(member_bytes)
                require(state.get('schema')==2,position+' original State-v2 missing')
                lesson=state['lessons'][session_id]
                model=lesson['models'][str(index)];record=lesson['cases'][str(index)]
                attempts=record.get('attempts') if isinstance(record,dict) else None
                require(isinstance(model,dict) and isinstance(attempts,list) and len(attempts)>=2 and
                        attempts[0].get('value')!=model and attempts[-1].get('value')==model,
                        position+' actual wrong->correct original Check absent')
                matches=[cap for cap in captures if cap.get('phase')=='correct-check' and
                         (cap.get('position',position)==position) and cap.get('attempts',0)>=2]
                require(matches,position+' original Chromium correct Check not witnessed')
                model_record_hash=digest(json_bytes({'model':model,'record':record}))
                all_records[position]={'packet':'P006','familyId':row['adapter'],'group':'P006',
                    'source':{'position':position,'sessionId':session_id,'index':index,
                              'nodeId':row['nodeId'],'type':row['type'],'taskHash':row['taskHash']},
                    'model':model,'record':record,
                    'provenance':{'run':int(run),'head':head,'artifactId':int(aid),
                        'member':member[0],'memberSha256':digest(member_bytes),
                        'modelRecordSha256':model_record_hash,'originalChromiumResult':results_paths[0],
                        'transportOnly':True,'freshMathematicalEvaluation':False}}
            zip_receipts.append({'id':int(aid),'run':int(run),'head':head,'bytes':len(data),'sha256':digest(data),
                                 'rows':len(sources),'zipCrc':'PASS'})
    require(set(all_records)==set(selected) and len(all_records)==31,'original P006 artifact inventory incomplete')
    ordered=[all_records[source_key(row)] for row in official['tasks'] if source_key(row) in selected]
    fixture={'schema':'issue-342-a-line-original-check-fixtures/1','method':'Read-only frozen original CI artifacts, no new mathematical or Chromium replay',
        'requiredScope':{'families':19,'positions':31},'rows':ordered}
    OUTPUT.mkdir(parents=True,exist_ok=True)
    raw=json_bytes(fixture)+b'\n'
    temporary=FIXTURE.with_suffix('.json.tmp')
    temporary.write_bytes(raw);temporary.replace(FIXTURE)
    receipt={'schema':'issue-342-original-check-preparation/1','status':'PASS_ORIGINAL_19_ZIPS_31_CHECKS',
        'families':19,'positions':31,'originalZipCount':len(zip_receipts),'artifacts':zip_receipts,
        'fixtureSha256':digest(raw),'rawRecordsPublished':False,'originalTestsRerun':0}
    RECEIPT.write_bytes(json_bytes(receipt)+b'\n')
    return receipt
def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive-dir',type=Path,help='Existing original ZIPs, no network or rerun')
    args=parser.parse_args()
    OUTPUT.mkdir(parents=True,exist_ok=True)
    for f in (FIXTURE,FIXTURE.with_suffix('.json.tmp'),RECEIPT):f.unlink(missing_ok=True)
    try: receipt=prepare(args.archive_dir)
    except Exception as exc:
        for f in (FIXTURE,FIXTURE.with_suffix('.json.tmp')):f.unlink(missing_ok=True)
        print('ISSUE342_P006_ORIGINAL_CHECKS_FAILED '+str(exc),file=sys.stderr)
        return 1
    print('ISSUE342_P006_ORIGINAL_CHECKS '+json.dumps({k:receipt[k] for k in ('status','positions','families','originalZipCount','fixtureSha256','originalTestsRerun')}))
    return 0
if __name__=='__main__':raise SystemExit(main())
