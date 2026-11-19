'use strict';
// Frozen, source-reviewed native B28 length comparisons. These values are
// independently transcribed from the existing original tasks, not generated
// by the proof adapter. Seven cross-course copies are deliberately excluded.
const cases=Object.freeze([
 {id:'compareheight',index:0,nodeId:'mt_uhuxX8sg9f',mode:'compare',lengths:[6,8],want:'right',answers:[],difference:2,sorted:[0,1]},
 {id:'compareheight',index:1,nodeId:'mt_uhuxX8sg9f',mode:'compare',lengths:[9,6],want:'left',answers:[],difference:3,sorted:[1,0]},
 {id:'compareheight',index:2,nodeId:'mt_uhuxX8sg9f',mode:'compare',lengths:[4,8],want:'right',answers:['2'],difference:4,sorted:[0,1]},
 {id:'ordermeasure',index:0,nodeId:'mt_BFJ-ch_8QU',mode:'compare',lengths:[45,32],want:'left',answers:['>'],difference:13,sorted:[1,0]},
 {id:'ordermeasure',index:2,nodeId:'mt_BFJ-ch_8QU',mode:'compare',lengths:[5,5],want:'equal',answers:['='],difference:0,sorted:[0,1]},
 {id:'indirectlength',index:0,nodeId:'mt_skYly2Qm01',mode:'order',lengths:[7,3,5],want:null,answers:[],difference:4,sorted:[1,2,0]},
 {id:'indirectlength',index:1,nodeId:'mt_skYly2Qm01',mode:'indirect',lengths:[8,5,3],want:'left',answers:['yes'],difference:5,sorted:[2,1,0]},
 {id:'indirectlength',index:2,nodeId:'mt_skYly2Qm01',mode:'order',lengths:[6,9,4],want:null,answers:[],difference:5,sorted:[2,0,1]},
 {id:'lengthdifference',index:0,nodeId:'mt_xWg0lI_gG4',mode:'compare',lengths:[14,7],want:'left',answers:['7'],difference:7,sorted:[1,0]},
 {id:'lengthdifference',index:1,nodeId:'mt_xWg0lI_gG4',mode:'compare',lengths:[160,120],want:'left',answers:['40'],difference:40,sorted:[1,0]},
 {id:'lengthdifference',index:2,nodeId:'mt_xWg0lI_gG4',mode:'compare',lengths:[12,9],want:'left',answers:['3'],difference:3,sorted:[1,0]}
]);
module.exports={cases};
