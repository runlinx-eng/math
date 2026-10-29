import{TASKS as T13}from'./b13.js';
import{TASKS as T14}from'./b14.js';
const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B15'});
export const LESSONS={
 structurebridge:item('mt_hImiKNiaNh','换个样子，还是同一个关系','跨表示的数学结构','长方形保留平行四边形的对边与角关系。3份(n+5)拆开是3n+15。八分之一、0.125与12.5%是在同一个整体上说同一个量。','换了图、字母或数的写法，哪些关系仍然不变？'),
 bracketlab:item('mt_8jFSnXxqQD','把这一组先抱在一起','括号与分组','括号告诉大家先把里面算成一块。小括号、中括号与大括号在这里都用来分组，里面还有一层时从最里面开始。','只移动括号，为什么会改变结果？'),
 orderlab:item('mt_jHgRQ4hR0g','大家怎样读出同一个结果','运算顺序','约定好顺序，大家才能把同一行算式读成同一个意思。先括号，再幂，再同层乘除从左到右，最后同层加减从左到右。','12÷2×3为什么不能先把2×3算成6？'),
 expressions:item('mt_4WaKWECpcv','把故事装进一行算式','数值表达式的书写与解释','“8与7合起来，再取2份”写作2×(8+7)。括号保存先后关系。比较一个量与它的3倍，有时不用先把大数算出来。','4×(365−12)里，哪一块先成为一个整体？'),
 powerorder:item('mt_X5cypSGoGU','小小的符号，改了哪一步','含幂与根的运算顺序、倒数','−3²表示把3平方后取负，(−3)²把负3整体平方。根号也管住它下面的一整块。非零数乘它的倒数得到1；0没有倒数。','为什么−3²与(−3)²会有不同结果？'),
 signedproducts:item('mt_rxInpOQ74w','方向翻过去，结果怎样走','有理数乘除的符号规则','连续改变一份的方向，结果也要延续原来的规律。同号相乘为正，异号相乘为负；除法可以乘回去检查。这个规则不能直接搬到两个负数相加。','−3×−2与−3+−2，为什么不能用同一句口诀？'),
 undocalc:item('mt_VUQNveSYjQ','走回去，要先撤回哪一步','逆运算及其适用范围','先乘3再加2，走回去就先减2再除3。平方与非负平方根在非负数上相互撤回；从负数先平方再开平方，会留下它的绝对值。','算术能倒查回来，就一定选对故事中的运算了吗？'),
 decimalproduct:item('mt_SoDP1fSQEB','小单位算完，再换回来','小数乘整数与位值','4.56是456个百分之一，取7份得到3192个百分之一，也就是31.92。3.2×5得到16.0，与16表示同一个量。','3192为什么在这道题里不是三千多？'),
 decimaldivide:item('mt_lU-2aTRB9f','没分完的，还能换得更小','小数除以整数','一份一可换成十份十分之一，剩下的也照样换。13写成13.00没有改变数量，只是让剩余能继续分到更小的单位。','13÷4剩1，怎样继续分，而不是把1直接接在商后面？'),
 calculatormeaning:item('mt_NmvuwVUFRS','机器算出数，故事决定怎么用','计算器、估计与情境解释','先估个大概，再核对输入。250÷8=31.25：安排全部人需要32辆车，装满盒子只31盒，绳子平均分则每份31.25厘米。','计算器显示的31.25，为什么不是三个故事的共同答案？'),
 estimatecheck:item('mt_ilPrU0cbtT','先看大概，发现差得太远','估算检验与适当精度','487×23可看成500×20，大约一万。估计能抓住少一位或错小数点的错误，但接近不保证精确正确；估计与精确各有用途。','500变大而20变小，能只凭一个方向判断估计一定偏大吗？'),
 mentalchoices:item('mt_vmW2cb5c7A','给数字找顺手的搭档','灵活的心算策略','45×8可以分成40×8与5×8，也可以连续加倍。6.5×4把6与0.5都算进去。99×6借100×6后，还要退回多算的一份6。','同一道题可以有几种正确办法，哪种让你更容易记住中间的量？'),
 decimalestimate:item('mt_3m0pA-aeat','小数点走错，会差多远','小数计算的估算检验','4.87×30大约是5×30=150；63.6÷20约等于60÷20=3，所以31.8差得太远。估计帮助查错，不代替精确计算。','2.46×400估成2.5×400，为什么能帮助检查984？'),
 scaleandpair:item('mt_EmR5n58jZt','复制几份，还是搭配几种','倍数缩放、对应与未知因子','3倍是三份相同的量。4件上衣各配3条裤子，要把每一种搭配都留下，得到12种。已知放大后的量，也能倒着找到原来的一份。','“3倍”与“多3”，分别改变了哪一部分？'),
 groupstories:item('mt_Zdv-b-iW5K','这道故事，到底在找哪一个量','乘除问题的结构与单位','6袋每袋8颗在找全部；28厘米剪成每段4厘米在找段数；28颗分4人在找每人几颗。同样28÷4，答案中的7可以表示不同的东西。','看到“每”字就用除法，为什么会算错6袋每袋8颗的总数？'),
 combineproducts:item('mt_AR-K72OIIO','拆块、复制和搭配','分配律、倍数与组合问题','14×6拆成10×6与4×6，两部分都要算。塔高是15米的3倍，与高出3米不同。3种面包配4种馅料，要找全12种搭配。','多添一种馅料，会增加一份还是三份搭配？'),
 timesmeaning:item('mt_U4cIBXVug4','几倍，是几份同样多','乘法比较的意义','一条作参照，另一条由几份相同参照量接成。“4倍”是四份原量，“多4”只添4。比较必须说清谁是谁的几倍。','用同样的4和4，四倍与多四分别得到多少？'),
 timesproblems:item('mt_6-j1NO2ZUH','藏起来的，可能是哪一份','乘法比较中的不同未知量','已知一份7、要3份，求全部；已知全部36、是4份，求一份；已知24与6，求相当于几份。先认清藏起来的量，再选乘或除。','36是4倍时，为什么原来的一份不是36×4？'),
 storyoperations:item('mt_RXnyhCRYXA','把一个问题，接成几步','多步问题的运算选择与检查','先想这一步在找什么，再把两个量接起来。算术正确还不够：同样得到4的2+2与2×2，描述的事情可能不同。逆算只检查数字，不能替故事选关系。','哪一步选错了运算，即使计算准确，也会走到另一件事上？'),
};
const route=(id,title,section,ids)=>({id,title,section,ids,packIds:['groups'],themeId:'numbers',color:'#b58e51'});
export const ROUTES=[route('BY','把关系抱成一块','multiply-way',['structurebridge','bracketlab','expressions']),route('BZ','顺着算，再倒着走','multiply-way',['orderlab','powerorder','undocalc']),route('CA','方向与顺手的算法','multiply-way',['signedproducts','mentalchoices']),route('CB','用更小的单位乘和分','array-work',['decimalproduct','decimaldivide']),route('CC','大概、精确与实际用途','multiply-way',['calculatormeaning','estimatecheck','decimalestimate']),route('CD','让故事里的数量看得见','group-work',['scaleandpair','groupstories','combineproducts']),route('CE','几倍与几个步骤','group-work',['timesmeaning','timesproblems','storyoperations'])];
const order=(expression,prompt,extra={})=>({type:'x-orderlab',expression,prompt,...extra});
const comparison=(part,factor,prompt,unknown='result')=>({type:'x-comparebars',part,factor,prompt,unknown,equations:unknown==='part'?[`${factor}*n=${part*factor}`,`n*${factor}=${part*factor}`,`${part*factor}/${factor}=n`]:unknown==='factor'?[`${part}*n=${part*factor}`,`n*${part}=${part*factor}`,`${part*factor}/${part}=n`]:[`${part}*${factor}=n`,`${factor}*${part}=n`]});
const pair=(rows,cols,prompt)=>({type:'x-pairtable',rows,cols,prompt});
const estimate=(a,b,op,prompt,extra={})=>({type:'x-estimatepad',a,b,op,prompt,...extra});
const decimal=(decimal,multiplier,estimate,prompt)=>({type:'x-decimalproduct',decimal,multiplier,estimate,prompt});
const divide=(decimal,divisor,prompt)=>({type:'x-decimaldivide',decimal,divisor,places:2,prompt});
const area=(a,b,prompt)=>({type:'x-areaproduct',a,b,prompt});
const undo=(start,forward,prompt,absolute=false)=>({type:'x-undolab',start,forward,end:forward.reduce((v,s)=>s.op==='+'?v+s.amount:s.op==='-'?v-s.amount:s.op==='*'?v*s.amount:s.op==='/'?v/s.amount:s.op==='square'?v*v:Math.sqrt(v),start),prompt,absolute});
const story=(values,labels,plans,meanings,prompt,equations)=>({type:'x-storychain',values,labels,plans,meanings:meanings.map(([id,label,...exprs])=>({id,label,exprs})),prompt,equations});
export const TASKS={
 structurebridge:[{type:'x-shapeangle',prompt:'先把斜四边形摆正，再斜回去比较，最后摆正。标出始终平行的两对边，用A角90°推出另外三个角。'},{type:'x-lawtiles',a:3,b:5,prompt:'每份有一条长度n和一块5，共3份。把两种块全部拆到右边，改变n两次，看看是否仍一样多。'},{type:'x-fractionbridge',prompt:'先在八等份中涂出一份，再把另一条涂到同样长。用它与同一整体的12%比较。'}],
 bracketlab:[order('3*(4+5)','3份相同的(4+5)，你准备先合哪一块？'),order('{2*[3+(7-1)]}','一层里面还有一层。从你选的一块开始，逐步合起来。'),order('8+2*5','数字与符号不动，只添括号，让结果变成50。',{construct:true,insert:true,expected:'(8+2)*5',target:50})],
 orderlab:[order('8+2*5','8再加2份5。先准备哪一块，才能让大家读出同一个结果？'),order('12/3+4*2','两边都准备好，再合到一起。可以先处理互不影响的任意一边。'),order('12/2*3','同一层的除与乘，从左往右接。先乘2×3会换成另一件事。'),order('20-6+2','同一层的减与加，从左往右接。这里没有把6+2抱在一起的括号。')],
 expressions:[order('','把“8与7先合起来，再取2份”写成一行。只表示关系，不必算结果。',{construct:true,expected:'(8+7)*2',writeOnly:true}),order('4*(365-12)','把“先从365拿走12，再取4份”写出来。上方是要表达的关系，不必算总数。',{construct:true,expected:'4*(365-12)',writeOnly:true}),order('','甲是18932与921的和，乙是甲的3倍。写出乙，再比较，先不算两个大数。',{construct:true,expected:'3*(18932+921)',writeOnly:true,reason:'triple',choices:[['triple','乙是甲的3倍'],['plus','乙比甲多3'],['same','两者相等']]})],
 powerorder:[order('3+2^3*4','先处理“3个2相乘”这一块，再按约定接下去。'),order('-3^2','先把3平方，再取负：这里负号抱住了哪一块？'),order('(-3)^2','这次负3被括号抱在一起，平方的是谁？'),order('√(9+16)','根号下面的一整块先准备好。两个数分别开平方再相加，会变成另一道题。'),order('','用5乘另一个数得到1。写出含有除法的那一份，再亲自合出来。',{construct:true,expected:'5*(1/5)',target:1})],
 signedproducts:[{type:'x-signwalk',mode:'sequence',a:-3,reason:'plus3',prompt:'让−3乘的数从2、1、0接到−1、−2。每次只少一份，结果要怎样延续？'},{type:'x-signwalk',mode:'cases',cases:[{a:6,b:2,op:'*'},{a:6,b:-2,op:'*'},{a:-6,b:2,op:'*'},{a:-6,b:-2,op:'*'},{a:0,b:-5,op:'*'}],prompt:'同样的大小，分别换一个或两个方向。把每种结果接出来，0也试一次。'},{type:'x-signwalk',mode:'cases',cases:[{a:12,b:3,op:'/'},{a:12,b:-3,op:'/'},{a:-12,b:3,op:'/'},{a:-12,b:-3,op:'/'}],prompt:'除法可以问：后面的数乘几，会回到前面的数？四种方向都试一次。'},order('(6+(-2)*4)/2-(-1.5)','模拟记账：6元余额，扣4次每次2元，结果平均记到两个账户，再撤销1.5元欠款。按这段关系计算其中一个账户的余额。')],
 undocalc:[undo(17,[{op:'+',amount:8}],'17先增加8。把最后的变化撤回，检查加与减的关系。'),undo(5,[{op:'*',amount:3},{op:'+',amount:2}],'5先取3份，再添2。现在从终点出发，自己挑怎样走回去。'),undo(13,[{op:'*',amount:12}],'13份12合成156。走回去找一份，再想156÷13为什么也能检查这组关系。'),undo(7,[{op:'square'}],'边长7铺成正方形。知道面积后，怎样走回非负的边长？'),undo(-3,[{op:'square'}],'从−3先平方，再取非负平方根。这次会回到−3吗？',true)],
 decimalproduct:[decimal('4.56',7,500,'把4.56看成456个百分之一，逐位乘7，再换回原来的单位。'),decimal('3.2',5,30,'3.2是32个十分之一。计算5份，16.0与16都可以表示最后的量。'),area(456,7,'4.56×7：这块每格代表百分之一。把456切成400与56，分别计算两块，再在总结换回31.92。')],
 decimaldivide:[divide('14.76',4,'把14.76平均分4份。先对齐点，再把每次剩下的换成更小的单位。'),divide('13',4,'13平均分4份。原数字用完还有剩余时，补0表示更小的单位，继续分。'),divide('18.6',5,'18.60元平均分5人。先按18.6开始，必要时补一个0，最后乘回去核对。')],
 calculatormeaning:[estimate(47,10,'*','47×10怎样算顺手？先估个大概，再用你选的方法算，最后核对输入。',{calculator:true,method:['mental','written','calculator']}),estimate(2365,48,'*','2365×48先估个大概，再用这里的计算器算。输入错了也会留下记录。',{calculator:true,method:['written','calculator']}),estimate(250,8,'/','250人，每辆车8座。计算器的小数还要怎样变成能安排全部人的车数？',{calculator:true,interpret:'up',context:'每个人都要有座位，车必须是完整的一辆。'}),estimate(250,8,'/','250颗珠子，每盒8颗。只问能装满几盒，不能把没装满的也算一盒。',{calculator:true,interpret:'down'}),estimate(250,8,'/','250厘米绳平均分8段，每段可以细分。结果应该怎样写？',{calculator:true,interpret:'exact'}),estimate(3847,26,'*','3847×26：选择愿意采用的方法，先估再核对。实际用了怎样的心算或纸笔方法，留在自己的说明里。',{calculator:true,method:['mental','written','calculator']})],
 estimatecheck:[estimate(487,23,'*','先选附近好算的数估一估，再检查给出的1120有没有数量上的问题。',{candidate:1120}),estimate(487,23,'*','同一道计算，这次给出11201。接近估计，是否就能证明每一位都对？',{candidate:11201}),estimate(198,49,'*','广场约有198排、每排约49人。只需要报一个大概人数，先用容易算的数估一估。'),{...structuredClone(T14.roundanswers[2]),prompt:'80人坐15座的车。车数必须足够安排所有人，不能只选最接近的整数。'}],
 mentalchoices:[area(45,8,'45×8自己切成两块，两块都乘8，再合起来。'),order('45*2*2*2','同一个45×8，换成连续三次加倍。算完比较哪种办法顺手。'),decimal('6.5',4,60,'从6×4借出6.5×4：65个十分之一取4份。最小单位仍要保留。'),order('250*3+500','先找出250的3份，再与500合起来。'),order('100*6-6','99×6借100×6以后，多算的是一整份6。把这一份退回去。')],
 decimalestimate:[estimate(4.87,30,'*','4.87×30的结果被写成14.61。先估再看，小数点有没有走远？',{candidate:14.61}),estimate(63.6,20,'/','63.6÷20被写成31.8。用附近好算的数检查这个结果。',{candidate:31.8}),estimate(2.46,400,'*','2.46×400被写成984。估个大概，说明为什么仍不能只凭估计保证全对。',{candidate:984})],
 scaleandpair:[comparison(8,3,'红带8厘米，蓝带是它的3倍。再搭一条只比红带多3厘米的带子作比较。'),pair(['红上衣','蓝上衣','白上衣','绿上衣'],['长裤','短裤','背带裤'],'4件上衣各配3种裤子。亲手留下每一种搭配，不漏，也不重复。'),comparison(6,3,'一条带子18厘米，是原带子的3倍。原来的一份是多少？','part'),{type:'x-mularray',a:6,b:7,unit:1,hidden:'b',original:'6×□=42',prompt:'6份相同数量共42，藏起来的一份有多少？摆成阵列，再代回检查。'}],
 groupstories:[{type:'x-mulgroups',mode:'build',a:6,b:8,total:48,unit:'颗苹果',prompt:'6袋苹果，每袋8颗。“每袋”并不表示一定用除法。先把袋子装出来，再找总数。'},{type:'x-mulgroups',mode:'group',a:7,b:4,total:28,unit:'厘米',prompt:'28厘米带子，每段4厘米。把每4厘米放成一段，答案在数几段。'},{type:'x-mulgroups',mode:'share',a:4,b:7,total:28,unit:'颗糖',prompt:'换成28颗糖平均分4人。这里同样算28÷4，答案在数每人几颗。'},{type:'x-mularray',a:5,b:6,unit:1,prompt:'长5米、宽6米的地面，每格1平方米。摆好行列，再记录覆盖的面积。'}],
 combineproducts:[area(14,6,'14×6先切成10×6与4×6，两部分都要算。'),comparison(15,3,'楼高15米，塔是楼的3倍。另搭一条只高出3米的线比较。'),pair(['白面包','全麦','圆面包'],['鸡蛋','奶酪','番茄','蘑菇'],'3种面包各配4种馅。每种组合只留一次。'),story([3,8,5],['3盒','每盒8颗','另外5颗'],['0*1+2'],[['boxes','盒子里的总颗数','0*1'],['all','全部颗数','0*1+2']],'3盒每盒8颗，另外还有5颗。先找这一步在数什么，再把故事接完整。',['3*8+5=n'])],
 timesmeaning:[comparison(4,4,'原来4颗，另一份是它的4倍。再比较只比原来多4颗。'),comparison(8,3,'汤姆8张贴纸，莎拉是他的3倍。用n表示莎拉的数量，写出关系。'),comparison(7,5,'35张是7张的几倍？图里哪条作一份，要说清楚。','factor')],
 timesproblems:[comparison(7,3,'红带7厘米，蓝带是红带的3倍，蓝带多长？'),comparison(9,4,'大盒36颗，是小盒的4倍。小盒有几颗？','part'),comparison(6,4,'24颗与6颗，前者相当于后者的几份？','factor'),comparison(6,5,'原来6颗。“多5颗”和“是5倍”分别怎样接？')],
 storyoperations:[story([6,24,8,5],['6盒','每盒24颗','8组','每组用去5颗'],['0*1/2-3','0*(1/2)-3'],[['total','原来的总颗数','0*1'],['perBox','每盒平均分给一组的颗数','1/2'],['per','每组分到的颗数','0*1/2','0*(1/2)'],['left','每组用过后剩下的颗数','0*1/2-3','0*(1/2)-3']],'6盒，每盒24颗，平均给8组，每组再用去5颗。自己选搭档和运算，接出每组剩多少。',['(6*24/8)-5=n','6*(24/8)-5=n']),story([20,4,3,2],['原有20元','再收到4元','买3本','每本2元'],['0+1-2*3'],[['money','现在共有的钱','0+1'],['cost','买本子的总价','2*3'],['left','最后剩下的钱','0+1-2*3']],'模拟钱包：原有20元，再收4元，买3本每本2元的本子。两边可独立先算，最后接在一起。',['20+4-3*2=n']),story([2,2,3],['2盒','每盒2颗','另外3颗'],['0*1+2'],[['boxes','两盒里的总颗数','0*1'],['all','全部颗数','0*1+2']],'有人先做2+2也得到4。两盒各2颗应该是什么关系？亲自重建，再加旁边3颗。',['2*2+3=n'])],
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,ts])=>[id,structuredClone(ts[0])]));
export const BRIDGES=[];
const link=(from,to,title,a,b)=>BRIDGES.push({from,to,title,summary:'把前一个办法用到后一个问题，两个操作都要亲自做过。',tasks:structuredClone([a,b]),phase:5,batch:'B15'});
// Real upstream edges only. Route order never creates an edge.
link('bracketlab','expressions','先抱成一组，再写成一行',TASKS.bracketlab[0],TASKS.expressions[0]);
link('bracketlab','orderlab','括号说清楚，其他地方也要约定',TASKS.bracketlab[1],TASKS.orderlab[2]);
link('orderlab','powerorder','一层乘除之前，先处理幂',TASKS.orderlab[1],TASKS.powerorder[0]);
link('orderlab','undocalc','顺着的顺序，倒着撤回',TASKS.orderlab[0],TASKS.undocalc[1]);
link('storyoperations','undocalc','故事算过，再检查数字能否回来',TASKS.storyoperations[2],TASKS.undocalc[2]);
link('orderlab','storyoperations','算式关系，用到故事里',TASKS.orderlab[1],TASKS.storyoperations[1]);
link('decimalproduct','decimalestimate','小单位算出的量，用大概检查',TASKS.decimalproduct[1],TASKS.decimalestimate[0]);
link('timesmeaning','timesproblems','同样的一份藏起来了',TASKS.timesmeaning[1],TASKS.timesproblems[1]);
link('groupstories','timesproblems','认出每份，再倒着找',TASKS.groupstories[2],TASKS.timesproblems[1]);
link('scaleandpair','combineproducts','每种都要配全，换成面包也一样',TASKS.scaleandpair[1],TASKS.combineproducts[2]);
link('remainders','bracketlab','几步故事，装进括号',T14.remainders[4],TASKS.bracketlab[0]);
link('bigproduct','bracketlab','乘法先会算，再看乘的是什么',T14.bigproduct[0],TASKS.bracketlab[0]);
link('shortproduct','combineproducts','按位算过，也能拆成两块',T14.shortproduct[0],TASKS.combineproducts[0]);
link('productways','combineproducts','每块都乘，再合回整个',T13.productways[1],TASKS.combineproducts[0]);
link('writtenstart','scaleandpair','算出三份，回到三倍的长度',T14.writtenstart[0],TASKS.scaleandpair[0]);
link('longdivide','decimaldivide','整数剩下的，继续往小单位分',T14.longdivide[0],TASKS.decimaldivide[0]);
link('shiftfine','decimaldivide','每个位置都有自己的单位',T14.shiftfine[0],TASKS.decimaldivide[1]);
link('shiftfine','decimalproduct','小单位不会被乘法抹掉',T14.shiftfine[0],TASKS.decimalproduct[0]);
link('bigproduct','decimalproduct','相同的数字，带上不同单位',T14.bigproduct[1],TASKS.decimalproduct[1]);
link('longproduct','calculatormeaning','知道计算的量，再借机器核对',T14.longproduct[1],TASKS.calculatormeaning[1]);
link('shortdivide','calculatormeaning','小数结果，要读回实际用途',T14.shortdivide[1],TASKS.calculatormeaning[2]);
link('productmeaning','timesmeaning','一份的意义，接到倍数比较',T13.productmeaning[0],TASKS.timesmeaning[1]);
link('productmeaning','groupstories','先知道每份，才知道找谁',T13.productmeaning[0],TASKS.groupstories[0]);
link('divisionmeaning','groupstories','同一道除法，两种分法',T13.divisionmeaning[0],TASKS.groupstories[1]);
link('bigproduct','mentalchoices','把大计算拆成顺手的块',T14.bigproduct[2],TASKS.mentalchoices[0]);
link('shifttens','decimalestimate','数量差十倍，估计能抓住',T14.shifttens[1],TASKS.decimalestimate[1]);
link('roundanswers','decimalestimate','近似值，帮助看清小数数量',T14.roundanswers[0],TASKS.decimalestimate[2]);
link('remainders','storyoperations','两步接好，再多接一步',T14.remainders[4],TASKS.storyoperations[0]);
link('longdivide','storyoperations','分给几组，成为计划中的一步',T14.longdivide[1],TASKS.storyoperations[0]);
link('combineproducts','remainders','先算总量，再看整份',TASKS.combineproducts[3],T14.remainders[1]);
link('decimaldivide','roundanswers','先算到更细，再按用途保留',TASKS.decimaldivide[1],T14.roundanswers[0]);
link('estimatecheck','roundanswers','大概与精确，分别帮什么忙',TASKS.estimatecheck[2],T14.roundanswers[2]);
