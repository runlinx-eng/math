// Read-only grade labels anchored to existing 3D positions.
// Grade mapping is three TWO-YEAR stages; these overlays never create yearly IDs,
// prerequisite edges, coordinates, or learning evidence.
export const GRADE_SPATIAL_STAGE_LABELS=Object.freeze(['1—2年级','3—4年级','5—6年级']);
export function buildGradeSpatialMetadata(space,model){
  if(!space?.nodes||!space?.packs||!Array.isArray(model?.nodeMappings)||!Array.isArray(model?.packs)||model.stages?.length!==3)
    throw new Error('Grade spatial cards require the existing 3-stage source model');
  const nodes=new Map(),packs=new Map(),stages=[];
  for(const record of model.nodeMappings){
    const node=space.nodes.get(record.nodeId);
    if(!node)throw new Error('Grade spatial node has no source position: '+record.nodeId);
    nodes.set(record.nodeId,{id:record.nodeId,packId:record.packId,roles:{...record.curriculum.roles},
      primaryStages:[...record.curriculum.primaryStages],evidence:record.curriculum.evidenceLevel,position:[...node.position]});
  }
  for(const record of model.packs){
    const pack=space.packs.get(record.packId);
    if(!pack)throw new Error('Grade spatial pack has no source position: '+record.packId);
    const marks={};
    for(const stage of model.stages){
      const source=record.stageJudgements[stage.id];
      marks[stage.id]=!source||source.recordStatus==='incomplete'?'待补充':source.markLabel;
    }
    packs.set(record.packId,{id:record.packId,name:record.name||pack.title,themeId:record.themeId,
      position:[...pack.position],marks});
  }
  for(const stage of model.stages){
    const members=[...nodes.values()].filter(node=>node.primaryStages.includes(stage.id));
    const center=[0,1,2].map(axis=>members.length?members.reduce((sum,node)=>sum+node.position[axis],0)/members.length:0);
    const countsByPack={},roleCounts={main:0,extension:0,transition:0};
    for(const item of members){countsByPack[item.packId]=(countsByPack[item.packId]||0)+1;
      if(Object.hasOwn(roleCounts,item.roles[stage.id]))roleCounts[item.roles[stage.id]]++;
    }
    stages.push({id:stage.id,label:stage.label||stage.standardStage||stage.id,position:center,count:members.length,
      nodeIds:members.map(item=>item.id),packIds:Object.keys(countsByPack),countsByPack,roleCounts});
  }
  return {stages,packs,nodes,counts:{stages:stages.length,packs:packs.size,nodes:nodes.size}};
}
function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
export function placeGradeStageCard(anchor,size,viewport,blocked=[]){
  if(!anchor?.visible||!Number.isFinite(anchor.x)||!Number.isFinite(anchor.y))return null;
  const {w,h}=size,positions=[[15,-h-16],[-w-15,-h-16],[15,15],[-w-15,15]];
  for(const [dx,dy] of positions){
    const rect={x:anchor.x+dx,y:anchor.y+dy,w,h};
    if(rect.x<18||rect.y<105||rect.x+w>viewport.width-80||rect.y+h>viewport.height-100)continue;
    if(blocked.some(box=>overlap(rect,box)))continue;
    return rect;
  }
  return null;
}
export class GradeSpatialCards{
  constructor(scene,space,callbacks={}){
    this.scene=scene;this.space=space;this.callbacks=callbacks;this.metadata=null;this.hoveredStageId=null;
    this.layer=document.createElement('div');this.layer.className='grade-spatial-layer';
    this.layer.hidden=true;scene.host.append(this.layer);this.stageButtons=[];this.packButtons=[];this.currentStageId=null;
  }
  setModel(model){
    this.metadata=buildGradeSpatialMetadata(this.space,model);
    this.layer.replaceChildren();this.stageButtons=[];this.packButtons=[];
    this.metadata.stages.forEach((stage,index)=>{
      const b=document.createElement('button');b.type='button';b.className='grade-spatial-stage';
      b.dataset.action='grade-spatial-stage-select';b.dataset.grade=String(index*2+1);
      b.dataset.stageId=stage.id;
      const main=document.createElement('strong'),sub=document.createElement('small');
      main.textContent=stage.label;sub.textContent='相关知识点 '+stage.count+' · 两年学段';
      b.append(main,sub);b.hidden=true;
      b.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch')this.setHover(stage.id);});
      b.addEventListener('pointerleave',event=>{if(event.pointerType!=='touch'&&this.hoveredStageId===stage.id)this.setHover(null);});
      b.addEventListener('focus',()=>this.setHover(stage.id));
      b.addEventListener('blur',()=>{if(this.hoveredStageId===stage.id)this.setHover(null);});
      this.layer.append(b);this.stageButtons.push({element:b,stage});
    });
    // Knowledge-group badges are UI anchors at real source-group centroids.
    // They never move groups or add prerequisite edges to the graph.
    for(const pack of this.metadata.packs.values()){
      const b=document.createElement('button');b.type='button';b.className='grade-spatial-pack';
      b.dataset.action='grade-space-pack';b.dataset.packId=pack.id;
      b.title=pack.name;
      const name=document.createElement('strong'),detail=document.createElement('small');
      name.textContent=pack.name;b.append(name,detail);b.hidden=true;
      b.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch')this.scene.setMapHover('pack:'+pack.id);});
      b.addEventListener('pointerleave',event=>{if(event.pointerType!=='touch'&&this.scene.hoverMapKey==='pack:'+pack.id)this.scene.setMapHover(null);});
      this.layer.append(b);this.packButtons.push({element:b,pack,detail});
    }
  }
  setHover(stageId){
    if(this.hoveredStageId===stageId)return;
    this.hoveredStageId=stageId;
    this.callbacks.onStageHover?.(stageId);
    this.stageButtons.forEach(({element,stage})=>element.dataset.hover=String(stage.id===stageId));
  }
  stageForGrade(grade){return this.metadata?.stages[Math.floor((grade-1)/2)]||null;}
  applyGrade(grade){
    if(!this.metadata)return;
    const stage=this.metadata.stages[Math.floor((grade-1)/2)];if(!stage)return;
    this.currentStageId=stage.id;
    for(const {object,el} of this.scene.labels){
      if(object.kind!=='node'&&object.kind!=='pack')continue;
      const data=object.kind==='pack'?this.metadata.packs.get(object.id):this.metadata.nodes.get(object.id);
      let tag=el.querySelector('.grade-spatial-tag');
      if(!tag){tag=document.createElement('small');tag.className='grade-spatial-tag';el.append(tag);}
      if(!data){tag.textContent='';continue;}
      if(object.kind==='pack')tag.textContent=data.marks[stage.id]||'待补充';
      else tag.textContent=data.roles[stage.id]?stage.label+' · '+({main:'主要',extension:'延伸',transition:'过渡'}[data.roles[stage.id]]||data.roles[stage.id]):'本学段未映射';
    }
    this.stageButtons.forEach(({element,stage:item})=>element.setAttribute('aria-pressed',String(item.id===stage.id)));
    for(const {detail,pack} of this.packButtons)detail.textContent=(stage.countsByPack[pack.id]||0)+'个映射节点 · '+(pack.marks[stage.id]||'待补充');
    this.scene.dirty=true;
  }
  update({active,guideVisible=false,exclusions=[]}={}){
    this.layer.hidden=!active||guideVisible||!this.metadata;
    if(this.layer.hidden)return;
    const blocked=[...exclusions];
    const viewport={width:this.scene.width,height:this.scene.height};
    for(const [index,{element,stage}] of this.stageButtons.entries()){
      const p=this.scene.project(stage.position);
      let box=placeGradeStageCard(p,{w:152,h:49},viewport,blocked);
      // Fallback is a clearly marked *screen-space control*, not a new graph
      // coordinate or an invented mathematical trunk.
      let docked=false;
      if(!box){
        const startX=Math.max(390,Math.round((viewport.width-482)/2));
        for(const y of [136,200,264]){
          const candidate={x:startX+index*165,y,w:152,h:49};
          if(candidate.x+candidate.w>viewport.width-18||candidate.y+candidate.h>viewport.height-95)continue;
          if(blocked.some(other=>overlap(candidate,other)))continue;
          box=candidate;docked=true;break;
        }
      }
      element.hidden=!box;
      element.dataset.placement=docked?'dock':'anchor';
      if(!box)continue;
      element.style.transform='translate('+Math.round(box.x)+'px,'+Math.round(box.y)+'px)';
      blocked.push(box);
    }
    // Dense overlaps cannot show 23 permanent labels legibly. Keep up to
    // seven real, map-anchored groups visible; all 23 remain in the side index.
    const focus=this.scene.gradeSpatialFocus;
    const activeStage=this.metadata.stages.find(stage=>stage.id===(focus?.stageId||this.hoveredStageId||this.currentStageId));
    const hoveredPack=this.scene.hoverMapKey?.startsWith('pack:')?this.scene.hoverMapKey.slice(5):null;
    const selectedPack=this.scene.selected?.startsWith('pack:')?this.scene.selected.slice(5):null;
    const ranked=activeStage?[...this.packButtons]
      .filter(item=>activeStage.packIds.includes(item.pack.id))
      .sort((a,b)=>(activeStage.countsByPack[b.pack.id]||0)-(activeStage.countsByPack[a.pack.id]||0)||a.pack.id.localeCompare(b.pack.id)):[];
    const maxItems=viewport.width>=1200?7:4;
    const chosen=new Set(ranked.slice(0,maxItems).map(item=>item.pack.id));
    if(hoveredPack)chosen.add(hoveredPack);
    if(selectedPack)chosen.add(selectedPack);
    for(const {element,pack} of this.packButtons){
      if(!chosen.has(pack.id)){element.hidden=true;continue;}
      const projection=this.scene.project(pack.position);
      const rect=placeGradeStageCard(projection,{w:146,h:40},viewport,blocked);
      element.hidden=!rect;
      if(!rect)continue;
      element.style.transform='translate('+Math.round(rect.x)+'px,'+Math.round(rect.y)+'px)';
      element.dataset.placement='source-centroid';
      blocked.push(rect);
    }
  }
}
