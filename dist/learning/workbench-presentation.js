// B1: a visual rhythm derived solely from the validated existing stage.
 // Reading is always available; exploration can start immediately. No new
 // stage, model field, completion requirement or fabricated "read" event.
export const WORKBENCH_BEATS=Object.freeze([
  {id:'read',label:'看清问题'},
  {id:'try',label:'动手尝试'},
  {id:'check',label:'检查验证'},
  {id:'record',label:'记下发现'}
]);
export function workbenchBeat(stage='explore'){
  if(stage==='reflect')return 'record';
  if(['revise','recheck','passed'].includes(stage))return 'check';
  return 'try';
}
