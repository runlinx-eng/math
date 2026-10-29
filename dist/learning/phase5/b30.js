import {rectangle} from './b30-geometry.js';
import {TASKS as T02} from '../phase4/b02.js';
import {TASKS as T14} from './b14.js';
import {TASKS as T16} from './b16.js';
import {TASKS as T18} from './b18.js';
import {TASKS as T23} from './b23.js';
import {TASKS as T28} from './b28.js';
import {TASKS as T29} from './b29.js';
const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B30'});
export const LESSONS={
 gridarea:item('mt_6xNmQLzuqm','里面铺了多少','单位正方形与面积','一块边长为 1 的正方形占 1 个平方单位。相同方片不重叠、不留空地铺满，块数就是面积；沿外边走一圈是另一种量。','相同的 12 块方片换个形状，里面的量和外边的长度都一定不变吗？'),
 areadistrib:item('mt_AQo4u7O4sM','一块拆成两块，还是这么多','面积模型与乘法分配律','同一块长方形可以切成两块：3×(4+2)=3×4+3×2。切开后每块都保留同一条高，不能只给其中一块乘高。','把 13 拆成 10 和 3，为什么两块都要乘 6？'),
 walkperim:item('mt_wE7-Gs9ENL','沿着外边走一圈','周长与边长之和','周长是沿图形外边走完一圈的长度，单位是厘米或米。面积是里面有多少方片，单位是平方厘米或平方米。','沿边走过的长度为什么不按里面的方片数记录？'),
 polyperim:item('mt_WtcFrxGOgw','一圈已知，藏着哪条边','多边形周长与未知边','周长是各外边长度的和。整圈已知时，先减去已知的各边，就能找到剩下的一条。相同周长可以围出面积不同的长方形。','围边都长 24 厘米，为什么不一定铺出同样大的地？'),
 lperim:item('mt_n0AlyLQwC9','拐个弯，还是沿外边','组合直边图形的周长','沿所有外边走，转弯处也不能漏；内部的分界不是外边。缺少的直边可以由对应的总长减去已知部分得到。','拆图时画出的那条线，什么时候不能加进周长？'),
 areaPerim:item('mt_MJZA90uc6H','一样大，外边一定一样长吗','面积与周长的关系','面积相同的长方形可以一个细长、一个更接近正方形，周长不同；周长相同也可以围出不同面积。不能只由其中一个量断定另一个。','4×6 和 2×12 都是 24 平方厘米，为什么围边不同？'),
 rectsplit:item('mt_eMtV6tBSJm','把不规则地面拆成几块','组合直边图形的面积','把图形拆成不重叠、不遗漏的长方形，各块面积可以相加。切法不止一种，合起来仍要刚好覆盖原来的范围。','为什么两块重叠时，直接加面积会多算？'),
 triArea:item('mt_ML5t7n2-U8','斜着的，也能移回长方形吗','三角形与平行四边形的面积','平行四边形可把一端三角形移到另一端，得到同底同高的长方形；两个全等三角形可拼成平行四边形。高度必须垂直于底，可能落在图形外。','为什么斜边长不能直接代替垂直高度？'),
 polyArea:item('mt_i2-QaXbyzB','不熟悉的形状，拆开看','多边形面积的分解与补形','可以拆成互不重叠的长方形和三角形相加，也可以放进外框后减去外面的角。每部分用自己的底和垂直高度，不能漏掉或重复。','同一个梯形，分成三块和补成大长方形，会得到不同面积吗？'),
 circleArea:item('mt_svFa6_mjO_','圆边和圆里面，怎样量','圆周长、圆面积与组合图形','直径穿过圆心，是半径的两倍。圆周长是 π×直径，面积是 π×半径×半径。使用 3.14 代替 π 时结果是近似值；组合图形内部接缝不算外边。','两个半圆合起来时，为什么中间直线不属于整个图形的外边？'),
 prismFormulas:item('mt_tAJH5BrpOx','一层的形状，怎样堆成里面','梯形面积与棱柱、圆柱体积','梯形可以拆成三角形与长方形，也可以用两条平行边的平均长度乘高。直棱柱的体积是底面积乘垂直长度；圆柱也可用圆的底面积乘高。','三角形底面和圆形底面不同，为什么都要看一层有多大？'),
 netSurface:item('mt_tegkuJA5gM','把盒子的外面摊开','展开图与表面积','立体外表由多个面组成；把各面的面积相加得到表面积。开放的盒子少了上盖；表面积用平方单位，装满里面的体积用立方单位。','一张纸包住外面和小方块填满里面，为什么单位不同？'),
 solidSurface:item('mt_Sij9ByyHq6','接起来，哪些面藏进去了','棱柱与组合立体的表面积和体积','直棱柱体积是底面积乘长；外面包括两个底和侧面。两块立体贴合后，接触的两块面藏在里面，要从分开时的表面积中减去；体积按不重叠的两块相加。','两块贴在一起时，体积为什么相加，表面积却不能直接相加？')
};
export const SECTIONS=[{id:'area-cover',title:'铺里面，拆成几块'},{id:'area-border',title:'沿外边走一圈'},{id:'area-solids',title:'包外面，装里面'}];
const route=(id,section,title,ids)=>({id,section,title,ids,packIds:['area'],themeId:'measure',color:'#568b64'});
export const ROUTES=[route('FV','area-cover','方片和两块长方形',['gridarea','areadistrib']),route('FW','area-border','从一圈找到一条边',['walkperim','polyperim']),route('FX','area-border','拐弯与不同的围法',['lperim','areaPerim']),route('FY','area-cover','拆地面，移动斜边',['rectsplit','triArea']),route('FZ','area-cover','陌生形状和圆',['polyArea','circleArea']),route('GA','area-solids','一层、外面和里面',['prismFormulas','netSurface','solidSurface'])];
const clone=x=>structuredClone(x),q=(label,value,options)=>({label,value,...(options?{options}:{})}),ch=(label,value,options)=>q(label,value,options);
const grid=(prompt,w,h,cells,mode,extra={})=>({type:'x-a30-grid',prompt,w,h,cells,mode,unit:'cm',...extra});
const full=(w,h)=>rectangle(0,0,w,h);
const compare=(prompt,rule,target,example,extra={})=>({type:'x-a30-compare',prompt,rule,target,example,...extra});
const pieces=(prompt,pieces,extra={})=>({type:'x-a30-pieces',prompt,pieces,unit:'cm',...extra});
const P=(name,points)=>({name,points}),V=points=>points.map(points=>({points}));
const rectangleNet=(w,d,h)=>{
 const R=(i,x,y,a,b)=>({index:i,points:[[x,y],[x+a,y],[x+a,y+b],[x,y+b]]});
 return[R(0,d,d,w,h),R(1,d,2*d+h,w,h),R(2,0,d,d,h),R(3,d+w,d,d,h),R(4,d,0,w,d),R(5,d,d+h,w,d)];
};
const box=(prompt,w,d,h,extra={})=>{const faces=[['前面',`${w}×${h}`,w*h],['后面',`${w}×${h}`,w*h],['左面',`${d}×${h}`,d*h],['右面',`${d}×${h}`,d*h],['上面',`${w}×${d}`,w*d],['底面',`${w}×${d}`,w*d]].map(([name,dims,area])=>({name,dims,area})),requiredFaces=extra.openTop?[0,1,2,3,5]:[0,1,2,3,4,5];return{type:'x-a30-solid',kind:'box',prompt,size:[w,d,h],unit:'cm',faces,net:rectangleNet(w,d,h),requiredFaces,surface:requiredFaces.reduce((s,i)=>s+faces[i].area,0),...extra};};
const pyramid=(prompt)=>{const faces=[{name:'正方形底',dims:'6×6',area:36},...['三角面一','三角面二','三角面三','三角面四'].map(name=>({name,dims:'底6，高5，除以2',area:15}))],net=[{index:0,points:[[5,5],[11,5],[11,11],[5,11]]},{index:1,points:[[5,5],[11,5],[8,0]]},{index:2,points:[[11,5],[11,11],[16,8]]},{index:3,points:[[11,11],[5,11],[8,16]]},{index:4,points:[[5,11],[5,5],[0,8]]}];return{type:'x-a30-solid',kind:'pyramid',prompt,size:[6,5],unit:'cm',faces,net,requiredFaces:[0,1,2,3,4],surface:96};};
const triPrism=(prompt,extra={})=>{const faces=[{name:'三角端一',dims:'3×4÷2',area:6},{name:'三角端二',dims:'3×4÷2',area:6},{name:'长侧一',dims:'4×10',area:40},{name:'长侧二',dims:'3×10',area:30},{name:'斜侧',dims:'5×10',area:50}],net=[{index:0,points:[[0,0],[4,0],[0,-3]]},{index:1,points:[[0,10],[4,10],[0,13]]},{index:2,points:[[0,0],[4,0],[4,10],[0,10]]},{index:3,points:[[4,0],[7,0],[7,10],[4,10]]},{index:4,points:[[7,0],[12,0],[12,10],[7,10]]}];return{type:'x-a30-solid',kind:'prism',prompt,size:[4,3,10],unit:'cm',faces,net,...extra};};
const circle=(prompt,r,extra={})=>({type:'x-a30-circle',kind:'circle',prompt,radius:r,unit:'cm',...extra});
const L1=[...rectangle(0,0,4,4),...rectangle(4,2,2,2)],L2=[...rectangle(0,0,3,5),...rectangle(3,0,2,4)],T=[...rectangle(0,0,6,2),...rectangle(2,2,2,3)];
const PARA=[[0,0],[8,0],[10,5],[2,5]],PARA_LEFT=[[0,0],[8,0],[8,5],[2,5]],PARA_TIP=[[8,0],[10,5],[8,5]],PARA_MOVED=[[0,0],[2,5],[0,5]];
const RIGHT=[[0,0],[6,0],[0,4]],RIGHT_COPY=[[6,0],[6,4],[0,4]],OBTUSE=[[3,0],[15,0],[18,7]],OBTUSE_COPY=[[15,0],[3,0],[0,-7]];
const trapezoid=()=>pieces('上边 6 cm、下边 10 cm、高 4 cm。把中间和两边分开，分别算后合起来。',[P('中间长方形',[[2,0],[8,0],[8,4],[2,4]]),P('左三角形',[[2,0],[2,4],[0,4]]),P('右三角形',[[8,0],[10,4],[8,4]])],{view:[-1,-1,12,7],labels:[{x:4,y:-.3,text:'上边 6'},{x:4,y:4.8,text:'下边 10'},{x:10.1,y:2,text:'高 4'}],questions:[q('（6＋10）×4÷2 是多少',32)]});
export const TASKS={
 gridarea:[grid('先铺满一块边长 1 cm 的方片，再写它的面积。',1,1,full(1,1),'tile'),grid('铺满这片 3 行、每行 4 格的地面，边缘也要算。',4,3,full(4,3),'tile'),grid('还是这片地，沿外边走一圈；面积和围边是两种量。',4,3,full(4,3),'edge',{questions:[q('里面有多少平方厘米',12)]})],
 areadistrib:[grid('3 行，每行分成 4 格和 2 格。用两块长方形铺满，再各算一块。',6,3,full(6,3),'partition',{exampleRects:[[0,15],[4,17]],partAreas:[12,6],questions:[q('3×4 这一块',12),q('3×2 这一块',6)]}),grid('6×13：把 13 分成 10 和 3，两块都保留 6 行。',13,6,full(13,6),'partition',{exampleRects:[[0,74],[10,77]],partAreas:[60,18],questions:[q('6×10',60),q('6×3',18)]}),grid('用两块表示 5×（7＋3），再把它们接回去。',10,5,full(10,5),'partition',{exampleRects:[[0,46],[7,49]],partAreas:[35,15],questions:[q('5×7',35),q('5×3',15)]})],
 walkperim:[grid('每格边长 1 cm。沿长方形的外边走完，再记一圈长度。',3,2,full(3,2),'edge'),grid('正方形每边 4 cm。沿四条边走完，看看总长。',4,4,full(4,4),'edge'),grid('换一片 5×2 的地，先走外边，再比较里面。',5,2,full(5,2),'edge',{questions:[q('里面多少平方厘米',10)]})],
 polyperim:[grid('长 8 cm、宽 5 cm。沿外边逐段走一圈。',8,5,full(8,5),'edge'),{type:'x-a30-outline',prompt:'五边形的一圈是 30 cm。先走过每条边，找问号代表的那条长度。',points:[[0,0],[10,0],[10,3],[6,6],[0,6]],unknown:2,answer:5,questionLabel:'未知边多长',unit:'cm'},compare('摆两个周长都是 24 cm 的长方形，让它们面积不同。','perimeter',24,[4,8,6,6])],
 lperim:[grid('沿 L 形外边走一圈，拐进去的边也要走。',6,4,L1,'edge',{questions:[q('横着的大段 6 中，另一段已知 4，缺的横段',2)]}),grid('换一块 L 形，内部的分界不要算进外圈。',5,5,L2,'edge'),grid('自己用至少两块搭一块连在一起的 L 形，让外边一圈是 40 cm。',10,10,full(10,10),'design',{target:40,exampleRects:[[0,49],[50,94]]})],
 areaPerim:[compare('摆两个面积都是 24 cm² 的长方形，让它们外边不一样长。','area',24,[3,8,4,6]),compare('摆两个周长都是 20 cm 的长方形，让里面面积不同。','perimeter',20,[2,8,5,5]),compare('再试 2×12 和 4×6：里面一样多，外边怎样？','area',24,[2,12,4,6],{questions:[ch('为什么外边不同','sides',[['sides','长和宽的和不同'],['area','面积相同就一定周长相同']])]})],
 rectsplit:[grid('把 L 形拆成长方形，刚好铺满，不要重叠。',6,4,L1,'partition',{exampleRects:[[0,21],[16,23]]}),grid('这块 T 形地面可以拆成顶部和下面两块。',6,5,T,'partition',{exampleRects:[[0,11],[14,27]]}),grid('房间由 3 m×5 m 和 2 m×4 m 两块相接。拆开并求总面积。',5,5,L2,'partition',{unit:'m',exampleRects:[[0,22],[3,19]],partAreas:[15,8],questions:[q('3×5 这一块',15),q('2×4 这一块',8)]})],
 triArea:[pieces('底 8 cm、高 5 cm。把右端的小三角形移到左边，再算平行四边形。',[P('原来的整块',PARA)],{transform:true,before:V([PARA_LEFT,PARA_TIP]),after:V([PARA_LEFT,PARA_MOVED]),view:[-1,-1,12,7],labels:[{x:3,y:-.3,text:'底 8'},{x:10.2,y:3,text:'垂直高 5'}]}),pieces('底 6 cm、高 4 cm。复制并转动一块，看看两个三角形怎样拼。',[P('一个三角形',RIGHT)],{transform:true,before:V([RIGHT]),after:V([RIGHT,RIGHT_COPY]),view:[-1,-1,9,7],labels:[{x:2,y:-.3,text:'底 6'},{x:6.2,y:2,text:'高 4'}]}),pieces('底 12 cm、高 7 cm。这个三角形的高落在外面，复制一块看看。',[P('一个三角形',OBTUSE)],{transform:true,before:V([OBTUSE]),after:V([OBTUSE,OBTUSE_COPY]),view:[-1,-8,20,17],lines:[{a:[18,7],b:[18,0]},{a:[15,0],b:[18,0]}],labels:[{x:7,y:-.4,text:'底 12'},{x:18.2,y:4,text:'高 7'}],questions:[ch('选面积公式时要用哪条','height',[['height','垂直的高'],['slope','任意斜边']])]}),pieces('底 10、高 5；斜边是 6。该用哪一段算面积？',[P('平行四边形',[[0,0],[10,0],[10+Math.sqrt(11),5],[Math.sqrt(11),5]])],{view:[-1,-1,15,8],labels:[{x:3,y:-.3,text:'底 10'},{x:10.5,y:2,text:'垂直高 5'}],questions:[ch('叶片形状怎样量面积','estimate',[['estimate','可以用方格近似'],['formula','一定直接套这个平行四边形公式']])]})],
 polyArea:[trapezoid(),pieces('把风筝形放进 8×6 的外框，减去四个角。',[P('左上角',[[0,0],[4,0],[0,3]]),P('右上角',[[4,0],[8,0],[8,3]]),P('右下角',[[8,3],[8,6],[4,6]]),P('左下角',[[0,3],[4,6],[0,6]])],{mode:'subtract',enclosingArea:48,enclosing:[[0,0],[8,0],[8,6],[0,6]],outline:[[4,0],[8,3],[4,6],[0,3]],view:[-1,-1,10,9],labels:[{x:2,y:-.3,text:'外框 8×6'}]}),pieces('花园是 12×8 的长方形，右边接一个底 3、高 8 的三角形。',[P('长方形',[[0,0],[12,0],[12,8],[0,8]]),P('三角形',[[12,0],[15,0],[12,8]])],{unit:'m',view:[-1,-1,18,11],labels:[{x:3,y:-.3,text:'12 m'},{x:12,y:-.3,text:'3 m'},{x:15.2,y:4,text:'高 8 m'}]})],
 circleArea:[circle('半径 3 cm。先看直径，再把圆边拉直比较；用 3.14 估一圈和面积。',3),circle('直径 8 cm。换个圆，先找半径，再量边和里面。',4,{given:'diameter'}),circle('中间长 8 cm，两端是半径 2 cm 的半圆。拼出里面，选外边再算。',2,{kind:'stadium',rectLength:8})],
 prismFormulas:[trapezoid(),triPrism('三角形底两条直角边为 3 cm、4 cm，棱柱长 10 cm。转一转，算一层再算里面。',{requiredFaces:[],volumeRequired:true,baseArea:6,volume:60}),{type:'x-a30-solid',kind:'cylinder',prompt:'圆柱半径 2 cm、高 4 cm。用 π≈3.14 算一层圆面，再算里面。',size:[2,4],unit:'cm',faces:[],requiredFaces:[],volumeRequired:true,baseArea:12.56,volume:50.24,questions:[ch('圆柱体积从哪一层出发','base',[['base','圆底面积×高'],['edge','圆周长×高']])]}],
 netSurface:[box('长 5 cm、宽 4 cm、高 3 cm。转动盒子，选出全部六面并记录各面面积。',5,4,3),pyramid('方形底边 6 cm，每个三角面的垂直面高 5 cm。看立体和展开图，算外表。'),box('做一个没有上盖的盒子：30 cm×20 cm×10 cm。只选需要的纸面。',30,20,10,{openTop:true})],
 solidSurface:[triPrism('三角柱长 10 cm，两端是 3、4、5 cm 的直角三角形。选外面，再算里面。',{requiredFaces:[0,1,2,3,4],surface:132,volumeRequired:true,baseArea:6,volume:60}),{type:'x-a30-solid',kind:'stack',prompt:'2 cm 小立方体贴在 4×4×2 cm 的方块上。先分开再接上，找出外面与里面。',unit:'cm',faces:[{name:'下面的底面',dims:'4×4',area:16},{name:'下面四个侧面',dims:'4×8',area:32},{name:'下面露出的顶面',dims:'16−4',area:12},{name:'上面小块顶面',dims:'2×2',area:4},{name:'上面四个侧面',dims:'4×4',area:16}],requiredFaces:[0,1,2,3,4],surface:80,canSplit:true,volumeRequired:true,baseArea:null,volume:40,calculations:[{label:'下面一块的体积',value:32},{label:'上面一块的体积',value:8}],questions:[q('分开时两块表面积合起来',88),q('贴合时藏起来的两个面一共',8)]},{type:'x-a30-solid',kind:'lprism',prompt:'花槽底是相接的 3 m×1 m 和 2 m×1.5 m 两块，深 0.5 m。算底面积和装土的体积。',unit:'m',faces:[],requiredFaces:[],volumeRequired:true,baseArea:6,volume:3,calculations:[{label:'第一块底面面积',value:3},{label:'第二块底面面积',value:3}],questions:[ch('给外壁刷漆要找什么','surface',[['surface','外壁面积'],['volume','里面的体积']])]}]
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,ts])=>[id,clone(ts.at(-1))]));
const link=(from,to,title,summary,a,b)=>({from,to,title,summary,tasks:[clone(a),clone(b)],phase:5,batch:'B30'});
const boxVolume={type:'cube-plan',dims:[4,3,5],prompt:'先按长、宽、高找到一层，再数出长方体里面的块数。'};
const splitVolume={type:'decompose',dims:[4,2,3],stepWidth:2,prompt:'先把台阶分成不重叠的两块，再把里面的体积接起来。'};
export const BRIDGES=[
 link('lengthtools','gridarea','量一条边，再铺一片','长度沿一个方向；面积要用方片铺满里面。',T28.lengthtools[0],TASKS.gridarea[1]),
 link('rectangle','areadistrib','整块面积，拆成两块','长方形的行和列可以从一处拆开，两块仍完整覆盖。',T02.rectangle[0],TASKS.areadistrib[0]),
 link('areadistrib','translateamount','拆出的两块，接到乘法','面积的两块和数字里的整十、零头对应。',TASKS.areadistrib[1],T16.translateamount[1]),
 link('gridarea','area','一个方片，铺满一片','把单位方片逐格放好，再铺一块带缺口的地方。',TASKS.gridarea[1],T02.area[0]),
 link('measurecalc','walkperim','量边，再绕一圈','先用尺记录长度，再沿图形的外边走。',T29.measurecalc[0],TASKS.walkperim[0]),
 link('sidesfold','walkperim','认出边，再量外圈','先找图形的边，再把外边的长度连起来。',T23.sidesfold[0],TASKS.walkperim[1]),
 link('walkperim','polyperim','外圈知道了，找藏着的边','从沿外边走，接到整圈已知时反找一条边。',TASKS.walkperim[0],TASKS.polyperim[1]),
 link('rectangle','polyperim','同一块地，面积和外圈分开','先算长方形里面，再沿同一类图形的外边走。',T02.rectangle[0],TASKS.polyperim[0]),
 link('polyperim','boundary','走一圈，再比较里面','先量外圈，再分别记录面积与周长。',TASKS.polyperim[0],T02.boundary[1]),
 link('polyperim','lperim','多一处拐弯，也要走完整圈','先找多边形的边，再沿 L 形所有外边走。',TASKS.polyperim[1],TASKS.lperim[0]),
 link('rectsplit','lperim','分界在里面，外边在外面','拆开算面积后，内部切线不应计入外圈。',TASKS.rectsplit[0],TASKS.lperim[0]),
 link('boundary','areaPerim','铺地一样多，围边可能不同','先分别量面积和外圈，再造两个反例比较。',T02.boundary[1],TASKS.areaPerim[0]),
 link('rectangle','rectsplit','一块地，拆成两块','先算一块长方形，再把 L 形分成不重叠的两块。',T02.rectangle[0],TASKS.rectsplit[0]),
 link('productfractions','triArea','取一半，接到三角形','先构造一部分，再把一个三角形看成拼图的一半。',T18.productfractions[0],TASKS.triArea[1]),
 link('boundary','triArea','长方形移一移，得到斜四边形','先量长方形的面积，再移动一端比较面积。',T02.boundary[1],TASKS.triArea[0]),
 link('quadhierarchy','triArea','认出平行四边形，再找高','先观察四边形性质，再用垂直高算面积。',T23.quadhierarchy[0],TASKS.triArea[0]),
 link('rectsplit','polyArea','直边分块，走到斜边分块','先拆 L 形，再拆成三角形和长方形。',TASKS.rectsplit[0],TASKS.polyArea[0]),
 link('triArea','polyArea','一块三角形，变成多块','先看一个三角形的面积，再把两边三角形合回梯形。',TASKS.triArea[1],TASKS.polyArea[0]),
 link('areadistrib','longproduct','一块块面积，接到多位数乘法','先把 6×13 分成两块，再试更大的乘法分块。',TASKS.areadistrib[1],T14.longproduct[2]),
 link('triArea','prismFormulas','先算三角形，给立体一层底','先算一个三角形，再把它作为棱柱截面。',TASKS.triArea[1],TASKS.prismFormulas[1]),
 link('boundary','prismFormulas','面积和长度，接成体积','先看长方形面积，再算三角形底的棱柱。',T02.boundary[1],TASKS.prismFormulas[1]),
 link('box','prismFormulas','一层乘层数，换种底面','先看长方体的一层，再换成三角形底。',boxVolume,TASKS.prismFormulas[1]),
 link('triArea','netSurface','三角形面积，变成立体的面','先算三角形，再在方锥外表找四个三角面。',TASKS.triArea[1],TASKS.netSurface[1]),
 link('box','netSurface','填里面，还是包外面','先用小方块想体积，再选盒子的各个外面。',boxVolume,TASKS.netSurface[0]),
 link('nets','netSurface','展开后的面，还要算面积','先折合一个展开图，再给长方体各面算面积。',T02.nets[1],TASKS.netSurface[0]),
 link('prismFormulas','circleArea','圆底的一层，接到圆边与圆面','先用圆底算体积，再单独比较圆的边和里面。',TASKS.prismFormulas[2],TASKS.circleArea[0]),
 link('circleparts','circleArea','半径和直径，拿来量圆','先找到圆心和半径，再比较一圈与面积。',T23.circleparts[0],TASKS.circleArea[0]),
 link('polyArea','solidSurface','底面拆开，再放进立体','先拆多边形的面积，再把组合底面乘上深度。',TASKS.polyArea[2],TASKS.solidSurface[2]),
 link('prismFormulas','solidSurface','算里面，再选外面','先算三角柱的体积，再把各个外面加起来。',TASKS.prismFormulas[1],TASKS.solidSurface[0]),
 link('netSurface','solidSurface','展开的面，接到贴合后的外面','先算盒子的外面，再检查两块贴合时藏起的面。',TASKS.netSurface[0],TASKS.solidSurface[1]),
 link('steps','solidSurface','分块相加，注意贴合面','先拆台阶求体积，再看接触的面为什么不计入外面。',splitVolume,TASKS.solidSurface[1])
];
