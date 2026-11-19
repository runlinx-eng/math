// Pinned to the original task graph and original teaching controls, before the conversion evidence adapter.
const routes=[
 [
  {"id":"baseconversions","index":0,"taskHash":"5a054c579a00d1a470ad9f4a1ccc3797099dd538ccec877888707bdad252dc19","type":"x-m28-convert","role":"native","nodeId":"mt_d8al9JcajP","kind":"exact","values":["3000"],"answers":[]},
  {"id":"baseconversions","index":1,"taskHash":"43af455ad9317e18af55f87a327fe54ba73538b8e41fc096574089e2eaa30e7f","type":"x-m28-convert","role":"native","nodeId":"mt_d8al9JcajP","kind":"exact","values":["120"],"answers":[]},
  {"id":"baseconversions","index":2,"taskHash":"69798daf9b4ab6890e424fc1bfca13bd6c8c152bf2916c61993a5ad65761d65d","type":"x-m28-convert","role":"native","nodeId":"mt_d8al9JcajP","kind":"exact","values":["35"],"answers":[]}
 ],
 [
  {"id":"metricconversions","index":0,"taskHash":"07ddaa30c225da2c9989308db77997d576f1ca6bfddbe71476373335239380ce","type":"x-m28-convert","role":"native","nodeId":"mt_Zks8xyInSG","kind":"exact","values":["3500"],"answers":[]},
  {"id":"metricconversions","index":1,"taskHash":"610882e89deec8724ac37f7acc9f2a6b7c93d12a035cb82ae30eaf824305654c","type":"x-m28-convert","role":"native","nodeId":"mt_Zks8xyInSG","kind":"exact","values":["10","20","30"],"answers":[]},
  {"id":"metricconversions","index":2,"taskHash":"74f47ec996d39cb96b5207845005e2833dd307a1f2284b68a18629e3bca1ca1d","type":"x-m28-convert","role":"native","nodeId":"mt_Zks8xyInSG","kind":"exact","values":["2350"],"answers":[]}
 ],
 [
  {"id":"imperialconversions","index":0,"taskHash":"ad6cac3aac163216f8c49a743e76db8ef54663314dfd33f3c9a8a79beee75ea4","type":"x-m28-convert","role":"native","nodeId":"mt_p6MhZJYYPN","kind":"given-approximation","values":["20"],"answers":["approx"]},
  {"id":"imperialconversions","index":1,"taskHash":"7eb41428dd2e5cd4c8322eeaf73064bdb98aa2ec5066c134b52c3d151f19e9cd","type":"x-m28-convert","role":"native","nodeId":"mt_p6MhZJYYPN","kind":"given-approximation","values":["88"],"answers":["approx"]},
  {"id":"imperialconversions","index":2,"taskHash":"980b72bb63c362ba9ea2be0246b1f35140280b834a5eef85afcd69fa8066ae83","type":"x-m28-convert","role":"native","nodeId":"mt_p6MhZJYYPN","kind":"given-approximation","values":["3.5"],"answers":["approx"]}
 ],
 [
  {"id":"decimalunits","index":0,"taskHash":"e7a987b8c84c42576df0a403f33bbe5c45697cd1b3cd3a219e44a35628b87edb","type":"x-m28-convert","role":"native","nodeId":"mt_2VpdPjvewx","kind":"exact","values":["3.25"],"answers":[]},
  {"id":"decimalunits","index":1,"taskHash":"ca9ef2ff5ee5cb8bb67e83c6d5add68d9c41f80d7c6d63e730020c63b18dec17","type":"x-m28-convert","role":"native","nodeId":"mt_2VpdPjvewx","kind":"exact","values":["450"],"answers":[]},
  {"id":"decimalunits","index":2,"taskHash":"ecc6c306a2a923b74739f39f1966faa673773284bc0434f58b565034dc274f4a","type":"x-m28-convert","role":"native","nodeId":"mt_2VpdPjvewx","kind":"exact","values":["1000","100","10"],"answers":["100"]}
 ],
 [
  {"id":"unitstories","index":0,"taskHash":"41c4711373ffbf7d2126ac55c6a936c4a09bbaf77e0e0750314e7256a41fd56c","type":"x-m28-convert","role":"native","nodeId":"mt_SqhXQhAEUf","kind":"exact","values":["2250"],"answers":["2.25"]},
  {"id":"unitstories","index":1,"taskHash":"aeaec1af211898719872d798aab0db273e4df94c598a0bdd6498a51578cb5c84","type":"x-m28-convert","role":"native","nodeId":"mt_SqhXQhAEUf","kind":"exact","values":["2500"],"answers":["first","50"]},
  {"id":"unitstories","index":2,"taskHash":"4ace8027334a470c4c6062fded1f1528cc929dab47a5cbd61b02d0f44c0dedd1","type":"x-m28-convert","role":"native","nodeId":"mt_SqhXQhAEUf","kind":"exact","values":["90"],"answers":["90"]}
 ],
 [
  {"id":"mileskm","index":0,"taskHash":"f6f61257866c7aa6b8c9947947c3fee9e34aa9bdc839e5e9007b2544f71eae0c","type":"x-m28-convert","role":"native","nodeId":"mt_3tPI0HqqcN","kind":"given-approximation","values":["64"],"answers":["approx"]},
  {"id":"mileskm","index":1,"taskHash":"e634722f710cc0d3393add08820dbed211b01e45f86c84152358a705da884e78","type":"x-m28-convert","role":"native","nodeId":"mt_3tPI0HqqcN","kind":"given-approximation","values":["1.6"],"answers":["divide"]},
  {"id":"mileskm","index":2,"taskHash":"f443f0387aebbe385a6fb2d886c5c4eeb54788c97a415197472a546681f792b1","type":"x-m28-convert","role":"native","nodeId":"mt_3tPI0HqqcN","kind":"given-approximation","values":["9.6"],"answers":["ten","0.4"]}
 ],
 [
  {"id":"practicalmeasure","index":0,"taskHash":"b2663a02eb6fd66b04147ca6378ac5a16f6a7085e1600118f0f1f30d09776b85","type":"x-m28-convert","role":"native","nodeId":"mt_5HV4mbgSGH","kind":"exact","values":["2500"],"answers":[]}
 ],
 [
  {"id":"measureliquid","index":0,"taskHash":"946cc31504c0620dcbf3caeea004fa2d970a7a378e2a94f941d2e3ccc56dd7cd","type":"x-m31-meter","role":"prerequisite","steps":[{"field":"estimate","value":"300"},{"action":"m31-predict"},{"field":"step","value":"20"},{"field":"reading","value":"340"},{"field":"unit","value":"mL"},{"action":"m31-meter"}]},
  {"id":"measureliquid","index":1,"taskHash":"f82c7e41f56a18fecc1e57ffc647ee93701b0196b6492052f547eb341574cff2","type":"x-m31-meter","role":"prerequisite","steps":[{"field":"estimate","value":"500"},{"action":"m31-predict"},{"field":"step","value":"50"},{"field":"reading","value":"600"},{"field":"unit","value":"g"},{"action":"m31-meter"}]},
  {"id":"measureliquid","index":2,"taskHash":"e374fbda2eb60297b433892b7a83af33a347de3a6cf110e0abe3be4347f2489f","type":"x-m28-convert","role":"native","nodeId":"mt_-af65bxfdp","kind":"exact","values":["750"],"answers":["750"]}
 ],
 [
  {"id":"model38","index":0,"taskHash":"41c4711373ffbf7d2126ac55c6a936c4a09bbaf77e0e0750314e7256a41fd56c","type":"x-m28-convert","role":"native","nodeId":"mt_8xVHooT4aI","kind":"exact","values":["2250"],"answers":["2.25"]}
 ],
 [
  {"id":"link-baseconversions-metricconversions","index":0,"taskHash":"5a054c579a00d1a470ad9f4a1ccc3797099dd538ccec877888707bdad252dc19","type":"x-m28-convert","role":"associated","nodeId":null,"kind":"exact","values":["3000"],"answers":[]},
  {"id":"link-baseconversions-metricconversions","index":1,"taskHash":"07ddaa30c225da2c9989308db77997d576f1ca6bfddbe71476373335239380ce","type":"x-m28-convert","role":"associated","nodeId":null,"kind":"exact","values":["3500"],"answers":[]}
 ],
 [
  {"id":"link-metricconversions-imperialconversions","index":0,"taskHash":"07ddaa30c225da2c9989308db77997d576f1ca6bfddbe71476373335239380ce","type":"x-m28-convert","role":"associated","nodeId":null,"kind":"exact","values":["3500"],"answers":[]},
  {"id":"link-metricconversions-imperialconversions","index":1,"taskHash":"ad6cac3aac163216f8c49a743e76db8ef54663314dfd33f3c9a8a79beee75ea4","type":"x-m28-convert","role":"associated","nodeId":null,"kind":"given-approximation","values":["20"],"answers":["approx"]}
 ],
 [
  {"id":"link-metricconversions-decimalunits","index":0,"taskHash":"74f47ec996d39cb96b5207845005e2833dd307a1f2284b68a18629e3bca1ca1d","type":"x-m28-convert","role":"associated","nodeId":null,"kind":"exact","values":["2350"],"answers":[]},
  {"id":"link-metricconversions-decimalunits","index":1,"taskHash":"e7a987b8c84c42576df0a403f33bbe5c45697cd1b3cd3a219e44a35628b87edb","type":"x-m28-convert","role":"associated","nodeId":null,"kind":"exact","values":["3.25"],"answers":[]}
 ],
 [
  {"id":"link-decimalunits-unitstories","index":0,"taskHash":"e7a987b8c84c42576df0a403f33bbe5c45697cd1b3cd3a219e44a35628b87edb","type":"x-m28-convert","role":"associated","nodeId":null,"kind":"exact","values":["3.25"],"answers":[]},
  {"id":"link-decimalunits-unitstories","index":1,"taskHash":"41c4711373ffbf7d2126ac55c6a936c4a09bbaf77e0e0750314e7256a41fd56c","type":"x-m28-convert","role":"associated","nodeId":null,"kind":"exact","values":["2250"],"answers":["2.25"]}
 ],
 [
  {"id":"link-imperialconversions-mileskm","index":0,"taskHash":"ad6cac3aac163216f8c49a743e76db8ef54663314dfd33f3c9a8a79beee75ea4","type":"x-m28-convert","role":"associated","nodeId":null,"kind":"given-approximation","values":["20"],"answers":["approx"]},
  {"id":"link-imperialconversions-mileskm","index":1,"taskHash":"f6f61257866c7aa6b8c9947947c3fee9e34aa9bdc839e5e9007b2544f71eae0c","type":"x-m28-convert","role":"associated","nodeId":null,"kind":"given-approximation","values":["64"],"answers":["approx"]}
 ],
 [
  {"id":"link-measurecalc-baseconversions","index":0,"taskHash":"69de8d06f8b4faca3206960618a4ffd486255a5a35bce8e495d89195ec1645a5","type":"x-m29-combine","role":"prerequisite","steps":[{"action":"m29-choose","index":"0"},{"action":"m29-choose","index":"1"},{"field":"answer","value":"650"},{"field":"unit","value":"mL"}]},
  {"id":"link-measurecalc-baseconversions","index":1,"taskHash":"5a054c579a00d1a470ad9f4a1ccc3797099dd538ccec877888707bdad252dc19","type":"x-m28-convert","role":"associated","nodeId":null,"kind":"exact","values":["3000"],"answers":[]}
 ],
 [
  {"id":"link-metricconversions-practicalmeasure","index":0,"taskHash":"74f47ec996d39cb96b5207845005e2833dd307a1f2284b68a18629e3bca1ca1d","type":"x-m28-convert","role":"associated","nodeId":null,"kind":"exact","values":["2350"],"answers":[]}
 ],
 [
  {"id":"link-practicalmeasure-unitstories","index":0,"taskHash":"4788db12f79b43484493b264396c1bc2f1c9137413897c30b5b1581dff0cf4dd","type":"x-m29-share","role":"prerequisite","steps":[{"field":"amount","value":"625"},{"action":"m29-give","index":"0"},{"action":"m29-give","index":"1"},{"action":"m29-give","index":"2"},{"action":"m29-give","index":"3"},{"field":"answer","value":"0.625"},{"field":"unit","value":"kg"}]},
  {"id":"link-practicalmeasure-unitstories","index":1,"taskHash":"41c4711373ffbf7d2126ac55c6a936c4a09bbaf77e0e0750314e7256a41fd56c","type":"x-m28-convert","role":"associated","nodeId":null,"kind":"exact","values":["2250"],"answers":["2.25"]}
 ],
 [
  {"id":"link-baseconversions-timeconvert","index":0,"taskHash":"43af455ad9317e18af55f87a327fe54ba73538b8e41fc096574089e2eaa30e7f","type":"x-m28-convert","role":"associated","nodeId":null,"kind":"exact","values":["120"],"answers":[]}
 ],
 [
  {"id":"link-calendarfacts-baseconversions","index":0,"taskHash":"56655e258936575429bca55375504ac92cb9b58d05a55b75aad0053205c4f14d","type":"x-t32-units","role":"prerequisite","steps":[{"action":"t32-unit","index":"0"},{"action":"t32-unit","index":"1"},{"action":"t32-unit","index":"2"},{"action":"t32-unit","index":"3"},{"field":"answers.0","value":"60"}]},
  {"id":"link-calendarfacts-baseconversions","index":1,"taskHash":"43af455ad9317e18af55f87a327fe54ba73538b8e41fc096574089e2eaa30e7f","type":"x-m28-convert","role":"associated","nodeId":null,"kind":"exact","values":["120"],"answers":[]}
 ],
 [
  {"id":"link-measuremoney-practicalmeasure","index":0,"taskHash":"c26e53518d47019d0feceba8c12a659bf3599a2cea8cda39f9c0d49a9ec6207f","type":"x-m33-compare","role":"prerequisite","steps":[{"action":"m33-guess","index":"left"},{"action":"m33-reveal"},{"action":"m33-pick","index":"left"},{"field":"answers.0","value":"1500"}]},
  {"id":"link-measuremoney-practicalmeasure","index":1,"taskHash":"b2663a02eb6fd66b04147ca6378ac5a16f6a7085e1600118f0f1f30d09776b85","type":"x-m28-convert","role":"associated","nodeId":null,"kind":"exact","values":["2500"],"answers":[]}
 ],
 [
  {"id":"link-decimalunits-convertUnits37","index":0,"taskHash":"ca9ef2ff5ee5cb8bb67e83c6d5add68d9c41f80d7c6d63e730020c63b18dec17","type":"x-m28-convert","role":"associated","nodeId":null,"kind":"exact","values":["450"],"answers":[]}
 ],
 [
  {"id":"link-model38-modelChoice38","index":0,"taskHash":"41c4711373ffbf7d2126ac55c6a936c4a09bbaf77e0e0750314e7256a41fd56c","type":"x-m28-convert","role":"associated","nodeId":null,"kind":"exact","values":["2250"],"answers":["2.25"]}
 ],
];

module.exports={
 routes,
 cases:routes.flat().filter(row=>row.role==='native'),
 practice:[
   {
     "id": "baseconversions",
     "index": -1,
     "taskHash": "69798daf9b4ab6890e424fc1bfca13bd6c8c152bf2916c61993a5ad65761d65d"
   },
   {
     "id": "metricconversions",
     "index": -1,
     "taskHash": "74f47ec996d39cb96b5207845005e2833dd307a1f2284b68a18629e3bca1ca1d"
   },
   {
     "id": "imperialconversions",
     "index": -1,
     "taskHash": "980b72bb63c362ba9ea2be0246b1f35140280b834a5eef85afcd69fa8066ae83"
   },
   {
     "id": "decimalunits",
     "index": -1,
     "taskHash": "ecc6c306a2a923b74739f39f1966faa673773284bc0434f58b565034dc274f4a"
   },
   {
     "id": "unitstories",
     "index": -1,
     "taskHash": "4ace8027334a470c4c6062fded1f1528cc929dab47a5cbd61b02d0f44c0dedd1"
   },
   {
     "id": "mileskm",
     "index": -1,
     "taskHash": "f443f0387aebbe385a6fb2d886c5c4eeb54788c97a415197472a546681f792b1"
   }
 ],
 sourceFiles:{
   "dist/learning/phase5/b20-model.js": "d3c51d56587fc93b0b8189a7ac9a6d82dcad6b768f7b436877a362406ee7070e",
   "dist/learning/phase5/b28-model.js": "eb1ee26ca273ee1b629db0e84cc4f85d156c0569cfa751a18c208b00951c1391",
   "dist/learning/phase5/b28-view.js": "6fc48e49db9ce7c67e88c52db9740b602f42d95cd6a5756d3f2b8b3e8adb77d7",
   "dist/learning/phase5/b28.js": "83ccc714c66906c7cd375088a3fe2e5b182e2c2bf509e641fcf1614611eda057",
   "dist/learning/phase5/b29-model.js": "1b57695aef8172436413ef4824e6babe7f9be48c0245e6e79eacac28c7287e48",
   "dist/learning/phase5/b29-view.js": "9333c05ee6efae18aa7a6e0dc3e2069555f18cb0db68d609d5e1a010ddf95836",
   "dist/learning/phase5/b31-model.js": "af26110a7f50a2e4e3d3399b1d621776203e9c56a199667b11f4f7fe0280dc57",
   "dist/learning/phase5/b31-view.js": "37760557311f03f4d8ca9cbaf86dfd995b2e57ccab594e3942a3908dc2d84604",
   "dist/learning/phase5/b32-model.js": "0c1250c81032fb4efbaaf83ffadb221ad98ff5b6f9d2a2f5452ef4ef7179ace6",
   "dist/learning/phase5/b32-view.js": "3947ea7e1129f560474b2e07c4f9ec73c71b99167faf31752582a6ad15a08630",
   "dist/learning/phase5/b33-model.js": "467754119d83334d34abe75842424a4b97b0357e3547841748b59002dfdafb0b",
   "dist/learning/phase5/b33-view.js": "9d6d88df23878b4c46059c37b01a9fc34c2d501f66c6dac9e985cdb265a50e26",
   "dist/learning/catalog.js": "6f0258d01853e8e73ca4cc0e92379f3ad97731fee2e409c73baea6fa559f8518",
   "dist/learning/bridges.js": "e480fb63c69a2ee259b9bce4688d698fc61a1a910a44439e98c45cf1f7faeb15",
   "dist/learning/tasks.js": "4eac447b0944644b1c1077464e849950b296fd708f7f8f0ecf9d4ac1fd7cb4a7",
   "dist/learning/state.js": "e20c834d9741761b57c60cc0ca385d604b9b9e16e7e6a383e36ef0696a21e8db",
   "dist/learning/daily.js": "27df81463b7bcaa20e62008bad04e2b50a8438c24a48e565b96db7de5d6ba8d5",
   "dist/learning/phase4/engine.js": "8164e3f66e9c1489ef4831a6477fe782591ea1a7bc0ed4da859fc3c575b9f9ee",
   "dist/learning/phase4/ui.js": "88a1fe937b6b4e9b2f1405e2f80d6e48a8750afa833b8ac2d76b046bd28678a8",
   "dist/learning/phase4/view-engine.js": "22ce2022cc9fb1f4fac0cdb40ac1bd7ef24497db9d1416b219f500f630c311f1",
   "dist/exploration-core.js": "1100d47beba5120ec68f484fc154365ecdaa11d439c13ee85b6efad8c2f41002",
   "dist/storage.js": "8a7d85b66c19898560c33e372d832b7416adc153d523acd8eaec516282361bf7"
 }
};
