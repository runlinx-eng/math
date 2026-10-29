import {TASKS as old25} from './b25.js';
const item=(topicId,title,formal,summary,reflection)=>({topicId,title,formal,summary,reflection,batch:'B26'});
export const LESSONS={
 pythagoras:item('mt_1VmTUxBrNd','斜着走有多远','勾股定理与距离','只有在直角三角形中，直角对面的斜边所作正方形面积等于另外两个正方形面积之和。求斜边用平方后相加，求直角边从总面积减去已知面积，最后求平方根。','为什么算出25之后，边长是5而不是25？'),
 trigbasics:item('mt_KB_Czd7RQH','一个角决定什么比例','直角三角形中的正弦、余弦与正切','斜边由直角确定；对边和邻边要相对所选锐角来认。相似直角三角形里，相同角对应的边长比例不变。sin是对边÷斜边，cos是邻边÷斜边，tan是对边÷邻边。','换成另一个锐角看，哪些边的名字会交换？')
};
export const SECTIONS=[];
export const ROUTES=[{id:'FC',section:'angle-build',title:'一条斜边和一个角',['ids']:['pythagoras','trigbasics'],packIds:['angles'],themeId:'space',color:'#7d91a9'}];
const q=(label,value)=>({label,value}),ch=(label,value,options)=>({label,value,options}),clone=x=>structuredClone(x);
const area=(prompt,a,b,questions=[],extra={})=>({type:'x-g26-area',prompt,a,b,questions,...extra});
const right=(prompt,questions=[])=>({type:'x-g26-check',prompt,shapes:[[[0,0],[4,0],[0,3]],[[0,0],[4,0],[2,3]]],questions});
const length=(prompt,a,b,unknown,questions=[],extra={})=>({type:'x-g26-length',prompt,a,b,unknown,questions,...extra});
const trig=(prompt,mode,questions=[],extra={})=>({type:'x-g26-trig',prompt,mode,questions,...extra});
export const TASKS={
 pythagoras:[
  area('先找直角对面的边，比较三个正方形；再把整个三角形放大两倍。',3,4,[q('原大小时两个小正方形面积之和',25),q('放大两倍后面积之和',100)]),
  right('先检查两幅图的角，选出可以使用这个面积关系的图形。',[ch('这个关系适用于','right',[['right','直角三角形'],['all','所有三角形']])]),
  length('两条直角边是6和8。先找到斜边，再求斜边长度。',6,8,'hyp',[ch('斜边与另外两边','longest',[['longest','斜边最长'],['shortest','斜边最短']])],{rotation:35}),
  length('斜边是13，一条直角边是5。先找到斜边，再求另一条直角边。',5,12,'leg',[ch('新找到的直角边','shorter',[['shorter','比斜边短'],['longer','比斜边长']])],{rotation:145}),
  length('两个点是(1,2)和(5,5)。先用横线和竖线连出直角，再找两点的直线距离。',4,3,'hyp',[ch('横向4格、纵向3格','diagonal',[['diagonal','两点的直线距离是斜边'],['sum','直线距离一定是4+3']])],{coord:true,points:[[1,2],[5,5]],domain:[0,6,0,6]})
 ],
 trigbasics:[
  trig('先从B角看，给三条边取名字；再从C角看，重新取名字。','roles',[ch('换一个锐角看','swap',[['swap','对边和邻边交换，斜边不变'],['same','三条边的名字都不变']])],{a:4,b:3}),
  trig('从B角看，记下对边÷斜边；再把三角形放大两倍，比较比例。','compare',[q('原大小时对边÷斜边',0.6),ch('放大两倍之后','same',[['same','比例仍然是0.6'],['double','比例变成1.2']])],{a:4,b:3}),
  trig('从B角看：角是35°，斜边长10。选择关系，求对边；结果保留两位小数。','solve',[ch('求出的对边','shorter',[['shorter','比斜边10短'],['longer','比斜边10长']])],{angle:35,hyp:10,unknown:'opp',ratio:'sin',tolerance:0.02}),
  trig('从B角看：角是60°，斜边长10。选择关系，求邻边。','solve',[ch('选用的两条边','adj-hyp',[['adj-hyp','邻边和斜边'],['opp-adj','对边和邻边']])],{angle:60,hyp:10,unknown:'adj',ratio:'cos',tolerance:0.02,rotation:30}),
  trig('从B角看：对边长3、邻边长4。先找比例，再反过来求这个角，保留一位小数。','inverse',[ch('求出的角','acute',[['acute','在0°和90°之间'],['obtuse','大于180°']])],{a:4,b:3,ratio:'tan',tolerance:0.1,rotation:150})
 ]
};
export const PRACTICE=Object.fromEntries(Object.entries(TASKS).map(([id,ts])=>[id,clone(ts.at(-1))]));
export const BRIDGES=[];
const link=(from,to,title,summary,a,b)=>BRIDGES.push({from,to,title,summary,tasks:[clone(a),clone(b)],phase:5,batch:'B26'});
link('polygonangles','pythagoras','先看角，再决定能不能用','先把三角形的角合成半圈，再检查哪个三角形有直角。',old25.polygonangles[0],TASKS.pythagoras[1]);
link('pythagoras','trigbasics','从3、4、5到边的比例','先找3、4、5直角三角形的斜边，再从两个角看对边与邻边。',length('两条直角边是3和4，找到斜边并求它的长度。',3,4,'hyp',[]),TASKS.trigbasics[0]);
