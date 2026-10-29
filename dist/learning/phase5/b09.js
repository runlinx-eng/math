import{TASKS as B07}from'./b07.js';import{TASKS as B06}from'./b06.js';import{TASKS as B08}from'./b08.js';
const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B09'});
export const LESSONS={
 linejumps:item('mt_19j_5AuuQI','把一笔计算画成一段路','数轴上的加减与等距刻度','数轴的间隔表示数量。38加27可以先走20再走7；52减24向左走。箭头长度表示改变了多少，终点表示结果。屏幕按比例画图，不等于已会徒手作图。','38到58这一段，为什么写20而不是58？'),
 toolchoice:item('mt_zMEvtigoM3','这件事，用哪件工具顺手','按目的选择数学工具','数轴适合看跳了多远，百数表能按十和一移动，小方块便于看少量物品怎样合起来。量实际长短要用有单位的尺；长物体可换长尺或分段量。没有永远最好的工具。','短丝带和高门，换工具后能少做哪些重复动作？'),
 negativefirst:item('mt_vXRzMbiPff','走到零，还能往前走吗','负数、顺序与零的参照','从5倒数会经过0，再到−1、−2。负数在零左侧，−5比−2小。温度的0是标尺参照，不是“没有温度”。','−5里的5更大，为什么−5反而比−2小？'),
 negativecontext:item('mt_1KkvzwYxbR','从零下走到零上','情境中的负数与跨零间隔','从−4℃升高7度，可以先走4度到0，再走3度到3℃。地面、海平面或温度标尺的零各有自己的含义。画面是模拟情境。','从−4到3，为什么不是走了1步？'),
 signedwalk:item('mt_9QzSnn8m80','方向也能被拿走吗','有符号数的加减','加上负数朝左；减去一个变化，要反向撤销它。1−(−3)撤销向左3，相当于向右3。减号是操作，括号里的负号说明方向。','1−(−3)里两个减号，分别告诉你什么？'),
 distancezero:item('mt_RWUY7_IXvw','站在哪里，和离家多远','绝对值与零点距离','绝对值是数轴上离0的距离，总不小于0。−5和5的位置不同，距离都是5。−8比−3小，却离0更远；位置大小与距离大小不能混为一谈。','欠8元和欠3元，谁的余额更小，谁欠得更多？'),
 allowedrange:item('mt_i2F1nWxJjv','可以选的数，是一个还是一片','不等式与解集','至少12表示x≥12：包括12，并且所有更大的数都可以。空心点不含端点，实心点包含端点。同加减或同除正数保持大小关系；3x+1<10可化成x<3。','x<3为什么不只是“答案等于2”？'),
 powerblocks:item('mt_hCVPYlF-7Y','每条边一样长，会有多少块','平方、立方、整数幂与方根','平方是两个相同因子相乘，立方是三个；方根反过来找边长。10个2相乘是2¹⁰。乘方先于加法，3+2²=7。√2是精确数，1.414只是近似值，二者不能写等号。','64块拼成正方体，每条边几块？为什么不是64÷3？'),
 numberworld:item('mt_b4lbTOJYwI','两点之间，还能放进新点吗','有理数、无理数与数的稠密性','能写成整数之比、且分母非0的数是有理数，小数会终止或循环。√2、π是无理数，√9=3却是有理数。两个不同实数之间总能取中点，再取中点，因此有无穷多个数。有限次缩放只演示，不能代替这个理由。','0.333…很长，为什么还是分数？把两点放得再近，会没有中点吗？'),
};
const route=(id,title,section,ids)=>({id,title,section,packIds:['number-sense'],themeId:'numbers',color:'#ae8259',ids});
export const ROUTES=[route('AN','沿着数轴走','walk',['linejumps','toolchoice']),route('AO','零的另一边','walk',['negativefirst','negativecontext','signedwalk']),route('AP','位置、距离和可选范围','count',['distancezero','allowedrange']),route('AQ','方块与数不完的新数','symbol',['powerblocks','numberworld'])];
const place=(values,min,max,prompt,extra={})=>({type:'x-signedline',mode:'place',values,min,max,prompt,...extra});
const walk=(start,end,prompt)=>({type:'x-signedline',mode:'walk',start,end,min:Math.min(start,end)-1,max:Math.max(start,end)+1,prompt});
const jump=(start,op,operand,min,max,prompt,extra={})=>({type:'x-directedjump',start,op,operand,min,max,prompt,...extra});
const distance=(values,prompt,extra={})=>({type:'x-zerodistance',values,min:-10,max:10,prompt,...extra});
const rule=(bound,relation,prompt,extra={})=>({type:'x-allowedrange',bound,relation,min:Math.min(-5,bound-5),max:Math.max(15,bound+5),prompt,...extra});
const power=(base,pow,prompt,extra={})=>({type:'x-powerbuild',base,pow,prompt,...extra});
export const SET_CARDS=[{label:'0.75',kind:'rational',fraction:[3,4],why:'ends'},{label:'0.333…（3一直重复）',kind:'rational',fraction:[1,3],why:'repeats'},{label:'√9',kind:'rational',fraction:[3,1],why:'root9'},{label:'√2',kind:'irrational',why:'root2'},{label:'π',kind:'irrational',why:'pi'},{label:'1.414（到这里结束）',kind:'rational',fraction:[707,500],why:'ends'}];
export const TASKS={
 linejumps:[place([15,38,65],0,100,'把15、38、65各自放在线上。相同差距要用相同长度。'),jump(38,'+',27,0,100,'从38出发，先向右走20，再走7。每一跳标改变了多少。',{path:[20,7]}),jump(52,'-',24,0,100,'在这条只标两端的线上，从52出发，自己画出减24的两跳。',{parts:2,sparse:true}),jump(47,'+',16,0,100,'换成47加16。自己分成两跳，记录起点与结果。',{parts:2})],
 toolchoice:[{type:'x-toolwork',mode:'calculate',start:34,change:28,prompt:'算34+28。选数轴或百数表，用十和一走到结果；也可以换工具比较。'},{type:'x-toolwork',mode:'calculate',start:72,change:-36,prompt:'换成72−36，选一个工具实际做一遍。'},{type:'x-toolwork',mode:'small',a:2,b:3,prompt:'两颗红珠和三颗蓝珠合起来。选能直接看见两小堆的工具，亲自摆出来。'},{type:'x-toolwork',mode:'measure',start:5,length:18,unit:'cm',maxSegments:1,prompt:'这条模拟丝带有多长？选尺，零点对起端，末端读到哪里就留下这一段。'},{type:'x-toolwork',mode:'measure',start:7,length:180,unit:'m',maxSegments:2,prompt:'给模拟门量高，尽量只量两段。短尺还是米尺更合适？每段接着前一段，最后用米记录。'}],
 negativefirst:[walk(5,-3,'从5往回数，每走一步先写下一个数。经过零以后继续。'),place([-5,-2,0],-6,3,'把−5、−2和0放好，再比较−5与−2。',{compare:[0,1]}),place([-5],-10,10,'模拟温度是−5℃。找到它，并说明标尺上的0是什么。',{context:'温度',zero:true})],
 negativecontext:[place([-3,-1,0,2,5],-5,6,'地面是0层。把这些模拟楼层各自放在线上。',{context:'楼层',zero:true}),jump(-4,'+',7,-10,10,'模拟温度从−4℃升高7度。先到0，再接着走剩下的一段。',{path:[4,3],context:'温度'}),walk(3,-2,'从3层向下，一层层经过地面，继续到地下两层。')],
 signedwalk:[jump(-3,'+',5,-10,10,'模拟余额从−3出发，加上5。先猜，再画出实际变化。',{zero:true}),jump(4,'+',-7,-10,10,'4+（−7）：括号里的数表示向左7。亲自画出这段变化。'),jump(4,'-',7,-10,10,'4−7：从4撤掉向右7的变化，实际会朝哪边走？'),jump(1,'-',-3,-10,10,'1−（−3）：先画括号里从0向左3的变化，再反向撤销它。',{reverse:true}),jump(-2,'-',-5,-10,10,'−2−（−5）：先画要撤销的变化，再让起点−2沿相反方向走。',{reverse:true}),jump(-4,'+',-2,-10,10,'已经在−4，又加上−2。自己选方向与长度。')],
 distancezero:[distance([-5,5],'把−5和5放好，各自描出离0的路程，再记距离。'),distance([-2.5,1.25,0],'换成−2.5、1.25和0。距离可以有小数，也可以是零。'),distance([-8,-3],'模拟两人的余额为−8元、−3元。比较数值大小，再比较各自欠款的大小。',{compare:true})],
 allowedrange:[rule(12,'>=','长度至少12厘米。x可以取哪些长度？画出范围，用符号写下，并试一试两边。'),rule(-2,'>','所有大于−2的数都可以。把端点和方向做出来，−2本身算不算？'),rule(5,'<=','盒子里的数加3不能超过8。两边一起改变，直到只剩一个盒子，再画可选范围。',{algebra:{a:1,b:3,rhs:8}}),rule(3,'<','3个相同盒子再加1，总数小于10。先移去相同的1，再平均分成3份。',{algebra:{a:3,b:1,rhs:10}}),rule(1,'between','至少1，同时小于4。两端都要决定包不包括，范围是一整段。',{upper:4,min:-1,max:6})],
 powerblocks:[power(4,2,'每行4块，也有4行。亲自铺满，再写两个4相乘。'),power(4,3,'长、宽、高都是4块。逐层搭满，转到背后看看，再写三个4相乘。'),power(null,2,'要铺成一个正方形，一共49块。改变每边数量，找到刚好能铺满的边长。',{target:49}),power(null,3,'64块要搭成各边一样长的正方体。先猜每边几块，再搭出来。',{target:64}),{type:'x-powerchain',base:2,count:10,prompt:'从1开始，每次乘2。先写下一站再留下，做到十个2相乘。'},{type:'x-powerchain',base:3,count:5,prompt:'从1开始，每次乘3，做到五个3相乘。'},{type:'x-powerchain',base:5,count:4,prompt:'5⁴不是5×4。每次乘5，亲自接出四次。'},{type:'x-powerchain',base:2,count:2,add:3,prompt:'算3+2²：先把两个2相乘，再把3加进去。'},{type:'x-rootwindow',prompt:'√2的准确位置在哪？找一小段，两端各自平方后，一个小于2，一个大于2；再把范围缩小。'}],
 numberworld:[{type:'x-decimalmachine',n:3,d:4,prompt:'把3平均分给4份。每次把余数拆成十份，再分一轮，看看小数会不会停。'},{type:'x-decimalmachine',n:1,d:3,prompt:'把1平均分给3份。做一轮后，余数是不是又回来了？'},{type:'x-decimalmachine',n:1,d:6,prompt:'把1平均分给6份。先出现一个不同的数字，再看看哪一部分开始重复。'},{type:'x-numbercards',cards:SET_CARDS,prompt:'用刚才的分份与平方经验，逐张放好卡片。能写成分数的自己写；不能的，要看依据，不能只看小数长短。'},{type:'x-betweenpoints',a:[1,4],b:[1,3],rounds:3,prompt:'1/4与1/3之间，找一个新数，再选一边放大。连做三次，看看什么时候能继续。'},{type:'x-betweenpoints',a:[12,100],b:[13,100],rounds:3,prompt:'换到0.12与0.13之间。写分数或小数都可以；每次找中间，再放大一边。'}],
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,t])=>[id,structuredClone(t[0])]));
const link=(from,to,title,summary,tasks)=>({from,to,title,summary,tasks:structuredClone(tasks),phase:5,batch:'B09'});
export const BRIDGES=[
 link('faces100','linejumps','位置也能变成一段路','先找到一个数，再让变化成为按比例的一段路。',[B07.faces100[0],TASKS.linejumps[1]]),
 link('withinthousand','negativefirst','倒着数，经过零继续','保持每步少一，数轴延伸到零左侧。',[B06.withinthousand[0],TASKS.negativefirst[0]]),
 link('negativefirst','negativecontext','把零的另一边用起来','负数的位置与模拟温度的跨零变化相连。',[TASKS.negativefirst[1],TASKS.negativecontext[1]]),
 link('signedwalk','distancezero','位置和走过的距离分开看','符号决定方向，距离记录离零多远。',[TASKS.signedwalk[1],TASKS.distancezero[2]]),
 link('powerblocks','numberworld','平方找不到整数边长时','平方与根连接到精确数、近似值和数的类别。',[TASKS.powerblocks[8],TASKS.numberworld[3]]),
 link('powerblocks','standardform','重复乘十，也能写短一点','整数幂的重复乘法连接到科学记数法。',[TASKS.powerblocks[6],B08.standardform[0]]),
];
