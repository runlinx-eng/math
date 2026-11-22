const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B06'});
export const LESSONS={
 countonce:item('mt_WcfaSfVT33','数过的，别数第二次','一一对应计数','数一个物品，只给它一个序号；所有物品都要数到。把数过的分开，能避免漏数和重复。','怎样发现同一个物品被数了两次？'),
 lastcount:item('mt_dmNvjroCPT','挪个位置，还这么多吗','基数与数量守恒','从一开始，每件物品恰好数一次，最后的数才表示总数。只换排列或计数次序，没有添取物品，总数不变。','最后说出的数为什么有时不能直接当总数？'),
 counttwenty:item('mt_yqAL6O5i_v','从一堆里，正好取出这些','二十以内的实物计数','数清一堆与按要求取出一部分都要一一对应。目标数也告诉我们何时停下。改变摆法不改变总量。','散着摆时，你怎样防止漏数？'),
 paircounts:item('mt__h7hvT4tEb','排得长，就一定多吗','用匹配和计数比较数量','一对一配完后，多出的一方数量更多；两边无剩余则相等。拉大间距没有增加物品。比较的是数量，不是排列的长度或物品的大小。','配对和数两边，为什么能得到相同结论？'),
 nextone:item('mt_sYpKWbq5ra','只加一个，要重新数吗','相邻自然数与多一少一','增加一个就到后一个数，拿走一个就到前一个数。这个关系把物品数量与数轴上一格联系起来。','为什么知道原来七个，就能想到再加一个是八个？'),
 manyfaces:item('mt_pAcaehday5','这些画法，能说同一个数吗','数的多种表示','物品、点图、数字和数轴位置可以表示同一数量。数轴的零是起点，走过的单位间隔才是数量。','怎样检查几个表示没有各说各的？'),
 quickfive:item('mt_t9BICauBSI','一眼里，看见了几个','五以内的快速识数','小数量可以作为一个整体认出。熟悉和不同的点阵都值得观察，也可用手指一次表示。短时显示只记录这次表现，不能知道你是否在心里逐个数。','哪种摆法容易看出来？换一种摆法还认得吗？'),
 partswithin:item('mt_BK5xwkrD5C','先看几和几，再看一共','十以内的部分与整体','一个总量能看成几个部分。七可以看成五和二，八可以分成四和四或五和三；分法变化，总量保持。','你能把八分成另一种不同的两部分吗？'),
 bundles:item('mt_0ZDouU664X','一大堆，怎样数得不乱','分组计数与单位化','把物品分成同样大的组，可以按组计数，再加上不满一组的剩余。每件物品只能属于一组，扎束和拆开都不能改变总数。','八束十个和五个零散的，为什么不是十三个？'),
 countline:item('mt_M5PPDJStGm','不用从一开始，也能接下去','一百以内的顺数与倒数','相邻自然数相差一。能从不同起点接着数、跨过整十并倒着走，才不只是记住从一开始的一长串。口头数数可对照百数表练习，这里不自动评估发音和口述流利程度。','从二十九到三十，哪个位置发生了变化？'),
 skipbasic:item('mt_nvdpxAJTBG','一双一双、一组一组数','按二、五、十跳数','每次增加相同数量的一组，数轴就走相同长度。跳数和重复加同一个数相对应。','数五组两只袜子时，每一次跳跃表示什么？'),
 skipthree:item('mt_aHAM29nidj','三格一步，回来也一样吗','按三顺数与倒数','向前每次加三，向后每次减三。方向变化，步长保持；不必每次从零重新数。','从三十倒着走，第一步为什么不是二十九？'),
 anytens:item('mt_OkSJfrmFb_','从七开始，也能十个十个走','从任意数按十计数','加十或减十改变十的数量，个位保持。跨过整百时可能同时改变百位，不能只改一个数字而忽略进退位。','九十七加十时，为什么个位仍是七？'),
 withinthousand:item('mt_M2v1A9OEuM','走到整百边上，会怎样','一千以内的连续计数与跳数','可按一、五、十或一百计数；步长决定每次改变多少。跨整百、整千时，需保持数量变化一致。','九百九十五之后每次加五，会走到哪里？'),
 skipfour:item('mt_IzQvs7k_sE','换大一点的步子','按四、八、五十、一百跳数','把每一组当作一个单位，按固定步长累积。四的两步与八的一步可以到同一位置，五十的两步组成一百。','不同步长能落在同一个位置吗？'),
 skipbig:item('mt_7rJM8eWUfw','每次成组，规律还在吗','按六、七、九、二十五、一千跳数','每个数仍由前一个加固定步长得到。熟悉整组结构能帮助计数，但不会改变一组中实际有多少。','四组二十五为什么能连到一百？'),
 powersteps:item('mt_tAtMET4EIU','改一步的大小，哪些位会动','按十的幂计数与进退位','按十、一百、一千、一万、十万改变数量。跨过某一数位的边界会发生进位或退位，相关高位也随之改变。','四十九万二千加一万，为什么不只是把一个数字加一？'),
 write20:item('mt_fR0UtsSREU','把听到的数，摆出来写下来','二十以内数字的读写与数量对应','数字表示一个数量；零表示没有。十几由一个十和几个一组成。这里核对数值与构造，手写笔迹保存待看，不自动判定是否写得清楚。','十七的两个数字分别告诉了什么？'),
 teenbuild:item('mt_xmmgAzxe5j','十个扎成一束，还剩几个','十几的十与一结构','十个一可以组成一个十。十四是一个十和四个一；十七能拆成十加七。扎束或拆开，总量不变。','十三里的“一”为什么代表十个？'),
 numberwords:item('mt_9IzhGUZ30z','数字的名字，也能当标签','数词、数字与数量（中文适配）','十二、12 和十二个物品指向同一数量；写文字标签也要保持数量。这是原英文数词目标的中文改编，不代表完成英语拼读或拼写。','“十二”与“二十”的标签能贴在同一堆上吗？'),
 digitcompare:item('mt__YRJ23GuIK','只写两个数字，怎样比','数字大小比较与关系符号','数字表示数量，数轴上较右的位置表示更大的数。小于号和大于号的开口朝较大数，相同数量用等号。','把两个数交换左右，关系符号要怎样变？'),
 order20:item('mt_dJOKkYMsCv','把这些数字放回队伍','二十以内数的顺序与相邻数','从小到大排列看数量，零也有位置。前一个少一，后一个多一；二十格图与数轴能帮助检查顺序。','十三前后各是谁？零应该放在哪里？'),
 write100:item('mt_x8TshvbbQT','听起来相近，写出来一样吗','一百以内数字的读写与位值','几十和几个一按十位、个位写；零需要占位。一百是一个百。这里以中文听读数值，核对结构与数字，笔迹清晰度不自动评分。','四十、十四和四十一怎样用整十和零散的一表示？'),
};
const route=(id,title,section,ids)=>({id,title,section,packIds:['number-sense'],themeId:'numbers',color:'#ae8259',ids});
export const SECTIONS=[{id:'count',title:'先把数量看清楚'},{id:'walk',title:'沿着数字往前走'},{id:'symbol',title:'让数字和数量对上'}];
export const ROUTES=[route('P','数清楚，再挪一挪','count',['countonce','lastcount','counttwenty']),route('Q','数量换个样子','count',['paircounts','nextone','manyfaces']),route('R','看小组，数大堆','count',['quickfive','partswithin','bundles']),route('S','一步一步，几步一跳','walk',['countline','skipbasic','skipthree']),route('T','从这里接着走','walk',['anytens','withinthousand','skipfour']),route('U','大步走也不乱','walk',['skipbig','powersteps']),route('V','数字、名字和一整十','symbol',['write20','teenbuild','numberwords']),route('W','放到它的位置','symbol',['digitcompare','order20','write100'])];
const count=(n,prompt,opts={})=>({type:'x-counttrail',n,prompt,...opts});
const walk=(start,step,count,prompt,opts={})=>({type:'x-countwalk',start,step,count,prompt,...opts});
const write=(n,mode,prompt,opts={})=>({type:'x-numberwrite',n,mode,prompt,audio:mode==='audio'?`learning/phase5/audio/n${n}.wav`:null,...opts});
export const TASKS={
 countonce:[count(7,'每点一颗就给它一个序号。试着不漏、不重复地数完，再记总数。',{layout:'scatter'}),count(6,'小木偶数到一颗时重复了。指出出错的那一步，再亲自正确数一次。',{error:[0,1,2,2,3,4,5],layout:'circle'})],
 lastcount:[count(7,'先数一遍。挪动前猜还剩几个，再挪开看看。',{rearrange:true,layout:'line'}),count(6,'先数一次。换个起点再数，把两次总数对起来。',{rearrange:true,recount:true,layout:'circle'}),count(5,'小木偶从“三”开始给五颗珠子报数。最后喊“七”，总数就一定是七吗？',{crooked:true,layout:'line'})],
 counttwenty:[count(20,'这排有多少颗？每颗只数一次。',{layout:'line'}),count(9,'散开的也要数全。先把数过的标出来，再给总数。',{layout:'scatter'}),{type:'x-numberfaces',n:13,pool:20,give:true,prompt:'从二十颗中正好取出十三颗，放入小盘，再写下数量。'}],
 paircounts:[{type:'x-paircounts',a:5,b:6,spread:true,prompt:'上面看起来长，下面挤在一起。点上面一颗，再点下面一颗，配完后比较。'},{type:'x-paircounts',a:4,b:4,prompt:'换成两排不同摆法。配完后看看是否一样多。'},{type:'x-paircounts',a:8,b:3,c:5,prompt:'先配对前两组，再和第三组一起找最多、最少。'}],
 nextone:[{type:'x-onechange',n:5,delta:1,prompt:'盒里原有五颗。先猜加一颗后是多少，再放进去。'},{type:'x-onechange',n:8,delta:-1,prompt:'这次从八颗拿走一颗。先猜，再动手检查。'},{type:'x-onechange',n:7,delta:1,prompt:'从七到后一个数，会发生什么？先猜，再试，再说明八比七多了什么。'}],
 manyfaces:[{type:'x-numberfaces',n:5,pool:12,prompt:'用盘里的珠子、点图和数轴，分别做出五。'},{type:'x-numberfaces',n:6,pool:15,fromLine:true,prompt:'先读数轴上标出的量，再用珠子和点图做出同样多。'}],
 quickfive:[{type:'x-flashcount',n:4,layout:'dice',prompt:'点一下看一秒，盖住后记下有几颗。可以再看，次数会留下。'},{type:'x-flashcount',n:2,layout:'scatter',prompt:'换个摆法，再看一眼。'},{type:'x-flashcount',n:5,layout:'scatter',prompt:'这次不是骰子摆法，看看能否一下认出。'},{type:'x-fingers',n:3,prompt:'不按顺序逐个数，选出三个手指，一起亮出来。'}],
 partswithin:[{type:'x-flashcount',n:7,parts:[5,2],layout:'frame',prompt:'看看十格里的图。盖住后，分别记下上排、下排与总量。'},{type:'x-flashcount',n:6,parts:[4,2],layout:'domino',prompt:'这张牌的两边各是几？看完再记。'},{type:'x-partbuild',n:8,prompt:'用两种颜色合成八。保存一种分法，再做一种真正不同的分法。'}],
 bundles:[{type:'x-bundlecount',n:85,size:10,prompt:'先亲自选十颗，扎成一束。其余照着分组，再数整束和剩下的。'},{type:'x-bundlecount',n:46,size:2,prompt:'每双两只。先配一双，其余照样配，再算有多少只。'},{type:'x-bundlecount',n:120,size:10,reason:true,prompt:'把这堆十个十个地分组。说明“有几束”和“有几个”有什么不同。'}],
 countline:[{type:'x-countboard',max:100,holes:[10,20,30,40,50,60,70,80,90,100],prompt:'把每排末尾丢失的数字补回去。也可以沿表从一数到一百，口述不自动评分。'},walk(23,1,10,'从二十三接着走，每次多一；先填下一站，再走。'),walk(20,-1,20,'从二十往回走到零，每次少一。')],
 skipbasic:[walk(0,2,10,'一双两只袜子。每次加一双，在数轴上走到二十。'),walk(0,5,10,'每组五颗。一路记录到五十。'),walk(0,10,10,'十颗一束，一路记录到一百。')],
 skipthree:[walk(0,3,10,'三格一步，从零走到三十。'),walk(30,-3,10,'保持三格一步，从三十走回零。')],
 anytens:[walk(7,10,10,'从七开始，每次加十，走十步，看看跨过一百时怎样变。',{reason:'ones'}),walk(83,-10,8,'从八十三每次减十，走八步。个位会怎样？',{reason:'ones'})],
 withinthousand:[walk(995,1,5,'从九百九十五开始，每次多一，走到一千。'),walk(503,-1,6,'从五百零三开始，每次少一，跨过五百。'),walk(950,5,10,'从九百五十开始，五个五个数到一千。'),walk(650,10,8,'从六百五十开始，每次多十，走八步。'),walk(150,100,8,'从一百五十开始，每次多一百，走八步。')],
 skipfour:[walk(0,4,12,'每组四个，走十二步，记录每一站。'),walk(0,8,12,'换成每组八个，走十二步。'),walk(0,50,20,'五十为一组，从零走到一千。'),walk(0,100,10,'一百为一组，从零走到一千。')],
 skipbig:[walk(0,6,12,'六个一组，走十二步。'),walk(0,7,12,'七个一组，走十二步。'),walk(0,9,12,'九个一组，走十二步，看看每一站怎样改变。'),walk(0,25,40,'二十五为一组，走到一千；每四组在整百处停一下。'),walk(0,1000,10,'一千为一组，从零走到一万。')],
 powersteps:[walk(97,10,3,'从九十七每次加十，走三步。',{reason:'carry'}),walk(950,100,3,'从九百五十每次加一百，走三步。',{reason:'carry'}),walk(34500,1000,3,'从三万四千五百，每次加一千。'),walk(462000,10000,5,'从四十六万二千，每次加一万，看看怎样越过五十万。',{reason:'carry'}),walk(800000,-100000,5,'从八十万，每次退十万，走五步。'),walk(575000,100000,3,'前面是 375000、475000、575000。保持每次相同变化，再搭三站。',{infer:true}),walk(999000,1000,1,'从九十九万九千再加一千，会到哪里？',{reason:'carry'})],
 write20:[write(17,'audio','听这个数，用整十和单颗摆出，再写成数字。',{ink:true}),write(0,'objects','盘里没有珠子，应该怎样读、怎样写？'),write(20,'symbol','看数字 20，摆出它的数量，再写它的中文名字。')],
 teenbuild:[{type:'x-teenbuild',n:14,prompt:'从十四颗里选十颗扎成一束，再记录整束和剩下的。'},{type:'x-teenbuild',n:17,unpack:true,prompt:'先扎一束，再拆开看看，总数没变；最后重扎并写出十加几。'},{type:'x-teenbuild',n:13,prompt:'把十三摆成一束十个和零散几个，再说明两个数字的意思。'}],
 numberwords:[write(12,'word','读标签“十二”，把对应数量摆到盘里，再配上数字。'),write(14,'label','这盘要装 14 个。摆出数量，自己写一个中文文字标签。'),write(20,'word','换成“二十”，看看它与“十二”有什么不同。')],
 digitcompare:[{type:'x-digitcompare',a:4,b:7,prompt:'把 4 和 7 放到数轴上，再给它们一个正确的关系符号。'},{type:'x-digitcompare',a:8,b:3,prompt:'这次较大的数在左边，开口应该朝哪边？'},{type:'x-digitcompare',a:6,b:6,prompt:'两张卡都写 6，数轴上会怎样？'}],
 order20:[{type:'x-orderline',values:[14,3,19,0,8],prompt:'按从小到大依次点卡片，把它们排成队；点已排的可以拿回。'},{type:'x-numberfaces',n:13,pool:20,neighbors:true,prompt:'在二十格里摆十三，再放到数轴并找前后邻居。'},{type:'x-orderline',values:[20,12,2,0],prompt:'换一组，零也要有位置。'}],
 write100:[write(40,'audio','听这个数，摆出整十和零散的一，再写下来。',{ink:true}),write(14,'audio','这次听起来哪里不同？摆出来再写。',{ink:true}),write(75,'symbol','看数字 75，摆出它并写出中文名字。'),write(100,'audio','听这个数。十个十放在一起时，可以换成什么？',{ink:true})],
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,t])=>[id,structuredClone(t[0])]));
const link=(from,to,title,summary,tasks)=>({from,to,title,summary,tasks:tasks.map(t=>structuredClone(t)),phase:5,batch:'B06'});
export const BRIDGES=[
 link('countonce','lastcount','每件只数一次，最后的数才可靠','一一对应是用最后序号表达总数的前提。',[TASKS.countonce[1],TASKS.lastcount[2]]),
 link('lastcount','nextone','知道原来多少，才能接着加一','先把总量当整体，再预测增加一个后的数。',[TASKS.lastcount[0],TASKS.nextone[0]]),
 link('lastcount','manyfaces','这个总量，换三种方式保留下来','物品数量稳定，才有同一数的不同表示。',[TASKS.lastcount[1],TASKS.manyfaces[1]]),
 link('quickfive','partswithin','认出小组，再看合起来','把认出的小数量作为部分，组合成更大的总量。',[TASKS.quickfive[0],TASKS.partswithin[1]]),
 link('countline','skipbasic','连续小步，怎样变成整组跳','数轴上合并相同数量的小步，得到固定的整组步长。',[walk(0,1,10,'先一格一格走到十。'),walk(0,2,5,'再两格一步到十，比较用了几步。')]),
 link('skipbasic','anytens','步子还是十，起点换成七','每次加一组十并不要求从整十开始。',[TASKS.skipbasic[2],TASKS.anytens[0]]),
 link('skipbasic','skipfour','两步两格，能组成一步四格吗','相同步长组合，可以形成新的固定步长。',[TASKS.skipbasic[0],TASKS.skipfour[0]]),
 link('write20','teenbuild','写下的十几，拆成十和几','数字要与一束十个和若干个一相对应。',[TASKS.write20[0],TASKS.teenbuild[0]]),
 link('digitcompare','order20','会比两张卡，怎样排好一队','比较数量关系可用来确定多个数的次序。',[TASKS.digitcompare[0],TASKS.order20[0]]),
 link('write20','numberwords','数字换成文字，数量仍相同','数字与中文数词表示相同的数量；不涉及英语拼写评估。',[TASKS.write20[2],TASKS.numberwords[2]])
];
