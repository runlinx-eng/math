// Independent native positions and complete source-task hashes. Runtime
// admission never imports this test fixture or derives an MP label from type.
const source=(id,indices,nodeId)=>indices.map(index=>({id,sessionId:id,index,nodeId}));
const reviewedHashes=[
 '762c1cf3319eba6a80289ceb288700f9a275b7647982688dbd0eb925c774623f',
 '3f902918117390b42cd461974c9d1b0be8460f7df58706d080fdefe0520f3995',
 '83f3e850fadeaf1a597b1f7bc9c8ec26742024cccfc6dd93b503af1df69702db',
 'b4a463cd84f25ae1fd63183e739dde07848c6f4b68ecfbaed085b6826de68e1d',
 '8c1ad1611f2865494ca0b046d6ef247f7e708ba8127a5c1b7814e1f0539fbab1',
 '9e101ea56e12a0272af0b69aeb76df3c372b1f001f3de8881d9df0f9eee57574',
 'cacac955653cdfc02ab1380b2aef79c36d56189194c92f8f923a9fd696131262',
 'ac024c03ed9e5624191fde9452d176b35a7b7010908c226933a4affc7ab29c74',
 '7f3c26a0b032914b310299303fa7b3b284ce6ac475ea92815c14f0fdb5b780a1',
 '88126974b4265f716acc4f35ce1cd9090dd4a3a5c252b8f9a162d3dd10c8e78e',
 '6838fefb78065cc84ff165e495f9e8b82e297644710142113c87a6c302ca949a',
 '16246392f3c9e47ea76e767be8faf47c7d66c715e1d713e3efab180b09c8532d',
 '096cd89b6d7e45f40251663d15a6992010afa9da38859d94da4e21c9776b50a5',
 '7c09f9552ff1bcfc5dce044c5f0aad174ce3c05b3c6bfe740ed26251231ca242',
 '4c910af903d00f8aa6c55d8315887967934dda2fa49900fa3a41c48fcd8d774e',
 '7a3daf012736a5b9925b603b58c7c3c5799345358b31d04a2065583d59d96926',
 'fed6fd0bbafe6afd39c3bcdc95fe64b9d6674cd3fcf96d5364ae56541024149a',
 'c9f45a8f6d24ea388f5a2f6e47deba1a9168ba85b84e8c3c99f0168460005efa',
 '11b49204bbc198e731db0dca1ee27ab5d59b321f8e2724ad78ac4ca640d0a1d5',
 '95ce7d633ec98601d6070b6633afafa1eabe4f069b66e3b909a8a37da947a3a5',
 '39990c02841e680052aadcb2b65c07593dec7c13a44a2583d7c759131dea1cf4',
 'd52eb1987a68d9d73963adc2210a144c4127363f3cdcb5327d9a62106462a00f',
 '762c1cf3319eba6a80289ceb288700f9a275b7647982688dbd0eb925c774623f'
];
const cases=[
 ...source('pointmove',[0,1,2],'mt_Uq5vYqboCR'),
 ...source('gridmotion',[0,1,2],'mt_SH7QgFl8-v'),
 ...source('flipandmove',[0,1,2],'mt_efOeaGFyGM'),
 ...source('geometrylab',[0,1,2],'mt_RdfzwInyAj'),
 ...source('axisrules',[0,1,2],'mt_lxaM6iVpdr'),
 ...source('gridchange',[0,1,2],'mt_K0Y15w48SY'),
 ...source('growshape',[0,1,2],'mt_y-BuQAfw4B'),
 ...source('similar37',[1],'mt_2OtRUM_0zW'),
 ...source('tooladv39',[1],'mt_ZJC7JnnPCu')
].map((entry,index)=>Object.freeze({...entry,taskHash:reviewedHashes[index]}));
module.exports={cases};
