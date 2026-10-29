import {TASKS as T03} from '../phase4/b03.js';
import {TASKS as T16} from './b16.js';
import {TASKS as T20} from './b20.js';
import {TASKS as T25} from './b25.js';
import {TASKS as T28} from './b28.js';
const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B32'});
export const LESSONS={
 timecompare:item('mt_TcG90kS8nu','谁先到，谁用得久','时刻与时长的比较','先后看事情发生的时刻，快慢或多久看从开始到结束的时间。结束较晚不一定花得更久，要把起点一起看。','两个活动结束的先后，为什么不一定能告诉我们谁用了更久？'),
 eventorder:item('mt_-vvVxpOHG2','先发生什么，后来呢','事件的先后顺序与相对日期','事件可以按先、后排列；昨天、今天、明天以当前参照日为准。上午和下午说的是时刻，不由活动名称决定。','今天往后过一天，昨天和明天会怎样变？'),
 durationunit:item('mt__N55B7u7HD','用秒和分钟记一段','用时与时间单位','时长是从开始到结束经历多久。秒、分钟和小时是计量时长的单位；60秒是1分钟。这里的计时是模拟。','计时开始晚了，记录会怎样？'),
 hoursday:item('mt_2XDGT5tei1','一小时和一天有多长','分钟、小时与天的关系','60分钟是1小时，24小时是1天。钟面每12小时转一轮，一天需要两轮；跨过60分钟要向小时进一。','钟面只有12个数字，为什么一天有24小时？'),
 durationorder:item('mt_6XCURuNwPw','把花的时间排一排','时长的比较与排序','先确定每项活动用了多久，再按相同单位比较。先结束不一定用得更短，因为开始时刻可能不同。','两人没有同时出发，只看谁先到能比快慢吗？'),
 durationwork:item('mt_4emC463IyW','从开始走到结束','经过时间的比较与计算','从开始时刻向前走到结束时刻，先走到整点再走余下的分钟。比较两段时长时，先统一单位再求差。','10:15 到 11:00，为什么是45分钟？'),
 fractiontime:item('mt_Jz9UuT8BXW','一段时间分成几份','时间与事件的二分之一、四分之一和八分之一','先确定整个事件有多长，再平均分成相等的份。半小时是30分钟，一刻钟是15分钟；16分钟的八分之一是2分钟。','半小时和半场比赛的“一半”，为什么不能只看同一个数字？'),
 elapsedtime:item('mt_IL86kadLSS','从这里走到几点','经过时间问题与时间轴','从开始时刻向前按分钟走；到60分钟时进一小时。也可以从开始走到结束，数一共经过多少分钟。','14:15 走47分钟，为什么不会得到14:62？'),
 hourclock:item('mt_0XxyaQLRhn','整点和半点，指针在哪','整点与半点的钟面和数字时刻','长针走一圈是60分钟；短针在一小时内从一个数字慢慢走到下一个。半点时，短针位于两个小时数字中间。','7:30时短针为什么不正对着7？'),
 fiveclock:item('mt_HNOPGJYiRK','长针每走一格，过了多久','每五分钟读写时刻','钟面上相邻两个数字之间是5分钟。长针在5上表示25分钟；过半小时后，也可以说离下一小时还差多少分钟。','长针指着8，为什么不是8分钟？'),
 ampmclock:item('mt_4m8BimI4G5','同一个钟面，白天还是夜里','上午、下午与十二小时制','钟面每12小时重复一次，需要结合日期和上午、下午辨认。中午是12:00，午夜开启新的一天；只看指针不能知道是白天还是夜里。','同样是8:45，为什么还需要知道是上午还是晚上？'),
 romanclock:item('mt_5J2quSTspi','换一套数字，钟还一样走','罗马数字钟面与十二、二十四小时制','I到XII表示钟面的1到12，IV也常写作IIII；分钟位置不变。下午1至11点对应13至23点；中午后的12点和午夜后的12点需要单独辨认。','IV和IIII都在同一处时，长针走的分钟会改变吗？'),
 minuteclock:item('mt_UNzojLkNdm','再走几小格，读到分钟','精确到分钟的钟面和时长','先找长针经过的五分钟位置，再数余下的小格。短针看刚经过的小时，不看离哪个数字最近；秒和分钟的时长可以换成同一单位比较。','7:43时短针更靠近8，为什么还读7？'),
 clockconvert:item('mt_WfrE_4r-kY','同一时刻，换种写法','十二小时与二十四小时时刻转换','同一时刻可以写成上午／下午的十二小时制，也可以写成00:00至23:59。下午1至11点加12；正午后的12点不加，午夜后的12点写成00点。','15:45和下午3:45为什么是同一个时刻？'),
 timeconvert:item('mt_2yas4Unc8o','把小时换成分钟','时间单位与复名数换算','小时和分钟、分钟和秒都按60换；周和天按7换，年和月按12换。复名数需要把整份和剩余部分都保留。','3小时25分钟为什么不是325分钟？'),
 quarterclock:item('mt_MgsDabdnr1','一刻过了，还是差一刻','一刻与差一刻的钟面','一刻是15分钟。3:15表示过了3点一刻；6:45距离7点还有一刻。长针转过四分之一圈时，短针也走过一小段。','6:45为什么说差一刻到7点，而不是6点？'),
 weekmonth:item('mt_bj1YCgNWUx','星期和月份怎么接下去','星期、月份和年份的循环','一周有7天，一年有12个月；星期日以后接星期一，12月以后接下一年的1月。月份里的天数不都一样。','星期日之后为什么还是星期一，而不是结束？'),
 calendarfacts:item('mt_EXlmTURK_o','月份的天数都一样吗','秒、月份天数与公历闰年','一分钟是60秒。公历各月天数不完全相同，平年365天、闰年366天；整百年需能被400整除才是闰年。','为什么2024年有2月29日，而2100年没有？'),
 calendaruse:item('mt_tVvZVWO5d6','日历上的这一天','读取公历日期与日期间隔','先看年份、月份，再找日期所在的星期。算从一天到另一天相隔几天，从起点向后走，不额外把起点算一天。','从6月3日到6月17日，为什么相隔14天？')
};
export const SECTIONS=[{id:'time-flow',title:'先后与用了多久'},{id:'time-clock',title:'转动钟面，看时刻'},{id:'time-calendar',title:'日历与时间单位'}];
const route=(id,section,title,ids,extra={})=>({id,section,title,ids,packIds:['time'],themeId:'measure',color:'#b08a52',...extra});
export const ROUTES=[
 route('GD','time-flow','先后和长短',['timecompare','eventorder','durationunit']),
 route('GE','time-flow','从开始走到结束',['durationorder','durationwork','elapsedtime']),
 route('GF','time-clock','分时间，认整点',['fractiontime','hourclock','quarterclock']),
 route('GG','time-clock','五分钟与一天两次',['fiveclock','ampmclock','romanclock']),
 route('GH','time-clock','分钟和两种写法',['minuteclock','clockconvert']),
 route('GI','time-calendar','星期和日历',['weekmonth','calendaruse']),
 route('GJ','time-calendar','小时、月和换算',['hoursday','calendarfacts','timeconvert'],{packIds:['time','units'],sectionByPack:{time:'time-calendar',units:'units-change'}})
];
const q=(label,value,kind='number',options)=>({label,value,kind,...(options?{options}:{})}),choose=(label,value,options)=>q(label,value,'choice',options),clone=x=>structuredClone(x);
const clock=(prompt,mode,value,questions=[],extra={})=>({type:'x-t32-clock',prompt,mode,value,initial:65,questions,...extra});
const order=(prompt,items,questions=[],extra={})=>({type:'x-t32-order',prompt,items:items.map(([label,value])=>({label,value})),questions,...extra});
const cmp=(prompt,events,kind,questions=[])=>({type:'x-t32-compare',prompt,events:events.map(([name,start,end])=>({name,start,end})),kind,questions});
const parts=(prompt,total,n,take,questions=[],unit='分钟')=>({type:'x-t32-parts',prompt,total,parts:n,take,unit,questions});
const cal=(prompt,months,dates,questions=[])=>({type:'x-t32-calendar',prompt,months,dates,questions});
const stopwatch=(prompt,duration,questions=[])=>({type:'x-t32-stopwatch',prompt,duration,questions});
const steps=(prompt,start,duration,questions=[],unit='分钟')=>({type:'x-t32-steps',prompt,start,duration,unit,questions});
const units=(prompt,labels,questions=[])=>({type:'x-t32-units',prompt,parts:labels.map(label=>({label})),questions});
const t12=(label,value)=>q(label,value,'time12'),t24=(label,value)=>q(label,value,'time24');
export const TASKS={
 timecompare:[cmp('两次跑步同时开始。谁花的时间更长？',[['A',0,6],['B',0,9]],'longer'),cmp('两件事分别在8:00和8:20开始。哪件开始得更早？',[['A',480,500],['B',500,510]],'earlier'),cmp('A在9:00开始、9:30结束；B在9:10开始、9:20结束。谁先结束？',[['A',540,570],['B',550,560]],'first')],
 eventorder:[order('把早上的三件事按故事发生的顺序排好。',[['早餐',2],['起床',1],['出门',3]]),order('故事里今天是周三。把昨天、今天和明天排好。',[['周四：明天',1],['周二：昨天',-1],['周三：今天',0]],[choose('过一天后，原来的明天是','today',[['today','新的今天'],['yesterday','新的昨天']])]),order('按一天内的时刻从早到晚排列。',[['下午 3:00',15],['上午 9:00',9],['晚上 8:00',20]])],
 durationunit:[stopwatch('开始模拟计时，活动结束后停表。',60,[q('60秒是几分钟',1)]),stopwatch('开始模拟折纸活动，活动结束后停表。',20,[q('模拟活动持续多少秒',20)]),units('两段各1分钟的时间接起来。',[ '1分钟','1分钟'],[q('一共几分钟',2),q('一共多少秒',120)])],
 hoursday:[units('把四段各15分钟的时间接成1小时。',['15分钟','15分钟','15分钟','15分钟'],[q('1小时共多少分钟',60)]),units('钟面转两轮，每轮12小时。',['第一轮12小时','第二轮12小时'],[q('一整天多少小时',24)]),units('90分钟分成整小时和余下的分钟。',['60分钟','30分钟'],[q('整小时有几小时',1),q('余下几分钟',30)])],
 durationorder:[order('三个活动用了不同时间，从短到长排。',[['画画20分钟',20],['走路12分钟',12],['游戏35分钟',35]]),cmp('A从10:00到10:30，B从10:20到10:40。谁用的时间更长？',[['A',600,630],['B',620,640]],'longer'),steps('沿时间轴从8:50走到9:15，记录用了多久。',530,25,[q('共经过多少分钟',25)])],
 durationwork:[steps('节目从17:17到17:43。沿时间走到结束。',1037,26,[q('一共多少分钟',26)]),cmp('坐车35分钟，走路40分钟。哪个更久？',[['坐车',0,35],['走路',0,40]],'longer',[q('多多少分钟',5)]),steps('一节课10:15开始，11:00结束。',615,45,[q('一共多少分钟',45)])],
 fractiontime:[{...parts('一场比赛共90分钟，平分前后两半。选前半场。',90,2,1,[q('前半场多少分钟',45)]),requiredParts:[0]},parts('一小时分成两份，选半小时。',60,2,1,[q('半小时多少分钟',30)]),{...parts('一小时分成四份，选一刻钟。',60,4,1,[q('一刻钟多少分钟',15)]),shape:'clock'},parts('16分钟的活动分成8份。选八分之一。',16,8,1,[q('这一份多少分钟',2)])],
 elapsedtime:[steps('电影14:15开始，持续47分钟。沿时间轴走到结束。',855,47,[t24('结束时刻',902)]),steps('从9:20到10:05，共经过多久？',560,45,[q('经过多少分钟',45)]),steps('从8:50到9:15，自己分段向前走。',530,25,[q('经过多少分钟',25)])],
 hourclock:[clock('读出这个整点钟面。','read',180,[t12('数字时刻',180)]),clock('读出这个半点钟面。','read',450,[t12('数字时刻',450)]),clock('把钟面调到2:30。看短针的位置。','set',150,[choose('短针在哪里','between',[['between','2和3之间'],['at','正对2']])])],
 fiveclock:[clock('读出钟面上的时刻。','read',205,[t12('数字时刻',205)]),clock('读出9点过一刻。','read',555,[t12('数字时刻',555)]),clock('把钟调到3:40，也就是差20分到4点。','set',220,[q('离4点还差几分钟',20)])],
 ampmclock:[clock('这是上午的钟面。读出时刻并选上午或下午。','read',525,[t12('数字时刻',525),choose('这是','am',[['am','上午'],['pm','下午或晚上']])],{given:'上午'}),clock('这是下午的钟面。','read',985,[t12('数字时刻',985),choose('这是','pm',[['am','上午'],['pm','下午']])],{given:'下午'}),units('区分中午后的12:20和午夜后的00:20。',['中午后 12:20','午夜后 00:20'],[choose('午夜后是','night',[['night','00:20'],['noon','12:20']])])],
 romanclock:[clock('罗马数字钟面：读出这个时刻。','read',285,[t12('数字时刻',285)],{roman:true}),{type:'x-t32-roman',prompt:'把I到XII摆到钟面上。IV也可以写成IIII。',questions:[q('IIII表示几',4)]},units('把四个时刻的两种写法对起来。',['下午3:20','上午7:05','中午后12:20','午夜后12:20'],[t24('下午3:20的24小时写法',920),t24('上午7:05的24小时写法',425),t24('中午后12:20的24小时写法',740),t24('午夜后12:20的24小时写法',20)])],
 minuteclock:[clock('长针不在大数字上。读到准确的分钟。','read',463,[t12('数字时刻',463)]),stopwatch('开始模拟刷牙活动，活动结束后停表，再换成分钟。',120,[q('大约多少分钟',2)]),cmp('一次用1分20秒，另一次用75秒。哪次更长？',[['第一次',0,80],['第二次',0,75]],'longer',[q('相差多少秒',5)])],
 clockconvert:[clock('下午3:45，写成24小时制。','read',945,[t24('24小时写法',945)],{given:'下午 3:45'}),clock('19:30换成12小时制，并选上午或下午。','read',1170,[t12('12小时写法',1170),choose('这是','pm',[['am','上午'],['pm','下午或晚上']])],{given:'24小时制 19:30'}),units('看看午夜后和中午后的12点。',['午夜后 12:20','中午后 12:20'],[t24('午夜后12:20',20),t24('中午后12:20',740)])],
 timeconvert:[units('3小时25分钟，拆成小时和零头。',['1小时','1小时','1小时','25分钟'],[q('合起来多少分钟',205)]),units('150秒先拆成60秒、60秒和余下的秒。',['60秒','60秒','30秒'],[q('整分钟有几分',2),q('还剩几秒',30)]),units('8周和3天，先把每周都换成天。',['1周','1周','1周','1周','1周','1周','1周','1周','3天'],[q('合起来多少天',59)])],
 quarterclock:[clock('读出这个过了一刻的时刻。','read',195,[t12('数字时刻',195),choose('这是','past',[['past','3点过一刻'],['to','差一刻到3点']])]),clock('把钟调到差一刻7点。','set',405,[q('离7点还差几分钟',15)]),{...parts('钟面一圈是60分钟，选走过的一刻。',60,4,1,[q('一刻是多少分钟',15)]),shape:'clock'}],
 weekmonth:[order('把一周按周一到周日排好。',[['周四',4],['周一',1],['周六',6],['周二',2],['周日',7],['周三',3],['周五',5]]),order('把十二个月从1月排到12月。',[['5月',5],['1月',1],['9月',9],['3月',3],['12月',12],['7月',7],['2月',2],['11月',11],['4月',4],['10月',10],['6月',6],['8月',8]]),units('把一年中的12个月放进来。',['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],[q('一年有几个月',12),q('一周有几天',7)])],
 calendarfacts:[units('一分钟由60个一样长的秒组成；这里每段是15秒。',['15秒','15秒','15秒','15秒'],[q('1分钟有多少秒',60)]),units('查看平年各月的天数。',['1月31天','2月28天','3月31天','4月30天','5月31天','6月30天','7月31天','8月31天','9月30天','10月31天','11月30天','12月31天'],[q('4月有多少天',30),q('平年2月有多少天',28)]),cal('在2024年2月找到29日，比较平年和闰年。',[[2024,2]],['2024-02-29'],[q('2024年有多少天',366),choose('1900年是','common',[['common','平年'],['leap','闰年']]),choose('2000年是','leap',[['common','平年'],['leap','闰年']])])],
 calendaruse:[cal('在2026年3月找到15日，看看它是星期几。',[[2026,3]],['2026-03-15'],[choose('3月15日是','sun',[['sun','星期日'],['sat','星期六'],['mon','星期一']])]),cal('假设今天是2026年3月18日，把它在日历上找出来。',[[2026,3]],['2026-03-18'],[q('今天是3月几日',18)]),cal('从6月3日到6月17日，先选出两天，再数间隔。',[[2026,6]],['2026-06-03','2026-06-17'],[q('相隔多少天',14)]),cal('从2024年2月28日到3月1日，跨过了几天？',[[2024,2],[2024,3]],['2024-02-28','2024-03-01'],[q('相隔多少天',2)])]
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,ts])=>[id,clone(ts[0])]));
const link=(from,to,title,a,b)=>({from,to,title,summary:'先做一个，再把刚才的想法带到另一处。',tasks:[clone(a),clone(b)],phase:5,batch:'B32'});
const num12=order('先把1、2、3、4排好。',[['3',3],['1',1],['4',4],['2',2]]);
const fives=order('每次向前5，把这几个数字排好。',[['20',20],['5',5],['15',15],['10',10]]);
const romanmore=order('看看罗马数字，按10、40、44排。',[['XLIV',44],['X',10],['XL',40]]);
export const BRIDGES=[
 link('write20','hourclock','先认数字，再看钟面',num12,TASKS.hourclock[0]),
 link('halfpaper','hourclock','一半，走到半小时',T16.halfpaper[1],TASKS.hourclock[1]),
 link('durationunit','hourclock','分钟接到钟面',TASKS.durationunit[0],TASKS.hourclock[1]),
 link('durationunit','hoursday','秒、分钟与小时',TASKS.durationunit[0],TASKS.hoursday[0]),
 link('baseconversions','timeconvert','换单位，再换时间',T28.baseconversions[1],TASKS.timeconvert[0]),
 link('elapsedtime','timeconvert','走过多久，再换单位',TASKS.elapsedtime[1],TASKS.timeconvert[0]),
 link('calendarfacts','durationwork','知道单位，再量时长',TASKS.calendarfacts[0],TASKS.durationwork[0]),
 link('minuteclock','durationwork','读分钟，再计算时长',TASKS.minuteclock[0],TASKS.durationwork[0]),
 link('fiveclock','ampmclock','五分钟，放进一天',TASKS.fiveclock[0],TASKS.ampmclock[0]),
 link('ampmclock','romanclock','上午下午，换个钟面',TASKS.ampmclock[1],TASKS.romanclock[0]),
 link('fiveclock','romanclock','五分钟，换罗马数字',TASKS.fiveclock[0],TASKS.romanclock[0]),
 link('durationunit','durationorder','先量多久，再排列',TASKS.durationunit[1],TASKS.durationorder[0]),
 link('timecompare','durationorder','比两个，再排三个',TASKS.timecompare[0],TASKS.durationorder[0]),
 link('eventorder','weekmonth','先后，连到星期',TASKS.eventorder[1],TASKS.weekmonth[0]),
 link('timeconvert','timetable','换分钟，再看时刻表',TASKS.timeconvert[0],T20.timetable[0]),
 link('calendarfacts','baseconversions','时间单位，接到换算',TASKS.calendarfacts[0],T28.baseconversions[1]),
 link('hoursday','calendarfacts','小时和天，接到月份',TASKS.hoursday[0],TASKS.calendarfacts[0]),
 link('hourclock','fiveclock','半点，再走五分钟',TASKS.hourclock[1],TASKS.fiveclock[0]),
 link('skipbasic','fiveclock','五个五个数到钟面',fives,TASKS.fiveclock[0]),
 link('durationwork','elapsedtime','开始和结束，换种问法',TASKS.durationwork[0],TASKS.elapsedtime[0]),
 link('minuteclock','elapsedtime','读分钟，再算经过多久',TASKS.minuteclock[0],TASKS.elapsedtime[1]),
 link('hourclock','fractiontime','半点与半小时',TASKS.hourclock[1],TASKS.fractiontime[1]),
 link('folds','fractiontime','八份纸，八份时间',T03.folds[0],TASKS.fractiontime[3]),
 link('halfpaper','fractiontime','一半，换成一段时间',T16.halfpaper[1],TASKS.fractiontime[1]),
 link('romanclock','roman100','钟面数字，走到更多符号',TASKS.romanclock[1],romanmore),
 link('hourclock','quarterclock','半点，走到一刻',TASKS.hourclock[1],TASKS.quarterclock[0]),
 link('fractiontime','quarterclock','一小时四份，走到钟面',TASKS.fractiontime[2],TASKS.quarterclock[2]),
 link('turnroute','quarterclock','转四分之一圈，经过一刻',T25.turnroute[0],TASKS.quarterclock[2]),
 link('timecompare','durationunit','先比较，再量多久',TASKS.timecompare[0],TASKS.durationunit[1]),
 link('weekmonth','calendaruse','认识月份，再找日期',TASKS.weekmonth[1],TASKS.calendaruse[0]),
 link('calendarfacts','calendaruse','月份天数，接到日历',TASKS.calendarfacts[2],TASKS.calendaruse[0]),
 link('ampmclock','minuteclock','一天两次，再读小格',TASKS.ampmclock[0],TASKS.minuteclock[0]),
 link('durationorder','minuteclock','比较时长，再读分钟',TASKS.durationorder[0],TASKS.minuteclock[0]),
 link('quarterclock','minuteclock','一刻，再读到每分钟',TASKS.quarterclock[0],TASKS.minuteclock[0]),
 link('romanclock','clockconvert','两套钟面，两个时刻写法',TASKS.romanclock[2],TASKS.clockconvert[1])
];
