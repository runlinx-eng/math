async (originalPage) => {
  const context=await originalPage.context().browser().newContext({viewport:{width:1440,height:1050},acceptDownloads:true});
  const page=await context.newPage(),errors=[],remote=[],checks=[];
  context.on('page',p=>p.on('pageerror',e=>errors.push(String(e))));
  page.on('pageerror',e=>errors.push(String(e)));
  context.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://127.0.0.1:43827'))remote.push(r.url());});
  const check=(value,label)=>{if(!value)throw new Error(label);checks.push(label);};
  const action=name=>page.locator(`[data-action="${name}"]`);
  const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v1')));
  const answer=async value=>{
    if(Array.isArray(value)){for(const i of value)await page.locator(`[data-action="shade"][data-value="${i}"]`).click();}
    else if(typeof value==='number')await page.locator(`[data-action="choice"][data-value="${value}"]`).click();
    else await page.locator('#answer-input').fill(value);
    await action('submit').click();
    await page.locator('.feedback').waitFor();
  };
  const next=async()=>{await action('next').click();};
  try {
    await page.goto('http://127.0.0.1:43827/#map');
    await page.locator('.domain-card').first().waitFor();
    check(await page.locator('.star').count()===587,'587 source nodes visible on full map');
    check(await page.locator('.domain-card').count()===12,'12 full domain groups');
    check(!await page.getByText('家长入口',{exact:true}).count(),'no parent entrance');
    await page.locator('[data-filter="open"]').click();
    check(await page.locator('.topic-card').count()===3,'availability filter shows exactly 3 complete lessons');
    await page.locator('[data-filter="all"]').click();
    await page.locator('#search').fill('面积');
    check(await page.locator('.topic-card').count()>0,'Chinese search finds non-lesson nodes');
    await page.locator('.topic-card').first().click();
    await page.locator('dialog[open]').waitFor();
    await action('bookmark').click();
    await page.getByRole('button',{name:'关闭知识点',exact:true}).click();
    await page.locator('[data-filter="bookmarks"]').click();
    check(await page.locator('.topic-card').count()===1,'bookmark collected from unbuilt node');
    await page.locator('[data-filter="all"]').click();await page.locator('#search').fill('');
    const plans=[
      {key:'meaning',id:'mt_ndGqFPWyen',placement:[1,'2/5',1],practice:[[0,1,2],'4/6',0],check:['5/8',[0,1,2],0,1]},
      {key:'equivalent',id:'mt_Ep7TDFuYUa',placement:[0,'4',1],practice:['4',1,'4/10'],check:['9',1,1,'6/15']},
      {key:'decimal',id:'mt_TqDq6jyOmL',placement:['0.7','0.06',2],practice:['0.27','4/10',1],check:['0.43','0.04','80/100',2]},
    ];
    for(const plan of plans){
      await page.goto('http://127.0.0.1:43827/#map');
      await page.locator(`.route-card[data-id="${plan.id}"]`).click();
      check(await page.locator('dialog .relation').count()>0,`${plan.key}: actual graph links available`);
      await page.locator('dialog [data-action="lesson"]').click();
      for(const v of plan.placement){await answer(v);await next();}
      await page.locator('[data-stage="explore"]').click();
      if(plan.key==='meaning'){
        await page.locator('#parts').fill('6');await page.locator('#take').fill('2');
        check((await page.locator('#experiment-visual').textContent()).includes('6 个相等'),'manipulative responds to changing denominator');
        await page.goto('http://127.0.0.1:43827/#map');await page.locator('.route-card[data-id="mt_TqDq6jyOmL"]').click();await page.locator('dialog [data-action="lesson"]').click();
        await page.goto('http://127.0.0.1:43827/#map');await page.locator('.route-card[data-id="mt_ndGqFPWyen"]').click();await page.locator('dialog [data-action="lesson"]').click();
        await page.reload();await page.locator('#parts').waitFor();
        check(await page.locator('#parts').inputValue()==='6','switch lessons and reload retain unfinished exploration');
      }
      if(plan.key==='equivalent'){
        await page.locator('#factor').fill('3');
        await page.screenshot({path:'/Users/zj1-6/dev/math/docs/lesson-equivalent.png',fullPage:true});
        check((await page.locator('#experiment-visual').textContent()).includes('6/9'),'equivalent fractions share number-line position');
      }
      if(plan.key==='decimal'){
        await page.locator('#cells').fill('3');
        check((await page.locator('#experiment-visual').textContent()).includes('0.03'),'hundredths manipulative distinguishes 0.03');
      }
      await page.locator('[data-stage="practice"]').click();
      for(let i=0;i<plan.practice.length;i++){
        if(plan.key==='meaning'&&i===1){await answer('4/5');check((await page.locator('.feedback').textContent()).includes('6 份'),'wrong answer gets targeted explanation');await action('hint').click();}
        await answer(plan.practice[i]);await next();
      }
      for(let i=0;i<plan.check.length;i++){
        if(plan.key==='equivalent'&&i===0){await answer('8');await action('hint').click();}
        await answer(plan.check[i]);await next();
      }
      const record=(await state()).history.at(-1);
      check(record.status===(plan.key==='equivalent'?'review':'independent'),`${plan.key}: result reflects first answer and hint use`);
      check(record.answers.check.length===4,`${plan.key}: all independent-check answers retained`);
    }
    await page.goto('http://127.0.0.1:43827/#journey');
    check((await page.locator('main').textContent()).includes('3 次完成的探索'),'journey shows all three completions');
    const downloadEvent=page.waitForEvent('download');await action('export').click();const download=await downloadEvent;
    const stream=await download.createReadStream();let backup='';for await(const chunk of stream)backup+=chunk.toString();
    check(JSON.parse(backup).state.history.length===3,'export creates valid portable backup');
    const before=JSON.stringify(await state());
    await page.locator('#import-file').setInputFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from('{broken')});
    await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('不是有效'));
    check(JSON.stringify(await state())===before,'invalid import does not mutate progress');
    await page.locator('#import-file').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(backup)});
    await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('已合并'));
    check((await state()).history.length===3,'repeat import merges without duplicate records');
    const second=await originalPage.context().browser().newContext({viewport:{width:390,height:844}});
    try{
      const restored=await second.newPage();await restored.goto('http://127.0.0.1:43827/#journey');await restored.locator('[data-action="export"]').waitFor();
      await restored.locator('#import-file').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(backup)});
      await restored.waitForFunction(()=>document.querySelector('#toast').textContent.includes('已合并'));
      check(await restored.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v1')).history.length)===3,'backup restores in a fresh browser context');
      await restored.goto('http://127.0.0.1:43827/#map');await restored.locator('.domain-card').first().waitFor();
      check(await restored.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile full map has no horizontal overflow');
      await restored.locator('#toast').waitFor({state:'hidden'});
      await restored.screenshot({path:'/Users/zj1-6/dev/math/docs/map-mobile.png',fullPage:true});
      await restored.locator('.route-card').first().click();
      check(await restored.locator('dialog').evaluate(el=>el.scrollWidth<=el.clientWidth),'mobile detail fits dialog');
    } finally {await second.close();}
    await page.goto('http://127.0.0.1:43827/#map');
    await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
    await context.setOffline(true);await page.reload();await page.locator('.domain-card').first().waitFor();
    check(await page.locator('.star').count()===587,'full app reloads with browser network offline');
    await page.goto('http://127.0.0.1:43827/#journey');
    check((await page.locator('main').textContent()).includes('3 次完成的探索'),'saved records available offline');
    for(const demo of ['hidden-cubes','bee-builder']){
      const p=await context.newPage();await p.goto(`http://127.0.0.1:43827/experiments/${demo}/index.html`);
      const before=await p.locator('body').innerText();await p.getByRole('button',{name:/find out/}).click();
      await p.waitForFunction(text=>document.body.innerText!==text,before);
      check((await p.locator('body').innerText()).length>20,`${demo} original experiment starts offline`);await p.close();
    }
    check(remote.length===0,'no external network requests during full learning flow');
    check(errors.length===0,'no page JavaScript errors');
    return {passed:checks.length,checks,errors,remote};
  } finally {await context.close();}
}
