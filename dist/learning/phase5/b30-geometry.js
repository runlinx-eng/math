// Coordinates are measured in the displayed unit, not pixels.
export const key=(x,y)=>`${x},${y}`;
export const rectangle=(x,y,w,h)=>Array.from({length:w*h},(_,i)=>[x+i%w,y+Math.floor(i/w)]);
export function perimeterEdges(cells){
 const set=new Set(cells.map(([x,y])=>key(x,y))),out=[];
 for(const [x,y] of cells){
  if(!set.has(key(x,y-1)))out.push([[x,y],[x+1,y]]);
  if(!set.has(key(x+1,y)))out.push([[x+1,y],[x+1,y+1]]);
  if(!set.has(key(x,y+1)))out.push([[x,y+1],[x+1,y+1]]);
  if(!set.has(key(x-1,y)))out.push([[x,y],[x,y+1]]);
 }
 return out;
}
export function rectangleCells(a,b,width){const x1=a%width,y1=Math.floor(a/width),x2=b%width,y2=Math.floor(b/width);return rectangle(Math.min(x1,x2),Math.min(y1,y2),Math.abs(x1-x2)+1,Math.abs(y1-y2)+1);}
export function connected(cells){if(!cells.length)return false;const set=new Set(cells.map(([x,y])=>key(x,y))),todo=[cells[0]],seen=new Set();while(todo.length){const [x,y]=todo.pop(),k=key(x,y);if(seen.has(k)||!set.has(k))continue;seen.add(k);todo.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);}return seen.size===set.size;}
export const isRectangle=cells=>{if(!cells.length)return false;const xs=cells.map(c=>c[0]),ys=cells.map(c=>c[1]);return (Math.max(...xs)-Math.min(...xs)+1)*(Math.max(...ys)-Math.min(...ys)+1)===cells.length;};
export function hasHoles(cells){if(!cells.length)return false;const set=new Set(cells.map(([x,y])=>key(x,y))),xs=cells.map(c=>c[0]),ys=cells.map(c=>c[1]),minX=Math.min(...xs)-1,maxX=Math.max(...xs)+1,minY=Math.min(...ys)-1,maxY=Math.max(...ys)+1,seen=new Set(),todo=[[minX,minY]];while(todo.length){const[x,y]=todo.pop(),k=key(x,y);if(x<minX||x>maxX||y<minY||y>maxY||set.has(k)||seen.has(k))continue;seen.add(k);todo.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);}for(let x=minX;x<=maxX;x++)for(let y=minY;y<=maxY;y++)if(!set.has(key(x,y))&&!seen.has(key(x,y)))return true;return false;}
export function polygonArea(points){return Math.abs(points.reduce((s,[x,y],i)=>{const [a,b]=points[(i+1)%points.length];return s+x*b-a*y;},0))/2;}
export const perimeter=cells=>perimeterEdges(cells).length;
export function boundaryRuns(cells){
 const groups=new Map();for(const [a,b] of perimeterEdges(cells)){const horizontal=a[1]===b[1],axis=horizontal?a[1]:a[0],start=horizontal?Math.min(a[0],b[0]):Math.min(a[1],b[1]),k=(horizontal?'h':'v')+axis;(groups.get(k)||groups.set(k,[]).get(k)).push(start);}
 const out=[];for(const [k,starts]of groups){starts.sort((a,b)=>a-b);let start=starts[0],end=start+1;for(const n of starts.slice(1)){if(n===end)end++;else{out.push(k[0]==='h'?[[start,+k.slice(1)],[end,+k.slice(1)]]:[[+k.slice(1),start],[+k.slice(1),end]]);start=n;end=n+1;}}out.push(k[0]==='h'?[[start,+k.slice(1)],[end,+k.slice(1)]]:[[+k.slice(1),start],[+k.slice(1),end]]);}return out;
}
