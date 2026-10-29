export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const button=(act,text,attrs='')=>`<button type="button" data-x="${act}" ${attrs}>${text}</button>`;
export const number=(key,label,value,attrs='')=>`<label class="field">${label}<input type="number" min="0" max="10000" step="any" data-xfield="${key}" aria-label="${label}" value="${value??''}" ${attrs}></label>`;
export const input=(key,label,value,attrs='')=>`<label class="field">${label}<input type="text" maxlength="2000" data-xfield="${key}" aria-label="${label}" value="${esc(value)}" ${attrs}></label>`;
export const range=(key,label,value,min,max,step=1,disabled=false)=>`<label class="field">${label}<input type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-xfield="${key}" aria-label="${label}" ${disabled?'disabled':''}><output data-xvalue="${key}">${value}</output></label>`;
export const select=(key,label,value,options)=>`<label class="field">${label}<select data-xfield="${key}" aria-label="${label}"><option value="">选择</option>${options.map(o=>{const[v,l]=Array.isArray(o)?o:[o,o];return `<option value="${v}" ${String(v)===String(value)?'selected':''}>${l}</option>`;}).join('')}</select></label>`;
export const toggle=(a,i)=>{const p=a.indexOf(i);if(p<0)a.push(i);else a.splice(p,1);};
export function setField(m,key,value){const path=key.split('.');let parent=m;for(const p of path.slice(0,-1))parent=parent[p];parent[path.at(-1)]=value;}
