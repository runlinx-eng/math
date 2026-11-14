// Reviewed native identities and source values; intentionally independent of
// runtime binding declarations so an accidental scope change cannot self-pass.
module.exports=[
 ['unitorder',0,'mt_IfEgu0X449',['1/2','1/5','1/3','1/4']],
 ['unitorder',1,'mt_IfEgu0X449',['3/5','1/5','4/5','2/5']],
 ['unitorder',2,'mt_IfEgu0X449',['1/5','1/2','3/5']],
 ['fractionchoices',1,'mt_SsLWS_APM7',['1/3','3/4','1/2']],
 ['samepartcompare',0,'mt_HnKbuCliNS',['3/8','3/4']],
 ['samepartcompare',1,'mt_HnKbuCliNS',['5/6','2/6']],
 ['samepartcompare',2,'mt_HnKbuCliNS',['3/4','3/8']],
 ['fractionbench',0,'mt_SXbZ3bC9z7',['3/8','5/12']],
 ['fractionbench',1,'mt_SXbZ3bC9z7',['2/3','3/5','7/10']],
 ['fractionbench',2,'mt_SXbZ3bC9z7',['5/8','3/7']],
 ['beyondoneorder',0,'mt_PL9VkDwXfh',['3/4','7/8','5/6','11/12']],
 ['beyondoneorder',1,'mt_PL9VkDwXfh',['7/5','4/3']],
 ['beyondoneorder',2,'mt_PL9VkDwXfh',['1 2/5','4/3','7/4']],
 ['beyondoneorder',3,'mt_PL9VkDwXfh',['5/6','7/9']],
 ['simplestparts',1,'mt_b7T-CjOYUR',['2/3','5/8']],
 ['fdpswitch',2,'mt_4K1dr204Hi',['30%','1/3','0.35']],
 ['fdpswitch',4,'mt_4K1dr204Hi',['30%','2/5','0.35']],
 ['fractionsanity',2,'mt_e7filQgayF',['3/7','1/2','9/10']],
 ['representations39',4,'mt_IwEOCN6bL1',['5/8','3/7']],
 ['representations39',5,'mt_IwEOCN6bL1',['5/8','4/7']]
].map(([id,index,nodeId,cards])=>({id,sessionId:id,index,nodeId,cards}));

// Complete original question hashes from the deliberate Issue #132 review.
const hashes={
 "unitorder:0": "d31670532614e8f36649b15c95a6aa07048889b48904b6df8f7f8091ab8d3b05",
 "unitorder:1": "1f346e7266a611a6c48d4db97616aa1e3d1300a8323d425f8cc7fdd97d47bc30",
 "unitorder:2": "55d9753cfca3367829c8c18b5694aca9feb8d7df8f2220ad5f583a566e4aeb22",
 "fractionchoices:1": "921abb690a0fced0f82f7c286a6f4036e5e13212d6297045a971e0fdeb4ddd7f",
 "samepartcompare:0": "5ec90be29e9a8e2070fc01808f5a02159dea55f8d23a5e4956547e18d10cfd8d",
 "samepartcompare:1": "e2cafff268857474f142dc5d83c815654bc8e58778a2168b09c77e04957cc92d",
 "samepartcompare:2": "efe85dbe29fab3f63444418bd445d732b76cc96e47050e1bf35f78b78e0cebc9",
 "fractionbench:0": "9ce54ad7ecce2c5113ad24da739a12ddd37ac8ea6efd2c7fe3cedff70574d59e",
 "fractionbench:1": "092bbbedc8fdd91059dc471599b7663764636024e8dcc861ff954c92a6386c73",
 "fractionbench:2": "160de41f6b20f179d8b92ba4bb212d03c94b8781bab3da4dda84314eb726f9dd",
 "beyondoneorder:0": "11e45ab317860b01e0c62f5ceabd41a9d86df45d21c59eca130b43f621c7d96d",
 "beyondoneorder:1": "bf320e4485a67517baba5ad461799cc405aab7f6c1b0f68c515d8e988678e572",
 "beyondoneorder:2": "b93e580eef90e09de5f19c352a48d8496331f03af0a0e8445fffd8c7300caeb6",
 "beyondoneorder:3": "20774ba4327bd910d0a7441bf82bf7bd63f020a2a6cecb3206fcb1bfcab15d86",
 "simplestparts:1": "816be5b82e861e42e25f5591cfae7c13d6f21d85faac85ae9e3ca569c40d8831",
 "fdpswitch:2": "6f13dcc18e4bfacd9572c6c06c7443d153a0e121182e2d48ccd714838f07f912",
 "fdpswitch:4": "5b5f32997e65a058459b0ea32379c40df78aa543138439608860c1d87fd67b6f",
 "fractionsanity:2": "9d0b5a335a6e5c03e1509d1bd2885c032793cfdec5f99a65de0aea340d104f71",
 "representations39:4": "160de41f6b20f179d8b92ba4bb212d03c94b8781bab3da4dda84314eb726f9dd",
 "representations39:5": "2c4d6d6b59982aab35e4b1bb0d933327d7b3eb914094105ea2be2951c84b0c4b"
};
for(const row of module.exports)row.taskHash=hashes[row.id+':'+row.index];
