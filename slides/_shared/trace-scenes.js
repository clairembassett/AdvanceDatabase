/* Project the same worked states used by the lecture reading and lab.
 * Keep scene IDs/minutes stable so annotations and sixty-minute plans survive. */
(function () {
  'use strict';
  const replacements = {
    6: {'find-37':'btree-search', 'the-fifth-key':'btree-split', 'walk-a-range':'btree-range'},
    7: {'two-writes-reverse-undo':'undo'},
    8: {'statement-or-transaction-snapshot':'snapshots'},
    9: {'price-the-work':'optimizer', 'review-sql-and-indexes':'sql-plan'},
    10: {'analytical-workload':'analytics'},
    11: {'probe-the-lists':'ivf'},
    12: {'keep-the-source-identity':'rag'},
    13: {'reduce-sees-the-complete-group':'shuffle'},
    14: {'read-the-newest-visible-value':'lsm'},
    15: {'paths-are-not-unique-vertices':'graph'}
  };
  function wrap(text, limit) {
    const lines = [''];
    String(text).split(/\s+/).forEach(word => {
      const last = lines.length - 1;
      if (lines[last] && lines[last].length + word.length + 1 > limit) lines.push(word);
      else lines[last] += (lines[last] ? ' ' : '') + word;
    });
    return lines;
  }
  function draw(example, d, step) {
    const P = window.DeckViz.palette;
    const f = example.frames[step];
    d.text('trace-title',640,92,example.title,36,P.ink);
    wrap(example.premise,105).forEach((line,i) =>
      d.text('trace-input-'+i,85,133+i*25,line,21,P.ink,'start'));
    d.text('trace-state',640,220,f.label,30,P.green);
    d.text('code-label',85,266,example.codeLabel,23,P.muted,'start');
    const lines = f.lines.length ? f.lines : [];
    let y = 310;
    if (!lines.length) {
      d.text('before-code',85,y,'Starting state',27,P.muted,'start');
      d.text('before-predict',85,y+52,'Predict the first operation.',25,P.ink,'start');
    }
    lines.forEach(lineNumber => {
      wrap(example.code[lineNumber - 1],42).forEach((text,i) => {
        if (i === 0) d.text('line-'+lineNumber,78,y,String(lineNumber),20,P.green,'end');
        d.text('code-'+lineNumber+'-'+i,98,y,text,23,P.ink,'start');
        y += 34;
      });
      y += 12;
    });
    d.line('divider',620,282,620,614,P.line,2);
    f.rows.forEach(([label,value],r) => {
      const top = 282+r*80;
      d.rect('row-label-'+r,650,top,248,80,P.greenLight,P.line,0,1);
      d.rect('row-value-'+r,898,top,302,80,P.white,P.line,0,1);
      [[label,665,18,'label'],[value,913,22,'value']].forEach(([text,x,limit,key]) => {
        const parts = wrap(text,limit);
        parts.forEach((part,j) => d.text('row-'+r+'-'+key+'-'+j,x,top+40+(j-(parts.length-1)/2)*28,part,24,P.ink,'start'));
      });
    });
    d.text('trace-progress',85,653,`Step ${step+1} of ${example.frames.length}`,23,P.muted,'start');
    d.text('trace-prompt',1200,653,'Explain the next state before advancing.',23,P.muted,'end');
  }
  function apply(deck) {
    const rules = replacements[deck.id];
    if (!rules) return;
    for (const [sceneId,exampleId] of Object.entries(rules)) {
      const scene = deck.scenes.find(s => s.id === sceneId);
      const example = window.CourseTraces.examples[exampleId];
      if (!scene || !example) throw new Error('Missing worked scene: '+deck.id+'/'+sceneId);
      scene.title = example.title;
      scene.kind = 'visual';
      scene.traceId = exampleId;
      scene.steps = example.frames.length;
      scene.states = example.frames.map(f => f.label);
      scene.notes = example.premise + '\n\nAsk students to predict each next state before advancing. ' +
        example.frames.map((f,i) => `Build ${i+1}: ${f.label}. ${f.rows.map(r => r.join(': ')).join('. ')}. ${f.explanation}`).join('\n\n') +
        '\n\nCheck yourself: ' + example.question + '\nExpected answer: ' + example.answer;
      scene.sources = [deck.source+(exampleId === 'sql-plan' ? '#query-contract' : '#worked-example')];
      scene.draw = (d,step) => draw(example,d,step);
      delete scene.demo;
    }
  }
  window.CourseTraceSlides = {apply,replacements};
})();
