async original=>{
 const base='http://127.0.0.1:43827/',ctx=await original.context().browser().newContext({viewport:{width:1366,height:900},reducedMotion:'reduce'}),p=await ctx.newPage(),checks=[],errors=[];p.setDefaultTimeout(12000);p.on('pageerror',e=>errors.push(String(e)));const check=(v,l)=>{if(!v)throw Error(l);checks.push(l);};
 try{await p.goto(base+'?v=43#space/pack/reasoning');await p.waitForFunction(()=>window.mathSpace);check(await p.locator('[data-action="choose-section"]').count()===3,'three entry choices');
  const groups={'reasoning-words':['O','HN','HO','HP'],'reasoning-model':['HQ','HR'],'reasoning-plan':['HS','HT']};
  for(const[section,expected]of Object.entries(groups)){
   await p.locator(`[data-action="choose-section"][data-id="${section}"]`).click();let ids=[];
   while(true){const items=await p.locator('[data-action="choose-route"]').evaluateAll(es=>es.map(e=>e.dataset.id));check(items.length<=3,section+' shows at most three routes');ids.push(...items);const next=p.locator('[data-action="route-page"]:not([disabled])').filter({hasText:'再看看'});if(!await next.count())break;await next.click();}
   check(JSON.stringify(ids)===JSON.stringify(expected),section+' exposes its routes and original O');
   await p.locator('[data-action="choose-route"]').first().click();const id=(await p.evaluate(()=>mathSpace.snapshot())).learningRouteId;check(await p.locator('#focus-card ol li').count()>=2&&await p.locator('#focus-card ol li').count()<=4,section+' has a short route');await p.reload();await p.waitForFunction(()=>window.mathSpace);check((await p.evaluate(()=>mathSpace.snapshot())).learningRouteId===id,section+' route persists');await p.locator('[data-action="choose-route"][data-id=""]').click();check(await p.locator('[data-action="choose-route"]').count()<=3,section+' returns to its direction');await p.locator('[data-action="choose-section"][data-id=""]').click();
  }
  check(!errors.length,'no runtime errors');return{checks,errors};
 }catch(e){return{checks,errors,failed:String(e),url:p.url(),body:(await p.locator('body').innerText()).slice(-2000)};}finally{await ctx.close();}
}
