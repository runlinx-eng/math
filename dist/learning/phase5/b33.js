import {TASKS as T11} from './b11.js';
import {TASKS as T15} from './b15.js';
import {TASKS as T20} from './b20.js';
import {TASKS as T28} from './b28.js';
import {TASKS as T29} from './b29.js';
const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B33'});
export const LESSONS={
 coinvalues:item('mt_cPZwlUk8Nd','一枚钱，值多少','英国货币面值','面值是写在钱上的价值，不由硬币的大小或数量决定。英国例子中100便士等于1英镑；不同币种不混算。','一枚较小的钱为什么可能比一枚较大的更值钱？'),
 poundnotation:item('mt_pbuhUQJjtt','一笔钱，换个写法','英镑与便士的表示','同一笔英镑可以用英镑小数或便士数表示：£1.50就是150p。写法改变，金额不变。','£1.50和150p为什么相等？'),
 coincombo:item('mt_AF2BeFQwfX','同样的数，几种摆法','等值货币组合','每一枚钱有自己的面值，把面值相加。不同数量和面值的硬币可以组合出相同总额。','硬币枚数变多，金额一定变多吗？'),
 pennyshop:item('mt_6J1wmCWf41','买完，应该找回多少','便士的加减与找零','总价是各件价格合起来；找零是付款额与总价的差。钱不够时，差额表示还需要多少。','怎样从价格往上数到付款额，找到应找的钱？'),
 poundchange:item('mt_6_O6THdEDK','几件东西，合起来','英镑与便士的总价和找零','先把同种钱的价格合起来，再与付款额比较。每100便士是1英镑，保留金额中的两位小数。','£5减去£3.45时，为什么不能把45当作45英镑？'),
 modmoney:item('mt_iQYPw8bMfN','把故事里的数摆出来','测量与多步骤金额建模','先区分已知量、未知量和单位；条形图、数轴与算式都可表达关系。算完要回到故事，判断结果是总价还是找零。','同一个数字，怎样知道它说的是总价还是找零？'),
 auscoins:item('mt_FSLJbKkryb','换个地方，钱长得不同','澳大利亚硬币与购买','澳大利亚元和分是另一套货币；100澳分等于1澳元。$2硬币比50c硬币小，但面值更大。这里的票币是标值示意。','硬币大小和面值为什么不能画等号？'),
 austrans:item('mt_8cs4YPkp23','把几次购买接起来','澳元交易与找零','同一种货币的商品价格可以合计；相同价格的多个商品可重复相加。找零是付出与总价的差。','同价的三个苹果，为什么可以把同一个价格加三次？'),
 dollarcents:item('mt_9L5qyBYmg-','元与分，还是同一笔钱','澳元与澳分的换写和等值','100澳分是1澳元；$2.70与270c表示同一笔澳元。不同面值可组成相同金额，找零仍由付款减总价。','$2.70为什么不是270澳元？'),
 usmoney:item('mt_3tz3Otap5j','再换一种钱，先看标记','美元和美分情境','美国例子里，100美分是1美元。币值看面值；先合计，再根据付款和价格决定总价或找零。','美元和澳元都用$时，为什么不能直接混在一起？'),
 moneycalc:item('mt_FVVSQR9vGg','先猜大概，再让机器算','金额计算器与估计核对','先估一个范围，再输入算式，把显示结果读成对应币种的金额。选择心算或计算器是一种策略，屏幕不能证明心里怎样算。','计算器显示3.55时，为什么还要回头看它代表什么？'),
 measuremoney:item('mt_mFJ-2ZF6Tk','单位不同，怎样一起比','测量估计、质量比较与金额计算','先估计再测量，比较不同单位先换成同一单位；金额相加时也要保留同一币种和单位。','1.5 kg和1200 g，为什么不能只比较1.5和1200？'),
 roughmoney:item('mt_5bmrA-0pBi','先看差不多，再算准','金额估计与澳大利亚现金取整示例','估算用附近好算的数判断结果是否合理；精确计算与估算不同。这里的澳大利亚现金总额按题目给定的5分规则取整。','估算约15元，为什么精确答案不一定正好是15元？'),
 budgetchoices:item('mt_Qe2PsFmSAH','有限的钱，怎样选','预算与单位价格','先选出需要的东西，合计后与预算比较；不同选择都可能可行。比较包装价格要换成同样数量的单价。','标价更低的一包，为什么不一定每千克更便宜？'),
 discounts:item('mt_oMkQQ2O-ML','打折、加税和欠了多少','折扣、指定税率与负余额','折扣按原价计算；澳大利亚示例的10% GST按税前价计算，已含税的价格不再加一次。负余额在零的另一侧。','打九折和减去9元，为什么不一定一样？'),
 moneysheet:item('mt_mMDpLugX2X','让表格替你跟着算','金额表格、折扣与税的公式','表格公式引用已有单元格；更改价格时需重新计算。折扣和税的百分比要作用在正确的基数上。','把税前价格换一换，公式和结果会怎样变化？')
};
export const SECTIONS=[{id:'money-values',title:'看面值，摆一笔钱'},{id:'money-transactions',title:'付出去，找回来'},{id:'money-choices',title:'估一估，做选择'}];
const route=(id,section,title,ids)=>({id,section,title,ids,packIds:['money'],themeId:'measure',color:'#ac8953'});
export const ROUTES=[
 route('GK','money-values','同一笔钱的样子',['coinvalues','poundnotation','coincombo']),
 route('GL','money-values','总价与找零',['pennyshop','poundchange','modmoney']),
 route('GM','money-transactions','澳大利亚小商店',['auscoins','austrans','dollarcents']),
 route('GN','money-transactions','不同的钱与计算',['usmoney','moneycalc','measuremoney']),
 route('GO','money-choices','估计和预算',['roughmoney','budgetchoices']),
 route('GP','money-choices','折扣、税和表格',['discounts','moneysheet'])
];
const clone=x=>structuredClone(x),q=(label,value,kind='number',options,extra={})=>({label,value,kind,...(options?{options}:{}),...extra});
const choice=(label,value,options,extra={})=>q(label,value,'choice',options,extra),major=(label,value)=>q(label,value,'major'),minor=(label,value)=>q(label,value,'minor');
const uk=[{label:'50p',cents:50},{label:'20p',cents:20},{label:'10p',cents:10},{label:'5p',cents:5},{label:'£1',cents:100},{label:'£2',cents:200},{label:'£5',cents:500,note:true}];
const au=[{label:'澳 $2',cents:200,size:55},{label:'澳 $1',cents:100,size:62},{label:'澳 50c',cents:50,size:76,tone:'silver',shape:'twelve'},{label:'澳 20c',cents:20,size:65,tone:'silver'},{label:'澳 10c',cents:10,size:60,tone:'silver'},{label:'澳 5c',cents:5,size:55,tone:'silver'},{label:'澳 $5',cents:500,note:true}];
const us=[{label:'美 25¢',cents:25},{label:'美 10¢',cents:10},{label:'美 5¢',cents:5},{label:'美 1¢',cents:1},{label:'美 $1',cents:100,note:true}];
const coins=(prompt,currency,denoms,target,examples,extra={})=>({type:'x-m33-coins',prompt,currency,denoms,target,examples,questions:[],...extra});
const sort=(prompt,currency,cards,groups,questions=[])=>({type:'x-m33-sort',prompt,currency,cards,groups,questions});
const cart=(prompt,currency,items,extra={})=>({type:'x-m33-cart',prompt,currency,items:items.map(([name,cents])=>({name,cents})),questions:[],...extra});
const compare=(prompt,items,want,questions=[],extra={})=>({type:'x-m33-compare',prompt,items:items.map(([label,value,detail])=>({label,value,detail})),want,questions,...extra});
const calc=(prompt,currency,expected,exampleFormula,extra={})=>({type:'x-m33-calc',prompt,currency,expected,exampleFormula,questions:[],...extra});
const sheet=(prompt,currency,refs,expected,exampleFormula,extra={})=>({type:'x-m33-sheet',prompt,currency,refs,expected,exampleFormula,requiredRefs:Object.keys(refs),questions:[],...extra});
const ukgroups=[{id:'p',label:'便士 p'},{id:'pound',label:'英镑 £'}];
const aukinds=[{id:'cent',label:'澳分 c'},{id:'dollar',label:'澳元 $'}];
export const TASKS={
 coinvalues:[
  sort('英国的钱：按便士和英镑把八种硬币标值分开。','GBP',[...uk.slice(0,4),{label:'2p',cents:2},{label:'1p',cents:1},...uk.slice(4,6)].map(c=>({...c,group:c.label.includes('p')?'p':'pound'})),ukgroups),
  compare('英国的£2硬币和50p硬币，哪一枚面值更大？',[['£2硬币',200,'200p'],['50p硬币',50,'50p']],'left',[minor('£2等于多少便士',200)] ,{currency:'GBP'}),
  sort('把£5、£10纸币和50p硬币放到各自一边。','GBP',[{label:'£5',note:true,group:'note'},{label:'£10',note:true,group:'note'},{label:'50p',group:'coin'}],[{id:'coin',label:'硬币'},{id:'note',label:'纸币'}])
 ],
 poundnotation:[
  coins('英国商店：摆出£1.50，另用便士记下同一笔钱。','GBP',uk,150,[[1,0,0,0,1,0,0]],{questions:[minor('一共多少便士',150),major('英镑写法',150)]}),
  coins('摆出75p：50p、20p和5p各放一枚。','GBP',uk,75,[[1,1,0,1,0,0,0]],{mustCounts:[[0,1],[1,1],[3,1]],questions:[minor('一共多少便士',75)]}),
  cart('英国书签£1.50。把它放进篮子，换成便士读一读。','GBP',[['书签',150]],{exampleSelection:[0],required:[0],questions:[minor('书签多少便士',150)]})
 ],
 coincombo:[
  coins('英国商店：用三种不同摆法分别凑出50p。','GBP',uk,50,[[1,0,0,0,0,0,0],[0,2,1,0,0,0,0],[0,0,5,0,0,0,0]],{visibleIndices:[0,1,2,3],distinct:3,questions:[minor('每一种合起来都是多少便士',50)]}),
  coins('换成30p，找两种不同的组合。','GBP',uk,30,[[0,1,1,0,0,0,0],[0,0,3,0,0,0,0]],{distinct:2,questions:[minor('每组的总额',30)]}),
  coins('用不同枚数摆出20p。看看枚数改变，总额会怎样。','GBP',uk,20,[[0,1,0,0,0,0,0],[0,0,2,0,0,0,0]],{distinct:2,questions:[choice('两组摆法的总额','same',[['same','一样'],['count','枚数多就一定更多']])]})
 ],
 pennyshop:[
  cart('英国小店：25p和15p两件东西一共多少？','GBP',[['本子',25],['笔',15]],{required:[0,1],exampleSelection:[0,1],questions:[minor('总价多少便士',40)]}),
  coins('用50p买35p的东西，摆出应找回的钱。','GBP',uk,15,[[0,0,1,1,0,0,0]],{questions:[minor('应找回多少便士',15)]}),
  coins('想买50p的东西，手里已有30p。再摆出还需要的钱。','GBP',uk,20,[[0,1,0,0,0,0,0]],{questions:[minor('还需要多少便士',20)]})
 ],
 poundchange:[
  cart('英国商店：把£1.25和£2.20两件东西放入篮子。','GBP',[['绘本',125],['画笔',220]],{required:[0,1],exampleSelection:[0,1],questions:[major('总价是多少英镑',345)]}),
  cart('两件共£3.45，用£5付款。选入两件，再算找零。','GBP',[['绘本',125],['画笔',220]],{required:[0,1],exampleSelection:[0,1],questions:[major('从£5找回多少',155)]}),
  cart('再买三件：£2.15、£1.10和£0.22，用£10付款。','GBP',[['便笺',215],['尺',110],['贴纸',22]],{required:[0,1,2],exampleSelection:[0,1,2],questions:[major('总价',347),major('从£10找回',653)]})
 ],
 modmoney:[
  {type:'x-m33-model',prompt:'一根绳原来45 cm，剪掉18 cm。挑一种表示，再找剩下的长度。',whole:45,known:18,unit:'cm',questions:[q('剩下多少cm',27)]},
  cart('英国商店：一支笔£1.20，一本册子£2.30。先合计，再看£5应找回多少。','GBP',[['笔',120],['册子',230]],{required:[0,1],exampleSelection:[0,1],questions:[major('总价',350),major('从£5找回',150),choice('£1.50表示','change',[['change','找回的钱'],['total','两件的总价']])]}),
  clone(T28.measureplot[0])
 ],
 auscoins:[
  sort('澳大利亚示意硬币：按澳分和澳元分类。比较50c与$2。','AUD',[{label:'澳50c',cents:50,size:76,tone:'silver',shape:'twelve',group:'cent'},{label:'澳20c',cents:20,size:65,tone:'silver',group:'cent'},{label:'澳$1',cents:100,size:62,group:'dollar'},{label:'澳$2',cents:200,size:55,group:'dollar'}],aukinds,[choice('面值更大的是','two',[['two','较小的$2'],['fifty','较大的50c']])]),
  coins('澳大利亚小店：用一张$5和一枚$2，付清$7玩具。','AUD',au,700,[[1,0,0,0,0,0,1]],{mustCounts:[[0,1],[6,1]],questions:[major('付出多少澳元',700)]}),
  cart('澳大利亚小店：书$5、笔$3，一张$10够吗？','AUD',[['书',500],['笔',300]],{required:[0,1],exampleSelection:[0,1],questions:[major('总价',800),choice('$10够吗','yes',[['yes','够'],['no','不够']])]})
 ],
 austrans:[
  cart('澳大利亚小店：饮料$4、三明治$7，用$20付款。','AUD',[['饮料',400],['三明治',700]],{required:[0,1],exampleSelection:[0,1],questions:[major('总价',1100),major('找回',900)]}),
  cart('三个苹果每个50c。把三份都放进篮子。','AUD',[['苹果1',50],['苹果2',50],['苹果3',50]],{required:[0,1,2],exampleSelection:[0,1,2],questions:[minor('一共多少澳分',150)]}),
  coins('用最少的澳大利亚硬币凑出85c。','AUD',au,85,[[0,0,1,1,1,1,0]],{minCoins:true,questions:[q('最少几枚',4)]})
 ],
 dollarcents:[
  coins('澳元：用钱摆出$2.70，再写成澳分。','AUD',au,270,[[1,0,1,1,0,0,0]],{questions:[minor('一共多少澳分',270),major('澳元写法',270)]}),
  coins('澳元：450c可以怎样写成澳元？先摆出这笔钱。','AUD',au,450,[[2,0,1,0,0,0,0]],{questions:[major('澳元写法',450)]}),
  coins('用两种不同组合摆出澳元$3.60。','AUD',au,360,[[1,1,1,0,1,0,0],[1,1,0,3,0,0,0]],{distinct:2,questions:[minor('每组多少澳分',360)]}),
  coins('商品澳元$6.40，用$10付款，摆出找回的钱。','AUD',au,360,[[1,1,1,0,1,0,0]],{questions:[major('找回多少澳元',360)]})
 ],
 usmoney:[
  coins('美国的钱：三个25¢和一个5¢合起来是多少？先摆出来。','USD',us,80,[[3,0,1,0,0]],{mustCounts:[[0,3],[2,1]],questions:[minor('一共多少美分',80)]}),
  cart('美国小店：买$1.35的本子，用$2付款。','USD',[['本子',135]],{required:[0],exampleSelection:[0],questions:[major('找回多少美元',65)]}),
  coins('美国的钱：摆出$1.25，再用美分表示。','USD',us,125,[[1,0,0,0,1]],{questions:[minor('一共多少美分',125),major('美元写法',125)]})
 ],
 moneycalc:[
  calc('澳元购物单：$4.85、$12.30、$7.95，先估算总价再计算。','AUD',2510,'4.85+12.30+7.95',{estimate:true,estimateExample:25,estimateRange:[23,27],estimateLabel:'大约多少澳元',questions:[major('实际总价',2510)]}),
  calc('澳元$10减去$6.45，计算找回的钱。','AUD',355,'10-6.45',{questions:[major('显示3.55表示多少澳元',355)]}),
  calc('澳元$3.95的东西买6份。可以选择顺手的方法，算完与4份$5比较。','AUD',2370,'6*3.95',{questions:[q('4份$5是几澳元',20),choice('我愿意用什么方法','calculator',[['mental','心算'],['written','纸笔'],['calculator','计算器']],{accepted:['mental','written','calculator']})]})
 ],
 measuremoney:[
  {...clone(T28.estimateLength[1]),prompt:'这是模拟房间的一段距离。先用1米作参照估一估，再量；现实教室需要亲自量。'},
  compare('一袋1.5 kg，另一袋1200 g。换成克后，哪袋更重？',[['1.5 kg',1500,'1500 g'],['1200 g',1200,'1200 g']],'left',[q('1.5 kg是多少克',1500)]),
  cart('英国商店：三件分别£2.45、£1.30、£0.75。','GBP',[['书',245],['铅笔',130],['便签',75]],{required:[0,1,2],exampleSelection:[0,1,2],questions:[major('一共多少英镑',450)]})
 ],
 roughmoney:[
  calc('澳元$4.95、$2.10、$7.85先估大约多少，再算准确总价。','AUD',1490,'4.95+2.10+7.85',{estimate:true,estimateExample:15,estimateRange:[13,17],estimateLabel:'估计大约多少澳元',questions:[major('准确总价',1490)]}),
  sort('澳大利亚现金总额按题给规则取到最近5c。分辨往下还是往上。','AUD',[{label:'$12.37',record:true,group:'down'},{label:'$8.48',record:true,group:'up'}],[{id:'down',label:'往下到最近5c'},{id:'up',label:'往上到最近5c'}],[major('$12.37取整后',1235),major('$8.48取整后',850)]),
  calc('澳元$50付款，商品$6.90和$8.15。先估找回多少，再计算比较$36。','AUD',3495,'50-6.90-8.15',{estimate:true,estimateExample:35,estimateRange:[33,37],estimateLabel:'先估找回约多少澳元',questions:[major('准确找回',3495),choice('找回$36','near',[['near','接近约$35，但不是精确找零'],['exact','估算就能确定正好是$36']])]})
 ],
 budgetchoices:[
  cart('澳元$60预算，选至少两样为活动做准备，看看还有多少。','AUD',[['水果',1800],['饮料',1500],['装饰',1250],['点心',1950],['纸杯',600]],{budget:6000,minimum:2,exampleSelection:[0,3]}),
  sheet('把一种活动清单放进表格：水果$12、点心$14.50、纸杯$3.50。','AUD',{A1:1200,A2:1450,A3:350},3000,'=A1+A2+A3',{labels:{A1:'水果',A2:'点心',A3:'纸杯'},questions:[major('表格总价',3000)]}),
  compare('同一种米：2 kg售$5.80，500 g售$1.60。哪一种每kg更便宜？',[['2 kg装',290,'每kg $2.90'],['500 g装',320,'每kg $3.20']],'left',[major('500 g装换成1 kg的价格',320)],{currency:'AUD',note:'比较相同重量的价格；不评价口味与浪费。'}),
  calc('五件澳元商品$4.95、$7.80、$3.25、$5.40、$2.80。先估一估是否在$25内，再算总价。','AUD',2420,'4.95+7.80+3.25+5.40+2.80',{estimate:true,estimateExample:24,estimateRange:[22,26],estimateLabel:'先估大约多少澳元',questions:[major('准确总价',2420),choice('不超过$25吗','yes',[['yes','不超过'],['no','超过']])]})
 ],
 discounts:[
  calc('澳元$80的外套打七五折。先估一估，再算付多少。','AUD',6000,'80*(1-25%)',{estimate:true,estimateExample:60,estimateRange:[55,65],estimateLabel:'先估大约付多少澳元',questions:[major('折后价格',6000)]}),
  calc('澳大利亚题目：税前$45，加10% GST。计算含税总价。','AUD',4950,'45*1.10',{questions:[major('10%税额',450),major('含税总价',4950),choice('已标含GST的价格','already',[['already','不再加同一税额'],['again','再加10%']])]}),
  {...clone(T29.temperaturechange[1]),prompt:'模拟澳元余额从有$20减少$35。沿数轴走到欠$15，共减少多少？',start:20,end:-15,unit:'澳元'}
 ],
 moneysheet:[
  sheet('澳元表格：两项收入$12.85、$7.60，支出$3.95。先估，再写单元格公式。','AUD',{A1:1285,A2:760,A3:395},1650,'=A1+A2-A3',{labels:{A1:'收入1',A2:'收入2',A3:'支出'},estimate:true,estimateExample:17,estimateRange:[15,18],questions:[major('余下',1650)]}),
  sheet('澳元$64.90打85折。用公式算原价的15%作折扣，估计约$10。','AUD',{A1:6490},974,'=A1*15%',{labels:{A1:'原价'},estimate:true,estimateExample:10,estimateRange:[8,12],questions:[major('四舍五入到分，折扣是多少',974)]}),
  sheet('澳大利亚题目：税前$45，加10% GST；用单元格公式算含税价。','AUD',{A1:4500},4950,'=A1*1.1',{labels:{A1:'税前价格'},questions:[major('含税价',4950),choice('价格已经含税时','already',[['already','不再加同一税额'],['again','再加一次']])]})
 ]
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,ts])=>[id,clone(ts.at(-1))]));
const link=(from,to,title,a,b)=>({from,to,title,summary:'先做前一个操作，再把相同想法带到另一处。',tasks:[clone(a),clone(b)],phase:5,batch:'B33'});
export const BRIDGES=[
 link('coinvalues','poundnotation','认识面值，再换写法',TASKS.coinvalues[1],TASKS.poundnotation[0]),
 link('poundnotation','coincombo','同一笔钱，还能怎样摆',TASKS.poundnotation[1],TASKS.coincombo[1]),
 link('coincombo','pennyshop','摆出钱，再算找回',TASKS.coincombo[1],TASKS.pennyshop[1]),
 link('pennyshop','poundchange','便士里的找零，换成英镑',TASKS.pennyshop[1],TASKS.poundchange[1]),
 link('poundnotation','poundchange','英镑与便士，带进购买',TASKS.poundnotation[0],TASKS.poundchange[0]),
 link('auscoins','austrans','认识澳元，再买东西',TASKS.auscoins[2],TASKS.austrans[0]),
 link('austrans','dollarcents','从交易到元与分',TASKS.austrans[1],TASKS.dollarcents[0]),
 link('dollarcents','moneycalc','金额写法，再用计算器',TASKS.dollarcents[0],TASKS.moneycalc[1]),
 link('dollarcents','roughmoney','先写准，再估价',TASKS.dollarcents[0],TASKS.roughmoney[0]),
 link('poundchange','measuremoney','英镑总价也能和测量一起算',TASKS.poundchange[0],TASKS.measuremoney[2]),
 link('roughmoney','budgetchoices','估一个数，再安排预算',TASKS.roughmoney[0],TASKS.budgetchoices[0]),
 link('budgetchoices','discounts','预算之外，再看折扣',TASKS.budgetchoices[2],TASKS.discounts[0]),
 link('budgetchoices','moneysheet','选过价格，再交给表格',TASKS.budgetchoices[1],TASKS.moneysheet[0]),
 link('discounts','moneysheet','计算税额，再写表格公式',TASKS.discounts[1],TASKS.moneysheet[2]),
 link('lengthstory','modmoney','一段绳，也能成为故事模型',T29.lengthstory[0],TASKS.modmoney[1]),
 link('measureplot','modmoney','量过的记录，画成点',T28.measureplot[0],TASKS.modmoney[2]),
 link('calculatormeaning','moneysheet','检查机器结果，再写表格',T15.calculatormeaning[0],TASKS.moneysheet[0]),
 link('calculatormeaning','budgetchoices','先估算，再比较单价',T15.calculatormeaning[0],TASKS.budgetchoices[2]),
 link('flexhundred','usmoney','加减带进美元故事',T11.flexhundred[0],TASKS.usmoney[1]),
 link('measuremoney','practicalmeasure','比较单位，再分同一笔量',TASKS.measuremoney[1],T29.practicalmeasure[0])
];
