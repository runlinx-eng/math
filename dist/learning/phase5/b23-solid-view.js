import * as THREE from '../../vendor/three/three.module.min.js';
import {solid} from '../phase4/geometry.js';
import {SolidView} from '../phase4/solid-view.js';
export class FrameView extends SolidView {
 constructor(host,t,onMark,onMove){super(host,{...t,type:'x-solid',shape:t.solid||'cube'},onMark,onMove);this.frameTask=t;}
 update(m){const build=this.frameTask.mode==='build';super.update({mode:build?'edges':'faces',marks:{faces:[],edges:m.board.edges,vertices:[]}});if(build){for(const o of this.group.children){if(o.geometry?.type==='BufferGeometry'){o.material.transparent=true;o.material.opacity=.1;o.material.depthWrite=false;}else if(o.geometry?.type==='CylinderGeometry'&&!m.board.edges.includes(o.userData.index)){o.material.transparent=true;o.material.opacity=.2;}}
  solid('cube').vertices.forEach((p,i)=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=96;const c=canvas.getContext('2d');c.fillStyle='#fffdf4';c.beginPath();c.arc(48,48,31,0,Math.PI*2);c.fill();c.strokeStyle='#769485';c.lineWidth=3;c.stroke();c.fillStyle='#30594c';c.font='bold 45px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(String.fromCharCode(65+i),48,50);const tex=new THREE.CanvasTexture(canvas),mat=new THREE.SpriteMaterial({map:tex,depthTest:false,transparent:true}),mark=new THREE.Sprite(mat);mark.position.fromArray(p.map(v=>v*1.10));mark.scale.set(.42,.42,.42);this.group.add(mark);});this.render();}}
}
