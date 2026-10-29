const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B10'});
export const LESSONS={
 jointhings:item('mt_OvyoRo47K-','两小堆，变成一大堆','加法：合并与增加','两堆原来分开放，也可以看成一个整体；后来又来一些，也会形成新的整体。加法记录这两部分合起来有多少。','“原来有两堆”和“又来了一些”，哪里相同，哪里不同？'),
 takethings:item('mt_zuKAX6lcYR','拿走以后，还剩哪些','减法：取走、缺少的部分与差','拿走一部分，剩下的是另一部分；两排一一配对后，多出的部分也是差。减法可以表示取走，也可以找缺少多少或相差多少。','7颗与4颗比多少，为什么不必真的丢掉任何一颗？'),
 showactions:item('mt_PgsHGYJMH-','同一件事，换一种画法','加减法的多种表征','小圆片、点图、手指图和算式可以表示同一个数量关系。换画法要保留原来的部分与整体。屏幕手指图不能代替真实手指动作。','换成点图后，原来的3和2分别在哪里？'),
 smallstories:item('mt_yJmvUCCym7','把故事摆出来','十以内加减应用与未知位置','先找故事里的原有数量、变化和结果，再用物品表示。问题可能问结果，也可能问最初有多少或后来来了多少，不能只凭某个词选择运算。','“又来了”就一定要把题里两个数相加吗？'),
 screenstories:item('mt_Y6_cq3UMyy','让小圆片演一遍','用屏幕计数物表示数量故事','把数量摆出来，再让圆片到来或离开。换成点图，数量关系不变。真实物品与屏幕圆片的对应还可以拿实物试一试；这里不会自动判定实物操作。','换了画法，哪一些东西变了，哪一些没有变？'),
 screenadd:item('mt_biGHAbkoV2','搬一搬，让十先站出来','屏幕十格框中的拆分与跨十','8可以分成5和3，也可以分成6和2。8+5先搬2个填满十，剩下3个；15−7先拿走5到十，再拿走2。搬动的是同一批圆片。','凑十时搬走的2个，为什么不能再算一遍？'),
 signsfirst:item('mt_8RmpkDxT9L','把刚才的动作写下来','加号、减号与等号','＋记录合起来，−记录取走或比较差。＝表示两边数量相同，所以5=3+2也成立，4+1=3+2也成立。读出来、手写清楚还需要实际练习。','等号后面一定只能写一个答案吗？'),
 basicadd:item('mt_mr_Vk7FGzK','多一点，少一点，不变呢','二十以内加减与零的作用','加的是几个一，就增加几个一；减去几个一，就减少几个一。加0或减0都没有圆片到来或离开，数量保持原样。','做了一个运算，数量一定会变吗？'),
 earlyunknown:item('mt_VAWV_l7J0D','结果知道，开头藏在哪里','二十以内应用与缺数问题','7=□−9是在问：原来有多少，拿走9后还剩7。可以把9和7重新合起来找到16，再实际拿走9检查。未知数可以在开头、变化处或结果处。','看到减号时，为什么有时要用加法找原来的数量？'),
 splitpairs:item('mt_7XcCG43ZZW','一堆东西，有几种分法','数的分解与部分—整体','整体不变，两部分可以一边多一颗、另一边少一颗。5的不同配对有0和5、1和4、2和3；交换左右还是同一对。零也是一种部分。','怎样有顺序地找，才不漏掉一种分法？'),
 partnersten:item('mt_e8CZ7E5qW7','还缺几个，刚好装满','凑十的数对','十格里已有7个，缺的3个与7合成10；已有6个，就缺4个。已知一部分和整体，可以找另一部分。','“还缺几个”和“一共有几个”，问的是同一件事吗？'),
 factsfive:item('mt_ghF3Vv6taM','五以内，想不起来就拆开','五以内的加减事实','2+3=5、5−2=3和5−3=2来自同一个整体。想不起来可以重新摆一摆。做完这里的少量活动，不代表已经能熟练回忆全部算式。','忘记5−2时，怎样用两部分帮自己找回来？'),
 bonds20:item('mt_s2mfRBoTal','三个数，能写几句话','二十以内的加减事实族','8、5、13连着四句话：两种顺序的加法，以及整体减去其中一部分的两种减法。不同整体的配对不能混在一起。','13−5为什么能从8+5里直接找出来？'),
 bridge20:item('mt_m1W6nTQJ2b','经过十，再往下走','凑十与破十策略','8+6把6拆成2和4，先到10，再加4。13−4把4拆成3和1，两次都要拿走：先到10，再到9。','减到十以后，剩下的那部分是加回来还是继续减？'),
 factsten:item('mt__we2TDqnJx','十以内，找回熟悉的组合','十以内加减事实与策略','已知的数对可以帮助重建忘记的算式；加法与相关减法一起练。这里不计时，做完也不等于已经熟练掌握所有十以内算式。','7−3和4+3，怎样互相帮忙？'),
 factstwenty:item('mt__t4afSyZRm','跨过十，也有熟悉的伙伴','二十以内加减事实与策略','15−8可以借助8+7=15，也可以先减5到10再减3。熟练需要不同日子的实际表现；本活动不判定三秒回忆或全范围熟练。','知道一个加法，能少记哪两个减法？'),
 countsteps:item('mt_PpWSHA-0kv','从已有的数，接着走','接着数与倒着数','算8+3，从8出发，三步依次是9、10、11。起点8不算第一步。减法向回走；加法可以从较大的一部分接着数。','为什么从8走三步，不是8、9、10？'),
 swapadd:item('mt_QCgbiVrwnp','交换两堆，总数会变吗','加法交换律及其边界','3+8和8+3只是交换同一批东西的位置，整体不变。5−3与3−5却不同：3个实物拿不出5个。实物取走模型到这里就不够用了，负数在另一条路线。','为什么加法换顺序可以，减法不能照搬？'),
 tripleadd:item('mt_Zx1xZM-RbX','三堆里，先合哪两堆','三个数相加的便利策略','先找能凑十的一对，或两个相同的数，再带上第三堆。其他配对也可能算对；少算或重复算第三堆会改变总数。','先合7与3以后，原来的5去哪里了？'),
 regroupadd:item('mt_T76hKqXf0z','先合谁，最后会一样吗','加法结合律及其边界','同样三个部分，先合不同的两部分，总数不变。改变相邻两部分的组合是结合；跨位置选一对还用了换顺序。减法不能照搬：(10−3)−2=5，10−(3−2)=9。','换的是位置，还是先算哪一组？'),
 scaleadd:item('mt_3e_PQxwC12','一颗变成一捆，关系还在吗','利用数对推导整十与进十加法','6个一加4个一是10，6个十加4个十是100。35+5是增加5个一，可以把10个一换成1个十；35+50是增加5个十，结果85。','35+5和35+50，看起来都多了5，为什么结果不同？'),
 undoadd:item('mt_ehGS_uVSJv','把变化倒着做回来','加减互逆与缺数检验','15+7=22，取走同样的7就回到15。□+9=14可以用14−9找缺的5，再用5+9检查。加减互逆围绕同一个整体和两个部分。','再算一次加法，和用减法倒着检查，有什么不同？'),
};
export const SECTIONS=[{id:'act',title:'摆出故事'},{id:'parts',title:'拆开，再合上'},{id:'strategy',title:'换个顺手的算法'}];
const route=(id,title,section,ids)=>({id,title,section,ids,packIds:['add-subtract'],themeId:'numbers',color:'#ae8259'});
export const ROUTES=[route('AR','合起来，拿走，再画出来','act',['jointhings','takethings','showactions']),route('AS','让数量演故事','act',['smallstories','screenstories','signsfirst']),route('AT','有时藏起来的是开头','act',['basicadd','earlyunknown']),route('AU','一堆东西，拆出伙伴','parts',['splitpairs','partnersten','factsfive']),route('AV','搬过十，连成一家','parts',['bridge20','screenadd','bonds20']),route('AW','接着数，找回熟悉的数对','parts',['countsteps','factsten','factstwenty']),route('AX','交换与先合两堆','strategy',['swapadd','tripleadd','regroupadd']),route('AY','放大关系，倒着检查','strategy',['scaleadd','undoadd'])];
const story=(a,b,op,prompt,extra={})=>({type:'x-joinstory',a,b,op,prompt,...extra});
const split=(total,prompt,extra={})=>({type:'x-splitbench',total,prompt,...extra});
const ten=(a,b,op,prompt)=>({type:'x-tenbridge',a,b,op,prompt});
const family=(a,b,prompt)=>({type:'x-factfamily',a,b,prompt});
const recall=(cases,prompt)=>({type:'x-recallbench',cases:cases.map(([a,b,op='+'])=>({a,b,op})),prompt});
const steps=(a,b,op,prompt)=>({type:'x-countsteps',a,b,op,prompt});
const triple=(values,prompt,useful=false)=>({type:'x-threegroups',values,prompt,useful});
const unit=(start,amount,prompt,exchange=false)=>({type:'x-unitadd',start,amount,prompt,exchange});
export const TASKS={
 jointhings:[story(3,2,'+','已经有3位小伙伴，又来了2位。用圆片摆出两部分，再让他们汇合。'),story(2,4,'+','桌子两边分别有2颗红珠和4颗蓝珠。把这两堆当作一个整体。')],
 takethings:[story(5,2,'-','5块饼干，吃掉2块。摆出原来的一堆和要拿走的数量，再实际拿走。'),story(8,1,'-','8颗珠子送出1颗。剩下的就一定很少吗？'),story(7,4,'-','红珠有7颗，蓝珠有4颗。把两排一一配对，看看红珠多几颗。',{compare:true})],
 showactions:[story(3,2,'+','用圆片把3和2合起来。记住两部分在哪里。'),story(3,2,'+','还是3和2，自己重新用手指图表示，再合起来。',{rep:'fingers'}),story(5,1,'-','改用点图：先画5个点，再划去1个。写下你画的事情。',{rep:'dots'})],
 smallstories:[story(6,2,'-','6个苹果，吃掉2个。用圆片演一遍，问还有多少。'),story(3,4,'+','原来3颗弹珠，又来了4颗。把变化演出来。'),story(4,3,'+','盒子有7颗珠子，其中4颗红珠，其余蓝珠。摆出两部分，找蓝珠有多少。',{hidden:'b',target:7}),story(6,2,'+','有人先站在车站，又来了2人，现在8人。最开始有几人？把完整故事摆出来。',{hidden:'a',target:8})],
 screenstories:[story(4,3,'+','十格池塘里原来4只青蛙，后来跳来3只。用圆片表示它们。',{rep:'frame'}),story(9,2,'-','原来9只气球，飞走2只。圆片怎样移动才能表示这个故事？',{rep:'frame'}),story(4,3,'+','还是4只与3只青蛙，换成点图重新摆。数量关系有没有改变？',{rep:'dots'})],
 screenadd:[split(8,'把8分成5和3，再换成6和2。每次自己写一句算式。',{pairs:[[5,3],[6,2]]}),ten(8,5,'+','8+5：从后一堆搬一些填满十，再把剩下的接上。'),ten(15,7,'-','15−7：先拿走一些到十，再把还要拿的拿走。')],
 signsfirst:[story(3,2,'+','把3与2摆好并合起来，再用＋和＝记录。也可以把整体写在等号前面。'),story(5,2,'-','摆出5，拿走2，把动作写成带−和＝的算式。'),story(4,1,'+','一边摆4与1，另一边已经是3与2。把两边数量相同这件事写出来。',{balance:[3,2]})],
 basicadd:[story(14,5,'+','已有14颗珠子，再放进5颗一，实际合起来。',{rep:'frame'}),story(17,3,'-','17颗珠子拿走3颗一。用两排十格来表示。',{rep:'frame'}),story(12,0,'+','有12颗珠子，这次来了0颗。仍然做一次合并，看看改变了什么。',{rep:'frame'}),story(16,0,'-','有16颗珠子，要拿走0颗。实际试一试。',{rep:'frame'})],
 earlyunknown:[story(12,4,'-','12颗糖，给出去4颗，还剩多少？'),story(16,9,'-','7=□−9：拿走9以后还剩7。自己摆出最开始的一堆，再拿走检查。',{hidden:'a',target:7}),story(12,4,'-','原来12辆车，开走一些后剩8辆。把开走的那一部分找出来。',{hidden:'b',target:8})],
 splitpairs:[split(5,'5颗圆片分两堆，找齐不同配对，交换左右算同一对。记得有一堆可以是零。'),split(8,'8也不只有一种分法。找到3种不同配对，交换左右不重复算。',{count:3})],
 partnersten:[story(7,3,'+','十格已经装了7个，还要几个才能装满？自己摆出缺的那一堆。',{hidden:'b',target:10,rep:'frame'}),story(6,4,'+','这次已有6个，填满十还缺几个？',{hidden:'b',target:10,rep:'frame'}),split(10,'自己找3对能凑成十的伙伴，每对写成算式。',{count:3})],
 factsfive:[family(2,3,'把2、3、5连成一家：合起来，再分别拿走一部分。'),recall([[2,3],[5,2,'-'],[3,3,'-'],[4,0],[4,0,'-']],'试着从刚才的关系里找答案，想不起来可以看看圆片。不计时。')],
 bonds20:[family(8,5,'用8与5合成整体，再倒着拆出这两部分，写齐四句话。'),ten(8,5,'+','8+5忘记时，可以怎样借十重新找到它？'),recall([[8,5],[13,5,'-'],[13,8,'-'],[7,9],[16,9,'-']],'换着看加法和减法，看看能否从已知的伙伴找回来。')],
 bridge20:[ten(8,6,'+','8+6，先让十出现。哪些圆片搬过去，哪些还在后面？'),ten(13,4,'-','13−4，先到十。剩下还要拿走的部分，继续往哪个方向？'),family(8,4,'8+4=12。把同一个整体分别拆开，写出相关减法。')],
 factsten:[family(4,3,'4与3合成7，再从7中找回两部分。'),recall([[6,4],[10,6,'-'],[4,4],[8,4,'-'],[9,1,'-'],[7,0]],'试几种十以内的关系。不记得就看看圆片，原来的回答也会留下。')],
 factstwenty:[ten(15,8,'-','15−8，用十作为中途的一站，重新搭出这个关系。'),family(7,8,'7、8、15能互相帮忙。做出四个方向的关系。'),recall([[7,8],[15,8,'-'],[9,6],[15,6,'-'],[8,8],[16,8,'-']],'把同一个整体里的加减穿插着试。这里不计时。')],
 countsteps:[steps(8,3,'+','已经在8，从下一站开始走3步。每一步先写下一站，再留下。'),steps(12,3,'-','已经在12，倒着走3步。起点不算一步。'),steps(2,9,'+','2+9，可以从较大的一堆开始，少走一些步。自己选起点再走。')],
 swapadd:[story(3,8,'+','合并3与8，再把同一批东西的两部分交换位置，分别记录。',{swap:true}),steps(3,8,'+','交换顺序后，从8接着数3步。'),story(5,3,'-','先试5颗拿走3颗，再交换成3颗拿走5颗。实物还够拿吗？',{swap:true})],
 tripleadd:[triple([5,7,3],'先挑两堆合起来，再带上第三堆。留两种做法，其中试一次凑十。',true),triple([4,4,3],'这次没有凑十的一对，但有一样多的两堆。留两种做法。',true)],
 regroupadd:[triple([2,6,4],'同样三堆，先合不同的两堆，留两种做法比较。'),triple([2,8,5],'改变先算哪一对，第三堆仍要带上。再试两种做法。'),{type:'x-subgroups',prompt:'减法也能随便改变先算哪一组吗？亲自分两步算出这两个结果。'}],
 scaleadd:[recall([[7,8],[15,8,'-']],'先试7+8和15−8，想不起来就看看圆片。'),story(6,4,'+','先把6个一与4个一合起来。'),unit(60,40,'现在每颗代表一个十：60再加40。摆出增加的部分，再合起来。'),unit(35,5,'35加5个一：把满十的散颗实际换成一捆。',true),unit(35,50,'同样从35开始，这次加5个十。与刚才加5个一有什么不同？')],
 undoadd:[story(5,9,'+','有一堆藏起来的圆片，再加9颗后共14颗。先用两个部分搭出缺的那一堆。',{hidden:'a',target:14}),family(15,7,'15与7合成22。亲自倒着取走一部分，检查能否回到原来的另一部分。'),family(5,9,'□+9=14。把找到的5放回去，再写出正着与倒着的关系。')],
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,ts])=>[id,structuredClone(ts[0])]));
const link=(from,to,title,summary,tasks)=>({from,to,title,summary,tasks:structuredClone(tasks),phase:5,batch:'B10'});
export const BRIDGES=[
 link('jointhings','showactions','合并也能画出来','同一个合并动作，换一种表示。',[TASKS.jointhings[0],TASKS.showactions[1]]),
 link('takethings','signsfirst','把拿走写成一句话','取走的部分与减号对应。',[TASKS.takethings[0],TASKS.signsfirst[1]]),
 link('showactions','smallstories','让画法接住故事','表示数量，再处理故事里缺少的部分。',[TASKS.showactions[2],TASKS.smallstories[2]]),
 link('showactions','screenstories','换一种表示，关系保留','重新构造两种图，不靠看过就完成。',[TASKS.showactions[0],TASKS.screenstories[2]]),
 link('jointhings','splitpairs','合成整体，再找不同拆法','合并与部分配对相连。',[TASKS.jointhings[1],TASKS.splitpairs[0]]),
 link('splitpairs','partnersten','把整体固定为十','一般拆分连接凑十的数对。',[TASKS.splitpairs[1],TASKS.partnersten[2]]),
 link('partnersten','bridge20','借凑十越过十','找到缺口，再实际搬动。',[TASKS.partnersten[0],TASKS.bridge20[0]]),
 link('bridge20','screenadd','换一个数，仍然先到十','加减两种方向都实际跨过十。',[TASKS.bridge20[1],TASKS.screenadd[1]]),
 link('partnersten','bonds20','凑十连到更多伙伴','从十的配对扩展到另一个整体。',[TASKS.partnersten[1],TASKS.bonds20[0]]),
 link('factsfive','factsten','小数对里也有大一点的关系','两组事实族分别做出正反动作。',[TASKS.factsfive[0],TASKS.factsten[0]]),
 link('bridge20','factstwenty','忘记时有路找回来','跨十重建与事实族相连。',[TASKS.bridge20[0],TASKS.factstwenty[1]]),
 link('jointhings','swapadd','合起来后，交换两堆','同一批物品保留整体。',[TASKS.jointhings[0],TASKS.swapadd[0]]),
 link('swapadd','tripleadd','交换位置，挑出顺手的一对','换顺序帮助发现三堆里的凑十伙伴。',[TASKS.swapadd[0],TASKS.tripleadd[0]]),
 link('swapadd','regroupadd','换顺序与先合一对','分别实际交换与分组，比较整体。',[TASKS.swapadd[0],TASKS.regroupadd[0]]),
 link('bridge20','scaleadd','十的办法搬到更大的数','跨十与十个一换一个十相连。',[TASKS.bridge20[0],TASKS.scaleadd[3]]),
 link('basicadd','earlyunknown','把变化用进故事','从已知变化到找原来的数量。',[TASKS.basicadd[1],TASKS.earlyunknown[1]]),
];
