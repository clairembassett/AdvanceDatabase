'use strict';
// State and accessibility contracts for the actual walkthrough controller.
// Layout is checked separately in a browser at desktop, tablet, and phone sizes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const model = require('../labs/_shared/teaching-traces.js');
class Element {
  constructor(tag) {
    this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.attributes={};
    this.listeners={};this.className='';this.disabled=false;this._text='';
    this.classList={add:name=>{this.className+=' '+name;}};
  }
  set textContent(value){this._text=String(value);this.children=[];}
  get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
  setAttribute(name,value){this.attributes[name]=String(value);}
  append(...nodes){nodes.forEach(node=>{node.parentElement=this;this.children.push(node);});}
  replaceChildren(...nodes){this.textContent='';this.append(...nodes);}
  addEventListener(type,fn){(this.listeners[type]||=[]).push(fn);}
  all(predicate){return this.children.flatMap(child=>(predicate(child)?[child]:[]).concat(child.all(predicate)));}
  dispatch(type,extra={}){
    const event={target:this,stopped:false,defaultPrevented:false,
      stopPropagation(){this.stopped=true;},preventDefault(){this.defaultPrevented=true;},...extra};
    if(type==='click'&&this.disabled)return event;
    for(let node=this;node&&!event.stopped;node=node.parentElement)(node.listeners[type]||[]).forEach(fn=>fn(event));
    return event;
  }
}
const roots=[new Element('div'),new Element('div'),new Element('div')];
roots[0].dataset.teachingTrace=Object.keys(model.examples).join(' ');
roots[1].dataset.teachingTrace='undo';
roots[2].dataset.teachingTrace='unknown-example';
roots[2].textContent='Readable fallback';
const document={createElement:tag=>new Element(tag),querySelectorAll:()=>roots};
const context={document,CourseTraces:model};context.window=context;
const before=JSON.stringify(model);
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../labs/_shared/teaching-trace.js'),'utf8'),context);
const root=roots[0];
const find=(predicate,parent=root)=>{const node=parent.all(predicate)[0];assert(node);return node;};
const action=name=>find(n=>n.dataset.traceAction===name);
const select=find(n=>n.tagName==='SELECT');
const live=find(n=>n.attributes.role==='status');
assert.equal(root.attributes.role,'region');
assert.equal(root.attributes['aria-labelledby'],find(n=>n.tagName==='H3').id);
assert.equal(live.attributes['aria-live'],'polite');
assert.equal(live.attributes['aria-atomic'],'true');
assert.equal(roots[2].textContent,'Readable fallback','unknown examples retain fallback content');
assert.notEqual(root.attributes['aria-labelledby'],roots[1].attributes['aria-labelledby']);
for(const [id,example] of Object.entries(model.examples)){
  select.value=id;select.dispatch('change');
  assert.equal(root.dataset.traceExample,id);
  assert.equal(root.dataset.traceStep,'0');
  assert(action('previous').disabled && action('reset').disabled);
  action('previous').dispatch('click');assert.equal(root.dataset.traceStep,'0');
  for(let step=0;step<example.frames.length;step++){
    const f=example.frames[step];
    assert.equal(live.textContent,`Step ${step+1} of ${example.frames.length}: ${f.label}`);
    assert.equal(find(n=>n.tagName==='CAPTION').textContent,f.label);
    assert.deepEqual(root.all(n=>n.tagName==='TD').map(n=>n.textContent),f.rows.map(r=>r[1]));
    const highlighted=root.all(n=>n.attributes['aria-current']==='step');
    assert.equal(highlighted.length,f.lines.length);
    f.lines.forEach((line,i)=>assert.equal(highlighted[i].textContent,example.code[line-1]));
    action('next').dispatch('click');
  }
  assert(action('next').disabled);
  assert.equal(root.dataset.traceStep,String(example.frames.length-1));
  const answer=find(n=>n.tagName==='DETAILS');answer.open=true;
  action('previous').dispatch('click');assert.equal(answer.open,false,'navigation closes the revealed answer');
  action('reset').dispatch('click');assert.equal(root.dataset.traceStep,'0');
  const key=action('next').dispatch('keydown',{key:'ArrowRight'});
  assert(key.stopped && key.defaultPrevented);
  assert.equal(root.dataset.traceStep,'1');
  const selectKey=select.dispatch('keydown',{key:'ArrowRight'});
  assert(!selectKey.defaultPrevented,'native select keyboard behavior remains available');
  assert(selectKey.stopped,'selector arrows do not advance the reading presentation');
  assert(select.dispatch('keydown',{key:'p'}).stopped,'selector type-ahead does not toggle presentation mode');
  assert.equal(roots[1].dataset.traceStep,'0','another widget remains independent');
}
assert.equal(JSON.stringify(model),before,'navigation never mutates teaching data');
console.log('Walkthrough controls, code highlights, independent widgets, and accessibility contracts pass.');
