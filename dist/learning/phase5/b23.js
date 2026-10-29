import{scenario,regular}from'./b23-geometry.js';
const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B23'});
export const LESSONS={
 shapehello:item('mt_KJeEeTutJI','转一转，还是它吗','平面图形的辨认','三角形由三条直边围成，圆没有直边和顶点。长方形有四个直角；正方形满足这些条件，还四边等长。大小、颜色和朝向不会改变这些性质。','尖尖朝下，为什么还是三角形？'),
 shapeframe:item('mt_2VR963szuk','用点和线搭一个形状','图形的构造与立体框架','直边连接成闭合图形。正方体框架有8个顶点、12条棱、6个正方形面；屏幕上的框架是立体模型，不等于实物操作。','只搭出一个正方形，为什么还不是一个盒子？'),
 shapepieces:item('mt_XjwUlmxdCT','小块能拼成什么','图形的组合','转动和移动平面小块，能组成新图形。拼好时小块既不重叠，也不在轮廓里留下空隙。','相同的三角形转一转，能拼出什么？'),
 sidesfold:item('mt_sBcRdUfAzV','边数和折痕告诉了什么','边、顶点与轴对称','数边时每条只数一次。沿一条对称线反射后，图形与原来完全重合；面积一样不够。','长方形对角线分成两半，折起来一定重合吗？'),
 shapemerge:item('mt_MqqR7VUoz1','一整个还可以拆成什么','平面图形的组合与分解','同一个图形可以由不同小块组成。半圆、四分之一圆指的是同一个圆被平均分开的部分。','两块三角形拼好后，原来的接缝还在哪里？'),
 shapeidentity:item('mt_bfhng6mOuy','什么变了，名字不变','图形的定义性特征','三角形必须封闭且有三条直边；转动、放大、换颜色不会改变这一点。没有闭合的三条线不是三角形。','一个图形看起来像，怎样检查它确实是？'),
 shapedraw:item('mt_vJUa62bxeR','画一画，再转过来','平面与立体图形的构造','平面多边形由互不交叉的直边围成；立体有面、棱和顶点。把立体转动，朝向改变但形状不变。','只看一个角度，能看见立体的全部吗？'),
 shapesides:item('mt_zuOGOGFAKb','数清边，自己画出来','按边和顶点辨认多边形','五边形有五条直边和五个顶点；六边形有六条边和六个角。正的与不规则的五边形都是五边形。','五条边长得不一样，还是五边形吗？'),
 shapeaxes:item('mt_hRZyKvz1KN','折过去，真的重合吗','轴对称与对称轴','反射后与原形完全重合的直线是对称轴。非正方形长方形有2条、正方形4条、正六边形6条；转动后对称轴也随之转动。','一条线把面积平分，就一定是对称轴吗？'),
 quadsort:item('mt_Xt1cRqaBOW','一个图形能属于几家','四边形的包含关系','正方形有四个直角，因此也是长方形；它四边相等且对边平行，因此也是菱形和平行四边形。长方形未必四边相等。','为什么正方形既能放进长方形，也能放进菱形？'),
 lineproperties:item('mt_r8c43QB6wx','两条边怎样相遇','平行与垂直','同一平面内不相交的直线平行；两条直线形成直角时垂直。一个图形可以同时具有平行和垂直的边。','线段长短不同，还能平行吗？'),
 regularity:item('mt_8H2kO4k2B9','边一样长就够了吗','正多边形与不规则多边形','正多边形必须所有边相等、所有内角也相等。菱形边相等但角未必相等；非正方形长方形角相等但边未必全相等。','只通过一项检查，能叫正多边形吗？'),
 shapemeasures:item('mt_hdrMoiTgqu','带着尺寸来画','指定长度和角度的图形构造','两边和夹角能确定一组三角形形状；长方形需四个直角，正五边形边和角都相等。屏幕生成的图形不评估真实尺子和量角器操作。','闭合的三角形，尺寸就一定画对了吗？'),
 quadhierarchy:item('mt_liIW336odh','四边形的家族关系','平行四边形、长方形、菱形和正方形','正方形是长方形，也是菱形；长方形和菱形都是平行四边形。包含关系不能反过来说成每个长方形都是正方形。','满足更多条件，是多了谁的身份？'),
 shapeuses:item('mt_mN4Ye_vtR7','为什么这个形状适合这里','立体形状与用途','圆柱有曲面和两个平面端，放倒可滚、立起便于叠放；长方体平面可对齐铺排。真实使用还要考虑材料、尺寸和其他条件。','同一个物体换个摆法，能做的事会变化吗？'),
 shapeapprox:item('mt_SK7WntVZ6y','用熟悉的小形状画世界','用图形近似表示物体','复杂对象可用几个熟悉的平面或立体形状近似：房屋可以看作长方体加三棱柱屋顶。近似保留想强调的结构，不等同于实物。','画出主要形状，哪些细节暂时可以不画？'),
 circleparts:item('mt_xq3YHZ2zeR','圆心到边缘有多远','圆心、半径、直径与周长','半径从圆心到圆上；直径经过圆心连接圆上两点，长度是半径的两倍。圆周是围绕圆的整条曲线。','转一转直径，长度会变吗？'),
 geometrynotation:item('mt_WtIFJSCQIT','给图上的关系起名字','线段、角、平行与垂直的几何记号','线段可用两个端点命名；∠ABC的顶点在中间字母B。∥表示平行，⊥表示垂直。转动整个图形不改变关系。','角的三个字母里，哪一个告诉我们顶点？'),
 compasswork:item('mt_ZrsqGVG-Wt','两段圆弧会在哪里相遇','圆规与直尺构造','以两端为圆心用相同半径画相交圆弧，交点到两端等距；连交点得到垂直平分线。相同方法可分角或作垂线。屏幕操作不等于实物尺规技巧。','为什么换小一点的圆规，两段弧可能碰不到？'),
};
export const SECTIONS=[{id:'shape-look',title:'看边和角'},{id:'shape-build',title:'拼合与转动'},{id:'shape-discover',title:'折叠与构造'}];
const route=(id,section,title,ids)=>({id,section,title,ids,packIds:['shapes'],themeId:'space',color:'#9a7b9b'});
export const ROUTES=[route('ED','shape-look','变个样，还是这个形状',['shapehello','shapeidentity']),route('EE','shape-look','数边和顶点',['sidesfold','shapesides']),route('EF','shape-look','四边形能属于几家',['quadsort','lineproperties','regularity']),route('EG','shape-build','用点、线搭起形状',['shapeframe','shapedraw']),route('EH','shape-build','转动小块，拼出新形状',['shapepieces','shapemerge']),route('EI','shape-build','熟悉的形状，能用在哪里',['shapeuses','shapeapprox']),route('EJ','shape-discover','折叠与图形家族',['shapeaxes','quadhierarchy']),route('EK','shape-discover','圆上的线和图形语言',['circleparts','geometrynotation']),route('EL','shape-discover','带着尺寸画，再用圆弧找点',['shapemeasures','compasswork'])];
const q=(label,value,options)=>({label,value,...(options?{options}:{})}),ch=(label,value,options)=>q(label,value,options);
const tri=scenario('triangle'),right=scenario('righttriangle'),rect=scenario('rectangle'),square=scenario('square'),hex=scenario('hexagon'),pent=scenario('pentagon');
const poly=(name,angle=0)=>({kind:'polygon',points:scenario(name,angle)}),open={kind:'open',points:tri},round={kind:'circle'},mix=[poly('triangle',130),poly('rectangle',20),round,poly('righttriangle',30),poly('square',45),open,poly('pentagon',12),poly('hexagon',25)];
const pick=(prompt,cards,want,extra={})=>({type:'x-s23-pick',prompt,cards,want,questions:[],...extra});
const draw=(prompt,n,extra={})=>({type:'x-s23-polygon',prompt,n,kind:'any',questions:[],...extra});
const frame=(prompt,extra={})=>({type:'x-s23-frame',prompt,mode:'build',solid:'cube',questions:[],...extra});
const tile=(prompt,pattern,extra={})=>({type:'x-s23-tile',prompt,pattern,slots:pattern==='rect'?2:pattern==='hex'?6:pattern==='halves'?2:4,questions:[],...extra});
const side=(prompt,shape,extra={})=>({type:'x-s23-sides',prompt,shape,rotation:0,questions:[],...extra});
const sym=(prompt,shape,extra={})=>({type:'x-s23-symmetry',prompt,shape,rotation:0,candidates:[0,30,45,60,90,120,135,150],questions:[],...extra});
const quad=(prompt,shape,extra={})=>({type:'x-s23-quad',prompt,shape,rotation:0,questions:[],...extra});
const lines=(prompt,shape,required,extra={})=>({type:'x-s23-lines',prompt,shape,rotation:0,required,questions:[],...extra});
const ruler=(prompt,mode,target,extra={})=>({type:'x-s23-ruler',prompt,mode,target,questions:[],...extra});
const objects=(prompt,allowed,required,extra={})=>({type:'x-s23-objects',prompt,allowed,required,questions:[],...extra});
const scene=(prompt,sceneType,slots,extra={})=>({type:'x-s23-scene',prompt,sceneType,slots,questions:[],...extra});
const circle=(prompt,radius,extra={})=>({type:'x-s23-circle',prompt,radius,questions:[],...extra});
const compass=(prompt,mode,extra={})=>({type:'x-s23-compass',prompt,mode,questions:[],...extra});
const frameQ=[q('这个框架有几个连接点',8),q('一共几根边',12),q('若装上外面，每面是正方形，共几个面',6)];
const symReason=ch('怎样判断一条线是不是对称线','match',[['match','反射后整个图形完全重合'],['area','两边面积一样就一定可以']]);
export const TASKS={
 shapehello:[pick('看看这一组图形：把所有三条直边围成的图形圈出来。',mix,'triangle',{questions:[ch('没有直边和角的是','circle',[['circle','圆'],['triangle','三角形']]),ch('图中有四个直角的图形可以是','rectsquare',[['rectsquare','长方形和正方形'],['triangle','三角形']]),ch('四角是直角、四边也相等','square',[['square','正方形，也属于长方形'],['other','只有倾斜时才叫正方形']])]}),pick('三角形换个大小和朝向后，哪些仍满足三条直边围成？',[poly('triangle',0),poly('triangle',165),poly('righttriangle',65),poly('rectangle'),open],'triangle',{questions:[ch('改变方向后','same',[['same','只要三条直边闭合，还是三角形'],['different','尖朝下就变了']])]}),draw('自己选三个点，连成一圈，再看它是否有三条直边。',3,{questions:[q('搭成几条边',3)]})],
 shapeframe:[draw('把三个点连成一圈，像用三根小棒搭起一个三角形。',3,{questions:[q('用了几个点',3),q('用了几条边',3)]}),draw('在点阵上画一个有四个直角的长方形。正方形也是一种长方形。',4,{kind:'rectangle',questions:[q('一共有几个直角',4)]}),frame('先搭8个连接点之间的12根边；转一转，看看背后的边。',{questions:frameQ})],
 shapepieces:[tile('把两块相同的直角三角形转一转，铺满长方形轮廓。','rect',{questions:[q('用了几块三角形',2)]}),tile('六块相同的三角形围在一起，铺满一个六边形。','hex',{questions:[q('六边形的外边有几条',6)]}),scene('用矩形、三角形和斜坡拼一个简化游乐滑梯。','slide',['rectangle','triangle','slope'],{questions:[ch('拼图中的形状','parts',[['parts','分别表示平台、支撑与滑面'],['one','它们是一整块没有组成部分']]) ]})],
 sidesfold:[side('沿边一条条点亮，数一数这个倾斜图形有几条边。','pentagon',{rotation:24,questions:[q('边的数量',5),q('角的数量',5)]}),sym('试不同的折线，看看长方形从左到右折过去能否完全重合。','rectangle',{candidates:[0,45,90,135],questions:[symReason,q('一共找到几条对称线',2)]}),pick('圈出所有四条直边围成的形状，再用边数和角描述它们。',mix,'quadrilateral',{questions:[ch('长方形和正方形的共同点','four',[['four','都有四条边和四个直角'],['different','一边是曲线']]) ]})],
 shapemerge:[tile('把两块相同三角形拼成一个长方形。接缝会留在里面。','rect',{questions:[q('拼入几块',2)]}),tile('把四块相同的四分之一圆转动后合成一个圆。','quarters',{questions:[q('几块相同的四分之一圆组成整圆',4)]}),tile('把两个半圆拼成整圆，再观察里面的分界线。','halves',{questions:[q('整圆可以拆成几个半圆',2),ch('内部接缝','seam',[['seam','是两个部分相接的地方，不是外边界'],['outside','是整个圆的外周']]) ]}),tile('先把两个半圆拼成整圆，再拿出一块，观察整圆拆成了哪些部分。','halves',{decompose:true,questions:[q('整圆可以拆成几个半圆',2)]})],
 shapeidentity:[draw('自己搭一个闭合的三边形，边不能交叉。',3,{questions:[ch('三角形需要','closed',[['closed','三条直边首尾连接'],['open','三条线分开放着就可以']])]}),pick('圈出所有三角形：有的被转斜、有的很扁。',[poly('triangle',0),poly('triangle',120),poly('righttriangle',150),poly('square',45)],'triangle',{questions:[ch('转动、变大或换颜色','same',[['same','不改变直边数和是否闭合'],['shape','一定变成其他种类']])]}),pick('这几组线看起来都尖尖的。只圈出真正封闭的三角形。',[open,poly('righttriangle'),{kind:'curve',points:tri},poly('triangle')],'triangle',{questions:[ch('有一边弯曲或没闭合','no',[['no','不符合三条直边闭合'],['yes','尖尖的都算']]) ]})],
 shapedraw:[draw('画一个闭合的三角形。',3,{questions:[q('边数',3)]}),draw('画一个长方形，四个角都要是直角。',4,{kind:'rectangle',questions:[q('角数',4)]}),draw('画一个五边形，边可以不一样长。',5,{questions:[q('边数',5)]}),draw('画一个六边形，不要求边一样长。',6,{questions:[q('边数',6)]}),frame('搭一个正方体的12条棱，再转动查看。',{questions:frameQ}),frame('转动这个四棱锥，从另一个方向看，再认出它。',{mode:'view',solid:'pyramid',questions:[ch('转动后仍是','pyramid',[['pyramid','四棱锥：一个方形底和四个三角形侧面'],['cube','正方体']]) ]})],
 shapesides:[draw('在点阵上画一个五边形，边可以不一样长。',5,{questions:[q('顶点数',5)]}),pick('圈出所有由四条直边围成的图形。',mix,'quadrilateral',{questions:[q('每个四边形都有几条边',4)]}),draw('按顺序连接六个点，画一个正六边形。',6,{preset:true,kind:'regular',questions:[q('有几条边',6),q('有几个角',6)]})],
 shapeaxes:[sym('试每个候选折线：普通长方形有几条真的能折合？','rectangle',{candidates:[0,45,90,135],questions:[q('对称线有几条',2),symReason]}),sym('正方形除了穿过中间的横线和竖线，对角线能否折合？','square',{candidates:[0,45,90,135],questions:[q('对称线有几条',4)]}),sym('等边三角形转了一下，试着找齐所有能折合的线。','equilateral',{candidates:[0,30,60,90,120,150],questions:[q('对称线有几条',3)]}),sym('正六边形找齐所有对称线。','hexagon',{candidates:[0,30,60,90,120,150],questions:[q('对称线有几条',6)]}),sym('整个长方形转斜30°后，折线也要跟着转。','rectangle',{rotation:30,candidates:[0,30,60,90,120,150],questions:[q('对称线有几条',2)]}),sym('这个三角形能找到几条折合线？试一试。','isosceles',{candidates:[0,45,90,135],questions:[q('对称线有几条',1)]}),sym('这个三角形三边都不同。试试这些折线，如果都不能折合就留下“没有”。','triangle',{candidates:[0,30,45,60,90,120,135,150],questions:[q('对称线有几条',0)]})],
 quadsort:[quad('检查这个正方形：它还能属于哪些家族？','square',{rotation:30,questions:[ch('正方形是不是长方形','yes',[['yes','是，它有四个直角'],['no','不是，因为它不够长']])]}),quad('再检查一个不等边的长方形，看看它和正方形的关系。','rectangle',{questions:[ch('每个长方形都是正方形吗','no',[['no','不是，还要看四边是否等长'],['yes','四角直角就必然四边相等']])]}),draw('画一个四边形，但让它既不是长方形，也不是菱形。',4,{kind:'otherquad',questions:[q('边数',4)]}),{type:'x-s23-nest',prompt:'把四个图形放进一层套一层的范围：四边形、长方形、正方形。',cards:[poly('square',25),poly('rectangle',15),poly('irregular'),poly('rhombus',20)],regions:[2,1,0,0],questions:[ch('正方形也在长方形范围里吗','yes',[['yes','是，正方形也有四个直角'],['no','不是']])]}],
 lineproperties:[lines('把两条边延长或检查方向，找出一组平行边。','parallelogram',['parallel'],{rotation:25,questions:[ch('平行边','parallel',[['parallel','方向相同；延长后不会相交'],['equal','长度必须相同']])]}),lines('这个三角形转斜了。找两条互相垂直的边。','righttriangle',['perpendicular'],{rotation:25,questions:[ch('互相垂直','right',[['right','相交成直角'],['parallel','延长也不相交']])]}),lines('同一个长方形，既找一组平行边，也找一组垂直边。','rectangle',['parallel','perpendicular'],{rotation:20,questions:[ch('一张图','both',[['both','可以同时有两种关系'],['one','只能二选一']]) ]})],
 regularity:[quad('先检查正五边形：五条边和五个角是否各自相等？','pentagon',{questions:[q('边有几条',5),ch('边和角','equal',[['equal','五条边相等，五个角也相等'],['sides','只需要边相等']])]}),quad('检查一个正方形：边与角是不是都一样？','square',{questions:[ch('能不能叫正多边形','yes',[['yes','边和角都相等'],['no','只能边相等']])]}),quad('再检查一个长方形：四个角相同，四条边都相同吗？','rectangle',{questions:[ch('非正方形的长方形','irregular',[['irregular','不是正多边形：不是四边都相等'],['regular','有四个直角就够']])]}),quad('换一个菱形：四条边相等，四个角都相等吗？','rhombus',{questions:[ch('这个菱形','irregular',[['irregular','不是正多边形：角不全相等'],['regular','只看边相等就够']]) ]})],
 shapemeasures:[ruler('画两条从同一点出发的边：5厘米、7厘米，夹角60°，再连成三角形。','triangle',[5,7,60],{questions:[q('夹角多少度',60)]}),ruler('设定长6厘米、宽4厘米，画一个四角是直角的长方形。','rectangle',[6,4],{questions:[q('四个角各是多少度',90)]}),ruler('设定边长4厘米、每个内角108°，画一个正五边形。','regular',[4,108],{questions:[q('共有几条边',5),q('每个内角多少度',108)]})],
 quadhierarchy:[quad('把正方形逐项检查，再放入所有符合的四边形家族。','square',{questions:[ch('每个正方形是长方形吗','yes',[['yes','是，四角都是直角'],['no','不是，外观不同']])]}),quad('检查非正方形长方形，再看它在哪些家族里。','rectangle',{questions:[ch('每个长方形都是正方形吗','no',[['no','不是，四边还不一定相等'],['yes','名字不同但条件完全一样']])]}),quad('检查一个倾斜的平行四边形，再找长方形和菱形都继承的条件。','parallelogram',{rotation:25,questions:[ch('长方形和菱形都具有','parallel',[['parallel','两组对边分别平行'],['right','四个角都必须是直角']]) ]})],
 shapeuses:[objects('把圆柱放倒试一试，再立起来叠放。','cylinder',['roll','stack'],{questions:[ch('圆柱的两个平面端','flat',[['flat','可以在平面上提供接触面'],['point','只有一个尖点']])]}),objects('选择长方体，在格子中并排放四个，再叠一层。','cuboid',['pack','stack'],{questions:[ch('为什么可以边对边排列','faces',[['faces','平面和相应直边可对齐'],['curve','所有面都弯曲']])]}),objects('选择有平面支撑的积木，试着叠在一起。','blocks',['stack'],{questions:[ch('为什么容易对齐','flat',[['flat','相接处有平面'],['point','只靠一个尖点']]) ]})],
 shapeapprox:[scene('用两个形状拼出房身和屋顶，做一间简化小屋。','house',['cuboid','roof'],{questions:[ch('小屋可以近似看作','parts',[['parts','长方体加三棱柱屋顶'],['sphere','一个完整的球']])]}),scene('用平台、支撑和斜面拼一架简化滑梯。','slide',['rectangle','triangle','slope'],{questions:[ch('拼好的图','approx',[['approx','是抓住主要结构的近似图'],['exact','就是现实中的全部细节']])]}),{type:'x-s23-pixels',prompt:'用方格近似覆盖叶子的轮廓，不需要把每一格都涂满。',questions:[ch('用格子画叶子','approx',[['approx','近似表示轮廓，可以保留误差'],['same','方格一定能精确变成曲线']])]}],
 circleparts:[circle('先画一个半径4.5厘米的圆，再画从圆心到边缘的线和穿过圆心的整条线。',4.5,{questions:[q('直径多少厘米',9),ch('圆周指','edge',[['edge','绕圆一整圈的边界'],['radius','圆心到边缘的线']])]}),circle('换一个半径3厘米的圆，把直径转斜再看长度。',3,{turn:true,questions:[q('直径多少厘米',6),ch('直径转向后','same',[['same','仍经过圆心，长度仍是两倍半径'],['different','只要转斜长度就变']])]}),circle('这次画半径2厘米的圆，从直径反推半径。',2,{questions:[q('直径多少厘米',4),q('直径的一半多少厘米',2)]})],
 geometrynotation:[{type:'x-s23-notation',prompt:'给图中的线段、以B为顶点的角、平行和垂直关系写出记号。',questions:[ch('∠ABC中间的字母B表示','vertex',[['vertex','角的顶点'],['side','一条完整的边']])]},sym('画一个正六边形的对称线，并观察转动60°后形状能否重合。','hexagon',{candidates:[0,30,60,90,120,150],turn:true,questions:[q('对称线有几条',6),q('最小正转多少度可重合',60)]}),lines('在倾斜的长方形中测试平行和垂直的边，给它们正确的关系。','rectangle',['parallel','perpendicular'],{rotation:25,questions:[ch('两种关系的记号','symbols',[['symbols','∥是平行，⊥是垂直'],['reverse','∥是垂直']]) ]}),draw('按顺序连接六个点，自己画一个正六边形，再找它的折线。',6,{preset:true,kind:'regular',questions:[q('边有几条',6)]})],
 compasswork:[compass('用两端为圆心画同样宽的圆弧，找出交点并连起来，得到中间的垂线。','bisector',{questions:[ch('为什么交点连线经过中间','equal',[['equal','交点到两端的距离相等'],['look','只因为看起来居中']])]}),compass('先从角的顶点画圆弧，得到两边上同样远的点；再画同宽的两段弧，连到角顶点。','angle',{questions:[q('90°被平分后每份多少度',45)]}),compass('线外有一点。先用圆弧找出线上两个点，再以它们为圆心画同宽圆弧，连出垂线。','perpendicular',{questions:[q('垂线与原线夹角多少度',90)]})],
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,ts])=>[id,{...ts.at(-1)}]));
export const BRIDGES=[];
import {TASKS as T02} from '../phase4/b02.js';
import {TASKS as T15} from './b15.js';
const link=(from,to,title,a,b)=>BRIDGES.push({from,to,title,summary:'把两次观察连起来，再检查图形的条件。',tasks:[structuredClone(a),structuredClone(b)],phase:5,batch:'B23'});
link('quadsort','regularity','家族关系，接到边和角都相等',TASKS.quadsort[0],TASKS.regularity[3]);
link('shapehello','shapeidentity','换个方向，怎样仍然认出来',TASKS.shapehello[1],TASKS.shapeidentity[2]);
link('regularity','shapemeasures','边和角的条件，用尺寸画出来',TASKS.regularity[0],TASKS.shapemeasures[2]);
link('quadhierarchy','structurebridge','平行关系转动后仍然保留',TASKS.quadhierarchy[2],T15.structurebridge[0]);
link('sidesfold','shapeaxes','试一条折线，再找齐所有折线',TASKS.sidesfold[1],TASKS.shapeaxes[1]);
link('regularity','quadhierarchy','正方形满足条件，也属于几个家族',TASKS.regularity[1],TASKS.quadhierarchy[0]);
link('lineproperties','quadhierarchy','平行和垂直，连到四边形家族',TASKS.lineproperties[0],TASKS.quadhierarchy[1]);
link('solids','shapeuses','面和曲面，影响怎样摆放',T02.solids[0],TASKS.shapeuses[0]);
link('shapehello','shapemerge','认出三角形，再拼成一个整体',TASKS.shapehello[1],TASKS.shapemerge[0]);
link('shapepieces','shapemerge','小块拼起来，也能再拆开',TASKS.shapepieces[0],TASKS.shapemerge[1]);
link('quadsort','lineproperties','四边形的边可以怎样相遇',TASKS.quadsort[0],TASKS.lineproperties[0]);
link('shapeidentity','sidesfold','先检查闭合，再逐条数边',TASKS.shapeidentity[2],TASKS.sidesfold[0]);
link('shapehello','sidesfold','认出形状，再找边和折线',TASKS.shapehello[0],TASKS.sidesfold[1]);
link('shapemerge','shapeapprox','小块组合成图，也能近似画物体',TASKS.shapemerge[0],TASKS.shapeapprox[1]);
link('solids','shapedraw','数立体的边，再搭一个框架',T02.solids[0],TASKS.shapedraw[4]);
link('sidesfold','shapedraw','数边之后，自己连接出图形',TASKS.sidesfold[0],TASKS.shapedraw[2]);
link('shapedraw','nets','立体框架和可以折起的平面',TASKS.shapedraw[4],T02.nets[0]);
link('regularity','geometrynotation','规则六边形也有转动和折叠关系',TASKS.regularity[0],TASKS.geometrynotation[1]);
link('quadhierarchy','geometrynotation','图形家族里的平行垂直可以写下来',TASKS.quadhierarchy[0],TASKS.geometrynotation[0]);
link('shapehello','shapepieces','认出三角形，再转动它们',TASKS.shapehello[1],TASKS.shapepieces[0]);
link('sidesfold','quadsort','数四条边，还可以检查其他性质',TASKS.sidesfold[2],TASKS.quadsort[0]);
link('shapesides','quadsort','四条边围成的图形，再按性质归类',TASKS.shapesides[1],TASKS.quadsort[1]);
link('shapeidentity','shapesides','看闭合与边数，再画多边形',TASKS.shapeidentity[0],TASKS.shapesides[0]);
link('sidesfold','shapesides','边和角一一对应，自己画出来',TASKS.sidesfold[0],TASKS.shapesides[2]);
