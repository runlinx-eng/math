const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B05'});
export const LESSONS={
 repeat:item('mt_ZjIFGc6zPW','是哪一小段一直回来','重复单元','重复规律由一个最小单元反复组成。材料可以换成图形、数字或动作，位置关系仍然保持。','只看下一个是什么，和找出整段重复单元，有什么不同？'),
 structure:item('mt_DW2D1c0fKx','换了样子，什么没变','运算与图形的结构','交换加数位置，总数不变；加一个十改变十位的量，个位不变。长方形和正方形都有四条边、四个直角，正方形还要求四边一样长。','为什么 47 加 10 不需要重新逐个数 47 颗？'),
 growing:item('mt_W3VOAuFwVw','每次多一点，会长到哪里','固定步长的增长与减少','采用固定步长时，从起点不断加上或减去相同数量，就能构造后续项。这里只研究约定的固定变化；有限几个数本身不能证明只有一种规律。','第六座塔的高度，和第六次增加，是同一件事吗？'),
 equality:item('mt_oIzycTBeE4','两边一样多才放平','等号的关系意义','等号表示两边的值相同，不是“下一步写答案”。6 = 6 成立，4 + 1 与 5 + 2 的值不同。换一种写法仍可以保持平衡。','5 = 2 + 3 为什么也是正确的？'),
 unknown:item('mt_3JgrHY221M','空盒里要放多少','加减法中的未知数','方框表示一个暂时不知道的数。找它时让等号两边相等，再把找到的数放回去核对；空盒可在不同位置。','5 = □ − 3 时，空盒为什么不能填 2？'),
 represent:item('mt_EBYGhd8X3x','把故事搭成一张图','具体情境、图与算式的连接','先辨认整体和部分，再画图、写算式。相同关系可写加法或减法；数字的意义来自故事，不只是能算对的符号。','总共 10 个、已知 6 个，为什么不能把 6 和 10 当作两个部分相加？'),
 explain:item('mt_kJ5wYzO8qC','让别人看见你的办法','解释数学推理','把方法的关键关系展示出来：拆出的各部分要合回原数，换一种表示可以交叉检查。找到具体哪一步出错，比只说答案不对更有用。','8 + 5 为什么可以变成 8 + 2 + 3，而不能是 8 + 2 + 5？'),
 justify:item('mt_pyMD_SIiYO','试过几次，能说总是吗','说明理由、一般论证与反例','十个一可以换成一个十，进位时总量不变。任意偶数都能分成完整的对，两组完整的对合起来仍无剩余，这解释了偶数加偶数为偶数。几个例子不是对全部情况的证明；一个反例就能推翻“所有数相加都为偶数”。','你的理由为什么能适用于没试过的偶数？'),
};
export const ROUTES=[{id:'M',title:'找出每次怎样变',packIds:['patterns'],themeId:'patterns',color:'#928ba5',ids:['repeat','structure','growing']},{id:'N',title:'让两边一样多',packIds:['unknowns'],themeId:'patterns',color:'#968ba2',ids:['equality','unknown']},{id:'O',title:'把办法讲清楚',packIds:['reasoning'],themeId:'patterns',color:'#9c8b9c',ids:['represent','explain','justify']}];
export const TASKS={
 repeat:[{type:'x-repeat',unit:['○','□','□'],source:'○ □ □ ○ □ □ ○ □ □',palette:['○','□','△'],prompt:'圈出从开头开始、最小的重复单元。再自己拼出这个单元，用它搭三次。'},{type:'x-repeat',unit:['1','2','2','3'],source:'1 2 2 3 1 2 2 3 …',palette:['1','2','3'],prompt:'换成数字，找出单元，再搭出连续三组。'},{type:'x-repeat',unit:['○','□','□'],source:'拍手 跺脚 跺脚 ｜ 拍手 跺脚 跺脚',palette:['○','□','△'],prompt:'用圆代表拍手、方块代表跺脚，把动作规律变成三组图形。'}],
 structure:[{type:'x-commute',a:3,b:9,prompt:'交换这两堆珠子的位置。亲自试过后，写出交换后的算式，看看总数有没有变。'},{type:'x-placevalue',start:47,add:10,prompt:'47 颗已经按十颗一束放好。加一束十颗，不拆开重数，记录现在有几个十、几个一。'},{type:'x-shapefacts',prompt:'分别描出长方形与正方形的边和直角，再比较什么相同。拉长长方形，观察这些数量会不会变。'}],
 growing:[{type:'x-grow',values:[5,8,11,14,17,20],known:4,prompt:'约定每次增加相同数量：5、8、11、14。记录从哪里开始、每次增加多少，再补出后两项。'},{type:'x-grow',values:[40,35,30,25,20,15],known:0,given:[0,1,3,5],prompt:'约定每次减少相同数量：40、35、空格、25、空格、15。用负号记录每次变化，并补齐。'},{type:'x-grow',values:[2,4,6,8,10,12],known:3,towers:true,prompt:'前三座塔每次多两块。先预测第六座有几块，再把后面三座搭出来。'}],
 equality:[{type:'x-balance',left:'6',right:'6',l:6,r:6,prompt:'按两边数字分别放珠子。先猜天平会怎样，再松开支架。'},{type:'x-balance',left:'4 + 1',right:'5 + 2',l:5,r:7,prompt:'这次两边都是加法，但一样多吗？搭出来、先预测，再松开。'},{type:'x-balance',left:'5',right:'2 + 3',l:5,r:5,prompt:'“答案”在左边也能成立吗？用两盘珠子检查。'}],
 unknown:[{type:'x-unknown',mode:'add',answer:3,label:'8 + □ = 11',prompt:'向空盒里增减珠子，让 8 加上它与 11 一样多。'},{type:'x-unknown',mode:'subtract',answer:8,label:'5 = □ − 3',prompt:'空盒拿走三颗后要剩五颗。调好空盒，再代回原式。'},{type:'x-unknown',mode:'sum',answer:12,label:'6 + 6 = □',prompt:'空盒在右边。这次让它与六加六一样多。'}],
 represent:[{type:'x-story',a:14,b:5,total:19,story:'原来有 14 张贴纸，又得到 5 张，一共有多少？',prompt:'搭出两部分和整体，再把同一件事写成算式。'},{type:'x-story',a:6,b:4,total:10,missing:true,story:'一共有 10 个苹果，6 个是红的，其余是绿的。绿色有几个？',prompt:'先认出哪个数是整体，再搭图；写一个能求绿色数量的算式。'}],
 explain:[{type:'x-reason',mode:'split',prompt:'8 + 5：从五颗中拿一些补足十颗，剩下的还要算。用图展示你的拆法。'},{type:'x-reason',mode:'line',prompt:'换一种办法：从 8 出发，在数轴上走五步，与刚才的办法比较。'},{type:'x-reason',mode:'repair',prompt:'有人写：8 + 5 = 8 + 2 + 5 = 15。找出错误，重新分这五颗，修好这条推理。'}],
 justify:[{type:'x-regroup',prompt:'把 27 与 18 合到一起，再把十个一换成一个十。每一步总量都要保持。'},{type:'x-regroup',error:true,prompt:'有人把 27 + 18 写成 315：三个十、十五个一直接连起来。用换十修好它，并指出错误。'},{type:'x-proof',prompt:'先把两组完整的“对”拼在一起，换一组再试。然后用理由解释任意偶数都成立；最后为“任何两个数相加都为偶数”搭一个反例。'}],
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,ts])=>[id,structuredClone(ts[0])]));
export const BRIDGES=[
{from:'repeat',to:'growing',title:'重复一段，与每次增长有什么不同？',summary:'重复单元保持内部结构；增长序列每次应用同一个变化规则，整项不必重复。',tasks:[structuredClone(TASKS.repeat[1]),structuredClone(TASKS.growing[0])]},
{from:'equality',to:'unknown',title:'看懂两边一样多，才能找到空盒',summary:'等号表达相等；调整未知量，使两边具有相同的值，再代回检查。',tasks:[structuredClone(TASKS.equality[2]),structuredClone(TASKS.unknown[1])]},
{from:'explain',to:'justify',title:'解释一步，再检查每一步都守住了什么',summary:'拆分不能重复计数，换十不能改变总量；理由把每一步连接起来。',tasks:[structuredClone(TASKS.explain[2]),structuredClone(TASKS.justify[1])]}
];
