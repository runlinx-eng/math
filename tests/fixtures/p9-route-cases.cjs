// Independently reviewed native positions. Product bindings do not import this
// fixture; hashes below pin complete source questions for deliberate review.
const source=(id,indices,nodeId)=>indices.map(index=>({id,sessionId:id,index,nodeId}));
const reviewedHashes=[
 '00463817647b952d81e4b2619b85f33c8523883d4c4419bde6df9c168856f749',
 'ffbefb193ffc64437975f7f297c08a95cd29db2a5a9cc549afbca20b27afc08d',
 'b8f75428b8dda16559f9a0a5b80d806dfb979d9494c04938eb5ee1b68e7f2088',
 '8bf6089945c6c7a8ba4cf7f1d8f63d8e5d30bc48023f5b6b90480a4144d247a7',
 '254f13a86181341e343b4d0b42175aae69f669fdabbcf0f7bc791d5899a60e0a',
 'a58c1e834472f5379fa5d2bc1cc70d571d3c28743c233da99f22fbca731cd8f8',
 '5a3c38ea2b3da4963949db907a5d18fd292755b858fd29622a0ddaa4a62ccb27',
 '3689b7cb909c36f74bbf686b373b1fc0a66ed019c9948804f7e18c158fee5dc4',
 'f3ec43113db9036d7f8cb923ec11c776008eccf91556fbc061be1982eaacf1c2',
 '8adb3ef6c29b198205ddcf9306175b0c1d878aab862a8f847f634aad43b0240a',
 '3be7cda9850a7cf33a46845cf41fa4ad4ffcaa6f4e2693b4023d1d72aa6dac1c',
 '87c5e1d675ee2f4bfe5b9914494d3059b0425c4c81b5c519e92169f20aeb90b0',
 '9c84a12e613bd643fe36816dd7dd1cd26e8fc2323ff4685e288a60fbe15bf85b',
 'ee248e0a440ac5591ca8b2a49e78396b2b777da8508787df65c3c44a434af096',
 'bf52e482190e26d55b3d357755099d5eed7730acd026a17d8ce6b033c8b1597d'
];
const cases=[
 ...source('onesbridge',[2,3],'mt_AKAtWEwpcj'),
 ...source('twodigitpair',[2],'mt_UQnAFPs83F'),
 ...source('addhundred',[0,2],'mt_glPPG-kTQY'),
 ...source('flexhundred',[2,3],'mt_cChv2j_-Da'),
 ...source('oneslarge',[0,1],'mt_oDU_8zMZjp'),
 ...source('showwhy',[1],'mt_zxST3MarI9'),
 ...source('flexthousand',[0,1],'mt_HFRYjTb-Z5'),
 ...source('mentalbig',[0,1,2],'mt_MWXPiaTnEu')
].map((entry,index)=>Object.freeze({...entry,taskHash:reviewedHashes[index]}));
module.exports={cases};
