// Read-only display priorities. Never infer mathematical mastery from an opened session.
const countAttempts=cases=>Object.values(cases||{}).reduce((sum,row)=>sum+(Array.isArray(row?.attempts)?row.attempts.length:0),0);
const hasText=value=>typeof value==='string'&&value.trim().length>0;
export function lessonRecordTier(record){
  if(!record||typeof record!=='object')return 'available';
  if(countAttempts(record.cases)>0||(record.notes?.length||0)>0)return 'evidence';
  if(hasText(record.draft)||Object.values(record.cases||{}).some(row=>row?.support)
    ||record.view==='task'||record.view==='summary'||record.index>0)return 'draft';
  return 'available';
}
export function activityRecordTier(record){
  if(!record||typeof record!=='object')return 'available';
  const cases=Object.values(record.evidence||{});
  if(cases.some(row=>row?.attempts?.length)||(record.observations?.length||0)>0||(record.notes?.length||0)>0)return 'evidence';
  if(hasText(record.draft)||cases.some(row=>row?.support)||record.lab?.changed||record.stage!=='play')return 'draft';
  return 'available';
}
export function journeyRecordTier(record){
  if(!record)return 'available';
  if((record.attempts?.length||0)>0||(record.observations?.length||0)>0||(record.notes?.length||0)>0||record.finishedAt)return 'evidence';
  return 'draft';
}
export function tieredIds(ids,records,classify){
  const groups={evidence:[],draft:[],available:[]};
  for(const id of ids)if(records?.[id])groups[classify(records[id])].push(id);
  return groups;
}
