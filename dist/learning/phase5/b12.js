import {TASKS as T10} from './b10.js';
import {TASKS as T11} from './b11.js';
const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B12'});
export const LESSONS={
 threepiles:item('mt_Eqk6oSbySH','三份故事，合成一整份','三个加数的情境与条形模型','每段表示故事里的一部分，合成整体时不能遗漏或重复。可以先选凑成十的两个部分；另外一个部分仍要加进来。算式里的每个数都要能在故事中找到对应。','如果把汽车、自行车和公交车合在一起，答案应该说多少辆什么？'),
 storytwo:item('mt_yTWxkzzoOZ','问的地方变了，怎么算','两步加减、未知量与比较问题','先看问的是结果、最开始的数量，还是中途变化的数量。同一句“拿走”，可能需要用加法倒着找原来的数量。比较多少时，差与两边的数量也不能混在一起。','同样是花掉12又找到5，问现在有多少与问最初有多少，计划哪里不同？'),
 plansteps:item('mt_CDa5AVakLE','先想两步，再动手','两步加减问题的计划与方法选择','可以先完成一个变化，也可以先合并同类变化；每个已知量都要在计划里发挥正确作用。每步保留中间量，最后回答原问题。方法是否顺手，要结合这些数和自己的理由来看。','先加两次要送出的数量，再从原来的一堆拿走，为什么也能算出剩余？'),
};
export const ROUTES=[{id:'BH',title:'把故事变成自己的计划',section:'act',packIds:['add-subtract'],themeId:'numbers',color:'#bd6b38',ids:['threepiles','storytwo','plansteps']}];
const parts=(values,labels,unit,prompt,extra={})=>({type:'x-storyparts',values,labels,unit,prompt,...extra});
const plan=(values,labels,signs,unit,prompt)=>({type:'x-storyplan',values,labels,signs,unit,prompt});
export const TASKS={
 threepiles:[
  parts([4,7,6],['红铅笔','蓝铅笔','绿铅笔'],'支','4支红铅笔、7支蓝铅笔、6支绿铅笔。搭出三段，再找一共有多少支。'),
  parts([3,9,7],['第一天','第二天','第三天'],'个','三天分别摘了3、9、7个苹果。先让能凑十的两份结伴，再带上剩下的一份。',{pairTotal:10}),
  parts([5,8,2],['汽车','自行车','公交车'],'辆交通工具','停车场有5辆汽车、8辆自行车、2辆公交车。让三段各代表一类，再看总共有多少辆交通工具。'),
 ],
 storytwo:[
  plan([35,12,5],['原来有','花掉','后来找到'],[1,-1,1],'元','原来有35元，花掉12元，后来又找到5元。现在有多少？自己选先算哪两份。'),
  plan([35,12,40],['原来有','后来收到','最后剩下'],[1,1,-1],'枚','原来有35枚贴纸，又收到12枚，送出一些以后剩40枚。送出了多少枚？'),
  plan([38,12,5],['现在有','花掉','后来找到'],[1,1,-1],'元','花掉12元，后来找到5元，现在有38元。最开始有多少？可以倒着把故事接回来。'),
  plan([46,8,29],['红票原有','红票用掉','蓝票现有'],[1,-1,-1],'张','红票原有46张，用掉8张；蓝票有29张。剩下的红票比蓝票多多少？'),
  plan([28,9,4],['小林现有','小安多的','小安送出的'],[1,1,-1],'颗','小林有28颗珠子，小安比他多9颗。小安送出4颗后，还剩多少？'),
  plan([46,8,9],['小安现有','小林少的','小林用掉的'],[1,-1,-1],'张','小安有46张卡片，小林比他少8张。小林又用掉9张，现在还有多少？'),
 ],
 plansteps:[
  {...structuredClone(T10.earlyunknown[2]),prompt:'先试一个小故事：12辆车开走一些，剩8辆。把开走的那一部分找出来，再检查能不能接回原来的12辆。'},
  plan([2450,1375,680],['仓库原有','今天收到','今天送出'],[1,1,-1],'箱','模拟仓库原有2450箱物品，收到1375箱，送出680箱。现在有多少箱？决定先算哪一步，再选你用的办法。'),
  plan([4300,1285,975],['原有纸张','上午用掉','下午用掉'],[1,-1,-1],'张','原有4300张纸，上午用掉1285张，下午用掉975张。还剩多少？可以先合并两次用量，也可以逐次算。'),
  plan([6000,1985,2015],['原有物品','第一批送出','第二批送出'],[1,-1,-1],'件','模拟仓库有6000件物品，先后送出1985件和2015件。选一条顺手的路，找剩余。'),
  plan([415,168,230],['开始有','卖出','后来运来'],[1,-1,1],'个','开始有415个苹果，卖出168个，又运来230个。最后比开始多就一定算错了吗？自己把变化接起来。'),
 ],
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,ts])=>[id,structuredClone(ts[0])]));
const link=(from,to,title,summary,tasks)=>({from,to,title,summary,tasks:structuredClone(tasks),phase:5,batch:'B12'});
export const BRIDGES=[
 link('earlyunknown','threepiles','故事再多一份','先找到故事里的部分，再表示三个部分合成整体。',[T10.earlyunknown[0],TASKS.threepiles[0]]),
 link('tripleadd','threepiles','凑十的伙伴，来自故事','选择的一对必须对应原来的三个部分。',[T10.tripleadd[0],TASKS.threepiles[1]]),
 link('flexhundred','storytwo','会计算，还要选对变化','计算路径接到由故事决定的加减计划。',[T11.flexhundred[0],TASKS.storytwo[0]]),
 link('earlyunknown','storytwo','藏起来的位置也能变化','从缺少的部分延伸到倒着找最开始的数量。',[T10.earlyunknown[2],TASKS.storytwo[2]]),
 link('columnfour','plansteps','大一点的数，也要先想计划','实际换单位后，再自己组织两个变化。',[T11.columnfour[3],TASKS.plansteps[1]]),
 link('plansteps','storylarger','自己的两步，接到更长的故事','两步计划连到已有的大数多步目标问题。',[TASKS.plansteps[2],T11.storylarger[2]]),
];
