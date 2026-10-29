from pathlib import Path
p=Path('tests/phase5-b37-capacity-browser.js')
text=p.read_text().replace("?v=42", "?v=43").replace("559 / 559", "579 / 579").replace('===559','===579').replace('===750','===763')
Path('tests/phase5-b38-capacity-browser.js').write_text(text)
