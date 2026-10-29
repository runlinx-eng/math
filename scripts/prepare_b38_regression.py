from pathlib import Path
out=Path('tests/phase5-b38-regression');out.mkdir(exist_ok=True)
Path('verification/phase5/B38/regression/spatial').mkdir(parents=True,exist_ok=True)
for name in ['spatial','daily','readiness']:
    source=Path(f'tests/phase5-b37-regression/{name}.js').read_text()
    source=source.replace('verification/phase5/B37/', 'verification/phase5/B38/').replace('?v=42','?v=43')
    (out/(name+'.js')).write_text(source)
source=Path('tests/phase5-b37-visual-browser.js').read_text().replace('verification/phase5/B37/', 'verification/phase5/B38/regression/')
(out/'b37-visual.js').write_text(source)
