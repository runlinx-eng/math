import{CubeView}from'../cubes.js';
export class PowerView{
 constructor(host,t,onFill,onCamera){this.host=host;this.t=t;this.onFill=onFill;this.onCamera=onCamera;this.view=null;this.side=0;this.saved=null;}
 attach(host){this.host=host;this.view?.attach(host);}
 restoreCamera(camera){this.saved=camera;this.view?.restoreCamera(camera);}
 update(m){if(this.side!==m.side){const s=this.view?.snapshot();if(s)this.saved={position:s.camera,target:s.target};this.view?.destroy();this.view?.canvas.remove();this.view=new CubeView(this.host,{type:'cube-plan',dims:[m.side,m.side,m.side],build:true},this.onFill);this.view.restoreCamera(this.saved);this.view.controls.addEventListener('end',this.onCamera);this.side=m.side;}this.view.update({filled:m.filled},{spread:m.spread?1:0});}
 turn(){this.view?.turn();}
 snapshot(){const s=this.view?.snapshot();return s?{...s,side:this.side,filled:[...(this.view.model.filled||[])]}:null;}
 destroy(){this.view?.destroy();this.view?.canvas.remove();this.view=null;}
}
