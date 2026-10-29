import {key,boundaryRuns,perimeter} from './b30-geometry.js';
import {gridCells} from './b30-model.js';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const colors=['#8fc4aa','#eac38f','#a9bfd8','#d7aebd','#c4ce9a','#e3b19e'];
const btn=(act,label,index,pressed=false)=>`<button type="button" data-x="a30-${act}"${index===undefined?'':` data-index="${esc(index)}"`} aria-pressed="${!!pressed}">${esc(label)}</button>`;
const field=(k,label,value,placeholder='')=>`<label class="a30-field">${esc(label)}<input data-xfield="${esc(k)}" value="${esc(value)}" placeholder="${esc(placeholder)}" autocomplete="off"></label>`;
const select=(k,label,value,opts)=>`<label class="a30-field">${esc(label)}<select data-xfield="${esc(k)}"><option value="">选择</option>${opts.map(([v,l])=>`<option value="${esc(v)}" ${String(value)===String(v)?'selected':''}>${esc(l)}</option>`).join('')}</select></label>`;
const unit=(k,label,val,u)=>select(k,label,val,[...new Set([u,u+'²',u+'³','cm','cm²','cm³','m','m²','m³'])].map(x=>[x,x]));
const svg=(body,label,h=310)=>`<svg viewBox="0 0 760 ${h}" role="img" aria-label="${esc(label)}">${body}</svg>`;
const pointList=p=>p.map(x=>x.join(',')).join(' ');
function grid(t,b){const size=Math.min(48,600/t.w,260/t.h),x0=70,y0=20,allowed=new Set(t.cells.map(([x,y])=>key(x,y))),rectMap=new Map();b.rects.forEach((r,i)=>r.cells.forEach(([x,y])=>rectMap.set(key(x,y),i)));let s='';
 for(let y=0;y<t.h;y++)for(let x=0;x<t.w;x++){
  const id=y*t.w+x,k=key(x,y),on=t.mode==='tile'?b.tiles.includes(id):rectMap.has(k),show=allowed.has(k)||t.mode==='design',clickable=show&&['tile','partition','design'].includes(t.mode),fill=on?colors[(rectMap.get(k)??0)%colors.length]:show?'#edf1e8':'transparent';
  if(show)s+=`<rect x="${x0+x*size}" y="${y0+y*size}" width="${size}" height="${size}" fill="${fill}" stroke="#aebfae" stroke-width="1" ${clickable?`role="button" tabindex="0" data-x="a30-${t.mode==='tile'?'tile':'corner'}" data-index="${id}" aria-label="第 ${y+1} 行第 ${x+1} 格"`:''}/>`;
  if(b.corners.includes(id))s+=`<circle cx="${x0+(x+.5)*size}" cy="${y0+(y+.5)*size}" r="5" fill="#b15c45" pointer-events="none"/>`;
 }
 if(t.mode==='edge')boundaryRuns(t.cells).forEach(([a,c],i)=>{const ax=x0+a[0]*size,ay=y0+a[1]*size,bx=x0+c[0]*size,by=y0+c[1]*size;s+=`<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="${b.edges.includes(i)?'#ce7e55':'#739582'}" stroke-width="6"/><rect x="${Math.min(ax,bx)-9}" y="${Math.min(ay,by)-9}" width="${Math.abs(ax-bx)+18}" height="${Math.abs(ay-by)+18}" fill="transparent" role="button" tabindex="0" data-x="a30-edge" data-index="${i}" aria-label="外边第 ${i+1} 段"/>`;});
 s+=`<text x="${x0}" y="${y0+t.h*size+28}">每格边长 1 ${esc(t.unit)}</text>`;return svg(s,'单位方格和可以选择的外边',Math.ceil(y0+t.h*size+48));
}
function outline(t,b){const xs=t.points.map(p=>p[0]),ys=t.points.map(p=>p[1]),minx=Math.min(...xs),miny=Math.min(...ys),scale=Math.min(45,550/(Math.max(...xs)-minx),230/(Math.max(...ys)-miny)),map=p=>[90+(p[0]-minx)*scale,30+(p[1]-miny)*scale],pts=t.points.map(map);let s=`<polygon points="${pointList(pts)}" fill="#edf2e7" stroke="#8aa794" stroke-width="2"/>`;
 pts.forEach((p,i)=>{const q=pts[(i+1)%pts.length],length=Math.hypot(t.points[i][0]-t.points[(i+1)%pts.length][0],t.points[i][1]-t.points[(i+1)%pts.length][1]),dx=q[0]-p[0],dy=q[1]-p[1],L=Math.hypot(dx,dy),nx=-dy/L*9,ny=dx/L*9,hit=[[p[0]+nx,p[1]+ny],[q[0]+nx,q[1]+ny],[q[0]-nx,q[1]-ny],[p[0]-nx,p[1]-ny]];s+=`<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="${b.edges.includes(i)?'#cc8054':'#71917d'}" stroke-width="5"/><polygon points="${pointList(hit)}" fill="transparent" role="button" tabindex="0" data-x="a30-edge" data-index="${i}" aria-label="第 ${i+1} 条外边"/><text x="${(p[0]+q[0])/2+8}" y="${(p[1]+q[1])/2-8}" pointer-events="none">${i===t.unknown?'?':length} ${esc(t.unit)}</text>`;});return svg(s,'逐段选择多边形的外边');}
function compare(t,b){const a=b.rectangles||[0,0,0,0],scale=23;let s='';[[a[0],a[1]],[a[2],a[3]]].forEach(([w,h],i)=>{const x=100+i*340,y=40;s+=`<text x="${x}" y="25">${i?'第二块':'第一块'}</text>`;if(w&&h){s+=`<rect x="${x}" y="${y}" width="${w*scale}" height="${h*scale}" fill="${colors[i]}" stroke="#4d725e" stroke-width="2"/>`;for(let k=1;k<w;k++)s+=`<line x1="${x+k*scale}" y1="${y}" x2="${x+k*scale}" y2="${y+h*scale}" stroke="#fff" opacity=".6"/>`;for(let k=1;k<h;k++)s+=`<line x1="${x}" y1="${y+k*scale}" x2="${x+w*scale}" y2="${y+k*scale}" stroke="#fff" opacity=".6"/>`;s+=`<text x="${x}" y="${y+h*scale+22}">${w} × ${h}；面积 ${w*h}；周长 ${2*(w+h)}</text>`;}});return svg(s,'两块长方形的方格尺寸相同',350);}
function pieceSvg(t,b){const view=t.view||[-1,-1,18,12],vx=view[0],vy=view[1],scale=Math.min(610/view[2],250/view[3]),x=60,y=20,map=points=>points.map(([a,c])=>[x+(a-vx)*scale,y+(c-vy)*scale]);let s='';
 if(t.enclosing)s+=`<polygon points="${pointList(map(t.enclosing))}" fill="#f0ead9" stroke="#899b8c" stroke-width="2"/>`;
 const layers=t.transform?(b.transformed?t.after:t.before):t.pieces;
 layers.forEach((p,i)=>{const pts=map(p.points);s+=`<polygon points="${pointList(pts)}" fill="${colors[i%colors.length]}" fill-opacity=".85" stroke="#547560" stroke-width="2" ${!t.transform?`role="button" tabindex="0" data-x="a30-active" data-index="${i}" aria-label="选择${esc(t.pieces[i].name)}"`:''}/>`;});
 if(t.outline)s+=`<polygon points="${pointList(map(t.outline))}" fill="none" stroke="#425e50" stroke-width="3" pointer-events="none"/>`;
 for(const l of t.lines||[]){const a=map([l.a])[0],c=map([l.b])[0];s+=`<line x1="${a[0]}" y1="${a[1]}" x2="${c[0]}" y2="${c[1]}" stroke="#b5674c" stroke-width="2" stroke-dasharray="6 4"/>`;}
 for(const l of t.labels||[]){const p=map([[l.x,l.y]])[0];s+=`<text x="${p[0]}" y="${p[1]}">${esc(l.text)}</text>`;}
 return svg(s,'按同一尺度显示图形和可选部分',300);}
function circle(t,b){const r=58,x=200,y=115;let s='';if(t.kind==='circle'){
  s+=`<circle cx="${x}" cy="${y}" r="${r}" fill="#b8d6c2" stroke="#60866f" stroke-width="3"/><line x1="${x-r}" y1="${y}" x2="${x+r}" y2="${y}" stroke="#c57352" stroke-width="3"/><circle cx="${x}" cy="${y}" r="4" fill="#526e5d"/><text x="${x+8}" y="${y-8}">${t.given==='diameter'?'直径 '+(2*t.radius):'半径 '+t.radius} ${esc(t.unit)}</text><text x="${x-r}" y="${y+90}">直径横穿圆心</text>`;
  if(b.unrolled)s+=`<line x1="70" y1="250" x2="${70+Math.PI*2*r}" y2="250" stroke="#c57352" stroke-width="5"/><line x1="70" y1="276" x2="${70+2*r}" y2="276" stroke="#6c997b" stroke-width="5"/><text x="70" y="235">圆周拉直（上）与直径（下），比例约 3.14</text>`;
 }else{const px=35,R=t.radius*px,L=t.rectLength*px,X=170,Y=60;s+=`<path d="M${X} ${Y} a${R} ${R} 0 0 0 0 ${2*R} Z" fill="${b.pieces.includes(1)?colors[1]:'#e8eee4'}" stroke="#62856f" stroke-width="2" data-x="a30-piece" data-index="1" role="button" tabindex="0" aria-label="左半圆"/><rect x="${X}" y="${Y}" width="${L}" height="${2*R}" fill="${b.pieces.includes(0)?colors[0]:'#e8eee4'}" stroke="#62856f" stroke-width="2" data-x="a30-piece" data-index="0" role="button" tabindex="0" aria-label="中间长方形"/><path d="M${X+L} ${Y} a${R} ${R} 0 0 1 0 ${2*R} Z" fill="${b.pieces.includes(2)?colors[2]:'#e8eee4'}" stroke="#62856f" stroke-width="2" data-x="a30-piece" data-index="2" role="button" tabindex="0" aria-label="右半圆"/><text x="${X}" y="${Y+2*R+25}">长 ${t.rectLength} ${esc(t.unit)}；两端半径 ${t.radius} ${esc(t.unit)}</text>`;if(b.unrolled)s+=`<text x="80" y="290">两段半圆弧合成一个圆周；中间接缝不是外边。</text>`;
 }return svg(s,'圆或由长方形与半圆组成的图形',320);}
function net(t,b){if(!t.net)return '';const shapes=t.net,all=shapes.flatMap(x=>x.points),xs=all.map(p=>p[0]),ys=all.map(p=>p[1]),minx=Math.min(...xs),miny=Math.min(...ys),scale=Math.min(610/(Math.max(...xs)-minx),260/(Math.max(...ys)-miny)),map=points=>points.map(([x,y])=>[55+(x-minx)*scale,25+(y-miny)*scale]);let s='';for(const shape of shapes){const pts=map(shape.points),f=t.faces[shape.index];s+=`<polygon points="${pointList(pts)}" fill="${b.selected.includes(shape.index)?colors[shape.index%colors.length]:'#e9eee4'}" stroke="#638574" stroke-width="2" data-x="a30-face" data-index="${shape.index}" role="button" tabindex="0" aria-label="选择${esc(f.name)}"/>`;const cx=pts.reduce((a,p)=>a+p[0],0)/pts.length,cy=pts.reduce((a,p)=>a+p[1],0)/pts.length;s+=`<text x="${cx}" y="${cy}" text-anchor="middle" pointer-events="none">${esc(f.name)}</text>`;}return `<p class="a30-caption">展开图：点选要计算的面</p>`+svg(s,'与立体对应的展开图，选择要计算的面');}
export function visual(t,m){const b=m.board;const body=t.type==='x-a30-grid'?grid(t,b):t.type==='x-a30-outline'?outline(t,b):t.type==='x-a30-compare'?compare(t,b):t.type==='x-a30-pieces'?pieceSvg(t,b):t.type==='x-a30-circle'?circle(t,b):net(t,b);return `<div class="a30-world">${body}</div>`;}
export function controls(t,m){const b=m.board;let s='<div class="a30-controls">';
 if(t.type==='x-a30-grid'){
  if(t.mode==='tile')s+=`<p>点方格铺满；已经放 ${b.tiles.length} 块。</p>`;
  if(t.mode==='edge')s+=`<p>沿外边逐段点亮；已走 ${b.edges.length} 段。</p>`;
  if(['partition','design'].includes(t.mode))s+=`<p>点长方形的两个对角，再放下这一块。</p>`+btn('rect','放下这一块')+btn('undo','撤回上一块')+btn('clear','重新搭')+`<p>已放 ${b.rects.length} 块。</p>`;
  if(['tile','partition'].includes(t.mode))s+=field('area','面积有多少平方单位',m.area)+unit('unit','面积单位',m.unit,t.unit);
  else s+=field('perimeter','外边一圈有多长',m.perimeter)+unit('unit','长度单位',m.unit,t.unit);
 }
 if(t.type==='x-a30-outline')s+=`<p>点亮每一条外边；已走 ${b.edges.length} 段。</p>`+field('answer',t.questionLabel,m.answer)+unit('unit','长度单位',m.unit,t.unit);
 if(t.type==='x-a30-compare')s+=field('w1','第一块长',m.w1)+field('h1','第一块宽',m.h1)+field('w2','第二块长',m.w2)+field('h2','第二块宽',m.h2)+btn('build','把两块摆出来');
 if(t.type==='x-a30-pieces'){
  if(t.transform)s+=btn('transform',b.transformed?'移回去':'移动或复制这一块');
  s+=`<div class="a30-buttons">${t.pieces.map((p,i)=>btn('active',(b.values[i]!==null?'✓ ':'')+p.name,i,b.active===i)).join('')}</div>`+field('part','这一块的面积',m.part)+btn('part','记下这一块')+field('area',t.mode==='subtract'?'外框减去这些角后，里面多少':'合起来的面积',m.area)+unit('unit','面积单位',m.unit,t.unit);
 }
 if(t.type==='x-a30-circle'){
  s+=btn('unroll',b.unrolled?'把线收回':'把圆周拉直');
  if(t.kind==='stadium')s+=`<div class="a30-buttons">${['中间长方形','左半圆','右半圆'].map((n,i)=>btn('piece',n,i,b.pieces.includes(i))).join('')}</div><p>外边包含哪些部分？</p><div class="a30-buttons">${['上直边','下直边','两段圆弧','内部接缝'].map((n,i)=>btn('edge',n,i,b.edges.includes(i))).join('')}</div>`;
  s+=`<p>这次用 π ≈ 3.14，结果是近似值。</p>`+field('radius','半径',m.radius)+field('diameter','直径',m.diameter)+field('perimeter','一圈长度',m.perimeter)+unit('unit','长度单位',m.unit,t.unit)+field('area','铺满的面积',m.area)+unit('areaUnit','面积单位',m.areaUnit,t.unit);
 }
 if(t.type==='x-a30-solid'){
  s+=`<button type="button" data-x="turn-extra">转一转</button>`+(t.canSplit?btn('split',b.split?'接起来':'分开看看'):'');
  if(t.requiredFaces?.length){s+=`<p>${t.openTop?'只选做盒子需要的面，上盖不用。':'点立体或展开图，选出需要的面。'}</p><div class="a30-buttons">${t.faces.map((face,i)=>btn('face',face.name+' '+face.dims,i,b.selected.includes(i))).join('')}</div>`;
   s+=t.faces.map((face,i)=>b.selected.includes(i)?field('faceValues.'+i,face.name+'的面积（'+face.dims+'）',m.faceValues[i]):'').join('')+field('area','选中这些面共多少',m.area)+unit('unit','表面单位',m.unit,t.unit);
  }
  s+=(t.calculations||[]).map((c,i)=>field('calcValues.'+i,c.label,m.calcValues[i])).join('');
  if(t.volumeRequired)s+=(t.baseArea==null?'':field('base','一层底面的面积',m.base))+field('volume','里面的体积',m.volume)+unit('volumeUnit','体积单位',m.volumeUnit,t.unit);
 }
 for(const [i,q]of (t.questions||[]).entries())s+=q.options?select('answers.'+i,q.label,m.answers[i],q.options):field('answers.'+i,q.label,m.answers[i]);
 if(m.issue)s+=`<p class="a30-issue" role="status">${esc(m.issue)}</p>`;
 return s+`<details><summary>留下自己的想法（可选）</summary>${field('prose','我的解释或新问题',m.prose)}<small>原话会保存，暂不自动判断。</small></details></div>`;
}
export const render=(t,m)=>t.type==='x-a30-solid'?`<div class="a30-spatial ${t.net?'':'solo'}"><div class="cube-world a30-solid-world" id="extra-world"></div>${t.net?`<div id="extra-visual">${visual(t,m)}</div>`:''}</div><div id="extra-controls">${controls(t,m)}</div>`:`<div id="extra-visual">${visual(t,m)}</div><div id="extra-controls">${controls(t,m)}</div>`;
