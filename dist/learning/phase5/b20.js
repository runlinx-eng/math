import{TASKS as T19}from'./b19.js';
import{TASKS as T04}from'../phase4/b04.js';
const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B20'});
export const LESSONS={
 digitalcharts:item('mt_X53txVXOcG','一条记录，变成一个图案','数字计数工具与图画统计图','逐条观察再记，图例说明每个图案代表多少。图、计数和表格应来自同一批记录；屏幕杯子只是模拟。','一个图案表示2票，3个图案为什么不是3票？'),
 chartfamilies:item('mt_eKJG-0eC6D','换张图，换个问题','分组频数表、饼图与比较图','连续数值按不重叠区间整理；份额要以总数作整体；比较两组数据要同时引用两边的量。','每个角度加起来是360度，是否就一定画对了？'),
 timeorcategory:item('mt_ChjMU2GDJa','这些点，该连起来吗','分类柱图与时间折线图','时间轴的位置按实际间隔排；连线帮助描述随时间变化。不同水果的类别没有连续中间值，不能把连线当作趋势。','9点、10点、12点之间的两段空隙应该一样宽吗？'),
 displaychoices:item('mt_TiFjjvBMaY','哪张图更容易看清','比较数据表示与分布','同一数据可以换表示。图例、共同尺度和想回答的问题决定读法。比较两组身高时，要看整组的分布和范围。','图画大一点，数量就一定更多吗？'),
 linequestions:item('mt_H6LlpWgEYS','最高的时候，涨得最快吗','折线图读数与变化问题','点的高度是当时的量，前后之差是变化；还要看经过多久。月总雨量可以相加，但不能从连线读出某一天的雨量。','温度最高的一天，为什么不一定升温最多？'),
 timetable:item('mt_Cqm8iy48UI','赶上哪一班，路上多久','时刻表、双向表与经过时间','先对准行与列，再读取交点。时间按60分钟进一小时；10:50到11:20是30分钟，不能把钟面写法当小数减。','时刻11:20与1.2小时是同一件事吗？'),
 timebuilder:item('mt_HlNSurPVDp','把变化沿时间画出来','折线图构造、插值与变化率','选均匀刻度，按实际时间间隔落点并连接。中间值是连接假设下的估计；每小时变化要用变化量除以经过时间。','跨两小时涨4度，和一小时涨4度一样快吗？'),
 fractiondots:item('mt_IHipFGTFEY','小数轴上，也能堆起记录','分数测量数据点图与均分','每个点是一条测量，横轴的每个八分之一位置都保留。总量要把所有点表示的量加起来，平均分要再除以份数。','一列点有3个，表示长度3，还是同一个长度出现3次？'),
 piepieces:item('mt_bESTSBB0wK','把所有份额拼成一圈','饼图的份额、角度与数量','整圈是总数，整周360度。每类的角度等于该类占总数的比例乘360度。同样大的扇区，在不同总数里不一定代表相同人数。','两张图都有四分之一块，能直接说人数一样吗？'),
 boxsummary:item('mt_8VjmxR1yfw','五个位置，藏了多少细节','最小最大须线箱线图','最小、下四分位、中位数、上四分位和最大概括一组数据。本活动须线到最小与最大；箱宽是中间一半的跨度。五个数相同，分布细节仍可能不同。','右边的须更长，表示那里人更多，还是数值更分散？'),
 dotrecords:item('mt_JRzXQl9M7c','一个点，到底代表什么','数值点图与频数','横位置是每人的记录值，竖着叠的是出现次数。所有整数刻度都保留，没有点的7仍然有位置；全部点数才是观察人数。','5上面堆6个点，是一个人读6本，还是六个人各读5本？'),
 histogram:item('mt_oderfUBZPw','把一串数装进相邻格子','等宽直方图与分组信息','按连续、等宽、不重叠的区间归组，150属于150≤h<160。相邻区间柱子相接；分组会藏掉确切原值。','只看150到160这一柱，能知道有几个人正好145吗？'),
 scattercraft:item('mt_BdAeZJUOir','每一对数，放一个点','散点图构造与目测拟合','每点保留同一对象的一对数。趋势线是一条概括点云的直线，不是按编号逐点连，也不必穿过原点。范围内的预测仍是估计。','点有时在线上有时在线下，能否有不止一条合理趋势线？'),
 scattermeaning:item('mt_8atyuvPUZc','一起变化，就是谁造成谁吗','散点相关、趋势与因果边界','向上和向下的趋势都可以是联系；没有明显直线趋势也不等于一切关系都不存在。点贴线的程度不同于线有多陡；第三个因素可能同时影响两边。','天气变热时冰淇淋和游泳人数都增加，能说冰淇淋让人去游泳吗？'),
};
export const SECTIONS=[{id:'data-change',title:'看时间与份额'},{id:'data-pattern',title:'看分布与联系'}];
const route=(id,section,title,ids)=>({id,section,title,ids,packIds:['display'],themeId:'data',color:'#6977b8'});
export const ROUTES=[route('DI','data-read','从记录到清楚的图',['digitalcharts','displaychoices']),route('DJ','data-change','分清类别和时间',['timeorcategory','linequestions']),route('DK','data-change','沿着时间找变化',['timetable','timebuilder']),route('DL','data-pattern','点的位置和一堆点',['fractiondots','dotrecords']),route('DM','data-change','份额与分组，怎样画',['piepieces','chartfamilies']),route('DN','data-pattern','看整体，也看丢掉的细节',['histogram','boxsummary']),route('DO','data-pattern','看两种量怎样一起变',['scattermeaning','scattercraft'])];
const q=(label,value,options)=>({label,value,...(options?{options}:{})});
const time=(prompt,points,questions,extra={})=>({type:'x-timeplot',prompt,points,questions,build:false,kind:'time',xlabel:'时刻（时）',ylabel:'温度（℃）',xDomain:[9,13],yDomain:[0,24],yTicks:[2,4],...extra});
const dots=(prompt,values,questions,extra={})=>({type:'x-dotdraw',prompt,values,questions,d:1,min:0,max:12,unit:'本',...extra});
const pie=(prompt,counts,extra={})=>({type:'x-piesector',prompt,counts,labels:['苹果','香蕉','橙子'],mode:'build',...extra});
const compare=(prompt,labels,a,b,questions,extra={})=>({type:'x-graphcompare',prompt,labels,a,b,questions,mode:'groups',unit:'人',...extra});
const heights=[131,134,135,138,139,140,142,144,145,145,146,147,148,149,150,150,151,152,153,154,155,156,158,159,160,162,164,165,168,172];
const hist=(prompt,values,extra={})=>({type:'x-histbuild',prompt,values,start:130,end:180,widths:[10],unit:'厘米',questions:[],...extra});
const bookValues=[0,1,2,3,3,3,3,4,5,5,5,5,5,5,6,8,9,10,11,12];
const tempPoints=[[9,12],[10,16],[11,18],[12,17],[13,19]],weekPoints=[[1,12],[2,16],[3,18],[4,17],[5,19]];
const scatter=(prompt,points,extra={})=>({type:'x-scatterbuild',prompt,points,xDomain:[10,30],yDomain:[0,40],xlabel:'气温（℃）',ylabel:'冰淇淋销量（份）',xTicks:[2,5],yTicks:[5,10],trend:'positive',predict:20,fit:[12,32],...extra});
const cloud=[[10,12],[12,16],[14,15],[16,20],[18,20],[20,24],[22,23],[24,28],[26,27],[28,32]];
export const TASKS={
 digitalcharts:[
  {type:'x-eventchart',prompt:'把这份模拟水果投票逐条记下来，再换成图画和表。哪类最多，哪类最少？',labels:['苹果','香蕉','梨'],events:[0,1,0,2,0,1,0,2,1,0,1,0],scale:2},
  {type:'x-eventchart',prompt:'看一次模拟鸟观察，记一笔。不要等结束后凭印象猜总数。',labels:['麻雀','鸽子','喜鹊'],events:[0,0,1,2,0,1,0,2,1],scale:1},
  {type:'x-eventchart',prompt:'模拟落下纸杯10次，每次按结果记一笔，再整理成表。这是计数练习，不代表真实纸杯的落地概率。',labels:['杯口朝上','杯口朝下','侧躺'],random:true,n:10,seed:202620,scale:1},
 ],
 timeorcategory:[time('沿时间读温度。10:30没有实测点，按两点间直线连接可以估多少？',[[9,12],[10,16],[11,18],[12,17]],[q('10点的温度',16),q('按直线连接估计10:30的温度',17),q('17℃是什么',['estimate'],[['estimate','连接假设下的估计'],['exact','已经实测的准确值']])],{xDomain:[9,12]}),time('这株模拟植物在第0、1、3、4周的高度不同。自己落点；1到3周之间要留两周的距离。',[[0,2],[1,4],[3,8],[4,9]],[q('第3周高度（厘米）',8)],{build:true,xDomain:[0,4],yDomain:[0,10],yTicks:[1,2],xlabel:'经过时间（周）',ylabel:'高度（厘米）'}),time('苹果、香蕉、梨的类别之间，没有“半个类别”的连续中间值。选画法并搭出记录。',[[0,6],[1,4],[2,2]],[q('苹果比香蕉多几票',2)],{build:true,kind:'category',labels:['苹果','香蕉','梨'],xDomain:[0,3],yDomain:[0,8],yTicks:[1,2],xlabel:'水果类别',ylabel:'票数'})],
 linequestions:[time('这五天哪天最暖？哪一段升得最多？别只盯最高的点。',weekPoints,[q('最暖是第几天',5),q('最暖时多少℃',19),q('第1到第2天升了多少℃',4),q('升温最多的一段',['0'],[['0','第1天到第2天'],['1','第2天到第3天'],['3','第4天到第5天']])],{xDomain:[1,5],xlabel:'第几天'}),time('图上每个点是一整个月的总雨量。找差与合计，不能把连线当成某一天的雨量。',[[1,15],[2,30],[3,30]],[q('2月比1月多多少毫米',15),q('1月加3月共多少毫米',45),q('能读出1月15日下了多少吗',['unknown'],[['unknown','不能，这里记的是整月总量'],['yes','可以取连线中点']])],{xDomain:[1,3],yDomain:[0,40],yTicks:[5,10],xlabel:'月份',ylabel:'月总雨量（毫米）',period:true}),time('从第3到第4天，线向下走。说清楚哪个量怎样变，不把图当作山坡。',weekPoints,[q('第3到第4天减少多少℃',1),q('下降表示',['cooler'],[['cooler','气温下降了'],['hill','有人走下山坡'],['none','不再有温度']])],{xDomain:[1,5],xlabel:'第几天'})],
 timetable:[{type:'x-timetable',mode:'read',prompt:'要在公园站乘B班车。先找到对应的行和列，再把出发时刻留下。',rows:['起点站','公园站','图书馆站'],cols:['A班','B班','C班'],grid:[['09:10','10:10','11:10'],['09:25','10:25','11:25'],['09:45','10:45','11:45']],target:[1,1],questions:[q('B班在公园站几点出发','10:25')]},{type:'x-timetable',mode:'grid',prompt:'两组人各选一种运动。用行列的合计补齐空格，再比较。这里每人只记一次。',rows:['小组A','小组B','合计'],cols:['足球','羽毛球','游泳','合计'],grid:[[4,null,2,10],[3,5,4,null],[7,9,null,22]],missing:[[0,1,4],[1,3,12],[2,2,6]],questions:[q('B组比A组多几人选羽毛球',1)]},{type:'x-timetable',mode:'journey',prompt:'10:50出发，11:20到。向前走分钟，跨过11:00，再算经过多久。',start:650,end:680,questions:[q('共经过多少分钟',30),q('其中整小时数',0),q('余下多少分钟',30)]},{type:'x-timetable',mode:'journey',prompt:'另一趟列车10:50出发、13:13到。可以用不同大小的步子走，但每小时都是60分钟。',start:650,end:793,questions:[q('共经过多少分钟',143),q('其中整小时数',2),q('余下多少分钟',23)]}],
 timebuilder:[time('按这五次测温记录自己画图：选均匀刻度，逐点放好，再按时间连接。',tempPoints,[q('13点的温度',19)],{build:true}),time('这次记录有一段跨两小时。找每小时升温最快的一段，再估计10:30。',[[9,12],[10,16],[12,20],[13,21]],[q('按直线估计10:30的温度',17),q('10点到12点每小时升温多少℃',2),q('每小时升温最快的一段',['0'],[['0','9点到10点'],['1','10点到12点'],['2','12点到13点']]),q('没有实测的中间值',['estimate'],[['estimate','只能作有条件估计'],['exact','一定就是图上数值']])],{build:true}),time('仍是同一组温度。改变纵轴刻度，观察陡缓的样子；数值有没有变？',tempPoints,[q('9点到10点增加多少℃',4),q('改刻度改变了什么',['look'],[['look','图的外观，原记录没变'],['value','实际气温变了']])],{changeScale:true})],
 fractiondots:[dots('每条彩带量到最近1/8厘米。把每份记录放到自己的位置，空着的刻度也要留下。',[35,36,35,38,39,36],[q('总共几条彩带',6),q('最长与最短相差多少厘米','1/2')],{d:8,min:32,max:40,unit:'厘米'}),dots('先放好4又3/8与4又1/2厘米两个点，再把两条彩带的总长加出来。',[35,36],[q('两条总长（厘米）','8 7/8')],{d:8,min:32,max:40,unit:'厘米'}),dots('四杯分别有3/4、1/2、1/4、1/2杯。先记录原量，再每次倒1/8杯，让四杯一样多。',[6,4,2,4],[q('原来共有多少杯','2'),q('平均每杯有多少','1/2')],{d:8,min:0,max:8,unit:'杯',fair:true})],
 dotrecords:[dots('20人各有一个月读书记录。逐条放点：四个3要叠在3上，没人读7本也要保留7的位置。',bookValues,[q('总共记录几人',20),q('读3本的有几人',4),q('7这个位置为什么空',['gap'],[['gap','没有人记录7本，刻度仍在'],['remove','7这个数不存在']])]),dots('看看另一张已经画好的图。5上面6个点，是什么意思？',bookValues,[q('读5本的有几人',6),q('最少读几本',0),q('最多读几本',12),q('最常见的本数',5),q('总共几人',20),q('这堆点表示',['six'],[['six','六个人各读5本'],['one','一个人读6本']])],{given:true}),dots('换一组记录，数值6没有出现，3只出现两次。不要沿用上一张图的形状。',[1,2,2,3,3,5,5,5,7,8],[q('总共几人',10),q('最常见的本数',5)],{max:8})],
 piepieces:[pie('整圈代表60人。读出步行这一块的份额，再换成人数。',[15,30,15],{mode:'read',labels:['步行','公交','骑车'],questions:[q('步行占整体几分之几','1/4'),q('步行占百分之几',25),q('步行有几人',15)]}),pie('20票里苹果10、香蕉5、橙子5。亲手留下每一块的角度，拼成一圈。',[10,5,5]),pie('两组都占120°的足球扇区。一组30人，另一组12人；人数会一样吗？',[10,20],{mode:'read',labels:['足球','其他'],questions:[q('30人那组有几人选足球',10),q('12人那组有几人选足球',4),q('同样的扇区角表示',['share'],[['share','同样的比例，人数要看总数'],['number','同样的人数']])],otherTotal:12}),pie('换成5票、3票、2票。每个扇区都要对上自己的份额，只凑满360°不够。',[5,3,2])],
 chartfamilies:[hist('把这些模拟用时归组。可以选5、10或20秒宽的区间，但边界不能重叠或漏空。',[1,4,6,9,10,12,17,19,20,24,28,29,30,31,34,38],{start:0,end:40,widths:[5,10,20],unit:'秒',questions:[q('30秒应该放在哪里',['right'],[['right','左边界为30的区间（若每组10秒）'],['left','20≤t<30']])]}),pie('这份餐点选择共有12票：6、4、2。把票数变成角度，再真正拼出圆。',[6,4,2],{labels:['面食','米饭','其他']}),compare('同一种运动，比较A组和B组。结论要同时看两边。',['足球','游泳','羽毛球'],[8,6,4],[5,9,4],[q('A组比B组多几人选足球',3),q('B组比A组多几人选游泳',3),q('羽毛球两组相差几人',0)])],
 displaychoices:[compare('同样的12、9、6票，换成柱图和图画。先看图例，再判断哪种更方便回答你的问题。',['苹果','香蕉','梨'],[12,9,6],null,[q('苹果比香蕉多几票',3)],{mode:'represent',scale:3,unit:'票'}),dots('这些是模拟手掌张开的宽度。用两端圈住大多数记录，并指出少数较大的值。',[14,15,15,16,16,16,16,17,18,21,22],[q('最多记录聚在多少厘米附近',16),q('少数大值在',['large'],[['large','21、22厘米'],['small','14厘米']])],{min:12,max:24,unit:'厘米',given:true,cluster:[15,17]}),compare('两组各6人的身高。用同一把尺看整组，别只比较最高的人。',['甲组','乙组'],[140,142,144,146,148,150],[140,145,150,155,160,165],[q('甲组最高与最低相差多少厘米',10),q('乙组最高与最低相差多少厘米',25),q('哪组范围更大',['b'],[['a','甲组'],['b','乙组']])],{mode:'distributions',unit:'厘米'})],
 histogram:[hist('把30份模拟身高放进10厘米宽的格子。150正好在边界，该归哪一格？',heights,{questions:[q('150≤h<160的有几人',10),q('低于150厘米的共几人',14)]}),hist('原记录先收起来。只从这张分组图读人数，再说明能看到与看不到什么。',heights,{given:true,questions:[q('150≤h<160有几人',10),q('低于150厘米共几人',14),q('大多数记录集中',['middle'],[['middle','140到160厘米一带'],['edge','170到180厘米一带']]),q('最高那个人确切多少厘米',['unknown'],[['unknown','分组图不能确定'],['172','一定172厘米']]),q('正好145厘米的有几人',['unknown'],[['unknown','仅凭分组图不能确定'],['9','9人']])]}),hist('看看相邻区间为什么贴在一起，再和运动类别的柱图作区别。',[130,135,140,145,150,155,160,165],{questions:[q('为什么这些柱子相接',['continuous'],[['continuous','数值区间在连续尺上相邻'],['pretty','只是为了好看']]),q('运动类别的顺序能换吗',['yes'],[['yes','可以，只要类别与数量对应'],['no','绝不能换']]),q('身高区间顺序能任意换吗',['no'],[['no','不能，会破坏数轴位置'],['yes','可以任意换']])]})],
 boxsummary:[{type:'x-boxsummary',mode:'build',prompt:'先把五个位置放到同一把尺上，再画箱与两条须。这里须从最小值走到最大值。',summary:[3,6,9,14,21],domain:[0,24],questions:[q('中间那个位置',9),q('箱子的跨度',8),q('最小到最大的跨度',18),q('须线到哪里',['minmax'],[['minmax','最小与最大'],['fence','自动删去两端']])]},{type:'x-boxsummary',mode:'hidden',prompt:'这两组数的五个位置相同。试着改一个内部数，看看箱线图能不能发现每一个变化。',summary:[3,6,9,14,21],domain:[0,24],data:[3,4,6,6,8,9,9,12,14,14,18,21],other:[3,6,6,6,6,9,9,14,14,14,14,21],questions:[q('右边须更长，表示',['spread'],[['spread','顶部约四分之一的数更分散'],['more','这里一定有更多人']]),q('仅看箱线图能知道什么',['median'],[['median','中位数是9'],['mean','平均数一定是9'],['cluster','大多数值一定靠近9'],['size','确切人数']])]}, {type:'x-boxsummary',mode:'compare',prompt:'两组同一测量的箱线图。一起比较中间位置与中间一半的跨度，不能只看最大值。',summary:[130,140,150,160,175],second:[135,145,155,158,180],domain:[120,190],unit:'厘米',questions:[q('第二组中间位置（厘米）',155),q('第一组中间一半跨度',20),q('第二组中间一半跨度',13),q('哪组中间一半更集中',['second'],[['second','第二组'],['first','第一组']])]}],
 scattercraft:[scatter('十份记录，每份把气温和销量配成一个点。放好后手调一条趋势线，再用它估计20℃时的销量。',cloud),scatter('另一份模拟数据有向下的趋势。画线并估计范围内的值；向下也能是一种联系。',[[10,32],[12,27],[14,28],[16,23],[18,23],[20,19],[22,18],[24,17],[26,13],[28,12]],{trend:'negative',fit:[32,10],xlabel:'室外气温（℃）',ylabel:'热饮销量（份）'}),scatter('这次只用观察范围内的趋势估计。30℃以外的预测为什么需要更谨慎？',cloud,{outside:36})],
 scattermeaning:[scatter('天气更暖时，点大体往哪边走？先落点，再用自己的直线估计中间的销量。',cloud.slice(0,6),{xDomain:[10,22],fit:[12,24],predict:16}),scatter('热饮记录随气温往下走。把向下趋势与没有明显趋势分开。',[[10,30],[12,27],[14,25],[16,22],[18,19],[20,18]],{trend:'negative',xDomain:[10,22],xlabel:'气温（℃）',ylabel:'热饮销量（份）',fit:[30,15],predict:16}),scatter('每个点是同一位模拟参与者的鞋码分组编号与随机卡片数。这组点没有明显直线趋势，就不要硬加一条预测线。',[[1,2],[2,8],[3,5],[4,5],[5,8],[6,2]],{xDomain:[0,7],yDomain:[0,10],xlabel:'鞋码分组编号',ylabel:'随机卡片数',xTicks:[1],yTicks:[1,2],trend:'none',predict:null}),{type:'x-correlationlab',prompt:'在这个说明模型里，天气同时改变冰淇淋销量和泳池人数。先猜一猜，再改变天气；另外试试把纵轴数值翻倍，会不会让点更贴线。',points:cloud,xDomain:[10,30],yDomain:[0,80]}],
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([k,v])=>[k,structuredClone(v.at(-1))]));
export const BRIDGES=[];
const link=(from,to,title,a,b)=>BRIDGES.push({from,to,title,summary:'做过两边的操作，再把这条真实来源关系连起来。',tasks:[structuredClone(a),structuredClone(b)],phase:5,batch:'B20'});
// Each connection is checked against the pinned source graph. No route-order edges.
link('tally','digitalcharts','计数与图例，接到工具记录',TASKS.digitalcharts[1],TASKS.digitalcharts[0]);
link('sortdata','digitalcharts','分好类，才能让每条记录有去处',T19.categoryuse[0],TASKS.digitalcharts[1]);
link('digitalcharts','digitalstudy','工具里的记录，接到一份调查',TASKS.digitalcharts[0],T19.digitalstudy[1]);
link('scaledgraphs','timeorcategory','先读刻度，再沿时间看变化',T04.scaledgraphs[0],TASKS.timeorcategory[0]);
link('datavocab','timeorcategory','横纵轴的意思，决定哪些点能连',TASKS.timeorcategory[2],TASKS.timeorcategory[0]);
link('displaypurpose','displaychoices','同一记录，按问题选择表示',TASKS.displaychoices[0],TASKS.displaychoices[2]);
link('timeorcategory','displaychoices','分清数据，再比较画法',TASKS.timeorcategory[2],TASKS.displaychoices[0]);
link('displaychoices','checkrecords','好看的图也要回看原记录',TASKS.displaychoices[0],T19.checkrecords[0]);
link('timeorcategory','linequestions','沿时间读点，再比较前后变化',TASKS.timeorcategory[0],TASKS.linequestions[0]);
link('scaledgraphs','timetable','读对刻度，也要对准行列',T04.scaledgraphs[0],TASKS.timetable[0]);
link('linequestions','timebuilder','会读变化，再自己把点放好',TASKS.linequestions[2],TASKS.timebuilder[1]);
link('datavocab','timebuilder','标清时间和单位，再构造折线',TASKS.timeorcategory[0],TASKS.timebuilder[0]);
link('unlikeparts','fractiondots','小份相加，接到一组测量',TASKS.fractiondots[1],TASKS.fractiondots[2]);
link('fractiondots','dotrecords','分数位置到整数位置，每点仍是一条',TASKS.fractiondots[0],TASKS.dotrecords[2]);
link('fractiondots','measurestory','位置来自测量，也要留下测量方法',TASKS.fractiondots[0],T19.measurestory[1]);
link('dotrecords','measurestory','数全每个点，再说明记录数',TASKS.dotrecords[1],T19.measurestory[0]);
link('datavocab','piepieces','整圈与角度的单位都要说明',TASKS.piepieces[0],TASKS.piepieces[1]);
link('piepieces','chartfamilies','份额转角度，换数据仍要对应',TASKS.piepieces[1],TASKS.chartfamilies[1]);
link('timeorcategory','chartfamilies','数据类型不同，表示也跟着换',TASKS.timeorcategory[2],TASKS.chartfamilies[0]);
link('timetable','chartfamilies','按行列找值，再按区间整理',TASKS.timetable[1],TASKS.chartfamilies[0]);
link('scaledgraphs','histogram','高度读人数，宽度读区间',T04.scaledgraphs[0],TASKS.histogram[2]);
link('datavocab','histogram','连续数值的尺，接到连续区间',TASKS.timeorcategory[0],TASKS.histogram[2]);
link('timeorcategory','histogram','分类和连续值，不能混着画',TASKS.timeorcategory[2],TASKS.histogram[2]);
link('dotrecords','histogram','一人一个点，合到一个区间',TASKS.dotrecords[2],TASKS.histogram[0]);
link('histogram','boxsummary','分组会藏细节，五数概括也会',TASKS.histogram[1],TASKS.boxsummary[1]);
link('scattermeaning','scattercraft','先看整体趋势，再手调一条线',TASKS.scattermeaning[2],TASKS.scattercraft[0]);
