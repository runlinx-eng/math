import json,subprocess
from pathlib import Path
commands=[['python3','scripts/build_content_plan.py','--check'],*[["node",f'scripts/build_phase{n}_coverage.mjs','--check'] for n in [2,3,4,5]]]
results=[]
for cmd in commands:
    p=subprocess.run(cmd,text=True,capture_output=True)
    results.append({'command':' '.join(cmd),'exitCode':p.returncode,'output':p.stdout.strip(),'error':p.stderr.strip()})
Path('verification/phase5/B38/coverage-checks.json').write_text(json.dumps(results,indent=2,ensure_ascii=False)+'\n')
if any(x['exitCode'] for x in results):raise SystemExit(1)
