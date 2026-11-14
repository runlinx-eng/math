import {registerClientRelease,releaseWorkerURL,isReleaseWorker,isCurrentReleaseReady} from './sw-client.js';
const RELEASE='math-explorer-20261114-p9-source-context-v1';
registerClientRelease(RELEASE);
import {readStored,writeStored,unpackText,MAX_BACKUP_BYTES} from './storage.js';
import {assertNoImportConflicts} from './import-conflicts.js';
import {applyNavigationCopy} from './navigation-copy.js';
import {makeKnowledgeNames} from './spatial-names.js';
import {ACTIVITIES,activityIds,STAGES,KINDS,task,inspect} from './exploration-content.js';
import {KEY,OLD_KEY,fresh,now,ensureActivity,modelFor,caseKey,addSupport,submit,saveObservation,saveNote,evidenceSummary,nodeState,PROGRESS,completionClass,migrateLegacy,validate,backup,parseBackup,merge} from './exploration-core.js';
import {prepareStateForValidation} from './learning/phase4/async-batches.js';
import {ROUTE_ID,ROUTE_STEPS} from './journey-model.js';
import {mergeLiveActivity} from './live-state.js';
import {LESSONS,lessonIds,lessonForTopic,topicIds,ROUTES} from './learning/catalog.js';
import {bridgeIds} from './learning/bridges.js';
import {lessonSummary} from './learning/state.js';
import {sessionTaskFor} from './learning/bridges.js';
import {inspect as inspectLesson} from './learning/tasks.js';
import {lessonRecordTier,activityRecordTier,journeyRecordTier,tieredIds} from './learning/trail-priority.js';
import {questionDone} from './learning/daily.js';
const embedded=window.parent!==window&&new URLSearchParams(location.search).has('embedded');
if(embedded)document.documentElement.classList.add('embedded');
function spaceNavigate(kind,id){window.parent.postMessage({type:'math-space:navigate',kind,id},location.origin);}
const $=s=>document.querySelector(s),main=$('#main');
const displayNode=n=>knowledgeNames?.get(n.id)||n.title;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn=(a,text,attrs='',css='btn')=>`<button class="${css}" data-do="${a}" ${attrs}>${text}</button>`;
const link=(url,text,css='btn secondary')=>`<a class="${css}" href="${url}">${text}</a>`;
const date=v=>new Date(v).toLocaleDateString('zh-CN',{month:'long',day:'numeric'});
const frac=(n,d)=>`<span class="fraction" aria-label="${d}分之${n}"><span>${n}</span><span>${d}</span></span>`;
let atlas,state,nodeById,packById,knowledgeNames,readBlocked=false,toastTimer;
function toast(s){$('#toast').textContent=s;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,4000);}
function warn(s){$('#storage-warning').textContent=s;$('#storage-warning').hidden=false;}
function persist(){if(readBlocked)return false;try{const stored=readStored(KEY);if(stored){let latest;try{latest=validate(JSON.parse(stored),atlas);}catch{readBlocked=true;warn('现有记录发生异常，已停止覆盖。请先导出当前记录。');return false;}const combined=mergeLiveActivity(state,latest,route()[0]==='activity'?route()[1]:null);state=combined;}writeStored(KEY,JSON.stringify(state));return true;}catch{warn('本次记录暂时无法写入浏览器。可以继续探索，请到“我的足迹”导出备份。');return false;}}
const route=()=>((location.hash||'#map').slice(1)).split('/');
const current=()=>state.activities[route()[1]];
const activityFor=id=>activityIds.find(k=>ACTIVITIES[k].topicId===id);
function badge(text,kind=''){return `<span class="badge ${kind}">${text}</span>`;}
function breadcrumbs(items){return `<div class="breadcrumbs">${items.map(([url,title])=>url?`<a href="${url}">${esc(title)}</a>`:esc(title)).join('<span> / </span>')}</div>`;}
function redirectRetiredMap(){
 const [view,id]=route();
 if((view==='activity'&&activityIds.includes(id))||['trail','about','lab'].includes(view))return false;
 const target=new URL('index.html',location.href);
 target.hash=id&&['node','pack','theme'].includes(view)?'space/'+view+'/'+encodeURIComponent(id):view==='atlas'&&id?'space/pack/'+encodeURIComponent(id):'atlas';
 if(embedded)main.innerHTML='<section class="subhero"><h1>知识地图已统一为三维全景</h1><p><a href="'+target.href+'" target="_top">返回三维关系全景</a></p></section>';
 else location.replace(target.href);
 return true;
}
function render(){
 if(redirectRetiredMap())return;
 const [view,id]=route();
 document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===view));
 if(view==='activity'){ensureActivity(state,id);state.visited[ACTIVITIES[id].topicId]=state.visited[ACTIVITIES[id].topicId]||now();state.openedPacks['same-amount']=state.openedPacks['same-amount']||now();persist();renderActivity();}
 else if(view==='trail')renderTrail();
 else if(view==='about')renderAbout();
 else if(view==='lab')renderLab();
}
function leaves(list){return `<div class="leaf-list">${list.filter(Boolean).map(n=>{const s=nodeState(state,n.id);return `<button class="leaf" data-do="node" data-id="${n.id}"><span><strong>${esc(displayNode(n))}</strong><small>${activityFor(n.id)||lessonForTopic(n.id)?PROGRESS[s.progress]:''}</small></span><i class="state-dot ${completionClass(s)}"></i></button>`;}).join('')}</div>`;}
function showNode(id){if(!nodeById.has(id))return;if(embedded)spaceNavigate('node',id);else location.href='index.html#space/node/'+encodeURIComponent(id);}
function paper(cuts,selected=[],interactive=false,action='paper'){const pos=[0,...cuts,100];return `<div class="paper" ${interactive?'role="group" aria-label="纸带的各份，点选涂色"':'role="img" aria-label="同样大的整体中的涂色部分"'}>${pos.slice(0,-1).map((x,i)=>interactive?`<button class="paper-part ${selected.includes(i)?'lit':''}" style="left:${x}%;width:${pos[i+1]-x}%" data-do="${action}" data-value="${i}" aria-label="第 ${i+1} 份" aria-pressed="${selected.includes(i)}"></button>`:`<span class="paper-piece ${selected.includes(i)?'lit':''}" style="left:${x}%;width:${pos[i+1]-x}%"></span>`).join('')}</div>`;}
const evenCuts=d=>Array.from({length:d-1},(_,i)=>100*(i+1)/d);
const firstParts=n=>Array.from({length:n},(_,i)=>i);
function line(mark,divisions,interactive=false,color='#5688a2',extra=''){return `<svg class="scene-numberline" viewBox="0 0 680 115" role="${interactive?'group':'img'}" aria-label="从0到1的数轴，平均分成${divisions}段，标记在第${mark}个刻度"><line x1="30" y1="50" x2="650" y2="50" stroke="#9eafa2" stroke-width="2"/>${Array.from({length:divisions+1},(_,i)=>`<g ${interactive?`role="button" tabindex="0" class="tick-button" data-do="tick" data-value="${i}" aria-label="第 ${i} 个刻度" aria-pressed="${mark===i}"`:''}><rect class="hit" x="${30+i*620/divisions-16}" y="22" width="32" height="56" fill="transparent"/><line x1="${30+i*620/divisions}" x2="${30+i*620/divisions}" y1="43" y2="57" stroke="#869c8c"/></g>`).join('')}<circle cx="${30+mark*620/divisions}" cy="50" r="7" fill="${color}" pointer-events="none"/><text x="30" y="92" text-anchor="middle">0</text><text x="650" y="92" text-anchor="middle">1</text>${extra}</svg>`;}
function hundred(selected){return `<div class="hundred-board"><div class="hundred-grid" role="group" aria-label="百分格，整块是1">${Array.from({length:100},(_,i)=>`<button class="cell ${selected.includes(i)?'lit':''}" data-do="cell" data-value="${i}" aria-label="第 ${Math.floor(i/10)+1} 行第 ${i%10+1} 格" aria-pressed="${selected.includes(i)}"></button>`).join('')}</div><div class="row-tools">${Array.from({length:10},(_,i)=>btn('row',selected.filter(n=>Math.floor(n/10)===i).length===10?'−10':'+10',`data-value="${i}" aria-label="涂满或清空第 ${i+1} 行"`,'')).join('')}</div></div>`;}
function selectControl(label,key,value,min,max,row){return `<label>${row!==undefined?(key==='n'?'取几份':'分几份'):label}<select data-model="${key}" ${row!==undefined?`data-row="${row}"`:''} aria-label="${label}">${Array.from({length:max-min+1},(_,i)=>min+i).map(n=>`<option value="${n}" ${n===value?'selected':''}>${n}</option>`).join('')}</select></label>`;}
const rangeValue=(key,value)=>key==='cut'?`位置 ${value}/100`:`当前位置 ${(value/100).toFixed(2)}`;
function rangeControl(label,key,value,min,max,attrs=''){return `<label>${label}<output>${rangeValue(key,value)}</output><input type="range" min="${min}" max="${max}" step="1" value="${value}" data-model="${key}" aria-label="${label}" ${attrs}></label>`;}
function controls(a){if(a.stage==='play'){
 if(a.id==='fair')return a.lab.cuts.map((v,i)=>rangeControl(`切口 ${i+1}`,`cut`,v,i===0?1:a.lab.cuts[i-1]+1,i===2?99:a.lab.cuts[i+1]-1,`data-cut="${i}"`)).join('')+btn('equalize','试试平均分','','btn secondary');
 if(a.id==='rename')return selectControl('下面分成几份','d',a.lab.d,2,12)+selectControl('取其中几份','n',a.lab.n,0,a.lab.d)+btn('repartition','每份再分成两份','','btn secondary')+btn('add-one','分子分母都加 1 呢？','','text-link');
 return '';
 }
 const t=task(a.id,a.stage,a.variant),m=modelFor(a);
 if(t.type==='partition')return m.cuts.map((v,i)=>rangeControl(`切口 ${i+1}`,'cut',v,i===0?1:m.cuts[i-1]+1,i===m.cuts.length-1?99:m.cuts[i+1]-1,`data-cut="${i}"`)).join('');
 if(t.type==='dual-line')return rangeControl(`${t.k}/100 的位置`,'hundredths',m.hundredths,0,100)+rangeControl(`${t.k}/10 的位置`,'tenths',m.tenths,0,100);
 return '';
}
function sceneVisual(a){if(a.stage==='play'){
 if(a.id==='fair'){const positions=[0,...a.lab.cuts,100],widths=positions.slice(1).map((p,i)=>p-positions[i]);return `${paper(a.lab.cuts,a.lab.selected,true)}<div class="paper-label"><span>整条纸带 = 1</span><span>点选了 ${a.lab.selected.length} 块</span></div><div class="part-sizes">${widths.map((w,i)=>`<span>第 ${i+1} 块：全长的 ${w}%</span>`).join('')}</div><p class="board-caption">${new Set(widths).size===1?'每一块都一样长，现在每块可以叫 1/4。':'有的块大，有的块小。名字里的“四分之一”，还需要平均分。'}</p>`;}
 if(a.id==='rename'){const {n,d}=a.lab;return `<div class="family-row"><span>${frac(2,3)}</span>${paper(evenCuts(3),firstParts(2))}</div><div class="family-row"><span>${frac(n,d)}</span>${paper(evenCuts(d),firstParts(n))}</div><p class="same-whole">两个整体一样长</p>${line(2,3,false,'#bc5728')}${line(n,d)}<p class="board-caption">${2*d===n*3?'两个终点重合：写法不同，表示的量相同。':'两个终点不同：改变分法时，量不一定保持不变。'}${a.lab.comparison?' 分子分母各加 1，与把每份再等分是不同的操作。':''}</p>`;}
 const n=a.lab.selected.length;return `${hundred(a.lab.selected)}<div class="equation">${frac(n,100)}<span>= ${(n/100).toFixed(2)}</span></div><p class="board-caption">${Math.floor(n/10)} 个十分之一和 ${n%10} 个百分之一 · 整块方格 = 1</p>`;
 }
 const t=task(a.id,a.stage,a.variant),m=modelFor(a);
 if(t.type==='partition')return `${paper(m.cuts,m.selected,true)}<div class="paper-label"><span>整条纸带 = 1</span><span>已取 ${m.selected.length} 块</span></div>`;
 if(t.type==='set')return `<div class="chips" role="group" aria-label="全部棋子合起来是一个整体">${Array.from({length:t.count},(_,i)=>btn('chip',String(i+1),`data-value="${i}" aria-label="第 ${i+1} 个棋子" aria-pressed="${m.selected.includes(i)}"`,`chip ${m.selected.includes(i)?'lit':''}`)).join('')}</div><p class="board-caption">整组 ${t.count} 个 = 1 · 你选了 ${m.selected.length} 个</p>`;
 if(t.type==='family')return m.rows.map((r,i)=>`<div class="family-row"><div class="family-controls">${selectControl(`第${i+1}条取几份`,'n',r.n,0,r.d,i)}<span>/</span>${selectControl(`第${i+1}条分几份`,'d',r.d,2,12,i)}</div>${paper(evenCuts(r.d),firstParts(r.n))}</div>`).join('')+'<p class="same-whole">三条纸带的整体长度相同</p>';
 if(t.type==='line')return line(m.mark,t.divisions,true)+`<p class="board-caption">标记在第 ${m.mark} 个刻度。点选其他刻度可以移动。</p>`;
 if(t.type==='grid')return hundred(m.selected)+`<p class="board-caption">已涂 ${m.selected.length} 格 · 整块方格 = 1</p>`;
 return `<p class="meta">${t.k}/100 的标记</p>${line(m.hundredths/10,10,false,'#bc5728')}<p class="meta">${t.k}/10 的标记</p>${line(m.tenths/10,10)}<p class="same-whole">两条数轴使用相同的单位长度</p>`;
}
function feedback(a){if(!KINDS.includes(a.stage))return '';const r=a.evidence[caseKey(a.stage,a.variant)],t=task(a.id,a.stage,a.variant),last=r?.attempts.at(-1),changed=last&&JSON.stringify(last.value)!==JSON.stringify(modelFor(a));return `${r?.support?`<div class="scene-support">${t.hint}<br>这次用过的提示会保留在记录里。</div>`:''}${last?`<div class="feedback ${inspect(t,last.value).correct?'correct':''}" role="status"><strong>上次提交：${inspect(t,last.value).correct?'这个作品成立':'有一处值得再看看'}</strong>${inspect(t,last.value).feedback}${changed?'<p>你又调整了作品，提交后会留下新的尝试。</p>':''}</div>`:''}`;}
function shelf(a){const e=evidenceSummary(a);return `<details class="disclosure activity-records"><summary>记录</summary><div class="evidence-shelf">${e.kinds.map(k=>`<div><h3>${k.kind==='construct'?'我构造的作品':'我在新情境中的尝试'}</h3>${badge(k.status==='independent'?'有独立操作证据':k.status==='supported'?'有支持的尝试':'还未留下证据')}<p>${k.attempts||0} 次提交；提示和首次尝试保留。</p></div>`).join('')}<div><h3>我自己的解释</h3><p>${a.notes.length} 份，内容待确认。</p></div></div></details>`;}

function activityContent(){const a=current(),info=ACTIVITIES[a.id];if(a.stage==='explain')return `<section class="scene"><div class="eyebrow">留下你的想法</div><h2>${info.notePrompt}</h2><p class="instruction">可以结合刚才的作品写下来，也可以先留空，想清楚后再回来。解释只保存在这台电脑里。</p><label for="explanation" class="sr-only">我的解释</label><textarea class="explanation" id="explanation" maxlength="2000" placeholder="我发现……因为……">${esc(a.draft)}</textarea><div class="scene-actions">${btn('save-note','保存我的解释 →')}${link('index.html#space/pack/same-amount','换一个想法继续探索','text-link')}</div>${a.notes.length?`<details class="disclosure"><summary>看看以前留下的 ${a.notes.length} 份解释</summary>${[...a.notes].reverse().map(n=>`<div class="record-event"><small>${date(n.at)} · 内容待确认</small><p class="saved-note">${esc(n.text)}</p></div>`).join('')}</details>`:''}</section>${shelf(a)}`;
 const play=a.stage==='play',t=play?null:task(a.id,a.stage,a.variant);return `<section class="scene"><div class="question-meta"><span>${play?'自由改变，观察结果':'先自己造出来，再提交查看反馈'}</span><span>${play?'':`案例 ${a.variant+1}`}</span></div><h2>${play?info.question:t.title}</h2><p class="instruction">${play?info.labPrompt:t.instruction}</p><div class="scene-controls" id="scene-controls">${controls(a)}</div><div class="scene-visual" id="scene-visual">${sceneVisual(a)}</div><div id="scene-result">${feedback(a)}</div><div class="scene-actions">${play?btn('observe','把这次发现留在足迹里'):btn('hint','给我一点支持','','hint-button')}${play?btn('stage','试着自己做一个作品 →','data-stage="construct"','btn secondary'):btn('submit','提交这个作品 →')}</div>${!play?`<div class="work-meta">${btn('variant',`看看案例 ${a.variant===0?2:1}`,'','case-switch')}</div>`:`<div class="lab-notes"><strong>接下来由你选择。</strong> 可以继续试、自己构造一个作品，或直接换个情境。</div>`}</section>${shelf(a)}<p class="link-note">需要看看基础？${btn('node','打开这个知识点的联系',`data-id="${info.topicId}"`,'text-link')} · ${link('#pack/same-amount','回到知识群','text-link')}</p>`;
}
function renderActivity(){const a=current(),info=ACTIVITIES[a.id],e=evidenceSummary(a),done=nodeState(state,info.topicId).progress==='completed';main.innerHTML=`<section class="activity-shell">${breadcrumbs([['index.html#atlas','知识全景'],['index.html#space/pack/same-amount',packById.get('same-amount')?.title||'分数的认识与等值'],[null,info.title]])}<div class="activity-head"><div><div class="eyebrow">一个想法，多种走法</div><h1>${info.title}</h1><p>${info.goal}</p></div>${badge(done?'完成':'未完成',done?'completed':'incomplete')}</div><nav class="activity-tabs" aria-label="自由选择探索方式">${Object.entries(STAGES).map(([key,label])=>btn('stage',(KINDS.includes(key)?(e.kinds.find(k=>k.kind===key).status!=='none'?'✓ ':'○ '):'')+label,`data-stage="${key}" aria-pressed="${a.stage===key}"`,a.stage===key?'active':'')).join('')}</nav><div id="activity-content">${activityContent()}</div></section>`;}
function restoreFocusAfter(update){const el=document.activeElement,attrs=['id','data-do','data-value','data-model','data-row','data-cut','data-stage','data-filter','data-id'],selector=el&&attrs.filter(k=>el.hasAttribute(k)).map(k=>`[${k}="${CSS.escape(el.getAttribute(k))}"]`).join('');update();if(selector&&!el.isConnected)document.querySelector(selector)?.focus({preventScroll:true});}
function refreshScene(){const a=current();restoreFocusAfter(()=>{$('#scene-visual').innerHTML=sceneVisual(a);$('#scene-result').innerHTML=feedback(a);});}
function journeyRecord(tier='evidence'){
  const j=state.journeys?.[ROUTE_ID];
  if(!j||journeyRecordTier(j)!==tier)return '';
  return `<section class="panel" data-trail-tier="${tier}"><h2>${tier==='evidence'?'早期路线 · 真实尝试':'早期路线 · 继续活动'}</h2>
    <p>${j.finishedAt?'这次体验已走完':'体验进行中'}。这些操作不自动计为独立理解证据。</p>
    <p>重新分过 ${j.observations.length} 次；果汁杯尝试 ${j.attempts.length} 次。</p>
    ${j.attempts.map((e,i)=>`<p>第 ${i+1} 次：倒到第 ${e.cup} 格 / 满杯 8 格 · ${e.cup===4?'这次是半杯':'还需调整'} · ${e.exposed?'已看过反馈':'首次提交'}</p>`).join('')}
    ${j.notes.map(n=>`<p class="saved-note">我的发现（待确认）：${esc(n.text)}</p>`).join('')}
    ${btn('resume-journey','回到这次体验 →','','btn secondary')}</section>`;
}
function latestLessonEvidence(a){
  const attempts=Object.entries(a.cases||{}).flatMap(([index,row])=>
    (row.attempts||[]).map(attempt=>({index:Number(index),attempt})));
  attempts.sort((x,y)=>x.attempt.at.localeCompare(y.attempt.at));
  const latest=attempts.at(-1),note=a.notes?.at(-1);
  if(!latest&&!note)return '';
  const t=latest?sessionTaskFor(a.id,latest.index):null;
  const checked=latest&&t?inspectLesson(t,latest.attempt.value).correct:null;
  return `<div class="trail-evidence-preview" aria-label="真实学习记录摘要">
    ${latest?`<p><strong>最近一次实际提交</strong> · 任务 ${latest.index+1} · ${date(latest.attempt.at)}</p>
      <p>${checked?'该次操作通过检查':'该次操作需要调整'} · ${latest.attempt.supported?'使用过提示':'未记录使用提示'}。单次提交不等于任务完成。</p>`:''}
    ${note?`<p><strong>最近保存的想法</strong> · ${date(note.at)}</p><p class="saved-note">${esc(note.text)}</p>`:''}
  </div>`;
}
function lessonRecords(tier='evidence'){
  const groups=tieredIds(lessonIds,state.lessons,lessonRecordTier),ids=groups[tier];
  if(!ids.length)return '';
  const title={evidence:'有记录的尝试与作品',draft:'有草稿的学习现场',available:'可开始的学习任务'}[tier];
  const articles=ids.map(id=>{
    const a=state.lessons[id],summary=lessonSummary(a);
    const attempts=Object.values(a.cases||{}).reduce((sum,row)=>sum+(row.attempts?.length||0),0),savedNotes=a.notes?.length||0;
    return `<article class="record-section" data-lesson-record="${id}" data-trail-tier="${tier}">
      <h3>${esc(LESSONS[id].title)}</h3>
      <p>${tier==='evidence'?`${attempts?attempts+' 次实际提交':'尚无正式提交'}${savedNotes?' · '+savedNotes+' 份保存解释':''} · 任务 ${summary.done} / ${summary.total}`:tier==='draft'?'未完成 · 已保留学习现场':'尚未开始 · 不属于已有作品'}</p>
      ${tier==='evidence'?`${latestLessonEvidence(a)}<details><summary>查看全部提交与解释</summary><p>${summary.independent?'有首次独立正确操作证据。':'操作记录、提示与重试分别保留。'}文字解释未自动判定。</p>
        ${Object.entries(a.cases||{}).map(([i,row])=>`<p>任务 ${Number(i)+1} · ${row.attempts.length} 次提交 · ${row.support?'使用过提示':'未主动看提示'}${row.attempts.some(e=>e.exposed)?' · 已保留重答记录':''}</p>`).join('')}
        ${a.notes.map(n=>`<p class="saved-note">${esc(n.text)}（待确认）</p>`).join('')}</details>`:tier==='draft'?'<p>可以返回原活动继续，草稿不计为已提交作品。</p>':''}
      ${embedded?btn('resume-lesson',tier==='available'?'开始活动 →':'继续原活动 →',`data-id="${id}"`,'text-link'):link('learn.html#'+id,tier==='available'?'开始活动 →':'继续原活动 →','text-link')}
      ${embedded?btn('node','定位原知识',`data-id="${LESSONS[id].topicId}"`,'text-link'):link('index.html#space/node/'+LESSONS[id].topicId,'定位原知识','text-link')}
    </article>`;
  }).join('');
  return tier==='available'
    ?`<details class="panel trail-available" data-trail-tier="available"><summary>${title} · ${ids.length}</summary><p>这些是已打开但没有真实学习证据的任务，不是作品。</p>${articles}</details>`
    :`<section class="panel" data-trail-tier="${tier}"><h2>${title} · ${ids.length}</h2>${articles}</section>`;
}
function draftActivityRecords(ids){
  if(!ids.length)return '';
  return `<section class="panel" data-trail-tier="draft"><h2>待继续的自由探索</h2>${ids.map(id=>`<article class="record-section">
    <h3>${esc(ACTIVITIES[id].title)}</h3><p>已经保留探索现场，尚没有实际提交或保存的作品。</p>
    ${link('#activity/'+id,'继续探索 →','text-link')}
    ${embedded?btn('node','定位原知识',`data-id="${ACTIVITIES[id].topicId}"`,'text-link'):link('index.html#space/node/'+ACTIVITIES[id].topicId,'定位原知识','text-link')}
  </article>`).join('')}</section>`;
}
function pendingQuestionRecords(){
  const questions=(state.daily?.questions||[]).filter(q=>!questionDone(q));
  if(!questions.length)return '';
  return `<section class="panel" data-trail-tier="question"><h2>待续问题 · ${questions.length}</h2>${questions.map(q=>`<article class="record-section">
     <p class="saved-note">${esc(q.text)}</p>
     ${q.nodeId?(embedded?btn('node','回到问题所在知识 →',`data-id="${q.nodeId}"`,'text-link'):link('index.html#space/node/'+q.nodeId,'回到问题所在知识 →','text-link')):'<p>问题已保存，可在主空间的「问题」入口继续。</p>'}
   </article>`).join('')}</section>`;
}
function renderTrail(){persist();
 const list=activityIds.filter(id=>activityRecordTier(state.activities[id])==='evidence');
  const draftActivities=activityIds.filter(id=>activityRecordTier(state.activities[id])==='draft');main.innerHTML=`<section class="subhero"><div class="eyebrow">我的学习记录</div><h1>记录走过的路，也记录想法。</h1><p>完成活动、独立操作和解释清楚，各自留下不同的证据。</p></section><div class="journal-grid"><div>${lessonRecords('evidence')}${journeyRecord('evidence')}<section class="panel" data-trail-tier="evidence"><h2>我的探索</h2>${list.length?list.map(id=>{const a=state.activities[id],e=evidenceSummary(a);return `<article class="record-section"><h3>${ACTIVITIES[id].title}</h3><div class="status-strip">${badge(e.completed?'活动已完成':'探索中',e.completed?'completed':'exploring')}${badge(e.demonstrated?'有操作与迁移证据':e.needsSupport?'有需要支持的地方':'正在收集证据',e.demonstrated?'evidence':e.needsSupport?'supported':'')}${badge(a.notes.length?'解释已记录 · 待确认':'解释待补充','pending')}</div><p class="summary">${a.observations.length} 份自由探索快照 · ${a.notes.length} 份解释${e.reviewAt?` · 建议 ${date(e.reviewAt)} 再来试试`:''}</p><div class="actions">${link(`#activity/${id}`,'回到这次探索 →','btn secondary')}</div><details class="disclosure"><summary>看看作品、提示和解释记录</summary>${Object.entries(a.evidence).map(([key,r])=>{const[k,v]=key.split(':'),t=task(id,k,Number(v));return `<div class="record-event"><strong>${STAGES[k]} · 案例 ${Number(v)+1}</strong><p>${t.title}</p>${r.attempts.map((event,i)=>`<p>第 ${i+1} 次 · ${date(event.at)} · ${inspect(t,event.value).correct?'作品成立':'需要再看'} · ${event.supported?'使用过提示':'未使用提示'} · ${event.exposed?'已看过本案例反馈':'首次提交'}<br>${esc(modelText(t,event.value))}</p>`).join('')||'<p>已看支持，尚未提交。</p>'}</div>`;}).join('')}${a.observations.map(o=>`<div class="record-event">${date(o.at)} · 自由探索快照（不计独立证据）<br>${esc(labText(id,o.value))}</div>`).join('')}${a.notes.map(n=>`<div class="record-event"><strong>${date(n.at)} · 我的解释，内容待确认</strong><p class="saved-note">${esc(n.text)}</p></div>`).join('')}</details></article>`;}).join(''):'<p>先去一个动手活动里试试。你做的作品、用过的提示和解释都会留在这里。</p>'}</section>${lessonRecords('draft')}${journeyRecord('draft')}${draftActivityRecords(draftActivities)}${pendingQuestionRecords()}${lessonRecords('available')}<section class="panel"><h2>我想探索</h2>${state.bookmarks.length?leaves(state.bookmarks.map(id=>nodeById.get(id)),1000):'<p>打开一个知识点，点“我想探索”就能收在这里。</p>'}</section>${legacyHTML()}</div><aside><section class="panel"><h2>把足迹装进口袋</h2><p>记录在当前浏览器中保存。导出备份后，可以在别的浏览器里接着用。</p><div class="actions">${btn('export','导出学习备份')}${btn('import','导入备份','','btn secondary')}</div><p class="source-note">兼容旧版备份。导入会合并可安全合并的记录，遇到草稿、同 ID 证据或现场冲突会停止导入，原记录不覆盖。导入前保存本机快照；请保留原备份文件。</p>${btn('pre-import','导出导入前的快照','','text-link')}</section><section class="panel"><h2>足迹怎样读</h2><p>新活动每个任务的作品成立后计完成。旧活动和早期路线的记录保持原来的含义。完成不等于独立掌握；提示、重试和自由文字分别保留，文字不自动判定。</p></section>${link('index.html#atlas','把足迹放回全景图 →','btn secondary')}</aside></div>`;
}
function modelText(t,m){if(t.type==='partition')return `切口：${m.cuts.join('、')}；取第 ${m.selected.map(i=>i+1).join('、')||'无'} 份`;if(t.type==='family')return m.rows.map(r=>`${r.n}/${r.d}`).join('，');if(t.type==='line')return `数轴第 ${m.mark}/${t.divisions} 个刻度`;if(t.type==='dual-line')return `${t.k}/100 标记在 ${m.hundredths}/100；${t.k}/10 标记在 ${m.tenths}/100`;return `选择 ${m.selected.length} 个：${m.selected.map(i=>i+1).join('、')}`;}
function labText(id,l){return id==='fair'?`切口：${l.cuts.join('、')}；选择的块：${l.selected.map(n=>n+1).join('、')||'无'}`:id==='rename'?`参考 2/3；自己的分法 ${l.n}/${l.d}`:`100 格中涂了 ${l.selected.length} 格，表示 ${(l.selected.length/100).toFixed(2)}`;}
function legacyHTML(){const l=state.legacy;if(!l)return '';return `<section class="panel"><h2>旧版练习记录</h2><p>${l.history.length} 次旧版练习记录${l.active?'，以及未清除的课程现场':''}已保留。它们是历史答题证据，没有自动变成新版的理解结论。</p><details class="disclosure"><summary>展开历史记录</summary>${l.history.map(h=>`<div class="record-event">${({meaning:'分数的意义',equivalent:'等值分数',decimal:'分数与小数'})[h.lesson]} · ${date(h.at)}<br>旧版结果：${h.status==='independent'?'首次答题正确且未使用提示':'需要支持'}${Object.entries(h.answers).map(([phase,rows])=>`<details><summary>${({placement:'找起点',practice:'练习',check:'答题检查'})[phase]} · ${rows.length} 条</summary>${rows.map(r=>`<p>${r.questionId} · ${r.hintUsed?'用过提示':'未用提示'}<br>${r.attempts.map(a=>`${esc(JSON.stringify(a.answer))}（${a.correct?'正确':'需再看'}）`).join(' → ')}</p>`).join('')}</details>`).join('')}</div>`).join('')}</details><p class="source-note">完整旧版数据随新版备份一同导出；浏览器原来的存储也保留。</p></section>`;}
function renderAbout(){main.innerHTML=`${breadcrumbs([['index.html#atlas','知识全景'],[null,'地图与学习的依据']])}<article class="about-copy"><h1>这张地图，怎样帮你探索？</h1><h2>知识结构来自哪里</h2><p>原始数学节点与前置关系来自 <a href="https://github.com/withmarbleapp/os-taxonomy" target="_blank" rel="noopener">Marble / os-taxonomy</a>，固定版本 <code>a8719737ff86ef7940ba5feca11940de1204103e</code>。587 个数学节点、1,223 条数学内部关系全部保留；32 条其他学科前置参考留在原始资料中。</p><p>5 个主题、23 个知识群及中文导航是本地重新组织。按数学概念与关系分组，年级、年龄和教材不决定路线。原来的领域与标识仍可追溯。</p><h2>研究怎样进入活动</h2><p>502 个数学节点有原始教学研究；其余 85 个补充了本地教学依据。目前 ${topicIds.length} 个源节点都有有限的学习任务，分成 ${ROUTES.length} 条短路线；${bridgeIds.length} 条原有关联已有联合操作。任务覆盖的是具体情境，不代表所有源目标都已完整评估。</p><p>以下是最早三个活动的来源示例：</p><table class="source-table"><thead><tr><th>探索</th><th>使用原库的内容</th><th>本地新增</th></tr></thead><tbody>${activityIds.map(id=>`<tr><td>${ACTIVITIES[id].title}</td><td>${ACTIVITIES[id].method}</td><td>交互、作品记录、具体案例和提示设计</td></tr>`).join('')}</tbody></table><p>分数的表示与数轴设计参考 <a href="https://ies.ed.gov/ncee/wwc/docs/practiceguide/fractions_pg_093010.pdf" target="_blank" rel="noopener">IES 分数教学实践指南，建议 1–2</a>；小数的位值与误解参考 <a href="https://smartvic.com/teacher/mdc/number/N40001P.html" target="_blank" rel="noopener">Mathematics Developmental Continuum 的小数比较资料</a>。资料提供教学依据，不能证明这份具体软件已经有效。</p><h2>沿短路线：先试，再命名</h2><p>每条路线有 2–4 个节点，编号是建议顺序，不锁定学习。活动通常先动手，再换条件运用，最后给出正式名称。三维积木可以旋转、拆层和切分；分数与数据使用适合的平面表示。完成对应的联合操作后，可以点亮原图中的联系。</p><p>两个数据节点的补充依据为 <a href="https://www.amstat.org/docs/default-source/amstat-documents/gaiseiiprek-12_full.pdf" target="_blank" rel="noopener">ASA / NCTM GAISE II</a> 与 <a href="https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study" target="_blank" rel="noopener">英国教育部 Statistics 目标</a>；仅参考内容，年级不控制路线。</p><h2>我们记录什么，不确定什么</h2><p>自由操作留下观察快照；独立构造与迁移任务留下具体作品、首次提交、重试及提示历史。各活动依据对应的操作记录完成情况；操作成立与解释成立分别记录，自由文字不自动评分。</p><p>看过提示或结果后重做，会保留帮助和尝试记录；活动完成不等于已经掌握。实际兴趣、理解和能否独立继续，需要孩子使用后观察。</p><h2>本机保存与许可</h2><p>无账号、外部分析或模型调用。备份保留新旧学习记录。应用只供本机访问，资源随目录保存。数据库及本地投影遵循 <a href="licenses/LICENSE">ODbL 1.0</a>；内容、中文改编遵循 <a href="licenses/LICENSE-CONTENT">CC BY-SA 4.0</a>。<a href="licenses/PROVENANCE.md">原始来源说明</a>随应用保留。</p></article>`;}
function renderLab(){main.innerHTML=`<section class="subhero"><div class="eyebrow">原版实验室</div><h1>换个角度，试试空间与形状。</h1><p>随原项目保存的两个英文示例。实验室不自动改变知识点的理解证据。</p></section><div class="lab-grid"><article class="panel"><div class="lab-art">▧</div><h2>隐藏的方块</h2><p>从不同角度观察一个立体结构。</p><div class="actions"><a class="btn secondary" href="experiments/hidden-cubes/index.html" target="_blank" rel="noopener">打开英文原版 ↗</a></div></article><article class="panel"><div class="lab-art">⬡</div><h2>蜜蜂建造师</h2><p>通过拼搭探索六边形。</p><div class="actions"><a class="btn secondary" href="experiments/bee-builder/index.html" target="_blank" rel="noopener">打开英文原版 ↗</a></div></article></div>`;}
function toggle(list,value){return list.includes(value)?list.filter(n=>n!==value):[...list,value];}
function download(value,name){const blob=new Blob([typeof value==='string'?value:JSON.stringify(value,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
document.addEventListener('click',event=>{const el=event.target.closest('[data-do]');if(!el)return;const action=el.dataset.do,a=current();
 if(action==='resume-lesson'&&LESSONS[el.dataset.id]){if(embedded)spaceNavigate('lesson',el.dataset.id);else location.href='learn.html#'+encodeURIComponent(el.dataset.id);}
 else if(action==='resume-journey'){const step=state.journeys?.[ROUTE_ID]?.route||2;if(embedded)spaceNavigate('node',ROUTE_STEPS[step-1].id);else location.href='index.html#space/node/'+ROUTE_STEPS[step-1].id;}
 else if(action==='node')showNode(el.dataset.id);
 else if(action==='stage'){a.stage=el.dataset.stage;persist();restoreFocusAfter(renderActivity);}
 else if(action==='variant'){a.variant=1-a.variant;persist();restoreFocusAfter(renderActivity);}
 else if(['paper','chip','cell'].includes(action)){const m=a.stage==='play'?a.lab:modelFor(a);m.selected=toggle(m.selected,Number(el.dataset.value));if(a.stage==='play')a.lab.changed=true;persist();refreshScene();}
 else if(action==='row'){const m=a.stage==='play'?a.lab:modelFor(a),row=Number(el.dataset.value),cells=Array.from({length:10},(_,i)=>row*10+i);m.selected=cells.every(n=>m.selected.includes(n))?m.selected.filter(n=>!cells.includes(n)):[...new Set([...m.selected,...cells])];if(a.stage==='play')a.lab.changed=true;persist();refreshScene();}
 else if(action==='tick'){modelFor(a).mark=Number(el.dataset.value);persist();refreshScene();}
 else if(action==='equalize'){a.lab.cuts=[25,50,75];a.lab.changed=true;persist();$('#activity-content').innerHTML=activityContent();}
 else if(action==='repartition'){if(a.lab.d*2>12){toast('这张纸带最多分成 12 份，可以先换个较小的分母。');return;}a.lab.n*=2;a.lab.d*=2;a.lab.changed=true;a.lab.comparison=false;persist();$('#activity-content').innerHTML=activityContent();}
 else if(action==='add-one'){a.lab.n=3;a.lab.d=4;a.lab.changed=true;a.lab.comparison=true;persist();$('#activity-content').innerHTML=activityContent();}
 else if(action==='observe'){if(saveObservation(a)){const ok=persist();$('#activity-content').innerHTML=activityContent();toast(ok?'这幅自由探索作品已保存在足迹里。':'作品暂留当前页面，请导出备份。');}else toast('先改变一下纸带或方格，再留下这次发现。');}
 else if(action==='hint'){addSupport(a);persist();restoreFocusAfter(renderActivity);}
 else if(action==='submit'){submit(a);persist();restoreFocusAfter(renderActivity);$('#scene-result').scrollIntoView({block:'nearest'});}
 else if(action==='save-note'){if(saveNote(a,a.draft)){a.draft='';const ok=persist();renderActivity();toast(ok?'已保存':'解释暂留当前页面，请导出备份。');}else toast('可以先写下你的发现，也可以稍后再来。');}
 else if(action==='export'){if(!persist()){const raw=localStorage.getItem(KEY);if(raw){download(raw,'数学探索-原始存储-需人工恢复.txt');toast('当前记录不能安全读取或写入，已导出原始存储文本（不能直接作为学习备份导入），原记录未覆盖。');}else toast('保存失败且没有可用的原始记录，未生成空白备份。');return;}download(backup(state),`数学探索-备份-v2-${new Date().toISOString().slice(0,10)}.json`);toast('已生成学习备份，请保留下载的文件。');}
 else if(action==='import')$('#import-file').click();
 else if(action==='pre-import'){try{const snapshot=readStored(KEY+'-before-import');if(snapshot)download(snapshot,'数学探索-导入前快照.json');else toast('还没有导入前的快照。');}catch{toast('当前浏览器无法读取快照。');}}
});
document.addEventListener('input',event=>{const el=event.target;if(el.id==='explanation'){current().draft=el.value;persist();return;}if(el.type!=='range'||!el.dataset.model)return;const a=current(),m=a.stage==='play'?a.lab:modelFor(a),key=el.dataset.model;
 if(key==='cut'){m.cuts[Number(el.dataset.cut)]=Number(el.value);document.querySelectorAll('[data-model="cut"]').forEach((input,i)=>{input.min=i===0?1:m.cuts[i-1]+1;input.max=i===m.cuts.length-1?99:m.cuts[i+1]-1;});}else m[key]=Number(el.value);
 el.parentElement.querySelector('output').textContent=rangeValue(key,Number(el.value));if(a.stage==='play')a.lab.changed=true;persist();refreshScene();
});
document.addEventListener('change',event=>{const el=event.target;if(el.tagName!=='SELECT'||!el.dataset.model)return;const a=current(),m=a.stage==='play'?a.lab:modelFor(a);const row=el.dataset.row,object=row!==undefined?m.rows[Number(row)]:m;object[el.dataset.model]=Number(el.value);object.n=Math.min(object.n,object.d);if(a.stage==='play')a.lab.changed=true;persist();restoreFocusAfter(()=>{$('#scene-controls').innerHTML=controls(a);refreshScene();});});
document.addEventListener('click',event=>{
 if(!embedded)return;
 const anchor=event.target.closest('a[href^="index.html#"]');
 if(!anchor)return;
 const parts=new URL(anchor.href).hash.slice(1).split('/');
 event.preventDefault();
 if(parts[0]==='space'&&['node','pack','theme'].includes(parts[1])&&parts[2])spaceNavigate(parts[1],decodeURIComponent(parts[2]));
 else spaceNavigate('atlas',null);
});
document.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)&&event.target.matches('[role="button"][data-do]')){event.preventDefault();event.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0);});
$('#import-file').addEventListener('change',async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try{
    if(readBlocked)throw new Error('原有存储无法读取，先保留原始数据再导入。');
    if(file.size>MAX_BACKUP_BYTES)throw new Error('备份超过 50 MB，尚未导入。');
    const text=await file.text(),wrapper=JSON.parse(text);
    if(wrapper?.version===2)await prepareStateForValidation(wrapper.state);
    // Capture the same bytes before any await and use them for both parsing
    // and the final compare-before-write guard.
    const before=localStorage.getItem(KEY),currentRaw=unpackText(before);
    if(currentRaw)await prepareStateForValidation(JSON.parse(currentRaw));
    const current=currentRaw?validate(JSON.parse(currentRaw),atlas):state;
    const incoming=parseBackup(text,atlas);
    assertNoImportConflicts(current,incoming);
    const combined=validate(merge(current,incoming),atlas);
    if(localStorage.getItem(KEY)!==before)throw new Error('导入期间学习记录发生变化，请重试。');
    writeStored(KEY+'-before-import',JSON.stringify(backup(current)));
    writeStored(KEY,JSON.stringify(combined));state=combined;render();toast('备份已合并，已有作品和提示历史都保留了。');
  }catch(error){toast(error.message||'导入失败，原有记录没有改变。');}
  finally{event.target.value='';}
});
async function boot(){try{if(redirectRetiredMap())return;const response=await fetch('./data/atlas.json');if(!response.ok)throw new Error('地图数据读取失败');atlas=applyNavigationCopy(await response.json());knowledgeNames=makeKnowledgeNames(atlas);nodeById=new Map(atlas.nodes.map(n=>[n.id,n]));packById=new Map(atlas.packs.map(p=>[p.id,p]));state=fresh();try{const before=localStorage.getItem(KEY),oldBefore=localStorage.getItem(OLD_KEY),stored=unpackText(before),old=unpackText(oldBefore);if(stored){const parsed=JSON.parse(stored);await prepareStateForValidation(parsed);state=validate(parsed,atlas);}if(old){const migrated=migrateLegacy(JSON.parse(old),atlas.nodes.map(n=>n.id));state=stored?validate(merge(state,migrated),atlas):migrated;if(localStorage.getItem(KEY)!==before||localStorage.getItem(OLD_KEY)!==oldBefore)throw new Error('加载旧记录期间学习现场发生变化，请重新打开页面。');writeStored(KEY,JSON.stringify(state));}}catch{readBlocked=true;warn('现有记录暂时无法读取，已停止覆盖原数据。可以浏览地图；新探索请及时导出备份。');}render();
 if('serviceWorker'in navigator){
  try{
   const registration=await navigator.serviceWorker.register(releaseWorkerURL(RELEASE),{updateViaCache:'none'});
   await navigator.serviceWorker.ready;
   const offlineReady=async()=>{
    const active=navigator.serviceWorker.controller;
    if(!active){$('#offline-status').textContent=' · 正在准备离线资源';return;}
    if(isReleaseWorker(active,RELEASE)&&active.state==='activating')active.addEventListener('statechange',refresh,{once:true});
    if(!isReleaseWorker(active,RELEASE)||active.state!=='activated'||registration.active!==active){$('#offline-status').textContent=' · 正在升级离线资源';return;}
    const reply=await new Promise(resolve=>{
     const channel=new MessageChannel();
     const timer=setTimeout(()=>{channel.port1.close();resolve(null);},5000);
     channel.port1.onmessage=event=>{clearTimeout(timer);channel.port1.close();resolve(event.data);};
     try{active.postMessage({type:'math-explorer:cache-status'},[channel.port2]);}
     catch{clearTimeout(timer);channel.port1.close();resolve(null);}
    });
    if(navigator.serviceWorker.controller!==active)return;
    $('#offline-status').textContent=isCurrentReleaseReady({release:RELEASE,registration,
      controller:navigator.serviceWorker.controller,worker:active,report:reply})?' · 本机离线资源就绪':' · 离线资源不完整';
   };
   const refresh=()=>offlineReady().catch(()=>{$('#offline-status').textContent=' · 离线状态未知';});
   navigator.serviceWorker.addEventListener('controllerchange',refresh);
   await offlineReady();
  }catch{$('#offline-status').textContent=' · 离线状态未知';}
 }
 }catch(error){main.innerHTML=`<div class="empty"><h2>地图暂时没打开</h2><p>${esc(error.message)}。请通过“启动数学探索.command”打开应用。</p></div>`;}}
if(embedded){
 document.addEventListener('click',event=>{const a=event.target.closest('a[href^="#"]');if(!a)return;const [kind,id]=a.getAttribute('href').slice(1).split('/');if(['map','theme','pack','node','atlas','activity'].includes(kind)){event.preventDefault();event.stopImmediatePropagation();spaceNavigate(kind,id);}},true);
 // Storage events can be delivered after a newer local edit. Read the current
 // value instead of replacing a working copy with an older event payload.
 window.addEventListener('storage',event=>{if(event.key!==KEY||!atlas||!event.newValue)return;try{const latest=readStored(KEY);if(latest)state=validate(JSON.parse(latest),atlas);}catch{readBlocked=true;warn('其他工作面的存储发生异常，已停止覆盖。');}});
}
boot();
