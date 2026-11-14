import {registerClientRelease} from '../sw-client.js';
registerClientRelease('math-explorer-20261114-p9-decimal-v1');
// Embedded learning is a fixed reading workspace. A Mac trackpad pinch appears
// in Chromium as Ctrl+wheel and otherwise magnifies the entire web page.
// Consume only accidental pinch gestures inside an embedded lesson; normal
// scrolling, input editing and explicit browser accessibility zoom remain.
if(window!==window.top){
  const stopPinch=e=>{if(e.ctrlKey&&e.cancelable)e.preventDefault();};
  const stopGesture=e=>{if(e.cancelable)e.preventDefault();};
  window.addEventListener('wheel',stopPinch,{capture:true,passive:false});
  window.addEventListener('gesturestart',stopGesture,{capture:true,passive:false});
  window.addEventListener('gesturechange',stopGesture,{capture:true,passive:false});
}
import {readStored,writeStored,unpackText,MAX_BACKUP_BYTES} from '../storage.js';
import {prepareStateForValidation,prepareSessionRuntime} from './phase4/async-batches.js';
import {syncControls as syncB20Controls} from './phase5/b20-view.js';
import {csv as dataCsv} from './phase5/b19-view.js';
import {syncControls as syncB13Controls} from './phase5/b13-view.js';
import {isExtra,actExtra,fieldExtra} from './phase4/engine.js';
import {renderExtra,visualExtra,controlsExtra} from './phase4/view-engine.js';
import {setField} from './phase4/ui.js';
import {mountB06} from './phase5/b06-runtime.js';
import {TYPES as B06_TYPES} from './phase5/b06-model.js';
import {SolidView} from './phase4/solid-view.js';
import {SpaceLab} from './phase5/b27-solid-view.js';
import {AreaSolidLab} from './phase5/b30-solid-view.js';
import {FractionCubeView} from './phase5/b31-cube-view.js';
import {PatternGrowthView} from './phase5/b34-space-view.js';
import {FrameView} from './phase5/b23-solid-view.js';
import {PowerView} from './phase5/b09-power-view.js';
import {KEY,fresh,validate,nodeState,now} from '../exploration-core.js';
import {LESSONS,ROUTES,lessonIds,routeFor,REFLECTIONS} from './catalog.js';
import {TASKS,PRACTICE,defaultModel,validModel,inspect,voxels,exampleModel} from './tasks.js';
import {freshLesson,modelForLesson,enterUnifiedTask,currentSubmission,supportLesson,submitLesson,lessonSummary,validateLesson,mergeLesson,addLessonNote,assertNoConcurrentLessonOverwrite} from './state.js';
import {BRIDGES,sessionMeta,sessionTasks,sessionTaskFor as taskFor,sessionRoute,nextRelatedPractice} from './bridges.js';
import {captureSession,sessionRecord,rememberSession,addQuestion,questionAction,questionDone} from './daily.js';
import {askQuestion} from './question-ui.js';
import {thinkingFeedback,thinkingGuide} from './thinking-feedback.js';
import {renderP3Flow} from './p3-view.js';
import {LEARNING_STEPS,learningStage,learningActionPlan,stageGuidance,checkedMathExplanation,nextRouteLessonId,correctionGuidance,executionCue,activityTitle,studyActionFocus} from './workspace-flow.js';
import {CubeView} from './cubes.js';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn=(act,label,attrs='',primary=false)=>`<button type="button" data-do="${act}" ${attrs} class="${primary?'primary':''}">${label}</button>`;
const num=(key,label,value,attrs='')=>`<label class="field">${label}<input type="number" min="0" max="999" step="1" data-field="${key}" aria-label="${label}" value="${value??''}" ${attrs}></label>`;
const entry=(key,label,value)=>`<label class="field">${label}<input type="text" data-field="${key}" aria-label="${label}" autocomplete="off" maxlength="40" value="${esc(value)}"></label>`;
let extraLab=null,extraKey='',cleanupB06=null;
let questionId=new URLSearchParams(location.search).get('question'),atlas,all,id,a,blocked=false,feedback='',spread=0,view=null,cube=null,cubeKey='',dirty=false;
let savedNoteFeedback='';
let lessonOpenSerial=0;

const P03_ID='counttwenty';
const P03_NAMES=['数清整齐的一排','数清散开的珠子','按要求取出珠子'];
const isP03=()=>id===P03_ID;
function p03Stage(t,m){
 const selecting=t.type==='x-numberfaces';
 const done=selecting?m.selected.length:m.taps.length;
 const target=t.n;
 const ready=done===target&&(selecting?m.numeral!==null:m.total!==null);
 const phase=done===target?'answer':selecting?'choose':'count';
 const instruction=done>target?'选得太多了。再点一次已选中的珠子，就能取消。':
  done<target?selecting?`先选出 ${target} 颗珠子。已选 ${done} 颗，点已选的可取消。`:`每颗只点一次。已经标记 ${done} / ${target} 颗。`:
  ready?'数量和答案都已记录。现在点击「检查本题」。':selecting?'数量已经选好。写下取出的颗数。':'珠子已经全部标记。现在填下总数。';
 return {phase,ready,instruction};
}
function syncP03(t,m){
 if(!isP03()||a.view!=='task')return;
 const stage=p03Stage(t,m),hint=$('#p03-guidance'),check=$('#actions [data-do="check"]');
 if(hint)hint.textContent=stage.instruction;
 if(!feedback)$('#work .p03-feedback')?.remove();
 if(check)check.disabled=!stage.ready;
 if(!feedback)$('#instruction').textContent=P03_NAMES[a.index];
}
const task=()=>{const t=taskFor(id,a.view==='play'?-1:a.index);return a.view==='play'&&t.type==='cube-plan'&&a.models[-1]?.shape?{...t,dims:a.models[-1].shape}:t;};
const model=()=>modelForLesson(a);
function notify(type,extra={}){if(parent!==window)parent.postMessage({type,...extra},location.origin);}
// Each activity has its own actual content height. The parent bounds it to the
// available viewport instead of forcing every lesson into a fixed 820px iframe.
if(parent!==window&&typeof ResizeObserver!=='undefined'){
  const lessonRoot=document.querySelector('#lesson');
  let lastHeight=-1;
  const reportHeight=()=>{
    const height=Math.ceil(lessonRoot.scrollHeight);
    if(height>0&&height!==lastHeight){
      lastHeight=height;
      notify('math-space:lesson-height',{height});
    }
  };
  new ResizeObserver(reportHeight).observe(lessonRoot);
  window.addEventListener('load',reportHeight);
  window.addEventListener('resize',reportHeight);
  requestAnimationFrame(reportHeight);
}
function read(){const raw=readStored(KEY);return raw?validate(JSON.parse(raw),atlas):fresh();}
function uiSnapshot(){const c=cube?.snapshot()||extraLab?.snapshot();return {spread,view,camera:c?{position:c.camera,target:c.target}:null};}
function update(fn){if(blocked)return false;try{const stored=read(),previous=sessionRecord(stored,id);assertNoConcurrentLessonOverwrite(a,previous);const working=previous?mergeLesson(a,previous):structuredClone(a);working.ui=uiSnapshot();fn(working);working.updatedAt=now();const record=validateLesson(working,id,{allowBridge:true});if(BRIDGES[id])stored.daily.bridges[id]=record;else stored.lessons[id]=record;rememberSession(stored,id,questionId);stored.lessonContinuation=BRIDGES[id]?.to||id;stored.visited[sessionMeta(id).topicId]??=now();stored.openedPacks[sessionRoute(id).packIds[0]]??=now();all=validate(stored,atlas);writeStored(KEY,JSON.stringify(all));a=sessionRecord(all,id);notify('math-space:lesson-change',{id:BRIDGES[id]?.to||id,sessionId:id,questionId,topicId:sessionMeta(id).topicId});return true;}catch(error){blocked=true;$('#storage-warning').hidden=false;$('#storage-warning').textContent='保存遇到问题，已停止覆盖原记录。'+error.message;return false;}}
function questionContext(){update(()=>{});return {nodeId:sessionMeta(id).topicId,scene:captureSession(a,uiSnapshot())};}
function leaveQuestion(){const context=questionContext();if(parent!==window)notify('math-space:question-request',context);else askQuestion(text=>{const current=read();addQuestion(current,text,context);all=validate(current,atlas);writeStored(KEY,JSON.stringify(all));});}
function renderQuestion(){const q=all.daily.questions.find(q=>q.id===questionId),el=$('#question-context');el.hidden=!q||questionDone(q);if(!el.hidden)el.innerHTML=`<small>接着这个问题想</small><p>${esc(q.text)}</p>${btn('question-finish','想明白了')}${btn('question-later','先放着')}`;}

function edit(fn,{renderNow=false}={}){feedback='';if(update(record=>fn(modelForLesson(record),record))){if(renderNow)render();else{$('#thinking-feedback')?.remove();const box=$('#check-feedback');if(box){box.hidden=true;box.textContent='';}sync();}}}
const tally=n=>Array.from({length:Math.ceil(n/5)},(_,i)=>{const count=Math.min(5,n-i*5);return `<svg width="${count===5?40:count*9}" height="25" viewBox="0 0 ${count===5?40:count*9} 25" role="img" aria-label="${count} 笔">${Array.from({length:Math.min(count,4)},(_,j)=>`<line x1="${5+j*9}" y1="3" x2="${5+j*9}" y2="22" stroke="#58755a" stroke-width="2"/>`).join('')}${count===5?'<line x1="1" y1="23" x2="37" y2="2" stroke="#58755a" stroke-width="2"/>':''}</svg>`;}).join(' ');
function sourceData(t){const labels=t.labels,counts=t.counts;let inner='';if(t.source==='cards'||t.source==='list')inner=`<div class="cards">${counts.flatMap((n,i)=>Array.from({length:n},()=>`<span class="data-card">${esc(labels[i])}</span>`)).join('')}</div>`;else if(t.source==='bar')inner=chartHTML(t,{counts},'bar').replace(/tabindex="0" role="slider"/g,'role="img"').replace(/data-bar="\d+"/g,'');else inner=`<table><thead><tr><th>类别</th><th>${t.source==='tally'?'一笔一票':'票数'}</th></tr></thead><tbody>${labels.map((l,i)=>`<tr><td>${esc(l)}</td><td class="${t.source==='tally'?'tallies':''}">${t.source==='tally'?tally(counts[i]):counts[i]}</td></tr>`).join('')}</tbody></table>`;return `<div class="source-data"><div class="unit-label">这组原始记录 · 模拟投票</div>${inner}</div>`;}
function chartHTML(t,m,mode){if(mode==='bar'||mode==='block')return `${t.axes?`<div class="note-line">竖轴：${m.yLabel==='count'?'票数':m.yLabel==='category'?'类别':'待标注'}</div>`:''}<div class="chart ${mode==='block'?'block-chart':''}" aria-label="一格一票的图"><span class="scale-zero">0</span>${[2,4,6,8,10,12].map(n=>`<span class="chart-scale" style="bottom:${n*18-5}px">${n}</span>`).join('')}${t.labels.map((l,i)=>`<div class="column"><div tabindex="0" role="slider" aria-label="${esc(l)}的图形高度" aria-valuemin="0" aria-valuemax="12" aria-valuenow="${m.counts[i]}" class="column-bar" data-bar="${i}" style="height:${m.counts[i]*18}px"><span class="column-value">${m.counts[i]}</span></div><span class="column-label">${esc(l)}</span></div>`).join('')}</div>${t.axes?`<div class="note-line">横轴：${m.xLabel==='category'?'类别':m.xLabel==='count'?'票数':'待标注'}</div>`:''}`;
 if(mode==='picture')return `<div class="picture-chart" aria-label="一颗圆点代表一票">${t.labels.map((l,i)=>`<div class="picture-row" data-picture="${i}"><span>${esc(l)}</span><div class="cards">${Array.from({length:m.counts[i]},()=>'<i class="picture-dot" aria-hidden="true"></i>').join('')}</div></div>`).join('')}<div class="note-line">● = 一票</div></div>`;
 return `<table class="edit-table"><thead><tr><th>类别</th><th>${mode==='tally'?'一笔一票':'次数'}</th></tr></thead><tbody>${t.labels.map((l,i)=>`<tr><td>${esc(l)}</td><td data-tally="${i}" class="${mode==='tally'?'tallies':''}">${mode==='tally'?tally(m.counts[i]):m.counts[i]}</td></tr>`).join('')}</tbody></table>`;}
function countControls(t,m){return `<div class="count-controls">${t.labels.map((l,i)=>`<div class="edit-row"><span>${esc(l)}</span>${btn('count','−',`data-row="${i}" data-delta="-1" aria-label="${esc(l)}少一票"`)}<output data-count="${i}">${m.counts[i]}</output>${btn('count','+',`data-row="${i}" data-delta="1" aria-label="${esc(l)}多一票"`)}</div>`).join('')}</div>`;}
function widgets(t,m){if(isExtra(t))return renderExtra(t,m);switch(t.type){
 case 'partition':{const widths=[0,...m.cuts,100];return `<div class="unit-label">整块表示 1 · 拖动切口，再点选想取的部分</div><div class="bar ${t.shape==='square'?'square':''}">${widths.slice(1).map((x,i)=>`<button class="part ${m.selected.includes(i)?'on':''}" data-do="part" data-index="${i}" style="width:${x-widths[i]}%" aria-label="第 ${i+1} 份" aria-pressed="${m.selected.includes(i)}"></button>`).join('')}${m.cuts.map((x,i)=>`<button class="cut" role="slider" data-cut="${i}" aria-label="分割线 ${i+1}" aria-valuemin="1" aria-valuemax="99" aria-valuenow="${x}" style="left:${x}%"></button>`).join('')}</div><div class="note-line">按方向键也可以移动选中的切口。${btn('equal','帮我均分')}</div>`;}
 case 'equivalent':return `<div class="unit-label">每条都表示同一个整体。点小块，改变有颜色的长度。</div>${m.rows.map((r,i)=>`<div class="equiv-row"><span>${i+1} 号纸带</span><div class="eq-bar">${Array.from({length:r.d},(_,j)=>`<button type="button" data-do="row-part" data-row="${i}" data-index="${j}" class="${j<r.n?'on':''}" aria-pressed="${j<r.n}" title="点击取 ${j+1} 份" aria-label="第 ${i+1} 条纸带，点击取 ${j+1} 份"></button>`).join('')}</div><span class="eq-label" data-eq-label="${i}">${r.n}/${r.d}</span></div>`).join('')}`;
 case 'grid':return `<div class="grid-layout"><div><div class="unit-label">整片表示 1 · 100 个一样大的格子</div><div class="hundred">${Array.from({length:100},(_,i)=>`<button class="${m.selected.includes(i)?'on':''}" data-do="cell" data-index="${i}" aria-label="百格 ${i+1}" aria-pressed="${m.selected.includes(i)}"></button>`).join('')}</div></div><div class="grid-note"><p>已经涂了 <output id="grid-count">${m.selected.length}</output> 格</p>${btn('row-fill','再涂一行')}${btn('grid-clear','清空涂色')}${entry('decimal','小数名字',m.decimal)}${t.reverse?entry('fraction','写成百分之几（只填数字）',m.fraction):''}<div class="muted">可以点一下格子，再点取消。</div></div></div>`;
 case 'line':return `<svg class="axis-line" viewBox="0 0 600 140" aria-label="上下两个相同的零到一数轴"><line x1="30" y1="30" x2="570" y2="30"/><line class="amount" x1="30" y1="30" x2="${30+540*t.n/t.d}" y2="30"/><text x="24" y="15">0</text><text x="565" y="15">1</text><text x="${30+540*t.n/t.d}" y="15" text-anchor="middle">${t.n}/${t.d}</text><line x1="30" y1="100" x2="570" y2="100"/>${Array.from({length:t.den+1},(_,i)=>{const x=30+540*i/t.den;return `<line x1="${x}" y1="95" x2="${x}" y2="106"/>`;}).join('')}<circle id="line-point" cx="${30+540*m.mark/t.den}" cy="100" r="8"/><text x="24" y="130">0</text><text x="565" y="130">1</text></svg><label class="field">移动下面的点<input type="range" min="0" max="${t.den}" step="1" data-field="mark" value="${m.mark}" aria-label="数轴上的点"><output id="line-label">${m.mark}/${t.den}${t.den===100?' = '+(m.mark/100):''}</output></label>`;
 case 'match':return `<div class="cups">${t.fractions.map(([n,d],i)=>`<div class="cup-wrap"><span>倒入 ${n}/${d} 杯</span><div class="cup" aria-label="第 ${i+1} 杯"><div class="liquid" data-liquid="${i}" style="height:${m.heights[i]}%"></div></div><input type="range" min="0" max="100" step="5" value="${m.heights[i]}" data-height="${i}" aria-label="第 ${i+1} 杯的量"><label class="field">小数<input type="text" maxlength="40" data-name="${i}" value="${esc(m.names[i])}" aria-label="第 ${i+1} 杯的小数名字"></label></div>`).join('')}</div>`;
 case 'fill':case 'unit':case 'cube-plan':case 'irregular':case 'decompose':{let form='';
 if(t.type==='fill')form=`${btn('fill-next','＋ 放一块')}${num('total','一共几立方厘米',m.total)}`;
 if(t.type==='unit')form=`<div class="choice-line">铺表面 ${['square','cube'].map(k=>btn('unit',k==='square'?'▧ 小方片':'▣ 小方块',`data-field="surface" data-value="${k}" aria-pressed="${m.surface===k}"`)).join('')}</div><div class="choice-line">填内部 ${['square','cube'].map(k=>btn('unit',k==='square'?'▧ 小方片':'▣ 小方块',`data-field="inside" data-value="${k}" aria-pressed="${m.inside===k}"`)).join('')}</div>${num('total','填满需要几块',m.total)}`;
 if(t.type==='cube-plan'&&a.view==='play')form=`<div class="choice-line">${['长','宽','层数'].map((l,i)=>`<label class="field">${l} <input type="range" min="1" max="5" value="${t.dims[i]}" data-dimension="${i}" aria-label="改变${l}"><output>${t.dims[i]}</output></label>`).join('')}</div><div class="equation">一层 ${t.dims[0]*t.dims[1]} 块 × ${t.dims[2]} 层 = ${voxels(t).length} 块</div>`;
 if(t.type==='cube-plan'&&a.view!=='play')form=`${t.estimate?num('estimate','先估大约几块',m.estimate,m.filled?.length?'disabled':''):''}${t.build?btn('fill-next','＋ 放一块')+`<span class="muted" id="filled-count"> 已放 ${m.filled?.length||0} 块</span>`:''}<div class="equation">${[['perLayer','每层几块'],['layers','共有几层'],['total','一共几立方厘米']].map(([k,l],i)=>`${i?'<span>'+ (i===1?'×':'=')+'</span>':''}<label>${l}<input type="number" min="0" max="999" data-field="${k}" aria-label="${l}" value="${m[k]??''}"></label>`).join('')}</div>`;
 if(t.type==='irregular')form=`<div class="choice-line">${btn('method','直接乘三个边长',`data-value="formula" aria-pressed="${m.method==='formula'}"`)}${btn('method','数实际积木／整箱减缺块',`data-value="count" aria-pressed="${m.method==='count'}"`)}</div>${num('total','实际几立方厘米',m.total)}`;
 if(t.type==='decompose')form=`<div class="choice-line"><label>切的方向 <select data-field="axis" aria-label="切的方向">${[['y','横着切'],['x','左右切'],['z','前后切']].map(([v,l])=>`<option value="${v}" ${m.axis===v?'selected':''}>${l}</option>`).join('')}</select></label><label>切的位置 <input type="range" min="1" max="${Math.max(...t.dims)-1}" value="${m.cut}" data-field="cut" aria-label="切的位置"></label><output id="cut-label">第 ${m.cut} 层边界</output></div><div class="equation">${[['first','第一部分'],['second','第二部分'],['total','合起来']].map(([k,l],i)=>`${i?'<span>'+ (i===1?'+':'=')+'</span>':''}<label>${l}<input type="number" min="0" max="999" data-field="${k}" aria-label="${l}" value="${m[k]??''}"></label>`).join('')}</div>`;
 return `<div class="cube-world" id="cube-world"></div><div class="cube-toolbar">${btn('turn','↻ 转一转',t.staticView&&!spread?'disabled':'')}${btn('spread',spread?'▤ 合起来':'▤ 拆开看')}${t.type==='fill'?'':`<span class="muted">底面 ${t.dims[0]} × ${t.dims[1]} · 高 ${t.dims[2]} · 小方块边长 1 cm</span>`}</div><div class="cube-form">${form}</div>`;}
 case 'survey':return `<div class="data-world"><div class="source-data"><div class="unit-label">模拟观察 · ${esc(t.question)}</div><div class="observe-card"><small>${m.seen?`第 ${m.seen} / ${t.order.length} 条`:'先观察，再记录'}</small>${m.seen?esc(t.labels[t.order[m.seen-1]]):'？'}</div>${btn('observe',m.seen===t.order.length?'观察完了':'看下一条',m.seen===t.order.length?'disabled':'',true)}<details><summary>回看已观察的记录</summary><div class="cards">${t.order.slice(0,m.seen).map((j,i)=>`<span class="data-card">${i+1} · ${esc(t.labels[j])}</span>`).join('')}</div></details></div><div><div class="unit-label">两列表格 · 一条记录只记一次</div><table class="edit-table"><thead><tr><th>类别</th><th>记录与合计</th></tr></thead><tbody>${t.labels.map((l,i)=>`<tr><td>${esc(l)}</td><td><div class="tallies" data-survey-tally="${i}" aria-label="${esc(l)}的计数笔画">${tally(m.counts[i])}</div>${btn('count','−',`data-row="${i}" data-delta="-1" aria-label="${esc(l)}少记一笔"`)}${btn('count','＋ 记一笔',`data-row="${i}" data-delta="1" aria-label="${esc(l)}记一笔"`)} <input type="number" min="0" max="20" value="${m.counts[i]}" data-count-input="${i}" aria-label="${esc(l)}的次数" style="width:70px"></td></tr>`).join('')}</tbody></table><label class="field">出现最多的是 <select data-field="choice" aria-label="出现最多的类别"><option value="">选择一类</option>${t.labels.map((l,i)=>`<option value="${i}" ${m.choice===i?'selected':''}>${esc(l)}</option>`).join('')}</select></label>${btn('csv','↓ 保存这张表')}</div></div>`;
 case 'chart':case 'compare':{const currentView=view||t.view;return `<div class="data-world">${sourceData(t)}<div><div id="editable-chart">${chartHTML(t,m,currentView)}</div>${countControls(t,m)}</div></div><div class="view-switch">${[['tally','计数表'],['picture','圆点图'],['bar','条形图'],['block','块状图'],['table','数字表']].map(([v,l])=>btn('view',l,`data-value="${v}" aria-pressed="${v===currentView}"`)).join('')}</div>${t.axes?`<div class="choice-line"><label>横着表示 <select data-field="xLabel" aria-label="横轴表示"><option value="">选一个</option><option value="category" ${m.xLabel==='category'?'selected':''}>不同类别</option><option value="count" ${m.xLabel==='count'?'selected':''}>票数</option></select></label><label>竖着表示 <select data-field="yLabel" aria-label="纵轴表示"><option value="">选一个</option><option value="category" ${m.yLabel==='category'?'selected':''}>不同类别</option><option value="count" ${m.yLabel==='count'?'selected':''}>票数</option></select></label></div>`:''}${t.type==='compare'?`<div class="choice-line">${num('left',`左边的${t.labels[t.target]}有几票`,m.left)}${num('right',`右边的${t.labels[t.target]}有几票`,m.right)}</div><label class="field">你更想用哪种看 <select data-field="preferred" aria-label="选择喜欢的画法"><option value="">自己选择</option>${[['table','表格'],['picture','圆点图'],['bar','条形图'],['list','列表']].map(([v,l])=>`<option value="${v}" ${m.preferred===v?'selected':''}>${l}</option>`).join('')}</select></label><label class="field">为什么（可选）<input type="text" class="text-wide" maxlength="2000" data-field="reason" value="${esc(m.reason)}"></label>`:num('answer',t.difference?`${t.labels[t.difference[0]]}比${t.labels[t.difference[1]]}多几票`:`${t.labels[t.target]}有几票`,m.answer)}`;}
 default:return '';}}
function nextLearningLesson(){
 const route=sessionRoute(id),current=BRIDGES[id]?.to||id;
 return nextRouteLessonId(route,current,lid=>lessonSummary(sessionRecord(all,lid)).completed);
}
function nextLinkedPractice(){
 if(nextLearningLesson())return null;
 return nextRelatedPractice(id,atlas,bid=>lessonSummary(sessionRecord(all,bid)).completed);
}
function showNoteSaveFailure(){
 const notice=$('#note-save-status');
 if(!notice)return;
 notice.hidden=false;
 notice.dataset.state='error';
 notice.textContent='尚未保存成功。输入的文字还在，请查看存储提示，解决后再试。';
 notice.scrollIntoView({block:'nearest'});
}
// A single action bar follows the current work in every stage. Only the
// meaning of its primary action changes; activity tools stay in #work.
function continuationDestination(){
 const next=nextLearningLesson(),bridge=next?null:nextLinkedPractice();
 if(next)return {action:'lesson',label:'继续学习：'+LESSONS[next].title+' →',attrs:'data-id="'+esc(next)+'"'};
 if(bridge)return {action:'lesson',label:'继续探索：'+bridge.title+' →',attrs:'data-id="'+esc(bridge.id)+'"'};
 return {action:'back',label:'返回知识空间 →'};
}
function renderTaskActions(checked=currentSubmission(a)){
 const stage=learningStage(a,checked),p03=isP03();
  const focus=studyActionFocus({stage,task:task(),model:model(),p03Ready:!p03||p03Stage(task(),model()).ready});
 const plan=learningActionPlan({
   stage,hasNextTask:a.index<sessionTasks(id).length-1,p03,
   readyToCheck:focus.readyToCheck
 });
 const buttonFor=(spec,primary=false)=>btn(spec.action,esc(spec.label),
   (spec.disabled?'disabled ':'')+(spec.attrs||''),primary);
 $('#actions').innerHTML=buttonFor(plan.primary,focus.kind!=='widget')+plan.secondary.map(spec=>buttonFor(spec)).join('');
 $('#actions').dataset.actionStage=stage;
 return plan;
}
function renderSummaryActions(hasDraft=!!a.draft?.trim()){
 const plan=learningActionPlan({stage:'reflect',hasDraft,destination:continuationDestination()});
 $('#actions').innerHTML=btn('save-note','保存我的发现',hasDraft?'':'hidden disabled',hasDraft)+
   btn(plan.destination.action,esc(plan.destination.label),
     (plan.destination.attrs||'')+' data-primary-destination="true"',!hasDraft);
 $('#actions').dataset.actionStage='reflect';
}
function syncReflectionPrimary(){
 const notice=$('#note-save-status');
 if(a.view!=='summary'){if(notice)notice.hidden=true;return;}
 const hasText=!!$('#note')?.value.trim();
 const save=$('#actions [data-do="save-note"]'),destination=$('#actions [data-primary-destination]');
 if(save){save.disabled=!hasText;save.hidden=!hasText;save.classList.toggle('primary',hasText);}
 if(destination)destination.classList.toggle('primary',!hasText);
 const cue=$('#action-cue');if(cue)cue.textContent=executionCue({stage:'reflect',hasDraft:hasText});
 if(notice){
  notice.hidden=!hasText&&!a.notes.length&&!savedNoteFeedback;
  notice.textContent=hasText?'文字草稿已保留；点击「保存我的发现」才会加入学习记录。':
   savedNoteFeedback||(a.notes.length?`已保存 ${a.notes.length} 条发现（文字解释待确认）。`:'');
  notice.dataset.state=hasText?'draft':'saved';
 }
}
function syncLearningRegions(){
 const status=currentSubmission(a),stage=learningStage(a,status);
 const scene=$('#scene');scene.dataset.stage=stage;
 const support=$('#learning-support');
 if(support&&support.dataset.session!==id){support.open=false;support.dataset.session=id;}
 const phase=learningActionPlan({stage}).step;
 $('#steps').innerHTML=LEARNING_STEPS.map(step=>'<li data-study-step="'+step.id+'"'+(step.id===phase?' aria-current="step"':'')+'>'+esc(step.label)+'</li>').join('');
 $('#interaction-title').textContent=stage==='reflect'?'我的发现（可选）':'动手探索';
 $('#learning-problem .learning-region-title').textContent=stage==='reflect'?'先想一想':'要解决的问题';
 $('#learning-next .learning-region-title').textContent=stage==='reflect'?'想再看看（可选）':stage==='explore'?'其他探索（可选）':'发现与继续';
 $('#check-title').textContent='检查与反馈';
 const activeTask=a.view==='summary'?null:task();
 const focus=studyActionFocus({stage,task:activeTask,model:stage==='reflect'?null:model(),p03Ready:stage==='reflect'||!isP03()||p03Stage(activeTask,model()).ready});
 $('#work').querySelectorAll('[data-study-primary]').forEach(el=>{el.classList.remove('study-primary','primary');el.removeAttribute('data-study-primary');});
 const widgetAction=focus.selector?$('#work').querySelector(focus.selector):null;
 if(widgetAction){widgetAction.classList.add('study-primary','primary');widgetAction.setAttribute('data-study-primary','true');}
 $('#scene').dataset.actionFocus=widgetAction?'widget':focus.kind;
 const repair=a.view==='task'?correctionGuidance({task:activeTask,model:model(),checked:status}):null;
 const cue=$('#action-cue');
 const currentHelp=focus.cue||executionCue({stage,task:activeTask,bridge:!!BRIDGES[id],hasDraft:!!a.draft?.trim(),readyToCheck:focus.readyToCheck,repair});
 cue.textContent=currentHelp;cue.hidden=!currentHelp;
 $('#work').dataset.taskType=activeTask?.type||'reflection';
 $('#interaction-title').textContent=activityTitle({stage,task:activeTask,bridge:!!BRIDGES[id]});
  $('#next-guidance').hidden=stage==='reflect'||stage==='explore';
  $('#next-guidance').textContent=repair?'先按上方具体指导修改，再检查；本题通过后进入下一题。':stage==='passed'&&task().type==='match'?'本题检查通过。任选一杯说明分数、小数与水位为什么对应，再点击「整理这次发现」。':stageGuidance(stage,{hasNext:a.index<sessionTasks(id).length-1,hasFollowingLesson:!!nextLearningLesson(),hasRelatedPractice:!!nextLinkedPractice()});
 const box=$('#math-explanation');
 const last=a.cases?.[a.index]?.attempts?.at(-1)?.value;
 const detail=a.view==='summary'?null:checkedMathExplanation({id,task:task(),model:last,checked:status});
 box.hidden=!detail;
 $('#learning-check').hidden=stage==='reflect'||(!detail&&$('#check-feedback').hidden&&stage!=='recheck');
 box.innerHTML=detail?'<h3>'+esc(detail.title)+'</h3><p class="math-equation">'+esc(detail.equation)+'</p><p>'+esc(detail.explanation)+'</p><p class="math-question">'+esc(detail.question)+'</p>'+(detail.method?'<p class="math-method" data-thinking-node-id="'+esc(detail.method.nodeId)+'"><strong>相关数学思维 · '+esc(detail.method.label)+'</strong><small>对应来源 '+esc(detail.method.code)+'；只描述本次作品，不能据此判断你已掌握。</small></p>':'')+'<small>'+(detail.kind==='correct'?'这次检查验证了作品中的数学对应关系，你的自由解释仍待确认。':'请按提示修改并重新检查；旧结果不代表修改后的作品。')+'</small>':'';
 syncReflectionPrimary();
}
// Preserve the same static region order for every mathematical activity.
// Only the save-status message is moved next to the learner's own note.
function alignLearningLayout(){
 const notice=$('#note-save-status'),actions=$('#actions');
 if(notice?.parentElement?.id==='work')actions.after(notice);
}
function render(){$('[data-do="question"]').disabled=blocked;cleanupB06?.();cleanupB06=null;const writingOpen=$('.b6-writing')?.open;const accessOpen=$('.x-access')?.open;const edgeListOpen=$('.g23-edge-list')?.open;const lesson=sessionMeta(id),route=sessionRoute(id),summary=lessonSummary(a),p03=isP03(),checked=currentSubmission(a),readyToContinue=a.view==='task'&&summary.cases[a.index]?.complete&&checked.status==='correct';document.body.classList.toggle('p03-focus',p03);document.body.classList.toggle('embedded-learning',parent!==window);renderQuestion();$('#learning-next > #system-explanation')?.remove();alignLearningLayout();$('#route-title').textContent=route.title;$('#status').textContent=p03?(summary.completed?'三项已完成':`任务 ${a.index+1} / ${sessionTasks(id).length}`):a.view==='summary'?'操作检查已通过':`任务 ${a.index+1} / ${sessionTasks(id).length}`;$('#route').innerHTML=route.ids.map((lid,i)=>`<button data-do="lesson" data-id="${lid}" ${lid===(BRIDGES[id]?.to||id)?'aria-current="step"':''}><small>${route.id}–0${i+1} ${nodeState(all,LESSONS[lid].topicId).progress==='completed'?'✓':''}</small>${LESSONS[lid].title}</button>`).join('');$('#title').textContent=lesson.title;$('#learning-goal').textContent=lesson.formal;
 if(a.view==='summary'){$('#check-feedback').hidden=true;$('#instruction').textContent=p03?'怎样数才能不漏也不重复？':'你有什么发现？能说说为什么吗？';$('#work').innerHTML=`<div class="summary-art"><div class="seal">✓</div><div><h2>这组操作已通过检查</h2><p>${summary.done} / ${summary.total} 项检查通过。这是作品结果，不代表文字解释已经核验。</p></div></div><label class="field" for="note">${esc(REFLECTIONS[id]||'写下你刚才的发现。')}（可选）</label><p class="reflection-optional">可以用自己的话写一句，也可以不写，直接继续探索。</p><textarea id="note" maxlength="2000" placeholder="写下你的解释（可选，不必照抄问题）">${esc(a.draft)}</textarea>${a.notes.length?`<div class="saved-note-preview"><strong>已保存的发现（文字解释待确认）</strong><p>${esc(a.notes.at(-1).text)}</p></div>`:''}<details id="system-explanation" class="system-explanation"><summary>查看系统的数学说明（可选）</summary><div class="system-explanation-body"><p>${esc(lesson.summary)}</p>${id==='quarters'&&summary.completed?'<div class="summary-thinking" data-thinking-node-id="mt_EBYGhd8X3x"><strong>已检查作品中的思考方法：连接不同表示方式</strong><p>你用百格、杯子里的水位、分数与小数表示了对应的比例。哪一种表示最容易帮你核对？</p><small>这是作品线索，不是你已掌握该方法的结论。</small></div>':''}<small>以上是系统的数学说明，不等于你已经独立解释了原因。</small></div></details><details id="source-goals-details"><summary>课程来源资料（参考）</summary><ul id="source-goals">${atlas.nodes.find(n=>n.id===lesson.topicId).evidence.map(e=>`<li>${esc(e)}</li>`).join('')}</ul></details>`;$('#note').after($('#note-save-status'));renderSummaryActions();if(cube){cube.destroy();cube=null;cubeKey='';}}
 else{const t=task(),m=model();$('#instruction').textContent=p03?P03_NAMES[a.index]:t.prompt;const checkFeedback=$('#check-feedback');if(checkFeedback){const message=checked.status==='correct'&&t.type==='match'?'三个杯子的水位、分数与小数都对应上了。':feedback||(checked.status==='modified'?'已修改，尚未重新检查。上次结果保留在历史记录中。':checked.result?.feedback||'');checkFeedback.hidden=!message;checkFeedback.textContent=message;const repair=correctionGuidance({task:t,model:m,checked});if(repair&&message){checkFeedback.insertAdjacentHTML('beforeend',`<div class="feedback-next" aria-label="下一步操作"><strong>${esc(repair.title)}</strong><p>${esc(repair.observation)}</p><p>${esc(repair.action)}</p><small>${esc(repair.method)}</small></div>`);}checkFeedback.dataset.state=feedback&&checked.status==='modified'?'guidance':checked.status==='correct'?'correct':checked.status==='revise'?'revise':'guidance';}const p03Info=p03?p03Stage(t,m):null;$('#work').innerHTML=p03?`<section class="p03-task" data-phase="${p03Info.phase}" aria-label="当前任务"><div class="p03-guidance"><span class="p03-step-label">现在做什么 · ${a.index+1} / 3</span><p id="p03-guidance" role="status">${esc(p03Info.instruction)}</p></div>${feedback?`<p class="p03-feedback" role="alert">${esc(feedback)}</p>`:''}${widgets(t,m)}</section>`:widgets(t,m);const guide=thinkingGuide(t,{sessionId:id,index:a.index});
  if(guide)$('#work').insertAdjacentHTML('afterbegin',`<details id="thinking-guide" class="thinking-guide"><summary>${esc(guide.summary)}</summary><p>${esc(guide.question)}</p><small>这只是可选的思考问题。你可以不打开，照常操作和检查；打开也不代表已经掌握。</small></details>`);

  const thought=a.view==='task'&&thinkingFeedback(t,m,a.cases[a.index],{sessionId:id,index:a.index});if(thought)$('#work').insertAdjacentHTML('beforeend',`<aside id="thinking-feedback" aria-label="刚才的办法"><strong>${esc(thought.title)}</strong><p>${esc(thought.observation)}</p><p>${esc(thought.connection)}</p>${thought.detail.length?`<small>${thought.detail.map(esc).join(' ')}</small>`:''}${thought.method?`<p class="source-thinking" data-thinking-node-id="${esc(thought.method.nodeId)}">相关数学思维 · ${esc(thought.method.label)}（${esc(thought.method.code)}）<small>与 50 个来源思维节点中的一个关联；仅记录本次作品线索，不代表已掌握。</small></p>`:''}</aside>`);renderTaskActions(checked);
 if(t.dims){const key=id+':'+(a.view==='play'?-1:a.index)+':'+t.dims.join(',');if(cube&&cubeKey!==key){cube.destroy();cube=null;}if(!cube){cube=new CubeView($('#cube-world'),t,placeCube);cubeKey=key;cube.restoreCamera(a.ui?.camera);cube.controls.addEventListener('end',()=>update(()=>{}));}else cube.attach($('#cube-world'));cube.update(m,{spread});}else if(cube){cube.destroy();cube=null;cubeKey='';}}
 if(a.view!=='summary'&&(['x-solid','x-net','x-s23-frame'].includes(task().type)||task().type.startsWith('x-g27-')||task().type==='x-a30-solid'||task().type==='x-m31-cubes'||task().type==='x-m31-product'||task().type==='x-p34-growth'||task().type==='x-powerbuild'&&task().pow===3)){const key=id+':'+a.view+':'+a.index;if(extraLab&&extraKey!==key){extraLab.destroy();extraLab=null;}if(!extraLab){const patternGrowth=task().type==='x-p34-growth',power=task().type==='x-powerbuild',frame=task().type==='x-s23-frame',space=task().type.startsWith('x-g27-'),fractionCube=task().type==='x-m31-cubes',fractionProduct=task().type==='x-m31-product',areaSolid=task().type==='x-a30-solid'||fractionProduct;extraLab=new (patternGrowth?PatternGrowthView:fractionCube?FractionCubeView:areaSolid?AreaSolidLab:space?SpaceLab:frame?FrameView:power?PowerView:SolidView)($('#extra-world'),task(),i=>fractionProduct?null:edit(m=>actExtra(task(),m,patternGrowth?'p34-fill':fractionCube?'m31-fill':areaSolid?'a30-face':space?'g27-probe':frame?'g23-stick':power?'power-cell':'solid-mark',space?{}:{index:i}),{renderNow:true}),()=>patternGrowth?edit(m=>actExtra(task(),m,'p34-turn'),{renderNow:true}):fractionCube||fractionProduct?edit(m=>actExtra(task(),m,'m31-turn'),{renderNow:true}):areaSolid?edit(m=>actExtra(task(),m,'a30-turn'),{renderNow:true}):space?edit(m=>actExtra(task(),m,'g27-turn'),{renderNow:true}):frame?edit(m=>actExtra(task(),m,'g23-turn'),{renderNow:true}):update(()=>{}));extraKey=key;if(!space||model()?.board?.turned)extraLab.restoreCamera(a.ui?.camera);}else extraLab.attach($('#extra-world'));extraLab.update(model());}else if(extraLab){extraLab.destroy();extraLab=null;extraKey='';}if(accessOpen&&$('.x-access'))$('.x-access').open=true;if(edgeListOpen&&$('.g23-edge-list'))$('.g23-edge-list').open=true;
 if(a.view!=='summary'&&B06_TYPES.has(task().type)){cleanupB06=mountB06($('#work'),task(),model,{mutate:(act,data={},renderNow=true)=>edit(m=>actExtra(task(),m,act,data),{renderNow}),saveInk:stroke=>edit(m=>m.ink.push(stroke)),help:()=>{if(a.view==='task')update(r=>supportLesson(r));}});if(writingOpen&&$('.b6-writing'))$('.b6-writing').open=true;}
 $('#record-body').innerHTML=`<p>任务 ${summary.done} / ${summary.total} 完成。${summary.independent?'这次有未借助提示的操作证据。':'尝试、提示和修正会保留。'}文字解释保留待确认。</p>${Object.entries(a.cases).map(([i,r])=>`<p>任务 ${Number(i)+1}：${r.attempts.length} 次提交；${r.support?'看过支持':'未主动看支持'}。${r.attempts.map((e,j)=>`第 ${j+1} 次${inspect(sessionTasks(id)[i],e.value).correct?'成立':'需修改'}${e.exposed?'（看过本题反馈）':''}`).join('；')}</p>`).join('')}${a.notes.map(n=>`<p>我的发现（待确认）：${esc(n.text)}</p>`).join('')}`;
 renderP3Flow($('#p3-learning-flow'),{atlas,id,record:a,embedded:parent!==window,primarySessionId:a.view==='summary'?(nextLearningLesson()||nextLinkedPractice()?.id):null});
 if(a.view==='summary'){
  const explanation=$('#system-explanation'),source=$('#source-goals-details');
  if(explanation)$('#learning-support').before(explanation);
  if(source)$('#record-body').append(source);
 }
  syncLearningRegions();
  $('#record').hidden=!Object.values(a.cases).some(r=>r.support||r.attempts?.length)&&!a.notes.length&&!a.draft.trim();
  if(parent!==window)$('#record-body').insertAdjacentHTML('beforeend',btn('relations','看看空间里的联系'));
 if(a.view!=='summary')syncB13Controls(task(),model(),$('#work'));
 document.querySelectorAll('button[aria-pressed]').forEach(b=>b.classList.toggle('selected',b.getAttribute('aria-pressed')==='true'));
}
function practiceMessage(t,m){
 if(t.type==='partition'){const sizes=[0,...m.cuts,100],equal=sizes.slice(1).every((x,i)=>Math.abs(x-sizes[i]-100/t.d)<.01);return equal?`每份现在一样大。选了 ${m.selected.length} 份，就是 ${m.selected.length}/${t.d}。`:'每块的大小还不同。先让各份一样大，再用份数比较。';}
 if(t.type==='equivalent')return m.rows.every(r=>r.n/r.d===.5)?'三种写法的末端对齐了：同一个半份，分法可以不同。':'观察每条涂色的长度。取的小块数和一共分几块，要一起看。';
 if(t.type==='grid')return `涂了 ${m.selected.length} 个百分格，也就是 ${m.selected.length}/100 = ${(m.selected.length/100).toFixed(2)}。再加一行会怎样？`;
 if(t.type==='fill')return `已放 ${m.filled.length} 块。小方块填的是里面的空间；转一转，看背后有没有空位。`;
 if(t.type==='cube-plan')return spread?`每层 ${t.dims[0]*t.dims[1]} 块，共 ${t.dims[2]} 层，合起来 ${voxels(t).length} 块。被挡住的块也在层里面。`:'转动不会改变块数。把每层拆开，找一个不遗漏的数法。';
 if(t.type==='decompose')return '换一个切的方向，再把两部分拉开。颜色不同的两块合起来，仍是原来的台阶。';
 if(t.type==='survey')return m.seen?'现在看到了一个回答。把它记到对应的类别；记录总数应与观察过的人数一样。':t.prompt;
 if(t.counts)return '改变图里的数量，再对照左边的记录。换画法时，同一类的票数应保持。';
 return t.prompt;
}
function syncSubmissionUI(){
 if(a.view!=='task')return;
 const state=currentSubmission(a);
 renderTaskActions(state);
 if(state.status==='modified'){
  const box=$('#check-feedback');
  if(box){box.hidden=false;box.dataset.state='guidance';box.textContent='已修改，尚未重新检查。上次结果保留在历史记录中。';}
 }
 syncLearningRegions();
}

function sync(){const t=task(),m=model();if(isExtra(t)){if($('.m28-success')&&!inspect(t,m).correct)$('.m28-success').remove();syncB13Controls(t,m,$('#work'));syncB20Controls(t,m,$('#work'));if($('#extra-visual')&&t.type!=='x-countboard')$('#extra-visual').innerHTML=visualExtra(t,m);if(t.type==='x-s23-frame'&&extraLab)extraLab.attach($('#extra-world'));extraLab?.update(m);document.querySelectorAll('[data-xvalue]').forEach(el=>el.textContent=el.dataset.xvalue.split('.').reduce((v,k)=>v?.[k],m));const estimate=$('[data-x="estimate"]');if(estimate)estimate.disabled=m.guess===null||m.prediction!==null;document.querySelectorAll('[data-xfield^="pair."]').forEach(el=>el.disabled=m.fold>0);if(task().type==='x-grow'&&task().towers){document.querySelectorAll('[data-xfield^="heights."]').forEach(el=>el.disabled=m.prediction===null);const prediction=$('[data-xfield="prediction"]');if(prediction)prediction.disabled=m.committed!==null;}$('#instruction').textContent=isP03()?P03_NAMES[a.index]:t.prompt;syncP03(t,m);syncSubmissionUI();return;}if(t.type==='equivalent')document.querySelectorAll('.eq-bar button').forEach(el=>el.setAttribute('aria-pressed',String(+el.dataset.index<m.rows[+el.dataset.row].n)));if($('#grid-count'))$('#grid-count').textContent=m.selected.length;document.querySelectorAll('.hundred button').forEach((el,i)=>{el.classList.toggle('on',m.selected.includes(i));el.setAttribute('aria-pressed',String(m.selected.includes(i)));});if(t.type==='partition'){const xs=[0,...m.cuts,100];document.querySelectorAll('.bar .part').forEach((el,i)=>el.style.width=(xs[i+1]-xs[i])+'%');document.querySelectorAll('[data-cut]').forEach((el,i)=>{el.style.left=m.cuts[i]+'%';el.setAttribute('aria-valuenow',m.cuts[i]);});}if(t.type==='line'){$('#line-point').setAttribute('cx',30+540*m.mark/t.den);$('#line-label').textContent=`${m.mark}/${t.den}`+(t.den===100?' = '+m.mark/100:'');}if(t.type==='match')document.querySelectorAll('[data-liquid]').forEach((el,i)=>el.style.height=m.heights[i]+'%');if(t.type==='decompose'&&$('#cut-label'))$('#cut-label').textContent=`第 ${m.cut} 层边界`;if($('#filled-count'))$('#filled-count').textContent=` 已放 ${m.filled?.length||0} 块`;if(t.build&&t.estimate&&$('[data-field="estimate"]'))$('[data-field="estimate"]').disabled=!!m.filled?.length;if(cube)cube.update(m,{spread});if($('#editable-chart')){$('#editable-chart').innerHTML=chartHTML(t,m,view||t.view);document.querySelectorAll('[data-count]').forEach(el=>el.textContent=m.counts[el.dataset.count]);}document.querySelectorAll('[data-survey-tally]').forEach(el=>el.innerHTML=tally(m.counts[el.dataset.surveyTally]));$('#instruction').textContent=t.prompt;syncSubmissionUI();}
function revealSupport(){if(a.view==='task')update(r=>supportLesson(r));const t=task();if(t.dims){spread=1;cube?.update(model(),{spread});feedback='看看每个完整的层或部分。包含挡住的积木，再回到自己的计划。';}else if(t.type==='partition'){edit(m=>m.cuts=Array.from({length:t.d-1},(_,i)=>(i+1)*100/t.d));feedback='现在每一份一样大了。再按需要的份数选择。';}else feedback=inspect(t,model()).feedback;if(inspect(t,model()).correct)feedback='试着用另一种画法或自己的话说明，为什么这个结果成立。';render();}
function placeCube(i){if(task().estimate&&model().estimate===null){feedback='先留下你的估计，再开始填。估计不用猜得刚好。';render();return;}edit(m=>{m.filled??=[];if(!m.filled.includes(i))m.filled.push(i);});}
async function openLesson(next,{keepQuestion=false}={}){
  if(!sessionMeta(next))next='share';
  const serial=++lessonOpenSerial,notice=$('#storage-warning');
  notice.hidden=false;notice.textContent='正在加载并验证学习任务…';
  try{
    const stored=readStored(KEY);
    if(stored)await prepareStateForValidation(JSON.parse(stored));
    await prepareSessionRuntime(next,{view:true});
  }catch(error){
    if(serial!==lessonOpenSerial)return;
    notice.textContent='任务加载失败，原记录未修改：'+error.message+' ';
    const retry=document.createElement('button');retry.type='button';retry.textContent='重新加载';
    retry.addEventListener('click',()=>openLesson(next,{keepQuestion}),{once:true});notice.append(retry);
    return;
  }
  if(serial!==lessonOpenSerial)return;
  notice.hidden=true;
  try{
    if(cube){cube.destroy();cube=null;cubeKey='';}
    if(!keepQuestion)questionId=null;
    if(extraLab){extraLab.destroy();extraLab=null;extraKey='';}
    id=next;feedback='';savedNoteFeedback='';
    all=read();a=sessionRecord(all,id)||freshLesson(id);
    view=a.ui?.view||null;spread=a.ui?.spread||0;
    const savedUI=structuredClone(a.ui);
    update(r=>{r.ui=savedUI;enterUnifiedTask(r);modelForLesson(r);});
    const routePanel=$('#route-collapsible');if(routePanel)routePanel.open=false;
    history.replaceState(null,'',location.pathname+(questionId?'?question='+encodeURIComponent(questionId):'')+'#'+id);
    $('#back').href='index.html#space/pack/'+sessionRoute(id).packIds[0];
    render();window.scrollTo(0,0);
  }catch(error){blocked=true;notice.hidden=false;notice.textContent='学习记录未通过完整验证，禁止覆盖：'+error.message;}
}

$('#lesson').addEventListener('click',e=>{const b=e.target.closest('[data-do]');if(!b)return;if(blocked){if(b.dataset.do==='save-note')showNoteSaveFailure();return;}const act=b.dataset.do;
 if(act==='question'){leaveQuestion();return;}if(act==='question-finish'||act==='question-later'){try{all=read();questionAction(all,questionId,act==='question-finish'?'finish':'later');writeStored(KEY,JSON.stringify(validate(all,atlas)));questionId=null;history.replaceState(null,'',location.pathname+'#'+id);notify('math-space:lesson-change',{id:BRIDGES[id]?.to||id,sessionId:id,questionId:null});renderQuestion();if(act==='question-later')back();}catch(error){$('#storage-warning').hidden=false;$('#storage-warning').textContent=error.message;}return;}
 if(act==='p3-related'){if(parent!==window)notify('math-space:lesson-show-node',{nodeId:b.dataset.node});else location.href='index.html#space/node/'+encodeURIComponent(b.dataset.node);return;}
  if(act==='p3-retry'){feedback='';spread=0;view=null;if(update(r=>{r.view='task';r.models[r.index]=defaultModel(taskFor(id,r.index));}))render();return;}
  if(act==='p3-variant'){const index=Number(b.dataset.index);if(!Number.isInteger(index)||index<0||index>=sessionTasks(id).length)return;feedback='';spread=0;view=null;if(update(r=>{r.index=index;r.view='task';modelForLesson(r);}))render();return;}
  if(act==='relations'){notify('math-space:lesson-relations');return;}if(act==='lesson'){openLesson(b.dataset.id);return;}if(act==='back'){back();return;}if(act==='restart'){feedback='';spread=0;view=null;if(update(r=>{r.view='task';r.index=Math.max(0,lessonSummary(r).cases.findIndex(x=>!x.complete));r.models[r.index]=defaultModel(taskFor(id,r.index));}))render();return;}
 if(act==='check'){let result;if(!update(r=>result=submitLesson(r)))return;feedback=result?.feedback||'';if(task().dims)spread=1;render();const target=result?.correct?$('#actions .primary'):$('#check-feedback');if(target&&!target.hidden)target.scrollIntoView({block:'nearest'});return;}
 if(act==='next'){if(!lessonSummary(a).cases[a.index].complete||currentSubmission(a).status!=='correct')return;feedback='';spread=0;view=null;update(r=>{if(r.index<sessionTasks(id).length-1){r.index++;if(['x-m31-cubes','x-m31-product','x-p34-growth'].includes(taskFor(id,r.index).type))r.ui.camera=null;}else if(lessonSummary(r).completed)r.view='summary';modelForLesson(r);});render();window.scrollTo(0,0);return;}
 if(act==='hint'||act==='equal'){revealSupport();return;}if(act==='save-note'){const note=$('#note')?.value.trim();if(!note)return;if(update(r=>addLessonNote(r,note))){savedNoteFeedback=nextLearningLesson()?'已保存这次发现（文字解释待确认），可继续学习下一处。':nextLinkedPractice()?'已保存这次发现（文字解释待确认），可以继续关联探索。':'已保存这次发现（文字解释待确认），可以返回知识空间。';render();$('#note-save-status')?.scrollIntoView({block:'nearest'});}else showNoteSaveFailure();return;}
 if(act==='fill-next'){const next=voxels(task()).findIndex((_,i)=>!(model().filled||[]).includes(i));if(next>=0)placeCube(next);return;}
 if(act==='turn'){cube?.turn();update(()=>{});return;}if(act==='spread'){if(!spread&&a.view==='task')update(r=>supportLesson(r));spread=spread?0:1;update(()=>{});render();return;}
 if(act==='view'){view=b.dataset.value;update(()=>{});render();return;}
 if(act==='csv'){const t=task(),m=model();const text='\uFEFF类别,次数\r\n'+t.labels.map((l,i)=>`"${l.replaceAll('"','""')}",${m.counts[i]}`).join('\r\n');const url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download='我的观察记录.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;}
 edit((m,r)=>{const i=Number(b.dataset.index),row=Number(b.dataset.row);if(act==='part'||act==='cell'){const array=m.selected,index=array.indexOf(i);if(index<0)array.push(i);else array.splice(index,1);}if(act==='row-part')m.rows[row].n=m.rows[row].n===i+1?0:i+1;
 if(act==='row-fill'){const missing=Array.from({length:100},(_,i)=>i).filter(i=>!m.selected.includes(i)).slice(0,10);m.selected.push(...missing);}if(act==='grid-clear')m.selected=[];
 if(act==='unit')m[b.dataset.field]=b.dataset.value;if(act==='method')m.method=b.dataset.value;
 if(act==='count')m.counts[row]=Math.max(0,Math.min(12,m.counts[row]+Number(b.dataset.delta)));if(act==='observe')m.seen=Math.min(task().order.length,m.seen+1);
 },{renderNow:!['cell','row-fill','grid-clear','fill-next'].includes(act)});
});
$('#lesson').addEventListener('input',e=>{const el=e.target;if(el.id==='note'){savedNoteFeedback='';if(update(r=>r.draft=el.value.slice(0,2000)))syncReflectionPrimary();else showNoteSaveFailure();return;}if(!el.matches('input,select')||el.dataset.xfield)return;
 if(el.hasAttribute('data-dimension')){const dims=[...task().dims];dims[+el.dataset.dimension]=+el.value;if(update(r=>modelForLesson(r).shape=dims)){cube?.destroy();cube=new CubeView($('#cube-world'),task(),placeCube);cubeKey=id+':-1:'+dims.join(',');cube.update(model(),{spread});el.nextElementSibling.textContent=el.value;$('.cube-form .equation').textContent=`一层 ${dims[0]*dims[1]} 块 × ${dims[2]} 层 = ${voxels(task()).length} 块`;feedback='';sync();}return;}
 edit(m=>{if(el.hasAttribute('data-height'))m.heights[+el.dataset.height]=+el.value;else if(el.hasAttribute('data-name'))m.names[+el.dataset.name]=el.value;else if(el.hasAttribute('data-count-input'))m.counts[+el.dataset.countInput]=Math.max(0,Math.min(20,Math.trunc(+el.value)));else if(el.dataset.field){const key=el.dataset.field;const numeric=el.type==='number'||el.type==='range'||key==='choice';m[key]=numeric?(el.value===''?null:Math.max(0,Math.min(999,Math.trunc(Number(el.value))))):el.value;}});
});
function setCut(i,pct){const m=model(),t=task();let x=Math.max(i?m.cuts[i-1]+.1:.1,Math.min(i===m.cuts.length-1?99.9:m.cuts[i+1]-.1,pct));const exact=(i+1)*100/t.d;if(Math.abs(x-exact)<2.4&&Math.abs(x-exact)<Math.abs(m.cuts[i]-exact))x=exact;edit(m=>m.cuts[i]=x);}
let drag=null;
$('#work').addEventListener('pointerdown',e=>{const cut=e.target.closest('[data-cut]'),bar=e.target.closest('[data-bar]');if(cut){e.preventDefault();const r=cut.parentElement.getBoundingClientRect();drag={kind:'cut',i:+cut.dataset.cut,rect:r};cut.setPointerCapture(e.pointerId);}else if(bar){e.preventDefault();const r=bar.closest('.chart').getBoundingClientRect();drag={kind:'bar',i:+bar.dataset.bar,rect:r};$('#work').setPointerCapture(e.pointerId);}});
$('#work').addEventListener('pointermove',e=>{if(!drag)return;if(drag.kind==='cut')setCut(drag.i,(e.clientX-drag.rect.left)/drag.rect.width*100);else{const i=drag.i,n=Math.max(0,Math.min(12,Math.round((drag.rect.bottom-e.clientY)/18)));edit(m=>m.counts[i]=n);}});
$('#work').addEventListener('pointerup',()=>drag=null);$('#work').addEventListener('pointercancel',()=>drag=null);
$('#work').addEventListener('keydown',e=>{const cut=e.target.closest('[data-cut]'),bar=e.target.closest('[data-bar]');if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key)||(!cut&&!bar))return;e.preventDefault();const delta=['ArrowRight','ArrowUp'].includes(e.key)?1:-1;if(cut){const i=+cut.dataset.cut;setCut(i,e.key==='Home'?1:e.key==='End'?99:model().cuts[i]+delta);}else{const i=+bar.dataset.bar;edit(m=>m.counts[i]=e.key==='Home'?0:e.key==='End'?12:Math.max(0,Math.min(12,m.counts[i]+delta)));}});
function back(){if(parent!==window)notify('math-space:lesson-close',{sessionId:id});else location.href=$('#back').href;}
$('#back').addEventListener('click',e=>{if(parent!==window){e.preventDefault();back();}});
window.addEventListener('hashchange',()=>openLesson(location.hash.slice(1)));
window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===parent&&e.data?.type==='math-space:request-question')leaveQuestion();});
window.addEventListener('pagehide',()=>{cube?.destroy();extraLab?.destroy();});
try{const r=await fetch('./data/atlas.json');if(!r.ok)throw new Error('地图暂时读不到');atlas=await r.json();await openLesson(location.hash.slice(1),{keepQuestion:true});window.mathLesson={snapshot:()=>({id,view:a.view,index:a.index,summary:lessonSummary(a),cube:cube?.snapshot()||null,extra:extraLab?.snapshot()||null})};}catch(error){blocked=true;$('#storage-warning').hidden=false;$('#storage-warning').textContent='活动暂时不能打开：'+error.message;}

$('#lesson').addEventListener('click',e=>{const el=e.target.closest('[data-x]');if(!el||blocked||a.view==='summary'||!isExtra(task()))return;const act=el.dataset.x;if(act==='b19-export'&&task().type==='x-datastudio'){const url=URL.createObjectURL(new Blob([dataCsv(task(),model())],{type:'text/csv;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download='模拟调查记录.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;}if(act==='p34-turn'){extraLab?.turn();edit(m=>actExtra(task(),m,'p34-turn'),{renderNow:true});return;}if(act==='turn-extra'){extraLab?.turn();if(task().type==='x-s23-frame')edit(m=>actExtra(task(),m,'g23-turn'),{renderNow:true});else if(task().type==='x-a30-solid')edit(m=>actExtra(task(),m,'a30-turn'),{renderNow:true});else if(['x-m31-cubes','x-m31-product'].includes(task().type))edit(m=>actExtra(task(),m,'m31-turn'),{renderNow:true});else if(task().type.startsWith('x-g27-'))edit(m=>actExtra(task(),m,'g27-turn'),{renderNow:true});else update(()=>{});return;}if(['fold','recall-help'].includes(act)&&a.view==='task')update(r=>supportLesson(r));edit((m,r)=>{actExtra(task(),m,act,el.dataset);if((act==='p24-predict'||act==='g25-guess')&&m.board?.first?.incorrectPrediction)supportLesson(r);if(act==='g26-help'||act==='g26-hyp'&&m.board?.first?.badHyp||act==='g26-ratio'&&m.board?.first?.badRatio)supportLesson(r);if((act==='g27-help'||m.board?.bad)&&act.startsWith('g27-'))supportLesson(r);if((act==='m28-help'||m.board?.bad)&&act.startsWith('m28-'))supportLesson(r);if(m.board?.bad&&act.startsWith('m29-'))supportLesson(r);if(m.board?.bad&&act.startsWith('a30-'))supportLesson(r);if(m.board?.bad&&act.startsWith('m31-'))supportLesson(r);if(m.board?.bad&&act.startsWith('t32-'))supportLesson(r);if(m.board?.bad&&act.startsWith('m33-'))supportLesson(r);if(m.board?.bad&&act.startsWith('p34-'))supportLesson(r);if(m.board?.bad&&act.startsWith('a35-'))supportLesson(r);if(m.board?.bad&&act.startsWith('f36-'))supportLesson(r);if(m.board?.bad&&act.startsWith('r37-'))supportLesson(r);if(act==='r38-test'&&(m.issue||m.board?.records?.length))supportLesson(r);if(act==='s39-run'||act==='s39-hop'||act==='s39-estimate'&&m.issue)supportLesson(r);if(act==='r37-save'&&['x-r37-pair','x-r37-shape'].includes(task().type)&&m.board?.records?.length)supportLesson(r);if(act==='r37-step'&&task().type==='x-r37-steps'&&m.board?.index>0&&m.board.index<task().steps.length)supportLesson(r);if(m.issue&&(act.startsWith('r37-')||act.startsWith('f36-')||act.startsWith('a35-')||act.startsWith('p34-')||act.startsWith('m33-')||act.startsWith('t32-')||act.startsWith('m31-')||act.startsWith('a30-')||act.startsWith('m29-')||act.startsWith('m28-')||act.startsWith('g27-')||act.startsWith('p24-')||act.startsWith('g25-')||act.startsWith('g26-')||act.startsWith('g23-')||act.startsWith('p22-')||act.startsWith('b21-')||act.startsWith('b20-')||act.startsWith('b19-')||act.startsWith('b18-')||act.startsWith('b17-')||act.startsWith('b16-')||act.startsWith('b15-')||act.startsWith('b14-')||act.startsWith('b13-')||act.startsWith('b12-')||act.startsWith('b11-')||['split-save','family-save','recall-save','ten-landmark','triple-save'].includes(act)))supportLesson(r);},{renderNow:true});});
$('#lesson').addEventListener('keydown',e=>{const el=e.target.closest('circle[data-x="a35-plot"],circle[data-x="f36-point"],circle[data-x="f36-select"],circle[data-x="f36-root"]');if(el&&['Enter',' '].includes(e.key)){e.preventDefault();el.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
$('#lesson').addEventListener('input',e=>{const el=e.target;if(!el.dataset.xfield||blocked||a.view==='summary'||!isExtra(task()))return;const key=el.dataset.xfield;let value=el.value;if(['number','range'].includes(el.type)||key.startsWith('pair.'))value=value===''?null:Number(value);edit(m=>{setField(m,key,value);fieldExtra(task(),m,key);if(task().type==='x-floor'&&['w','h','cols','rows'].includes(key)){m.tiles=[];if(task().draw){m.cols=m.w;m.rows=m.h;}}});});
$('#lesson').addEventListener('change',e=>{if(e.target.matches('[data-xfield="method"]')&&task().type==='x-s39-choose')render();if(e.target.matches('[data-xfield="position"]')&&task().type==='x-g27-cut'||e.target.matches('[data-xfield="foldPosition"]')&&task().type==='x-g27-net')render();});

// Native <details> toggles after a user click. Close competing optional
// sections synchronously before the requested disclosure opens, including
// keyboard activation of the native summary element.
$('#lesson').addEventListener('click',e=>{
 const summary=e.target.closest('summary'),section=summary?.parentElement;
 if(a?.view!=='summary'||!section||section.open||!section.matches('#system-explanation,.p3-more,.p3-application,#record'))return;
 for(const other of document.querySelectorAll('#system-explanation,.p3-more,.p3-application,#record'))if(other!==section)other.open=false;
},true);
$('#lesson').addEventListener('toggle',e=>{
 if(e.target.matches('#thinking-guide')&&e.target.open&&a?.view==='task'&&thinkingGuide(task(),{sessionId:id,index:a.index}))update(r=>supportLesson(r));
 if(e.target.matches('.x-access')&&e.target.open&&a?.view==='task')update(r=>supportLesson(r));
},true);

// The same conserved tokens can be moved by drag or by keyboard-accessible buttons.
$('#lesson').addEventListener('dragstart',e=>{const token=e.target.closest('[data-b13-token]');if(!token||blocked||a.view==='summary'||task().type!=='x-mulgroups')return;e.dataTransfer.setData('text/plain',token.dataset.b13Token);e.dataTransfer.effectAllowed='move';});
$('#lesson').addEventListener('dragover',e=>{if(e.target.closest('[data-b13-bucket]')&&!blocked&&a.view!=='summary'&&task().type==='x-mulgroups')e.preventDefault();});
$('#lesson').addEventListener('drop',e=>{const bucket=e.target.closest('[data-b13-bucket]');if(!bucket||blocked||a.view==='summary'||task().type!=='x-mulgroups')return;e.preventDefault();const token=e.dataTransfer.getData('text/plain');if(!/^\d+$/.test(token))return;edit((m,r)=>{actExtra(task(),m,'b13-drop',{token,bucket:bucket.dataset.b13Bucket});if(m.issue)supportLesson(r);},{renderNow:true});});

$('#lesson').addEventListener('keydown',e=>{const el=e.target.closest('svg [data-x]');if(el&&['Enter',' '].includes(e.key)){e.preventDefault();el.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
