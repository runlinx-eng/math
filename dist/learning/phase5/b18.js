import{TASKS as T17}from'./b17.js';
import{TASKS as T16}from'./b16.js';
const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B18'});
export const LESSONS={
 joinfractions:item('mt_a1FdAsRKOF','同样的小份，可以接起来','同分母分数加减','2/5与2/5共有4个五分之一；6/8拿走3/8还剩3/8。加减的是份数，小份的大小没有改变。','为什么2/5加2/5不是4/10？'),
 fractioncarry:item('mt_CBHwluE6Lp','接过一个整个以后','同分母加减与超过1的和','3/5+4/5是7个五分之一，其中5个合成1，余下2个，所以是1又2/5。超过1以后，小份的单位仍然不变。','十个八分之一，为什么不是十个整体？'),
 mixedexchange:item('mt_70qDTI14td','整份可以换开，小份可以合拢','带分数加减与退位','小份不够减，可以把一个整份换成同样大小的小份。4又2/6变成3又8/6，量没有变。也可以先全部换成假分数再算。','把整份换开后，为什么不能让整份的个数留在原处？'),
 relatedparts:item('mt_-V7EnqU7gG','把一大份切成同样小的份','分母有倍数关系的分数加减','1/3切成2个1/6，再接1/6就是3/6，也就是1/2。两种份先变成同一单位，才能合在一起数。','1/3换成六分之一时，上面的1为什么也要变？'),
 fractionstories:item('mt_ZLqYE7la4Z','接绳子、倒果汁，用同一种份','分数加减的情境建模','先看是在合起来还是拿走，再把情境中的量画成同单位的份。图中的长度、容量或数量不能混作同一单位。','同样出现两个分数，为什么不一定都做加法？'),
 splitfraction:item('mt_VgOePicFYK','这段量，还能分成哪几组','分数的加法分解','3/8可以分成三个1/8，也可以分成1/8与2/8。拆成哪几组可以变，总量不变；1+1+1/8仍是2又1/8。','只是交换两组的先后，算不算一种新的拆法？'),
 unlikeparts:item('mt_14T5yPXUq_','两种份都切细，再来算','异分母分数加减','2/3与5/4都切成十二分之一，得到8/12+15/12=23/12。共同单位不一定只有一种，但每个原量都必须保持不变。','分成24份也能算，为什么不能只把下面的数改成24？'),
 repeatfraction:item('mt_TgHxujL81r','每次这么多，连续拿几次','分数与整数相乘','4次3/8就是把3/8连续接4次，得到12/8=1又1/2。2又1/3拿3次，整份和零头都要一起参与，得到7。','每次拿3/8与每次拿1/8，走4次会有什么不同？'),
 fractionarea:item('mt_gx6KQK5-Kx','横着取一部分，竖着再取一部分','分数边长与面积','把单位正方形横分3份、竖分4份，每小格面积是1/12。选2列、3行重合6小格，面积是6/12=1/2。小格可以是等面积长方形。','边长1/3与1/4围成的小格，为什么面积不是1/7？'),
 productfractions:item('mt_AabJisinfi','一部分里面，再取一部分','分数乘分数','2/3的4/5在面积图中重合8小格，每小格是1/15，得到8/15。两个正的真分数相乘，结果比它们各自都小；乘大于1的数则不同。','“相乘一定变大”在哪种情况下不成立？'),
 fractionrecipe:item('mt_lvaSGHwvQ5','做半份、做一份半，材料跟着变','分数乘法情境与估计','一份配方用2又1/3杯，做1又1/2份需要3又1/2杯。先估大概，再用图把整份和零头全部表示出来，回看结果是否合理。','做一份半与加半杯，为什么不是同一个动作？'),
 portionoperator:item('mt_J339bO7qLe','取几成，先认清这次的整个','分数与百分数作为乘法算子','取200的3/4可以先分4份再取3份。20%=0.2，取60的20%得到12。连续变化时，下一步的整个可能已变，折扣量和折后量要分清。','先减20%再加10%，后一个10%是以哪个量为整个？'),
 dividebyten:item('mt_kDMKJ5Ztt6','每个数字都往小的单位走','整数除以10、100与小数位值','37÷10=3.7，3在个位，7在十分位。4÷100=0.04，4在百分位。小数点固定，数字每右移一位，其值变为原来的十分之一。','37除以10，为什么不能只删掉最后的7？'),
 countsmallgroups:item('mt_1PAWhRhpdg','大段里面，装得下几小份','整数除以单位分数','4里面有20个1/5，所以4÷(1/5)=20。20×1/5又回到4。这里在数小组，不是在把4平均分给五个人。','每组越小，同样的总量能装的组数会怎样？'),
 sharesmallpart:item('mt_ifPDOYvUqm','已经很小的一份，再平均分','单位分数除以整数','把1/3再平均分给4人，每人是原整个的1/12。四个人的1/12合回1/3。结果的分母仍以最初的整个为参照。','每人拿到这小份的1/4，为什么又说是整个的1/12？'),
 fractiondividewords:item('mt_rCMdwG-YOE','分给几个人，还是装成几杯','分数除法的两种情境','半千克分给3人，每人1/6千克；2杯按每份1/3杯分装，可以装6份。前者已知人数求每份，后者已知每份求份数。','“每份多少”与“能分几份”分别在问哪一个量？'),
 fractionsanity:item('mt_e7filQgayF','先看大概，发现不可能的答案','分数加法估计与合理性检查','2/5加1/3是11/15，介于1/2与1之间。2/5加1/2一定超过1/2，而3/7小于1/2，所以3/7不可能是它们的和。估计能排除错误，精确结果仍需计算。','估计落在合理范围，能保证最后一个数字完全正确吗？'),
 fractionquotient:item('mt_9Y96vxG_LH','把每组变成1，组数会变吗','分数除法与倒数','2/3里面能装5/6组4/5。两边一起乘5/4，每组变成1，总量变成5/6，组数没变。这说明除以4/5等于乘它的倒数5/4。','为什么两边要一起改变，只把第一个分数倒过来不行？'),
};
export const SECTIONS=[{id:'fraction-join',title:'接起来，或拿走'},{id:'fraction-take',title:'取几份，取几倍'},{id:'fraction-divide',title:'分给谁，装几份'}];
const route=(id,title,section,ids)=>({id,title,section,ids,packIds:['fraction-operations'],themeId:'numbers',color:'#b58e51'});
export const ROUTES=[route('CX','小份接起来，跨过一个整个','fraction-join',['joinfractions','fractioncarry','splitfraction']),route('CY','整份换开，两种份切细','fraction-join',['mixedexchange','relatedparts','unlikeparts']),route('CZ','带回故事，先看看合不合理','fraction-join',['fractionstories','fractionsanity']),route('DA','连续拿，或在里面再取','fraction-take',['repeatfraction','fractionarea','productfractions']),route('DB','配方、几成与连续变化','fraction-take',['fractionrecipe','portionoperator']),route('DC','数字变小，份数可能变多','fraction-divide',['dividebyten','countsmallgroups','sharesmallpart']),route('DD','分法不同，问的也不同','fraction-divide',['fractiondividewords','fractionquotient'])];
const op=(a,o,b,prompt,opts={})=>({type:'x-fractioncase',a,op:o,b,prompt,scene:`${a}　与　${b}`, ...opts});
const mixed=(a,o,b,d,prompt,opts={})=>({type:'x-mixedtrade',a,op:o,b,d,prompt,...opts});
const share=(n,d,people,prompt,opts={})=>({type:'x-fracshare',n,d,people,prompt,...opts});
const walk=(n,d,chunk,prompt)=>({type:'x-unitwalk',n,d,chunk,whole:true,prompt});
const scale=(start,stages,prompt,unit='颗')=>({type:'x-scalechain',start:String(start),stages,prompt,unit});
export const TASKS={
 joinfractions:[op('2/5','+','2/5','同样大小的面包，取出两份2/5。先猜，再接起来。'),op('6/8','-','3/8','原来有6/8，取走3/8。拿走的是几小份？'),op('3/7','+','2/7','换成七分之一。合起来时，每份的大小会不会变？'),op('5/6','-','1/6','换一种份，再做一次拿走；保留同一个整体。')],
 fractioncarry:[op('3/5','+','4/5','合出的量超过1，把完整的1与零头分别记下。',{mixed:true}),op('5/6','-','2/6','五个六分之一拿走两个，剩下的还能怎样合并？',{simple:true}),op('7/8','+','3/8','接过1以后继续数小份；写出整份与剩下的部分。',{mixed:true,simple:true})],
 mixedexchange:[mixed([2,3],'+',[1,4],5,'两段整份和零头合起来。小份够一个整体时，把它们合拢。',{trade:true}),mixed([5,3],'-',[3,1],4,'从5又3/4拿走3又1/4，整份和零头分别保留多少？'),mixed([4,2],'-',[1,5],6,'小份不够拿走时，试着换开一个整体；也可以先全部换成小份。',{trade:true}),op('2 3/5','+','1 4/5','同样的加法，换一种办法：整份和零头全部写成小份，再相加。',{mixed:true})],
 relatedparts:[op('1/3','+','1/6','三分之一要切成几个六分之一？量保持不变后再接。',{simple:true}),op('3/4','-','1/8','把四分之一切细，再拿走一个八分之一。'),op('2/5','+','3/10','两种份先变成一样大小，再接成一段。',{simple:true}),op('1/2','+','3/8','换成一半与八分之一，自己选择共同的小份。',{simple:true})],
 fractionstories:[op('3/4','-','2/4','壶里有3/4升，倒出2/4升。先选动作，再摆出原来、拿走与剩下的量。',{scene:'3/4升果汁，倒出2/4升'}),op('2 3/8','+','1 5/8','两段绳长2又3/8厘米、1又5/8厘米，接起来多长？',{scene:'两段绳子接成一条',mixed:true}),op('5/6','-','1/3','自己在图上表示：5/6米绳子剪去1/3米。这里画出的是长度。',{scene:'5/6米绳子，剪去1/3米',simple:true})],
 splitfraction:[{type:'x-fracdecompose',n:3,d:8,required:[[1,1,1],[1,2]],prompt:'在小份之间分组，留下“三组各一份”和“一组一份、一组两份”两种拆法。'},{type:'x-fracdecompose',n:5,d:6,count:2,prompt:'同样5/6，自己留下两种不同的分组。每组都要写进等式。'},{type:'x-fracdecompose',n:17,d:8,required:[[8,8,1]],prompt:'17个八分之一，分成两个完整的1与一个小份。用等式留下整份和零头。'}],
 unlikeparts:[op('2/3','+','5/4','两种份都要切细。先估范围，再找共同的小份算出准确的和。',{simple:true,estimate:[1,2]}),op('3 1/4','-','1 3/5','整份、零头和不同大小的小份一起出现；都换成共同的小份再拿走。',{mixed:true}),op('5/6','-','1/4','换一组数，用自己的共同单位来表示两边，再取走。',{simple:true})],
 repeatfraction:[walk(12,8,3,'每次接3/8，接4次。跨过1后，小份的大小保持不变。'),walk(21,3,7,'每次拿2又1/3，也就是7/3。连续接3次，整份和零头都参与。'),walk(5,4,1,'5次1/4怎样接成5/4？把完整的1与零头分别留下。')],
 fractionarea:[op('2/3','*','3/4','在同一个单位正方形里，横取2/3，竖取3/4。数两种选择重合的小格。',{tile:true,simple:true}),op('1 1/2','*','2/3','横向超过1，单位正方形的大小不变；求这块长方形的面积。',{tile:true}),op('1/2','*','4/5','换一组边长，亲手选择列与行；每小格相对单位面积是多少？',{tile:true,simple:true})],
 productfractions:[op('2/3','*','4/5','取2/3中的4/5，用两个方向的选择找到重合部分。',{tile:true}),op('2/3','*','4','这次拿4倍，不会越拿越小。跨过1后继续沿同一单位铺。',{mixed:true}),op('3/4','*','2/3','乘出的6/12还可以怎样合并？图中的面积不变。',{simple:true,tile:true})],
 fractionrecipe:[op('2 1/3','*','1 1/2','一份配方用2又1/3杯，做1又1/2份。先估需要的杯数，再用图核对。',{scene:'做一份半，材料跟着配方一起放大',estimate:[3,4],mixed:true}),op('3/4','*','1 1/2','另一份配方每份用3/4杯。做一份半，自己构造材料量。',{scene:'每份3/4杯，要做一份半',estimate:[1,2],simple:true}),op('2/3','*','3/4','给“2/3的3/4”写一个自己的用量故事，再构造它。',{story:true,exampleStory:'一条绳长2/3米，取这条绳的3/4，用来绑盒子。',simple:true})],
 portionoperator:[scale(200,[{ratio:'3/4',mode:'take',label:'取200颗的3/4'}],'先平均分成几份，再取其中几份；一小份与总共取出的量分别是多少？'),scale(60,[{ratio:'1/5',mode:'take',percent:20,decimal:true,label:'取60颗的20%'}],'20%表示每100份取20份，也可以按五等份来取。把它写成小数倍数，再算。'),scale(45,[{ratio:'1/5',mode:'off',percent:20,decimal:true,label:'先减去原价的20%'},{ratio:'1/10',mode:'add',percent:10,decimal:true,label:'按折后金额，增加10%模拟税额'},{ratio:'1/2',mode:'take',label:'再取最终金额的一半'}],'虚构结算练习：45元先打八折，按折后价另加10%模拟税额，最后两人各付一半。每一步的整个是什么？','元'),scale(200,[{ratio:'3/2',mode:'take',percent:150,decimal:true,label:'取200颗的150%'}],'百分数也可以超过100%。要拿一份半时，整体的大小不能悄悄改变。')],
 dividebyten:[{type:'x-wideshift',mode:'scale',start:'37',step:-1,prompt:'37除以10。小数点不动，让所有数字往小的单位移一格。'},{type:'x-wideboard',mode:'build',values:['3.7'],expanded:true,prompt:'把3.7放进位值表。3与7各表示多少？'},{type:'x-wideshift',mode:'scale',start:'4',step:-2,prompt:'4除以100，连续往小单位移两格；不是把4变成0。'},{type:'x-wideboard',mode:'build',values:['0.04'],expanded:true,prompt:'4现在处在百分位。把空位也保留下来，给每位写出它的量。'},{type:'x-wideshift',mode:'scale',start:'5.2',step:-1,prompt:'起点换成5.2，再除以10。右移一格的关系还成立吗？'}],
 countsmallgroups:[op('4','/','1/5','4个整体，每一份只装1/5。逐份装好，再用乘法检查总量。',{scene:'4升果汁，每杯装1/5升',inverse:true}),op('6','/','1/4','给6÷(1/4)写一个自己的分装故事，然后实际装一装。',{scene:'总量6，每小份1/4',story:true,exampleStory:'6升水，每瓶装1/4升，能装满多少瓶？',inverse:true}),op('3','/','1/2','每组变成1/2，总量变成3。能装的组数怎样跟着变？',{inverse:true})],
 sharesmallpart:[share(1,3,4,'已经只有一整个的1/3，还要平均给4个人。先继续切，再把每一块分出去。'),share(1,6,3,'给1/6÷3写一个自己的分享故事，再让每人拿到一样多。',{story:true,exampleStory:'一张饼的1/6留给3个人，每人分到这张饼的多少？'}),share(1,4,2,'这次是1/4分给2个人；分好后，用乘法把各人的量合回去。')],
 fractiondividewords:[share(1,2,3,'半千克巧克力平均分给3个人，每人多少千克？整条表示1千克。',{unit:'千克'}),op('2','/','1/3','2杯葡萄干，每份装1/3杯。这里已知每份大小，求能装几份。',{scene:'2杯葡萄干，按1/3杯一份分装',inverse:true}),share(1,4,2,'用“1/4平均给2个人”写另一个自己的故事；也用图把意思留下。',{story:true,exampleStory:'一米彩带的1/4平均分给两个人，每人多少米？'})],
 fractionsanity:[op('2/5','+','1/3','同一张披萨，分别吃了2/5与1/3。先借一半与整个估计，再算准确值。',{scene:'两人一共吃了多少张披萨？',estimate:['1/2',1],simple:true}),op('2/5','+','1/2','有人把上下的数都相加，说结果是3/7。先留下自己的估计，再构造真正的和。',{scene:'2/5加1/2，会不会比1/2还小？',estimate:['1/2',1],simple:true}),{type:'x-fracorder',cards:['3/7','1/2','9/10'],max:1,benchmark:true,prompt:'把那个3/7、参照1/2和实际的9/10放在同一条线上。哪个落在一半下面？'},op('5/12','+','1/6','换一组小份。估计可以不准，算后要如实检查最初的范围。',{estimate:['1/2',1],simple:true})],
 fractionquotient:[op('2/3','/','4/5','先在图上比较能放下几组，再让每组的量变成1：两边应同时乘什么？',{scene:'总量2/3，每整组4/5；可以不足一整组',reciprocal:true,inverse:true}),op('3/4','/','1/2','写一个“每组1/2，总量3/4”的故事；不足一整组的部分也要算。',{story:true,exampleStory:'有3/4升果汁，一份是1/2升，可以装几份，包括不足一份的部分？',reciprocal:true}),op('5/6','/','2/3','换一种每组大小，用图与两边一起改变两种办法，检查组数相同。',{reciprocal:true,inverse:true})],
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,t])=>[id,structuredClone(t[0])]));
export const BRIDGES=[];
const link=(from,to,title,a,b)=>BRIDGES.push({from,to,title,summary:'把两种已经用过的动作接起来，再处理改变后的条件。',tasks:structuredClone([a,b]),phase:5,batch:'B18'});
// Every pair follows a pinned source edge; navigation order adds no prerequisites.
link('simplestparts','unlikeparts','共同单位，帮助两种份相加',T17.simplestparts[1],TASKS.unlikeparts[0]);
link('mixedrename','unlikeparts','整份换成小份，再统一大小',T17.mixedrename[0],TASKS.unlikeparts[1]);
link('relatedparts','unlikeparts','只换一边，走到两边都要换',TASKS.relatedparts[0],TASKS.unlikeparts[0]);
link('sharewholes','countsmallgroups','分给人，还是数小杯',T16.sharewholes[0],TASKS.countsmallgroups[0]);
link('productfractions','countsmallgroups','知道每份，反过来数有几份',op('1/5','*','4','先拿4份1/5，构造拿到的量。'),TASKS.countsmallgroups[0]);
link('sharesmallpart','countsmallgroups','同样出现分数，两种分法不同',TASKS.sharesmallpart[0],TASKS.countsmallgroups[0]);
link('fractioncarry','nonunitamount','先接同样小的份，再取一堆中的几份',TASKS.fractioncarry[0],T16.nonunitamount[0]);
link('repeatfraction','sharewholes','几份合回去，反过来平均分',TASKS.repeatfraction[0],T16.sharewholes[0]);
link('mixedrename','mixedexchange','换一个名字，也能把整份换开',T17.mixedrename[0],TASKS.mixedexchange[2]);
link('splitfraction','mixedexchange','分成整份与零头，帮助拿走',TASKS.splitfraction[2],TASKS.mixedexchange[2]);
link('productfractions','fractionquotient','从取几倍，反过来找倍数',op('4/5','*','5/6','先看4/5的5/6是多大。',{simple:true}),TASKS.fractionquotient[0]);
link('sharesmallpart','fractionquotient','小份继续分，换成比较组数',TASKS.sharesmallpart[0],TASKS.fractionquotient[0]);
link('lineplaces','joinfractions','同一条线上，小份接起来',T16.lineplaces[0],TASKS.joinfractions[0]);
link('jointhings','joinfractions','合并数量，换成合并同样小的份',op('2','+','2','先把两组各2个整体接起来。'),TASKS.joinfractions[0]);
link('simplestparts','productfractions','乘出来的份，还能合到更简',T17.simplestparts[2],TASKS.productfractions[2]);
link('repeatfraction','productfractions','拿几整份，走到取部分的一部分',TASKS.repeatfraction[0],TASKS.productfractions[0]);
link('joinfractions','fractioncarry','接到1以内，再接过1',TASKS.joinfractions[0],TASKS.fractioncarry[0]);
link('unlikeparts','fractionsanity','会统一小份，再用估计检查',TASKS.unlikeparts[0],TASKS.fractionsanity[0]);
link('fractionstories','fractionsanity','先辨动作，再看答案是否合理',TASKS.fractionstories[0],TASKS.fractionsanity[1]);
link('unlikeparts','fractionfour','同一对分数，加减动作不同',TASKS.unlikeparts[2],op('5/6','+','1/4','还是这两个量，这次接起来。',{simple:true}));
link('productfractions','fractionfour','同一对分数，换成两种动作',TASKS.productfractions[2],op('3/4','+','2/3','这次把两部分相加，不能沿用乘法。'));
link('sharesmallpart','fractionfour','先平均分，再反向取几倍',TASKS.sharesmallpart[0],op('1/12','*','4','把每人的1/12合成4份，回到原量。',{simple:true}));
link('productfractions','fractionarea','取部分的部分，换成面积',TASKS.productfractions[0],TASKS.fractionarea[0]);
link('boundary','fractionarea','整块铺面积，换成分数边长',op('3','*','2','先铺长3、宽2的长方形，每个单位方格面积为1。',{tile:true}),TASKS.fractionarea[0]);
link('repeatfraction','manycopies','连续接几次，带回材料用量',TASKS.repeatfraction[0],op('3/8','*','4','每段彩带3/8米，4段共多长？',{scene:'四段同样长的彩带',mixed:true}));
link('joinfractions','precisefractions','分法与取法，都写进等式',TASKS.joinfractions[0],TASKS.splitfraction[0]);
link('sharewholes','sharesmallpart','分几个整个，走到只分一小份',T16.sharewholes[0],TASKS.sharesmallpart[0]);
link('productfractions','sharesmallpart','一小份的几分之一，就是继续分',op('1/3','*','1/4','先取1/3中的1/4。',{tile:true}),TASKS.sharesmallpart[0]);
link('hundredths','dividebyten','百分之一，接到数字的新位置',T17.decimalnames[2],TASKS.dividebyten[2]);
link('decimal','dividebyten','把小份写成小数，再缩小十倍',T17.decimalnames[1],TASKS.dividebyten[0]);
link('dividebyten','shifttens','从整数开始，再从小数开始',TASKS.dividebyten[0],TASKS.dividebyten[4]);
link('productfractions','fractionrecipe','取几倍，带回一份半配方',TASKS.productfractions[1],TASKS.fractionrecipe[0]);
link('fractionarea','fractionrecipe','两方向取量，帮助表示材料',TASKS.fractionarea[1],TASKS.fractionrecipe[1]);
link('scale','fractionrecipe','一份半的缩放，不能当成加半杯',TASKS.portionoperator[3],TASKS.fractionrecipe[0]);
link('countsmallgroups','fractiondividewords','数小份，换成真正的分装问题',TASKS.countsmallgroups[0],TASKS.fractiondividewords[1]);
link('manycopies','fractiondividewords','每份合起来，反过来按份装',op('1/3','*','6','6份，每份1/3杯，合起来几杯？'),TASKS.fractiondividewords[1]);
link('sharesmallpart','fractiondividewords','继续平分小份，带回重量',TASKS.sharesmallpart[0],TASKS.fractiondividewords[0]);
link('joinfractions','fractionchoices','同样小的份，接到两步问题',TASKS.joinfractions[0],T17.fractionchoices[3]);
link('unitcopies','repeatfraction','一次一小份，换成一次几小份',T16.unitcopies[0],TASKS.repeatfraction[0]);
link('samenames','relatedparts','换名字时保留原量，再相加',T17.samenames[0],TASKS.relatedparts[0]);
link('splitfraction','relatedparts','先分成两组，再变成共同小份',TASKS.splitfraction[0],TASKS.relatedparts[1]);
link('unitcopies','splitfraction','相同小步，可以按不同组接',T16.unitcopies[0],TASKS.splitfraction[1]);
link('fractioncarry','splitfraction','跨过1以后，再拆成整份与零头',TASKS.fractioncarry[2],TASKS.splitfraction[2]);
link('productfractions','scale','乘小于1，或乘大于1',TASKS.productfractions[2],TASKS.productfractions[1]);
link('fractionarea','scale','面积里的放大，带回数量的倍数',TASKS.fractionarea[1],TASKS.portionoperator[3]);
link('fractioncarry','fractionmeasure','份数跨过1，单位仍是厘米',TASKS.fractioncarry[0],TASKS.fractionstories[1]);
link('mixedexchange','fractionstories','会处理整份和零头，再接两段绳',TASKS.mixedexchange[0],TASKS.fractionstories[1]);
