import {TASKS as old23} from './b23.js';
const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B25'});
export const LESSONS={
 turnroute:item('mt_Y9XKzLrUAZ','走一步，还是转一下','方向与转动','前进或后退改变位置；转弯改变朝向。四分之一圈、半圈和一整圈描述转过的量。','转了半圈，位置一定变了吗？'),
 anglecorner:item('mt_8OAGVdeTJ_','开口变了多少','角与转动','从同一个点出发的两条边之间的开口，可以用转过多少来描述。边画长或画短，不改变开口。','两条边长一些，角一定更大吗？'),
 angleparts:item('mt_3S10OOGPqu','两条线在哪里相遇','角的顶点与射线','两条射线从同一个端点出发，形成角；共同端点叫顶点。角的大小由开口决定。','门、剪刀与图形的角有什么共同点？'),
 rightcheck:item('mt_MFfYcnv6Tv','拿一个角作比较','直角与四分之一转','四分之一圈形成直角。两个直角是半圈，四个直角是一整圈。直角可以朝任意方向。','边画得更长时，直角会变大吗？'),
 angletypes:item('mt_h0CVtqI2xo','哪个开口更大','锐角、直角与钝角','小于直角的角叫锐角；大于直角而小于平角的角叫钝角。比较时对齐顶点与一条边。','怎样比较边长不同的两个开口？'),
 anglestraight:item('mt_LBT-9jz7kR','半圈与更多一点','平角、优角与周角','半圈是平角；超过半圈而不到一整圈是优角；一整圈是周角。两条边相同的位置仍要说清看哪一侧的开口。','时针与分针之间为什么可以看出两个开口？'),
 degreeunit:item('mt_qUGMyMYn9m','一圈分成多少小份','度与一周','把一整圈等分成360份，每份对应一度。90度是四分之一圈，180度是半圈。','45度相当于多少个一度？'),
 angleestimate:item('mt_YUJ5pwalqL','先看开口，再量一量','角度估计','先拿直角、半圈或四分之三圈作参照，估计开口，再测量检查。估计是接近，不必与测量完全相同。','觉得比直角大一点时，量出50度合理吗？'),
 angleprotractor:item('mt_4MFUAsbx_6','让量角器对准','量角器的放置与刻度','量角器中心对准角的顶点，一条边与0度线对齐，再从对应的0度方向读另一条边。','为什么两排刻度不能随便选一排？'),
 lineorientation:item('mt_u23IGDxOpk','两条线会相遇吗','平行线与垂线','同一平面内的平行线延长也不相交；垂线相交成直角。两种关系都与图形是否摆正无关。','两条边长短不同，就不能平行吗？'),
 linemark:item('mt_QysgF57dxh','从一个点画出线','点、线段、射线与角','线段有两个端点；射线从一个端点沿一个方向延伸；平行和垂直描述两条线之间的关系。','把一条边延长会改变角的开口吗？'),
 linenotation:item('mt_e4V6hvcuEJ','图上的小记号','几何图形中的标记','角名的三个字母中，中间字母是顶点；小方框表示直角。相同刻痕表示对应的长度相等。','图上画得像一样长，没有刻痕就一定相等吗？'),
 angleadd:item('mt_89riIKwGYp','把开口分成几份','角度的可加性','一个开口分成互不重叠的几个部分，各部分的度数相加等于整个开口。','知道整条直线是180度，怎样找缺的那一份？'),
 anglearound:item('mt_oqziWKry-L','一条直线，一整圈','直线和一点周围的角','一条直线的一侧是半圈180度；围绕一点一整圈是360度。对顶角相等，相邻角的关系要看它们是否合成直线。','对面的角相等，挨着的角也是相等吗？'),
 anglecross:item('mt_QDTO3GAgcq','两根线交叉以后','对顶角与邻角','两条直线相交，对顶的两角相等；相邻并构成直线的两角合起来是180度。','一边的角变大时，对面的角和旁边的角怎样变？'),
 rectanglefacts:item('mt_KFKUR_gBg_','长方形藏着的边和角','长方形的边角、周长与面积','长方形四个角都是直角，对边相等。周长是四边之和，面积是长乘宽；已知信息不同，找未知边的方法也不同。','周长和面积都含有长和宽，为什么不能用同一个算法？'),
 anglechain:item('mt_tedML_iu4Y','一步接一步找角','连续使用角度关系','找到一个角后，可以用同一直线上的和或对顶角相等，继续找到其他角。每一步都要看清使用的关系。','只知道一个角时，先找旁边还是对面的角？'),
 parallelangle:item('mt_H_pNJ3ZI_S','把一组角搬过去','平行线与截线所成的角','两条平行线被一条线穿过时，平移一组角可以比较对应位置；同位角和内错角相等，同旁内角合起来是180度。','为什么平行线上的角并不全都相等？'),
 triangleangles:item('mt_cdMlC7EpTJ','三角形的角能拼成什么','三角形、多边形的内角和','三角形的三个内角合起来是180度；四边形可以分成两个三角形。正多边形的角相等时，才能把总和平均分。','四边形里加一条线，能看到几个三角形？'),
 polygonangles:item('mt_J03RFlVdas','把多边形拆成三角形','多边形内角和与外角','从一个顶点把凸多边形拆成n−2个三角形，内角和是(n−2)×180度；正多边形的内角相等。','六边形为什么能拆成四个三角形？'),
 shapefacts:item('mt_DNYQLahbfa','形状的条件会传下去','四边形与圆的性质','正方形同时具备长方形和菱形的条件；平行四边形的对边分别平行。直径是半径的两倍，圆周长是直径的π倍。','正方形为什么能同时属于两个图形家族？'),
 triangledraw:item('mt_Jf8xcX4UTq','给出条件，画出三角形','按边角条件构造三角形','边长、角度和圆弧交点可以共同确定图形。画出后仍需测量和检查；屏幕上的输入绘图不等于实物尺规操作。','两条圆弧相交时，交点为什么可以作为第三个顶点？'),
 trianglecongruent:item('mt_167X6Ax8P7','什么时候是同一块形状','三角形全等与对应','全等图形的对应边与对应角相等。三边、两边及夹角、两角及夹边等条件可以确定三角形；两边和非夹角不一定能。','相同的两个边长和一个角，为什么有时还能画出两种形状？'),
 trianglepossible:item('mt_4bc3EAxhlY','这些条件能围出几个','三角形的存在与确定','三边必须任意两边和大于第三边；三个角相同只固定形状，不固定大小。两边与非夹角可能产生零个、一个或两个结果。','交点落在底边上，为什么不能围成三角形？'),
};
export const SECTIONS=[{id:'angle-turn',title:'先转一转，看开口'},{id:'angle-relate',title:'把线和角连起来'},{id:'angle-build',title:'拼图形，试条件'}];
const route=(id,section,title,ids)=>({id,section,title,ids,packIds:['angles'],themeId:'space',color:'#7d91a9'});
export const ROUTES=[
 route('EU','angle-turn','走一走，看到开口',['turnroute','anglecorner','angleparts']),
 route('EV','angle-turn','用一个角比一比',['rightcheck','angletypes','anglestraight']),
 route('EW','angle-turn','一度一度转',['degreeunit','angleestimate','angleprotractor']),
 route('EX','angle-relate','线和线怎样相遇',['lineorientation','linemark','linenotation']),
 route('EY','angle-relate','角拼成一圈',['angleadd','anglearound','anglecross']),
 route('EZ','angle-relate','藏起来的角',['rectanglefacts','anglechain','parallelangle']),
 route('FA','angle-build','从三角形扩展开',['triangleangles','polygonangles','shapefacts']),
 route('FB','angle-build','能围出几个三角形',['triangledraw','trianglecongruent','trianglepossible'])
];
const q=(label,value)=>({label,value}),ch=(label,value,options)=>({label,value,options}),clone=x=>structuredClone(x);
const turn=(prompt,targets,questions=[],extra={})=>({type:'x-g25-turn',prompt,targets,questions,...extra});
const compare=(prompt,angles,kind,questions=[],extra={})=>({type:'x-g25-compare',prompt,angles,kind,questions,requireTest:true,...extra});
const vertices=(prompt,points,kind,questions=[])=>({type:'x-g25-vertices',prompt,points,kind,questions});
const estimate=(prompt,amount,tolerance,questions=[])=>({type:'x-g25-estimate',prompt,amount,tolerance,questions});
const protractor=(prompt,mode,amount,questions=[])=>({type:'x-g25-protractor',prompt,mode,amount,questions});
const polygon=(prompt,n,questions=[])=>({type:'x-g25-polygon',prompt,n,questions});
const corners=(prompt,a,b,questions=[])=>({type:'x-g25-corners',prompt,a,b,questions});
const triangle=(prompt,mode,target,chooseCount,questions=[])=>({type:'x-g25-triangle',prompt,mode,target,chooseCount,questions});
const parallel=(prompt,questions=[])=>({type:'x-g25-parallel',prompt,questions});
const line=(prompt,shape,required,rotation,questions=[])=>({type:'x-s23-lines',prompt,shape,required,rotation,questions});
const walk=(prompt,ops,questions=[],extra={})=>({type:'x-p24-walk',prompt,ops,start:[2,2,0],allowBack:true,questions,...extra});
const rect=(prompt,w,h,questions=[])=>({...clone(old23.shapemeasures[1]),prompt,target:[w,h],questions});
const triangle0=[[0,0],[6,0],[1,1]],rhombus=[[0,0],[5,0],[6,3],[1,3]],rectangle=[[0,0],[5,0],[5,3],[0,3]],tiltedRectangle=[[0,0],[2.4,1.8],[1.32,3.24],[-1.08,1.44]];
export const TASKS={
 turnroute:[
  walk('先向前走一步，再倒退一步。箭头的朝向会变吗？',['F','B'],[ch('回到原处时朝向','same',[['same','和开始一样'],['turn','转了半圈']])]),
  walk('原地向右转两次，每次四分之一圈。',['R','R'],[q('相当于转过多少度',180)]),
  walk('向前，右转再向前，左转后继续向前。',['F','R','F','L','F'],[ch('转弯时位置','same',[['same','不变，只改变朝向'],['move','一定向前走']])]),
  walk('原地连续向右转四次，每次四分之一圈。',['R','R','R','R'],[q('一共转过多少度',360)])],
 anglecorner:[
  turn('做出60°的开口。把橙色边换长，再记一次。',[60],[ch('边长变了，开口','same',[['same','没有变'],['larger','一定变大']])],{compareLengths:true}),
  turn('从绿色边转四分之一圈，再继续转到半圈。',[90,180],[ch('半圈比四分之一圈','larger',[['larger','开口更大'],['same','一样大']])]),
  vertices('在长方形的四个角中，标出所有直角。',rectangle,'right',[q('一共有几个直角',4)])],
 angleparts:[
  turn('两条边从同一点出发，试着转出45°。',[45],[ch('两条边的共同起点','vertex',[['vertex','是角的顶点'],['tip','是橙色边的末端']])]),
  clone(old23.geometrynotation[0]),
  turn('换成120°，再让边变长。比较的是开口还是边长？',[120],[ch('角的大小看','opening',[['opening','两条边的开口'],['length','边画得有多长']])],{compareLengths:true})],
 rightcheck:[
  compare('把每个角叠到直角参照上，选出恰好一样大的角。',[50,90,130],'right',[q('直角是转过多少度',90)],{lengths:[3,1,2]}),
  vertices('这个图转斜后，找出仍然是直角的四个角。',tiltedRectangle,'right',[q('长方形有几个直角',4)]),
  turn('每次转四分之一圈，记下直到回到起点。',[90,180,270,360],[q('一圈有几个直角',4),q('半圈有几个直角',2)])],
 angletypes:[
  compare('叠放后，选出比直角小的开口。',[35,90,125,65],'acute',[ch('比直角小的角叫','acute',[['acute','锐角'],['obtuse','钝角']])],{lengths:[3,1,1,2]}),
  compare('把四个开口从小到大排列。边的长短不同，要看开口。',[120,35,90,65],null,[q('最接近直角的是多少度',90)],{order:true,lengths:[1,3,2,3]}),
  vertices('标出这个三角形里比直角大的角。',triangle0,'obtuse',[q('这个三角形中有几个钝角',1)]),
  vertices('在这个倾斜的四边形里标出所有比直角小的角。',rhombus,'acute',[q('有几个锐角',2)]),
  vertices('在同一个四边形里标出所有比直角大的角。',rhombus,'obtuse',[q('有几个钝角',2)])],
 anglestraight:[
  turn('先转半圈，再转完整一圈。',[180,360],[q('半圈是多少度',180),q('一整圈是多少度',360)]),
  compare('叠放这些开口，选出大于半圈但不到一整圈的那个。',[45,90,180,270],'reflex',[ch('这样的开口叫','reflex',[['reflex','优角'],['straight','平角']])]),
  turn('像钟面一样，从右边转到下方：试转四分之三圈。',[270],[ch('同两条边之间的较小开口','small',[['small','比半圈小'],['large','比半圈大']])])],
 degreeunit:[
  turn('转四分之一圈，再转一整圈。',[90,360],[q('一整圈分成多少个一度',360),q('四分之一圈是多少度',90)]),
  turn('让橙色边转45°，看看相当于多少个一度。',[45],[q('45°包含几个一度',45)]),
  turn('把边从短变长，开口保持90°。',[90],[ch('度数有没有变','same',[['same','没有，仍是90°'],['long','边越长度数越大']])],{compareLengths:true})],
 angleestimate:[
  estimate('先和直角比较：这个开口大约是多少度？',130,15,[ch('它与直角相比','more',[['more','比直角大'],['less','比直角小']])]),
  estimate('先和半圈、一整圈比较，再估这个开口。',270,20,[ch('这个开口','reflex',[['reflex','大于半圈而小于一圈'],['acute','小于直角']])]),
  compare('先观察，再叠放比较，按开口从小到大排列。',[135,40,100,70],null,[],{order:true,lengths:[1,3,2,1]})],
 angleprotractor:[
  protractor('移动量角器，让中心和0°线对准，再读橙色边。','measure',47,[q('这个角是多少度',47)]),
  protractor('把量角器对准，画出135°的开口。','draw',135,[q('画出的角是多少度',135)]),
  protractor('这个角比直角大。对准量角器，从正确的0°方向读数。','measure',130,[q('这个角是多少度',130),ch('读到50°时','recheck',[['recheck','与开口不符，要检查另一排刻度'],['accept','一定是对的']])])],
 lineorientation:[
  line('把两条斜着的边延长，找一组平行边。','parallelogram',['parallel'],25,[ch('平行边','parallel',[['parallel','延长后不会相交'],['same','必须一样长']])]),
  line('这个三角形转斜了，找出两条相互垂直的边。','righttriangle',['perpendicular'],25,[ch('垂直线','right',[['right','相交成直角'],['parallel','延长也不相交']])]),
  line('在同一个长方形上，分别找到平行边和垂直边。','rectangle',['parallel','perpendicular'],20,[ch('同一幅图','both',[['both','可以同时有平行和垂直关系'],['one','只能有一种关系']])]),
  line('找到长方形里一条水平边和一条竖直边，比较它们。','rectangle',['perpendicular'],0,[ch('水平边与竖直边','right',[['right','相交处是直角'],['parallel','永远不相交']])])],
 linemark:[
  clone(old23.geometrynotation[0]),
  line('延长梯形的边，找一组平行边。','trapezoid',['parallel'],30,[ch('线段和射线','ends',[['ends','线段有两个端点，射线有一个端点'],['same','两者没有端点']])]),
  vertices('在这个三角形中，标出比直角大的角。',triangle0,'obtuse',[ch('这个角的顶点','meeting',[['meeting','是两条边相遇的位置'],['end','是另一条边的末端']])])],
 linenotation:[
  vertices('给长方形的四个直角做标记。',rectangle,'right',[ch('角上的小方框表示','right',[['right','这个角是直角'],['edge','这一边长1']])]),
  clone(old23.geometrynotation[0]),
  {type:'x-g25-ticks',prompt:'给两组等长的对边画刻痕：一组画一条，另一组画两条。',questions:[ch('两条边有相同刻痕','equal',[['equal','标出的这两条边等长'],['angle','它们一定互相垂直']])]}],
 angleadd:[
  turn('先记下65°，再记下半圈。两部分合起来是180°。',[65,180],[q('65°旁边还差多少度才成半圈',115)]),
  turn('先记35°，再记75°。从35°到75°之间转了多少？',[35,75],[q('中间的一份是多少度',40),q('两份合起来是多少度',75)]),
  turn('一圈里已有120°和90°。记下它们合起来的210°，再转满一圈。',[210,360],[q('还缺多少度',150)])],
 anglearound:[
  turn('先记半圈，再记一整圈。',[180,360],[q('一条直线的一侧总共多少度',180),q('一点周围一整圈多少度',360)]),
  turn('把两条线交叉。试一试60°和120°，看对面的开口。',[60,120],[q('当前开口120°，对面的开口多少度',120),q('相邻且合成直线的开口多少度',60)],{scene:'cross'}),
  turn('从四分之三圈继续转到一整圈。',[270,360],[q('四分之三圈是多少度',270)])],
 anglecross:[
  turn('让两条线交叉，先试60°，再试100°。',[60,100],[q('当前100°，对面的角是多少度',100),q('旁边的角是多少度',80),q('一点周围四个角合计多少度',360)],{scene:'cross'}),
  turn('把交叉的开口改成65°，看对面和旁边。',[65],[q('对面的角',65),q('旁边合成直线的角',115)],{scene:'cross'}),
  turn('改变交叉的角到120°。',[120],[ch('对面与旁边','different',[['different','对面相等；旁边合起来180°'],['same','四个角一定都相等']])],{scene:'cross'})],
 rectanglefacts:[
  rect('一边8厘米，周长28厘米。先想另一边，再画出长方形。',8,6,[q('另一边多少厘米',6)]),
  rect('画长7厘米、宽3厘米的长方形，看看每个角。',7,3,[q('每个角多少度',90)]),
  rect('一边6厘米，面积24平方厘米。先找另一边，再画出来。',6,4,[q('另一边多少厘米',4),q('周长多少厘米',20)])],
 anglechain:[
  turn('两条线相交。已知一个角65°，先看旁边，再看对面。',[65],[q('先用直线找到旁边的角',115),q('再用对顶角找到65°对面的角',65)],{scene:'cross'}),
  turn('让一个角变成115°。用两条关系找其他角。',[115],[q('相邻角是多少度',65),q('对面的角是多少度',115)],{scene:'cross'}),
  turn('两条线相交，其中一个角45°。',[45],[q('它的邻角是多少度',135),ch('得到对面的45°用到','opposite',[['opposite','对顶角相等'],['sum','任意两角相加为180°']])],{scene:'cross'})],
 parallelangle:[
  parallel('已知角A是70°。把上面一组角移到下面，找同一位置。',[q('角E是多少度',70),ch('A与E','correspond',[['correspond','是同位角'],['neighbor','是同一个交点的邻角']])]),
  parallel('把一组角移过去。角C与角E在两条平行线之间、斜线两侧。',[ch('C与E的关系','alternate',[['alternate','内错角，相等'],['supplement','总和一定是180°']])]),
  parallel('已知角A是70°。先找同位角，再看同旁内角。',[q('角C是多少度',70),q('角F是多少度',110),q('角C和F合计多少度',180)])],
 triangleangles:[
  corners('把三角形的三个角搬到一条直线上。',50,60,[q('三个角合起来是多少度',180),q('已知两个角是50°和60°，第三个角是多少度',70)]),
  polygon('从一个顶点连线，把四边形分成三角形。',4,[q('分成几个三角形',2),q('四个内角合计多少度',360)]),
  polygon('把正六边形分成三角形，再找每个一样大的内角。',6,[q('分成几个三角形',4),q('内角和是多少度',720),q('每个内角是多少度',120)])],
 polygonangles:[
  corners('换一个三角形，再把三个角搬到一条直线上。',35,80,[q('三个角合计多少度',180),q('第三个角是多少度',65)]),
  polygon('从一个顶点把六边形分成三角形。',6,[q('有几个三角形',4),q('内角和是多少度',720)]),
  polygon('把正五边形分开，再算每个内角和外角。',5,[q('每个内角是多少度',108),q('每个外角是多少度',72),q('五个外角合计多少度',360)])],
 shapefacts:[
  clone(old23.quadhierarchy[2]),
  clone(old23.quadsort[0]),
  {...clone(old23.circleparts[0]),prompt:'画一个半径4.5厘米的圆，再画直径与圆周。',questions:[q('直径多少厘米',9),ch('圆周长与直径','pi',[['pi','圆周长等于直径乘π'],['twice','圆周长等于直径乘2']])]}],
 triangledraw:[
  triangle('先画7厘米底边，再从A点画5厘米的边，夹角40°；找出第三个顶点。','sas',{base:7,a:5,angle:40},1,[q('夹角多少度',40)]),
  triangle('底边6厘米；从A、B分别画半径5、4厘米的圆弧，找交点。','sss',{base:6,a:5,b:4},1,[q('两圆交点到A的距离',5),q('到B的距离',4)]),
  triangle('底边7厘米，两端的角分别是50°和60°。放出射线并找交点。','asa',{base:7,angle:50,other:60},1,[q('第三个角是多少度',70)])],
 trianglecongruent:[
  triangle('两边分别是7、5厘米，它们之间的角是40°。画出三角形。','sas',{base:7,a:5,angle:40},1,[ch('两边和夹角','sas',[['sas','可以确定一个三角形形状'],['ssa','总会有两个不同形状']])]),
  triangle('三条边分别是6、5、4厘米。用圆弧找一个交点。','sss',{base:6,a:5,b:4},1,[ch('三条边对应相等的两个三角形','congruent',[['congruent','全等，可通过移动或翻面重合'],['different','一定不同']])]),
  triangle('底边7厘米，两端的角是50°和60°。','asa',{base:7,angle:50,other:60},1,[q('第三个角是多少度',70),ch('△ABC与△DEF对应时','order',[['order','A对应D，B对应E，C对应F'],['reverse','A一定对应F']])]),
  triangle('两条直角边分别是6厘米和4厘米。','sas',{base:6,a:4,angle:90},1,[ch('这是一种','right',[['right','两直角边确定的直角三角形'],['oblique','没有直角的三角形']])]),
  triangle('AB是7厘米，BC是5厘米，角A是40°。试两个交点。','ssa',{base:7,b:5,angle:40},2,[ch('两边和非夹角','ambiguous',[['ambiguous','可能形成两个不同三角形'],['always','总能唯一确定']])])],
 trianglepossible:[
  triangle('底边8厘米；两段圆弧半径分别是3、4厘米。找交点。','sss',{base:8,a:3,b:4},0,[q('能围成几个三角形',0)]),
  triangle('底边7厘米，圆弧半径3和4厘米。交点如果落在底边上，会怎样？','sss',{base:7,a:3,b:4},0,[ch('两圆只在底边上相碰','flat',[['flat','三条边排成直线，不能围成三角形'],['triangle','已经围成一个三角形']])]),
  triangle('底边7厘米，圆弧半径3和5厘米。找一个有效交点。','sss',{base:7,a:3,b:5},1,[q('不计翻面，有几种不同形状',1)]),
  {type:'x-g25-similar',prompt:'两块三角形的角都是50°、60°、70°。把第二块变成两倍大小。',questions:[ch('三个角都相同','many',[['many','可以有大小不同的许多三角形'],['one','一定大小相同']])]},
  triangle('AB是7厘米，BC是5厘米，角A是40°。找两个能围成的交点。','ssa',{base:7,b:5,angle:40},2,[q('找到几种不同形状',2)]),
  triangle('仍用7厘米、5厘米和40°，这次让40°夹在两条已知边之间。','sas',{base:7,a:5,angle:40},1,[q('不计翻面，有几种不同形状',1)]),
  turn('把三个开口100°、50°和40°依次合起来。',[100,150,190],[q('三个角合计多少度',190),ch('这样的三个角','none',[['none','不能组成三角形：超过180°'],['one','可以组成一个三角形']])])]
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,ts])=>[id,clone(ts.at(-1))]));
// Joint activities are added only after checking real directed source edges.
export const BRIDGES=[];
import {TASKS as old24} from './b24.js';
const link=(from,to,title,summary,a,b)=>BRIDGES.push({from,to,title,summary,tasks:[clone(a),clone(b)],phase:5,batch:'B25'});
link('turnroute','turnwalk','先转半圈，再看终点','半圈会改变朝向，但转弯本身不让位置移动。',TASKS.turnroute[1],old24.turnwalk[3]);
link('turnwalk','anglecorner','转弯变成一个开口','把四分之一转画在同一个顶点，就能看到直角开口。',old24.turnwalk[0],TASKS.anglecorner[1]);
link('anglecorner','rightcheck','转出的开口，拿来作参照','先转出直角，再用同一个开口比较其他角。',turn('先转四分之一圈，记下90°。',[90],[q('转了多少度',90)]),TASKS.rightcheck[0]);
link('rightcheck','angletypes','直角两侧的开口','先找恰好是直角的，再找比它小的开口。',TASKS.rightcheck[0],TASKS.angletypes[0]);
link('rightcheck','lineorientation','直角怎样认出垂线','先比较直角，再检查转斜的两条边是否垂直。',TASKS.rightcheck[0],TASKS.lineorientation[1]);
link('lineorientation','linemark','平行线走进图形','把两组边延长比较，再在梯形里找平行边。',TASKS.lineorientation[0],TASKS.linemark[1]);
link('degreeunit','angleprotractor','一度一度，读出开口','先转出45个一度，再把量角器对准并读45°。',TASKS.degreeunit[1],protractor('把量角器对准，读出刚才的45°。','measure',45,[q('这个角是多少度',45)]));
link('anglestraight','angleestimate','借半圈估更大的开口','先转三分之四圈，再不看度数估一个同样大的开口。',TASKS.anglestraight[2],TASKS.angleestimate[1]);
link('anglearound','angleadd','半圈拆成两份','先看半圈，再把180°分成65°和剩下的一份。',TASKS.anglearound[0],TASKS.angleadd[0]);
link('angleadd','anglecross','一条直线上的两个角','先找65°旁边的115°，再把两条线交叉看对面。',TASKS.angleadd[0],TASKS.anglecross[1]);
link('anglecross','anglechain','交叉后连续找角','用同一个65°先找对面和邻角，再按顺序说出下一步。',TASKS.anglecross[1],TASKS.anglechain[0]);
link('anglechain','parallelangle','把交叉点搬到另一条线上','先看70°交叉时对面与邻角，再沿截线平移一组角。',turn('先让两条线交叉成70°，找对面和旁边。',[70],[q('对面的角',70),q('旁边合成直线的角',110)],{scene:'cross'}),TASKS.parallelangle[0]);
link('anglearound','triangleangles','三个角合成半圈','先转出半圈，再把三角形的三个角搬到一起。',turn('先记下半圈。',[180],[q('半圈多少度',180)]),TASKS.triangleangles[0]);
link('triangleangles','polygonangles','一个三角形，扩展成六边形','先把三个角合成半圈，再用三角形拆开六边形。',TASKS.triangleangles[0],TASKS.polygonangles[1]);
link('angleprotractor','angleadd','量出一份，找另一份','先量出47°，再看它和哪一份合起来是半圈。',TASKS.angleprotractor[0],turn('记下47°与半圈180°，找中间还差多少。',[47,180],[q('还差多少度',133)]));
link('angleprotractor','triangledraw','把角度放进三角形','先对准量角器画40°，再用40°和两条边构造三角形。',protractor('把量角器对准，画出40°的开口。','draw',40,[q('画出的角',40)]),TASKS.triangledraw[0]);
link('triangledraw','trianglepossible','同样画圆弧，为什么有时围不起来','先用6、5、4厘米围成三角形，再试7、3、4厘米。',TASKS.triangledraw[1],TASKS.trianglepossible[1]);
link('trianglepossible','trianglecongruent','非夹角与夹角的不同','同样是7厘米、5厘米和40°，比较非夹角与夹角。',TASKS.trianglepossible[4],TASKS.trianglecongruent[0]);
link('quadsort','rectanglefacts','图形家族与缺少的边','先检查正方形与长方形的关系，再用长方形的对边关系找长度。',old23.quadsort[0],TASKS.rectanglefacts[0]);
