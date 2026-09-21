/* Visual lecture decks 1–5. All artwork is editable SVG drawn through DeckViz.
 * Coordinates are 1280 × 720; explanatory prose belongs in presenter notes.
 * No network requests, timers, global DOM IDs, or dependencies on old widgets.
 */
(function () {
  'use strict';
  const P = window.DeckViz.palette;
  const art = {};
  const add = (lecture, index, states, draw) => {
    (art[lecture] || (art[lecture] = []))[index] = { states, steps: states.length, draw };
  };
  const text = (d,k,x,y,v,s=28,c=P.ink) => d.text(k,x,y,String(v),s,c);
  const box = (d,k,x,y,w,h,v,fill=P.white,stroke=P.line,size=28) => d.box(k,x,y,w,h,String(v),fill,stroke,size);
  const dot = (d,k,x,y,r=10,c=P.green) => d.circle(k,x,y,r,c);
  function grid(d,k,x,y,cols,rows,cw,ch,active=[],fill=P.greenLight) {
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) {
      const i=r*cols+c;
      d.rect(`${k}-${i}`,x+c*cw,y+r*ch,cw-4,ch-4,active.includes(i)?fill:P.white,P.line,3,1);
    }
  }
  function row(d,k,x,y,values,selected=-1,width=120) {
    values.forEach((v,i)=>box(d,`${k}-${i}`,x+i*(width+8),y,width,58,v,i===selected?P.greenLight:P.white,i===selected?P.green:P.line,26));
  }
  function page(d,k,x,y,w=200,h=160,active=false,label='4096 B') {
    d.rect(k,x,y,w,h,active?P.greenLight:P.white,active?P.green:P.line,10,3);
    for(let i=0;i<4;i++) d.line(`${k}-ln${i}`,x+22,y+36+i*24,x+w-22,y+36+i*24,active?P.green:P.line,3);
    if(label) text(d,`${k}-label`,x+w/2,y+h+30,label,25);
  }
  function disk(d,k,x,y,w=160,h=120) {
    d.rect(k,x,y,w,h,P.blueLight,P.blue,18,3);
    d.circle(`${k}-disc`,x+w/2,y+h/2,35,P.white,P.blue,3);
    d.circle(`${k}-hub`,x+w/2,y+h/2,8,P.blue);
  }
  function person(d,k,x,y,c=P.green) {
    dot(d,k+'h',x,y,15,c); d.path(k+'b',`M${x-27},${y+56} Q${x-27},${y+22} ${x},${y+22} Q${x+27},${y+22} ${x+27},${y+56}`,c,'none');
  }
  function pin(d,k,x,y,count=1) {
    d.circle(k,x,y,25,P.orangeLight,P.orange,3); text(d,k+'n',x,y+9,count,27,P.orange);
  }
  function stack(d,k,x,y,labels,active=-1,w=280,h=63) {
    labels.forEach((l,i)=>{box(d,`${k}-${i}`,x,y+i*(h+10),w,h,l,i===active?P.greenLight:P.white,i===active?P.green:P.line,25);if(i<labels.length-1)d.arrow(`${k}-a${i}`,x+w/2,y+(i+1)*h+i*10,x+w/2,y+(i+1)*(h+10),P.muted,2);});
  }
  function balance(d,k,x,y,a,b) {
    box(d,k+'a',x,y,150,90,a,P.greenLight,P.green,38);box(d,k+'b',x+210,y,150,90,b,P.blueLight,P.blue,38);
  }
  function node(d,k,x,y,label,color=P.green) {box(d,k,x,y,220,70,label,color===P.green?P.greenLight:P.white,color,26);}
  const STUDENTS = [['1','ada','39'],['2','ben','31'],['3','cyd','37'],['4','dee','28'],['5','eli','36'],['6','fay','34']];

  // ── Lecture 1: the same result, very different physical work ──────────
  add(1,0,['The same query','A cold trip','A warm trip','Compare the model'],(d,s)=>{
    text(d,'cover',640,120,'Inside a database',54);
    box(d,'sql',330,195,620,65,'SELECT name … WHERE gpa > 35',P.white,P.line,28);
    disk(d,'ssd',230,390);page(d,'ram',860,375,180,135,true,'RAM');
    d.arrow('route1',560,270,310,380,P.blue,4);d.arrow('route2',720,270,950,365,P.green,4);
    const loc=s===0?[640,292]:s===1?[310,450]:[950,440];dot(d,'query',loc[0],loc[1],18,s===1?P.blue:P.green);
    ['ada','cyd','eli'].forEach((v,i)=>box(d,'r'+i,460+i*125,555,110,55,v,P.greenLight,P.green,25));
    if(s>=3){text(d,'t1',310,590,'50 µs',39,P.blue);text(d,'t2',960,590,'0.2 µs',39,P.green);}
  });
  add(1,1,['Characters','Tokens','An executable tree','One boundary'],(d,s)=>{
    text(d,'sql',640,120,'SELECT name FROM students WHERE gpa > 35',32);
    const toks=['SELECT','name','FROM','students','WHERE','gpa','>','35'];
    if(s>=1)toks.forEach((v,i)=>box(d,'tok'+i,100+i*137,200,125,55,v,i%2===0?P.blueLight:P.white,P.blue,23));
    if(s>=2){node(d,'project',530,325,'Project');node(d,'select',530,430,'Select');node(d,'scan',530,535,'Scan');d.arrow('a1',640,430,640,395,P.green);d.arrow('a2',640,535,640,500,P.green);}
    if(s>=3){d.line('boundary',100,290,1180,290,P.orange,3,'9 8');dot(d,'unit',640,310,13,P.orange);}
  });
  add(1,2,['Empty frames','Read block 0','Filter block 0','Read block 1','Three results'],(d,s)=>{
    node(d,'scan',510,105,'Scan');node(d,'sel',510,220,'gpa > 35');d.arrow('up',620,210,620,180,P.green);
    [0,1].forEach(i=>{page(d,'disk'+i,130+i*225,420,190,140,false,'B'+i);d.rect('frame'+i,780+i*215,405,190,175,P.greenLight,P.green,10,3);text(d,'fn'+i,875+i*215,610,'frame '+i,25);});
    if(s>=1){const x=s===1?400:790;page(d,'transfer0',x,435,170,120,true,'B0');d.arrow('route0',320,490,770,490,P.orange,4);}
    if(s>=3){page(d,'transfer1',1005,435,170,120,true,'B1');d.arrow('route1',550,530,995,530,P.orange,4);}
    if(s>=2){['ada','cyd'].forEach((v,i)=>box(d,'res'+i,175+i*150,235,130,60,v,P.greenLight,P.green,28));}
    if(s>=4){box(d,'res2',340,310,130,60,'eli',P.greenLight,P.green,28);text(d,'count',920,150,'6 → 3',50);text(d,'reads',920,235,'2 reads',32,P.orange);}
  });
  add(1,3,['Make a prediction','Resident blocks','Repeat the filter','Reveal counters'],(d,s)=>{
    page(d,'f0',180,230,240,180,true,'B0');page(d,'f1',860,230,240,180,true,'B1');disk(d,'disk',565,460,150,110);
    node(d,'predicate',530,230,'gpa > 35');d.arrow('l',420,320,520,270,P.green,4);d.arrow('r',860,320,760,270,P.green,4);
    if(s>=1)d.path('cross','M575,485 L695,555 M695,485 L575,555','none',P.red,5);
    if(s>=2)['ada','cyd','eli'].forEach((v,i)=>box(d,'r'+i,435+i*145,125,130,55,v,P.greenLight,P.green,28));
    if(s>=3){text(d,'read',260,560,'0 reads',40,P.green);text(d,'scan',1020,560,'6 → 3',40,P.ink);}
  });
  add(1,4,['Rows','Fields and types','A rule for future rows'],(d,s)=>{
    d.table('students',265,245,[180,280,180],[['id','name','gpa'],...STUDENTS],{rowHeight:48,fontSize:26,header:true,highlightCols:s>=1?[0,1,2]:[]});
    if(s>=1)d.table('types',265,590,[180,280,180],[['int','varchar','int']],{rowHeight:42,fontSize:23,header:false});
    if(s>=2){d.arrow('future',1040,375,945,375,P.orange,4);person(d,'new',1100,330,P.orange);}
  });
  add(1,5,['A possible key','Same name','Same GPA','A stable identifier'],(d,s)=>{
    const data=[['id','name','gpa'],['1','ada','39'],['7','ada',s>=2?'39':'35']];
    d.table('keytable',250,220,[200,300,200],data,{rowHeight:85,fontSize:34,header:true,highlightCols:[s>=3?0:1]});
    if(s>=1)d.path('duplicate','M500,350 C390,430 390,350 500,430','none',P.orange,4);
    if(s>=2)d.circle('gpa-ring',860,430,40,'none',P.red,4);
    if(s>=3){d.line('key1',345,480,345,550,P.green,4);d.line('key2',390,480,390,580,P.green,4);text(d,'id',640,590,'id ≠ location',32,P.muted);}
  });
  add(1,6,['A transfer','All or nothing','Respect the rules','Control overlap','Survive restart'],(d,s)=>{
    const q=[[100,150,'A'],[720,150,'C'],[100,410,'I'],[720,410,'D']];
    q.forEach(([x,y,l],i)=>{d.rect('q'+i,x,y,460,210,s===i+1?P.greenLight:P.white,P.line,16,2);text(d,'letter'+i,x+45,y+60,l,38,P.green);});
    balance(d,'atomic',175,225,s===1?100:90,s===1?50:60);
    box(d,'bad',865,240,170,65,s>=2?'-10':'10',s>=2?P.redLight:P.white,P.red,35);if(s>=2)d.path('gate','M1080,210 L1080,335','none',P.red,6);
    person(d,'u1',220,460,P.blue);person(d,'u2',400,460,P.orange);d.arrow('u1p',245,530,320,585,P.blue,4);d.arrow('u2p',385,530,320,585,P.orange,4);
    disk(d,'durable',910,475,150,115);if(s>=4){d.path('bolt','M810,460 L775,520 L810,515 L780,590','none',P.orange,6);d.circle('tick',1130,530,28,P.green);text(d,'check',1130,540,'✓',30,P.white);}
  });
  add(1,7,['Two correct paths','Scan all blocks','Follow an index','Same result'],(d,s)=>{
    grid(d,'scan',90,150,20,25,21,15,s>=1?Array.from({length:500},(_,i)=>i):[],P.orangeLight);
    [[860,160],[760,290],[1010,290]].forEach(([x,y],i)=>box(d,'idx'+i,x,y,130,60,[50,25,75][i],P.blueLight,P.blue,30));
    d.arrow('ia',915,220,825,280,P.blue,3);d.arrow('ib',935,220,1070,280,P.blue,3);
    if(s>=2){[0,1,2].forEach(i=>page(d,'found'+i,715+i*150,430,125,90,true,''));d.arrow('fetch',825,350,775,420,P.green,4);}
    text(d,'500',300,605,s>=1?'500 reads':'?',40,P.orange);text(d,'7',930,605,s>=2?'7 reads':'?',40,P.green);
    if(s>=3)text(d,'equal',635,360,'=',64,P.ink);
  });
  add(1,8,['Front end','Operators','Records','Buffers','Files'],(d,s)=>{
    const labels=['SQL front end','Operators','Records','Buffer pool','File manager'];
    stack(d,'layers',230,105,labels,s,410,88);
    const icons=['SELECT …','next()','(1, ada, 39)','4096 B','k × 4096'];
    box(d,'crossing',805,135+s*93,260,80,icons[s],P.orangeLight,P.orange,30);
    d.arrow('across',650,150+s*98,790,175+s*93,P.orange,4);
  });
  add(1,9,['The latency scale','Memory','Storage','Human scale'],(d,s)=>{
    const rows=[['L1','1 ns',1],['RAM','100 ns',100],['SSD','25 µs',25000],['Disk','10 ms',10000000]];
    rows.forEach(([label,val,ns],i)=>{const w=830*Math.log10(ns)/7;text(d,'name'+i,130,170+i*115,label,30);d.rect('bar'+i,225,132+i*115,Math.max(2,w),48,i<2?P.greenLight:P.orangeLight,i<2?P.green:P.orange,5,2);text(d,'val'+i,310+w,170+i*115,s>=3?['1 s','100 s','6.9 h','116 d'][i]:val,30);});
    if(s>=1)dot(d,'traveller',s===1?375:s===2?820:1080,615,16,s===1?P.green:P.orange);
    if(s>=2)text(d,'scale',640,85,'log₁₀',28,P.muted);
  });
  add(1,10,['Count first','Compute both paths','Grow the table','Qualify the model'],(d,s)=>{
    text(d,'small',315,175,'500 × 25 µs',46,P.orange);text(d,'index',970,175,'7 × 25 µs',46,P.green);
    if(s>=1){text(d,'a',315,285,'12.5 ms',50,P.orange);text(d,'b',970,285,'0.175 ms',50,P.green);text(d,'ratio',640,380,'≈ 71×',58);}
    if(s>=2){d.arrow('grow',315,340,315,455,P.orange,4);text(d,'large',315,525,'500,000',52,P.orange);text(d,'cost',970,525,'height + matches',30,P.green);}
    if(s>=3){['CPU','RAM','I/O'].forEach((v,i)=>box(d,'cost'+i,410+i*170,590,150,50,v,P.white,P.line,24));}
  });
  add(1,11,['A layout','Metadata becomes rows','Bootstrap the catalog'],(d,s)=>{
    row(d,'layout',130,290,['id','name','gpa'],-1,150);row(d,'offsets',130,365,['4','8','20'],-1,150);
    if(s>=1){d.arrow('store',650,350,770,350,P.green,4);d.table('catalog',800,275,[180,120],[['field','offset'],['id','4'],['name','8'],['gpa','20']],{rowHeight:60,fontSize:28,header:true});}
    if(s>=2){d.path('loop','M975,535 C975,630 635,630 635,485','none',P.orange,4);d.circle('keyhead',635,475,18,'none',P.orange,4);d.line('keystem',650,475,700,475,P.orange,5);d.line('keytooth',685,475,685,493,P.orange,5);}
  });
  add(1,12,['Files','Buffers and records','Queries and SQL','Index and recovery'],(d,s)=>{
    const labels=['Recovery','B+ tree','SQL','Operators','Records','Buffers','Files'];
    labels.forEach((l,i)=>{const shown=i>=6-s*2;box(d,'layer'+i,290+i*35,105+i*74,570-i*40,58,shown?l:'',shown?P.greenLight:P.white,shown?P.green:P.line,26);if(shown)text(d,'n'+i,1010,147+i*74,7-i,30,P.green);});
    d.arrow('build',1110,610,1110,125,P.orange,5);
  });
  add(1,13,['Block address','Four bytes','Little endian','Read in the other order'],(d,s)=>{
    text(d,'offset',640,115,'7 × 4096 = 28,672',45);
    grid(d,'page',120,220,8,8,40,38,s>=1?[0,1,2,3]:[],P.greenLight);
    if(s>=1)row(d,'bytes',575,315,s>=2?['78','56','34','12']:['27','00','00','00'],-1,125);
    if(s>=2)text(d,'int',850,245,'0x12345678',38,P.green);
    if(s>=3){d.arrow('flip',615,430,1080,430,P.orange,5);text(d,'misread',850,520,'0x78563412',40,P.orange);}
  });
  add(1,14,['Buffered acceptance','Request durability','Durable completion','Failure boundary'],(d,s)=>{
    const labels=['Process','OS cache','Storage'];labels.forEach((l,i)=>box(d,'layer'+i,130+i*375,250,280,190,l,i===2?P.blueLight:P.white,i===2?P.blue:P.line,32));
    [0,1].forEach(i=>d.arrow('a'+i,425+i*375,345,485+i*375,345,P.green,4));
    page(d,'write',170+Math.min(s,2)*375,460,160,100,true,'');
    if(s>=1)text(d,'sync',690,190,'fsync()',38,P.orange);
    if(s>=2){dot(d,'ok',1020,545,26,P.green);text(d,'check',1020,555,'✓',32,P.white);}
    if(s>=3)d.path('power','M350,140 L300,215 L350,205 L315,275','none',P.red,6);
  });
  add(1,15,['Rebuild the machine','Trace one query','Explain the warm run'],(d,s)=>{
    const names=['SQL','next()','row','page','block'];stack(d,'recap',455,100,names.map((v,i)=>s>=1||i===0?v:'?'),s===2?3:-1,350,80);
    if(s>=1)dot(d,'packet',880,145+s*170,18,P.orange);
    if(s>=2){text(d,'r',215,290,'0 I/O',48,P.green);text(d,'w',215,420,'6 → 3',48);disk(d,'ssd',970,450);}
  });
  // ── Lecture 2: residency, pinning, recency, and dirty write-back ───────
  add(2,0,['One repeated request','Without a pool','With a pool'],(d,s)=>{
    text(d,'cover',640,120,'Keep the useful pages',52);
    disk(d,'disk',185,380,200,150);page(d,'frame',830,365,240,170,s>=2,'RAM');
    const x=s===0?640:s===1?285:950;dot(d,'request',x,s===0?240:450,22,s===1?P.orange:P.green);
    d.arrow('cold',620,265,350,370,P.orange,4);d.arrow('warm',665,265,860,355,P.green,4);
    text(d,'block',640,220,'B7 → B7 → B7',38);if(s>=2)text(d,'reuse',640,615,'3 → 1 I/O',42,P.green);
  });
  add(2,1,['Your observations','Buffered acceptance','Durable completion','Interpret the gap'],(d,s)=>{
    box(d,'buffered',190,140,300,90,'write()',P.greenLight,P.green,40);box(d,'synced',800,140,300,90,'fsync()',P.orangeLight,P.orange,40);
    page(d,'cache',225,360,230,170,true,'OS cache');disk(d,'storage',845,370,200,150);
    d.arrow('bufferpath',340,245,340,335,P.green,5);d.arrow('syncpath',950,245,950,345,P.orange,5);
    dot(d,'leftrequest',340,s>=1?330:270,16,P.green);dot(d,'rightrequest',950,s>=2?340:270,16,P.orange);
    if(s>=1){d.circle('leftdone',535,445,25,P.green);text(d,'lefttick',535,445,'✓',31,P.white);}
    if(s>=2){d.circle('rightdone',1120,445,25,P.orange);text(d,'righttick',1120,445,'✓',31,P.white);}
    if(s>=3)text(d,'ratio',640,620,'?',55,P.muted);
  });
  add(2,2,['One frame','Load a page','Replace the page'],(d,s)=>{
    [0,1,2].forEach(i=>{d.rect('frame'+i,190+i*330,285,250,245,P.white,P.green,12,4);text(d,'fr'+i,315+i*330,575,'frame '+i,30);});
    const x=s===0?70:s===1?210:540;page(d,'page',x,s===0?280:325,210,145,true,s===2?'B8':'B7');
    if(s>=2){page(d,'resident',210,325,210,145,true,'B7');d.arrow('replace',650,610,980,610,P.orange,4);}
  });
  add(2,3,['First three blocks','Fill beyond capacity','Second pass begins','Still no hits'],(d,s)=>{
    row(d,'sequence',110,115,['0','1','2','3','4','5','6','7'],-1,120);
    const states=[[0,1,2],[3,4,5],[6,7,0],[5,6,7]];states[s].forEach((v,i)=>box(d,'frame'+i,230+i*290,305,240,175,'B'+v,P.orangeLight,P.orange,42));
    const cur=[2,5,0,7][s];d.arrow('cursor',174+cur*128,245,174+cur*128,190,P.orange,4);
    text(d,'h',640,590,s>=3?'0 / 16 hits':'?',48,s>=3?P.orange:P.muted);
  });
  add(2,4,['Predict reuse','Protect B0 and B1','A cold interruption','Count hits'],(d,s)=>{
    const seq=[0,1,0,2,1,0,1,5,0,1,0,3,1,0,1,0];seq.forEach((v,i)=>box(d,'seq'+i,85+(i%8)*140,100+Math.floor(i/8)*80,125,58,v,v<2?P.greenLight:P.white,v<2?P.green:P.line,28));
    [0,1,s<2?2:s===2?5:3].forEach((v,i)=>box(d,'f'+i,225+i*300,335,240,175,'B'+v,i<2?P.greenLight:P.orangeLight,i<2?P.green:P.orange,42));
    if(s>=1){pin(d,'h0',445,355,'↻');pin(d,'h1',745,355,'↻');}
    if(s>=3)text(d,'count',640,610,'11 / 16 = 68.75%',44,P.green);
  });
  add(2,5,['One holder','Two holders','One release','No holders'],(d,s)=>{
    page(d,'held',490,335,300,220,true,'B7');person(d,'reader1',220,340,P.blue);person(d,'reader2',1040,340,P.orange);
    if(s<2)d.line('hold1',245,390,480,400,P.blue,5);if(s===1||s===2)d.line('hold2',1010,390,800,420,P.orange,5);
    pin(d,'count',640,290,[1,2,1,0][s]);d.arrow('evict',640,610,640,570,s===3?P.green:P.red,5);
    if(s<3)d.line('stop',605,582,675,582,P.red,7);
  });
  add(2,6,['Fill A B C','Touch A again','Choose a victim','Load D'],(d,s)=>{
    const labels=s>=3?['A','D','C']:['A','B','C'];const ticks=s===0?[1,2,3]:s>=3?[4,5,3]:[4,2,3];
    labels.forEach((v,i)=>{box(d,'fr'+i,200+i*305,245,245,210,v,s===2&&i===1?P.orangeLight:P.white,s===2&&i===1?P.orange:P.green,58);text(d,'t'+i,320+i*305,520,ticks[i],38,P.muted);});
    row(d,'trace',290,100,['A','B','C','A','D'],s===0?2:s===1?3:4,130);
    if(s>=1)d.arrow('refresh',320,195,320,225,P.green,4);if(s>=2)d.arrow('victim',630,600,630,550,P.orange,4);
  });
  add(2,7,['A is pinned','E replaces C','B replaces D','Every frame pinned'],(d,s)=>{
    const vals=[['A⁴','D⁵','C³'],['A⁴','D⁵','E⁶'],['A⁴','B⁷','E⁶'],['A⁴','B⁷','E⁶']][s];
    vals.forEach((v,i)=>{box(d,'f'+i,200+i*305,235,245,220,v,P.white,P.green,44);if(i===0||s===3)pin(d,'pin'+i,400+i*305,255,1);});
    if(s<3){box(d,'new',525,550,225,65,s===0?'E':'B',P.orangeLight,P.orange,35);d.arrow('incoming',640,535,s===0?930:625,470,P.orange,4);}
    else{box(d,'err',360,555,560,70,'BufferAbortError',P.redLight,P.red,34);}
  });
  add(2,8,['Find a resident','Scan the frames','Use a mapping','Grow the pool'],(d,s)=>{
    box(d,'blockid',470,100,340,70,'(students.tbl, 7)',P.blueLight,P.blue,30);
    [0,1,2,3,4,5].forEach(i=>box(d,'fl'+i,100,240+i*60,300,47,'B'+[3,1,8,0,7,4][i],i===4&&s>=1?P.greenLight:P.white,P.line,26));
    if(s>=1)d.arrow('linear',440,255,440,495,P.orange,5);
    box(d,'map',785,270,310,180,'BlockId → frame',P.greenLight,P.green,31);if(s>=2){d.arrow('fast',810,180,915,250,P.green,5);dot(d,'hash',1040,530,26,P.green);d.arrow('lookup',945,460,1030,505,P.green,4);}
    if(s>=3){text(d,'n',245,615,'O(frames)',31,P.orange);text(d,'o',945,615,'expected O(1)',31,P.green);}
  });
  add(2,9,['Clean page','Modify','Unpin','Flush before reuse','Load replacement'],(d,s)=>{
    d.rect('fr',135,195,350,280,P.white,P.green,14,4);page(d,'page',175,235,270,180,s<4,'B'+(s===4?8:7));
    d.rect('fieldbg',245,292,135,65,P.white,'none',5,0);text(d,'value',310,325,s===0?'39':s===4?'12':'40',50,s===0?P.ink:s===4?P.green:P.orange);if(s===1||s===2||s===3)dot(d,'dirty',440,215,18,P.orange);
    pin(d,'pin',150,180,s>=2?0:1);disk(d,'disk',880,260,200,150);
    if(s>=3){d.arrow('flush',500,340,850,340,s===3?P.orange:P.line,5);page(d,'saved',900,475,170,105,false,'B7');d.rect('savedbg',945,509,80,40,P.white,'none',2,0);text(d,'savedvalue',985,529,'40',27,P.orange);}
    if(s>=4){d.arrow('new',880,190,490,210,P.green,4);text(d,'v8',315,520,'clean',29,P.green);}
  });
  add(2,10,['Two caches','A database hold','Ordered writes','A memory budget'],(d,s)=>{
    stack(d,'tiers',445,100,['Operator','DB pool','OS cache','SSD'],s===0?1:s===1?1:s===2?3:2,390,98);
    if(s>=1)pin(d,'hold',875,270,1);
    if(s>=2){box(d,'log',125,420,210,75,'WAL',P.orangeLight,P.orange,32);d.arrow('logfirst',335,455,420,475,P.orange,4);}
    if(s>=3){d.rect('budget',975,200,100,350,P.white,P.line,4,3);d.rect('used',979,245,92,301,P.orangeLight,'none',2,0);text(d,'ram',1025,600,'RAM',29);}
  });
  add(2,11,['A hot set','Scan pollution','A small scan ring','Approximate recency'],(d,s)=>{
    ['A','B','C'].forEach((v,i)=>box(d,'hot'+i,130+i*205,170,175,120,s===1?String(i+4):v,s===1?P.orangeLight:P.greenLight,s===1?P.orange:P.green,42));
    [0,1,2,3,4,5,6,7].forEach((v,i)=>box(d,'cold'+i,115+i*138,515,122,65,v,P.white,P.line,28));
    if(s<2)d.arrow('flood',640,495,430,310,P.orange,5);
    else{d.circle('ring',970,260,110,'none',P.orange,5);[0,1,2].forEach((v,i)=>dot(d,'ring'+i,970+90*Math.cos(i*2.094),260+90*Math.sin(i*2.094),20,P.orange));d.arrow('scan',1040,495,1040,375,P.orange,5);}
    if(s>=3){d.circle('clock',440,365,43,'none',P.green,3);d.line('hand',440,365,470,345,P.green,4);}
  });
  add(2,12,['90% hits','99% hits','99.6% hits','100% hits'],(d,s)=>{
    const h=[0.9,0.99,0.996,1][s],t=h*100+(1-h)*25000,miss=(1-h)*25000;
    text(d,'h',640,145,(h*100).toFixed(s===2?1:0)+'%',65,P.green);
    d.rect('track',140,290,1000,110,P.white,P.line,5,2);
    const missw=1000*miss/t;d.rect('miss',140,290,Math.max(0.1,missw),110,P.orangeLight,P.orange,5,2);d.rect('mem',140+missw,290,Math.max(0.1,1000-missw),110,P.greenLight,P.green,5,2);
    text(d,'avg',640,500,(Math.round(t*10)/10)+' ns',58);text(d,'model',640,610,'h·100 + (1−h)·25,000',34,P.muted);
  });
  add(2,13,['49 frames, 50 blocks','Predict the second pass','Reveal misses','Add the missing frame'],(d,s)=>{
    grid(d,'pool',100,140,10,5,70,66,s>=3?Array.from({length:50},(_,i)=>i):Array.from({length:49},(_,i)=>i),P.greenLight);
    if(s<3)d.rect('missing',730,404,66,62,P.bg,P.orange,3,3);
    d.circle('loop',1000,300,135,'none',P.orange,4);dot(d,'cursor',1000+120*Math.cos(s*1.6),300+120*Math.sin(s*1.6),22,P.orange);
    text(d,'capacity',445,560,s>=3?'50 / 50':'49 / 50',45);if(s>=2)text(d,'hits',995,565,s===2?'0%':'100%*',45,s===2?P.orange:P.green);
  });
  add(2,14,['Lookup','Choose','Load or reuse','Release'],(d,s)=>{
    const labels=['lookup','victim','pin','unpin'];labels.forEach((v,i)=>{box(d,'step'+i,95+i*300,280,250,160,v,i===s?P.greenLight:P.white,i===s?P.green:P.line,35);if(i<3)d.arrow('a'+i,350+i*300,360,385+i*300,360,P.green,4);});
    dot(d,'request',220+s*300,235,19,P.orange);
    if(s>=1)pin(d,'eligibility',520,520,0);if(s>=2)page(d,'load',775,485,140,90,true,'');if(s>=3)pin(d,'released',1130,520,0);
  });
  add(2,15,['Same frames','Different reuse','Protect active work'],(d,s)=>{
    row(d,'scan',110,190,['0','1','2','3','4','5','6','7'],-1,120);row(d,'hot',110,330,['0','1','0','1','0','1','0','1'],-1,120);
    if(s>=1){text(d,'scanresult',640,285,'0%',42,P.orange);text(d,'hotresult',640,430,'reuse',42,P.green);}
    [0,1,2].forEach(i=>box(d,'f'+i,330+i*220,525,175,85,'B'+i,P.greenLight,P.green,32));if(s>=2)pin(d,'hold',910,535,1);
  });
  // ── Lecture 3: byte positions become records and persistent metadata ──
  add(3,0,['Anonymous bytes','One row','A stable address'],(d,s)=>{
    text(d,'cover',640,120,'Give bytes a shape',54);
    grid(d,'bytes',130,240,16,5,64,55,s>=1?[16,17,18,19,20,21]:[],P.greenLight);
    if(s>=1)row(d,'record',405,545,['1','ada','39'],-1,150);
    if(s>=2){d.arrow('address',340,580,340,415,P.orange,5);text(d,'rid',230,610,'(0, 1)',36,P.orange);}
  });
  add(3,1,['Four packed rows','Save byte 30','Grow ben','Read byte 30 again'],(d,s)=>{
    const widths=s>=2?[190,280,190,190]:[190,190,190,190], names=['ada',s>=2?'benjamin':'ben','cyd','dee'];let x=145;
    widths.forEach((w,i)=>{box(d,'row'+i,x,280,w-8,140,names[i],i===1&&s>=2?P.orangeLight:P.white,i===1&&s>=2?P.orange:P.green,30);x+=w;});
    if(s>=1){d.arrow('saved',525,590,525,435,s>=3?P.red:P.blue,5);text(d,'ptr',525,615,'byte 30',35,s>=3?P.red:P.blue);}
    if(s>=2){d.arrow('shift',740,210,830,210,P.orange,4);text(d,'five',785,175,'+5 B',36,P.orange);}
    if(s>=3){text(d,'wrong',990,565,'?',60,P.red);d.line('wrongline',965,515,625,420,P.red,3);}
  });
  add(3,2,['Fixed reservations','Insert ben','Rename in place','Reject overflow'],(d,s)=>{
    for(let i=0;i<4;i++)row(d,'slot'+i,190,275+i*78,[i===1&&s>=1?'1':'0',i===1?'2':'',i===1?(s>=2?'benjamin':'ben'):'',i===1?'31':''],-1,210);
    if(s>=2){d.rect('capacity',624,343,210,66,'none',P.green,3,4);}
    if(s>=3){box(d,'overflow',735,590,330,50,'bartholomew',P.redLight,P.red,28);d.line('stop',1075,580,1075,640,P.red,5);}
  });
  add(3,3,['Flag and integer','String prefix and capacity','Final integer','Pack a block'],(d,s)=>{
    const cells=[['flag',4,P.greenLight],['id',4,P.blueLight],['len',4,P.orangeLight],['name',8,P.orangeLight],['gpa',4,P.blueLight]];let x=160;
    cells.forEach(([v,w,c],i)=>{if(i<2||s>=1){box(d,'seg'+i,x,250,w*40-5,105,v,c,P.line,30);text(d,'off'+i,x,225,[0,4,8,12,20][i],25,P.muted);}x+=w*40;});
    if(s>=2)text(d,'size',640,440,'24 B',58,P.green);
    if(s>=3){grid(d,'block',185,520,34,5,27,17,Array.from({length:170},(_,i)=>i),P.greenLight);text(d,'packed',640,625,'170 × 24 + 16 = 4096',33);}
  });
  add(3,4,['Choose slot 3','Choose gpa','Compute address','Try a new schema'],(d,s)=>{
    for(let i=0;i<5;i++){d.rect('slot'+i,130,130+i*75,390,58,i===3?P.greenLight:P.white,P.green,5,2);text(d,'number'+i,90,169+i*75,i,28,P.muted);if(i===3&&s>=1)d.rect('field',455,130+i*75,65,58,P.orangeLight,P.orange,3,3);}
    text(d,'formula',860,260,s>=2?'3 × 24 + 20 = 92':'3 × 24 + ?',40);
    if(s>=3){box(d,'new',645,430,520,80,'cid · title[12] · credits',P.blueLight,P.blue,28);text(d,'challenge',905,585,'slot = 28 B',36,P.green);}
  });
  add(3,5,['Eight bytes','ASCII','UTF-8','Reject before mutation'],(d,s)=>{
    grid(d,'capacity',160,250,8,1,115,100,Array.from({length:s===0?0:s===1?3:s===2?6:8},(_,i)=>i),s===3?P.redLight:P.greenLight);
    const values=s===1?['a','d','a']:s===2?['C3','A9','F0','9F','98','80']:['62','61','72','74','68','6F','6C','6F'];
    if(s>=1)values.forEach((v,i)=>text(d,'byte'+i,215+i*115,310,v,29,s===3?P.red:P.ink));
    if(s===2){text(d,'unicode',400,440,'é',60);text(d,'smile',845,440,'😀',55);text(d,'sizes',640,545,'2 B + 4 B',44);}
    if(s>=3){box(d,'gpa',935,495,200,90,'gpa: 39',P.blueLight,P.blue,32);d.line('boundary',915,455,915,610,P.red,5);text(d,'extra',590,545,'+ 3 B',42,P.red);}
  });
  add(3,6,['A live slot','Clear its flag','Bytes remain','Reuse the space'],(d,s)=>{
    const vals=s>=3?['1','6','fay','34']:[s>=1?'0':'1','1','ada','39'];row(d,'slot',140,285,vals,s>=1?0:-1,230);
    if(s>=1){d.rect('ghost',376,285,720,58,'none',P.line,5,3);text(d,'flag',260,465,'0',65,P.orange);}
    if(s>=2)d.arrow('reuse',680,530,680,365,P.green,5);
    if(s>=3)text(d,'same',640,605,'RID (0, 0)',38,P.green);
  });
  add(3,7,['Reserve 8 bytes','Use only 3','Reserve 200','Compute the I/O cost'],(d,s)=>{
    const cap=s>=2?200:8,slot=16+cap,rows=Math.floor(4096/slot);text(d,'cap',340,140,'capacity: '+cap+' B',40);
    d.rect('slot',140,240,1000,120,P.orangeLight,P.orange,5,2);const usable=1000*19/slot;d.rect('used',140,240,Math.min(1000,usable),120,P.greenLight,P.green,5,2);
    if(s>=1)text(d,'actual',640,430,'3 B',40,P.green);text(d,'rows',340,565,rows+' rows / block',39);
    if(s>=3)text(d,'blocks',950,565,'10,000 → 556 blocks',36,P.orange);
  });
  add(3,8,['Zero','An empty string','Missing','Read the bitmap'],(d,s)=>{
    row(d,'values',170,320,['0','""','?'],-1,280);
    [0,1,2].forEach(i=>box(d,'bit'+i,280+i*288,240,55,50,s>=2&&i===2?'1':'0',s>=2&&i===2?P.orangeLight:P.white,P.line,27));
    if(s>=2){d.line('absent1',800,330,1035,365,P.orange,4);d.line('absent2',800,365,1035,330,P.orange,4);}
    if(s>=3)d.arrow('checkbit',1120,465,900,300,P.orange,5);
  });
  add(3,9,['Small value inline','Compression','Out-of-line storage','A compact pointer'],(d,s)=>{
    d.rect('heap',110,235,430,300,P.white,P.green,12,3);row(d,'small',145,280,['1','ada','39'],-1,108);
    box(d,'essay',145,385,s===0?220:s===1?335:180,90,s===0?'150 B':s===1?'1 KB':'18 B →',s>=2?P.orangeLight:P.greenLight,s>=2?P.orange:P.green,35);
    if(s>=2){grid(d,'chunks',790,230,4,4,86,73,Array.from({length:16},(_,i)=>i),P.orangeLight);d.arrow('pointer',350,430,770,380,P.orange,5);text(d,'chunk',960,590,'≈ 2 KB / chunk',30,P.orange);}
    if(s>=3)text(d,'large',360,605,'2 MB',52,P.blue);
  });
  add(3,10,['The out-of-line essay','Read name','Read essay','Count different paths'],(d,s)=>{
    page(d,'heap',160,285,270,220,s===1||s>=3,'heap');grid(d,'side',815,220,4,5,76,65,s>=2?Array.from({length:20},(_,i)=>i):[],P.orangeLight);
    box(d,'q',275,110,720,65,s===1?'SELECT name …':'SELECT essay …',P.white,P.line,32);
    if(s>=1)d.arrow('heapread',580,185,320,265,P.green,5);
    if(s>=2)d.arrow('toastread',440,390,785,390,P.orange,5);
    if(s>=3){text(d,'name',310,605,'heap only',34,P.green);text(d,'essay',960,605,'heap + chunks',34,P.orange);}
  });
  add(3,11,['Pin one block','Use its layout','Change a field','Mark dirty and close'],(d,s)=>{
    d.rect('recordpage',345,185,600,395,P.greenLight,P.green,18,3);page(d,'buffer',390,290,240,195,true,'B0');pin(d,'pin',920,205,s===3?0:1);
    row(d,'layout',690,315,['4','8','20'],-1,65);if(s>=1)d.arrow('offset',820,400,655,400,P.orange,4);
    text(d,'field',510,390,s>=2?'40':'39',54,s>=2?P.orange:P.ink);if(s>=3)dot(d,'dirty',655,290,19,P.orange);
    text(d,'class',645,250,'RecordPage',36);
  });
  add(3,12,['Scan used slots','Skip an empty slot','Cross to the next block','Reuse before appending'],(d,s)=>{
    [0,1,2].forEach(b=>{d.rect('b'+b,130+b*365,180,300,350,P.white,P.green,10,3);for(let i=0;i<4;i++)box(d,'s'+b+i,155+b*365,205+i*75,250,55,(b===0&&i===1)||(b===1&&i===2&&s<3)?'0':'1',P.white,P.line,28);text(d,'bn'+b,280+b*365,580,'B'+b,30);});
    const positions=[[150,232],[150,382],[515,232],[515,382]];d.arrow('cursor',positions[s][0]-45,positions[s][1],positions[s][0]-5,positions[s][1],P.orange,5);
    pin(d,'hold',410+(s>=2?365:0),180,1);
    if(s>=3)d.rect('reused',520,355,250,55,'none',P.green,6,4);
  });
  add(3,13,['A live row','In-place update','Deletion','A different row'],(d,s)=>{
    box(d,'rid',135,330,290,110,'(0, 0)',P.blueLight,P.blue,45);d.arrow('ptr',445,385,650,385,s===2?P.line:P.green,5);
    row(d,'target',680,355,[s===3?'6':'1',s===3?'fay':s===1?'adelaide':'ada',s===3?'34':'39'],-1,130);
    if(s===2)d.path('delete','M690,330 L1080,440 M1080,330 L690,440','none',P.red,4);
    if(s>=3){text(d,'oldkey',280,525,'id 1',35,P.red);text(d,'newkey',880,525,'id 6',35,P.green);}
  });
  add(3,14,['Remember a layout','Persist catalog rows','Restart','Bootstrap'],(d,s)=>{
    row(d,'layout',90,250,['id:4','name:8','gpa:20'],-1,140);
    if(s>=1){d.table('cat',760,205,[190,130],[['field','offset'],['id','4'],['name','8'],['gpa','20']],{rowHeight:68,fontSize:28,header:true});d.arrow('save',560,280,735,280,P.green,5);}
    if(s>=2){d.path('restart','M550,500 A70,70 0 1,0 650,410','none',P.orange,5);d.arrow('rhead',647,410,610,410,P.orange,5);d.arrow('readback',740,465,520,465,P.blue,4);}
    if(s>=3){box(d,'boot',140,525,320,75,'catalog layouts',P.orangeLight,P.orange,30);d.arrow('unlock',470,550,735,470,P.orange,4);}
  });
  add(3,15,['Locate','Walk','Remember'],(d,s)=>{
    const names=['Layout','RecordPage','TableScan','Catalog'];names.forEach((v,i)=>{box(d,'layer'+i,100+i*300,260,250,175,s>=1?v:'?',i===s?P.greenLight:P.white,P.green,31);if(i<3)d.arrow('a'+i,355+i*300,345,390+i*300,345,P.green,4);});
    if(s>=1){text(d,'formula',350,550,'k × size + offset',36);text(d,'next',950,550,'next()',40,P.green);}
    if(s>=2)text(d,'address',640,145,'bytes → rows',48);
  });
  // ── Lecture 4: requests move down, rows move up ──────────────────────
  add(4,0,['One question','One requested row','One operator tower'],(d,s)=>{
    text(d,'cover',640,120,'One row at a time',54);
    stack(d,'tower',445,215,['Project','Select','Scan'],s===0?-1:s===1?2:0,390,95);
    if(s>=1){d.arrow('ask',905,235,905,520,P.blue,5);dot(d,'row',350,s===1?520:280,22,P.green);d.arrow('up',350,490,350,270,P.green,5);}
    if(s>=2)box(d,'answer',465,590,350,60,'ada',P.greenLight,P.green,35);
  });
  add(4,1,['Materialize a scan','Materialize the product','The result exceeds memory','Pull a small stream'],(d,s)=>{
    d.rect('ram',100,170,470,420,P.white,P.red,12,3);grid(d,'input',140,215,8,6,45,45,Array.from({length:48},(_,i)=>i),P.blueLight);
    if(s>=1)grid(d,'product',665,120,12,12,41,41,Array.from({length:144},(_,i)=>i),P.orangeLight);
    if(s>=2){text(d,'size',640,615,'10⁶ × 10⁶ = 10¹²',40,P.orange);d.arrow('overflow',800,510,800,575,P.red,5);}
    if(s>=3){d.rect('mask',100,165,1080,435,P.bg,'none',0,0);node(d,'stream1',150,320,'Scan');node(d,'stream2',530,320,'Select');node(d,'stream3',910,320,'Project');d.arrow('s1',380,355,520,355,P.green,4);d.arrow('s2',760,355,900,355,P.green,4);dot(d,'one',640,430,20,P.green);}
  });
  add(4,2,['No demand','Ask Project','Ask Select','Ask Scan','Return ada'],(d,s)=>{
    stack(d,'operators',480,265,['Project','Select','Scan'],s===0?-1:s<4?s-1:0,350,85);
    if(s>=1){d.arrow('requestpath',950,290,950,570,P.blue,5);dot(d,'request',950,Math.min(575,275+s*90),18,P.blue);}
    if(s>=4){d.arrow('returnpath',320,565,320,290,P.green,5);box(d,'row',150,270,200,70,'ada',P.greenLight,P.green,35);}
  });
  add(4,3,['Predict the first pull','ada uses one row','cyd uses two more','eli uses two more','Exhaustion uses the last'],(d,s)=>{
    STUDENTS.forEach((r,i)=>box(d,'r'+i,100+i*195,180,175,80,r[1]+' · '+r[2],([0,2,4].includes(i)&&s>=1)?P.greenLight:P.white,P.line,27));
    const consumed=[0,1,3,5,6][s];d.line('progress',100,315,100+Math.max(1,consumed)*190,315,P.orange,7);
    ['ada','cyd','eli'].forEach((v,i)=>{if(s>=i+1)box(d,'out'+i,330+i*230,425,190,90,v,P.greenLight,P.green,37);});
    text(d,'counts',640,610,consumed+' → '+Math.min(3,s),50,s===4?P.ink:P.green);
  });
  add(4,4,['A common socket','Rewind and advance','Read and inspect','Release'],(d,s)=>{
    const names=['before_first','next','get_val','has_field','close'];
    const pos=[[170,180],[1080,180],[170,495],[1080,495],[640,610]];
    const edges=[[295,180,450,305],[955,180,830,305],[295,495,450,435],[955,495,830,435],[640,575,640,465]];
    names.forEach((v,i)=>{if(i<2||s>=2)d.line('link'+i,...edges[i],i===4&&s<3?P.line:P.green,3);});
    box(d,'scan',450,275,380,190,'Scan',P.greenLight,P.green,55);
    names.forEach((v,i)=>{if(i<2||s>=2)box(d,'verb'+i,pos[i][0]-125,pos[i][1]-35,250,70,v,P.white,P.line,28);});
    if(s>=1)dot(d,'cursor',640,225,18,P.orange);
  });
  add(4,5,['A filter gate','Pass 39','Reject 31','Pass 37'],(d,s)=>{
    d.path('gate','M575,220 L700,220 L700,490 L575,490','none',P.green,5);text(d,'predicate',640,165,'gpa > 35',38);
    const vals=[39,31,37];vals.forEach((v,i)=>box(d,'in'+i,100+i*125,310,105,80,v,P.white,P.line,34));
    const x=s===0?510:s===1?930:s===2?640:930;box(d,'moving',x,320,120,80,s===2?'31':s===3?'37':'39',s===2?P.redLight:P.greenLight,s===2?P.red:P.green,37);
    d.arrow('flow',770,360,890,360,P.green,4);if(s===2)d.arrow('reject',640,420,640,585,P.red,5);
  });
  add(4,6,['The underlying row','Keep one field','Read name','Refuse gpa'],(d,s)=>{
    row(d,'row',160,305,['id: 1','name: ada','gpa: 39'],-1,310);
    if(s>=1){d.rect('mask1',160,270,310,130,P.bg,P.line,6,3);d.rect('mask2',796,270,310,130,P.bg,P.line,6,3);d.rect('window',478,270,310,130,'none',P.green,6,5);}
    if(s>=2){d.arrow('get',640,505,640,420,P.green,5);text(d,'name',640,570,'get_val(name)',35,P.green);}
    if(s>=3){d.arrow('bad',950,505,950,420,P.red,5);text(d,'error',945,590,'ValueError',32,P.red);}
  });
  add(4,7,['One combined row, two source tables','First term fails','Skip the second','Look up the major ID in the same row'],(d,s)=>{
    text(d,'rowhead',640,85,'One combined ProductScan row',34);
    d.rect('student-source',110,135,630,180,P.greenLight,P.green,10,2);
    d.rect('major-source',770,135,400,180,P.orangeLight,P.orange,10,2);
    text(d,'student-name',425,165,'students: ben',30,P.green);
    text(d,'major-name',970,165,'majors: ds',30,P.orange);
    box(d,'gpa',140,200,200,58,'gpa = 31',P.white,P.green,28);
    box(d,'mid',400,200,310,58,'mid = 2',P.white,P.green,30);
    box(d,'mid2',800,200,340,58,'mid2 = 1',P.white,P.orange,30);
    text(d,'mid-meaning',555,287,'student’s major ID',25,P.green);
    text(d,'mid2-meaning',970,287,'major’s own ID',25,P.orange);
    box(d,'term1',195,390,350,90,s>=3?'mid = mid2':'gpa > 35',s>=1?P.redLight:P.white,s>=1?P.red:P.green,36);
    box(d,'term2',750,390,350,90,s>=3?'gpa > 35':'mid = 2',s>=2?P.bg:P.white,P.line,36);
    text(d,'and',647,435,'AND',28,s>=2?P.muted:P.green);
    if(s>=2){d.path('skip','M755,390 L1100,480','none',P.line,6);text(d,'skipped',925,515,'not checked',26,P.muted);}
    if(s>=3){
      d.arrow('left-value',555,325,350,380,P.green,4);
      d.arrow('right-value',970,325,485,380,P.orange,4);
      text(d,'result',640,555,'2 ≠ 1 → reject this pair',36,P.red);
      text(d,'f',640,610,'F("mid2") → read majors.mid2 → 1',30,P.orange);
    } else text(d,'result',640,580,['AND: both terms must be True','31 > 35 → False','return False · second term skipped'][s],34,s?P.red:P.ink);
  });
  add(4,8,['Initialize the left','ada × ds','ada × stat','ada × econ','Carry to ben'],(d,s)=>{
    ['ada','ben','cyd'].forEach((v,i)=>box(d,'left'+i,210,195+i*125,240,85,v,(s===4?i===1:i===0)?P.greenLight:P.white,P.green,36));
    ['ds','stat','econ'].forEach((v,i)=>box(d,'right'+i,830,195+i*125,240,85,v,s>0&&i===(s===4?0:s-1)?P.orangeLight:P.white,P.orange,36));
    if(s>=1){d.line('link1',460,s===4?360:235,650,360,P.green,4);d.line('link2',820,235+(s===4?0:s-1)*125,650,360,P.orange,4);box(d,'pair',500,565,330,75,s===4?'(ben, ds)':'(ada, '+['','ds','stat','econ'][s]+')',P.greenLight,P.green,33);}
    if(s===4)d.path('carry','M1120,505 C1210,505 1210,235 1120,235','none',P.orange,5);
  });
  add(4,9,['Predict four counts','Enumerate all pairs','Keep matches','Match nothing'],(d,s)=>{
    grid(d,'pairs',355,170,6,3,100,115,s>=1?Array.from({length:18},(_,i)=>i):[],P.orangeLight);
    if(s>=2){[0,7,2,15,10,17].forEach(i=>d.circle('match'+i,400+(i%6)*100,222+Math.floor(i/6)*115,25,s===3?P.red:P.green));}
    const vals=s===0?['?','?','?','?']:['6','18','18',s===1?'?':s===2?'6':'0'];
    ['left','right','pairs','out'].forEach((v,i)=>{text(d,'label'+i,220+i*280,565,v,28,P.muted);text(d,'num'+i,220+i*280,615,vals[i],44,i===3?P.green:P.ink);});
  });
  add(4,10,['An empty left','An empty right','Both populated','Exhausted stays exhausted'],(d,s)=>{
    d.rect('left',200,180,290,340,P.white,P.green,12,3);d.rect('right',795,180,290,340,P.white,P.orange,12,3);
    if(s!==0)['ada','ben'].forEach((v,i)=>box(d,'l'+i,235,230+i*125,220,85,v,P.greenLight,P.green,35));
    if(s!==1)['ds','stat'].forEach((v,i)=>box(d,'r'+i,830,230+i*125,220,85,v,P.orangeLight,P.orange,35));
    text(d,'times',640,360,'×',60);text(d,'result',640,600,s<2?'0 pairs':s===2?'4 pairs':'False → False',46,s===2?P.green:P.muted);
    if(s===3){d.arrow('rewind',1180,565,1180,200,P.blue,4);text(d,'rewindlabel',1050,120,'before_first()',30,P.blue);}
  });
  add(4,11,['Two active scans','Close the root','Forward to both','No leaked pins'],(d,s)=>{
    node(d,'prod',530,130,'Product');node(d,'left',220,355,'TableScan');node(d,'right',840,355,'TableScan');d.line('l',595,200,330,355,P.green,4);d.line('r',685,200,950,355,P.green,4);
    pin(d,'lp',330,510,s>=3?0:1);pin(d,'rp',950,510,s>=3?0:1);
    if(s>=1)dot(d,'close',640,s===1?95:s===2?210:285,17,P.orange);
    if(s>=2){d.arrow('cl',580,230,360,325,P.orange,5);d.arrow('cr',700,230,925,325,P.orange,5);}
    if(s>=3)text(d,'zero',640,610,'0 pinned',44,P.green);
  });
  add(4,12,['Filter after pairing','900 candidate pairs','Push local filters','60 candidate pairs','Same 20 answers'],(d,s)=>{
    text(d,'lefthead',340,110,'300 × 3',45,P.orange);text(d,'righthead',950,110,s>=2?'60 × 1':'300 × 3',45,P.green);
    grid(d,'late',145,210,15,12,27,25,s>=1?Array.from({length:180},(_,i)=>i):[],P.orangeLight);
    grid(d,'early',835,210,s>=2?5:15,s>=2?12:12,27,25,s>=3?Array.from({length:60},(_,i)=>i):[],P.greenLight);
    if(s>=1)text(d,'nlate',350,560,'900',55,P.orange);if(s>=3)text(d,'nearly',950,560,'60',55,P.green);
    if(s>=4){text(d,'out',640,610,'20 = 20',42);text(d,'ratio',640,340,'15×',55,P.green);}
  });
  add(4,13,['A streaming filter','Sort must inspect all','Hash groups accumulate','Ordered groups can finish'],(d,s)=>{
    const vals=[7,2,9,1,6];row(d,'input',250,120,vals,-1,145);
    box(d,'filter',135,300,265,145,'σ',P.greenLight,P.green,68);box(d,'sort',510,300,265,145,s===3?'Σ ordered':'sort',P.orangeLight,P.orange,s===3?29:38);box(d,'agg',900,300,265,145,'Σ hash',P.blueLight,P.blue,37);
    if(s>=1){row(d,'sorted',490,500,[1,2,6,7,9],-1,80);d.line('blocking',515,465,785,465,P.orange,6);}
    if(s>=2){[0,1,2].forEach(i=>box(d,'g'+i,925+i*70,510,60,60,[4,7,3][i],P.blueLight,P.blue,27));}
    if(s>=3){d.arrow('groupout',640,455,640,610,P.green,5);text(d,'completed',420,620,'Σ A',40,P.green);}
  });
  add(4,14,['Identify each table’s major ID','Product puts both fields in one row','Match the two ID values','Return the student and their department'],(d,s)=>{
    box(d,'s',120,465,340,65,'Scan students',P.greenLight,P.green,30);
    box(d,'m',820,465,340,65,'Scan majors',P.orangeLight,P.orange,30);
    box(d,'student-row',120,545,340,55,'ada · mid = 1',P.white,P.green,30);
    box(d,'major-row',820,545,340,55,'mid2 = 1 · ds',P.white,P.orange,30);
    text(d,'mid-meaning',290,630,'mid: student’s major ID',26,P.green);
    text(d,'mid2-meaning',990,630,'mid2: major’s own ID',26,P.orange);
    if(s<2){
      text(d,'field-names',640,170,'mid and mid2 are field names',34);
      text(d,'suffix',640,220,'The suffix 2 keeps the names distinct.',28,P.muted);
    }
    if(s>=1){
      box(d,'p',500,360,280,65,'Product',P.greenLight,P.green,30);
      d.arrow('sl',290,455,550,435,P.green,4);
      d.arrow('ml',990,455,730,435,P.orange,4);
    }
    if(s>=2){
      d.rect('filter',425,205,430,100,P.greenLight,P.green,8,2);
      text(d,'filter-label',640,235,'Select: mid = mid2',32);
      text(d,'match',640,278,'1 = 1 → keep this pair',28,P.green);
      d.arrow('f',640,350,640,315,P.green,4);
      text(d,'suffix',980,360,'The 2 is part of the name',26,P.muted);
    }
    if(s>=3){
      box(d,'proj',450,75,380,70,'Project: name, dept',P.greenLight,P.green,30);
      d.arrow('pr',640,195,640,155,P.green,4);
      box(d,'answer',910,75,260,70,'(ada, ds)',P.white,P.green,32);
      d.arrow('out',840,110,900,110,P.green,4);
    }
  });
  add(4,15,['One interface','Two directions','Different amounts of work'],(d,s)=>{
    stack(d,'tree',465,175,['Project','Select','Product'],s===0?-1:1,350,95);
    if(s>=1){d.arrow('down',940,185,940,530,P.blue,5);d.arrow('up',340,530,340,185,P.green,5);dot(d,'ask',940,300,20,P.blue);dot(d,'row',340,430,20,P.green);}
    if(s>=2){text(d,'small',280,610,'18 → 6',45);text(d,'big',970,610,'900 → 60',45,P.green);}
  });
  // ── Lecture 5: lexical units, grammar, intent, and executable plans ───
  add(5,0,['Typed text','A description of intent','An executable tree'],(d,s)=>{
    text(d,'cover',640,120,'From text to execution',54);
    box(d,'sql',100,275,400,105,'SELECT name …',P.blueLight,P.blue,38);
    box(d,'intent',730,275,400,105,s>=1?'QueryData':'?',P.greenLight,P.green,40);d.arrow('flow',525,330,705,330,P.green,5);
    if(s>=2){node(d,'root',530,470,'Project');node(d,'leaf',530,560,'Scan');d.arrow('edge',640,550,640,545,P.green,4);}
  });
  add(5,1,['Text is not an operator','An intent object','A plan','Execute later'],(d,s)=>{
    box(d,'source',130,190,420,95,'SELECT name FROM …',P.blueLight,P.blue,34);
    const labels=s>=1?['fields','tables','predicate']:['?','?','?'];labels.forEach((v,i)=>box(d,'intent'+i,740,180+i*105,370,75,v,P.greenLight,P.green,31));
    if(s>=2){d.arrow('compile',575,235,705,235,P.green,4);node(d,'operator',260,465,'TableScan');}
    if(s>=3){d.arrow('execute',500,500,765,500,P.orange,5);box(d,'row',790,470,300,80,'ada',P.orangeLight,P.orange,36);}
  });
  add(5,2,['The same spelling','Outside quotes','Inside quotes','Different token kinds'],(d,s)=>{
    text(d,'sql',640,160,"SELECT name FROM students WHERE nick = 'from'",32);
    box(d,'from',225,295,300,100,'FROM',s>=1?P.blueLight:P.white,s>=1?P.blue:P.line,45);
    box(d,'string',765,295,300,100,"'from'",s>=2?P.orangeLight:P.white,s>=2?P.orange:P.line,45);
    if(s>=2){d.path('quote','M760,265 L735,265 L735,430 L760,430 M1070,265 L1095,265 L1095,430 L1070,430','none',P.orange,4);}
    if(s>=3){text(d,'kind1',375,535,'KEYWORD',36,P.blue);text(d,'kind2',915,535,'STR',36,P.orange);}
  });
  add(5,3,['Five families','Words','Values','Punctuation'],(d,s)=>{
    const labels=['KEYWORD','ID','NUM','STR','PUNCT'],samples=['SELECT','name','35',"'ada'",'>'];
    labels.forEach((v,i)=>{box(d,'kind'+i,85+i*242,260,222,90,v,i===0?P.blueLight:i>=2&&i<=3?P.orangeLight:P.white,P.line,28);if(i<2||s>=2)box(d,'sample'+i,95+i*242,450,202,95,samples[i],P.white,P.line,35);});
    if(s>=1)d.arrow('word',300,365,300,430,P.blue,4);if(s>=3)d.arrow('punct',1150,365,1150,430,P.green,4);
    if(s>=3)text(d,'provided',640,615,'Lexer provided. ANTLR can generate lexers and parsers.',26,P.muted);
  });
  add(5,4,['SQL text','Tokens','Example AST','QueryData','Executable scan tree'],(d,s)=>{
    const labels=['SQL','tokens','AST sketch','QueryData','scan tree'];
    labels.forEach((v,i)=>{box(d,'stage'+i,70+i*235,80,200,65,v,i===s?P.greenLight:P.white,i===s?P.green:P.line,29);if(i===2)text(d,'same-structure',757,122,'=',28,P.blue);else if(i<4)d.arrow('a'+i,275+i*235,112,300+i*235,112,P.green,3);});
    text(d,'sql',640,s===0?350:210,'SELECT name FROM students WHERE gpa > 35',31);
    if(s===1){
      const tokens=['KEYWORD select','ID name','KEYWORD from','ID students','KEYWORD where','ID gpa','PUNCT >','NUM 35'];
      tokens.forEach((v,i)=>box(d,'token'+i,70+(i%4)*290,310+Math.floor(i/4)*125,260,80,v,P.blueLight,P.blue,25));
    }
    if(s===2){
      d.line('ast-fields',640,305,225,385,P.blue,3);d.line('ast-tables',640,305,570,385,P.blue,3);d.line('ast-predicate',640,305,1010,385,P.blue,3);
      d.line('ast-left',1010,450,880,525,P.blue,3);d.line('ast-right',1010,450,1110,525,P.blue,3);
      box(d,'ast-root',490,245,300,60,'SelectQuery',P.blueLight,P.blue,32);
      box(d,'ast-field',90,385,270,65,'Field(name)',P.white,P.blue,29);
      box(d,'ast-table',420,385,300,65,'Table(students)',P.white,P.blue,29);
      box(d,'ast-compare',860,385,300,65,'GreaterThan',P.blueLight,P.blue,29);
      box(d,'ast-lhs',780,525,200,60,'Field(gpa)',P.white,P.blue,27);
      box(d,'ast-rhs',1010,525,200,60,'Number(35)',P.white,P.blue,27);
      text(d,'ast-caption',640,635,'Illustrative node names; the lab stores this structure in QueryData.',24,P.muted);
    }
    if(s===3){
      const lines=['QueryData(','    fields=["name"],','    tables=["students"],','    predicate=Predicate(("gpa", ">", 35))',')'];
      lines.forEach((v,i)=>d.text('object'+i,i>0&&i<4?285:240,315+i*60,v.trimStart(),30,P.blue,'start'));
      text(d,'object-caption',640,635,'QueryData is the lab’s compact AST representation.',26,P.muted);
    }
    if(s===4){
      ['ProjectScan: name','SelectScan: gpa > 35','TableScan: students'].forEach((v,i)=>{box(d,'scan'+i,395,280+i*110,490,70,v,P.greenLight,P.green,31);if(i<2)d.arrow('input'+i,640,355+i*110,640,385+i*110,P.green,3);});
      text(d,'execute',640,630,'Calling next() on the root starts pulling rows.',27,P.muted);
    }
  });
  add(5,5,['The required track','An optional branch','Repeat a list','Read a legal path'],(d,s)=>{
    const vals=['SELECT','fields','FROM','tables'];vals.forEach((v,i)=>{box(d,'rail'+i,115+i*275,300,230,85,v,P.white,P.green,33);if(i<3)d.arrow('ra'+i,350+i*275,342,380+i*275,342,P.green,4);});
    if(s>=1){d.path('branch','M1120,400 L1120,530 L550,530 L550,415','none',P.orange,4);box(d,'where',700,490,250,80,'WHERE …',P.orangeLight,P.orange,34);}
    if(s>=2)d.path('repeat','M475,275 C475,230 595,230 595,275','none',P.blue,4);
    if(s>=3){
      const x=[230,505,780,1055][s-3]||1055;dot(d,'token',x,425,18,P.green);text(d,'comma',535,250,',',43,P.blue);
      text(d,'field-rule',640,200,'fieldlist := * | field { , field }',34,P.blue);
      text(d,'symbols',640,620,'*: all columns     |: choose one alternative',29,P.muted);
      text(d,'examples',640,665,'SELECT * FROM students   or   SELECT name, gpa FROM students',25);
    }
  });
  add(5,6,['peek inspects','next consumes','match tests','expect validates and consumes'],(d,s)=>{
    const vals=['SELECT','name','FROM','students'];row(d,'tokens',130,255,vals,s===0?0:s===1?1:s===2?2:3,240);
    d.arrow('cursor',250+s*248,455,250+s*248,330,s===3?P.orange:P.green,5);
    text(d,'verb',640,140,['peek()','next()','match(…)','expect(…)'][s],50);
    if(s===0)text(d,'answer',640,580,'SELECT',42,P.blue);
    if(s===2)text(d,'bool',640,580,'True',44,P.green);
    if(s===3){box(d,'expected',400,540,480,80,"expected 'from'",P.orangeLight,P.orange,34);}
  });
  add(5,7,['Parse a query','Enter WHERE','Enter a term','Return data'],(d,s)=>{
    row(d,'tokens',85,105,['WHERE','gpa','>','35'],s===0?0:s===1?1:s===2?2:3,270);
    const frames=['parse_query','_parse_predicate','_parse_term'];frames.forEach((v,i)=>{if(i===0||s>=i)box(d,'frame'+i,180,465-i*105,430,85,v,P.greenLight,P.green,32);});
    box(d,'querydata',795,265,340,230,s>=3?'gpa > 35':'QueryData',P.blueLight,P.blue,36);
    if(s>=3)d.arrow('return',630,310,770,360,P.green,5);
  });
  add(5,8,['A numeric literal','An identifier','Wrap the field reference','Evaluate later'],(d,s)=>{
    row(d,'literal',180,155,['gpa','>','35'],-1,270);row(d,'field',180,295,['mid','=','mid2'],-1,270);
    if(s>=1){d.rect('idoutline',736,285,270,80,'none',P.orange,7,4);text(d,'kind',1100,345,'ID',35,P.orange);}
    if(s>=2){d.arrow('wrap',875,395,875,470,P.orange,5);box(d,'f',715,500,320,90,'F(mid2)',P.orangeLight,P.orange,39);}
    if(s>=3){box(d,'row',180,510,360,80,'mid: 2 · mid2: 2',P.greenLight,P.green,30);d.arrow('resolve',695,545,560,545,P.green,5);}
  });
  add(5,9,['Query intent','Insert intent','Create intent','Swap the planner'],(d,s)=>{
    const names=['QueryData','InsertData','CreateData'],content=[['fields','tables','predicate'],['table','values'],['table','schema']];
    names.forEach((v,i)=>{box(d,'card'+i,100+i*400,180,330,105,v,i===s?P.greenLight:P.white,P.green,34);content[i].forEach((f,j)=>box(d,'field'+i+j,125+i*400,315+j*80,280,60,f,P.blueLight,P.blue,28));});
    if(s>=3){d.path('swap','M425,625 C625,520 825,520 1000,625','none',P.orange,5);text(d,'swaplabel',690,610,'planner A ↔ planner B',32,P.orange);}
  });
  add(5,10,['Scans from FROM','Left-associated products','The WHERE predicate','The projection','The star shortcut'],(d,s)=>{
    ['t1','t2','t3'].forEach((v,i)=>node(d,'scan'+i,180+i*350,550,v));
    if(s>=1){node(d,'p1',340,420,'Product');node(d,'p2',695,310,'Product');d.arrow('a1',290,540,420,500,P.green,4);d.arrow('a2',640,540,495,500,P.green,4);d.arrow('a3',990,540,815,390,P.green,4);d.arrow('a4',565,455,705,390,P.green,4);}
    if(s>=2){node(d,'select',695,190,'Select');d.arrow('a5',805,300,805,270,P.green,4);}
    if(s>=3){node(d,'project',695,70,'Project');d.arrow('a6',805,180,805,150,P.green,4);}
    if(s>=4){box(d,'star',150,110,370,90,'SELECT * FROM t',P.blueLight,P.blue,31);d.arrow('stararrow',335,220,335,265,P.blue,4);node(d,'bare',225,280,'TableScan');}
  });
  add(5,11,['The same QueryData','A simple plan','A better plan','The same result'],(d,s)=>{
    box(d,'intent',420,115,450,85,'QueryData',P.blueLight,P.blue,42);d.arrow('left',485,220,320,325,P.orange,5);d.arrow('right',800,220,980,325,P.green,5);
    box(d,'a',150,345,360,160,s>=1?'900 pairs':'?',P.orangeLight,P.orange,43);box(d,'b',770,345,360,160,s>=2?'60 pairs':'?',P.greenLight,P.green,43);
    if(s>=3){d.arrow('ao',350,520,590,590,P.orange,4);d.arrow('bo',950,520,715,590,P.green,4);text(d,'out',650,620,'20 rows',44);}
  });
  add(5,12,['A missing FROM','What was expected','What was found','An actionable boundary'],(d,s)=>{
    row(d,'bad',145,155,['SELECT','name','students'],-1,315);
    d.line('gap',795,140,795,245,P.red,5);
    if(s>=1)box(d,'expected',220,345,380,110,'from',P.greenLight,P.green,48);
    if(s>=2)box(d,'found',740,345,380,110,'students',P.redLight,P.red,48);
    if(s>=3){text(d,'a',410,540,'expected',31,P.green);text(d,'b',930,540,'found',31,P.red);d.arrow('boundary',640,605,795,260,P.orange,4);}
  });
  add(5,13,['Query structure','A separate value','Bind the value','Keep the boundary'],(d,s)=>{
    box(d,'sql',145,170,980,105,'SELECT name FROM students WHERE id = ?',P.blueLight,P.blue,31);
    d.line('boundary',130,345,1150,345,P.orange,4,'12 8');box(d,'value',s>=2?920:200,450,160,95,'42',P.orangeLight,P.orange,47);
    if(s>=1)d.arrow('lane',410,495,895,495,P.orange,5);
    if(s>=2)d.line('bind',1000,435,1050,285,P.green,5);
    if(s>=3){d.circle('ring',1050,230,35,'none',P.green,4);text(d,'labels',640,610,'structure · value',36,P.muted);}
  });
  add(5,14,['Parse','Plan','Read storage','Return the answer'],(d,s)=>{
    const names=['Lexer','Parser','Planner','Operators','Records','Buffers','Files'];names.forEach((v,i)=>{box(d,'layer'+i,80+i*170,315,150,115,v,i===s*2?P.greenLight:P.white,P.green,24);if(i<6)d.arrow('a'+i,233+i*170,370,247+i*170,370,P.green,3);});
    const x=[155,495,1175,155][s];dot(d,'packet',x,s===3?520:255,22,s===3?P.orange:P.green);
    if(s>=3){d.arrow('return',1175,520,205,520,P.orange,5);box(d,'answer',95,555,300,70,'ada',P.orangeLight,P.orange,37);}
  });
  add(5,15,['Recognize tokens','Describe intent','Build execution'],(d,s)=>{
    const labs=['tokens','intent','plan'];labs.forEach((v,i)=>box(d,'stage'+i,130+i*380,210,320,105,s>=i?v:'?',i<=s?P.greenLight:P.white,P.green,39));
    if(s>=0)row(d,'tokens',140,425,['SELECT','name'],-1,145);
    if(s>=1){d.rect('obj',540,415,240,135,P.blueLight,P.blue,8,3);['fields','tables'].forEach((v,i)=>text(d,'v'+i,660,465+i*48,v,28));}
    if(s>=2){[[1050,410],[965,550],[1140,550]].forEach(([x,y],i)=>dot(d,'node'+i,x,y,24,P.green));d.line('a',1050,435,965,525,P.green,4);d.line('b',1050,435,1140,525,P.green,4);}
    if(s>=2)text(d,'lab-work',640,655,'Lab 5: trace the supplied code · write SQL · predict · measure · explain',27,P.muted);
  });

  const metadata = [
  {
    "id": 1,
    "title": "Anatomy of a Database",
    "date": "2026-08-25",
    "source": "lectures/lecture-01/anatomy.html",
    "scenes": [
      {
        "title": "Same query, different trip",
        "minutes": 3,
        "kind": "title",
        "notes": "Open by asking what could change when both SQL and answer stay identical. Give thirty seconds for individual predictions, then collect two explanations. Do not reveal the cache immediately. Explain afterward that these figures are a simplified block-access model, not a benchmark of complete Python execution. Transition by opening the engine and following the first run.",
        "id": "lecture-01-scene-01",
        "demo": "viz-query-journey",
        "sources": [
          "lectures/lecture-01/anatomy.html#viz-query-journey"
        ]
      },
      {
        "title": "Open the machine",
        "minutes": 4,
        "kind": "visual",
        "notes": "Follow one statement from characters through token groups to Project above Select above Scan. Ask which box still cares about SQL spelling. The front end does; operators below execute a plan. Describe the lexer/parser distinction accurately even though the original widget compresses the two. Preview that students build the engine from the bottom upward.",
        "id": "lecture-01-scene-02",
        "demo": "viz-query-journey",
        "sources": [
          "lectures/lecture-01/anatomy.html#viz-query-journey"
        ]
      },
      {
        "title": "Cold blocks",
        "minutes": 4,
        "kind": "visual",
        "notes": "Before each block transfer, ask whether a row or a whole block moves. Pause after block 0 to have students identify which rows pass. Finish with six examined, three returned, two disk reads. The toy deliberately spreads six students across two blocks; later fixed slots pack 170 students per 4096-byte block. Distinguish results from the work needed to produce them.",
        "id": "lecture-01-scene-03",
        "demo": "viz-query-journey",
        "sources": [
          "lectures/lecture-01/anatomy.html#viz-query-journey"
        ]
      },
      {
        "title": "Warm replay",
        "minutes": 4,
        "kind": "activity",
        "notes": "Ask pairs to predict three counters before running: disk reads, rows examined, rows returned. Expected 0,6,3. Let a student direct the next steps. Explain that a buffer cache is not a query-result cache: the engine still filters all six rows and parses/plans again. End by returning to the opening timing contrast.",
        "id": "lecture-01-scene-04",
        "demo": "viz-query-journey",
        "sources": [
          "lectures/lecture-01/anatomy.html#viz-query-journey"
        ]
      },
      {
        "title": "A table is a contract",
        "minutes": 4,
        "kind": "definition",
        "notes": "Introduce schema and relation using the familiar student table. Distinguish mathematical relations from SQL duplicate-handling without opening a long aside. Ask whether a column type is a property of just today’s rows or a rule for future writes. Explain gpa 39 means 3.9 in runnable microdb; examples displaying decimals are presentation shorthand.",
        "id": "lecture-01-scene-05",
        "definition": "The named fields and types that define a table’s rows.",
        "term": "Schema",
        "demo": "viz-students",
        "sources": [
          "lectures/lecture-01/anatomy.html#viz-students"
        ]
      },
      {
        "title": "Choosing identity",
        "minutes": 4,
        "kind": "activity",
        "notes": "Ask students to nominate a key, then reveal counterexamples to name and to(name, gpa). A key is a minimal set of fields that uniquely identifies every valid row, including future rows. Mutable values can be unique but create maintenance problems as references change. Do not claim an artificial identifier alone guarantees uniqueness without enforcement.",
        "id": "lecture-01-scene-06",
        "sources": [
          "lectures/lecture-01/anatomy.html"
        ]
      },
      {
        "title": "Four promises",
        "minutes": 4,
        "kind": "visual",
        "notes": "Use one transfer rather than four unrelated examples. Ask what a crash between debit and credit would do to two naive CSV saves. Name atomicity, consistency, isolation and durability orally. Clarify that consistency means preserving declared invariants, isolation depends on the chosen level, and durability assumes the system’s failure model. Explain why plain pandas plus CSV supplies none of this automatically.",
        "id": "lecture-01-scene-07",
        "sources": [
          "lectures/lecture-01/anatomy.html"
        ]
      },
      {
        "title": "One answer, two paths",
        "minutes": 4,
        "kind": "visual",
        "notes": "Ask which path remains affordable as the table grows. Calculate 500/7≈71 times fewer modeled storage trips. Explain declarative SQL: the user describes the wanted result; the planner chooses an executable strategy. These seven reads are a stipulated example, not a universal index cost; many matches can make a scan preferable. Leave detailed index mechanics to Lecture 6.",
        "id": "lecture-01-scene-08",
        "sources": [
          "lectures/lecture-01/anatomy.html"
        ]
      },
      {
        "title": "The stack",
        "minutes": 4,
        "kind": "visual",
        "notes": "Have the class explain each boundary using what crosses it. Front end creates the plan; operators pull rows; records map fields to bytes; buffer pool supplies resident pages; file manager transfers blocks. Ask which layer knows the name ada and which only sees an offset. Treat this as a useful teaching decomposition, not a claim every production engine has identical boundaries.",
        "id": "lecture-01-scene-09",
        "demo": "viz-layer-stack",
        "sources": [
          "lectures/lecture-01/anatomy.html#viz-layer-stack"
        ]
      },
      {
        "title": "The storage trip",
        "minutes": 4,
        "kind": "visual",
        "notes": "Explain that equally spaced positions are factors of ten, not equal nanoseconds. Ask why a bar that is several times longer can represent millions of times more latency. Use representative numbers rather than universal hardware promises. Connect the scale to fetching nearby bytes together: an access has substantial fixed overhead, while large transfers still have bandwidth costs.",
        "id": "lecture-01-scene-10",
        "demo": "viz-latency",
        "sources": [
          "lectures/lecture-01/anatomy.html#viz-latency"
        ]
      },
      {
        "title": "Budget the trips",
        "minutes": 4,
        "kind": "activity",
        "notes": "Give a minute to calculate 12.5 ms and 0.175 ms, then discuss how the ratio changes with scale. Ask whether the engine can always ignore CPU cost. Expected no: cached workloads, expensive expressions and large scans need richer models. Return to the cold/warm example and compute 50µs versus 0.2µs; label the calculation as block access only.",
        "id": "lecture-01-scene-11",
        "sources": [
          "lectures/lecture-01/anatomy.html"
        ]
      },
      {
        "title": "The catalog loop",
        "minutes": 3,
        "kind": "definition",
        "notes": "Ask where the engine remembers a table after restart. Reveal that schema metadata persists as data, then ask how it reads the catalog before knowing any schema. Explain the small bootstrap of catalog layouts; detailed implementation comes in Lecture 3. Avoid mixing Lecture 1’s hand-packed offsets 0,4,11 with later fixed-slot offsets.",
        "id": "lecture-01-scene-12",
        "definition": "Stored metadata describing tables, fields and other database objects.",
        "term": "Catalog",
        "sources": [
          "lectures/lecture-01/anatomy.html"
        ]
      },
      {
        "title": "Build from the floor",
        "minutes": 4,
        "kind": "visual",
        "notes": "Map lecture concepts to the seven cumulative labs: files, buffers, records/catalog, scans, SQL, B+tree, recovery. Explain that supplied reference lower layers prevent an earlier unfinished lab from blocking the next one. Students still learn the frozen interfaces. Ask which layer Thursday requires and which first lets a typed query run; expected file manager andLab 5.",
        "id": "lecture-01-scene-13",
        "demo": "viz-microdb-plan",
        "sources": [
          "lectures/lecture-01/anatomy.html#viz-microdb-plan"
        ]
      },
      {
        "title": "A page is a byte grid",
        "minutes": 4,
        "kind": "visual",
        "notes": "Teach the difference between block number and byte offset. Show that the same four bytes have different integer meanings depending on byte order. Have students locate the least-significant byte before switching endian display. microdb uses signed little-endian 32-bit integers. Strings store encoded byte length plus bytes; do not imply every processor or network protocol has one universal byte order.",
        "id": "lecture-01-scene-14",
        "demo": "viz-endian",
        "sources": [
          "lectures/lecture-01/anatomy.html#viz-endian"
        ]
      },
      {
        "title": "When the write is real",
        "minutes": 3,
        "kind": "visual",
        "notes": "Use this to distinguish a successful buffered write from persistence. Ask what the Lab 1 sync/no-sync throughput comparison measures. Explain fsync requests durable completion and can raise an error; exact guarantees depend on the storage stack. Preview a side rail of log records without teaching recovery yet. A process kill is also different from power loss, which matters later.",
        "id": "lecture-01-scene-15",
        "sources": [
          "lectures/lecture-01/anatomy.html"
        ]
      },
      {
        "title": "Reconstruct the engine",
        "minutes": 3,
        "kind": "recap",
        "notes": "Ask three students to narrate separate boundaries: SQL to plan, row to page, page to disk. Final retrieval question: the second run has no disk reads; what work still happens? Expected parsing/planning, scanning and filtering. Assign reading theLab 1 spec, running the untouched harness and bringing Python plus starter files; place all logistics in notes rather than projected bullet points.",
        "id": "lecture-01-scene-16",
        "sources": [
          "lectures/lecture-01/anatomy.html"
        ]
      }
    ]
  },
  {
    "id": 2,
    "title": "Memory & the Buffer Pool",
    "date": "2026-09-01",
    "source": "lectures/lecture-02/bufferpool.html",
    "scenes": [
      {
        "title": "Repeated reads",
        "minutes": 3,
        "kind": "title",
        "notes": "A block requested three times is the same physical data, but a file-only engine may issue three reads. Ask the class to sketch where a useful copy could stay. Build 1 sends each request to storage; build 2 routes later requests to a resident memory frame. Explain that the query still executes: caching a page is different from caching a query result. This three-minute opening is teaching time. The scheduled ten-minute quiz takes place separately.",
        "id": "lecture-02-scene-01",
        "sources": [
          "lectures/lecture-02/bufferpool.html"
        ]
      },
      {
        "title": "Bring the measured gap",
        "minutes": 4,
        "kind": "visual",
        "notes": "Ask two students to report the sync/no-sync ratio measured in Lab1 and state their method. The two paths show different completion boundaries without inventing a class measurement: buffered acceptance on the left and requested durable completion on the right. Record the reported ratio orally or with the annotation tool. Distinguish Python buffering, OS caching and durable completion. A fast buffered result is not necessarily SSD throughput. Ask how a cached page can avoid another storage request entirely, then move to the fixed frames.",
        "id": "lecture-02-scene-02",
        "sources": [
          "lectures/lecture-02/bufferpool.html"
        ]
      },
      {
        "title": "Frames and pages",
        "minutes": 4,
        "kind": "definition",
        "notes": "Name the distinction clearly: a block is an addressable storage unit; a page is its in-memory contents; a frame is a slot that holds a page. Ask whether replacing a page creates more memory. No, the frame count stays fixed. Explain that microdb searches a small frame list, whereas production lookup typically uses a mapping structure.",
        "id": "lecture-02-scene-03",
        "definition": "A fixed collection of memory frames that cache database pages.",
        "term": "Buffer pool",
        "sources": [
          "lectures/lecture-02/bufferpool.html"
        ]
      },
      {
        "title": "A scan breaks reuse",
        "minutes": 4,
        "kind": "visual",
        "notes": "Pause before the second 0 and ask whether it is still resident. Continue until the class sees that every request misses. Have a student explain why a second pass does not imply a warm-cache hit: the working set exceeds capacity and reuse distance is too large. The preset has 16 accesses and 0 hits. Do not rely on #bs-step, which currently has no listener.",
        "id": "lecture-02-scene-04",
        "demo": "viz-bufsim",
        "sources": [
          "lectures/lecture-02/bufferpool.html#viz-bufsim"
        ]
      },
      {
        "title": "The hot set fits",
        "minutes": 4,
        "kind": "activity",
        "notes": "Ask for a predicted hit rate before running and count the compulsory first misses. The exact preset has 11 hits and 5 misses; the rounded page prose says about 70%. Explain that hot blocks 0 and 1 keep returning soon enough to remain in memory. Have pairs state the workload difference from the previous scene without using the vague phrase bigger cache.",
        "id": "lecture-02-scene-05",
        "demo": "viz-bufsim",
        "sources": [
          "lectures/lecture-02/bufferpool.html#viz-bufsim"
        ]
      },
      {
        "title": "Hold the page",
        "minutes": 4,
        "kind": "definition",
        "notes": "Ask what goes wrong if a scan retains a reference to a frame while the pool replaces its contents. Pinning prevents that eviction. Nested users need a count rather than a boolean. The original buffer simulator automatically pins/unpins each access and cannot demonstrate persistent holds; use this separate stateful visual. A pin does not itself provide transactional isolation.",
        "id": "lecture-02-scene-06",
        "definition": "Hold a buffer frame ineligible for eviction until its users release it.",
        "term": "Pin",
        "sources": [
          "lectures/lecture-02/bufferpool.html"
        ]
      },
      {
        "title": "Recency is updated on hits",
        "minutes": 4,
        "kind": "activity",
        "notes": "Have students predict the victim individually, then vote before revealing. B is evicted because A’s hit updates its last-used tick. Ask what bug would evict A; expected stamping only on misses. Explain the actual lab rule: every successful pin increments the global tick, and the least recently pinned eligible frame is selected. Recency metadata is updated on both hit and miss.",
        "id": "lecture-02-scene-07",
        "demo": "viz-bufsim",
        "sources": [
          "lectures/lecture-02/bufferpool.html#viz-bufsim"
        ]
      },
      {
        "title": "Pins outrank age",
        "minutes": 4,
        "kind": "activity",
        "notes": "Work through two cases aloud. With no pins, E evictsC andB evictsA; withA pinned, the second victim isD. Then ask what an all-pinned pool should do rather than corrupting an active page. microdb raises BufferAbortError. Invite a student to identify the missing-unpin failure pattern: enough leaked holds eventually make every frame ineligible.",
        "id": "lecture-02-scene-08",
        "sources": [
          "lectures/lecture-02/bufferpool.html"
        ]
      },
      {
        "title": "Tracking residents",
        "minutes": 4,
        "kind": "visual",
        "notes": "Connect back to immutable, hashable BlockId fromLab 1. Ask why a linear scan is acceptable for 3 or 50 frames but expensive at hundreds of thousands. Explain expected constant-time hashing without promising worst-case O(1). Both approaches still implement the same pin interface, so higher layers are unaffected by the implementation choice.",
        "id": "lecture-02-scene-09",
        "sources": [
          "lectures/lecture-02/bufferpool.html"
        ]
      },
      {
        "title": "Dirty before reuse",
        "minutes": 4,
        "kind": "visual",
        "notes": "Ask whether unpin means save. Expected no; it releases a hold. A dirty page must be written before its frame is overwritten, and explicit flush can write it earlier. Demonstrate the bug by replacing a dirty frame without writing and ask where the changed value exists afterward. Clarify that persistence at commit is policy-dependent and will be covered with WAL.",
        "id": "lecture-02-scene-10",
        "sources": [
          "lectures/lecture-02/bufferpool.html"
        ]
      },
      {
        "title": "One cache above another",
        "minutes": 4,
        "kind": "visual",
        "notes": "Explain why an OS cache is helpful but does not implement the database’s entire protocol. Avoid claiming that operating systems cannot lock memory at all: database pinning, eviction and recovery ordering are a stronger combined requirement. Ask what happens if both tiers retain the same bytes and the application claims nearly all RAM. Introduce double caching and swapping as resource-budget issues.",
        "id": "lecture-02-scene-11",
        "sources": [
          "lectures/lecture-02/bufferpool.html"
        ]
      },
      {
        "title": "Protect the useful pages",
        "minutes": 3,
        "kind": "visual",
        "notes": "Compare exact LRU to a clock approximation and scan-resistance. The ring is a conceptual depiction of PostgreSQL’s bulk-scan strategy, not a private full copy of the shared pool. Ask whether a one-pass scan should receive the same cache protection as frequently reused pages. Connect OLTP reuse to OLAP streaming; neither workload is inherently bad.",
        "id": "lecture-02-scene-12",
        "sources": [
          "lectures/lecture-02/bufferpool.html"
        ]
      },
      {
        "title": "Misses dominate time",
        "minutes": 4,
        "kind": "visual",
        "notes": "Compute at 90%:0.9×100 ns+0.1×25000 ns=2590 ns. Ask what share comes from misses; about 96.5%. Then compare 99% yielding 349 ns and 99.6% yielding 199.6 ns. Each extra percentage point saves the same absolute 249 ns in this model; the percentage reduction grows near 100%. These are representative access costs, not end-to-end query latency.",
        "id": "lecture-02-scene-13",
        "demo": "viz-eat",
        "sources": [
          "lectures/lecture-02/bufferpool.html#viz-eat"
        ]
      },
      {
        "title": "One frame short",
        "minutes": 4,
        "kind": "activity",
        "notes": "Give pairs a minute to predict the repeated scan with 49 frames. Exact LRU yields 0% for this cyclic workload. At 50 frames, the first pass still misses and later passes hit. Ask why sizing as a fixed percentage of installed RAM can miss the real requirement. The working set and other memory consumers determine a useful capacity. The asterisk on 100% means later passes after the first pass has populated all 50 frames; a two-pass total would be 50%.",
        "id": "lecture-02-scene-14",
        "sources": [
          "lectures/lecture-02/bufferpool.html"
        ]
      },
      {
        "title": "The four responsibilities",
        "minutes": 3,
        "kind": "visual",
        "notes": "Translate diagrams into the four Lab 2 methods without showing a code listing. Have students narrate the three invariants: pin counts reflect current users, every successful pin updates recency, and dirty contents are saved before frame reuse. Supplied Buffer plumbing performs flushes. Ask where an implementation should invoke that plumbing rather than overwrite raw fields.",
        "id": "lecture-02-scene-15",
        "sources": [
          "lectures/lecture-02/bufferpool.html"
        ]
      },
      {
        "title": "Predict, then measure",
        "minutes": 3,
        "kind": "recap",
        "notes": "Final oral retrieval: why can the same pool give 0% and about 69%? Why can the oldest frame be protected? Why is 90% hits still costly? Expected reuse, pins and expensive misses. Thursday students implement the buffer manager and measure hit rates as pool size changes. Put starter-file instructions in notes only; next lecture turns cached bytes into records.",
        "id": "lecture-02-scene-16",
        "sources": [
          "lectures/lecture-02/bufferpool.html"
        ]
      }
    ]
  },
  {
    "id": 3,
    "title": "Record Layout & the Catalog",
    "date": "2026-09-08",
    "source": "lectures/lecture-03/records.html",
    "scenes": [
      {
        "title": "Give bytes a shape",
        "minutes": 3,
        "kind": "title",
        "notes": "Begin with an anonymous byte grid. Ask how the engine could find one student without reading from the beginning of the file. Reveal a highlighted row, then its physical address. Connect the existing Page and Buffer classes to the missing abstraction: neither knows a schema or record boundary. This lecture establishes a repeatable layout and then makes it persistent through the catalog. Scheduled quizzes are separate from these sixty teaching minutes.",
        "id": "lecture-03-scene-01",
        "sources": [
          "lectures/lecture-03/records.html"
        ]
      },
      {
        "title": "A saved address breaks",
        "minutes": 4,
        "kind": "visual",
        "notes": "Ask what the saved pointer identifies before the edit: cyd’s row at byte 30. Add five bytes to ben’s name and ask students to follow where the pointer lands. The name length also changes, so later fields shift. Distinguish this packed teaching example from a production slotted-page directory. We need a stable way to locate live rows.",
        "id": "lecture-03-scene-02",
        "demo": "viz-packed",
        "sources": [
          "lectures/lecture-03/records.html#viz-packed"
        ]
      },
      {
        "title": "Reserve the shape",
        "minutes": 4,
        "kind": "definition",
        "notes": "Describe the chosen microdb tradeoff: reserve a fixed maximum footprint per row so an address can be computed without parsing earlier records. Compare moving bytes in the previous scene to overwriting within capacity here. The word slot is overloaded in real systems; PostgreSQL uses variable-sized tuples behind a slot directory, unlike these fixed-width microdb records.",
        "id": "lecture-03-scene-03",
        "definition": "Reserved page space with the same byte layout for every record.",
        "term": "Fixed-size slot",
        "demo": "viz-recpage",
        "sources": [
          "lectures/lecture-03/records.html#viz-recpage"
        ]
      },
      {
        "title": "Build the layout",
        "minutes": 4,
        "kind": "activity",
        "notes": "Have the class calculate before each reveal. The name field starts at 8 and consumes 12 bytes, so gpa starts at 20 and the slot totals 24. Compute floor 4096/24=170, with 16 left. Stress that the string prefix records encoded byte count and the reservation is 8 bytes. The 4-byte flag must be included; omitting it causes every later address to be wrong.",
        "id": "lecture-03-scene-04",
        "sources": [
          "lectures/lecture-03/records.html"
        ]
      },
      {
        "title": "One multiply, one add",
        "minutes": 4,
        "kind": "activity",
        "notes": "First ask the address of gpa in slot 3; expected 92. Then give partners one minute for the new schema: cid 4, title 8, credits 24, slot 28,146 rows per 4096-byte block and 8 spare bytes. Have a student explain why Schema declares types while Layout computes offsets. One centralized computation keeps storage readers and writers consistent.",
        "id": "lecture-03-scene-05",
        "sources": [
          "lectures/lecture-03/records.html"
        ]
      },
      {
        "title": "Capacity means bytes",
        "minutes": 4,
        "kind": "visual",
        "notes": "Ask whether 8 visible characters always fit in 8 bytes. Expected no. The existing rename widget only uses ASCII examples; this extra visual establishes the actual starter contract. Oversized writes must be rejected before mutation so neither the prior value nor the adjacent field is corrupted. Contrast the lab’s storage-byte reservation with SQL VARCHAR length semantics in production engines.",
        "id": "lecture-03-scene-06",
        "sources": [
          "lectures/lecture-03/records.html"
        ]
      },
      {
        "title": "Delete without shifting",
        "minutes": 4,
        "kind": "visual",
        "notes": "Ask which bytes deletion must change in microdb. Only the 4-byte in-use flag is set to 0; this is not literally a one-bit storage write. Existing data remains until overwritten. On insertion the caller must populate every field because a reused slot contains old bytes. Make clear that PostgreSQL MVCC deletion and vacuum have more responsibilities than this teaching flag.",
        "id": "lecture-03-scene-07",
        "demo": "viz-recpage",
        "sources": [
          "lectures/lecture-03/records.html#viz-recpage"
        ]
      },
      {
        "title": "The cost of empty air",
        "minutes": 4,
        "kind": "activity",
        "notes": "Ask students to compare reserved capacity with actual bytes used. This diagram is the schema (id, name, gpa), with a 4-byte flag, two 4-byte integers and a 4-byte string length prefix. At capacity 8, each slot is 24 bytes and 170 fit in 4096 bytes. At capacity 200, each slot is 216 bytes and only 18 fit; 10,000 rows require 556 blocks. The green region includes fixed metadata plus a three-byte actual name; the orange region is reserved but unused. The source prose’s 19/527 example uses a different schema and must not be attached to this diagram.",
        "id": "lecture-03-scene-08",
        "demo": "viz-slotcalc",
        "sources": [
          "lectures/lecture-03/records.html#viz-slotcalc"
        ]
      },
      {
        "title": "Missing is not zero",
        "minutes": 4,
        "kind": "definition",
        "notes": "Explain that microdb currently has noNULL. Real engines can represent absence through null metadata rather than choosing a special ordinary value. Ask why treating missing GPA as 0 biases an average. Do not say every null costs exactly one extra physical bit independently: actual headers, bitmap allocation and alignment are format-dependent. The conceptual distinction is the lesson.",
        "id": "lecture-03-scene-09",
        "definition": "A marker for a missing or unknown value, distinct from zero and empty text.",
        "term": "NULL",
        "sources": [
          "lectures/lecture-03/records.html"
        ]
      },
      {
        "title": "When a value outgrows a page",
        "minutes": 4,
        "kind": "visual",
        "notes": "Walk through inline, compressed-inline and out-of-line cases. Ask why reserving 2 MBfor every student would be wasteful. PostgreSQL TOAST can compress and/or move large values, depending on storage settings and compressibility; the widget’s 3×compression is illustrative. Production tuples remain variable-sized, so do not claim TOAST gives every row an immutable fixed shape.",
        "id": "lecture-03-scene-10",
        "demo": "viz-toast",
        "sources": [
          "lectures/lecture-03/records.html#viz-toast"
        ]
      },
      {
        "title": "Only fetch what is needed",
        "minutes": 4,
        "kind": "activity",
        "notes": "Before each query, ask which pages must be read. Selecting name can avoid fetching the out-of-line essay; selecting essay follows the pointer and gathers its chunks. Explain that actual execution can depend on expression evaluation and storage choices, while this case illustrates deferred access. Connect pointer indirection to preserving locality for commonly used small fields.",
        "id": "lecture-03-scene-11",
        "demo": "viz-toast",
        "sources": [
          "lectures/lecture-03/records.html#viz-toast"
        ]
      },
      {
        "title": "One pinned record page",
        "minutes": 3,
        "kind": "visual",
        "notes": "Make the abstraction concrete: RecordPage combines a layout with one pinned block. It finds used/free slots, reads/writes fields, and flips flags. Every modifying operation must call set_modified so eviction knows the page changed. Ask what happens if the byte edit succeeds but the dirty flag is omitted; the change can disappear when the frame is reused.",
        "id": "lecture-03-scene-12",
        "sources": [
          "lectures/lecture-03/records.html"
        ]
      },
      {
        "title": "Across block boundaries",
        "minutes": 4,
        "kind": "visual",
        "notes": "Ask students to narrate TableScan.next: search current block, move if exhausted, stop only at end of file. It holds one record page at a time for this scan. Show empty blocks and the finalFalse explicitly. For insertion, the provided algorithm searches for reusable slots before growing the file; appending supplies zero flags and therefore valid empty space.",
        "id": "lecture-03-scene-13",
        "sources": [
          "lectures/lecture-03/records.html"
        ]
      },
      {
        "title": "An address is not forever",
        "minutes": 4,
        "kind": "definition",
        "notes": "DefineRIDas a physical location for this heap file, not a permanent business identifier. Live in-place microdb updates preserve it; after deletion another row may use the same slot. PostgreSQL MVCC updates can create a new physical tuple location. Ask why an index cannot retain an old entry after deletion merely because the address still exists.",
        "id": "lecture-03-scene-14",
        "definition": "A record’s physical address, represented here by its block number and slot number.",
        "term": "RID",
        "sources": [
          "lectures/lecture-03/records.html"
        ]
      },
      {
        "title": "Store the rules as rows",
        "minutes": 3,
        "kind": "visual",
        "notes": "Use a restart scenario: how does the engine recover the layout once Python objects vanish? Persisted catalog rows reconstruct it. Then expose the circular dependency and explain the small hardcoded catalog layouts. The supplied catalog is a real first customer of the students’ record layer, so passing catalog tests is evidence that lower abstractions compose.",
        "id": "lecture-03-scene-15",
        "sources": [
          "lectures/lecture-03/records.html"
        ]
      },
      {
        "title": "Rebuild the row",
        "minutes": 3,
        "kind": "recap",
        "notes": "Ask for four statements: what fixes offsets; what owns a pin; what skipsEMPTYslots; what remembers the schema after restart. ExpectedLayout, RecordPage, TableScan, catalog. End with a fresh schema to compute beforeThursday and theLab 3 harness expectation 0/12 on unedited starters. Next Tuesday the same scan interface begins answering queries.",
        "id": "lecture-03-scene-16",
        "sources": [
          "lectures/lecture-03/records.html"
        ]
      }
    ]
  },
  {
    "id": 4,
    "title": "The Iterator Model",
    "date": "2026-09-15",
    "source": "lectures/lecture-04/iterators.html",
    "scenes": [
      {
        "title": "One row at a time",
        "minutes": 3,
        "kind": "title",
        "notes": "Place the operator tower on screen without moving anything. Ask what makes it start working. Reveal a caller request down to Scan and one answer moving upward. Students already built the bottom scan, so today’s new idea is a shared interface that composes it with filters, projections and products. Explain that the animation is a row-at-a-time teaching engine; batch and blocking operators will later qualify the model. The scheduled quiz is outside this sixty-minute lesson.",
        "id": "lecture-04-scene-01",
        "sources": [
          "lectures/lecture-04/iterators.html"
        ]
      },
      {
        "title": "An intermediate mountain",
        "minutes": 4,
        "kind": "visual",
        "notes": "Build0 shows a full intermediate in memory. Ask where the next stage can put its result. Build1 introduces a Cartesian product; build2 scales the example to one million times one million rows. The arithmetic is a trillion candidate pairs, not a measured runtime. Do not claim that pandas equality merge always constructs this product. Build3 replaces the intermediate bins with one flowing row. Explain that streaming reduces intermediate storage, while better join algorithms must also reduce work. Transition to demand.",
        "id": "lecture-04-scene-02",
        "sources": [
          "lectures/lecture-04/iterators.html"
        ]
      },
      {
        "title": "Demand moves first",
        "minutes": 4,
        "kind": "definition",
        "notes": "Leave all operators still and ask why no row appears. Advance through Project asking Select, Select asking Scan, and the matching row returning upward. Explain that one caller request can trigger several child requests. An iterator is an object that produces its next row on demand; the database’s boolean next method also positions an internal cursor. Contrast this protocol with materializing a list, then move to counting the hidden work below a single request.",
        "id": "lecture-04-scene-03",
        "definition": "An object that produces its next row when its caller requests one.",
        "term": "Iterator operator",
        "demo": "viz-pull",
        "sources": [
          "lectures/lecture-04/iterators.html#viz-pull"
        ]
      },
      {
        "title": "Count the pulls",
        "minutes": 4,
        "kind": "activity",
        "notes": "Predict each pull before revealing it. The first answer, ada, examines one row. The next answer, cyd, examines ben and cyd. The third, eli, examines dee and eli. Asking again examines fay and returns False. Total work is six rows examined and three rows delivered. A common error is assuming each top-level next call means exactly one disk read or one underlying row. The buffer and scan layers determine physical I/O separately.",
        "id": "lecture-04-scene-04",
        "demo": "viz-pull",
        "sources": [
          "lectures/lecture-04/iterators.html#viz-pull"
        ]
      },
      {
        "title": "The five moves",
        "minutes": 4,
        "kind": "visual",
        "notes": "Introduce the five methods by following their icons: before_first rewinds, next advances, get_val reads the current field, has_field reports the output schema, and close releases resources. Ask whether Select needs a TableScan specifically. No: a ListScan test double with the same interface also works. The diagram’s connecting lines mean calls into the shared contract, not ownership of copied rows. Ask what happens if a wrapper forgets close, then return to that question after the join.",
        "id": "lecture-04-scene-05",
        "sources": [
          "lectures/lecture-04/iterators.html"
        ]
      },
      {
        "title": "Select is a gate",
        "minutes": 4,
        "kind": "visual",
        "notes": "Follow a value through the gate. Thirty-nine passes gpa > 35, thirty-one fails, and thirty-seven passes. Select.next repeatedly advances its child until the predicate holds or the child ends. Ask whether it copies accepted rows into a result table. It does not; field reads delegate to the child’s current row. The common mistake is returning False after the first rejected row rather than continuing. Next contrast filtering rows with hiding fields.",
        "id": "lecture-04-scene-06",
        "sources": [
          "lectures/lecture-04/iterators.html"
        ]
      },
      {
        "title": "Project is a window",
        "minutes": 4,
        "kind": "activity",
        "notes": "Begin with the complete underlying row. Reveal the mask around name while the id and gpa fields stay stored below it. Ask what get_val(name) should return and what has_field(gpa) should report. Expected ada and False. Then attempt get_val(gpa) through the projected object; it must raise ValueError. Projection in this lab checks allowed access rather than copying a fresh row. This also explains why moving a projection below a predicate can hide a field the predicate needs.",
        "id": "lecture-04-scene-07",
        "sources": [
          "lectures/lecture-04/iterators.html"
        ]
      },
      {
        "title": "A predicate is a decision chain",
        "minutes": 4,
        "kind": "visual",
        "notes": "This toy product row combines student ben (gpa 31, mid 2) with the ds major (mid2 1). Define the names before checking a term: mid is the major ID stored in a student row, while mid2 is the ID of the major row. Both are major IDs; neither is the student ID. The actual field names are mid and mid2, not mid1. The suffix 2 distinguishes the two fields in ProductScan; it does not require a value of 2. First check gpa > 35: 31 fails, so skip the second AND term. In the last build, switch to the join predicate. F(\"mid2\") requests the majors field from this same combined row; it reads 1. Comparing the student’s 2 with the major’s 1 rejects this pair and skips the GPA term. Ask which major would match ben: stat, whose mid2 is 2. A plain literal 35 needs no lookup. Predicate ordering can save work, subject to evaluation cost and permitted semantics.",
        "id": "lecture-04-scene-08",
        "demo": "viz-pred",
        "sources": [
          "lectures/lecture-04/iterators.html#viz-pred"
        ]
      },
      {
        "title": "The odometer",
        "minutes": 4,
        "kind": "visual",
        "notes": "Point to the initial cursors: left is already on ada and right is before ds. Build the first three pairs, then pause before the rollover and ask which cursor moves. Right rewinds, left advances to ben, and right advances to ds. The left input must actually have a current row. The short lecture code is only the nonempty rollover sketch; a complete ProductScan must handle empty input and remember exhaustion. Next count every visit, not only matching results.",
        "id": "lecture-04-scene-09",
        "demo": "viz-odo",
        "sources": [
          "lectures/lecture-04/iterators.html#viz-odo"
        ]
      },
      {
        "title": "How much does the join touch",
        "minutes": 4,
        "kind": "activity",
        "notes": "Ask students to predict four counts before revealing the grid: left deliveries, total right deliveries, candidate pairs, surviving pairs. With six students, three majors and one matching major per student, the counts are 6, 18, 18 and 6. Now make the predicate always false. Only the last count changes to zero. The product enumerates every pair before a filter rejects it. This separates candidate work from result size and motivates pushing local filters toward their inputs.",
        "id": "lecture-04-scene-10",
        "demo": "viz-odo",
        "sources": [
          "lectures/lecture-04/iterators.html#viz-odo"
        ]
      },
      {
        "title": "Empty means empty",
        "minutes": 4,
        "kind": "activity",
        "notes": "Hide all rows from the left input and ask for the number of pairs: zero. Repeat with an empty right input: also zero. Restore both two-row inputs and enumerate four pairs. At exhaustion, press next repeatedly and insist on False each time until a rewind. A common bug restarts the right scan and emits pairs after exhaustion, or emits a right row without a valid left row. These are state invariants, not special cases to ignore.",
        "id": "lecture-04-scene-11",
        "sources": [
          "lectures/lecture-04/iterators.html"
        ]
      },
      {
        "title": "Release both branches",
        "minutes": 3,
        "kind": "visual",
        "notes": "Two TableScans hold two active page pins. Send close to the product root and follow its two outgoing cleanup calls. Each wrapper must forward close to its child, and Product must close both children. Ask how many pins remain if only the left branch closes. Expected one. The animation ends with zero pinned frames. Operator state is small in this pipeline, but total memory also includes the buffers held by active scans; it is not literally one copied row per operator.",
        "id": "lecture-04-scene-12",
        "sources": [
          "lectures/lecture-04/iterators.html"
        ]
      },
      {
        "title": "Move the gate downward",
        "minutes": 4,
        "kind": "visual",
        "notes": "Use the exact measurement workload: 300 students, three majors, 60 students passing gpa, and one major passing dept. The late-filter plan forms 900 pairs; the early local filters leave a 60-by-1 product. Both plans return the same 20 joined rows. Ask which condition cannot be pushed to one table: mid = mid2 needs both. The small grids are scaled illustrations; the counts are the workload’s exact logical pair counts. This rewrite reduces pair work fifteenfold.",
        "id": "lecture-04-scene-13",
        "sources": [
          "lectures/lecture-04/iterators.html"
        ]
      },
      {
        "title": "Some operators must wait",
        "minutes": 4,
        "kind": "visual",
        "notes": "Ask whether an arbitrary unsorted stream can emit its smallest item before seeing its final row. Generally no: a sort must inspect input and may spill to temporary storage. Hash aggregation also maintains group state, usually finishing after the input ends. Then show input already grouped by key: once group A ends, its total can be emitted. Streaming interfaces do not promise constant state for every operator. The distinction prepares the optimizer and columnar execution lectures.",
        "id": "lecture-04-scene-14",
        "sources": [
          "lectures/lecture-04/iterators.html"
        ]
      },
      {
        "title": "Build one tower",
        "minutes": 3,
        "kind": "activity",
        "notes": "Start with the two toy input rows. mid means major ID: students.mid stores the ID of the student’s chosen major, a reference to a row in majors. majors.mid2 identifies that major row. They are both major IDs, not student IDs. The code calls the fields mid and mid2; there is no mid1 field. The suffix 2 gives the major-table field a distinct name, so ProductScan.get_val can choose the correct input; it does not mean the second major or the number 2. Here ada has mid 1 and ds has mid2 1. Product puts those two fields in one combined row; Select checks 1 = 1 and keeps the pair; Project returns (ada, ds). Ask what happens if the right row is stat with mid2 2: 1 differs from 2, so reject that pair. Build the plan from the bottom, then ask where a GPA filter could move. It refers only to students; the ID comparison requires both inputs. Projection must preserve fields needed above it. Keep the runnable implementation in the source reading.",
        "id": "lecture-04-scene-15",
        "sources": [
          "lectures/lecture-04/iterators.html"
        ]
      },
      {
        "title": "Explain the work",
        "minutes": 3,
        "kind": "recap",
        "notes": "Ask three students to explain the arrows and counts without introducing new material. What begins work? Caller demand. Why is the product costly? It enumerates pairs. What can pushdown change? Input sizes and candidate work, while preserving the supported query’s answer. What does close release? The descendants’ resources and pins. Thursday’s measurement compares the two plan shapes. The next lecture will turn SQL text into a correct tree automatically; the required planner is deliberately simple.",
        "id": "lecture-04-scene-16",
        "sources": [
          "lectures/lecture-04/iterators.html"
        ]
      }
    ]
  },
  {
    "id": 5,
    "title": "From SQL Text to Plan",
    "date": "2026-09-22",
    "source": "lectures/lecture-05/parsing.html",
    "scenes": [
      {
        "title": "From text to execution",
        "minutes": 3,
        "kind": "title",
        "notes": "Type a short SELECT into the visual gap between the user and the engine. Ask which existing layer can interpret its characters. None can yet. Reveal an intent object and then the executable tree, establishing the lecture’s three transformations: lex, parse, plan. Ask which transformation actually runs the query; constructing the plan is still separate from pulling its rows. The scheduled quiz is additional to this sixty-minute teaching deck.",
        "id": "lecture-05-scene-01",
        "sources": [
          "lectures/lecture-05/parsing.html"
        ]
      },
      {
        "title": "The unopened envelope",
        "minutes": 4,
        "kind": "visual",
        "notes": "Ask which existing engine layer could interpret SELECT as characters. None can: operators need structured requests. Reveal an intent object with fields, tables and predicate, followed by an executable TableScan. Keep parsing separate from execution. Syntax errors concern legal token order; unknown tables and fields concern semantic validation. A parser may recognize a grammatical statement before the engine knows whether its referenced objects exist. This boundary makes the frontend manageable.",
        "id": "lecture-05-scene-02",
        "sources": [
          "lectures/lecture-05/parsing.html"
        ]
      },
      {
        "title": "One word, two meanings",
        "minutes": 4,
        "kind": "activity",
        "notes": "Read the example aloud and ask students to point to the keyword FROM. The second from is inside quotes and is a value, so the lexer makes it one STR token. A raw substring search loses that distinction. Regular expressions can be useful for token recognition; this is not a claim that every regex is slow or unsuitable. The important design choice is to separate lexical units from grammar. Mention that the teaching lexer has narrow escaping rules.",
        "id": "lecture-05-scene-03",
        "sources": [
          "lectures/lecture-05/parsing.html"
        ]
      },
      {
        "title": "Five token families",
        "minutes": 4,
        "kind": "definition",
        "notes": "Classify SELECT, name, 35, a quoted string and the greater-than symbol before revealing their five families. The lexer handles spelling, quoting and normalization of unquoted words. It does not decide whether FROM appears in the right place. Ask why a field called select is rejected in the teaching language: the fixed keyword set classifies it as a keyword. Production SQL supports richer identifier and keyword rules. This definition gives the parser a cleaner input stream. Explain that ANTLR can generate lexer and parser code from a grammar. The grammar and code that interprets parsed input are still application responsibilities. ANTLR can produce a parse tree; building an AST or QueryData is a separate application step. Lexer internals and ANTLR are optional reading: students need the token contract, then trace the supplied parser and planner before writing and measuring queries.",
        "id": "lecture-05-scene-04",
        "definition": "A classified unit of input, such as a keyword, identifier, number or string.",
        "term": "Token",
        "demo": "viz-sql",
        "sources": [
          "lectures/lecture-05/parsing.html#viz-sql"
        ]
      },
      {
        "title": "The full pipeline",
        "minutes": 4,
        "kind": "visual",
        "notes": "Trace SELECT name FROM students WHERE gpa > 35 through five views. The AST and QueryData views show two representations of the same parsed request, not an extra required transformation in the lab. First show the SQL text, then all eight tokens. In the conceptual AST, name is the requested field, students is the source table, and GreaterThan has Field(gpa) and Number(35) children. Ask whether 35 is a column name or a literal; it is the integer literal. These node classes are illustrative, not required student code. Next show the actual QueryData constructor with field and table lists and Predicate((gpa, >, 35)). Finally show ProjectScan above SelectScan above TableScan. The AST records what was requested; the planner chooses operators for producing it. Constructing either description does not run the query. Calling next() on the scan root starts execution.",
        "id": "lecture-05-scene-05",
        "demo": "viz-sql",
        "sources": [
          "lectures/lecture-05/parsing.html#ast-example"
        ]
      },
      {
        "title": "Grammar as a railway",
        "minutes": 4,
        "kind": "definition",
        "notes": "Follow the required SELECT–fields–FROM–tables track. Add the optional WHERE branch, then show a list repeating through a comma. Ask for two legal paths: SELECT name FROM students and the same statement with a predicate. BNF stands for Backus–Naur form; EBNF stands for Extended Backus–Naur form. In EBNF, brackets mean optional and braces mean zero or more repetitions. Read fieldlist := * | field { , field } aloud: choose either a literal star, or one field followed by zero or more comma-and-field pairs. The star is typed in SQL and requests all columns. The vertical bar separates grammar alternatives and is not typed in the query. Compare SELECT * FROM students, SELECT name FROM students and SELECT name, gpa FROM students. Likewise, (= | < | >) chooses one comparison operator. The supported microSQL subset omits many SQL constructs. A small grammar is a deliberate teaching constraint, not a limitation of the iterator interface.",
        "id": "lecture-05-scene-06",
        "definition": "Rules describing which sequences of tokens form valid statements.",
        "term": "Grammar",
        "sources": [
          "lectures/lecture-05/parsing.html"
        ]
      },
      {
        "title": "The four token moves",
        "minutes": 4,
        "kind": "activity",
        "notes": "For each token helper, ask whether the cursor moves. peek and match inspect without advancing. next consumes one token. expect first validates, then consumes or raises ParseError. The individual examples in this visual are separate operations, not one running parse. Open the linked INSERT walkthrough to connect the insert grammar rule to parse_insert and the literal rule to _parse_literal. Step through the first value, then the comma loop. Ask why match leaves the comma unread and next must consume it before the next literal call. Switch to Missing comma to see expect fail without moving the cursor, and Missing value to see peek prepare an error message. The returned InsertData describes the insert; parsing writes no rows. Use the same patterns to understand the supplied SELECT implementation in Lab 5.",
        "id": "lecture-05-scene-07",
        "demo": "viz-insert",
        "sources": [
          "lectures/lecture-05/parsing.html#viz-insert"
        ]
      },
      {
        "title": "Watch the call stack",
        "minutes": 4,
        "kind": "visual",
        "notes": "Trace a WHERE clause. parse_query calls the predicate rule; the predicate calls the term rule; the term consumes a field, comparison and value. Show the result returning as plain data into QueryData. Ask when the call stack grows: grammar nesting, not every token. Repeated lists commonly use loops. The stack visual is an illustrative execution of this fixed query, not a universal parser trace. Students should follow the Python implementation’s actual token calls while debugging.",
        "id": "lecture-05-scene-08",
        "demo": "viz-trace",
        "sources": [
          "lectures/lecture-05/parsing.html#viz-trace"
        ]
      },
      {
        "title": "A literal or a field",
        "minutes": 4,
        "kind": "activity",
        "notes": "Compare gpa > 35 with mid = mid2. Ask what lets the parser tell that 35 is a constant while mid2 names another field. NUM versus ID token kinds choose the branch. The field reference is wrapped as F(mid2), and the predicate later reads that field from a combined row. It is not compared during parsing. The shared product row supplies both values. An unwrapped identifier would accidentally behave like a literal string, producing incorrect join results.",
        "id": "lecture-05-scene-09",
        "demo": "viz-sql",
        "sources": [
          "lectures/lecture-05/parsing.html#viz-sql"
        ]
      },
      {
        "title": "Data between stages",
        "minutes": 4,
        "kind": "visual",
        "notes": "Introduce three plain descriptions of intent: QueryData for a read, InsertData for rows to store, and CreateData for a new schema. Ask which description records a schema and which carries only a list of values. Syntax recognition can succeed while later type, value-count or catalog validation fails. The data object is the seam between stages. Reveal the planner-swap arrow: a different planner can use the same parsed request without rewriting the lexer or grammar.",
        "id": "lecture-05-scene-10",
        "sources": [
          "lectures/lecture-05/parsing.html"
        ]
      },
      {
        "title": "Plan from the leaves",
        "minutes": 4,
        "kind": "activity",
        "notes": "Have the class direct the naive planner from the leaves upward. Open one TableScan per FROM table using catalog layouts; combine products left to right; wrap the result in Select for a predicate; project the named fields unless the query uses star. The three-table picture demonstrates left association. The separate SELECT * FROM t example needs no useless Product, Select or Project wrapper. Building a correct tree and choosing an efficient tree are different responsibilities.",
        "id": "lecture-05-scene-11",
        "sources": [
          "lectures/lecture-05/parsing.html"
        ]
      },
      {
        "title": "Correct can be expensive",
        "minutes": 3,
        "kind": "visual",
        "notes": "Return to the 300-student, three-major measurement with both local predicates. The naive tree enumerates 900 pairs; a pushdown plan enumerates 60; both return 20 rows. Ask which stage must change to choose the second tree. The planner changes while QueryData and the parser can remain unchanged. Lecture9 discusses the statistics and transformations an optimizer needs. Lab 5 supplies the simple planner and a separate early-filter comparison plan. Students predict row visits, pairs, comparisons, and output work before measuring repeated execution times. Fifteen times fewer pairs does not guarantee a fifteen-fold speedup. Do not confuse this workload with the six-row widget.",
        "id": "lecture-05-scene-12",
        "sources": [
          "lectures/lecture-05/parsing.html"
        ]
      },
      {
        "title": "An error at the boundary",
        "minutes": 4,
        "kind": "visual",
        "notes": "Let the class inspect SELECT name students before revealing the error. The parser expects FROM but finds students. A useful error identifies both the expected boundary and the observed token; source location would improve it further. The separate FORM misspelling is reported as form because this lexer lowercases unquoted words. Centralizing failures in expect keeps rules readable. Do not claim this tiny helper handles every semantic error or that production errors are uniformly worse.",
        "id": "lecture-05-scene-13",
        "demo": "viz-sql",
        "sources": [
          "lectures/lecture-05/parsing.html#viz-sql"
        ]
      },
      {
        "title": "Values are not syntax",
        "minutes": 4,
        "kind": "visual",
        "notes": "Draw a firm boundary between SQL structure and a separately supplied value. Bind the value into its parameter position without concatenating it into the SQL string. Explain why the parser cannot infer which valid tokens an application intended if untrusted text was already pasted into the statement. Parameter binding preserves the distinction. This is a conceptual production practice and an optional frontend extension, not a feature promised by the required microdb parser. Keep the focus on representation.",
        "id": "lecture-05-scene-14",
        "sources": [
          "lectures/lecture-05/parsing.html"
        ]
      },
      {
        "title": "The whole engine answers",
        "minutes": 3,
        "kind": "visual",
        "notes": "Ask students to narrate one boundary each as a query moves through all seven icons. The lexer recognizes units, the parser records intent, the planner creates operators, the scans use layouts, the pool provides pages, and the file manager transfers blocks. Answers flow back after execution begins. Thursday is a guided reading of the complete parse_query, _parse_predicate, _parse_term and plan_query implementations. Students then write six SQL queries, predict work, measure the simple and early-filter plans, and explain the results from the operators. The completed engine is supplied.",
        "id": "lecture-05-scene-15",
        "sources": [
          "lectures/lecture-05/parsing.html"
        ]
      },
      {
        "title": "Read, describe, execute",
        "minutes": 3,
        "kind": "recap",
        "notes": "Use the final three-panel reconstruction as an exit check. Which stage handles quotes? Lexer. Which checks SELECT–FROM ordering? Parser. Which chooses scan objects? Planner. Why can optimization evolve independently? The intermediate intent object decouples syntax from execution. The supplied Lab 5 code should pass all twelve setup tests immediately. The assignment is SQL, predictions, measurements, and explanations. Ask whether fewer result rows must mean fewer source-row visits; with this heap scan, no. Compare 300 and 600 students and separate logical counts from noisy timings. Next Tuesday B+trees provide an alternative to touching every table block.",
        "id": "lecture-05-scene-16",
        "sources": [
          "lectures/lecture-05/parsing.html"
        ]
      }
    ]
  }
];
  window.COURSE_DECKS = window.COURSE_DECKS || {};
  for (const deck of metadata) {
    deck.scenes = deck.scenes.map((scene, index) => ({ ...scene, ...art[deck.id][index] }));
    window.COURSE_DECKS[deck.id] = deck;
  }
})();
