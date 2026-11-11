// OrbitControls can round an idle camera target by one double-precision step.
// Only the camera vectors allow roundoff; model coordinates and all other
// snapshot fields retain the original exact JSON comparison.
const sameCameraVector=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===3&&b.length===3&&
 a.every((value,index)=>Number.isFinite(value)&&Number.isFinite(b[index])&&
  Math.abs(value-b[index])<=4*Number.EPSILON*Math.max(1,Math.abs(value),Math.abs(b[index])));

module.exports=function sameSnapshotWithCameraRoundoff(before,after){
 const {position:beforePosition,target:beforeTarget,...beforeState}=JSON.parse(before);
 const {position:afterPosition,target:afterTarget,...afterState}=JSON.parse(after);
 return sameCameraVector(beforePosition,afterPosition)&&sameCameraVector(beforeTarget,afterTarget)&&
  JSON.stringify(beforeState)===JSON.stringify(afterState);
};
