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
  // ── Lecture 5: one idea per scene, with the reading's worked examples ──
  const l5title = (d, label) => text(d,'heading',640,85,label,42);
  const l5sql = (d, value='SELECT name FROM students WHERE gpa > 35', y=160) => text(d,'sql',640,y,value,30,P.blue);
  add(5,0,['The SQL request','The parsed request','The executable plan'],(d,s)=>{
    l5title(d,'SQL needs an executable plan');
    l5sql(d);
    box(d,'sql-stage',100,300,280,90,'SQL text',P.blueLight,P.blue,36);
    if(s>=1){d.arrow('parse',400,345,480,345,P.blue,4);text(d,'parse-label',440,275,'parse',27,P.blue);box(d,'data',500,300,280,90,'QueryData',P.blueLight,P.blue,36);}
    if(s>=2){d.arrow('plan',800,345,880,345,P.green,4);text(d,'plan-label',840,275,'plan',27,P.green);box(d,'tree',900,300,280,90,'Scan tree',P.greenLight,P.green,36);}
    text(d,'point',640,540,s<2?'The front end translates the request.':'Execution starts when the runner pulls rows.',32);
  });
  add(5,1,['The requested fields','The source tables','The condition','The complete QueryData'],(d,s)=>{
    l5title(d,'Parsing records the request');l5sql(d);
    d.text('type',250,245,'QueryData',36,P.blue,'start');
    const values=['fields = ["name"]','tables = ["students"]','predicate = Predicate(("gpa", ">", 35))'];
    values.forEach((v,i)=>{if(s>=i)d.text('part'+i,250,335+i*90,v,32,P.ink,'start');});
    if(s>=3)text(d,'meaning',640,635,'The object describes the query. No student rows have been read.',29,P.muted);
  });
  add(5,2,['Two occurrences of from','The keyword token','The string token'],(d,s)=>{
    l5title(d,'Quotes change a token’s meaning');
    l5sql(d,"SELECT name FROM students WHERE nick = 'from'",165);
    box(d,'keyword',170,275,380,105,'FROM',P.blueLight,P.blue,48);
    box(d,'string',730,275,380,105,"'from'",P.orangeLight,P.orange,48);
    if(s>=1){text(d,'keyword-kind',360,460,'(KEYWORD, "from")',32,P.blue);text(d,'keyword-use',360,535,'Introduces the table list',28);}
    if(s>=2){text(d,'string-kind',920,460,'(STR, "from")',32,P.orange);text(d,'string-use',920,535,'Supplies a text value',28);}
  });
  add(5,3,['Words become keywords or identifiers','Numbers and strings become values','Punctuation gets its own kind'],(d,s)=>{
    const rows=[['Input text','Token kind','Token value'],['SELECT','KEYWORD','"select"'],['name','ID','"name"']];
    if(s>=1)rows.push(['35','NUM','35'],["'ada'",'STR','"ada"']);
    if(s>=2)rows.push(['>','PUNCT','">"']);
    d.table('tokens',190,245,[300,300,300],rows,{rowHeight:56,fontSize:28,header:true});
    text(d,'provided',640,640,'The supplied lexer handles quotes and word normalization.',28,P.muted);
  });
  add(5,4,['The statement root','Fields and tables','The predicate subtree','The distinction between a field and a number'],(d,s)=>{
    l5title(d,'An AST shows query structure');l5sql(d,undefined,155);
    box(d,'root',490,240,300,65,'SelectQuery',P.blueLight,P.blue,32);
    if(s>=1){
      d.line('fields-edge',540,310,230,365,P.blue,3);d.line('table-edge',640,310,570,365,P.blue,3);
      box(d,'field',85,370,290,65,'Field("name")',P.white,P.blue,29);
      box(d,'table',415,370,310,65,'Table("students")',P.white,P.blue,29);
    }
    if(s>=2){d.line('pred-edge',740,310,1010,365,P.blue,3);box(d,'compare',865,370,290,65,'GreaterThan',P.blueLight,P.blue,29);}
    if(s>=3){
      d.line('lhs-edge',960,440,865,510,P.blue,3);d.line('rhs-edge',1060,440,1120,510,P.blue,3);
      box(d,'lhs',755,515,220,65,'Field("gpa")',P.white,P.blue,28);
      box(d,'rhs',1010,515,220,65,'Number(35)',P.orangeLight,P.orange,28);
    }
    text(d,'ast-label',640,645,'Abstract syntax tree: an illustrative view of the QueryData structure',26,P.muted);
  });
  add(5,5,['Required SELECT and FROM','An optional WHERE','The star alternative','A repeated comma and field'],(d,s)=>{
    d.text('required',100,270,'SELECT fieldlist FROM tablelist',35,P.blue,'start');
    if(s>=1)d.text('optional',100,335,'[ WHERE predicate ]',35,P.orange,'start');
    if(s>=2)d.text('fields',100,415,'fieldlist := * | field { , field }',35,P.blue,'start');
    const examples=['SELECT name FROM students','SELECT name FROM students WHERE gpa > 35','SELECT * FROM students','SELECT name, gpa FROM students'];
    box(d,'example',90,520,1100,75,examples[s],P.white,P.green,31);
    const meanings=['Required parts appear in every query.','[ ] means optional.','* requests all columns.  | separates alternatives.','{ , field } means zero or more comma-and-field pairs.'];
    text(d,'meaning',640,465,meanings[s],27,P.muted);
    text(d,'ebnf',640,640,'EBNF: Extended Backus–Naur form',28,P.muted);
  });
  add(5,6,['Start at the first token','peek looks at select','match checks select','next consumes select','expect consumes name'],(d,s)=>{
    l5title(d,'Consuming a token moves the cursor');
    l5sql(d,'SELECT name FROM students',155);
    const cursor=s<3?0:s===3?1:2;
    const tokens=[['select','KEYWORD'],['name','ID'],['from','KEYWORD'],['students','ID']];
    tokens.forEach(([value,kind],i)=>{
      const x=100+i*280,active=i===cursor;
      d.rect('token'+i,x,250,240,95,active?P.greenLight:P.white,active?P.green:P.line,8,active?3:2);
      text(d,'value'+i,x+120,285,value,35,i<cursor?P.muted:P.ink);
      text(d,'kind'+i,x+120,323,kind,23,P.muted);
      if(i<cursor)text(d,'consumed'+i,x+120,220,'consumed',25,P.muted);
    });
    const x=220+cursor*280;
    d.arrow('cursor',x,395,x,355,P.green,4);
    text(d,'cursor-caption',x,425,'Cursor: next token',25,P.green);
    if(s===0){
      text(d,'start',640,530,'The cursor starts at select.',36);
      text(d,'meaning',640,605,'Consume means move past a token. The token remains in the list.',29,P.muted);
    }else{
      const calls=['','peek()','match("KEYWORD", "select")','next()','expect("ID")'];
      const returns=['','("KEYWORD", "select")','True','("KEYWORD", "select")','"name"'];
      text(d,'call-heading',355,490,'Call',25,P.muted);text(d,'return-heading',935,490,'Returned value',25,P.muted);
      text(d,'call',355,540,calls[s],32,P.blue);text(d,'result',935,540,returns[s],30);
      const effects=['','The cursor stays on “select”.','The test is True. The cursor stays on “select”.','Consume “select”. The cursor moves to “name”.','Consume “name”. The cursor moves to “from”.'];
      text(d,'effect',640,620,effects[s],33,P.green);
    }
    text(d,'sequence',640,680,'One token stream. Each call continues where the previous call stopped.',25,P.muted);
  });
  add(5,7,['parse_query is about to consume WHERE','It calls _parse_predicate','That calls _parse_term','The term returns its tuple','The predicate returns its object','The query returns QueryData'],(d,s)=>{
    l5title(d,'A parser call returns data to its caller');
    ['where','gpa','>','35','EOF'].forEach((v,i)=>box(d,'token'+i,90+i*225,155,205,60,v,P.white,P.line,29));
    const cursor=s===0?0:s<3?1:4;d.arrow('cursor',192+cursor*225,265,192+cursor*225,230,P.green,4);
    text(d,'stack-label',340,305,'Active grammar methods',28,P.muted);
    const depth=[1,2,3,2,1,0][s];
    ['parse_query','_parse_predicate','_parse_term'].forEach((v,i)=>{if(i<depth)box(d,'frame'+i,100,550-i*95,480,70,v,P.greenLight,P.green,31);});
    if(depth===0)text(d,'empty',340,480,'All three calls have returned',29,P.muted);
    text(d,'value-heading',915,305,s<3?'Current task':'Returned value',28,P.muted);
    const labels=['Consume WHERE','Read a predicate','Read gpa > 35','("gpa", ">", 35)','Predicate(("gpa", ">", 35))','QueryData'];
    box(d,'value',665,390,520,100,labels[s],P.blueLight,P.blue,s===4?26:31);
    if(s>=3&&s<5)d.arrow('return',650,440,595,s===3?490:585,P.blue,4);
    if(s===5)text(d,'contents',925,545,'fields, tables, predicate',27);
  });
  add(5,8,['Identify the two major-ID fields','ProductScan pairs the student with a major','Read mid2 and keep the matching pair','Read a different mid2 and reject that pair'],(d,s)=>{
    l5title(d,'F("mid2") reads the major row’s ID');
    l5sql(d,'WHERE mid = mid2',155);
    const majorId=s===3?1:2,department=s===3?'ds':'stat';
    text(d,'student-heading',335,220,'Student row',32,P.green);
    text(d,'major-heading',945,220,'Major row',32,P.blue);
    d.table('student',110,250,[225,225],[['name','mid'],['ben','2']],{rowHeight:54,fontSize:30,header:true});
    d.table('major',720,250,[225,225],[['mid2','dept'],[String(majorId),department]],{rowHeight:54,fontSize:30,header:true,highlightCols:s>=2?[0]:[]});
    text(d,'student-id-meaning',335,387,'mid: the student’s chosen major ID',26,P.green);
    text(d,'major-id-meaning',945,387,'mid2: this major’s own ID',26,P.blue);
    if(s===0){
      text(d,'question',640,515,'Do these rows refer to the same major?',36);
      text(d,'names',640,600,'mid and mid2 are column names. The cells contain their values.',28,P.muted);
    }
    if(s>=1){
      d.arrow('student-input',335,415,335,470,P.green,3);
      d.arrow('major-input',945,415,945,470,P.blue,3);
      text(d,'pair-heading',640,440,'ProductScan: one candidate pair',28);
      d.table('pair',180,485,[230,230,230,230],[['name','mid','mid2','dept'],['ben','2',String(majorId),department]],{rowHeight:48,fontSize:29,header:true,highlightCols:s>=2?[2]:[]});
      if(s===1)text(d,'pair-meaning',640,640,'“Combined row” means we can read fields from both rows in this pair.',28,P.muted);
    }
    if(s>=2){
      text(d,'lookup',640,615,`F("mid2") reads ${majorId} from the highlighted column.`,30,P.orange);
      text(d,'comparison',640,672,s===2?'Student’s major ID 2 = this major’s ID 2: keep (ben, stat).':'Student’s major ID 2 ≠ this major’s ID 1: reject (ben, ds).',29,s===2?P.green:P.red);
    }
  });
  add(5,9,['SELECT returns QueryData','INSERT returns InsertData','CREATE TABLE returns CreateData'],(d,s)=>{
    l5title(d,'Parsing produces a description of a statement');
    const examples=[['SELECT name FROM students','QueryData','fields, tables, predicate'],["INSERT INTO majors VALUES (1, 'ds')",'InsertData','table, values'],['CREATE TABLE t (id INT)','CreateData','table, schema']];
    examples.forEach(([sql,kind,fields],i)=>{if(i<=s){const y=195+i*155;d.text('sql'+i,90,y,sql,29,P.blue,'start');d.arrow('arrow'+i,740,y,820,y,P.green,3);d.text('kind'+i,860,y,kind,33,P.green,'start');d.text('fields'+i,860,y+50,fields,25,P.muted,'start');}});
    text(d,'later',640,665,'Execution uses the description after parsing finishes.',29,P.muted);
  });
  add(5,10,['Open the FROM tables','Combine the scans with ProductScan','Apply the WHERE condition','Expose the SELECT fields'],(d,s)=>{
    l5title(d,'The planner wraps scans to implement SQL');
    l5sql(d,'SELECT name, dept FROM students, majors',150);
    text(d,'where',640,195,'WHERE mid = mid2',30,P.blue);
    box(d,'students',140,550,360,65,'TableScan: students',P.greenLight,P.green,29);
    box(d,'majors',780,550,360,65,'TableScan: majors',P.greenLight,P.green,29);
    if(s>=1){d.arrow('left',320,540,535,500,P.green,3);d.arrow('right',960,540,745,500,P.green,3);box(d,'product',425,440,430,60,'ProductScan',P.greenLight,P.green,30);}
    if(s>=2){d.arrow('to-select',640,430,640,410,P.green,3);box(d,'select',370,345,540,65,'SelectScan: mid = mid2',P.greenLight,P.green,30);}
    if(s>=3){d.arrow('to-project',640,335,640,315,P.green,3);box(d,'project',370,250,540,65,'ProjectScan: name, dept',P.greenLight,P.green,30);}
    text(d,'direction',640,665,'Build from the tables upward. Arrows show where rows will flow.',27,P.muted);
  });
  add(5,11,['The same SQL and data','Product first: 900 pairs','Filter inputs first: 60 pairs','Both plans return 20 rows'],(d,s)=>{
    l5title(d,'Earlier filters reduce candidate pairs');
    l5sql(d,'SELECT name, dept FROM students, majors',150);
    text(d,'predicate',640,200,"WHERE mid = mid2 AND gpa > 35 AND dept = 'ds'",29,P.blue);
    text(d,'fixture',640,275,'Lab 5 data: 300 students and 3 majors',30,P.muted);
    text(d,'simple-label',335,355,'Product first',33,P.orange);text(d,'early-label',945,355,'Filter inputs first',33,P.green);
    if(s>=1){text(d,'simple',335,440,'300 × 3 = 900 pairs',39,P.orange);text(d,'late',335,510,'Then test all WHERE terms',26);}
    if(s>=2){text(d,'early',945,440,'60 × 1 = 60 pairs',39,P.green);text(d,'local',945,510,'60 students and 1 major pass',26);}
    if(s>=3){text(d,'rows',640,595,'Same answer: 20 rows',36);text(d,'timing',640,655,'15× fewer pairs does not establish a 15× speedup.',28,P.muted);}
  });
  add(5,12,['The parser needs FROM','The lexer supplied ID form','expect reports the mismatch'],(d,s)=>{
    l5title(d,'expect identifies the grammar mismatch');
    l5sql(d,'SELECT name FORM students',175);
    text(d,'call',640,270,'expect("KEYWORD", "from")',35,P.blue);
    text(d,'expected-heading',345,360,'Expected token',29,P.green);
    box(d,'expected',115,405,460,80,'(KEYWORD, "from")',P.greenLight,P.green,31);
    if(s>=1){text(d,'found-heading',940,360,'Current token',29,P.red);box(d,'found',710,405,460,80,'(ID, "form")',P.redLight,P.red,31);}
    if(s>=2){text(d,'error',640,580,"expected 'from', found 'form'",36,P.red);text(d,'cursor',640,650,'The failing expect call leaves the token unread.',28,P.muted);}
  });
  add(5,13,['The question mark marks a value to supply','Supply ID 42 and return ada','Supply ID 43 with the same SQL','SQL-looking input remains one value'],(d,s)=>{
    l5title(d,'Parameters keep input separate from SQL');
    text(d,'goal',640,150,'Example: look up a student using an ID from the app.',29,P.muted);
    text(d,'structure',640,210,'Fixed SQL text (sql)',28,P.blue);
    box(d,'sql',100,245,1080,75,'SELECT name FROM students WHERE sid = ?',P.blueLight,P.blue,34);
    text(d,'placeholder',640,355,'? marks one value that the application supplies separately.',28,P.blue);
    text(d,'data-heading',265,415,'Example students',27,P.muted);
    d.table('students',100,450,[130,200],[['sid','name'],['42','ada'],['43','ben']],{rowHeight:48,fontSize:27,header:true,highlightRows:s===1?[1]:s===2?[2]:[]});
    if(s>=1){
      const value=s===1?'42':s===2?'43':'"42 OR 1=1"';
      text(d,'call-heading',825,415,'Python passes SQL and values as two arguments',26,P.orange);
      text(d,'call',825,470,`connection.execute(sql, [${value}])`,31);
      text(d,'binding',825,525,s===3?'The entire string is one parameter value.':`[${value}] supplies ${value} for the one ? placeholder.`,27,P.orange);
      text(d,'result',825,578,s===1?'Result: name = ada':s===2?'Result: name = ben':'Result: 0 rows',32,s===3?P.orange:P.green);
    }
    const meanings=['Parameter = a value supplied when the query runs.','The database compares sid with the supplied value 42.','The supplied ID changes. The SQL text stays the same.','OR 1=1 stays inside the value. It adds no SQL condition.'];
    text(d,'meaning',640,643,meanings[s],29);
    text(d,'scope',640,692,'Python + SQLite example. Parameter binding is optional beyond microSQL.',24,P.muted);
  });
  add(5,14,['A plan ready for execution','next calls travel down the tree','A qualifying row moves upward','The runner reads the requested field'],(d,s)=>{
    l5title(d,'Execution pulls rows through the scan tree');
    l5sql(d,undefined,155);
    ['ProjectScan: name','SelectScan: gpa > 35','TableScan: students'].forEach((v,i)=>box(d,'scan'+i,370,265+i*125,540,75,v,P.greenLight,P.green,31));
    d.line('link1',640,345,640,380,P.line,3);d.line('link2',640,470,640,505,P.line,3);
    if(s>=1){d.arrow('pull',1040,290,1040,555,P.blue,5);text(d,'next',1055,230,'next()',32,P.blue);}
    if(s>=2){d.arrow('rows',245,555,245,300,P.orange,5);text(d,'row',640,650,'Toy input row: name = ada, gpa = 39',29,P.orange);}
    if(s>=3){box(d,'out',85,205,240,70,'name: ada',P.orangeLight,P.orange,30);text(d,'read',640,215,'get_val("name")',28,P.orange);}
  });
  add(5,15,['Predict the effect of WHERE','Compare source row visits','Compare returned rows'],(d,s)=>{
    l5title(d,'Fewer results can still require a full scan');
    d.text('all',100,205,'SELECT name FROM students',32,P.blue,'start');
    d.text('filtered',100,280,'SELECT name FROM students WHERE gpa > 35',32,P.blue,'start');
    const rows=[['300-student fixture','No WHERE','gpa > 35']];
    if(s>=1)rows.push(['Table row visits','300','300']);
    if(s>=2)rows.push(['Returned rows','300','60']);
    d.table('counts',150,380,[450,260,270],rows,{rowHeight:75,fontSize:30,header:true});
    if(s>=2)text(d,'reason',640,655,'TableScan still visits every row. SelectScan rejects some afterward.',28,P.muted);
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
        "title": "SQL needs an executable plan",
        "minutes": 3,
        "kind": "title",
        "id": "lecture-05-scene-01",
        "sources": [
          "lectures/lecture-05/parsing.html#try-it"
        ],
        "teaching": {
          "idea": "The front end turns a SQL request into scan objects that execution can use.",
          "builds": [
            "Read the SQL aloud: return names from students whose GPA exceeds 35. SQL states the requested result. The Lab 4 scan operators need objects and settings before they can produce it.",
            "Advance once. QueryData records the fields, tables, and condition. The lexer and parser create this description from the typed text. We will examine that work next.",
            "Advance again. The planner uses QueryData to build a scan tree. The runner then initializes the tree and calls next() to request rows. Building a plan and executing it are separate actions."
          ],
          "question": "Has creating QueryData read any student rows?",
          "answer": "No. QueryData only describes the request. The execution loop later asks the scan tree for rows.",
          "context": "The scheduled quiz is separate from these 60 teaching minutes. Lab 5 supplies the front end so students can study it and measure queries."
        }
      },
      {
        "title": "Parsing records the request",
        "minutes": 4,
        "kind": "visual",
        "id": "lecture-05-scene-02",
        "sources": [
          "lectures/lecture-05/parsing.html#query-data"
        ],
        "teaching": {
          "idea": "QueryData stores the SELECT list, FROM list, and WHERE condition.",
          "builds": [
            "Point to SELECT name, then fields = [\"name\"]. The list records which output fields the user requested.",
            "Point to FROM students, then tables = [\"students\"]. These are table names. They are not open TableScan objects.",
            "Point to WHERE gpa > 35, then the Predicate object. Its term stores the field name gpa, operator >, and integer 35. No comparison runs while this object is built.",
            "Read the completed object as one sentence: return name from students when gpa is greater than 35. Explain that the planner can now read these parts without inspecting SQL characters."
          ],
          "question": "What would change for SELECT * FROM students?",
          "answer": "fields would be [\"*\"], tables would stay [\"students\"], and predicate would be None.",
          "context": "The reading shows this exact QueryData constructor. GPA values use integer tenths, so 35 represents 3.5."
        }
      },
      {
        "title": "Quotes change a token’s meaning",
        "minutes": 4,
        "kind": "activity",
        "id": "lecture-05-scene-03",
        "sources": [
          "lectures/lecture-05/parsing.html#pipeline"
        ],
        "teaching": {
          "idea": "The lexer uses quoting to distinguish a keyword from a string value.",
          "builds": [
            "Point out both occurrences of from. Ask students to predict whether they play the same role. Pause before revealing token kinds.",
            "The unquoted FROM becomes (KEYWORD, \"from\"). It introduces the table list. The lexer normalizes unquoted words to lowercase.",
            "The quoted text becomes (STR, \"from\"). Its value is the four letters from. The lexer consumes the surrounding quotes, so the parser receives one string token."
          ],
          "question": "Why can a search for the word from alone misread this statement?",
          "answer": "It does not tell us which occurrence is a keyword and which is inside a string. Token kinds preserve that distinction.",
          "context": "This is the reading’s lexical example. nick illustrates quoting and is not a column in the Lab 5 measurement fixture. The reading separately shows PostgreSQL quoted identifiers with double quotes."
        }
      },
      {
        "title": "Tokens have a kind and a value",
        "minutes": 4,
        "kind": "definition",
        "id": "lecture-05-scene-04",
        "definition": "A token pairs a kind, such as NUM, with a value, such as 35.",
        "term": "Token",
        "sources": [
          "lectures/lecture-05/parsing.html#token-kinds"
        ],
        "teaching": {
          "idea": "A token pairs a category with the value the parser needs.",
          "builds": [
            "Read the first two rows across. SELECT becomes a KEYWORD whose value is \"select\". name becomes an ID whose value is \"name\". The fixed keyword list determines the difference.",
            "Advance to the values. NUM 35 contains an integer. STR \"ada\" contains a string without its surrounding SQL quotes. String capitalization is preserved.",
            "Advance to punctuation. The greater-than symbol becomes PUNCT with value \">\". These five kinds cover the teaching grammar. The parser checks both kind and value when it expects a particular keyword or symbol."
          ],
          "question": "What token does the text 35 produce, and how does that differ from the text '35'?",
          "answer": "35 produces (NUM, 35). The quoted version produces (STR, \"35\"). One value is an integer and the other is text.",
          "context": "Lexer code is provided and optional to study. As the reading notes, tools such as ANTLR can generate lexers and parsers. Students only need the token contract here."
        }
      },
      {
        "title": "An AST shows query structure",
        "minutes": 4,
        "kind": "visual",
        "id": "lecture-05-scene-05",
        "sources": [
          "lectures/lecture-05/parsing.html#ast-example"
        ],
        "teaching": {
          "idea": "An abstract syntax tree shows the parts of a parsed request and how they relate.",
          "builds": [
            "Expand AST as abstract syntax tree. The root represents one SELECT statement. The node labels here are illustrative, as they are in the reading.",
            "Reveal the requested field and source table. Connect each branch to the matching part of SELECT name FROM students.",
            "Reveal GreaterThan. This node represents the WHERE comparison. The tree places the condition under the statement it belongs to.",
            "Reveal Field(\"gpa\") and Number(35). The left child names a value to read from a row later. The right child holds a numeric constant. Neither child evaluates the comparison during parsing."
          ],
          "question": "Why does the AST need no node for the final semicolon?",
          "answer": "The semicolon helps delimit the SQL text but adds no requested field, source table, or condition. The AST keeps the statement’s meaning and structure.",
          "context": "Lab 5 stores this structure in QueryData. It does not build classes named SelectQuery or GreaterThan. This diagram is another view of the same request, not an extra lab processing stage."
        }
      },
      {
        "title": "Grammar defines legal token sequences",
        "minutes": 4,
        "kind": "definition",
        "id": "lecture-05-scene-06",
        "definition": "Rules that describe legal sequences of tokens.",
        "term": "Grammar",
        "sources": [
          "lectures/lecture-05/parsing.html#grammar"
        ],
        "teaching": {
          "idea": "Grammar rules describe required parts, optional parts, and allowed repetitions.",
          "builds": [
            "Read the required rule from left to right: SELECT, a field list, FROM, and a table list. Match it to the example below.",
            "Reveal [ WHERE predicate ]. Square brackets mean this part may be absent. The example now includes a condition.",
            "Reveal the field-list rule. The star is a literal SQL token requesting all columns. The vertical bar means choose an alternative. Students type the star in SQL, but do not type the bar.",
            "Read { , field } as zero or more comma-and-field pairs. The example selects name and gpa by using the repetition once. A single name uses it zero times."
          ],
          "question": "Does the star mean repetition in this grammar?",
          "answer": "No. Here * is SQL for all columns. Braces express repetition, and square brackets express an optional part.",
          "context": "BNF expands to Backus–Naur form. The brackets and braces used here belong to Extended Backus–Naur form, or EBNF. The reading lists the remaining rules for predicates and INSERT."
        }
      },
      {
        "title": "Consuming a token moves the cursor",
        "minutes": 4,
        "kind": "activity",
        "id": "lecture-05-scene-07",
        "sources": [
          "lectures/lecture-05/parsing.html#descent"
        ],
        "teaching": {
          "idea": "The cursor marks the next token to process. Looking at a token leaves the cursor in place. Consuming it moves the cursor forward.",
          "builds": [
            "Point to the arrow under select. This is the cursor: it identifies the next token a helper will use. The token boxes will stay on screen throughout this example. Consuming a token means moving past it, not deleting it.",
            "Call peek(). It returns the kind and value of select: (\"KEYWORD\", \"select\"). The arrow stays under select. We have looked at the token, but the next helper will still see it.",
            "Now call match(\"KEYWORD\", \"select\") on the same stream. It asks whether the current token has that kind and value. The answer is True. The arrow still stays under select.",
            "Now call next(). It returns (\"KEYWORD\", \"select\") and moves the arrow to name. select remains visible as a consumed token. The returned token is select, but the next unread token is now name.",
            "Now call expect(\"ID\"). The current token, name, is an identifier, so the check succeeds. expect returns just the value \"name\" and moves the arrow to from. If the kind did not match, expect would raise ParseError without moving the cursor."
          ],
          "question": "Which helpers move the cursor, and which leave it in place?",
          "answer": "peek and match leave it in place. next and a successful expect move it to the following token.",
          "checks": [
            {
              "question": "Which token will the first helper see?",
              "answer": "select, because the cursor points to it."
            },
            {
              "question": "If we call peek again now, what will it return?",
              "answer": "It returns (\"KEYWORD\", \"select\") again. The first peek did not move the cursor."
            },
            {
              "question": "Does True mean that match consumed select?",
              "answer": "No. True only reports that the token matched. The cursor still points to select."
            },
            {
              "question": "next returned select. Which token will peek see now?",
              "answer": "name. next returned the old token and then advanced the cursor."
            },
            {
              "question": "Why does expect(\"ID\") succeed here, and what is unread next?",
              "answer": "The current token name has kind ID. expect consumes it and returns \"name\". The next unread token is from."
            }
          ],
          "context": "These are consecutive calls on one Lexer for SELECT name FROM students. There are no resets between steps. They demonstrate the helper contracts, not the exact call sequence inside parse_query. Token kinds appear beneath their values. The linked INSERT walkthrough applies the same helpers in a parser."
        },
        "demo": "viz-insert"
      },
      {
        "title": "A parser call returns data to its caller",
        "minutes": 4,
        "kind": "visual",
        "id": "lecture-05-scene-08",
        "sources": [
          "lectures/lecture-05/parsing.html#parser-calls"
        ],
        "teaching": {
          "idea": "Nested grammar rules create nested calls. Each completed call returns data and leaves the stack.",
          "builds": [
            "We join parse_query just before WHERE. It has already read SELECT name FROM students. The cursor points to where.",
            "parse_query consumes WHERE and calls _parse_predicate. The cursor now points to gpa. Both grammar methods are active.",
            "_parse_predicate calls _parse_term. All three grammar methods are active. Entering a method alone has not consumed gpa.",
            "_parse_term consumes gpa, >, and 35. It returns (\"gpa\", \">\", 35) and disappears from the stack. _parse_predicate resumes with the cursor at the end of input.",
            "There is no AND, so _parse_predicate wraps the term in Predicate and returns. Only parse_query remains active.",
            "parse_query combines the field list, table list, and predicate into QueryData, then returns. None of these three grammar methods remains active."
          ],
          "question": "Does the call stack retain the complete AST after parsing finishes?",
          "answer": "No. Completed calls have returned and left the stack. The returned QueryData object keeps the parsed request.",
          "context": "This diagram tracks only grammar methods. It omits short calls to lexer helpers and _parse_literal. The reading’s interactive trace uses a two-field SELECT but follows the same WHERE calls."
        },
        "demo": "viz-trace"
      },
      {
        "title": "F(\"mid2\") reads the major row’s ID",
        "minutes": 4,
        "kind": "activity",
        "id": "lecture-05-scene-09",
        "sources": [
          "lectures/lecture-05/parsing.html#field-reference"
        ],
        "teaching": {
          "idea": "The student row says which major the student chose. The major row has its own ID. The join keeps a pair when those two IDs match.",
          "builds": [
            "Introduce the two example rows. ben has mid = 2, meaning his chosen major has ID 2. The statistics row has mid2 = 2, meaning statistics is major 2. mid and mid2 are column names in different tables. Neither is the student’s own ID.",
            "ProductScan pairs ben with the statistics row and makes both rows’ fields available. That is all “combined row” means here. Point to name and mid from the student, then mid2 and dept from the major. The predicate has not decided whether to keep the pair yet.",
            "For WHERE mid = mid2, the parser stored (\"mid\", \"=\", F(\"mid2\")). The predicate reads 2 from the student’s mid field. F(\"mid2\") tells it to read 2 from the major’s mid2 field. These are the two sides of 2 = 2. They name the same major, so keep the pair and return ben with stat.",
            "Now pair the same student with the data-science row. ben still has mid = 2, but this major has mid2 = 1. F(\"mid2\") now reads 1. The predicate compares 2 with 1 and rejects the pair. The field name stayed mid2 while the value changed."
          ],
          "question": "What does F(\"mid2\") tell execution to do?",
          "answer": "Read the value of the mid2 field from the current candidate pair. That value is the ID of whichever major row is currently paired with the student.",
          "checks": [
            {
              "question": "Where does each 2 come from?",
              "answer": "The left 2 is the student’s chosen major ID in mid. The right 2 is the statistics major’s own ID in mid2."
            },
            {
              "question": "Does ProductScan already know that statistics is the right major for ben?",
              "answer": "No. ProductScan creates candidate pairs. The mid = mid2 predicate decides which pairs match."
            },
            {
              "question": "Why do we keep (ben, stat)?",
              "answer": "ben’s chosen major ID is 2 and the statistics row’s ID is also 2. They refer to the same major."
            },
            {
              "question": "Does the 2 in the column name mid2 force its value to be 2?",
              "answer": "No. mid2 is just a distinct column name. The data-science row stores 1 there, so this pair fails the comparison."
            }
          ],
          "context": "These are illustrative rows using the lab’s major IDs: 1 is ds and 2 is stat. ben is a readable example name, not a row name in the generated 300-student fixture. ProductScan exposes fields from its two current inputs; it need not copy them into a new stored row. F means field reference. By contrast, 35 in gpa > 35 is a fixed number, and a plain string \"mid2\" would be fixed text."
        }
      },
      {
        "title": "Parsing produces a statement description",
        "minutes": 4,
        "kind": "visual",
        "id": "lecture-05-scene-10",
        "sources": [
          "lectures/lecture-05/parsing.html#statement-data"
        ],
        "teaching": {
          "idea": "The statement type determines which plain data object the parser returns.",
          "builds": [
            "Read SELECT name FROM students. QueryData records its field list, table list, and optional predicate. No table scan exists yet.",
            "Read INSERT INTO majors VALUES (1, 'ds'). InsertData records the table name and the values. Parsing the statement does not insert the row.",
            "Read CREATE TABLE t (id INT). CreateData records the table name and a Schema describing the column. Execution later uses the catalog to create the table."
          ],
          "question": "At what stage does an INSERT actually change a table?",
          "answer": "During execution. Parser.parse_insert only returns InsertData. Database.execute sends that object to the insertion code.",
          "context": "These examples illustrate object types. They are not a sequence to execute against the populated demo database. The reading’s statement table lists the same three object types."
        }
      },
      {
        "title": "The planner wraps scans to implement SQL",
        "minutes": 4,
        "kind": "activity",
        "id": "lecture-05-scene-11",
        "sources": [
          "lectures/lecture-05/parsing.html#planner"
        ],
        "teaching": {
          "idea": "The simple planner builds its scan tree from the FROM tables upward.",
          "builds": [
            "Read the two-table query. The planner asks the catalog for each layout and opens students and majors as TableScans.",
            "Add ProductScan above the two inputs. It pairs every student with every major. The planner preserves FROM order. With more tables, it combines them from left to right.",
            "Add SelectScan for mid = mid2. It keeps only matching major IDs. This condition needs the combined row from both tables.",
            "Add ProjectScan for name and dept. It exposes only the requested fields after selection has used mid and mid2."
          ],
          "question": "Why would putting this projection below the selection cause trouble?",
          "answer": "Projecting only name and dept hides mid and mid2. The selection still needs those fields to test the join.",
          "context": "Arrows show the direction rows will flow during execution. Building the tree does not enumerate pairs. A single table needs no ProductScan, no WHERE needs no SelectScan, and SELECT * needs no ProjectScan."
        }
      },
      {
        "title": "Earlier filters reduce candidate pairs",
        "minutes": 3,
        "kind": "visual",
        "id": "lecture-05-scene-12",
        "sources": [
          "lectures/lecture-05/parsing.html#plan-comparison"
        ],
        "teaching": {
          "idea": "Removing rows before ProductScan reduces how many candidate pairs it produces.",
          "builds": [
            "Read the full query. Both plans use the Lab 5 measurement fixture: 300 students and three majors. Only DS students with gpa > 35 belong in the result.",
            "The simple plan forms 300 × 3 = 900 pairs before testing the WHERE terms. Pause and ask what changes if each table’s local condition runs first.",
            "The student filter keeps 60 students and the department filter keeps one major. The product therefore forms 60 × 1 = 60 pairs. The mid = mid2 join test still runs above that product.",
            "Both plans return the same 20 rows. The rewrite reduced candidate pairs by a factor of 15. Runtime also includes scans, comparisons, and output work, so measure it separately."
          ],
          "question": "Does the early-filter plan read only 60 student rows?",
          "answer": "No. It visits all 300 students to find the 60 that qualify. Its right-hand filter also runs again for each qualifying left row.",
          "context": "For i = 0…299, gpa = 20 + i % 20 and mid = 1 + i % 3. GPA > 35 keeps 60 students, including 20 with major 1 (DS). The simple planner and the separate early-filter plan are both supplied in Lab 5."
        }
      },
      {
        "title": "expect identifies the grammar mismatch",
        "minutes": 4,
        "kind": "visual",
        "id": "lecture-05-scene-13",
        "sources": [
          "lectures/lecture-05/parsing.html#errors"
        ],
        "teaching": {
          "idea": "A useful parse error names the token required by the rule and the token actually present.",
          "builds": [
            "Read SELECT name FORM students. After consuming SELECT and name, parse_query calls expect(\"KEYWORD\", \"from\").",
            "The lexer classified the misspelling FORM as ID with value \"form\". It does not match the required token. Unquoted words are lowercase in the token stream.",
            "Show the exact error text. expect raises ParseError before advancing, so the current token remains form. The terminal reports the error and lets the user try another query."
          ],
          "question": "Which edit fixes this syntax error?",
          "answer": "Replace FORM with FROM. Whether the table and fields exist is a later catalog and planning check.",
          "context": "This is the same misspelling and error message as the reading. It illustrates expect’s contract, not every kind of SQL error."
        }
      },
      {
        "title": "Parameters keep input separate from SQL",
        "minutes": 4,
        "kind": "visual",
        "id": "lecture-05-scene-14",
        "sources": [
          "lectures/lecture-05/parsing.html#parameter-binding",
          "https://docs.python.org/3/library/sqlite3.html#how-to-use-placeholders-to-bind-values-in-sql-queries"
        ],
        "teaching": {
          "idea": "The application supplies a fixed SQL statement and a separate value. Binding associates that value with ? without letting it change the statement’s structure.",
          "builds": [
            "Start with the task: an app wants the name of the student whose ID a user enters. Read the two example rows: ID 42 belongs to ada and ID 43 belongs to ben. The variable sql holds the statement shown above. The question mark is a placeholder for one comparison value. It is neither a wildcard nor an instruction to return every student.",
            "Read the call aloud: execute the statement in sql with a list containing one value, 42. These are two Python arguments. The database associates 42 with the single question mark, compares each sid against 42, and returns the name ada. This association is called parameter binding. The SQL text still contains ?.",
            "Now change the value list to [43]. The statement above stays exactly the same. The database compares sid against 43 and returns ben. Only the comparison value and the matching row change. We are showing a value supplied through the API, not Python replacing characters in a SQL string.",
            "Now supply the string \"42 OR 1=1\" as the one value. SQLite does not parse that string as an extra OR condition. Neither integer ID equals it, so this example returns zero rows. This is the security reason for binding: user input cannot add SQL structure through this parameter. Pasting that text directly into SQL would cross the boundary between data and syntax."
          ],
          "question": "What does parameter binding keep separate, and why does it matter?",
          "answer": "It keeps the SQL statement and its input values separate. The value supplies the comparison input for ?, so even text that looks like SQL cannot add a condition through that parameter.",
          "checks": [
            {
              "question": "What does the question mark in WHERE sid = ? represent?",
              "answer": "One comparison value will be supplied separately when the statement executes. The database will compare sid against that value."
            },
            {
              "question": "Where does 42 come from, and why does the query return ada?",
              "answer": "The application passes 42 in the second argument, [42]. The row with sid 42 has name ada, and SELECT name returns that field."
            },
            {
              "question": "What changed when we looked up ben instead of ada?",
              "answer": "The separate value changed from 42 to 43. The SQL text, including its one question mark, stayed the same."
            },
            {
              "question": "Why does the input \"42 OR 1=1\" not return both students?",
              "answer": "Binding treats the whole string as one value. OR 1=1 never becomes a SQL condition, and neither example sid matches that string."
            }
          ],
          "context": "This is a runnable Python sqlite3 example with an INTEGER sid column and two illustrative rows (42, ada) and (43, ben). The reading includes the complete setup. The provided microSQL terminal does not support placeholders or this two-argument execute call; parameter binding is an optional extension. Other database APIs use different placeholder conventions and may reject an incompatible value rather than return zero rows. Parameters represent values, not table names, column names, or arbitrary SQL fragments. Keep the lesson about separating input from SQL syntax, not query performance or plan reuse."
        }
      },
      {
        "title": "Execution pulls rows through the scan tree",
        "minutes": 3,
        "kind": "visual",
        "id": "lecture-05-scene-15",
        "sources": [
          "lectures/lecture-05/parsing.html#execution"
        ],
        "teaching": {
          "idea": "The runner requests rows at the root, and each scan asks its input for the work it needs.",
          "builds": [
            "Start with the completed honors-query plan. The runner first calls before_first() to initialize scan positions. The drawing now shows a tree ready to produce rows.",
            "The runner calls next() on ProjectScan. That call reaches SelectScan, which asks TableScan for candidate rows. Point down the tree with the blue arrow.",
            "Use the toy row name = ada, gpa = 39. TableScan reads it, and SelectScan accepts it because 39 > 35. The successful next() result travels back toward the root.",
            "The runner calls get_val(\"name\") and obtains ada. ProjectScan exposes the requested field. The runner repeats next() until there are no more qualifying rows, then closes the plan."
          ],
          "question": "When a row fails gpa > 35, does SelectScan immediately return False?",
          "answer": "No. It keeps asking its input for rows until it finds a match or exhausts the input. False means no more qualifying rows remain.",
          "context": "ada is one illustrative row from the six-row teaching example, not a name in the 300-student fixture. The arrows summarize pull calls and successful row access. Scans expose a current row rather than copying a row object at every edge."
        }
      },
      {
        "title": "Fewer results can still require a full scan",
        "minutes": 3,
        "kind": "recap",
        "id": "lecture-05-scene-16",
        "sources": [
          "lectures/lecture-05/parsing.html#thursday"
        ],
        "teaching": {
          "idea": "Returned rows measure the answer size. Table row visits measure one part of the work.",
          "builds": [
            "Compare the two queries on the 300-student fixture. Before advancing, ask students to predict table row visits and returned rows for each query.",
            "Reveal 300 visits for both. TableScan has no index that can skip students based on GPA. The filtered query must read each candidate row to test it.",
            "Reveal 300 results without WHERE and 60 with WHERE. SelectScan rejects rows after reading them. Use this difference as the model for Lab 5 explanations."
          ],
          "question": "Does returning one fifth as many rows prove the filtered query runs five times faster?",
          "answer": "No. It still scans all 300 rows and evaluates a predicate. It materializes fewer output rows. Repeated timings determine how those costs combine.",
          "context": "Lab 5 is a guided walkthrough of supplied code, followed by six SQL experiments. Run python3 microdb.py --demo to explore results. Use measure_sql.py for work counts and repeated timings. Students submit SQL, original predictions, measurement outputs, and explanations. The 12 setup tests already pass."
        }
      }
    ]
  }
];
  window.COURSE_DECKS = window.COURSE_DECKS || {};
  for (const deck of metadata) {
    deck.scenes = deck.scenes.map((scene, index) => {
      const t = scene.teaching;
      const notes = t ? [
        'Main idea: ' + t.idea,
        ...t.builds.flatMap((value, i) => [
          `Step ${i + 1}: ${value}`,
          ...(t.checks?.[i] ? ['Ask: ' + t.checks[i].question, 'Expected answer: ' + t.checks[i].answer] : [])
        ]),
        'Ask: ' + t.question,
        'Expected answer: ' + t.answer,
        ...(t.context ? ['Teaching context: ' + t.context] : [])
      ].join('\n\n') : scene.notes;
      return { ...scene, notes, ...art[deck.id][index] };
    });
    window.COURSE_DECKS[deck.id] = deck;
  }
})();
