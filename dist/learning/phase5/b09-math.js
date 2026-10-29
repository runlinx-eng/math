// Fractions stay exact through repeated zooms and inverse operations; doubles are only for drawing.
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a||1n;};
export function rational(n,d=1){try{n=BigInt(n);d=BigInt(d);if(!d)return null;if(d<0n){n=-n;d=-d;}const g=gcd(n,d);n/=g;d/=g;if(n>1000000000n||n< -1000000000n||d>1000000000n)return null;return[Number(n),Number(d)];}catch{return null;}}
export function parse(s){if(typeof s!=='string'&&typeof s!=='number')return null;s=String(s).trim().replaceAll('−','-');let m=s.match(/^([+-]?\d{1,9})\s*\/\s*([+-]?\d{1,9})$/);if(m)return rational(m[1],m[2]);m=s.match(/^([+-]?)(\d{1,9})(?:\.(\d{1,6}))?$/);if(!m)return null;const n=BigInt(m[2]+(m[3]||''))*(m[1]==='-'?-1n:1n);return rational(n,10n**BigInt((m[3]||'').length));}
export const validR=x=>Array.isArray(x)&&x.length===2&&x.every(Number.isSafeInteger)&&x[1]>0&&Math.abs(x[0])<=1e9&&x[1]<=1e9&&JSON.stringify(rational(...x))===JSON.stringify(x);
export const add=(a,b)=>rational(BigInt(a[0])*BigInt(b[1])+BigInt(b[0])*BigInt(a[1]),BigInt(a[1])*BigInt(b[1]));
export const sub=(a,b)=>add(a,[-b[0],b[1]]);
export const mul=(a,b)=>rational(BigInt(a[0])*BigInt(b[0]),BigInt(a[1])*BigInt(b[1]));
export const div=(a,b)=>b[0]===0?null:rational(BigInt(a[0])*BigInt(b[1]),BigInt(a[1])*BigInt(b[0]));
export const cmp=(a,b)=>{const x=BigInt(a[0])*BigInt(b[1])-BigInt(b[0])*BigInt(a[1]);return x===0n?0:x<0n?-1:1;};
export const equal=(a,b)=>!!a&&!!b&&cmp(a,b)===0;
export const fmt=r=>r[1]===1?String(r[0]):r[0]+'/'+r[1];
export const approx=r=>r[0]/r[1];
export const midpoint=(a,b)=>div(add(a,b),[2,1]);
export const between=(x,a,b)=>!!x&&cmp(a,x)<0&&cmp(x,b)<0;
export const normalized=s=>String(s).replace(/\s/g,'').replaceAll('−','-').replaceAll('≥','>=').replaceAll('≤','<=');
export const squareVsTwo=r=>{const x=BigInt(r[0])**2n-2n*BigInt(r[1])**2n;return x===0n?0:x<0n?-1:1;};
export function spanCmp(a,b,c,d){const n1=BigInt(b[0])*BigInt(a[1])-BigInt(a[0])*BigInt(b[1]),n2=BigInt(d[0])*BigInt(c[1])-BigInt(c[0])*BigInt(d[1]);const x=n1*BigInt(c[1])*BigInt(d[1])-n2*BigInt(a[1])*BigInt(b[1]);return x===0n?0:x<0n?-1:1;}
