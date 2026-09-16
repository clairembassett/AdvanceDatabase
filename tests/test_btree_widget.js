'use strict';
// The live insertion demo must stop when reset or replaced by another action.
const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict');
const path=require('node:path');
const ids=['viz-btree','bt-msg','bt-canvas','bt-stats','bt-script','bt-many','bt-key','bt-one','bt-skey','bt-search','bt-reset'];
const nodes=Object.fromEntries(ids.map(id=>[id,{value:'',textContent:'',innerHTML:'',listeners:{},
  addEventListener(type,fn){this.listeners[type]=fn;}}]));
const timers=new Map();let timerId=0;
const context={document:{getElementById:id=>nodes[id]||null,querySelectorAll:()=>[]},
  setInterval(fn){timers.set(++timerId,fn);return timerId;},clearInterval(id){timers.delete(id);}};
context.window=context;
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../lectures/lecture-06/viz.js'),'utf8'),context);
const click=id=>nodes[id].listeners.click();
const tick=()=>[...timers.values()].forEach(fn=>fn());
const keys=()=>Number(nodes['bt-stats'].textContent.match(/keys: (\d+)/)[1]);
assert.equal(keys(),0);
click('bt-script');tick();tick();assert.equal(keys(),2);
click('bt-reset');assert.equal(timers.size,0);tick();assert.equal(keys(),0);
click('bt-script');tick();click('bt-many');assert.equal(timers.size,1);assert.equal(keys(),0);
for(let i=0;i<20;i++)tick();
assert.equal(keys(),20);assert(nodes['bt-stats'].textContent.includes('height: 3'));
tick();assert.equal(timers.size,0);
click('bt-script');tick();nodes['bt-key'].value='42';click('bt-one');
assert.equal(keys(),2);assert.equal(timers.size,0);tick();assert.equal(keys(),2);
nodes['bt-key'].value='';click('bt-one');assert.equal(keys(),2);
assert(nodes['bt-msg'].textContent.includes('whole-number'));
nodes['bt-key'].value='1.5';click('bt-one');assert.equal(keys(),2);
click('bt-script');for(let i=0;i<6;i++)tick();
nodes['bt-skey'].value='36';click('bt-search');assert.equal(timers.size,0);
assert(nodes['bt-msg'].innerHTML.includes('2 nodes'));
nodes['bt-key'].value='36';click('bt-one');assert.equal(keys(),6);
console.log('Live B+ tree reset, replacement scripts, manual actions, and integer input checks pass.');
