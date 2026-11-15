// Optional 3D views stay out of the ordinary learning-page ESM startup graph.
// Preload an entire session before the existing synchronous render/Next actions.
// Importing this lightweight helper never loads Three.js or changes learner data.
export function needsThreeView(task){
 if(!task)return false;
 if(task.dims)return true;
 const type=task.type;
 return type==='x-solid'||type==='x-net'||type==='x-s23-frame'||
  type==='x-a30-solid'||type==='x-m31-cubes'||type==='x-m31-product'||
  type==='x-p34-growth'||(type==='x-powerbuild'&&task.pow===3)||
  typeof type==='string'&&type.startsWith('x-g27-');
}
let loading=null;
export function loadThreeViews(){
 if(!loading){
  loading=Promise.all([
   import('./cubes.js'),
   import('./phase4/solid-view.js'),
   import('./phase5/b27-solid-view.js'),
   import('./phase5/b30-solid-view.js'),
   import('./phase5/b31-cube-view.js'),
   import('./phase5/b34-space-view.js'),
   import('./phase5/b23-solid-view.js'),
   import('./phase5/b09-power-view.js')
  ]).then(([cube,solid,space,area,fraction,growth,frame,power])=>Object.freeze({
   CubeView:cube.CubeView,
   SolidView:solid.SolidView,
   SpaceLab:space.SpaceLab,
   AreaSolidLab:area.AreaSolidLab,
   FractionCubeView:fraction.FractionCubeView,
   PatternGrowthView:growth.PatternGrowthView,
   FrameView:frame.FrameView,
   PowerView:power.PowerView
  })).catch(error=>{loading=null;throw error;});
 }
 return loading;
}
