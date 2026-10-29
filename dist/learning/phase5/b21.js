import{TASKS as T19}from'./b19.js';
import{TASKS as T20}from'./b20.js';
const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B21'});
export const LESSONS={
 statwords:item('mt_fmm-P17Vka','几个“中间”，其实不同','平均数、中位数、众数与极差','总量均分、排序中间、最常出现，是不同的概括。极差是最大减最小的一个距离。数据一起变化不证明谁造成谁。','一个数变大时，哪种“中间”会追着它走？'),
 meanbalance:item('mt_Cg8VPguS_V','高的分给低的，最后多高','平均数的均分意义与逆向求值','总量保持不变，均分给原来的份数。这个值不必是某一条原记录。已知平均数和份数，可以倒推总量与缺项。','多加一份0，为什么不能当作什么也没发生？'),
 meandistance:item('mt_ZfpeI1CFyP','每个点离共同位置多远','平均绝对离差 MAD','先找到平均数，再把每个值到它的距离相加，连距离0也计入份数，最后再平均。MAD与原量单位相同；小一些表示围绕平均数更集中。','左右的距离为什么不能互相抵消？'),
 averagestory:item('mt_XSXnTQoQ4l','一个平均数，够讲清楚吗','中心、极差与异常值','比较两组既看中心也看散开程度。极端值可能是真实的，要查背景，不能只因它不好看就删掉。','两组平均一样，为什么体验可能完全不同？'),
 distributionlook:item('mt_OwYms2tB1L','一群点，藏着怎样的故事','分布的中心、离散、形态与异常','用同一把尺看中心、聚集、空隙、尾部与少数远点。图能显示现象，造成现象的原因还要额外证据。','图里有两个小群，能直接知道为什么吗？'),
 quartiles:item('mt_KCS9GbZgU_','先排队，再看中间一半','四分位数与四分位距 IQR','本活动先排序；奇数个时整体中间值不重复放进上下半组，再分别找两半的中间。IQR是两个四分位位置之差；重复值处不能机械按闭区间数25%。','把最大的一个搬远，中间一半一定跟着变吗？'),
 datasummary:item('mt_tuEnyrp5Ia','让别人知道你究竟看到了什么','带背景、中心与离散度的数据摘要','摘要要交代几份、量什么、怎样量、单位，以及中心和匹配的散开程度。平均数配MAD，中位数配IQR；长尾时后一组通常更稳健。','只写“平均是14”，别人还缺哪些信息？'),
 digitalsets:item('mt_mn765HbXi1','两组放在一起，怎么比才公平','分类、等级与数值数据的数字比较','不同人数比较等级分布时用比例，等级顺序保持一致；名称类别没有高低。数值记录用共同数轴看众数、范围和形态。','人数多的组，每类柱子都更高，就代表更喜欢吗？'),
 medialens:item('mt_8IsaoMPvod','这张图，有没有把你带偏','媒体统计图与结论审查','截掉柱图的零点会放大高度差的视觉比例。问过谁、多少人、怎么选，决定结论能说到哪里；改标题须保留这些限制。','9个人喜欢，什么时候不能写“九成孩子喜欢”？'),
 fairdraw:item('mt_4zgPzc6yu5','问一部分人，怎么选这部分','总体、样本与简单随机抽样','总体是想了解的全体，样本是实际选到的部分。从完整名单随机抽，人人有机会；只问容易碰到的人会偏。随机也不保证每次样本恰好均衡。','抽到了偏多的一组，能据此说抽签一定作弊吗？'),
 comparepeople:item('mt_km4V6d5IAh','样本不同，就能说整体不同吗','用随机样本比较两个总体','看差有多大，也看散开和抽样波动。抽样方法不公平时不能硬推整体；小于常见抽样波动的差，证据可能不够。','差1分，而抽几次就能波动3分，够下结论吗？'),
 estimatepeople:item('mt_fQ9Rw10fss','从这一小份，估一大群','样本比例与样本均值的总体估计','样本比例乘总体人数得到估计人数，样本平均可估总体平均，但都不是精确清点。前提是对象和选法适合，便利或自愿样本可能不能推广。','算出270，为什么还要写“大约”？'),
 comparegap:item('mt_A2hKhHXgL5','差得远不远，要用什么尺','用MAD刻画组间中心差与分布重叠','同一单位下，中心差可以除以MAD，说明相差约几个MAD。这个比值不能独自决定重叠，形态和朝向另一组的尾部也要看。','平均位置差一样远，为什么两组还可能重叠得不一样？'),
 samplevary:item('mt_x7V1qrkiqH','再抽一次，为什么答案会变','抽样变异与样本量','每次从同一总体重新随机抽，估计会因抽到的人不同而变。这不是必然做错。较大随机样本通常更稳定，但不保证每次更准；个体差异与样本均值的差异也不同。','五次结果的最小到最大，能保证罩住真实值吗？'),
};
export const SECTIONS=[{id:'stats-center',title:'找一个代表值'},{id:'stats-shape',title:'把两组放在一起看'},{id:'stats-sample',title:'从一部分推到整体'}];
const route=(id,section,title,ids)=>({id,section,title,ids,packIds:['summarize'],themeId:'data',color:'#6977b8'});
export const ROUTES=[route('DP','stats-center','分平、排队、找常客',['statwords','meanbalance']),route('DQ','stats-center','代表值之外，还差多少',['averagestory','meandistance']),route('DR','stats-shape','看形状，也看中间一半',['distributionlook','quartiles']),route('DS','stats-shape','公平地比较，清楚地表达',['digitalsets','datasummary']),route('DT','stats-sample','看清说法，问对人',['medialens','fairdraw']),route('DU','stats-sample','估一估，再抽一次',['estimatepeople','samplevary']),route('DV','stats-shape','两组差别有多可信',['comparepeople','comparegap'])];
const q=(label,value,options)=>({label,value,...(options?{options}:{})}),choice=(label,value,pairs)=>q(label,[value],pairs);
const centre=(prompt,values,extra={})=>({type:'x-statcentre',prompt,values,unit:'个',mode:'sort',metrics:['mean','median','mode','range'],questions:[],...extra});
const distance=(prompt,values,extra={})=>({type:'x-meandistance',prompt,values,unit:'厘米',questions:[],...extra});
const dist=(prompt,a,b,questions,extra={})=>({type:'x-distribution',prompt,a,b,unit:'分',questions,mode:'compare',...extra});
const report=(prompt,values,extra={})=>({type:'x-statbrief',prompt,values,unit:'分钟',attribute:'单程用时',method:'同一计时器，从出发到到达',who:'这组参与者',pair:'median',questions:[],...extra});
const sample=(prompt,extra={})=>({type:'x-samplelab',prompt,N:80,n:20,runs:1,methods:['all'],mode:'proportion',seed:202621,questions:[],...extra});
const media=(prompt,extra={})=>({type:'x-mediarepair',prompt,mode:'claim',questions:[],...extra});
const estimate=(prompt,extra={})=>({type:'x-estimate',prompt,mode:'count',N:900,n:60,k:18,questions:[],...extra});
const reaction=[.21,.22,.23,.24,.25,.26,.27,.28,.29,.30,.30,.31,.32,.33,.34,.35,.36,.37,.38,.39,.40,.42,.45,.48,4.2];
const odd=[3,5,6,7,8,9,11,12,14,15,21],even=[2,4,4,5,7,8,9,10,12,15];
const groupsA=[52,54,56,58,60,60,62,64,66,68],groupsB=[20,25,30,35,40,80,90,90,95,95];
const bookA=[5,5,5,5,5,5,6,6,6,6,6,6,6,7,7,7,7,8,8,8],bookB=[3,3,3,3,3,4,4,4,4,4,4,5,5,5,5,5,5,6,6,7];
export const TASKS={
 statwords:[centre('把每张卡排好。分别找“平分后”“队伍中间”“最常出现”和“最远差多少”。',[2,0,3,2,1,11,2]),centre('先猜，再把最远的11移到32。哪种代表值会追着它走？',[0,1,2,2,2,3,11],{mode:'change',change:[6,32],questions:[]}),{...T20.scattermeaning[0],prompt:'把一对对记录落在图上，描述一起变化的方向，再画一条概括趋势的线；这还不能证明因果。'}],
 meanbalance:[centre('五次游戏得分72、85、90、68、95。把高堆的一部分给低堆，保持410分不变，让五堆一样高。',[72,85,90,68,95],{mode:'level',step:1,metrics:['mean'],unit:'分',questions:[]}),centre('五份平分后每份8，已知四份7、9、6、10。先拼出总量，再补回缺的那一份。',[7,9,6,10],{mode:'missing',targetMean:8,targetCount:5,metrics:['total','missing'],questions:[]}),centre('仍是五次游戏的410分。第六次得0分，先猜平均会怎样，再把这条真实的0加进去。',[72,85,90,68,95],{mode:'append',append:0,metrics:['mean'],unit:'分',questions:[choice('0这份记录要不要算在份数里','yes',[['yes','要，原来5份变6份'],['no','不用，因为没增加总分']]) ]})],
 meandistance:[distance('五株植物高4、6、8、9、13厘米。把每一点到平均位置的距离逐条搭出来。',[4,6,8,9,13]),distance('这次共同位置是10厘米。逐条量距离，看看平均距离3厘米是什么意思。',[4,10,13,13],{questions:[choice('平均距离3厘米表示','distance',[['distance','每株到平均高度的距离，平均是3厘米'],['height','每株都高3厘米'],['same','每株离平均高度恰好3厘米']])]}),dist('两位投球手都平均120分。先看各自围绕120散开多少。',[112,128,112,128],[99,141,99,141],[q('甲平均偏离多少分',8),q('乙平均偏离多少分',21),choice('谁的记录更稳定','a',[['a','甲：围绕相同平均位置更集中'],['b','乙：最大分更高']])],{guides:[120,120],needRange:false})],
 averagestory:[centre('3、5、5、6、11件作品，哪一个数更像多数日子的样子？先排好再比较。',[3,5,5,6,11],{questions:[choice('描述常见的一天，可以用','middle',[['middle','排序中间的5或最常出现的5'],['meanonly','任何情境都只能用6']])]}),centre('模拟通勤时间12、14、15、15、48分钟。把48暂改为18作对照，原记录仍保留。',[12,14,15,15,48],{mode:'change',change:[4,18],unit:'分钟',questions:[q('原来最大最小相差多少分钟',36),q('原来总量平分每份多少分钟',20.8),choice('看到48，应该','check',[['check','先核对背景，可能是一次真实慢行'],['delete','因为特别大就直接删掉']])]}),dist('两队同样测拼字速度。比较排序中间，也比较最远的差。',[5,6,7,8,9],[4,7,8,9,12],[q('甲排序中间',7),q('乙排序中间',8),q('甲最大最小差',4),q('乙最大最小差',8),choice('这组记录说明','both',[['both','乙中心较高，甲更稳定'],['one','乙每个人都比甲好']])])],
 distributionlook:[dist('25份模拟反应时间。圈住主要一簇，并找远处的那一份。图上的空白不等于没有这段数值。',reaction,null,[q('记录了几人',25),choice('整体的样子','tail',[['tail','多数靠近0.3秒，右边有很长的尾'],['symmetric','两边完全对称']]),choice('空隙的原因','unknown',[['unknown','图只能显示空隙，还需背景解释'],['practice','一定是有人练习过']])],{mode:'cluster',unit:'秒',cluster:[.21,.48],unusual:4.2}),dist('两组都平均60分。分别圈出各组最小到最大的跨度，看看60藏了什么。',groupsA,groupsB,[q('甲平均',60),q('乙平均',60),choice('相同平均能否说明一样','different',[['different','不能：乙更分散，还有两个明显小群'],['same','能，每个人都接近60']])]),media('反应记录4.2秒很远。查原卡片，再决定怎么处理。',{mode:'context',records:[{raw:'4.2秒',proof:'原计时文件是0.42秒',answer:'correct'},{raw:'4.2秒',proof:'录像显示参与者分心后才按下，计时为4.2秒',answer:'keep'},{raw:'4.2秒',proof:'没有原文件，也没有现场说明',answer:'unknown'}],questions:[choice('能不能断言别组也会这样','no',[['no','不能，测的人和条件可能不同'],['yes','有图就可以推广']])]})],
 quartiles:[centre('11份拼图用时先排队，再各找全队、下半队、上半队的中间。整体中间那张不重复放进两半。',[14,3,9,6,21,8,5,15,7,12,11],{mode:'quartile',unit:'分钟',metrics:['median','q1','q3','iqr'],questions:[choice('6到14分钟、相差8分钟，说的是','middle',[['middle','排好队后中间一半的大致范围'],['all','所有人的用时都在这里'],['count','一定只有8个人']])]}),centre('10份记录，中间落在两张之间时，取两个值的中间。上下半队仍各有5张。',[8,2,10,4,15,7,4,12,5,9],{mode:'quartile',metrics:['median','q1','q3','iqr']}),centre('先猜，再把最大用时21改为40。整队跨度和中间一半跨度会一起变吗？',odd,{mode:'change',change:[10,40],metrics:['range','iqr'],unit:'分钟',questions:[q('原来整队跨度',18),q('改变后中间一半跨度',8),choice('有一个特别远的值时，更能描述主体散开的量','iqr',[['iqr','中间一半的跨度，并说明远处还有值'],['ignore','删掉远值，就不用说明']])]})],
 datasummary:[report('把这25份反应时间的来历、代表位置、散开程度与特别远的记录装成一段清楚摘要。',reaction,{unit:'秒',attribute:'看到信号到按键的时间',method:'同一计时程序，每人一次',who:'25位模拟参与者',unusual:4.2,allowedPairs:['median','mean']}),report('这组通勤用时右边拖着长尾。为摘要选择合适的一对“位置与散开”。',[5,6,7,8,9,10,12,14,18,30,70],{questions:[choice('选这对量的理由','tail',[['tail','长尾会拉动均分位置，中间一半更稳健'],['always','所有数据都只能用这种摘要']])]}),report('“平均是14”还不够。按给定记录补出谁、多少份、哪种中间、单位和中间一半。',[4,6,7,8,8,9,9,9,10,10,11,12,12,13,14,14,15,16,17,18,20,21,22,22,23,25,28,30,35,40],{who:'30位模拟参与者',method:'同样起止点，逐人计分钟',questions:[]})],
 digitalsets:[{type:'x-digitalsets',mode:'nominal',prompt:'两组喜欢的运动不同。按原表搭同尺并排柱图，找各组最多的运动。',labels:['足球','游泳','羽毛球'],a:[8,6,4],b:[5,9,4],unit:'人',questions:[choice('甲最多','0',[['0','足球'],['1','游泳'],['2','羽毛球']]),choice('乙最多','1',[['0','足球'],['1','游泳'],['2','羽毛球']])]}, {type:'x-digitalsets',mode:'ordinal',prompt:'甲20人，乙40人。把人数换成百分比，保持从“从不”到“总是”的同一顺序，再比较。',labels:['从不','有时','经常','总是'],a:[2,6,8,4],b:[12,16,8,4],unit:'%',questions:[choice('哪组等级整体偏高','a',[['a','甲，经常或总是的比例更高'],['b','乙，因为人数多']]),choice('这些等级之间','order',[['order','有顺序，但感受差不一定相等'],['equal','一定是相等的差距']])]},dist('两组跳远距离在共同数轴上下相对摆点。比较常见值、跨度与聚集位置。',[100,110,110,120,120,120,130,140],[90,90,100,110,110,120,130,150],[q('甲最常见的距离',120),q('甲跨度',40),q('乙跨度',60),choice('乙最常出现的值','ties',[['ties','90和110并列'],['single','只能挑一个']])],{unit:'厘米',backToBack:true})],
 medialens:[media('两次销量94与96。先看从90开始的柱图，再补回0，差真的变了吗？',{mode:'axis',values:[94,96],questions:[q('实际相差',2),choice('截去0到90会','exaggerate',[['exaggerate','把柱高比例的视觉差放大'],['data','把原数据变大']])]}),media('广告写“九成孩子喜欢X”。原记录只是商店门口自愿回答的10人，其中9人喜欢。能说到哪里？',{mode:'claim',n:10,k:9,who:'商店门口自愿回答的10人',questions:[q('实际问了几人',10),choice('能代表所有孩子吗','no',[['no','不能，人数少且参加方式可能偏'],['yes','10人里9人就够证明所有孩子']])]}),media('把“所有孩子都爱X”改成有依据的说法；保留调查对象和限制。',{mode:'headline',n:10,k:9,who:'商店门口自愿回答的10人',questions:[]})],
 fairdraw:[sample('全体800人里抽40人了解每周运动时间。先选完整名单，再实际抽一次。',{N:800,n:40,mode:'mean',profile:'exercise',questions:[q('想了解的全体有几人',800),q('实际抽到几人',40),choice('为什么只问一部分','cost',[['cost','节省时间，但估计仍有不确定'],['exact','40人的结果一定等于800人']])]}),sample('只从运动社团抽，和从全体名单抽，会看到同样的世界吗？同一个模拟总体，分别试一次。',{N:800,n:20,runs:2,methods:['club','all'],mode:'mean',profile:'exercise',questions:[choice('只问运动社团可能怎样偏','high',[['high','运动时间可能偏高'],['low','必然偏低']]),choice('更合适的办法','all',[['all','从完整名单随机抽'],['easy','只问最方便遇到的人']])]}),sample('随机抽10人，看看两组各来几位。公平的抽法也可能抽得不均衡。',{N:80,n:10,mode:'proportion',questions:[choice('抽到不均衡说明','chance',[['chance','可能只是这一次的偶然，不等于抽法不公平'],['wrong','必然有人操纵结果']]),choice('随机和随便找人的差别','frame',[['frame','随机从完整名单抽，方便碰见的人未必人人有机会'],['same','两者一样']])]})],
 comparepeople:[dist('两个故事集各随机取20个词，比较词长中心和散开。这里只能作带不确定的判断。',bookA,bookB,[q('甲书样本平均词长',6.2),q('乙书样本平均词长',4.4),choice('对两本书的判断','probably',[['probably','甲书平均词长可能较长，还存在抽样变化'],['every','甲书每个词都更长']])],{unit:'字母',showMad:true}),media('甲校运动社团自愿者与乙校随机学生比较，就能说甲校全体更健壮吗？',{mode:'headline',n:20,k:16,who:'甲校运动社团的20名自愿者',claimKind:'fitness',questions:[choice('主要问题','bias',[['bias','两边抽法不同，社团自愿者不能代表全校'],['size','只要把志愿者再加多就一定公平']])]}),dist('两次样本的中间位置只差1分。旁边是从同一总体重新随机抽的五次中间位置：48、50、51、49、50。',[48,49,50,51,52],[49,50,51,52,53],[q('两组中间位置相差',1),q('重复抽样的中间位置最大最小相差',3),choice('差1分够有把握吗','weak',[['weak','证据不强，抽样本身就能带来更大的波动'],['sure','只要不一样就证明总体不同']])],{repeats:[48,50,51,49,50]})],
 estimatepeople:[estimate('从900人的完整名单随机抽60人，18人步行。把这份比例铺到900人，估计大约几人步行？'),estimate('随机抽25人的每周阅读时间，样本平均6.4小时。用它估计全体平均，再说明为什么不能叫精确清点。',{mode:'mean',N:800,n:25,mean:6.4,unit:'小时'}),estimate('若60人全来自同一小组，18人步行，算式还能算，但能放心推广到全体900人吗？',{validSample:false})],
 comparegap:[dist('两队身高放在同一把尺上。指出两边都覆盖的区间，再判断重叠多不多。',[140,145,150,150,155,160],[145,150,155,155,160,165],[q('共同范围左端',145),q('共同范围右端',160),choice('共同范围的情况','much',[['much','重叠不少'],['none','完全不重叠']])],{unit:'厘米'}),dist('两队平均身高差10厘米，各自平均离中心5厘米。用这把“5厘米”的尺，量10厘米有几段。',[145,145,155,155],[155,155,165,165],[q('两组平均位置之差（厘米）',10),q('差相当于几个平均距离',2),choice('这里拿来作尺的是','mad',[['mad','每个值离平均位置的平均距离（MAD）'],['range','最大减最小']])],{unit:'厘米',showMad:true,ratio:true}),dist('保持平均位置差10、各组平均距离5，换一种形状再看重叠。只看“相差2个平均距离”够吗？',[145,145,155,155],[155,155,165,165],[choice('仅靠中心差÷平均距离','shape',[['shape','不够，还要看尾巴和整个形状'],['fixed','就能确定重叠多少']])],{unit:'厘米',showMad:true,alternate:[[144,146,150,160],[150,160,164,166]],swap:true})],
 samplevary:[sample('同一个盒子，抽20个，记下比例，再全部放回。重复5次，结果一定一样吗？',{runs:5,questions:[choice('几次估计不同是因为','chance',[['chance','抽到的个体不同，有随机波动'],['wrong','一定有人算错']])]}),sample('先后从同一模拟总体的社团名单和完整名单各抽三次。分清偶然波动与抽法长期偏向。',{N:800,n:20,runs:6,methods:['club','club','club','all','all','all'],mode:'mean',profile:'exercise',questions:[choice('只抽社团和全体随机抽的差别','bias',[['bias','社团抽法偏向运动多的人，不只是偶然抽偏'],['same','两种都叫随机，所以适用范围一样']])]}),sample('同一个盒子，先抽20个五次，再抽60个五次。比较记录，不要求每一次大样本都更准。',{N:200,n:20,runs:10,compareSizes:true,sizes:[20,20,20,20,20,60,60,60,60,60],questions:[choice('五次最小到最大的范围','notbound',[['notbound','是这几次看到的变化，不能保证真实值或未来都在里面'],['guarantee','一定罩住所有未来结果']]),choice('较大随机样本一般','usually',[['usually','通常更稳定，但不保证每次更准，也不修复偏差'],['always','每一次都必然更准']])]}),sample('每个人的睡眠时间和每次样本的平均，是两种不同的变化。保留两把同单位的尺来比较。',{N:120,n:20,runs:5,mode:'mean',profile:'sleep',questions:[choice('样本均值的变化与个体变化','different',[['different','不是一回事，均值通常没个体值散得那么开'],['same','均值范围就是所有人的范围']])]})],
};
// These checks contrast meanings after the concrete construction.
TASKS.statwords[1].questions=[q('改变后总量均分每份多少',6),choice('哪种位置没有跟着跑','middle',[['middle','排队中间仍是2'],['all','每种代表值都增加21']])];
TASKS.meanbalance[0].questions=[choice('平分后的82代表','fair',[['fair','410分均分给五次，并不表示某次真的得82'],['actual','其中一次必定得82']])];
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,ts])=>[id,{...ts.at(-1)}]));
export const BRIDGES=[];

const available={...T19,...T20,...TASKS};
const link=(from,to,title,i=0,j=0)=>BRIDGES.push({from,to,title,summary:'把两边的操作连起来，检查这个结论还需要什么依据。',tasks:[structuredClone(available[from][i]),structuredClone(available[to][j])],phase:5,batch:'B21'});
link('statwords','scattermeaning','一起变化，还不能说谁造成谁',2,3);
link('averagestory','scattermeaning','看整体，不能只盯一个代表值',2,2);
link('fairdraw','medialens','标题能说多远，先看问过谁',1,2);
link('displaychoices','medialens','画法能帮助比较，也能放大差异',0,0);
link('quartiles','boxsummary','把排队后的五个位置装进一幅图',0,0);
link('distributionlook','boxsummary','图上的五个数，会藏起哪些形状',1,1);
link('boxsummary','comparegap','概括之后，再回来看两组怎样重叠',2,0);
link('quartiles','comparegap','中间一半的跨度，也是一把比较尺',2,0);
link('distributionlook','comparegap','放在共同数轴上，才看得见重叠',1,0);
link('meandistance','comparegap','用平均距离量两组中心的差',0,1);
link('statwords','meanbalance','总量平分，和排队中间是两回事',0,0);
link('statwords','chartfamilies','先说清记录，再选概括的画法',0,2);
link('fairdraw','estimatepeople','选人方法合适，外推才有依据',1,2);
link('meanbalance','estimatepeople','样本的均分位置，可以估计全体平均',0,1);
link('distributionlook','quartiles','看过整群点，再找中间一半',1,0);
link('averagestory','quartiles','远点拉长全队，未必拉长中间一半',1,2);
link('fairdraw','comparepeople','比较两群人，先比较两边怎么选',1,1);
link('comparegap','comparepeople','差别要和散开程度一起看',1,0);
link('samplevary','comparepeople','样本自己会变，小差别要留余地',0,2);
link('checkrecords','digitalsets','核对原记录，再搭公平的对照图',0,0);
link('averagestory','digitalsets','图能同时保留常见位置和散开程度',2,2);
link('distributionlook','histogram','连续记录分组之后，哪些细节藏起来',0,1);
link('measurestory','distributionlook','测量的背景，影响整组记录的解释',2,2);
link('meanbalance','distributionlook','相同均分位置，也能藏着不同的形状',0,1);
link('timeorcategory','distributionlook','先认清数值记录，再看整群点',0,0);
link('dotrecords','distributionlook','一个点是一份，整群点才有形状',2,1);
link('statwords','checkrecords','代表值之前，先核对每份记录',0,0);
link('measurestory','datasummary','记录怎么量，摘要也要交代清楚',2,0);
link('quartiles','datasummary','把中间位置和中间一半一起说清楚',0,2);
link('distributionlook','datasummary','一段摘要，要留下形状和远点',0,0);
link('averagestory','datasummary','长尾记录，为什么换一种概括',1,1);
link('meandistance','datasummary','代表位置之外，还要交代散开',0,1);
link('estimatepeople','samplevary','同一总体重新抽，估计会怎样变',0,0);
link('distributionlook','samplevary','个人的分布与样本平均的分布不同',1,3);
link('averagestory','samplevary','抽到的记录改变，代表值也会改变',0,0);
link('meanbalance','averagestory','平分位置，能代表怎样的一天',0,0);
link('statwords','averagestory','三个代表值，分别回答什么',0,0);
link('meanbalance','meandistance','先找共同位置，再量每份离它多远',0,0);
link('distributionlook','meandistance','看见散开，再给散开一个数',1,0);
link('averagestory','meandistance','相同平均不够，还要量波动',2,2);
