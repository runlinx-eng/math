const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B07'});
export const LESSONS={
 tenexchange:item('mt_r0VXbfAmsH','十颗装成一条，还是十颗吗','十个一与一个十','十个一换成一个十，数量没有增减；也能拆回来。条上的十格说明它并不是一个一。','拆开一条，为什么不是增加了九颗？'),
 twoplaces:item('mt_THl9GLxwoL','同一个4，站哪里很重要','两位数的位值','47中的4表示四个十，即40；7表示七个一。数字的位置决定它所表示的单位。','47和74用了同样的数字，数量为什么不同？'),
 decades:item('mt_zfy1gOEewd','只有整条，最后写什么','整十数与零占位','30是三个十和零个一。个位的零保留了位置，30不是3。','50拿走一条后，个位为什么仍是零？'),
 rename:item('mt_Bt-iORUzdO','换个装法，一颗也没变','两位数的非标准分拆','34可以是三个十加四个一，也可以是两个十加十四个一。拆包只改变表示，不改变总量。','只剩散颗时，还能认出原来的总数吗？'),
 shift10:item('mt_kw7xmp68rU','多一整条，哪些不用重数','多十、少十与位值','添一条十就是加十，拿走一条就是减十。未跨百时，个位保持，十位相应变化；跨百还需换装。','多十和多一，物品上分别改变了什么？'),
 twoproblems:item('mt_kJGCjnuelW','用整包装法，解决一件事','用位值与数的组成解决问题','可以先把整十与零散的一分开，再添取、合并；倒推原来的数量也能用相反的操作。','知道最后45并且添过10，怎样找回原来多少？'),
 compare100:item('mt_U0waNfD8PB','先看哪一堆，能更快比','两位数的比较与排序','先比较整十；十相同才比较一。相同的数量用等号，关系符号的开口朝较大数。','个位大，整个数就一定大吗？'),
 faces100:item('mt_9L3NQqgqRd','一堆、几条和一个位置','一百以内数的表示与估计','同一数量可以用方块、简图、百数表和数轴表示。估计是先判断大约多少，再用准确计数核对。','估计和准确数清，分别在什么时候有用？'),
 parity:item('mt_hniI4E-OCE','两两做伴，会剩一个吗','奇数、偶数与相等加数','每件都能两两配对、没有剩余的是偶数；剩一个的是奇数。偶数也能分成相等的两组；零也没有剩余。','为什么加一个会改变有没有剩余？'),
 words100:item('mt_76SPWvdI7r','给一大包写个中文标签','百以内的数词与数量（中文适配）','五十七、57、五个十和七个一可以指同一数量。这里练中文数词，原英文拼写目标没有被评估。','五十七为什么不能写成507？'),
 read120:item('mt_XV0B4kWwqL','过了一百，还能接着数','一百二十以内的读写与计数','99后面是100，再到101；108保留空十位。按位写数字，不能把一百和八拼成1008。口述流利度不自动评估。','108中间的零在替谁留位置？'),
 faces120:item('mt_QguIGVMB1o','一百之外，也放得进去','一百二十以内的多种表示','112可以用十一条十和两个一，也能换成一百、一十和二个一。数表与数轴仍保持每一步增加一。','十一条十与一个百一个十有什么联系？'),
 hundredexchange:item('mt_8gy7uxRlF6','十条并在一起，成为一整板','十个十与一个百','一百是十个十，也是100个一。百格板的一排是十，一共十排；合成和拆开都守恒。','一板看起来只有一块，为什么表示100？'),
 threeplaces:item('mt_aPBzD28_mT','三格位置，空格也算数','三位数的位值与展开','362由300、60、2组成；706里没有零散的十，但必须保留十位的零。','706写成76，会改变哪部分的数量？'),
 hundreds:item('mt_R2ccrI-nKD','整板往上加，两个零去哪','整百数与数轴位置','300是三个百，十位和个位都是零；这不妨碍把300全换成30个十。数轴上每一百的间距相同。','300的十位是0，为什么还可以换成30条十？'),
 shift100:item('mt_izien3ZX51','加一条、加一板，哪里会动','三位数的多十少十、多百少百','加减十或百先改变相应单位的数量。遇到十条或没有可拿的条，要合成或拆开百；因此可能有多个数字一起改变。','300拿走10，为什么百位和十位都变了？'),
 compare1000:item('mt_AQcVRBddko','把空位对齐，再比较','一千以内的比较与排序','从最高位开始比，相同才往右。305与350的百相同，由十位决定大小；99还不到一个百。','为什么608比680小，却比86大？'),
 problems1000:item('mt_98c2qwEF7Q','有多少整包，怎样付刚好','位值的实际应用与重新单位化','同一总量可按百、十、一重新分组。问整共有多少个十，和问十位数字，是不同的问题。','236能装多少个十个一包，剩几个？'),
 words1000:item('mt_VFsuftfvYM','给三位数翻译三种写法','一千以内数的读写和展开（中文适配）','数字、中文数名与展开式可以互相对应。内部或末尾的零要按位保留；展开十位要写它的值。','637里，3为什么要展开成30？'),
 faces1000:item('mt_F_zEAJ8VIo','把大数放在合适的位置','一千以内的表示与估计','数轴的相对位置反映数量；507的十位为空；3百14十2一与442等量。表示变化时用交换检查。','点在0到1000的四分之三附近，大约表示多少？'),
 screen1000:item('mt_HczwO1sr-y','十个百，能合成什么','一千以内的屏幕构造与排序','十个百可以合成一个千，也能拆回。屏幕构造、数位和数轴位置需表达同一数量；实物操作仍需实际尝试。','千还能拆成多少条十？先想想怎样交换。'),
};
const route=(id,title,section,ids)=>({id,title,section,packIds:['number-sense'],themeId:'numbers',color:'#ae8259',ids});
export const ROUTES=[route('X','十颗、一条、两位数','symbol',['tenexchange','twoplaces','decades']),route('Y','换装以后，解决问题','symbol',['rename','shift10','twoproblems']),route('Z','比一比，配成对','count',['compare100','faces100','parity']),route('AA','数字走过一百','walk',['words100','read120','faces120']),route('AB','十条，换成一板','symbol',['hundredexchange','threeplaces','hundreds']),route('AC','大数也能看清和用上','count',['shift100','compare1000','problems1000']),route('AD','大数的几种样子','symbol',['words1000','faces1000','screen1000'])];
export const units=n=>[Math.floor(n/100),Math.floor(n/10)%10,n%10,0];
const bench=(n,prompt,extra={})=>({type:'x-pvbench',n,prompt,...extra});
const shift=(start,delta,prompt)=>({type:'x-pvshift',start,delta,prompt});
const line=(n,max,prompt,extra={})=>({type:'x-pvline',n,max,prompt,...extra});
const order=(values,max,prompt)=>({type:'x-pvorder',values,max,prompt});
const compare=(a,b,prompt)=>({type:'x-pvcompare',a,b,prompt});
export const TASKS={
 tenexchange:[bench(10,'把十颗合成一条，再拆回来。换装时有丢掉或添进来吗？',{start:[0,0,10,0],fixed:true,exchanges:['up1','down1'],end:[0,0,10,0],why:'same'}),bench(30,'这三条一共是多少颗？拆开一条看看，再写总量。',{start:[0,3,0,0],fixed:true,exchanges:['down1'],end:[0,2,10,0],why:'same'})],
 twoplaces:[bench(47,'搭出47，把每部分值多少也写下来。',{expanded:true}),bench(74,'换成74。用相同的数字，重新搭一次。',{expanded:true}),bench(60,'搭60。空着的一格也要写出它的值。',{expanded:true})],
 decades:[bench(30,'只放整条，搭出30。再记下两部分的值。',{expanded:true}),bench(50,'搭出50，找出它在0到100之间的位置。',{position:true,max:100}),bench(80,'这张“八十”标签应该对应多少条？搭好并写数字。',{words:[80]})],
 rename:[bench(34,'数量已经装好了。拆开一条，换成两条和十四颗，再保存这种装法。',{start:[0,3,4,0],fixed:true,exchanges:['down1'],end:[0,2,14,0],saveCount:1,why:'same'}),bench(52,'把52留下三种不同装法。每换一种，点“留下这一种”。',{start:[0,5,2,0],fixed:true,saveCount:3}),bench(46,'四条六颗与三条十六颗能一样多吗？亲自换装并记录总量。',{start:[0,4,6,0],fixed:true,exchanges:['down1'],end:[0,3,16,0],why:'same'})],
 shift10:[shift(56,10,'原来56，多一整条。先猜总数，再放进去。'),shift(56,-10,'这次少一整条。先猜，再拿走。'),shift(73,10,'73再多10。先记猜想，再用一条检查。'),shift(40,-10,'40拿走一条，零散的颗粒会变吗？')],
 twoproblems:[shift(34,20,'已有34颗，再送来两包，每包10颗。用添包的方法检查总量。'),shift(45,-10,'添过一包10颗以后有45颗。倒着拿回这一包，找原来有多少。'),bench(68,'营地要68枚徽章。每包10枚。备好整包和零散的，把两部分值写出来。',{expanded:true,forms:['sticks','blocks']})],
 compare100:[compare(34,43,'搭出两堆，再比34与43。先看哪一格？'),compare(57,53,'整条一样多，要接着看哪里？'),order([62,26,60,9],100,'把四张卡从小到大排好，再分别放在数轴上。')],
 faces100:[line(47,100,'把47放在大约合适的位置。先看40、50两站。',{tolerance:3,bounds:[46,49],near:[40,50]}),bench(63,'用方块做63，留下后换成线条和点，重新做一次。最后在百数表点63。',{forms:['blocks','sticks'],chart:100}),{type:'x-pvestimate',n:38,prompt:'先估这堆大约多少，留下猜想。再一颗一颗标记，看看实际有多少。'}],
 parity:[{type:'x-pvpair',n:13,prompt:'点两颗组成一对，配到不能再配。有没有剩下一颗？'},{type:'x-pvpair',n:8,equation:true,prompt:'八颗两两配好。数每一对的累计数量，再把两边写成相加的式子。'},{type:'x-pvpair',n:0,equation:true,prompt:'没有珠子时，会剩下一颗吗？看看0能不能写成两个一样的数相加。'},{type:'x-pvpair',n:16,equation:true,prompt:'换成十六颗。配完后记下两边各多少。'}],
 words100:[bench(57,'读“五十七”，搭出它，再写数字。',{label:'五十七'}),bench(83,'给83写一个中文标签，并搭出一样多。',{words:[83]}),bench(30,'搭三十，再给这些整十数写中文名字。',{words:[20,30,40,50,60,70,80,90]})],
 read120:[{type:'x-countwalk',start:47,step:1,count:73,prompt:'从47一直接到120。每次先填下一站再走，跨过99和109时留意一下。口头数可以一起练，这里只记你写下的站点。'},bench(108,'看108，搭出数量，自己写中文名字。中间空着的位置怎么办？',{words:[108],expanded:true}),bench(115,'把“一百一十五”装出来，再写成数字。',{label:'一百一十五'})],
 faces120:[{type:'x-countboard',max:120,holes:Array.from({length:20},(_,i)=>101+i),prompt:'把百数表向后接到120，特别看看107和116各在哪里。'},bench(112,'先用十一束十和两根做112，留下后换成方块重新做；两次可以装得不同。',{forms:['sticks','blocks'],firstEnd:[0,11,2,0]}),order([98,120,104,111],120,'跨过一百以后，仍按数量排队。再分别放到数轴。')],
 hundredexchange:[bench(100,'十条并成一板，再拆回来。看看每排和全部分别有多少。',{start:[0,10,0,0],fixed:true,exchanges:['up10','down10'],end:[0,10,0,0],why:'same'}),bench(100,'一板能拆成多少条？拆开，再把一条拆成颗粒。总数还一样吗？',{start:[1,0,0,0],fixed:true,exchanges:['down10','down1'],end:[0,9,10,0],why:'same'})],
 threeplaces:[bench(362,'用整板、整条、散颗做362，记下各部分的值。',{expanded:true}),bench(485,'换成485，再写成几百加几十加几。',{expanded:true}),bench(706,'做706。十位空着，记录时要不要留一个0？',{expanded:true,why:'zero'})],
 hundreds:[bench(300,'搭300，写下各部分的值；试着说明两个0留下了什么位置。',{expanded:true,why:'zero'}),order([800,200,500,1000],1000,'把整百卡按大小排好，再放到数轴的站点。'),bench(600,'给600写中文名字，并搭出它的数量。',{words:[600],expanded:true})],
 shift100:[shift(638,10,'638加一条十，先猜再试。'),shift(638,-10,'638拿走一条十，先猜再试。'),shift(638,100,'638添一板百，会改变哪里？'),shift(638,-100,'638拿走一板百，会改变哪里？'),shift(190,10,'190再加10。现在有十条了，合成一板后写数字。'),shift(300,-10,'300没有散着的十条。先拆一板，拿走一条，看看变成多少。')],
 compare1000:[compare(305,350,'搭305和350。百一样时，看哪一格决定大小？'),compare(352,358,'这次百和十都一样，再看哪一格？'),compare(99,100,'99与100对齐位置，先看哪一格？'),compare(407,407,'两边相同，要用什么关系符号？'),compare(860,608,'左边更大时，关系符号怎样转过来？'),order([608,86,680,860],1000,'把四个数从小到大排好，再按数量定位。')],
 problems1000:[bench(236,'236颗要装成10颗一包。只留整条和散颗，记录有几包、剩几颗。',{start:[2,3,6,0],fixed:true,exchanges:['down10','down10'],end:[0,23,6,0],packReport:true}),bench(407,'用100元、10元、1元的虚拟代币，正好付407元。把各部分金额写下来。',{money:true,expanded:true,why:'zero'}),bench(362,'仓库有362件。不添不取，试着拆开一条，留下前后两种装法。',{start:[3,6,2,0],fixed:true,saveCount:2})],
 words1000:[bench(342,'搭342，写成中文名字，再写各部分的值。',{words:[342],expanded:true}),bench(306,'换成306。名字和数字中空着的十位怎样处理？',{words:[306],expanded:true}),bench(340,'这次空的是个位，搭好再写中文名字。',{words:[340],expanded:true}),bench(637,'将637搭出来，并分别写成几百、几十和几。',{expanded:true})],
 faces1000:[line(346,1000,'把346放在合适的位置，应在300和400之间、略靠近中间的左边。',{tolerance:15,bounds:[330,349],near:[300,400]}),line(750,1000,'这个没有写数字的点，大约是几？先写估计再检查。',{readPoint:true,tolerance:30}),bench(507,'做507，并在记录中留出空十位。',{expanded:true,why:'zero'}),bench(442,'这里有3板、14条、2颗。合并能合并的，读出它们共同表示的数。',{start:[3,14,2,0],fixed:true,exchanges:['up10'],end:[4,4,2,0],expanded:true})],
 screen1000:[bench(347,'在屏幕上搭347，再用线条与点重做一次，写各部分的值。',{forms:['blocks','sticks'],expanded:true}),order([608,680,86,860],1000,'把这四张卡排好并放到0–1000数轴。'),bench(1000,'十板百合成一千，再拆开并合回去。最后写数字。',{start:[10,0,0,0],fixed:true,exchanges:['up100','down100','up100'],end:[0,0,0,1],why:'same'})],
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,t])=>[id,structuredClone(t[0])]));
const link=(from,to,title,summary,tasks)=>({from,to,title,summary,tasks:tasks.map(t=>structuredClone(t)),phase:5,batch:'B07'});
export const BRIDGES=[
 link('tenexchange','twoplaces','一条十，变成数字里的十','用十颗合条，再让数字记录有几条。',[TASKS.tenexchange[0],TASKS.twoplaces[0]]),
 link('twoplaces','rename','一个数，不止一种装法','标准分拆和重新换装始终保持同一总量。',[TASKS.twoplaces[0],TASKS.rename[1]]),
 link('twoplaces','shift10','看懂整条，才知道怎样加十','位值组成连接到实际添取。',[TASKS.twoplaces[1],TASKS.shift10[0]]),
 link('twoplaces','compare100','先比较哪一种单位','整十表示较大的单位，比较相同时再看一。',[TASKS.twoplaces[0],TASKS.compare100[0]]),
 link('compare100','faces120','比较带着位置越过一百','排序和数轴位置表达同一大小关系。',[TASKS.compare100[2],TASKS.faces120[2]]),
 link('tenexchange','hundredexchange','十个合一组，这个办法能继续','同一个交换关系，从一与十延伸到十与百。',[TASKS.tenexchange[0],TASKS.hundredexchange[0]]),
 link('hundredexchange','threeplaces','整板百，也有一个位置','新的单位连接到新的数位。',[TASKS.hundredexchange[1],TASKS.threeplaces[0]]),
 link('threeplaces','shift100','空位时，先拆还是先拿','位值不只是读数，还能解释进退位。',[TASKS.threeplaces[2],TASKS.shift100[5]]),
 link('threeplaces','problems1000','问有多少包，先换成那种包','十位数字与总共有多少个十不同。',[TASKS.threeplaces[1],TASKS.problems1000[0]]),
 link('faces100','faces1000','数变大，表示之间仍相通','同样的数轴和单位关系扩展到一千。',[TASKS.faces100[0],TASKS.faces1000[0]]),
 link('faces1000','screen1000','几种表示，最后指向同一个量','位置、分组与数位保持对应。',[TASKS.faces1000[3],TASKS.screen1000[2]]),
];
