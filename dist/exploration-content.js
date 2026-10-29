export const ACTIVITIES={
 fair:{id:'fair',topicId:'mt_ndGqFPWyen',title:'怎样才算一份？',icon:'◴',question:'切成四块，就一定能叫四分之一吗？',goal:'把一个整体平均分，再用其中的几份表示一个量。',labPrompt:'移动切口，再点选纸带。看一看：块数一样，大小也一定一样吗？',notePrompt:'如果每一块不一样大，还能只数块数来说明分数吗？用你自己的作品解释。',sourceActivity:'Cut it fair, then count the unit',method:'构造平均分的纸带；迁移到一组物品',supportId:'mt_Xp-rj46S2w'},
 rename:{id:'rename',topicId:'mt_Ep7TDFuYUa',title:'分法变了，量变了吗？',icon:'≋',question:'同一段长度，能有几个分数名字？',goal:'独立构造等值分数，并在新的数轴刻度上找到同一个量。',labPrompt:'上面固定是 2/3。改变下面的分法和涂色，看看终点怎样移动。',notePrompt:'为什么把每一份再平均分，量可以不变？分子分母都加 1 时会怎样？',sourceActivity:'Re-partition toggle: the point that does not move',method:'构造一组等值分数；迁移到数轴',supportId:'mt_NoB20kVa4w'},
 decimal:{id:'decimal',topicId:'mt_TqDq6jyOmL',title:'同一个数，两个名字',icon:'▦',question:'0.3 和 0.03，差别藏在哪里？',goal:'在百分格中表示小数，并把十分之几和百分之几放在数轴上。',labPrompt:'整块方格是 1。点格子涂色，也可以一次涂满一行。看看两种名字怎样一起变。',notePrompt:'为什么 0.06 里的这个 0 不能直接去掉？而 0.60 和 0.6 又可以表示同一个量？',sourceActivity:'Shade, name it twice, and pin one point',method:'用面积构造小数；用数轴区分十分与百分',supportId:'mt_doX1BhmFgk'},
};
export const KINDS=['construct','transfer'];
export const STAGES={play:'自由试一试',construct:'做一个作品',transfer:'换个情境',explain:'说说我的发现'};
export const activityIds=Object.keys(ACTIVITIES);
export function task(id,kind,variant=0){
 const v=variant===1;
 if(id==='fair')return kind==='construct'?{type:'partition',d:v?5:4,n:v?2:3,title:`把纸带平均分，并表示 ${v?'2/5':'3/4'}。`,instruction:'先移动切口，让各份一样大，再点选你要取的部分。整条纸带是 1。',hint:'分母决定平均分成几份。先检查每一份是否等长，再按分子选取份数。'}:{type:'set',count:v?15:12,d:v?5:4,n:v?2:3,title:`这里的 ${v?15:12} 个棋子合起来是 1 整组。表示这组的 ${v?'2/5':'3/4'}。`,instruction:'点选你要取的棋子。每个棋子一样大；这次的整体是整组，不是单独一个棋子。',hint:`把 ${v?15:12} 个棋子平均分成 ${v?5:4} 组，再取其中 ${v?2:3} 组。`};
 if(id==='rename')return kind==='construct'?{type:'family',n:v?2:1,d:v?3:2,title:`给 ${v?'2/3':'1/2'} 找三个不同的新名字。`,instruction:'三个分母互不相同，而且要大于原来的分母。调整每条纸带的分法与取的份数，保持表示的量相同。',hint:'每一份再平均分时，取的份数和总份数一起按相同倍数改变。也可以比较三条纸带的涂色终点。'}:{type:'line',n:v?2:3,d:v?5:4,divisions:v?10:8,title:`把 ${v?'2/5':'3/4'} 放到这条数轴上。`,instruction:`0 到 1 被平均分成 ${v?10:8} 段。点一个刻度，把标记放在那里；这次没有对齐的参考纸带。`,hint:'想一想每个原来的小份，被新刻度再分成了几份。数轴的 0 到 1 始终表示同一个整体。'};
 return kind==='construct'?{type:'grid',target:v?42:35,title:`用这块百分格表示 ${v?'0.42':'0.35'}。`,instruction:'整块方格是 1。点选小格，或用行按钮涂满一行，造出你想表示的量。',hint:'一行是 1/10，一格是 1/100。小数的十分位告诉你有几个整行，百分位告诉你还有几个小格。'}:{type:'dual-line',k:v?9:6,title:`把 ${v?9:6}/100 和 ${v?9:6}/10 分别放到数轴上。`,instruction:'两条数轴的 0 到 1 一样长。拖动标记；也可用左右方向键精确移动一个百分之一。',hint:'100 个百分之一是 1；10 个十分之一也是 1。同样取几份，必须先看每份有多大。'};
}
export function defaultModel(t){
 if(t.type==='partition')return {cuts:t.d===4?[15,55,85]:[10,30,65,90],selected:[]};
 if(t.type==='set'||t.type==='grid')return {selected:[]};
 if(t.type==='family')return {rows:[{n:0,d:4},{n:0,d:6},{n:0,d:8}]};
 if(t.type==='line')return {mark:0};
 return {hundredths:0,tenths:0};
}
export function inspect(t,m){
 if(t.type==='partition'){
  const positions=[0,...m.cuts,100],widths=positions.slice(1).map((p,i)=>p-positions[i]);
  if(!widths.every(w=>Math.abs(w-100/t.d)<.01))return {correct:false,code:'unequal',feedback:`现在每份的长度分别是 ${widths.join('、')}。要表示 ${t.n}/${t.d}，先让 ${t.d} 份一样大。只数块数还不够。`};
  if(m.selected.length!==t.n)return {correct:false,code:'count',feedback:`这些份已经等长了。你取了 ${m.selected.length} 份；${t.n}/${t.d} 表示取其中 ${t.n} 份。`};
  return {correct:true,code:'partition',feedback:`每一份是整体的 1/${t.d}，你取了 ${t.n} 份。这个作品把平均分和取的份数都表现出来了。`};
 }
 if(t.type==='set'){const expected=t.count*t.n/t.d;return {correct:m.selected.length===expected,code:'set',feedback:`整组 ${t.count} 个棋子是 1。每个 1/${t.d} 有 ${t.count/t.d} 个，取 ${t.n} 份就是 ${expected} 个。你这次取了 ${m.selected.length} 个。`};}
 if(t.type==='family'){
  const distinct=new Set(m.rows.map(r=>r.d)).size===3;
  const equal=m.rows.every(r=>r.n*t.d===t.n*r.d&&r.d>t.d);
  const additive=m.rows.some(r=>r.n===t.n+1&&r.d===t.d+1);
  return {correct:distinct&&equal,code:additive?'additive':'family',feedback:distinct&&equal?'三个不同的分法，涂色都到同一个位置。你造出了一组等值分数；为什么可以这样改名，仍值得用自己的话说一说。':additive?'这组里有分子、分母都加 1 的写法。它改变了涂色长度。试试把每一份再等分，看看和“加 1”有什么不同。':!distinct?'请用三个互不相同的分母，找三个不同的新名字。':'比较涂色量：整体一样大时，等值分数应该到达同一个位置。每个新分母也需要大于原来的分母。'};
 }
 if(t.type==='line'){const expected=t.n/t.d*t.divisions;return {correct:m.mark===expected,code:'line',feedback:`${t.n}/${t.d} = ${expected}/${t.divisions}。从 0 起走 ${expected} 个小段，会到达同一个位置。你选择了第 ${m.mark} 个刻度。`};}
 if(t.type==='grid')return {correct:m.selected.length===t.target,code:'grid',feedback:`${(t.target/100).toFixed(2)} 表示 ${t.target} 个百分之一。你涂了 ${m.selected.length} 格。图案可以不同，所占的量要相同。`};
 return {correct:m.hundredths===t.k&&m.tenths===t.k*10,code:'place',feedback:`${t.k}/100 = ${(t.k/100).toFixed(2)}，${t.k}/10 = ${(t.k/10).toFixed(1)}。两种“小份”的大小不同；同样的份数，位置也不同。`};
}
export function modelIsValid(t,m){
 const obj=x=>x&&typeof x==='object'&&!Array.isArray(x),int=(v,lo,hi)=>Number.isInteger(v)&&v>=lo&&v<=hi;
 if(!obj(m))return false;
 const selected=(max)=>Array.isArray(m.selected)&&m.selected.length<=max&&new Set(m.selected).size===m.selected.length&&m.selected.every(v=>int(v,0,max-1));
 if(t.type==='partition')return selected(t.d)&&Array.isArray(m.cuts)&&m.cuts.length===t.d-1&&m.cuts.every((v,i)=>int(v,1,99)&&(i===0||v>m.cuts[i-1]));
 if(t.type==='set')return selected(t.count);
 if(t.type==='grid')return selected(100);
 if(t.type==='family')return Array.isArray(m.rows)&&m.rows.length===3&&m.rows.every(r=>obj(r)&&int(r.d,2,12)&&int(r.n,0,r.d));
 if(t.type==='line')return int(m.mark,0,t.divisions);
 return int(m.hundredths,0,100)&&int(m.tenths,0,100);
}
