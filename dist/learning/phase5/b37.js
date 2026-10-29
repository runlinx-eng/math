import {TASKS as T17} from './b17.js';
import {TASKS as T18} from './b18.js';
import {TASKS as T24} from './b24.js';
import {TASKS as T36} from './b36.js';
import {TASKS as T02} from '../phase4/b02.js';
import {TASKS as T03} from '../phase4/b03.js';
import {TASKS as T15} from './b15.js';
import {TASKS as T16} from './b16.js';
import {TASKS as T28} from './b28.js';
import {TASKS as T33} from './b33.js';
const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B37'});
export const LESSONS={
 pctNames37:item('mt_4ubP_RMg9o','一份量，三种名字','百分数、分数与小数的对应','20%是每100份中的20份，也等于1/5和0.2；折扣部分与剩下的价格不同。','同样写20%，换了整体，拿到的数量为什么会变化？'),
 pctWhole37:item('mt_ZM9mhHsyYZ','把整个分成一百份','百分数与整体','一个整体分成100等份，35份就是35%；50%是整个的一半，100%是整个。','50%一定是50个东西吗？'),
 pctIdeas37:item('mt_ESgc4YBw-a','两种颜色，怎样保持味道','比、比例与缩放倍数','比描述两个量怎样对应；两组比相等时，关系保持。相似放大让对应长度乘同一个倍数。','两种颜色都多加一杯，味道一定不变吗？'),
 pctCalculate37:item('mt_PNSyfH56eQ','先找容易的一块','百分数的分拆计算','10%是把整个分成十份的一份，5%是它的一半；15%可以将这两块接起来。比较折扣要先看各自原价。','15%和10%相比，为什么省下的钱不一定更多？'),
 pctFraction37:item('mt_ALUrJpY0cZ','超过整个，也能用百分数','百分数、数量关系与变化','分数、小数和百分数可以说同一关系；150%是一份半。变化率与变化后的总量要分清，比较时先确定整体。','150%为什么不等于比原来多150%？'),
 pctChange37:item('mt_iEXqN48w3x','涨了、降了，再倒着找','百分比增减、反求与单利','增加15%得到原来的115%；打八折后的金额是原来的80%。简单利息每年都以原本金为基准，不把利息加回本金再算。','先减少20%再增加20%，为什么不一定回到原来？'),
 ratioProblem37:item('mt_h0gJcSuwdL','两种东西一起添','比的对应与倍数','相同配比可以把每种数量都乘同一个数；两边各加同一个数通常会改变配比。','3份红、5份蓝；两种都加2份，还是同一味道吗？'),
 ratioShare37:item('mt_FnUJMXPUZX','不是每人一样多，怎样公平分','按比分配与整体的分数','先把比里的份数加起来，整个平均分成这些小份，再按各人份数拿走。','2:3里的2，为什么是整个的2/5？'),
 ratioDivide37:item('mt_nOCPx5qw0Z','先找一份，再分给每个人','两项及三项的按比分配','按比把总量分给各部分，先找同样大小的一份。把实际数量写成比时，也可以同时除以共同因数。','把10:14写成5:7，为什么没有改变两人的关系？'),
 fractionOf37:item('mt_xAf2bu9wYK','这段占另一段的多少','一个量占另一个量的几分之几','先换成相同单位，再用要比较的量除以作为整体的量。前者比后者大时，结果可以大于1。','45分钟占2小时多少，为什么不能直接写45/2？'),
 rateWords37:item('mt_ATYLKt0je-','一起变，还是反着变','正比例、反比例与复合单位','直接比例中两个量的商保持；在给定非零范围内，反比例的积保持。速度、单价和密度都要说明每一单位对应什么。','人数增加时，完成时间一定减少吗？还需要什么条件？'),
 ratioNotation37:item('mt_XWSGuFW7It','比的前后，不能随便换','比的顺序、化简与部分占整体','12:8和3:2说的是相同的对应关系；3:2分成五份，前者占3/5。含小数或分数的比也可同时乘同一非零数化简。','3:2里的3/2和3/5，各自拿谁作整体？'),
 proportion37:item('mt_5mIcmKRCgA','两个量怎样一起变化','正比例、反比例与图像','正比例可以写成y=kx，图线经过原点；反比例在非零范围满足xy=k。现实故事还要说明数量和单位怎样约定。','一个量翻倍，另一个量也翻倍，和减半有什么不同？'),
 ratioLink37:item('mt_yK51ZnKA8m','同一个关系，换三种看法','比、分数与函数的联系','2:5可以比较红与蓝，也可以说红是蓝的2/5；红占全部则是2/7。表示成函数时要先说清谁是输入、谁是输出。','为什么2:5不等于红色占全部的2/5？'),
 recipeScale37:item('mt_ZOJ6EbdPOb','人数和材料一起变','配方、单价与几何缩放','配方、价格和相似图形都可以在给定条件下按倍数缩放；先找一份或单位量，再换成想要的数量。','人数变成一份半，材料该加半杯，还是变成一份半？'),
 similar37:item('mt_2OtRUM_0zW','图形放大，什么没变','相似图形与比例因子','相似放大或缩小时，对应边乘同一个倍数，对应角不变。每条边都加相同长度通常不能保持形状。','每边都加2与每边都变成2倍，有什么不同？'),
 scaleMap37:item('mt_1badik7iKJ','图上的一小段，现实有多长','比例尺、地图与单位','比例尺的两边要先用相同单位。图上1厘米对应实际50厘米时，改成1:100的图，图上同一段会变短。','同一个房间，图上变短了，真实墙变短了吗？'),
 scaleArea37:item('mt_CUJr8L5_Wn','边放大了，里面变多少','比例图中的面积','长度按k倍变化时，两个方向都变化，面积按k²倍变化。先将长度换到同样单位，再求实际面积。','边长变成3倍，为什么里面不是只变3倍？'),
 rateUnit37:item('mt_kLQOzZYrd5','一份、一小时和一个小方块','速度、单价与密度','速度是距离除以时间，单价是价格除以数量，密度是质量除以体积；比较前要把单位对齐。','便宜的一包，为什么不一定每千克更便宜？'),
 proportionGraph37:item('mt_FspV_imUGK','把一对一对的变化放上图','正比例的数表与图像','相同的单位率产生一组数对；零份对应零总量，正比例图线经过原点。图中两个轴要说明各代表什么。','有些直线经过原点，有些没有，差别可能是什么？'),
 convertUnits37:item('mt_tpT9brpI6D','单位改变，量还一样','面积、时间与体积单位换算','长度单位改变时，面积需要两个方向一起换。1平方米有10000平方厘米；1升等于1000立方厘米，1小时等于60分钟。','1米是100厘米，为什么1平方米不是100平方厘米？')
};
export const SECTIONS=[{id:'scaling-percent',title:'一百份里的多少'},{id:'scaling-share',title:'配在一起，分给各人'},{id:'scaling-change',title:'一起变化与缩放'}];
const route=(id,title,section,ids)=>({id,title,section,ids,packIds:['scaling'],themeId:'numbers',color:'#a58961'});
export const ROUTES=[
 route('HG','一个量的几种名字','scaling-percent',['pctNames37','pctWhole37','pctIdeas37']),
 route('HH','从一小块算出变化','scaling-percent',['pctCalculate37','pctFraction37','pctChange37']),
 route('HI','配方不变，分法不同','scaling-share',['ratioProblem37','ratioShare37','ratioDivide37']),
 route('HJ','谁和谁比，单位是什么','scaling-share',['fractionOf37','rateWords37','ratioNotation37']),
 route('HK','把一对量连起来','scaling-change',['proportion37','ratioLink37','recipeScale37']),
 route('HL','图形和地图一起缩放','scaling-change',['similar37','scaleMap37','scaleArea37']),
 route('HM','量、单位与图线','scaling-change',['rateUnit37','proportionGraph37','convertUnits37'])
];
const q=(label,value)=>({label,value}),ch=(label,value,options)=>({label,value,kind:'choice',options});
const fdp=(n,d,prompt,views=[])=>({type:'x-fdpboard',n,d,prompt,views});
const scale=(start,ratio,mode,prompt,unit='元',extra={})=>({type:'x-scalechain',start:String(start),stages:[{ratio,mode,label:prompt,...extra}],prompt,unit});
const mix=(prompt,base,targets,labels=['红色','蓝色'],questions=[],extra={})=>({type:'x-r37-pair',prompt,base,targets,labels,questions,relation:'direct',commonUnit:true,...extra});
const share=(prompt,total,parts,labels,questions,unit='个')=>({type:'x-r37-share',prompt,total,parts,labels,questions,unit});
const shape=(prompt,base,required,questions=[],extra={})=>({type:'x-r37-shape',prompt,base,required,factors:['1','1/2','2','3'],questions,...extra});
const step=(title,label,value,hint)=>({title,label,value,hint});
const choose=(title,label,value,options,hint)=>({title,label,value,kind:'choice',options,hint});
const path=(prompt,scene,steps,questions=[])=>({type:'x-r37-steps',prompt,scene,steps,questions});
const compare=(prompt,items,want,questions=[])=>({type:'x-m33-compare',prompt,items:items.map(([label,value,detail])=>({label,value,detail})),want,questions});
const graph=(prompt,data)=>({type:'x-graphpoints',prompt,data,maxX:4,maxY:8,xLabel:'千克',yLabel:'价格（元）',line:true,rate:2});
export const TASKS={
 pctNames37:[
  fdp(20,100,'把一百格涂出20份，再给同一个量写分数、小数和百分数。',['line']),
  scale(60,'1/5','take','60个里取20%。先平均分，再取一份。','个',{percent:20,decimal:true}),
  fdp(3,4,'一块分四等份的图，取三份。用小数和百分数再说同一部分。'),
  scale(40,'1/4','off','虚构商店：40元减去25%，剩下多少？先区分拿走与留下。','元',{percent:25,decimal:true})
 ],
 pctWhole37:[
  fdp(35,100,'从一百格取出35格；说清这是谁的35%。'),
  fdp(40,100,'自己涂出40格，用百分之一的小份记录。'),
  fdp(50,100,'把一百格的一半涂上，再给它写三个名字。'),
  fdp(100,100,'整块都涂上。这次是整个的百分之几？')
 ],
 pctIdeas37:[
  mix('红2份、蓝3份。摆出4与6，再试红4蓝5；哪次保持配比？',[2,3],[[4,6],[4,5]],['红色','蓝色'],[ch('两组比相等时','proportion',[['proportion','两种配法保持同一关系'],['add','两个数分别加一样多就一定相等']])]),
  fdp(30,100,'把30个百分之一涂出来，再用小数与分数记录。'),
  shape('长2、宽1的图形变成2倍。两条边各会多长？',[2,1],['2'],[ch('两条对应边','same',[['same','都乘同一个倍数'],['add','都只加同一个数']])])
 ],
 pctCalculate37:[
  {type:'x-percentkit',total:360,percent:15,prompt:'整体360元。先分出10%和5%，再把它们拼成15%。'},
  compare('甲原价50元减20%，乙原价150元减10%。哪次减去的钱更多？',[['甲：20% × 50',10,'减去10元'],['乙：10% × 150',15,'减去15元']],'right',[q('甲减去多少元',10),q('乙减去多少元',15)]),
  {type:'x-percentkit',total:140,percent:35,prompt:'换一个整体140元，自己用10%和5%拼出35%。'}
 ],
 pctFraction37:[
  fdp(60,100,'涂出60个百分之一，给这部分写出同值分数和小数。'),
  path('8个红珠在32个珠子中占多少？','把32看作整个。',[step('整个','整个有几颗',32),step('一百份','8占32的百分之几',25,'用8除以32，再换成每百份。')]),
  scale(200,'3/2','take','取200颗的150%。先摆出一个整个，再取半个。','颗',{percent:150,decimal:true}),
  scale(100,'1/5','add','100元增加20%，增加多少，最后是多少？','元',{percent:20,decimal:true}),
  scale(100,'1/10','off','换成减少10%，分清减少的量和剩下的量。','元',{percent:10,decimal:true})
 ],
 pctChange37:[
  path('240元增加15%，用小数倍数也说一次。','增加的15%是原来240元的一部分。',[step('原价','原价多少元',240),step('增加','增加了多少元',36),step('合起来','增加后一共多少元',276),step('倍数','结果是原价的多少倍',1.15)]),
  path('打八折后是64元。原价多少？','八折是原价的4/5；先找原价的一份。',[step('4份','折后4份是多少元',64),step('1份','原价的1/5是多少元',16),step('原来5份','原价是多少元',80)]),
  path('500元按每年3%算简单利息，经过4年。','模拟算例：每年都按原来的500元算，不复利。',[step('每年','一年利息多少元',15),step('4年','四年总利息多少元',60),step('合起来','本金加利息多少元',560)])
 ],
 ratioProblem37:[
  mix('原配方红3、蓝5。蓝15时，红要多少才能保持味道？再试红5、蓝7。',[3,5],[[9,15],[5,7]],['红珠','蓝珠']),
  mix('苹果和橙子的配比是2:5。橙子20个时，苹果要多少？',[2,5],[[8,20]],['苹果','橙子'],[q('原来每2个苹果对应几个橙子',5)]),
  mix('换成红1、蓝4。各变成3倍，再看各加2是否一样。',[1,4],[[3,12],[3,6]],['红色','蓝色'])
 ],
 ratioShare37:[
  share('40颗按3:5分给甲和乙。先分成一样大的小份。',40,[3,5],['甲','乙'],[q('一份多少颗',5),q('甲得到多少颗',15),q('乙得到多少颗',25)],'颗'),
  share('小丁是小安的2倍，小安是小乔的3倍；30颗怎样分？',30,[6,3,1],['小丁','小安','小乔'],[q('一份多少颗',3),q('小丁多少颗',18),q('小安多少颗',9),q('小乔多少颗',3)],'颗'),
  share('50颗按2:3分，甲拿到整个的几分之几？',50,[2,3],['甲','乙'],[q('甲占全部多少，写分数','2/5'),q('乙得到多少颗',30)],'颗')
 ],
 ratioDivide37:[
  share('60元按2:3分给两人。',60,[2,3],['甲','乙'],[q('每份多少元',12),q('甲多少元',24),q('乙多少元',36)],'元'),
  share('24颗分成10颗和14颗。把它们写成最简单的5:7。',24,[5,7],['甲','乙'],[q('一小份多少颗',2),q('比的前项',5),q('比的后项',7)],'颗'),
  share('180颗按1:2:3分给三人。',180,[1,2,3],['甲','乙','丙'],[q('每份多少颗',30),q('甲多少颗',30),q('乙多少颗',60),q('丙多少颗',90)],'颗')
 ],
 fractionOf37:[
  path('45分钟占2小时的几分之几？','先把两段时间换成同一种单位。',[step('2小时','2小时是多少分钟',120),{...step('一部分','45占120的几分之几，写最简分数','3/8'),kind:'simple'}]),
  path('15厘米占6厘米的几分之几？','这次被比较的长度比作为整体的长度更长。',[{...step('比较','15除以6，写成最简分数','5/2'),kind:'simple'},choose('大小','结果与1比较','larger',[['larger','大于1'],['smaller','小于1']])]),
  path('24颗中的18颗，先写分数，再合成最简。','18颗是部分，24颗是整个。',[{...step('原来的份','用18和24写出部分占整体','18/24'),kind:'rawfraction'},{...step('合并小份','写成最简分数','3/4'),kind:'simple'}])
 ],
 rateWords37:[
  mix('每2袋共6颗。袋数翻倍，颗数怎样变？',[2,6],[[4,12]],['袋数','颗数'],[],{commonUnit:false}),
  mix('同一批工作、每人速度相同：2人用12天，4人需几天？',[2,12],[[4,6]],['人数','天数'],[ch('在这些条件下','inverse',[['inverse','人数变多，所需时间按反方向变化'],['always','人数变多，时间一定不变']])],{relation:'inverse',commonUnit:false}),
  path('120英里走了2小时，平均每小时走多少？','这里只算平均速度，单位也要一起写清。',[step('总距离','距离多少英里',120),step('每小时','每小时多少英里',60),choose('单位','使用哪个单位','mph',[['mph','英里/小时'],['mile','英里']])]),
  path('速度、单价和密度，后面的单位分别表示什么？','先看每一单位在比较哪两个量。',[choose('速度','车每小时走多少千米','speed',[['speed','千米/小时'],['mass','克/立方厘米']]),choose('单价','每千克多少元','price',[['price','元/千克'],['speed','千米/小时']]),choose('密度','每立方厘米多少克','density',[['density','克/立方厘米'],['price','元/千克']])])
 ],
 ratioNotation37:[
  mix('原来的红蓝是3:2。摆出12与8，看看是不是同一配比。',[3,2],[[12,8]],['红','蓝'],[q('红占全部的几分之几','3/5'),q('蓝占全部的几分之几','2/5')]),
  path('把0.5:1.5写成最简整数比。','两边同时乘同一个非零数。',[step('共同变化','两边同时乘几，得到整数',2),step('前项','前项是多少',1),step('后项','后项是多少',3)]),
  path('把1/2:3/4写成最简整数比。','两边都乘4，再看能否继续化简。',[step('前项','1/2乘4是多少',2),step('后项','3/4乘4是多少',3)])
 ],
 proportion37:[
  mix('每2支笔6元。4支多少元？再试4支10元。',[2,6],[[4,12],[4,10]],['支数','价格'],[],{commonUnit:false}),
  mix('一份工作：2人12天，4人6天，8人多少天？假定效率相同。',[2,12],[[4,6],[8,3]],['人数','天数'],[q('每组人数乘天数都是多少',24)],{relation:'inverse',graph:true,commonUnit:false}),
  path('4支笔6元，10支多少钱？','假定每支价格相同。',[step('一支','一支多少元','3/2'),step('十支','十支多少元',15)]),
  graph('每千克2元。把数对逐个放到图上，比较每千克的价格。',[[0,0],[1,2],[2,4],[3,6],[4,8]])
 ],
 ratioLink37:[
  mix('红2、蓝5。红是蓝的多少，红又占全部的多少？',[2,5],[[4,10]],['红','蓝'],[q('红是蓝的几分之几','2/5'),q('红占全部几分之几','2/7')]),
  mix('每个横向数量对应3倍纵向数量。摆出2与6、3与9。',[1,3],[[2,6],[3,9]],['横向','纵向'],[q('纵向是横向的几倍',3)],{commonUnit:false}),
  path('如果y是x的3倍，x为4时y是多少？','先认清x是输入、y是输出。',[step('输入x','x是多少',4),step('输出y','y是多少',12)])
 ],
 recipeScale37:[
  mix('4人用200克面粉。6人需要多少克？',[4,200],[[6,300]],['人数','面粉克数'],[],{commonUnit:false}),
  mix('3千克12元。假定单价不变，5千克多少钱？',[3,12],[[5,20]],['千克','价格元'],[],{commonUnit:false}),
  shape('长4、宽2的图形缩成一半，两边各有多长？',[4,2],['1/2'],[q('这次是原来边长的几倍','1/2')])
 ],
 similar37:[
  shape('原图长3、宽2，变成3倍。每条对应边怎样变化？',[3,2],['3'],[q('放大倍数',3)]),
  {...structuredClone(T24.growshape[0]),prompt:'将三角形以原点为中心放大2倍。观察对应边与对应角。'},
  shape('原图长4、宽2。先缩到一半，再放大到2倍，各留一次。',[4,2],['1/2','2'],[ch('对应角','same',[['same','角度保持'],['double','角度也变成2倍']])]),
  path('一个三角形的边是3、4、5，另一个对应边是6、8、10。','比较每一对对应边。',[step('第一对','6是3的几倍',2),step('第二对','8是4的几倍',2),step('第三对','10是5的几倍',2)])
 ],
 scaleMap37:[
  path('1:50房间图上墙长9 cm，实际长多少？门实际宽1.2 m，图上多宽？','图上1 cm代表实际50 cm。',[step('实际墙长','9 cm对应多少cm',450),step('换单位','实际墙长多少米','9/2'),step('实际门宽','1.2米是多少厘米',120),step('图上门宽','门在图上多少厘米','12/5')]),
  path('把同一房间的1:50图换成1:100。','实际墙长保持4.5米。',[step('原图','原图墙长多少厘米',9),step('新图','新图墙长多少厘米','9/2'),step('核对','新图对应实际多少厘米',450)]),
  path('1:25000地图上两镇相距6.5 cm，实际多少千米？','先用厘米算，再换成千米。',[step('实际厘米','实际多少厘米',162500),step('实际千米','实际多少千米','13/8')])
 ],
 scaleArea37:[
  shape('原图长2、宽1。变成3倍后，看看右图装下几块原图。',[2,1],['3'],[q('原图面积',2),q('新图面积',18),q('面积变成几倍',9)],{tiles:true}),
  path('1:50图上的房间为6 cm×4 cm。实际面积多少？','边长换成实际米，再算面积。',[step('实际长','实际长多少米',3),step('实际宽','实际宽多少米',2),step('面积','实际多少平方米',6),step('面积倍数','图上平方厘米到实际平方厘米，乘多少',2500)]),
  path('1:10000地图上公园面积是8 cm²，实际多少平方米？','两条边的比例都要考虑，最后换面积单位。',[step('面积倍数','面积乘多少',100000000),step('实际cm²','实际多少平方厘米',800000000),step('实际m²','实际多少平方米',80000)])
 ],
 rateUnit37:[
  path('一辆车72千米/小时，换成米/秒。','1千米1000米；1小时3600秒。',[step('距离','72千米是多少米',72000),step('时间','1小时多少秒',3600),step('每秒','每秒多少米',20)]),
  compare('甲半千克6元，乙1千克10元。哪种每千克更便宜？',[['甲：半千克6元',12,'每千克12元'],['乙：一千克10元',10,'每千克10元']],'right',[q('甲每千克多少元',12),q('乙每千克多少元',10)]),
  path('一个小物体质量240 g、体积80 cm³，密度多少？','密度是每立方厘米的质量。',[step('质量','质量多少克',240),step('体积','体积多少立方厘米',80),step('每单位','每立方厘米多少克',3)]),
  path('密度3 g/cm³、体积80 cm³，质量多少？换成已知质量和密度，又能找到体积吗？','保持同一种单位，乘和除回到同一个关系。',[step('质量','3乘80，质量多少克',240),step('体积','240克除以每立方厘米3克，体积多少立方厘米',80)])
 ],
 proportionGraph37:[
  graph('一千克2元，把每组千克与价格放到图上。',[[0,0],[1,2],[2,4],[3,6],[4,8]]),
  {...structuredClone(T36.linear36[0]),prompt:'改变每步变化，比较线是否穿过原点。先注意起点不是0。'},
  path('3千克6元，单价不变。5千克多少元？','从一个数对回到一千克，再走到五千克。',[step('一千克','一千克多少元',2),step('五千克','五千克多少元',10),choose('零千克','零千克多少钱','zero',[['zero','0元'],['fixed','仍然是6元']])])
 ],
 convertUnits37:[
  path('1平方米等于多少平方厘米？','1米是100厘米，两个方向都换。',[step('长','1米是多少厘米',100),step('宽','另一条1米是多少厘米',100),step('面积','1平方米是多少平方厘米',10000)]),
  path('2.5小时是多少秒？','先经过分钟，再换成秒。',[step('分钟','2.5小时是多少分钟',150),step('秒','150分钟是多少秒',9000)]),
  path('2500立方厘米是多少升？','1升等于1000立方厘米。',[step('一升','1升是多少立方厘米',1000),step('换算','2500立方厘米是多少升','5/2')])
 ]
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,ts])=>[id,structuredClone(ts[0])]));
export const BRIDGES=[];
const link=(from,to,title,a,b)=>BRIDGES.push({from,to,title,summary:'把前后的想法放到同一个关系里，再亲手检查。',tasks:structuredClone([a,b]),phase:5,batch:'B37'});
link('decpercent','pctWhole37','从一半走到一百份',T03.decpercent[1],TASKS.pctWhole37[1]);
link('pctWhole37','pctNames37','同一百份，换一种名字',TASKS.pctWhole37[0],TASKS.pctNames37[0]);
link('quarters','pctNames37','四等份走到百分数',fdp(1,4,'先把四等份中的一份表示出来。'),TASKS.pctNames37[2]);
link('pctIdeas37','pctCalculate37','先比较配比，再从百分之一部分出发',TASKS.pctIdeas37[0],TASKS.pctCalculate37[0]);
link('fdpswitch','pctCalculate37','同一个比例，再用到实际金额',T17.fdpswitch[1],TASKS.pctCalculate37[0]);
link('pctCalculate37','pctFraction37','十五份与超过一整个',TASKS.pctCalculate37[0],TASKS.pctFraction37[2]);
link('pctCalculate37','pctChange37','先找增加的部分，再加回整体',TASKS.pctCalculate37[0],TASKS.pctChange37[0]);
link('fdpswitch','pctChange37','小数对应的比例，再用于变化',T17.fdpswitch[1],TASKS.pctChange37[1]);
link('pctFraction37','portionoperator','一份半和几份四分之一',TASKS.pctFraction37[2],T18.portionoperator[0]);
link('pctIdeas37','ratioProblem37','先看配比，再补齐另一种数量',TASKS.pctIdeas37[0],TASKS.ratioProblem37[1]);
link('timesmeaning','ratioProblem37','几倍与多几个，带回两种配料',T15.timesmeaning[0],TASKS.ratioProblem37[0]);
link('ratios','ratioShare37','一样大的块，分给不同的人',T03.ratios[0],TASKS.ratioShare37[0]);
link('ratioProblem37','ratioShare37','3:5先配成一组，再分总量',TASKS.ratioProblem37[0],TASKS.ratioShare37[0]);
link('ratioShare37','ratioDivide37','先分糖，再分同样关系的钱',TASKS.ratioShare37[2],TASKS.ratioDivide37[0]);
link('ratioShare37','ratioNotation37','分到的部分，写成有顺序的比',TASKS.ratioShare37[2],TASKS.ratioNotation37[0]);
link('ratioNotation37','ratioDivide37','把比化简，再用它分数量',TASKS.ratioNotation37[0],TASKS.ratioDivide37[1]);
link('fdpswitch','fractionOf37','先给分数换名字，再比较两个量',T17.fdpswitch[1],TASKS.fractionOf37[0]);
link('fractionOf37','ratioLink37','部分占整体与部分对部分',TASKS.fractionOf37[2],TASKS.ratioLink37[0]);
link('ratioNotation37','ratioLink37','比的顺序，与分母是谁',TASKS.ratioNotation37[0],TASKS.ratioLink37[0]);
link('proportionGraph37','ratioLink37','从数对图回到倍数关系',TASKS.proportionGraph37[0],TASKS.ratioLink37[1]);
link('ratioLink37','proportion37','同一个倍数，带入价钱',TASKS.ratioLink37[1],TASKS.proportion37[0]);
link('linear36','proportion37','从线的起点走到过原点的比例图',T36.linear36[0],TASKS.proportion37[3]);
link('rateWords37','proportion37','先试反着变，再把数对留下',TASKS.rateWords37[1],TASKS.proportion37[1]);
link('proportionGraph37','proportion37','先放正比例的点，再看反向变化',TASKS.proportionGraph37[0],TASKS.proportion37[1]);
link('timesproblems','recipeScale37','从几倍到配方变多少',T15.timesproblems[0],TASKS.recipeScale37[0]);
link('pctIdeas37','similar37','两边都乘同一倍数',TASKS.pctIdeas37[2],TASKS.similar37[0]);
link('ratioProblem37','similar37','配料同倍数，图形两边也同倍数',TASKS.ratioProblem37[1],TASKS.similar37[0]);
link('similar37','scaleMap37','图形缩放，再看地图比例',TASKS.similar37[0],TASKS.scaleMap37[0]);
link('convertUnits37','scaleMap37','先换单位，再按图上的比例求实际长度',path('4.5米与多少厘米是同一段？','一米是100厘米。',[step('厘米','4.5米是多少厘米',450)]),TASKS.scaleMap37[0]);
link('scaleMap37','scaleArea37','先从图上找长度，再找面积',TASKS.scaleMap37[0],TASKS.scaleArea37[1]);
link('boundary','scaleArea37','铺满里面，再看放大后有几块',T02.boundary[0],TASKS.scaleArea37[0]);
link('convertUnits37','scaleArea37','平方单位，带回房间面积',TASKS.convertUnits37[0],TASKS.scaleArea37[1]);
link('rateWords37','rateUnit37','从每小时走多远，再换速度单位',TASKS.rateWords37[2],TASKS.rateUnit37[0]);
link('decimalunits','convertUnits37','长度单位变换，再看面积单位',T28.decimalunits[1],TASKS.convertUnits37[0]);
link('proportion37','rateUnit37','相同单价，比较两种包装',TASKS.proportion37[0],TASKS.rateUnit37[1]);
link('scaleMap37','growshape','地图的倍数，回到图形放大',TASKS.scaleMap37[1],T24.growshape[0]);
link('pctCalculate37','discounts','先比较折扣金额，再计算折后价',TASKS.pctCalculate37[1],T33.discounts[0]);
link('pctWhole37','viewlinks','同一部分，从方格看向圆图',TASKS.pctWhole37[1],T16.viewlinks[1]);
