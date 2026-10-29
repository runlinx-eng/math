async original=>{
  const ctx=await original.context().browser().newContext({viewport:{width:1440,height:940},reducedMotion:'no-preference'}),p=await ctx.newPage(),checks=[],errors=[];
  const check=(v,label)=>{if(!v)throw Error(label);checks.push(label);};p.on('pageerror',e=>errors.push(String(e)));
  const snapshot=()=>p.evaluate(()=>mathSpace.snapshot());
  try{
    await p.goto('http://127.0.0.1:43827/?world=network&v=49#space');await p.waitForFunction(()=>window.mathSpace);
    const originalView=await snapshot();
    await p.locator('[data-action="mode"][data-mode="rotate"]').click();
    await p.mouse.move(1190,700);await p.mouse.down();await p.mouse.move(1110,650,{steps:12});await p.mouse.up();
    check(JSON.stringify((await snapshot()).position)!==JSON.stringify(originalView.position),'normal-motion pointer drag changes the real camera');
    await p.locator('.tool-rail [data-view="side"]').click();
    await p.waitForFunction(()=>{const s=mathSpace.snapshot();return s.networkView==='relations'&&Math.abs(s.position[0]-s.target[0])<1e-7&&Math.abs(s.position[1]-s.target[1])<1e-7;});
    const side=await snapshot(),atlas=await(await p.request.get('http://127.0.0.1:43827/data/atlas.json')).json();
    const edges=await p.evaluate(edges=>edges.map(e=>[mathSpace.project('node:'+e.prerequisiteId).y,mathSpace.project('node:'+e.topicId).y]),atlas.edges.filter(e=>e.strength==='hard'));
    check(edges.every(([from,to])=>from>to+.01),'changing to side view during rotational inertia still aligns all 851 hard edges');
    check(JSON.stringify(side.positions)===JSON.stringify(originalView.positions),'animated camera transitions do not rearrange global objects');
    await p.mouse.move(1180,650);await p.mouse.wheel(0,-250);await p.waitForFunction(z=>mathSpace.snapshot().cameraZoom>z,side.cameraZoom);
    const wheel=await snapshot();check(wheel.cameraZoom>side.cameraZoom,'wheel zoom changes the orthographic scale');
    await p.reload();await p.waitForFunction(()=>window.mathSpace);const restored=await snapshot();
    check(Math.abs(restored.cameraZoom-wheel.cameraZoom)<1e-6&&restored.position.every((v,i)=>Math.abs(v-wheel.position[i])<1e-6)&&restored.target.every((v,i)=>Math.abs(v-wheel.target[i])<1e-6),'wheel scale and cursor-centered camera restore after refresh');
    check(!errors.length,'normal-motion camera produces no browser errors');
    return {checks,errors};
  }catch(e){return {checks,errors,failed:String(e)};}finally{await ctx.close();}
}
