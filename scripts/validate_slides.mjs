/* Run with node scripts/validate_slides.mjs. Tests authored builds without a browser. */
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const requested=process.argv.slice(2).map(Number);
const lectureIds=requested.length?requested:Array.from({length:15},(_,i)=>i+1);
const groups=[...new Set(lectureIds.map(id=>id<=5?'01-05':id<=10?'06-10':'11-15'))];
const context=vm.createContext({window:{},console});
for(const p of ['slides/_shared/visuals.js','labs/_shared/rag-measurements.js','labs/_shared/teaching-traces.js','slides/_shared/trace-scenes.js',...groups.map(g=>'slides/decks/lectures-'+g+'.js')])vm.runInContext(fs.readFileSync(p,'utf8'),context,{filename:p});
const {COURSE_DECKS:decks,DeckViz:V}=context.window;
let scenes=0,builds=0,animated=0;const warnings=[];
for(const id of lectureIds){
  const deck=decks[id];assert(deck,`Lecture ${id} exists`);assert.equal(deck.id,id);
  assert.equal(deck.scenes.reduce((n,s)=>n+s.minutes,0),60,`Lecture ${id}: 60 teaching minutes`);
  assert(deck.scenes.length>=14&&deck.scenes.length<=20,`Lecture ${id}: 14–20 scenes`);
  assert(fs.existsSync(deck.source),`Lecture ${id}: source exists`);
  const ids=new Set();
  for(const [i,sc]of deck.scenes.entries()){
    const name=`L${id}/${i+1} ${sc.title}`;assert(!ids.has(sc.id),name+' unique scene id');ids.add(sc.id);
    assert(Number.isInteger(sc.steps)&&sc.steps>=1,name+' states');assert(sc.minutes>0,name+' time');assert(sc.notes.length>=180,name+' useful presenter notes');
    if(sc.states)assert.equal(sc.states.length,sc.steps,name+' labeled states');
    if(sc.kind==='definition'){assert(sc.definition&&sc.term,name+' definition');assert(sc.definition.trim().split(/\s+/).length<=18,name+' brief definition');}
    let prev=null,changed=false;
    for(let step=0;step<sc.steps;step++){
      const items=V.sceneDrawing(sc,step);assert(items.length>0,name+' not empty');const keys=new Set();
      for(const item of items){assert(!keys.has(item.key),name+' duplicate key');keys.add(item.key);
        for(const [attr,value]of Object.entries(item.attrs))if(typeof value==='number')assert(Number.isFinite(value),name+' finite '+attr);
        if(item.tag==='text'){
          assert(item.attrs['font-size']>=16,name+' label too small: '+item.text);
          const a=item.attrs,estimated=String(item.text).length*a['font-size']*.51;
          const start=a['text-anchor']==='start'?a.x:a['text-anchor']==='end'?a.x-estimated:a.x-estimated/2;
          if(start<10||start+estimated>1270||a.y<20||a.y>700)warnings.push(`${name} build${step+1}: text may exceed canvas: "${item.text}"`);
        }
      }
      const signature=JSON.stringify(items);if(prev&&prev!==signature)changed=true;prev=signature;builds++;
    }
    if(changed)animated++;scenes++;
  }
}
console.log(`${lectureIds.length} decks · ${scenes} scenes · ${builds} builds · ${animated} animated scenes · ${lectureIds.length*60} teaching minutes`);
console.log(warnings.length?warnings.join('\n'):'All scene contracts and estimated text bounds pass.');
if(warnings.length)process.exitCode=1;
