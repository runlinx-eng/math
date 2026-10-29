import {TASKS as old02} from '../phase4/b02.js';
import {TASKS as old20} from './b20.js';
const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B28'});
export const LESSONS={
 compareheight:item('mt_uhuxX8sg9f','先从同一起点比','长度与高度的直接比较','比较长短或高矮时，先让一端或底部对齐，再看另一端。模型可以说明长、短、高、低，也可以比较两倍和一半。','不把起点对齐，为什么容易看错？'),
 compareweight:item('mt_-P1kdZhHbL','大的就一定更重吗','质量的直接比较','外形大不一定重。天平两边放上物体后，较低的一边较重；平衡时两边相等。这里是模拟天平，不代替亲手掂量。','看起来更大的物体为什么可能更轻？'),
 lengthstart:item('mt_KaF0SQvaiu','拿小块排一排','用统一单位测量长度','把一样长的单位从头到尾紧挨着摆，数量和单位一起说明长度；用尺时零刻度要对准起点。','只说“用了六个”，为什么别人还不知道有多长？'),
 weightstart:item('mt_zd0YkB3xNj','用砝码找出多重','用天平与刻度表示质量','让物体与等量的砝码平衡，砝码的总量就是用这些单位表示的质量。记录时数字要带单位；屏幕模型不评实物操作。','同一个物体换一套更小的砝码，块数会怎样？'),
 ordermeasure:item('mt_BFJ-ch_8QU','先量，再排顺序','比较和排列测量值','比较测量值要先确认量的类型和单位；单位不同先换成同一种。相等用等号，大小关系用大于或小于表示。','50 cm 和 1 m，为什么不能只比50和1？'),
 indirectlength:item('mt_skYly2Qm01','不能挨着，怎么比','长度排序与间接比较','不能把物体放在一起时，可以用同一根纸条依次记下长度再比较。如果A比B长、B比C长，那么A比C长。','同一根纸条为什么能帮两个不能碰面的物体比较？'),
 sameunitlength:item('mt_cqSf213hSa','单位要挨着排','相同单位的长度迭代','测量长度是数出多少个同样长的单位刚好铺满。单位之间不能留空或重叠，单位本身也不能一会儿大一会儿小。','放了很多块，为什么也可能量得不对？'),
 lengthdifference:item('mt_xWg0lI_gG4','长多少，而不只是更长','长度差与单位','先用同一种单位量出两个长度，再用较长的减较短的，差也要带原来的长度单位。','两件东西都加长2厘米，它们的长度差会变吗？'),
 estimateLength:item('mt_OzRZ89GrQW','先猜多长，再量','用参照物估计长度','先借助熟悉的单位作参照，再留下估计并测量；估计和测量值的差可以帮助调整下一次判断。','一厘米的小段能怎样帮你估一整段？'),
 lengthtools:item('mt_e4x3l2JeLI','挑一件合适的工具','长度测量工具与零点','根据物体选择尺、米尺或卷尺；让零刻度对准起点，读另一端并写出单位。这里练习屏幕模型，真实工具仍需实际操作。','尺子的边缘不是零刻度时，应该从哪里开始？'),
 twounits:item('mt_jHv4BgRK8B','同一段，换一把尺','同一长度的不同单位','同一段长度不因单位改变。单位较小时，通常需要更多个单位来铺满；厘米和英寸的数值不同，近似读数要标明“约”。','同一张桌子，为什么可以同时说约10厘米和4英寸？'),
 precisionunits:item('mt_e7tLi9SCIE','小单位能看清多少','单位大小与测量分辨率','同一个量用较小的均匀单位时，数量通常更多，剩下未量清的部分也可能更小。对齐、工具和读数同样影响结果，小单位不保证绝对准确。','为什么两支铅笔还剩一点，换小回形针更容易说清？'),
 readscales:item('mt_SOM6Imm2sO','两条刻度之间是多少','仪器刻度与数字读数','先看相邻标出的数字差多少，再判断中间位置；读数必须带单位。数字秒表的分和秒不能只看成同一个整数。','400和600正中间为什么是500？'),
 baseconversions:item('mt_d8al9JcajP','换单位，量没变','长度与时间单位换算','同一个量可以用不同单位表示：1 km是1000 m，1小时是60分钟，1周是7天。换成较小单位通常需要更多个单位。','3千米和3000米，是两段不同的路吗？'),
 metricconversions:item('mt_Zks8xyInSG','把大单位拆成小单位','公制单位及复名数换算','千米、米、厘米、毫米，以及千克与克、升与毫升各有固定关系。复名数先换成同单位，再合起来。','2千克350克为什么是2350克，不是235克？'),
 imperialconversions:item('mt_p6MhZJYYPN','不同单位怎样大约对应','公制与英制近似换算','这里用1英寸约2.5厘米、1千克约2.2磅、1升约1.75英制品脱作估计；1英寸实际恰好2.54厘米。英制品脱与美制液体品脱不同。','为什么用约等号，不能把估计当成精确值？'),
 decimalunits:item('mt_2VpdPjvewx','小数也能换单位','用小数表示单位换算','换单位是把同一个量重新计数。3250克是3.25千克，0.45千米是450米；不要只机械地添零。','换单位时，小数点移动的原因是什么？'),
 unitstories:item('mt_SqhXQhAEUf','先统一，再算下去','多步骤测量问题','有多个步骤时，先明确每个量与单位，再选择相乘、换算或比较。比较2.5升和2450毫升时，要先换成相同单位。','数字大的一定代表装得更多吗？'),
 mileskm:item('mt_3tPI0HqqcN','英里和千米怎么比','英里与千米的近似换算','用5英里约等于8千米作估计，1英里约1.6千米。数量翻倍，两种表示一起翻倍；实际英里到千米的精确关系略有不同。','为什么10英里约16千米，而不是只在10上加3？'),
 measureplot:item('mt_mayItsxMUu','量完，把记录排上图','整数测量与点图','逐个测量并按要求取整，再在均匀刻度上为每条记录放一个点。某个位置没有记录，也不能把那个刻度挤掉。','最高的一堆点表示最长，还是出现次数最多？'),
 quarterplot:item('mt_ghK1mnEstc','半格和四分之一格','半、四分之一单位的测量点图','先看每个完整单位被平均分成几段，再把长度取到最近的半或四分之一单位。数轴要等距，一条记录对应一个点。','2¼、2½和2¾在尺上为什么要等间隔？'),
 eighthplot:item('mt_42QD6nYjiZ','八分之一格的记录','分数单位点图与加减','每条测量记录在对应刻度放一个点；最长减最短得到差。求总长度时，要把每条长度相加，不能只数点的个数。','两条都是2¼，求总长时要加几次2¼？')
};
export const SECTIONS=[{id:'units-compare',title:'比一比，再量'},{id:'units-measure',title:'用不同的尺'},{id:'units-change',title:'换单位，画记录'}];
const route=(id,section,title,ids)=>({id,section,title,ids,packIds:['units'],themeId:'measure',color:'#6c9479'});
export const ROUTES=[
 route('FI','units-compare','从同一起点比',['compareheight','compareweight']),
 route('FJ','units-compare','用小块和天平量',['lengthstart','weightstart']),
 route('FK','units-compare','比一比，排个顺序',['ordermeasure','indirectlength']),
 route('FL','units-measure','单位挨着排，差多少',['sameunitlength','lengthdifference']),
 route('FM','units-measure','先估，再选工具',['estimateLength','lengthtools']),
 route('FN','units-measure','换种单位，量得更细',['twounits','precisionunits']),
 route('FO','units-measure','读刻度，换单位',['readscales','baseconversions']),
 route('FP','units-change','公制与近似对应',['metricconversions','imperialconversions']),
 route('FQ','units-change','带着单位解决问题',['decimalunits','unitstories']),
 route('FR','units-change','路程和测量记录',['mileskm','measureplot']),
 route('FS','units-change','半格、四分之一与八分之一',['quarterplot','eighthplot'])
];
const clone=x=>structuredClone(x),q=(label,value,options)=>({label,value,...(options?{options}:{})});
const opt=(...xs)=>xs.map(([id,label])=>({id,label})),lr=opt(['left','A'],['right','B'],['equal','一样']);
const cmp=(prompt,items,want,extra={})=>({type:'x-m28-compare',prompt,items:items.map(([name,length])=>({name,length})),choices:lr,want,questions:[],...extra});
const units=(prompt,length,size,unit,extra={})=>({type:'x-m28-units',prompt,length,size,unit,object:'物体',questions:[],...extra});
const ruler=(prompt,value,unit,extra={})=>({type:'x-m28-ruler',prompt,value,unit,object:'物体',questions:[],...extra});
const balance=(prompt,left,right,want,extra={})=>({type:'x-m28-balance',mode:'compare',prompt,left,right,want,choices:lr,questions:[],...extra});
const mass=(prompt,mass,unit,weights,exampleWeights,extra={})=>({type:'x-m28-balance',mode:'weigh',prompt,mass,unit,weights,exampleWeights,questions:[],...extra});
const scale=(prompt,kind,value,unit,min,max,major,extra={})=>({type:'x-m28-scale',prompt,kind,value,unit,min,max,major,questions:[],...extra});
const convert=(prompt,rows,extra={})=>({type:'x-m28-convert',prompt,rows,questions:[],...extra});
const row=(value,from,to,expected,label)=>({value,from,to,expected,...(label?{label}:{})});
const plot=(prompt,raw,rawDen,den,start,end,extra={})=>({type:'x-m28-plot',prompt,raw,rawDen,den,start,end,unit:'英寸',questions:[],...extra});
const order=(prompt,items,extra={})=>cmp(prompt,items,null,{mode:'order',...extra});
const vessels=(prompt,capacities,extra={})=>({type:'x-m28-vessels',prompt,mode:'order',capacities,units:[{id:'small',amount:50,label:'50 mL 量杯'}],questions:[],...extra});
const refine=(prompt,total,large,small,extra={})=>({type:'x-m28-refine',prompt,total,sizes:[{size:large,label:'大单位'},{size:small,label:'小单位'}],questions:[],...extra});
const tools=opt(['ruler','短尺'],['tape','卷尺'],['meter','米尺'],['yard','英制码尺'],['thermo','温度计']);
const larger=q('同一个量，单位变小时需要的数量','more',[['more','通常更多'],['less','一定更少']]);
const approximate=q('这次关系是','approx',[['approx','近似，不是精确相等'],['exact','永远精确相等']]);
export const TASKS={
 compareheight:[
  cmp('把两人的脚下对齐，再看看谁更高。',[['人A',6],['人B',8]],'right',{orientation:'height',ask:'谁更高？'}),
  cmp('把两座塔放在同一条地线上，再比高矮。',[['塔A',9],['塔B',6]],'left',{orientation:'height',ask:'哪座塔更高？'}),
  cmp('把两条丝带的起点对齐，再比较。',[['丝带A',4],['丝带B',8]],'right',{questions:[q('长丝带是短丝带的几倍',2)]})
 ],
 compareweight:[
  balance('一个大球和一块小石头，先放上天平再比较。',{name:'球A',mass:3,size:42},{name:'石头B',mass:5,size:23},'right'),
  balance('换成两件东西，看看有没有一样重。',{name:'盒A',mass:4,size:40},{name:'袋B',mass:4,size:24},'equal'),
  balance('先看天平，再说谁更重、谁更轻。',{name:'物体A',mass:6,size:26},{name:'物体B',mass:2,size:42},'left',{questions:[q('较轻的是','right',[['left','物体A'],['right','物体B']])]})
 ],
 lengthstart:[
  units('用一样长的回形针把这本模拟书从头量到尾。',8,2,'回形针',{object:'书'}),
  ruler('把尺的零刻度对准左端，读出这条模拟桌边。',7,'cm',{object:'桌边',axisMax:10,tick:1}),
  units('换一段模拟桌边，用小方块量完并写上单位。',6,1,'块',{object:'桌边'})
 ],
 weightstart:[
  balance('先把两个物体放在天平上，看看哪个更重。',{name:'书A',mass:5,size:32},{name:'盒B',mass:3,size:40},'left'),
  mass('把一样重的小块放到右边，让天平平衡。',5,'块',[1],[1,1,1,1,1],{object:'书'}),
  scale('指针在400和600正中间，读出它的质量。','dial',500,'g',0,800,200)
 ],
 ordermeasure:[
  cmp('把两段长度放到同一起点，按厘米比较。',[['A',45],['B',32]],'left',{showRuler:true,major:5,questions:[q('45 cm 与 32 cm 的关系','>',[['>','45 cm ＞ 32 cm'],['<','45 cm ＜ 32 cm']])]}),
  vessels('用同一个量杯装满三个容器，再从少到多排。',[100,200,150],{names:['杯A','杯B','杯C']}),
  cmp('两段对齐后是否一样长？',[['A',5],['B',5]],'equal',{showRuler:true,questions:[q('相等时用什么符号','=',[['=','='],['>','＞']])]})
 ],
 indirectlength:[
  order('把三条丝带从短到长排起来。',[['红',7],['蓝',3],['绿',5]]),
  cmp('这三件物体不能放到一起。用同一根纸条分别记下，再比较。',[['A',8],['B',5],['C',3]],'left',{mode:'indirect',choices:opt(['left','A最长'],['right','B最长'],['third','C最长']),ask:'哪一件最长？',questions:[q('A比B长、B比C长','yes',[['yes','A比C长'],['no','不能比较A和C']])]}),
  order('换一组，从短到长排列。',[['绳A',6],['绳B',9],['绳C',4]])
 ],
 sameunitlength:[
  units('把同样长的小块从头到尾挨着放。',6,1,'块',{object:'书'}),
  units('换成较长的相同纸片，量另一条带子。',8,2,'回形针',{object:'带子'}),
  units('先试着铺满：留空或重叠都不能算量完。',9,1,'块',{object:'木条'})
 ],
 lengthdifference:[
  cmp('同一把厘米尺量两条带子，看看长多少。',[['带A',14],['带B',7]],'left',{showRuler:true,questions:[q('长多少 cm',7)]}),
  cmp('书架和桌子底部对齐，按厘米比较高度。',[['书架',160],['桌子',120]],'left',{orientation:'height',showRuler:true,major:20,ask:'哪一件更高？',questions:[q('高多少 cm',40)]}),
  cmp('两条长度是12 cm和9 cm，先对齐再求差。',[['A',12],['B',9]],'left',{showRuler:true,questions:[q('长多少 cm',3)]})
 ],
 estimateLength:[
  ruler('先借助1厘米的小段估一估，再移动尺子检查。',12,'cm',{axisMax:15,estimate:true,estimateExample:10}),
  ruler('先用1米作参照，估计这段距离。',3,'m',{axisMax:5,estimate:true,estimateExample:2}),
  ruler('先用1英寸作参照，再估一估这段。',6,'英寸',{axisMax:8,estimate:true,estimateExample:5}),
  ruler('先用1英尺作参照，再检查估计。',2,'英尺',{axisMax:4,estimate:true,estimateExample:3})
 ],
 lengthtools:[
  ruler('量一条短书边：选工具，零刻度对齐。',12,'cm',{object:'书边',axisMax:15,tool:'ruler',tools}),
  ruler('量房间里的长距离：选容易拉开的工具。',4,'m',{object:'房间',axisMax:6,tool:'tape',tools}),
  ruler('量一段接近米尺长度的直线。',1,'m',{object:'木条',axisMax:2,tool:'meter',tools}),
  ruler('换一把英寸尺，读出这段。',6,'英寸',{axisMax:8,tool:'ruler',tools}),
  ruler('用一把三英尺长的码尺，量这段长度。',3,'英尺',{axisMax:3,tool:'yard',tools})
 ],
 twounits:[
  ruler('同一张桌面模型，用厘米尺量到最接近的整厘米。',10,'cm',{object:'桌面',actual:10.16,axisMax:12.7,tick:.1}),
  ruler('还是这张桌面，换英寸尺量一量。',4,'英寸',{object:'桌面',axisMax:5,tick:1,questions:[larger]}),
  units('再用较长的单位量同一段，比较需要的数量。',10,2,'回形针',{questions:[larger]})
 ],
 precisionunits:[
  refine('同一本书，先用长铅笔，再用短回形针。',9,4,1,{object:'书',sizes:[{size:4,label:'长铅笔'},{size:1,label:'短回形针'}],questions:[larger]}),
  vessels('一大杯放不进小玻璃杯。换成小勺，装满它。',[60],{mode:'precision',names:['小玻璃杯'],units:[{id:'cup',amount:100,label:'大杯 100 mL'},{id:'spoon',amount:10,label:'小勺 10 mL'}],requiredUnit:'spoon',questions:[q('用了几勺',6)]}),
  refine('同一份质量，用大砝码再用小砝码比较剩余部分。',10,3,1,{object:'质量条',sizes:[{size:3,label:'大砝码单位'},{size:1,label:'小砝码单位'}],questions:[larger]}),
  refine('量模拟桌边，先用手掌跨度，再换成计数小块。',9,4,1,{object:'桌边',sizes:[{size:4,label:'手掌跨度'},{size:1,label:'计数小块'}],questions:[larger]})
 ],
 readscales:[
  scale('秤上400到600的中间，指针指向哪里？','dial',500,'g',0,800,200),
  scale('量杯的液面在150和200正中间。','jug',175,'mL',0,250,50),
  scale('温度计每两个数字差2度，液面在哪？','thermo',23,'℃',20,28,2),
  scale('尺上的每厘米又分成10小格，终点在哪里？','ruler',12.7,'cm',0,15,1,{minor:.1}),
  scale('秒表显示1分26.4秒。换成多少秒记录？','digital',86.4,'秒',0,0,0,{display:'01:26.4'})
 ],
 baseconversions:[
  convert('同一段路，3千米相当于多少米？',[row(3,'km','m',3000)],{hint:'1 km = 1000 m。'}),
  convert('同一段时间，2小时相当于多少分钟？',[row(2,'小时','分钟',120)],{hint:'1小时 = 60分钟。'}),
  convert('同一段时间，5周相当于多少天？',[row(5,'周','天',35)],{hint:'1周 = 7天。'})
 ],
 metricconversions:[
  convert('3.5千米换成米，两条数量要对齐。',[row(3.5,'km','m',3500)],{hint:'1 km = 1000 m。'}),
  convert('把几段厘米换成毫米，看看每一行。',[row(1,'cm','mm',10),row(2,'cm','mm',20),row(3,'cm','mm',30)],{hint:'1 cm = 10 mm。'}),
  convert('2千克350克合起来是多少克？',[row(2.35,'kg','g',2350,'2 kg 350 g')],{hint:'1 kg = 1000 g。'})
 ],
 imperialconversions:[
  convert('用1英寸约2.5厘米，估一估8英寸。',[row(8,'英寸','cm',20)],{approx:true,hint:'1英寸约2.5厘米；精确值为2.54厘米。',questions:[approximate]}),
  convert('用1千克约2.2磅，估一估40千克。',[row(40,'kg','磅',88)],{approx:true,hint:'1 kg 约 2.2 磅。',questions:[approximate]}),
  convert('用1升约1.75英制品脱，估一估2升。',[row(2,'L','英制品脱',3.5)],{approx:true,hint:'这里使用英制品脱；美制液体品脱的大小不同。',questions:[approximate]})
 ],
 decimalunits:[
  convert('3250克与多少千克表示同一份质量？',[row(3250,'g','kg',3.25)],{hint:'1000 g = 1 kg。'}),
  convert('0.45千米相当于多少米？',[row(.45,'km','m',450)],{hint:'1 km = 1000 m。'}),
  convert('把千米、米、厘米和毫米的相邻关系接起来。',[row(1,'km','m',1000),row(1,'m','cm',100),row(1,'cm','mm',10)],{questions:[q('把米换成厘米，要分成多少份',100)]})
 ],
 unitstories:[
  convert('每份面粉0.75千克，做3份，需要多少克？',[row(2.25,'kg','g',2250,'每份0.75 kg，共3份')],{hint:'先算三份一共多少千克；1 kg = 1000 g。',questions:[q('三份一共多少 kg',2.25)]}),
  convert('2.5升和2450毫升，哪个多？先换成同一单位。',[row(2.5,'L','mL',2500)],{hint:'1 L = 1000 mL。',questions:[q('哪个多','first',[['first','2.5 L'],['second','2450 mL']]),q('多多少 mL',50)]}),
  convert('每小时走60千米，走1.5小时。先把时间换成分钟。',[row(1.5,'小时','分钟',90)],{hint:'1小时 = 60分钟。',questions:[q('一共走多少 km',90)]})
 ],
 mileskm:[
  convert('用5英里约8千米，估计40英里。',[row(40,'英里','km',64)],{approx:true,hint:'5英里约8千米。',questions:[approximate]}),
  convert('把5英里对应8千米，缩小到1英里。',[row(1,'英里','km',1.6)],{approx:true,hint:'5英里约8千米。',questions:[q('为什么约是1.6','divide',[['divide','8千米平均分成5份'],['add','给英里数加3']])]}),
  convert('比较10千米和6英里，先把6英里估成千米。',[row(6,'英里','km',9.6)],{approx:true,hint:'5英里约8千米。',questions:[q('哪个较长','ten',[['ten','10 km'],['six','6英里']]),q('大约相差多少 km',.4)]})
 ],
 measureplot:[
  plot('逐个量模拟纸条，取最近的整厘米，再画点图。',[31,39,42,52],10,1,2,6,{unit:'cm',questions:[q('4 cm 有几个',2),q('最长与最短相差多少 cm',2)]}),
  plot('换一组模拟长度，取最近的整厘米并记录。',[21,29,32,38,41],10,1,1,5,{unit:'cm',questions:[q('3 cm 有几个',2)]}),
  plot('量完每一根，再从点图找最长的一根。',[30,40,40,50],10,1,2,6,{unit:'cm',questions:[q('最长是多少 cm',5)]})
 ],
 quarterplot:[
  plot('量五支模拟铅笔，取到最近的四分之一英寸。',[35,41,44,48,52],16,4,8,14,{questions:[q('2½英寸有几个',1)]}),
  plot('量四支模拟铅笔，取到最近的半英寸，再画点图。',[17,20,23,24],8,2,4,7,{names:['铅笔A','铅笔B','铅笔C','铅笔D'],questions:[q('3英寸有几个',2)]}),
  plot('换一组，读出最长和最短之间的差。',[32,36,40,44],16,4,8,12,{questions:[q('最长比最短多多少英寸',.75)]})
 ],
 eighthplot:[
  plot('量模拟小苗的长度，在八分之一英寸刻度上放点。',[17,18,18,20],8,8,16,24,{names:['小苗A','小苗B','小苗C','小苗D'],questions:[q('最长比最短多多少英寸',.375),q('四个长度合起来多少英寸',9.125)]}),
  plot('换一组短长度，逐条放点并求总长。',[1,2,3,4],8,8,0,8,{questions:[q('最长与最短相差多少英寸',.375),q('四个长度一共多少英寸',1.25)]}),
  plot('比较有重复长度的记录：相同长度也要各放一个点。',[16,17,17,18],8,8,16,20,{questions:[q('2 1/8 英寸出现几次',2),q('所有长度相加是多少英寸',8.5)]})
 ]
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,ts])=>[id,clone(ts.at(-1))]));
export const BRIDGES=[];
const link=(from,to,title,summary,a,b)=>BRIDGES.push({from,to,title,summary,tasks:[clone(a),clone(b)],phase:5,batch:'B28'});
link('attributes','compareheight','先看比较什么，再对齐','选长短或高矮，再让两个起点对齐。',old02.attributes[0],TASKS.compareheight[0]);
link('compareheight','lengthstart','从更长，到长多少','先对齐比较，再用相同小块量完整段。',TASKS.compareheight[2],TASKS.lengthstart[0]);
link('compareheight','indirectlength','放不到一起，也能比较','先在同一起点比较，再用同一纸条记录不同长度。',TASKS.compareheight[2],TASKS.indirectlength[1]);
link('compareweight','weightstart','先比轻重，再数砝码','先让天平比较两物体，再用小砝码取得平衡。',TASKS.compareweight[0],TASKS.weightstart[1]);
link('lengthstart','sameunitlength','量一次，再检查空隙','先用回形针量，再检查小单位是否紧挨。',TASKS.lengthstart[0],TASKS.sameunitlength[2]);
link('sameunitlength','lengthtools','小块接起来，变成尺','先把相同单位排满，再把尺的零点对齐。',TASKS.sameunitlength[0],TASKS.lengthtools[0]);
link('lengthtools','lengthdifference','量清楚，再找差','先量一段，再比较两段长度相差多少。',TASKS.lengthtools[0],TASKS.lengthdifference[0]);
link('lengthtools','estimateLength','选好尺，再先估一估','先用尺量，再借参照物估计并检查。',TASKS.lengthtools[0],TASKS.estimateLength[0]);
link('lengthtools','twounits','同一段，换一把尺','先用厘米尺，再看同一物体的英寸读数。',TASKS.lengthtools[0],TASKS.twounits[1]);
link('sameunitlength','precisionunits','换小单位，看剩余','先用相同小块量，再比较不同大小单位留下的余量。',TASKS.sameunitlength[0],TASKS.precisionunits[0]);
link('measure','readscales','先对准，再看刻度中间','先用工具量，再读两个标记之间的数。',old02.measure[0],TASKS.readscales[0]);
link('baseconversions','metricconversions','同一条路的两种单位','先看3千米，再换一段3.5千米的表示。',TASKS.baseconversions[0],TASKS.metricconversions[0]);
link('metricconversions','imperialconversions','精确换算与近似对应','先换公制单位，再观察英寸和厘米的近似关系。',TASKS.metricconversions[0],TASKS.imperialconversions[0]);
link('metricconversions','decimalunits','整数和小数都表示同一量','先把千克与克连起来，再用小数换回千克。',TASKS.metricconversions[2],TASKS.decimalunits[0]);
link('decimalunits','unitstories','换完单位，再解决问题','先换质量单位，再计算三份面粉。',TASKS.decimalunits[0],TASKS.unitstories[0]);
link('imperialconversions','mileskm','用近似关系比较路程','先观察近似单位，再把英里估成千米。',TASKS.imperialconversions[0],TASKS.mileskm[0]);
link('lengthtools','measureplot','量出的长度，可以画出来','先对齐尺子，再量几条纸带并作图。',TASKS.lengthtools[0],TASKS.measureplot[0]);
link('measureplot','quarterplot','整数刻度，再分得更细','先把整数长度放到点图，再量四分之一英寸。',TASKS.measureplot[0],TASKS.quarterplot[0]);
link('quarterplot','eighthplot','每个小格再分一半','先按四分之一放点，再比较八分之一的记录。',TASKS.quarterplot[0],TASKS.eighthplot[0]);
link('eighthplot','fractiondots','测量点，也是分数位置','先把测量放在八分之一刻度，再看分数点图。',TASKS.eighthplot[0],old20.fractiondots[0]);
