import * as G from './b24-geometry.js';
const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B24'});
export const LESSONS={
 placewords:item('mt_qeZYF6HZ4o','东西在哪里','相对位置与参照物','上、下、前、后、左、右都要说清参照物；前后和左右还与观察方向有关。','换到另一边看，左边还是原来那边吗？'),
 turnwalk:item('mt_TdV9YGJEoY','先走，再转弯','方向、转动与直角','四分之一圈是90°，半圈是180°，四分之三圈是270°；顺时针与逆时针描述转动的方向。','同样到左边，向左转一次和向右转三次有什么不同？'),
 pointbuild:item('mt_i5_HnoFOYw','点连起来，会出现什么','用坐标构造图形','先横向、再纵向确定点。连接点时还需看顺序；同一组点连成自交图形不等于闭合的长方形。','少了一个角，能怎样找到它？'),
 pointmove:item('mt_Uq5vYqboCR','一起往哪里挪','坐标平移','平移时每个点都按同一个方向和距离移动；向右增加横坐标，向上增加纵坐标。','一个角移动3格，其他角也必须移动3格吗？'),
 pointread:item('mt_jBQS-CicNn','给一个位置写地址','第一象限坐标','坐标是一对有顺序的数：先写从原点横向多少，再写纵向多少。图上交点表示位置。','(2,4)和(4,2)为什么不是同一个地方？'),
 signedpoints:item('mt_R4AY0LKxfl','原点的另一边','四象限坐标','向左的横坐标为负，向下的纵坐标为负；坐标轴上的点不属于任何象限。','向左3格、向上4格，要怎样写？'),
 pointaxes:item('mt_oDlduFnemk','两条数线交在一起','坐标轴与原点','横轴与纵轴是两条垂直数线，交点叫原点，写成(0,0)。横向数在前，纵向数在后。','交换两个数，点会去哪里？'),
 pointdistance:item('mt_h7zVgCDVmx','隔着原点有多远','坐标距离与图形测量','水平或竖直的距离是坐标差的绝对值；跨过零时需数清两边。面积与周长使用不同单位。','跨过原点时，为什么不能漏掉另一侧？'),
 pointstory:item('mt_snlqRCiA1R','点里的小故事','第一象限描点与数据含义','画点先找横坐标再找纵坐标；在真实或模拟数据图里，两轴的名称和单位决定点的含义。','同一个(2,4)，换了轴的名字还在说同一件事吗？'),
 mirrorfold:item('mt_hR2Y7NhMSY','另一半藏在哪里','轴对称与对应点','镜像点在镜线两侧，到镜线的垂直距离相等。沿镜线反射后，对应部分应完全重合。','两个点离镜线一样远，就一定是对应点吗？'),
 gridmotion:item('mt_SH7QgFl8-v','移动、翻面、转身','网格上的平移、反射和旋转','平移由方向和距离确定，反射由镜线确定，旋转由中心、角度和方向确定。它们保持长度和角度。','同样到另一边，翻过去与转过去有什么不同？'),
 turnsym:item('mt_NM5I3yN-Q6','转过来，还能重合吗','旋转对称','绕指定中心转动，如果不足一整圈就能与原图重合，图形有旋转对称。数整圈内的重合位置时包含一整圈回到起点。','同样转90°，为什么有的图形重合，有的不重合？'),
 flipandmove:item('mt_efOeaGFyGM','翻过来，再平移','反射、平移与全等','每个顶点都遵循同一条平移规则；镜像点到镜线的垂直距离相等。平移与反射保持边长和角度。','位置变了，哪些长度和角还一样？'),
 geometrylab:item('mt_RdfzwInyAj','让图形自己动起来','动态几何中的变换与不变量','图形在软件里可平移、反射、绕中心旋转；比较对应边长与角度，能观察这些变换保持形状大小。','变换先后换一换，结果一定一样吗？'),
 axisrules:item('mt_lxaM6iVpdr','镜子放在数线上','坐标平移与轴反射','平移对每个坐标加减相同数；关于横轴反射时横坐标不变、纵坐标反号，关于纵轴反射时则相反。','关于横轴翻过去，为什么横向位置不变？'),
 gridchange:item('mt_K0Y15w48SY','斜着的镜子与转动中心','坐标变换','关于y=x反射时两个坐标交换；绕非原点旋转必须先看中心。平移、反射、旋转保持边长和角度。','转动的中心换了，终点还会一样吗？'),
 patternfloor:item('mt_61Nhj8W78f','一块图形，能铺成什么','平面铺砌与变换图案','同样的正三角形、正方形或正六边形可各自铺满；正五边形不能单独形成这种正规铺砌。修改相对边并重复变换可产生新图案。','有缝、重叠和刚好铺满，分别是什么样？'),
 growshape:item('mt_y-BuQAfw4B','放大时，什么一起变','相似、放大中心与比例','以指定中心放大时，各点到中心的距离乘相同倍数；对应边长成相同倍数，对应角不变。每条边都加同一个数一般不是放大。','每条边都多5厘米，为什么不一定是同一个放大倍数？'),
};
export const SECTIONS=[{id:'position-find',title:'找位置，认坐标'},{id:'position-move',title:'移动与翻转'},{id:'position-pattern',title:'折叠、转动与图案'}];
const route=(id,section,title,ids)=>({id,section,title,ids,packIds:['positions'],themeId:'space',color:'#6d8eac'});
export const ROUTES=[route('EM','position-find','从哪里看，往哪边走',['placewords','turnwalk']),route('EN','position-find','给每个位置写地址',['pointaxes','pointread','pointstory']),route('EO','position-find','连点成形，跨过原点',['pointbuild','signedpoints','pointdistance']),route('EP','position-move','点和图形一起挪',['pointmove','gridmotion']),route('EQ','position-move','镜子里的图形和坐标',['flipandmove','axisrules']),route('ER','position-move','在网格上试变换',['gridchange','geometrylab']),route('ES','position-pattern','折过去，转过来',['mirrorfold','turnsym']),route('ET','position-pattern','图案铺开与放大',['patternfloor','growshape'])];
const q=(label,value,options)=>({label,value,...(options?{options}:{})}),ch=(label,value,options)=>q(label,value,options);
const grid=(prompt,target,extra={})=>({type:'x-p24-grid',prompt,target,given:[],domain:[-1,8,-1,8],close:false,questions:[],...extra});
const read=(prompt,points,extra={})=>({type:'x-p24-read',prompt,points,domain:[-1,8,-1,8],questions:[],...extra});
const distance=(prompt,points,segments,extra={})=>({type:'x-p24-distance',prompt,points,segments,domain:[-8,8,-7,8],questions:[],...extra});
const trans=(prompt,shape,goal,extra={})=>({type:'x-p24-transform',prompt,shape,goal,domain:[-8,8,-8,8],predict:true,needsMeasure:false,questions:[],...extra});
const mirror=(prompt,half,extra={})=>({type:'x-p24-mirror',prompt,half,line:'y',domain:[-6,6,-1,7],questions:[],...extra});
const walk=(prompt,ops,extra={})=>({type:'x-p24-walk',prompt,ops,start:[1,1,0],questions:[],...extra});
const place=(prompt,scene,want,extra={})=>({type:'x-p24-place',prompt,scene,want,questions:[],...extra});
const spin=(prompt,mode,extra={})=>({type:'x-p24-spin',prompt,mode,questions:[],...extra});
const base=[[1,1],[3,1],[1,3]],b2=[[-3,1],[-1,1],[-3,3]],center=[1,1];
const move=(dx,dy)=>({kind:'move',dx,dy}),flip=line=>({kind:'mirror',line}),turn=(angle,c=[0,0])=>({kind:'turn',angle,center:c}),scale=(factor,c=[0,0])=>({kind:'scale',factor,center:c});
const same=ch('移动前后','same',[['same','长度与角度不变'],['change','每条边都变长']]);
export const TASKS={
 placewords:[place('把小球放在桌子上面。','table','on',{questions:[ch('小球相对桌子','on',[['on','在桌子上面'],['under','在桌子下面']])]}),place('观察者在下方。把小球放到盒子背后。','depth','behind',{questions:[ch('背后指','far',[['far','从观察者看来，盒子的远侧'],['near','观察者与盒子之间']])]}),place('观察者从画面下方看。把小球放在盒子的左边。','side','left',{questions:[ch('左边要相对谁看','viewer',[['viewer','相对图中观察者的方向'],['fixed','不管从哪里看都不变']]) ]}),place('观察者仍从下方看。把小球放在盒子的右边。','side','right',{questions:[ch('换到盒子另一侧看','may-change',[['may-change','左右可能交换'],['fixed','左右永远不变']]) ]})],
 turnwalk:[walk('箭头朝上。向右转四分之一圈，看看方向。',['R'],{questions:[q('转了多少度',90)]}),walk('先向前走2格，再向右转，继续向前走2格。',['F','F','R','F','F'],{questions:[ch('一次右转','quarter',[['quarter','转了四分之一圈'],['half','转了半圈']])]}),walk('箭头朝上。连续向右转三次，每次四分之一圈。',['R','R','R'],{questions:[q('总共向右转了多少度',270),ch('最后方向','left',[['left','朝左'],['right','朝右']]) ]}),walk('箭头朝上。连续向右转两次，看一看半圈。',['R','R'],{questions:[q('总共转了多少度',180),ch('最后方向','down',[['down','朝下'],['up','朝上']]) ]})],
 pointbuild:[grid('把四个点放到(1,1)、(1,4)、(5,4)、(5,1)，再连成一圈。',[[1,1],[1,4],[5,4],[5,1]],{close:true,questions:[q('横着的边有多长',4),q('竖着的边有多长',3)]}),grid('三个角已经在图上。找出正方形缺的第四个角，再连起来。',[[1,4]],{given:[[1,1],[4,1],[4,4]],close:true,questions:[q('第四个点的横坐标',1),q('第四个点的纵坐标',4)]}),grid('已知两个点。再放上(2,5)，连成一个三角形。',[[2,5]],{given:[[1,1],[5,1]],close:true,questions:[q('这个三角形有几个角',3)]})],
 pointmove:[trans('点A从(2,3)向右走3格。先猜它会到哪里，再让它移动。',[[2,3]],move(3,0),{questions:[q('横坐标变成',5),q('纵坐标仍是',3)]}),trans('整个三角形向右4格、向上2格。先猜A会去哪里。',[[1,1],[3,1],[1,3]],move(4,2),{questions:[q('A的新横坐标',5),q('A的新纵坐标',3),same]}),trans('点A在(1,2)，先猜向右3格、向上2格的终点。',[[1,2]],move(3,2),{questions:[q('新横坐标',4),q('新纵坐标',4)]})],
 pointread:[read('选点A，写出它的地址：先横着看，再竖着看。',[[3,5]],{questions:[ch('第一个数说什么','x',[['x','横向位置'],['y','纵向位置']])]}),read('图中两个点的数相反了。分别写出它们的地址。',[[2,4],[4,2]],{questions:[ch('这两个点','different',[['different','不在同一个位置'],['same','只是写法不同']])]}),read('依次选出长方形的四个角，把每个点的地址记下来。',[[1,1],[5,1],[5,4],[1,4]],{polygon:true,questions:[q('一共有几个角',4)]})],
 signedpoints:[grid('从原点向左3格、向上4格，放下(−3,4)。',[[-3,4]],{domain:[-7,7,-7,7],questions:[ch('这个点位于','II',[['II','第二象限：左上'],['IV','第四象限：右下']])]}),grid('再放(2,−5)。先横着找，再向下找。',[[2,-5]],{domain:[-7,7,-7,7],questions:[ch('这个点位于','IV',[['IV','第四象限：右下'],['II','第二象限：左上']])]}),grid('把四个点放到四个方向，再把(0,3)放在轴上。',[[2,2],[-2,2],[-2,-2],[2,-2],[0,3]],{domain:[-6,6,-6,6],questions:[ch('在轴上的点','axis',[['axis','不属于任何象限'],['one','属于第一象限']]) ]})],
 pointaxes:[grid('把(0,0)放在两条数线相交的位置。',[[0,0]],{domain:[-4,6,-4,6],questions:[ch('横向的数线','x',[['x','横轴'],['y','纵轴']]),ch('竖向的数线','y',[['y','纵轴'],['x','横轴']])]}),grid('先横着走3格，再向上走5格，放下(3,5)。',[[3,5]],{questions:[q('先走的横向格数',3),q('再走的竖向格数',5)]}),grid('把(2,4)和(4,2)都放出来，比较它们。',[[2,4],[4,2]],{questions:[ch('交换两个数','different',[['different','通常到了不同位置'],['same','位置一定不变']]) ]})],
 pointdistance:[grid('连出四个点(−3,2)、(4,2)、(4,−1)、(−3,−1)。',[[ -3,2],[4,2],[4,-1],[-3,-1]],{domain:[-7,7,-5,6],close:true,questions:[q('横边长度',7),q('竖边长度',3),q('周长',20),q('面积',21)]}),distance('量两段竖线：一段没有跨零，另一段跨过零。',[[-5,6],[-5,1],[2,-4],[2,3]],[[0,1],[2,3]],{questions:[q('左边线段长度',5),q('右边线段长度',7)]}),distance('图书馆与公园在同一条横线上。每格100米，量一量。',[[-6,3],[2,3]],[[0,1]],{labels:['图书馆','公园'],questions:[q('相距多少米',800)]})],
 pointstory:[grid('先放一个点(4,7)。',[[4,7]],{questions:[q('横向数',4),q('纵向数',7)]}),grid('横轴是时间（分钟），纵轴是路程（米）。把三条模拟记录放上图。',[[1,2],[2,4],[3,6]],{axisNames:['时间（分钟）','路程（米）'],questions:[ch('(2,4)表示','meaning',[['meaning','2分钟走了4米'],['reverse','4分钟走了2米']])]}),read('再看这张模拟记录图，读出点A和点B。',[[2,3],[4,6]],{axisNames:['时间（分钟）','路程（米）'],questions:[ch('点B代表','meaning',[['meaning','4分钟走了6米'],['reverse','6分钟走了4米']]) ]})],
 mirrorfold:[mirror('沿竖线把右边的点翻到左边，再折过去检查。',[[0,0],[2,1],[3,3],[0,4]],{questions:[ch('对应点离镜线','equal',[['equal','垂直距离相等'],['samey','只需在同一边']])]}),mirror('换一半翅膀，找出镜线另一侧的对应点。',[[0,1],[1,2],[3,4],[0,5]],{questions:[q('画在镜线另一侧的点有几个',2)]}),mirror('这次从左半边补全，观察翻过去是否重合。',[[0,0],[-2,1],[-3,3],[0,5]],{questions:[ch('折回检查','match',[['match','对应部分完全重合'],['area','只要面积一样']]) ]})],
 gridmotion:[trans('先猜A的位置，再把三角形向右2格、向上1格。',base,move(2,1),{needsMeasure:true,questions:[same]}),trans('先猜A翻到哪边，再以竖轴为镜子翻过去。',base,flip('y'),{needsMeasure:true,questions:[same]}),trans('绕原点逆时针转四分之一圈。先猜A在哪里。',base,turn(90),{needsMeasure:true,questions:[q('转了多少度',90),same]})],
 turnsym:[spin('让正方形每次转四分之一圈，看一整圈中有几次重合。','square',{questions:[q('包括回到起点，一整圈重合几次',4)]}),spin('逐个转动风车、爱心和等边三角形，圈出不到一圈就能重合的图形。','classify',{questions:[ch('整整一圈才重合','no',[['no','不能单凭这一点叫旋转对称'],['yes','任何图形都算']])]}),spin('转一转叶片，围绕中心放出四片，做一只旋转对称的风车。','build',{questions:[q('围着中心放了几片',4)]})],
 flipandmove:[trans('把三角形沿竖轴翻到另一边。',base,flip('y'),{needsMeasure:true,questions:[q('A的新横坐标',-1),q('A的新纵坐标',1),same]}),trans('整个图形向右3格、向上2格。',b2,move(3,2),{needsMeasure:true,questions:[q('A的新横坐标',0),q('A的新纵坐标',3),same]}),trans('对照翻面前后的边和角，看看变的是位置还是大小。',base,flip('x'),{needsMeasure:true,questions:[same]})],
 geometrylab:[trans('在网格里让三角形向右3格、向上2格，再量对应边。',b2,move(3,2),{needsMeasure:true,questions:[same]}),trans('在网格里沿竖轴翻一次，再量对应边和角。',base,flip('y'),{needsMeasure:true,questions:[same]}),trans('以A点(1,1)为中心逆时针转90°，再量一量。',base,turn(90,center),{needsMeasure:true,questions:[q('旋转中心A的横坐标',1),q('旋转中心A的纵坐标',1),same]}),{type:'x-p24-studio',prompt:'先把一块沿竖线翻过去，再把两块一起转半圈，看看这个图案的对称。',questions:[ch('这幅图的镜线','both',[['both','横线和竖线都可以'],['one','只有竖线']]),q('绕中心转多少度可以重合',180)]}],
 axisrules:[trans('三角形向右3格、向下2格，先猜A的终点。',base,move(3,-2),{questions:[q('A的新横坐标',4),q('A的新纵坐标',-1)]}),trans('把图形以横轴为镜子翻过去。',base,flip('x'),{questions:[q('A的新横坐标',1),q('A的新纵坐标',-1)]}),trans('再以竖轴为镜子翻过去。',base,flip('y'),{questions:[ch('关于竖轴翻过去','xchange',[['xchange','横坐标变号，纵坐标不变'],['ychange','纵坐标变号']]) ]})],
 gridchange:[trans('沿斜线y=x翻转图形。先猜A的坐标。',[[1,2],[3,2],[1,4]],flip('y=x'),{needsMeasure:true,questions:[q('A的新横坐标',2),q('A的新纵坐标',1),same]}),trans('绕点(1,1)逆时针转90°，不要把原点当中心。',[[2,1],[4,1],[2,3]],turn(90,[1,1]),{needsMeasure:true,questions:[q('A的新横坐标',1),q('A的新纵坐标',2),same]}),trans('用向左2格、向上3格的移动，检查每个点。',base,move(-2,3),{needsMeasure:true,questions:[q('A的新横坐标',-1),q('A的新纵坐标',4),same]})],
 patternfloor:[{type:'x-p24-fan',prompt:'让同样的图形围着一点靠拢。分别试三角形、正方形、六边形和五边形。',samples:[[3,6],[4,4],[6,3],[5,3],[5,4]],questions:[q('三个正五边形围出多少度',324),q('离一整圈还差多少度',36),ch('同一种正图形能围满','three',[['three','三角形、正方形、六边形可以'],['all','正五边形也能刚好围满']])]}, {type:'x-p24-tiles',prompt:'先改变方块的边，再平移、转动四块，把它们铺成一小片。',questions:[q('铺了几块',4),ch('铺满的条件','fit',[['fit','没有空隙也没有重叠'],['any','边碰到一点就够']])]}, {type:'x-p24-frieze',prompt:'先把一块图形翻过去，再把这一对向右重复，做一条花边。',questions:[q('重复后有几块',4),ch('这条花边用到','both',[['both','翻面和同方向的移动'],['grow','每一块变大']])]}],
 growshape:[trans('以原点为中心，把三角形放大到2倍。先猜A会去哪里。',base,scale(2),{needsMeasure:true,questions:[q('A的新横坐标',2),q('A的新纵坐标',2),ch('对应角','same',[['same','角度不变'],['double','角度也变成2倍']])]}),trans('原长方形是3×5，想变成6×10。先猜A，再找放大倍数。',[[3,5],[0,5],[0,0],[3,0]],scale(2),{domain:[-2,12,-2,12],needsMeasure:true,questions:[q('3变成多少',6),q('5变成多少',10),q('两条边都乘了几',2)]}),trans('以(1,1)为中心，把三角形放大2倍。',[[2,1],[4,1],[2,3]],scale(2,[1,1]),{needsMeasure:true,questions:[ch('3×5的每条边都加5，得到8×10','not-similar',[['not-similar','不是同一倍数，不能算相似放大'],['similar','加相同数一定相似']]) ]})],
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,ts])=>[id,{...ts.at(-1)}]));
export const BRIDGES=[];
import {TASKS as T23} from './b23.js';
const link=(from,to,title,a,b)=>BRIDGES.push({from,to,title,summary:'把两次观察连起来，再检查位置和变化。',tasks:[structuredClone(a),structuredClone(b)],phase:5,batch:'B24'});
link('turnsym','patternfloor','绕中心转动，再做重复图案',TASKS.turnsym[2],TASKS.patternfloor[1]);
link('geometrylab','patternfloor','翻转一块，做成一条花边',TASKS.geometrylab[1],TASKS.patternfloor[2]);
link('gridmotion','patternfloor','移动与转动，能怎样铺开',TASKS.gridmotion[0],TASKS.patternfloor[1]);
link('mirrorfold','flipandmove','先找镜像点，再翻转整个图形',TASKS.mirrorfold[0],TASKS.flipandmove[0]);
link('pointbuild','flipandmove','连出的图形，每个角一起翻转',TASKS.pointbuild[2],TASKS.flipandmove[0]);
link('gridmotion','flipandmove','翻面与移动后比较边和角',TASKS.gridmotion[1],TASKS.flipandmove[1]);
link('pointmove','flipandmove','点的移动，变成整个形状的移动',TASKS.pointmove[0],TASKS.flipandmove[1]);
link('boundary','pointdistance','周长与面积，接到坐标边长',TASKS.pointdistance[0],TASKS.pointdistance[1]);
link('pointbuild','pointdistance','连出长方形，再量它的边',TASKS.pointbuild[0],TASKS.pointdistance[0]);
link('distancezero','pointdistance','原点两边，距离怎样相加',TASKS.signedpoints[2],TASKS.pointdistance[1]);
link('shapeaxes','mirrorfold','找到折线，再补上另一半',T23.shapeaxes[0],TASKS.mirrorfold[0]);
link('gridmotion','mirrorfold','翻过去，再检查每个对应点',TASKS.gridmotion[1],TASKS.mirrorfold[1]);
link('gridmotion','shapeaxes','图形翻转与对称线的关系',TASKS.gridmotion[1],T23.shapeaxes[1]);
link('pointread','pointbuild','先读位置，再把点连起来',TASKS.pointread[0],TASKS.pointbuild[0]);
link('quadsort','pointbuild','检查长方形，再在网格上构造',T23.quadsort[1],TASKS.pointbuild[0]);
link('turnwalk','pointread','先看方向，再说位置',TASKS.turnwalk[1],TASKS.pointread[0]);
link('axisrules','gridchange','沿坐标轴翻，再试斜着的镜线',TASKS.axisrules[1],TASKS.gridchange[0]);
link('flipandmove','axisrules','观察翻面，再写坐标变化',TASKS.flipandmove[0],TASKS.axisrules[2]);
link('signedpoints','axisrules','坐标的正负，接到镜像',TASKS.signedpoints[0],TASKS.axisrules[1]);
link('gridmotion','axisrules','操作后观察坐标怎么改变',TASKS.gridmotion[1],TASKS.axisrules[1]);
link('mirrorfold','turnsym','折线和转动，两种不同的重合',TASKS.mirrorfold[0],TASKS.turnsym[0]);
link('pointbuild','signedpoints','画出的点，也可以在零的另一侧',TASKS.pointbuild[0],TASKS.signedpoints[0]);
link('gridmotion','signedpoints','图形移动后，也有负坐标',TASKS.gridmotion[1],TASKS.signedpoints[1]);
link('pointstory','signedpoints','原点右上，再看原点的另一侧',TASKS.pointstory[0],TASKS.signedpoints[0]);
link('flipandmove','geometrylab','翻面与平移后检查对应边',TASKS.flipandmove[0],TASKS.geometrylab[0]);
link('turnsym','geometrylab','围绕中心转，再观察长度',TASKS.turnsym[0],TASKS.geometrylab[2]);
link('gridmotion','geometrylab','会做一次变换，再量对应部分',TASKS.gridmotion[0],TASKS.geometrylab[0]);
link('pointaxes','pointstory','坐标地址放回时间和路程',TASKS.pointaxes[1],TASKS.pointstory[1]);
link('placewords','turnwalk','先分清左右，再按方向走',TASKS.placewords[2],TASKS.turnwalk[1]);
link('pointread','pointmove','读出位置，再预测移动',TASKS.pointread[0],TASKS.pointmove[0]);
link('gridmotion','pointmove','整体平移，每个点都怎样走',TASKS.gridmotion[0],TASKS.pointmove[1]);
link('gridchange','growshape','移动改变位置，放大会改变长度',TASKS.gridchange[2],TASKS.growshape[0]);
