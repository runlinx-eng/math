// Independent reviewed positions for the mature-family expansion. This fixture
// is shared by Node and browser checks, never imported by product bindings.
const source=(id,indices,nodeId)=>indices.map(index=>({id,index,nodeId}));
const sequence=[
 ...source('linear34',[0,1,2],'mt_hBZwbst0ow'),
 ...source('paired34',[2],'mt_fxPtngwUfz'),
 ...source('rules34',[0,1,2],'mt_yXO7lQ9Yn7'),
 ...source('shapeseq34',[0,2],'mt_A-FyLLLLzy'),
 ...source('generate34',[2],'mt_QeKWt4BZn3'),
 ...source('design34',[2],'mt_nx4a3kH-59')
];
const array=[
 ...source('equalgroups',[2],'mt_PZ909yPrEC'),
 ...source('bagstories',[2],'mt_wh3UqnWsa7'),
 ...source('groupsproblems',[2],'mt_qUjW0N1cYO'),
 ...source('divisionmeaning',[3],'mt_iNdrM2-oJf'),
 ...source('arraystart',[0,1,2],'mt_GRWwTDZ3wD'),
 ...source('rowsums',[0,2],'mt_B1zj1RwQ3a'),
 ...source('mulsymbols',[0,2],'mt_zOWwLxa77y'),
 ...source('turnarray',[0,1],'mt_C9ZfT-4cgn'),
 ...source('productmeaning',[1],'mt_gtTl3R5buH'),
 ...source('tables2510',[0,1],'mt_HhuSDxwDNM'),
 ...source('tables348',[0,1,2],'mt_wQ89AEXhz3'),
 ...source('tables12',[0,2],'mt_K5jM7vlVhA'),
 ...source('missingfactor',[0,1],'mt_GDG9_SZmsO'),
 ...source('unknownproducts',[0,1,2,3,4,5],'mt_xZvDCYA5Ae'),
 ...source('mentalproducts',[0],'mt_pjfmCMMPjO'),
 ...source('tensproducts',[0,1,2,3],'mt_isojCL9yy-'),
 ...source('productways',[0,1],'mt_Lb2ZnMdkYR'),
 ...source('mixedfacts',[0],'mt_WX30dzi4dt'),
 ...source('tablepatterns',[0,2,3],'mt_w6MxaaoMXZ'),
 ...source('scaleandpair',[3],'mt_EmR5n58jZt'),
 ...source('groupstories',[3],'mt_Zdv-b-iW5K')
];
module.exports={sequence,array};
