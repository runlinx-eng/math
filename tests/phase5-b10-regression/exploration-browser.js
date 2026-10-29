async (originalPage) => {
 const browser=originalPage.context().browser(),context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
 const page=await context.newPage(),checks=[],errors=[],remote=[];
 const base='http://127.0.0.1:43827/',root='/Users/zj1-6/dev/math/verification/phase5/B10/regression/exploration-browser/';
 context.on('page',p=>p.on('pageerror',e=>errors.push(String(e))));page.on('pageerror',e=>errors.push(String(e)));
 context.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))remote.push(r.url());});
 page.setDefaultTimeout(8000);
 const check=(ok,label)=>{if(!ok)throw new Error(label);checks.push(label);};
 let atlas;
 const navigate=async(p,hash)=>{await p.goto(base+'v2.html#'+hash);const [view,id]=hash.split('/');if(view==='map')await p.locator('.theme-card').first().waitFor();else if(view==='pack')await p.getByRole('heading',{name:atlas.packs.find(x=>x.id===id).title,exact:true}).waitFor();else if(view==='activity')await p.getByRole('heading',{name:({fair:'怎样才算一份？',rename:'分法变了，量变了吗？',decimal:'同一个数，两个名字'})[id],exact:true}).waitFor();else if(view==='atlas'){await p.locator('.pack-node').first().waitFor();if(id)await p.locator(`.pack-node[data-id="${id}"][aria-pressed="true"]`).waitFor();}else await p.locator('[data-do="export"]').waitFor();};
 const go=hash=>navigate(page,hash);
 const action=(name,value)=>page.locator(`[data-do="${name}"]${value===undefined?'':`[data-value="${value}"]`}`);
 const stage=async key=>{await page.locator(`.activity-tabs [data-stage="${key}"]`).click();};
 const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')));
 const summary=id=>page.evaluate(async id=>{const m=await import('./exploration-core.js');return m.evidenceSummary(JSON.parse(localStorage.getItem(m.KEY)).activities[id]);},id);
 const range=async(selector,target)=>{const input=page.locator(selector);await input.focus();let value=Number(await input.inputValue());for(let i=0;i<Math.abs(target-value);i++)await input.press(target>value?'ArrowRight':'ArrowLeft');check(Number(await input.inputValue())===target,`keyboard control ${selector} = ${target}`);};
 const submit=async()=>{await action('submit').click();await page.locator('#scene-result .feedback').waitFor();};
 const importFile=async(p,text,name='backup.json')=>{await p.locator('#import-file').setInputFiles({name,mimeType:'application/json',buffer:Buffer.from(text)});};
 let second;
 try {
  await go('map');atlas=await (await page.request.get(base+'data/atlas.json')).json();
  check(await page.locator('.theme-card').count()===5,'home shows five understandable themes, no giant node list');
  check(await page.locator('.leaf').count()===0,'home does not require browsing 587 leaves');
  check(!/五年级|家长入口/.test(await page.locator('main').innerText()),'grade and parent portals do not control navigation');
  await page.screenshot({path:root+'v2-home.png',fullPage:true});
  await page.locator('.theme-card').first().click();await page.locator('.pack-card').first().waitFor();check(await page.locator('.pack-card').count()===6,'theme opens a small group of six exploration packs');
  await go('atlas');check(await page.locator('.pack-node').count()===23,'panorama retains all 23 packs');
  await page.screenshot({path:root+'v2-atlas.png',fullPage:true});
  await page.locator('.pack-node[data-id="area"]').focus();await page.locator('.pack-node[data-id="area"]').press('Enter');
  check((await page.locator('.atlas-selection h2').innerText())==='边界与铺满','map packs can be selected using the keyboard');
  check(await page.locator('.atlas-svg path[marker-end]').count()===atlas.packLinks.filter(l=>l.fromPack==='area'||l.toPack==='area').length,'selected connections exactly match source-derived pack links');
  await page.locator('#atlas-search').fill('分数');check(await page.locator('#search-results .leaf').count()===8,'search progressively reveals eight nodes');
  await page.locator('#pack-nodes>summary').click();await page.locator('#leaf-results [data-do="more"]').click();check(await page.locator('#leaf-results .leaf').count()===16,'expanding selected pack is independent from active search');
  await page.locator('#search-results [data-do="more"]').click();check(await page.locator('#search-results .leaf').count()>=16,'search expansion remains available');
  await page.locator('#search-results .leaf').first().click();await page.locator('dialog[open]').waitFor();
  const bookmarked=await page.locator('dialog [data-do="bookmark"]').getAttribute('data-id');await page.locator('dialog [data-do="bookmark"]').click();
  check((await state()).bookmarks.includes(bookmarked),'node bookmarking persists');
  check(await page.locator('dialog .relation').count()>0,'node details preserve individual prerequisite and onward links');
  await page.getByRole('button',{name:'关闭知识点',exact:true}).click();
  const all=[];
  for(const p of atlas.packs){
   await go('pack/'+p.id);await page.locator('#pack-nodes>summary').click();
   while(await page.locator('#leaf-results [data-do="more"]').count())await page.locator('#leaf-results [data-do="more"]').click();
   const actual=await page.locator('#leaf-results .leaf').evaluateAll(els=>els.map(e=>e.dataset.id));
   if(actual.length!==p.nodeIds.length||actual.some((id,i)=>id!==p.nodeIds[i]))throw new Error('Unreachable pack nodes: '+p.id);all.push(...actual);
  }
  check(all.length===587&&new Set(all).size===587,'all 587 nodes are reachable in their exact pack without duplication');
  await go('pack/same-amount');await page.locator('#pack-nodes>summary').click();await page.locator('#leaf-results .leaf').first().click();
  await page.locator('dialog a[href="#pack/same-amount"]').click();check(!await page.locator('dialog[open]').count(),'same-route pack link also closes its node dialog');
  await go('activity/fair');
  await action('equalize').click();await action('paper',0).click();await action('observe').click();
  check((await state()).activities.fair.observations.length===1&&!(await summary('fair')).completed,'free exploration saves a snapshot without granting completion');
  await stage('construct');for(let i=0;i<3;i++)await action('paper',i).click();await submit();
  check((await page.locator('#scene-result').innerText()).includes('只数块数还不够'),'unequal partition gets a mathematical diagnosis');
  await action('hint').click();await range('[data-model="cut"][data-cut="0"]',25);await range('[data-model="cut"][data-cut="1"]',50);await range('[data-model="cut"][data-cut="2"]',75);
  check((await page.locator('#scene-controls').innerText()).includes('位置 25/100'),'precise cut positions are visible');await submit();
  check((await page.locator('#scene-result').innerText()).includes('这个作品成立'),'corrected fair partition is accepted');
  const paperGeometry=await page.locator('.paper-part').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().width));check(Math.max(...paperGeometry)-Math.min(...paperGeometry)<1,'equal shares occupy equal visual widths');
  await stage('transfer');for(let i=0;i<9;i++)await action('chip',i).click();await submit();
  check((await summary('fair')).completed&&!(await summary('fair')).demonstrated,'completion and supported understanding remain distinct');
  await action('variant').click();await action('variant').click();await page.reload();await page.locator('#scene-result').waitFor();
  check((await state()).activities.fair.evidence['construct:0'].support,'switching cases and reloading cannot erase hint history');
  await stage('explain');await page.locator('#explanation').fill('每一份一样大，才可以用份数比较。草稿先保存。');await page.reload();await page.locator('#explanation').waitFor();
  check((await page.locator('#explanation').inputValue()).includes('草稿先保存'),'unsubmitted explanation draft survives reload');await action('save-note').click();
  check((await summary('fair')).explanation==='pending','written explanation remains unassessed');
  await go('activity/rename');await action('repartition').click();check((await page.locator('#scene-visual').innerText()).includes('两个终点重合'),'repartitioning preserves the same point');
  await action('add-one').click();check((await page.locator('#scene-visual').innerText()).includes('两个终点不同'),'adding one gives an observable counterexample');
  await stage('construct');for(const[i,n]of [[0,'2'],[1,'3'],[2,'4']]){const input=page.locator(`[data-model="n"][data-row="${i}"]`);await input.focus();await input.selectOption(n);}
  const sameWhole=await page.locator('#scene-visual .paper').evaluateAll(els=>els.map(e=>e.getBoundingClientRect().width));check(new Set(sameWhole).size===1,'equivalent fractions use identical whole lengths');
  check(await page.evaluate(()=>document.activeElement.dataset.model==='n'&&document.activeElement.dataset.row==='2'),'changing fraction controls retains keyboard focus');
  await submit();await page.locator('#toast').waitFor({state:'hidden'});await page.screenshot({path:root+'v2-rename.png',fullPage:true});
  await stage('transfer');await action('tick',6).focus();await action('tick',6).press('Enter');
  check(await page.evaluate(()=>document.activeElement.dataset.value==='6'),'number-line keyboard selection retains focus');await submit();
  check((await summary('rename')).demonstrated,'independent equivalent constructions and number-line transfer retain their own evidence');
  await go('activity/decimal');await action('cell',5).click();check((await page.locator('.equation').innerText()).includes('0.01'),'free decimal grid changes both numerical representations');
  await stage('construct');for(let row=0;row<3;row++)await action('row',row).click();for(let i=30;i<35;i++)await action('cell',i).click();
  check(await page.evaluate(()=>document.activeElement.dataset.do==='cell'&&document.activeElement.dataset.value==='34'),'grid interaction retains focus');await submit();
  await stage('transfer');await range('[data-model="hundredths"]',6);await range('[data-model="tenths"]',60);await submit();
  check((await summary('decimal')).demonstrated,'hundred-grid construction transfers to two different number-line positions');
  await page.screenshot({path:root+'v2-decimal-transfer.png',fullPage:true});
  await go('atlas/same-amount');check((await page.locator('.pack-node[data-id="same-amount"]').textContent()).includes('完成 3 / 11'),'panorama aggregates completion across the eleven available nodes in this pack');
  await page.locator('#pack-nodes>summary').click();while(await page.locator('#leaf-results [data-do="more"]').count())await page.locator('#leaf-results [data-do="more"]').click();
  check(await page.locator('#leaf-results .state-dot.completed').count()===3,'completing three activities does not complete all 55 knowledge nodes');
  await page.locator('[data-filter="completed"]').click();check(await page.locator('.pack-node:not(.dim)').count()===0&&await page.locator('.pack-node').count()===23,'completion filter keeps unexplored parts visible in context');
  await go('trail');const downloadEvent=page.waitForEvent('download');await action('export').click();const download=await downloadEvent;
  const stream=await download.createReadStream();let exported='';for await(const chunk of stream)exported+=chunk.toString();
  check(Object.keys(JSON.parse(exported).state.activities).length===3,'export downloads a complete v2 learning record');
  const before=JSON.stringify(await state());await importFile(page,'{broken');await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('不是有效'));
  check(JSON.stringify(await state())===before,'invalid import is atomic');
  await importFile(page,exported);await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('已合并'));
  check(JSON.stringify(await state())===before,'repeat import does not duplicate attempts, explanations or snapshots');
  check(await page.evaluate(()=>!!localStorage.getItem('math-explorer-v2-before-import')),'pre-import backup is retained');
  second=await browser.newContext({viewport:{width:1366,height:900},acceptDownloads:true});const restored=await second.newPage();restored.on('pageerror',e=>errors.push(String(e)));
  await restored.goto(base+'v2.html#trail');await restored.locator('[data-do="export"]').waitFor();await importFile(restored,exported);await restored.waitForFunction(()=>document.querySelector('#toast').textContent.includes('已合并'));
  check(await restored.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('math-explorer-v2')).activities).length)===3,'backup restores legacy exploration in an independent desktop browser');
  await second.close();second=null;
  const legacyContext=await browser.newContext();
  try{
   const oldPage=await legacyContext.newPage();await oldPage.goto(base+'v2.html#map');await oldPage.locator('.theme-card').first().waitFor();
   const originalLegacy=await oldPage.evaluate(async()=>{const m=await import('./core.js'),l=await import('./lessons.js'),s=m.freshState();s.visited.mt_ndGqFPWyen=new Date().toISOString();s.bookmarks=['mt_Ep7TDFuYUa'];s.active=m.createSession('meaning');s.active.stage='check';for(const[i,q]of l.questions('meaning','check').entries()){s.active.index=i;m.recordAnswer(s.active,q.type==='shade'?Array.from({length:q.n},(_,i)=>i):q.answer);}m.finishSession(s,s.active);s.active=m.createSession('decimal');s.paused.equivalent=m.createSession('equivalent');const text=JSON.stringify(s);localStorage.setItem(m.KEY,text);return text;});
   await oldPage.reload();await oldPage.locator('.theme-card').first().waitFor();
   const migration=await oldPage.evaluate(()=>({old:localStorage.getItem('math-explorer-v1'),next:JSON.parse(localStorage.getItem('math-explorer-v2'))}));
   check(migration.old===originalLegacy&&migration.next.legacy.history.length===1&&migration.next.legacy.active.lesson==='decimal'&&migration.next.legacy.paused.equivalent.lesson==='equivalent','v1 migration preserves original storage, complete answers and ongoing sessions');
   check(Object.keys(migration.next.activities).length===0,'v1 quiz success grants no v2 understanding evidence');
   await oldPage.goto(base+'v2.html#trail');await oldPage.locator('[data-do="import"]').waitFor();await importFile(oldPage,JSON.stringify({app:'math-explorer',version:1,state:JSON.parse(originalLegacy)}));await oldPage.waitForFunction(()=>document.querySelector('#toast').textContent.includes('已合并'));
   check(await oldPage.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')).legacy.history.length)===1,'v1 backup imports without duplicating migrated history');
  }finally{await legacyContext.close();}
  await go('map');await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await page.waitForFunction(()=>document.querySelector('#offline-status').textContent.includes('就绪'));
  await context.setOffline(true);await page.reload();await page.locator('.theme-card').first().waitFor();
  check(await page.locator('.theme-card').count()===5,'retained activity entry reloads without network using local assets');
  await go('atlas');check(await page.locator('.pack-node').count()===23,'full atlas is available offline');
  await go('activity/decimal');await stage('transfer');check((await page.locator('#scene-result').innerText()).includes('这个作品成立'),'activity scene and persistent evidence reopen offline');
  for(const demo of ['hidden-cubes','bee-builder']){const p=await context.newPage();await p.goto(base+'experiments/'+demo+'/index.html');await p.getByRole('button',{name:/find out/}).click();check((await p.locator('body').innerText()).length>20,demo+' remains available offline');await p.close();}
  check(remote.length===0,'learning flow makes no external network requests');check(errors.length===0,'no JavaScript page errors');
  return {passed:checks.length,checks,errors,remote};
 }catch(error){await page.screenshot({path:root+'v2-check-failure.png',fullPage:true});return {passed:checks.length,checks,failed:String(error),errors,remote};}
 finally{if(second)await second.close();await context.close();}
}
