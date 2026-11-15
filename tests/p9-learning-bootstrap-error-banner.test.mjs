import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../dist/learn.html',import.meta.url),'utf8');
const inline=html.match(/<script>([\s\S]*?)<\/script><script type="module" src="learning\/learn\.js"><\/script>/);
assert.ok(inline,'bootstrap error listener must be installed before the external ESM graph');
assert.match(html,/id="storage-warning" role="alert" hidden/);

function run(target){
 const hooks=[],state={hidden:true,textContent:''};
 const document={getElementById(id){assert.equal(id,'storage-warning');return state;}};
 const window={addEventListener:(type,fn,capture)=>hooks.push({type,fn,capture})};
 vm.runInNewContext(inline[1],{window,document});
 assert.equal(hooks.length,1);
 assert.equal(hooks[0].type,'error');
 assert.equal(hooks[0].capture,true);
 hooks[0].fn({target});
 return state;
}

test('failed lesson module graph is reported through the existing live alert',()=>{
 const result=run({tagName:'SCRIPT',type:'module',getAttribute:(key)=>key==='src'?'learning/learn.js':null});
 assert.equal(result.hidden,false);
 assert.match(result.textContent,/程序未能加载/);
 assert.match(result.textContent,/已保存的学习记录没有被清除/);
});

test('unrelated script errors never falsely label an otherwise usable lesson',()=>{
 for(const target of [{tagName:'SCRIPT',type:'module',getAttribute:()=>'/other.js'},
  {tagName:'SCRIPT',type:'text/javascript',getAttribute:()=> 'learning/learn.js'},
  {tagName:'LINK',type:'module',getAttribute:()=> 'learning/learn.js'},null]){
  assert.deepEqual(run(target),{hidden:true,textContent:''});
 }
});
