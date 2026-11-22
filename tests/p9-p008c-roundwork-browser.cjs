'use strict';
// P008 exact native positions only, no sibling or automatic A expansion.
const {runShard}=require('./helpers/p008-roundwork-browser-batch.cjs');
runShard("c",["tenmillion:0","tenmillion:2","rounddecimal:0","rounddecimal:1","rounddecimal:2","rounddecimal:3","roundtenths:0","roundtenths:1","roundtenths:2","roundtenths:3"]).catch(error=>{console.error(error.stack||String(error));process.exitCode=1;});
