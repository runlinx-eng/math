// Reviewed B07 source positions and complete stable SHA-256 fingerprints.
// actions are real original-model swaps/save clicks, never solved-state injection.
const cases=[
 {
  "id": "tenexchange",
  "sessionId": "tenexchange",
  "index": 0,
  "nodeId": "mt_r0VXbfAmsH",
  "taskHash": "1e1a1f1448b78990d5de27821d5a4904b363d1346a25ab39994f0af26604eef3",
  "n": 10,
  "start": [
   0,
   0,
   10,
   0
  ],
  "final": [
   0,
   0,
   10,
   0
  ],
  "actions": [
   "up1",
   "down1"
  ],
  "savedGoal": null
 },
 {
  "id": "tenexchange",
  "sessionId": "tenexchange",
  "index": 1,
  "nodeId": "mt_r0VXbfAmsH",
  "taskHash": "f89ae848a8260805af7793d7476c16ee3171112c080aef64f105466b5253b51a",
  "n": 30,
  "start": [
   0,
   3,
   0,
   0
  ],
  "final": [
   0,
   2,
   10,
   0
  ],
  "actions": [
   "down1"
  ],
  "savedGoal": null
 },
 {
  "id": "rename",
  "sessionId": "rename",
  "index": 0,
  "nodeId": "mt_Bt-iORUzdO",
  "taskHash": "5a520f97a1aab58ad45274d5c169a326d7ebb9c5b21463075c73039dde34790e",
  "n": 34,
  "start": [
   0,
   3,
   4,
   0
  ],
  "final": [
   0,
   2,
   14,
   0
  ],
  "actions": [
   "down1",
   "save"
  ],
  "savedGoal": "specified-end"
 },
 {
  "id": "rename",
  "sessionId": "rename",
  "index": 1,
  "nodeId": "mt_Bt-iORUzdO",
  "taskHash": "38ffd67e92af09e897f374cf97d73012eb336735870ad6ae35f3ac89424bef6e",
  "n": 52,
  "start": [
   0,
   5,
   2,
   0
  ],
  "final": [
   0,
   3,
   22,
   0
  ],
  "actions": [
   "save",
   "down1",
   "save",
   "down1",
   "save"
  ],
  "savedGoal": "three-different"
 },
 {
  "id": "rename",
  "sessionId": "rename",
  "index": 2,
  "nodeId": "mt_Bt-iORUzdO",
  "taskHash": "8b76a48ef774eeb0fdc660721fe7f7d41d882b0cd8f087a01af3f81f22f88e8f",
  "n": 46,
  "start": [
   0,
   4,
   6,
   0
  ],
  "final": [
   0,
   3,
   16,
   0
  ],
  "actions": [
   "down1"
  ],
  "savedGoal": null
 },
 {
  "id": "hundredexchange",
  "sessionId": "hundredexchange",
  "index": 0,
  "nodeId": "mt_8gy7uxRlF6",
  "taskHash": "82958ebe00a380da5ed933182a7ca2a65760ff1269df5beb6ea9d3834d7b8b32",
  "n": 100,
  "start": [
   0,
   10,
   0,
   0
  ],
  "final": [
   0,
   10,
   0,
   0
  ],
  "actions": [
   "up10",
   "down10"
  ],
  "savedGoal": null
 },
 {
  "id": "hundredexchange",
  "sessionId": "hundredexchange",
  "index": 1,
  "nodeId": "mt_8gy7uxRlF6",
  "taskHash": "544e7643de118267b51514be9435cd079c17d350d8dd1f7018a02163db5c19de",
  "n": 100,
  "start": [
   1,
   0,
   0,
   0
  ],
  "final": [
   0,
   9,
   10,
   0
  ],
  "actions": [
   "down10",
   "down1"
  ],
  "savedGoal": null
 },
 {
  "id": "problems1000",
  "sessionId": "problems1000",
  "index": 0,
  "nodeId": "mt_98c2qwEF7Q",
  "taskHash": "aeb62f6115a113a60702522e2c528aaeb5633a7b33f8aae7d1b2a28b38840e22",
  "n": 236,
  "start": [
   2,
   3,
   6,
   0
  ],
  "final": [
   0,
   23,
   6,
   0
  ],
  "actions": [
   "down10",
   "down10"
  ],
  "savedGoal": null
 },
 {
  "id": "problems1000",
  "sessionId": "problems1000",
  "index": 2,
  "nodeId": "mt_98c2qwEF7Q",
  "taskHash": "c35a925d4351c0923e583db7bf161f43c08b2e8a52b957a6fcb4f4c03242665d",
  "n": 362,
  "start": [
   3,
   6,
   2,
   0
  ],
  "final": [
   3,
   5,
   12,
   0
  ],
  "actions": [
   "save",
   "down1",
   "save"
  ],
  "savedGoal": "before-after-one-ten"
 },
 {
  "id": "faces1000",
  "sessionId": "faces1000",
  "index": 3,
  "nodeId": "mt_F_zEAJ8VIo",
  "taskHash": "0433a3d88e22554ad93cbdbf83d4ef659bdac0c350ce80d03b4530a9a9d527d4",
  "n": 442,
  "start": [
   3,
   14,
   2,
   0
  ],
  "final": [
   4,
   4,
   2,
   0
  ],
  "actions": [
   "up10"
  ],
  "savedGoal": null
 },
 {
  "id": "screen1000",
  "sessionId": "screen1000",
  "index": 2,
  "nodeId": "mt_HczwO1sr-y",
  "taskHash": "513ddabb62acdad78c6948381a413b61e1127190636cd9015151e0c405ada896",
  "n": 1000,
  "start": [
   10,
   0,
   0,
   0
  ],
  "final": [
   0,
   0,
   0,
   1
  ],
  "actions": [
   "up100",
   "down100",
   "up100"
  ],
  "savedGoal": null
 }
];
const associated=[
 {
  "id": "link-tenexchange-twoplaces",
  "sessionId": "link-tenexchange-twoplaces",
  "index": 0,
  "taskHash": "1e1a1f1448b78990d5de27821d5a4904b363d1346a25ab39994f0af26604eef3",
  "fixed": true
 },
 {
  "id": "link-tenexchange-twoplaces",
  "sessionId": "link-tenexchange-twoplaces",
  "index": 1,
  "taskHash": "8f8ca6111ab57f4955467341bc1914a1cd2f82aaf75ba6fa6330e92e6f464ac0",
  "fixed": false
 },
 {
  "id": "link-twoplaces-rename",
  "sessionId": "link-twoplaces-rename",
  "index": 0,
  "taskHash": "8f8ca6111ab57f4955467341bc1914a1cd2f82aaf75ba6fa6330e92e6f464ac0",
  "fixed": false
 },
 {
  "id": "link-twoplaces-rename",
  "sessionId": "link-twoplaces-rename",
  "index": 1,
  "taskHash": "38ffd67e92af09e897f374cf97d73012eb336735870ad6ae35f3ac89424bef6e",
  "fixed": true
 },
 {
  "id": "link-twoplaces-shift10",
  "sessionId": "link-twoplaces-shift10",
  "index": 0,
  "taskHash": "7979f7255445222c2fca21151e389eb1a46f47c7c09a491b96250da4f1e4d2a8",
  "fixed": false
 },
 {
  "id": "link-twoplaces-compare100",
  "sessionId": "link-twoplaces-compare100",
  "index": 0,
  "taskHash": "8f8ca6111ab57f4955467341bc1914a1cd2f82aaf75ba6fa6330e92e6f464ac0",
  "fixed": false
 },
 {
  "id": "link-tenexchange-hundredexchange",
  "sessionId": "link-tenexchange-hundredexchange",
  "index": 0,
  "taskHash": "1e1a1f1448b78990d5de27821d5a4904b363d1346a25ab39994f0af26604eef3",
  "fixed": true
 },
 {
  "id": "link-tenexchange-hundredexchange",
  "sessionId": "link-tenexchange-hundredexchange",
  "index": 1,
  "taskHash": "82958ebe00a380da5ed933182a7ca2a65760ff1269df5beb6ea9d3834d7b8b32",
  "fixed": true
 },
 {
  "id": "link-hundredexchange-threeplaces",
  "sessionId": "link-hundredexchange-threeplaces",
  "index": 0,
  "taskHash": "544e7643de118267b51514be9435cd079c17d350d8dd1f7018a02163db5c19de",
  "fixed": true
 },
 {
  "id": "link-hundredexchange-threeplaces",
  "sessionId": "link-hundredexchange-threeplaces",
  "index": 1,
  "taskHash": "f2604d72e13e71fe60c0539c6eb327f9a43d43c70dc0271a0e52b327a5a86d6a",
  "fixed": false
 },
 {
  "id": "link-threeplaces-shift100",
  "sessionId": "link-threeplaces-shift100",
  "index": 0,
  "taskHash": "c655e86b29941240b6309c19230b5b5df4d48611196795d2bd669466f070e1a9",
  "fixed": false
 },
 {
  "id": "link-threeplaces-problems1000",
  "sessionId": "link-threeplaces-problems1000",
  "index": 0,
  "taskHash": "5b55b63a6c31d23b2ee3a91b27247d5e3386340cc076da11ea368caf702b5887",
  "fixed": false
 },
 {
  "id": "link-threeplaces-problems1000",
  "sessionId": "link-threeplaces-problems1000",
  "index": 1,
  "taskHash": "aeb62f6115a113a60702522e2c528aaeb5633a7b33f8aae7d1b2a28b38840e22",
  "fixed": true
 },
 {
  "id": "link-faces1000-screen1000",
  "sessionId": "link-faces1000-screen1000",
  "index": 0,
  "taskHash": "0433a3d88e22554ad93cbdbf83d4ef659bdac0c350ce80d03b4530a9a9d527d4",
  "fixed": true
 },
 {
  "id": "link-faces1000-screen1000",
  "sessionId": "link-faces1000-screen1000",
  "index": 1,
  "taskHash": "513ddabb62acdad78c6948381a413b61e1127190636cd9015151e0c405ada896",
  "fixed": true
 },
 {
  "id": "link-threeplaces-fourplaces",
  "sessionId": "link-threeplaces-fourplaces",
  "index": 0,
  "taskHash": "c655e86b29941240b6309c19230b5b5df4d48611196795d2bd669466f070e1a9",
  "fixed": false
 },
 {
  "id": "link-threeplaces-tenslarge",
  "sessionId": "link-threeplaces-tenslarge",
  "index": 0,
  "taskHash": "f2604d72e13e71fe60c0539c6eb327f9a43d43c70dc0271a0e52b327a5a86d6a",
  "fixed": false
 },
 {
  "id": "link-threeplaces-hundredsmove",
  "sessionId": "link-threeplaces-hundredsmove",
  "index": 0,
  "taskHash": "f2604d72e13e71fe60c0539c6eb327f9a43d43c70dc0271a0e52b327a5a86d6a",
  "fixed": false
 }
];
const unbound=[
 {
  "id": "twoplaces",
  "sessionId": "twoplaces",
  "index": 0,
  "nodeId": "mt_THl9GLxwoL",
  "taskHash": "8f8ca6111ab57f4955467341bc1914a1cd2f82aaf75ba6fa6330e92e6f464ac0"
 },
 {
  "id": "twoplaces",
  "sessionId": "twoplaces",
  "index": 1,
  "nodeId": "mt_THl9GLxwoL",
  "taskHash": "7979f7255445222c2fca21151e389eb1a46f47c7c09a491b96250da4f1e4d2a8"
 },
 {
  "id": "twoplaces",
  "sessionId": "twoplaces",
  "index": 2,
  "nodeId": "mt_THl9GLxwoL",
  "taskHash": "27686ea90e2c4338e60260c2af22709268fa8a4976735960bf374e6381b8c715"
 },
 {
  "id": "decades",
  "sessionId": "decades",
  "index": 0,
  "nodeId": "mt_zfy1gOEewd",
  "taskHash": "254ba31bf386177a322d6ab5b64f43c9507195fac5b5aa6f90e378cbffd6c1db"
 },
 {
  "id": "decades",
  "sessionId": "decades",
  "index": 1,
  "nodeId": "mt_zfy1gOEewd",
  "taskHash": "c35c221f477ad85dcbcba56a3bcea999cec78defc5394c5537358dbbccabfa22"
 },
 {
  "id": "decades",
  "sessionId": "decades",
  "index": 2,
  "nodeId": "mt_zfy1gOEewd",
  "taskHash": "04b0222506196b7358ebc7f410ef8e7fb385fb02a93a232b9be8cbd449ee539c"
 },
 {
  "id": "twoproblems",
  "sessionId": "twoproblems",
  "index": 2,
  "nodeId": "mt_kJGCjnuelW",
  "taskHash": "59a6ea394f2dcd1b08303a7cc9805a2486e9d1f6e520d0922fd85fc9d5718b09"
 },
 {
  "id": "faces100",
  "sessionId": "faces100",
  "index": 1,
  "nodeId": "mt_9L3NQqgqRd",
  "taskHash": "07e8a17978517505e0ac71b1a76c2496470f34174a8284302e42e92cbd186991"
 },
 {
  "id": "words100",
  "sessionId": "words100",
  "index": 0,
  "nodeId": "mt_76SPWvdI7r",
  "taskHash": "718e5408bb636210da53c31b8bf8a215d1a65371f5fe30c139d9c84f66098f2c"
 },
 {
  "id": "words100",
  "sessionId": "words100",
  "index": 1,
  "nodeId": "mt_76SPWvdI7r",
  "taskHash": "225a33e97a5e614231fe9b204a942bfd93e970077edca8599a7af6251cf1009f"
 },
 {
  "id": "words100",
  "sessionId": "words100",
  "index": 2,
  "nodeId": "mt_76SPWvdI7r",
  "taskHash": "0ce0cd787382ff2cd914726b7a7bcbc9ad632af7160fb006b9cf5e75fa68a9bd"
 },
 {
  "id": "read120",
  "sessionId": "read120",
  "index": 1,
  "nodeId": "mt_XV0B4kWwqL",
  "taskHash": "a5ddf065946e1b44ef684285e162051ce50a131a16628f0b1b4435d273337e44"
 },
 {
  "id": "read120",
  "sessionId": "read120",
  "index": 2,
  "nodeId": "mt_XV0B4kWwqL",
  "taskHash": "3f6ed2cb6cfc94395aede41df0965411e162fa2f226b746378812edd0a5bfe9d"
 },
 {
  "id": "faces120",
  "sessionId": "faces120",
  "index": 1,
  "nodeId": "mt_QguIGVMB1o",
  "taskHash": "52d7025de61aaa946b91cdfc0c1a24104caa2360d176f82c2323d461f8c8dcf3"
 },
 {
  "id": "threeplaces",
  "sessionId": "threeplaces",
  "index": 0,
  "nodeId": "mt_aPBzD28_mT",
  "taskHash": "f2604d72e13e71fe60c0539c6eb327f9a43d43c70dc0271a0e52b327a5a86d6a"
 },
 {
  "id": "threeplaces",
  "sessionId": "threeplaces",
  "index": 1,
  "nodeId": "mt_aPBzD28_mT",
  "taskHash": "5b55b63a6c31d23b2ee3a91b27247d5e3386340cc076da11ea368caf702b5887"
 },
 {
  "id": "threeplaces",
  "sessionId": "threeplaces",
  "index": 2,
  "nodeId": "mt_aPBzD28_mT",
  "taskHash": "c655e86b29941240b6309c19230b5b5df4d48611196795d2bd669466f070e1a9"
 },
 {
  "id": "hundreds",
  "sessionId": "hundreds",
  "index": 0,
  "nodeId": "mt_R2ccrI-nKD",
  "taskHash": "cc34fd20e77debf5ae49b531bced271d9a6b0b14f30d24565972c55fcc823291"
 },
 {
  "id": "hundreds",
  "sessionId": "hundreds",
  "index": 2,
  "nodeId": "mt_R2ccrI-nKD",
  "taskHash": "f4511f619a826b1977e110b8c5df7a906e22bf3312f0d957599184b5d8c52ecf"
 },
 {
  "id": "problems1000",
  "sessionId": "problems1000",
  "index": 1,
  "nodeId": "mt_98c2qwEF7Q",
  "taskHash": "65fd05a275a79a782300334dff6f0c8cf7bd0de8fdb2c3d3dc0f6fbeb68e2546"
 },
 {
  "id": "words1000",
  "sessionId": "words1000",
  "index": 0,
  "nodeId": "mt_VFsuftfvYM",
  "taskHash": "5fc629cb351fc1f25554f923e913e1aa60c96e207e322eb6e003aff037ac018f"
 },
 {
  "id": "words1000",
  "sessionId": "words1000",
  "index": 1,
  "nodeId": "mt_VFsuftfvYM",
  "taskHash": "812d957b9a6fe6bf4b07979428adb6a2ed0a4c1adfd1dfd880dc5e9dad743bc2"
 },
 {
  "id": "words1000",
  "sessionId": "words1000",
  "index": 2,
  "nodeId": "mt_VFsuftfvYM",
  "taskHash": "38297c46f2d494ce4e67c26bf2bfb2f027f4cd6f05e098c8e298123d2b06cb3f"
 },
 {
  "id": "words1000",
  "sessionId": "words1000",
  "index": 3,
  "nodeId": "mt_VFsuftfvYM",
  "taskHash": "d418e2c03612443cbc582c52590ac31bc31ef8c4992d3ac5c33d608cd2c1a1e8"
 },
 {
  "id": "faces1000",
  "sessionId": "faces1000",
  "index": 2,
  "nodeId": "mt_F_zEAJ8VIo",
  "taskHash": "5ad78e477421cc47cdd7d5aa6720c74dfb1a189f19ff185c1b62cc527cdfa197"
 },
 {
  "id": "screen1000",
  "sessionId": "screen1000",
  "index": 0,
  "nodeId": "mt_HczwO1sr-y",
  "taskHash": "cd08dd4052954442639f3886a17c6b73cef0c85c906aedd155f53d49388f16b6"
 }
];
module.exports={cases,associated,unbound};

module.exports.sourceHashes={
 "dist/learning/phase5/b07.js": "4a87f92b2a94590b98273f8ddd3ffdfe4d570f08e01a6689cedec6cee6460510",
 "dist/learning/phase5/b07-model.js": "b0c1a9f4b85710336d2db86142451a364f2cb59ea370b7e47e8e82ca59a685ff",
 "dist/learning/phase5/b07-view.js": "09d4f209a4459b425f6c24edc79179b4d6ce4a6ea50d86b7bbd5c16a9e3f6d82"
};
