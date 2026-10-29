import {TASKS as T02} from '../phase4/b02.js';
import {TASKS as T18} from './b18.js';
import {TASKS as T28} from './b28.js';
import {TASKS as T29} from './b29.js';
const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B31'});
export const LESSONS={
 comparecap:item('mt_zkFbMLpu3U','换个杯子，还是这么多吗','容量与当前水量的比较','容量是容器装满时能容纳多少，当前水量是现在装了多少。同样的水换一个形状不会变多；不同粗细的容器不能只比液面高低。半满和四分之一满要相对同一个容器的容量。','细高杯里的水面更高，就一定有更多水吗？'),
 cupmeasure:item('mt_4lp_b5Pzik','用同一杯，量一量','用单位量容量与液体体积','把同样满的量杯一次次倒入，记下杯数与单位。对同一容器，量杯越大，所需杯数通常越少；也可以用升和毫升记录。','为什么一个壶可以是4大杯，也可以是8小杯？'),
 indirectmass:item('mt_bnwHo5wfCD','借一个工具，再比较','质量与容量的间接比较','不能直接相比较时，可以借同一件物体或同一容器。若甲比乙重、乙比丙重，甲就比丙重；容量也要用一致的单位比较。','不能把苹果和鸡蛋同时放在一起，怎样用木块比较它们？'),
 measureliquid:item('mt_-af65bxfdp','先估一估，再看刻度','质量与液体体积的估计和测量','读量杯或质量秤时，先看相邻数字差多少，数清间隔，再判断液面或指针。记录带上克、千克、升或毫升；相同单位的量才能直接相加。','两条数字之间有5小段时，怎样知道每小段是多少？'),
 fractionvolume:item('mt_IlDaxVr60U','小方块变小，盒子有多大','分数边长的长方体体积','边长为1/2的立方体占1/8立方单位：长、宽、高三个方向都变小。先数小块和层，再比较小块总体积、长宽高相乘与底面积乘高。','边长变成一半时，为什么小方块体积不是一半？')
};
export const SECTIONS=[{id:'volume-water',title:'换容器，量一量'},{id:'volume-blocks',title:'一层一层填空间'}];
const route=(id,section,title,ids)=>({id,section,title,ids,packIds:['volume'],themeId:'measure',color:'#548e82'});
export const ROUTES=[route('GB','volume-water','倒进同一杯，再比较',['comparecap','cupmeasure','indirectmass']),route('GC','volume-water','读刻度，填满空间',['measureliquid','fractionvolume'])];
const q=(label,value,options)=>({label,value,...(options?{options}:{})}), clone=x=>structuredClone(x);
const compare=(prompt,capacities,amounts,widths,answer)=>({type:'x-m31-compare',prompt,capacities,amounts,widths,names:['A','B'],answer});
const fill=(prompt,capacity,goal,units,requiredUnits,extra={})=>({type:'x-m31-fill',prompt,capacity,goal,units,requiredUnits,unit:'mL',...extra});
const b=(prompt,objects,pairs)=>({type:'x-m31-balance',prompt,objects:objects.map(([name,mass])=>({name,mass})),pairs});
const meter=(prompt,kind,min,max,major,minorN,minorD,valueN,valueD,unit,estimateExample,extra={})=>({type:'x-m31-meter',prompt,kind,min,max,major,minorN,minorD,valueN,valueD,unit,estimateExample,...extra});
const cubes=(prompt,grid,den)=>({type:'x-m31-cubes',prompt,grid,den,unit:'cm'});
const cup100={id:'cup100',amount:100,label:'100 mL 一杯'},cup250={id:'cup250',amount:250,label:'250 mL 大杯'},cup125={id:'cup125',amount:125,label:'125 mL 小杯'};
const orderVessels={type:'x-m28-vessels',prompt:'用同一个 50 mL 量杯装满三只容器，再从少到多排。',mode:'order',capacities:[100,200,150],names:['容器A','容器B','容器C'],units:[{id:'small',amount:50,label:'50 mL 量杯'}],questions:[]};
const bagStory={type:'x-m28-convert',prompt:'三袋豆子每袋重 250 g，一共多重？用克记录。',rows:[{value:.75,from:'kg',to:'g',expected:750,label:'3袋，每袋250 g'}],questions:[q('三袋一共多少克',750)]};
export const TASKS={
 comparecap:[
  compare('两只容器都装满了。哪只装得更多？先猜，再倒进一样的杯子。',[200,300],[200,300],[50,150],'right'),
  compare('这次比里面的水：细高容器和矮宽容器，哪一份更多？',[300,400],[200,200],[50,150],'equal'),
  fill('这只瓶子能装 400 mL。倒到半满，记录现在有多少。',400,200,[cup100],['cup100']),
  fill('还是 400 mL 的瓶子，这次倒到四分之一满。',400,100,[cup100],['cup100'])
 ],
 cupmeasure:[
  fill('用 250 mL 的同一只杯子把壶装满，数数用了几杯。',1000,1000,[cup250],['cup250']),
  fill('同一只壶，分别用大杯和小杯装满。每次都倒满一杯。',1000,1000,[cup250,cup125],['cup250','cup125'],{questions:[q('同一个壶，换更大的杯子需要','fewer',[['fewer','更少杯'],['more','更多杯']])]}),
  meter('用升作单位，先估一估，再看量杯液面。','jug',0,3,1,1,2,2,1,'L',1)
 ],
 indirectmass:[
  b('苹果和鸡蛋不能一起放到天平上。分别与木块比，再从轻到重排。',[['苹果',5],['木块',3],['鸡蛋',1]],[[0,1],[1,2]]),
  orderVessels,
  b('换三个物体，分别与中间的石块比，再从轻到重排。',[['盒子',2],['石块',4],['球',6]],[[0,1],[1,2]])
 ],
 measureliquid:[
  meter('量杯每两个数字差 100 mL。先估，再找每个小间隔和液面。','jug',0,500,100,20,1,340,1,'mL',300),
  meter('模拟书的质量不到 1 kg。先估，再读质量秤。','mass',0,1000,200,50,1,600,1,'g',500),
  bagStory
 ],
 fractionvolume:[
  cubes('边长 1 cm 的盒子，用边长 1/2 cm 的小立方体填满，再打开层。',[2,2,2],2),
  cubes('盒子长 1½ cm、宽 1 cm、高 2½ cm。用边长 1/2 cm 的小块填满。',[3,2,5],2),
  cubes('换成边长 1/4 cm 的小块，填满长 1 cm、宽和高各 1/2 cm 的盒子。',[4,2,2],4),
  {type:'x-m31-product',kind:'box',prompt:'模拟沙盒长 2¼ ft、宽 1½ ft、深 2/3 ft。转动盒子，再计算里面。',size:[2.25,1.5,2/3],labels:['2¼','1½','2/3'],faces:[],unit:'ft',baseN:27,baseD:8,volumeN:9,volumeD:4}
 ]
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,ts])=>[id,clone(ts[0])]));
const link=(from,to,title,summary,a,b)=>({from,to,title,summary,tasks:[clone(a),clone(b)],phase:5,batch:'B31'});
const boxVolume={type:'cube-plan',dims:[4,3,5],prompt:'先按长、宽、高找到一层，再数出长方体里面的块数。'};
export const BRIDGES=[
 link('attributes','comparecap','先分清量，再比较水','先比较不同属性，再将水倒进同样的杯子。',T02.attributes[0],TASKS.comparecap[1]),
 link('comparecap','cupmeasure','会比多少，再用杯子量','先比较装满的容量，再数相同量杯的数量。',TASKS.comparecap[0],TASKS.cupmeasure[0]),
 link('comparecap','indirectmass','换一个容器，再排顺序','先把水倒进相同杯子，再用同一量杯比较三只容器。',TASKS.comparecap[0],TASKS.indirectmass[1]),
 link('compareweight','indirectmass','先看天平，再借一个中间物','先比较两件东西，再分别与同一件物体比较。',T28.compareweight[0],TASKS.indirectmass[0]),
 link('indirectmass','measureliquid','比较轻重，再读质量','先用天平比较，再读带数字的质量秤。',TASKS.indirectmass[0],TASKS.measureliquid[1]),
 link('measurecalc','measureliquid','量同一种量，再看细刻度','先对齐测量并记录，再解读量杯的每个小间隔。',T29.measurecalc[0],TASKS.measureliquid[0]),
 link('precisionunits','measureliquid','小单位，再看小间隔','先用能放下的小单位，再读量杯刻度。',T28.precisionunits[1],TASKS.measureliquid[0]),
 link('cupmeasure','measure','用杯数一数，再用标准量杯','先用相同的小杯装满，再用毫升记录量杯。',TASKS.cupmeasure[0],T02.measure[2]),
 link('cupmeasure','precisionunits','换小杯，数量会怎样','先换大小杯，再选能放进容器的小单位。',TASKS.cupmeasure[1],T28.precisionunits[1]),
 link('measureliquid','readscales','看懂间隔，再读另一个仪器','先读量杯的小间隔，再读质量秤。',TASKS.measureliquid[0],T28.readscales[0]),
 link('fractionarea','fractionvolume','小方片，变成小方块','先在两个方向分小格，再在三个方向填小块。',T18.fractionarea[0],TASKS.fractionvolume[0]),
 link('box','fractionvolume','一层层数，再换成小方块','先数整块的一层与层数，再用半厘米小块填同类盒子。',boxVolume,TASKS.fractionvolume[1])
];
