import {TASKS as T15} from './b15.js';
import {TASKS as T16} from './b16.js';
import {TASKS as T24} from './b24.js';
import {TASKS as T30} from './b30.js';
import {TASKS as T34} from './b34.js';
import {TASKS as T35} from './b35.js';
const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B36'});
export const LESSONS={
 formula36:item('mt_Jvg8X0N5u0','换一个尺寸，会变成多少','简单公式与代入','长方形一圈是长和宽的和再乘2，三角形里面是底乘对应垂直高度再除以2。先看图中的量和单位，再把数放进关系。','底和斜边看起来都像边，为什么三角形面积要配垂直高度？'),
 coords36:item('mt_hVpGOEz2kG','在四个方向里找位置','四象限坐标','一个位置用两个数表示：先看横向x，再看纵向y。正负表示方向，数轴上的点不属于任何象限；半格也有自己的位置。','(−2,3)和(3,−2)为什么不是同一个点？'),
 substitute36:item('mt_vHzVa3SURC','把一个数放进关系','代数式与公式的数值代入','字母代表数；代入负数时用括号保留符号。先算平方，再乘除，最后加减；0、负数和分数也可以试。','(−2)²为什么和−2²不一样？'),
 linear36:item('mt_WBdHkc2HTf','改变一个数，线会怎样','一次函数图像、斜率与截距','y＝mx＋c中，m控制每往右一单位时y的变化，c表示x＝0时的值。线位置更高不代表变化更快；负斜率表示向右看时下降。','两条线中位置较高的那条，为什么不一定前进得更快？'),
 plot36:item('mt_-3udyo6VyB','点连起来，藏着什么变化','一次函数的数表、图像与斜率','先用同一规则生成数对，再把点放进坐标图；斜率是纵向变化除以横向变化。2x＋3y＝12可以改写为y＝4−2x/3。','只看线画得陡不陡，为什么还要注意两个轴各表示多少？'),
 rearrange36:item('mt_3qrCtdoVAU','把另一个量留在一边','公式变形与定义域','公式中的不同量可以互相寻找。对两边做保持等价的操作，注意除数不能为零；平方反推时可能有两个结果。','y＝x²而y＝9，为什么x可能是3，也可能是−3？'),
 quadratic36:item('mt_GZuoYaDdWd','为什么它弯了回来','二次函数图像与零点','负数和正数平方后可能得到相同的值。y＝x²−4的左右两侧对应，曲线与横轴交于−2和2；平方项系数为负时曲线向下开口。','从左到右逐项增加x时，每一步变化的幅度为什么先变小再变大？')
};
const route=(id,title,ids)=>({id,title,ids,packIds:['functions'],themeId:'patterns',color:'#6f9b91'});
export const ROUTES=[route('HD','从图形走到公式',['formula36','substitute36','rearrange36']),route('HE','在平面上找位置',['coords36','plot36']),route('HF','让图线跟着变化',['linear36','quadratic36'])];
const q=(label,value,kind='number',options)=>({label,value,kind,...(options?{options}:{})}),choice=(label,value,options)=>q(label,value,'choice',options),approx=(label,value,tolerance=.16)=>({label,value,kind:'approx',tolerance,example:Math.round(value*10)/10,placeholder:'填接近的数'});
const shape=(prompt,kind,initial,required,questions=[])=>({type:'x-f36-shape',prompt,kind,initial,required,questions});
const evaluate=(prompt,label,substitution,a,b,c,cases,questions=[])=>({type:'x-f36-eval',prompt,kind:'poly',label,substitution,a,b,c,cases:cases.map(x=>({x:String(x),label:'x＝'+String(x)})),required:cases.map((_,i)=>i),questions});
const physical=(prompt,cases)=>({type:'x-f36-eval',prompt,kind:'physical',label:'v＝u＋a×t',cases:cases.map(c=>({...c,label:`u=${c.u}，a=${c.a}，t=${c.t}`})),required:cases.map((_,i)=>i),questions:[]});
const coord=(prompt,mode,targets,questions=[])=>({type:'x-f36-coord',prompt,mode,targets,questions});
const live=(prompt,mode,initial,controls,required,questions=[])=>({type:'x-f36-live',prompt,mode,initial,controls,required,questions});
const plot=(prompt,label,a,b,c,xs,questions=[],extra={})=>({type:'x-f36-plot',prompt,label,a,b,c,xs,questions,...extra});
const form=(prompt,mode,display,subject,explain,example,questions,extra={})=>({type:'x-f36-form',prompt,mode,display,subject,explain,example,questions,...extra});
const sorter=(prompt,items,groups,questions=[])=>({type:'x-a35-sort',prompt,items:items.map(([label,group])=>({label,group})),groups:groups.map(([id,label])=>({id,label})),questions});
export const TASKS={
 formula36:[
  shape('先试长5、宽3的长方形，猜外边一圈；再把长改成6，重新猜。','rectangle',[5,3],[[5,3],[6,3]],[choice('一圈的单位','cm',[['cm','厘米'],['area','平方厘米']])]),
  shape('先试底6、高4的三角形，猜里面的大小；再把高改成5。','triangle',[6,4],[[6,4],[6,5]],[choice('里面的单位','area',[['cm','厘米'],['area','平方厘米']])]),
  evaluate('一个数先乘3再加2。分别把2和5放进去，算算结果。','3x＋2','3×({x})＋2',0,3,2,[2,5])
 ],
 coords36:[
  coord('放下(3,2)、(−2,3)、(−3,−2)、(2,−3)和轴上的(0,3)。','place',[[3,2],[-2,3],[-3,-2],[2,-3],[0,3]],[choice('(−2,3)在哪一边','second',[['first','右上'],['second','左上'],['third','左下'],['fourth','右下']])]),
  coord('读出图上那个点的位置：半格也要算进去。','read',[[-2.5,1.5]],[choice('这个点在','second',[['first','右上'],['second','左上'],['third','左下'],['fourth','右下']])]),
  coord('把(0,−3)放到图上。它在一条轴上，还是在某个象限里？','place',[[0,-3]],[choice('这个位置','axis',[['axis','在轴上'],['third','在左下象限'],['fourth','在右下象限']])])
 ],
 substitute36:[
  evaluate('把5、−2、0和1/2依次放进去。负数先放进括号，再算平方。','3x²−2x','3×({x})²−2×({x})',3,-2,0,[5,-2,0,'1/2']),
  evaluate('这次是负的平方：分别放入3和−3，看看符号在哪里。','−x²','−({x})²',-1,0,0,[3,-3],[q('如果改成(−3)²，结果是多少',9)]),
  physical('换个关系：v＝u＋a×t。把每组给定数放进去试试。',[{u:3,a:2,t:4},{u:5,a:-1,t:2}])
 ],
 linear36:[
  live('先留下“每步变化＝1”的线，再试2和−1。起点保持不变，比较线的方向。','linear',{m:1,c:1},['m'],[{m:1},{m:2},{m:-1}],[choice('每步变化为负时，从左往右看','down',[['down','线向下'],['up','线向上']])]),
  live('让每步变化保持1，分别留下起点为1、3和−1的线。线怎样移动？','linear',{m:1,c:1},['c'],[{c:1},{c:3},{c:-1}],[q('起点是3时，横向为0的位置有多高',3)]),
  sorter('把会画成直线和会画成曲线的关系分开。',[['y＝2x＋1','line'],['y＝x²','curve'],['y＝−x＋2','line'],['y＝−x²','curve']],[['line','直线'],['curve','曲线']]),
  live('把时间调到4。谁的位置更高？谁每次前进得更快？','speed',{time:0},['time'],[{time:4}],[choice('时间4时，谁位置更高','green',[['purple','紫色'],['green','绿色']]),choice('谁每次前进更快','purple',[['purple','紫色'],['green','绿色']])])
 ],
 plot36:[
  plot('按y＝2x＋1，从−1、0、1、2生成数对并放上图。','y＝2x＋1',0,2,1,[-1,0,1,2],[q('x每加1，y增加多少',2)]),
  form('把2x＋3y＝12写成“y＝……”。每一项都要除以3。','linear','2x＋3y＝12','y','可以写成 4−2/3x，也可以把整段放在括号里除以3。',{value:'4-2/3x'},[q('x＝3时，y是多少',2)],{expected:'4-2/3x',aliases:{},placeholder:'例如 4−2/3x'}),
  {type:'x-f36-ratio',prompt:'选两个点，从左边走到右边。分别记纵向和横向变化，再算它们的比。',points:[[-2,-3],[2,5]],questions:[q('纵向变化',8),q('横向变化',4),q('纵向变化 ÷ 横向变化',2)]}
 ],
 rearrange36:[
  sorter('先找出每条关系中，已经单独放在等号一边的量。',[['P＝2(l＋w)','P'],['A＝b×h/2','A'],['v＝u＋a×t','v']],[['P','P单独在一边'],['A','A单独在一边'],['v','v单独在一边']]),
  form('P＝2(l＋w)。把l留在一边，写出它和P、w的关系。','linear','P＝2(l＋w)','l','括号里的每一部分都要保留。',{value:'P/2-w'},[q('P＝16、w＝3时，l是多少',5)],{expected:'1/2x-y',aliases:{P:'x',w:'y'},placeholder:'例如 P/2−w'}),
  form('A＝b×h/2。把h留在一边，写出分子和分母。','fraction','A＝b×h/2','h','这里b不能为0；在真实三角形里底长为正。',{value:'2A',second:'b'},[q('A＝12、b＝6时，h是多少',4),choice('b＝0时能否使用这个除法','no',[['no','不能'],['yes','可以']])],{numerator:'2x',aliases:{A:'x'},denominator:'b'}),
  form('y＝x²。若y＝9，反过来找x；把可能的结果都留下。','roots','y＝x²，y＝9','x','先想想平方以后，两个相反的数会发生什么。',{value:'both',second:'3',third:'-3'},[choice('实数范围里，y＜0时','none',[['none','找不到实数x'],['one','总有一个实数x']])])
 ],
 quadratic36:[
  plot('按y＝x²−4把−3到3的数放进去；最后圈出图和横轴相交的两个点。','y＝x²−4',1,0,-4,[-3,-2,-1,0,1,2,3],[],{rootSelect:true,rootCount:2}),
  live('先留下平方前的数为1，再改为−1。比较曲线向哪边开口。','quadratic',{a:1,c:-2},['a'],[{a:1},{a:-1}],[choice('平方前的数为负时','down',[['up','向上开口'],['down','向下开口']])]),
  plot('换成y＝x²−2。先放五个点，再从图上估一估左右两个交点。','y＝x²−2',1,0,-2,[-2,-1,0,1,2],[approx('左边交点的x，大约',-Math.SQRT2),approx('右边交点的x，大约',Math.SQRT2)])
 ]
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,ts])=>[id,structuredClone(ts[0])]));
const link=(from,to,title,a,b)=>({from,to,title,summary:'把前面的关系带到另一种表示，再亲自检查。',tasks:structuredClone([a,b]),phase:5,batch:'B36'});
export const BRIDGES=[
 link('expressions','formula36','先合两部分，再把它们取两份',T15.expressions[0],TASKS.formula36[0]),
 link('formula36','triArea','先算三角形，再用两块拼回图形',TASKS.formula36[1],T30.triArea[1]),
 link('signedpoints','coords36','从一个负数点走到四个方向',T24.signedpoints[0],TASKS.coords36[0]),
 link('orderforms','coords36','先认数的正负，再找到平面位置',T16.orderforms[1],TASKS.coords36[2]),
 link('notation35','substitute36','从符号的意思到代入负数',T35.notation35[0],TASKS.substitute36[0]),
 link('substitute36','linear36','先代入几个数，再改变这条线',evaluate('先把−1、0、1放进x＋1。','x＋1','({x})＋1',0,1,1,[-1,0,1]),TASKS.linear36[0]),
 link('coords36','linear36','先找位置，再看一排位置形成的线',TASKS.coords36[0],TASKS.linear36[0]),
 link('linear36','plot36','先改变每步变化，再按规则放点',TASKS.linear36[0],TASKS.plot36[0]),
 link('plot36','quadratic36','先放直线上的点，再观察平方曲线',TASKS.plot36[0],TASKS.quadratic36[0]),
 link('plot36','systems35','先画y＝x，再找两条线的共同点',plot('按y＝x把0、1、2、3放成数对。','y＝x',0,1,0,[0,1,2,3]),T35.systems35[0]),
 link('rearrange36','plot36','先把关系改写，再按它放点',TASKS.plot36[1],plot('用刚才的y＝4−2x/3，在x为0、1.5、3时放点。','y＝4−2x/3',0,'-2/3',4,[0,1.5,3],[q('每往右3，y变化多少',-2)],{step:.5})),
 link('equations35','rearrange36','先让数值等式两边一起变，再整理公式',T35.equations35[0],TASKS.rearrange36[1]),
 link('substitute36','rearrange36','先平方相反数，再从平方结果找回来',evaluate('分别把3和−3放进平方里。','x²','({x})²',1,0,0,[3,-3]),TASKS.rearrange36[3]),
 link('model35','linear36','从2x＋1的数表走到变化的线',T35.model35[0],live('先留下每步变化为2的线，再试1；起点保持1。','linear',{m:2,c:1},['m'],[{m:2},{m:1}],[choice('每步变化越大，向右走一步','larger',[['larger','升得更多'],['smaller','升得更少']])]))
];
