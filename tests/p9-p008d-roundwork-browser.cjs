'use strict';
// P008 exact native positions only, no sibling or automatic A expansion.
const {newDesktopContext}=require('./helpers/standard-desktop-viewport.cjs');
const {runShard}=require('./helpers/p008-roundwork-browser-batch.cjs');
runShard("d",["roundprecise:0","roundprecise:1","roundprecise:2","accuracy:0","accuracy:1","accuracy:2","accuracy:3","accuracy:4","estbounds:0"],(browser,options)=>newDesktopContext(browser,options)).catch(error=>{console.error(error.stack||String(error));process.exitCode=1;});
