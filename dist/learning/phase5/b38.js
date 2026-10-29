import {TASKS as T10} from './b10.js';
import {TASKS as T16} from './b16.js';
import {TASKS as T18} from './b18.js';
import {TASKS as T05} from '../phase4/b05.js';
import {LESSONS as MORE_LESSONS,ROUTES as MORE_ROUTES,TASKS as MORE_TASKS} from './b38-more.js';
const clone=x=>structuredClone(x);
const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B38'});
export const LESSONS={
 show38:item('mt_nyK25mNOeR','让别人看见你怎么想','展示解题过程','数字能告诉别人结果，圆片和动作还能展示它是怎么来的。看别人的方法时，可以指出具体哪一步与原来的数量对不上。','如果对方只说出答案，你还想看见什么？'),
 because38:item('mt_a3dov8CZkq','为什么能这样说','依据、错误分析与推理链','比较分数时要说清同一个整体。拆开一捆十只改变表示，不改变总量。6个8可以从6个10中拿走6个2得到。','你说的每一步，能从前面哪一件事得到？'),
 argument38:item('mt_j5YqQnN6xe','找一个能推翻它的例子','数学论证、反例与推理链','给出的条件和已知关系可以连成推理；一个符合条件却与“总是”相反的例子，可以推翻这句“总是”。几个符合的例子不能证明所有情况。','如果把“总会变大”改成“总不会变小”，你刚才的例子还管用吗？')
};
export const SECTIONS=[{id:'reasoning-words',title:'把理由讲明白'},{id:'reasoning-model',title:'把生活变成数学'},{id:'reasoning-plan',title:'先计划，再检查'}];
export const ROUTES=[{id:'HN',title:'把想法摆出来，再找能推翻的例子',section:'reasoning-words',packIds:['reasoning'],themeId:'patterns',color:'#9c8b9c',ids:['show38','because38','argument38']}];
const card=(id,text)=>({id,text}),line=(id,text)=>({id,text});
const chain=(prompt,cards,paths,extra={})=>({type:'x-r38-chain',prompt,cards,paths,...extra});
const counter=(prompt,rule)=>({type:'x-r38-counterexample',prompt,rule});
export const TASKS={
 show38:[
  clone(T10.jointhings[0]),
  clone(T10.takethings[0]),
  chain('有人说5减2剩2。点出最先不对的一步，再摆出能让人看懂的两句话。',[
   card('parts','5可以分成2和3'),card('remove','拿走2后，剩下3'),card('wrong','拿走2后，原来和剩下都变成2')
  ],[['parts','remove']],{sceneText:'从5个里拿走2个，剩下的是没有拿走的部分。',lines:[line('start','原来有5个，拿走2个'),line('error','拿走2个，所以剩下2个'),line('end','结果写成5−2＝2')],error:'error'})
 ],
 because38:[
  {...clone(T16.smallershare[2]),left:[1,3],right:[1,5],prompt:'两条一样长的纸带，分别分成3份和5份。各取一份，先猜再叠起来。'},
  chain('有人把71−46算成35。先指出第一次错误，再拆开一捆十，排好修正的思路。',[
   card('exchange','71里拆开一捆十，变成6个十和11个一'),card('ones','11个一减6个一，剩5个一'),card('tens','6个十减4个十，剩2个十'),card('answer','合起来是25'),card('flip','把个位的6减1就可以')
  ],[['exchange','ones','tens','answer'],['exchange','tens','ones','answer']],{scene:'exchange',lines:[line('start','71里有7个十和1个一'),line('error','个位1不够减6，就用6减1'),line('end','十位7减4，所以答案是35')],error:'error'}),
  chain('每列有6个点，一共有10列，拿走两列。把“6个8为什么是48”连成一条思路。',[
   card('ten','6×10＝60'),card('two','6×2＝12'),card('eight','6×8＝60−12＝48'),card('wrong','6×8＝60＋12')
  ],[['ten','two','eight'],['two','ten','eight']],{scene:'array'})
 ],
 argument38:[
  chain('三角形里两个角是50°和70°。不用量角器，能把剩下的角说清楚吗？',[
   card('given','已知两角是50°和70°'),card('sum','三角形三个内角合起来是180°'),card('two','这两个角合起来120°'),card('answer','剩下的角是180°−120°＝60°'),card('wrong','剩下的角一定等于70°')
  ],[['given','sum','two','answer'],['sum','given','two','answer']],{scene:'triangle'}),
  {...clone(T18.fractionquotient[1]),prompt:'3/4升果汁，每份1/2升。亲手装一装，不足一份的部分也要算。'},
  chain('有人算3/4÷1/2，把第一个分数倒过来。先指出错误，再用装果汁的过程说明。',[
   card('half','每份1/2升是2个1/4升'),card('one','3个1/4升可以装1份，还剩1个1/4升'),card('last','剩下的是半份，一共1又1/2份'),card('wrong','装不到一份，所以答案是2/3份')
  ],[['half','one','last']],{sceneText:'把3/4升分成1/2升一份；每个小格表示1/4升。',lines:[line('start','要算3/4÷1/2'),line('error','把3/4倒过来，写成4/3×1/2'),line('end','因此得到2/3份')],error:'error'}),
  counter('有人说：大于0的数，乘0或正数后总会变大。自己找一个让这句话不成立的例子。','strict'),
  counter('那人改口说：大于0的数，乘0或正数后总不会变小。再自己找一个例子试试。','nonstrict')
 ]
};
Object.assign(LESSONS,MORE_LESSONS);ROUTES.push(...MORE_ROUTES);Object.assign(TASKS,MORE_TASKS);
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,ts])=>[id,clone(ts.at(-1))]));
const link=(from,to,title,a,b)=>({from,to,title,summary:'先把一个理由摆出来，再把这个想法带到另一处。',tasks:[clone(a),clone(b)],phase:5,batch:'B38'});
export const BRIDGES=[
 link('because38','fractionreason','从一份的大小，走到比较不同分数',TASKS.because38[0],T16.fractionreason[0]),
 link('fractionreason','argument38','从拼角，走到用角的事实说明',T16.fractionreason[2],TASKS.argument38[0]),
 link('words38','communicate38','把比较的话换成关系符号',TASKS.words38[1],TASKS.communicate38[3]),
 link('precise38','term38','从平方单位走到平面与空间',TASKS.precise38[2],TASKS.term38[3]),
 link('term38','advancedWords38','从面积单位走到体积单位',TASKS.term38[2],TASKS.advancedWords38[2]),
 link('story38','represent','故事里的数，也能放进图中',TASKS.story38[0],T05.represent[0]),
 link('objects38','lifemath38','从表示变化走到说清余下的量',TASKS.objects38[0],TASKS.lifemath38[0]),
 link('model38','modelChoice38','从缩放材料走到按比分配',TASKS.model38[0],TASKS.modelChoice38[0]),
 link('sense38','plan38','先认清问题，再辨认有用的量',TASKS.sense38[0],TASKS.plan38[0]),
 link('plan38','multi38','从估计走到多步与核对',TASKS.plan38[2],TASKS.multi38[0]),
 link('multi38','multiShape38','把中间量带到下一件事',TASKS.multi38[0],TASKS.multiShape38[0]),
 link('multiShape38','complex38','从分数比较走到限制条件',TASKS.multiShape38[3],TASKS.complex38[2]),
 link('complex38','advancedPlan38','从量级估计走到小数除法估计',TASKS.complex38[1],TASKS.advancedPlan38[3])
];
