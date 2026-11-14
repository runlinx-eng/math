// Source-rendered control checks for Node regressions; never a Chromium claim.
import assert from 'node:assert/strict';
const attr=(tag,key)=>tag.match(new RegExp('\\b'+key+'="([^"]*)"'))?.[1];
const decode=s=>s.replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&#39;',"'").replaceAll('&amp;','&');
export function visibleModel(task,M,V){
 const model=M.initial(task,314159),trace=[];
 const get=key=>key.split('.').reduce((x,k)=>x[k],model);
 const rendered=()=>{
  const html=V.render(task,model),elements=[...html.matchAll(/<[a-z][^>]*>/g)].map(x=>({tag:x[0],index:x.index,disabled:/\sdisabled(?:\s|=|>)/.test(x[0])}));
  if(V.syncControls){
   const cutStart=html.indexOf('class="b13-cut"'),cutEnd=html.indexOf('</div>',cutStart);
   V.syncControls(task,model,{querySelectorAll:selector=>elements.filter(el=>selector.split(',').some(s=>{
    s=s.trim();const match=/^\[([\w-]+)="([^"]+)"\]$/.exec(s);
    if(match)return attr(el.tag,match[1])===match[2];
    if(s==='.b13-cut [data-xfield]')return cutStart>=0&&el.index>cutStart&&el.index<cutEnd&&attr(el.tag,'data-xfield')!==undefined;
    throw Error('unsupported source syncControls selector '+s);
   }))});
  }
  return{html,elements};
 };
 const field=(key,value)=>{
  value=String(value);const {html,elements}=rendered();
  const tags=elements.filter(el=>/^<(?:input|select|textarea)\b/.test(el.tag)&&decode(attr(el.tag,'data-xfield')||'')===key);
  assert.equal(tags.length,1,'one rendered field '+key);const tag=tags[0].tag;
  assert.equal(tags[0].disabled,false,'enabled field '+key);
  if(tag.startsWith('<select')){const start=html.indexOf(tag),select=html.slice(start,html.indexOf('</select>',start));assert.ok([...select.matchAll(/<option\b[^>]*value="([^"]*)"/g)].some(x=>decode(x[1])===value),'real select option '+key+'='+value);}
  if(attr(tag,'type')==='range'){const n=Number(value);assert.ok(Number.isInteger(n)&&n>=Number(attr(tag,'min'))&&n<=Number(attr(tag,'max')),'real slider range '+key);}
  const keys=key.split('.');let target=model;for(const k of keys.slice(0,-1))target=target[k];target[keys.at(-1)]=value;M.field(task,model,key);trace.push({field:key,value});
 };
 const action=(name,data={})=>{
  const {elements}=rendered();
  assert.equal(elements.filter(el=>attr(el.tag,'data-x')===name&&Object.entries(data).every(([k,v])=>attr(el.tag,'data-'+k)===String(v))&&!el.disabled).length,1,'one visible enabled action '+name+JSON.stringify(data));
  const before=structuredClone(model);M.act(task,model,name,data);trace.push({action:name,data});return{before,after:structuredClone(model)};
 };
 const step=s=>s.field?field(s.field,s.value):action(s.action,s.data);
 return{model,trace,get,field,action,step};
}
