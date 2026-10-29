const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B03'});
export const LESSONS={
 equalparts:item('mt_Xp-rj46S2w','样子不同，分到的一样多吗','等分与等量','平均分看每份的量是否相同，不只看轮廓。圆的三份各占相同角度，方格图里每份覆盖相同格数。','长条和方块为什么都能是四分之一？'),
 notation:item('mt_vKcxX6iNOA','给取出的这份写个名字','分数的记法与分类','分母表示一个整体分成多少等份，分子表示取了多少份。单位分数也是一种真分数；达到一个整体的是假分数，整份加零头可以写成带分数。','5/4 和 1 又 1/4 为什么描述同一个量？'),
 folds:item('mt_gC-6JXAG5S','再对折一次会怎样','二分之一、四分之一与八分之一','每次对折把每份再一分为二：份数加倍，每份减半。2/8 与 1/4 占同一个整体的相同面积。这里是折痕模拟，真实纸张可再动手核对。','圆和方形都能取八分之一，整体变了，八分之一的意思变了吗？'),
 amounts:item('mt_cFltwUQi-d','一份到底是多少','数量、面积和长度的分数','找 12 个的三分之一，先把全部平均分成三组，再取一组。图形和线段也先确定整体、平均分、再取所需份数。','为什么 12 个的三分之一是 4，而不是 3？'),
 fractionline:item('mt_NoB20kVa4w','从零走到这一份','数轴上的分数','把 0 到 1 分成 b 段，每段是 1/b；a/b 是从零走 a 段。分四段只需要三个内部刻度，数的是间隔而不是点。','1/3 和 1/6，哪一步更长？为什么？'),
 visualeq:item('mt_FbDKeLfBCo','分法变了，量变了吗','等值分数的面积表示','同样长的整体，涂色末端对齐就表示相同的量。每份继续等分时，取的份数和总份数一起改变；只改一个数通常会改变量。','2/3 和 4/6 一样多，那 2/6 呢？'),
 hundredths:item('mt_doX1BhmFgk','把一小格再分十份','百分之一','一个整体的十分之一再分成十份，每小份是百分之一。十个百分之一才组成一个十分之一，数过 10/100 还能继续到 11/100、12/100。','为什么分成的份数更多，每一份反而更小？'),
 decpercent:item('mt_W17Kbwm0-u','同一个量，三种写法','小数、分数与百分数','小数点前是整份，后面依次是十分位、百分位。百分数把整体看成 100 份：1/2 = 0.5 = 50%。同一整体的量不因记法改变。','0.09 为什么是 9%，不是 90%？'),
 scale:item('mt_VKW8lOcFaw','乘完一定变大吗','乘法作为缩放','对正数，乘大于 1 的正数变大，乘小于 1 的正数变小，乘 1 不变。n/n 等于 1，分数上下同乘 n 只改变分法。','先不算结果，怎样判断乘 3/4 后会变大还是变小？'),
 ratios:item('mt_ePXg_XyCKU','按两种颜色来分','比的条形模型','3:2 是三块与两块，每块一样大。先用总量除以总块数，再求两边各有多少。条形看份数，表格查数值，双数轴看两个量一起变化。','为什么按 3:2 分 20，要先分成 5 份，而不是 3 份？'),
};
export const ROUTES=[
{id:'G',section:'portion-work',title:'先分开，再取一份',packIds:['same-amount'],themeId:'numbers',color:'#ba9861',ids:['equalparts','notation','folds','amounts']},
{id:'H',section:'portion-number',title:'在不同画法里找同一个量',packIds:['same-amount'],themeId:'numbers',color:'#b19b6d',ids:['fractionline','visualeq','hundredths']},
{id:'I',title:'一起变大或变小',packIds:['scaling'],themeId:'numbers',color:'#a58961',ids:['decpercent','scale','ratios']},
];
const fraction=(n,d,prompt,extra={})=>({type:'x-fraction',n,d,prompt,...extra});
const line=(n,d,prompt,extra={})=>({type:'x-fline',n,d,prompt,...extra});
const wall=(n,d,denominators,prompt)=>({type:'x-fwall',n,d,denominators,prompt});
export const TASKS={
 equalparts:[{type:'x-circlecut',prompt:'移动两条分界线，把圆分成三份一样多的。为每份写下它占整个圆的几分之一。'},{type:'x-mosaic',prompt:'用四种颜色分这张纸，每种颜色分到一样多的格子。保存一种分法，再改成另一种分法。形状可以不同。'}],
 notation:[fraction(1,4,'把纸带平均分好，取四份里的一份。两个数字各管什么？',{classify:true}),fraction(3,4,'还是同样大小的整体，这次取四份里的三份。',{classify:true}),fraction(5,4,'要取五个四分之一。一条纸不够时，继续在下一条上取。',{classify:true,mixed:true}),wall(1,2,[2,4],'给同样长的两条纸涂出半份，写下两种名字。')],
 folds:[{type:'x-foldpaper',prompt:'把纸带对折、再对折、再对折，记录每次摊开有几份。'},{...wall(1,4,[4,8],'两张等大的披萨图，一张分四份、另一张分八份。先取一块四分之一，再在另一张取一样多。'),round:true},fraction(1,8,'把方形分成八份，涂出一份。',{shape:'square'}),fraction(1,8,'换成一个圆，再分出一份八分之一。',{shape:'circle'})],
 amounts:[{type:'x-fgroups',count:12,groups:3,prompt:'把全部 12 颗珠子分进三组，每组一样多。选其中一组，看看总数的三分之一是多少。'},fraction(3,4,'用这张纸表示四分之三。'),line(1,4,'把整条长度看作 1。分好后，从零走到四分之一。')],
 fractionline:[line(1,4,'先把 0 到 1 分成四段，再走一段。'),line(1,3,'换成三段，走到三分之一。'),line(1,6,'同样长的线分六段，再走一段。和刚才相比呢？'),line(3,4,'把每一步设成四分之一，从零走三步。'),line(5,6,'自己分好线，再走到六分之五。'),line(5,8,'这次刻度与点已经画好。读出每一段和这个点的名字。',{read:true})],
 visualeq:[wall(1,2,[2,4],'涂出同一个半份，看两条纸的末端是否对齐。'),wall(2,3,[3,6,9],'在三种分法中找出同样多的量：三份取二份。'),{...wall(2,3,[3,6],'把上面涂成 2/3，下面涂成 2/6。只改下面的数，量还相等吗？'),unequal:true}],
 hundredths:[{type:'x-hundredsplit',prompt:'整体已分成十条。把其中一条再分十份，给最小一份命名，再从 3 份一份份数到 12 份。'},...[3,7,9].map(n=>line(n,10,`放大看 0 到 1/10 这一段。把点放到 ${n}/100，再给每小段和点命名。`,{end:.1}))],
 decpercent:[{type:'x-decvalue',cents:235,prompt:'搭出 2 个整份和 35 个小格，分别用小数、分数和百分数记录。'}, {type:'x-decvalue',cents:50,prompt:'给百格涂出一半，用三种写法记录同一个量。'},{type:'x-decvalue',cents:9,prompt:'只涂 9 个百分格，再记录三种写法。注意 9 所在的位置。'}],
 scale:[...[ [3,4],[5,3],[2,5] ].map(([n,d])=>({type:'x-scale',base:7,n,d,prompt:`长 7 的纸带乘 ${n}/${d}，会变长、变短还是不变？先预测，再拉到这个倍数核对。`})),wall(3,4,[4,8],'上下同时乘 2，涂色的量会改变吗？用两条纸来检查乘 2/2。')],
 ratios:[{type:'x-ratio',a:3,b:2,total:20,prompt:'20 颗珠子按 3:2 分给两人。搭出两行同样大小的块，再让所有块合起来恰好是 20。'},{type:'x-ratio',a:5,b:1,total:18,compare:true,prompt:'换成 18 颗按 5:1 分。搭好后，把同一份记录换成表格和双数轴；选一种最方便查准确数量的画法。'}],
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,ts])=>[id,structuredClone(ts[0])]));
export const BRIDGES=[{from:'notation',to:'amounts',title:'写的一份，能分到几颗？',summary:'分母决定平均分成几组，分子决定取几组；从符号对应到实际数量。',tasks:[{...structuredClone(TASKS.notation[0]),n:1,d:3,prompt:'先把纸带分成三份、取一份，并说明两个数字各管什么。'},structuredClone(TASKS.amounts[0])]}];
