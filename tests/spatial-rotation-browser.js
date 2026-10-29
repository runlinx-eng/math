async original=>{
  const browser=original.context().browser(),ctx=await browser.newContext({viewport:{width:1440,height:940},reducedMotion:'reduce'}),p=await ctx.newPage(),checks=[],errors=[];
  const check=(v,label)=>{if(!v)throw Error(label);checks.push(label);};
  const snap=()=>p.evaluate(()=>mathSpace.snapshot());
  const same=(a,b)=>a.every((v,i)=>Math.abs(v-b[i])<1e-5);
  const drag=async(dx,dy,options={})=>{await p.mouse.move(1150,720);if(options.shift)await p.keyboard.down('Shift');await p.mouse.down({button:options.button||'left'});await p.mouse.move(1150+dx,720+dy,{steps:8});await p.mouse.up({button:options.button||'left'});if(options.shift)await p.keyboard.up('Shift');};
  p.on('pageerror',e=>errors.push(String(e)));
  try{
    await p.goto('http://127.0.0.1:43827/?world=network&v=52#space');await p.waitForFunction(()=>window.mathSpace);
    const initial=await snap();
    check(await p.locator('[data-action="mode"][data-mode="rotate"]').getAttribute('aria-pressed')==='true','network starts with rotation selected');
    await drag(-100,-60);let rotated=await snap();
    check(!same(initial.position,rotated.position)&&same(initial.target,rotated.target),'plain left drag rotates around the current target');
    check(JSON.stringify(initial.positions)===JSON.stringify(rotated.positions)&&rotated.selected===initial.selected,'drag preserves every node coordinate and selection');
    check((await p.locator('#network-view-title').innerText()).includes('自由视角'),'the guide identifies the rotated view');
    await drag(60,25,{shift:true});let shifted=await snap();
    check(!same(rotated.target,shifted.target),'shift drag pans without changing the chosen mode');
    await drag(50,20,{button:'right'});let right=await snap();
    check(!same(shifted.target,right.target),'right drag pans in the default rotation mode');
    await p.locator('[data-action="mode"][data-mode="pan"]').click();await drag(-70,20);let panned=await snap();
    check(!same(right.target,panned.target)&&await p.locator('[data-action="mode"][data-mode="pan"]').getAttribute('aria-pressed')==='true','the visible pan button switches left drag to pan');
    await drag(-60,-30,{button:'right'});let altRotate=await snap();
    check(!same(panned.position,altRotate.position)&&same(panned.target,altRotate.target),'right drag rotates while the pan mode is selected');
    await p.locator('[data-action="mode"][data-mode="rotate"]').click();
    for(const [name,dy] of [['down',80],['up',-80]]){
      await p.locator('[data-action="network-view"][data-view="top"]').click();const top=await snap();await drag(0,dy);const after=await snap();
      check(!same(top.position,after.position)&&same(top.target,after.target),'top view tilts '+name+' without shifting the rotation center');
      check(JSON.stringify(top.positions)===JSON.stringify(after.positions),'top view '+name+' keeps source coordinates');
      await p.waitForFunction(()=>[...document.querySelectorAll('.network-axis-labels span')].some(el=>!el.hidden));
      check((await p.locator('#network-view-title').innerText()).includes('自由视角'),'a tilted top view shows the layer axis and the free-view label');
    }
    await p.locator('[data-action="network-view"][data-view="side"]').click();const side=await snap();await drag(80,50);const sideAfter=await snap();
    check(!same(side.position,sideAfter.position)&&same(side.target,sideAfter.target),'side view rotates around the same target');
    check(sideAfter.selected===side.selected&&JSON.stringify(sideAfter.positions)===JSON.stringify(side.positions),'side drag preserves selection and source coordinates');
    await p.waitForTimeout(500);const beforeReload=await snap();await p.reload();await p.waitForFunction(()=>window.mathSpace);const restored=await snap();
    check(same(beforeReload.position,restored.position)&&same(beforeReload.target,restored.target),'rotated view and target survive refresh');
    check(await p.locator('[data-action="mode"][data-mode="rotate"]').getAttribute('aria-pressed')==='true'&&(await p.locator('#network-view-title').innerText()).includes('自由视角'),'refresh restores a rotated view and default drag mode');
    const node=await p.evaluate(()=>mathSpace.snapshot().positions.filter(o=>o.key.startsWith('node:')).map(o=>({key:o.key,...mathSpace.project(o.key)})).find(x=>x.visible&&x.x>350&&x.x<1100&&x.y>160&&x.y<750&&document.elementFromPoint(x.x,x.y)?.tagName==='CANVAS'));
    check(!!node,'a source point is available for the click-versus-drag check');
    await p.mouse.move(node.x,node.y);await p.mouse.down();await p.mouse.move(node.x+70,node.y+30,{steps:6});await p.mouse.move(node.x,node.y,{steps:6});await p.mouse.up();
    check((await snap()).selected===restored.selected,'a drag returning to its start is not mistaken for a click');
    const classic=await browser.newContext({viewport:{width:1440,height:940},reducedMotion:'reduce'}),q=await classic.newPage();
    try{await q.goto('http://127.0.0.1:43827/?world=classic&v=52#space');await q.waitForFunction(()=>window.mathSpace);const a=await q.evaluate(()=>mathSpace.snapshot());await q.mouse.move(1150,720);await q.mouse.down();await q.mouse.move(1080,740,{steps:6});await q.mouse.up();const b=await q.evaluate(()=>mathSpace.snapshot());
      check(await q.locator('[data-action="mode"][data-mode="pan"]').getAttribute('aria-pressed')==='true'&&!same(a.target,b.target),'the classic world retains its existing default pan');
    }finally{await classic.close();}
    const motion=await browser.newContext({viewport:{width:1440,height:940},reducedMotion:'no-preference'}),m=await motion.newPage();
    try{await m.goto('http://127.0.0.1:43827/?world=network&v=52#space');await m.waitForFunction(()=>window.mathSpace);await m.mouse.move(1150,720);await m.mouse.down();await m.mouse.move(1050,660,{steps:8});await m.mouse.up();
      await m.evaluate(async()=>{let last=null,stable=0;for(let i=0;i<120;i++){await new Promise(r=>setTimeout(r,150));const current=mathSpace.snapshot().position;if(last&&Math.hypot(...current.map((v,j)=>v-last[j]))<.01)stable++;else stable=0;if(stable>=4)return;last=current;}throw Error('rotation inertia did not settle');});await m.waitForTimeout(400);
      const settled=await m.evaluate(()=>mathSpace.snapshot());await m.reload();await m.waitForFunction(()=>window.mathSpace);const reloaded=await m.evaluate(()=>mathSpace.snapshot());
      check(settled.position.every((v,i)=>Math.abs(v-reloaded.position[i])<.02)&&same(settled.target,reloaded.target),'normal-motion drag saves the final camera after inertia');
    }finally{await motion.close();}
    check(!errors.length,'no browser errors');return{checks,errors};
  }catch(e){return{checks,errors,failed:String(e)};}finally{await ctx.close();}
}
