async original=>{
 const root='/Users/zj1-6/dev/math/',fixture={"link-area-tiling":[{"t":{"type":"x-floor","w":3,"h":2,"prompt":"先逐格铺满这片小板，记录面积。","unit":"cm²"},"m":{"w":3,"h":2,"cols":3,"rows":2,"tiles":[0,1,2,3,4,5],"total":6,"rowsWritten":2,"columnsWritten":3,"unit":"cm²","comparison":"equal"}},{"t":{"type":"x-floor","w":4,"h":3,"prompt":"换成稍大的板，把逐格数改成每排 × 排数。","unit":"cm²","factors":true},"m":{"w":4,"h":3,"cols":4,"rows":3,"tiles":[0,1,2,3,4,5,6,7,8,9,10,11],"total":12,"rowsWritten":3,"columnsWritten":4,"unit":"cm²","comparison":"equal"}}],"link-tiling-rectangle":[{"t":{"type":"x-floor","w":4,"h":3,"prompt":"先铺满，写出这片板的行列乘法。","unit":"cm²","factors":true},"m":{"w":4,"h":3,"cols":4,"rows":3,"tiles":[0,1,2,3,4,5,6,7,8,9,10,11],"total":12,"rowsWritten":3,"columnsWritten":4,"unit":"cm²","comparison":"equal"}},{"t":{"type":"x-rectangle","w":5,"h":4,"prompt":"换一片 5 × 4 的板，用行列结构求面积。","unit":"cm"},"m":{"w":5,"h":4,"total":20,"perimeter":18,"unit":"cm²","borderUnit":"cm"}}],"link-rectangle-boundary":[{"t":{"type":"x-rectangle","w":6,"h":4,"prompt":"先求这片 6 × 4 的铺地面积。","unit":"cm"},"m":{"w":6,"h":4,"total":24,"perimeter":20,"unit":"cm²","borderUnit":"cm"}},{"t":{"type":"x-rectangle","w":8,"h":3,"prompt":"换成 8 × 3，再分别求铺地面积和围边长度。","unit":"cm","perimeter":true},"m":{"w":8,"h":3,"total":24,"perimeter":22,"unit":"cm²","borderUnit":"cm"}}],"link-solids-nets":[{"t":{"type":"x-solid","shape":"cube","prompt":"转动标记盒子的面、接缝和角，再记录数量。"},"m":{"mode":"faces","marks":{"faces":[0,1,2,3,4,5],"edges":[0,1,2,3,4,5,6,7,8,9,10,11],"vertices":[0,1,2,3,4,5,6,7]},"counts":{"faces":6,"edges":12,"vertices":8}}},{"t":{"type":"x-net","draw":true,"prompt":"把六个面安排在纸上，先预测一对相对面，再折回去检查。"},"m":{"cells":[[1,0],[0,1],[1,1],[2,1],[1,2],[1,3]],"guess":true,"pair":[0,4],"fold":100,"runs":[{"cells":[[1,0],[0,1],[1,1],[2,1],[1,2],[1,3]],"guess":true,"pair":[0,4],"why":""}],"counts":{"faces":6,"edges":12,"vertices":8},"why":"","reason":"overlap"}}]};
 const ctx=await original.context().browser().newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),page=await ctx.newPage(),checks=[],errors=[];page.on('pageerror',e=>errors.push(String(e)));page.setDefaultTimeout(8000);
 const base='http://127.0.0.1:43827/',snap=()=>page.evaluate(()=>window.mathLesson.snapshot()),check=(v,l)=>{if(!v)throw Error(l);checks.push(l);};
 const click=async(a,attrs='')=>page.locator(`[data-x="${a}"]${attrs}`).click();
 const field=async(k,v)=>{const e=page.locator(`[data-xfield="${k}"]`);if(await e.count()){if(await e.evaluate(e=>e.tagName)==='SELECT')await e.selectOption(String(v));else if(await e.getAttribute('type')==='range'){const min=+(await e.getAttribute('min')),step=+(await e.getAttribute('step'));await e.focus();await e.press('Home');for(let i=0;i<Math.round((v-min)/step);i++)await e.press('ArrowRight');}else await e.fill(String(v));}};
 try{
 for(const [id,tasks]of Object.entries(fixture)){
  await page.goto(base+'learn.html#'+id);await page.waitForFunction(id=>window.mathLesson?.snapshot().id===id,id);if(await page.locator('[data-do="start"]').count())await page.locator('[data-do="start"]').click();
  for(let i=0;i<tasks.length;i++){
   const{t,m}=tasks[i];check((await snap()).index===i,id+': opens '+i);
   if(i===0){await page.locator('[data-do="check"]').click();check(!(await snap()).summary.cases[i].complete,id+': empty work cannot finish');}
   if(t.type==='x-floor'){if(t.draw){await field('w',m.w);await field('h',m.h);}if(t.partition){await field('cols',m.cols);await field('rows',m.rows);}for(let j=0;j<m.rows;j++)await click('row');}
   if(t.type==='x-rectangle'&&t.draw){if(!t.fixedW)await field('w',m.w);await field('h',m.h);}
   if(t.type==='x-pond')for(const n of m.tiles)await click('tile',`[data-index="${n}"]`);
   if(t.type==='x-solid'){const before=(await snap()).extra;await click('turn-extra');check(JSON.stringify(before)!==JSON.stringify((await snap()).extra),id+': actual camera rotates '+i);for(const k of ['faces','edges','vertices']){await click('solid-mode',`[data-value="${k}"]`);const d=page.locator('.x-access');if(await d.getAttribute('open')===null)await d.locator('summary').click();for(const n of m.marks[k])await click('solid-mark',`[data-index="${n}"]`);await field('counts.'+k,m.counts[k]);}}
   if(t.type==='x-net'){if(t.draw)for(const[x,y]of m.cells)await click('net-cell',`[data-col="${x}"][data-row="${y}"]`);await click('guess',`[data-value="${m.guess}"]`);await field('pair.0',m.pair[0]);await field('pair.1',m.pair[1]);await click('fold');for(const k of ['faces','edges','vertices'])await field('counts.'+k,m.counts[k]);await field('reason',m.reason);}
   if(t.type==='x-attributes')for(const k of m.measured){await click('measure-mode',`[data-value="${k}"]`);await click('measure-both');await click('compare-choice',`[data-index="${m.choices[k]}"]`);}
   if(t.type==='x-measure'){await click('tool',`[data-value="${t.attribute}"]`);if(t.attribute==='length')await field('zero',m.zero);if(t.attribute==='mass'){for(let j=0;j<Math.floor(t.value/100);j++)await click('weight','[data-delta="100"]');if(t.value%100)await click('weight','[data-delta="50"]');}if(t.attribute==='capacity')await click('pour-measure');}
   if(t.type==='x-capacity'){await field('guess',m.guess);await click('estimate');for(let j=0;j<m.poured/t.step;j++)await click('pour','[data-delta="1"]');}
   for(const k of ['total','rowsWritten','columnsWritten','unit','comparison','perimeter','borderUnit','reading','contents'])if(m[k]!=null&&m[k]!=='')await field(k,m[k]);
   await page.locator('[data-do="check"]').click();check((await snap()).summary.cases[i].complete,id+': constructed result '+i);
   if(i===0)await page.screenshot({path:root+'verification/phase4/B02/'+id+'.png'});
   if(id==='nets'&&i===0){await page.reload();await page.waitForFunction(()=>window.mathLesson);check((await snap()).summary.cases[0].complete,'folded net and record survive reload');}
   await page.locator('[data-do="next"]').click();
  }
  check((await snap()).summary.completed,id+': all tasks finish');
 }
 check(errors.length===0,'no page errors');
 }catch(e){return{checks,errors,failed:String(e),url:page.url(),body:(await page.locator('body').innerText()).slice(-500)}}finally{await ctx.close();}
 return{checks,errors};
}
