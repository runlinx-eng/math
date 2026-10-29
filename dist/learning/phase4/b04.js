const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B04'});
export const LESSONS={
 sortobjects:item('mt_xppl18avyY','换个办法分一分','按属性分类','分类要始终使用同一个规则。相同一堆物品，按颜色和按大小分，可以得到不同的数量。比较多少要看数量，不能只看物体占多大地方。','换一种分类后，物品总数变了吗？'),
 sortdata:item('mt_ylXdiVRAYv','让零散回答排好队','分类与频数表','每个回答只进一个类别。各类次数加起来应等于回答总数；按数量排序后更容易比较，有并列时不必硬分先后。','新增两个回答后，哪一行要改？总数怎样核对？'),
 statquestions:item('mt_iykH2P5oFq','这个问题需要去收集吗','统计问题与数据变异','统计问题需要从一组观察中寻找答案，并预期结果可能不同。观察可以来自不同人，也可以是同一个人在不同日子的记录；已知固定答案不需要这种调查。','把“我今天读了几分钟”改成能研究变化的问题，会怎样问？'),
 datavocab:item('mt_u5HkSxZECM','图里的每个位置管什么','图表要素与数据类型','标题交代问什么，轴标记类别和数量，刻度说明每格代表多少。次数叫频数；计数笔画和图形可以表示同样次数。人数可逐个数，长度和时间能有中间值。','身高写成整数，就变成只能逐个数的量了吗？'),
 scaledgraphs:item('mt_r8XnXwRA6g','一个图案可以代表几个','有比例刻度的图表','先读每格或每个图案代表多少，再读数量。换刻度，表达相同数据时柱子高度也要跟着变。','一格代表 5 只宠物，四格代表几只？'),
 displaypurpose:item('mt_QpJydot2Kh','换张图，哪个问题更好答','按目的选择数据表示','同一份记录可以用表格或条形图。表格便于查精确值，条形便于看差距；转换时类别与数量不能改变。选择要联系你想回答的问题。','你想查一个人数，或想一眼比出最多，分别会怎样选？'),
 likelihood:item('mt_iFFKZd-Vgv','很可能，是一定吗','可能性语言','不可能表示没有这种结果，一定表示只能出现这种结果。大多数是红色只能说明红色更可能，仍可能抽到蓝色；有两种结果也不一定各占一半。','袋里七红三蓝，为什么抽红不是一定？'),
 chance:item('mt_J4j7d3iAfg','先猜，再一次次记录','简单随机试验','先预测，再一次一笔记录试验。总次数应对得上各类次数。公平的硬币并不保证每二十次恰好十正十反；这里做的是数字模拟。','这次结果与预测不同，是记录错了还是可能正常发生？'),
 fairness:item('mt_xSgAgg9Ej_','机会一样，要看什么','等可能与不等可能','在理想均匀转盘中，机会取决于每种颜色占的角度。颜色数量相同不等于面积相同；实验次数有波动，不能靠少数几次判断规则。','只有红蓝两色，就一定是五五开吗？'),
 simulation:item('mt_8DT3LXwwH-','试得更多，会更稳吗','数字模拟与频率波动','把每轮出现六的次数除以该轮总次数，才能比较不同规模。更多试验通常使比例更集中在 1/6 附近，但不保证每一轮更接近，也不会保证恰好等于 1/6。','为什么不能只比较出现六的次数？哪种结果会推翻“每次都更接近”？'),
};
export const ROUTES=[{id:'J',section:'data-collect',title:'把记录整理清楚',packIds:['collect'],themeId:'data',color:'#76939b',ids:['sortobjects','sortdata','statquestions']},{id:'K',section:'data-read',title:'同一份记录，换个看法',packIds:['display'],themeId:'data',color:'#6c8e98',ids:['datavocab','scaledgraphs','displaypurpose']},{id:'L',section:'chance-first',title:'猜一猜，再试很多次',packIds:['chance'],themeId:'data',color:'#72969c',ids:['likelihood','chance','fairness','simulation']}];
const objects=Array.from({length:9},(_,i)=>({label:['圆','方','三角'][i%3],color:[0,0,1,2,0,1,0,2,1][i],size:i%2}));
const fruit=[0,1,0,2,1,0,2,0,1].map(value=>({label:['苹果','香蕉','梨'][value],value}));
const chart=(prompt,extra={})=>({type:'x-chartlab',labels:['足球','游泳','羽毛球'],counts:[15,10,5],scale:5,prompt,...extra});
export const TASKS={
 sortobjects:[{type:'x-sort',items:objects,rule:'color',labels:['棕','绿','紫'],prompt:'先按颜色分。选一个盒子，再点物品，把全部物品放好并记数。'},{type:'x-sort',items:objects,rule:'size',labels:['小','大'],prompt:'还是同一堆物品，这次只按大小分。数量会怎样改变？'}],
 sortdata:[{type:'x-sort',items:fruit,rule:'value',labels:['苹果','香蕉','梨'],ordered:true,prompt:'这些模拟回答最喜欢哪种水果？按答案分类、记数，再从多到少排好表格。'},{type:'x-sort',items:[...fruit,...Array.from({length:2},()=>({label:'香蕉',value:1}))],rule:'value',labels:['苹果','香蕉','梨'],ordered:true,prompt:'又来了两份选香蕉的回答。重新整理记录，并检查第一名是否改变。'}],
 statquestions:[{type:'x-questionsort',prompt:'这些问题有的需要收集变化的记录，有的只有固定答案。逐个分类，特别留意“问到一群人”也可能只求一个固定总数。'},{type:'x-questionbuild',variable:'sport',prompt:'想知道这群孩子最喜欢的运动，拼出调查的问题，并给出两种可能不同的回答。'},{type:'x-questionbuild',variable:'minutes',prompt:'“我今天读了几分钟”只有一次记录。改成能研究一周变化的问题。不要把问一个人就当作一定不能统计。',self:true}],
 datavocab:[chart('把记录搭成图，再补上它的标题、两条轴和每格代表的数。换成表、计数笔画和图案看看。',{vocab:true}),{type:'x-variable',labels:['宠物只数','身高','比赛进球数','跑步用时'],answers:['count','measure','count','measure'],prompt:'把这些量分到“逐个数”或“可以有中间值的测量”。再试一个半单位，看看哪些说得通。'}],
 scaledgraphs:[chart('每格代表 5 只。把猫 20、狗 15、兔 5 的记录画出来，再求猫比兔多多少。',{labels:['猫','狗','兔'],counts:[20,15,5],view:'bar'}),chart('每个图案代表 2 票。画出三个项目的票数，先比较足球与网球相差多少，再求最多两项合计。',{labels:['足球','网球','篮球'],counts:[8,6,2],scale:2,view:'picture',topTwo:true,diffPair:[0,1]})],
 displaypurpose:[chart('把这份偏好记录做成表格和条形图。要查游泳的准确人数，你会选哪种，为什么？',{purpose:'exact',compare:true}),chart('同样的记录，想迅速比较最多与最少的差距，换个画法看看。',{purpose:'compare',compare:true})],
 likelihood:[{type:'x-likelihood',prompt:'把五件事放到“不可能”到“一定”的位置。每个袋子都充分混合，每颗珠子一样大。'}],
 chance:[{type:'x-experiment',kind:'coin',count:20,labels:['正面','反面'],weights:[1,1],prompt:'先预测 20 次中正面会有几次。每抛一次，就给对应结果记一笔。'},{type:'x-experiment',kind:'die',count:30,labels:['1','2','3','4','5','6'],weights:[1,1,1,1,1,1],prompt:'换成理想骰子，共掷 30 次。先预测出现 1 的次数，每次及时记录。'},{type:'x-experiment',kind:'bag',count:20,labels:['红','蓝'],weights:[7,3],prompt:'袋里 7 红 3 蓝，每次抽后放回。预测 20 次中红色几次，再试并比较。'}],
 fairness:[{type:'x-spinner',sectors:2,colors:2,target:'equal',coin:true,prompt:'理想硬币有两个同等机会的面。把两块分别涂成两色，再试一组。次数必须一样吗？'},{type:'x-spinner',sectors:6,colors:3,target:'equal',prompt:'把六个等大扇区涂成三色，使三种颜色机会一样。先判断，再模拟转 100 次。'},{type:'x-spinner',sectors:6,colors:2,target:'unequal',prompt:'做一个红色占一格、蓝色占五格的转盘。只有两色，机会一样吗？'}],
 simulation:[{type:'x-simulation',prompt:'分别做 10、100、1000 次一轮的掷骰模拟，每种做五轮。每个点是一轮出现六的比例。观察波动，不要求结果恰好等于 1/6。'}],
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,ts])=>[id,structuredClone(ts[0])]));
export const BRIDGES=[
{from:'sortobjects',to:'sortdata',title:'整理物品的办法，能整理回答吗？',summary:'每个对象归入一个类别，再数每类次数；同样办法可整理物品和回答。',tasks:[structuredClone(TASKS.sortobjects[0]),structuredClone(TASKS.sortdata[0])]},
{from:'datavocab',to:'scaledgraphs',title:'刻度的名字，怎样用来读数量？',summary:'先给图补上类别与数量轴，再用同一刻度重建数量并比较。',tasks:[structuredClone(TASKS.datavocab[0]),{...structuredClone(TASKS.scaledgraphs[0]),labels:['足球','游泳','羽毛球'],counts:[15,10,5],prompt:'保持每格 5 票，把同样的运动记录重建为柱子，再求最多与最少之差。'}]},
{from:'scaledgraphs',to:'displaypurpose',title:'同一份数量，换成表还能对上吗？',summary:'图中的格数乘刻度得到数量，换成表仍需保持各类数据。',tasks:[structuredClone(TASKS.scaledgraphs[0]),{...structuredClone(TASKS.displaypurpose[0]),labels:['猫','狗','兔'],counts:[20,15,5],prompt:'把刚才的宠物数据转换为表与图，查出狗的准确数量。'}]},
{from:'likelihood',to:'chance',title:'说很可能，实际会发生什么？',summary:'用袋里的构成预测，再对照放回抽样的实际记录；很可能并不保证每次发生。',tasks:[structuredClone(TASKS.likelihood[0]),structuredClone(TASKS.chance[2])]}
];
