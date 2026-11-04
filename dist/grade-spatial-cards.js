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
    stages.push({id:stage.id,label:stage.label||stage.standardStage||stage.id,position:center,count:members.length});
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
  constructor(scene,space){
    this.scene=scene;this.space=space;this.metadata=null;
    this.layer=document.createElement('div');this.layer.className='grade-spatial-layer';
    this.layer.hidden=true;scene.host.append(this.layer);this.stageButtons=[];
  }
  setModel(model){
    this.metadata=buildGradeSpatialMetadata(this.space,model);
    this.layer.replaceChildren();this.stageButtons=[];
    this.metadata.stages.forEach((stage,index)=>{
      const b=document.createElement('button');b.type='button';b.className='grade-spatial-stage';
      b.dataset.action='grade-spatial-stage-select';b.dataset.grade=String(index*2+1);
      b.dataset.stageId=stage.id;
      const main=document.createElement('strong'),sub=document.createElement('small');
      main.textContent=stage.label;sub.textContent='相关知识点 '+stage.count+' · 两年学段';
      b.append(main,sub);b.hidden=true;this.layer.append(b);this.stageButtons.push({element:b,stage});
    });
  }
  applyGrade(grade){
    if(!this.metadata)return;
    const stage=this.metadata.stages[Math.floor((grade-1)/2)];if(!stage)return;
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
    this.scene.dirty=true;
  }
  update({active,guideVisible=false,exclusions=[]}={}){
    this.layer.hidden=!active||guideVisible||!this.metadata;
    if(this.layer.hidden)return;
    const blocked=[...exclusions];
    const viewport={width:this.scene.width,height:this.scene.height};
    for(const {element,stage} of this.stageButtons){
      const p=this.scene.project(stage.position);
      const box=placeGradeStageCard(p,{w:152,h:49},viewport,blocked);
      element.hidden=!box;
      if(!box)continue;
      element.style.transform='translate('+Math.round(box.x)+'px,'+Math.round(box.y)+'px)';
      blocked.push(box);
    }
  }
}
