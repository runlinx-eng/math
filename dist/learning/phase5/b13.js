import{TASKS as T03}from'../phase4/b03.js';
import{TASKS as T02}from'../phase4/b02.js';
import{TASKS as T10}from'./b10.js';
import{TASKS as T07}from'./b07.js';
const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B13'});
export const LESSONS={
 equalgroups:item('mt_PZ909yPrEC','每一份，都一样多','乘法与等组连加','3份，每份2个，可以记成2+2+2，也可以记成3×2。份数和每份多少是两个不同的量；几份大小不同时，不能直接把它们当成同样的几份。','3份每份2个，与3个再加2个，哪里不一样？'),
 sharegroups:item('mt_LpSuPgL31x','分给几人，还是每袋几个','等分与包含除','12个分给3人，问每人几个；12个每3个装一袋，问几袋。都能用12÷3，但答案中的4说的是不同的事。平均分要求每份相同。','同样是12÷3，什么时候4表示每份多少，什么时候表示有几份？'),
 screenshare:item('mt_1GDEHyEZYH','把这一堆分公平','屏幕上的等分与成组','拖动或点选搬动每一颗，原来的数量不增加也不消失。每个人都拿到一些，还不一定是平均分；要检查各份是不是一样多。','屏幕上的三份怎样对应桌上的三只玩具？'),
 bagstories:item('mt_wh3UqnWsa7','袋子里的故事','乘除情境的结构','知道几袋和每袋多少，可以合起来找全部；知道全部，再按人数分或按每袋大小装，会问出不同的问题。先看数量之间的关系。','15颗分给3人，与每袋3颗，谁是已经知道的？'),
 groupsproblems:item('mt_qUjW0N1cYO','贴纸、苹果和小桌子','等组与平均分问题','盘子、袋子和桌椅只是情境。先找全部、份数和每份多少，再让图与问题对应。图上每一份都要一样多。','4张桌子每桌4把椅子，可以怎样摆，才能看出一共16把？'),
 divisionmeaning:item('mt_iNdrM2-oJf','同一道除法，两种分法','除法的两种含义','56÷8既可以问分给8人每人多少，也可以问每8个装一袋有几袋。不能交换总数和分的对象。剩下一些时，要说明它们没有凑成完整的一份。','得到7时，它数的是人手里的物品，还是装好的袋子？'),
 arraystart:item('mt_GRWwTDZ3wD','排成整齐的队伍','乘除法的阵列模型','3行，每行4个，整齐排成12个。按行看与按列看，总数相同；知道一共有12个、每行4个，也能倒着找到3行。','行和列换一个方向，为什么没有添东西却能换一种乘法？'),
 rowsums:item('mt_B1zj1RwQ3a','每一行，写成一份','阵列与等加数连加','每一行贡献同样的数量。3行4个可以写成4+4+4=12；行长不一样时，这个等组写法就不合适。','怎样从4+4+4看出要摆几行、每行几个？'),
 mulsymbols:item('mt_zOWwLxa77y','给摆法写个短名字','乘号、除号与等号','×记录等组，÷记录怎样分，=表示两边一样多。12=3×4也成立，等号不要求答案只能写在右边。','3×4与3+4摆出来会一样吗？'),
 turnarray:item('mt_C9ZfT-4cgn','转一下，数量会变吗','乘法交换律与除法边界','阵列转向后，同一批物品从3行5个变成5行3个，数量不变。除法交换总数和份数会变成另一个问题：12÷3和3÷12不同。','为什么乘法能换位置，除法却不能直接照搬？'),
 productmeaning:item('mt_gtTl3R5buH','几份，每份几个','乘法的数量含义','4×6可以对应4份、每份6个。两种因子顺序的积相同，但故事中份数与每份多少仍各有角色。重复加法是等组的入口，不是所有乘法情境的全部含义。','同样24个，4袋每袋6个与6袋每袋4个，故事哪里变了？'),
 evenhalves:item('mt_0u4KLbvBa1','分成两边，会剩一个吗','奇偶、等分与个位规律','偶数能两两配好，也能分成相同的两份。每个十本身能配好，所以十进制整数的奇偶由个位决定；0没有剩余，也是偶数。','23为什么要看最后的3，而不是前面的2？'),
 tables2510:item('mt_HhuSDxwDNM','从两份、五份、十份开始','2、5、10的乘除事实','两倍可以看成两个相同部分；同一个数的五倍是十倍的一半。一组乘法还连着对应的除法。几次回忆只是练习，不代表已经流利。','忘了5×6时，怎样借10×6找回来？'),
 tables348:item('mt_wQ89AEXhz3','加倍，再加倍','3、4、8的乘除事实','4份可以由2份加倍，8份再由4份加倍。乘法事实和对应除法一起用，忘记时可以回到图中重建。','4×7已经知道，怎样接出8×7？'),
 tables12:item('mt_K5jM7vlVhA','把熟悉的事实连起来','12以内乘除事实与推导','换顺序能找到伙伴，拆开能借熟悉的事实。想不起来时，可以回到图里，借已经会的那一份找回来。','7×8卡住时，你想借哪一个已经会的事实？'),
 missingfactor:item('mt_GDG9_SZmsO','这一边藏起来了','除法作为未知因子','32÷8可以问8乘几等于32。把缺少的一边补回阵列，再乘回去检查；除法和乘法围绕同一份整体。','知道8×4=32，能接出哪两道除法？'),
 unknownproducts:item('mt_xZvDCYA5Ae','空格换位置，办法也换吗','乘除等式中不同位置的未知量','空格可能是每份、份数或全部。□÷5=9要找的是全部，7×□=63要找的是其中一边；求出后放回原等式检查。','怎样知道这次应该找全部，还是找其中一边？'),
 factorpairs:item('mt_nZkL5-XjRX','同一堆，能排几种长方形','因数对与交换','每个长方形的两边是一对相乘得到总数的整数。3×8和8×3是同一对，不能重复计数；1×24也不能漏掉。','从1开始试，怎样说明所有不同的长方形都找到了？'),
 mentalproducts:item('mt_pjfmCMMPjO','先找一对顺手的伙伴','心算中的单位与乘法结合','三数相乘可以先挑顺手的一对；每个原数仍要用一次。乘1保持原量，乘0得到0。用十作单位时，结果也要带着十的单位。','2×7×5先合哪一对顺手？其他顺序为什么也对？'),
 tensproducts:item('mt_isojCL9yy-','一颗换成一捆十','乘整十数与位值','7×30是7份3个十，一共21个十，也就是210。依据是单位变成十，不是对所有数都能“后面添0”；小数更不能照搬这个口诀。','7×3和7×30的图可以同样摆，为什么数量不同？'),
 productways:item('mt_Lb2ZnMdkYR','转一转，切一刀，换个搭档','乘法的交换、分配与结合','阵列旋转、把每行拆成两段、先合三数中的一对，都能改变算法而保留数量。8×7拆成8×5与8×2，两边都要乘8。','8×5+2为什么没有装下8×7里全部的点？'),
 derivepatterns:item('mt_aivrWs6jrS','发现规律，再试着说明','重复推理与概括','半份的分子是分母的一半；单位扩大十倍，同样摆法代表的积也扩大十倍。例子帮助检验猜想，为什么一直成立还需要理由。','看见几个例子相同，和说明为什么一定这样，有什么区别？'),
 mixedfacts:item('mt_WX30dzi4dt','忘了也能找回来','乘除事实与灵活推导','可以把一大份切成两个熟悉的部分，再合起来；乘除事实也能相互检查。','9×7能借10×7减去哪一整份？也能怎样分成两块？'),
 tablepatterns:item('mt_w6MxaaoMXZ','表里的规律，从哪里来','乘法表规律与结构解释','5的倍数个位在5和0之间交替；两个偶数相加仍能配成两份；交换行列让乘法表有对称伙伴。图可以支持解释，几个例子本身不是一般证明。','两个偶数各分成两份，再接在一起，为什么还能分成两份？'),
};
export const SECTIONS=[{id:'group-work',title:'一堆分成几份'},{id:'array-work',title:'排成行，看乘除'},{id:'multiply-way',title:'换个办法算'}];
const route=(id,title,section,ids)=>({id,title,section,ids,packIds:['groups'],themeId:'numbers',color:'#b58e51'});
export const ROUTES=[route('BI','合成一堆，再公平分开','group-work',['equalgroups','sharegroups','screenshare']),route('BJ','把故事摆出来','group-work',['bagstories','groupsproblems','divisionmeaning']),route('BK','一行一行，看见乘除','array-work',['arraystart','rowsums','mulsymbols']),route('BL','转向和对半，看清关系','array-work',['turnarray','productmeaning','evenhalves']),route('BM','从熟悉的乘法出发','multiply-way',['tables2510','tables348','tables12']),route('BN','把藏起来的数找回来','multiply-way',['missingfactor','unknownproducts','factorpairs']),route('BO','先找顺手的算法','multiply-way',['mentalproducts','tensproducts','productways']),route('BP','规律能帮忙，也要说清楚','multiply-way',['derivepatterns','mixedfacts','tablepatterns'])];
const groups=(mode,a,b,prompt,extra={})=>({type:'x-mulgroups',mode,a,b,total:a*b,unit:'个',prompt,...extra});
const array=(a,b,prompt,extra={})=>({type:'x-mularray',a,b,unit:1,prompt,...extra});
const facts=(cases,prompt)=>({type:'x-mulfacts',cases:cases.map(c=>Array.isArray(c)?{a:c[0],b:c[1],op:c[2]||'×'}:c),prompt});
const chain=(values,prompt,extra={})=>({type:'x-mulchain',values,prompt,...extra});
const inverse=(a,b,prompt)=>({type:'x-divreverse',a,b,prompt});
const wall=(n,d,denominators,prompt,unequal=false)=>({type:'x-fwall',n,d,denominators,prompt,unequal});
export const TASKS={
 equalgroups:[groups('build',3,2,'摆3份，每份2颗。再把每份写成连加，看一共有多少。',{repeated:true}),groups('build',4,3,'4辆小车，每辆3个玩具乘客。给每辆摆同样多的乘客。',{repeated:true}),array(3,4,'把3份、每份4颗排成整齐的3行。每一行都一样长。',{repeated:true})],
 sharegroups:[groups('share',2,5,'把10颗平均分给2个盘子，每盘多少？'),groups('group',4,3,'同样大小的袋子，每袋装3颗。把12颗都装进去，数需要几袋。'),groups('group',4,2,'8颗积木，每2颗一组。自己添空盘，再分完这堆。'),groups('share',3,4,'12颗分给3人，每人多少？与每3颗装袋比较，答案中的4说的是同一种东西吗？')],
 screenshare:[groups('share',2,5,'把10颗草莓拖进2个盘子，分得一样多。也可以先点草莓，再点“放到这里”。',{unit:'颗草莓'}),groups('group',4,3,'12块积木，每3块一组。添盘子，再把积木搬过去。',{unit:'块积木'}),groups('share',3,2,'屏幕模拟：6块饼干分给3只小熊。每只都要一样多。真实桌面操作可以另做，本页只记录屏幕摆法。',{unit:'块饼干'})],
 bagstories:[groups('build',5,2,'5袋苹果，每袋2个。摆好每袋，找全部。'),groups('share',3,5,'15颗糖平均分给3人，每人多少？'),array(4,3,'4排花盆，每排3盆。亲自排成图，再写出总数。')],
 groupsproblems:[groups('share',3,6,'18张贴纸平均分给3位朋友。每人得到多少？',{unit:'张贴纸'}),groups('group',4,5,'20个苹果，每袋装5个。会装成几袋？',{unit:'个苹果'}),array(4,4,'4张小桌子，每桌4把椅子。用一行代表一桌，把椅子摆出来。')],
 divisionmeaning:[groups('share',8,7,'56颗分给8人。这里不知道的是每人有多少。'),groups('group',7,8,'还是56颗，这次每袋8颗。这里不知道的是袋子数量。'),groups('share',3,4,'13颗分给3人，每人分到同样多的整颗后，还剩几颗？',{total:13,remainder:true}),array(8,7,'每份8颗，合起来56颗。要有多少份？把缺少的行数找出来。',{hidden:'a',a:7,b:8,original:'□×8=56'})],
 arraystart:[array(3,4,'摆3行，每行4个，写下这幅图的乘法。'),array(2,5,'换成2行，每行5个。用图找到总数。'),array(3,4,'12个物品，每行放4个。需要几行？把图摆出来。',{hidden:'a',original:'12÷4=□'})],
 rowsums:[array(3,4,'把3行4颗画出来，再用连加写下每一行。',{repeated:true}),groups('build',3,4,'先给3个盘子摆相同数量，每盘4颗；不相同的三份不能直接叫3份4颗。',{repeated:true}),array(4,3,'给3+3+3+3=12摆一幅阵列。行数与每行的数量都要对上。',{repeated:true})],
 mulsymbols:[array(3,4,'摆出3行4颗，写一条相等的乘法关系。总数也可以写在等号左边。'),groups('share',3,4,'12颗平均分给3人。摆完后写除法，分清12和3各指什么。',{requireDivision:true}),array(2,6,'12=2×6也成立。把图摆出来，再在等号左边写总数。',{reverseEquation:true})],
 turnarray:[array(3,5,'先猜转向后数量怎样变，摆3行5颗，再转一下看看。',{rotate:true}),array(2,9,'2行9颗比较长。转成9行2颗，会多出或少掉颗粒吗？',{rotate:true}),inverse(12,3,'12块分给3组，与3块分给12组。交换以后，每组还是一样多吗？')],
 productmeaning:[groups('build',4,6,'4个盒子，每盒6颗。盒子数量和每盒的量都要与故事相同。',{repeated:true}),array(5,7,'用5行、每行7颗表示5份7颗。'),groups('build',6,4,'同样是24颗，这次摆成6盒，每盒4颗。故事与4盒6颗有什么不同？')],
 evenhalves:[{...structuredClone(T07.parity[0]),prompt:'13颗两两做伴。剩下的一颗能让它平均分成两份吗？'},groups('share',2,8,'把16颗分成一样多的两份，再写出对应关系。'),{...structuredClone(T07.parity[2]),prompt:'0颗会剩下一颗吗？亲自记录两边与剩余。'},facts([{kind:'parity',n:23},{kind:'parity',n:48},{kind:'parity',n:104},{kind:'parity',n:999},{kind:'parity',n:0}],'每个十都能配成对。观察个位，判断这些整数能不能全部配好。')],
 tables2510:[array(6,10,'摆6行10颗，切成两半。两边各有多少？这能帮你找6×5。',{split:true,requiredCut:5}),array(2,7,'两份相同的7颗是多少？先摆，再写。'),facts([[5,3],[20,5,'÷'],[2,9],[60,10,'÷'],[5,8],[18,2,'÷']],'把2、5、10的乘除混在一起试试。卡住时可以看阵列重建，不计时。')],
 tables348:[array(3,8,'先摆3行8颗，再转向看8份3颗。',{rotate:true}),array(7,4,'7行4颗，切成两份7行2颗，看看加倍关系。',{split:true,requiredCut:2}),array(7,8,'7行8颗，切成两个7行4颗。',{split:true,requiredCut:4}),facts([[3,4],[21,3,'÷'],[3,12],[33,3,'÷'],[3,7],[30,3,'÷']],'3的乘除，换个次序来试。'),facts([[4,7],[36,4,'÷'],[4,12],[20,4,'÷'],[4,3],[32,4,'÷']],'4的乘除，忘了可以借两倍。'),facts([[8,7],[72,8,'÷'],[8,12],[32,8,'÷'],[8,3],[80,8,'÷']],'8的乘除，忘了可以借4的两倍。')],
 tables12:[array(7,8,'7×8可以切成两个熟悉的块。自己选一条切线。',{split:true}),facts([[6,7],[56,8,'÷'],[12,11],[108,12,'÷'],[9,8],[77,7,'÷'],[1,12],[0,9]],'从1到12的范围抽几组混合事实，不计时；这不等于已经检验所有事实。'),array(9,12,'9份12，可以从一块长方形拆成两块再核对。',{split:true})],
 missingfactor:[array(4,8,'8乘几得到32？长出相同的几行，每行8颗，直到合成32。',{hidden:'a',original:'8×□=32'}),array(6,7,'42÷7找的是几份7。摆出图，再放回原式检查。',{hidden:'a',original:'42÷7=□'}),facts([[4,8],[8,4],[32,4,'÷'],[32,8,'÷']],'同一幅4行8颗的图，接出两乘两除。')],
 unknownproducts:[array(7,9,'7×□=63，藏起来的是每行多少。',{hidden:'b',original:'7×□=63'}),array(9,5,'□÷5=9，藏起来的是全部。',{hidden:'p',original:'□÷5=9'}),array(6,8,'48÷□=6，藏起来的是每行多少。',{hidden:'b',original:'48÷□=6'}),array(7,6,'42÷6=□，藏起来的是份数。',{hidden:'a',original:'42÷6=□'}),array(6,7,'6×7=□，藏起来的是总数。',{hidden:'p',original:'6×7=□'}),array(3,5,'5=□÷3，等号换了方向。先找空格，再代回去。',{hidden:'p',original:'5=□÷3'})],
 factorpairs:[{type:'x-factorrects',n:24,prompt:'24颗不添不减，能排出哪些不同的长方形？把每一种留下。'},{type:'x-factorrects',n:36,prompt:'36颗也找一找。正方形那一对只记一次。'},chain([2,7,5],'换个次序先找顺手的一对，再把第三个数乘进去。')],
 mentalproducts:[array(6,4,'6份4个十，一共有多少？图里每格代表一捆十，也就是40×6。',{unit:10}),groups('build',5,0,'摆5个空盒子，每盒0颗。最后有多少颗？'),groups('build',6,1,'6盒，每盒1颗。乘1会把数量变大吗？'),groups('share',1,8,'8颗只分给1人，会改变总数吗？'),chain([2,7,5],'2×7×5：先挑顺手的一对，再带上另一个。')],
 tensproducts:[array(7,3,'7×30：摆7行，每格是一捆十。先数几捆，再写多少个。',{unit:10}),array(5,6,'5×60：每格仍代表十，不能把30捆写成30个。',{unit:10}),array(7,3,'7×300：这次每格是一包百。同样摆法，代表的数量怎样变？',{unit:100}),array(5,2,'模拟估算：一箱大约200个，5箱大约多少？每格代表100，结果只是估计。',{unit:100,approximate:true})],
 productways:[array(6,4,'6行4颗，转向后怎样读？',{rotate:true}),array(8,7,'8×7：选一刀切成两块，两块都还要有8行。',{split:true}),chain([2,3,5],'2×3×5，可以先合哪两个？每个原数都只能用一次。'),inverse(12,3,'乘法可以交换，除法也能吗？把12与3换个位置实际看一看。')],
 derivepatterns:[wall(1,2,[2,4,6],'把不同分法都涂出半份。取的份数与全部份数有什么关系？'),wall(5,10,[10,9],'把两条分别涂成5/10和5/9，都是半份吗？',true),array(3,4,'先摆3份4，留下这幅图的关系。'),array(3,4,'同样3份，每格改成十：现在是3×40。单位改变了什么？',{unit:10}),array(3,4,'每格再改成百：现在是3×400。',{unit:100}),array(8,7,'把8×7切成8×5与8×2，再合起来。为什么两块都乘8？',{split:true,requiredCut:5})],
 mixedfacts:[array(9,7,'9×7：选两块熟悉的长方形，重新合成整块。',{split:true}),facts([[9,7],[56,8,'÷'],[6,8],[63,9,'÷'],[7,7],[54,6,'÷']],'混合乘除，先自己想；需要时用图找回来，不限秒数。'),groups('group',7,8,'56瓶水，每箱8瓶。把事实用到装箱，数要几箱。',{unit:'瓶水'})],
 tablepatterns:[array(7,10,'7份10，切成两个7份5。两个一半可以合回整十。',{split:true,requiredCut:5}),facts([[5,1],[5,2],[5,3],[5,4],[5,5],[5,6]],'看看每次多5以后，个位怎样来回变化。留下结果，再在总结说为什么。'),array(2,7,'6颗可分成两份3，8颗可分成两份4。用两行、每行3+4，检查6+8仍能分成两份。',{split:true,requiredCut:3}),array(4,9,'4与9互换位置，对应乘法表里的一对伙伴。',{rotate:true})],
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,ts])=>[id,structuredClone(ts[0])]));
// This local preparation does not award the later repeated-reasoning source node.
TASKS.derivepatterns.unshift(array(3,4,'先做一个准备：3份4颗，每份拆成2与2。两边各是多少？再看这些数量能不能分成两份。',{split:true,requiredCut:2}));
PRACTICE.derivepatterns=structuredClone(TASKS.derivepatterns[0]);
const link=(from,to,title,summary,left,right)=>({from,to,title,summary,tasks:structuredClone([left,right]),phase:5,batch:'B13'});
export const BRIDGES=[
 link('takethings','sharegroups','拿走一些，接到公平分','原量守恒，分出几份后也不能丢东西。',T10.takethings[0],TASKS.sharegroups[0]),
 link('sharegroups','screenshare','把分法亲手摆出来','同样的等分含义，换成可以搬动的物品。',TASKS.sharegroups[0],TASKS.screenshare[0]),
 link('equalgroups','screenshare','每份一样，再检查全部','等组与分配围绕同一份整体。',TASKS.equalgroups[0],TASKS.screenshare[2]),
 link('sharegroups','arraystart','分好的份，排成行','盘子里的等份接到整齐阵列。',TASKS.sharegroups[3],TASKS.arraystart[0]),
 link('equalgroups','arraystart','一份变成一行','把同样大小的几份排成同样长的几行。',TASKS.equalgroups[0],TASKS.arraystart[1]),
 link('arraystart','rowsums','把每一行写下来','阵列的每一行对应连加中的一个加数。',TASKS.arraystart[0],TASKS.rowsums[0]),
 link('arraystart','turnarray','换个方向读同一幅图','先构造，再转向观察数量不变。',TASKS.arraystart[0],TASKS.turnarray[0]),
 link('equalgroups','productmeaning','份数和每份各是什么','保留对象含义，不能只把两个数相加。',TASKS.equalgroups[0],TASKS.productmeaning[0]),
 link('rowsums','productmeaning','长长的连加，写成乘法','从每行的相同加数回到几份、每份多少。',TASKS.rowsums[2],TASKS.productmeaning[1]),
 link('sharegroups','divisionmeaning','同一个除法，两种动作','同时实际做等分与按每组大小分。',TASKS.sharegroups[3],TASKS.divisionmeaning[1]),
 link('equalgroups','tables2510','用等组找回熟悉的事实','回忆前先看到数量结构。',TASKS.equalgroups[0],TASKS.tables2510[1]),
 link('tables2510','tables348','从两份接到四份','同一份图可以用加倍建立新关系。',TASKS.tables2510[1],TASKS.tables348[1]),
 link('tables348','tables12','借伙伴找到更大的表','难记的事实仍能拆成熟悉的两块。',TASKS.tables348[2],TASKS.tables12[0]),
 link('productmeaning','missingfactor','知道全部，倒找一边','等组乘法接到缺少一边的阵列。',TASKS.productmeaning[1],TASKS.missingfactor[1]),
 link('divisionmeaning','missingfactor','除法也在问乘几','按组数清，再乘回去检查。',TASKS.divisionmeaning[0],TASKS.missingfactor[0]),
 link('missingfactor','unknownproducts','空格换位置','同一乘除关系里，藏起来的也可以是全部。',TASKS.missingfactor[0],TASKS.unknownproducts[1]),
 link('missingfactor','mixedfacts','借乘法找回除法','同一幅图把乘与除连起来。',TASKS.missingfactor[1],TASKS.mixedfacts[2]),
 link('mixedfacts','tensproducts','熟悉的事实换个单位','先建立乘法，再把每格看成十。',TASKS.mixedfacts[0],TASKS.tensproducts[0]),
 link('tables12','mentalproducts','知道事实，还能选顺手的组合','从拆开两块接到自己挑三数中的伙伴。',TASKS.tables12[0],TASKS.mentalproducts[4]),
 link('turnarray','productways','换方向，再换一种拆法','同一批点可以旋转，也可以切分后合回。',TASKS.turnarray[0],TASKS.productways[1]),
 link('productways','factorpairs','换摆法找出所有伙伴','乘法性质接到同一总量的不同长方形。',TASKS.productways[0],TASKS.factorpairs[0]),
 link('productways','tablepatterns','解释表里的规律','用真正切出的两块解释一条数量关系。',TASKS.productways[1],TASKS.tablepatterns[2]),
 link('screenshare','groupsproblems','把公平分用到新故事','搬动物品的办法迁移到贴纸。',TASKS.screenshare[2],TASKS.groupsproblems[0]),
 link('arraystart','bagstories','用一幅图讲故事','行与列接到每袋多少、共有几袋。',TASKS.arraystart[1],TASKS.bagstories[0]),
 link('rectangle','derivepatterns','同样的格子，单位变了','铺满长方形后，再看等组与单位扩大。',T02.rectangle[0],TASKS.derivepatterns[4]),
 link('sharegroups','amounts','分成几份，再取其中一份','平均分连接数量的分数。',TASKS.sharegroups[3],T03.amounts[0]),
];
