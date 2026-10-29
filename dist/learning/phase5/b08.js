import{TASKS as B07}from'./b07.js';
const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B08'});
export const LESSONS={
 fourplaces:item('mt_jY7uf0Cb7o','让每个数字站对位置','四位数的位值与分拆','7345中的7表示7000，不是7。把各位的值相加，可以重新得到原数；空位用0保留。','3452中的4，为什么要记成400？'),
 fourfaces:item('mt_lC_Q5mSL_I','同一个大数，换个样子','一万以内数的表示与估计','数位筹码、展开式和数轴可以表示同一数量。筹码标明单位，大小不是实物体积的比例。','同是一个筹码，标1与标1000有什么区别？'),
 thousandstep:item('mt_9XVFje6Tyr','一大包一大包地添和拿','多一千、少一千','加减1000通常改变千位；跨过整万时需要换组，万位和千位都会改变。不能说永远只变一位。','9500再添1000，哪几个位置一起变了？'),
 bigcompare:item('mt_MHaiUd2FLA','谁多谁少，先比大单位','较大整数的比较与排序','对齐数位，从最高位开始比较，相同才往右看。数轴上较大的数在右边。','4009和4090，个位大的一定更大吗？'),
 roundwhole:item('mt_NLSfvB9vUl','报个大概，要报到哪一站','按十、百、千取近似值','先确定间隔，再看原数离哪一站更近。这里对非负数约定：正好一半时取较大的一站。每次都从原数判断。','同一个4367，为什么可以报成4370、4400或4000？'),
 placeproblems:item('mt__sMrmOv3bx','大概够不够，准确差多少','用位值解决大数问题','比较、排序和取近似值各有用途。预报大概人数可取整，计算两处准确差距仍需原数。这里的人数与距离是练习数据。','准备接待时，哪些地方可以估，哪些必须精确？'),
 tenpattern:item('mt_QqG6IdmTSE','同一个数字，向左住一格','相邻位值的十倍关系','十进制里，同一数字左移一位表示原来的10倍。3000是300的10倍，700是70的10倍。','两个5的样子一样，为什么值能差十倍？'),
 sixdigits:item('mt_JwP9QFv6gQ','给很长的数字分好住址','六位数的读写、展开与比较','按位对齐保留0；中文按万分组读。这里的中文读写是本地适配，不评估原英文拼写或朗读流利度。','403072为什么不能把中间的0都去掉？'),
 bigproblems:item('mt_xMt1TLTs--','有限的数字，摆出最大的数','大数的构造、估算与应用','位数相同，先让最高位尽可能大。估算与准确比较用途不同；这里的场馆与城市数据都是设定情境。','数字加起来一样多，放在哪儿会让整个数更大？'),
 millionwords:item('mt_Gag_h98jWP','一长串数字，也能读明白','千万以内整数的读写与位值','中文读法按万分组，空位不能随意删除。7045200里的7表示7000000；英文的千、百万分组另属语言适配。','7045200的7和745200的7，值相同吗？'),
 roundlarge:item('mt_5NwqN6pf_A','大数字，也有最近的一站','较大整数的四舍五入','根据指定单位找相邻两站，用原数与中点比较。950500到最近十万为1000000，十进位会跨过原来的最高位。','950000和950500，为什么都能报成一百万？'),
 tenmillion:item('mt_XNmGwNggdU','数到千万，也走向零以下','千万以内的估计与负数排序','大数可按需要估到百万；负数在零左边，越向左越小。模拟深度用负数表示相对水面的高度，不是真实海沟测量。','-8000比-7000更深，为什么数值反而更小？'),
 decimalscale:item('mt_EDgw64OmfA','跨过那一点，规律还在吗','整数与小数位值的十倍关系','小数点固定，各位数字左移一位是乘10，右移一位是除10。0.04是0.4的十分之一；6000是0.006的一百万倍。','向右移一格，为什么不是简单地删一个0？'),
 decimalplaces:item('mt_lNGpnILM5C','一份不够大，再分成小份','小数数位与单位分数','十分之一、百分之一、千分之一依次变小，每向右一位是前一位的十分之一。4.073里空着的是十分位。','0.07与0.007，哪份更大？怎样用分份解释？'),
 decimalwords:item('mt_Ac7oMWhyPw','小数的名字，也要带单位','小数读写、展开与比较','347.392的每位都有单位；5又千分之62写成5.062。比较小数可补末尾0对齐位置，0.38=0.380，不按数字个数比大小。','0.372写得更长，为什么还比0.38小？'),
 rounddecimal:item('mt_Fl7b8q9pI1','离哪一个整站更近','一位小数取最近整数','把原数放在相邻整数之间，用距离决定靠哪一边。这里6.5正好一半，按约定取7。','3.7与3.2为什么会去不同的整站？'),
 roundtenths:item('mt_Ii1hV4V5ql','留一位，还是留到整数','小数按精度取近似值','3.47取整数是3，取一位小数是3.5；12.95取一位小数写13.0，末尾0表达保留到十分位。不要连续逐位取整。','估算4.83+2.17，结果可能正好等于准确和吗？'),
 roundprecise:item('mt__casygEB85','先想用途，再定留多细','按指定单位取近似值与估算','3.4567保留两位小数为3.46；7654321按十万取近似值为7700000。估算乘法可先分别取近似值。','4.83×2.17估为10，能当作精确答案吗？'),
 accuracy:item('mt_U9sme87C32','留下几位，留下哪些位','小数位数、有效数字与精度','小数位从点后开始数；有效数字从第一个非零数字开始。0.004982取两位小数为0.00，取两位有效数字为0.0050；末尾0记录精度。','0.00与0.0050为什么都能从同一个数得到？'),
 estbounds:item('mt_VVn1IXjkzn','只知道大概，还能知道什么','估算与误差区间','非负数按四舍五入报到某单位，原数位于报告值减半个单位到加半个单位之间：下端包括，上端不包括。它是一个范围，不是唯一原数。','报12米，原长可能刚好12.5米吗？试试边界。'),
 powerpattern:item('mt_HLUqHJ9Y7n','十倍，再十倍，会发生什么','10的幂与位值移动','10⁴表示四个10相乘；乘10²就是连续左移两位，3.4×10²=340。指数数的是因子10的个数，不能理解为给任何数添几个0。','为什么3.4乘100不是3.400？'),
 standardform:item('mt_bO-njVOige','很大很小，都装进短写法','科学记数法','正数可写成A×10ⁿ，其中1≤A<10。正指数放大，负指数缩小；负指数不表示这个数是负数。比较正的规范写法，可先比指数。','7.2×10⁻⁴为什么仍大于0？'),
 roman100:item('mt_MewIRdzpzz','换一套符号，还能记数量吗','罗马数字与非位值记数','I、V、X、L、C分别表示1、5、10、50、100。XLIV=40+4=44；常用规范中IV表示4。符号没有十进制的位置升值，也没有单独的零符号。','XX的两个X为什么都是10？'),
 romanyears:item('mt_To9HdLy8vq','用旧符号写一个年份','较大罗马数字的组合','D是500、M是1000；MCMXCIX=1000+900+90+9=1999，2024写MMXXIV。源标题写到1000，实际目标包含这两个更大的年份。钟面上的IIII是另一传统写法。','2024里没有的百位、十位，罗马数字需要用零占住吗？'),
};
const route=(id,title,section,ids)=>({id,title,section,packIds:['number-sense'],themeId:'numbers',color:'#ae8259',ids});
export const ROUTES=[route('AE','大包添到一万','symbol',['fourplaces','fourfaces','thousandstep']),route('AF','比多少，报大概','count',['bigcompare','roundwhole','placeproblems']),route('AG','让大数字派上用场','symbol',['tenpattern','sixdigits','bigproblems']),route('AH','把很大的数看清楚','count',['millionwords','roundlarge','tenmillion']),route('AI','小数点右边的世界','symbol',['decimalscale','decimalplaces','decimalwords']),route('AJ','留下合适的小数位','walk',['rounddecimal','roundtenths','roundprecise']),route('AK','说大概，留多大范围','count',['accuracy','estbounds']),route('AL','十倍，十倍，记短一点','walk',['powerpattern','standardform']),route('AM','另一种记数字的方法','symbol',['roman100','romanyears'])];
const board=(values,prompt,extra={})=>({type:'x-wideboard',mode:'build',values:values.map(String),prompt,...extra});
const order=(values,prompt,extra={})=>board(values,prompt,{mode:'order',...extra});
const compare=(a,b,prompt)=>board([a,b],prompt,{mode:'compare'});
const shift=(start,step,prompt,extra={})=>({type:'x-wideshift',mode:'scale',start:String(start),step,prompt,...extra});
const round=(values,unit,prompt,extra={})=>({type:'x-roundwork',values:(Array.isArray(values)?values:[values]).map(String),unit:String(unit),prompt,...extra});
const roman=(n,mode,prompt,extra={})=>({type:'x-romanwork',n,mode,prompt,...extra});
export const TASKS={
 fourplaces:[board([7345],'摆出7345，再写每一格代表多少。',{expanded:true}),board([3452],'3000、400、50、2合在一起是多少？搭好并写数。',{expanded:true}),board([3006],'三千零六。空着的两格要不要留下？',{expanded:true})],
 fourfaces:[board([4826],'用有单位的筹码搭4826，再分开记录。',{expanded:true}),board([6350],'把6350放在0到10000之间大约合适的位置。',{mode:'line',min:0,max:10000}),board([4050],'4000加50。先摆筹码，再记下总量。',{expanded:true})],
 thousandstep:[shift(4562,1000,'原来4562，添一包1000。先猜，再亲自添。',{mode:'add'}),shift(4562,-1000,'原来4562，拿回一包1000。先猜再试。',{mode:'add'}),shift(9500,1000,'9500再添1000，千位装不下了。亲自换成一万。',{mode:'add'}),shift(10500,-1000,'10500拿走1000，先拆一万，再拿一千。',{mode:'add'})],
 bigcompare:[compare(4009,4090,'个位大就一定大吗？把两行对齐，找第一次不同的地方。'),compare(8304,8304,'两边都摆好。没有不同的数位时怎样记录？'),order([7310,7031,999,10000],'按从小到大排队，再把每张卡放到数轴。',{min:0,max:10000})],
 roundwhole:[round(4367,10,'4367离哪个整十更近？找相邻两站，放点，再记结果。'),round(4367,100,'仍从原来的4367出发，这次报到整百。'),round(4367,1000,'仍用4367，这次报到整千。'),round([347,281],100,'估算两组人数。各自报到整百，再加起来。',{calc:'+'})],
 placeproblems:[round(4682,1000,'模拟活动预报4682人。用整千人数报个大概。'),order([4850,4580,5080],'三个模拟路线长4850、4580、5080米。先排序，再算最长比最短多多少。',{min:4000,max:5500,gap:true}),compare(6205,6250,'模拟两镇有6205和6250人。哪边多？对齐后找决定位置。')],
 tenpattern:[shift(300,1,'把300的数字向左移一格。先猜会变成多少。'),shift(70,1,'70到700隔了几格？亲自移，再记扩大了几倍。'),shift(5000,1,'5000变成50000，5的位置改变了什么？')],
 sixdigits:[board([403072],'给403072摆好各位，再写中文名字和展开值。',{expanded:true,words:true}),compare(548301,543801,'对齐比较548301和543801，用合适的关系符号记录。'),order([508301,580301,503801,583010],'四个六位数排队，再放到大约合适的位置。',{min:500000,max:600000})],
 bigproblems:[board([960000],'造一个六位数，让六个数字加起来等于15，并尽可能大。',{mode:'puzzle',sum:15,digits:6}),round(67450,1000,'模拟球场有67450个座位。按整千报容量。'),order([125430,154230,152430,98000,165000],'五座虚构城市的人口卡排队，再算最多与最少相差多少。',{min:0,max:200000,gap:true})],
 millionwords:[board([4302561],'摆好4302561，用中文写出它的名字。',{words:true}),order([7045200,7450200,7042500,7405200],'这些数开头很像。对齐后排队，再大约定位。',{min:7000000,max:7500000}),board([7045200],'搭出7045200，把每位所表示的值都留下。',{expanded:true})],
 roundlarge:[round(456782,10000,'456782报到整万，离哪站近？'),round(950500,100000,'950500报到十万。点越过中点了吗？'),round([387412,214560],10000,'先各自报到整万，再估这两数的和。',{calc:'+'})],
 tenmillion:[round(8274500,1000000,'模拟城市有8274500人，按整百万报个大概。'),order([-8200,-7900,-9100],'三处模拟深度是相对水面的-8200、-7900、-9100米。按数值从小到大排；更深在更小的一边。',{min:-10000,max:0}),round([827450,614200,983600],100000,'三次模拟活动的人次，分别报到十万，再估总人次。',{calc:'+'})],
 decimalscale:[shift('0.4',-1,'0.4向右移一格，变成多少？先猜，再看那一小份。'),shift('0.06',1,'0.06向左移一格，值会怎样变？'),shift(6000,-6,'把6000的6一步步移到0.006的位置。两者相差多少倍？')],
 decimalplaces:[board(['2.635'],'搭2.635，记录2、6、3、5各表示多少。小格标签也写着分母。',{expanded:true}),shift('0.7',-1,'十分之一里的7，移到百分之一会怎样？'),board(['4.073'],'四个一、零个十分之一、七个百分之一、三个千分之一，合成什么数？',{expanded:true})],
 decimalwords:[board(['347.392'],'搭347.392，用单位分数看每位，再写各部分的值。',{expanded:true}),compare('0.372','0.38','把0.372与0.38对齐。补空的末尾位置不会改变值。'),board(['5.062'],'“五又千分之六十二”怎样放？先搭，再写数字。',{expanded:true})],
 rounddecimal:[round('3.7',1,'把3.7放在相邻整站间，报到最近整数。'),round('3.2',1,'换成3.2，哪边更近？'),round('6.5',1,'6.5恰好一半。这次按一半取较大数的约定。'),round('8.4',1,'换一个数8.4，再独立做一次。')],
 roundtenths:[round('3.47',1,'3.47直接报到整数。'),round('3.47','0.1','从原数3.47重新出发，保留一位小数。'),round('12.95','0.1','12.95取一位小数。进到13时，也留下表示精度的0。'),round(['4.83','2.17'],1,'各自报到整数后估计相加。再算准确和，比一比，两者也可能相同。',{calc:'+',exact:true})],
 roundprecise:[round('3.4567','0.01','3.4567保留两位小数。一次找最近的百分位。'),round(7654321,100000,'7654321报到十万。'),round(['4.83','2.17'],1,'先各自报到整数，再估乘积。这个估计不是准确乘积。',{calc:'*'})],
 accuracy:[round('0.004982','0.01','把0.004982保留两位小数。点后数两位。'),round('0.004982','0.0001','同一个0.004982，这次从第一个非零数字开始，留下两个有用的数字。先点出它们。',{sf:2}),round('2.895','0.01','把2.895留下三个有效数字。进位后，末尾的0也留下。',{sf:3}),round('2.736','0.01','要按这把卷尺的最小刻度0.01米记录2.736米。先选合适的记录间隔，再取近似值。',{units:['1','0.1','0.01']}),round('34962',1000,'让34962留下两个有效数字。其他位置用0保住大小。',{sf:2})],
 estbounds:[round(['49.7','20.2'],1,'这两块模拟材料总长大约多少？各报到整数，再估总长。',{calc:'+'}),{type:'x-boundinterval',value:'12',unit:'1',prompt:'长度报为12米，原长可能在哪段？自己写两端，试两次边界，再决定两端包不包括。'},{type:'x-boundinterval',value:'3.2',unit:'0.1',prompt:'长度报为3.2米，是按0.1米记录的。找原长范围，亲自测试下端和上端。'}],
 powerpattern:[shift(1,4,'接上四个“乘10”，也就是10⁴。先猜结果再一步步做。',{factors:true}),shift('3.4',2,'3.4×10²：把数字向左移两格，点保持原位。'),shift('2.56',3,'先猜2.56×10³，再亲自移三格。'),shift(340,-2,'反向试试：340除以10²，移回两格。')],
 standardform:[shift(720000,0,'把720000的数字移到第一位落在1到10之间；再写一个10的幂，把大小补回去。',{mode:'scientific'}),shift('0.00072',0,'很小的0.00072也这样写。指数是负的，数值还是正的。',{mode:'scientific'}),shift('5.8',-4,'把5.8×10⁻⁴展开为普通小数。先猜再移。'),order([720000,5800000,'0.00072'],'把7.2×10⁵、5.8×10⁶、7.2×10⁻⁴从小到大排好；再写各自的普通数值。',{notation:['7.2 × 10⁵','5.8 × 10⁶','7.2 × 10⁻⁴'],conversions:true})],
 roman100:[roman(44,'read','把XLIV切成“可一起读的小段”，再写每段值多少。'),roman(93,'write','用这些旧符号拼出93。'),roman(20,'write','拼出20。再记录两个X各值多少，以及有没有专用的零符号。',{zero:true})],
 romanyears:[roman(1999,'read','把年份MCMXCIX分段，分别读出每段的值，再相加。'),roman(2024,'write','用符号拼出2024。'),roman(4,'write','用这里采用的规范拼4。钟面有时写IIII，这里练IV的规则。')],
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,t])=>[id,structuredClone(t[0])]));
const link=(from,to,title,summary,tasks)=>({from,to,title,summary,tasks:structuredClone(tasks),phase:5,batch:'B08'});
export const BRIDGES=[
 link('threeplaces','fourplaces','多一个位置，多一种大包','位值结构从百延伸到千。',[B07.threeplaces[2],TASKS.fourplaces[0]]),
 link('fourplaces','thousandstep','看懂位置，才能添对一包','由数的组成走到跨万的添取。',[TASKS.fourplaces[1],TASKS.thousandstep[2]]),
 link('fourplaces','fourfaces','筹码与数轴，指同一个数','数位构造连接到数量位置。',[TASKS.fourplaces[0],TASKS.fourfaces[1]]),
 link('fourfaces','bigcompare','位置越靠右，数就越大','表示、比较与排序相连。',[TASKS.fourfaces[2],TASKS.bigcompare[0]]),
 link('fourplaces','roundwhole','先认单位，再找最近一站','同一原数按不同单位取近似值。',[TASKS.fourplaces[0],TASKS.roundwhole[1]]),
 link('roundwhole','roundlarge','数更大，找近站的办法相同','从整百延伸到十万并检查进位。',[TASKS.roundwhole[1],TASKS.roundlarge[1]]),
 link('tenpattern','decimalscale','十倍规律跨过小数点','左右移动都用同一条位值链。',[TASKS.tenpattern[0],TASKS.decimalscale[0]]),
 link('decimalscale','decimalwords','小份也有自己的位置','位值移动连接到小数的组成。',[TASKS.decimalscale[1],TASKS.decimalwords[2]]),
 link('sixdigits','millionwords','再长一位，仍要保留空位','中文命名、对齐与展开延伸到七位数。',[TASKS.sixdigits[0],TASKS.millionwords[0]]),
 link('roman100','romanyears','同一套旧符号，写出年份','减法组合规则延伸到更大的符号。',[TASKS.roman100[0],TASKS.romanyears[0]]),
 link('rounddecimal','roundtenths','不只找整站，也能找十分站','先定记录间隔，再看距离。',[TASKS.rounddecimal[0],TASKS.roundtenths[2]]),
 link('roundprecise','accuracy','留下几位，要先说明数法','小数位数和有效数字不能混淆。',[TASKS.roundprecise[0],TASKS.accuracy[1]]),
 link('accuracy','estbounds','说得多细，决定可能范围','记录精度连接到端点与误差区间。',[TASKS.accuracy[3],TASKS.estbounds[2]]),
 link('decimalscale','powerpattern','连续移几格，写成10的幂','十倍操作重复以后可压缩记录。',[TASKS.decimalscale[1],TASKS.powerpattern[1]]),
];
