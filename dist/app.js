import {readStored,writeStored,unpackText,MAX_BACKUP_BYTES} from './storage.js';
import {LESSONS,questions} from './lessons.js';
import {KEY,freshState,validateState,createSession,recordAnswer,hint,allIndependent,finishSession,latest,topicStatus,STATUS,makeBackup,parseBackup,mergeBackup,timestamp} from './core.js';
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const frac=v=>{const [n,d]=String(v).split('/');return `<span class="fraction" aria-label="${esc(d)}分之${esc(n)}"><span>${esc(n)}</span><span>${esc(d)}</span></span>`;};
const date=v=>new Date(v).toLocaleDateString('zh-CN',{month:'long',day:'numeric'});
let data,nodes,ids,state,search='',filter='all',draft={key:'',value:null},readBlocked=false;
const main=$('#main'),dialog=$('#node-dialog');
let toastTimer;
function toast(text){$('#toast').textContent=text;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,4000);}
function warning(text){$('#storage-warning').textContent=text;$('#storage-warning').hidden=false;}
function save(){if(readBlocked)return false;try{writeStored(KEY,JSON.stringify(state));return true;}catch{warning('浏览器暂时不能保存记录。当前页仍可学习，请到“我的足迹”导出备份，避免关闭页面后丢失。');return false;}}
const statusPill=id=>`<span class="pill ${topicStatus(state,id)}">${STATUS[topicStatus(state,id)]}</span>`;
const availability=n=>`<span class="pill ${n.lesson?'open':'muted'}">${n.lesson?'互动课已开放':'课程待制作'}</span>`;
const action=(name,label,extra='',cls='btn')=>`<button class="${cls}" data-action="${name}" ${extra}>${label}</button>`;
function route(){return (location.hash||'#map').slice(1).split('/');}
function render(){
  const [page,id]=route();
  document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===(['domain','lesson'].includes(page)?'map':page)));
  if(page==='domain'&&data.domains.some(d=>d.id===id))renderDomain(id);
  else if(page==='lesson'&&LESSONS[id]){if(state.active?.lesson!==id)activateLesson(id);renderLesson();}
  else if(page==='journey')renderJourney();
  else if(page==='lab')renderLab();
  else if(page==='about')renderAbout();
  else renderMap();
}
function resumeHTML(){const s=state.active;return s&&s.stage!=='result'?`<div class="resume"><div><small>上次的探索还在这里</small><h3>${esc(LESSONS[s.lesson].title)} · ${stageName(s.stage)}</h3></div>${action('lesson','继续上次的探索 →',`data-lesson="${s.lesson}"`,'btn secondary')}</div>`:'';}
function routeCards(){return `<div class="route-cards">${Object.entries(LESSONS).map(([key,l],i)=>`<button class="route-card" data-action="node" data-id="${l.topicId}"><span class="route-icon" aria-hidden="true">${l.icon}</span><span><small>探索 ${String(i+1).padStart(2,'0')} / ${l.time}</small><h3>${l.title}</h3><p>${l.short}</p></span><span class="arrow">↗</span></button>`).join('')}</div>`;}
function toolbar(){return `<div class="map-toolbar"><label class="search-wrap"><span aria-hidden="true">⌕</span><input class="search" type="search" id="search" value="${esc(search)}" placeholder="找一找：分数、图形、测量…" aria-label="搜索全部数学知识点"></label>${[['all','全部地图'],['open','有互动课'],['bookmarks','我想探索']].map(([id,title])=>action('filter',title,`data-filter="${id}" aria-pressed="${filter===id}"`,`filter ${filter===id?'active':''}`)).join('')}</div>`;}
function renderMap(){
  main.innerHTML=`<section class="hero"><div><div class="eyebrow">MY MATHEMATICS ATLAS / 我的数学地图</div><h1>数学，<span class="hero-mark">自己走一走。</span></h1><p>从好奇的地方出发。动手试一试，发现知识之间的连接。<br>不必按顺序走，也可以随时回来补一块基础。</p></div><aside class="explorer-note"><div class="note-top"><strong>这张地图，向你敞开。</strong><span>↗ EXPLORE</span></div><p>有些地方已经能动手探索，<br>有些地方还在等待我们一起建造。</p><div class="note-footer"><span><b class="note-number">12</b>个领域</span><span><b class="note-number">587</b>个知识点</span></div></aside></section>${resumeHTML()}<section><div class="section-head"><div><h2>从“一份”开始，发现一片世界</h2><p>首批 3 节互动课 · 可以任选一节，也可以沿这条路线试试</p></div><a class="text-link" href="#domain/fractions">看看分数领域 ↗</a></div>${routeCards()}</section><section class="map-section" aria-labelledby="map-heading"><div class="section-head"><div><h2 id="map-heading">整张地图，都在这里</h2><p>点开一个领域或知识点，看看它从哪里来，又能通向哪里。</p></div><span class="meta">12 个领域 / 1,223 条数学关联</span></div>${toolbar()}<div id="map-results">${mapResults()}</div></section>`;
}
function filtered(list=data.nodes){const q=search.trim().toLowerCase();return list.filter(n=>(!q||`${n.title} ${n.name} ${data.domains.find(d=>d.id===n.domainId).title}`.toLowerCase().includes(q))&&(filter!=='open'||n.lesson)&&(filter!=='bookmarks'||state.bookmarks.includes(n.id)));}
function mapResults(){
  if(search.trim()||filter!=='all')return topicList(filtered());
  return `<div class="map-panel"><div class="map-caption"><span>每一个小点，都是一个真实的知识点。</span><span class="legend"><span><i class="open"></i>已有互动课</span><span><i></i>完整知识结构</span></span></div><div class="domains">${data.domains.map(d=>`<section class="domain-card" style="--domain:${d.color}"><button class="domain-title" data-action="domain" data-domain="${d.id}" aria-label="展开${d.title}，${d.count}个知识点"><b>${d.number}</b><h3>${d.title}</h3><span>${d.count} ↗</span></button><p>${d.description}</p><div class="stars" aria-label="${d.title}知识点">${data.nodes.filter(n=>n.domainId===d.id).map(n=>`<button tabindex="-1" class="star ${n.lesson?'available':''} ${state.visited[n.id]?'visited':''}" data-action="node" data-id="${n.id}" title="${esc(n.title)}${n.lesson?' · 已有互动课':''}" aria-label="${esc(n.title)}"></button>`).join('')}</div></section>`).join('')}</div><p class="map-footnote">地图展示全部数学知识点。课程待制作的节点也可以查看关联、加入“我想探索”。打开节点后可沿着基础与后续方向继续走。</p></div>`;
}
function topicList(list){return `<div class="count-label">${list.length} 个知识点${list.length?' · 点开查看基础与后续方向':''}</div>${list.length?`<div class="topic-grid">${list.map(n=>`<button class="topic-card" data-action="node" data-id="${n.id}"><span class="meta"><span>${data.domains.find(d=>d.id===n.domainId).title}</span>${availability(n)}</span><h3>${esc(n.title)}</h3><span class="meta">${statusPill(n.id)}<span>${state.bookmarks.includes(n.id)?'☆ 我想探索':'查看关联 ↗'}</span></span></button>`).join('')}</div>`:`<div class="empty"><h3>${filter==='bookmarks'?'还没有加入想探索的地方':'暂时没找到这个名字'}</h3><p>${filter==='bookmarks'?'打开任意知识点，点“我想探索”就能把它收进来。':'可以换个词试试，比如“小数”“面积”或“规律”。'}</p></div>`}`;}
function renderDomain(id){const d=data.domains.find(d=>d.id===id);main.innerHTML=`<a class="back" href="#map">← 回到整张地图</a><section class="subhero"><div class="eyebrow">领域 ${d.number} / ${d.count} 个知识点</div><h1>${d.title}</h1><p>${d.description} 这些节点都可以自由查看。</p></section>${toolbar()}<div id="map-results">${topicList(filtered(data.nodes.filter(n=>n.domainId===id)))}</div>`;}
function showNode(id){
  const n=nodes.get(id);if(!n)return;
  state.visited[id]=state.visited[id]||timestamp();save();
  const d=data.domains.find(d=>d.id===n.domainId),l=n.lesson&&LESSONS[n.lesson];
  const prereqs=data.edges.filter(e=>e.topicId===id),next=data.edges.filter(e=>e.prerequisiteId===id),external=data.externalEdges.filter(e=>e.topicId===id);
  const relations=(list,type)=>list.map(e=>{const target=nodes.get(type==='before'?e.prerequisiteId:e.topicId);return `<button class="relation" data-action="node" data-id="${target.id}">${esc(target.title)}<span>${e.strength==='hard'?'关键基础':'有帮助的关联'}${target.lesson?' · 有互动课':''}</span></button>`;}).join('');
  dialog.innerHTML=`<article class="detail"><div class="detail-top"><div class="eyebrow">${d.title} / 一个知识点</div><button class="close" data-action="close" aria-label="关闭知识点">×</button></div><div class="meta">${availability(n)} ${statusPill(n.id)}</div><h2 id="node-title">${esc(n.title)}</h2><p class="intro">${l?l.description:'这是完整数学地图中的一个位置。互动课还未制作，你可以先看看它的基础和后续方向，或把它收进“我想探索”。'}</p>${l?`<ul class="tasks">${l.goals.map(g=>`<li>${g}</li>`).join('')}</ul>`:''}<div class="actions">${l?action('lesson',state.active?.lesson===n.lesson&&state.active.stage!=='result'?'继续探索 →':'进入互动课 →',`data-lesson="${n.lesson}"`):''}${action('bookmark',state.bookmarks.includes(id)?'已加入我想探索 ✓':'☆ 我想探索',`data-id="${id}"`,'btn secondary')}</div><div class="relations"><section><h3>← 可以先看看这些基础</h3><p>有帮助的路标；你仍可以直接开始。</p>${relations(prereqs,'before')||'<p>原图未列出数学前置知识。</p>'}${external.length?`<p>另有 ${external.length} 条其他学科基础，原文保留在下方来源信息中。</p>`:''}</section><section><h3>继续走，可以去哪里 →</h3><p>这里会在哪些知识里再次出现？</p>${relations(next,'after')||'<p>原图暂未列出后续数学节点。</p>'}</section></div><details class="source"><summary>查看原始依据与内容范围</summary><p>Marble 原名：${esc(n.name)}<br>标识：${n.id}<br>来源参考年龄 ${n.ageRangeStart}–${n.ageRangeEnd} 岁，仅作参考，不作为进入限制。</p><p>${esc(n.description)}</p><strong>原始学习证据（英文）</strong><ul>${n.evidence.map(e=>`<li>${esc(e)}</li>`).join('')}</ul><p>${n.hasResearch?'原库包含教学研究记录。':'原库尚无教学研究记录。'}这些记录由代理整理，不代表经过儿童教学试验验证。</p>${[...prereqs,...external].map(e=>`<p>${esc(nodes.get(e.prerequisiteId)?.title||data.externalNodes.find(n=>n.id===e.prerequisiteId)?.name)}：${esc(e.reason)}</p>`).join('')}<p>中文名称与首批课程为本地改编，其余节点保留原文说明。<a class="text-link" href="#about" data-action="close">来源及许可</a></p></details></article>`;
  if(!dialog.open)dialog.showModal();else dialog.scrollTop=0;
}
function activateLesson(key,restart=false){
  if(state.active?.lesson===key&&!restart)return;
  if(state.active&&!restart)state.paused[state.active.lesson]=structuredClone(state.active);
  const variant=state.history.filter(h=>h.lesson===key).length;
  state.active=!restart&&state.paused[key]?.stage!=='result'&&state.paused[key]?state.paused[key]:createSession(key,variant);
  delete state.paused[key];state.visited[LESSONS[key].topicId]=timestamp();draft={key:'',value:null};save();
}
function openLesson(key,restart=false){dialog.close();activateLesson(key,restart);location.hash=`lesson/${key}`;render();window.scrollTo(0,0);}
function stageName(stage){return {placement:'找找起点','placement-summary':'你的起点',explore:'动手发现',practice:'一起试试',check:'独立挑战',result:'这次的发现'}[stage];}
function stripHTML(n,d,interactive=false){return `<div class="strip ${interactive?'interactive':''}" role="${interactive?'group':'img'}" aria-label="一个整体平均分成 ${d} 份，${n} 份涂色">${Array.from({length:d},(_,i)=>interactive?`<button class="part ${i<n?'lit':''}" data-action="experiment-part" data-part="${i}" aria-label="第 ${i+1} 份" aria-pressed="${i<n}"></button>`:`<span class="part ${i<n?'lit':''}"></span>`).join('')}</div>`;}
function lineHTML(n,d,n2,d2){const x=30+480*n/d;return `<svg class="numberline" viewBox="0 0 540 ${d2?142:100}" role="img" aria-label="${n}/${d}${d2?` 与 ${n2}/${d2}`:''}在数轴上的位置"><line x1="30" x2="510" y1="40" y2="40" stroke="#a5b6aa" stroke-width="2"/>${Array.from({length:d+1},(_,i)=>`<line x1="${30+480*i/d}" x2="${30+480*i/d}" y1="34" y2="46" stroke="#738d7d"/>`).join('')}<circle cx="${x}" cy="40" r="6" fill="#bc5728"/><text x="30" y="70" text-anchor="middle">0</text><text x="510" y="70" text-anchor="middle">1</text><text x="${x}" y="22" text-anchor="middle">${n}/${d}</text>${d2?`<line x1="30" x2="510" y1="100" y2="100" stroke="#a5b6aa" stroke-width="2"/>${Array.from({length:d2+1},(_,i)=>`<line x1="${30+480*i/d2}" x2="${30+480*i/d2}" y1="94" y2="106" stroke="#738d7d"/>`).join('')}<circle cx="${30+480*n2/d2}" cy="100" r="6" fill="#5589a4"/><line x1="${x}" x2="${x}" y1="49" y2="90" stroke="#bc5728" stroke-dasharray="3 3"/><text x="${x}" y="130" text-anchor="middle">${n2}/${d2}</text><text x="30" y="130" text-anchor="middle">0</text><text x="510" y="130" text-anchor="middle">1</text>`:''}</svg>`;}
const gridHTML=n=>`<div class="grid100" role="img" aria-label="百分格：100 格中涂了 ${n} 格">${Array.from({length:100},(_,i)=>`<i class="${i<n?'lit':''}"></i>`).join('')}</div>`;
function visual(v){if(!v)return '';let html='';
  if(v.type==='strip')html=stripHTML(v.n,v.d)+'<div class="whole-label">整条纸带 = 1</div>';
  if(v.type==='pair')html=`<div class="pair"><div class="pair-row">${frac(`${v.n}/${v.d}`)}${stripHTML(v.n,v.d)}</div><div class="pair-row">${frac(`${v.n2}/${v.d2}`)}${stripHTML(v.n2,v.d2)}</div></div><div class="whole-label">两个整体一样大</div>`;
  if(v.type==='line'||v.type==='equivalentLine')html=lineHTML(v.n,v.d,v.n2,v.d2);
  if(v.type==='grid')html=gridHTML(v.n)+'<div class="whole-label">整块方格 = 1</div>';
  if(v.type==='unequal')html='<div class="strip" role="img" aria-label="纸带分成大小不同的4块，第一块蓝色"><span class="part lit" style="flex:1"></span><span class="part" style="flex:3"></span><span class="part" style="flex:2"></span><span class="part" style="flex:4"></span></div>';
  return `<div class="visual">${html}</div>`;
}
function renderLesson(){
  const s=state.active,l=LESSONS[s.lesson];const stages=['placement','explore','practice','check','result'];const activeIndex=stages.indexOf(s.stage==='placement-summary'?'placement':s.stage);
  main.innerHTML=`<section class="lesson-shell"><div class="lesson-top"><a class="back" href="#map">← 回到地图，稍后继续</a><small>${l.title} · ${l.time}</small></div><div class="steps" aria-label="课程进度">${stages.map((v,i)=>`<div class="step ${i<=activeIndex?'active':''}" ${i===activeIndex?'aria-current="step"':''}>${String(i+1).padStart(2,'0')} ${stageName(v)}</div>`).join('')}</div><div class="lesson-heading"><div class="eyebrow">${stageName(s.stage)}</div><h1>${s.stage==='explore'?l.exploreTitle:s.stage==='result'?'每一次尝试，都留下发现。':s.stage==='placement-summary'?'从这里出发。':l.short}</h1><p>${s.stage==='placement'?'先试 3 个小问题，看看哪些地方已经熟悉。不会也没关系。':s.stage==='check'?'换几个新问题，看看能否自己说清、做出。需要时仍然可以看提示。':s.stage==='explore'?l.exploreText:s.stage==='practice'?'试着把刚刚的发现用起来。答错了，我们一起看看原因。':''}</p></div><div class="lesson-layout"><div class="lesson-card" id="lesson-content">${lessonContent()}</div><aside class="lesson-aside"><h3>这一路，留意三件事</h3><ul>${l.goals.map(g=>`<li>${g}</li>`).join('')}</ul><p class="tiny">可以停下来想一想，也可以回地图看看基础。这里没有倒计时。</p>${action('node','看看这节课的关联 ↗',`data-id="${l.topicId}"`,'text-link')}</aside></div></section>`;
}
function questionRow(){const s=state.active,q=questions(s.lesson,s.stage,s.variant)[s.index];return s.answers[s.stage].find(r=>r.questionId===q.id);}
function lessonContent(){const s=state.active,l=LESSONS[s.lesson];
  if(s.stage==='explore')return `<div class="question-meta"><span>试一试，观察，再解释</span><span>可自由操作</span></div><div class="experiment">${experimentControls()}<div id="experiment-visual">${experimentVisual()}</div></div><ol class="tasks">${l.prompts.map(p=>`<li>${p}</li>`).join('')}</ol><div class="experiment-note">${l.takeaway}</div><div class="actions">${action('stage','带着发现，试几题 →','data-stage="practice"')}</div>`;
  if(s.stage==='placement-summary'){const good=allIndependent(s,'placement');return `<div class="result"><div class="result-mark">${good?'↗':'◌'}</div><h2>${good?'这些起点，你已经很熟悉。':'找到一个可以探索的起点。'}</h2><p>${good?'你独立做出了这 3 个起点问题。可以先动手验证，也可以直接试新问题。':'接下来用图形把想法变得看得见。刚刚的尝试不会被当作最终结论。'}</p><div class="actions">${action('stage','先动手发现 →','data-stage="explore"')}${good?action('stage','直接试独立挑战','data-stage="check"','btn secondary'):''}</div></div>`;}
  if(s.stage==='result')return resultHTML();
  const qs=questions(s.lesson,s.stage,s.variant),q=qs[s.index],row=questionRow();const draftKey=`${s.id}:${s.stage}:${q.id}`;
  if(draft.key!==draftKey)draft={key:draftKey,value:row?.attempts.at(-1)?.answer??(q.type==='shade'?[]:null)};
  const last=row?.attempts.at(-1),correct=last?.correct;
  const options=q.type==='choice'?`<div class="options" role="group" aria-label="选择答案">${q.options.map((o,i)=>`<button class="option ${draft.value===i?'selected':''}" aria-pressed="${draft.value===i}" data-action="choice" data-value="${i}"><b>${String.fromCharCode(65+i)}</b><span>${o}</span></button>`).join('')}</div>`:q.type==='input'?`<label class="input-label" for="answer-input">你的答案</label><input class="answer-input" id="answer-input" maxlength="100" autocomplete="off" placeholder="${esc(q.placeholder)}" value="${esc(draft.value??'')}" aria-describedby="answer-error"><p id="answer-error" role="alert" class="meta"></p>`:`<div class="strip interactive" role="group" aria-label="点击涂色纸带的各份">${Array.from({length:q.d},(_,i)=>`<button class="part ${draft.value?.includes(i)?'lit':''}" aria-pressed="${draft.value?.includes(i)?'true':'false'}" aria-label="第 ${i+1} 份" data-action="shade" data-value="${i}"></button>`).join('')}</div><div class="whole-label">整条纸带 = 1 · 已选 ${draft.value?.length||0} / ${q.d} 份</div>`;
  return `<div class="question-meta"><span>${stageName(s.stage)}</span><span>${s.index+1} / ${qs.length}</span></div><h2>${q.prompt}</h2>${visual(q.viz)}${options}${row?.hintUsed?`<div class="hint">想一想：${q.hint}</div>`:''}${last?`<div class="feedback ${correct?'correct':''}" role="status"><strong>${correct?'这个想法成立。':'这里有一处值得再看一看。'}</strong>${q.explain}${s.stage==='check'&&(row.hintUsed||!row.attempts[0].correct)?'<p>这题记作“需要支持”。之后可以用新问题再试。</p>':''}</div>`:''}<div class="question-actions">${action('hint','给我一点提示','','hint-button')}<div class="actions" style="margin:0">${!last||!correct?action('submit',last?'再试这个问题':'看看我的想法'):''}${last?action('next',s.index===qs.length-1?'看看这次的发现 →':'继续 →','','btn '+(correct?'':'secondary')):''}</div></div>`;
}
function experimentControls(){const s=state.active,e=s.experiment;
 if(s.lesson==='meaning')return `<label class="slider-label" for="parts">把整体平均分成几份？<b id="parts-label">${e.d} 份</b></label><input id="parts" class="slider" data-experiment="d" type="range" min="2" max="10" value="${e.d}"><label class="slider-label" for="take">取其中几份？<b id="take-label">${e.n} 份</b></label><input id="take" class="slider" data-experiment="n" type="range" min="0" max="${e.d}" value="${e.n}">`;
 if(s.lesson==='equivalent')return `<label class="slider-label" for="factor">把每一份再分成…<b id="factor-label">${e.k} 份</b></label><input id="factor" class="slider" data-experiment="k" type="range" min="1" max="4" value="${e.k}">`;
 return `<label class="slider-label" for="cells">涂色的格数<b id="cells-label">${e.cells} 格</b></label><input id="cells" class="slider" data-experiment="cells" type="range" min="0" max="100" value="${e.cells}">`;
}
function experimentVisual(){const s=state.active,e=s.experiment;if(s.lesson==='meaning')return `${visual({type:'strip',n:e.n,d:e.d})}<div class="equation">${frac(`${e.n}/${e.d}`)}<span>= ${e.n} 个 ${esc('1/'+e.d)}</span></div><p class="meta">分成 ${e.d} 个相等的部分，取了 ${e.n} 个。整条纸带始终是 1。</p>`;
if(s.lesson==='equivalent')return `${visual({type:'pair',n:2,d:3,n2:2*e.k,d2:3*e.k})}<div class="equation">${frac('2/3')}<span>=</span>${frac(`${2*e.k}/${3*e.k}`)}</div>${lineHTML(2,3,2*e.k,3*e.k)}`;
return `${gridHTML(e.cells)}<div class="equation">${frac(`${e.cells}/100`)}<span>= ${(e.cells/100).toFixed(2)}</span>${e.cells%10===0?`<span>=</span>${frac(`${e.cells/10}/10`)}`:''}</div><p class="meta">${Math.floor(e.cells/10)} 个完整的十格行，另有 ${e.cells%10} 个小格。整块方格 = 1。</p>`;
}
function resultHTML(){const s=state.active,h=state.history.find(h=>h.id===s.id),good=h.status==='independent';const key=Object.keys(LESSONS)[Object.keys(LESSONS).indexOf(s.lesson)+1];return `<div class="result"><div class="result-mark">${good?'✳':'↻'}</div><h2>${good?'这一次，你能独立做出了。':'值得再试试的地方，找到了。'}</h2><p>${good?'你在新问题中首次作答都正确，而且没有借助提示。这是这一次理解的证据。过几天再试试，看看是否还记得。':'有的题用了提示，或第一次还没做对。先带着解释再动手试试，明天可以换一组问题再挑战。'}</p><div class="evidence-list">${questions(s.lesson,'check',s.variant).map(q=>{const r=h.answers.check.find(r=>r.questionId===q.id);return `<div class="evidence-row"><span>${q.prompt}</span><b>${r.attempts[0].correct&&!r.hintUsed?'独立做出':'需要支持'}</b></div>`;}).join('')}</div><p class="meta">建议 ${date(h.reviewAt)} 回来复习 · 完整作答与提示记录在“我的足迹”中</p><div class="actions">${action('restart','换组问题再探索',`data-lesson="${s.lesson}"`,'btn secondary')}${key?action('lesson','看看下一片风景 →',`data-lesson="${key}"`):'<a class="btn" href="#map">回到整张地图 →</a>'}<a class="text-link" href="#journey">查看足迹</a></div></div>`;}
function answerDisplay(q,a){if(q.type==='choice')return q.options[a];if(q.type==='shade')return `涂了 ${a.length}/${q.d} 份`;return a;}
function renderJourney(){
 const review=Object.values(LESSONS).filter(l=>topicStatus(state,l.topicId)==='review');
 main.innerHTML=`<section class="subhero"><div class="eyebrow">MY TRAIL / 我的足迹</div><h1>走过的路，都有发现。</h1><p>看过一个知识点、动手练过、独立做出，是不同的经历。它们都值得记录。</p></section>${resumeHTML()}<div class="journal-grid"><div><section class="panel"><h2>值得回来再试试</h2>${review.length?review.map(l=>`<div class="history-card"><h3>${l.title}</h3><p>用一组新问题，看看哪些想法还记得。</p>${action('restart','重新探索 →',`data-lesson="${nodes.get(l.topicId).lesson}"`,'text-link')}</div>`).join(''):'<p>目前没有到期的复习。你可以随时回到地图，选择喜欢的地方。</p>'}</section><section class="panel"><h2>我的学习记录 <span class="meta">${state.history.length} 次完成的探索</span></h2>${state.history.length?[...state.history].reverse().map(h=>`<article class="history-card"><div class="history-title"><h3>${LESSONS[h.lesson].title}</h3><span class="pill ${h.status}">${STATUS[h.status]}</span></div><p>${date(h.at)} · 建议 ${date(h.reviewAt)} 再试</p><details><summary>看看作答和提示记录</summary>${['placement','practice','check'].map(phase=>h.answers[phase].length?`<div class="history-detail"><strong>${stageName(phase)}</strong>${h.answers[phase].map(r=>{const q=questions(h.lesson,phase,h.variant).find(q=>q.id===r.questionId);return `<p>${esc(q.prompt)}<br>${r.attempts.map((a,i)=>`第 ${i+1} 次：${esc(answerDisplay(q,a.answer))}（${a.correct?'正确':'再想想'}）`).join('；')}<br>${r.hintUsed?'使用过提示':'未使用提示'}</p>`;}).join('')}</div>`:'').join('')}</details></article>`).join(''):'<p>完成一次独立挑战后，这里会保留完整记录。进行中的课程会自动续上。</p>'}</section></div><aside><section class="panel"><h2>把足迹装进口袋</h2><p>记录保存在这台电脑的当前浏览器里。偶尔导出一份备份，换浏览器或清理数据后也能找回来。</p><div class="actions">${action('export','导出学习备份')}${action('import','导入备份','','btn secondary')}</div><p class="export-status">导入会合并学习记录，保留当前正在学的课程。导入前会自动保存一份本机快照。</p>${action('restore-snapshot','导出导入前的快照','','text-link')}</section><section class="panel"><h2>我想探索</h2><p>已收藏 ${state.bookmarks.length} 个知识点。</p>${action('show-bookmarks','去看看 →','','text-link')}</section><section class="panel"><h2>记录的含义</h2><p>“本次独立做出”表示新题首次作答正确、未用提示。它不等于永久掌握，也不等于一次完整的数学能力测评。</p></section></aside></div>`;
}
function renderLab(){main.innerHTML=`<section class="subhero"><div class="eyebrow">MATH LAB / 数学实验室</div><h1>换个角度，玩一会儿数学。</h1><p>两份随项目保存的原版互动示例，打开后可以独立运行。界面为英文，适合自由尝试。</p></section><div class="lab-grid"><article class="panel"><div class="lab-art" aria-hidden="true">▧</div><h2>看不见的方块</h2><p>转动立体结构，从不同视角寻找隐藏的方块，探索空间和体积。</p><div class="actions"><a class="btn secondary" href="experiments/hidden-cubes/index.html" target="_blank" rel="noopener">打开原版实验 ↗</a></div></article><article class="panel"><div class="lab-art" aria-hidden="true">⬡</div><h2>蜜蜂建造师</h2><p>通过六边形拼搭探索图形。保留上游的原始操作方式和英文提示。</p><div class="actions"><a class="btn secondary" href="experiments/bee-builder/index.html" target="_blank" rel="noopener">打开原版实验 ↗</a></div></article></div><div class="notice">实验室是独立的探索空间，不会自动改变知识点的学习状态。关闭新标签页即可回到地图。</div>`;}
function renderAbout(){main.innerHTML=`<a class="back" href="#map">← 回到地图</a><article class="about-copy"><div class="eyebrow">ABOUT THE ATLAS / 来源与边界</div><h1>地图让知识连接起来。</h1><h2>从章节顺序，到可以自由探索的知识关系</h2><p>这张地图把数学拆成可以观察学习证据的小知识点，说明哪些知识会支持另一些知识。章节可以帮助安排进度；关系地图帮助你理解“为什么要学”和“卡住时可以回哪里”。它们可以配合使用。</p><h2>这份本地版包含什么</h2><p>587 个数学知识点、12 个领域、1,223 条数学内部前置关系；另保留 32 条其他学科的前置参考。所有节点都有中文名称，三个分数主题有完整中文互动课，其余节点提供关联和原始英文说明。502 个数学节点有原始教学研究记录，85 个没有。</p><p>中文课程包含找起点、动手发现、引导练习和新题挑战。系统记录首次作答、后续尝试及提示使用，安排复习建议；不能代替教师观察和孩子自己的解释。</p><h2>内容来自哪里</h2><p>原始项目：<a href="https://github.com/withmarbleapp/os-taxonomy" target="_blank" rel="noopener">Marble Skill Taxonomy · withmarbleapp/os-taxonomy</a>，作者 Marble / withmarble.com。版本固定在 <code>a8719737ff86ef7940ba5feca11940de1204103e</code>。</p><p>本地新增：中文标题、探索入口、学习记录、分数的意义／等值分数／十分与百分分数对应小数的课程。原始文件完整保存在项目 vendor 目录，未改写。地图与课程属于本地改编，并非 Marble 官方完整教学产品。</p><p>原库教学研究由代理整理，包含不完整覆盖和可能的细节错误。本地三节课程按其概念目标重新编写题目；这些教学安排尚待孩子实际试学。</p><h2>许可与署名</h2><p>数据库及本地数学投影遵循 <a href="licenses/LICENSE" target="_blank">ODbL 1.0</a>；文字内容、中文翻译和改编课程遵循 <a href="licenses/LICENSE-CONTENT" target="_blank">CC BY-SA 4.0</a>。<a href="licenses/PROVENANCE.md" target="_blank">原始来源说明</a>随应用保存。原版示例保留其嵌入的第三方代码许可。</p><h2>离线与隐私</h2><p>核心页面、数据、三节课与两个原版实验都随应用保存。没有账号、广告、远程分析或模型调用。学习记录只在当前浏览器内保存；浏览器清理数据可能移除记录，请使用学习备份。应用只监听本机地址。</p></article>`;}
function download(value,name){const blob=new Blob([typeof value==='string'?value:JSON.stringify(value,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
document.addEventListener('click',event=>{
 const b=event.target.closest('[data-action]');if(!b)return;const a=b.dataset.action,s=state.active;
 if(a==='node')showNode(b.dataset.id);
 else if(a==='close')dialog.close();
 else if(a==='domain'){search='';filter='all';location.hash=`domain/${b.dataset.domain}`;}
 else if(a==='filter'){filter=b.dataset.filter;render();}
 else if(a==='show-bookmarks'){filter='bookmarks';search='';location.hash='map';render();}
 else if(a==='bookmark'){const id=b.dataset.id;state.bookmarks=state.bookmarks.includes(id)?state.bookmarks.filter(x=>x!==id):[...state.bookmarks,id];save();showNode(id);}
 else if(a==='lesson'||a==='restart')openLesson(b.dataset.lesson,a==='restart');
 else if(a==='choice'||a==='shade'){const v=Number(b.dataset.value);draft.value=a==='choice'?v:draft.value.includes(v)?draft.value.filter(x=>x!==v):[...draft.value,v];$('#lesson-content').innerHTML=lessonContent();}
 else if(a==='hint'){hint(s);save();$('#lesson-content').innerHTML=lessonContent();}
 else if(a==='submit'){
  const q=questions(s.lesson,s.stage,s.variant)[s.index];if(q.type==='input')draft.value=$('#answer-input').value;
  if(draft.value===null||q.type==='input'&&!String(draft.value).trim()){toast('先选一个想法或写下答案吧。');$('#answer-input')?.focus();return;}
  recordAnswer(s,draft.value);save();$('#lesson-content').innerHTML=lessonContent();
 }
 else if(a==='next'){
  const qs=questions(s.lesson,s.stage,s.variant);
  if(!questionRow()?.attempts.length)return;
  if(s.index<qs.length-1)s.index++;
  else if(s.stage==='placement'){s.stage='placement-summary';s.index=0;}
  else if(s.stage==='practice'){s.stage='check';s.index=0;}
  else finishSession(state,s);
  draft={key:'',value:null};save();renderLesson();main.scrollIntoView({block:'start'});
 }
 else if(a==='stage'){s.stage=b.dataset.stage;s.index=0;draft={key:'',value:null};save();renderLesson();main.scrollIntoView({block:'start'});}
 else if(a==='export'){download(makeBackup(state),`数学探索-学习备份-${new Date().toISOString().slice(0,10)}.json`);toast('学习备份已生成，请保存下载的文件。');}
 else if(a==='import')$('#import-file').click();
 else if(a==='restore-snapshot'){const snap=readStored(`${KEY}-before-import`);if(snap){download(snap,'数学探索-导入前的快照.json');toast('已导出上次导入前的记录。');}else toast('还没有导入前的快照。');}
});
document.addEventListener('input',e=>{
 if(e.target.id==='search'){search=e.target.value;const [page,id]=route();$('#map-results').innerHTML=page==='domain'?topicList(filtered(data.nodes.filter(n=>n.domainId===id))):mapResults();}
 if(e.target.id==='answer-input')draft.value=e.target.value;
 const k=e.target.dataset.experiment;if(k){const ex=state.active.experiment;ex[k]=Number(e.target.value);if(k==='d'){ex.n=Math.min(ex.n,ex.d);$('#take').max=ex.d;$('#take').value=ex.n;}for(const [id,v,suffix] of [['parts-label',ex.d,'份'],['take-label',ex.n,'份'],['factor-label',ex.k,'份'],['cells-label',ex.cells,'格']])if($('#'+id))$('#'+id).textContent=`${v} ${suffix}`;$('#experiment-visual').innerHTML=experimentVisual();save();}
});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='answer-input'){e.preventDefault();$('[data-action="submit"]')?.click();}});
$('#import-file').addEventListener('change',async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{
  if(readBlocked)throw new Error('现有存储无法读取，先保留现有浏览器数据，再使用另一浏览器导入备份。');
  if(file.size>8_000_000)throw new Error('备份文件超过 8 MB，尚未导入。');
  const incoming=parseBackup(await file.text(),ids),merged=validateState(mergeBackup(state,incoming),ids);
  writeStored(`${KEY}-before-import`,JSON.stringify(makeBackup(state)));
  writeStored(KEY,JSON.stringify(merged));state=merged;render();toast('学习记录已合并，原有足迹仍然保留。');
 }catch(err){toast(err.message||'导入失败，原有记录没有改变。');}finally{e.target.value='';}
});
dialog.addEventListener('click',e=>{if(e.target===dialog&&e.clientX){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('close',()=>{if(route()[0]!=='lesson')render();});
window.addEventListener('hashchange',()=>{dialog.close();render();window.scrollTo(0,0);});
async function boot(){
 try{
  const response=await fetch('./data/math.json');if(!response.ok)throw new Error('地图数据读取失败');data=await response.json();nodes=new Map(data.nodes.map(n=>[n.id,n]));ids=[...nodes.keys()];state=freshState();
  try{const stored=readStored(KEY);if(stored)state=validateState(JSON.parse(stored),ids);}catch{readBlocked=true;warning('现有浏览器记录无法读取，已停止覆盖它。你仍可浏览地图；建议先保留原有数据，用另一浏览器学习并导出备份。');}
  render();
  if('serviceWorker'in navigator){try{await navigator.serviceWorker.register('./sw.js');await navigator.serviceWorker.ready;$('#offline-status').textContent=' · 本地资源已就绪';}catch{$('#offline-status').textContent=' · 本地服务运行时可离线使用';}}
  else $('#offline-status').textContent=' · 本地服务运行时可离线使用';
 }catch(err){main.innerHTML=`<div class="empty"><h2>地图暂时没有打开</h2><p>${esc(err.message)}。请使用项目里的“启动数学探索.command”打开。</p><button class="btn" onclick="location.reload()">重新加载</button></div>`;}
}
boot();
