import {TASKS as T10} from './b10.js';
import {TASKS as T12} from './b12.js';
import {TASKS as T16} from './b16.js';
import {TASKS as T17} from './b17.js';
import {TASKS as T34} from './b34.js';
const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B35'});
export const LESSONS={
 missing35:item('mt_ezc2m_0dzN','从这里走到那里，还差多少','加法中的未知数与减法','8加几到10，与10减8是在找同一个缺少的部分。可以从已知部分向目标走，再把找到的数放回原来的关系检查。','8＋□＝10和10−8＝□，为什么找到的是同一段？'),
 bigmissing35:item('mt_XuHmIn2xje','空着一格，也能找到路','较大数与多步问题中的未知数','245加135等于380；可以按整百、整十和一逐步走，也可以用减法寻找缺少的量。原式代回检查，数值大小和方法选择是两回事。','换个起点或空格的位置，怎样判断是在找哪一部分？'),
 twostep35:item('mt_anAe11HAEH','先做了两件事，怎么倒回来','两步问题与一元方程','把同一个数取3份再加5得到26，可以写成3x＋5＝26。先去掉5，再把剩下的量平分三份；最后把找到的数代回。','为什么要先处理加上的5，而不是先把26除以3？'),
 twounknown35:item('mt_YFS7JFk64p','一个关系，有多少对伙伴','二元一次等式与有范围的解','一个关系可能有很多对数。固定第一个数、依次换值并算伙伴，可以在明确的整数范围内检查是否有遗漏。交换位置是否新的一对，取决于两列代表的量。','如果不限制数的范围，还能把所有伙伴写完吗？'),
 equations35:item('mt_QhFEDyIwSO','让两边一起变化','一元一次方程与等量变换','等号两边表示同值。对两边做相同加减，或同乘同除非零数，可以保持等价；找到未知数后代回原式。答案也可能是负数或分数。','5−x＝6为什么可以得到负数，而不是先把5和6交换？'),
 writing35:item('mt_i9rJbuFO3p','把一件事写成一个关系','用字母列方程','字母表示一个数，不是物品的名字。先分清数量、先后动作和总量，再写等式；把数代回情境检查。','“先加5再翻倍”和“先翻倍再加5”，为什么不一样？'),
 notation35:item('mt_KwdjWEmMNo','字母旁边的数字在做什么','代数记号与运算顺序','3x表示3乘x，x²表示x乘x；x/2表示x除以2。括号把先做的部分圈在一起，代入一个具体数能检查读法。','当x＝3时，2x与x²各是多少？'),
 model35:item('mt_z5iwdZyeDr','同一个关系，换成表和图','从情境到代数、数表和图像','先说清字母代表什么数量，再按同一规则生成数对、放到图上。图中的点表示一对同时对应的数；坐标和单位不能随意交换。','一个点的位置，怎样对应故事里的两个数量？'),
 words35:item('mt_g_fkAqmz72','给刚才用到的东西起名字','代数式、方程、不等式与项','代数式表示一个值；方程和不等式分别用等号或不等号陈述关系。项、系数和因子分别描述表达式里的不同角色。','2x＋3与2x＋3＝7，为什么不是同一种写法？'),
 nth35:item('mt_HRKzwEQJgO','不用一项项走，也能到远处','等差数列的第 n 项','3、7、11、15每次加4；第n项为4n−1，n从1开始。已知位置可直接求数；想判断某个数是不是一项，还要检查对应位置是否为正整数。','每次加4，为什么第n项不是4n＋3？'),
 terms35:item('mt_nNNVrLqPW3','哪些能合在一起','同类项与合并','只有变量及其指数相同的项可以合并，符号随项一起保留。x、x²、y与常数各自有不同结构；结果仍可能包含好几项。','3x＋2y为什么不能直接写成5xy？'),
 expand35:item('mt_FX4a2Q8XXN','一份里的每部分，都要带上','单括号展开与分配律','括号外的一份乘数要作用于括号里的每一项。负号也参与乘法；展开后再合并同类项。符号表中的负数不表示物理负面积。','−2(x−3)为什么会有正6？'),
 factor35:item('mt_uESbzWCZIq','拆开以后，能不能再收起来','提取公因式与展开检验','共同因子可以从各项中提出，例如6x＋9＝3(2x＋3)。要把每一项都除以提出的因子，再乘回去检查；本活动只处理给定的有限例子。','为什么把2提出6x＋9并不能让括号里的两项都保持整数？'),
 double35:item('mt_KhS7K1Mgrw','两个括号，怎样一项都不漏','双括号展开与合并','每个括号中的每一项都要与另一边的每一项相乘。四格表记录四个乘积，符号一起计算，最后再合并同类项。','(x＋3)²为什么不能只写成x²＋9？'),
 systems35:item('mt_mqgu72aCMz','哪一个位置，两条线都经过','二元一次方程组的图像与代入','两条不同直线相交时，交点满足两条等式。平行直线没有共同点，重合直线有无穷多个；图上读出的近似位置还要代回两式。','只落在一条线上，为什么还不能说它满足两条关系？')
};
export const SECTIONS=[{id:'unknown-balance',title:'找出盒子里的数'},{id:'unknown-writing',title:'把关系写出来'},{id:'unknown-structure',title:'拆开，再收起来'}];
const route=(id,section,title,ids)=>({id,section,title,ids,packIds:['unknowns'],themeId:'patterns',color:'#8d779f'});
export const ROUTES=[
 route('GW','unknown-balance','从差多少开始',['missing35','bigmissing35']),
 route('GX','unknown-balance','两边一起变化',['twostep35','equations35']),
 route('GY','unknown-balance','找一对，再找交点',['twounknown35','systems35']),
 route('GZ','unknown-writing','从故事到符号',['writing35','notation35','words35']),
 route('HA','unknown-writing','同一个关系，换个样子',['model35','nth35']),
 route('HB','unknown-structure','先分类，再拆开',['terms35','expand35']),
 route('HC','unknown-structure','收起来，再展开',['factor35','double35'])
];
const q=(label,value,kind='number',options)=>({label,value,kind,...(options?{options}:{})});
const choice=(label,value,options)=>q(label,value,'choice',options),poly=(label,value,simplified=true)=>({...q(label,value,'poly'),simplified,placeholder:'平方可写成 x^2'}),eq=(label,left,right)=>q(label,[left,right],'equation');
const walk=(prompt,start,target,min,max,jumps,examplePath,questions)=>({type:'x-a35-walk',prompt,start,target,min,max,jumps,examplePath,questions});
const build=(prompt,questions)=>({type:'x-a35-build',prompt,blocks:[{id:'double',label:'乘2',op:'mul',value:2},{id:'plus5',label:'加5',op:'add',value:5},{id:'minus5',label:'减5',op:'sub',value:5}],required:['double','plus5'],example:6,target:17,questions});
const tryit=(prompt,display,a,b,right,solution,questions)=>({type:'x-a35-try',prompt,display,a,b,right,solution,questions});
const balance=(prompt,left,right,solution,exampleOps,questions)=>({type:'x-a35-balance',prompt,left,right,solution,exampleOps,questions});
const pairs=(prompt,ax,ay,total,xs,need,all,rangeLabel,questions)=>({type:'x-a35-pairs',prompt,ax,ay,total,xs,need,all,rangeLabel,questions});
const sort=(prompt,items,groups,questions)=>({type:'x-a35-sort',prompt,items:items.map(([label,group])=>({label,group})),groups:groups.map(([id,label])=>({id,label})),questions});
const term=(c,k)=>({c,k}),grid=(prompt,rows,cols,answer,negative=false,extra='')=>({type:'x-a35-grid',prompt,rows:rows.map(x=>term(...x)),cols:cols.map(x=>term(...x)),negative,extra,questions:[poly('把所有部分合起来',answer)]});
const factor=(prompt,display,terms,example)=>({type:'x-a35-factor',prompt,display,terms:terms.map(x=>term(...x)),example,questions:[]});
const plot=(prompt,lines,labels,max,step,kind,goal,example,questions)=>({type:'x-a35-plot',prompt,lines,labels,max,step,kind,goal,example,questions});
const algebrabar=(count,fixed,total,prompt)=>({type:'x-algebrabar',count,fixed,total,prompt});
const rule=(a,b,inputs,prompt,context)=>({type:'x-rulejump',a,b,inputs,exampleRule:[a,b,1],prompt,context});
const graph=(data,prompt)=>({...structuredClone(T16.representationmap[1]),data,maxX:4,maxY:8,xLabel:'袋数',yLabel:'总颗数',rate:2,prompt});
const signs=[['expr','没有等号或不等号'],['eq','两边用等号相连'],['ineq','两边用不等号相连']];
const buckets=[['x','x 的项'],['x2','x² 的项'],['y','y 的项'],['1','数字项']];
export const TASKS={
 missing35:[
  walk('已经有8颗，要到10颗：从8开始，走出还差的部分。',8,10,8,10,[1,-1],[1,1],[q('还差几颗',2),eq('写出加法关系','8+x','10')]),
  walk('这次已有7颗，要到15颗。走到目标，再用减法说还差多少。',7,15,7,15,[1,-1,2,-2],[2,2,2,2],[q('还差几颗',8),eq('把减法写成等式','15-7','8')]),
  tryit('8＋□＝10。放一个数进盒子，看看两边。','8＋x＝10',1,8,10,2,[choice('10−8与8＋□＝10','same',[['same','都在找缺少的部分'],['different','没有关系']])])
 ],
 bigmissing35:[
  walk('245还要加多少到380？可以走整百、整十，也可以走一个。',245,380,245,380,[100,-100,10,-10,1,-1],[100,10,10,10,1,1,1,1,1],[q('一共走了多少',135),eq('写出原来的关系','245+x','380')]),
  tryit('原来有一批，拿走125后还剩230。试出原来的数量。','x−125＝230',1,-125,230,355,[]),
  structuredClone(T12.plansteps[4])
 ],
 twostep35:[
  algebrabar(3,5,26,'同一盒有3份，再添5颗，一共26颗。摆出来，再找一盒。'),
  tryit('同一个数取3份再加5是26。把猜想放回去，再试试用10是否太大。','3x＋5＝26',3,5,26,7,[eq('写出故事的关系','3x+5','26'),q('如果用10，3份再加5是多少',35),choice('35与26比较','larger',[['larger','35更大'],['smaller','35更小']])]),
  algebrabar(2,4,20,'换成2个相同盒子，再添4颗，一共20颗。找一盒。')
 ],
 twounknown35:[
  pairs('两个正整数加起来是12。按允许的范围把所有伙伴找出来。',1,1,12,Array.from({length:11},(_,i)=>i+1),11,true,'1 到 11',[q('一共几对',11)]),
  pairs('第一数的2倍加第二数等于20。找出三对不同的整数。',2,1,20,Array.from({length:11},(_,i)=>i),3,false,'0 到 10',[choice('这条关系可以有几对数','many',[['many','可能有多对'],['one','只能有一对']])]),
  pairs('第一数的2倍加第二数等于8。第一数只在−2到2的整数中选，把这些伙伴找全。',2,1,8,[-2,-1,0,1,2],5,true,'−2 到 2 的整数',[q('这个范围里有几对',5)])
 ],
 equations35:[
  balance('3x＋5＝26。每一步让两边一起变化，找到x，再代回原式。',['3','5'],['0','26'],'7',[{op:'sub',value:'5'},{op:'div',value:'3'}],[]),
  grid('等式2(x＋3)＋x＝15。先拆括号，再把左边合起来。',[[2,'1']],[[1,'x'],[3,'1']],'3x+6',false,'+x'),
  balance('刚才左边变成3x＋6，现在让它等于15，两边一起变化并代回检查。',['3','6'],['0','15'],'3',[{op:'sub',value:'6'},{op:'div',value:'3'}],[]),
  balance('4x＋3＝2x＋11。两边都有x，也可以让两边一起减去相同的份数。',['4','3'],['2','11'],'4',[{op:'subx',value:'2'},{op:'sub',value:'3'},{op:'div',value:'2'}],[]),
  balance('5−x＝6。两边一起变化；找到数后代回，看看负数能不能成立。',['-1','5'],['0','6'],'-1',[{op:'sub',value:'5'},{op:'div',value:'-1'}],[]),
  balance('半个x再加3等于5。两边一起变化；除以1/2也是一种可试的操作。',['1/2','3'],['0','5'],'4',[{op:'sub',value:'3'},{op:'div',value:'1/2'}],[])
 ],
 writing35:[
  build('一个数先乘2再加5，结果是17。排好动作，试一个数，再把关系写下来。',[eq('写出等式','2x+5','17')]),
  algebrabar(3,0,24,'3个相同袋子合起来24颗。先摆好，再找一袋多少颗。'),
  sort('每张卡表示同一个问题的一种写法。把等式和不是等式的写法分开。',[['3x＝24','eq'],['3x','expr'],['24＝3x','eq']],signs.slice(0,2),[eq('把三份一共24写成等式','3x','24')])
 ],
 notation35:[
  sort('x表示一个数。把“乘几份”和“自己乘自己”分开。',[['3x','mul'],['2x','mul'],['x²','square'],['x/2','divide']],[['mul','乘几份'],['square','自己乘自己'],['divide','除成几份']],[q('当x＝3，2x是多少',6),q('当x＝3，x²是多少',9)]),
  sort('一个数先乘3再加2。把与它相同的写法放在一起。',[['3x＋2','same'],['2＋3x','same'],['3(x＋2)','other']],[['same','先乘3，再加2'],['other','先加2，再乘3']],[poly('用x写先乘3再加2','3x+2')]),
  tryit('当x＝4时，3x和x²哪个更大？先把数放进3x。','3x＝12',3,0,12,4,[q('3x的值',12),q('x²的值',16),q('x/2的值',2)])
 ],
 model35:[
  pairs('每袋2颗，还额外有1颗。先把0到3袋与总颗数配成一张表。',2,-1,-1,[0,1,2,3],4,true,'0 到 3',[poly('用x表示袋数，写总颗数','2x+1')]),
  graph([[0,1],[1,3],[2,5],[3,7]],'把刚才每袋2颗、另有1颗的记录放到图上；每增加一袋，多几颗？'),
  tryit('四袋、每袋2颗，另外还有1颗。把4放进关系，看看总数。','2x＋1＝9',2,1,9,4,[q('一共多少颗',9)])
 ],
 words35:[
  sort('把不同的写法放进合适的组。',[['2x＋3','expr'],['2x＋3＝7','eq'],['2x＋3＞7','ineq']],signs,[choice('有等号的是','eq',[['eq','等式'],['expr','单独的表达式']])]),
  sort('看清每张卡在这句话里的角色。',[['3x里的3','coefficient'],['3x＋2里的3x','term'],['3×x里的x','factor']],[['coefficient','乘在前面的数'],['term','被加减连接的一项'],['factor','参与相乘的一部分']],[q('3x里的系数',3)]),
  sort('从一个表达式出发，添上不同的关系。',[['x＋4','expr'],['x＋4＝9','eq'],['x＋4＜9','ineq']],signs,[eq('把x加4等于9写下来','x+4','9')])
 ],
 nth35:[
  rule(4,-1,[1,2,3,50,100],'3、7、11、15……搭一条从第几项直接到数的规则，再跳到50和100。','第一项3，每次加4'),
  tryit('这条规则是4n−1。99是不是其中一项？试试可能的位置。','4x−1＝99',4,-1,99,25,[]),
  rule(3,1,[1,2,10,30],'换成4、7、10……试出从位置到结果的规则。','第一项4，每次加3')
 ],
 terms35:[
  sort('把结构相同的项放在一起；x²不能和x当作同一种。',[['3x','x'],['−2x','x'],['2x²','x2'],['y','y'],['−3y','y'],['4','1'],['−1','1']],buckets,[poly('把可以合并的项写下来','x+2x^2-2y+3')]),
  sort('符号属于它后面的那一项。分组后再合起来。',[['4x','x'],['−7x','x'],['2y','y'],['5','1']],buckets,[poly('合并后','-3x+2y+5')]),
  sort('先看字母和次数，再判断能否合并。',[['x','x'],['x²','x2'],['2x','x'],['3y','y']],buckets,[poly('合并后','3x+x^2+3y')])
 ],
 expand35:[
  grid('3(2x＋5)：把3分别带到括号里的两项。',[[3,'1']],[[2,'x'],[5,'1']],'6x+15'),
  grid('−2(x−3)：连同符号，把两项都乘一次。',[[-2,'1']],[[1,'x'],[-3,'1']],'-2x+6',true),
  grid('2(x＋3)＋x：先填括号产生的两格，再把外面的x也合进去。',[[2,'1']],[[1,'x'],[3,'1']],'3x+6',false,'+x')
 ],
 factor35:[
  factor('6x＋9能提出什么最大的共同数字？写出括号，再展开检查。','6x＋9',[[6,'x'],[9,'1']],{factor:3,power:'1',inner:[2,3]}),
  factor('12x−18也能收成“共同部分 × 括号”。','12x−18',[[12,'x'],[-18,'1']],{factor:6,power:'1',inner:[2,-3]}),
  factor('8x²＋12x中，除了数字，还有共同的字母部分。','8x²＋12x',[[8,'x2'],[12,'x']],{factor:4,power:'x',inner:[2,3]})
 ],
 double35:[
  grid('(x＋3)(x−2)：四个相遇处都要乘，最后再合并。',[[1,'x'],[3,'1']],[[1,'x'],[-2,'1']],'x^2+x-6',true),
  grid('(x＋3)²是两个相同括号相乘。填完整张表，别漏中间两格。',[[1,'x'],[3,'1']],[[1,'x'],[3,'1']],'x^2+6x+9'),
  grid('(x−2)(x−3)：换成两个负数，再检查四个符号。',[[1,'x'],[-2,'1']],[[1,'x'],[-3,'1']],'x^2-5x+6',true)
 ],
 systems35:[
  plot('试几个位置：哪一对数同时落在两条线上？',[{m:-1,b:6},{m:1,b:0}],['y＝6−x','y＝x'],6,1,'unique',[3,3],[[0,6],[3,3]],[]),
  plot('换两条线。交点不在整数格上，可以写半格的位置试试。',[{m:-1,b:5},{m:1,b:0}],['y＝5−x','y＝x'],5,.5,'unique',[2.5,2.5],[[2,3],[2.5,2.5]],[]),
  plot('这两条线平行。试几个位置，看看能不能同时符合。',[{m:1,b:0},{m:1,b:1}],['y＝x','y＝x＋1'],5,1,'parallel',null,[[0,0],[1,2]],[choice('两条线的共同点','none',[['none','没有共同点'],['one','只有一个'],['many','有无数个']])]),
  plot('两条关系画成同一条线。试两个位置，比较共同点。',[{m:1,b:0},{m:1,b:0}],['y＝x','2y＝2x'],5,1,'coincident',null,[[0,0],[2,2]],[choice('两条线的共同点','many',[['none','没有共同点'],['one','只有一个'],['many','有无数个']])])
 ]
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,ts])=>[id,structuredClone(ts[0])]));
const link=(from,to,title,a,b)=>({from,to,title,summary:'把前面的关系带到另一个条件，再动手检查。',tasks:structuredClone([a,b]),phase:5,batch:'B35'});
export const BRIDGES=[
 link('rules34','nth35','从一步一步，到直接走到远处',T34.rules34[2],TASKS.nth35[0]),
 link('terms35','expand35','拆开以后，再把同类项合起来',TASKS.terms35[0],TASKS.expand35[2]),
 link('notation35','words35','认出符号，再给它们起名字',TASKS.notation35[0],TASKS.words35[1]),
 link('equations35','nth35','用等式检查某个数是不是一项',TASKS.equations35[2],TASKS.nth35[1]),
 link('expand35','double35','把一行拆成两行，逐格相乘',TASKS.expand35[0],TASKS.double35[0]),
 link('terms35','double35','从不同结构，到四格后的合并',TASKS.terms35[2],TASKS.double35[0]),
 link('writing35','notation35','从故事里的数量走到记号',TASKS.writing35[0],TASKS.notation35[1]),
 link('equations35','systems35','从一个未知数到同时满足两条关系',TASKS.equations35[0],TASKS.systems35[0]),
 link('twounknown35','systems35','先找和为6的数对，再看交点',pairs('先找出两数相加等于6的几对数。',1,1,6,[0,1,2,3,4,5,6],3,false,'0 到 6',[]),TASKS.systems35[0]),
 link('words35','terms35','先认出项，再比较哪些项能合并',TASKS.words35[1],TASKS.terms35[1]),
 link('expand35','equations35','先拆括号，再让等式两边一起变化',grid('把2(x＋3)拆成两项。',[[2,'1']],[[1,'x'],[3,'1']],'2x+6'),balance('刚才的2x＋6等于14；让两边一起变化，再代回检查。',['2','6'],['0','14'],'4',[{op:'sub',value:'6'},{op:'div',value:'2'}],[])),
 link('writing35','equations35','写下关系，再让两边一起变化',TASKS.writing35[0],balance('刚才的2x＋5等于17；让两边一起变化，再代回检查。',['2','5'],['0','17'],'6',[{op:'sub',value:'5'},{op:'div',value:'2'}],[])),
 link('expand35','factor35','先展开，再把同一个式子收起来',grid('先把3(2x＋3)拆成两项。',[[3,'1']],[[2,'x'],[3,'1']],'6x+9'),TASKS.factor35[0]),
 link('notation35','model35','从字母和运算，到一张对应表',TASKS.notation35[1],TASKS.model35[0]),
 link('jointhings','missing35','先合起来，再找缺少的部分',{...structuredClone(T10.jointhings[0]),a:8,b:2,prompt:'先把8颗和2颗合起来。'},TASKS.missing35[0]),
 link('takethings','missing35','拿走已知的，再从已知处走回来',{...structuredClone(T10.takethings[0]),a:10,b:8,prompt:'10颗拿走8颗，看看剩下的部分。'},TASKS.missing35[0]),
 link('storytwo','bigmissing35','把两步故事换成更大的数量',T12.storytwo[0],TASKS.bigmissing35[2]),
 link('storytwo','twostep35','把故事里的步骤换成相同的几份',T12.storytwo[1],TASKS.twostep35[0]),
 link('bigmissing35','plansteps','找缺少的量，再处理连续变化',TASKS.bigmissing35[0],T12.plansteps[2]),
 link('missing35','undoadd','把缺少的一段接回原来的关系',TASKS.missing35[0],T10.undoadd[2])
];
