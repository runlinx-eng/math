async original=>{
  const fs=require('fs'),root='/Users/zj1-6/dev/math/verification/spatial-readability-20261029/',base='http://127.0.0.1:43827/';
  const browser=original.context().browser(),checks=[],errors=[],measurements=[];
  const baseline=JSON.parse(fs.readFileSync(root+'before-positions.json','utf8'));
  const before=JSON.parse(fs.readFileSync(root+'before-preview.json','utf8')).results[0];
  const check=(ok,message)=>{if(!ok)throw Error(message);checks.push(message);};
  const inspect=()=>{
    const s=mathSpace.snapshot(),points=s.positions.filter(o=>o.key.startsWith('node:')).map(o=>mathSpace.project(o.key));
    const rect=el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};};
    const labels=[...document.querySelectorAll('.space-label:not([hidden])')].map(el=>({key:el.dataset.key,...rect(el),fits:el.scrollWidth<=el.clientWidth+1}));
    const chrome=[...document.querySelectorAll('.topbar,.network-guide,.tool-rail,.bottom-bar,#continue-card:not([hidden]),#focus-card:not([hidden])')].map(rect);
    const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
    const x=points.map(p=>p.x),y=points.map(p=>p.y);
    return{positions:s.positions,nodes:s.visibleNodes.length,edges:s.backgroundEdges,labels,
      bounds:{w:Math.max(...x)-Math.min(...x),h:Math.max(...y)-Math.min(...y)},
      area:labels.reduce((n,r)=>n+r.w*r.h,0),labelCollisions:labels.filter(r=>chrome.some(c=>overlap(r,c))),
      obstructedPoints:points.filter(p=>chrome.some(c=>p.x>c.x&&p.x<c.x+c.w&&p.y>c.y&&p.y<c.y+c.h)).length,
      overflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight};
  };
  try{
    for(const [width,height]of[[1440,940],[1280,720],[1000,720]]){
      const ctx=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),p=await ctx.newPage();p.on('pageerror',e=>errors.push(String(e)));
      try{
        await p.goto(base+'?world=network&v=50#space');await p.waitForFunction(()=>window.mathSpace);
        for(const view of ['oblique','top','side']){
          await p.locator(`.tool-rail [data-view="${view}"]`).click();const m=await p.evaluate(inspect);measurements.push({width,height,view,...m,positions:undefined});
          check(JSON.stringify(m.positions)===JSON.stringify(baseline),`${width} ${view}: all 615 world positions match the pre-change map`);
          check(m.nodes===587&&m.edges===1223,`${width} ${view}: every source node and connection remains available`);
          check(m.labels.length===5&&m.labels.every(l=>l.key.startsWith('theme:')&&l.fits),`${width} ${view}: five complete topic names form the overview`);
          check(!m.overflow&&!m.labelCollisions.length&&!m.obstructedPoints,`${width} ${view}: fixed controls and continuation do not cover the map or its names`);
          if(width===1280&&view==='oblique'){
            check(m.bounds.w*m.bounds.h>before.bounds.w*before.bounds.h*1.5,'same-size overview provides at least 50 percent more projected graph area');
            check(m.area<before.labelArea*.25,'same-size overview labels occupy less than one quarter of their former area');
          }
        }
        await p.locator('[data-action="search"]').click();await p.locator('#search-input').fill('mt_nvdpxAJTBG');await p.locator('#search-results [data-key="node:mt_nvdpxAJTBG"]').click();
        await p.locator('.tool-rail [data-view="oblique"]').click();await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));let selected=await p.evaluate(inspect);measurements.push({width,height,view:'selected',...selected,positions:undefined});await p.screenshot({path:root+`checked-${width}-selected.png`});
        check(JSON.stringify(selected.positions)===JSON.stringify(baseline)&&selected.nodes===587&&selected.edges===1223,`${width}: selection preserves the whole source map`);
        check(selected.labels.every(l=>l.key.startsWith('node:'))&&!selected.labelCollisions.length,`${width}: local names take priority over topic signs and avoid the focus card`);
        check(await p.locator('.space-label.node.selected .activity-glyph').isVisible()&&await p.locator('.network-focus-key').isVisible(),`${width}: selected activity and relationship directions are identifiable`);
        await p.locator('.network-relations > summary').click();check(await p.locator('.network-relations [data-action="choose"]').count()===16,`${width}: all sixteen real neighbors remain accessible`);
        await p.locator('#focus-card [data-action="deselect"]').click();await p.locator('[data-action="overview"]').click();
        if(width===1280){
          for(let i=0;i<3;i++)await p.locator('[data-action="zoom"][data-factor="0.75"]').click();
          await p.waitForFunction(()=>[...document.querySelectorAll('.space-label.pack')].some(el=>!el.hidden));
          check(await p.locator('.space-label.pack:visible').count()>0,'zooming closer reveals content group names');await p.screenshot({path:root+'zoom-groups.png'});
          for(let i=0;i<3;i++)await p.locator('[data-action="zoom"][data-factor="0.75"]').click();
          await p.waitForFunction(()=>[...document.querySelectorAll('.space-label.node')].some(el=>!el.hidden));
          check(await p.locator('.space-label.node:visible').count()>0,'closer zoom reveals individual concept names');await p.screenshot({path:root+'zoom-nodes.png'});
          check(JSON.stringify((await p.evaluate(()=>mathSpace.snapshot())).positions)===JSON.stringify(baseline),'progressive labels never move the underlying graph');
        }
      }finally{await ctx.close();}
    }
    check(!errors.length,'readability checks produce no browser errors');return{checks,errors,measurements,childTrial:false};
  }catch(e){return{checks,errors,measurements,failed:String(e),childTrial:false};}
}
