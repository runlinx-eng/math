// Verify bounded multiplication-array actions independently of the original grader.
// Correct answers or a final board without checked actions are not thinking evidence.
import * as arrays from './phase5/b13-model.js';
import {matchesNativeEvidenceTask,hasExactKeys,sameEvidence as same} from './evidence-contract.js';

const BINDINGS=Object.freeze({
 'structure34:1':{nodeId:'mt_FAXjFkgG6X',code:'ccss-math:MP.7',label:'数位、运算与图形中的结构',question:'先猜一猜：把六行四格的阵列转个方向，会多出或少掉点吗？怎样用行和列核对？'},
 'tables34:1':{nodeId:'mt_2jbUekyTu4',code:'ccss-math:MP.8',label:'延续表格中的规律',question:'把8行7格沿第5列切开，左边和右边各有多少？为什么两块都有8行？'},
 'derivepatterns:0':{nodeId:'mt_aivrWs6jrS',code:'ccss-math:MP.8',label:'乘法表与分数中的规律',question:'三行四格如果每行在第2格后切开，两个部分各有多少格？能怎样重新合起来？'},
 'derivepatterns:3':{nodeId:'mt_aivrWs6jrS',code:'ccss-math:MP.8',label:'乘法表与分数中的规律',question:'先用三行四格表示3份4，再想每格代表的数量换成十时，会怎样？'},
 'derivepatterns:4':{nodeId:'mt_aivrWs6jrS',code:'ccss-math:MP.8',label:'乘法表与分数中的规律',question:'阵列还是三行四格，每格却表示十。总量怎样变化？哪一部分没有变？'},
 'derivepatterns:5':{nodeId:'mt_aivrWs6jrS',code:'ccss-math:MP.8',label:'乘法表与分数中的规律',question:'每格现在表示一百。用同样的阵列比较3×4、3×40、3×400，有什么保持不变？'},
 'derivepatterns:6':{nodeId:'mt_aivrWs6jrS',code:'ccss-math:MP.8',label:'乘法表与分数中的规律',question:'先把8行7格分成8行5格和8行2格，为什么不可以把右边只算作2格？'}
});
// These are native mathematical content sources, not additional MP nodes.
// Shared widgets in associated tasks remain outside every binding below.
const SOURCES=Object.freeze({
 equalgroups:{indices:[2],nodeId:'mt_PZ909yPrEC'},
 bagstories:{indices:[2],nodeId:'mt_wh3UqnWsa7'},
 groupsproblems:{indices:[2],nodeId:'mt_qUjW0N1cYO'},
 divisionmeaning:{indices:[3],nodeId:'mt_iNdrM2-oJf'},
 arraystart:{indices:[0,1,2],nodeId:'mt_GRWwTDZ3wD'},
 rowsums:{indices:[0,2],nodeId:'mt_B1zj1RwQ3a'},
 mulsymbols:{indices:[0,2],nodeId:'mt_zOWwLxa77y'},
 turnarray:{indices:[0,1],nodeId:'mt_C9ZfT-4cgn'},
 productmeaning:{indices:[1],nodeId:'mt_gtTl3R5buH'},
 tables2510:{indices:[0,1],nodeId:'mt_HhuSDxwDNM'},
 tables348:{indices:[0,1,2],nodeId:'mt_wQ89AEXhz3'},
 tables12:{indices:[0,2],nodeId:'mt_K5jM7vlVhA'},
 missingfactor:{indices:[0,1],nodeId:'mt_GDG9_SZmsO'},
 unknownproducts:{indices:[0,1,2,3,4,5],nodeId:'mt_xZvDCYA5Ae'},
 mentalproducts:{indices:[0],nodeId:'mt_pjfmCMMPjO'},
 tensproducts:{indices:[0,1,2,3],nodeId:'mt_isojCL9yy-'},
 productways:{indices:[0,1],nodeId:'mt_Lb2ZnMdkYR'},
 mixedfacts:{indices:[0],nodeId:'mt_WX30dzi4dt'},
 tablepatterns:{indices:[0,2,3],nodeId:'mt_w6MxaaoMXZ'},
 scaleandpair:{indices:[3],nodeId:'mt_EmR5n58jZt'},
 groupstories:{indices:[3],nodeId:'mt_Zdv-b-iW5K'}
});
const question=task=>task.approximate?
 '题目给的是准确数量还是大约的数量？用阵列表示这个估计后，为什么结果仍要说“大约”？':task.hidden?
 '题目藏起来的是份数、每份的量，还是总量？用行和列核对，再把找到的数放回原来的关系试一试。':task.repeated?
 '一行代表哪一份？把每一行的数量连加时，项数和每一项分别对应图里的什么？':task.reverseEquation?
 '把总量写在等号左边，行数和每行数量的关系会改变吗？用这幅图核对等号两边。':task.rotate?
 '先猜转向后数量会怎样。转动同一幅阵列时，行和列怎样变化？有没有格子增加或减少？':task.split?
 '把阵列分成两块时，两边各保留几行？怎样把两块的数量合回原来的总量？':
 '这幅图有几行，每行几格？每格表示的是一个、十个还是更多？怎样把格数和表示的量联系起来？';

export function arrayBinding(task,context={}){
 if(!context||typeof context!=='object'||Array.isArray(context))return null;
 if(task?.type!=='x-mularray'||typeof context.sessionId!=='string'||
    !Number.isInteger(context.index)||context.index<0)return null;
 const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
 const binding=BINDINGS[context.sessionId+':'+context.index]||
  (source?.indices.includes(context.index)?{nodeId:source.nodeId,question:question(task)}:null);
 if(!binding||!matchesNativeEvidenceTask(task,context,{type:'x-mularray',nodeId:binding.nodeId}))return null;
 return {...binding,method:binding.code?
  {nodeId:binding.nodeId,label:binding.label,code:binding.code}:null};
}

const integer=n=>Number.isSafeInteger(n)&&n>=0&&n<=1000000;
const number=s=>typeof s==='string'&&/^\d{1,9}$/.test(s.trim())&&integer(Number(s))?Number(s):null;
const norm=s=>String(s).replace(/\s/g,'').replace(/[xX*✕]/g,'×').replace(/[／/]/g,'÷')
 .replace(/＝/g,'=').replace(/[?？]/g,'□');
const matches=(s,options)=>options.some(want=>norm(s)===want||norm(s)===want.split('=').reverse().join('='));
const modelKeys=['rows','cols','cut','answer','equation','addition','base','left','right','rest','check',
 'prediction','amount','result','board','history','issue'];

// Confirm one real shape and at most one necessary turn or cut. Reject resets,
// redundant clicks, corrective histories and unsupported actions conservatively.
export function replayArrayEvidence(task,model){
 try{
 if(task?.type!=='x-mularray'||!hasExactKeys(model,modelKeys)||!Array.isArray(model.history)||
    !Number.isInteger(task.a)||!Number.isInteger(task.b)||
    task.a<1||task.a>12||task.b<1||task.b>12||
    (task.rotate&&task.split)||![1,10,100,1000].includes(task.unit??1))return null;
 for(const flag of ['rotate','split','repeated','reverseEquation','approximate'])
  if(task[flag]!==undefined&&typeof task[flag]!=='boolean')return null;
 if(task.hidden!==undefined&&!['a','b','p'].includes(task.hidden))return null;
 if(task.requiredCut!==undefined&&(!task.split||!Number.isInteger(task.requiredCut)||
    task.requiredCut<1||task.requiredCut>=task.b))return null;
 if(task.original!==undefined&&(typeof task.original!=='string'||!task.hidden||
    norm(task.original).split('□').length!==2))return null;
 if(task.approximate&&(task.hidden||task.reverseEquation||task.original))return null;
 if(!arrays.valid(task,model)||!arrays.inspect(task,model).correct||
    model.issue!=='')return null;
 const expected=['b13-shape',...(task.rotate?['b13-turn']:task.split?['b13-cut']:[])];
 if(model.history.length!==expected.length)return null;
 const [shape,second]=model.history;
 const prediction=task.rotate?'same':'';
 if(shape.action!=='b13-shape'||number(shape.data.rows)!==task.a||
    number(shape.data.cols)!==task.b||shape.data.prediction!==prediction||
    model.prediction!==prediction)return null;
 const board={rows:task.a,cols:task.b,built:{rows:task.a,cols:task.b},cut:null,turns:0,prediction};
 for(const e of model.history)if(e.data.bucket!==null||e.data.index!==null||e.data.token!==null||
    number(e.data.rows)!==task.a||number(e.data.cols)!==task.b||e.data.prediction!==prediction)return null;
 if(task.rotate){
  if(second?.action!=='b13-turn')return null;
  [board.rows,board.cols]=[task.b,task.a];board.turns=1;
 }else if(task.split){
  const cut=number(second?.data?.cut);
  if(second?.action!=='b13-cut'||!Number.isInteger(cut)||cut<1||cut>=task.b||
     (task.requiredCut!==undefined&&cut!==task.requiredCut))return null;
  board.cut=cut;
 }
 if(!same(board,model.board)||number(model.rows)!==task.a||number(model.cols)!==task.b)return null;
 for(let i=0;i<expected.length;i++)if(model.history[i].action!==expected[i])return null;
 const unit=task.unit??1,total=task.a*task.b*unit;
 const cut=task.split?board.cut:null;
 const left=cut===null?null:task.a*cut*unit;
 const right=cut===null?null:task.a*(task.b-cut)*unit;
 if(cut!==null&&(number(model.cut)!==cut||number(model.left)!==left||number(model.right)!==right||left+right!==total))return null;
 const values={a:String(task.a),b:String(task.b*unit),p:String(total)};
 const answer=task.hidden?Number(values[task.hidden]):total;
 if(number(model.answer)!==answer||unit!==1&&number(model.base)!==task.a*task.b)return null;
 // Recalculate the equation and its unknown independently. The final answer
 // alone cannot replace the built array or the original relation to substitute.
 const named={...values};if(task.hidden)named[task.hidden]='□';
 const equations=[`${named.a}×${named.b}=${named.p}`,`${named.b}×${named.a}=${named.p}`];
 if(task.hidden)equations.push(`${named.p}÷${named.a}=${named.b}`,`${named.p}÷${named.b}=${named.a}`);
 const equation=norm(model.equation);
 if(task.approximate){
  if(equation.split('≈').length!==2||equation.includes('=')||!matches(equation.replace('≈','='),equations))return null;
 }else if(!matches(equation,equations)||task.reverseEquation&&!/^\d+=/.test(equation))return null;
 if(task.original&&!matches(model.check,[norm(task.original).replace('□',String(answer))]))return null;
 let addition=null;
 if(task.repeated){
  addition=Array(board.rows).fill(board.cols*unit);
  if(!matches(model.addition,[addition.join('+')+'='+total]))return null;
 }
 return {rows:task.a,cols:task.b,unit,total,turned:!!task.rotate,cut,left,right,
  unknown:task.hidden?{kind:task.hidden,value:answer,original:task.original||null}:null,
  addition,reversedEquation:!!task.reverseEquation,approximate:!!task.approximate};
 }catch{return null;}
}
