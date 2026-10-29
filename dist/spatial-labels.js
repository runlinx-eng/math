// Screen-space label placement never changes the knowledge object's world home.
export const overlaps=(a,b,gap=8)=>a.x<b.x+b.w+gap&&a.x+a.w+gap>b.x&&a.y<b.y+b.h+gap&&a.y+a.h+gap>b.y;
export function placeLabel({x,y,w,h,viewport,occupied,kind='node'}){
  const top=viewport.top??105,bottom=viewport.bottom??100,margin=16;
  const shifts=kind==='global-theme'?[[0,-24],[-185,-24],[185,-24],[0,-105],[0,62],[-185,62],[185,62],[-185,-105],[185,-105],[0,145],[0,-186]]:
    kind==='theme'?[[0,-20],[0,-102],[0,65],[-95,-20],[95,-20],[0,-182],[0,145],[0,-262],[0,225]]:
    kind==='pack'?[[0,16],[0,-52],[-75,16],[75,16],[0,65],[0,-98]]:
    [[0,14],[0,-40],[-70,5],[70,5],[0,50],[0,-78]];
  for(const[dx,dy]of shifts){const r={x:Math.max(margin,Math.min(viewport.w-w-margin,x-w/2+dx)),y:y+dy,w,h};
    if(r.y<top||r.y+h>viewport.h-bottom||occupied.some(o=>overlaps(r,o)))continue;
    return r;
  }
  return null;
}
