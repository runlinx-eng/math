// Decimal arithmetic stays in millionths. No binary floating rounding at ties.
export const Q=1000000;
export function ticks(v){if(typeof v!=='string'&&typeof v!=='number')return null;const s=String(v).trim();if(!/^-?\d+(?:\.\d{1,6})?$/.test(s))return null;const sign=s[0]==='-'?-1:1,[a,b='']=s.replace('-','').split('.'),n=sign*(Number(a)*Q+Number(b.padEnd(6,'0')));return Number.isSafeInteger(n)&&Math.abs(n)<=100000000*Q?n:null;}
export function decimal(n,dp=null){if(!Number.isSafeInteger(n))return '';const sign=n<0?'-':'',a=Math.abs(n),s=String(a%Q).padStart(6,'0');return sign+Math.floor(a/Q)+(dp===0?'':dp===null?(a%Q?'.'+s.replace(/0+$/,''):''):'.'+s.slice(0,dp));}
export const dpFor=u=>Math.max(0,-Math.round(Math.log10(ticks(u)/Q)));
export function rounded(v,u){const a=ticks(v),b=ticks(u);if(a===null||b===null||a<0||b<=0)return null;const low=Math.floor(a/b)*b,high=low+b;return{low,high,result:a-low<b/2?low:high,position:Math.round((a-low)/b*1000)};}
export function sfUnit(v,sf){const n=ticks(v);if(!(n>0))return null;const exponent=Math.floor(Math.log10(n/Q))-sf+1;return decimal(Math.round(Q*10**exponent));}
export function significant(v,sf){const s=String(v),start=s.search(/[1-9]/),out=[];for(let i=start;i<s.length&&out.length<sf;i++)if(/\d/.test(s[i]))out.push(i);return out;}
export function chinese(n){const d='零一二三四五六七八九',u=['','十','百','千'];if(!Number.isInteger(n)||n<0||n>10000000)return '';if(n===0)return'零';function group(v){let out='',zero=false;for(let e=3;e>=0;e--){const z=Math.floor(v/10**e)%10;if(z){if(zero)out+='零';out+=d[z]+u[e];zero=false;}else if(out)zero=true;}return out;}let out;if(n<10000)out=group(n);else{const high=Math.floor(n/10000),low=n%10000;out=group(high)+'万'+(low?(low<1000?'零':'')+group(low):'');}return out.replace(/^一十/,'十');}
export const romanTable=[[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
export function roman(n){if(!Number.isInteger(n)||n<1||n>3999)return '';let s='';for(const[v,l]of romanTable)while(n>=v){s+=l;n-=v;}return s;}
export function romanParts(s){const a=[];for(let i=0;i<s.length;i++){const pair=s.slice(i,i+2),r=romanTable.find(x=>x[1]===pair);if(r){a.push(pair);i++;}else a.push(s[i]);}return a;}
export const romanValue=s=>{const d={I:1,V:5,X:10,L:50,C:100,D:500,M:1000};let n=0;for(let i=0;i<s.length;i++){if(!d[s[i]])return null;n+=d[s[i]]<(d[s[i+1]]||0)?-d[s[i]]:d[s[i]];}return n;};
