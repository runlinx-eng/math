async original=>{
 const fixture=FIXTURE;
 const root='/Users/zj1-6/dev/math/verification/phase4/BATCH/',base='http://127.0.0.1:43827/';
 const ctx=await original.context().browser().newContext({viewport:{width:1440,height:1050},reducedMotion:'reduce'}),page=await ctx.newPage(),checks=[],errors=[];page.setDefaultTimeout(8000);page.on('pageerror',e=>errors.push(String(e)));
 const snap=()=>page.evaluate(()=>window.mathLesson.snapshot()),state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2'))),check=(v,l)=>{if(!v)throw Error(l);checks.push(l);};
 const click=async(a,attrs='')=>page.locator(`[data-x="${a}"]${attrs}`).click();
 const field=async(k,v)=>{const e=page.locator(`[data-xfield="${k}"]`);if(!await e.count()||!await e.isEnabled())return;if(String(await e.inputValue())===String(v??''))return;if(await e.evaluate(e=>e.tagName)==='SELECT')await e.selectOption(String(v));else if(await e.getAttribute('type')==='range'){await e.scrollIntoViewIfNeeded();const r=await e.boundingBox(),min=+(await e.getAttribute('min')),max=+(await e.getAttribute('max')),step=+(await e.getAttribute('step'));await e.click({position:{x:8+(r.width-16)*(v-min)/(max-min),y:r.height/2}});let diff=Math.round((v- +(await e.inputValue()))/step);for(let i=0;i<Math.abs(diff);i++)await e.press(diff>0?'ArrowRight':'ArrowLeft');}else await e.fill(v===null?'':String(v));};
 try{for(const[id,tasks]of Object.entries(fixture)){
  await page.goto(base+'learn.html#'+id);await page.waitForFunction(id=>window.mathLesson?.snapshot().id===id,id);check(!(await snap()).summary.completed,id+' begins incomplete');await page.locator('[data-do="start"]').click();
  for(let i=0;i<tasks.length;i++){
   const{t,m}=tasks[i];check((await snap()).index===i,id+' task '+i+' opens');if(i===0){await page.locator('[data-do="check"]').click();check(!(await snap()).summary.cases[i].complete,id+' cannot finish empty');}
   if(t.type==='x-mosaic'){for(let c=0;c<4;c++){await click('paint-color',`[data-index="${c}"]`);for(let j=0;j<16;j++)if(m.saved[0][j]===c)await click('paint',`[data-index="${j}"]`);}await click('save-mosaic');for(let c=0;c<4;c++){await click('paint-color',`[data-index="${c}"]`);for(let j=0;j<16;j++)if(m.cells[j]===c)await click('paint',`[data-index="${j}"]`);}}
   if(t.type==='x-fraction'){await field('den',m.den);for(const j of m.selected)await click('fraction-cell',`[data-index="${j}"]`);if(t.classify)for(const c of m.classes)await click('fraction-class',`[data-value="${c}"]`);}
   if(t.type==='x-foldpaper')for(let j=0;j<3;j++)await click('fold-paper');
   if(t.type==='x-fgroups'){for(let g=0;g<t.groups;g++){await click('group-select',`[data-index="${g}"]`);for(let j=0;j<t.count;j++)if(m.groups[j]===g)await click('group-token',`[data-index="${j}"]`);}await click('take-group','[data-index="0"]');}
   if(t.type==='x-fline'&&!t.read){await field('parts',m.parts);for(let j=0;j<m.mark;j++)await click('jump');}
   if(t.type==='x-fwall')for(let j=0;j<m.counts.length;j++)await click('wall-cell',`[data-row="${j}"][data-index="${m.counts[j]-1}"]`);
   if(t.type==='x-hundredsplit')for(let j=0;j<9;j++)await click('count-hundred');
   if(t.type==='x-decvalue'){await field('ones',m.ones);for(let j=0;j<Math.floor(m.selected.length/10);j++)await click('dec-row');for(let j=Math.floor(m.selected.length/10)*10;j<m.selected.length;j++)await click('dec-cell',`[data-index="${j}"]`);}
   if(t.type==='x-scale'){await field('n',m.n);await field('d',m.d);await field('prediction',m.prediction);await click('scale-try');}
   if(t.type==='x-ratio'){for(const row of ['a','b'])for(let j=0;j<m[row];j++)await click('ratio-block',`[data-row="${row}"][data-delta="1"]`);if(t.compare)for(const v of ['table','line','bar'])await click('ratio-view',`[data-value="${v}"]`);}
   if(t.type==='x-sort'){for(let g=0;g<t.labels.length;g++){await click('sort-bin',`[data-index="${g}"]`);for(let j=0;j<m.dest.length;j++)if(m.dest[j]===g)await click('sort-item',`[data-index="${j}"]`);}if(t.ordered)for(const j of m.order)await click('sort-order',`[data-index="${j}"]`);}
   if(t.type==='x-chartlab'&&(t.vocab||t.compare))for(const v of(t.vocab?['bar','table','picture','tally']:['bar','table']))await click('chart-view',`[data-value="${v}"]`);
   if(t.type==='x-likelihood'){for(let j=0;j<5;j++){await click('likely-event',`[data-index="${j}"]`);await click('likely-place',`[data-index="${j}"]`);}await click('counterexample');}
   if(t.type==='x-experiment'){await field('guess',m.guess);for(let j=0;j<t.count;j++){await click('experiment-draw');const actual=(await state()).lessons[id].models[i].draws.at(-1);await click('experiment-tally',`[data-index="${actual}"][data-delta="1"]`);}const actual=(await state()).lessons[id].models[i];m.comparison=actual.counts[0]===actual.prediction?'same':actual.counts[0]>actual.prediction?'higher':'lower';}
   if(t.type==='x-spinner'){for(let c=0;c<t.colors;c++){await click('spinner-color',`[data-index="${c}"]`);for(let j=0;j<t.sectors;j++)if(m.sectors[j]===c)await click('spinner-sector',`[data-index="${j}"]`);}await field('prediction',m.prediction);await click('spinner-run');}
   if(t.type==='x-simulation')for(const s of ['10','100','1000']){await field('sample',s);for(let j=0;j<5;j++)await click('simulate');}
   if(t.type==='x-repeat'){await field('length',m.length);for(const v of m.unit)await click('unit-token',`[data-value="${v}"]`);for(let j=0;j<3;j++)await click('repeat-unit');}
   if(t.type==='x-commute')await click('swap-piles');
   if(t.type==='x-placevalue')await click('add-ten','[data-delta="1"]');
   if(t.type==='x-shapefacts')for(let s=0;s<2;s++){await click('shape-select',`[data-index="${s}"]`);for(const k of ['sides','corners']){await click('shape-kind',`[data-value="${k}"]`);for(let j=0;j<4;j++)await click('shape-mark',`[data-index="${j}"]`);}}
   if(t.type==='x-grow'&&t.towers)await field('prediction',m.prediction);
   if(t.type==='x-balance'){for(const side of ['left','right'])for(let j=0;j<m[side];j++)await click('balance-add',`[data-side="${side}"][data-delta="1"]`);await field('guess',m.guess);await click('balance-release');}
   if(t.type==='x-unknown'){await field('box',m.box);await click('unknown-check');}
   if(t.type==='x-reason'&&t.mode==='line')for(let j=0;j<5;j++)await click('reason-jump');
   if(t.type==='x-regroup'){await click('join-units');await click('exchange');}
   if(t.type==='x-proof'){await click('join-pairs');await field('a',3);await field('b',4);await click('join-pairs');for(const v of m.chain)await click('proof-step',`[data-value="${v}"]`);await field('counterA',m.counterA);await field('counterB',m.counterB);await click('counter-build');}
   const fields=await page.locator('[data-xfield]').evaluateAll(es=>es.map(e=>e.dataset.xfield));for(const k of fields){const value=k.split('.').reduce((a,p)=>a?.[p],m);if(value!==undefined&&value!==null&&typeof value!=='object')await field(k,value);}
   await page.locator('[data-do="check"]').click();check((await snap()).summary.cases[i].complete,id+' task '+i+' accepts actual construction');
   if(i===0){check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),id+' fits desktop width');await page.screenshot({path:root+id+'.png'});}
   if(i===tasks.length-1){await page.reload();await page.waitForFunction(()=>window.mathLesson);check((await snap()).summary.cases[i].complete,id+' restores saved work');}
   await page.locator('[data-do="next"]').click();
  }
  check((await snap()).view==='summary'&&(await snap()).summary.completed,id+' completes only with all tasks');
 }
 check(!errors.length,'no page errors');return{checks,errors};
 }catch(e){return{checks,errors,failed:String(e),url:page.url(),body:(await page.locator('body').innerText()).slice(0,400)+' … '+(await page.locator('body').innerText()).slice(-400),model:await state()}}finally{await ctx.close();}
}
