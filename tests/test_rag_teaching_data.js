'use strict';
// Check the browser's actual MD5/embedding/ranking code against the Python
// measurements, not merely one copied table against another copied table.
const assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path');
const vm=require('node:vm'), crypto=require('node:crypto');
const data=require('../labs/_shared/rag-measurements.js');
const root=path.resolve(__dirname,'..');
for(const file of ['lectures/lecture-12/viz.js','labs/lab-10/viz.js']){
  const context={CourseRagMeasurements:data,document:{getElementById:()=>null,querySelectorAll:()=>[]},Float64Array};
  context.window=context;vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
  const rag=vm.runInContext('RAG',context);
  const md5=vm.runInContext('md5hex',context);
  for(const word of ['wal','bufferpool','deleted','deleting','a','']){
    assert.equal(md5(word),crypto.createHash('md5').update(word).digest('hex'),file+' MD5');
  }
  rag.STOP=new Set(data.preview.stop);
  for(const row of data.width){
    rag.DIM=row.dim;rag.build(data.preview.chunks);
    let hits=0,rr=0;
    for(const [question,relevant] of data.preview.eval){
      const result=rag.retrieve(question,3);
      const at=result.findIndex(c=>relevant.includes(c.doc));
      if(at>=0){hits++;rr+=1/(at+1);}
    }
    assert(Math.abs(hits/data.questions-row.hit3)<1e-12,file+' hit@3 at DIM '+row.dim);
    assert(Math.abs(rr/data.questions-row.mrr3)<1e-12,file+' MRR@3 at DIM '+row.dim);
  }
  assert(data.preview.chunks.every(c=>!('score' in c)),file+' does not mutate stored chunks');
  const htmlPath=path.join(root,file.replace('viz.js',file.startsWith('lectures')?'rag.html':'microrag.html'));
  const html=fs.readFileSync(htmlPath,'utf8');
  assert(html.indexOf('rag-measurements.js')<html.indexOf('src="viz.js'),file+' loads generated data before the widget');
}
assert.equal(data.documents,24);assert.equal(data.questions,12);assert.equal(data.cutoff,3);
assert.equal(data.chunking.find(r=>r.max_words===60).chunks,data.preview.chunks.length);
console.log('Both RAG browser demos match the Python measurements across seven embedding widths.');
