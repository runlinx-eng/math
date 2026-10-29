import {SECTIONS as NUMBER_SECTIONS} from './phase5/b06.js';
import {SECTIONS as ADD_SECTIONS} from './phase5/b10.js';
import {SECTIONS as GROUP_SECTIONS} from './phase5/b13.js';
import {SECTIONS as PORTION_SECTIONS} from './phase5/b16.js';
import {SECTIONS as FRACTION_SECTIONS} from './phase5/b18.js';
import {SECTIONS as DATA_SECTIONS} from './phase5/b19.js';
import {SECTIONS as DISPLAY_SECTIONS} from './phase5/b20.js';
import {SECTIONS as STATS_SECTIONS} from './phase5/b21.js';
import {SECTIONS as CHANCE_SECTIONS} from './phase5/b22.js';
import {SECTIONS as SHAPE_SECTIONS} from './phase5/b23.js';
import {SECTIONS as POSITION_SECTIONS} from './phase5/b24.js';
import {SECTIONS as ANGLE_SECTIONS} from './phase5/b25.js';
import {SECTIONS as SOLID_SECTIONS} from './phase5/b27.js';
import {SECTIONS as UNIT_SECTIONS} from './phase5/b28.js';
import {SECTIONS as AREA_SECTIONS} from './phase5/b30.js';
import {SECTIONS as VOLUME_SECTIONS} from './phase5/b31.js';
import {SECTIONS as TIME_SECTIONS} from './phase5/b32.js';
import {SECTIONS as MONEY_SECTIONS} from './phase5/b33.js';
import {SECTIONS as PATTERN_SECTIONS} from './phase5/b34.js';
import {SECTIONS as UNKNOWN_SECTIONS} from './phase5/b35.js';
import {SECTIONS as SCALING_SECTIONS} from './phase5/b37.js';
import {SECTIONS as REASONING_SECTIONS} from './phase5/b38.js';
export const ROUTE_SECTIONS=[...NUMBER_SECTIONS,...ADD_SECTIONS,...GROUP_SECTIONS,...PORTION_SECTIONS,...FRACTION_SECTIONS,...DATA_SECTIONS,...DISPLAY_SECTIONS,...STATS_SECTIONS,...CHANCE_SECTIONS,...SHAPE_SECTIONS,...POSITION_SECTIONS,...ANGLE_SECTIONS,...SOLID_SECTIONS,...UNIT_SECTIONS,...AREA_SECTIONS,...VOLUME_SECTIONS,...TIME_SECTIONS,...MONEY_SECTIONS,...PATTERN_SECTIONS,...UNKNOWN_SECTIONS,...SCALING_SECTIONS,...REASONING_SECTIONS];
import {EXTRA_LESSONS,EXTRA_ROUTES,EXTRA_REFLECTIONS} from './phase4/catalog.js';
// Local learning routes. Source IDs and their original relationships stay intact.
export const ROUTES=[
 {id:'A',section:'portion-connect',title:'同一个量，几种写法',packIds:['same-amount'],themeId:'numbers',color:'#bd6b38',ids:['share','equivalent','decimal','quarters']},
 {id:'B',section:'volume-blocks',title:'积木里面藏着多少',packIds:['volume'],themeId:'measure',color:'#358378',ids:['space','hidden','box','steps']},
 {id:'C',section:'data-read',title:'把一份数据看清楚',packIds:['display','collect'],themeId:'data',color:'#6977b8',ids:['tally','survey','bars','views']},
];
const item=(id,topicId,title,question,formal,summary)=>({id,topicId,title,question,formal,summary});
export const LESSONS={
 share:item('share','mt_ndGqFPWyen','怎样才算一份','切成几块，就能直接数吗？','分数与单位分数','先把同一个整体平均分。每份是单位分数，取几份就是几个这样的单位。分母说明平均分成几份，分子说明取了几份。'),
 equivalent:item('equivalent','mt_Ep7TDFuYUa','分细了，会变多吗','写法变了，位置会变吗？','等值分数','同一个整体上，1/2、2/4、3/6 和 4/8 表示同样的量。数轴上重合在同一点的分数相等；分子分母同时乘同一个非零数，值不变。'),
 decimal:item('decimal','mt_TqDq6jyOmL','同一个量，换个名字','0.7 和 7/100 一样多吗？','十分位、百分位与小数','小数点后的第一位表示十分之几，第二位表示百分之几。7/10 = 0.7，7/100 = 0.07；0.3 和 3/10 在同一个数轴位置。'),
 quarters:item('quarters','mt_DRlbMok2lT','半杯，还能怎样记','四分之一为什么是 0.25？','常见分数与小数的等值关系','一整个百格的四分之一是 25 格，所以 1/4 = 25/100 = 0.25。同样，1/2 = 0.5，3/4 = 0.75。'),
 space:item('space','mt_IuHa5UI5od','里面装了多少','铺外面和填里面是一回事吗？','体积与单位立方体','体积表示立体占据的空间。边长为 1 个单位的小立方体占 1 立方单位；完全填满所用的块数给出体积。铺表面用小方片，填空间用小方块。'),
 hidden:item('hidden','mt_d7XktBQPxm','看不见的也要算','被挡住的积木，怎么数？','按层数单位立方体','每层的块数乘层数，能包括背面和内部看不见的小方块。边长 1 cm 的小立方体占 1 cm³；体积的单位是立方单位，不是面上的方格。'),
 box:item('box','mt_nTL-owFJTF','从一层想到整箱','三条边，为什么要乘起来？','长方体体积','长 × 宽得到一层的小方块数，再乘高得到所有层：V = 长 × 宽 × 高 = 底面积 × 高。缺了一块的模型不能直接套完整长方体的公式。'),
 steps:item('steps','mt_5TBUFnCy5-','拆开，还是这么多','台阶拆开后，会不会多算？','体积的可加性','把组合立体分成互不重叠、没有遗漏的长方体，各部分体积相加就是总体积。不同的有效切法应得到同一个总数。'),
 tally:item('tally','mt_c29FaCTNsx','一笔一票，画出记录','同一份投票，可以怎样记？','计数表、象形图和块状图','计数表按类累计，五笔为一组；象形图用相同符号代表同样的数量。图例和共同起点让表与图能够来回对应。'),
 survey:item('survey','mt_ebQURBOsM5','带着问题去观察','怎样知道大家怎么来上学？','数据收集与频数表','先确定要回答的问题，再用一致的方式观察和记录。频数是每类出现的次数；表格的一列记录类别，另一列记录次数。这里的数据是模拟样本，不代表真实班级。'),
 bars:item('bars','mt_VhBH8wrFC6','把票数搭成高度','高出来的一段，告诉了什么？','象形图与条形统计图','条形图从共同的零点开始，每格代表同样数量。条的高度表示次数；两条顶部的差，才是“多几个”，不是较高那条的全部高度。'),
 views:item('views','mt__yvsKKp3TS','换张图，还是那些数据','换一种画法，票数会变吗？','同一数据的不同表示','列表、计数表、象形图和条形图可以表示同一组数据。换画法不改变每一类的数量。选择哪种图，要看想回答什么问题。'),
};
Object.assign(LESSONS,EXTRA_LESSONS);ROUTES.push(...EXTRA_ROUTES);
// Keep the earlier two-node equality route reachable under the new three-direction entry.
const originalUnknown=ROUTES.find(r=>r.id==='N');originalUnknown.sectionByPack={...originalUnknown.sectionByPack,unknowns:'unknown-balance'};
const originalScaling=ROUTES.find(r=>r.id==='I');originalScaling.sectionByPack={...originalScaling.sectionByPack,scaling:'scaling-change'};
const originalReasoning=ROUTES.find(r=>r.id==='O');originalReasoning.sectionByPack={...originalReasoning.sectionByPack,reasoning:'reasoning-words'};
export const lessonIds=Object.keys(LESSONS);
export const lessonForTopic=id=>lessonIds.find(k=>LESSONS[k].topicId===id);
export const routeFor=id=>ROUTES.find(r=>r.ids.includes(id));
export const routesForPack=id=>ROUTES.filter(r=>r.packIds.includes(id));
export const routeForPack=id=>routesForPack(id)[0];
export const topicIds=lessonIds.map(id=>LESSONS[id].topicId);

export const REFLECTIONS={
 share:'两块大小不同，为什么不能只数涂了几块？分子和分母分别告诉了什么？',
 equivalent:'1/2 变成 3/6 时，什么变了、什么没有变？为什么两种写法会在数轴同一点？',
 decimal:'0.7 和 0.07 差在哪里？用百格或数轴解释。',
 quarters:'怎样从四分之一杯得到 25/100，再得到 0.25？',
 space:'为什么铺表面用方片，填内部用方块？一个立方厘米是什么？',
 hidden:'看不见的积木怎样包括在你的计划里？你的估计和实际数量差在哪里？',
 box:'为什么长乘宽后还要乘高？缺块时这个公式为什么不能直接用？',
 steps:'为什么拆开的两部分能相加？换一种切法，怎样避免遗漏或重复？',
 tally:'一笔一票和一颗圆点一票怎样一一对应？图里的一个符号表示几个？',
 survey:'你要回答什么问题，怎样记录才不会漏记、重复记？换成真实调查会怎么收集？',
 bars:'两类相差几票应该看哪一段？如果每格代表两票，读法会怎样变？',
 views:'为了看出哪类最多，你会选哪种表示，为什么？换成找出每个人的答案呢？',
};

Object.assign(REFLECTIONS,EXTRA_REFLECTIONS);
