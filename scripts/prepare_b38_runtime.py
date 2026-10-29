from pathlib import Path
s=Path('tests/phase5-b37-runtime-browser.js').read_text().replace('?v=42#space/pack/unknowns','?v=43#space/pack/reasoning').replace('learning-v42','learning-v43')
s=s.replace("'learning/phase5/b37.js'", "'learning/phase5/b38.js','learning/phase5/b38-more.js','learning/phase5/b38-model.js','learning/phase5/b38-view.js','learning/phase5/b38.css','learning/phase5/b37.js'")
Path('tests/phase5-b38-runtime-browser.js').write_text(s)
