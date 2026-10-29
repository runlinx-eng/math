import {readStored,writeStored,unpackText,MAX_BACKUP_BYTES} from './storage.js';
import {KEY,fresh,validate,now,nodeState} from './exploration-core.js';
import {ROUTE_ID,ROUTE_STEPS,freshJourney,actOnJourney} from './journey-model.js';
const root=document.getElementById('math-learning-example'),current=root.querySelector('#m-current');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let atlas,state,learning,relations=false,relation='here',check=null,blocked=false;
function hydrate(j){state={...j,relations,relation,check,firstAttempt:j.attempts[0]?.cup??null};}
function notify(type,extra={}){if(parent!==window)parent.postMessage({type,...extra},location.origin);}
function commit(action,value){
  if(blocked)return false;
  try{
    const raw=readStored(KEY),all=raw?validate(JSON.parse(raw),atlas):fresh();
    const j=all.journeys[ROUTE_ID]??=freshJourney();actOnJourney(j,action,value);
    const node=ROUTE_STEPS[j.route-1].id;all.visited[node]??=now();all.openedPacks['same-amount']??=now();all.journeyContinuation=ROUTE_ID;
    writeStored(KEY,JSON.stringify(validate(all,atlas)));learning=all;hydrate(j);notify('math-space:journey-change',{step:j.route});return true;
  }catch(error){blocked=true;const box=document.getElementById('m-storage-warning');box.hidden=false;box.textContent='记录暂时不能保存，已停止覆盖原有内容。'+error.message;return false;}
}
function go(step){check=null;commit('visit',step);render();if(relations)notify('math-space:journey-relations',{open:true,relation});window.scrollTo(0,0);}
function renderRecords(){
  const f=state.attempts[0];
  root.querySelector('#m-record-content').innerHTML='<p>'+ (state.finishedAt?'这次体验已走完；不自动标记为掌握。':'这次体验还在进行。')+'</p><p>重新分过 '+state.observations.length+' 次；果汁杯提交过 '+state.attempts.length+' 次。'+(f?'第一次倒到第 '+f.cup+' 格'+(f.exposed?'（此前已看过反馈）':'')+'。':'')+'</p>'+state.notes.map(n=>'<p>我的发现（待确认）：'+esc(n.text)+'</p>').join('');
  root.querySelectorAll('[data-stop]').forEach(el=>{let small=el.querySelector('small');if(!small){small=document.createElement('small');el.querySelector('button').append(small);}const n=Number(el.dataset.stop);const done=nodeState(learning,ROUTE_STEPS[n-1].id).progress==='completed';small.textContent=done?'✓ 完成':'○ 未完成';});
}
  const button=(action,label,primary=false,disabled=false)=>'<button type="button" class="m-btn'+(primary?' primary':'')+'" data-action="'+action+'"'+(disabled?' disabled':'')+'>'+label+'</button>';
  function bar(parts,taken,label){return '<div class="m-bar" role="img" aria-label="'+label+'">'+Array.from({length:parts},(_,i)=>'<span class="m-piece'+(i<taken?' taken':'')+'"></span>').join('')+'</div>';}
  function renderPlay(){
    const equal=state.taken*2===state.parts;
    const feedback=equal?(state.observations.length?'小块变多了，拿到的长度没有变。':'两块一样大的巧克力，原来各拿一半。'):(state.taken*2<state.parts?'现在拿到的更少了。分法和拿几块，都要一起看。':'现在拿到的更多了。分法和拿几块，都要一起看。');
    current.innerHTML='<h2>切得更细，拿到的会变多吗？</h2><p class="m-goal">两块巧克力一样大。把下面这块分细一点，看看有颜色的部分。</p><div class="m-titleline"><span>原来拿到的</span><span class="m-label">2 块里拿 1 块</span></div>'+bar(2,1,'原来平均分成2块，拿到1块')+'<div class="m-titleline"><span>重新分后拿到的</span><span class="m-label">'+state.parts+' 块里拿 '+state.taken+' 块</span></div>'+bar(state.parts,state.taken,'现在平均分成'+state.parts+'块，拿到'+state.taken+'块')+'<div class="m-actions">'+button('split','每块再分两份',true,state.parts===16)+button('less','少拿一小块',false,state.taken===0)+button('more','多拿一小块',false,state.taken===state.parts)+'</div><p class="m-feedback" role="status">'+feedback+'</p><div class="m-actions">'+button('transfer','换到果汁杯里试试')+'</div>';
  }
  function renderTransfer(){
    const feedback=state.check===null?'':state.check?'这次倒到了半杯：8 小格里有 4 小格果汁。':state.cup<4?'还不到半杯。看看杯子上半段和下半段的高度。':'已经超过半杯。看看杯子上半段和下半段的高度。';
    current.innerHTML='<h2>给朋友倒半杯果汁。</h2><p class="m-goal">这是上下同样粗的直筒杯，8 个小格一样高。</p><div class="m-cup-row"><div class="m-cup" role="img" aria-label="果汁到第'+state.cup+'格，满杯共8格"><div class="m-liquid" style="height:'+state.cup*12.5+'%"></div>'+Array.from({length:7},(_,i)=>'<span class="m-tick" style="bottom:'+(i+1)*12.5+'%"></span>').join('')+'</div><label class="m-range-label">倒到第 <output id="m-cup-value">'+state.cup+'</output> 格<input id="m-cup" type="range" min="0" max="8" step="1" value="'+state.cup+'" aria-label="调整果汁高度"><span class="m-label">空杯 0 · 满杯 8</span></label></div><div class="m-actions">'+button('check','看看这杯',true)+button('back-play','回到巧克力')+'</div><p class="m-feedback" id="m-transfer-feedback" role="status">'+feedback+'</p><div class="m-actions">'+button('summary','收一收这次发现',false,!state.attempts.length)+'</div>';
  }
  function renderSummary(){
    current.innerHTML='<h2>同样的量，可以有不同的名字。</h2><div class="m-summary"><p>巧克力切得更细，拿到的小块数也一起变多，拿到的总量可以不变。</p><div class="m-expression" aria-label="二分之一等于四分之二等于八分之四">1/2 = 2/4 = 4/8</div><dl><dt>等值分数</dt><dd>写法不同，但表示的数值相同。</dd><dt>分母、分子</dt><dd>下面的数表示整体被平均分成几份；上面的数表示取其中几份。</dd><dt>分数的基本性质</dt><dd>分子和分母同时乘或除以同一个不为零的数，分数的值不变。</dd></dl></div><label for="m-note">用自己的话留下一个发现（可选）</label><textarea id="m-note" maxlength="2000" placeholder="切得更细时，什么变了，什么没有变？">'+esc(state.draft)+'</textarea><div class="m-actions">'+button('save-note','记下来')+'<span id="m-save-message" role="status"></span></div><details><summary>这个想法的原始定义</summary><p>数轴上的等值分数（Equivalent fractions on a number line）。这次用巧克力和杯子理解同一个量；数轴上的表现留在原有活动中。</p><p>来源节点 mt_Ep7TDFuYUa。编号和生活场景由本地应用编排。</p>'+button('legacy','再到数轴上试试')+'</details><div class="m-actions">'+button('back-play','回去再试试')+button('next-route','去看 A–03',true)+'</div>';
  }
  function renderBefore(){
    current.innerHTML='<h2>两个人分这一块，怎样才公平？</h2><p class="m-goal">左右两份都要一样多。移动分割位置。</p><div class="m-bar unbroken" role="img" aria-label="左份占'+state.cut+'%，右份占'+(100-state.cut)+'%"><span class="m-piece taken" style="flex:0 0 '+state.cut+'%"></span><span class="m-piece"></span></div><label>分割位置<input id="m-cut" type="range" min="10" max="90" value="'+state.cut+'" aria-label="移动分割位置"></label><p class="m-feedback" id="m-fair-feedback" role="status">'+(state.cut===50?'两边一样大了，可以用同样的一份来数。':'两边大小还不同。')+'</p><div class="m-actions">'+button('finish-fair',state.fairFinishedAt?'继续':'完成，继续',true,state.cut!==50)+'</div>';
  }
  function renderAfter(){
    current.innerHTML='<h2>半杯，还能怎样记？</h2><p class="m-goal">这一站已有完整活动：把半杯、四分之一和四分之三换成小数名字。</p><a class="m-btn primary" href="learn.html#quarters">开始这次动手 →</a>';
  }
  function renderRelations(){
    root.querySelector('#m-relations').hidden=!state.relations;
    root.querySelector('#m-relations-toggle').setAttribute('aria-expanded',String(state.relations));
    root.querySelector('#m-relations-toggle').textContent=state.relations?'收起这两条联系':'看看这里和谁有联系';
    root.querySelectorAll('[data-relation]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.relation===state.relation)));
    const reasons={before:'为什么先看它：只有每一份一样大，拿几份才方便比较。这里会用到“公平地分”的想法。',here:'当前只展开这一处的两条联系。点击两端，可以看为什么相连。',after:'为什么能接着看它：同样的量可以换个写法，半杯也能记成 0.5 杯。这个想法会帮到下一处。'};
    root.querySelector('#m-reason').textContent=reasons[state.relation];
  }
  function renderTaskProgress(){const el=root.querySelector('#m-task-progress');el.hidden=state.route!==2;if(el.hidden)return;const done=[state.observations.length>0,state.attempts.length>0,!!state.finishedAt],phase=['play','transfer','summary'].indexOf(state.phase);el.innerHTML=['切巧克力','倒果汁','看总结'].map((title,i)=>`<li ${phase===i?'aria-current="step"':''} aria-label="${title}，${done[i]?'完成':'未完成'}"><span aria-hidden="true">${done[i]?'✓':i+1}</span>${title}</li>`).join('');}
  function render(){
    root.querySelectorAll('[data-stop]').forEach(el=>{const selected=Number(el.dataset.stop)===state.route;el.toggleAttribute('aria-current',selected);if(selected)el.setAttribute('aria-current','step');el.querySelector('.m-number').textContent='A–0'+el.dataset.stop+(selected?' · 正在这里':'');});
    if(state.route===1)renderBefore();else if(state.route===3)renderAfter();else if(state.phase==='transfer')renderTransfer();else if(state.phase==='summary')renderSummary();else renderPlay();
    renderTaskProgress();
    renderRelations();renderRecords();
  }

function updateAndSave(action,value){const focused=document.activeElement?.dataset?.action;if(commit(action,value)){render();if(focused)root.querySelector('[data-action="'+focused+'"]:not(:disabled)')?.focus({preventScroll:true});}}
root.addEventListener('click',event=>{
  const route=event.target.closest('[data-route]');if(route){go(Number(route.dataset.route));return;}
  const rel=event.target.closest('[data-relation]');if(rel){relation=rel.dataset.relation;state.relation=relation;renderRelations();notify('math-space:journey-relations',{open:relations,relation});return;}
  if(event.target.closest('#m-relations-toggle')){relations=!relations;state.relations=relations;renderRelations();notify('math-space:journey-relations',{open:relations,relation});return;}
  const el=event.target.closest('[data-action]');if(!el)return;const a=el.dataset.action;
  if(a==='finish-fair'){if(commit('finish-fair'))go(2);return;}
  if(a==='current-route'){go(2);return;}if(a==='next-route'){go(3);return;}
  if(a==='legacy'){notify('math-space:navigate',{kind:'legacy-activity',id:'rename'});return;}
  if(a==='save-note'){const input=root.querySelector('#m-note');if(input.value.trim()&&commit('note',input.value)){input.value='';root.querySelector('#m-save-message').textContent='已记下';renderRecords();}return;}
  if(a==='check')check=state.cup===4;
  updateAndSave(a);if(['transfer','summary','back-play'].includes(a))window.scrollTo(0,0);
});
root.addEventListener('input',event=>{
  if(event.target.id==='m-note'){commit('draft',event.target.value);}
  else if(event.target.id==='m-cup'){
    check=null;if(!commit('cup',Number(event.target.value)))return;
    current.querySelector('.m-liquid').style.height=state.cup*12.5+'%';current.querySelector('.m-cup').setAttribute('aria-label','果汁到第'+state.cup+'格，满杯共8格');current.querySelector('#m-cup-value').textContent=state.cup;current.querySelector('#m-transfer-feedback').textContent='';renderRecords();
  }else if(event.target.id==='m-cut'){
    if(!commit('cut',Number(event.target.value)))return;current.querySelector('.m-piece.taken').style.flexBasis=state.cut+'%';current.querySelector('.m-bar').setAttribute('aria-label','左份占'+state.cut+'%，右份占'+(100-state.cut)+'%');current.querySelector('#m-fair-feedback').textContent=state.cut===50?'两边一样大了，可以用同样的一份来数。':'两边大小还不同。';current.querySelector('[data-action="finish-fair"]').disabled=state.cut!==50;renderRecords();
  }
});
window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===parent&&e.data?.type==='math-space:journey-step'&&[1,2,3].includes(e.data.step))go(e.data.step);});
try{const r=await fetch('./data/atlas.json');if(!r.ok)throw new Error('地图暂时无法读取');atlas=await r.json();const step=Number(location.hash.slice(1));if(commit('visit',[1,2,3].includes(step)?step:2))render();}catch(error){document.getElementById('m-storage-warning').hidden=false;document.getElementById('m-storage-warning').textContent=error.message;}
