import {TASKS as old02} from '../phase4/b02.js';
import {TASKS as old23} from './b23.js';
const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B27'});
export const LESSONS={
 solidnames:item('mt_Qcp2d_kuta','转一转，认出它','常见立体图形','正方体、长方体、棱锥、球、圆柱和圆锥都是立体。球整个是弯曲的，圆柱有两个圆形平面，圆锥有一个圆形底面和一个尖点。生活物体可以近似这些形状。','一个圆形的面，为什么不能代表整个圆柱？'),
 flatcorners:item('mt_yGv8doDAmp','边和角在哪里','平面图形与立体的特征','三角形有三条边、三个顶点；长方形有四条边、四个顶点。正方体有正方形的平面；图上的边和立体上两面相接的棱要分清。','一个正方形和一个正方体，哪些地方相似？'),
 flatvsolid:item('mt_mnEVZNkX3p','平的和立起来的','二维图形与三维立体','理想的平面图形只有长度和宽度；立体还有厚度。圆是平面图形，球是立体；纸和硬币本身都有厚度，可以用来表示或近似图形。','转到侧面时，圆和球看起来有什么不同？'),
 solidfaces:item('mt_UooUHC_V7U','立体上藏着什么形状','立体的平面与二维图形','圆柱和圆锥有圆形平面，四棱锥有三角形侧面，正方体有正方形面。一个面是立体的一部分，不能把整个立体叫做那个平面。','同一个立体上的不同面，一定都是同一种形状吗？'),
 solidstack:item('mt_QNxFnxikCN','把立体叠成新东西','立体的组合与分解','几个立体可以组合成新的形状。看组合时可以从下往上找组成它的部分；屏幕上的拼搭是有限模型，不等于实际搭建能力。','圆柱加圆锥之后，原来的两个部分还能找到吗？'),
 solidsort:item('mt_fEuoBYw6bU','按什么分在一起','按图形性质分类','同一组图形可以按不同性质分类：平面多边形可按边数分类；立体可按是否有曲面分类。说清分类依据，比只看颜色或大小更有用。','同一个立体，换一条规则后会去哪里？'),
 solidpictures:item('mt_wUSbRt3-qw','一张图藏着什么立体','立体的平面表示','一张立体画和一张展开图，都能表示立体，但它们不是立体本身。可以检查各个面及其连接，想一想折起来或转过去会是什么。','只看一张图，哪些面被挡住了？'),
 foldprism:item('mt_REwgr0d_ss','把纸片合成特别的盒子','三棱柱的展开图与立体结构','三棱柱有两个全等的三角形面和三个长方形面。展开图里的面沿边相连，合起来应完整围住立体，不能缺面或重叠。','为什么两个三角形需要放在不同的端面？'),
 crossparts:item('mt_nRksLqt-iR','切开后看到什么','立体的面、棱、顶点与截面','三棱柱和四棱锥各有不同的面、棱和顶点。圆柱平行底面切开得到圆；本活动中圆锥过尖顶和底面中心的截面是三角形。','换一个切的方向，看到的形状还会一样吗？'),
 prismslices:item('mt_h02-C8PRrj','换个位置切一刀','棱柱、棱锥和圆锥的平行截面','直棱柱平行于端面的截面与端面全等；本活动中的圆锥和四棱锥平行底面切开时，越靠近尖顶，截面越小。方向改变时不能直接套用这个比较。','为什么同样移动切面，有的截面不变，有的会变小？')
};
export const SECTIONS=[{id:'solid-look',title:'转动与辨认'},{id:'solid-fold',title:'拼搭与折合'},{id:'solid-cut',title:'移动切面'}];
const route=(id,section,title,ids)=>({id,section,title,ids,packIds:['solids'],themeId:'space',color:'#6c85a8'});
export const ROUTES=[
 route('FD','solid-look','平的和立起来的',['solidnames','flatvsolid']),
 route('FE','solid-look','边、角和藏着的面',['flatcorners','solidfaces']),
 route('FF','solid-look','分一分，搭一搭',['solidsort','solidstack']),
 route('FG','solid-fold','从画面到立体',['solidpictures','foldprism']),
 route('FH','solid-cut','切开，换个位置看',['crossparts','prismslices'])
];
const opts=(...entries)=>entries.map(([id,label])=>({id,label})),c=(shape,answer,label='',extra={})=>({shape,answer,...(label?{label}:{}),...extra}),clone=x=>structuredClone(x);
const sort=(prompt,cards,bins,extra={})=>({type:'x-g27-sort',prompt,cards,bins,rotate:true,...extra});
const face=(prompt,cards,bins,extra={})=>({type:'x-g27-face',prompt,cards,bins,rotate:true,...extra});
const build=(prompt,target,options)=>({type:'x-g27-build',prompt,target,options,rotate:true});
const net=prompt=>({type:'x-g27-net',prompt,rotate:true});
const cut=(prompt,cards,bins)=>({type:'x-g27-cut',prompt,cards,bins,rotate:true});
const shapeNames=opts(['cube','正方体'],['sphere','球'],['cylinder','圆柱'],['cone','圆锥']);
const cubeNames=opts(['cube','正方体'],['cuboid','长方体'],['pyramid','方底尖顶的立体']);
const flatSolid=opts(['flat','平面图形'],['solid','立体']);
const sideBins=opts(['3','三条边'],['4','四条边'],['5','五条边']);
const faceBins=opts(['circle','圆'],['triangle','三角形'],['square','正方形'],['rectangle','长方形']);
const relation=opts(['same','一样大'],['smaller','靠尖顶更小']);
export const TASKS={
 solidnames:[
  sort('转动这些模型，认一认四种立体。',[c('cube','cube'),c('sphere','sphere'),c('cylinder','cylinder'),c('cone','cone')],shapeNames,{question:'它是什么立体？'}),
  sort('看看模拟的生活物体，把它们和接近的立体形状连起来。',[c('cube','cube','骰子'),c('sphere','sphere','足球'),c('cylinder','cylinder','罐头'),c('cone','cone','派对帽')],shapeNames,{question:'这个物体近似什么形状？'}),
  sort('转动三个盒子和尖顶模型，看看有什么不同。',[c('cube','cube'),c('cuboid','cuboid'),c('pyramid','pyramid')],cubeNames,{question:'它是什么立体？'})
 ],
 flatcorners:[
  sort('看看平面图形，分别数数它们有几条边。',[c('triangle','3'),c('rectangle','4'),c('pentagon','5')],sideBins,{question:'它有几条边？'}),
  sort('比较三角形和长方形；换个方向看，边数有没有变？',[c('triangle','3'),c('rectangle','4'),c('square','4')],sideBins,{question:'数一数这个平面图形的边。'}),
  sort('沿着轮廓走一圈，数清边相遇的角点。',[c('triangle','3'),c('rectangle','4'),c('pentagon','5')],opts(['3','三个角点'],['4','四个角点'],['5','五个角点']),{question:'这个图形有几个角点？'}),
  face('转动正方体，点亮其中一面，看看这面是什么形状。',[c('cube','square','正方体',{face:'front'})],faceBins)
 ],
 flatvsolid:[
  sort('转动后比较：哪些是平面图形，哪些是立体？',[c('circle','flat'),c('sphere','solid'),c('square','flat'),c('cube','solid')],flatSolid),
  sort('圆和球都看起来圆，转到侧面再分一分。',[c('circle','flat','圆'),c('sphere','solid','球')],flatSolid,{question:'这个是平面图形还是立体？'}),
  sort('换一组图形，看看是否有厚度。',[c('triangle','flat'),c('rectangle','flat'),c('cone','solid'),c('cylinder','solid')],flatSolid)
 ],
 solidfaces:[
  face('转动圆柱与圆锥，点亮它们的圆形平面。',[c('cylinder','circle','圆柱',{face:'top'}),c('cone','circle','圆锥',{face:'bottom'})],faceBins),
  face('转动尖顶的立体，点亮靠前的一面。',[c('pyramid','triangle','方底尖顶',{face:'side'})],faceBins),
  face('再看两个盒子上的平面，分清这个面和整个盒子。',[c('cube','square','正方体',{face:'front'}),c('cuboid','rectangle','长方体',{face:'front'})],faceBins)
 ],
 solidstack:[
  build('从下往上，用一个长方体和两个正方体搭高塔。',['cuboid','cube','cube'],['cube','cuboid','cylinder']),
  build('先放圆柱，再给它盖上圆锥屋顶。',['cylinder','cone'],['cylinder','cone','cube']),
  sort('转动已经搭好的模型，找出组成它的两种立体。',[c('tower','cylcone','模型1'),c('cubehouse','boxpyramid','模型2')],opts(['cylcone','圆柱和圆锥'],['boxpyramid','长盒和方底尖顶'],['cubesphere','正方体和球']),{question:'它由哪两种立体组成？'})
 ],
 solidsort:[
  sort('按边数给这些平面图形分组。',[c('triangle','3'),c('square','4'),c('pentagon','5'),c('rectangle','4')],sideBins),
  sort('按是否有曲面分组；转动看看被挡住的地方。',[c('cube','flat'),c('pyramid','flat'),c('sphere','curved'),c('cylinder','curved')],opts(['flat','只有平面'],['curved','有曲面'])),
  sort('换一条规则：这些是平面图形，还是立体？',[c('circle','flat'),c('cylinder','solid'),c('triangle','flat'),c('pyramid','solid')],flatSolid,{question:'这次按什么分：平面图形还是立体？'})
 ],
 solidpictures:[
  sort('先看这张长短不同的纸片，猜折起来是什么，再打开立体。',[c('netbox','cuboid','展开的纸',{reveal:'cuboid'})],cubeNames,{question:'折起来是什么？'}),
  sort('这两幅平面上的画分别表示什么立体？先猜，再打开模型。',[c('picturebox','cuboid','画1',{reveal:'cuboid'}),c('pictureprism','prism','画2',{reveal:'prism'})],opts(['cuboid','长方体'],['prism','两头是三角形的立体'],['sphere','球']),{question:'这幅画表示什么？'}),
  sort('比较两张展开的纸，先猜，再看看折成的立体。',[c('netcube','cube','纸1',{reveal:'cube'}),c('netprism','prism','纸2',{reveal:'prism'})],opts(['cube','正方体'],['prism','两头是三角形的立体'],['sphere','球']),{question:'这张纸表示什么？'})
 ],
 foldprism:[
  {...clone(old02.nets[2]),prompt:'先猜六个方格能否折成盒子，再合起来看是否重叠。'},
  net('自己把三片长方形和两片三角形接起来，试着合成两头是三角形的盒子。'),
  {...clone(old02.solids[2]),prompt:'转动两头是三角形的立体，标记并记录它的面、棱和顶点。'}
 ],
 crossparts:[
  {...clone(old02.solids[2]),prompt:'转动两头是三角形的立体，把面、棱和顶点分别标记一遍。'},
  {type:'x-solid',shape:'pyramid',prompt:'换成方底尖顶的立体，标记并记录面、棱和顶点。'},
  cut('先猜形状，再分别切开圆柱和圆锥。',[{shape:'cylinder',label:'圆柱',axis:'horizontal',mode:'shape',required:[2]},{shape:'cone',label:'圆锥',axis:'vertical',mode:'shape',required:[2]}],opts(['circle','圆'],['triangle','三角形'],['rectangle','长方形'])),
  {...clone(old02.nets[1]),prompt:'先猜这张纸能不能折成正方体，再合起来检查。'}
 ],
 prismslices:[
  cut('切开两头是三角形的立体，两刀和端面同方向，比较两处。',[{shape:'prism',label:'两头是三角形',axis:'end',mode:'compare'}],relation),
  cut('让切面和底面同方向，比较方底尖顶立体在两处的截面。',[{shape:'pyramid',label:'方底尖顶',axis:'horizontal',mode:'compare'}],relation),
  cut('模拟切开没削的铅笔、圆锥和长方体盒子，比较两处截面的大小。',[{shape:'hexprism',label:'没削的铅笔',axis:'horizontal',mode:'compare'},{shape:'cone',label:'圆锥',axis:'horizontal',mode:'compare'},{shape:'cuboid',label:'长方体盒子',axis:'horizontal',mode:'compare'}],relation)
 ]
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,ts])=>[id,clone(ts.at(-1))]));
export const BRIDGES=[];
const link=(from,to,title,summary,a,b)=>BRIDGES.push({from,to,title,summary,tasks:[clone(a),clone(b)],phase:5,batch:'B27'});
link('solidnames','flatvsolid','圆圆的，也可能不一样','先辨认球和圆柱，再把圆形平面与球体分开。',TASKS.solidnames[0],TASKS.flatvsolid[1]);
link('flatvsolid','solidfaces','整个立体和它的一个面','先区分平面与立体，再点亮圆柱和圆锥的平面。',TASKS.flatvsolid[1],TASKS.solidfaces[0]);
link('solidnames','solidstack','认识积木，再搭起来','认出圆柱和圆锥后，用它们组成一个新模型。',TASKS.solidnames[0],TASKS.solidstack[1]);
link('solids','solidsort','数过面，再换一条规则','先转动标记盒子的各部分，再比较有没有曲面。',old02.solids[0],TASKS.solidsort[1]);
link('shapeframe','solidstack','从框架到拼搭','先搭出立体框架，再用立体块搭一座塔。',old23.shapeframe[0],TASKS.solidstack[0]);
link('nets','solidpictures','折过纸，再看另一张图','先试折正方体纸片，再比较展开图与立体。',old02.nets[1],TASKS.solidpictures[2]);
link('solidpictures','foldprism','看一张纸，自己接上纸片','先看两头是三角形的立体，再接上纸片折合。',TASKS.solidpictures[2],TASKS.foldprism[1]);
link('foldprism','crossparts','折成立体，再数它的部分','先合成两头是三角形的盒子，再转动数面、棱和顶点。',TASKS.foldprism[1],TASKS.crossparts[0]);
link('crossparts','prismslices','切出形状，再比较大小','先观察圆柱的圆形切面，再移动另一种立体的切面。',TASKS.crossparts[2],TASKS.prismslices[0]);
