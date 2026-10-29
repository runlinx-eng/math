import{TASKS as T13}from'./b13.js';
const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B14'});
export const LESSONS={
 largerfacts:item('mt_8A3pZNOp7Z','借小算式，算大数量','位值与分配的心算策略','40×60可以看成4个十乘6个十，也就是24个百。7×15拆成7×10与7×5，两部分都要乘7。','360÷9与36÷9，哪一份变大了十倍？'),
 writtenstart:item('mt_DyGBW3ZHh3','把大块拆开算','分拆与书面乘除','23×4分成20×4与3×4，算完再合起来。竖着记只是把这些数量放进各自的位置。','竖式里十位的2，为什么不能只算2×4？'),
 shortproduct:item('mt_18fK9sQdIz','十个换一捆，再往前走','短乘法与进位','先乘当前这一位，再加上一位送来的整捆。十个合成一个更大的单位，剩下的留在原位。','47×6里从个位送出的4，到了十位表示多少？'),
 longproduct:item('mt_q9EaJc2FP8','第二行为什么要挪一格','长乘法与面积分拆','34×27的两行分别是34×7与34×20。第二行乘的是20，放对位置才能合成原来的数量。','面积图里的四块，怎样合成竖式的两行？'),
 bigproduct:item('mt_XLP1IM3Qbb','更多数字，同样的单位','多位数长乘法','数字更多，仍是每位相乘、合十进位，再把不同单位的部分相加。先估一个大概，可以发现数量差得太远的错误。','第二行漏掉一个0，为什么结果会差这么多？'),
 shifttens:item('mt_LlMl2PbaZe','数字搬家，值会变','乘除10、100、1000','小数点标着个位边界。每个数字向左移一格，表示的量扩大十倍；向右移一格，就变成原来的十分之一。','3.45×100为什么不是3.4500？'),
 shiftfine:item('mt_wPgpMJ0-PA','再小一点的位置','更精细小数的位值变化','45.2除以1000得到0.0452，最后的2来到万分位。空位置里的0不能漏，小数点也不用跟着数字走。','同一个2，搬到不同位置后代表的量有什么不同？'),
 shortdivide:item('mt_MCu_SNg_OW','这一位剩下的，带到下一位','短除法与余数','一份十没有分完，可以换成十份一，再和原来的一起分。每一位都要记，分不到也要留0。','125÷8剩5，什么时候保留5，什么时候需要多一个袋子？'),
 divide16:item('mt_FvEq4heNBx','一份里有十几个，也能分','两位数除法与方法选择','先估这一段能分几份，再乘回去、看剩余。记得紧凑还是把乘减展开，可以按自己熟悉的程度选择。','两种记法都成立时，哪一种让你更容易检查？'),
 longdivide:item('mt_WsM4EmdOLe','每一步都能倒着检查','长除法与余数表达','先分、乘回去、拿走，再把下一位带下来。4752÷13是365余7；把剩下7再平均分13份，就是每份7/13。','为什么剩下的7要除以13，不能直接写成小数点后的7？'),
 remainders:item('mt_p-nbe0w_lf','剩下的人，也要坐上车','情境中的余数与两步问题','52人坐每辆9人的车，5辆还剩7人，要6辆。若问52颗能装满几个9颗袋子，只能装满5袋。','同一个52÷9，为什么两个故事的答案不同？'),
 roundanswers:item('mt_QU5R7Aajy9','答案留到多细才够用','答案精度与情境取舍','量长度、分金额和准备整辆车，需要的答案不同。尽量保留中间结果，最后再按用途取近似值。','5.33辆车为什么不能按普通四舍五入只准备5辆？'),
 factorlab:item('mt_FHIAv6dfhU','哪些伙伴，两个数都有','因数、倍数与共有部分','能整除它的是因数；一份份接着增加得到倍数。两个数都拥有的才叫共同，1不能漏，倍数也没有最大一个。','24与36共同拥有的因数，和共同的倍数有什么区别？'),
 factoruse:item('mt_0Wg5F97osg','拆出一个顺手的搭档','整除、平方与因数策略','24×25可以先把24拆成6×4，再让4与25合成100。判断6的倍数，需要同时满足2和3的整除条件。','24×4×25为什么多算了？'),
 parityrules:item('mt_oxfxzbat3k','两颗落单的，可以作伴','奇偶运算的结构','每个奇数都能配成若干对，再剩1颗。两个奇数合起来，两个落单的恰好又成一对。偶数份的同样数量也能两份一组。','不算347+129的总数，怎样知道会不会有落单的？'),
 primetest:item('mt_y1XCVsIelg','只能排成长长一行吗','质数与合数','大于1、只有1和自身两个不同因数的数叫质数。1只有一个因数；2是偶数，也是质数。51还能排成3×17，所以不是质数。','为什么不能用“奇数就是质数”来判断？'),
 squarecube:item('mt_gxCIASSezX','铺成方，搭成立方','平方数与立方数','7²是7×7，4³是4×4×4。小小的2和3说的是有几个相同因子相乘，不是乘以2或3。','4³为什么不是4×3？'),
 factorcode:item('mt_bZC-wqWX7Y','让办法替你逐个找','因数算法与表格规则','把起点、检查、记录条件和下一步说清楚，就能让同一个办法逐个检查。表格里的下一格也可以引用上一格，照同一条规则继续。','从1找因数时，怎样保证24本身也不会漏掉？'),
 primeforest:item('mt_xhoOWnhtHq','拆法不同，最后的积木相同','质因数分解、最大公因数与最小公倍数','把大于1的整数拆到每块都是质数，换条拆法，质数和各自的份数仍相同。共有的份数组成最大公因数，够两边使用的份数组成最小公倍数。','24与36都有2和3，为什么不能把所有重复的都算进最大公因数？'),
};
const route=(id,title,section,ids)=>({id,title,section,ids,packIds:['groups'],themeId:'numbers',color:'#b58e51'});
export const ROUTES=[route('BQ','大块拆开，再写下来','multiply-way',['largerfacts','writtenstart','shortproduct']),route('BR','第二行与更多数字','multiply-way',['longproduct','bigproduct']),route('BS','数字搬到新位置','multiply-way',['shifttens','shiftfine']),route('BT','分下去，再倒着检查','group-work',['shortdivide','divide16','longdivide']),route('BU','故事决定剩下的怎么办','group-work',['remainders','roundanswers']),route('BV','找到共同的伙伴','array-work',['factorlab','factoruse','parityrules']),route('BW','从方块到更小的因子','array-work',['squarecube','primeforest']),route('BX','把找数办法写清楚','array-work',['primetest','factorcode'])];
const area=(a,b,prompt)=>({type:'x-areaproduct',a,b,prompt});
const mul=(a,b,prompt,estimate=Math.max(1,Math.round(a/10)*10))=>({type:'x-multable',a,b,estimate,prompt});
const div=(n,d,prompt,extra={})=>({type:'x-divtable',n,d,prompt,interpret:'keep',places:0,...extra});
const shift=(start,step,prompt)=>({type:'x-wideshift',mode:'shift',start:String(start),step,prompt});
const search=(mode,ns,prompt,extra={})=>({type:'x-numbersearch',mode,ns,prompt,...extra});
const parity=(a,b,op,prompt)=>({type:'x-parityjoin',a,b,op,prompt});
const forest=(ns,prompt,extra={})=>({type:'x-factorforest',ns,prompt,...extra});
const story=(values,labels,prompt,extra={})=>({type:'x-planproduct',values,labels,prompt,...extra});
const sheet=(step,rows,highlight,prompt)=>({type:'x-multisheet',step,rows,highlight,prompt});
export const TASKS={
 largerfacts:[area(40,60,'40×60：两边都带着十。把每边分成合适的两段，算每一小块。'),area(7,15,'7×15：把15拆成10与5，一大块和一小块各是多少？'),div(360,9,'36÷9知道了，360÷9会变成多少？把每一位分清，再乘回去检查。'),shift('2.4',1,'小数也试一次：2.4扩大十倍。数字移动，不能只在末尾添0。')],
 writtenstart:[area(23,4,'把23×4画成两块，先找20×4，再找3×4。'),div(96,8,'96里面有几份8？从十位分起，把剩下的十换成一。'),mul(23,4,'把刚才的23×4按列记。每次算的这一位是什么单位？',20)],
 shortproduct:[mul(47,6,'47×6：先估，再从个位乘。十个换一捆，送到前面。',50),mul(234,5,'234×5：先借200×5估一估，再让进位走到正确的位置。',200),mul(306,7,'306×7：中间这一位是0，也不能跳掉它的位置。',300)],
 longproduct:[mul(2347,6,'2347×6：多出的位置仍照同样的换捆规则。',2300),mul(34,27,'34×27：分别算7份与20份，再把两行合起来。',30),area(45,23,'45×23：先把两边拆成整十与零头，算四块各有多少。'),mul(45,23,'把45×23改成两行来记。它们怎样对应刚才的四块？',50)],
 bigproduct:[mul(2463,37,'2463×37：留下7份和30份的两行，再合起来。',2500),mul(4762,28,'换成4762×28，检查第二行的位置和每次进位。',4800),mul(3040,20,'3040×20：遇到0也留下位置，别把20读成2。',3000)],
 shifttens:[shift('1',-1,'先试一个准备：1平均分成10份，每份落在哪个位置？'),shift('3.45',2,'3.45扩大100倍。每个数字都要移动同样的格数。'),shift('72',-3,'72缩小到原来的千分之一，空位置也要留好。'),shift('2.5',1,'2.5扩大十倍，解释数字2和5各变成了多少。')],
 shiftfine:[shift('3.456',2,'3.456扩大100倍，最后的6落在哪里？'),shift('45.2',-3,'45.2除以1000，注意小数点后空着的位置。'),shift('3.456',-3,'再往小处走：3.456除以1000，最后一位还能放在哪里？')],
 shortdivide:[div(4932,6,'4932÷6：每位分完，把剩下的换成下一位的十份。'),div(125,8,'125颗装进每袋8颗的袋子。记下装满几袋，还剩几颗。'),div(125,8,'还是125颗，每袋最多8颗。全部都装走，需要几个袋子？',{interpret:'up'}),div(125,8,'125米绳平均分给8人。剩下的还可以切开，每人精确分多少米？',{interpret:'fraction'})],
 divide16:[div(3648,16,'3648÷16：选择一种便于自己检查的记法，再逐位完成。',{choose:true}),div(4080,17,'4080÷17：换一组数，再决定用紧凑记法还是展开乘减。',{choose:true}),div(5,16,'5米绳平均分给16人。继续分到小数，写出每人多少米。',{interpret:'decimal',places:4})],
 longdivide:[div(4752,13,'4752÷13：把每次乘回、拿走和下一位都留下；最后用分数表示未分尽的部分。',{interpret:'fraction',long:true}),div(80,15,'80人出发，每辆车坐15人。把车辆添到人人都有位置。',{interpret:'up',long:true}),div(34,5,'34米长绳，每段要完整的5米。最多能剪出几段？',{interpret:'down',long:true})],
 remainders:[div(12,3,'先把一个简单故事分清：12支笔，每包3支，有几包？'),div(52,9,'52人，每辆车9个座位。剩下的人也要坐车，要几辆？',{interpret:'up'}),div(52,9,'同样52颗，每袋必须正好9颗。最多装满几袋？',{interpret:'down'}),story([5,150],['5包','每包150分'],'每包6支铅笔，售价1.50元。买5包花多少元？',{money:true,plans:['(0*1)','(1*0)'],equations:['n=5×1.5','n=1.5×5']}),story([30,6,150],['需要30支','每包6支','每包150分'],'要买30支笔，每包6支、每包1.50元。自己选步骤，用n表示最后花多少元。',{money:true,plans:['((0/1)*2)','(2*(0/1))','((2/1)*0)','(0*(2/1))','((0*2)/1)','((2*0)/1)'],equations:['n=30÷6×1.5','n=1.5×(30÷6)','n=(30÷6)×1.5','n=30×1.5÷6']})],
 roundanswers:[div(59,16,'59÷16的结果保留一位小数。多算一位，再决定靠近哪边。',{interpret:'round',places:2,dp:1}),div(10,3,'10元平均分3份，报价记到分。先计算，再选合适的精度。',{interpret:'round',places:3,dp:2,choosePrecision:true}),div(80,15,'80人坐每辆15人的车。最接近的整数够坐吗？添车检查。',{interpret:'up'}),div(34,5,'34米绳剪成每段5米，6.8段能交付几个完整的5米？',{interpret:'down'})],
 factorlab:[structuredClone(T13.factorpairs[1]),search('multiples',[7],'从一份7开始，接出前五个正倍数。',{count:5}),search('commonFactors',[24,36],'分别找全24与36的因数，再选出两边共有的。'),search('commonFactors',[36,48],'换成36与48。1也别漏掉。'),search('multiples',[6,8],'两条路分别每次走6与8，找前三个相遇的正数。',{count:3,limit:72}),search('prime',[97],'97只有1和自身吗？先试到平方根附近，再下判断。')],
 factoruse:[search('divisible',[156],'156是不是6的倍数？把2、3、6都检查一次。',{divisors:[2,3,6],by:6}),search('divisible',[8],'8能被2整除，就一定能被6整除吗？',{divisors:[2,3,6],by:6}),search('divisible',[9],'9能被3整除，就一定能被6整除吗？',{divisors:[2,3,6],by:6}),{type:'x-squarepair',total:100,prompt:'找两个非零平方，拼起来正好100格。自己调整两块正方形的边长。'},story([24,25],['24','25'],'先把24拆成两个因子，再挑顺手的一对相乘。',{split:true})],
 parityrules:[parity(5,7,'+','两堆各有一颗落单的。先猜合起来怎样，再把它们配好。'),parity(347,129,'+','不先算总和，判断347+129会不会有落单的。看看两堆各剩下什么。'),parity(6,37,'×','6份37个，不先算总数。把整份两两作伴，看看剩不剩一份。'),parity(9,8,'+','换成一奇一偶，刚才的办法还会把所有颗粒配好吗？')],
 primetest:[search('prime',[1],'只有1个物品时，有几个不同的因数？它符合“恰好两个”吗？'),search('prime',[2],'2是偶数。它是不是恰好有两个不同因数？'),search('prime',[51],'51看起来是奇数，能不能排出不止一行的长方形？'),search('recallPrimes',[19],'选出1到19的全部质数，1要不要选进去？')],
 squarecube:[{type:'x-powerbuild',pow:2,base:7,prompt:'先猜7²，再亲自铺满7行7列。小小的2表示两个7相乘。'},{type:'x-powerbuild',pow:3,base:4,prompt:'先猜4³，再搭满4层，每层4行4列。可以转着看、拉开各层。'},search('squares',[10],'从1²到10²，逐个留下前十个正平方数。',{count:10})],
 factorcode:[sheet(6,5,0,'先做准备：第一格放6，下一格从前一格再加6。把规则延续到第五格。'),{type:'x-factorcode',n:24,mode:'factors',prompt:'把“从1开始、测试、记录、加1、到24停止”排成能执行的办法。'},sheet(6,10,4,'让表格列出6的前十个正倍数，再点亮其中也能被4整除的格子。'),{type:'x-factorcode',n:50,mode:'primes',prompt:'从1到50逐个数，测试每个数有几个因数，只留下恰好两个的。把办法排好再运行。'}],
 primeforest:[forest([360],'把360拆成两块，再继续拆，直到每一块都不能再拆。用幂写下结果。'),forest([24,36],'分别拆开24与36。把两边相同的质数一对对配好，再找公因数与公倍数。',{common:true}),forest([24,25],'24与25有共有的质数块吗？没有时，共同的因数仍有谁？',{common:true}),forest([60],'把60拆到底并保存；再用不同的第一刀重拆。最后的质数块会变吗？',{twice:true})],
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,ts])=>[id,structuredClone(ts[0])]));
const link=(from,to,title,left,right)=>({from,to,title,summary:'先做出两个操作，再看看前一个办法怎样用于后一个问题。',tasks:structuredClone([left,right]),phase:5,batch:'B14'});
// Only verified source edges are used; candidates are checked against the pinned graph.
export const BRIDGES=[];
export const addLink=(from,to,title,left,right)=>BRIDGES.push(link(from,to,title,left,right));
addLink('factorlab','factoruse','共同的伙伴，帮我判断6的倍数',search('commonFactors',[12,18],'先找12和18共同的因数。'),TASKS.factoruse[0]);
addLink('squarecube','factoruse','两块平方，刚好拼到100',TASKS.squarecube[0],TASKS.factoruse[3]);
addLink('writtenstart','shortproduct','把拆开的两块，记到一列里',area(23,4,'先把23×4拆成整十与零头。'),TASKS.writtenstart[2]);
addLink('tables12','shortproduct','借熟悉的小乘法，带上单位',structuredClone(T13.tables12[0]),mul(47,6,'每一位借小乘法，再把进位送到前面。',50));
addLink('mentalproducts','largerfacts','换成十作单位，答案怎样变',structuredClone(T13.mentalproducts[0]),TASKS.largerfacts[0]);
addLink('factorlab','factorcode','亲自找过，再把办法交给规则',search('commonFactors',[24,36],'先按顺序检查24和36。'),TASKS.factorcode[1]);
addLink('threeplaces','writtenstart','同一个2，带着十的单位',area(23,4,'23里的2是2个十；先拆成20与3。'),mul(23,4,'把20与3的计算按列记下来。',20));
addLink('tables348','writtenstart','从8的事实，接着分96',structuredClone(T13.tables348[0]),TASKS.writtenstart[1]);
addLink('mulsymbols','writtenstart','让图和竖着的记录说同一件事',structuredClone(T13.mulsymbols[0]),mul(12,3,'把同样12×3按位记录，仍是三份12。',10));
addLink('tables12','factorlab','乘法事实，也能倒着找伙伴',structuredClone(T13.tables12[0]),TASKS.factorlab[2]);
addLink('factorpairs','factorlab','长方形的两边，放进共同清单',structuredClone(T13.factorpairs[0]),TASKS.factorlab[2]);
addLink('shortdivide','divide16','每次分6个，换成每次16个',TASKS.shortdivide[0],TASKS.divide16[0]);
addLink('longdivide','divide16','展开算过，再挑自己的记法',div(4080,17,'先展开每次乘减，分完4080。',{long:true}),TASKS.divide16[1]);
addLink('tables12','squarecube','相同的两边，长成平方',structuredClone(T13.tables12[0]),TASKS.squarecube[0]);
addLink('shifttens','powerpattern','连续搬四次，也能写成幂',shift('1',2,'先连续扩大十倍两次。'),{...shift('1',4,'再做四次十倍变化，把它记成10⁴。'),mode:'scale',factors:true});
addLink('tenpattern','shifttens','整数量的搬家，也适用于小数',shift('300',1,'300扩大十倍，每个数字搬一格。'),TASKS.shifttens[1]);
addLink('missingfactor','shortdivide','先反找一份，再分更大的量',structuredClone(T13.missingfactor[0]),TASKS.shortdivide[1]);
addLink('mixedfacts','shortdivide','小乘法帮忙，逐位分清',structuredClone(T13.mixedfacts[0]),TASKS.shortdivide[0]);
addLink('bigproduct','box','一层乘层数，仍然需要放对单位',mul(24,12,'一层24块，12层。先用乘法把全部算出。',20),{type:'cube-plan',dims:[6,4,12],prompt:'同一箱每层6×4块，共12层。用一层×层数核对刚才的总量。'});
addLink('evenhalves','parityrules','两个落单的，再配成一对',parity(13,1,'+','13里落单的一颗，遇到另一颗会怎样？'),TASKS.parityrules[1]);
addLink('shortdivide','remainders','同一道除法，换一个用途',TASKS.shortdivide[1],TASKS.shortdivide[2]);
addLink('longproduct','remainders','先算有多少，再决定怎样装',mul(13,4,'4组各13人，一共多少人？',10),TASKS.remainders[1]);
addLink('shortproduct','longproduct','乘个位，接着乘整十',mul(34,7,'先计算34的7份。',30),TASKS.longproduct[1]);
addLink('roundprecise','roundanswers','算出更细的，再写需要的精度',div(13,4,'13÷4保留一位小数，遇到中点朝哪边？',{interpret:'round',places:2,dp:1}),TASKS.roundanswers[0]);
addLink('shifttens','shiftfine','同样搬三格，更细的位置也留住',TASKS.shifttens[2],TASKS.shiftfine[1]);
addLink('decimalplaces','shiftfine','每一个数字都带着自己的单位',shift('3.456',1,'3.456先扩大十倍，每个数字都移动。'),TASKS.shiftfine[0]);
addLink('shortdivide','longdivide','同一分法，展开检查每一步',div(125,8,'先紧凑地记下125÷8与余数。'),div(125,8,'改为展开乘减，最后把余下的平均分。',{long:true,interpret:'fraction'}));
addLink('bigproduct','longdivide','乘回去，是除法的一面镜子',mul(365,13,'先算365份13，留下各部分。',400),TASKS.longdivide[0]);
addLink('factorlab','primeforest','共同的因数，来自共同的质数块',TASKS.factorlab[2],TASKS.primeforest[1]);
addLink('longproduct','bigproduct','两行的位置，数字变多也一样',TASKS.longproduct[1],TASKS.bigproduct[0]);
addLink('factorlab','primetest','从找因数，到判断能否继续拆',TASKS.factorlab[5],TASKS.primetest[2]);
