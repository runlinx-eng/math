import {solid,foldedNet,NETS,floorCells,pondCells} from './geometry.js';
const num=(v,min=0,max=10000)=>v===null||Number.isFinite(v)&&v>=min&&v<=max;
const int=(v,a,b)=>Number.isInteger(v)&&v>=a&&v<=b;
const ids=(a,max)=>Array.isArray(a)&&a.length<=max&&new Set(a).size===a.length&&a.every(v=>int(v,0,max-1));
const txt=(v,n=2000)=>typeof v==='string'&&v.length<=n;
const coords=a=>Array.isArray(a)&&a.length<=25&&new Set(a.map(p=>p?.join(','))).size===a.length&&a.every(p=>Array.isArray(p)&&p.length===2&&p.every(n=>int(n,0,4)));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),keys=t=>t.keys||['height','mass','capacity'];
export const TYPES=new Set(['x-floor','x-rectangle','x-pond','x-solid','x-net','x-attributes','x-measure','x-capacity']);
export function initial(t){switch(t.type){
 case'x-floor':return {w:t.w,h:t.h,cols:t.partition?1:t.w,rows:t.partition?1:t.h,tiles:[],total:null,rowsWritten:null,columnsWritten:null,unit:'',comparison:''};
 case'x-rectangle':return {w:t.w,h:t.h,total:null,perimeter:null,unit:'',borderUnit:''};
 case'x-pond':return {tiles:[],total:null,unit:''};
 case'x-solid':return {mode:'faces',marks:{faces:[],edges:[],vertices:[]},counts:{faces:null,edges:null,vertices:null}};
 case'x-net':return {cells:t.preset?structuredClone(t.preset):[],guess:null,pair:[null,null],fold:0,runs:[],counts:{faces:null,edges:null,vertices:null},why:'',reason:''};
 case'x-attributes':return {mode:keys(t)[0],measured:[],choices:Object.fromEntries(keys(t).map(k=>[k,null]))};
 case'x-measure':return {tool:'',unit:'',zero:0,amount:0,reading:null};
 case'x-capacity':return {guess:null,prediction:null,poured:0,total:null,contents:null};
}}
export function valid(t,m){switch(t.type){
 case'x-floor':return int(m.w,1,12)&&int(m.h,1,12)&&(!t.draw?m.w===t.w&&m.h===t.h:true)&&int(m.cols,1,12)&&int(m.rows,1,12)&&ids(m.tiles,m.cols*m.rows)&&['total','rowsWritten','columnsWritten'].every(k=>num(m[k]))&&['','cm²','m²','cm','m'].includes(m.unit)&&['','more','less','equal'].includes(m.comparison);
 case'x-rectangle':return Number.isFinite(m.w)&&m.w>=.5&&m.w<=12&&Number.isFinite(m.h)&&m.h>=.5&&m.h<=12&&(!t.draw?m.w===t.w&&m.h===t.h:true)&&(!t.fixedW||m.w===t.fixedW)&&num(m.total)&&num(m.perimeter)&&['','cm²','m²','cm','m'].includes(m.unit)&&['','cm²','m²','cm','m'].includes(m.borderUnit);
 case'x-pond':return ids(m.tiles,t.w*t.h)&&num(m.total)&&['','cm²','cm'].includes(m.unit);
 case'x-solid':{const s=solid(t.shape);return ['faces','edges','vertices'].includes(m.mode)&&m.marks&&m.counts&&['faces','edges','vertices'].every(k=>ids(m.marks[k],s[k].length)&&num(m.counts[k]));}
 case'x-net':return coords(m.cells)&&[null,true,false].includes(m.guess)&&Array.isArray(m.pair)&&m.pair.length===2&&m.pair.every(x=>x===null||int(x,0,24))&&int(m.fold,0,100)&&Array.isArray(m.runs)&&m.runs.length<=100&&m.runs.every(r=>coords(r.cells)&&typeof r.guess==='boolean'&&Array.isArray(r.pair)&&r.pair.length===2&&r.pair.every(x=>x===null||int(x,0,24))&&txt(r.why))&&m.counts&&['faces','edges','vertices'].every(k=>num(m.counts[k]))&&txt(m.why)&&['','overlap','few','six'].includes(m.reason)&&(!t.preset||same(m.cells,t.preset));
 case'x-attributes':return keys(t).includes(m.mode)&&Array.isArray(m.measured)&&new Set(m.measured).size===m.measured.length&&m.measured.every(k=>keys(t).includes(k))&&m.choices&&keys(t).every(k=>m.choices[k]===null||int(m.choices[k],0,1));
 case'x-measure':return ['','length','mass','capacity'].includes(m.tool)&&['','cm','m','g','kg','mL','L'].includes(m.unit)&&int(m.zero,0,10)&&int(m.amount,0,2000)&&num(m.reading);
 case'x-capacity':return num(m.guess)&&num(m.prediction)&&int(m.poured,0,t.capacity)&&m.poured%t.step===0&&num(m.total)&&num(m.contents);
 default:return false;}}
export function inspect(t,m){let correct=false,feedback='';switch(t.type){
 case'x-floor':{const target=floorCells(t,m),factor=t.factors||t.partition;correct=m.cols===m.w&&m.rows===m.h&&m.tiles.length===target.length&&target.every(i=>m.tiles.includes(i))&&m.total===target.length&&m.unit===t.unit&&(!factor||m.rowsWritten===m.h&&m.columnsWritten===m.w)&&(!t.compare||m.comparison===(target.length>t.compare?'more':target.length<t.compare?'less':'equal'));feedback=m.cols!==m.w||m.rows!==m.h?'让每个小格的边长都为 1，横着和竖着要用同样大小的单位。':m.tiles.length!==target.length||!target.every(i=>m.tiles.includes(i))?'里面要铺满，缺口外不要铺；每块位置只算一次。':'把铺的方片数、每行数量和单位对应起来。面积用平方单位。';break;}
 case'x-rectangle':correct=(!t.targetArea||Math.abs(m.w*m.h-t.targetArea)<1e-8)&&m.total===m.w*m.h&&m.unit===t.unit+'²'&&(!t.perimeter||m.perimeter===2*(m.w+m.h)&&m.borderUnit===t.unit);feedback=t.targetArea&&m.w*m.h!==t.targetArea?'改变长宽，让里面的面积满足要求。不要用周围一圈的长度代替。':'一行乘行数给铺地面积；四条边相加给围边长度，单位也不同。';break;
 case'x-pond':{const target=pondCells(t).flatMap((a,i)=>a>=.5-1e-9?[i]:[]);correct=m.tiles.length===target.length&&target.every(i=>m.tiles.includes(i))&&m.total===target.length&&m.unit==='cm²';feedback='按同一个约定检查每格：至少覆盖一半才算一格。这是估计，不把所有碰到水的格子都算满。';break;}
 case'x-solid':{const s=solid(t.shape);correct=['faces','edges','vertices'].every(k=>m.marks[k].length===s[k].length&&m.counts[k]===s[k].length);feedback='先分清面、两面相接的线和角点，再转到背后。每个只标记一次，记录与标记相符。';break;}
 case'x-net':{const last=m.runs.at(-1),f=foldedNet(m.cells);correct=!!last&&same(last.cells,m.cells)&&m.fold===100&&last.guess===f.valid&&(f.valid?f.opposite.some(p=>same([...last.pair].sort((a,b)=>a-b),p))&&m.counts.faces===6&&m.counts.edges===12&&m.counts.vertices===8:m.reason==='overlap');feedback=!last?'先画好或看清纸片，留下预测，再合起来试。':last.guess!==f.valid?'预测与合起来的结果不一致。看看是否有两面落到同一处，摊开后可以重试。':f.valid?'检查哪两面相对，再数合拢后的面、接缝和角点。':'六格并不够：折到同一位置的面会重叠，另一些方向没有面。';break;}
 case'x-attributes':correct=keys(t).every(k=>m.measured.includes(k)&&m.choices[k]===(t.items[0][k]>t.items[1][k]?0:1));feedback='让工具显示实际结果，再分别比较。高矮、轻重和能装多少，不一定是同一个物体胜出。';break;
 case'x-measure':correct=m.tool===t.attribute&&m.unit===t.unit&&m.reading===t.value&&(t.attribute==='length'?m.zero===t.start:m.amount===t.value);feedback=m.tool!==t.attribute?'这件工具测的是另一种量。先看要问长短、轻重，还是水量。':t.attribute==='length'&&m.zero!==t.start?'把尺的零刻度对准物体起点，而不是直接读物体右边的位置。':'让工具完成测量，再读刻度并选对单位。质量平衡时，两边一样重。';break;
 case'x-capacity':correct=m.prediction!==null&&m.poured===(t.targetFill??t.capacity)&&m.total===t.capacity&&m.contents===m.poured;feedback=m.prediction===null?'先记下估计，再倒水核对。估计不用刚好。':t.targetFill&&m.poured!==t.targetFill?'把水量调到要求的位置。壶没装满时，能装满的量仍然没有变。':'分别写装满时的量与目前水量。1 L 是 1000 mL，不要把半壶水当成半个容量。';break;
}return {correct,code:correct?'correct':t.type,feedback:correct?'作品与记录对应上了。换个对象，继续看看。':feedback};}
export function example(t){const m=initial(t);switch(t.type){
 case'x-floor':m.cols=m.w;m.rows=m.h;m.tiles=floorCells(t,m);m.total=m.tiles.length;m.rowsWritten=m.h;m.columnsWritten=m.w;m.unit=t.unit;m.comparison=m.total>t.compare?'more':m.total<t.compare?'less':'equal';break;
 case'x-rectangle':if(t.targetArea)m.h=t.targetArea/m.w;if(m.h>12){m.w=6;m.h=t.targetArea/6;}m.total=m.w*m.h;m.perimeter=2*(m.w+m.h);m.unit=t.unit+'²';m.borderUnit=t.unit;break;
 case'x-pond':m.tiles=pondCells(t).flatMap((a,i)=>a>=.5-1e-9?[i]:[]);m.total=m.tiles.length;m.unit='cm²';break;
 case'x-solid':{const s=solid(t.shape);for(const k of ['faces','edges','vertices']){m.marks[k]=s[k].map((_,i)=>i);m.counts[k]=s[k].length;}break;}
 case'x-net':m.cells=t.preset?structuredClone(t.preset):structuredClone(NETS.cross);m.guess=foldedNet(m.cells).valid;m.pair=foldedNet(m.cells).opposite[0]||[0,1];m.runs.push({cells:structuredClone(m.cells),guess:m.guess,pair:[...m.pair],why:''});m.fold=100;m.counts={faces:6,edges:12,vertices:8};m.reason='overlap';break;
 case'x-attributes':m.measured=keys(t);for(const k of keys(t))m.choices[k]=t.items[0][k]>t.items[1][k]?0:1;break;
 case'x-measure':Object.assign(m,{tool:t.attribute,unit:t.unit,reading:t.value,zero:t.start||0,amount:t.value});break;
 case'x-capacity':Object.assign(m,{guess:t.capacity,prediction:t.capacity,poured:t.targetFill??t.capacity,total:t.capacity,contents:t.targetFill??t.capacity});break;
}return m;}
export function act(t,m,action,d){const toggle=(a,i)=>{const p=a.indexOf(i);if(p<0)a.push(i);else a.splice(p,1);};switch(action){
 case'tile':toggle(m.tiles,+d.index);break;
 case'row':{const target=floorCells(t,m),row=Array.from({length:m.rows},(_,i)=>i).find(y=>Array.from({length:m.cols},(_,x)=>y*m.cols+x).some(i=>target.includes(i)&&!m.tiles.includes(i)));if(row!==undefined)for(let x=0;x<m.cols;x++){const i=row*m.cols+x;if(target.includes(i)&&!m.tiles.includes(i))m.tiles.push(i);}break;}
 case'clear-tiles':m.tiles=[];break;
 case'solid-mode':m.mode=d.value;break;
 case'solid-mark':toggle(m.marks[m.mode],+d.index);break;
 case'net-cell':if(m.fold===0&&!t.preset){const p=[+d.col,+d.row],i=m.cells.findIndex(v=>same(v,p));if(i<0){if(m.cells.length<6)m.cells.push(p);}else m.cells.splice(i,1);m.guess=null;m.pair=[null,null];}break;
 case'guess':if(m.fold===0)m.guess=d.value==='true';break;
 case'fold':if(m.guess!==null&&m.cells.length===6){m.runs.push({cells:structuredClone(m.cells),guess:m.guess,pair:[...m.pair],why:m.why});m.fold=100;}break;
 case'unfold':m.fold=0;m.guess=null;break;
 case'measure-mode':m.mode=d.value;break;
 case'measure-both':if(!m.measured.includes(m.mode))m.measured.push(m.mode);break;
 case'compare-choice':m.choices[m.mode]=+d.index;break;
 case'tool':m.tool=d.value;break;
 case'weight':m.amount=Math.max(0,Math.min(2000,m.amount+ +d.delta));break;
 case'pour-measure':m.amount=t.value;break;
 case'estimate':if(m.guess!==null&&m.prediction===null)m.prediction=m.guess;break;
 case'pour':if(m.prediction!==null)m.poured=Math.max(0,Math.min(t.capacity,m.poured+Number(d.delta)*t.step));break;
}}
