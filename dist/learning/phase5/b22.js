import{TASKS as T21}from'./b21.js';
const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B22'});
export const LESSONS={
 chanceorder:item('mt_UcGn2hjhYU','哪种机会更大','比较与排序可能性','比较时要看有利结果占全部等可能结果的多少。同样数量的红珠不代表相同机会；只比红珠个数可能看错。','红珠更多，抽到红珠就一定更容易吗？'),
 chancefraction:item('mt_-c4Ca_nBzX','机会可以写成几分之几','概率的分数表示','等可能的每个结果都算在总数里，有利结果占全部结果的几分之几，就是事件概率。','为什么分母不能只数没选中的那些？'),
 chancecalc:item('mt_Zt30Gxi-qp','把机会数清楚','简单概率计算','先核对每个结果是否等可能，再数有利结果与全部结果。等值分数描述同一个概率。','有利的结果变多，机会会怎样？'),
 chanceline:item('mt_t0g2SlP404','机会放在哪里','0到1的概率刻度','0是不可能，1是一定，1/2、0.5和50%是同一位置。两种结果并不自动代表各占一半。','什么时候“可能发生”和“一半机会”不是一回事？'),
 chancescale:item('mt_vmQJAtAFuy','每一份机会都一样吗','概率刻度与等可能条件','概率处于0和1之间。公平骰子的六个面等可能；不等大的转盘不能只因有两种颜色就各算一半。','看见两种颜色，怎样知道各占多少机会？'),
 trialcompare:item('mt_-bMnJcPJy8','预想和实测会一样吗','实验频率与理论概率','理论模型给长期可能性的参考，每次实验会波动。更多独立重复通常使比例更稳定，不保证每次更接近。','掷了很多次，次数一定刚好平均吗？'),
 trialestimate:item('mt_sHJqh6UUya','不知道规则，能先试出来吗','实验概率与相对频率','用实际发生次数除以试验总次数，得到对机会的估计。结果是有限试验的估计，不是确定的真实概率。','为什么10次与100次的估计可能不同？'),
 chancemodel:item('mt_aCwj2PCoRV','用一个规则描述机会','概率模型','模型说明可能结果和各自机会。每个人等机会时才可按人数计数；观察到的比例可建立近似模型。异常结果支持进一步检查，不自动证明原因。','观察和模型相差很大时，还需要查什么？'),
 chancesim:item('mt_nzdtOLXWWa','用数字替一次次尝试','随机事件模拟','用0—3代表一类、4—9代表另一类，十个数字等可能时对应40%。每次试到第一次成功为止；至少四次是前三次都未成功。','两组模拟结果不一样，哪组一定错了？'),
 chancenone:item('mt_3fwYu7imd4','全部机会加起来是多少','完备互斥结果与概率和','把所有可能结果不重不漏地分开，概率合起来是1。事件和“不发生”恰好填满整体；重叠部分不能重复加。','两个说法加起来等于1，就一定覆盖了全部结果吗？'),
 chancecomplement:item('mt_XfyqXLqzpx','没发生，又有多少机会','互补事件与重叠','某事件和它的补集不重不漏，概率和为1。两个普通事件可能重叠，合起来要把重叠部分只算一次。','既是偶数又是质数的2，该算几次？'),
 chanceindependent:item('mt_dlg6i-Lw0I','上一次会改变下一次吗','独立与依赖事件','公平硬币前一次不会改变下一次概率；从袋中拿走而不放回会改变袋里剩下的比例。独立与能否同时发生是不同问题。','不放回后，下一次还从原来的袋子里选吗？'),
 chancetree:item('mt_GDtFU5fyUv','两次选择会走出几条路','样本空间与概率树','按顺序列出每条路径；同一路径上乘机会，互不重叠的完整路径可以相加。不放回时第二层要按剩余物品重算。','两个骰子的总和为什么不能当成等可能的11个结果？'),
 chancesets:item('mt_1YwOCMMwD8','一个东西可以属于两边吗','集合、并集、交集和补集','两边都有的放在重叠处，只算一次；两边都没有的仍在整个范围里。并集是至少一边，交集是两边都有。','同时属于两边，为什么不该当成两个东西？'),
 chancevenn:item('mt_eSv_w46u6H','把两圈里的故事拼完整','韦恩图构造与计数','先确定两边都有的，再求各边独有和两边都没有；四个区域合起来等于整体。选人的概率以适当的整体作分母。','只喜欢一种、两种都喜欢和两种都不喜欢，怎么不漏不重？'),
};
export const SECTIONS=[{id:'chance-first',title:'先看机会有多大'},{id:'chance-try',title:'让结果跑起来'},{id:'chance-together',title:'几件事一起发生'}];
const route=(id,section,title,ids)=>({id,section,title,ids,packIds:['chance'],themeId:'data',color:'#6977b8'});
export const ROUTES=[route('DW','chance-first','排一排，再写成几分之几',['chanceorder','chancefraction']),route('DX','chance-first','把机会放在一把尺上',['chancecalc','chanceline','chancescale']),route('DY','chance-try','先猜，再试很多次',['trialcompare','trialestimate']),route('DZ','chance-try','用规则和数字做实验',['chancemodel','chancesim']),route('EA','chance-together','整份机会与没发生',['chancenone','chancecomplement']),route('EB','chance-together','两次选择会互相影响吗',['chanceindependent','chancetree']),route('EC','chance-together','在两圈中不漏不重',['chancesets','chancevenn'])];
const q=(label,value,options)=>({label,value,...(options?{options}:{})}),ch=(label,value,opts)=>q(label,value,opts),set=(label,value)=>({label,value,kind:'set'});
const pick=(prompt,items,winners,extra={})=>({type:'x-p22-pick',prompt,items,winners,questions:[],...extra});
const die=Array.from({length:6},(_,i)=>({label:String(i+1),group:'面'}));
const bag=(a,b)=>[...Array.from({length:a},(_,i)=>({label:'蓝'+(i+1),group:'蓝'})),...Array.from({length:b},(_,i)=>({label:'红'+(i+1),group:'红'}))];
const deck=Array.from({length:52},(_,i)=>({label:(i<26?'红':'黑')+(i%26+1),group:i<26?'红':'黑'}));
const exp=(prompt,labels,weights,targets,extra={})=>({type:'x-p22-experiment',prompt,labels,weights,targets,event:0,questions:[],...extra});
const order=(prompt,cards,extra={})=>({type:'x-p22-order',prompt,cards,questions:[],...extra});
const partition=(prompt,labels,weights,extra={})=>({type:'x-p22-table',prompt,labels,weights,questions:[],...extra});
const mapping=(prompt,extra={})=>({type:'x-p22-mapping',prompt,targetRuns:50,questions:[],...extra});
const draw=(prompt,extra={})=>({type:'x-p22-draw',prompt,questions:[],...extra});
const grid=(prompt,rows,cols,winners,extra={})=>({type:'x-p22-grid',prompt,rows,cols,winners,questions:[],...extra});
const tree=(prompt,extra={})=>({type:'x-p22-branch',prompt,counts:[3,2],replace:false,target:0,questions:[],...extra});
const venn=(prompt,extra={})=>({type:'x-p22-venn',prompt,mode:'counts',labels:['足球','羽毛球'],counts:[12,6,8,4],totals:[18,14,6,30],events:[],questions:[],...extra});
const sorted=[{label:'袋里没有蓝珠',p:0},{label:'4颗里1颗蓝',p:.25},{label:'4颗里2颗蓝',p:.5},{label:'4颗里3颗蓝',p:.75},{label:'袋里全是蓝珠',p:1}];
const scaleCards=[{label:'不可能：0',p:0},{label:'1/4的机会',p:.25},{label:'一半机会：0.5',p:.5},{label:'3/4的机会',p:.75},{label:'一定：1',p:1}];
const diceWinners=Array.from({length:36},(_,i)=>i).filter(i=>Math.floor(i/6)+1+i%6+1===7);
const both=s=>ch('两个“都会发生”的说法怎样数重叠',s,[['once','重叠结果只算一次'],['twice','属于两边就算两次']]);
export const TASKS={
 chanceorder:[order('从最难发生到一定发生，逐张排好这些袋子。',sorted,{questions:[ch('2颗蓝、2颗红', 'even',[['even','两种机会各一半'],['certain','肯定抽到蓝']])]}),order('甲袋4颗里3颗红；乙袋12颗里6颗红。红珠多就更容易抽到吗？先猜，再每袋各抽50次（每次放回）。',[{label:'乙：12颗里6颗红',p:.5},{label:'甲：4颗里3颗红',p:.75}],{sampleBags:[[3,1],[6,6]],questions:[ch('按规则，哪袋红的机会大','a',[['a','甲：3/4大于6/12'],['b','乙：6颗比3颗多']]),ch('一次实验偶然相反时','vary',[['vary','继续保留结果，抽样会波动'],['redo','删掉这次再抽到符合为止']])]}),order('把1/4、1/2、3/4按机会从小到大排在0与1之间。',scaleCards,{questions:[ch('最接近一定，但还不是一定','three',[['three','3/4'],['half','1/2'],['zero','0']]) ]})],
 chancefraction:[pick('公平骰子有六个面。圈出“掷到6”的结果，再写占全部的几分之几。',die,[5],{questions:[q('一共几个等可能的面',6)]}),pick('52张牌中26张红、26张黑，每张等可能。找出红牌，再写它占全部的几分之几。',deck,Array.from({length:26},(_,i)=>i),{groupAction:'红',questions:[q('总共有几张牌',52),q('红牌有几张',26)]}),pick('袋里3蓝7红，每颗珠子被拿到的机会一样。圈出蓝珠，再写占整个袋子的几分之几。',bag(3,7),[0,1,2],{groupAction:'蓝',questions:[ch('分母数的是','all',[['all','所有10颗，包含蓝珠'],['other','只有7颗红珠']]) ]})],
 chancecalc:[pick('3蓝7红，从整个袋子里随机取一颗。先圈蓝珠，再写出蓝的机会。',bag(3,7),[0,1,2],{groupAction:'蓝',questions:[q('所有珠子数量',10)]}),pick('公平骰子只掷一次。圈出偶数结果，再写它占全部的几分之几。',die,[1,3,5],{questions:[q('有几个偶数面',3)]}),pick('现在把10颗里的蓝珠从3颗换成6颗。圈出来；总数没变，机会怎样变？',bag(6,4),[0,1,2,3,4,5],{groupAction:'蓝',questions:[ch('与3/10相比','higher',[['higher','6/10更大'],['same','总数没变，机会也不变']]) ]})],
 chanceline:[order('把不同写法排到从0到1的机会线上。',scaleCards,{questions:[q('一半写成小数',0.5),q('一半写成百分数（只填数字）',50)]}),pick('公平骰子掷到6，机会放在0到1之间哪里？先圈结果，再写一个分数。',die,[5],{questions:[ch('1/6在一半的哪一侧','less',[['less','小于一半'],['more','大于一半']])]}),order('把1/4、50%、3/4按大小排好；0和1留在两端。',scaleCards,{questions:[ch('“两种结果”一定各占一半吗','no',[['no','不一定，还要看各自机会'],['yes','一定']]) ]})],
 chancescale:[order('把不可能、一半机会和一定，连同中间的例子放上数轴。',scaleCards,{questions:[q('不可能的位置',0),q('一定的位置',1)]}),pick('公平六面骰掷到3：每个面等可能，圈出这一面并写概率。',die,[2],{questions:[ch('每个面机会','equal',[['equal','公平骰各面机会一样'],['any','每个数字都可随意指定']])]}),pick('转盘有10块一样大的小格，其中7红3蓝。圈红色小格，不能只按“两种颜色”各算一半。',bag(7,3).map(x=>({...x,group:x.group==='蓝'?'红':'蓝',label:x.group==='蓝'?'红格':'蓝格'})),[0,1,2,3,4,5,6],{groupAction:'红',questions:[ch('只知道两种颜色时','unknown',[['unknown','还要看每种占多大份'],['half','必然各一半']]) ]})],
 trialcompare:[exp('公平骰子先试60次，再继续到600次。六个面每次等机会；比较六出现的比例与1/6。',['1','2','3','4','5','6'],[1,1,1,1,1,1],[60,600],{event:5,theory:'1/6',expected:100,questions:[ch('600次时，六的预期次数','mean',[['mean','约100次，实际可以不同'],['exact','必须恰好100次']]),ch('次数增多时','usually',[['usually','比例通常更稳定，不保证每一步更近'],['always','每次都会更近']])]}),exp('公平硬币先试10次，再继续到100次。先猜，保留真实正反记录。',['正面','反面'],[1,1],[10,100],{theory:'1/2',questions:[ch('上次正面多，下一次','half',[['half','仍是一半机会，不会自动补偿'],['due','反面一定更容易']])]}),pick('有人60次掷到6共14次。圈出骰子的6，比较14次和理论上的约10次。',die,[5],{questions:[ch('这次结果是否证明不公平','no',[['no','不能，短期波动可能出现'],['yes','14不是10，肯定不公平']]),ch('重复600次可以预想','spread',[['spread','比例通常更稳定，但实际不会被强制等于1/6'],['exact','6必须恰好出现100次']]) ]})],
 trialestimate:[exp('一个模拟装置的内部规则暂时藏起来。先试10次，再继续到100次，用实际记录估计亮灯机会。',['亮灯','不亮'],[3,7],[10,100],{hidden:true,questions:[ch('用这次结果算出的比例是','estimate',[['estimate','带不确定的估计'],['exact','真实机会的精确证明']])]}),exp('再换一个模拟硬币：先试20次，再继续到100次。用实际正面次数除以总次数。',['正面','反面'],[1,1],[20,100],{theory:'1/2',questions:[ch('实验结果与1/2不同','chance',[['chance','可能是随机波动'],['error','必然有一次记错']])]}),exp('换一个三色模拟装置，先试20次，再继续到100次。看目标颜色的比例怎样变化。',['蓝','红','黄'],[2,3,5],[20,100],{hidden:true,questions:[ch('更多试验通常','reliable',[['reliable','使估计更稳定，但仍有波动'],['fixed','保证每次都刚好相同']]) ]})],
 chancemodel:[pick('25位模拟同学，每人被选中的机会一样。先圈出小青，写选中小青的机会。',Array.from({length:25},(_,i)=>({label:i===0?'小青':String(i+1),group:i<12?'A':'B'})),[0],{questions:[q('一共有几个人',25)]}),pick('仍是25人，其中12人属于A组。每人等机会；圈出A组并写机会。',Array.from({length:25},(_,i)=>({label:String(i+1),group:i<12?'A':'B'})),Array.from({length:12},(_,i)=>i),{groupAction:'A',questions:[q('A组有几人',12)]}),partition('纸杯50次的给定观察：侧躺31次、开口向上13次、向下6次。用这份记录拼出近似机会模型。',['侧躺','向上','向下'],[31,13,6],{questions:[ch('三种机会','unequal',[['unequal','记录显示比例不同，不能当成各1/3'],['equal','三种结果就一定各1/3']]),ch('另一份给定记录：600次有160次掷到6；公平模型预期约100次','check',[['check','差距很大，值得检查偏差或记录，但不是逻辑证明'],['certain','已经绝对证明骰子被改造']]) ]})],
 chancesim:[mapping('十个等可能数字0—3代表A，其余代表非A。自己选出代表A的数字，再模拟10次。',{targetRuns:10,questions:[q('10个数字里有几个代表A',4),q('A占全部的几分之几','2/5')]}),mapping('一次实验：读数字直到第一次A出现。重复50次，数一数需要至少4个数字的比例。',{targetRuns:50,questions:[ch('至少4次才出现A，表示','three',[['three','前3次都不是A'],['four','前4次都必须是A']])]}),mapping('两组各做50次，分别有9次和13次需要至少4次。把记录合起来，再做10次自己的模拟。',{targetRuns:10,given:[9,13],questions:[q('合并后共有多少次',100),q('合并后符合条件几次',22),q('合并比例（可写分数）','11/50'),ch('500次与50次比较','usually',[['usually','通常更稳定，但不是每次必更准'],['always','500次必定完全准确']]) ]})],
 chancenone:[partition('转盘四种颜色占1、2、3、4个相同小格。把每种占整圈的机会放进表里，拼回完整的一圈。',['蓝','红','黄','绿'],[1,2,3,4],{questions:[q('四份概率合起来',1),ch('为什么能相加','partition',[['partition','不重叠且没有漏掉'],['any','只要写成数字就能加']])]}),pick('公平骰子“不是3”：圈出所有符合的面，再写它们占全部的几分之几。',die,[0,1,3,4,5],{questions:[q('3的机会','1/6'),q('1减去1/6','5/6')]}),partition('给定表：A=1/2、B=1/3、C=1/3。总和超过1。保持A和B，把C修成能拼完整的一份。',['A','B','C'],[3,2,1],{given:'原表：1/2、1/3、1/3',questions:[q('原表总和','7/6'),ch('原表问题','over',[['over','总和超过1，不能作为完整不重叠的结果'],['okay','只要每项都小于1就行']]) ]})],
 chancecomplement:[partition('三种结果分别占2、3、5个等大格。拼好三份，检验完整机会。',['甲','乙','丙'],[2,3,5],{questions:[q('全部机会相加',1)]}),pick('公平骰子“不是6”。圈出符合的面，再用1减1/6核对。',die,[0,1,2,3,4],{questions:[q('1减1/6','5/6')]}),pick('骰子上的偶数是2、4、6，质数是2、3、5。“偶数或质数”圈出哪些面？',die,[1,2,3,4,5],{questions:[q('两个条件共有的数',2),q('符合至少一个条件的机会','5/6'),both('once')]})],
 chanceindependent:[exp('设想公平硬币刚刚连续三次正面；再试10次，看规则有没有改变。',['正面','反面'],[1,1],[10],{theory:'1/2',questions:[q('下一次正面的机会','1/2'),ch('前面连续正面后','same',[['same','下一次机会仍是一半'],['due','反面必然更容易']])]}),draw('袋里3红2蓝。先假设第一次拿到红，分别试放回和不放回，再看下一次抽红的机会。',{questions:[q('放回后抽红','3/5'),q('不放回后抽红','1/2'),ch('不放回改变了','contents',[['contents','袋里的组成和下一次机会'],['luck','只是手气']])]}),{type:'x-p22-sort',prompt:'把五对事件分别放进“前一次不改变下一次机会”或“前一次改变袋中比例”。',items:[['公平硬币第一次和第二次','independent'],['两次从3红2蓝的袋中抽珠，每次放回','independent'],['两次抽珠，第一次拿走红珠不放回','dependent'],['发出一张牌不放回后再发一张','dependent'],['两次独立掷公平骰子','independent']],questions:[]}],
 chancetree:[grid('两个公平骰子依次掷出。逐行搭出36个有顺序的结果，圈出总和为7的格子。',[1,2,3,4,5,6],[1,2,3,4,5,6],diceWinners,{questions:[q('总共多少个有顺序的结果',36),q('总和为7有几种',6),q('总和为7的概率','1/6')]}),tree('3红2蓝，连续拿两颗不放回。为每条路径填上前后两次机会，搭出四条分支。',{questions:[ch('第二次为什么变化','remain',[['remain','第一颗没有放回，剩余组成改变'],['same','总数仍是5']])]}),grid('换成两种帽子与三种围巾。逐行列出所有搭配，圈出红帽配任意围巾。',['红帽','蓝帽'],['白巾','绿巾','黄巾'],[0,1,2],{questions:[q('所有搭配几种',6),q('红帽搭配几种',3),q('红帽的比例','1/2')]})],
 chancesets:[venn('数字1到8，A是偶数，B是小于4的数。把每张数字卡放进只在A、两边都有、只在B或两边都没有。',{mode:'items',labels:['偶数A','小于4的数B'],items:[1,2,3,4,5,6,7,8],destinations:[2,1,2,0,3,0,3,0],events:[],questions:[set('至少属于一边的数（用逗号隔开）',[1,2,3,4,6,8]),set('两边都有的数',[2])]}),grid('两种帽子与三种围巾，逐行搭出所有不同搭配，不漏也不重复。',['红帽','蓝帽'],['白巾','绿巾','黄巾'],[0,1,2],{questions:[q('一共几种搭配',6),q('红帽搭配的比例','1/2')]}),venn('还是两组数字。为“都属于”“至少一边”“不属于A”分别涂出对应区域。',{mode:'shade',labels:['偶数A','小于4的数B'],counts:[3,1,2,2],events:['both','either','notA'],questions:[both('once')]})],
 chancevenn:[venn('30人的模拟记录：18人喜欢足球，14人喜欢羽毛球，6人两种都喜欢。把四个区域拼完整。',{questions:[q('至少喜欢一种有几人',26),both('once')]}),venn('继续看这30人。分别涂出“两种都喜欢”和“至少喜欢一种”的区域。',{mode:'shade',events:['both','either'],questions:[q('至少喜欢一种有几人',26),both('once')]}),venn('换30人的一组记录：10人喜欢足球、14人喜欢羽毛球、4人两种都喜欢。拼出各区，再算机会。',{counts:[6,4,10,10],totals:[10,14,4,30],questions:[q('喜欢足球的概率','1/3'),q('喜欢羽毛球的概率','7/15'),q('两种都喜欢的概率','2/15'),q('至少喜欢一种的概率','2/3')]})],
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,ts])=>[id,{...ts.at(-1)}]));
export const BRIDGES=[];

const link=(from,to,title,a,b)=>BRIDGES.push({from,to,title,summary:'把两边的操作连起来，再检查这次结论的条件。',tasks:[structuredClone(a),structuredClone(b)],phase:5,batch:'B22'});
link('chancecomplement','chancesets','不是A，也要留在整个范围内',TASKS.chancecomplement[1],TASKS.chancesets[2]);
link('chanceline','chancenone','从0到1，拼出完整的一份',TASKS.chanceline[0],TASKS.chancenone[0]);
link('chancecalc','chancenone','数清每一份，再合成整体',TASKS.chancecalc[0],TASKS.chancenone[0]);
link('trialcompare','simulation','比较一次，再观察更多次',TASKS.trialcompare[0],TASKS.trialestimate[1]);
link('trialestimate','chancemodel','由观察记录建立近似模型',TASKS.trialestimate[0],TASKS.chancemodel[2]);
link('chancecomplement','chancemodel','各部分机会怎样拼成模型',TASKS.chancecomplement[0],TASKS.chancemodel[2]);
link('chancecalc','chancemodel','等机会数人，和观察模型不同',TASKS.chancecalc[0],TASKS.chancemodel[1]);
link('chance','trialcompare','亲自试，再和模型的预期比较',TASKS.trialcompare[1],TASKS.trialcompare[0]);
link('chancecalc','trialcompare','理论上的份额，和实验次数比较',TASKS.chancecalc[1],TASKS.trialcompare[0]);
link('chance','chancefraction','先观察结果，再用分数说机会',TASKS.trialcompare[1],TASKS.chancefraction[0]);
link('unitsets','chancefraction','把一群中的一份，连到机会',TASKS.chancecalc[0],TASKS.chancefraction[2]);
link('fairness','chancefraction','等机会，才能用有利数除以总数',TASKS.chancescale[1],TASKS.chancefraction[0]);
link('chance','chanceindependent','多次试验里，上一次会改变规则吗',TASKS.trialcompare[1],TASKS.chanceindependent[0]);
link('chanceorder','chanceindependent','比较机会，再看条件是否改变',TASKS.chanceorder[1],TASKS.chanceindependent[1]);
link('chancesets','chancevenn','重叠只算一次，完整装进两圈',TASKS.chancesets[0],TASKS.chancevenn[0]);
link('chancesets','chancetree','先列搭配，再逐条走完整路径',TASKS.chancesets[1],TASKS.chancetree[1]);
link('productfractions','chancetree','一条路上的两次机会相乘',TASKS.chancefraction[2],TASKS.chancetree[1]);
link('trialestimate','chancetree','模拟结果之外，还能列出所有路径',TASKS.trialestimate[1],TASKS.chancetree[0]);
link('chancemodel','chancesim','用等可能数字实现自己的机会模型',TASKS.chancemodel[1],TASKS.chancesim[0]);
link('chancetree','chancesim','沿分支想第一次成功发生在哪一步',TASKS.chancetree[1],TASKS.chancesim[1]);
link('trialestimate','chancesim','记录频率，再用数字模拟一次事件',TASKS.trialestimate[0],TASKS.chancesim[1]);
link('samplevary','chancesim','每份样本不同，两轮模拟也会不同',T21.samplevary[0],TASKS.chancesim[2]);
link('trialcompare','trialestimate','比较规则后，估计一个未知装置',TASKS.trialcompare[1],TASKS.trialestimate[0]);
link('chancescale','trialestimate','不知道机会，就不能默认一半',TASKS.chancescale[2],TASKS.trialestimate[0]);
link('chancefraction','chanceline','同一分数放到0和1之间',TASKS.chancefraction[0],TASKS.chanceline[1]);
link('unitorder','chanceline','分数大小接到机会大小',TASKS.chanceorder[2],TASKS.chanceline[0]);
link('likelihood','chanceorder','从可能程度，排出具体顺序',TASKS.chancescale[0],TASKS.chanceorder[0]);
link('chancecalc','chancescale','数完整份，也检查是不是等机会',TASKS.chancecalc[2],TASKS.chancescale[2]);
link('trialestimate','samplevary','重复试验会变，重复抽样也会变',TASKS.trialestimate[1],T21.samplevary[0]);
link('chancenone','chancecomplement','完整一份，减去发生的部分',TASKS.chancenone[0],TASKS.chancecomplement[1]);
link('chancescale','chancecomplement','沿机会尺找到剩下的一段',TASKS.chancescale[1],TASKS.chancecomplement[1]);
link('chanceorder','fairness','比较比例，判断格子是否等机会',TASKS.chanceorder[1],TASKS.chancescale[2]);
link('chanceline','chancecalc','从数轴位置回到实际数量',TASKS.chanceline[1],TASKS.chancecalc[0]);
link('fairness','chancecalc','先认出等可能，再数有利结果',TASKS.chancescale[1],TASKS.chancecalc[1]);
