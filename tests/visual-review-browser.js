async (originalPage) => {
 const root='/Users/zj1-6/dev/math/verification/';
 const out=root+'visual-polish-20261024/',context=await originalPage.context().browser().newContext({viewport:{width:1440,height:940},deviceScaleFactor:1,reducedMotion:'reduce'});
 const page=await context.newPage();
 try {
  await page.goto('http://127.0.0.1:43827/?v=4#space');await page.waitForFunction(()=>!!window.mathSpace);
  await page.locator('[data-action="search"]').click();await page.locator('#search-input').fill('mt_Ep7TDFuYUa');
  await page.locator('#search-results [data-key="node:mt_Ep7TDFuYUa"]').click();
  await page.locator('#focus-card [data-action="open"]').click();
  await page.frameLocator('.work-panel iframe').locator('[data-stage="play"]').waitFor();
  await page.waitForFunction(()=>document.querySelector('.work-panel').offsetWidth===520);
  await page.screenshot({path:out+'space-single-workspace.png'});
  const panel=await page.locator('.work-panel').boundingBox();
  const paths=[root+'spatial-20261024/space-overview.png',out+'space-overview.png',root+'visual-directions-20261024/02-near.png',out+'space-theme.png',root+'visual-directions-20261024/03-workspace.png',out+'space-single-workspace.png',root+'spatial-20261024/space-mobile.png',out+'space-mobile.png'];
  await page.setContent('<input type="file" id="qa-files" multiple>');
  await page.locator('#qa-files').setInputFiles(paths);
  const images=await page.locator('#qa-files').evaluate(el=>Promise.all([...el.files].map(file=>new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(file);})))),assets=new Map(paths.map((path,i)=>[path,images[i]]));
  const asset=async path=>assets.get(path);
  const compare=async(name,left,right,{width=1440,height=940,scale=.5,crop=null}={})=>{
   const [a,b]=await Promise.all([asset(left),asset(right)]);
   const cropW=crop?.[0].w??width,cropH=crop?.[0].h??height;
   await page.setViewportSize({width:Math.ceil(cropW*scale*2+48),height:Math.ceil(cropH*scale+68)});
   const box=(src,i)=>`<section><h2>${i?'改后':'改前'}</h2><div class="crop"><img src="${src}" style="width:${width*scale}px;height:${height*scale}px;left:${-(crop?.[i].x||0)*scale}px;top:${-(crop?.[i].y||0)*scale}px"></div></section>`;
   await page.setContent(`<style>*{box-sizing:border-box}body{margin:0;padding:16px;display:flex;gap:16px;background:#e9ece6;color:#23463f;font:14px system-ui}h2{margin:0 0 12px;font:600 14px system-ui}.crop{width:${cropW*scale}px;height:${cropH*scale}px;position:relative;overflow:hidden}img{position:absolute;max-width:none}</style>${box(a,0)}${box(b,1)}`);
   await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
   await page.screenshot({path:out+name+'.png'});
  };
  await compare('compare-overview',root+'spatial-20261024/space-overview.png',out+'space-overview.png');
  await compare('compare-theme',root+'visual-directions-20261024/02-near.png',out+'space-theme.png');
  await compare('compare-workspace',root+'visual-directions-20261024/03-workspace.png',out+'space-single-workspace.png');
  await compare('compare-workspace-detail',root+'visual-directions-20261024/03-workspace.png',out+'space-single-workspace.png',{scale:1,crop:[{x:720,y:126,w:590,h:500},{x:panel.x,y:panel.y,w:590,h:500}]});
  await compare('compare-mobile',root+'spatial-20261024/space-mobile.png',out+'space-mobile.png',{width:390,height:844,scale:1});
  return {viewport:{width:1440,height:940},deviceScaleFactor:1,panel,comparisons:5};
 }finally{await context.close();}
}
