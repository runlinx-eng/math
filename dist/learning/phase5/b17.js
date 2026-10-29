import{TASKS as T09}from'./b09.js';
import{TASKS as T13}from'./b13.js';
import{TASKS as T15}from'./b15.js';
import{TASKS as T16}from'./b16.js';
const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B17'});
export const LESSONS={
 unitorder:item('mt_IfEgu0X449','份数变了，大小怎样排','单位分数与同分母分数比较','同一个整体，分得越细，一份越小；同样大小的小份，拿得越多，总量越大。这是两个不同的问题，不能只盯某一个数字。','1/5比1/2小，为什么4/5又比2/5大？'),
 fractionchoices:item('mt_SsLWS_APM7','先想要找什么，再动手','分数问题的策略选择','先看故事里的整体、部分和要找的量，再选分、取、比较或相加减。结果要能回到原来的情境，不能看到“总共”就一律相加。','先找一份与直接相加，各在什么故事里合适？'),
 samepartcompare:item('mt_HnKbuCliNS','拿同样几份，为什么不一样多','同分子、同分母与相同整体','3/8与3/4都取三份，但每份不同；5/6与2/6每份相同，但取的份数不同。用图比大小时，整体必须一样大。','把一张图画成两倍长，会不会改变分数这个数本身？'),
 fractionbench:item('mt_SXbZ3bC9z7','找一个共同的参照','通分比较与基准数','把3/8与5/12都分成二十四分之一，可以比较9份和10份；5/8与3/7分处一半两边，借一半就能判断。','什么时候借一半就够，什么时候需要继续细分？'),
 beyondoneorder:item('mt_PL9VkDwXfh','离整个多远，跨过整个多远','近整数与假分数的比较','都在1下面时，离1越近的越大；跨过1也沿同一单位数轴。7/5=21/15，4/3=20/15。','离1差得少的更大，这个办法能直接套在1两边吗？'),
 recutnames:item('mt_FP-mjXaq3B','切细一点，还是原来的量','等值分数的生成与约分','每一份都再分两份，上下的份数同时翻倍，涂出的量不变。反过来成组并回，也能保留同一个量。','上下各加1，为什么通常不能替代再分或合并？'),
 samenames:item('mt_ebPelt-qAl','给同一个量留下几个名字','分数等值的乘除原则','2/3、4/6、6/9在同一位置。乘相同因子是在重分每一份；乘n/n相当于乘1。自由说明仍要靠自己的理由。','同样乘一个数，为什么量没变；只改一边又会怎样？'),
 simplestparts:item('mt_b7T-CjOYUR','能不能合到更简单','公因数、最简分数与共同分母','18/24可以一起除以6到3/4，也可以先除2再除3。9/12与原量相等，只是还没到最简。比较两种份要用共同的倍数。','约分找共同因数，通分找共同倍数，各自在改变什么？'),
 percentpatterns:item('mt_jCy07DyBNU','从几个例子，搭一条可用的规则','等价运算、数列规则与百分数','×25可以写成×100再÷4。每次多4、从5开始的数列，第n项是4n+1。35%能由三个10%和一个5%拼成；换整体，各块金额跟着改变。','知道下一项，还不够直接知道第100项，差在哪里？'),
 tenpieces:item('mt_YzM5goBctT','十个小份，合回多少','十分之一与分数除法','一个整体分十等份，十个十分之一合回1。3个整体分给10人，每人拿到3个十分之一，所以3÷10=3/10。','数到十份时，为什么量是1而不是10？'),
 decimalorder2:item('mt_IegHBHERVa','小数也沿着同一条线排','两位小数的位值比较','先比较大的单位，遇到第一个不同位置就能决定。3.72与3.27个位相同，十分位先决定；末尾0不改变数量。','比较大小和竖着相加，为什么看的先后不一样？'),
 tenthtohundred:item('mt_NaqEP8xDhZ','一长条，换成十小格','十分之一转百分之一','一个十分之一包含十个百分之一。3/10先换成30/100，再加4/100得到34/100；相加的是同样小的份。','3/10+4/100为什么不能把上下的数字都相加？'),
 decimalnames:item('mt_Vi4Vo5xs_g','点后面的0，守着哪个位置','十分位、百分位与分数互译','0.62是62个百分之一，0.07是7个百分之一，0.7则是7个十分之一。0不是装饰，它让数字留在正确的单位位置。','0.07与0.7只差一个0，为什么量差十倍？'),
 decimalmeasure3:item('mt_sA2OvTiech','小到千分之一，也能拼和取','三位小数的计算与应用','相同单位站在同一列，十个小单位换一个大单位。1.5=1.500；1.500−0.375=1.125。两段也可自选，只要相接恰好到1。','把0.4记成0.400，变的是量还是写法？'),
 thousandparts:item('mt_kdWoAel3Zl','再放大一点，里面还有位置','千分之一与十进细分','一个百分之一再分十份就是千分之一。一个十分之一有100个千分之一。0.345在0.34与0.35中间；放大显示不改变原来的单位。','画面被放大十倍，为什么数没有跟着变大？'),
 raggeddecimals:item('mt_933BohS9BH','写得更长，不一定更大','不同位数小数的比较','0.45比0.405大，但0.4又比0.87小。数量由位置决定，不能套“长的一定大”或“短的一定大”。0.7=0.70=0.700。','两个相反的长度口诀，怎样各找一个反例？'),
 fractionmeasure:item('mt_wB-GBDkoNr','把分数带回钱与长度','分数、小数与计量单位','3.20元的1/4是0.80元，也就是80分。2.5米剪掉0.75米还剩1.75米。1千克的3/10是300克，也可以记0.3千克。','同一段长度从米换成厘米后，为什么数字变了？'),
 fdpswitch:item('mt_4K1dr204Hi','一个量，三种写法一起看','分数、小数与百分数转换','分数线也表示除法：3/8=3÷8=0.375。1/5=0.2=20%。1/3是循环小数0.333…，不能截成0.3再说相等。','30%、1/3、0.35，哪些需要精确值，哪些可以借参照比较？'),
 decimalstops:item('mt_SBkTGjiZjZ','除到什么时候，会停下来','有限小数与循环小数','先把分数化到最简。分母的质因子只有2和5时，可以换成10的幂作分母，所以小数会结束；还有别的质因子时会循环。有限操作样例不等于已经证明一般规律。','6/15与4/15下面都写15，为什么一个会停，一个会循环？'),
 structurechoices:item('mt_hlGKg5M7qJ','换个结构，事情变好算','因数重组、等值表示与角关系','25×16可以拆成25×4×4，先得到100。75%与3/4一样多，求80的3/4可以先÷4再×3。直线上相邻的角合为180°，能用来推出未知角。','25×16顺手的办法，为什么不能把23×16也凑成100？'),
 mixedrename:item('mt_o_p-3tCxiM','整份和零头，来回换名字','带分数与假分数互化','11个1/4里有两组完整的4/4，剩3/4，所以11/4=2又3/4。3又2/5是15个1/5再加2个，共17/5。','从整份换成小份，为什么小份的大小不能变？'),
 fractionfour:item('mt_gNUE4B3vuk','同样两个数，四种不同动作','数系综合运算与方法辨别','加减连接同样小的份，乘法缩放，除法比较能放下几组。分数乘法即使先通分，也要把两个分母相乘；有效但多一步的方法不算错。负数方向、混合数和小数都保留原量。','为什么同一对分数，换一个运算符就需要重新想动作？'),
};
const route=(id,title,section,ids)=>({id,title,section,ids,packIds:['same-amount'],themeId:'numbers',color:'#b58e51'});
export const ROUTES=[route('CO','分得细，还是拿得多','portion-number',['unitorder','samepartcompare','fractionchoices']),route('CP','借一半、借整个来比较','portion-number',['fractionbench','beyondoneorder']),route('CQ','切细与合并，量不变','portion-connect',['recutnames','samenames','simplestparts']),route('CR','十分、百分与小数','portion-work',['tenpieces','tenthtohundred','decimalnames']),route('CS','把小数的位置看清楚','portion-number',['decimalorder2','thousandparts','raggeddecimals']),route('CT','钱、长度与更小的单位','portion-work',['decimalmeasure3','fractionmeasure']),route('CU','小数会停，还是会循环','portion-connect',['fdpswitch','decimalstops']),route('CV','换一种办法，更好看清关系','portion-connect',['percentpatterns','structurechoices']),route('CW','整份、零头与四种运算','portion-number',['mixedrename','fractionfour'])];
const order=(cards,prompt,opts={})=>({type:'x-fracorder',cards,prompt,max:2,...opts});
const rename=(n,d,prompt,opts={})=>({type:'x-fracrename',n,d,prompt,...opts});
const compare=(cases,prompt)=>({type:'x-decimalcompare',cases,prompt});
const zoom=(n,prompt)=>({type:'x-decimalzoom',n,prompt});
const decimal=(n,d,prompt)=>({type:'x-decimalengine',n,d,prompt});
const op=(a,operator,b,prompt)=>({type:'x-fracoperations',a,b,op:operator,prompt});
const bar=(total,d,n,unit,prompt)=>({type:'x-portionbar',total,d,n,unit,prompt,equations:[`${total}/${d}*${n}=${total/d*n}`,`${total}*(${n}/${d})=${total/d*n}`]});
const calc=(values,operator,scale,prompt,labels)=>({type:'x-placecalc',values,op:operator,scale,written:true,prompt,...(labels?{labels}:{})});
const axis=(cards,min,max,prompt)=>({type:'x-mixedaxis',cards,min,max,prompt});
const fdp=(n,d,prompt)=>({type:'x-fdpboard',n,d,prompt,views:['line']});
const plan=(values,labels,plans,meanings,prompt,equations)=>({type:'x-storychain',values,labels,plans,meanings,prompt,equations});
export const TASKS={
 unitorder:[order(['1/2','1/5','1/3','1/4'],'先猜从大到小怎样排，再亲手涂出每个量、放到同一条线上。',{desc:true,max:1}),order(['3/5','1/5','4/5','2/5'],'这次每份都一样大，只改变取了几份。从大到小排。',{desc:true,max:1}),order(['1/5','1/2','3/5'],'两种情况混在一起，不能只看上面或下面的数字。',{max:1})],
 fractionchoices:[plan([20,4,3],['总共20颗','平均分4份','取3份'],['0/1*2'],[{id:'one',label:'一份有几颗',exprs:['0/1']},{id:'take',label:'取出的总颗数',exprs:['0/1*2']}],'总共20颗，取它的3/4。先想哪一步数什么，自己把计划接出来。',['20/4*3=n']),order(['1/3','3/4','1/2'],'三人走了同一条路的这些部分，谁走得最远？把它们放在同一个整体上。',{max:1}),plan([24,4,3,5],['总共24颗','分4份','取3份','送出5颗'],['0/1*2-3'],[{id:'one',label:'一份几颗',exprs:['0/1']},{id:'take',label:'先取出的颗数',exprs:['0/1*2']},{id:'remain',label:'送出后留下的颗数',exprs:['0/1*2-3']}],'24颗先取3/4，再送出5颗，剩多少？每一步先选自己在找的量。',['24/4*3-5=n']),op('3/8','+','2/8','同一块面包先取3/8，再取2/8。不是在求“几分之几的几分之几”，先把两次取出的量接起来。')],
 samepartcompare:[order(['3/8','3/4'],'都拿三份，先涂再放；每份的大小一样吗？',{max:1}),order(['5/6','2/6'],'这次每份都是六分之一，比一比取的份数。',{max:1}),order(['3/4','3/8'],'两张图的整体一开始不一样长。先修好图，才能靠它比较。',{max:1,mismatch:true})],
 fractionbench:[order(['3/8','5/12'],'两种小份不好直接数，给它们画共同的小份，再给各自换名字。',{max:1,common:true}),order(['2/3','3/5','7/10'],'把三张卡按从小到大排，每张都要亲自摆出位置。',{max:1,common:true}),order(['5/8','3/7'],'这次先看各自在一半哪边，再决定大小。',{max:1,benchmark:true})],
 beyondoneorder:[order(['3/4','7/8','5/6','11/12'],'先摆好，再逐个看它离1还差多少。差得少与量更大怎样相连？',{gaps:true}),order(['7/5','4/3'],'都超过1，仍然用同一单位；细分成共同小份再比较。',{common:true}),order(['1 2/5','4/3','7/4'],'整份加零头也有自己的位置，写法不同照样一起排。',{max:2}),order(['5/6','7/9'],'上下数字更大就量更大吗？让共同小份给出反例。',{common:true,max:1})],
 recutnames:[rename(1,3,'把每份继续分成2小份，留下新名字；再试上下各加1，量还一样吗？',{targets:[[2,6]],testAdd:true}),rename(4,8,'把小份合成更大的等份，一直合到不能再合。留下最后的名字。',{targets:[[1,2]],simple:true}),rename(1,4,'分别给同一个量换成八分之一和十二分之一，留下两个名字。',{targets:[[2,8],[3,12]]})],
 samenames:[rename(2,3,'留下4/6和6/9两个名字；量没变，变的是哪一种份？',{targets:[[4,6],[6,9]],testAdd:true}),rename(3,5,'自己选分得更细的办法，留下三个不同名字，每次量都要一样。',{count:3}),rename(3,10,'每份再分10份，把这个量换成百分之一。',{targets:[[30,100]],decimal:true})],
 simplestparts:[rename(18,24,'把18/24合到最简，也可以分几次合。再写出一开始最大的共同因子。',{targets:[[3,4]],simple:true,hcf:true}),order(['2/3','5/8'],'把两种份统一细分，用新的名字说明怎样比较。',{max:1,common:true}),rename(6,8,'合并两小份试试；再试上下各加1，两个动作会保留同一个量吗？',{targets:[[3,4]],simple:true,testAdd:true})],
 percentpatterns:[{type:'x-rulejump',a:25,b:0,inputs:[4,7,16],exampleRule:[100,0,4],context:'每份25，4份、7份、16份',prompt:'每份25。试用“先乘100，再除4”搭规则；用不同份数检查它与每份25是否相同。'},{type:'x-rulejump',a:4,b:1,inputs:[1,3,20,100],context:'从5开始，每次多4：5，9，13，17…',prompt:'搭一条从“第几项”直接走到数值的规则。先检查已知项，再跳到20与100。'},{type:'x-percentkit',total:80,percent:35,prompt:'80元的35%：先分出10%和5%，再自己选这些小块来拼。'},{type:'x-percentkit',total:140,percent:65,prompt:'整体变成140元，这次要65%。还是同样比例的小块，金额怎样跟着变？'}],
 tenpieces:[{type:'x-unitwalk',n:10,d:10,whole:true,prompt:'把0到1分十等份，一小步一小步接，十步会落在哪里？'},{type:'x-paperlab',mode:'build',d:10,prompt:'把整张纸分十等份，涂一份，给它写出名字。'},{type:'x-wholeshare',wholes:3,people:10,prompt:'3个整体分给10人。每个继续分十份，公平分好，再用除法记录。'}],
 decimalorder2:[axis(['0.45','0.54','0.39'],0,1,'把三个两位小数放到线上，从小到大排。'),compare([['3.72','3.27'],['0.45','0.54']],'对齐同一种单位，从大的位置开始看。在哪里第一次不同？'),axis(['0.42','0.47','0.45'],0,1,'三个数都有四个十分之一；继续看更小的位置来安排它们。')],
 tenthtohundred:[rename(7,10,'把每个十分之一再分十份；给同样多的量留下百分之一的名字。',{targets:[[70,100]]}),{type:'x-hundredcombine',tenths:3,hundredths:4,prompt:'先取三条十分之一，再接四小格百分之一。把不同大小的份换成同一种。'},rename(5,10,'把半张里的5个十分之一切细，看看是多少个百分之一。',{targets:[[50,100]]}),{type:'x-hundredcombine',tenths:2,hundredths:7,prompt:'换成2/10与7/100。每一行和每小格分别在数什么？'}],
 decimalnames:[fdp(62,100,'0.62要占多少小格？自己涂出，再写同一点的分数和小数。'),{type:'x-unitwalk',n:3,d:10,decimal:true,prompt:'把3/10走到线上，同一点怎样用小数记录？'},fdp(7,100,'0.07与0.7相差多少？先涂0.07，再把它的分数名字写准。'),fdp(9,100,'这次给的是9/100，把同一个量写成小数。')],
 decimalmeasure3:[{type:'x-estimatecheck',a:1500,b:375,scale:1000,op:'-',units:[100],prompt:'1.5升倒出0.375升，先借附近的好算数估一估。'},calc([1234,567,2199],'+',1000,'三段分别长1.234米、0.567米、2.199米。同单位对齐，合出总长。'),calc([1500,375],'-',1000,'1.5升里倒出0.375升。保留相同单位，逐列换开再取走。',['1.5','0.375']),{type:'x-complementpair',left:'0.375',prompt:'已有0.375这段，另一段要多长，接起来才刚好是1？统一写三位小数。'},{type:'x-complementpair',prompt:'自己选两段，接起来刚好到1。统一用三位小数记录，末尾补0也可以。'}],
 thousandparts:[zoom(25,'放大0到0.1，再放大里面合适的一小段，把0.025放到准确位置。'),rename(1,10,'一个十分之一继续分细。可以分几次，最后留下100/1000。',{targets:[[100,1000]]}),zoom(345,'在0.34与0.35里面找0.345。两次放大后，一小步占原单位的多少？'),zoom(347,'换成0.347，仍然从原来的0到1进入合适的间隔。')],
 raggeddecimals:[compare([['0.45','0.405'],['0.4','0.87'],['0.9','0.11']],'有时写得长的更大，有时更小。让每种单位对齐后决定。'),axis(['3.142','3.14','3.2'],3,4,'把它们放在3到4之间，别把点后的数字当成独立整数。'),compare([['0.7','0.70'],['0.70','0.700']],'末尾多一个0，整条的量到底有没有变？逐列看一看。')],
 fractionmeasure:[bar(320,4,1,'fen','3.20元是320分，平均分四份取一份；用分记录拿到的量。'),calc([250,75],'-',100,'2.5米绳子剪去0.75米。让相同单位站同一列，再看余下多长。',['2.5','0.75']),bar(1000,10,3,'g','1千克就是1000克，取3/10，用克记录。'),{type:'x-unitwalk',n:3,d:10,decimal:true,prompt:'原来0到1表示0到1千克。走到3/10千克，写出同一点的小数千克。'},fdp(80,100,'刚才80分相对1元的位置在哪里？用小数“元”再说同一笔钱。')],
 fdpswitch:[decimal(3,8,'3/8就是3÷8。先判断会不会分完，再一位一位分，保留每次余下的量。'),{type:'x-fdprecall',prompt:'先不看图，给1/5、1/4、1/10分别写出小数与百分数名字。',cases:[[1,5],[1,4],[1,10]]},order(['30%','1/3','0.35'],'在同一条线上比较三个名字。1/3的位置要保留精确分数，不写成0.3。',{max:1}),decimal(1,3,'把1平均分3份，亲自跟踪余数。重复的不是最后一次四舍五入，而是后续步骤。'),order(['30%','2/5','0.35'],'换一张分数卡，看看原来的排序要怎样改变。',{max:1})],
 decimalstops:[rename(375,1000,'0.375的最后一位在数哪一种小份？先写分数，再合到最简。',{decimalStart:'0.375',targets:[[3,8]],simple:true,decimal:true}),rename(35,100,'把0.35也从位置写成分数，再合到最简。',{decimalStart:'0.35',targets:[[7,20]],simple:true,decimal:true}),decimal(7,40,'先把整个的份数拆成质数，再判断、实际分，看看7/40在哪里停。'),decimal(1,6,'1/6的分母里除了2还有谁？追踪余数，看它怎么开始循环。'),decimal(6,15,'先化简6/15，再看质数因子。没化简前的15会不会误导你？'),decimal(4,15,'同样下面写15，这次是4/15。按原量重新化简、判断、分一遍。')],
 structurechoices:[{type:'x-mulchain',values:[25,4,4],prompt:'16可以分成4×4。自己选先配哪一对，让25×16变好算。'},{type:'x-mulchain',values:[23,4,4],prompt:'把25换成23，相同的结构还能让一对变成100吗？算完对比两次作品。'},bar(80,4,3,'yuan','75%与3/4是同一个量。80元取3/4，先搭图再写自己的计算关系。'),bar(80,8,1,'yuan','12.5%与1/8一样多。同样80元，这次选八等份中的一份。'),{type:'x-straightgap',known:110,prompt:'两块沿一条直线相接。已知110°，不用测量，算出缺角再把它拼好。'},{type:'x-straightgap',known:64,prompt:'换成64°，这次沿用哪一条关系？先计算，再转动补上的角核对。'}],
 mixedrename:[{type:'x-unitwalk',n:11,d:4,whole:true,prompt:'接出11个四分之一，把完整的1圈出来，剩下的仍是四分之一。'},{type:'x-unitwalk',n:17,d:5,whole:true,prompt:'3个整体各换成5小份，再接2小份。用小份重新数这整个量。'},op('6/5','+','4/5','把两段五分之一接起来，看看10/5能合成几个整个。')],
 fractionfour:[op('3/4','+','2/3','同样两个量，先试相加：先估，再摆，不能把不同小份直接相加。'),op('3/4','-','2/3','同样两个量，这次取走第二个：保留相同小份再看剩余。'),op('3/4','*','2/3','这次取一部分中的一部分：列取3/4，行取2/3，看重合的小格。'),op('3/4','/','2/3','这次问能放下多少组2/3：整组之外，余下的占一组多少？'),op('9/4','+','3/2','两个量都超过1，相加时仍用相同的小份。'),op('9/4','-','3/2','这次取走3/2；跨过1后，单位不能改变。'),op('2 1/2','*','1 1/2','整份和零头全部换成小份，再在两个方向取出它们。'),op('2 1/2','/','1/2','2又1/2里能放几个1/2？原来的整份和零头都要参与。'),{...structuredClone(T09.signedwalk[0]),start:-5,operand:3,prompt:'−5加3：先预测，再从原位置画出真实方向。'},{...structuredClone(T09.signedwalk[4]),prompt:'−2减去−5：把要撤销的方向与实际前进方向分开。'},structuredClone(T15.signedproducts[1]),structuredClone(T15.signedproducts[2]),{type:'x-estimatecheck',a:1345,b:278,scale:1000,op:'+',units:[100],prompt:'1.345与0.278相加，先估总量在哪附近。'},calc([1345,278],'+',1000,'点后位数更多，仍让相同单位对齐并实际换捆。'),calc([2000,875],'-',1000,'2减去0.875。逐层换开，留下每列的结果。',['2','0.875']),{type:'x-decimalproduct',decimal:'1.25',multiplier:8,estimate:100,prompt:'1.25的8份，先估再按小单位计算，最后回到原单位。'},{type:'x-decimaldivide',decimal:'3.75',divisor:5,places:2,prompt:'3.75分5份，每次余下的继续换成更小单位。'}],
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,ts])=>[id,structuredClone(ts[0])]));
export const BRIDGES=[];
const link=(from,to,title,a,b)=>BRIDGES.push({from,to,title,summary:'把一个已经用过的办法带到另一种情况，留下两个相连的操作。',tasks:structuredClone([a,b]),phase:5,batch:'B17'});
// Only existing taxonomy edges: route order is never an invented prerequisite.
link('fractionbench','fractionreason','共同小份，让理由看得见',TASKS.fractionbench[0],T16.fractionreason[0]);
link('sharewholes','fdpswitch','公平分享，接到小数除法',T16.sharewholes[0],TASKS.fdpswitch[0]);
link('decpercent','fdpswitch','百分之一，连接第三种名字',fdp(20,100,'先把20个百分之一摆出来。'),TASKS.fdpswitch[2]);
link('decimalorder2','raggeddecimals','同样长的写法，换成长短不同',TASKS.decimalorder2[1],TASKS.raggeddecimals[0]);
link('thousandparts','raggeddecimals','更小的位置，帮助比较大小',TASKS.thousandparts[2],TASKS.raggeddecimals[1]);
link('samenames','simplestparts','同一个量，还能合得更简单',TASKS.samenames[0],TASKS.simplestparts[0]);
link('factorlab','simplestparts','共同的因子，用来合并小份',rename(6,8,'先找能同时合并6份和8份的办法。',{targets:[[3,4]],simple:true,hcf:true}),TASKS.simplestparts[0]);
link('notation','simplestparts','上下的数，说明分法与取法',rename(4,8,'上下都除相同的整数，看看哪一种份变少。',{targets:[[1,2]],simple:true}),TASKS.simplestparts[1]);
link('tenpieces','hundredths','每个十分之一，再分十小份',TASKS.tenpieces[0],TASKS.tenthtohundred[0]);
link('equivalent','samenames','同位置，留下多个分数名字',T16.setfractions[1],TASKS.samenames[0]);
link('recutnames','samenames','一次再分，推广成自己的几次分法',TASKS.recutnames[0],TASKS.samenames[1]);
link('thousandparts','decimalscale','一层放大，对应一层十倍',TASKS.thousandparts[0],TASKS.thousandparts[1]);
link('equivalent','recutnames','叠在同一处，再亲手换分法',T16.setfractions[1],TASKS.recutnames[2]);
link('fdpswitch','structurebridge','同量换写法，用到实际数量',TASKS.fdpswitch[2],TASKS.structurechoices[2]);
link('structurechoices','structurebridge','先找顺手结构，再换一种表示',TASKS.structurechoices[0],TASKS.structurechoices[3]);
link('factorlab','structurechoices','因数配成一对，先凑好算的量',TASKS.structurechoices[0],TASKS.structurechoices[1]);
link('unitorder','samepartcompare','先比一份，再比同样几份',TASKS.unitorder[0],TASKS.samepartcompare[0]);
link('share','samepartcompare','先认小份，再比较份数',T16.halfpaper[1],TASKS.samepartcompare[1]);
link('decimal','decimalorder2','小数的位置，决定排序',TASKS.decimalnames[1],TASKS.decimalorder2[0]);
link('smallershare','unitorder','分得更细，怎样把几种份排好',T16.smallershare[0],TASKS.unitorder[0]);
link('lineplaces','unitorder','分数有位置，位置有顺序',T16.lineplaces[0],TASKS.unitorder[2]);
link('derivepatterns','percentpatterns','先看变化，再直接跳到远处',TASKS.percentpatterns[0],TASKS.percentpatterns[1]);
link('samenames','percentpatterns','等值变换，接成可复用的计算',TASKS.samenames[2],TASKS.percentpatterns[2]);
link('decimalnames','thousandparts','百份里面，继续找更小的份',TASKS.decimalnames[2],TASKS.thousandparts[0]);
link('tenpieces','lineplaces','十小步，落在同一单位线上',TASKS.tenpieces[0],TASKS.decimalnames[1]);
link('hundredths','tenthtohundred','一格与一行，放到同一个整体',fdp(30,100,'先涂30个百分之一。'),TASKS.tenthtohundred[1]);
link('samenames','tenthtohundred','重新细分，才能接相同小份',TASKS.samenames[2],TASKS.tenthtohundred[3]);
link('unitcopies','mixedrename','小份连续走，整份自然出现',T16.unitcopies[2],TASKS.mixedrename[0]);
link('wholefractions','mixedrename','一个整体，也有小份的名字',T16.wholefractions[2],TASKS.mixedrename[1]);
link('notation','mixedrename','份的大小不变，换整份与零头',T16.unitcopies[1],TASKS.mixedrename[2]);
link('simplestparts','beyondoneorder','共同小份，越过1仍然管用',TASKS.simplestparts[1],TASKS.beyondoneorder[1]);
link('fractionbench','beyondoneorder','借一半以后，再借一个整体',TASKS.fractionbench[2],TASKS.beyondoneorder[0]);
link('raggeddecimals','decimalmeasure3','相同单位对齐，再相加减',TASKS.raggeddecimals[0],TASKS.decimalmeasure3[2]);
link('roundtenths','decimalmeasure3','先估一个范围，再精确到小份',TASKS.decimalmeasure3[0],TASKS.decimalmeasure3[1]);
link('fdpswitch','decimalstops','看过循环，再检查它的原因',TASKS.fdpswitch[3],TASKS.decimalstops[3]);
link('decpercent','decimalstops','有限小数，回到最简分数',fdp(35,100,'把35个百分之一与0.35放在同一点。'),TASKS.decimalstops[1]);
link('unitorder','fractionchoices','排好大小，带回走路的故事',TASKS.unitorder[2],TASKS.fractionchoices[1]);
link('unitsets','fractionchoices','先找一份，再自主接出两步',T16.unitsets[1],TASKS.fractionchoices[2]);
link('samenames','fractionbench','几个名字，帮助找共同单位',TASKS.samenames[0],TASKS.fractionbench[0]);
link('samepartcompare','fractionbench','两边都不同，还能怎样比较',TASKS.samepartcompare[1],TASKS.fractionbench[1]);
link('tenthtohundred','decimalnames','小格的名字，写进小数位置',TASKS.tenthtohundred[1],TASKS.decimalnames[0]);
link('nonunitamount','fractionmeasure','取几份，带回钱和重量',T16.nonunitamount[0],TASKS.fractionmeasure[2]);
link('decimal','fractionmeasure','小数位置，帮长度对齐',TASKS.decimalnames[3],TASKS.fractionmeasure[1]);
link('amounts','tenpieces','一堆平均分，换成一整个分',T16.unitsets[0],TASKS.tenpieces[2]);
