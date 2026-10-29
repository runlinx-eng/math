import {TASKS as T06} from './b06.js';
import {TASKS as T07} from './b07.js';
import {TASKS as T10} from './b10.js';
import {TASKS as T11} from './b11.js';
import {TASKS as T13} from './b13.js';
import {TASKS as T14} from './b14.js';
import {TASKS as T29} from './b29.js';
import {TASKS as T16} from './b16.js';
import {TASKS as T17} from './b17.js';
import {TASKS as T23} from './b23.js';
import {TASKS as T25} from './b25.js';
const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B34'});
export const LESSONS={
 structure34:item('mt_FAXjFkgG6X','看见没有变的部分','数位、运算与图形结构','加整百时个位和十位不变；跨过整千时千位也会变化。乘法阵列转向后总数不变，图形可以按边和角的性质分类。','变了方向或单位，哪些关系仍然不变？'),
 repeat34:item('mt_WXW0hjNhph','一小段，怎样反复出现','重复图案与重复单元','重复图案由一个片段按相同次序接下去。要找最短重复片段，也可以自己决定片段并继续。有限开头可能符合不同规则。','怎样知道自己圈出的是更短的一组，而不只是更长的一段？'),
 linear34:item('mt_hBZwbst0ow','每一步都多同样的量','等差数列与逐项规则','从起点出发，每一步加同一个数或减同一个数；负数和小数也能沿同一规则继续。要找远处一项，可以从位置直接计算。','第10项要走几次，为什么不是10次？'),
 paired34:item('mt_fxPtngwUfz','两条路，一起往前','对应数列与坐标','两条数列从0开始，分别每次加3和加6，同一位置上的第二个数是第一个的两倍。换起点以后要重新检查；一对数可以放到坐标图上。','每一步是两倍，起点不一样时对应项还会一直是两倍吗？'),
 rules34:item('mt_yXO7lQ9Yn7','一条规则，走到远处','逐项规则与按位置生成','逐项规则从前一项走到下一项；按位置的规则从第几项直接算出它。固定差、固定倍数与其他变化需要分开看。','只看到开头几个数，怎样知道下一项一定是什么？'),
 notice34:item('mt_uG2mjHFOlO','换个顺序，数量变了吗','加法结构、十和图案','同一批东西交换两组的次序，总数不变；十几可以看成一个十和几个一。观察重复的次序才能预测下一处。','把两组交换位置，为什么数量不需要重新出现？'),
 general34:item('mt_fZTn0W_iZR','借熟悉的关系走一步','接近双倍、十位与变化规则','6+7可以看成6+6再加1。两位数减10时，十位减少一；按5递增时个位怎样变化要看起点。','每次加5为什么有时是0和5轮流，有时却不是？'),
 tables34:item('mt_2jbUekyTu4','把大的乘法拆成两块','倍数、阵列分解与增长','4的倍数都能两两配对；8×7可以分成8×5与8×2。重复加50可以向后走，也可以记录每一步。','把阵列切开后，为什么两块都仍然有8份？'),
 reason34:item('mt_iyovKgZC1q','从几个例子，到一条说法','多边形、数列和分数的概括','凸n边形从一个顶点可分成n−2个三角形，内角和为(n−2)×180°。除以非零n可写成a/n；约分后分母不一定还是n。有限例子不是一般证明。','6÷3能写成6/3，又等于2；分母为什么可以改变？'),
 shapeseq34:item('mt_A-FyLLLLzy','走着走着，藏着什么','数列与图案中的附加特征','从1开始每次加3，奇偶交替；从2开始每次加4始终为偶数。先说清产生每一项的规则，再观察隐藏的特征。','规则只说加4，为什么结果一直是偶数？'),
 trace34:item('mt_zQfWqImxva','让每个数走一条路','顺序、判断与停止条件','规则要说清起点、判断、下一步与何时停止。偶数减半、奇数加1的有限示例能追踪每一步；运行过几次并不证明所有输入都终止。','数字恰好是50时，会走“大于50”那一边吗？'),
 generate34:item('mt_QeKWt4BZn3','让规则自己长出一串数','生成数列的步骤与边界','从3翻倍直到结果超过100，会保留第一次超过100的数。不断加7并只留小于80的数，则应在下一次到80或更多之前停下。','“超过后停”与“不能到达之前停”，末尾会有什么不同？'),
 design34:item('mt_nx4a3kH-59','先安排步骤，再看看结果','分支、重复与可检查的算法','一个数同时符合两个条件时，必须留出两者都符合的类别。重复“乘2再加1”产生奇数；实际解释和一般证明需另行表达。','先检查3的倍数，会把同时是3和5倍数的15放到哪里？'),
 pairs34:item('mt_gu0NPDvlhY','怎样保证一对也不漏','有序列举与乘法原理','固定第一种选择，把第二种逐个配完；每个格子是一种不同组合。3种前菜和4种主菜能组成3×4种搭配。','把两种选择换个顺序，会不会变成新的搭配？')
};
export const SECTIONS=[{id:'pattern-shapes',title:'摆一摆，发现重复'},{id:'pattern-numbers',title:'数怎样一步步变'},{id:'pattern-rules',title:'改规则，看结果'}];
const route=(id,section,title,ids)=>({id,section,title,ids,packIds:['patterns'],themeId:'patterns',color:'#8b749e'});
export const ROUTES=[
 route('GQ','pattern-shapes','从一小段长下去',['repeat34','shapeseq34']),
 route('GR','pattern-shapes','找没变的关系',['structure34','notice34','general34']),
 route('GS','pattern-numbers','数列和两条路',['linear34','rules34','paired34']),
 route('GT','pattern-numbers','从阵列到一条说法',['tables34','reason34']),
 route('GU','pattern-rules','每一步和停止处',['trace34','generate34']),
 route('GV','pattern-rules','自己安排，再查遗漏',['design34','pairs34'])
];
const clone=x=>structuredClone(x),q=(label,value,kind='number',options)=>({label,value,kind,...(options?{options}:{})}),choice=(label,value,options)=>q(label,value,'choice',options);
const shapes=[{id:'circle',mark:'●',name:'圆',color:'#b06b65'},{id:'triangle',mark:'▲',name:'三角',color:'#5f8c8b'},{id:'square',mark:'■',name:'方',color:'#8b77a9'}];
const repeat=(prompt,unit,seed,need,questions=[])=>({type:'x-p34-repeat',prompt,unit,seed,need,symbols:shapes,questions});
const own=(prompt)=>({type:'x-p34-repeat',prompt,mode:'own',unitLength:2,seed:[],need:6,symbols:shapes,questions:[]});
const seq=(prompt,start,op,step,length,questions=[],extra={})=>({type:'x-p34-sequence',prompt,start,op,step,length,scale:1,questions,...extra});
const pair=(prompt,length,questions=[],extra={})=>({type:'x-p34-pair',prompt,length,dx:3,dy:6,questions,...extra});
const program=(prompt,mode,extra={})=>({type:'x-p34-program',prompt,mode,questions:[],...extra});
const grid=(prompt,rows,cols,questions=[])=>({type:'x-p34-grid',prompt,rows,cols,questions});
const growth=(prompt,known,target,questions=[])=>({type:'x-p34-growth',prompt,known,target,questions});
const ambiguity={type:'x-p34-ambiguity',prompt:'2、4、6的下一项是什么？先猜，再看看两条机器。',questions:[choice('只看前三项','multiple',[['multiple','可能有不止一种规则'],['only','下一项只有一种可能']]),q('规则A的下一项',8),q('规则B的下一项',10)]};
const classifyBlocks=[{id:'both',label:'先放3和5都有'},{id:'three',label:'再看3的倍数'},{id:'five',label:'再看5的倍数'},{id:'neither',label:'其余放另一组'}];
const loopBlocks=[{id:'repeat',label:'重复10次'},{id:'double',label:'每次先乘2'},{id:'plusone',label:'再加1'}];
export const TASKS={
 structure34:[
  clone(T07.shift100[2]),
  clone(T13.productways[0]),
  {...clone(T13.mulsymbols[1]),a:4,b:6,total:24,prompt:'24颗平均放到4份，写出对应的除法；它怎样接回刚才的6×4？'},
  clone(T23.lineproperties[2])
 ],
 repeat34:[
  repeat('圆、三角、圆、三角……再接三块。',['circle','triangle'],['circle','triangle','circle','triangle'],3,[q('最短的一组有几块',2)]),
  own('自己挑两种不同的形状组成一组，把这一组接三次。'),
  growth('三组积木依次是1、3、5块。按同样的增长，补出第四组。',[1,3,5],7,[q('第四组有几块',7),q('每次多几块',2)])
 ],
 linear34:[
  seq('从2.5开始，每次加1.5。把后面三项接出来。',25,'add',15,4,[q('每次加多少',1.5),q('第10项是多少',16)],{scale:10}),
  seq('从3开始，每次减2。走过0附近，接出四项。',3,'add',-2,4,[q('第四项',-3)]),
  seq('从5开始每次加4。先接几项，再想第10项。',5,'add',4,4,[q('第10项',41)])
 ],
 paired34:[
  pair('第一列从0每次加3，第二列从0每次加6。把对应的数配对，再在图上放点。',5,[choice('第二列与同一位置的第一列','twice',[['twice','第二列是两倍'],['plus','每次都只多3']])],{plot:true}),
  pair('换个起点：第一列从0加3，第二列从4加6。两倍关系还能直接照搬吗？',3,[choice('第二列是否总是第一列的两倍','no',[['no','不能直接这样说'],['yes','一定是两倍']])],{sy:4}),
  seq('第一列从0每次加3，单独继续四步。',0,'add',3,5,[q('第五项',12)])
 ],
 rules34:[
  seq('从2开始，每次加3，接出后面的数。',2,'add',3,4,[choice('相邻项相差','same',[['same','总是3'],['ratio','总是乘3']])]),
  seq('从2开始，每次乘3，接出后面的数。',2,'multiply',3,4,[choice('这次的变化','ratio',[['same','总是加3'],['ratio','总是乘3']])]),
  seq('第n项用3n−2算。先从第1项出发，再依次接到第5项。',1,'position',0,5,[q('第5项',13)],{a:3,b:-2}),
  clone(ambiguity)
 ],
 notice34:[
  {...clone(T10.swapadd[0]),a:3,b:2,prompt:'摆出3颗与2颗，交换两组的位置。总数变了吗？'},
  clone(T06.teenbuild[0]),
  repeat('圆和方依次轮流，接上后面两块。',['circle','square'],['circle','square','circle'],2,[q('重复的一组有几块',2)])
 ],
 general34:[
  {...clone(T10.tripleadd[1]),values:[6,6,1],prompt:'把6＋7看成6＋6＋1。先找一样多的两堆，再把1带上。'},
  {...clone(T11.tensmove[1]),values:[82,10],prompt:'82拿走一捆十，观察十位与个位怎样变化。'},
  seq('从0开始每次加5，接到20。看个位怎样交替。',0,'add',5,5,[choice('个位依次','zero-five',[['zero-five','0和5交替'],['two-seven','2和7交替']])]),
  seq('起点换成2，仍然每次加5。',2,'add',5,3,[choice('现在个位依次','two-seven',[['zero-five','0和5交替'],['two-seven','2和7交替']])])
 ],
 tables34:[
  seq('从0开始每次加4，接出4的倍数。看看每个数能否两两配对。',0,'add',4,5,[choice('这些数','even',[['even','都是偶数'],['odd','都是奇数']])]),
  clone(T13.derivepatterns[6]),
  seq('从50开始，每次加50。接出四项，再预测下一项。',50,'add',50,4,[q('下一项',250)])
 ],
 reason34:[
  clone(T25.polygonangles[1]),
  seq('从5开始每次加4。先接几项，再想第20项。',5,'add',4,4,[q('第20项',81)]),
  clone(T16.translateamount[0]),
  {type:'x-p34-relation',prompt:'6÷3能写成哪些相同的数？再看分母会不会一直是3。',cards:[{label:'6÷3',equal:true},{label:'6/3',equal:true},{label:'2',equal:true},{label:'2/1',equal:true},{label:'3',equal:false}],questions:[choice('约分后分母','change',[['change','可能改变'],['same','一定还是3']]),choice('除数为0时','invalid',[['invalid','不能这样除'],['yes','仍然能除']])]}
 ],
 shapeseq34:[
  seq('从1开始每次加3。接出五项，看看奇偶怎样变。',1,'add',3,5,[choice('奇偶变化','alternate',[['alternate','奇偶交替'],['even','一直是偶数']])]),
  repeat('圆、方、三角一组，接下来的三块是什么？',['circle','square','triangle'],['circle','square','triangle','circle','square'],3,[q('最短一组有几块',3)]),
  seq('从2开始每次加4，接出四项。每次加的是偶数。',2,'add',4,4,[choice('这些数','even',[['even','都是偶数'],['odd','奇偶交替']])])
 ],
 trace34:[
  program('从7开始：偶数减半，奇数加1，走到1停下。','walk',{start:7,questions:[q('一共走了几步',4),q('最后停在',1)]}),
  program('分别看34、50、51、80：大于50就减10，否则加10。','threshold',{inputs:[34,50,51,80],questions:[q('50走完变成',60),q('80走完变成',70)]}),
  program('把3、10、13、9依次分到“小于10”和“10或更多”。','sort10',{inputs:[3,10,13,9],questions:[q('小于10的有几个',2),q('10或更多的有几个',2)]})
 ],
 generate34:[
  program('从3开始不断翻倍；第一次超过100就停下，那个数也要留下。','double',{start:3,questions:[q('最后留下的数',192)]}),
  program('从0不断加7，只留下小于80的数；下一次不符合就停下。','add7',{start:0,questions:[q('最后留下的数',77),choice('84是否留下','no',[['no','不留下'],['yes','留下']])]}),
  seq('从0开始不断加5，看看这些5的倍数个位怎样变。',0,'add',5,5,[choice('个位','zero-five',[['zero-five','0或5'],['any','只能是其他数字']])])
 ],
 design34:[
  program('把1到30分成：3和5都符合、只符合3、只符合5、都不符合。排好判断次序再运行。','classify',{blocks:classifyBlocks,questions:[q('3和5都符合的有几个',2),choice('15应该先放','both',[['both','3和5都符合'],['three','只符合3']])]}),
  program('从1开始，重复10次：每次先乘2，再加1。把步骤排好并运行。','loop',{blocks:loopBlocks,questions:[q('第10次的新结果',2047),choice('每次结果','odd',[['odd','都是奇数'],['even','都是偶数']])]}),
  seq('从1开始，每次先乘2再加1。接出四项，看看奇偶。',1,'affine',0,4,[choice('乘2以后再加1','odd',[['odd','结果是奇数'],['even','结果是偶数']])],{a:2,b:1})
 ],
 pairs34:[
  grid('三种前菜与四种主菜，点亮所有不同搭配。',['汤','沙拉','水果'],['饭','面','饼','豆'],[q('一共几种搭配',12),q('用3×4得到多少',12)]),
  grid('换成两种饮料和三种点心。按行配完，再看看有没有漏掉。',['水','果汁'],['饼干','面包','水果'],[q('一共几种搭配',6)])
 ]
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,ts])=>[id,clone(ts.at(-1))]));
const link=(from,to,title,a,b)=>({from,to,title,summary:'先做前一个操作，再把同样的关系带到另一处。',tasks:[clone(a),clone(b)],phase:5,batch:'B34'});
export const BRIDGES=[
 link('general34','tables34','从变化走到倍数',TASKS.general34[2],TASKS.tables34[0]),
 link('paired34','representationmap','把对应关系换一种表示',TASKS.paired34[0],T16.representationmap[1]),
 link('tablepatterns','shapeseq34','比较不同步长里的重复变化',T13.tablepatterns[1],TASKS.shapeseq34[0]),
 link('tables34','derivepatterns','换一组数，再把阵列拆开',TASKS.tables34[1],T13.derivepatterns[0]),
 link('generate34','factorcode','从生成数列到检查倍数',TASKS.generate34[0],T14.factorcode[1]),
 link('lineorientation','structure34','从方向看哪些关系不变',T25.lineorientation[0],TASKS.structure34[3]),
 link('shapeseq34','paired34','从变化走到对应的两列数',TASKS.shapeseq34[0],TASKS.paired34[0]),
 link('shapeseq34','linear34','从图案走到每一步的变化',TASKS.shapeseq34[0],TASKS.linear34[1]),
 link('temperaturechange','linear34','温度变化与数列的步子',T29.temperaturechange[0],TASKS.linear34[1]),
 link('triangleangles','reason34','从三角形走到多边形',T25.triangleangles[1],TASKS.reason34[0]),
 link('linear34','reason34','从相邻项走到远处的项',TASKS.linear34[2],TASKS.reason34[1]),
 link('percentpatterns','reason34','从变化规则到远处的项',T17.percentpatterns[1],TASKS.reason34[1]),
 link('shapeseq34','percentpatterns','从每步变化走到按位置生成',TASKS.shapeseq34[0],T17.percentpatterns[1]),
 link('factorcode','design34','从倍数走到分类步骤',T14.factorcode[1],TASKS.design34[0]),
 link('shapeseq34','generate34','从偶数图案走到生成规则',TASKS.shapeseq34[2],TASKS.generate34[2]),
 link('mentalproducts','generate34','从乘法走到生成规则',T13.mentalproducts[0],TASKS.generate34[2]),
 link('trace34','generate34','从逐步执行走到停止条件',TASKS.trace34[0],TASKS.generate34[0]),
 link('teenbuild','notice34','换个数，再看一捆十',T06.teenbuild[2],TASKS.notice34[1]),
 link('linear34','rules34','从每一步走到生成规则',TASKS.linear34[0],TASKS.rules34[2]),
 link('tablepatterns','trace34','先把偶数分两份，再让数走一步',T13.tablepatterns[2],TASKS.trace34[0])
];
