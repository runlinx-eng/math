import {TASKS as T02} from '../phase4/b02.js';
import {TASKS as T08} from './b08.js';
import {TASKS as T09} from './b09.js';
import {TASKS as T11} from './b11.js';
import {TASKS as T16} from './b16.js';
import {TASKS as T17} from './b17.js';
import {TASKS as T24} from './b24.js';
import {TASKS as T28} from './b28.js';
const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B29'});
export const LESSONS={
 lengthstory:item('mt_DLcEzmmj2r','哪一段还不知道','长度情境中的部分、整体与未知数','先把一整段和已知的一段摆出来。未知的可能是剩下的一段，也可能是原来较短的那一段；用 □ 表示未知量，同一个关系可以从加法或减法记录。','故事里出现“更长”，为什么有时要减才能找到较短的那一段？'),
 measurecalc:item('mt_6oxQPNLHNv','量出来，再接起来','同单位测量与加减','先对齐尺的零刻度，或让天平两边平衡；记录数值和单位。合起来与相差多少是不同的问题，算之前要确认各段使用同样大小的单位。','250 mL 和 400 mL 合起来时，650 后面为什么要保留 mL？'),
 practicalmeasure:item('mt_5HV4mbgSGH','分一分，时间往前走','小数、分数与测量情境','2.5 kg 是 2500 g，分成四份，每份 625 g，也就是 0.625 kg。时间按 60 分钟进一小时；小数长度相接时保持同一个单位。','一小时四十五分钟，为什么不能直接写成 1.45 小时？'),
 temperaturechange:item('mt_RVK655t391','从零这边走到另一边','有向数量与跨零间隔','零是标尺上的一个位置，不是额外的一步。从 3℃ 到 −5℃，先走 3 度到零，再走 5 度到终点，共相差 8 度；距离是非负的。','从 3 到 −5，为什么相差 8，而不是 5−3？')
};
const route=(id,section,title,ids)=>({id,section,title,ids,packIds:['units'],themeId:'measure',color:'#6c9479'});
export const ROUTES=[route('FT','units-compare','把长度故事摆出来',['lengthstory','measurecalc']),route('FU','units-change','分给每份，走过零',['practicalmeasure','temperaturechange'])];
const tape=(prompt,whole,known,knownSide,leftLabel,rightLabel)=>({type:'x-m29-tape',prompt,whole,known,knownSide,leftLabel,rightLabel,wholeLabel:'原来的整段',unit:'cm'});
const combine=(prompt,parts,names,unit,opts={})=>({type:'x-m29-combine',prompt,parts,names,unit,scale:1,mode:'join',...opts});
const share=(prompt,total)=>({type:'x-m29-share',prompt,total,people:4});
const interval=(prompt,start,end,unit)=>({type:'x-m29-interval',prompt,start,end,unit});
const order=(prompt,values)=>({type:'x-m29-order',prompt,values});
const clock=(prompt,start,duration)=>({type:'x-m29-clock',prompt,start,duration});
const clone=x=>structuredClone(x);
export const TASKS={
 lengthstory:[
  tape('一根绳原来 45 cm，剪掉 18 cm。把已知的一段摆出来，剩下多长？',45,18,'left','剪掉','剩下 ?'),
  tape('一根绳原来 45 cm，现在剩 27 cm。把剩下的一段摆出来，剪掉了多少？',45,27,'left','剩下','剪掉 ?'),
  tape('小米的带子长 42 cm，比小安的长 12 cm。摆出多出的那段，小安的带子多长？',42,12,'right','小安 ?', '多出 12')
 ],
 measurecalc:[
  clone(T28.lengthstart[1]),
  {...clone(T28.readscales[3]),prompt:'尺上每厘米分成 10 小格。先读出厘米，再用毫米说同一段长度。',questions:[{label:'这段相当于多少 mm',value:127}]},
  {type:'x-m28-balance',mode:'weigh',prompt:'把砝码放上模拟天平，让这袋东西平衡，再用 g 记录。',mass:700,unit:'g',weights:[100,200,500],exampleWeights:[500,200],object:'一袋东西',questions:[]},
  {type:'x-m28-scale',prompt:'模拟秤的指针指在 2 和 3 kg 正中间。读出这袋东西的质量。',kind:'dial',value:2.5,unit:'kg',min:0,max:4,major:1,questions:[]},
  combine('250 mL 果汁与 400 mL 果汁倒在一起，一共有多少？',[250,400],['第一杯','第二杯'],'mL'),
  combine('两袋分别是 500 g 和 350 g。摆到同一起点，较重的多多少？',[500,350],['甲袋','乙袋'],'g',{mode:'difference'})
 ],
 practicalmeasure:[
  {...clone(T28.metricconversions[2]),prompt:'一袋面粉 2.5 kg。先把它换成 g，方便接下来分份。',rows:[{value:2.5,from:'kg',to:'g',expected:2500}],hint:'1 kg = 1000 g。'},
  share('2.5 kg 面粉平均分给 4 份。先用克分完，再用 kg 记录每份。',2500),
  clock('09:20 出发，路上走 1 小时 45 分钟。自己分段向前走，几点到达？',560,105),
  combine('三条带子分别长 0.75 m、1.2 m、0.95 m。按同一尺度接起来。',[75,120,95],['带子一','带子二','带子三'],'m',{scale:100}),
  share('换成 3 kg，同样平均分 4 份。每份和刚才相比怎样变化？',3000)
 ],
 temperaturechange:[
  interval('模拟温度从 3℃ 降到 −5℃。沿标尺走到终点，一共降了多少度？',3,-5,'℃'),
  interval('模拟余额从欠 120 元变为有 350 元。跨过零，一共相差多少元？',-120,350,'元'),
  order('把 −7、−3、0、2、5 按从小到大的顺序放到数轴上。',[-7,-3,0,2,5]),
  interval('从 −7 走到 5，经过零。一共走过多少个间隔？',-7,5,'格'),
  interval('模拟温度从 −2℃ 降到 −8℃。这次没有跨过零，相差多少度？',-2,-8,'℃')
 ]
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,ts])=>[id,clone(ts.at(-1))]));
const link=(from,to,title,summary,a,b)=>({from,to,title,summary,tasks:[clone(a),clone(b)],phase:5,batch:'B29'});
export const BRIDGES=[
 link('lengthdifference','lengthstory','长多少，变成找一段','先对齐比较长度，再把已知与未知放回整段。',T28.lengthdifference[0],TASKS.lengthstory[0]),
 link('flexhundred','lengthstory','会算，还要找到对应的段','把百以内加减带进一段绳子的故事。',T11.flexhundred[0],TASKS.lengthstory[1]),
 link('ordermeasure','measurecalc','比大小，再算差','先比较同单位长度，再看两份质量相差多少。',T28.ordermeasure[0],TASKS.measurecalc[5]),
 link('measure','measurecalc','对准零，再记录','从实际移动尺子到同样按零刻度记录。',T02.measure[0],TASKS.measurecalc[0]),
 link('measurecalc','baseconversions','量的大小和单位名字','先合并同单位水量，再看一段路换单位。',TASKS.measurecalc[4],T28.baseconversions[0]),
 link('measurecalc','precisefractions','记录数字，也说清单位','先记录质量，再用分数准确表示一段量。',TASKS.measurecalc[2],T16.precisefractions[0]),
 link('measurecalc','capacity','装进去的量和能装多少','先接水量，再估计容器容量并倒满。',TASKS.measurecalc[4],T02.capacity[0]),
 link('decimalnames','practicalmeasure','小数的名字，带回测量','先给小数找到位置，再将面粉公平分份。',T17.decimalnames[2],TASKS.practicalmeasure[1]),
 link('metricconversions','practicalmeasure','换成相同单位再分','先换质量单位，再用克分给每一份。',T28.metricconversions[2],TASKS.practicalmeasure[1]),
 link('practicalmeasure','unitstories','分好一份，再换单位','先平均分，再看不同数量如何统一单位。',TASKS.practicalmeasure[1],T28.unitstories[0]),
 link('negativecontext','temperaturechange','经过零，数出走了多远','先从负数位置走，再计算两个位置的间隔。',T09.negativecontext[1],TASKS.temperaturechange[0]),
 link('temperaturechange','signedwalk','走过零，再记录方向','先数跨零的距离，再自己表示变化的方向。',TASKS.temperaturechange[0],T09.signedwalk[0]),
 link('temperaturechange','signedpoints','零两边的位置，放进坐标','先比较跨零距离，再找平面上的负数位置。',TASKS.temperaturechange[3],T24.signedpoints[0]),
 link('temperaturechange','orderforms','位置先排好，再比较','先把负数放在线上，再用符号表达顺序。',TASKS.temperaturechange[2],T16.orderforms[0]),
 link('temperaturechange','tenmillion','同样的方向，换成更深的位置','先跨零走一段，再比较几处模拟深度。',TASKS.temperaturechange[3],T08.tenmillion[1])
];
