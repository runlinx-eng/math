'use strict';
// P008 exact native positions only, no sibling or automatic A expansion.
const {newDesktopContext}=require('./helpers/standard-desktop-viewport.cjs');
const {runShard}=require('./helpers/p008-roundwork-browser-batch.cjs');
runShard("b",["roundwhole:1","roundwhole:2","roundwhole:3","placeproblems:0","bigproblems:1","roundlarge:0","roundlarge:1","roundlarge:2"],(browser,options)=>newDesktopContext(browser,options)).catch(error=>{console.error(error.stack||String(error));process.exitCode=1;});
