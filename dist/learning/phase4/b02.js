import {NETS} from './geometry.js';
const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B02'});
export const LESSONS={
 rows:item('mt_UTnDKQkVX5','怎样铺得整整齐齐','长方形的行列与方阵','每个小方格一样大，没有空隙和重叠。每行几格、共有几行，描述同一个方阵；逐个数、按行累加与相乘能得到同一个总数。','为什么每行都一样长？加一行会多几格？'),
 solids:item('mt_Mnodea7mG_','转过去，还少数了什么','立体的面、棱和顶点','面是平的表面，棱是两个面相接的线段，顶点是棱相遇的点。转动后，原来被挡住的部分也要计入；逐项标记能避免重复。','长方体拉长后，面、棱、顶点的个数会变吗？'),
 nets:item('mt_vnJEztczji','这张纸能合成盒子吗','正方体的展开图','六个正方形要能折到六个不同方向，不能重叠或缺面。样子陌生的展开图也可能成立，六格排在一起却不一定能合成立方体。','你画的展开图里，哪两面相对？六格排成两行为什么不行？'),
 attributes:item('mt_NtJYlJdUe9','大的就一定重吗','可测量的属性','同一个物体可以比较长短、高矮、轻重和能装多少。这是不同的问题：较高的瓶子不一定较重，也不一定装得较多。','一支铅笔能量什么？一个瓶子又能从哪几个方面比较？'),
 measure:item('mt_DOe893F6gN','挑对工具再量一量','标准单位与测量工具','尺量长度，秤量质量，量杯量容量。读数必须配上合适的单位；尺的零点要对准物体起点。这里练习模拟读数，真实器具还要实际操作。','为什么尺子的端点不一定是零点？要量多少水，该选哪件工具？'),
 area:item('mt_y1n0Zwhoca','这片地方要铺几块','用单位正方形量面积','面积是里面铺满多少个相同的单位正方形。边上的格子也属于里面，凹口外的格子不属于；沿边绕一圈的长度是另一回事。','L 形的缺口为什么不数？边缘格子为什么仍然要数？'),
 tiling:item('mt_Jvvh5P06NV','铺一排，再铺一排','铺面与乘法','每排有相同数量的方片。行数乘每行方片数，等于逐排累加；转动整片区域，面积保持不变。','为什么 4 排每排 6 块与 6 排每排 4 块覆盖一样多？'),
 rectangle:item('mt_GzcJEVkNRn','长和宽能告诉什么','长方形面积','长和宽分别告诉一排有多少单位方片、共有几排，所以面积等于长乘宽。结果用平方单位；不同长宽也可以有相同面积。','你能画出几个面积 36 的不同长方形？为什么不用长加宽？'),
 boundary:item('mt_eiB3-6pu6a','铺地和围边一样吗','长方形面积与周长','面积计算铺满里面的平方单位；周长计算围边的长度。知道长和面积能反求宽。不规则区域可以按约定的半格规则估计，这不是精确面积。','同样面积的长方形，围边可以不同吗？池塘的估计为何可能有误差？'),
 capacity:item('mt_NSC3LT_-ch','看起来能装多少','容量估计与实际盛装量','容量是装满时能容纳的量，当前装了多少可以改变。1 L = 1000 mL；容量 1 L 的壶只装半壶时，里面有 500 mL。先估计，再量，估计不必刚好。','一个半满的 1 升壶，容量和当前水量分别是多少？'),
};
export const ROUTES=[
 {id:'D',sectionByPack:{area:'area-cover'},title:'把这一面铺满',packIds:['groups','area'],themeId:'measure',color:'#568b64',ids:['rows','area','tiling','rectangle']},
 {id:'E',sectionByPack:{units:'units-compare',area:'area-border',volume:'volume-water'},title:'量一量，再比较',packIds:['units','area','volume'],themeId:'measure',color:'#528979',ids:['attributes','measure','boundary','capacity']},
 {id:'F',section:'solid-fold',title:'从平面折成立体',packIds:['solids'],themeId:'space',color:'#6c85a8',ids:['solids','nets']},
];
const floor=(w,h,prompt,extra={})=>({type:'x-floor',w,h,prompt,unit:'cm²',...extra});
const rect=(w,h,prompt,extra={})=>({type:'x-rectangle',w,h,prompt,unit:'cm',...extra});
export const TASKS={
 rows:[floor(4,3,'给这块 4 × 3 的板画好等大的行列，再铺满小方片。',{partition:true}),floor(5,3,'多出一列，再重新铺满。用行数和每行格数说清总数。',{partition:true})],
 solids:['cube','cuboid','prism'].map((shape,i)=>({type:'x-solid',shape,prompt:['转动这个方盒，分别把所有平的面、接缝线和角点标记一遍。','换成长盒子，再用标记防止漏数和重复。','这次两端是三角形。转动检查被挡住的部分。'][i]})),
 nets:[{type:'x-net',draw:true,prompt:'自己画六个相连的方格。先猜能否合成盒子、哪两面相对，再合起来试。'},...['stair','block'].map((key,i)=>({type:'x-net',preset:NETS[key],prompt:i?'六格排成两行。先留下判断，再合起来检查。':'换成这张阶梯纸片。先判断并选出一对相对的面，再折。'}))],
 attributes:[{type:'x-attributes',items:[{name:'细高瓶',height:24,mass:120,capacity:300},{name:'矮宽罐',height:16,mass:200,capacity:500}],prompt:'同样两个容器，分别比高矮、轻重和能装多少。每次先试，再选。'},{type:'x-attributes',items:[{name:'长铅笔',height:18,mass:8,capacity:0},{name:'短铅笔',height:12,mass:12,capacity:0}],keys:['height','mass'],prompt:'换成两支铅笔。较长和较重，还是同一支吗？'}],
 measure:[{type:'x-measure',attribute:'length',value:80,start:3,object:'桌面',unit:'cm',prompt:'选好工具和单位，把尺的零点对准桌面左边，再用厘米（cm）记录长度。'},{type:'x-measure',attribute:'mass',value:350,object:'一袋豆子',unit:'g',prompt:'选好工具，用标准砝码让两边平衡，再用克（g）记录这袋豆子有多重。'},{type:'x-measure',attribute:'capacity',value:300,object:'杯子',unit:'mL',prompt:'选好工具，把已经装满的模拟杯子里的水倒入量杯，再用毫升（mL）记录读数。'}],
 area:[floor(5,4,'把 L 形里面铺满。缺口不铺，边缘格子也别漏。',{cells:[0,1,5,6,10,11,12,13,14,15,16,17,18,19]}),floor(4,5,'用一平方厘米的小方片铺满这本模拟书的封面，再与刚才 14 平方厘米的 L 形比较。',{compare:14})],
 tiling:[floor(6,4,'一排一排铺满 4 × 6 的板。每次增加多少？',{factors:true}),floor(4,6,'把同样大小的板转过来，再用一排和排数写出乘法。',{factors:true}),floor(3,3,'自己画一个长方形，铺满并写出它的乘法。',{draw:true,factors:true})],
 rectangle:[rect(7,9,'看看一行与行数，为 7 cm × 9 cm 的板算出铺地面积。'),rect(2,2,'拖动长和宽，画出一个面积恰好是 36 平方厘米的长方形。',{targetArea:36,draw:true}),rect(8,5,'花园长 8 m、宽 5 m，要铺多大面积的草皮？',{unit:'m'})],
 boundary:[rect(8,2,'房间面积 48 m²，长 8 m。调好宽，再分别算铺地和围边。',{draw:true,fixedW:8,targetArea:48,perimeter:true,unit:'m'}),rect(7.5,7.5,'每条边 7.5 cm 的正方形，铺地面积和围边长度各是多少？',{perimeter:true}),{type:'x-pond',w:6,h:5,polygon:[[.3,1.2],[2,.2],[4.7,.5],[5.6,3.5],[3.1,4.7],[.5,3.8]],prompt:'每格 1 cm²。按“至少半格算一格”的办法圈出格子，估计池塘面积。'}],
 capacity:[{type:'x-capacity',capacity:300,step:50,prompt:'这个模拟杯子大约装 30、300 还是 3000 mL？先估，再一份份倒满检查。'},{type:'x-capacity',capacity:1500,step:250,reference:1000,prompt:'旁边的标准瓶装 1 L。先估计这只壶能装多少，再用量杯倒满核对。'},{type:'x-capacity',capacity:1000,step:100,targetFill:500,prompt:'这是容量 1 L 的壶。倒到半壶，分别记录能装满多少和现在有多少。'}],
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,tasks])=>[id,structuredClone(tasks[0])]));

export const BRIDGES=[
 {from:'area',to:'tiling',title:'逐块数，怎样变成按排数？',summary:'单位方片铺满同一块面，按排分组不会增减方片。',tasks:[floor(3,2,'先逐格铺满这片小板，记录面积。'),floor(4,3,'换成稍大的板，把逐格数改成每排 × 排数。',{factors:true})]},
 {from:'tiling',to:'rectangle',title:'不逐格铺，怎样算整片？',summary:'长和宽就是一排的单位数与排数，乘积与铺满的方片数相同。',tasks:[floor(4,3,'先铺满，写出这片板的行列乘法。',{factors:true}),rect(5,4,'换一片 5 × 4 的板，用行列结构求面积。')]},
 {from:'rectangle',to:'boundary',title:'同样铺地，围边会一样吗？',summary:'长宽的乘积确定面积，四条边的和确定周长，两者不能互换。',tasks:[rect(6,4,'先求这片 6 × 4 的铺地面积。'),rect(8,3,'换成 8 × 3，再分别求铺地面积和围边长度。',{perimeter:true})]},
 {from:'solids',to:'nets',title:'数到的六个面，怎样铺在纸上？',summary:'立方体的六个不同面展开后仍须各占一格，折回去不能重叠或缺面。',tasks:[{type:'x-solid',shape:'cube',prompt:'转动标记盒子的面、接缝和角，再记录数量。'},{type:'x-net',draw:true,prompt:'把六个面安排在纸上，先预测一对相对面，再折回去检查。'}]},
];
