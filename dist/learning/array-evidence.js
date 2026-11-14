// Verify bounded multiplication-array actions independently of the original grader.
// Correct answers or a final board without checked actions are not thinking evidence.
import * as arrays from './phase5/b13-model.js';
import {matchesNativeEvidenceTask} from './evidence-contract.js';

const BINDINGS=Object.freeze({
 'structure34:1':{nodeId:'mt_FAXjFkgG6X',code:'ccss-math:MP.7',label:'数位、运算与图形中的结构',question:'先猜一猜：把六行四格的阵列转个方向，会多出或少掉点吗？怎样用行和列核对？'},
 'tables34:1':{nodeId:'mt_2jbUekyTu4',code:'ccss-math:MP.8',label:'延续表格中的规律',question:'把8行7格沿第5列切开，左边和右边各有多少？为什么两块都有8行？'},
 'derivepatterns:0':{nodeId:'mt_aivrWs6jrS',code:'ccss-math:MP.8',label:'乘法表与分数中的规律',question:'三行四格如果每行在第2格后切开，两个部分各有多少格？能怎样重新合起来？'},
 'derivepatterns:3':{nodeId:'mt_aivrWs6jrS',code:'ccss-math:MP.8',label:'乘法表与分数中的规律',question:'先用三行四格表示3份4，再想每格代表的数量换成十时，会怎样？'},
 'derivepatterns:4':{nodeId:'mt_aivrWs6jrS',code:'ccss-math:MP.8',label:'乘法表与分数中的规律',question:'阵列还是三行四格，每格却表示十。总量怎样变化？哪一部分没有变？'},
 'derivepatterns:5':{nodeId:'mt_aivrWs6jrS',code:'ccss-math:MP.8',label:'乘法表与分数中的规律',question:'每格现在表示一百。用同样的阵列比较3×4、3×40、3×400，有什么保持不变？'},
 'derivepatterns:6':{nodeId:'mt_aivrWs6jrS',code:'ccss-math:MP.8',label:'乘法表与分数中的规律',question:'先把8行7格分成8行5格和8行2格，为什么不可以把右边只算作2格？'}
});
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

export function arrayBinding(task,context={}){
 if(task?.type!=='x-mularray'||typeof context.sessionId!=='string'||
    !Number.isInteger(context.index)||context.index<0)return null;
 const binding=BINDINGS[context.sessionId+':'+context.index];
 if(!binding||!matchesNativeEvidenceTask(task,context,{type:'x-mularray',nodeId:binding.nodeId}))return null;
 return binding;
}

// Confirm one real shape and at most one necessary turn or cut. Reject resets,
// redundant clicks, corrective histories and unsupported actions conservatively.
export function replayArrayEvidence(task,model){
 if(task?.type!=='x-mularray'||!model||!Array.isArray(model.history)||
    !Number.isInteger(task.a)||!Number.isInteger(task.b)||
    task.a<1||task.a>12||task.b<1||task.b>12||
    (task.rotate&&task.split)||![1,10,100,1000].includes(task.unit||1))return null;
 if(!arrays.valid(task,model)||!arrays.inspect(task,model).correct||
    model.issue!=='')return null;
 const expected=['b13-shape',...(task.rotate?['b13-turn']:task.split?['b13-cut']:[])];
 if(model.history.length!==expected.length)return null;
 const [shape,second]=model.history;
 if(shape.action!=='b13-shape'||Number(shape.data.rows)!==task.a||
    Number(shape.data.cols)!==task.b||
    (task.rotate&&shape.data.prediction!=='same'))return null;
 const board=model.board;
 if(!same(board.built,{rows:task.a,cols:task.b}))return null;
 if(task.rotate){
  if(second?.action!=='b13-turn'||board.turns!==1||
     board.rows!==task.b||board.cols!==task.a||board.cut!==null)return null;
 }else if(task.split){
  const cut=Number(second?.data?.cut);
  if(second?.action!=='b13-cut'||!Number.isInteger(cut)||cut<1||cut>=task.b||
     (task.requiredCut!==undefined&&cut!==task.requiredCut)||
     board.cut!==cut||board.turns!==0||board.rows!==task.a||board.cols!==task.b)return null;
 }else if(board.cut!==null||board.turns!==0||board.rows!==task.a||board.cols!==task.b)return null;
 for(let i=0;i<expected.length;i++)if(model.history[i].action!==expected[i])return null;
 const unit=task.unit||1,total=task.a*task.b*unit;
 const cut=task.split?board.cut:null;
 const left=cut===null?null:task.a*cut*unit;
 const right=cut===null?null:task.a*(task.b-cut)*unit;
 if(cut!==null&&(Number(model.left)!==left||Number(model.right)!==right||left+right!==total))return null;
 return {rows:task.a,cols:task.b,unit,total,turned:!!task.rotate,cut,left,right};
}
