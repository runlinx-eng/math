import {TASKS as T04} from '../phase4/b04.js';
const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B19'});
export const LESSONS={
 categoryuse:item('mt_1VSfm9yiLn','多出来的是哪一段','分类数据的频数、总数与差','每类有多少、合起来多少、相差多少，是三种不同的问题。逐个配对后留下的部分是差；每人只答一次时，总次数才等于人数。','最多的那一类有8个，为什么“多几个”不一定是8？'),
 playgroundstudy:item('mt_kxeuXm6EyC','操场上，什么最受欢迎','引导式统计调查','先说明在什么时间观察什么，再逐条记、整理、画图。连续几天的使用次数，可以包含同一个人多次出现；不能直接当成不同人数。','三天共记录12次，能说有12个不同的人吗？'),
 digitalstudy:item('mt_yrvYKSwSRZ','让表格帮忙数','数字工具收集与整理数据','本地表单把问题和回答对应起来。COUNTIF按条件数出记录，统计范围必须包含所有行。图和结论来自同一份表。','表格少算最后一行，图再漂亮也可靠么？'),
 ownstudy:item('mt_Y6JmLjnfRP','一份小调查，从头做到尾','统计调查的设计、收集与呈现','给每个人问同样的三个问题，记录各人的回答，再选一个问题整理。15人各答3题仍是15人。两条发现应带数据，并说明范围。','有45个填写的格子，为什么不能说调查了45个人？'),
 studyplan:item('mt_SHVyE1CLUa','先想清楚，怎样才知道','统计调查计划与表示选择','先明确对象、时间和记录方法。柱图适合比较次数，点图保留分布，表适合查准确数。结论需要回到原问题，并说明一处限制。','同一份数据，什么时候用图，什么时候直接看表？'),
 checkrecords:item('mt_QHT16CrFO-','这条记录靠得住吗','数据验证、名义与有序分类','先保留原记录。有凭据才能更正，没有凭据就标记未知或暂不计入，不能编一个数补空白。颜色名称没有固有高低；评分有顺序，但相邻差距不一定相等。','两个回答一样，是两个人一样想，还是同一个人记了两次？怎样知道？'),
 betterquestion:item('mt_O-U263ukg1','把一个模糊问题问清楚','改进统计调查问题与过程','把“大家爱运动吗”变成对特定一组人、特定一周的可记录问题。留下谁、怎样、何时，按记录总结，再指出下一次能改进的地方。','只问一起踢球的朋友，能代表所有孩子吗？'),
 measurestory:item('mt_6gpryAnpoZ','数字背后，发生了什么','观测数、测量背景与报告精度','频数相加得到观察次数。测量要交代对象、工具、方法、单位和精度。整点附近堆积可能来自取整，单看堆积不能断言原因。','很多人写21:00，能证明他们都在同一分钟睡着吗？'),
};
export const SECTIONS=[{id:'data-read',title:'把记录看明白'},{id:'data-collect',title:'试做一次调查'},{id:'data-improve',title:'让问题更可靠'}];
const route=(id,section,title,ids)=>({id,section,title,ids,packIds:['collect'],themeId:'data',color:'#6977b8'});
export const ROUTES=[route('DE','data-read','数量与数字的来历',['categoryuse','measurestory']),route('DF','data-collect','从观察到一张图',['playgroundstudy','digitalstudy']),route('DG','data-improve','先检查，再计划',['checkrecords','studyplan']),route('DH','data-improve','自己问，再改进',['ownstudy','betterquestion'])];
const choice=(key,label,options,answer)=>({key,label,options,answer});
const plan=(prompt,choices,extra={})=>({type:'x-dataplan',prompt,choices,...extra});
const count=(labels,counts,prompt,extra={})=>({type:'x-datacount',labels,counts,prompt,unit:'份回答',compare:[0,1],...extra});
const col=(label,question,values)=>({label,question,values});
const rows=(values,days)=>values.map((v,i)=>({id:'R'+String(i+1).padStart(2,'0'),day:days?.[i]||'同一次收集',values:Array.isArray(v)?v.map(String):[String(v)]}));
const studio=(prompt,title,cols,data,extra={})=>({type:'x-datastudio',prompt,title,cols,rows:data,analysis:0,unit:'份回答',who:'这组模拟参与者',when:'同一次收集',how:'每人独立回答一次',formula:true,charts:['bar','table'],...extra});
const playground=studio('连续看三天午休的操场记录。同一人可以再次出现；统计的是使用次数。逐条记，再亲手搭一张图。','三天午休器材使用次数',[col('器材','这一次使用的是哪种器材？',['秋千','滑梯','攀爬架'])],rows(['秋千','滑梯','秋千','攀爬架','滑梯','秋千','滑梯','秋千','攀爬架','秋千','滑梯','秋千'],Array.from({length:12},(_,i)=>'第'+(Math.floor(i/4)+1)+'天午休')),{who:'这处操场三天午休的使用记录',when:'连续三天的午休',how:'每发生一次使用就记一次',unit:'次使用',formula:false,charts:['bar']});
const sport=studio('先选一个不暗示答案的问题，再逐条录入模拟答卷。用表格数出喜欢每项运动的人数。','这组回答里最喜欢的运动',[col('运动','在这些选项中，你目前最喜欢哪项运动？只选一项。',['足球','游泳','羽毛球','其他'])],rows(['足球','游泳','足球','羽毛球','其他','游泳','足球','羽毛球','游泳','足球']));
const screen=studio('为15份模拟答卷安排三个问题。每次记一人的三条回答，再研究昨天的屏幕时长。','这15份回答中的昨天屏幕时长',[col('时长（小时）','昨天使用屏幕总共约几小时？按整小时记录。',['0','1','2','3']),col('主要用途','昨天使用屏幕最多用于哪件事？只选一项。',['学习','游戏','视频','未使用']),col('主要设备','昨天使用最多的设备是什么？只选一项。',['平板','手机','电脑','未使用'])],rows([[1,'学习','平板'],[2,'游戏','电脑'],[0,'未使用','未使用'],[1,'视频','手机'],[3,'游戏','电脑'],[2,'学习','平板'],[1,'学习','电脑'],[0,'未使用','未使用'],[2,'视频','手机'],[1,'学习','平板'],[3,'视频','手机'],[0,'未使用','未使用'],[1,'游戏','平板'],[2,'学习','电脑'],[1,'视频','平板']]),{unit:'人',when:'记录昨天，今天收集',who:'这15份模拟答卷中的人',charts:['bar','dot','table'],numeric:true});
const sleep=studio('这8份模拟记录问的是同一个上学日前夜。选一种表示，回答这组人记录的睡眠时长有什么不同。','这组记录的上学日前夜睡眠时长',[col('时长（小时）','昨晚入睡到今天起床约几小时？按整小时记录。',['7','8','9','10'])],rows([8,9,8,7,9,8,10,9]),{when:'同一个上学日前夜',unit:'人',numeric:true,charts:['bar','dot','table'],formula:false});
const weekly=studio('把“大家喜欢运动吗”具体到一周和一组人。记录这10份模拟回答，再说说下一次怎样问得更可靠。','这组人上周参加有组织运动的小时数',[col('运动时间（小时）','上周一到周日，参加有组织运动约几小时？按整小时记录。',['0','1','2','3','4'])],rows([0,2,1,3,2,4,1,2,0,3]),{who:'这10位模拟兴趣小组成员',when:'上周一到周日',unit:'人',numeric:true,charts:['bar','dot','table']});
export const TASKS={
 categoryuse:[count(['苹果','香蕉','梨'],[4,3,2],'把这9份模拟回答整理成三列。每个人只选一次：每类、总数、相差多少分别是什么？'),count(['狗','猫','兔'],[8,5,3],'把狗和猫的记录一一配对，多出来的那一段才是“多几个”。',{pair:true}),count(['红','蓝','绿'],[4,4,2],'最多可能不只一类。把所有并列最多、最少的类别都指出来。',{extremes:true})],
 playgroundstudy:[playground,count(['秋千','滑梯','攀爬架'],[2,1,1],'只看第三天的4次使用。和三天合起来的问题相比，回答的范围变了。',{unit:'次使用',scope:'visits'}),plan('三天共记录12次使用。先别把“次数”改成“人数”。',[choice('unit','12表示什么？',[['visits','12次使用'],['people','12个不同的人'],['days','12天']],'visits'),choice('claim','这些记录能回答什么？',[['recorded','这三天记录里，哪种器材使用次数最多'],['all','全国孩子最喜欢什么'],['unique','有多少不同的人来过']],'recorded')])],
 digitalstudy:[sport,plan('给本地小表单选问题与回答方式，看看问法会怎样影响记录。',[choice('question','问题怎样写？',[['neutral','在这些选项中，你目前最喜欢哪项运动？只选一项。'],['lead','足球最好玩，你也最喜欢足球吧？'],['double','你喜欢什么运动和什么食物？']],'neutral'),choice('answers','答案怎样安排？',[['cover','足球 / 游泳 / 羽毛球 / 其他'],['miss','只给足球一个选项'],['overlap','球类 / 足球 / 游泳']],'cover')],{draft:true}),count(['足球','游泳','羽毛球'],[3,3,2],'另一次模拟投票出现并列。用COUNTIF计算，不能只挑一个“最多”。',{raw:['足球','游泳','足球','羽毛球','游泳','足球','羽毛球','游泳'],formula:true,extremes:true})],
 ownstudy:[screen,plan('设计三题，要让每个人回答的是同一时间、同一单位。',[choice('hours','时长题',[['clear','昨天总共约几小时，按整小时记'],['vague','平时用得多吗？'],['lead','你昨天肯定用了太久吧？']],'clear'),choice('purpose','用途题',[['one','昨天最多用于什么，只选一项'],['two','喜欢游戏和运动吗？'],['none','替别人猜用途']],'one'),choice('device','设备题',[['one','昨天用得最多的设备，只选一项；没用可选未使用'],['none','不用问，按用途推断'],['only','只允许选手机']],'one')],{draft:true}),count(['0小时','1小时','2小时','3小时'],[3,6,4,2],'15人各答3题，总共45个值。现在只整理时长这一列，总数应该是什么？',{unit:'人',extremes:true})],
 studyplan:[plan('想知道一组人的上学日前夜睡多久，先把调查计划补清楚。',[choice('who','问谁',[['group','事先确定的这组人'],['change','只找答案符合猜想的人'],['all','把随手问到的几人写成所有人']],'group'),choice('when','问哪一晚',[['same','同一个上学日前夜'],['any','每人随便选一晚'],['unknown','不用记日期']],'same'),choice('how','怎样记',[['consistent','都记录入睡到起床时长，单位小时、精度一致'],['mix','有人记起床时刻，有人记时长'],['guess','根据精神好不好猜']],'consistent')],{draft:true}),sleep,plan('图表支持的结论，也有自己的边界。给这次小调查留下一条限制和下一步。',[choice('limit','哪条限制与这份记录有关？',[['sample','只记录这一小组和一晚，未必代表其他人或其他晚上'],['none','画过图就没有限制'],['colour','图的颜色不够多']],'sample'),choice('next','下一次怎样改进？',[['repeat','保留同样问法，换几晚再次记录并比较'],['erase','删掉不符合猜想的回答'],['rename','只换图的名字']],'repeat')],{draft:true})],
 checkrecords:[{type:'x-dataclean',prompt:'这张模拟表有空白和抄错的值。保留原表，按凭据逐条处理；没有凭据就别猜。',labels:['红','蓝','绿'],rows:[{id:'R01',raw:'红'},{id:'R02',raw:'蓝'},{id:'R03',raw:''},{id:'R04',raw:'42',proof:'绿'},{id:'R05',raw:'红'},{id:'R06',raw:'蓝'},{id:'R07',raw:'绿'},{id:'R08',raw:'蓝'}]},
 {type:'x-datakind',prompt:'把三种记录分组。能排出高低，不代表每一级相差一样多。',cards:[{label:'最喜欢的颜色：红、蓝、绿',kind:'nominal'},{label:'满意程度：1很不满意 → 5很满意',kind:'ordinal'},{label:'交通方式：走路、骑车、公交',kind:'nominal'}]},
 count(['红','蓝','绿'],[2,3,2],'清理后有7条可计入的颜色回答，还有1条未知。用公式重新计算；未知不能被补成任何颜色。',{raw:['红','蓝','绿','红','蓝','绿','蓝'],formula:true,extremes:true,unknown:1})],
 betterquestion:[plan('“孩子喜欢运动吗”太模糊。把对象、时间和要记录的量拼清楚。',[choice('who','对象',[['defined','这个事先确定的兴趣小组'],['any','随便某些人'],['world','所有孩子，实际只问朋友']],'defined'),choice('when','时间',[['week','上周一到周日'],['ever','从小到现在，凭感觉'],['none','不规定']],'week'),choice('value','记录什么',[['hours','参加有组织运动的总小时数，约到整小时'],['like','喜欢还是不喜欢'],['good','运动好不好']],'hours')],{draft:true}),weekly,plan('如果只问同一支球队的朋友，下一步怎样改善？',[choice('limit','目前的限制',[['selection','来自同一球队，可能偏向爱运动的人'],['none','10人已经代表所有孩子'],['plot','必须换成3D图才可靠']],'selection'),choice('improve','下一步',[['wider','明确目标人群，从更多不同小组按同一方法收集'],['delete','去掉运动最少的回答'],['repeat','只把同一组数据复制几遍']],'wider')],{draft:true})],
 measurestory:[count(['A','B','C','D'],[3,7,6,4],'频数表只有4行，每一行代表多条观察。搭出各行的数量，再数一共多少条。',{unit:'条观察'}),{type:'x-measurestory',mode:'context',prompt:'有人只留下“手掌张开有多宽”这句话。把这份测量记录的背景补完整。',choices:[choice('who','测谁',[['pupils','这28位参与者'],['hands','28把尺'],['none','对象不重要']],'pupils'),choice('n','几条测量',[['28','每人一次，共28条'],['56','两只手，一定56条'],['1','只有一列，所以1条']],'28'),choice('tool','用什么',[['ruler','尺子'],['clock','时钟'],['guess','凭眼睛猜']],'ruler'),choice('method','测哪里到哪里',[['span','同一只手充分张开，拇指尖到小指尖'],['palm','只量掌心'],['mixed','每人自己决定']],'span'),choice('unit','单位',[['cm','厘米'],['hour','小时'],['none','不需要']],'cm'),choice('precision','记录精度',[['half','取到最接近的0.5厘米'],['exact','无限精确'],['whole','整米']],'half')]},
 {type:'x-measurestory',mode:'round',prompt:'报告的睡觉时刻常堆在21:00、21:30。把这些模拟精确时刻取到最近半小时，看看堆积能不能仅由取整产生。',times:[1256,1264,1275,1279,1287,1293,1301]}],
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,ts])=>[id,structuredClone(ts.at(-1))]));
export const BRIDGES=[];
const link=(from,to,title,a,b)=>BRIDGES.push({from,to,title,summary:'先做两边的实际活动，再把它们连起来。',tasks:[structuredClone(a),structuredClone(b)],phase:5,batch:'B19'});
// Only directed edges present in the pinned upstream graph. These compact cases keep joint work manageable.
link('sortdata','categoryuse','分好类，才能读出总数与差',count(['苹果','香蕉','梨'],[4,3,2],'按原记录搭出各类数量。'),TASKS.categoryuse[1]);
link('survey','playgroundstudy','一次一条，连续几天也不漏记',count(['秋千','滑梯'],[3,2],'模拟的一天有这些使用记录。',{unit:'次使用'}),TASKS.playgroundstudy[2]);
link('survey','digitalstudy','原记录进了表，问题不能变',TASKS.digitalstudy[1],TASKS.digitalstudy[2]);
link('playgroundstudy','ownstudy','先明确每条记录，再看三题答卷',TASKS.playgroundstudy[2],TASKS.ownstudy[2]);
link('digitalstudy','ownstudy','工具帮忙计数，范围仍要自己检查',TASKS.digitalstudy[2],TASKS.ownstudy[1]);
link('ownstudy','studyplan','做过一轮，再把下一轮计划写清',TASKS.ownstudy[1],TASKS.studyplan[0]);
link('checkrecords','studyplan','先知道缺什么，再安排怎么收',TASKS.checkrecords[0],TASKS.studyplan[0]);
link('studyplan','betterquestion','对象、时段与量，一起让问题清楚',TASKS.studyplan[2],TASKS.betterquestion[0]);

link('statquestions','measurestory','问题允许变化，记录还要有来历',T04.statquestions[0],TASKS.measurestory[1]);
link('categoryuse','statquestions','看过不同的回答，再辨哪些问题研究变化',TASKS.categoryuse[2],T04.statquestions[0]);
link('scaledgraphs','playgroundstudy','刻度与单位，一起带进调查图',T04.scaledgraphs[0],TASKS.playgroundstudy[1]);
link('statquestions','betterquestion','从有变化的问题，走到可收集的具体问题',T04.statquestions[0],TASKS.betterquestion[0]);
