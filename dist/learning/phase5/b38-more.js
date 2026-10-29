import {TASKS as T02} from '../phase4/b02.js';
import {TASKS as T05} from '../phase4/b05.js';
import {TASKS as T06} from './b06.js';
import {TASKS as T09} from './b09.js';
import {TASKS as T10} from './b10.js';
import {TASKS as T11} from './b11.js';
import {TASKS as T12} from './b12.js';
import {TASKS as T13} from './b13.js';
import {TASKS as T14} from './b14.js';
import {TASKS as T16} from './b16.js';
import {TASKS as T23} from './b23.js';
import {TASKS as T24} from './b24.js';
import {TASKS as T28} from './b28.js';
import {TASKS as T29} from './b29.js';
import {TASKS as T30} from './b30.js';
import {TASKS as T31} from './b31.js';
import {TASKS as T32} from './b32.js';
import {TASKS as T33} from './b33.js';
import {TASKS as T35} from './b35.js';
import {TASKS as T37} from './b37.js';
const clone=x=>structuredClone(x),item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B38'});
export const LESSONS={
 words38:item('mt_lMz9nAs7VO','说清多少、形状和位置','比较、形状与位置词','比较时说清谁比谁多；数直边与角点可以描述形状；说位置时要让对方知道参照物。','换个观察位置，左和右会不会改变？'),
 communicate38:item('mt_TMoHjMhRS2','一句话少了什么','等号、单位与几何词','等号两边表示相同的量，答案可以在左边。测量结果要带单位；面、棱和顶点是立体上不同的部分。','只写一个12，别人知道你量的是长度还是面积吗？'),
 precise38:item('mt_mywsN77hGZ','换个说法，还是同一个量','分数、面积单位与时刻','四分之三说的是同一整体平均分四份取三份。面积用平方单位；下午3:45与15:45是同一个时刻的不同写法。','如果只写3:45，别人能知道是上午还是下午吗？'),
 term38:item('mt_xfwv0M83mJ','这些名字，指的是谁','因数、倍数、面积体积单位与平方','4×6＝24时，4和6是24的因数，24是4和6的倍数。铺平面用平方单位，填空间用立方单位；5²表示5×5。','一个数可以同时是另一个数的倍数，又是第三个数的因数吗？'),
 advancedWords38:item('mt_3rTIyJDw7-','圆上的线与算式的名字','半径、直径、周长及表达式、等式和公式','半径连接圆心与圆周，直径经过圆心并连接圆周两端；周长是圆边的长度。等式表示相等，公式则说明可反复使用的关系。','看见等号时，怎样判断这条关系是在说明什么？'),
 tools38:item('mt_20WfHhnL39','先挑工具，再试一试','选择表示工具并组织数量','同一个数量可以用圆片、十格或条形表示。工具有没有帮忙，要看它是否让当前关系更容易看清。','这次你选的画法，帮你看清了什么？'),
 sense38:item('mt_WkKkb7W9Qd','先看它究竟在问什么','理解问题、表示和检查','先分清已经知道的与想找的，再用图或动作表示。得到结果后，把它放回故事里检查是否说得通。','如果故事里多了一条没用的信息，你会怎样处理？'),
 story38:item('mt_IM1G_7QzTa','故事和图，怎样互相翻译','生活情境、动作与运算','东西合起来可以用加法表示，拿走可以用减法表示。图和算式需要和故事中的动作及数量一一对应。','同一张图，能不能讲出两个不同但都说得通的故事？'),
 objects38:item('mt_fLOkq-HfPB','让图替故事说话','用对象和图表示生活问题','用圆片或图表示故事时，每一部分都要对应故事中的量；算式、图和问题要说同一件事。','如果把图里的某一堆拿走，故事里发生了什么？'),
 lifemath38:item('mt_f67qGDhyfi','把算出来的数送回故事','长度、钱与多步情境建模','同一个数放回故事时要说清它代表什么、使用什么单位。画出各部分有助于区分已知、变化和要找的量。','27是什么意思？它是剪掉的长度，还是剩下的长度？'),
 model38:item('mt_8xVHooT4aI','食谱、房间和折扣','配方、比例图、面积与折扣建模','先把现实里的量变成数学关系，再把结果带回原来的单位。配方按份数缩放，房间面积看两个方向，折扣先找原价。','如果人数加一半，材料是多半份，还是每样只多半克？'),
 modelChoice38:item('mt_yqZiX6vS7D','同一个问题，选哪张图','比例、体积与测量精度建模','比例、体积和测量适合不同的表示；结果要带回情境。取整到哪里取决于测量方法和实际需要。','装人的车数和测量一根绳子的长度，能用相同的取整方式吗？'),
 plan38:item('mt_O_UOTiMvT_','先定方向，再看结果','已知未知、策略与合理性检查','先找到已知量和想求的量，再尝试一种办法；算完可以换一种方式或用估计检查。','一个结果看起来差不多，能保证它一定准确吗？'),
 multi38:item('mt_RKeheOL9uo','两步之间，不要丢掉中间量','两步问题、估计与反向检查','把一件事拆成小问题时，中间结果也要说明它代表什么。估计能发现明显不合理的量级，反向计算可以再核对。','估计接近结果，与结果精确无误，是同一回事吗？'),
 multiShape38:item('mt_SmghasIvbT','图、算式和大概范围','多步计划、周长与分数估计','先把故事中的关系摆清，再决定用图还是算式。周长看外边一圈；分数部分可以与一半和整个比较。','20的3/5为什么应当比10大？'),
 complex38:item('mt_GpltXPoaoc','先估一估，再走几步','多步换单位、数量级与百分数边界','单位换好后才能把量接起来。估计能帮忙发现量级错误；部分占整体的百分比要看问题是否允许重复或超过整体。','什么时候超过100%不可能，什么时候又可能？'),
 advancedPlan38:item('mt_FieL-vVTI_','先认清谁是未知，再决定顺序','比例、方程与小数除法估计','按比分配先找总份数与一份；用字母前先说明它代表什么。估计小数除法时，先用容易比较的附近数判断范围。','如果换了未知量的位置，原来的第一步还合适吗？')
};
const route=(id,title,section,ids)=>({id,title,section,ids,packIds:['reasoning'],themeId:'patterns',color:'#9c8b9c'});
export const ROUTES=[
 route('HO','说清多少、形状和单位','reasoning-words',['words38','precise38','term38']),
 route('HP','句子和数学名字','reasoning-words',['communicate38','advancedWords38']),
 route('HQ','先理解，再摆出故事','reasoning-model',['tools38','sense38','story38']),
 route('HR','把图和生活接起来','reasoning-model',['objects38','lifemath38','model38','modelChoice38']),
 route('HS','先计划，再检查','reasoning-plan',['plan38','multi38','multiShape38']),
 route('HT','换单位和找未知','reasoning-plan',['complex38','advancedPlan38'])
];
const card=(id,text)=>({id,text}),chain=(prompt,cards,paths,extra={})=>({type:'x-r38-chain',prompt,cards,paths,...extra});
const st=(title,label,value,hint)=>({title,label,value,hint}),choice=(title,label,value,options)=>({title,label,value,kind:'choice',options}),path=(prompt,scene,steps)=>({type:'x-r37-steps',prompt,scene,steps,questions:[]});
const toFive={...clone(T09.powerblocks[0]),base:5,prompt:'把每边5块的正方形铺满。5²说的是几个5相乘？'};
const formulaSort={...clone(T35.words35[0]),prompt:'公式也是等式。这三张分别是表达式、具体等式，还是表示面积关系的公式？',items:[{label:'2x＋3',group:'expr'},{label:'2x＋3＝7',group:'eq'},{label:'面积＝长×宽',group:'formula'}],groups:[{id:'expr',label:'表达式'},{id:'eq',label:'具体等式'},{id:'formula',label:'面积公式（也是等式）'}],questions:[{label:'面积公式也有等号吗',value:'yes',kind:'choice',options:[['yes','有'],['no','没有']]}]};
export const TASKS={
 words38:[clone(T10.takethings[2]),clone(T06.digitcompare[0]),clone(T23.sidesfold[0]),clone(T24.placewords[0])],
 communicate38:[clone(T05.equality[2]),clone(T29.measurecalc[0]),clone(T02.solids[0]),clone(T06.digitcompare[1])],
 precise38:[clone(T16.unitsets[1]),chain('一整条平均分成四份，取三份。把两种说法连到同一段。',[card('whole','一整条分成4个相等的部分'),card('take','取其中3份'),card('name','三份四分之一就是四分之三'),card('wrong','只取了一份')],[['whole','take','name']]),clone(T02.area[1]),clone(T32.clockconvert[0])],
 term38:[clone(T13.factorpairs[0]),clone(T14.factorlab[1]),clone(T30.gridarea[1]),clone(T31.fractionvolume[0]),toFive],
 advancedWords38:[clone(T23.circleparts[0]),formulaSort,clone(T31.fractionvolume[0])],
 tools38:[clone(T10.bridge20[0]),clone(T33.modmoney[0]),chain('想看清一根绳剪掉一段后还剩多少。哪种表示能把原来、剪掉和剩下放在一起？',[card('whole','先画出原来的一整段'),card('cut','在同一段上标出剪掉的部分'),card('left','剩下的是没有剪掉的部分'),card('wrong','只记剪掉的数字，不看原来的长度')],[['whole','cut','left']])],
 sense38:[chain('原有3颗，又来4颗。先别算：知道什么，想找什么？',[card('a','知道原来3颗'),card('b','知道后来又来4颗'),card('ask','想找现在一共几颗'),card('wrong','想找拿走了多少颗')],[['a','b','ask'],['b','a','ask']]),clone(T10.smallstories[1]),clone(T10.factsten[0])],
 story38:[clone(T10.screenstories[0]),clone(T10.screenstories[1]),chain('看见3颗和4颗一共7颗。你能讲一个合起来的故事吗？',[card('one','一开始有3颗'),card('two','后来又来了4颗'),card('sum','合起来一共7颗'),card('wrong','后来拿走4颗')],[['one','two','sum']])],
 objects38:[clone(T10.takethings[0]),clone(T10.smallstories[2]),clone(T12.storytwo[0])],
 lifemath38:[clone(T33.modmoney[0]),clone(T12.storytwo[3]),clone(T33.modmoney[1])],
 model38:[clone(T28.unitstories[0]),clone(T37.scaleArea37[1]),clone(T37.pctNames37[3])],
 modelChoice38:[clone(T37.ratioShare37[0]),clone(T31.fractionvolume[0]),clone(T28.measureplot[0])],
 plan38:[chain('有18张卡，送出7张，还有一张蓝色桌子。先找到有用的量与问题。',[card('have','原来有18张'),card('give','送出7张'),card('ask','想找还剩多少张'),card('decoy','桌子是蓝色')],[['have','give','ask'],['give','have','ask']]),clone(T33.modmoney[0]),clone(T11.checkrough[0])],
 multi38:[clone(T12.storytwo[0]),clone(T11.checkrough[0]),clone(T11.checkrough[1])],
 multiShape38:[clone(T12.storytwo[4]),clone(T30.polyperim[0]),clone(T16.nonunitamount[0]),chain('20的3/5应该比一半多还是少？把比较的理由接起来。',[card('half','20的一半是10'),card('compare','3/5大于1/2'),card('result','20的3/5应大于10'),card('wrong','3/5小于1/2')],[['half','compare','result'],['compare','half','result']])],
 complex38:[path('每袋2.5千克，3袋平均分给5份。每份多少克？','先统一单位，再找总量和每份。',[st('单位','每袋多少克',2500),st('总量','3袋共多少克',7500),st('分成5份','每份多少克',1500)]),path('4832×7先估一估。有人算得33824，量级是否说得通？','估计只检查大致范围，不证明准确。',[st('先取整','4832取到最近的千是多少',5000),st('估乘积','5000×7是多少',35000),choice('比较','33824与估计的量级是否接近','yes',[['yes','接近'],['no','差很多']])]),chain('一次调查每人只记一票，40人中有48人投了A。这张记录说“120%的人投A”，哪里需要检查？',[card('whole','总共只有40个人'),card('once','每个人最多记一票'),card('limit','投A的人数不能多于40'),card('error','48超过40，应检查记录'),card('wrong','任何百分数都不能超过100%')],[['whole','once','limit','error'],['once','whole','limit','error']])],
 advancedPlan38:[clone(T37.ratioShare37[0]),path('54颗按2:3:4分给三个篮子。最少的那篮，每3颗装一袋，能装几袋？','先按比例分，再给其中一个篮子分袋。',[st('总份数','2＋3＋4共几份',9),st('一份','54颗平均分9份，一份几颗',6),st('最少一篮','2份共几颗',12),st('装袋','12颗每3颗一袋，共几袋',4)]),clone(T35.writing35[0]),path('19.8÷4.1有人得到约4.83。先估一估，这个数量级说得通吗？','用20÷4先估范围；估计接近不等于准确证明。',[st('容易的数','19.8接近多少',20),st('除数','4.1接近多少',4),st('估计','20÷4约是多少',5),choice('比较','4.83与估计是否接近','yes',[['yes','接近'],['no','差很多']])])]
};
