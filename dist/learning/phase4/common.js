export const num=(v,min=0,max=10000)=>v===null||Number.isFinite(v)&&v>=min&&v<=max;
export const int=(v,min=0,max=1000)=>Number.isInteger(v)&&v>=min&&v<=max;
export const ids=(a,max)=>Array.isArray(a)&&a.length<=max&&new Set(a).size===a.length&&a.every(v=>int(v,0,max-1));
export const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export const near=(a,b)=>Number.isFinite(a)&&Math.abs(a-b)<1e-6;
export function shape(m,template){if(m===null||typeof m!=='object'||Array.isArray(m))return false;return Object.entries(template).every(([k,v])=>v===null?num(m[k],-10000,10000):Array.isArray(v)?Array.isArray(m[k])&&m[k].length<=10000:typeof v==='number'?num(m[k],-10000,10000)&&m[k]!==null:typeof v==='string'?typeof m[k]==='string'&&m[k].length<=2000:typeof v==='boolean'?typeof m[k]==='boolean':shape(m[k],v));}
export function fractionValue(s){const m=String(s).trim().match(/^(\d+)\s*\/\s*(\d+)$/);return m&&+m[2]>0?+m[1]/+m[2]:NaN;}
export const outcome=(correct,feedback)=>({correct,code:correct?'correct':'construction',feedback:correct?'作品和记录对应上了。换个条件，再试试。':feedback});
