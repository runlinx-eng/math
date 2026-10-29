import {EXTRA_TASKS,EXTRA_PRACTICE} from './phase4/catalog.js';
import {isExtra,initialExtra,validExtra,inspectExtra,exampleExtra} from './phase4/engine.js';
import {scorePlan} from './cube-tasks.js';
import {LESSONS} from './catalog.js';
import {inspect as inspectLegacy} from '../exploration-content.js';
const p=(n,d,shape='bar')=>({type:'partition',n,d,shape,prompt:`把这一整块平均分成 ${d} 份，取出 ${n} 份。`});
const g=(n,d)=>({type:'grid',n,d,prompt:`用百格表示 ${n}/${d}，再写出同一个量的小数。`});
const line=(n,d,den)=>({type:'line',n,d,den,prompt:`在下面的 ${den} 等分线上，找到和 ${n}/${d} 同一个位置。`});
const cube=(dims,prompt,type='cube-plan')=>({type,dims,prompt});
const data=(type,labels,counts,prompt,extra={})=>({type,labels,counts,prompt,...extra});
export const TASKS={
 share:[p(1,5),p(3,4,'square'),p(2,6)],
 equivalent:[{type:'equivalent',n:1,d:2,denominators:[4,6,8],prompt:'把三条纸带都涂到一半。切法不同，拿到的量要一样。'},line(2,3,6),line(2,3,9)],
 decimal:[g(7,10),g(45,100),{...g(26,100),prompt:'把 0.26 变回百格里的量，再写成百分之几。',reverse:true},line(3,10,100)],
 quarters:[g(1,4),{type:'match',prompt:'给三个直筒杯倒入指定的量，再为它们配上小数名字。',fractions:[[1,2],[3,4],[1,4]]}],
 space:[{...cube([2,2,2],'把盒子填满。每块边长 1 cm，然后记录里面装了多少。','fill'),measure:'inside'},
   {type:'unit',dims:[3,2,1],prompt:'先点选合适的小单位：铺表面和填内部各需要什么？再数填满这个模型的块数。'}],
 hidden:[{...cube([3,2,2],'搭满这个盒子，再用一层和层数说清你的计数方案。'),build:true},{...cube([3,3,3],'这是一幅固定视角的图。正中间也藏着积木，把它一起算进去。'),staticView:true},{...cube([4,2,2],'换成长一点的盒子。先写下估计，再填满核对。'),build:true,estimate:true}],
 box:[cube([4,3,5],'长 4、宽 3、高 5。用一层和层数，把整箱的块数联系起来。'),
   {...cube([4,3,5],'另一箱少了两个角上的方块。和完整的 60 块比，怎样求它的数量？','irregular'),missing:[[3,4,2],[0,4,2]]}],
 steps:[{type:'decompose',dims:[4,2,3],stepWidth:2,prompt:'把台阶切成两个长方体，数出两部分再合起来。'},
   {type:'decompose',dims:[5,2,3],stepWidth:2,prompt:'为这个新台阶准备填充积木。自己选一个不漏、不重叠的切法。'}],
 tally:[data('chart',['猫','狗','兔'],[6,3,2],'读这些投票卡，在右边为每类记下票数。',{view:'tally',source:'cards',target:1}),
   data('chart',['跳绳','球类','跑步'],[4,6,3],'换成运动投票：一颗圆点代表一票，把图画出来。',{view:'picture',source:'tally',target:0}),
   data('chart',['红','黄','蓝'],[3,5,2],'把列表变成一格一票的块状图。',{view:'block',source:'list',target:2})],
 survey:[data('survey',['走路','公交','骑车'],[4,3,2],'观察这组模拟到校记录，再回答：哪种方式最多？',{question:'大家怎样来上学？',order:[1,0,2,0,1,0,2,1,0]}),
   data('survey',['0 人','1 人','2 人','3 人'],[2,4,3,1],'换个问题：兄弟姐妹人数最常见的是多少？把每个回答录入两列表格。',{question:'兄弟姐妹有几人？',order:[1,2,0,1,3,2,1,0,2,1]})],
 bars:[data('chart',['猫','狗','兔','鱼'],[7,4,2,3],'从表格搭出条形图，再找出猫比狗多的那一段。',{view:'bar',source:'table',difference:[0,1],axes:true}),
   data('chart',['苹果','梨','橙子','桃'],[3,5,8,2],'换一组水果投票：用一果一票的图表示，再比较橙子和苹果。',{view:'picture',source:'table',difference:[2,0]})],
 views:[data('compare',['猫','狗','兔'],[5,3,2],'让右边的图和左边的表说同一件事，再分别读出狗的票数。',{view:'picture',source:'tally',target:1}),
   data('compare',['公交','步行','自行车'],[3,6,4],'换一份记录：修好图里的数量，比较两种画法。',{view:'block',source:'list',target:2})],
};
export const PRACTICE={
 share:{...p(1,3),prompt:'移动分割线，再点选一块。怎样让每一块一样大？'},
 equivalent:{type:'equivalent',n:1,d:2,denominators:[2,4,6],prompt:'给同一个“半份”换三种分法。观察涂色的长度。'},
 decimal:{...g(3,10),prompt:'点涂格子。十格和一格，分别把小数改变多少？'},
 quarters:{...g(1,2),prompt:'先把百格涂到一半。再试试一半的一半。'},
 space:{...cube([3,2,1],'把一层填满，再转动看里面。','fill')},
 hidden:cube([3,2,3],'转动，拉开每一层。有没有被挡住的小方块？'),
 box:cube([3,2,2],'试试拆层：一层几块，有几层，合起来多少？'),
 steps:{type:'decompose',dims:[3,2,2],stepWidth:1,prompt:'移动切面，把台阶拉成两块。换个方向切，总量会变吗？'},
 tally:data('chart',['红','蓝','绿'],[3,2,4],'点加减把记录变成图。切换画法，看看什么没变。',{view:'tally',source:'cards',target:0}),
 survey:data('survey',['走路','公交','骑车'],[2,1,1],'先观察一位，再把这一票记到对应的类别。',{question:'怎样来上学？',order:[0,2,1,0]}),
 bars:data('chart',['猫','狗','兔'],[4,2,3],'拖动一根柱子，把票数搭成高度。',{view:'bar',source:'cards',difference:[0,1],axes:true}),
 views:data('compare',['猫','狗','兔'],[4,2,3],'把同一份票数换几种画法。每一类的数量应保持。',{view:'picture',source:'tally',target:0}),
};
Object.assign(TASKS,EXTRA_TASKS);Object.assign(PRACTICE,EXTRA_PRACTICE);
export function voxels(t){const [w,d,h]=t.dims,missing=new Set((t.missing||[]).map(v=>v.join(','))),out=[];for(let y=0;y<h;y++)for(let z=0;z<d;z++)for(let x=0;x<w;x++){if(t.type==='decompose'&&x>=t.stepWidth&&y>0)continue;if(!missing.has([x,y,z].join(',')))out.push([x,y,z]);}return out;}
export function splitVolumes(t,axis,cut){const k={x:0,y:1,z:2}[axis],cells=voxels(t),parts=[cells.filter(v=>v[k]<cut),cells.filter(v=>v[k]>=cut)];return parts.map(p=>{if(!p.length)return {count:0,box:false};const sizes=[0,1,2].map(i=>Math.max(...p.map(v=>v[i]))-Math.min(...p.map(v=>v[i]))+1);return {count:p.length,box:sizes.reduce((a,b)=>a*b,1)===p.length,sizes};});}
export function defaultModel(t){if(isExtra(t))return initialExtra(t);switch(t.type){
 case 'partition':return {cuts:Array.from({length:t.d-1},(_,i)=>Math.round((i+1)*100/t.d)+(i===0?4:0)),selected:[]};
 case 'equivalent':return {rows:t.denominators.map(d=>({n:0,d}))};
 case 'grid':return {selected:[],decimal:'',fraction:''};
 case 'line':return {mark:0};
 case 'match':return {heights:t.fractions.map(()=>0),names:t.fractions.map(()=>'')};
 case 'fill':return {filled:[],total:null};
 case 'unit':return {surface:'',inside:'',total:null};
 case 'cube-plan':return {perLayer:null,layers:null,total:null,estimate:null,...(t.build?{filled:[]}: {})};
 case 'irregular':return {total:null,method:''};
 case 'decompose':return {axis:'y',cut:1,first:null,second:null,total:null};
 case 'chart':return {counts:t.labels.map(()=>0),answer:null,xLabel:'',yLabel:''};
 case 'survey':return {seen:0,counts:t.labels.map(()=>0),choice:null};
 case 'compare':return {counts:t.labels.map(()=>0),left:null,right:null,preferred:'',reason:''};
 default:throw new Error('未知教具');}}
const integer=(v,a,b)=>Number.isInteger(v)&&v>=a&&v<=b;
const number=v=>v===null||integer(v,0,999);
const text=(v,max=40)=>typeof v==='string'&&v.length<=max;
const indices=(a,n)=>Array.isArray(a)&&new Set(a).size===a.length&&a.every(v=>integer(v,0,n-1));
export function validModel(t,m){if(!m||typeof m!=='object'||Array.isArray(m))return false;if(isExtra(t))return validExtra(t,m);switch(t.type){
 case 'partition':return indices(m.selected,t.d)&&Array.isArray(m.cuts)&&m.cuts.length===t.d-1&&m.cuts.every((v,i)=>Number.isFinite(v)&&v>0&&v<100&&(i===0||v>m.cuts[i-1]));
 case 'equivalent':return Array.isArray(m.rows)&&m.rows.length===t.denominators.length&&m.rows.every((r,i)=>r.d===t.denominators[i]&&integer(r.n,0,r.d));
 case 'grid':return indices(m.selected,100)&&text(m.decimal)&&text(m.fraction);
 case 'line':return integer(m.mark,0,t.den);
 case 'match':return Array.isArray(m.heights)&&Array.isArray(m.names)&&m.heights.length===t.fractions.length&&m.names.length===t.fractions.length&&m.heights.every(v=>integer(v,0,100))&&m.names.every(v=>text(v));
 case 'fill':return indices(m.filled,voxels(t).length)&&number(m.total);
 case 'unit':return ['','square','cube'].includes(m.surface)&&['','square','cube'].includes(m.inside)&&number(m.total);
 case 'cube-plan':return ['perLayer','layers','total','estimate'].every(k=>number(m[k]))&&(!t.build||indices(m.filled||[],voxels(t).length))&&(m.shape===undefined||Array.isArray(m.shape)&&m.shape.length===3&&m.shape.every(v=>integer(v,1,5)));
 case 'irregular':return number(m.total)&&['','formula','count'].includes(m.method);
 case 'decompose':return ['x','y','z'].includes(m.axis)&&integer(m.cut,1,Math.max(...t.dims)-1)&&['first','second','total'].every(k=>number(m[k]));
 case 'chart':return countsValid(t,m)&&number(m.answer)&&['','category','count'].includes(m.xLabel)&&['','category','count'].includes(m.yLabel);
 case 'survey':return countsValid(t,m)&&integer(m.seen,0,t.order.length)&&(m.choice===null||integer(m.choice,0,t.labels.length-1));
 case 'compare':return countsValid(t,m)&&number(m.left)&&number(m.right)&&['','table','picture','bar','list'].includes(m.preferred)&&text(m.reason,2000);
 default:return false;}}
function countsValid(t,m){return Array.isArray(m.counts)&&m.counts.length===t.labels.length&&m.counts.every(v=>integer(v,0,20));}
function decimalValue(s){return /^\s*(?:0?(?:\.\d{1,3})|\d+(?:\.\d{1,3})?)\s*$/.test(s)?Number(s):NaN;}
const equal=(a,b)=>Math.abs(a-b)<1e-9;
export function inspect(t,m){if(!validModel(t,m))return {correct:false,code:'invalid',feedback:'这个记录不完整，先把当前操作补好。'};if(isExtra(t))return inspectExtra(t,m);let correct=false,feedback='',code=t.type;
 switch(t.type){
 case 'partition':{const result=inspectLegacy(t,m);return {...result,feedback:result.correct?'每一份一样大，取的份数也对应上了。':result.feedback};}
 case 'equivalent':correct=m.rows.every(r=>r.n*t.d===t.n*r.d);feedback='同一个整体上，把涂色的末端对齐。切得更细时，涂色的小份数也要一起改变。';break;
 case 'grid':correct=m.selected.length*t.d===t.n*100&&equal(decimalValue(m.decimal),t.n/t.d)&&(!t.reverse||/^\s*26\s*\/\s*100\s*$/.test(m.fraction));feedback=m.selected.length*t.d!==t.n*100?'先看整个百格有多少格，再看要取它的多少。':'格子对应上了。小数点后第一位是十分之几，第二位是百分之几；需要时用 0 占位。';break;
 case 'line':correct=m.mark*t.d===t.n*t.den;feedback='上下两条线是同一个整体，找涂色末端正下方的那一点。';break;
 case 'match':correct=t.fractions.every(([n,d],i)=>m.heights[i]*d===n*100&&equal(decimalValue(m.names[i]),n/d));feedback='满杯都表示 1。先找到一半，再看四分之一和四分之三的位置，小数名字也要一起对应。';break;
 case 'fill':correct=m.filled.length===voxels(t).length&&m.total===voxels(t).length;feedback=m.filled.length!==voxels(t).length?'盒子里还有空位。把空间填满，背后也不要漏。':'用装进去的小方块来数，别把外面的面也重复算进去。';break;
 case 'unit':correct=m.surface==='square'&&m.inside==='cube'&&m.total===voxels(t).length;feedback='小方片用来铺表面，小方块用来填空间。记录的是填空间的块数。';break;
 case 'cube-plan':correct=scorePlan(t.dims,m)&&(!t.estimate||m.estimate!==null)&&(!t.build||m.filled?.length===voxels(t).length);feedback=t.build&&m.filled?.length!==voxels(t).length?'把盒子填满，检查背面和里面的空位，再用实际放进去的块数核对。':'先数完整一层，再数相同的层有几层。三个数要能组成同一份计划，不能只凑对总数。';break;
 case 'irregular':correct=m.total===voxels(t).length&&m.method==='count';feedback='完整长方体的三个边长包括了空出来的位置。这次需要数实际积木，或从整箱扣掉缺块。';break;
 case 'decompose':{const parts=splitVolumes(t,m.axis,m.cut);correct=parts.every(p=>p.box)&&m.first===parts[0].count&&m.second===parts[1].count&&m.total===voxels(t).length;feedback=!parts.every(p=>p.box)?'这次切出的两块还不是完整长方体。试试另一个位置或方向。':'分别看清两部分的长、宽、高；相加时，每个小方块只能出现一次。';break;}
 case 'chart':correct=m.counts.every((n,i)=>n===t.counts[i])&&m.answer===(t.difference?t.counts[t.difference[0]]-t.counts[t.difference[1]]:t.counts[t.target])&&(!t.axes||(m.xLabel==='category'&&m.yLabel==='count'));feedback=!m.counts.every((n,i)=>n===t.counts[i])?'逐类核对原始记录。每格从同一个零点起，一格只代表一票。':t.axes&&(m.xLabel!=='category'||m.yLabel!=='count')?'横着区分不同类别，竖着记录每类的票数。':t.difference?'“多多少”看两条顶部的差，别把较高那条全算进去。':'从图里按类别再读一次票数，图和记录应该说同一个数。';break;
 case 'survey':correct=m.seen===t.order.length&&m.counts.every((n,i)=>n===t.counts[i])&&m.choice===t.counts.indexOf(Math.max(...t.counts));feedback=m.seen<t.order.length?'还没有观察完。继续看下一条，每条只记录一次。':'逐条复查：有没有漏记或重复？最后根据记录选择出现最多的一类。';break;
 case 'compare':correct=m.counts.every((n,i)=>n===t.counts[i])&&m.left===t.counts[t.target]&&m.right===t.counts[t.target]&&!!m.preferred;feedback='同一类在两张图里应有相同数量。先修好图，再分别读出对应的数。喜欢哪种画法没有唯一答案。';break;
 }
 return {correct,code:correct?'correct':code,feedback:correct?(t.estimate?`你估计 ${m.estimate} 块，实际 ${voxels(t).length} 块，相差 ${Math.abs(m.estimate-voxels(t).length)} 块。估计可以不同，最后用填充的数量核对。`:'对应上了。换个条件，再看看这个方法是否还管用。'):feedback};}
export const taskFor=(id,index)=>index===-1?PRACTICE[id]:TASKS[id]?.[index];
export function exampleModel(t){if(isExtra(t))return exampleExtra(t);const m=defaultModel(t);switch(t.type){
 case 'partition':m.cuts=Array.from({length:t.d-1},(_,i)=>(i+1)*100/t.d);m.selected=Array.from({length:t.n},(_,i)=>i);break;
 case 'equivalent':m.rows=m.rows.map(r=>({...r,n:t.n*r.d/t.d}));break;
 case 'grid':m.selected=Array.from({length:t.n*100/t.d},(_,i)=>i);m.decimal=String(t.n/t.d);m.fraction='26/100';break;
 case 'line':m.mark=t.n*t.den/t.d;break;
 case 'match':m.heights=t.fractions.map(([n,d])=>n*100/d);m.names=t.fractions.map(([n,d])=>String(n/d));break;
 case 'fill':m.filled=voxels(t).map((_,i)=>i);m.total=m.filled.length;break;
 case 'unit':Object.assign(m,{surface:'square',inside:'cube',total:voxels(t).length});break;
 case 'cube-plan':Object.assign(m,{perLayer:t.dims[0]*t.dims[1],layers:t.dims[2],total:voxels(t).length,estimate:voxels(t).length,...(t.build?{filled:voxels(t).map((_,i)=>i)}:{})});break;
 case 'irregular':Object.assign(m,{total:voxels(t).length,method:'count'});break;
 case 'decompose':{const parts=splitVolumes(t,'y',1);Object.assign(m,{axis:'y',cut:1,first:parts[0].count,second:parts[1].count,total:voxels(t).length});break;}
 case 'chart':Object.assign(m,{counts:[...t.counts],answer:t.difference?t.counts[t.difference[0]]-t.counts[t.difference[1]]:t.counts[t.target],xLabel:'category',yLabel:'count'});break;
 case 'survey':Object.assign(m,{seen:t.order.length,counts:[...t.counts],choice:t.counts.indexOf(Math.max(...t.counts))});break;
 case 'compare':Object.assign(m,{counts:[...t.counts],left:t.counts[t.target],right:t.counts[t.target],preferred:'bar'});break;
 }return m;}
// Test data and worked examples are ordinary local learning material, not a grading service.
export function topicCoverage(){return Object.fromEntries(Object.entries(LESSONS).map(([id,n])=>[n.topicId,{lessonId:id,taskCount:TASKS[id].length}]));}
