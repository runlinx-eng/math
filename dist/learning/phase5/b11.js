import{TASKS as T10}from'./b10.js';
import{TASKS as T07}from'./b07.js';
const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B11'});
export const LESSONS={
 onesbridge:item('mt_AKAtWEwpcj','多几颗，整捆也会变吗','两位数与一位数的加减','36+7可以先添4到40，再添3到43。52−4可以先退到50，再退2。跨过整十时，十位也会变化。','43+5与36+7，为什么只有后者需要换出一整捆？'),
 tensmove:item('mt_I5j1ZWo2cn','这次搬的是整捆','两位数与整十数加减','45+30添的是3个十，个位的5不变；45+3添的是3个一。跨过100时，百位也要变化，不能总说只有十位变。','加30与加3，分别改动哪一格？'),
 decadetake:item('mt_HJTuIGHvcR','拿走三捆，还是三颗','整十数相减与单位化','70−30是7个十拿走3个十，剩4个十，也就是40。70−3却要拆开一捆，再拿3个一。','为什么70−30的结果不是4？'),
 twodigitpair:item('mt_UQnAFPs83F','两堆都带着整捆','两个两位数的加减','34+27先把相同单位合起来，11个一换成1个十和1个一。63−28要把1个十拆成10个一，再取走。','拆开一捆时，数量是变少了，还是换了一种装法？'),
 addhundred:item('mt_glPPG-kTQY','找个整十，歇一下','百以内加法的位值策略','46+7可以先到50，再走3；38+40把4个十放进十位，个位的8保留。写下的每段变化要合成原来的增加量。','先到整十这一步，为什么不能把剩下的忘掉？'),
 flexhundred:item('mt_cChv2j_-Da','同一道题，换条路走','百以内加减的灵活策略','位值拆分、先多加再退回、从小数走到大数，都能帮助计算。71−68可以看68到71有多远。方法合适与否要看这些数。','71−68与83−25，你愿意分别怎么走？'),
 oneslarge:item('mt_oDU_8zMZjp','小小一颗，也能越过百','三位数与一位数的加减','加减几个一从个位开始；345+3不跨十，345+7会跨十，398+7还会跨百。高位保持不变是有条件的。','398加7时，为什么百位也动了？'),
 tenslarge:item('mt_aHQ9kNt3is','整捆走远，也会跨百','三位数与整十数加减','加减整十数时，个位不变。十位满十要换成一个百；十位不够时，也可把一个百拆成十个十。','372+40和345+40，哪个要换出一个百？'),
 hundredsmove:item('mt_xPqczp7zPX','整板搬动，零头留下','三位数与整百数加减','345+200是3个百再添2个百，45不动。762−400拿走4个百，留下362。本组不跨千。','同样写一个2，加200与加20，搬的是同一种东西吗？'),
 showwhy:item('mt_zxST3MarI9','这条近路，凭什么成立','用位值与运算性质解释策略','拆分后每个部分仍在，所以能重新合成原来的总量。加99改成加100，多加了1，就要退回1。写步骤与说清理由是两件事。','如果有人加100后又加1，你怎样指出多出的那部分？'),
 fourparts:item('mt_TiQbi027PE','四堆东西，先找谁结伴','多个加数的重排与组合','可以先把凑成整十的两堆合起来，也可以先合其他两堆；每堆只用一次，整体才不变。没有顺手的配对时，还能按单位拆分。','先把两堆合并后，怎样确保另外两堆没漏掉？'),
 buildthousand:item('mt_ewmuMMPAzP','十捆再换一板','千以内加减与连续换单位','十个一换一个十，十个十换一个百，反过来也一样。402−137的十位空着，要先拆一个百，再拆一个十。','中间空着一格时，从哪里换来需要的小单位？'),
 columnthree:item('mt_SrrsLiJkr3','把搬动缩成一张记录','三位数竖式加减与检验','竖式把相同单位上下对齐，把每次换单位压缩成记录。进位不是凭空添1，退位也不是让数量消失。先估一估，再用反方向检查。','竖式上记下的1，在这一格到底值多少？'),
 flexthousand:item('mt_HFRYjTb-Z5','大一点，也能选近路','千以内加减的策略选择','300与298很近，可以数它们之间的距离；525+199可以先加200再退1。一般数也可用位值表或竖式。这里记录做法，不判定速度熟练。','哪些数适合直接走几步，哪些值得写下来？'),
 columnfour:item('mt_mpS-JK_p_m','空格连续出现，怎么拆','四位数竖式与跨零换单位','4002里百位和十位都空着，可以从千位一路拆下来。数字位数不一样时，相同单位仍要对齐。做完可用相反运算检查。','4002拆成3个千、9个百、9个十和12个一，为什么总量没变？'),
 columnlarge:item('mt_Yw1_4Nfsql','位置变多，规则没换','大整数竖式与多次进退位','大数仍然遵守十个小单位换一个大单位。三个数相加时，一格可能有24个，需换出2个更大的单位，不能总只进1。','一格里有24个，与一格里有14个，向左送出的数量有什么不同？'),
 decimalsum:item('mt_JH_6RpNWjr','小数点两边，也能换整','小数加减与位值对齐','十个百分之一换一个十分之一，十个十分之一换一个一。3.4与3.40一样多；相同单位要对齐，小数点是定位标记。','3.4与2.78相加，4应该和7对齐，还是和8对齐？为什么？'),
 storymoney:item('mt_wzAZ8qFDc4','故事还没结束，别停下','加减情境建模与中间结果','先看数量怎样变化，再选择加或减。花掉以后又得到，要留下中间结果并继续。看到“多”也不一定相加，要看问的是谁。','32枚比小林多8枚，为什么找小林有多少时要减？'),
 storylarger:item('mt_-F_Lv_apzH','离目标还差几步','大数多步加减问题','把故事分成可检查的变化，每一步留下数量和单位。已收集多少与距离目标还差多少，是不同的问题。方法可以每一步重新选择。','已经做出的中间结果，怎样帮助你检查有没有漏掉最后的问题？'),
 storymillion:item('mt_M1tnXqmYbn','数很大，故事仍要讲完','百万数量与小数的多步问题','大的数量和小数都要跟住每一次变化。估计能帮助发现少一位、多一位或小数点错位，但不能证明精确答案正确。','如果算出来比估计少十倍，你先检查什么？'),
 mentalbig:item('mt_MWXPiaTnEu','把熟悉的关系放大','大数加减的派生事实与策略','45个千加8个千是53个千。10000−3200也可以从3200走到10000，答案是走过的总距离。近似相同的两个数可以借助已知的双倍。','走到10000时，答案是10000，还是刚才走了多远？'),
 checkrough:item('mt_QaYfeVL-0C','先看大概，再倒着验','估算与逆运算检验','先把两个数取整得到大致范围，再计算并用反方向核对。估计能排除离谱答案；看起来接近，也可能算错一点。','801与800都接近估计800，它们就都正确吗？'),
 checkpurpose:item('mt_G3sVFQNCme','大概够用，还是要精确','估算精度与情境要求','估计多细要看用途：粗看规模与核对小差别，需要的精度不同。实际付款要精确，估计预算可以取整。是否接近估计与是否精确相等是两种判断。','同一批物品，先估预算与最后付款，为什么需要不同精度？'),
};
const route=(id,title,section,ids)=>({id,title,section,ids,packIds:['add-subtract'],themeId:'numbers',color:'#ae8259'});
export const ROUTES=[
 route('AZ','搬几颗，还是搬几捆','parts',['onesbridge','tensmove','decadetake']),
 route('BA','两堆合在一起，找条近路','parts',['twodigitpair','addhundred','flexhundred']),
 route('BB','哪些位置会跟着变','parts',['oneslarge','tenslarge','hundredsmove']),
 route('BC','选个伙伴，说清理由','strategy',['showwhy','fourparts']),
 route('BD','换过两道门，再记下来','strategy',['buildthousand','columnthree','flexthousand']),
 route('BE','更多位置，同一条规则','strategy',['columnfour','columnlarge','decimalsum']),
 route('BF','让故事一步一步走完','act',['storymoney','storylarger','storymillion']),
 route('BG','放大关系，检查是否靠谱','strategy',['mentalbig','checkrough','checkpurpose']),
];
const place=(values,op,prompt,extra={})=>({type:'x-placecalc',values,op,prompt,...extra});
const path=(a,b,op,prompt,extra={})=>({type:'x-routecalc',a,b,op,prompt,...extra});
const group=(values,prompt)=>({type:'x-groupfour',values,prompt});
const estimate=(a,b,op,units,prompt,extra={})=>({type:'x-estimatecheck',a,b,op,units,prompt,...extra});
const ledger=(start,steps,unit,prompt,extra={})=>({type:'x-storyledger',start,steps:steps.map(([text,op,amount])=>({text,op,amount})),unit,prompt,...extra});
export const TASKS={
 onesbridge:[place([36,7],'+','36再添7个一。满十的时候，亲自换成一捆。'),place([52,4],'-','52拿走4个一。散颗不够时，从哪里换？'),path(36,7,'+','换到路上：从36出发，把增加的7分成两段走。',{minSteps:2}),path(43,5,'+','43再走5，需要经过下一个整十吗？自己走一遍。')],
 tensmove:[place([45,30],'+','45多了3捆，每捆十个。把它们放进对应位置。'),place([82,40],'-','82拿走4捆，零散的2颗怎么办？'),place([45,3],'+','同样从45开始，这次只多3颗。'),place([85,30],'+','85再多3捆，十位满了以后怎么办？')],
 decadetake:[place([70,30],'-','7捆拿走3捆。把剩下的读成实际数量。'),place([80,50],'-','8捆拿走5捆，亲手移走。'),place([70,3],'-','这次70只拿走3颗。与刚才拿3捆相比，哪里不同？')],
 twodigitpair:[place([34,27],'+','34与27合起来。散颗满十，亲自换一捆。'),place([63,28],'-','63拿走28。先换出够用的散颗，再拿走。'),path(63,28,'-','再换一种看法：从28走到63，两者相差多远？',{countup:true})],
 addhundred:[path(46,7,'+','从46出发，把7分开走，试试先到一个整十。',{minSteps:2}),place([38,40],'+','38再添4捆。留意零散的8颗。'),path(53,9,'+','53+9，试一次先多走一点、再退回来。',{compensation:true,minSteps:2})],
 flexhundred:[place([46,37],'+','把46与37的相同单位合在一起。'),place([83,25],'-','83拿走25，别把每格里较大的数字一律减较小的。'),path(71,68,'-','68和71很近。从68走到71，记录距离。',{countup:true}),path(46,29,'+','给46添29：先添一个顺手的整量，再把多出的退回。',{compensation:true,minSteps:2})],
 oneslarge:[path(345,7,'+','从345添7个一，分两段走，别丢掉新凑出的十。',{minSteps:2}),path(462,5,'-','462退5。可以先到整十，再接着退。',{minSteps:2}),place([345,3],'+','345只添3个一。这回要换整吗？'),place([398,7],'+','398再添7个一。看看变化会传到哪里。')],
 tenslarge:[place([345,40],'+','345添4捆，百和零散的5会动吗？'),place([462,30],'-','462拿走3捆。'),place([372,40],'+','372添4捆，十位装得下吗？'),place([431,50],'-','431拿走5捆，捆数不够时拆哪一板？')],
 hundredsmove:[place([345,200],'+','345增加2个百。只把整板搬进来。'),place([762,400],'-','762拿走4个百，把零头保留下来。'),place([345,20],'+','仍从345开始，这次增加的是2个十。与加200比较。')],
 showwhy:[place([67,24],'+','把67与24按单位合起来。每部分有没有留下？'),path(46,99,'+','46+99：先多走，再退回。把多走的那一点还回来。',{compensation:true,minSteps:2}),place([67,24],'+','把刚才的交换缩成竖着的记录。想一想每个进位为什么出现。',{written:true})],
 fourparts:[group([15,18,25,12],'四堆里先挑两堆结伴，试着找出整十；每堆只用一次。'),group([24,17,26,13],'换四堆，再自由选择先合哪一对。'),place([14,23,32,19],'+','这组没有刚好凑成整十的一对。把所有相同单位合起来。')],
 buildthousand:[place([256,167],'+','256与167相合。十颗换一捆，十捆再换一板。'),place([402,137],'-','402拿走137，中间空着的格子该怎么处理？'),place([170,80],'+','170再添8捆，十位满了就继续换整。')],
 columnthree:[estimate(347,185,'+',[10,100],'先估347与185合起来大概多少，再倒着检查。'),place([347,185],'+','把347与185摆成竖着的记录，一格一格交换。',{written:true}),estimate(502,276,'-',[10,100],'先估502−276，再用加法倒着核对。'),place([502,276],'-','502拿走276。先把空着的十位接通，再继续。',{written:true})],
 flexthousand:[path(300,298,'-','从298走到300，留下这段距离。',{countup:true}),path(525,199,'+','525加199，试着先凑整，再退回多加的。',{compensation:true,minSteps:2}),place([456,287],'+','这组也可以用整板、整捆和散颗算。',{written:true}),estimate(703,568,'-',[10,100],'703−568，先估，再用相反方向检查。'),place([703,568],'-','703拿走568。中间的零不能凭空借出一捆。',{written:true})],
 columnfour:[estimate(3456,878,'+',[100,1000],'先估3456+878的量级，再精算、反向核对。'),place([3456,878],'+','数字长短不一样，相同单位仍要站在一列。',{written:true}),estimate(4002,1367,'-',[100,1000],'先估4002−1367，记住大概范围。'),place([4002,1367],'-','4002拿走1367。从有整块的位置，一路拆到需要的地方。',{written:true})],
 columnlarge:[estimate(34567,28945,'+',[1000,10000],'先估34567+28945，再算并倒着检查。'),place([34567,28945],'+','位置更多了，仍然让相同单位对齐。',{written:true}),estimate(500000,234178,'-',[1000,10000],'先估500000−234178，看看答案应该有多大。'),place([500000,234178],'-','一连几格都是零，从左边把大单位逐层拆下来。',{written:true}),place([36489,27858,15937],'+','三个数一起相加。一格超过二十，要换出几份？',{written:true})],
 decimalsum:[estimate(345,278,'+',[100],'先估3.45+2.78，再算与反向核对。',{scale:100}),place([345,278],'+','3.45与2.78相加，十个小格换一个大格。',{scale:100,written:true}),place([340,278],'+','3.4与2.78怎么对齐？看每个数字代表哪种单位。',{scale:100,written:true,labels:['3.4','2.78']}),place([503,267],'-','5.03拿走2.67。十分之一空着，先从哪里拆？',{scale:100,written:true}),place([490,411],'-','4.9比4.11多多少？写得长，不一定数量大。',{scale:100,labels:['4.9','4.11']})],
 storymoney:[ledger(35,[['花掉12元。','-',12],['后来又得到5元。','+',5]],'元','模拟小账本：原来35元，两件事都发生后还剩多少？'),ledger(45,[['剪去18厘米。','-',18]],'厘米','一根45厘米的彩带，剪去一段后还剩多长？'),ledger(32,[['小雨有32枚，比小林多8枚。现在求小林有多少。','-',8]],'枚','看到“多”，就一定要相加吗？跟住正在求的那一堆。')],
 storylarger:[ledger(35,[['先花掉12元。','-',12],['又得到5元。','+',5]],'元','先用小账本试两步：中间结果留下，故事继续。'),estimate(12450,8372,'+',[100,1000],'模拟回收活动：先估两周收集的12450与8372个瓶子合计多少。'),ledger(25000,[['目标25000个，第一周已收集12450个。求还差多少。','-',12450],['第二周又收集8372个。继续求还差多少。','-',8372]],'个','目标25000个。每周过去后，更新距离目标还差多少。'),estimate(31550,10750,'-',[100,1000],'模拟预算：估一估31550元再花10750元，剩下大约多少。'),ledger(41000,[['支付18650元。','-',18650],['收到9200元。','+',9200],['再支付10750元。','-',10750]],'元','模拟活动账本：原有41000元，三次变化后剩多少？')],
 storymillion:[estimate(3450000,1280000,'-',[100000],'模拟项目账本：先估3450000元支出1280000元后，还在什么范围。'),ledger(3450000,[['支出1280000元。','-',1280000],['收到2000000元。','+',2000000],['再支出675450元。','-',675450]],'元','模拟账本：每一步选自己的算法，别把中间结果当结尾。'),estimate(10000,3475,'-',[100],'模拟小账本：先估100元花掉34.75元后还剩多少。',{scale:100}),ledger(10000,[['支付34.75元。','-',3475],['收到12.50元。','+',1250],['再支付28.60元。','-',2860]],'元','换成带小数的模拟账本，三次变化都要记录。',{scale:100})],
 mentalbig:[path(45000,8000,'+','45个千再加8个千，用你选的步子走到结果。'),path(10000,3200,'-','从3200走到10000，求刚才走过的总距离。',{countup:true}),path(2500,2600,'+','2500与2600很接近。可以先加一个2500，再带上剩下的100。',{minSteps:2})],
 checkrough:[estimate(412,389,'+',[10,100],'有人说412+389=121。先用估计检查，再算清楚。',{claimed:121}),estimate(623,178,'-',[10,100],'623−178，先估一个范围，再用加法倒着验。',{claimed:445}),estimate(412,389,'+',[10,100],'有人说412+389=800。接近估计，就能保证对吗？',{claimed:800})],
 checkpurpose:[estimate(47832,23156,'+',[100,1000],'有人把47832+23156写成3988。先估，再判断能否落在范围内。',{claimed:3988,accuracy:1000}),estimate(47832,23156,'+',[100,1000],'还没精算，也要保证总误差不超过100。把两个数取到多细才有把握？',{claimed:70988,accuracy:100}),estimate(24378,25621,'+',[100,1000],'两批模拟物品共24378与25621件。3421这个总数靠谱吗？',{claimed:3421}),estimate(3575,2240,'+',[100],'先估两件物品35.75元与22.40元的预算，再算出实际付款数。',{scale:100})],
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,ts])=>[id,structuredClone(ts[0])]));
const link=(from,to,title,summary,tasks)=>({from,to,title,summary,tasks:structuredClone(tasks),phase:5,batch:'B11'});
export const BRIDGES=[
 link('basicadd','onesbridge','把添几颗带到更大的数','二十以内的添一扩展到跨越下一个整十。',[T10.basicadd[0],TASKS.onesbridge[0]]),
 link('bridge20','addhundred','十这一站可以搬家','凑十的两段动作延伸到46附近。',[T10.bridge20[0],TASKS.addhundred[0]]),
 link('undoadd','checkrough','倒着做，变成检查','同一整体的反向关系用来核对自己的计算。',[T10.undoadd[1],TASKS.checkrough[1]]),
 link('tripleadd','fourparts','三个伙伴，再多一个','选两堆先合，仍要保留每一部分。',[T10.tripleadd[0],TASKS.fourparts[0]]),
 link('threeplaces','tenslarge','认清位置，再搬整捆','先构造百、十、一，再改变十的数量。',[T07.threeplaces[0],TASKS.tenslarge[2]]),
 link('threeplaces','hundredsmove','整板动，零头留','三位数的分解连接整百增加。',[T07.threeplaces[0],TASKS.hundredsmove[0]]),
 link('takethings','decadetake','把一颗换成一捆来看','取走的数量带上新的单位。',[T10.takethings[0],TASKS.decadetake[0]]),
 link('onesbridge','twodigitpair','添散颗，也添整捆','一位数跨十扩展到两部分都有整十。',[TASKS.onesbridge[0],TASKS.twodigitpair[0]]),
 link('tensmove','twodigitpair','两种单位一起合并','整十动作接入完整的两位数加法。',[TASKS.tensmove[0],TASKS.twodigitpair[0]]),
 link('addhundred','flexhundred','会走一条，再试近路','跨十与先多加再退回并置。',[TASKS.addhundred[0],TASKS.flexhundred[3]]),
 link('flexhundred','buildthousand','十捆满了，继续换整','两位数换十扩展到三位数换百。',[TASKS.flexhundred[0],TASKS.buildthousand[0]]),
 link('flexhundred','oneslarge','末尾跨十，前面跟着看','小数范围的策略移到三位数。',[TASKS.flexhundred[0],TASKS.oneslarge[0]]),
 link('flexhundred','showwhy','做出近路，再追问为什么','补偿量的方向有可检查的数量依据。',[TASKS.flexhundred[3],TASKS.showwhy[1]]),
 link('buildthousand','columnthree','把换装动作写成竖式','相同单位的交换连接压缩记录。',[TASKS.buildthousand[1],TASKS.columnthree[3]]),
 link('columnthree','flexthousand','会用竖式，也能选近路','计算方法根据数字关系调整。',[TASKS.columnthree[1],TASKS.flexthousand[0]]),
 link('columnthree','columnfour','多一列，仍然公平交换','三位数跨零延伸到四位数。',[TASKS.columnthree[3],TASKS.columnfour[3]]),
 link('columnfour','columnlarge','跨过更多空格','相同交换规则连续延伸。',[TASKS.columnfour[3],TASKS.columnlarge[3]]),
 link('columnlarge','decimalsum','大单位能拆，小单位也能合','十进交换延伸到小数点右边。',[TASKS.columnlarge[1],TASKS.decimalsum[2]]),
 link('twodigitpair','storymoney','让计算跟着故事走','从表示算式到选择故事里的变化。',[TASKS.twodigitpair[1],TASKS.storymoney[0]]),
 link('columnlarge','storylarger','算得出，还要问求什么','大数计算用于带中间结果的目标问题。',[TASKS.columnlarge[1],TASKS.storylarger[2]]),
 link('storylarger','storymillion','数量变大，步骤仍要完整','多步跟踪延伸到百万数量。',[TASKS.storylarger[4],TASKS.storymillion[1]]),
 link('checkrough','checkpurpose','大概范围也有粗细','先估再验，接着选择估计精度。',[TASKS.checkrough[2],TASKS.checkpurpose[1]]),
 link('oneslarge','mentalbig','把熟悉的动作放大','局部数位变化扩展到千单位。',[TASKS.oneslarge[0],TASKS.mentalbig[0]]),
];
