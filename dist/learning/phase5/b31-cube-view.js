import {CubeView} from '../cubes.js';
// Unit-fraction cubes share the same spatial cell grid; labels state the physical edge length.
export class FractionCubeView{
 constructor(host,t,onFill,onMove){this.grid=t.grid;this.view=new CubeView(host,{type:'cube-plan',dims:t.grid,build:true},onFill);const n=Math.max(...t.grid),target=this.view.controls.target;this.view.camera.position.set(2+n*1.1,target.y+2+n*.9,3+n*1.2);this.view.controls.update();this.view.floor.scale.setScalar(Math.min(.72,Math.max(.42,(n+1)/10)));this.view.ghost.opacity=.13;this.ghostEdges=this.view.edgeMat.clone();this.ghostEdges.color.setHex(0x90a99b);this.ghostEdges.transparent=true;this.ghostEdges.opacity=.55;this.view.controls.addEventListener('start',()=>this.start=this.view.camera.position.clone());this.view.controls.addEventListener('end',()=>{if(this.start&&this.start.distanceTo(this.view.camera.position)>.001)onMove?.();});}
 attach(host){this.view.attach(host);}
 restoreCamera(camera){this.view.restoreCamera(camera);}
 update(m){this.view.camera.fov=m.board.spread?(this.grid[2]>=4?45:43):35;this.view.camera.updateProjectionMatrix();this.view.update({filled:m.board.filled},{spread:m.board.spread?1:0});this.view.cubes.forEach((g,i)=>{g.children[1].visible=true;g.children[1].material=m.board.filled.includes(i)?this.view.edgeMat:this.ghostEdges;});this.view.render();}
 turn(){this.view.turn();}
 snapshot(){const s=this.view.snapshot();return{...s,shape:'fraction-cubes',objects:s.cells.length};}
 destroy(){this.ghostEdges.dispose();this.view.destroy();this.view.canvas.remove();}
}
