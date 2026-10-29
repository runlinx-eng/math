import{TASKS as T14}from'./b14.js';
import{TASKS as T15}from'./b15.js';
const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B16'});
export const LESSONS={
 halfpaper:item('mt_-hTTat0mBR','怎样分，双方才一样多','二分之一与相等的份','把同一个整体平均分成两份，每份是二分之一。只切成两块还不够，两块必须一样大；一堆8颗平均分两组，每组4颗。','两块都有了，为什么还不一定各是一半？'),
 quarterpaper:item('mt_g3W0mdADVu','再分一次，一份变多大','四分之一','对折以后再对折，可以得到四个相等的部分。每个是四分之一，四份合回整个。12颗平均分四组，每组3颗。','把12颗每4颗装一袋，与分成4组，哪里不一样？'),
 shapeparts:item('mt_xACS3rWWDp','一整个，能怎样拼回来','图形的二等分与四等分','圆可以分成两个半圆，长方形可以分成四个等份。两个二分之一、四个四分之一都拼成一个整体。数份数，不数切线。','同一个长方形换个方向分，还能得到四个相等的份吗？'),
 smallershare:item('mt_hyvHv2BCwb','来分的人多了，每份呢','单位分数的大小与整体','同样大的整体，平均分的份数越多，每份越小。四分之一比二分之一小；比较时必须固定整体大小。','大披萨的四分之一，一定比小披萨的二分之一小吗？'),
 areaparts:item('mt_idbKDrf9qZ','样子不同，也能一样多','等面积分割与单位分数','等份要求面积相等，不要求每份长得完全相同。一个整体分成6个等面积部分，每个是1/6；四个等面积部分也可以有不同形状。','怎样用小格检查两块形状不同的部分是否一样多？'),
 setfractions:item('mt_MyGblah2yY','换个名字，拿到的没有变','分数的数量意义与等值','1/2的10是5。相同整体上，两份四分之一正好覆盖一份二分之一；2/4和1/2是同一个量的不同名字。','为什么一个整体换了大小，同样的1/2也可能拿到不同数量？'),
 unitsets:item('mt_k2WE0-22-4','先分组，再取你要的几组','集合的单位与非单位分数','12颗分4组，一组3颗，三组9颗。写选中部分的分数时，整体包括选中和没选中的全部物品。','选中3颗、没选中9颗，整体到底是9颗还是12颗？'),
 nonunitamount:item('mt_3y7xKP9MjU','一份知道了，几份就接起来','求一个量的几分之几','求20的3/5，先20÷5得到一份4，再取3份得到12。分母决定分几份，分子决定取几份。','只算出24÷8，为什么还没有回答24的3/8？'),
 lineplaces:item('mt_Kr3IyA6m-O','让一份在路上有个位置','分数作为数轴上的数','0到1的距离是一个单位。分四段后，1/4、1/2、3/4各占一个确定的位置；四段只有三个内部刻度。分数是一个数。','3/4为什么不在3与4之间？'),
 unitcopies:item('mt_09sySPqM9Z','一小步接一小步，可以越过1','单位分数的累加与假分数','5/8是五个1/8相加。走四个1/3会超过1，到4/3；七个1/4到7/4。增加的是小份个数，份的大小不变。','1/4加1/4，为什么不能把下面的4也相加？'),
 wholefractions:item('mt_AYzE1EAvI0','分数也能刚好是整数','整数与分数的统一表示','5个整体可以写成5/1。4/4与1落在同一点，6/3与8/4都是2，5/2则是2又1/2。分数可以等于或大于1。','分母是1，表示把每个整体怎样分？'),
 mixedpoints:item('mt_PsylzZ9lHW','各种名字，共用一条线','混合数系的位值与顺序','整数、小数与分数都表示数，负数也在同一条线上。数字的实际大小由它所在的位决定；十倍关系可以继续向大、向小延伸。','写法更长的数，一定更大吗？'),
 orderforms:item('mt_uDJY0X0hgo','名字不同，也能排在一起','混合表示的比较与不等号','0.75与3/4在同一点；负数越靠左越小。<与>不含相等，≤与≥允许相等，≠表示不相等。','−0.8与−3/4，哪个更靠左？为什么？'),
 manycopies:item('mt_HJA2Oz-Zh1','每人一小份，合起来要多少','分数乘整数与情境解释','5人各吃3/8，共吃15/8，也就是1又7/8个披萨；按整个买至少2个。4段各2/3米共8/3米。乘的是份数，单位份不变。','“吃了多少”和“至少买几个”，为什么不是同一个答案？'),
 sharewholes:item('mt_4Km38F4L-6','几个完整的，也可以分给更多人','分数与除法','3个整体平均分4人，每人拿到3个1/4，所以3÷4=3/4。50平均分9份，每份5又5/9；乘回9应回到50。','不够每人一个完整的，为什么并不代表不能分？'),
 modelrecipe:item('mt_K3R0yaHVcx','把厨房与铺地装进图里','乘法、分数与单位的建模','行列表示铺了多少格；500克的3/4是375克。1米与100厘米是同样长的量，换单位要保留长度，结果要带单位。','同一根绳从米换成厘米，变的是长度还是记录它的数字？'),
 translateamount:item('mt_3VmBdlAeOZ','一件事，用几种图来讲','图形、算式与数轴的互译','分享可以同时画成几份和写成除法；4×23可以拆成4×20与4×3，在条形、面积和按位计算中分别是80与12。0.3与3/10在同一点。','换了一张图，怎样认出原来的80和12还在？'),
 viewlinks:item('mt_CUmjcE7W6c','图换了，数量关系还在','缩放、百分数与图表的互译','三份相同量用条形和乘法都能表达。35个百分之一是35/100、0.35、35%。读两次图上的量，求差要写成减法。','35%为什么不是35个整体？'),
 precisefractions:item('mt_HY8Yycu_rz','写给别人看，要说清哪一种量','单位、分数术语与数学记号','35厘米与35米不同。分子数取了几份，分母说明一个整体分几份；等值分数表示同一个量。3.5元与3.50元数值相等，统一金额格式时常保留两位小数。','只有一个35，别人能知道你量的是什么吗？'),
 fractionreason:item('mt_2ESZh70NyS','让别人看见，你为什么这样想','共同单位、错误分析与推理链','3/4与2/3换成共同的十二分之一，分别是9份与8份。乘几十的那一行要放在十位；三角形的三个角可搬到一点拼成平角。有限图例是理解与说明的起点，不等于一般证明。','找出错误答案，与指出哪一步破坏了关系，差在哪里？'),
 representationmap:item('mt_9KmVWCuh5_','一个关系，穿过几种图','代数、坐标与比例表示','4份相同未知量再加27等于87，可画条形也可写4n+27=87。坐标的两项有各自的含义；圆图、分数与百分数可以表示同一个比例。','把横轴和纵轴交换，还在讲同一件事吗？'),
 storyfraction:item('mt_dXq9VWm31W','让每个数，都找得到它说的东西','数量关系的图式与方程','每个数都要连着故事中的量。长320厘米用去125厘米，可以写320−125=195；分数条表示整个与部分；数轴上的位置要沿同一个单位读。','数轴画到4，为什么3/4仍然在0与1之间？'),
};
export const SECTIONS=[{id:'portion-work',title:'分出一样多的份'},{id:'portion-number',title:'把一份接成一个数'},{id:'portion-connect',title:'换个样子，说同一个量'}];
const route=(id,title,section,ids)=>({id,title,section,ids,packIds:['same-amount'],themeId:'numbers',color:'#b58e51'});
export const ROUTES=[route('CF','从一半到四份','portion-work',['halfpaper','quarterpaper','shapeparts']),route('CG','份数、形状与大小','portion-work',['smallershare','areaparts']),route('CH','一堆东西，取其中几份','portion-work',['setfractions','unitsets','nonunitamount']),route('CI','沿着一份走过去','portion-number',['lineplaces','unitcopies','wholefractions']),route('CJ','不同写法，共用一条线','portion-number',['mixedpoints','orderforms']),route('CK','小份累起来，整个分下去','portion-number',['manycopies','sharewholes']),route('CL','换一种图，认出同一件事','portion-connect',['modelrecipe','translateamount','viewlinks']),route('CM','说清楚，再讲理由','portion-connect',['precisefractions','fractionreason']),route('CN','故事、图与关系','portion-connect',['representationmap','storyfraction'])];
const paper=(mode,d,prompt,extra={})=>({type:'x-paperlab',mode,d,prompt,...extra});
const group=(total,d,n,prompt,extra={})=>({type:'x-portiongroups',total,d,n,prompt,...extra});
const bar=(total,d,n,unit,prompt)=>({type:'x-portionbar',total,d,n,unit,prompt,equations:[`${total}/${d}*${n}=${total/d*n}`,`${n}/${d}*${total}=${total/d*n}`,`${total}*(${n}/${d})=${total/d*n}`]});
const walk=(n,d,prompt,extra={})=>({type:'x-unitwalk',n,d,prompt,...extra});
const compare=(left,right,prompt,common=false)=>({type:'x-samefraction',left,right,prompt,common});
const share=(wholes,people,prompt)=>({type:'x-wholeshare',wholes,people,prompt});
const fdp=(n,d,prompt,views=[])=>({type:'x-fdpboard',n,d,prompt,views});
const axis=(cards,prompt,statements=[])=>({type:'x-mixedaxis',cards,min:-3,max:3,prompt,statements});
const graph=(data,prompt,extra={})=>({type:'x-graphpoints',data,maxX:4,maxY:8,xLabel:'第几次',yLabel:'长度（厘米）',prompt,...extra});
export const TASKS={
 halfpaper:[group(8,2,1,'把8颗分给两组，让双方一样多。再取其中一组。'),paper('fold',2,'把一张纸对折，摊开后涂一份。它是整个的多少？'),paper('classify',2,'每一张都切成了几块，哪些真的一样多？',{cases:[[1,1],[1,3],[2,2],[1,1,2]]})],
 quarterpaper:[paper('fold',4,'先对折，再让每一半继续对折。摊开后涂出一小份。'),group(12,4,1,'12颗分进四组，每组一样多；取一组，看拿到几颗。'),paper('classify',4,'这些分法里，哪一张真的是四个相等的份？',{cases:[[1,1,1,1],[1,1,1,3],[2,2],[2,2,2,2]]})],
 shapeparts:[paper('build',2,'从圆心出发，把圆分成两个相等的部分，涂一份。',{shape:'circle'}),paper('build',4,'把长方形分成四个等份，可以自己选行和列。涂一份。'),paper('build',2,'把两份都涂上。整个圆怎样用这两份来表示？',{shape:'circle',take:2}),paper('build',4,'把四份都涂上。整个长方形怎样用这四份来表示？',{take:4})],
 smallershare:[compare([1,2],[1,4],'同一块披萨，分两份与分四份，拿一份会怎样？先猜，再叠起来看。'),compare([1,4],[1,2],'换成纸带，先猜上边的一小份与下边相比，再亲手涂出并叠齐。'),compare([1,4],[1,8],'同样长的纸带，分的人又多了。每人一份还一样多吗？')],
 areaparts:[paper('build',6,'把长方形分成六个等面积部分，再取一份并写下它的名字。'),paper('paint',4,'用四种颜色分这16格，每色一样多。留下两种不同分界，形状可以不同。'),paper('classify',6,'看分好的图，先检查每份是不是一样多。相等时，给其中一份写个名字。',{writeName:true,cases:[[2,2,2,2,2,2],[1,1,1,1,1,7],[1,1,1,1,1,1]]})],
 setfractions:[group(10,2,1,'把10颗平均分两组，取一组，再把关系写下来。',{equation:['10/2=5','1/2*10=5']}),compare([1,2],[2,4],'两份四分之一与一份二分之一，究竟是不是一样多？先预测再覆盖。'),group(15,3,1,'换成15颗，取三等份中的一份。一样多的一组有多少？',{equation:['15/3=5','1/3*15=5']})],
 unitsets:[group(12,4,1,'12颗分四等份，取其中一份。'),group(12,4,3,'还是12颗分四等份，这次取三份。'),group(12,4,1,'把12颗分好，取一组。选中的颗数相对于全部12颗，怎样写成分数？',{name:true}),group(20,4,3,'整体换成20颗，四等份取三份。与12颗时拿到的一样多吗？')],
 nonunitamount:[group(20,5,3,'20颗平均分五份，取三份，找出选中部分的数量。'),group(18,3,2,'18颗分三份取两份。写出先找一份、再找两份的过程。',{equation:['18/3*2=12','2/3*18=12']}),group(24,8,3,'24颗糖，三份八分之一是红色。把红色部分取出来。')],
 lineplaces:[walk(1,4,'把0到1分成四个相等间隔，从零走到四分之一。'),walk(1,2,'还是同一单位长度，把一半放到它的位置。'),walk(3,4,'这次从零走三份四分之一。每一步的大小要保持一致。'),walk(1,3,'把三分之一放好，再看它是不是在0和一半之间。',{bounds:true,halfBound:true})],
 unitcopies:[walk(5,8,'每次走一份八分之一，接出五份。把这些小份用加号记下来。',{copies:true}),walk(4,3,'每一步三分之一，走四步。越过1以后，单位份有没有变？',{copies:true,whole:true}),walk(7,4,'接七份四分之一，用图和相同小份的加法说同一件事。',{copies:true,whole:true})],
 wholefractions:[walk(5,1,'每个整体不再切开，一步走一个，走出5。用下面是1的分数给它命名。'),walk(4,4,'四份四分之一，终点与哪个整数重合？',{whole:true}),walk(6,3,'六份三分之一，看看是不是刚好落在一个整数上。',{whole:true}),walk(8,4,'八份四分之一，与刚才六份三分之一落到哪里？',{whole:true}),walk(5,2,'五份二分之一，这次是刚好一个整数，还是还有多出的部分？',{whole:true})],
 mixedpoints:[{type:'x-digitlens',prompt:'每张卡只读高亮数字本身代表的量，往大处和小处都看一看。',cases:[{raw:'7,450,000,000',at:0,n:7000000000},{raw:'0.0000064',at:7,n:6,d:1000000},{raw:'305.0708',at:4,n:0},{raw:'305.0708',at:7,n:8,d:10000}]},axis(['-2','-3/4','0.6','1.25'],'把整数、小数、分数放到同一条线上，再按位置排起来。'),axis(['0.07','0.7','3/4','0.75'],'小数位多一定更大吗？写法不同也可以落在同一点。')],
 orderforms:[axis(['-2','-0.8','-3/4','1/2','0.75','3/4'],'把这些数放到同一条线上；相等的可以落在同一点，再从小到大排。'),axis(['-1','0','1'],'把三张卡摆好，再把六种不同说法与符号配准。',[{a:'-1',b:'0',symbol:'<',word:'严格小于'},{a:'1',b:'0',symbol:'>',word:'严格大于'},{a:'0.75',b:'3/4',symbol:'=',word:'等于'},{a:'1/2',b:'3/4',symbol:'≠',word:'不等于'},{a:'3/4',b:'0.75',symbol:'≤',word:'小于或等于'},{a:'1',b:'1',symbol:'≥',word:'大于或等于'}]),axis(['0.7','3/4','0.75'],'把0.7、3/4、0.75摆到各自位置，比较名字与大小。')],
 manycopies:[walk(15,8,'5人，每人吃3小份八分之一。连续接出每人吃的份，最后分清吃了多少与至少买几个。',{whole:true,buy:true,chunk:3}),walk(8,3,'每段绳2/3米，一共4段。用同样的小份接出总长度。',{whole:true,chunk:2}),walk(18,4,'6份，每份3/4。先接出全部小份，找它左右相邻的两个整数。',{bounds:true,whole:true,chunk:3})],
 sharewholes:[share(3,4,'3个面包平均分4人，不够每人一整个，继续切小来公平分。'),share(50,9,'50千克粮食平均分9人。先分完整的千克，再分余下的，写成整份加零头。'),share(4,3,'换成4个面包分3人。和3个分4人相比，顺序能随便交换吗？')],
 modelrecipe:[{type:'x-areaproduct',a:6,b:4,prompt:'6米乘4米的地面，每格一平方米。分成两块计算，再合起来看总面积。'},bar(500,4,3,'g','一份食谱用500克面粉，只做它的3/4。先画出分与取，再把结果带回克。'),bar(100,4,3,'cm','整条1米，也就是100厘米。取它的3/4，用厘米记录长度。')],
 translateamount:[share(3,4,'把3个整体分给4人，图上的每人一份怎样写成除法与分数？'),{type:'x-areaproduct',a:23,b:4,prompt:'4条各23，把每条的20与3分开。面积里的两块怎样对应80与12？'},{...structuredClone(T14.shortproduct[0]),a:23,b:4,estimate:20,prompt:'同一个4×23，用按位计算再做一次。这里的进位与刚才的80、12怎样相接？'},walk(3,10,'把0.3所在的量走出来，给同一点写出分数与小数两个名字。',{decimal:true})],
 viewlinks:[{...structuredClone(T15.timesmeaning[1]),part:4,factor:3,equations:['4*3=n','3*4=n'],prompt:'4人份食谱扩大到3份。搭出条形，再用n记需要准备的人份。'},fdp(35,100,'涂出35个百分之一。看方格、圆图和位置怎样指向同一个量。',['pie','line']),fdp(8,100,'换成8个百分之一，自己写出三个名字。'),graph([[1,2],[2,5],[3,4],[4,7]],'把记录放进图中，选第2次和第4次，写出两次相差多少。',{line:true,read:[1,3]})],
 precisefractions:[{type:'x-fractiontalk',prompt:'同样一个数，少了单位可能是另一件事。把这几条记录写清楚。',cases:[{kind:'unit',label:'这根绳长35厘米，只写“35”还缺什么？',n:35,unit:'cm'},{kind:'unit',label:'食谱要250克面粉，完整记录这个量。',n:250,unit:'g'}]},compare([1,2],[2,4],'先把两种写法叠齐，下一步再给这些位置和关系叫名字。'),{type:'x-fractiontalk',prompt:'刚才用过的几个说法，最后给它们正式的名字。',cases:[{kind:'vocab',label:'3/4中，上面的3、下面的4分别叫什么？1/2与2/4的关系呢？'},{kind:'money',label:'3.5元与3.50元一样多。这次用“元＋两位小数”的统一金额格式记350分。',n:350,unit:'yuan'},{kind:'symbol',label:'3/4比1/2大，选相符的符号。',a:'3/4',b:'1/2',symbol:'>'}]}],
 fractionreason:[compare([3,4],[2,3],'同样大的整体取3/4与2/3，继续分出共同的小份，把大小理由写出来。',true),{type:'x-rowrepair',a:23,b:14,wrongShift:0,prompt:'23×14的第二行被放错了。移动这一行，找出错的是哪一个单位，再合起来。'},{type:'x-anglejoin',angles:[45,90,45],prompt:'点原图的三个角，分别搬到右边同一点，转动后摆成无缝的半圈。最后把理由排成一条。'},{type:'x-anglejoin',angles:[30,60,90],prompt:'换一种三角形再试。三个角形状变了，拼到同一点以后怎样相接？'}],
 representationmap:[{type:'x-algebrabar',count:4,fixed:27,total:87,prompt:'同一个未知数取4份，再添27，一共87。先搭好，再让两边一起变化，找一份。'},graph([[0,0],[1,2],[2,4],[3,6],[4,8]],'每袋2颗。把袋数与总颗数同时放进图里，说清每个点表示什么。',{xLabel:'袋数',yLabel:'总颗数',rate:2}),fdp(3,4,'在圆图取四等份中的三份，再给同一个比例写出分数、小数与百分数。',['line'])],
 storyfraction:[{type:'x-orderlab',expression:'',construct:true,expected:'320-125',writeOnly:false,prompt:'一条320厘米的绳用掉125厘米。写出找剩余长度的关系，再实际算出来。'},bar(120,4,3,'cm','120厘米的带子取3/4，用条形把整个与要取的部分说清楚。'),walk(3,4,'步道每一整段长1千米。走3/4千米，在图上表示这段路，写出走了几个完整段与零头。',{whole:true,axisMax:4})],
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,ts])=>[id,structuredClone(ts[0])]));
export const BRIDGES=[];
const link=(from,to,title,a,b)=>BRIDGES.push({from,to,title,summary:'把前面的办法带到新问题，亲自完成这两个相连的操作。',tasks:structuredClone([a,b]),phase:5,batch:'B16'});
// Only verified upstream edges are added here; navigation never creates dependencies.
link('share','unitcopies','小份的名字，接成连续的路',TASKS.lineplaces[0],TASKS.unitcopies[2]);
link('storyfraction','translateamount','故事中的量，换到另一张图',TASKS.storyfraction[1],TASKS.translateamount[0]);
link('decimal','translateamount','小数的位置，换成同一份的名字',fdp(30,100,'把0.30表示的量涂出来，再给它分数名字。'),TASKS.translateamount[3]);
link('unitsets','nonunitamount','取一组，再取几组',TASKS.unitsets[0],TASKS.nonunitamount[2]);
link('longdivide','sharewholes','整数余下的，继续平均分',structuredClone(T14.longdivide[0]),TASKS.sharewholes[1]);
link('viewlinks','representationmap','同一比例，从百格走到圆图',TASKS.viewlinks[1],TASKS.representationmap[2]);
link('share','wholefractions','几份拼回一个整体',TASKS.shapeparts[3],TASKS.wholefractions[1]);
link('quarterpaper','amounts','纸上的四分之一，用到一堆物品',TASKS.quarterpaper[0],TASKS.quarterpaper[1]);
link('halfpaper','amounts','纸上的一半，用到一个数量',TASKS.halfpaper[1],TASKS.setfractions[0]);
link('translateamount','viewlinks','同一个量，从两种写法到三种',TASKS.translateamount[3],TASKS.viewlinks[1]);
link('longproduct','viewlinks','相同的份，既能按位算也能画出来',TASKS.translateamount[2],TASKS.viewlinks[0]);
link('linejumps','storyfraction','从整数的路，走到单位里的一小段',walk(3,1,'沿着每段一个单位的路走三步，写出位置。'),TASKS.storyfraction[2]);
link('represent','storyfraction','先认出整体与部分，再让图讲清数量',TASKS.modelrecipe[2],TASKS.storyfraction[1]);
link('lineplaces','storyfraction','不论线画多长，0到1还是一单位',TASKS.lineplaces[2],TASKS.storyfraction[2]);
link('lineplaces','visualeq','同一点，换一种分法仍能找到',TASKS.lineplaces[1],TASKS.setfractions[1]);
link('setfractions','visualeq','物品里一样多，纸上也能叠齐',TASKS.setfractions[0],TASKS.setfractions[1]);
link('halfpaper','quarterpaper','每一半，再分成两半',TASKS.halfpaper[1],TASKS.quarterpaper[0]);
link('smallershare','folds','分的人更多，每份还会缩小',TASKS.smallershare[0],TASKS.smallershare[2]);
link('shapeparts','folds','从四份继续对折到八份',TASKS.shapeparts[1],paper('fold',8,'把纸连续对折三次，再取出八份中的一份。'));
link('sharegroups','halfpaper','两组公平，才能叫一半',TASKS.halfpaper[0],TASKS.halfpaper[1]);
link('shapeparts','smallershare','相同的整体，换成更多的小份',TASKS.shapeparts[1],TASKS.smallershare[0]);
link('orderforms','allowedrange','排好位置，再分清能否相等',TASKS.orderforms[2],TASKS.orderforms[1]);
link('share','areaparts','一份的名字，要靠真正的等面积',TASKS.quarterpaper[0],TASKS.areaparts[1]);
link('equalparts','areaparts','形状不同，也可以占同样面积',TASKS.areaparts[1],TASKS.areaparts[0]);
link('amounts','unitsets','找一份，再取其中三份',TASKS.unitsets[0],TASKS.unitsets[1]);
link('folds','unitsets','纸分成四份，一堆物品也分四份',TASKS.quarterpaper[0],TASKS.unitsets[0]);
link('sharegroups','unitsets','公平分好，才知道取了几分之几',TASKS.halfpaper[0],TASKS.unitsets[2]);
link('rectangle','modelrecipe','长方形的行列，用到真实数量',TASKS.modelrecipe[0],TASKS.modelrecipe[1]);
link('amounts','lineplaces','从一堆的三分之一，到长度的三分之一',TASKS.setfractions[2],TASKS.lineplaces[3]);
link('signsfirst','setfractions','把“取一半”写成相等的两边',TASKS.setfractions[0],TASKS.setfractions[1]);
link('amounts','setfractions','换了整体，仍然先找一份',TASKS.halfpaper[0],TASKS.setfractions[0]);
link('notation','setfractions','一个分数名字，要对应一个实际的量',TASKS.unitsets[2],TASKS.setfractions[1]);
link('lineplaces','fractionline','刻度换成几段，每一步就有多长',TASKS.lineplaces[0],TASKS.lineplaces[3]);
link('millionwords','mixedpoints','大位置与小位置，沿用同一个十倍关系',{type:'x-digitlens',prompt:'先读百万以内几个位置上的数字。',cases:[{raw:'450,000',at:0,n:400000},{raw:'1,200,000',at:0,n:1000000}]},TASKS.mixedpoints[0]);
link('signedwalk','orderforms','先分清负数的位置，再把分数也放进来',axis(['-2','-1','0','1'],'把正数与负数放到同一条线上。'),TASKS.orderforms[0]);
link('mixedpoints','orderforms','共同的位置，决定比较的符号',TASKS.mixedpoints[1],TASKS.orderforms[1]);
link('quarterpaper','shapeparts','一份四分之一，四份拼回整张',TASKS.quarterpaper[0],TASKS.shapeparts[3]);
link('halfpaper','shapeparts','纸带的一半，换到圆里仍是相等两份',TASKS.halfpaper[1],TASKS.shapeparts[0]);
link('smallershare','equalparts','每份多大，要看分法和占的量',TASKS.smallershare[0],TASKS.areaparts[1]);
link('shapeparts','equalparts','相同份数，还能换一种分界',TASKS.shapeparts[1],TASKS.areaparts[1]);
