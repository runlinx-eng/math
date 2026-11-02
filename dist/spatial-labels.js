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


// A guide cue is an instruction attached to a real screen-projected point,
// not a knowledge label or a prerequisite edge. Place every cue outside the
// existing prompts so nearby fork choices stay independently clickable.
export function placeGuideCue({x,y,w,h,viewport,occupied=[]}){
  const margin=14,top=152,bottom=105,right=92,gap=20;
  const candidates=[
    [x-w/2,y-h-gap], [x-w/2,y+gap],
    [x+gap,y-h-gap], [x-w-gap,y-h-gap],
    [x+gap,y+gap], [x-w-gap,y+gap],
    [x+gap,y-h/2], [x-w-gap,y-h/2],
    [x-w/2,y-h-gap-68], [x-w/2,y+gap+68],
    [x-w-gap,y-h-gap-68], [x+gap,y-h-gap-68],
    [x-w-gap,y+gap+68], [x+gap,y+gap+68]
  ];
  const fits=r=>r.x>=margin&&r.y>=top&&r.x+r.w<=viewport.w-right&&r.y+r.h<=viewport.h-bottom;
  for(const [left,upper] of candidates){
    const r={x:left,y:upper,w,h};
    if(fits(r)&&!occupied.some(o=>overlaps(r,o,10)))return r;
  }
  // Prefer a nearby free location before considering the rest of the
  // screen: a prompt should still visually belong to its source node.
  const options=[];
  for(let cy=top;cy<=viewport.h-bottom-h;cy+=Math.max(18,h/2))
    for(let cx=margin;cx<=viewport.w-right-w;cx+=Math.max(25,w/2)){
      const r={x:cx,y:cy,w,h};
      if(!occupied.some(o=>overlaps(r,o,10)))
        options.push({r,d:(cx+w/2-x)**2+(cy+h/2-y)**2});
    }
  options.sort((a,b)=>a.d-b.d||a.r.y-b.r.y||a.r.x-b.r.x);
  return options[0]?.r||null;
}
