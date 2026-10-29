import {TASKS as T06} from './b06.js';
import {TASKS as T09} from './b09.js';
import {TASKS as T11} from './b11.js';
import {TASKS as T14} from './b14.js';
import {TASKS as T15} from './b15.js';
import {TASKS as T16} from './b16.js';
import {TASKS as T17} from './b17.js';
import {TASKS as T23} from './b23.js';
import {TASKS as T24} from './b24.js';
import {TASKS as T25} from './b25.js';
import {TASKS as T28} from './b28.js';
import {TASKS as T30} from './b30.js';
import {TASKS as T34} from './b34.js';
import {TASKS as T36} from './b36.js';
const clone=x=>structuredClone(x),item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B39'});
export const LESSONS={
 pattern39:item('mt_RFeVlw0QvX','能不能猜到下一站','重复变化与数表规律','每次加2，起点是偶数就仍落在偶数，起点是奇数就仍落在奇数。百数表每行十个时，加10通常到下一行同列；加1到了行末要接到下一行开头。','如果不是从偶数开始，每次加2还会落在偶数上吗？'),
 structure39:item('mt__Itf4aQZUj','把大问题拆成熟悉的部分','分配律、位值与图形包含','7×13可以拆成7×10与7×3；每部分都保留7。乘10时每个数字代表的单位变成十倍，小数点不移动。正方形有四个直角，所以也是长方形。','把13拆开后，为什么两部分都要乘7？'),
 strategy39:item('mt_mQcWGh02no','遇到问题，先挑条路','计算与测量策略的选择','同一道计算可以用数的关系、写下步骤或计算器；方法是否顺手取决于数字、工具和自己。长距离可以用更长的尺，也可分段，但每段要接好。','同一个问题，换一种方法会让什么更容易看见？'),
 tools39:item('mt_d-WZC2OyMB','选个工具，再用另一种检查','计算、分数表示与面积核对','25×4可以利用25的4份；167×3也可以有多种方法。分数条和数轴能表示同一整体，方格数与长乘宽可以相互核对。','你会用哪一种表示让别人看见两个分数的大小？'),
 representations39:item('mt_IwEOCN6bL1','先看大概，再找更清楚的表示','策略选择、角度核对与分数基准','估角后可以对齐量角器再测量。用一半比较分数时，若两个都在同一边，单凭一半不能排出先后；换共同小份可以继续比较。','两个分数都比一半大，就能知道谁更大吗？'),
 graph39:item('mt_Yw27nweoTj','沿着线，读出一个大概','图像读数、交点与情境解释','读图先看横纵坐标和每格大小。曲线与横轴相交的横坐标是对应高度为0的解；两条线相交时，两边的值相同。图上读数通常是近似值。','只找到一个交点，能确定另一边没有吗？'),
 calculator39:item('mt_ish_uH8vZe','计算器给出结果，还要看什么','计算器输入、估计与核对','先估计数量级，再检查计算器里的数字、运算符与结果。1468＋2975＋813＝5256；83×5＝415，4150离约400很远，应重新检查。估计接近也不能证明精确无误。','如果计算器显示的数不合理，可能是哪一步出了问题？'),
 tooladv39:item('mt_ZJC7JnnPCu','问题变大，工具要不要换','长除法、坐标核对与体积公式','数量多时可以考虑公式、分层或逐项计数；选择取决于问题和自己。4752÷13＝365余7；坐标图能把平移前后的位置放在同一张图上。','数方块和用公式结果不同时，你会怎样重新检查？')
};
const route=(id,title,ids)=>({id,title,section:'reasoning-plan',ids,packIds:['reasoning'],themeId:'patterns',color:'#9c8b9c'});
export const ROUTES=[route('HU','看见重复和熟悉的结构',['pattern39','structure39']),route('HV','为问题挑一条路',['strategy39','tools39','representations39']),route('HW','读图、估计与检查',['graph39','calculator39','tooladv39'])];
const chart=(prompt,start,step,count,judgment=null)=>({type:'x-s39-chart',prompt,start,step,count,judgment});
const graph=(prompt,mode,extra={})=>({type:'x-s39-graph',prompt,mode,graph:'curve',xMin:-3,xMax:3,yMin:-4,yMax:5,offset:-4,tolerance:.25,...extra});
const choose=(prompt,display,operator,operands,result)=>({type:'x-s39-choose',prompt,display,operator,operands,result});
const calc=(prompt,operator,operands,result,estimateExample,estimateRange,extra={})=>({type:'x-s39-calc',prompt,operator,operands,result,estimateExample,estimateRange,exampleEntry:operands.join(operator),...extra});
const area={...clone(T15.mentalchoices[0]),a:7,b:13,prompt:'把7×13拆开。13可以分成10和3，两块各有多少？也可以试别的分法。'};
const shift={...clone(T14.shiftfine[0]),start:'2.5',step:1,prompt:'2.5乘10，数字各自走到什么单位？小数点仍在原来的位置。'};
const fractions={...clone(T16.smallershare[2]),left:[3,8],right:[1,4],prompt:'同一个整体取3/8与1/4。先猜，再用纸带叠一叠。'};
const sameSide={...clone(T17.fractionbench[0]),cards:['5/8','4/7'],prompt:'5/8和4/7都在一半以上。换成共同的小份，再比较大小。'};
const angle={...clone(T25.angleprotractor[0]),amount:130,prompt:'刚才估过开口。现在把量角器对准同一个角，看看实际刻度。',questions:[{label:'这个角是多少度',value:130}]};
const box={type:'cube-plan',dims:[4,3,5],prompt:'一层4×3，一共5层。用数每层与相乘两种说法核对整箱。'};
export const TASKS={
 pattern39:[chart('从2出发，每次加2，猜接下来的三站。',2,2,3,'even'),chart('起点改成3，每次加2。这次停在哪里？',3,2,3,'odd'),chart('从19开始每次加1。经过行末后会去哪里？',19,1,2),chart('百数表每行10个数。从24出发，每次加10。',24,10,3)],
 structure39:[area,shift,clone(T23.quadsort[0]),clone(T23.quadsort[3])],
 strategy39:[choose('345＋200，你想怎样算？','345＋200','+',[345,200],545),choose('换成345＋278。还想用同一种方法吗？','345＋278','+',[345,278],623),clone(T28.lengthtools[0]),clone(T09.toolchoice[4]),clone(T09.toolchoice[0])],
 tools39:[choose('25×4，你会怎样算？','25×4','*',[25,4],100),choose('换成167×3。你可以继续选自己的方法。','167×3','*',[167,3],501),fractions,choose('长4厘米、宽3厘米，先算4×3。','4×3','*',[4,3],12),{...clone(T30.gridarea[1]),prompt:'刚才算出4×3。铺满3行、每行4格，再数一数能否对上。'}],
 representations39:[choose('25×40，用自己选的方法算。','25×40','*',[25,40],1000),choose('换成347×26，你想换一种方法吗？','347×26','*',[347,26],9022),clone(T25.angleestimate[0]),angle,clone(T17.fractionbench[2]),sameSide],
 graph39:[graph('沿着曲线找到横向1.5的位置，读出纵向大约是多少。','read',{targetX:1.5,answerLabel:'纵向大约是多少'}),graph('曲线和横轴在哪里相遇？两边都找一找。','roots',{offset:-2,targets:[-Math.SQRT2,Math.SQRT2],tolerance:.16}),graph('曲线与另一条线在哪些位置相遇？','intersection',{targets:[(1-Math.sqrt(17))/2,(1+Math.sqrt(17))/2],tolerance:.16}),graph('这是模拟行走记录。第2.5小时离出发点多远？水平的一段说明什么？','journey',{graph:'journey',xMin:0,xMax:5,yMin:0,yMax:8,points:[[0,0],[2,4],[3,4],[5,8]],targetX:2.5,tolerance:.2,xLabel:'时间（小时）',yLabel:'路程（千米）',answerLabel:'大约走到多少千米',judgment:'stopped'})],
 calculator39:[calc('1468＋2975＋813，先估个大概，再用计算器核对。','+',[1468,2975,813],5256,5300,[4000,6500]),choose('400×3，选你喜欢的办法。','400×3','*',[400,3],1200),choose('387×46，这次你想怎样算？','387×46','*',[387,46],17802),calc('83×5，有人得到4150。先估，再检查输入和结果。','*',[83,5],415,400,[300,500],{candidate:4150})],
 tooladv39:[clone(T14.longdivide[0]),clone(T24.pointmove[0]),box]
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,ts])=>[id,clone(ts.at(-1))]));
const link=(from,to,title,a,b)=>({from,to,title,summary:'把前面的想法带到另一个实际操作里。',tasks:[clone(a),clone(b)],phase:5,batch:'B39'});
export const BRIDGES=[
 link('skipbasic','pattern39','从一双一双数到百数表的跳跃',T06.skipbasic[0],TASKS.pattern39[0]),
 link('pattern39','general34','从每次加十走到个位的变化',TASKS.pattern39[3],T34.general34[2]),
 link('structure34','structure39','从阵列的结构走到拆开乘法',T34.structure34[1],TASKS.structure39[0]),
 link('structure39','structurechoices','从拆开一条边走到挑选因子',TASKS.structure39[0],T17.structurechoices[0]),
 link('toolchoice','strategy39','从不同工具走到自己选算法',T09.toolchoice[0],TASKS.strategy39[0]),
 link('strategy39','tools39','换一组数，仍可自己挑方法',TASKS.strategy39[1],TASKS.tools39[1]),
 link('tools39','representations39','纸带比较，换到一半作参照',TASKS.tools39[2],TASKS.representations39[4]),
 link('representations39','tooladv39','从选表示走到用坐标检查',TASKS.representations39[5],TASKS.tooladv39[1]),
 link('plot36','graph39','从自己放点走到读出曲线',T36.plot36[0],TASKS.graph39[0]),
 link('quadratic36','graph39','换一条曲线再找两个交点',T36.quadratic36[2],TASKS.graph39[1]),
 link('checkrough','calculator39','先估，再检查计算器结果',T11.checkrough[0],TASKS.calculator39[3]),
 link('calculator39','calculatormeaning','从核对输入走到情境里的结果',TASKS.calculator39[0],T15.calculatormeaning[2]),
 link('longdivide','tooladv39','从逐步除法走到坐标核对',TASKS.tooladv39[0],TASKS.tooladv39[1])
];
