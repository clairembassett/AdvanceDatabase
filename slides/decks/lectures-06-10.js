(function () {
"use strict";
/* Hand-drawn, editable, deterministic lecture diagrams. */
const P = window.DeckViz.palette;
const tx=(d,k,x,y,t,z=28,c=P.ink)=>d.text(k,x,y,t,z,c);
function chip(d,k,x,y,t,fill=P.white,w=72,h=52){d.box(k,x,y,w,h,String(t),fill,P.line,26);}
function line(d,k,x1,y1,x2,y2,c=P.green){d.arrow(k,x1,y1,x2,y2,c,4);}
function dotgrid(d,k,x,y,n,cols,active=0,w=23,gap=8){for(let i=0;i<n;i++)d.rect(k+i,x+(i%cols)*(w+gap),y+Math.floor(i/cols)*(w+gap),w,w,i<active?P.green:P.white,P.line,3);}
function treeNode(d,k,x,y,keys,leaf=false,hi=-1){const w=Math.max(86,keys.length*62+20);d.rect(k,x-w/2,y,w,62,leaf?P.greenLight:P.white,P.green,9);keys.forEach((v,i)=>{if(i===hi)d.rect(k+'hi'+i,x-w/2+10+i*62,y+8,58,46,P.orangeLight,P.orange,5);tx(d,k+'k'+i,x-w/2+40+i*62,y+40,v,26);});return w;}
function branch(d,k,x,y,xx,yy){d.line(k,x,y,xx,yy,P.line,3);}
function heap(d,k,x,y,rows=6,cols=8,sel=[]){for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const i=r*cols+c;d.rect(k+i,x+c*53,y+r*43,45,35,sel.includes(i)?P.orangeLight:P.white,sel.includes(i)?P.orange:P.line,4);}}
function bank(d,k,a,b,y=260){d.rect(k+'a',150,y,350,230,P.greenLight,P.green,18);d.rect(k+'b',780,y,350,230,P.blueLight,P.blue,18);tx(d,k+'al',325,y+55,'A',30);tx(d,k+'bl',955,y+55,'B',30);tx(d,k+'av',325,y+145,'$'+a,62);tx(d,k+'bv',955,y+145,'$'+b,62);tx(d,k+'sum',640,y+265,'Σ '+(a+b),38,a+b===150?P.green:P.red);}
function layer(d,k,x,y,w,label,color=P.blueLight){d.rect(k,x,y,w,95,color,P.line,12);tx(d,k+'t',x+w/2,y+56,label,26);}
function timeline(d,k,x,y,labels,step,spacing=165){d.line(k+'line',x,y,x+(labels.length-1)*spacing,y,P.line,5);labels.forEach((t,i)=>{d.circle(k+'c'+i,x+i*spacing,y,22,i<=step?P.green:P.white,P.line,2);tx(d,k+'t'+i,x+i*spacing,y+63,t,23);});d.circle(k+'moving',x+Math.min(step,labels.length-1)*spacing,y,12,P.orange);}
function flow(d,k,names,step,y=310){names.forEach((name,i)=>{const x=110+i*245;d.box(k+i,x,y,200,110,name,i===step?P.greenLight:P.white,P.line,28);if(i<names.length-1)line(d,k+'a'+i,x+208,y+55,x+237,y+55);});d.circle(k+'dot',150+Math.min(step,names.length-1)*245,y+160,15,P.orange);}
function bars(d,k,labels,vals,step,x=180,y=210,w=780,max=null){const m=max||Math.max(...vals);labels.forEach((l,i)=>{tx(d,k+'l'+i,x,y+i*125+20,l,26);d.rect(k+'b'+i,x+130,y+i*125-18,Math.max(4,(step?vals[i]:0)/m*w),60,i===0?P.orange:P.green,'none',6);if(step)tx(d,k+'v'+i,x+130+(vals[i]/m*w)+55,y+i*125+22,vals[i].toLocaleString(),26);});}
function clock(d,k,x,y,angle){d.circle(k,x,y,54,P.white,P.line,3);d.line(k+'hand',x,y,x+34*Math.cos(angle),y+34*Math.sin(angle),P.orange,5);}
function title(d,words,visual){words.forEach((w,i)=>tx(d,'title'+i,640,120+i*60,w,52));visual();}
function versions(d,step,y=295){const vv=[120,70,50];vv.forEach((v,i)=>{d.rect('v'+i,130+i*350,y,290,170,i===step?P.greenLight:P.white,i===step?P.green:P.line,14,3);tx(d,'balance'+i,275+i*350,y+62,v,44);tx(d,'xmin'+i,275+i*350,y+113,'xmin '+[100,103,107][i],24);tx(d,'xmax'+i,275+i*350,y+146,'xmax '+[103,107,'—'][i],24);if(i<2)line(d,'chain'+i,432+i*350,y+85,466+i*350,y+85);});d.circle('reader',275+step*350,y+230,25,P.blue);line(d,'read',275+step*350,y+200,275+step*350,y+180,P.blue);}
const analyticsRides=[['JFK','card','$36'],['LGA','card','$24'],['JFK','cash','$30']];
function analyticsStorageLayout(d,step) {
  const rides=analyticsRides;
  const fields=['Pickup','Payment','Fare'];
  d.text('storage-query',65,174,'SELECT avg(fare) FROM rides;',29,P.ink,'start');
  d.text('storage-example',1215,174,'Three made-up rides',23,P.muted,'end');
  for (const [side,x] of [['row',45],['column',655]]) {
    const column=side==='column';
    d.rect(side+'-panel',x,204,580,404,P.white,P.line,12);
    d.text(side+'-heading',x+24,235,column?'Column storage':'Row storage',31,P.ink,'start',650);
    d.text(side+'-intro',x+24,269,column?"Keep one field’s values together.":"Keep one ride’s fields together.",24,P.muted,'start');
    for(let group=0;group<3;group++) {
      const y=313+group*96;
      d.text(side+'-group-'+group,x+24,y-17,column?['Pickup locations','Payment types','Fares'][group]:'Ride '+(group+1),22,P.muted,'start',600);
      for(let slot=0;slot<3;slot++) {
        const ride=column?slot:group,field=column?group:slot;
        const key=side+'-ride-'+ride+'-field-'+field;
        const fare=step>=3&&field===2,row=step===1&&!column&&ride===0;
        const fill=fare?P.greenLight:row?P.orangeLight:P.bg;
        const stroke=fare?P.green:row?P.orange:step===2&&column?P.blue:P.line;
        const cx=x+24+slot*177;
        d.rect(key,cx,y,177,60,fill,stroke,0,fare||row?3:1.5);
        d.text(key+'-label',cx+88.5,y+14,column?'Ride '+(ride+1):fields[field],19,P.muted);
        d.text(key+'-value',cx+88.5,y+43,rides[ride][field],28,P.ink,'middle',650);
      }
    }
    d.text(side+'-takeaway',x+290,587,column?'Read fares; skip pickup and payment.':'Fares sit beside other fields.',23,P.ink,'middle',600);
  }
  if(step===4) {
    d.rect('storage-answer',65,623,1150,42,P.greenLight,'none',7);
    d.text('storage-average',640,644,'Same answer: ($36 + $24 + $30) ÷ 3 = $30',28,P.ink,'middle',650);
  }
}
function analyticsSlotLookup(d,step) {
  const fields=['Pickup','Payment','Fare'];
  d.text('lookup-task',640,174,'Find Ride 2: we count slots and positions from 0.',28,P.ink);
  d.rect('row-page',45,207,520,337,P.white,P.line,12);
  d.rect('column-group',615,207,620,337,P.white,P.line,12);
  d.text('row-page-title',305,237,'Row page · block 7',29,P.ink,'middle',650);
  d.text('column-group-title',925,237,'Column chunks · row group 0',29,P.ink,'middle',650);
  d.text('slot-header',91,280,'Slot',23,P.muted);
  fields.forEach((field,i)=>d.text('row-field-'+i,206.5+i*133,280,field,22,P.muted));
  for(let pos=0;pos<3;pos++)d.text('position-'+pos,847.5+pos*145,280,'Position '+pos,22,step>=2&&pos===1?P.blue:P.muted,'middle',step>=2&&pos===1?700:500);
  if(step>=2)d.line('position-guide',992.5,297,992.5,534,P.blue,3,'5 6');
  analyticsRides.forEach((ride,r)=>{
    const y=305+r*79,active=step>=1&&r===1;
    d.text('slot-'+r,91,y+31,r,29,active?P.orange:P.muted,'middle',active?700:500);
    ride.forEach((value,f)=>{
      d.box('row-slot-'+r+'-field-'+f,140+f*133,y,133,62,value,active?P.orangeLight:P.bg,active?P.orange:P.line,28);
    });
  });
  fields.forEach((field,f)=>{
    const y=305+f*79;
    d.text('chunk-label-'+f,690,y+31,field,23,P.muted);
    analyticsRides.forEach((ride,r)=>{
      const active=r===1&&step>=f+2;
      d.box('chunk-'+f+'-position-'+r,780+r*145,y,135,62,ride[f],active?P.blueLight:P.bg,active?P.blue:P.line,28);
    });
  });
  d.text('row-address',305,571,step>=1?'RID (7, 1): block 7, slot 1':'A slot holds a complete record.',25,step>=1?P.orange:P.muted);
  d.text('column-address',925,571,step>=2?'Position 1 in each column chunk':'Positions align within this row group.',25,step>=2?P.blue:P.muted);
  if(step>=2) {
    d.rect('reconstructed-row',190,598,900,42,step===4?P.greenLight:P.blueLight,'none',7);
    d.text('reconstructed-label',640,619,'Ride 2:  '+analyticsRides[1].map((v,i)=>step>=i+2?v:'?').join('   |   '),29,P.ink,'middle',650);
  }
  d.text('position-caveat',640,656,'Positions describe row order. Encoded values may need decoding to locate them.',22,P.muted);
}
// Reuse one tiny dataset so only the query and grouping change.
function analyticsFareScan(d,step,column) {
  const fields=['Pickup','Payment','Fare'];
  d.text('fare-query',640,177,'SELECT avg(fare) FROM rides;',29,P.ink);
  d.rect('scan-storage',45,212,735,332,P.white,P.line,12);
  d.text('scan-heading',412.5,244,column?'Column storage: group by field':'Row storage: group by ride',29,P.ink,'middle',650);
  for(let i=0;i<3;i++)d.text('scan-header-'+i,338.5+i*159,289,column?'Ride '+(i+1):fields[i],23,P.muted);
  for(let group=0;group<3;group++) {
    const y=312+group*74;
    d.text('scan-group-'+group,145,y+31,column?fields[group]:'Ride '+(group+1),25,P.muted);
    for(let slot=0;slot<3;slot++) {
      const ride=column?slot:group,field=column?group:slot,needed=field===2;
      const fill=step===0?P.bg:needed?P.greenLight:column?P.bg:P.orangeLight;
      d.box('scan-ride-'+ride+'-field-'+field,259+slot*159,y,159,62,analyticsRides[ride][field],fill,step>0&&needed?P.green:P.line,28);
    }
  }
  d.rect('scan-calculation',820,212,415,332,P.white,P.line,12);
  d.text('calculation-heading',1027.5,244,'Compute the average',28,P.ink,'middle',650);
  if(step===0) {
    d.text('scan-predict-1',1027.5,340,'Which values',29,P.ink);
    d.text('scan-predict-2',1027.5,382,'does the query need?',29,P.ink);
  } else {
    d.text('fare-inputs',1027.5,318,'$36 + $24 + $30',31,P.green);
    d.text('fare-divisor',1027.5,366,'Divide by 3 rides',26,P.muted);
    if(step===2)d.box('fare-average',886,418,283,73,'Average = $30',P.greenLight,P.green,31);
    else d.text('scan-predict-result',1027.5,452,'Predict the result.',25,P.muted);
  }
  d.text('scan-legend',640,570,step===0?'Same three rides. Only the fare contributes to this query.':column?'Green: fares used. Gray: other column chunks skipped.':'Green: fares used. Orange: other fields stored beside them.',25,P.muted);
  d.text('scan-takeaway',640,618,column?'Read the fare chunk; skip pickup and payment.':'Reading row data can bring along fields the query does not use.',28,P.ink,'middle',650);
  d.text('scan-caveat',640,656,'This shows value grouping. Actual reads depend on pages, caches, and indexes.',21,P.muted);
}
function analyticsQueryChoice(d,step) {
  d.text('workload-meaning',640,177,'A workload is the mix of queries a database runs.',28,P.muted);
  for(const [name,x,column] of [['one',45,false],['many',655,true]]) {
    const active=step===2||(column?step===1:step===0),color=column?P.green:P.orange;
    d.rect(name+'-question',x,216,580,337,P.white,active?color:P.line,12,active?3:2);
    d.text(name+'-heading',x+290,248,column?'Average fares for all rides':'Show all fields of Ride 2',29,P.ink,'middle',650);
    d.text(name+'-needs',x+290,290,column?'Need one field from many rows.':'Need several fields from one row.',25,P.muted);
    ['Pickup','Payment','Fare'].forEach((field,f)=>d.text(name+'-field-'+f,x+173+f*151,337,field,21,P.muted));
    analyticsRides.forEach((ride,r)=>{
      const y=361+r*55;
      d.text(name+'-ride-label-'+r,x+53,y+23,'Ride '+(r+1),21,P.muted);
      ride.forEach((value,f)=>{
        const selected=active&&(column?f===2:r===1);
        d.box(name+'-ride-'+r+'-field-'+f,x+100+f*151,y,146,46,value,selected?(column?P.greenLight:P.orangeLight):P.bg,selected?color:P.line,25);
      });
    });
    d.text(name+'-fit',x+290,588,column?'Columns keep the needed fares together.':'Rows keep the needed fields together.',25,active?color:P.muted,'middle',650);
  }
  d.text('workload-takeaway',640,633,['One ride: row storage keeps its fields together.','Many fares: column storage can skip unrelated fields.','Choose the layout for the queries you run most.'][step],30,P.ink,'middle',650);
  d.text('workload-caveat',640,667,'Both layouts can answer both queries. These are advantages, not a speed guarantee.',20,P.muted);
}
function analyticsParquetFile(d,step) {
  d.text('parquet-definition',640,178,'Parquet is a file format that stores table data by column.',30,P.ink,'middle',650);
  d.text('parquet-table-title',267,234,'Our three rides',28,P.ink,'middle',650);
  d.table('parquet-table',65,264,[145,145,115],[['Pickup','Payment','Fare'],...analyticsRides],{rowHeight:57,fontSize:25});
  d.arrow('parquet-save',510,379,665,379,P.green,3);
  d.text('parquet-save-label',586,350,'save as',23,P.muted);
  d.rect('parquet-file',685,218,550,335,P.white,P.green,12,3);
  d.text('parquet-filename',960,250,'rides.parquet',31,P.green,'middle',650);
  if(step>=1) {
    d.text('parquet-row-group',960,292,'One row group · the same three rides',23,P.muted);
    ['Pickup','Payment','Fare'].forEach((field,f)=>{
      const y=320+f*57,active=step>=2&&f===2;
      d.rect('parquet-chunk-'+f,710,y,500,48,active?P.greenLight:P.bg,active?P.green:P.line,5);
      d.text('parquet-field-'+f,724,y+24,field,23,P.ink,'start',600);
      analyticsRides.forEach((ride,r)=>d.text('parquet-value-'+r+'-'+f,906+r*112,y+24,ride[f],25,P.ink));
    });
    d.box('parquet-metadata',710,505,500,30,'Metadata: field types and where chunks start',P.blueLight,P.blue,20);
  } else {
    d.text('parquet-file-purpose',960,371,'A file that holds the ride data',29,P.ink);
    d.text('parquet-file-location',960,424,'On your laptop or in cloud storage',23,P.muted);
  }
  if(step>=2) {
    d.box('parquet-engine',685,580,350,59,'DuckDB runs AVG(fare)',P.blueLight,P.blue,28);
    d.arrow('parquet-read',860,556,860,575,P.green,3);
    d.text('parquet-read-label',1130,609,'reads fares',23,P.green);
    if(step===3) {
      d.arrow('parquet-result',665,609,385,609,P.blue,3);
      d.text('parquet-result-label',525,587,'calculates',23,P.blue);
      d.box('parquet-answer',65,580,300,59,'Answer: $30',P.greenLight,P.green,29);
    }
  } else {
    d.text('parquet-role',640,610,'The file stores the data. A query engine will read it.',29,P.ink);
  }
  d.text('parquet-takeaway',640,666,step===3?'Column chunks can also be compressed. Next: store the same values in fewer bytes.':'Simplified file: one row group shown. Larger files can contain many row groups.',21,P.muted);
}
function analyticsMonthPartitions(d,step) {
  d.text('partition-query',640,179,'Goal: average fare for December',29,P.ink,'middle',650);
  d.text('partition-definition',640,222,'A partition groups rows by a value. Here, each month gets a folder.',25,P.muted);
  for(let month=0;month<12;month++) {
    const x=70+(month%6)*193,y=271+Math.floor(month/6)*158,active=step===0||month===11;
    d.path('month-folder-'+month,`M ${x} ${y+22} v -22 h 54 l 16 22 h 105 v 114 h -175 z`,active?P.greenLight:P.bg,active?P.green:P.line,2.5);
    d.text('month-folder-'+month+'-name',x+87.5,y+48,'month='+String(month+1).padStart(2,'0'),24,active?P.ink:P.muted,'middle',600);
    d.box('month-file-'+month,x+13,y+68,149,35,'data.parquet',P.white,active?P.green:P.line,20);
    d.text('month-status-'+month,x+87.5,y+121,step===0?'ride data':month!==11?'skip':step===2?'read fare only':'open',20,active?P.green:P.muted);
  }
  d.text('partition-path',640,603,'rides / month=12 / data.parquet',29,P.green,'middle',650);
  d.text('partition-role',640,644,'Partition = group of rows. Folder = how this example stores that group.',24,P.ink);
}
function analyticsByteSavings(d,step) {
  d.text('byte-query',65,176,'Goal: average fare for December',27,P.ink,'start',650);
  d.text('byte-assumption',1215,176,'Toy data · 12 equal months',23,P.muted,'end');
  d.text('byte-columns',395,226,'12 columns: fare + 11 other fields',25,P.ink);
  d.text('byte-month-header',118,263,'Month',21,P.muted,'end');
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  for(let c=0;c<12;c++)d.text('byte-column-'+c,168+c*40,263,c===0?'Fare':String(c+1),19,P.muted);
  months.forEach((month,r)=>{
    d.text('byte-month-'+r,118,296+r*25,month,20,step>=3&&r===11?P.green:P.muted,'end');
    for(let c=0;c<12;c++) {
      const active=step===1||step===2&&c===0||step>=3&&r===11&&c===0;
      const color=step===1?P.orange:step===2?P.blue:P.green;
      const fill=step===1?P.orangeLight:step===2?P.blueLight:P.greenLight;
      d.rect('payload-month-'+r+'-column-'+c,151+c*40,285+r*25,34,22,active?fill:P.white,active?color:P.line,2,active?2:1);
    }
  });
  d.text('byte-square-meaning',385,610,'One square = one month of one column',23,P.ink);
  d.text('byte-square-size',385,642,'5,000 values × 8 bytes = 40 KB',25,P.muted);
  const cards=[
    ['1. All table values','5.76 MB','60,000 rows × 12 columns × 8 bytes','144 squares · full-table starting point',P.orange],
    ['2. Keep only fare','480 KB','60,000 rows × 1 column × 8 bytes','12 squares · divide bytes by 12',P.blue],
    ['3. Keep December','40 KB','5,000 rows × 1 column × 8 bytes','1 square · divide bytes by 12 again',P.green]
  ];
  cards.forEach(([heading,bytes,formula,count,color],i)=>{
    if(step<i+1)return;
    const y=231+i*112;
    d.rect('byte-card-'+i,700,y,535,101,P.white,color,9);
    d.text('byte-card-'+i+'-heading',720,y+24,heading,24,P.ink,'start',650);
    d.text('byte-card-'+i+'-bytes',1215,y+24,bytes,28,color,'end',650);
    d.text('byte-card-'+i+'-formula',720,y+56,formula,23,P.ink,'start');
    d.text('byte-card-'+i+'-count',720,y+83,count,21,P.muted,'start');
  });
  if(step===0) {
    d.text('byte-setup-rows',968,295,'60,000 rides across 12 months',27,P.ink);
    d.text('byte-setup-month',968,343,'5,000 rides in every month',27,P.ink);
    d.text('byte-setup-value',968,391,'Each field value uses 8 bytes',27,P.ink);
    d.text('byte-setup-prompt',968,489,'How much data is in all 144 squares?',25,P.blue);
  }
  if(step===4) {
    d.text('byte-question',968,593,'We kept 1 of 144 equal squares.',27,P.green,'middle',650);
    d.text('byte-question-detail',968,632,'What fraction of the data is left?',25,P.ink);
  }
  if(step===5) {
    d.text('byte-ratio',968,593,'5,760 KB ÷ 40 KB = 144',29,P.green,'middle',650);
    d.text('byte-ratio-meaning',968,632,'1/144 of the full value data remains.',25,P.ink);
  }
  d.text('byte-caveat',640,666,'Value bytes only; metadata, encoding, and compression excluded. This is not a speed ratio.',20,P.muted);
}
const analyticsMLSQL={
  train:[
    'CREATE TABLE fare_model AS',
    'SELECT',
    '  regr_intercept(fare, distance) AS intercept,',
    '  regr_slope(fare, distance) AS slope,',
    '  count(*) AS training_rows',
    'FROM fare_features',
    "WHERE split = 'train';"
  ],
  score:[
    'CREATE VIEW held_out_predictions AS',
    'SELECT r.ride_id, r.distance, r.fare,',
    '  m.intercept + m.slope * r.distance',
    '    AS predicted_fare',
    'FROM fare_features AS r',
    'CROSS JOIN fare_model AS m',
    "WHERE r.split = 'test';"
  ],
  evaluate:[
    'SELECT count(*) AS test_rows,',
    '  avg(abs(fare - predicted_fare)) AS mae,',
    '  sqrt(avg(pow(fare - predicted_fare, 2)))',
    '    AS rmse',
    'FROM held_out_predictions;'
  ],
  predict:[
    'SELECT r.ride_id, r.distance,',
    '  m.intercept + m.slope * r.distance',
    '    AS predicted_fare',
    'FROM (VALUES (7, 3.5)) AS r(ride_id, distance)',
    'CROSS JOIN fare_model AS m;'
  ],
  cloudTrain:[
    'CREATE MODEL `YOUR_PROJECT.demo.fare_model`',
    'OPTIONS (',
    "  model_type = 'linear_reg',",
    "  input_label_cols = ['fare'],",
    "  data_split_method = 'NO_SPLIT',",
    "  optimize_strategy = 'NORMAL_EQUATION',",
    '  l2_reg = 0.0',
    ') AS',
    'SELECT distance, fare',
    'FROM `YOUR_PROJECT.demo.ml_rides`',
    "WHERE split = 'train'",
    '  AND distance > 0 AND fare >= 0;'
  ],
  cloudEvaluate:[
    'SELECT mean_absolute_error, mean_squared_error',
    'FROM ML.EVALUATE(',
    '  MODEL `YOUR_PROJECT.demo.fare_model`,',
    '  (SELECT distance, fare',
    '   FROM `YOUR_PROJECT.demo.ml_rides`',
    "   WHERE split = 'test'",
    '     AND distance > 0 AND fare >= 0)',
    ');'
  ],
  cloudPredict:[
    'SELECT ride_id, distance, predicted_fare',
    'FROM ML.PREDICT(',
    '  MODEL `YOUR_PROJECT.demo.fare_model`,',
    '  (SELECT 7 AS ride_id, 3.5 AS distance)',
    ');'
  ]
};
function analyticsSQL(d,lines,active=[],spacing=43) {
  d.rect('ml-sql-background',45,230,740,361,P.white,P.line,10);
  lines.forEach((text,i)=>{
    const y=255+i*spacing,selected=active.includes(i);
    if(selected)d.rect('ml-sql-highlight-'+i,57,y-17,716,35,P.greenLight,'none',4);
    d.add('ml-sql-line-'+i,'text',{x:67,y,fill:selected?P.green:P.ink,'font-size':23,'font-family':'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace','text-anchor':'start','dominant-baseline':'middle','xml:space':'preserve',style:'white-space: pre; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;'},text);
  });
}
function analyticsTrainSQL(d,step) {
  d.text('ml-task',640,175,'Can distance help predict fare? Learn a line from four made-up rides.',27,P.ink);
  d.text('ml-code-title',65,207,'DuckDB SQL',24,P.blue,'start',650);
  analyticsSQL(d,analyticsMLSQL.train,[[],[5,6],[2,3,4],[0],[2,3]][step]);
  if(step<3) {
    d.text('ml-data-heading',1020,207,'fare_features',25,P.ink,'middle',650);
    d.table('ml-input',825,230,[150,100,155],[['distance','fare','split'],[1,6,'train'],[2,6,'train'],[3,8,'train'],[4,12,'train'],[2.5,9,'test'],[4.5,11,'test']],{rowHeight:47,fontSize:25,highlightRows:step>0?[1,2,3,4]:[]});
    d.text('ml-kept',1027,582,step===0?'4 training rides + 2 test rides':'Only the four train rows fit the line.',22,step===0?P.muted:P.orange);
  } else {
    d.text('ml-data-heading',1020,207,'Saved table: fare_model',25,P.green,'middle',650);
    d.table('ml-model',825,257,[145,105,155],[['intercept','slope','training_rows'],[3,2,4]],{rowHeight:66,fontSize:22});
    d.text('ml-model-inspect',1027,421,'SELECT * FROM fare_model;',22,P.muted);
    d.text('ml-model-meaning',1027,475,'SQL learned 3 and 2 from the rides.',23,P.ink);
    d.text('ml-model-size',1027,521,'One saved row holds this model.',23,P.muted);
  }
  d.text('ml-input-definition',65,622,'Feature = distance (miles). Label = fare (dollars).',25,P.ink,'start');
  d.text('ml-function-order',65,657,'Regression arguments: outcome first, input second.',22,P.muted,'start');
  if(step===4)d.text('ml-learned-line',1027,622,'predicted fare = 3 + 2 × distance',25,P.green,'middle',650);
  else d.text('ml-training-boundary',1027,632,'Test rides stay out of training.',24,P.orange);
}
function analyticsScoreSQL(d,step) {
  const stage=step<3?'score':step===3?'evaluate':'predict';
  d.text('ml-task',640,175,step<4?'Check the saved line on rides it did not learn from.':'Use the same saved line for a new 3.5-mile ride.',28,P.ink);
  d.text('ml-code-title',65,207,'DuckDB SQL · '+(stage==='score'?'predict test fares':stage==='evaluate'?'measure error':'predict a new fare'),24,P.blue,'start',650);
  analyticsSQL(d,analyticsMLSQL[stage],step===0?[4,6]:step===1?[2,3,5]:step===2?[0]:step===3?[1]:step===4?[3,4]:[1,2]);
  d.text('ml-model-summary',1027,207,'fare_model: intercept 3, slope 2',24,P.green,'middle',650);
  if(step<3) {
    d.table('ml-test',825,257,[135,115,155],[['miles','actual $','predicted $'],[2.5,9,step===2?8:'?'],[4.5,11,step===2?12:'?']],{rowHeight:67,fontSize:25});
    d.text('ml-test-prompt',1027,516,step===2?'The view now holds both predictions.':'Predict both fares before advancing.',23,P.ink);
    d.text('ml-test-formula',1027,555,'3 + 2 × distance',28,P.green);
  } else if(step===3) {
    d.table('ml-error',825,257,[135,135,135],[['actual $','predicted $','miss $'],[9,8,1],[11,12,1]],{rowHeight:67,fontSize:24});
    d.text('ml-error-name',1027,506,'MAE = mean absolute error',24,P.ink);
    d.text('ml-error-result',1027,548,'($1 + $1) ÷ 2 = $1',30,P.green,'middle',650);
    d.text('ml-rmse-result',1027,586,'RMSE is also $1 in this example.',23,P.muted);
  } else {
    d.table('ml-new',825,257,[170,235],[['distance','predicted_fare'],[3.5,step===5?10:'?']],{rowHeight:75,fontSize:26});
    d.text('ml-new-calculation',1027,477,step===5?'3 + 2 × 3.5 = $10':'What will the saved line predict?',27,P.green);
    d.text('ml-new-input',1027,536,'Only distance is needed as input.',24,P.ink);
  }
  d.text('ml-score-takeaway',640,623,step===3?'The toy test error is $1. Two made-up rides do not establish real-world accuracy.':step>=4?'Prediction reuses fare_model. This query does not train it again.':'CROSS JOIN pairs each test ride with the one saved model row.',26,P.ink);
  d.text('ml-score-source',640,662,'Run the complete example: lectures/lecture-10/in_database_ml.py',21,P.muted);
}
const analyticsPyTorchCode=[
  [
    'reader = con.execute("""',
    '    SELECT distance, fare FROM features',
    '    WHERE month <= 10',
    '    -- Mix rides before forming batches.',
    '    ORDER BY hash(ride_id)',
    '""").to_arrow_reader(batch_size=1024)'
  ],
  [
    'model = nn.Sequential(',
    '    nn.Linear(1, 16), nn.ReLU(),',
    '    nn.Linear(16, 1))',
    '',
    '# Repeat these steps for each training batch:',
    'prediction = model((x - x_mean) / x_std)',
    'loss = loss_fn(prediction, (y - y_mean) / y_std)',
    'optimizer.zero_grad()',
    'loss.backward()',
    'optimizer.step()'
  ],
  [
    'con.create_function(',
    '    "predict_fare_nn",',
    '    predict_fare,',
    '    ["DOUBLE"], "DOUBLE",',
    '    type="arrow")'
  ],
  [
    'SELECT ride_id, distance, fare,',
    '       predict_fare_nn(distance) AS predicted_fare',
    'FROM features',
    'WHERE month >= 11;'
  ],
  [
    'SELECT',
    '  avg(abs(fare - linear_fare)) AS linear_mae,',
    '  avg(abs(fare - neural_fare)) AS neural_mae',
    'FROM predictions;'
  ]
];
function analyticsPyTorchScaling(d,step) {
  // Illustrative batch: these assumed full-training-set statistics are not fitted from these two rows.
  const xMean=3,xStd=2,yMean=20,yStd=10;
  const rides=[{id:'A',x:3,y:20,prediction:0.2},{id:'B',x:5,y:30,prediction:0.8}];
  const target=ride=>(ride.y-yMean)/yStd;
  const loss=rides.reduce((sum,ride)=>sum+(ride.prediction-target(ride))**2,0)/rides.length;
  d.text('torch-example-context',640,175,'Made-up example. Use statistics already learned from the full training set.',25,P.muted);
  const code=step===3
    ? ['# Convert the model output back to dollars', 'fares = model((x - x_mean) / x_std) * y_std + y_mean']
    : ['prediction = model((x - x_mean) / x_std)', 'loss = loss_fn(prediction, (y - y_mean) / y_std)'];
  d.rect('torch-detail-code',45,207,1190,110,P.white,P.line,10);
  code.forEach((text,i)=>{
    const y=239+i*44,active=step===0?i===0:step===1||i===1;
    if(active)d.rect('torch-detail-highlight-'+i,57,y-18,1166,36,P.greenLight,'none',4);
    d.add('torch-detail-line-'+i,'text',{x:70,y,fill:active?P.green:P.muted,'font-size':27,'font-family':'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace','text-anchor':'start','dominant-baseline':'middle','xml:space':'preserve',style:'white-space: pre; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;'},text);
  });
  const headers=[
    ['Ride','Distance x','Subtract the mean','Divide by std'],
    ['Ride','Recorded fare y','Scaled target','Model prediction'],
    ['Ride','Prediction','Scaled target','Error','Squared error'],
    ['Ride','Scaled prediction','Back to dollars','Recorded fare']
  ][step];
  const rows=rides.map(ride=>{
    if(step===0)return [ride.id,ride.x+' miles',`${ride.x} − ${xMean} = ${ride.x-xMean}`,`${ride.x-xMean} ÷ ${xStd} = ${(ride.x-xMean)/xStd}`];
    if(step===1)return [ride.id,'$'+ride.y,`(${ride.y} − ${yMean}) ÷ ${yStd} = ${target(ride)}`,ride.prediction];
    if(step===2)return [ride.id,ride.prediction,target(ride),`${ride.prediction} − ${target(ride)} = ${(ride.prediction-target(ride)).toFixed(1)}`,((ride.prediction-target(ride))**2).toFixed(2)];
    return [ride.id,ride.prediction,`${ride.prediction} × ${yStd} + ${yMean} = $${ride.prediction*yStd+yMean}`,'$'+ride.y];
  });
  d.text('torch-detail-stats',640,350,[
    'x = distance in miles.  x_mean = 3 miles.  x_std = 2 miles.',
    'y = recorded fare.  y_mean = $20.  y_std = $10.',
    'loss_fn = nn.MSELoss(): mean squared error across this batch.',
    'Reuse the saved fare statistics: y_std = $10 and y_mean = $20.'
  ][step],27,P.ink);
  d.text('torch-detail-explanation',640,380,[
    'mean is the training average. std is the standard deviation, a measure of spread.',
    'The network predicts the scaled fare. Scale the recorded fare to match.',
    'Subtract the target, square each error, then take the average.',
    'Multiply by the fare std, then add the fare mean.'
  ][step],23,P.muted);
  d.table('torch-detail-table',65,414,step===2?[100,235,235,290,290]:[100,275,420,355],[headers,...rows],{rowHeight:51,fontSize:25});
  d.text('torch-detail-result',640,603,[
    '0 means the average distance. 1 means one std above the average.',
    'Assume this model currently predicts 0.2 and 0.8 for the two rides.',
    `loss = (0.04 + 0.04) ÷ 2 = ${loss.toFixed(2)}`,
    'The predictions are $22 and $28. Each is $2 away from the recorded fare.'
  ][step],step===2?32:25,step===2?P.green:P.ink);
  d.text('torch-detail-takeaway',640,635,[
    'Scaling keeps typical inputs near 0 and on a similar scale, which can help training.',
    'Both values use the same fare scale. The model receives distance as its input.',
    'Weights change later at optimizer.step(), after loss.backward().',
    'Training loss was 0.04 on scaled fares. The later MAE measures dollar errors.'
  ][step],23,P.muted);
  d.link('torch-lab-link',65,668,'Read the line-by-line explanation','../labs/lab-08/duckdb.html#pytorch-scaling',22);
}
function analyticsPyTorchArrow(d,step) {
  d.text('torch-arrow-definition',640,175,'Apache Arrow is a format for columns of values in memory.',27,P.ink);
  d.rect('torch-arrow-code-panel',45,207,1190,127,P.white,P.line,10);
  [
    'con.create_function("predict_fare_nn", predict_fare,',
    '                    ["DOUBLE"], "DOUBLE",',
    '                    type="arrow")'
  ].forEach((text,i)=>{
    const y=235+i*38,active=i===(step===0?2:0);
    if(active)d.rect('torch-arrow-code-highlight-'+i,57,y-18,1166,36,P.greenLight,'none',4);
    d.add('torch-arrow-code-line-'+i,'text',{x:70,y,fill:active?P.green:P.ink,'font-size':27,'font-family':'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace','text-anchor':'start','dominant-baseline':'middle','xml:space':'preserve',style:'white-space: pre; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;'},text);
  });
  d.text('torch-arrow-example',640,355,'Illustrative batch from the previous example',22,P.muted);
  d.text('torch-arrow-input-title',217,388,'Arrow input',27,P.blue,'middle',650);
  d.text('torch-arrow-callback-title',640,388,'Python callback',27,P.ink,'middle',650);
  d.text('torch-arrow-output-title',1062,388,'Arrow output',27,P.green,'middle',650);
  d.table('torch-arrow-input',65,414,[120,185],[['Position','Distance (mi)'],['0','3.0'],['1','5.0']],{rowHeight:51,fontSize:23});
  d.arrow('torch-arrow-to-python',381,490,428,490,P.blue,3);
  d.rect('torch-arrow-callback',440,414,400,153,step?P.greenLight:P.white,step?P.green:P.line,10);
  [
    'predict_fare(distances)',
    'Convert distances to tensors',
    'Apply the trained model',
    'Return pa.array(...)'
  ].forEach((text,i)=>d.text('torch-arrow-callback-line-'+i,640,440+i*35,text,i===0?25:23,i===0?P.ink:step?P.green:P.muted,'middle',i===0?650:500));
  d.arrow('torch-arrow-to-sql',852,490,899,490,step?P.green:P.line,3);
  d.table('torch-arrow-output',910,414,[120,185],[['Position','Fare ($)'],['0',step?'22.0':'?'],['1',step?'28.0':'?']],{rowHeight:51,fontSize:23});
  d.text('torch-arrow-contract',640,610,step
    ? 'Return one fare per input distance, in the same batch position.'
    : 'type="arrow" sends many values to Python in one function call.',26,P.ink);
  d.text('torch-arrow-benefit',640,642,step
    ? 'SQL gets one result per ride. This callback reuses the trained model.'
    : 'Batch calls reduce Python call overhead. DuckDB chooses the batch size.',23,P.muted);
  d.link('torch-lab-link',65,670,'Read about Arrow functions','../labs/lab-08/duckdb.html#pytorch-arrow',22);
}
function analyticsPyTorch(d,step) {
  // Pause after the network diagram to unpack prediction, loss, and conversion to dollars.
  if(step>=2&&step<=5){analyticsPyTorchScaling(d,step-2);return;}
  if(step===7||step===8){analyticsPyTorchArrow(d,step-7);return;}
  if(step>=9)step-=6;
  else if(step===6)step=2;
  d.text('ml-task',640,175,step===2
    ? 'Apache Arrow stores columns in memory. type="arrow" enables batch calls.'
    : 'Lab 8: 60,000 real taxi rides. Predict fare from distance.',27,P.ink);
  d.text('ml-code-title',65,207,[
    'Python · DuckDB selects training batches',
    'Python · PyTorch learns the weights (excerpts)',
    'Python · register the prediction function',
    'DuckDB SQL · predict fares for test rides',
    'DuckDB SQL · compare the two models'
  ][step],24,P.blue,'start',650);
  analyticsSQL(d,analyticsPyTorchCode[step],[[2,4,5],[1,2,5,6,8,9],[1,2,4],[1,3],[1,2]][step],step===1?33:55);
  if(step===1) {
    const input={x:862,y:417.5},output={x:1192,y:417.5};
    const hidden=Array.from({length:16},(_,i)=>({x:1027,y:290+i*17}));
    // Draw every weighted connection behind the nodes, matching Linear(1,16) and Linear(16,1).
    hidden.forEach((node,i)=>{
      d.line('torch-input-weight-'+i,input.x,input.y,node.x,node.y,P.blue,1.5);
      d.line('torch-output-weight-'+i,node.x,node.y,output.x,output.y,P.green,1.5);
    });
    d.circle('torch-input-node',input.x,input.y,19,P.blueLight,P.blue,2);
    hidden.forEach((node,i)=>d.circle('torch-hidden-node-'+i,node.x,node.y,7.5,P.blueLight,P.blue,2));
    d.circle('torch-output-node',output.x,output.y,19,P.greenLight,P.green,2);
    [['1 input','Distance',input.x,P.blue],['16 hidden','ReLU',1027,P.blue],['1 output','Fare',output.x,P.green]].forEach(([count,label,x,color],i)=>{
      d.text('torch-layer-count-'+i,x,232,count,23,color,'middle',650);
      d.text('torch-layer-label-'+i,x,259,label,22,P.ink);
    });
    d.text('torch-weight-meaning',1027,573,'Each line is a learned weight.',22,P.ink);
    d.text('torch-network-detail',1027,597,'Scaling and biases are omitted here.',18,P.muted);
  } else if(step<3) {
    const boxes=step===0
      ? [['DuckDB','50,000 training rides'],['Arrow batches','Up to 1,024 rows per batch'],['PyTorch tensors','Distances x and fares y']]
      : [['SQL function name','predict_fare_nn'],['Python function','predict_fare'],['Batch interface','Arrow inputs and outputs']];
    boxes.forEach(([heading,detail],i)=>{
      const y=245+i*119;
      d.rect('torch-flow-'+i,825,y,405,85,i===1?P.blueLight:P.greenLight,i===1?P.blue:P.green,10);
      d.text('torch-flow-heading-'+i,1027,y+27,heading,25,P.ink,'middle',650);
      d.text('torch-flow-detail-'+i,1027,y+61,detail,24,P.ink);
      if(i<2)d.arrow('torch-flow-arrow-'+i,1027,y+90,1027,y+113,P.green,3);
    });
    d.text('torch-flow-note',1027,594,step===0?'Reserve Nov–Dec for testing.':'This function reuses the learned weights.',22,P.muted);
  } else if(step===3) {
    d.text('torch-test-heading',1027,232,'Two of the 10,000 test rides',24,P.ink,'middle',650);
    d.table('torch-test',825,272,[115,135,155],[['miles','actual $','predicted $'],['2.00','20.50','15.17'],['0.94','10.00','9.50']],{rowHeight:69,fontSize:24});
    d.text('torch-test-note',1027,527,'Predictions from the completed lab run.',22,P.muted);
    d.text('torch-test-boundary',1027,569,'These fares did not train the model.',23,P.green);
  } else {
    d.text('torch-error-heading',1027,251,'Mean absolute error (MAE)',26,P.ink,'middle',650);
    [['Straight line',3.53,P.orangeLight,P.orange],['Neural network',3.26,P.greenLight,P.green]].forEach(([name,mae,fill,stroke],i)=>{
      const y=306+i*128;
      d.text('torch-error-name-'+i,840,y,name,25,P.ink,'start');
      d.rect('torch-error-bar-'+i,840,y+26,mae*75,48,fill,stroke,5);
      d.text('torch-error-value-'+i,1213,y+51,'$'+mae.toFixed(2),28,stroke,'end',650);
    });
    d.text('torch-error-sample',1027,558,'Same 10,000 test rides. Lower is better.',22,P.muted);
    d.text('torch-error-caveat',1027,594,'One run; a larger model may not win.',22,P.muted);
  }
  d.text('torch-takeaway',65,626,[
    'Hash order mixes training rides so batches do not follow date order.',
    'Create the model once. PyTorch then updates its weights for each batch.',
    'predict_fare converts distances to tensors and calls the trained network.',
    'SQL calls the Python function. PyTorch predicts without training again.',
    'Both models use distance. Compare prediction errors on the same reserved rides.'
  ][step],24,P.ink,'start');
  d.link('torch-lab-link',65,662,'Open the full Lab 8 example','../labs/lab-08/duckdb.html#pytorch',22);
  d.text('torch-local-context',1215,662,'Local CPU · no cloud account',22,P.muted,'end');
}
function analyticsCloudML(d,step) {
  d.text('ml-task',640,175,'BigQuery ML is Google’s service for training models through SQL.',28,P.ink);
  d.text('ml-code-title',65,207,'GoogleSQL · '+['train','evaluate','predict'][step],24,P.blue,'start',650);
  analyticsSQL(d,analyticsMLSQL[['cloudTrain','cloudEvaluate','cloudPredict'][step]],step===0?[0,3,10]:step===1?[1,5]:[1,3],step===0?29:40);
  const copy=[
    ['CREATE MODEL learns','distance is the input.','fare is the outcome to predict.','Use only training rows.','Save the result as fare_model.'],
    ['ML.EVALUATE checks','Give it the two test rides.','Their fares were kept out of training.','Compare predicted and actual fares.','Return error metrics such as MAE.'],
    ['ML.PREDICT applies','Give it a new distance: 3.5.','Reuse the saved fare_model.','The output includes predicted_fare.','No actual fare is needed to predict.']
  ][step];
  copy.forEach((label,i)=>d.text('ml-cloud-explanation-'+i,1027,267+i*65,label,i===0?28:23,i===0?P.green:P.ink,'middle',i===0?650:500));
  d.text('ml-cloud-setup',640,623,'Replace YOUR_PROJECT with your project ID. Load demo.ml_rides first.',25,P.ink);
  d.text('ml-cloud-context',640,662,'Optional cloud example. Setup and billing details are in the reading. Local demo uses DuckDB.',21,P.muted);
}
function analyticsMLResources(d) {
  const links=[
    ['DuckDB + PyTorch: predictions in SQL', 'Official example: a SQL function calls a trained PyTorch model.', 'https://duckdb.org/2023/07/07/python-udf#predicting-taxi-fare-costs-ibis--pyarrow-udf'],
    ['DuckDB ML extension', 'Community project: train models through SQL, including a small neural network.', 'https://duckdb.org/community_extensions/extensions/ml'],
    ["The Duck’s Brain", 'Research paper: neural-network training and prediction expressed in SQL.', 'https://arxiv.org/abs/2312.17355'],
    ['Try it in Lab 8: can a neural network predict fares?', 'Core lab: compare a neural network with a straight-line baseline and query the errors.', '../labs/lab-08/duckdb.html#pytorch']
  ];
  links.forEach(([label,description,href],i)=>{
    const y=205+i*115;
    d.link('ml-resource-'+i,85,y,label,href,30);
    d.text('ml-resource-description-'+i,85,y+43,description,24,P.muted,'start');
  });
  d.text('ml-resource-hint',640,641,'Select an underlined title to open it. Lab 8 runs on a CPU with no cloud account.',23,P.ink);
}
function analyticsBatchPipeline(d,step) {
  const xs=[65,480,895],w=320;
  d.text('pipeline-query',65,176,'SELECT fare FROM rides WHERE fare > 25;',27,P.ink,'start');
  d.text('pipeline-example',1215,176,'Three made-up rides',22,P.muted,'end');
  d.text('microdb-label',65,222,'microdb · Labs 4–5 · one current row per successful next()',26,P.ink,'start',650);
  const rowStates=[
    ['36, 24, 30','fare > 25?','Only expose fare'],
    ['Current fare: 36','36 > 25: keep','get_val: 36'],
    ['24, then 30','24 fails; 30 passes','get_val: 30'],
    ['Read 36, 24, 30','Keep 36 and 30','36, then 30']
  ];
  ['TableScan','SelectScan','ProjectScan'].forEach((name,i)=>{
    const x=xs[i],active=step===1||step===2;
    d.rect('row-operator-'+i,x,250,w,130,active?P.orangeLight:P.white,active?P.orange:P.line,10);
    d.text('row-operator-'+i+'-name',x+w/2,278,name,28,P.ink,'middle',650);
    d.text('row-operator-'+i+'-job',x+w/2,311,['Find a row','Test the condition','Expose chosen fields'][i],23,P.muted);
    d.text('row-operator-'+i+'-value',x+w/2,348,rowStates[Math.min(step,3)][i],27,P.ink);
    if(i<2)d.arrow('row-values-'+i,x+w+12,332,xs[i+1]-16,332,P.green,3);
  });
  d.text('pull-call',640,407,'Caller: ProjectScan.next() → SelectScan.next() → TableScan.next()',23,P.muted);
  if(step>=3) {
    d.text('batch-label',65,447,'Batch version of the same plan · illustration',26,P.blue,'start',650);
    ['Read batch','Filter batch','Project fare'].forEach((name,i)=>{
      const x=xs[i],ready=step>=i+3;
      d.rect('batch-operator-'+i,x,474,w,125,ready?P.blueLight:P.white,ready?P.blue:P.line,10);
      d.text('batch-operator-'+i+'-name',x+w/2,501,name,28,P.ink,'middle',650);
      d.text('batch-operator-'+i+'-job',x+w/2,533,['Several rows at once','Test fare > 25 for each','Expose the fare values'][i],22,P.muted);
      d.text('batch-operator-'+i+'-value',x+w/2,570,ready?['[36, 24, 30]','[keep, drop, keep]','[36, 30]'][i]:'—',i===1?25:29,ready?P.blue:P.muted);
      if(i<2&&step>=i+4)d.arrow('batch-values-'+i,x+w+12,551,xs[i+1]-16,551,P.blue,4);
    });
  } else {
    d.rect('microdb-explanation',65,476,1150,123,P.white,P.line,10);
    d.text('microdb-result',640,509,['Before iteration: no current result row.','First successful next(): read fare 36.','Second successful next(): skip 24, then read fare 30.'][step],28,P.ink);
    d.text('microdb-pages',640,547,'TableScan reads pages, but its scan interface exposes one row at a time.',25,P.muted);
    d.text('microdb-prompt',640,581,'What if these operators handled several rows in each call?',25,P.blue);
  }
  d.text('batch-takeaway',640,634,step===5?'Same fares: 36 and 30. Batching shares the call overhead.':step>=3?'Same scan, filter, and projection jobs; more rows per handoff.':"next() selects one match; get_val('fare') reads its value.",27,P.ink,'middle',650);
  if(step>=3)d.text('batch-scale',640,664,'Toy batch: 3 rows. Batch processing still tests each fare.',21,P.muted);
}
const draws={
6:[
(d,s)=>title(d,['B+ trees'],()=>{heap(d,'h',120,300,5,8,s? [14]:[]);treeNode(d,'r',920,290,[36]);treeNode(d,'l',800,460,[28,31],true);treeNode(d,'rr',1060,460,[36,39],true);branch(d,'bl',920,352,800,460);branch(d,'br',920,352,1060,460);if(s)line(d,'link',790,520,435,360,P.orange);}),
(d,s)=>{tx(d,'query',640,150,'Find uid = 77777',40);heap(d,'h',170,220,6,18,Array.from({length:[0,54,108][s]},(_,i)=>i));tx(d,'counter',640,540,['Start the scan','50,000 rows checked','100,000 rows checked'][s],38);tx(d,'blocks',640,598,['The heap is not ordered by uid','147 of 294 heap blocks visited','All 294 heap blocks visited'][s],29);tx(d,'caption',640,660,'Schematic: each square represents part of the table.',23,P.muted);},
(d,s)=>{tx(d,'heading',640,150,'Value → row address → row',42);d.box('key',85,285,230,115,'GPA 36',P.greenLight,P.green,34);if(s>=1){line(d,'a',330,342,465,342);d.box('rid',485,285,290,115,'(0, 4)',P.orangeLight,P.orange,38);tx(d,'rid-caption',630,465,'block 0, slot 4',28);}if(s>=2){line(d,'b',790,342,915,342);d.box('row',935,285,250,115,'eli, GPA 36',P.blueLight,P.blue,30);}tx(d,'meaning',640,575,['The search key is a field value.','The index returns a RID: a row address.','The table scan uses that address to fetch the row.'][s],30);},
(d,s)=>{tx(d,'op',640,135,['Find one value: key = 31','Insert a new key','Find a range: 31 through 37'][s],39);const rows=[['Structure',['Lookup work','Insertion work','Range work'][s]],['Heap',['Scan rows','Find a free slot','Scan rows'][s]],['Sorted array',['Binary search','May shift many entries','Find start, read forward'][s]],['Hash index',['Choose a bucket','Update a bucket','No key order to follow'][s]],['B+ tree',['Follow one tree path','Insert; split if needed','Find start, follow leaves'][s]]];d.table('choices',150,220,[310,670],rows,{rowHeight:75,fontSize:28});},
(d,s)=>{treeNode(d,'single',640,300,[1,2,3,4].slice(0,s+1),true);tx(d,'root-label',640,235,'The root is also the only leaf.',30);tx(d,'capacity',640,450,(s+1)+' of 4 key slots used',36);tx(d,'rule',640,550,s===3?'Four keys fit. The next distinct key needs a split.':'Keep the leaf keys in sorted order.',29);},
(d,s)=>{treeNode(d,'root',640,205,[36]);branch(d,'a',640,267,350,420);branch(d,'b',640,267,930,420);treeNode(d,'left',350,420,[28,31,34],true);treeNode(d,'right',930,420,[36,37,39],true);tx(d,'root-label',640,155,'Root: the separator gives directions',30);tx(d,'left-label',315,330,'below 36',29);tx(d,'right-label',960,330,'36 or above',29);if(s>0){line(d,'chain',478,515,800,515);tx(d,'chain-label',640,560,'next leaf',24,P.green);}if(s>1){tx(d,'rid',640,625,'Leaf entry: 36 → [(0, 4)]',30,P.orange);}else tx(d,'leaf-label',640,625,'Both leaves are one step below the root.',29);},
(d,s)=>{if(s===0){treeNode(d,'left',640,360,[28,31,37,39],true);chip(d,'new',595,160,36,P.orangeLight,90);}else{treeNode(d,'left',380,440,s===1?[28,31]:[28,31,34],true);treeNode(d,'right',900,440,[36,37,39],true);treeNode(d,'root',640,220,[36]);branch(d,'l',640,282,380,440);branch(d,'r',640,282,900,440);line(d,'chain',475,545,775,545);if(s===1){d.path('copy','M 900 420 Q 950 260 700 250','none',P.orange,4);}}},
(d,s)=>{treeNode(d,'root',640,175,[36],false,s>0?0:-1);treeNode(d,'l',370,395,[28,31,34],true,s===3?2:-1);treeNode(d,'r',910,395,[36,37,39],true,s===2?1:-1);branch(d,'al',640,237,370,395);branch(d,'ar',640,237,910,395);tx(d,'query',200,130,s===3?'35?':'37?',42);d.circle('search',s===0?200:s===1?640:s===2?910:370,s===0?190:s===1?145:360,18,P.orange);if(s===2){line(d,'rid',910,475,910,550,P.orange);chip(d,'heaprow',810,565,'(0, 2)',P.orangeLight,200);}},
(d,s)=>{treeNode(d,'root',640,175,[36]);treeNode(d,'l',350,365,[28,31,34],true);treeNode(d,'r',920,365,[36,37,39],true);branch(d,'a',640,237,350,365);branch(d,'b',640,237,920,365);line(d,'chain',480,440,775,440);tx(d,'range',200,125,'[31, 37]',38);const list=[31,34,36,37];list.slice(0,s===0?0:s===1?2:4).forEach((v,i)=>chip(d,'out'+i,390+i*110,550,v,P.orangeLight));d.circle('cursor',s===0?640:s===1?350:920,s===0?150:330,18,P.orange);if(s===3)tx(d,'stop',1080,500,'39 > 37',28,P.red);},
(d,s)=>{treeNode(d,'root',640,180,s<2?[3]:[3,5]);const leaves=s<2?[[1,2],s===0?[3,4,5]:[3,4,5,6]]:[[1,2],[3,4],[5,6,7]];leaves.forEach((ks,i)=>{let x=leaves.length===2?380+i*520:260+i*380;branch(d,'br'+i,640,242,x,405);treeNode(d,'leaf'+i,x,405,ks,true);});if(s<2)chip(d,'in',595,550,s===0?'6?':'7?',P.orangeLight,90);},
(d,s)=>{const root=s===0?[3,5,7,9]:s===1?[3,5,7,9,11]:[7];treeNode(d,'root',640,150,root);if(s<2){const xx=s===0?[170,380,590,800,1050]:[160,350,540,730,920,1110];xx.forEach((x,i)=>{branch(d,'b'+i,640,212,x,420);const ks=s===0&&i===4?[9,10,11,12]:s===1&&i===5?[11,12,13]:[i*2+1,i*2+2];treeNode(d,'leaf'+i,x,420,ks,true);});if(s===1)tx(d,'over',640,300,'5 > 4',42,P.orange);}else{treeNode(d,'left',345,320,[3,5]);treeNode(d,'right',930,320,[9,11]);branch(d,'i1',640,212,345,320);branch(d,'i2',640,212,930,320);[160,350,540,730,920,1110].forEach((x,i)=>{branch(d,'b'+i,i<3?345:930,382,x,520);treeNode(d,'leaf'+i,x,520,i===5?[11,12,13]:[i*2+1,i*2+2],true);});}},
(d,s)=>{const heights=[16,7,4];const h=heights[s];tx(d,'f',990,300,['2','20','200'][s],70,P.green);tx(d,'symbol',990,375,'children',26);for(let i=0;i<h;i++){const width=140+(i/(h-1))*530;d.rect('level'+i,450-width/2,255+i*(315/h),width,Math.min(46,240/h),P.greenLight,P.green,5);}tx(d,'h',990,495,[27,7,4][s]+' levels',36);if(s===0)tx(d,'ellipsis',450,602,'⋮',38);},
(d,s)=>{tx(d,'title',640,125,'Four node visits can mean fewer disk reads',39);const labels=['root','internal','internal','leaf'];labels.forEach((label,i)=>{const y=200+i*95;d.box('node'+i,195,y,280,70,label,i<2?P.blueLight:P.greenLight,i<2?P.blue:P.green,28);if(i<3)line(d,'a'+i,335,y+74,335,y+90);tx(d,'status'+i,730,y+45,i<2?'already in the buffer pool':s===0?'is this page cached?':i===2?'cached in this example':'read if not cached',27);});if(s>=2){d.line('heap-down',335,555,335,605,P.orange,4);d.line('heap-across',335,605,1085,605,P.orange,4);line(d,'heap-arrow',1085,605,1085,575,P.orange);d.box('heap',975,475,220,90,'heap row',P.orangeLight,P.orange,29);tx(d,'rid-label',710,580,'follow the RID',25,P.orange);}tx(d,'foot',640,655,'Lab 6 keeps every tree node in memory; heap pages use the buffer pool.',24,P.muted);},
(d,s)=>{d.box('row',480,120,320,100,'+ row',P.greenLight,P.green,36);d.box('heap',480,335,320,100,'heap',P.white,P.line,30);line(d,'a',640,230,640,322);const count=s+1;for(let i=0;i<count;i++){const x=200+i*290;treeNode(d,'index'+i,x,550,[i+1],true);line(d,'b'+i,640,440,x,530,P.orange);}tx(d,'writecount',1035,180,(count+1)+' structures',29);},
(d,s)=>{heap(d,'heap',550,190,8,11,s===0?[25]:s===1?[2,8,17,29,37,44,57,63]:Array.from({length:88},(_,i)=>i));treeNode(d,'idx',235,250,[35]);for(let i=0;i<(s===0?1:s===1?6:15);i++)line(d,'jump'+i,280,320,570+(i*137)%550,205+(i*83)%300,P.orange);tx(d,'sel',235,455,['1%','20%','99%'][s],50);if(s===2)line(d,'scan',570,585,1115,585,P.green);},
(d,s)=>{treeNode(d,'root',640,150,[36]);treeNode(d,'l',350,360,[28,31,34],true);treeNode(d,'r',910,360,s<2?[37,39]:[36,37,39],true);branch(d,'a',640,212,350,360);branch(d,'b',640,212,910,360);line(d,'c',470,450,790,450);tx(d,'range',640,560,'[34, 37]',38);if(s===1)d.circle('gap',818,389,28,P.orangeLight,P.red,4);if(s===2)tx(d,'fix',640,620,'34  36  37',34,P.green);},
(d,s)=>{if(s===0){treeNode(d,'node',640,320,[1,2,3,4],true);chip(d,'new',600,150,5,P.orangeLight);}else{treeNode(d,'root',640,180,[3]);treeNode(d,'l',360,390,[1,2],true);treeNode(d,'r',920,390,[3,4,5],true);branch(d,'a',640,242,360,390);branch(d,'b',640,242,920,390);line(d,'chain',470,495,795,495);if(s===2)d.circle('cursor',960,352,18,P.orange);}}
],
7:[
(d,s)=>{bank(d,'bank',s?10:60,90);if(s===1){line(d,'move',515,365,690,365,P.orange);chip(d,'amount',578,300,50,P.orangeLight);}if(s===2){d.line('cut1',590,305,680,420,P.red,12);d.line('cut2',680,305,590,420,P.red,12);}},
(d,s)=>{d.rect('boundary',110,255,1060,345,P.white,P.green,24,4);bank(d,'b',s===0?100:60,s===0?50:90,285);if(s===2)d.circle('commit',640,365,60,P.greenLight,P.green,4);if(s===2)tx(d,'check',640,384,'✓',54,P.green);},
(d,s)=>{const names=['process','OS cache','storage'];names.forEach((n,i)=>layer(d,'l'+i,180,150+i*145,920,n,i<2?P.blueLight:P.greenLight));[0,1,2].forEach(i=>{if(s===0||(s===1&&i>0)||(s===2&&i===2))chip(d,'data'+i,990,170+i*145,60,P.orangeLight,80);});if(s)tx(d,'fail',640,625,s===1?'kill -9':'power loss',40,P.red);},
(d,s)=>{layer(d,'buffer',110,260,290,'page',P.blueLight);layer(d,'log',490,260,300,'log',P.orangeLight);layer(d,'disk',900,260,270,'disk',P.greenLight);line(d,'a',415,308,475,308);line(d,'b',805,308,885,308);chip(d,'old',s===0?205:595,s===0?410:410,100,P.orangeLight,90);chip(d,'new',s<2?205:990,520,s<2?100:60,P.greenLight,90);if(s>0){tx(d,'sync',640,225,'fsync ✓',32,P.green);}if(s===2)tx(d,'newlabel',245,595,'60',32);},
(d,s)=>{flow(d,'wal',['old value','durable log','data page'],s,300);if(s===1)d.circle('seal',600,505,43,P.greenLight,P.green,3);if(s===2)tx(d,'rule',640,600,'log < page',46,P.green);},
(d,s)=>{const a=s<3?100:60,b=s<3?50:90;bank(d,'b',a,b,175);d.rect('log',505,165,270,400,P.white,P.orange,14);['START','A ← 100','B ← 50','COMMIT'].slice(0,s+1).forEach((t,i)=>chip(d,'log'+i,525,205+i*80,t,P.greenLight,230,58));if(s===1)tx(d,'ram',640,615,'RAM: 60 / 50',30);if(s===2)tx(d,'ram',640,615,'RAM: 60 / 90',30);},
(d,s)=>{bank(d,'b',s>0?10:60,90,245);d.box('undo',465,100,350,88,'A ← 60',P.greenLight,P.green,34);if(s===0){chip(d,'buffer',545,395,10,P.orangeLight,190);line(d,'steal',535,420,480,420,P.orange);}if(s===2){d.line('crash1',590,320,690,430,P.red,12);d.line('crash2',690,320,590,430,P.red,12);tx(d,'noc',640,590,'COMMIT ?',38,P.red);}},
(d,s)=>{const entries=['START 1','A ← 100','B ← 50','COMMIT 1','START 2','A ← 60'];entries.forEach((v,i)=>chip(d,'e'+i,130,105+i*76,v,i===5-s?P.orangeLight:P.white,250,56));line(d,'back',425,540,425,170,P.orange);d.box('a',570,300,240,150,s===0?'A: 10':'A: 60',P.greenLight,P.green,40);d.box('b',890,300,240,150,'B: 90',P.blueLight,P.blue,40);tx(d,'total',850,555,s===0?'Σ 100':'Σ 150',48,s===0?P.red:P.green);if(s>0)d.box('receipt',695,100,310,90,'ROLLBACK 2',P.greenLight,P.green,28);},
(d,s)=>{[10,20,30].forEach((v,i)=>{chip(d,'value'+i,180+i*420,180,v,P.blueLight,150,90);if(i<2)line(d,'change'+i,350+i*420,225,570+i*420,225);});chip(d,'old1',230,425,10,P.orangeLight,150,85);chip(d,'old2',890,425,20,P.orangeLight,150,85);d.circle('cursor',s===0?1100:s===1?965:305,560,20,P.green);tx(d,'result',640,610,s===0?'30':s===1?'20':'10',48);if(s)line(d,'reverse',890,390,380,390,P.orange);},
(d,s)=>{d.box('value',470,280,340,145,s===0?'10 → 60':'60 → 60',P.greenLight,P.green,45);d.path('loop','M 830 330 C 1100 140 210 130 450 330','none',P.orange,5);if(s===1){d.line('cr1',890,235,950,300,P.red,6);d.line('cr2',950,235,890,300,P.red,6);}if(s===2)d.box('done',470,510,340,85,'ROLLBACK ✓',P.white,P.green,30);},
(d,s)=>{d.rect('matrix',325,160,750,430,P.white,P.line,10);d.line('v',700,160,700,590,P.line,3);d.line('h',325,375,1075,375,P.line,3);tx(d,'no-steal',515,115,'NO-STEAL',28);tx(d,'steal',885,115,'STEAL',28);tx(d,'force',195,275,'FORCE',28);tx(d,'no-force',195,495,'NO-FORCE',26);d.circle('page',s===0?510:s===1?885:885,s<2?270:485,32,P.orange);if(s===1)line(d,'evict',1010,270,1180,270,P.orange);if(s===2)tx(d,'commit',885,555,'✓',48,P.green);},
(d,s)=>{d.rect('matrix',325,250,750,360,P.white,P.line,10);d.line('v',700,250,700,610,P.line,3);d.line('h',325,430,1075,430,P.line,3);tx(d,'ns',510,210,'NO-STEAL',28);tx(d,'st',885,210,'STEAL',28);tx(d,'f',190,350,'FORCE',28);tx(d,'nf',190,535,'NO-FORCE',26);const labs=['—','UNDO','REDO','UNDO + REDO'];for(let i=0;i<=s;i++)tx(d,'duty'+i,510+(i%2)*375,350+Math.floor(i/2)*180,labs[i],34,i===0?P.muted:P.green);},
(d,s)=>{tx(d,'micro',195,130,'microdb',32);tx(d,'prod',195,405,'NO-FORCE',29);timeline(d,'micro',350,190,['log','pages','COMMIT'],Math.min(s,2),290);timeline(d,'prod',350,470,['log + commit','reply','pages'],Math.min(s,2),290);if(s>0){d.circle('ack1',930,290,27,P.greenLight,P.green);d.circle('ack2',640,580,27,P.greenLight,P.green);tx(d,'c1',930,300,'✓',30,P.green);tx(d,'c2',640,590,'✓',30,P.green);}},
(d,s)=>{for(let i=0;i<12;i++)chip(d,'rec'+i,110+i*88,145,100+i,P.white,70,60);d.line('checkpoint',548,95,548,250,P.orange,5);tx(d,'checkpoint-label',555,290,'checkpoint',28);flow(d,'aries',['analysis','redo','undo'],s,395);d.circle('lsn',s===0?110:s===1?600:1090,235,16,P.orange);},
(d,s)=>{timeline(d,'cuts',180,245,['log','fsync','page','COMMIT'],s,295);[0,1,2,3].forEach(i=>{tx(d,'number'+i,180+i*295,140,i+1,40);});d.path('lightning','M '+(180+s*295)+' 375 l -28 42 h 24 l -20 40 l 54 -54 h -28 z',P.red,P.red,2);if(s>0)d.box('outcome',420,535,440,85,s===3?'keep':'undo if flushed',s===3?P.greenLight:P.orangeLight,P.line,32);},
(d,s)=>{flow(d,'last',['log','page','commit'],s,210);d.path('undo','M 910 450 C 700 650 280 620 215 455','none',P.orange,5);if(s===2){d.circle('done',1040,505,58,P.greenLight,P.green,3);tx(d,'tick',1040,526,'✓',60,P.green);}}
],
8:[
(d,s)=>title(d,['Concurrency'],()=>{d.box('a',180,320,280,130,'+10',P.blueLight,P.blue,42);d.box('b',820,320,280,130,'+10',P.orangeLight,P.orange,42);line(d,'aa',470,385,580,475);line(d,'bb',810,385,700,475,P.orange);d.circle('account',640,510,73,P.greenLight,P.green,4);tx(d,'balance',640,530,s?'110':'100',48);}),
(d,s)=>{d.circle('a',240,250,66,P.blueLight,P.blue,3);d.circle('b',1040,250,66,P.orangeLight,P.orange,3);tx(d,'plus1',240,268,'+10',40);tx(d,'plus2',1040,268,'+10',40);d.box('account',455,405,370,150,s===0?'100':s===1?'110':'120',P.greenLight,P.green,62);line(d,'a1',290,310,470,410,P.blue);line(d,'a2',990,310,810,410,P.orange);},
(d,s)=>{const rows=[['T1',100,110,110],['T2',100,110,110]];rows.forEach((r,i)=>{tx(d,'t'+i,150,235+i*230,r[0],34);['read','+10','write'].forEach((label,j)=>{chip(d,'op'+i+j,285+j*295,170+i*230,s>j?r[j+1]:label,i?P.orangeLight:P.blueLight,210,85);if(j<2)line(d,'arr'+i+j,505+j*295,215+i*230,567+j*295,215+i*230,i?P.orange:P.blue);});});if(s===3)tx(d,'sum',640,620,'110 ≠ 120',48,P.red);},
(d,s)=>{const left=s===1?'T2':'T1',right=s===1?'T1':'T2';flow(d,'serial',[left,right,'120'],2,305);if(s===2){d.path('swap','M 235 535 C 550 415 570 620 820 510','none',P.orange,5);tx(d,'result',1060,555,'✓',62,P.green);}},
(d,s)=>{const modes=[['70','↶','70?'],['100','✓ 70','70'],['● ● ●','+ ●','● ● ● ●']];const labels=['Dirty read','Non-repeatable','Phantom'];tx(d,'newterm',640,125,labels[s],38);modes[s].forEach((t,i)=>{d.box('phase'+i,120+i*375,265,290,145,t,i===1?P.orangeLight:P.blueLight,P.line,38);if(i<2)line(d,'a'+i,423+i*375,338,480+i*375,338);});if(s===0)d.line('abort',490,470,775,470,P.red,6);},
(d,s)=>{tx(d,'s',270,175,'S',48,P.blue);tx(d,'x',990,175,'X',48,P.orange);d.rect('row',450,240,380,220,P.greenLight,P.green,14);tx(d,'rowlabel',640,365,'row',44);if(s===0){[0,1,2].forEach(i=>{d.circle('reader'+i,150+i*100,550,35,P.blueLight,P.blue,3);line(d,'read'+i,150+i*100,505,520+i*60,475,P.blue);});}else{d.circle('writer',990,555,43,P.orangeLight,P.orange,3);line(d,'write',990,500,780,475,P.orange);d.line('gate',395,200,395,505,P.red,7);tx(d,'denied',270,400,'×',70,P.red);}},
(d,s)=>{d.box('row',465,250,350,155,'100',P.greenLight,P.green,56);chip(d,'s1',170,260,'S₁',P.blueLight,110,80);chip(d,'s2',1000,260,'S₂',P.orangeLight,110,80);line(d,'r1',290,300,450,300,P.blue);line(d,'r2',990,300,830,300,P.orange);if(s>0){chip(d,'x1',170,495,'X₁',P.orangeLight,110,80);line(d,'upgrade',225,480,225,355,P.orange);}if(s===2){d.line('conflict',840,225,840,415,P.red,7);tx(d,'abort',640,550,'LockAbortError',38,P.red);}},
(d,s)=>{d.line('time',150,560,1140,560,P.ink,3);d.line('count',150,560,150,260,P.ink,3);const pts=s===0?'M 160 550 L 340 450 L 520 330':s===1?'M 160 550 L 340 450 L 520 330 L 690 330 L 920 550':'M 160 550 L 340 450 L 520 330 L 800 330 L 805 550';d.path('curve',pts,'none',P.green,7);tx(d,'grow',390,610,'acquire',28);tx(d,'shrink',890,610,'release',28);if(s===2){d.line('commit',800,280,800,580,P.orange,4,'8 8');tx(d,'commit-label',800,250,'COMMIT',28,P.orange);}},
(d,s)=>{d.circle('t1',310,270,68,P.blueLight,P.blue,3);d.circle('t2',970,270,68,P.orangeLight,P.orange,3);tx(d,'t1label',310,287,'T1',42);tx(d,'t2label',970,287,'T2',42);chip(d,'a',270,495,'A',P.blueLight,80);chip(d,'b',930,495,'B',P.orangeLight,80);line(d,'holds1',310,350,310,480,P.blue);line(d,'holds2',970,350,970,480,P.orange);if(s>0){line(d,'want1',390,280,940,475,P.blue);line(d,'want2',890,280,340,475,P.orange);}if(s===2){d.line('victim1',910,215,1030,330,P.red,7);d.line('victim2',1030,215,910,330,P.red,7);tx(d,'retry',970,615,'retry',30);}},
(d,s)=>{d.line('range',130,410,1150,410,P.ink,4);[31,35,39].forEach((v,i)=>{d.circle('row'+i,250+i*330,410,28,P.greenLight,P.green,3);tx(d,'v'+i,250+i*330,490,v,30);d.rect('lock'+i,232+i*330,315,36,50,P.blueLight,P.blue,7);});if(s===1)d.circle('new',745,410,26,P.orangeLight,P.orange,3);if(s===2){d.rect('range-lock',180,290,880,175,P.blueLight,P.blue,15,3);[31,35,39].forEach((v,i)=>{d.circle('safe'+i,250+i*330,410,28,P.greenLight,P.green,3);tx(d,'safev'+i,250+i*330,420,v,22);});d.circle('new',745,220,26,P.orangeLight,P.orange,3);d.line('stop',705,260,785,260,P.red,7);}tx(d,'predicate',640,590,'30 < x < 40',40);},
(d,s)=>{const lv=['READ UNCOMMITTED','READ COMMITTED','REPEATABLE READ','SERIALIZABLE'];lv.forEach((l,i)=>d.box('level'+i,115,120+i*130,425,100,l,s===i?P.greenLight:P.white,P.line,27));['dirty','repeat','phantom'].forEach((l,i)=>{tx(d,'name'+i,745+i*165,130,l,24);for(let j=0;j<4;j++)tx(d,'test'+i+j,745+i*165,197+j*130,j>i?'✓':'○',39,j>i?P.green:P.orange);});if(s===2)d.rect('rr',675,420,450,82,'none',P.orange,10,4);},
(d,s)=>{d.rect('old',160,310,340,160,P.blueLight,P.blue,14);tx(d,'oldv',330,405,120,58);if(s>0){d.rect('new',780,310,340,160,P.greenLight,P.green,14);tx(d,'newv',950,405,70,58);line(d,'version',520,390,760,390,P.green);}d.circle('reader',330,555,30,P.blue);line(d,'read',330,515,330,490,P.blue);if(s===2){d.circle('writer',950,555,30,P.orange);line(d,'write',950,515,950,490,P.orange);}},
(d,s)=>versions(d,s,230),
(d,s)=>{tx(d,'rc',275,100,'READ COMMITTED',28);tx(d,'rr',980,100,'REPEATABLE READ',28);[0,1].forEach(i=>{d.line('time'+i,150+i*660,290,525+i*660,290,P.line,5);d.box('first'+i,145+i*660,165,155,90,'120',P.blueLight,P.line,38);d.box('second'+i,385+i*660,375,155,90,s===0?'?':i===0?'70':'120',i===0?P.greenLight:P.blueLight,P.line,38);if(s>0){line(d,'read'+i,222+i*660,265,462+i*660,365,i?P.blue:P.green);}});if(s===2)tx(d,'commit',640,565,'UPDATE → COMMIT',35,P.orange);},
(d,s)=>{for(let i=0;i<8;i++){const kept=s<2||i>4;d.rect('ver'+i,145+i*130,290,105,170,kept?P.greenLight:P.bg,kept?P.green:P.bg,10);if(kept)tx(d,'n'+i,197+i*130,385,100+i,29);}d.circle('old-reader',197,s<2?170:580,30,P.blue);if(s<2)line(d,'retain',197,212,197,270,P.blue);if(s>0){d.path('broom','M 430 550 L 550 470 M 490 485 L 565 540 L 515 590 Z',P.orangeLight,P.orange,4);}if(s===2)tx(d,'gone',480,205,'VACUUM',34,P.green);},
(d,s)=>{[0,1].forEach(i=>{d.circle('doctor'+i,330+i*620,290,55,P.blueLight,P.blue,3);d.path('body'+i,`M ${230+i*620} 445 Q ${330+i*620} 350 ${430+i*620} 445`,'none',P.blue,8);d.circle('on'+i,330+i*620,520,40,s===2?P.red:P.green);tx(d,'status'+i,330+i*620,535,s===2?'0':'1',38,P.white);});if(s>0){line(d,'look1',395,290,885,290,P.blue);line(d,'look2',885,325,395,325,P.orange);}if(s===2)tx(d,'sum',640,625,'Σ = 0',44,P.red);},
(d,s)=>{const words=['pin','latch','lock'];const xs=[265,640,1015];words.forEach((v,i)=>{d.rect('page'+i,xs[i]-130,235,260,235,i===s?P.greenLight:P.white,P.line,12);tx(d,'word'+i,xs[i],170,v,38);});d.path('pin','M 265 305 L 265 415 M 240 305 L 290 305 M 230 350 L 300 350','none',P.blue,8);clock(d,'latch',640,350,s*1.6);d.rect('lockbody',970,335,90,82,P.orangeLight,P.orange,10);d.path('shackle','M 990 335 v -35 q 25 -45 50 0 v 35','none',P.orange,8);if(s===2)line(d,'duration',875,560,1150,560,P.orange);},
(d,s)=>{if(s===0){d.box('sum',415,220,450,150,'110 ≠ 120',P.redLight,P.red,52);line(d,'conflict',360,480,920,480,P.red);}else{d.box('sum',415,220,450,150,'120',P.greenLight,P.green,64);if(s===1){chip(d,'x',585,490,'X',P.orangeLight,110,80);}else versions(d,1,400);}}
],
9:[
(d,s)=>{tx(d,'naive',285,130,'300 × 3',42);tx(d,'pushed',950,130,'60 × 1',42);dotgrid(d,'a',105,210,900,30,s===0?0:900,8,4);dotgrid(d,'b',805,210,60,10,s===0?0:60,8,4);line(d,'out1',485,430,565,545);line(d,'out2',950,340,750,545);d.box('answer',530,555,220,75,s<2?'?':'20',P.greenLight,P.green,42);if(s===2){tx(d,'n1',285,610,'900 pairs',32,P.orange);tx(d,'n2',955,310,'60 pairs',32,P.green);}},
(d,s)=>{d.table('stats',105,275,[110,110],[['N','V'],['300','3']],{rowHeight:60,fontSize:27});d.box('cost',475,310,320,135,'cost',P.blueLight,P.blue,40);line(d,'in',340,365,455,365);[0,1,2].forEach(i=>{d.box('plan'+i,960,255+i*115,190,80,[900,300,60][i],s===2&&i===2?P.greenLight:P.white,P.line,35);});line(d,'out',815,375,940,s===2?523:293+s*115);},
(d,s)=>{d.box('root',475,120,330,100,'join',P.white,P.line,32);d.box('left',180,400,320,105,'60 / 60',s===0?P.greenLight:P.white,P.line,35);d.box('right',800,400,320,105,'1 / 1',s===1?P.greenLight:P.white,P.line,35);line(d,'l',340,385,560,230);line(d,'r',960,385,720,230);if(s===2){tx(d,'out',640,290,'20 / 20',36,P.green);}tx(d,'legend',640,610,'estimate / actual',28,P.muted);},
(d,s)=>{dotgrid(d,'all',140,265,300,20,s>0?60:0,18,5);if(s>0){line(d,'filter',965,350,1130,350);tx(d,'fraction',1060,485,'60 / 300',35);tx(d,'sel',640,605,'0.2',58,P.green);}},
(d,s)=>{for(let i=0;i<20;i++){const x=150+i*45;d.rect('hist'+i,x,230,34,230,i>10&&s>0?P.green:P.line,'none',3);}d.line('threshold',635,195,635,500,P.orange,5);tx(d,'min',150,550,'20',29);tx(d,'cut',635,550,'30',29);tx(d,'max',1040,550,'39',29);if(s===2)tx(d,'result',640,625,'300 × 9/19 × 1/3 ≈ 47',38);},
(d,s)=>{for(let i=0;i<12;i++){const h=s===0?170:40+Math.max(0,5-Math.abs(i-7))*50;d.rect('bar'+i,130+i*80,470-h,60,h,i>5?P.green:P.line,'none',5);}if(s===2){d.circle('city',505,310,95,P.blueLight,P.blue,3);d.circle('state',585,310,185,'none',P.orange,4);tx(d,'citylabel',495,318,'city',27);tx(d,'state-label',700,220,'state',27);}},
(d,s)=>{if(s===0){dotgrid(d,'left',160,245,12,3,12,44,9);dotgrid(d,'right',850,245,12,3,0,44,9);d.path('loop','M 410 300 C 790 80 1100 160 1080 450 C 850 650 480 560 430 440','none',P.orange,5);tx(d,'cost',640,600,'B(L) + N(L) × B(R)',38);}if(s===1){[0,1,2].forEach(i=>d.rect('bucket'+i,540,185+i*130,220,95,P.greenLight,P.green,10));dotgrid(d,'build',160,240,12,3,12,36,8);line(d,'buildarrow',340,325,520,325);dotgrid(d,'probe',945,240,12,3,12,36,8);line(d,'probearrow',925,325,780,325,P.orange);tx(d,'cost',640,625,'B(L) + B(R)',40);}if(s===2){[1,2,3,4,5].forEach((v,i)=>{chip(d,'a'+i,150+i*190,245,v,P.blueLight,95);chip(d,'b'+i,150+i*190,415,v,P.orangeLight,95);line(d,'join'+i,195+i*190,310,195+i*190,400);});tx(d,'cost',640,605,'sort + B(L) + B(R)',40);}},
(d,s)=>{const vals=[13,1003,100003];tx(d,'fraction',640,125,['0.01%','1%','100%'][s],50);const max=100003;const bw=v=>Math.log10(v+1)/Math.log10(max+1)*700;d.box('index-label',100,245,260,90,'index',P.white,P.line,32);d.box('scan-label',100,435,260,90,'scan',P.white,P.line,32);d.rect('indexbar',385,265,bw(vals[s]),50,s===0?P.green:P.orange,'none',6);d.rect('scanbar',385,455,bw(1000),50,s===0?P.orange:P.green,'none',6);tx(d,'iv',1030,365,vals[s].toLocaleString(),38);tx(d,'sv',1030,555,'1,000',38);},
(d,s)=>{if(s===0){d.box('tiny',110,285,190,110,'10 rows',P.blueLight,P.blue,32);treeNode(d,'idx',890,265,[5]);treeNode(d,'leaf',890,460,[2,5],true);line(d,'probe',325,340,785,310,P.orange);branch(d,'b',890,327,890,460);}if(s===1){dotgrid(d,'data',140,225,48,8,48,34,8);[0,1,2,3].forEach(i=>d.box('bucket'+i,850,140+i*130,280,90,i,P.greenLight,P.green,35));line(d,'build',535,350,820,350);}if(s===2){[1,2,2,3].forEach((v,i)=>{chip(d,'l'+i,170+i*260,230,v,P.blueLight,100);chip(d,'r'+i,170+i*260,430,[1,2,2,4][i],P.orangeLight,100);});[1,2].forEach(i=>[1,2].forEach(j=>line(d,'pair'+i+j,220+i*260,292,220+j*260,420,P.green)));}},
(d,s)=>{const first=[300,3000,9000][s];d.box('a',120,110,310,90,['students','students','majors'][s],P.white,P.line,29);d.box('b',850,110,310,90,['majors','enrollments','enrollments'][s],P.white,P.line,29);line(d,'a1',280,215,560,320);line(d,'a2',1000,215,720,320);d.rect('intermediate',220,340,Math.max(40,840*first/9000),105,s===2?P.orange:P.green,'none',9);tx(d,'n',640,310,first.toLocaleString(),44);d.box('final',475,555,330,75,'3,000',P.greenLight,P.green,38);line(d,'finala',640,465,640,545);},
(d,s)=>{const subsets=[['A','B','C','D'],['AB','AC','AD','BC','BD','CD'],['ABC','ABD','ACD','BCD']];for(let r=0;r<=s;r++){const arr=subsets[r],gap=1050/arr.length;arr.forEach((v,i)=>{const x=115+gap*i;d.box('sub'+r+i,x,130+r*190,gap-25,85,v,P.white,P.line,28);if(r>0)line(d,'reuse'+r+i,x+gap/2,130+r*190-15,410+(i%2)*330,215+(r-1)*190,P.green);});}if(s===2){d.circle('property',1130,615,24,P.blueLight,P.blue,3);tx(d,'sort',1015,622,'sorted',25);}},
(d,s)=>{d.box('root',450,95,380,100,'hash join',P.white,P.line,33);d.box('left',180,345,320,100,s===0?'10 / ?':'10 / 10,000',s?P.redLight:P.white,s?P.red:P.line,33);d.box('right',800,345,320,100,'100 / 100',P.white,P.line,33);line(d,'a',340,330,540,210);line(d,'b',960,330,740,210);if(s===2){tx(d,'cause',350,570,'statistics?',35,P.orange);tx(d,'memory',970,570,'memory?',35,P.orange);}tx(d,'legend',640,635,'estimate / actual',25,P.muted);},
(d,s)=>{if(s===0){chip(d,'byte',125,240,8,P.orangeLight,70);line(d,'to-page',210,267,425,267);d.box('page',455,200,420,160,'4,096 B',P.greenLight,P.green,42);clock(d,'fsync',1040,280,0);tx(d,'promise',1040,440,'fsync',30);}else{dotgrid(d,'pool',190,160,50,10,s===1?49:50,65,15);d.circle('active',s===1?990:910,570,25,P.orange);tx(d,'frames',1020,350,s===1?'49':'50',64);tx(d,'hits',1020,455,s===1?'miss':'hit',34,s===1?P.red:P.green);}},
(d,s)=>{if(s===0){d.rect('page',160,150,440,440,P.white,P.green,16);for(let i=0;i<6;i++){d.rect('slot'+i,185,180+i*60,390,45,i===3?P.orangeLight:P.greenLight,P.line,4);tx(d,'slot-n'+i,220,210+i*60,i,22);}tx(d,'rid',950,310,'(block, slot)',36);line(d,'ridarr',800,330,620,383,P.orange);}else{flow(d,'pipe',['scan','filter','project'],s-1,290);d.circle('rowtoken',260+(s-1)*280,490,22,P.orange);tx(d,'pairs',640,625,'900 → 60',48,P.green);}},
(d,s)=>{if(s===0)flow(d,'sql',['tokens','syntax','plan','rows'],1,270);else{treeNode(d,'root',640,140,[36]);treeNode(d,'l',350,360,[28,31,34],true);treeNode(d,'r',920,360,s===1?[37,39]:[36,37,39],true);branch(d,'l1',640,202,350,360);branch(d,'r1',640,202,920,360);line(d,'leafchain',465,465,790,465);tx(d,'rangelabel',640,590,'[34, 37]',38);}},
(d,s)=>{if(s===0){timeline(d,'wal',160,320,['log','fsync','page','COMMIT'],3,310);}else{d.box('t1',130,190,280,105,'100 → 110',P.blueLight,P.blue,36);d.box('t2',870,190,280,105,'100 → 110',P.orangeLight,P.orange,36);line(d,'a',410,310,560,425);line(d,'b',870,310,720,425,P.orange);d.box('result',475,445,330,120,s===1?'110':'X conflict',s===1?P.redLight:P.greenLight,P.line,40);}},
(d,s)=>{const names=['files','buffers','records','iterators','SQL','indexes','WAL','isolation'];names.forEach((v,i)=>{const x=120+(i%4)*290,y=145+Math.floor(i/4)*285;d.box('layer'+i,x,y,240,140,v,i%3===s?P.greenLight:P.white,P.line,28);if(i<3||i>3&&i<7)line(d,'edge'+i,x+245,y+70,x+280,y+70);});}
],
10:[
analyticsStorageLayout,
analyticsSlotLookup,
(d,s)=>analyticsFareScan(d,s,false),
(d,s)=>analyticsFareScan(d,s,true),
analyticsQueryChoice,
analyticsParquetFile,
(d,s)=>{for(let i=0;i<12;i++)chip(d,'raw'+i,135+i*82,270,'A',P.blueLight,66,70);if(s>0){line(d,'compress',250,410,1030,410);d.box('packed',s===1?495:175,485,s===1?290:930,80,s===1?'A × 12':'A A A A A A A A A A A A',P.greenLight,P.green,32);}if(s===2)tx(d,'equal',640,625,'=',50,P.green);},
(d,s)=>{for(let i=0;i<24;i++){const v=1+Math.floor(i/8);if(s===0||i%8===0)chip(d,'value'+i,s===0?125+(i%12)*87:270+Math.floor(i/8)*280,s===0?185+Math.floor(i/12)*95:335,v,s===0?P.white:[P.greenLight,P.blueLight,P.orangeLight][v-1],s===0?70:150,65);}if(s>0){['1 × 8','2 × 8','3 × 8'].forEach((v,i)=>d.box('run'+i,210+i*340,470,220,95,v,P.greenLight,P.green,36));}if(s===2)tx(d,'bytes',640,635,'96 B → 24 B',40);},
(d,s)=>{if(s<2){const vals=['card','card','cash','card','cash','card'];vals.forEach((v,i)=>chip(d,'value'+i,150+i*166,230,s===0?v:v==='card'?0:1,P.blueLight,145,80));if(s===1){d.box('dict0',210,440,330,90,'card → 0',P.white,P.line,34);d.box('dict1',740,440,330,90,'cash → 1',P.white,P.line,34);}}else{[4000,4001,4002,4003,4004].forEach((v,i)=>chip(d,'value'+i,150+i*205,200,v,P.blueLight,175,80));d.box('start',165,440,275,100,'4000',P.greenLight,P.green,38);d.box('delta',650,440,440,100,'+1 × 4',P.greenLight,P.green,38);line(d,'deltaa',455,490,620,490);}},
analyticsBatchPipeline,
(d,s)=>{const bounds=[[1,3],[4,7],[8,12]];bounds.forEach((b,i)=>{d.rect('group'+i,130+i*375,265,295,270,s>0&&i<2?P.bg:P.greenLight,s>0&&i<2?P.line:P.green,14);tx(d,'bounds'+i,278+i*375,335,`[${b[0]}, ${b[1]}]`,36);if(s>0&&i<2){d.line('skip'+i,180+i*375,405,380+i*375,480,P.line,5);}else dotgrid(d,'rows'+i,185+i*375,390,8,4,s===2?8:0,31,9);});tx(d,'q',640,150,'x = 10',46);if(s===2)line(d,'open',1050,205,1050,245,P.orange);},
analyticsMonthPartitions,
analyticsByteSavings,
(d,s)=>{d.rect('process',340,150,740,440,P.white,P.blue,22,4);tx(d,'python',720,205,'Python',35);d.box('duck',525,295,370,150,'DuckDB',P.greenLight,P.green,46);['CSV','Parquet','dataframe'].forEach((v,i)=>d.box('src'+i,105,190+i*145,205,85,v,P.white,P.line,27));line(d,'in',325,375,505,375);if(s>0)d.circle('data',s===1?450:935,375,17,P.orange);if(s===2)d.box('df',915,485,250,95,'dataframe',P.blueLight,P.blue,30);},
(d,s)=>{d.rect('storage',120,475,1040,150,P.greenLight,P.green,16);tx(d,'storelabel',640,565,'object storage',36);for(let i=0;i<(s===0?1:s===1?3:2);i++){d.rect('compute'+i,170+i*340,140,260,185,P.blueLight,P.blue,12);dotgrid(d,'cpu'+i,220+i*340,185,6,3,6,31,9);line(d,'reads'+i,300+i*340,345,300+i*340,455,P.blue);}tx(d,'compute-label',640,100,'compute',32);},
(d,s)=>{const files=['a','b','c','d'];files.forEach((v,i)=>chip(d,'file'+i,135+i*275,460,v,i<2?P.blueLight:P.greenLight,160,100));d.box('manifestA',145,275,320,95,'A: a, b',P.blueLight,P.blue,34);if(s>0)d.box('manifestB',815,275,320,95,'B: a, c, d',P.greenLight,P.green,34);line(d,'old',305,385,305,445,P.blue);if(s>0){line(d,'new',970,385,805,445);line(d,'new2',970,385,1090,445);}d.circle('head',s<2?305:975,200,27,P.orange);if(s===2)d.circle('reader',305,620,24,P.blue);},
analyticsTrainSQL,
analyticsScoreSQL,
analyticsPyTorch,
analyticsCloudML,
(d,s)=>{const ww=[760,230,60];tx(d,'scan-label',220,150,'bytes',35);d.rect('scan',170,210,ww[s],110,P.greenLight,P.green,10);for(let i=0;i<Math.max(1,6-s*2);i++)d.circle('coin'+i,1050,520-i*45,39,P.orangeLight,P.orange,3);clock(d,'compute',315,505,s*1.3);tx(d,'clocklabel',315,610,'compute time',30);tx(d,'coinlabel',1045,610,'scanned bytes',30);},
(d,s)=>{for(let r=0;r<6;r++)for(let c=0;c<12;c++){const active=s===0?r===2:s===1?c===5:c===5&&r===5;d.rect('cell'+r+c,140+c*85,170+r*67,70,50,active?P.greenLight:P.white,active?P.green:P.line,5);}tx(d,'q',640,625,['ride #4','AVG(fare)','month = 12'][s],40);},
analyticsMLResources
]
};

const plans = [
  {
    "id": 6,
    "title": "B+ Trees",
    "source": "lectures/lecture-06/btrees.html",
    "date": "2026-09-29",
    "scenes": [
      {
        "title": "An index gives another route to a row",
        "minutes": 2,
        "kind": "title",
        "notes": "The index finds row addresses without scanning every heap row.\n\nPoint to the heap: the rows already exist. Introduce the index as a second way to reach them.\n\nFollow the arrow from the index to the heap. The answer still comes from the same stored row.\n\nAsk: What does the index help us avoid?\n\nExpected answer: Testing every heap row when only a few rows match.",
        "id": "b-trees",
        "steps": 2,
        "states": [
          "A second access path",
          "Index finds the heap row"
        ],
        "sources": [
          "lectures/lecture-06/btrees.html#problem"
        ],
        "teaching": {
          "idea": "The index finds row addresses without scanning every heap row.",
          "builds": [
            "Point to the heap: the rows already exist. Introduce the index as a second way to reach them.",
            "Follow the arrow from the index to the heap. The answer still comes from the same stored row."
          ],
          "question": "What does the index help us avoid?",
          "answer": "Testing every heap row when only a few rows match."
        }
      },
      {
        "title": "A complete scan checks every row",
        "minutes": 3,
        "kind": "visual",
        "notes": "A scan has no shortcut to the matching value.\n\nRead the request uid = 77777. Explain that this is the separate 100,000-row Lab 6 benchmark.\n\nHalfway through, 50,000 rows and 147 heap blocks have been visited. The diagram is schematic.\n\nThe complete scan has tested 100,000 rows across 294 blocks. Cached blocks may avoid new disk reads.\n\nAsk: Why keep scanning after the first match?\n\nExpected answer: The scan returns all matches; its implementation does not stop after finding one.",
        "id": "one-row-every-block",
        "steps": 3,
        "states": [
          "Find one row",
          "Read the first half",
          "Read every block"
        ],
        "sources": [
          "lectures/lecture-06/btrees.html#costs"
        ],
        "teaching": {
          "idea": "A scan has no shortcut to the matching value.",
          "builds": [
            "Read the request uid = 77777. Explain that this is the separate 100,000-row Lab 6 benchmark.",
            "Halfway through, 50,000 rows and 147 heap blocks have been visited. The diagram is schematic.",
            "The complete scan has tested 100,000 rows across 294 blocks. Cached blocks may avoid new disk reads."
          ],
          "question": "Why keep scanning after the first match?",
          "answer": "The scan returns all matches; its implementation does not stop after finding one."
        }
      },
      {
        "title": "An index maps values to row addresses",
        "minutes": 3,
        "kind": "visual",
        "notes": "A RID tells us where to fetch a row.\n\nGPA 36 is the value we want. A search key is a field value, not necessarily a primary key.\n\nReveal (0, 4). Say: block zero, slot four. Expand RID as record identifier.\n\nFollow that address to eli. Index lookup and row retrieval are separate steps.\n\nAsk: What does the index return for GPA 31?\n\nExpected answer: Two RIDs: (0, 1) for ben and (1, 0) for gia.",
        "definition": "An index maps field values to row addresses.",
        "id": "index",
        "steps": 3,
        "states": [
          "Look up GPA 36",
          "Get a row address",
          "Fetch eli’s row"
        ],
        "sources": [
          "lectures/lecture-06/btrees.html#problem"
        ],
        "term": "Index",
        "teaching": {
          "idea": "A RID tells us where to fetch a row.",
          "builds": [
            "GPA 36 is the value we want. A search key is a field value, not necessarily a primary key.",
            "Reveal (0, 4). Say: block zero, slot four. Expand RID as record identifier.",
            "Follow that address to eli. Index lookup and row retrieval are separate steps."
          ],
          "question": "What does the index return for GPA 31?",
          "answer": "Two RIDs: (0, 1) for ben and (1, 0) for gia."
        }
      },
      {
        "title": "Different structures suit different requests",
        "minutes": 5,
        "kind": "activity",
        "notes": "Keeping keys in order makes range access possible.\n\nCompare ways to find one value. Define a hash bucket simply as the group selected by the hash function.\n\nNow add a key. A sorted array may shift many entries; a B+ tree can split a single overfull node.\n\nFor a range, the sorted array reads forward and the B+ tree follows leaf links. A hash index has no key order to follow.\n\nAsk: Why are hashes not our only index?\n\nExpected answer: They support equality lookups but do not preserve the key order used for range scans.",
        "id": "four-storage-choices",
        "steps": 3,
        "states": [
          "Equality lookup",
          "Insert a key",
          "Walk a range"
        ],
        "sources": [
          "lectures/lecture-06/btrees.html#faq"
        ],
        "teaching": {
          "idea": "Keeping keys in order makes range access possible.",
          "builds": [
            "Compare ways to find one value. Define a hash bucket simply as the group selected by the hash function.",
            "Now add a key. A sorted array may shift many entries; a B+ tree can split a single overfull node.",
            "For a range, the sorted array reads forward and the B+ tree follows leaf links. A hash index has no key order to follow."
          ],
          "question": "Why are hashes not our only index?",
          "answer": "They support equality lookups but do not preserve the key order used for range scans."
        }
      },
      {
        "title": "Four keys fit in one leaf",
        "minutes": 3,
        "kind": "visual",
        "notes": "A node splits only after it exceeds its capacity.\n\nStart a fresh example with key 1. This is separate from the GPA tree.\n\nInsert 2 in sorted order. The single node is both the root and a leaf.\n\nInsert 3. There is still one free key slot.\n\nInsert 4. The leaf is full but legal. ORDER = 4 means four keys, not four children.\n\nAsk: Does inserting another RID for key 4 trigger a split?\n\nExpected answer: No. It extends the RID list for key 4; it does not add another distinct key.",
        "id": "first-four-keys",
        "steps": 4,
        "states": [
          "Insert 1",
          "Insert 2",
          "Insert 3",
          "Insert 4: full but legal"
        ],
        "sources": [
          "lectures/lecture-06/btrees.html#try-it"
        ],
        "demo": "viz-btree",
        "teaching": {
          "idea": "A node splits only after it exceeds its capacity.",
          "builds": [
            "Start a fresh example with key 1. This is separate from the GPA tree.",
            "Insert 2 in sorted order. The single node is both the root and a leaf.",
            "Insert 3. There is still one free key slot.",
            "Insert 4. The leaf is full but legal. ORDER = 4 means four keys, not four children."
          ],
          "question": "Does inserting another RID for key 4 trigger a split?",
          "answer": "No. It extends the RID list for key 4; it does not add another distinct key."
        }
      },
      {
        "title": "Internal nodes route; leaves hold entries",
        "minutes": 3,
        "kind": "visual",
        "notes": "The root gives directions and the leaves hold keys with row addresses.\n\nUse the GPA tree. At separator 36, smaller values go left and equal or larger values go right.\n\nReveal next. Both leaves have the same depth, and the link puts them in key order.\n\nThe leaf entry for 36 owns the RID list [(0, 4)]. The separator at the root has no RID list.\n\nAsk: Is matching the root separator enough to return a row?\n\nExpected answer: No. Follow the right child and find the RID list in the leaf.",
        "definition": "A B+ tree routes searches to sorted, linked leaves.",
        "id": "b-tree",
        "steps": 3,
        "states": [
          "Routing above entries",
          "Linked equal-depth leaves",
          "Entries carry RIDs"
        ],
        "sources": [
          "lectures/lecture-06/btrees.html#anatomy"
        ],
        "term": "B+ tree",
        "teaching": {
          "idea": "The root gives directions and the leaves hold keys with row addresses.",
          "builds": [
            "Use the GPA tree. At separator 36, smaller values go left and equal or larger values go right.",
            "Reveal next. Both leaves have the same depth, and the link puts them in key order.",
            "The leaf entry for 36 owns the RID list [(0, 4)]. The separator at the root has no RID list."
          ],
          "question": "Is matching the root separator enough to return a row?",
          "answer": "No. Follow the right child and find the RID list in the leaf."
        }
      },
      {
        "title": "A leaf split copies a separator",
        "minutes": 5,
        "kind": "visual",
        "notes": "Every key and its row addresses must remain in a leaf.\n\nAsk: Why must key 3 stay in the right leaf?\n\nExpected answer: It is an actual index entry. The parent only needs a routing copy.",
        "id": "the-fifth-key",
        "steps": 3,
        "states": [
          "A full leaf",
          "36 splits the root",
          "34 enters the left leaf"
        ],
        "sources": [
          "lectures/lecture-06/btrees.html#split"
        ],
        "demo": "viz-btree",
        "teaching": {
          "idea": "Every key and its row addresses must remain in a leaf.",
          "builds": [],
          "question": "Why must key 3 stay in the right leaf?",
          "answer": "It is an actual index entry. The parent only needs a routing copy."
        }
      },
      {
        "title": "Follow a key to its row",
        "minutes": 5,
        "kind": "activity",
        "notes": "Follow one root-to-leaf path, then use the returned RID.\n\nAsk: What does search(35) return?\n\nExpected answer: An empty list. It reaches the left leaf, where 35 is absent.",
        "id": "find-37",
        "steps": 4,
        "states": [
          "Search 37",
          "Choose the right branch",
          "Find and fetch 37",
          "Search for absent 35"
        ],
        "sources": [
          "lectures/lecture-06/btrees.html#anatomy"
        ],
        "demo": "viz-btree",
        "teaching": {
          "idea": "Follow one root-to-leaf path, then use the returned RID.",
          "builds": [],
          "question": "What does search(35) return?",
          "answer": "An empty list. It reaches the left leaf, where 35 is absent."
        }
      },
      {
        "title": "A range follows the leaf links",
        "minutes": 3,
        "kind": "visual",
        "notes": "Descend once, then collect row addresses in key order.\n\nAsk: Why do four matching keys return five RIDs?\n\nExpected answer: Two students have key 31, so that key contributes two row addresses.",
        "id": "walk-a-range",
        "steps": 4,
        "states": [
          "One descent",
          "Collect the left range",
          "Follow the leaf chain",
          "Stop beyond the high key"
        ],
        "sources": [
          "lectures/lecture-06/btrees.html#anatomy"
        ],
        "teaching": {
          "idea": "Descend once, then collect row addresses in key order.",
          "builds": [],
          "question": "Why do four matching keys return five RIDs?",
          "answer": "Two students have key 31, so that key contributes two row addresses."
        }
      },
      {
        "title": "Full is allowed; overfull needs a split",
        "minutes": 5,
        "kind": "activity",
        "notes": "Insert 6 fits; insert 7 creates a fifth key and needs a split.\n\nShow root [3] over [1, 2] and [3, 4, 5]. Ask partners to draw the result of inserting 6.\n\nReveal [3, 4, 5, 6]. Four keys fit, so no split occurs. Now ask them to insert 7.\n\nSplit into [3, 4] and [5, 6, 7]. Copy 5 into the parent, which becomes [3, 5]. Height stays at two levels.\n\nAsk: Why does the tree not grow taller here?\n\nExpected answer: The parent has room for the new separator; it does not need a new parent.",
        "id": "predict-the-next-split",
        "steps": 3,
        "states": [
          "Insert 6?",
          "Full but legal",
          "7 triggers copy-up"
        ],
        "sources": [
          "lectures/lecture-06/btrees.html#split"
        ],
        "demo": "viz-btree",
        "teaching": {
          "idea": "Insert 6 fits; insert 7 creates a fifth key and needs a split.",
          "builds": [
            "Show root [3] over [1, 2] and [3, 4, 5]. Ask partners to draw the result of inserting 6.",
            "Reveal [3, 4, 5, 6]. Four keys fit, so no split occurs. Now ask them to insert 7.",
            "Split into [3, 4] and [5, 6, 7]. Copy 5 into the parent, which becomes [3, 5]. Height stays at two levels."
          ],
          "question": "Why does the tree not grow taller here?",
          "answer": "The parent has room for the new separator; it does not need a new parent."
        }
      },
      {
        "title": "An internal split moves a separator",
        "minutes": 4,
        "kind": "visual",
        "notes": "The middle separator moves to the parent while every child is preserved.\n\nThis is the tree after inserting 1 through 12. The root has four separators and five children.\n\nInsert 13. Splitting its leaf adds separator 11, so the root now has five separators and six children.\n\nMove 7 to a new root. Left keeps [3, 5] and three children; right keeps [9, 11] and three children. All leaves gain one level together.\n\nAsk: Did moving 7 remove its lookup entry?\n\nExpected answer: No. The actual key 7 and its RID list remain in a leaf below the internal nodes.",
        "id": "a-root-splits",
        "steps": 3,
        "states": [
          "The internal root is full",
          "Five separators overflow",
          "7 moves into a new root"
        ],
        "sources": [
          "lectures/lecture-06/btrees.html#split"
        ],
        "demo": "viz-btree",
        "teaching": {
          "idea": "The middle separator moves to the parent while every child is preserved.",
          "builds": [
            "This is the tree after inserting 1 through 12. The root has four separators and five children.",
            "Insert 13. Splitting its leaf adds separator 11, so the root now has five separators and six children.",
            "Move 7 to a new root. Left keeps [3, 5] and three children; right keeps [9, 11] and three children. All leaves gain one level together."
          ],
          "question": "Did moving 7 remove its lookup entry?",
          "answer": "No. The actual key 7 and its RID list remain in a leaf below the internal nodes."
        }
      },
      {
        "title": "More children keep the tree short",
        "minutes": 3,
        "kind": "definition",
        "notes": "Fan-out is the number of children a node can point to.\n\nCompare the fully packed model for 100 million distinct keys. Two children and two leaf entries need 27 levels; the drawing abbreviates them.\n\nWith 20 children and 20 entries per leaf, the model needs seven levels.\n\nWith 200 children and 200 entries per leaf, it needs four levels. This is a capacity estimate, not a guarantee about a real tree.\n\nAsk: Why does more branching reduce the number of levels?\n\nExpected answer: Each choice narrows the search to one of more groups, so fewer choices are needed.",
        "definition": "Fan-out is the number of children an internal node can have.",
        "id": "fan-out",
        "steps": 3,
        "states": [
          "Binary fan-out",
          "Twenty children",
          "Page-sized fan-out"
        ],
        "sources": [
          "lectures/lecture-06/btrees.html#fanout"
        ],
        "term": "Fan-out",
        "demo": "viz-fanout",
        "teaching": {
          "idea": "Fan-out is the number of children a node can point to.",
          "builds": [
            "Compare the fully packed model for 100 million distinct keys. Two children and two leaf entries need 27 levels; the drawing abbreviates them.",
            "With 20 children and 20 entries per leaf, the model needs seven levels.",
            "With 200 children and 200 entries per leaf, it needs four levels. This is a capacity estimate, not a guarantee about a real tree."
          ],
          "question": "Why does more branching reduce the number of levels?",
          "answer": "Each choice narrows the search to one of more groups, so fewer choices are needed."
        }
      },
      {
        "title": "Node visits and disk reads are different counts",
        "minutes": 3,
        "kind": "visual",
        "notes": "A cached page can be visited without reading it from disk again.\n\nThis is a disk-based index example. The upper two nodes are already in the buffer pool.\n\nSuppose the third level is cached too. The leaf needs a disk read only if it is not cached.\n\nAfter finding a RID, fetch the matching heap row. Its page may also be cached. In Lab 6, all tree nodes are in memory.\n\nAsk: Are four node visits always four physical reads?\n\nExpected answer: No. Cached index pages need no new read; fetching the heap row adds separate work.",
        "id": "index-pages-and-heap-pages",
        "steps": 3,
        "states": [
          "Upper pages are cached",
          "Check the lower pages",
          "Fetch the matching heap row"
        ],
        "sources": [
          "lectures/lecture-06/btrees.html#fanout"
        ],
        "teaching": {
          "idea": "A cached page can be visited without reading it from disk again.",
          "builds": [
            "This is a disk-based index example. The upper two nodes are already in the buffer pool.",
            "Suppose the third level is cached too. The leaf needs a disk read only if it is not cached.",
            "After finding a RID, fetch the matching heap row. Its page may also be cached. In Lab 6, all tree nodes are in memory."
          ],
          "question": "Are four node visits always four physical reads?",
          "answer": "No. Cached index pages need no new read; fetching the heap row adds separate work."
        }
      },
      {
        "title": "Each index adds work when rows change",
        "minutes": 3,
        "kind": "visual",
        "notes": "An insert must update the heap and each of its indexes.\n\nAdd a row to a table with one index: maintain two structures.\n\nWith two indexes, the insert maintains three structures.\n\nWith three indexes, maintain four structures. Buffering, splits, and logging determine physical writes.\n\nAsk: If GPA changes, what must happen to its index entry?\n\nExpected answer: Remove or replace the old GPA entry and add the new GPA with the row address.",
        "id": "the-write-bill",
        "steps": 3,
        "states": [
          "One index",
          "Two indexes",
          "Three indexes"
        ],
        "sources": [
          "lectures/lecture-06/btrees.html#costs"
        ],
        "teaching": {
          "idea": "An insert must update the heap and each of its indexes.",
          "builds": [
            "Add a row to a table with one index: maintain two structures.",
            "With two indexes, the insert maintains three structures.",
            "With three indexes, maintain four structures. Buffering, splits, and logging determine physical writes."
          ],
          "question": "If GPA changes, what must happen to its index entry?",
          "answer": "Remove or replace the old GPA entry and add the new GPA with the row address."
        }
      },
      {
        "title": "Many matches can make a scan cheaper",
        "minutes": 5,
        "kind": "activity",
        "notes": "The index benefit depends on the work needed to fetch its matching rows.\n\nFew matches mean only a few heap rows to fetch. The picture illustrates addresses, not measured disk reads.\n\nAs more rows match, the index returns more RIDs. Scattered addresses can revisit heap pages.\n\nAt 99% matches, a sequential scan may be cheaper. Locality, cached pages, and covered columns can change the choice.\n\nAsk: Does an available index have to be used?\n\nExpected answer: No. The planner can choose a scan when it estimates less work.",
        "id": "when-scanning-wins",
        "steps": 3,
        "states": [
          "Few matches",
          "More heap jumps",
          "A scan becomes attractive"
        ],
        "sources": [
          "lectures/lecture-06/btrees.html#costs"
        ],
        "teaching": {
          "idea": "The index benefit depends on the work needed to fetch its matching rows.",
          "builds": [
            "Few matches mean only a few heap rows to fetch. The picture illustrates addresses, not measured disk reads.",
            "As more rows match, the index returns more RIDs. Scattered addresses can revisit heap pages.",
            "At 99% matches, a sequential scan may be cheaper. Locality, cached pages, and covered columns can change the choice."
          ],
          "question": "Does an available index have to be used?",
          "answer": "No. The planner can choose a scan when it estimates less work."
        }
      },
      {
        "title": "A missing leaf entry breaks the answer",
        "minutes": 3,
        "kind": "activity",
        "notes": "Keeping a separator in the root does not replace its leaf entry.\n\nAsk for keys 34 through 37. The left leaf has 34, but the right leaf is missing 36.\n\nPoint to the gap: the root has separator 36, yet the leaf chain cannot return it.\n\nRestore the leaf entry for 36 and its RID list. The range now finds 34, 36, and 37.\n\nAsk: Which lab operation exposes this mistake?\n\nExpected answer: A range including 36, or search(36), shows that the leaf entry is missing.",
        "id": "build-and-test",
        "steps": 3,
        "states": [
          "A missing separator entry",
          "Find the leaf gap",
          "Repair the range"
        ],
        "sources": [
          "lectures/lecture-06/btrees.html#thursday"
        ],
        "teaching": {
          "idea": "Keeping a separator in the root does not replace its leaf entry.",
          "builds": [
            "Ask for keys 34 through 37. The left leaf has 34, but the right leaf is missing 36.",
            "Point to the gap: the root has separator 36, yet the leaf chain cannot return it.",
            "Restore the leaf entry for 36 and its RID list. The range now finds 34, 36, and 37."
          ],
          "question": "Which lab operation exposes this mistake?",
          "answer": "A range including 36, or search(36), shows that the leaf entry is missing."
        }
      },
      {
        "title": "Explain one split and one lookup",
        "minutes": 2,
        "kind": "recap",
        "notes": "Leaves keep the entries, and a root split adds a level above every leaf.\n\nShow [1, 2, 3, 4] and ask where 5 belongs. Four keys fit; five do not.\n\nSplit into [1, 2] and [3, 4, 5]. Copy 3 into the new root; keep its RID list in the leaf.\n\nTrace a lookup for 4: go right, find its RID list, then fetch the matching row.\n\nAsk: What will you implement in Lab 6?\n\nExpected answer: Search, insertion, splitting, and inclusive range lookup. Nodes live in memory; the provided scan fetches heap rows.",
        "id": "exit-trace",
        "steps": 3,
        "states": [
          "A full leaf",
          "Split and grow",
          "Search then walk"
        ],
        "sources": [
          "lectures/lecture-06/btrees.html#recap"
        ],
        "teaching": {
          "idea": "Leaves keep the entries, and a root split adds a level above every leaf.",
          "builds": [
            "Show [1, 2, 3, 4] and ask where 5 belongs. Four keys fit; five do not.",
            "Split into [1, 2] and [3, 4, 5]. Copy 3 into the new root; keep its RID list in the leaf.",
            "Trace a lookup for 4: go right, find its RID list, then fetch the matching row."
          ],
          "question": "What will you implement in Lab 6?",
          "answer": "Search, insertion, splitting, and inclusive range lookup. Nodes live in memory; the provided scan fetches heap rows."
        }
      }
    ]
  },
  {
    "id": 7,
    "title": "Transactions & Recovery",
    "source": "lectures/lecture-07/wal.html",
    "date": null,
    "bonus": true,
    "scenes": [
      {
        "title": "Money disappears",
        "minutes": 4,
        "kind": "visual",
        "notes": "This is an optional bonus deck; no quiz or deadline is attached. Ask whether each assignment was valid on its own and where the missing money should be found. Expected: the transfer was only partly applied; individual writes do not establish transaction atomicity. Separate the live RAM image from durable storage in the visual. The missing 50 is a deliberately inconsistent intermediate state, not literal destruction of banknotes.",
        "id": "money-disappears",
        "steps": 3,
        "states": [
          "150 total",
          "Only the debit landed",
          "A crash interrupts"
        ],
        "sources": [
          "lectures/lecture-07/wal.html"
        ]
      },
      {
        "title": "Transaction",
        "minutes": 3,
        "kind": "definition",
        "notes": "Define the unit of work and distinguish database atomicity from application correctness. A perfectly atomic transfer can still debit the wrong account. Introduce the familiar ACID letters verbally: today emphasizes atomicity and durability; declared constraints and correct application logic matter for consistency; the next lecture addresses concurrency. Ask what a successful commit acknowledgement promises to the client.",
        "definition": "A transaction groups operations into one unit that commits completely or rolls back.",
        "id": "transaction",
        "steps": 3,
        "states": [
          "A unit of work",
          "Both changes applied",
          "One commit boundary"
        ],
        "sources": [
          "lectures/lecture-07/wal.html"
        ],
        "term": "Transaction"
      },
      {
        "title": "Two kinds of unfinished",
        "minutes": 4,
        "kind": "activity",
        "notes": "Let students predict the survivors before each interruption. Process termination leaves the OS cache alive; power failure does not. An application write reaching the OS is not the same as an acknowledged fsync. The lab uses abrupt process termination, not arbitrary power-loss or torn-write testing. This distinction is essential before showing the scripted bank recovery; avoid implying that kill -9 proves all hardware failure behavior.",
        "id": "two-kinds-of-unfinished",
        "steps": 3,
        "states": [
          "Three storage layers",
          "Process termination",
          "Power failure"
        ],
        "sources": [
          "lectures/lecture-07/wal.html"
        ]
      },
      {
        "title": "Durable first",
        "minutes": 4,
        "kind": "visual",
        "notes": "Ask students to place the safety boundary. The required ordering is durable recovery information before the associated changed data page can become durable. The lab enforces a stronger simple rule by syncing each log append before changing the buffer page. Production engines can batch log writes and force through the page LSN before flushing a data page. Do not repeat the older one-fsync-per-lab-transaction claim.",
        "id": "durable-first",
        "steps": 3,
        "states": [
          "Old value in the page",
          "Old value made durable",
          "Changed page may flush"
        ],
        "sources": [
          "lectures/lecture-07/wal.html"
        ]
      },
      {
        "title": "Write-ahead logging",
        "minutes": 3,
        "kind": "definition",
        "notes": "Ask what would go wrong if the page reached disk before the old value became durable. Expected: an uncommitted change might survive with no usable undo record. In microdb the log stores old values because its FORCE policy avoids redo. Production schemes may need after-images or physiological redo records too. Separate the general WAL rule from the particular record format used by the lab.",
        "definition": "Write-ahead logging makes recovery information durable before the changed data it protects.",
        "id": "write-ahead-logging",
        "steps": 3,
        "states": [
          "Recovery data",
          "Durability boundary",
          "Log before page"
        ],
        "sources": [
          "lectures/lecture-07/wal.html"
        ],
        "term": "Write-ahead logging"
      },
      {
        "title": "A complete transfer",
        "minutes": 4,
        "kind": "visual",
        "notes": "The widget starts at 100 and 50; this first committed transaction transfers 40. Build sequence: START, SET A old=100, SET B old=50, then data flush and COMMIT. Ask where the new balances live after each SET. Expected: in buffers until the FORCE commit flushes them. All default append records are synced in the current lab logger. Use lecture-07/styles.css and viz.js; no database process is required for this visual. The slide recreates the mechanism as editable SVG. The optional source-demo link provides the original widget; its full-page explanatory prose is not projected in this deck.",
        "id": "a-complete-transfer",
        "steps": 4,
        "states": [
          "START",
          "Log the first old value",
          "Log the second old value",
          "Flush then commit"
        ],
        "sources": [
          "lectures/lecture-07/wal.html"
        ],
        "demo": "viz-crash"
      },
      {
        "title": "Crash after eviction",
        "minutes": 4,
        "kind": "activity",
        "notes": "Let students choose what they would preserve or restore. The second transaction begins a 50 transfer but only its debit has reached disk. The old value 60 is already durable in its SET record. Ask whether a dirty-page eviction implicitly commits the transaction. Expected: no. Point out why buffer management cannot infer logical completion from a page write. Do not run recovery until the class has identified tx2 as unfinished. The slide recreates the mechanism as editable SVG. The optional source-demo link provides the original widget; its full-page explanatory prose is not projected in this deck.",
        "id": "crash-after-eviction",
        "steps": 3,
        "states": [
          "Uncommitted buffer change",
          "Eviction puts it on disk",
          "Crash without commit"
        ],
        "sources": [
          "lectures/lecture-07/wal.html"
        ],
        "demo": "viz-crash"
      },
      {
        "title": "Read the log backward",
        "minutes": 4,
        "kind": "visual",
        "notes": "Walk the reasoning, not just the result. A backward scan encounters completion records before earlier writes from the same transaction. It restores records for unfinished transactions and skips finished ones. Ask why tx1 must not return to 100/50. Expected: its commit is durable and the FORCE policy placed its data on disk first. Repaired pages must become durable before the recovery completion receipt is synced. The slide recreates the mechanism as editable SVG. The optional source-demo link provides the original widget; its full-page explanatory prose is not projected in this deck.",
        "id": "read-the-log-backward",
        "steps": 3,
        "states": [
          "Find unfinished tx2",
          "Restore its old value",
          "Keep the committed transfer"
        ],
        "sources": [
          "lectures/lecture-07/wal.html"
        ],
        "demo": "viz-crash"
      },
      {
        "title": "Two writes, reverse undo",
        "minutes": 4,
        "kind": "activity",
        "notes": "Ask partners to predict both replay directions before revealing the values. The reverse order is not arbitrary: each before-image reverses the most recent remaining change. Tie the exercise directly to rollback and records_backwards. Recovery must also identify transaction fate and obey locking assumptions; this toy demonstration concerns a serial stream of field changes. Avoid presenting before-image assignment alone as a complete general recovery algorithm.",
        "id": "two-writes-reverse-undo",
        "steps": 3,
        "states": [
          "Two changes",
          "Undo the latest change",
          "Undo the earlier change"
        ],
        "sources": [
          "lectures/lecture-07/wal.html"
        ]
      },
      {
        "title": "Repair can crash too",
        "minutes": 3,
        "kind": "definition",
        "notes": "Define idempotence with assignment rather than subtraction. Ask why writing a ROLLBACK receipt before flushing repaired pages is unsafe: the next restart could skip a repair that never became durable. In the lab, repeated full recovery passes reach the same repaired state under its assumptions. Production ARIES adds compensation records and more bookkeeping for robust partial-progress recovery.",
        "definition": "Idempotence means repeating an operation has the same effect as performing it once.",
        "id": "repair-can-crash-too",
        "steps": 3,
        "states": [
          "Restore a value",
          "Recovery is interrupted",
          "Repeat and complete"
        ],
        "sources": [
          "lectures/lecture-07/wal.html"
        ],
        "term": "Idempotence"
      },
      {
        "title": "Two policy decisions",
        "minutes": 4,
        "kind": "activity",
        "notes": "Introduce STEAL and FORCE orally, then use the axes to derive consequences before naming quadrants. STEAL admits uncommitted data on disk, so undo support is needed in this simple in-place model. NO-FORCE admits committed changes whose data pages are missing, so redo support is needed. Keep buffer eviction policy and transaction acknowledgement policy visibly separate; students commonly collapse them into one choice.",
        "id": "two-policy-decisions",
        "steps": 3,
        "states": [
          "Two independent policies",
          "STEAL allows early data",
          "NO-FORCE allows late data"
        ],
        "sources": [
          "lectures/lecture-07/wal.html"
        ]
      },
      {
        "title": "Four recovery duties",
        "minutes": 4,
        "kind": "activity",
        "notes": "Derive the textbook matrix: FORCE/NO-STEAL neither undo nor redo for transaction updates; FORCE/STEAL undo; NO-FORCE/NO-STEAL redo; NO-FORCE/STEAL both. These are update-recovery requirements under the model, not proof that a system needs no recovery metadata or protection from partial writes. The existing widget overgeneralizes all engines as ARIES and calls FORCE/NO-STEAL always correct; do not expose those explanatory strings. The slide recreates the mechanism as editable SVG. The optional source-demo link provides the original widget; its full-page explanatory prose is not projected in this deck.",
        "id": "four-recovery-duties",
        "steps": 4,
        "states": [
          "Neither",
          "UNDO",
          "REDO",
          "UNDO and REDO"
        ],
        "sources": [
          "lectures/lecture-07/wal.html"
        ],
        "demo": "viz-quad"
      },
      {
        "title": "Commit boundary",
        "minutes": 4,
        "kind": "visual",
        "notes": "Ask where acknowledgement may appear in each lane. Microdb commits can require several syncs and dirty-page flushes. A NO-FORCE engine can make commit wait on durable log progress and defer page writes, with group commit sharing the cost. If the connection fails after durability but before acknowledgement, the client may not know the outcome. Treat this as a normal distributed acknowledgement ambiguity, not evidence that commit failed.",
        "id": "commit-boundary",
        "steps": 3,
        "states": [
          "Required log writes",
          "Where reply becomes safe",
          "Deferred data flush"
        ],
        "sources": [
          "lectures/lecture-07/wal.html"
        ]
      },
      {
        "title": "Recovery at scale",
        "minutes": 4,
        "kind": "visual",
        "notes": "Provide the bridge to production without teaching ARIES as merely three generic loops. LSNs track progress; checkpoints record enough state to bound work; redo may repeat history and undo removes losers. PostgreSQL uses WAL redo with MVCC visibility instead of the exact physical-undo lab design. A simple lab checkpoint is safe only after unfinished transactions are resolved and relevant data is durable; an arbitrary timestamp is not a safe cutoff.",
        "id": "recovery-at-scale",
        "steps": 3,
        "states": [
          "Analyze transaction fate",
          "Redo progress",
          "Undo losers"
        ],
        "sources": [
          "lectures/lecture-07/wal.html"
        ]
      },
      {
        "title": "Place the crash",
        "minutes": 4,
        "kind": "activity",
        "notes": "Spend two minutes in pairs, then ask one group per cut point. Expected: no durable change before the log boundary; undo if uncommitted data survives; keep a transaction with durable commit under FORCE. Ask the harder case: the client never receives the commit reply. Expected: inspect or retry through an idempotent application protocol; outcome may already be committed. Mention fsync errors must propagate rather than being reported as successful commits.",
        "id": "place-the-crash",
        "steps": 4,
        "states": [
          "Before log",
          "After durable log",
          "After changed data",
          "After durable commit"
        ],
        "sources": [
          "lectures/lecture-07/wal.html"
        ]
      },
      {
        "title": "From promise to code",
        "minutes": 3,
        "kind": "recap",
        "notes": "Have students narrate the WAL order and one recovery example without reading prose. Lab 7 will ask for set_int/set_string, commit, rollback and recover; the supplied logger and lock table provide the supporting pieces. Crash tests cover process termination and repeated recovery, not arbitrary corrupt storage. The concurrency bonus reading addresses two correct transactions interfering even when no crash occurs. The full sequence is exactly 60 teaching minutes.",
        "id": "from-promise-to-code",
        "steps": 3,
        "states": [
          "Log first",
          "Page second",
          "Commit and repair"
        ],
        "sources": [
          "lectures/lecture-07/wal.html"
        ]
      }
    ]
  },
  {
    "id": 8,
    "title": "Concurrency & MVCC",
    "source": "lectures/lecture-08/concurrency.html",
    "date": null,
    "bonus": true,
    "scenes": [
      {
        "title": "Concurrency & MVCC",
        "minutes": 2,
        "kind": "title",
        "notes": "Start with two clients intending to add ten to one account. Ask students to predict the outcome if both transactions complete, then reveal the possibility of 110. Expected: 120 is the intended serial outcome; interleaving can lose an update even without a crash. Keep this unsolved until the scheduler scene. Today students will construct bad schedules and justify lock and snapshot behavior. This bonus deck is outside the required midterm scope.",
        "id": "concurrency-mvcc",
        "steps": 2,
        "states": [
          "Two clients share state",
          "Their writes can conflict"
        ],
        "sources": [
          "lectures/lecture-08/concurrency.html"
        ]
      },
      {
        "title": "Two deposits",
        "minutes": 3,
        "kind": "visual",
        "notes": "Ask students what should happen after both deposits complete. No crash or durability failure will occur in this example. Each individual read-compute-write sequence is correct in isolation. The mystery is how the combined execution can reach 110. Keep expected and actual balances spatially distinct so the later discrepancy reads immediately without a paragraph.",
        "id": "two-deposits",
        "steps": 3,
        "states": [
          "Starting balance",
          "First deposit",
          "Both deposits expected"
        ],
        "sources": [
          "lectures/lecture-08/concurrency.html"
        ]
      },
      {
        "title": "Schedule the failure",
        "minutes": 5,
        "kind": "activity",
        "notes": "Let two volunteers alternate the buttons and predict each shared balance. Both read 100 and compute 110; the second write overwrites the first result. Both commit and final A is 110. Ask whether a WAL can infer the missing intended deposit. Expected: recovery preserves committed actions; it cannot repair an incorrect concurrent schedule from business intent. Reuse lecture-08/styles.css and viz.js; consider hiding verbose message and stats elements. The slide recreates the mechanism as editable SVG. The optional source-demo link provides the original widget; its full-page explanatory prose is not projected in this deck.",
        "id": "schedule-the-failure",
        "steps": 4,
        "states": [
          "Read the same value",
          "Compute independently",
          "Overwrite the same row",
          "Both commit to 110"
        ],
        "sources": [
          "lectures/lecture-08/concurrency.html"
        ],
        "demo": "viz-ilv"
      },
      {
        "title": "Serializability",
        "minutes": 3,
        "kind": "definition",
        "notes": "Introduce serializability as equivalence to some serial execution, not a requirement to execute literally one transaction at a time. Ask whether every interleaving is bad. Expected: no; many preserve the same dependencies and result. The deposit example is commutative, so use dependency arrows to emphasize why this property is more general than comparing one number.",
        "definition": "A serializable execution is equivalent to some serial order of its transactions.",
        "id": "serializability",
        "steps": 3,
        "states": [
          "One serial order",
          "The other serial order",
          "Equivalent interleaving"
        ],
        "sources": [
          "lectures/lecture-08/concurrency.html"
        ],
        "term": "Serializability"
      },
      {
        "title": "Anomaly gallery",
        "minutes": 3,
        "kind": "activity",
        "notes": "Ask students to describe the difference before naming dirty read, non-repeatable read and phantom. Dirty read depends on uncommitted data; non-repeatable read changes an existing row; phantom changes the set selected by a predicate. These are examples, not the entire isolation model. Keep each timeline on screen long enough for an audience member to retell it.",
        "id": "anomaly-gallery",
        "steps": 3,
        "states": [
          "Dirty read",
          "Non-repeatable read",
          "Phantom"
        ],
        "sources": [
          "lectures/lecture-08/concurrency.html"
        ]
      },
      {
        "title": "Shared and exclusive",
        "minutes": 3,
        "kind": "visual",
        "notes": "Define shared read and exclusive write locks orally. Ask why two shared holders are allowed even when both eventually intend to write. Expected: a read lock alone protects reading, while an upgrade requires compatibility with other holders. The lock scope in microdb is a block, not necessarily a row; coarse locks can create conflicts between distinct rows on one page. Keep this caveat in notes, not a dense slide.",
        "id": "shared-and-exclusive",
        "steps": 2,
        "states": [
          "Shared readers coexist",
          "Exclusive access conflicts"
        ],
        "sources": [
          "lectures/lecture-08/concurrency.html"
        ]
      },
      {
        "title": "Replay with locks",
        "minutes": 5,
        "kind": "activity",
        "notes": "Ask exactly where the previous schedule is refused. Both reads succeed; the first attempted X-lock upgrade conflicts with the other transaction’s S lock. The lab raises LockAbortError rather than waiting; the caller must roll back and retry. The existing console has no rollback control, so do not pretend it can finish this deadlocked schedule; reset and demonstrate a safe serial schedule if needed. The slide recreates the mechanism as editable SVG. The optional source-demo link provides the original widget; its full-page explanatory prose is not projected in this deck.",
        "id": "replay-with-locks",
        "steps": 3,
        "states": [
          "Both shared reads succeed",
          "The first upgrade request",
          "Upgrade is refused"
        ],
        "sources": [
          "lectures/lecture-08/concurrency.html"
        ],
        "demo": "viz-ilv"
      },
      {
        "title": "Two phases",
        "minutes": 3,
        "kind": "definition",
        "notes": "Define the growing and shrinking phases. Under classic 2PL, acquiring a new lock after releasing one is forbidden. Explain the lab’s stronger hold-all-locks-until-end rule; terminology varies, and holding all S and X locks until completion is often called rigorous 2PL, while strict 2PL requires X locks until completion. Predicate protection is needed for serializable range queries, not only row locks.",
        "definition": "Two-phase locking acquires locks before releasing any; once release begins, no new locks are acquired.",
        "id": "two-phases",
        "steps": 3,
        "states": [
          "Acquire",
          "Release",
          "Hold until completion"
        ],
        "sources": [
          "lectures/lecture-08/concurrency.html"
        ],
        "term": "Two-phase locking"
      },
      {
        "title": "Deadlock",
        "minutes": 3,
        "kind": "activity",
        "notes": "Ask whether waiting longer can resolve a true cycle. Expected: no. A database can detect a cycle and abort a participant; application code must safely retry the transaction. A consistent lock acquisition order avoids this two-resource cycle. Distinguish a deadlock from ordinary blocking. microdb aborts on conflict because its simple single-threaded transaction model cannot safely wait for an idle holder.",
        "id": "deadlock",
        "steps": 3,
        "states": [
          "Each holds one resource",
          "Each wants the other",
          "Abort and retry"
        ],
        "sources": [
          "lectures/lecture-08/concurrency.html"
        ]
      },
      {
        "title": "Protect the empty space",
        "minutes": 3,
        "kind": "visual",
        "notes": "Use the phantom example to show why locking existing rows does not protect a predicate’s future members. Expected fix in a locking design: protect a range or equivalent predicate, rather than an absent row. Serializable MVCC systems may detect dangerous read/write dependencies instead and retry. This scene prevents the false inference that basic per-row S/X rules alone solve every anomaly.",
        "id": "protect-the-empty-space",
        "steps": 3,
        "states": [
          "Existing rows locked",
          "A gap admits a phantom",
          "Protect the predicate range"
        ],
        "sources": [
          "lectures/lecture-08/concurrency.html"
        ]
      },
      {
        "title": "Isolation ladder",
        "minutes": 5,
        "kind": "activity",
        "notes": "Ask which minimum SQL level disallows each of dirty reads, non-repeatable reads and phantoms. The standard permits implementation differences, and the three-anomaly table is not a complete definition of serializability. PostgreSQL READ UNCOMMITTED behaves as READ COMMITTED; its REPEATABLE READ uses a transaction snapshot and prevents these phantom changes while still allowing write skew. Do not present the source’s gray zone as PostgreSQL allowing snapshot phantoms. The slide recreates the mechanism as editable SVG. The optional source-demo link provides the original widget; its full-page explanatory prose is not projected in this deck.",
        "id": "isolation-ladder",
        "steps": 4,
        "states": [
          "Read uncommitted",
          "Read committed",
          "Repeatable read nuances",
          "Serializable"
        ],
        "sources": [
          "lectures/lecture-08/concurrency.html"
        ],
        "demo": "viz-iso"
      },
      {
        "title": "Versions instead of waiting",
        "minutes": 3,
        "kind": "definition",
        "notes": "Define MVCC once. Ordinary snapshot reads can coexist with updates because they can use different versions. This does not make writers independent of writers, nor eliminate all blocking, explicit locking reads or schema locks. Ask what new resource pays for this concurrency. Expected: version storage and cleanup, plus visibility bookkeeping.",
        "definition": "MVCC keeps row versions so each reader can see the version allowed by its snapshot.",
        "id": "versions-instead-of-waiting",
        "steps": 3,
        "states": [
          "Original version",
          "An update creates another",
          "Reader and writer coexist"
        ],
        "sources": [
          "lectures/lecture-08/concurrency.html"
        ],
        "term": "MVCC"
      },
      {
        "title": "Walk the version chain",
        "minutes": 3,
        "kind": "activity",
        "notes": "Before each slider move ask the balance a reader should see. After committed tx100 it sees 120; after tx103 it sees 70; after tx107 it sees 50. The widget assumes all these transaction IDs commit in order. Real visibility requires transaction status, snapshot membership and the reader’s own writes, not simply comparing two transaction numbers. Crop or rewrite its final whole-run message so it applies to a transaction snapshot. The slide recreates the mechanism as editable SVG. The optional source-demo link provides the original widget; its full-page explanatory prose is not projected in this deck.",
        "id": "walk-the-version-chain",
        "steps": 3,
        "states": [
          "After tx100",
          "After tx103",
          "After tx107"
        ],
        "sources": [
          "lectures/lecture-08/concurrency.html"
        ],
        "demo": "viz-chain"
      },
      {
        "title": "Statement or transaction snapshot",
        "minutes": 3,
        "kind": "visual",
        "notes": "Use the same update and ask which second read changes. PostgreSQL’s default READ COMMITTED takes a new statement snapshot; REPEATABLE READ shares a transaction snapshot. MVCC by itself does not specify when snapshots are taken. Tie the outcome back to the anomaly gallery, and ask why long reports may request a stable snapshot even when they are read-only.",
        "id": "statement-or-transaction-snapshot",
        "steps": 3,
        "states": [
          "Two snapshot rules",
          "Another transaction commits",
          "Repeat the read"
        ],
        "sources": [
          "lectures/lecture-08/concurrency.html"
        ]
      },
      {
        "title": "The version bill",
        "minutes": 3,
        "kind": "visual",
        "notes": "Explain why old versions cannot be reclaimed while a valid snapshot may still need them. Ask why an idle transaction can grow a table even without producing queries. Expected: its snapshot can hold back cleanup. MVCC moves work into version management; it does not erase the cost of isolation. Distinguish VACUUM reclamation from the immediate slot reuse in the teaching record manager.",
        "id": "the-version-bill",
        "steps": 3,
        "states": [
          "Reader retains an old version",
          "Cleanup cannot pass it",
          "Reader ends; cleanup proceeds"
        ],
        "sources": [
          "lectures/lecture-08/concurrency.html"
        ]
      },
      {
        "title": "Write skew",
        "minutes": 5,
        "kind": "activity",
        "notes": "Give pairs thirty seconds to find the missing conflict. Expected: they wrote different rows, so no direct write/write conflict stopped them, but the joint invariant fails. In any serial execution the second doctor would see nobody else on call and remain. Serializable Snapshot Isolation can detect dangerous dependency patterns and abort a transaction; snapshot isolation alone does not guarantee serializability.",
        "id": "write-skew",
        "steps": 3,
        "states": [
          "Two doctors on call",
          "Each sees the other",
          "Both leave"
        ],
        "sources": [
          "lectures/lecture-08/concurrency.html"
        ]
      },
      {
        "title": "Three mechanisms, three jobs",
        "minutes": 3,
        "kind": "activity",
        "notes": "Ask which mechanism prevents eviction, which protects a shared in-memory operation, and which controls transaction access. Expected: pin, latch, transaction lock. A pin never makes a row immune to another client’s write. Finish by asking whether lock waiting, transaction retries and retained versions are interchangeable costs; they solve related problems through distinct protocols.",
        "id": "three-mechanisms-three-jobs",
        "steps": 3,
        "states": [
          "Pin controls eviction",
          "Latch guards short operations",
          "Transaction lock guards access"
        ],
        "sources": [
          "lectures/lecture-08/concurrency.html"
        ]
      },
      {
        "title": "Exit schedule",
        "minutes": 2,
        "kind": "recap",
        "notes": "Ask a student to identify the first lock conflict in read/read/compute/compute/write, then another to name what snapshot isolation still allows. Expected: first X upgrade; write skew. Lab 7 joins today’s locks with the WAL protocol, but does not implement MVCC. Next lecture reads and improves the plans built by the engine. Quizzes follow the revised schedule; this material also supports optional review.",
        "id": "exit-schedule",
        "steps": 3,
        "states": [
          "An invalid schedule",
          "Lock protection",
          "Snapshot visibility"
        ],
        "sources": [
          "lectures/lecture-08/concurrency.html"
        ]
      }
    ]
  },
  {
    "id": 9,
    "title": "Query Optimization",
    "source": "lectures/lecture-09/optimizer.html",
    "date": null,
    "bonus": true,
    "scenes": [
      {
        "title": "Same answer, different work",
        "minutes": 4,
        "kind": "visual",
        "notes": "No quiz is scheduled today. Ask why two equivalent plans can do radically different amounts of intermediate work. Reuse the Lab 4 setting and make both predicates explicit orally: gpa > 35 and dept = cs, plus the join condition. The pushed plan produces 60 candidate pairs, not automatically 60 final rows. The last twenty minutes are reserved for an optional engine synthesis.",
        "id": "same-answer-different-work",
        "steps": 3,
        "states": [
          "Two equivalent plans",
          "Different intermediate work",
          "Same twenty rows"
        ],
        "sources": [
          "lectures/lecture-09/optimizer.html"
        ]
      },
      {
        "title": "Optimizer",
        "minutes": 3,
        "kind": "definition",
        "notes": "Define the optimizer and separate correctness from efficiency. The supplied Lab 5 planner translates a correct query into a fixed shape; optimization searches alternatives. It estimates candidate cost rather than executing every plan. Estimates, physical properties and a limited search budget all affect the choice. Ask which plan transformations students measured in Lab 5 and what an automatic optimizer must now choose.",
        "definition": "A query optimizer chooses an execution plan using estimated costs and data statistics.",
        "id": "optimizer",
        "steps": 3,
        "states": [
          "Stored statistics",
          "Candidate estimates",
          "A selected plan"
        ],
        "sources": [
          "lectures/lecture-09/optimizer.html"
        ],
        "term": "Query optimizer"
      },
      {
        "title": "Read a plan",
        "minutes": 3,
        "kind": "activity",
        "notes": "Explain that EXPLAIN displays the chosen plan; EXPLAIN ANALYZE also executes it and measures behavior. Have students trace the inside-out dataflow and compare estimated versus actual row counts at each node. Costs in PostgreSQL are model units, not milliseconds or literally just blocks. For writes, ANALYZE execution has effects; today’s example is a read. Keep SQL and large plan text in notes or optional detail view.",
        "id": "read-a-plan",
        "steps": 3,
        "states": [
          "Read the left leaf",
          "Read the right leaf",
          "Combine at the join"
        ],
        "sources": [
          "lectures/lecture-09/optimizer.html"
        ]
      },
      {
        "title": "Selectivity",
        "minutes": 3,
        "kind": "definition",
        "notes": "Define the fraction kept. Smaller selectivity fractions mean fewer surviving rows, while people sometimes say a predicate is highly selective to mean it keeps few rows. Ask students to identify N and survivors rather than memorize the phrase. Row estimates feed the costs of later operators, so errors near the bottom can multiply above.",
        "definition": "Selectivity is the fraction of rows a predicate keeps.",
        "id": "selectivity",
        "steps": 2,
        "states": [
          "Rows before filtering",
          "Fraction that survives"
        ],
        "sources": [
          "lectures/lecture-09/optimizer.html"
        ],
        "term": "Selectivity"
      },
      {
        "title": "Estimate from a sketch",
        "minutes": 4,
        "kind": "activity",
        "notes": "Students compute the estimate in pairs. First the uniform continuous range approximation gives about 142 survivors, then the independent one-third department filter gives about 47. State the assumptions: queried values exist, approximate uniformity, independent predicates, and compatible domains. Integer endpoints can matter, so this is not the exact answer for all actual datasets. Ask what information could improve the sketch: sampled distributions, most-common values and histograms.",
        "id": "estimate-from-a-sketch",
        "steps": 3,
        "states": [
          "Distribution sketch",
          "Range estimate",
          "Combine independent filters"
        ],
        "sources": [
          "lectures/lecture-09/optimizer.html"
        ]
      },
      {
        "title": "When estimates fail",
        "minutes": 3,
        "kind": "visual",
        "notes": "Use city = Charlottesville and state = Virginia as the correlation example; the second condition does not independently remove two thirds of the same rows. Ask how stale statistics differ from wrong independence assumptions. Expected: ANALYZE refreshes data summaries, while correlated conditions may need richer statistics or a better model. Do not imply that a statistics refresh automatically fixes every bad plan.",
        "id": "when-estimates-fail",
        "steps": 3,
        "states": [
          "Uniform assumption",
          "Skewed actual data",
          "Correlated conditions"
        ],
        "sources": [
          "lectures/lecture-09/optimizer.html"
        ]
      },
      {
        "title": "Price the work",
        "minutes": 4,
        "kind": "visual",
        "notes": "Price scans in blocks to connect to Lecture 1. Explain nested loop B(L)+N(L)B(R), hash B(L)+B(R) when the build fits in memory, and merge scans plus sorting if needed. CPU, output, cache, startup and spills also matter. Ask which method can return an early row with little setup and which needs building first. LIMIT can change which cost dimension matters.",
        "id": "price-the-work",
        "steps": 3,
        "states": [
          "Nested loop",
          "Hash join",
          "Merge join"
        ],
        "sources": [
          "lectures/lecture-09/optimizer.html"
        ]
      },
      {
        "title": "Watch the access path flip",
        "minutes": 3,
        "kind": "activity",
        "notes": "The model fixes N=100,000, B=1,000 and tree height 3. The index estimate is 3+matching RIDs; sequential scan is 1,000. Before crossing ask for the break-even fraction: (1000−3)/100000≈0.997%. Slider 50 is 1%, so the scan slightly wins. This is a toy model, not a universal 1% rule; clustering, caching and index-only scans change the crossover. Bar widths are logarithmic, so use numeric values for ratio comparisons. The slide recreates the mechanism as editable SVG. The optional source-demo link provides the original widget; its full-page explanatory prose is not projected in this deck.",
        "id": "watch-the-access-path-flip",
        "steps": 3,
        "states": [
          "Selective index wins",
          "Near the crossover",
          "A scan wins"
        ],
        "sources": [
          "lectures/lecture-09/optimizer.html"
        ],
        "demo": "flip-sel"
      },
      {
        "title": "Choose the join machine",
        "minutes": 3,
        "kind": "activity",
        "notes": "Expected choices: indexed nested-loop for few outer rows and cheap probes; hash for a suitable equality join with a manageable build side; merge for appropriately sorted inputs. Ask why the same algorithm is not always best. Include duplicates in the merge picture: equal-key groups must produce every matching pair, not just one zip. The total answer size is unavoidable work.",
        "id": "choose-the-join-machine",
        "steps": 3,
        "states": [
          "Tiny indexed probe",
          "Build and probe a hash",
          "Merge equal-key groups"
        ],
        "sources": [
          "lectures/lecture-09/optimizer.html"
        ]
      },
      {
        "title": "Join order",
        "minutes": 3,
        "kind": "visual",
        "notes": "Ask which first pair has no connecting predicate. Expected: majors and enrollments, producing a 9,000-row cross product. Distinguish first-intermediate ratios from total produced rows: SM totals 3,300, SE 6,000, ME 12,000 in this widget. Do not claim total work is thirty times larger merely because the first intermediate is. Each plan has the same answer under the stated join assumptions. The slide recreates the mechanism as editable SVG. The optional source-demo link provides the original widget; its full-page explanatory prose is not projected in this deck.",
        "id": "join-order",
        "steps": 3,
        "states": [
          "Students and majors first",
          "Students and enrollments first",
          "An unconnected pair first"
        ],
        "sources": [
          "lectures/lecture-09/optimizer.html"
        ],
        "demo": "order-readout"
      },
      {
        "title": "Search without enumerating everything",
        "minutes": 3,
        "kind": "visual",
        "notes": "Explain dynamic programming as reusable subproblems, not trying every complete tree. Physical properties such as sorted output can justify retaining multiple plans for the same subset; the cheapest local raw cost is not always the only useful survivor. The 10!×Catalan(9) count is about 17.6 billion labeled binary join trees under one counting convention, not the number every optimizer actually enumerates. Larger joins often trigger restricted search or heuristics.",
        "id": "search-without-enumerating-everything",
        "steps": 3,
        "states": [
          "Single relations",
          "Reuse pairs",
          "Retain useful physical properties"
        ],
        "sources": [
          "lectures/lecture-09/optimizer.html"
        ]
      },
      {
        "title": "Diagnose, then review",
        "minutes": 4,
        "kind": "activity",
        "notes": "Give students one minute to identify the earliest major divergence rather than blaming the slowest top node. Expected investigation: data distribution, stale or correlated statistics, row-width/memory assumptions and alternative plans. Explain why measuring actual behavior matters. Close the optimizer segment by having the class name statistics, costing and search. At elapsed minute 40 transition explicitly to an optional twenty-minute engine synthesis.",
        "id": "diagnose-then-review",
        "steps": 3,
        "states": [
          "An estimated plan",
          "The earliest large error",
          "Investigate the assumptions"
        ],
        "sources": [
          "lectures/lecture-09/optimizer.html"
        ]
      },
      {
        "title": "Review: storage and memory",
        "minutes": 4,
        "kind": "activity",
        "notes": "Spend one minute individual recall, one minute partner explanation and two minutes checking mechanisms. Ask why fsync differs from buffered write and why a repeated 50-page loop can thrash a 49-frame LRU cache. Expected: durability ordering and working-set capacity, not a universal measured ratio. Pinning prevents eviction; dirty eviction may need a write. Use actual benchmark values only as examples, not fixed promises across machines.",
        "id": "review-storage-and-memory",
        "steps": 3,
        "states": [
          "Durability and blocks",
          "A working set that misses",
          "The missing frame changes it"
        ],
        "sources": [
          "lectures/lecture-09/optimizer.html"
        ]
      },
      {
        "title": "Review: rows and pipelines",
        "minutes": 4,
        "kind": "activity",
        "notes": "Ask students to explain fixed slot arithmetic, byte capacity for UTF-8 strings, and when RID reuse is unsafe for stale references. Then ask why a streaming operator does not imply every operator uses constant memory: sort, aggregation and some joins can hold state. Have them reconstruct the 900-to-60 candidate-pair change. The target is a mechanism explanation, not memorized API signatures.",
        "id": "review-rows-and-pipelines",
        "steps": 3,
        "states": [
          "Rows and stable addresses",
          "Pull a row",
          "Reduce candidate pairs"
        ],
        "sources": [
          "lectures/lecture-09/optimizer.html"
        ]
      },
      {
        "title": "Review: SQL and indexes",
        "minutes": 4,
        "kind": "activity",
        "notes": "Ask what each stage accepts and produces, why parsing a query does not optimize it, and why the copied separator must remain in a leaf. Expected distinctions: tokens versus syntax structure versus query description versus executable scans; leaf copy-up versus internal move-up; one descent followed by leaf traversal. Follow with a broad-selectivity predicate to check that students do not insist every available index must be used.",
        "id": "review-sql-and-indexes",
        "steps": 3,
        "states": [
          "Parsing to execution",
          "Missing leaf entry",
          "Repair the range"
        ],
        "sources": [
          "lectures/lecture-09/optimizer.html"
        ]
      },
      {
        "title": "Review: recovery and isolation",
        "minutes": 4,
        "kind": "activity",
        "notes": "Ask students to place the durable log before data, and the FORCE commit receipt after dirty data is durable. Recovery undoes unfinished transactions under the lab model; it does not infer intended concurrent operations. In the lost-update schedule both S reads succeed and the first X upgrade conflicts. Ask why MVCC’s snapshots do not by themselves eliminate write skew. Spend the final minute on the distinction between crash safety and isolation.",
        "id": "review-recovery-and-isolation",
        "steps": 3,
        "states": [
          "Crash-safe ordering",
          "A lost update",
          "Conflict protection"
        ],
        "sources": [
          "lectures/lecture-09/optimizer.html"
        ]
      },
      {
        "title": "Exit mechanism",
        "minutes": 4,
        "kind": "recap",
        "notes": "Use a rapid oral retrieval round: each student explains one mechanism in twenty seconds and names a failure if it is missing. Correct misconceptions rather than reveal assessment answers. Distinguish optional topics from the required exam: the October 22 midterm covers Lectures 1–6 and Labs 1–6 only. Analytics starts October 8. This twenty-minute synthesis completes the 60-minute deck without adding a lab-day deck.",
        "id": "exit-mechanism",
        "steps": 3,
        "states": [
          "Storage mechanisms",
          "Execution mechanisms",
          "Transaction mechanisms"
        ],
        "sources": [
          "lectures/lecture-09/optimizer.html"
        ]
      }
    ]
  },
  {
    "id": 10,
    "title": "The Analytics Stack & In-Database ML",
    "source": "lectures/lecture-10/analytics.html",
    "date": "2026-10-08",
    "scenes": [
      {
        "title": "Same rides, two storage layouts",
        "minutes": 2,
        "kind": "visual",
        "clarityNative": true,
        "notes": "Start with the same three made-up taxi rides as the reading. Introduce pickup, payment, and fare before comparing how storage groups the values. Highlight one complete ride, then the column groups, then only the three fares. Ask students to calculate the average before revealing $30. These strips show grouping, not disk-page boundaries or measured reads. The ten-minute Quiz 6 is separate from this sixty-minute teaching deck. Later scenes connect the layout to compression, execution batches, file metadata, and training a model with SQL.",
        "id": "the-analytics-stack",
        "steps": 5,
        "states": [
          "Meet the three rides",
          "Keep each ride together",
          "Group values by field",
          "Read only the fares",
          "Calculate the same average"
        ],
        "sources": [
          "lectures/lecture-10/analytics.html#storage-layout"
        ]
      },
      {
        "title": "Row slots and column positions",
        "minutes": 2,
        "kind": "visual",
        "clarityNative": true,
        "notes": "Compare the fixed-size row slots from Lab 3 with a simplified columnar layout for the same three made-up rides. Ride 2 occupies slot 1 in the illustrated block 7; RID (7, 1) identifies the whole row. On the right, locate logical position 1 within each column chunk of row group 0. Gather LGA, card, and $24. Parquet row groups contain one chunk per column; each chunk contains encoded pages. Positions preserve row correspondence but do not promise constant byte offsets or equal page boundaries across columns. Status flags, null encoding, headers, and other metadata are omitted. Other column engines may use different addressing structures; this is a conceptual comparison, not a universal on-disk format.",
        "id": "the-workload-rotates",
        "steps": 5,
        "states": [
          "Slots versus positions",
          "Find row slot 1",
          "Read pickup at position 1",
          "Read payment at position 1",
          "Read fare and rebuild the ride"
        ],
        "sources": [
          "lectures/lecture-10/analytics.html#row-slots",
          "labs/lab-03/recordpages.html#big-idea",
          "https://parquet.apache.org/docs/concepts/",
          "https://parquet.apache.org/docs/file-format/"
        ]
      },
      {
        "title": "Average fares in row storage",
        "minutes": 3,
        "kind": "visual",
        "notes": "Keep the same three made-up rides used in the opening and slot comparison. First ask which fields avg(fare) needs. Highlight the three fares in green and the neighboring pickup and payment fields in orange. Orange means stored alongside the fares, not an exact count of measured I/O. Reveal the average of $30 only after a prediction. With row storage, a scan can bring unrelated fields into memory because the fields share row pages. Pages, caching, indexes, and encodings affect real costs. Compare the next slide with the same query and same data.",
        "id": "read-a-row-layout",
        "steps": 3,
        "states": [
          "Predict which values matter",
          "Identify fares and neighboring fields",
          "Compute the average"
        ],
        "sources": [
          "lectures/lecture-10/analytics.html#storage-layout"
        ],
        "clarityNative": true
      },
      {
        "title": "Average fares in column storage",
        "minutes": 3,
        "kind": "visual",
        "notes": "Keep the same three rides and avg(fare) query from the preceding slide. The data is now grouped by field. Highlight the fare chunk in green; pickup and payment stay gray because this query can skip those chunks. Reveal the same $30 result. The benefit is less unrelated data to read, not a different calculation or guaranteed speedup. These cell groups are conceptual, not literal disk page boundaries. Do not equate three values with three disk operations. If the query needs other fields for filtering or grouping, those columns must also be accessed.",
        "id": "read-a-column-layout",
        "steps": 3,
        "states": [
          "Keep the same query and rides",
          "Read fares; skip other chunks",
          "Get the same average"
        ],
        "sources": [
          "lectures/lecture-10/analytics.html#storage-layout"
        ],
        "clarityNative": true
      },
      {
        "title": "Different queries need different data",
        "minutes": 3,
        "kind": "visual",
        "notes": "Define workload as the mix of queries a database runs. Use two requests about the same rides: show all of Ride 2, and calculate the average fare for all rides. Highlight the three fields of Ride 2, then all three fares, then both patterns. The small tables show values the queries need, not physical page layouts. A row layout keeps one ride together; a column layout keeps fares from many rides together. Both layouts can answer both questions. Their benefit depends on the query mix and physical execution, not an automatic rotation of storage whenever a query changes. Some systems maintain separate operational and analytical copies.",
        "id": "the-point-lookup-reverses-it",
        "steps": 3,
        "states": [
          "One complete ride",
          "Fares from many rides",
          "Match storage to the query mix"
        ],
        "sources": [
          "lectures/lecture-10/analytics.html#flip"
        ],
        "clarityNative": true
      },
      {
        "title": "Parquet is a file format",
        "minutes": 2,
        "kind": "visual",
        "clarityNative": true,
        "notes": "Define a file format as rules for how data is stored in a file. Use the same three rides from the opening. Parquet is an open, binary, column-oriented format; rides.parquet holds the table data, while DuckDB is software that executes SQL. Reveal one row group with three column chunks, preserving the order of rides within each chunk. A larger file can contain many row groups, each with one chunk per column. The metadata records field types and chunk locations. For avg(fare), DuckDB can read the fare chunk and skip pickup and payment; metadata still needs reading. Reveal the same $30 average. This is a simplified logical picture, not a byte-accurate file layout. Column chunks contain pages that can use encodings and compression, which the next slides explain.",
        "id": "parquet-is-a-file-format",
        "steps": 4,
        "states": [
          "Meet the file format",
          "Look inside one row group",
          "Let DuckDB read the fares",
          "Compute the same average"
        ],
        "sources": [
          "lectures/lecture-10/analytics.html#parquet-format",
          "https://parquet.apache.org/docs/overview/",
          "https://parquet.apache.org/docs/file-format/"
        ]
      },
      {
        "title": "Lossless compression",
        "minutes": 3,
        "kind": "definition",
        "notes": "Define lossless compression and ask why it can make scans faster despite decode work. Expected: fewer bytes to fetch can outweigh decompression cost. The pattern and type distribution drive suitable encoding choices; no fixed compression factor is guaranteed. Distinguish encoding from a general-purpose compression codec, while noting they can combine.",
        "definition": "Lossless compression stores the same information using fewer bytes.",
        "id": "compression",
        "steps": 3,
        "states": [
          "Repeated information",
          "A compact encoding",
          "Reconstruct exactly"
        ],
        "sources": [
          "lectures/lecture-10/analytics.html"
        ],
        "term": "Lossless compression"
      },
      {
        "title": "Runs",
        "minutes": 4,
        "kind": "activity",
        "notes": "Before the reveal ask how to represent eight 1s, eight 2s and eight 3s. Expected: three runs. In the widget the teaching byte model changes 96 bytes into 24, a factor of four. Ask what happens if the same months alternate randomly. Expected: runs become short and the benefit can collapse. Sorting can improve compression but has a write and ordering cost. The slide recreates the mechanism as editable SVG. The optional source-demo link provides the original widget; its full-page explanatory prose is not projected in this deck.",
        "id": "runs",
        "steps": 3,
        "states": [
          "Twenty-four values",
          "Three runs",
          "Compare payload bytes"
        ],
        "sources": [
          "lectures/lecture-10/analytics.html"
        ],
        "demo": "viz-enc"
      },
      {
        "title": "Dictionary and deltas",
        "minutes": 3,
        "kind": "visual",
        "notes": "Ask which patterns justify each encoding: low-cardinality strings favor a dictionary; smooth numeric sequences favor deltas. The widget assumes a tiny dictionary and bit-packed codes, and its delta example also compresses repeated differences. These are illustrative byte counts, not a promise of exact Parquet output size. Have students recover one original value from the encoded form before moving on. The slide recreates the mechanism as editable SVG. The optional source-demo link provides the original widget; its full-page explanatory prose is not projected in this deck.",
        "id": "dictionary-and-deltas",
        "steps": 3,
        "states": [
          "Two repeated strings",
          "Dictionary codes",
          "Start and deltas"
        ],
        "sources": [
          "lectures/lecture-10/analytics.html"
        ],
        "demo": "viz-enc"
      },
      {
        "title": "From microdb rows to batches",
        "minutes": 3,
        "kind": "visual",
        "notes": "Use the same made-up fares 36, 24, and 30 in the illustrated scan order. This SELECT-FROM-WHERE query matches the microdb operators students implemented: ProjectScan wraps SelectScan, which wraps TableScan. next() returns a Boolean and positions a current row; get_val reads a field. One SelectScan.next() call can make multiple child next() calls while rejecting rows. A final unsuccessful call detects exhaustion and is omitted from the animation. Arrows between boxes indicate conceptual value flow, not copied row objects; the text below gives the inward request chain. TableScan already reads buffered pages, so one row per successful call does not mean one disk read per row. The second pipeline is an illustrative batched counterpart, not an existing microdb API or an exact DuckDB physical plan. Filter selection can be represented by a mask or selection vector rather than copying matching rows. DuckDB operates on DataChunks made of column vectors; its default standard vector size is 2048, but actual chunks can be smaller. Batching spreads call overhead across rows while each predicate still needs evaluation. It does not require changing the disk layout, and it is distinct from multicore parallelism and CPU SIMD. SQL without ORDER BY does not promise this illustrated output order.",
        "id": "batches-through-the-pipeline",
        "steps": 6,
        "states": [
          "Recall the microdb scans",
          "Get the first matching row",
          "Skip a row; get the next match",
          "Read a toy batch",
          "Filter the values in the batch",
          "Pass the matching fares together"
        ],
        "sources": [
          "lectures/lecture-10/analytics.html#batch-execution",
          "lectures/lecture-04/iterators.html",
          "labs/lab-05/starter/query_engine.py",
          "https://duckdb.org/docs/current/internals/vector.html"
        ],
        "clarityNative": true
      },
      {
        "title": "Skip a row group",
        "minutes": 3,
        "kind": "activity",
        "notes": "Let students decide which groups can be ruled out before opening them. Min/max statistics can prove absence; they cannot prove every row in the surviving group matches. Partition pruning and row-group skipping operate at different levels. Unsorted or overlapping ranges reduce skipping effectiveness. Explain that metadata itself must be read, and selected compressed pages still need decoding.",
        "id": "skip-a-row-group",
        "steps": 3,
        "states": [
          "Inspect min and max",
          "Rule out two groups",
          "Open the possible match"
        ],
        "sources": [
          "lectures/lecture-10/analytics.html"
        ]
      },
      {
        "title": "Skip eleven month folders",
        "minutes": 3,
        "kind": "visual",
        "notes": "Start with one year of taxi rides. A partition is a group of rows selected by a rule; here, all rides with the same month belong together. In this Hive-style file layout, rides/month=12/data.parquet stores December rides. The directory name supplies the month value. A partition can contain several files; one file is drawn per folder for clarity. A folder is one way to represent a partition, not the general definition: other database systems manage partitions internally. For the December query, DuckDB can skip files in the other eleven folders, then read fare column chunks inside the December files. Distinguish a partition folder, a Parquet file inside it, and row groups inside each file. Equal month sizes are only an assumption for the next arithmetic example.",
        "id": "skip-eleven-partitions",
        "steps": 3,
        "states": [
          "Group rides into month folders",
          "Skip the other eleven folders",
          "Read fare inside December"
        ],
        "sources": [
          "lectures/lecture-10/analytics.html#partitions",
          "https://duckdb.org/docs/stable/data/partitioning/hive_partitioning.html"
        ],
        "clarityNative": true
      },
      {
        "title": "How much data can we skip?",
        "minutes": 3,
        "kind": "activity",
        "notes": "Keep one question throughout: average fare for December. Use a toy year with 60,000 rides, twelve stored data columns including fare, and exactly eight bytes per field value. Each of twelve monthly partitions contains 5,000 rides. Month comes from the directory, not an additional scanned data column. Each grid square represents one month of one column: 5,000 values times eight bytes, or 40,000 bytes. Squares are equal pieces of value data, not disk pages or measured reads. Highlight all 144 squares as the full-table value-data baseline: 5,760,000 bytes. Keep the fare column across all months: twelve squares, 480,000 bytes. Keep December fares: one square, 40,000 bytes. Let pairs predict the fraction before revealing 1/144. The two factors of twelve describe independent choices: which columns and which months. Use decimal units: KB = 1,000 bytes and MB = 1,000,000 bytes. Exclude metadata, encoding, and compression; this is not a latency prediction or a claim that every row engine must read the full table. Optional extension: if December holds half the rides, the second saving is a factor of two, giving 1/24 of the full value data.",
        "id": "predict-the-byte-ratio",
        "steps": 6,
        "states": [
          "Define the equal-size pieces",
          "Count all table values",
          "Keep only the fare column",
          "Keep only December fares",
          "Predict the fraction left",
          "Explain the two factors of twelve"
        ],
        "sources": [
          "lectures/lecture-10/analytics.html#byte-ratio"
        ],
        "clarityNative": true
      },
      {
        "title": "An engine inside the process",
        "minutes": 3,
        "kind": "visual",
        "notes": "Explain the embedded deployment: no separate database server is required for the lab. DuckDB provides analytical SQL over files and in-process dataframes. It supports transactions and WAL and can have concurrent writers within one process; cross-process write coordination differs from a client-server database. Pandas and DuckDB can compose. Keep code invocation details in presenter notes so the audience sees the dataflow.",
        "id": "an-engine-inside-the-process",
        "steps": 3,
        "states": [
          "Engine in the process",
          "Read files or dataframes",
          "Return a dataframe"
        ],
        "sources": [
          "lectures/lecture-10/analytics.html"
        ]
      },
      {
        "title": "Storage and compute separate",
        "minutes": 3,
        "kind": "visual",
        "notes": "Ask what can scale independently. Expected: durable stored data and compute used to query it. Describe warehouse and data-lake ideas as architecture, not identical vendor implementation. A lake can be files readable by multiple engines; a warehouse adds managed execution and services. Object storage supports range reads but not arbitrary in-place file edits like a local disk. Avoid the source’s overbroad whole-object-only claim.",
        "id": "storage-and-compute-separate",
        "steps": 3,
        "states": [
          "One compute group",
          "Scale compute separately",
          "Stored data remains"
        ],
        "sources": [
          "lectures/lecture-10/analytics.html"
        ]
      },
      {
        "title": "A table over files",
        "minutes": 3,
        "kind": "definition",
        "notes": "Define the lakehouse briefly. Explain that transactional metadata identifies the files belonging to a table snapshot; readers do not discover partial commits by naively listing a folder. Iceberg and Delta use different metadata and commit protocols; a single generic manifest is a conceptual picture. Connect snapshot history to MVCC and mention cleanup retention costs. Atomic metadata publication and concurrency control are necessary, not just writing a file list.",
        "definition": "A lakehouse adds transactional table metadata to data stored in open files.",
        "id": "a-table-over-files",
        "steps": 3,
        "states": [
          "Snapshot A",
          "Write files for B",
          "Publish B; old readers keep A"
        ],
        "sources": [
          "lectures/lecture-10/analytics.html"
        ],
        "term": "Lakehouse"
      },
      {
        "title": "SQL learns a fare model",
        "minutes": 3,
        "kind": "activity",
        "notes": "Project the training SQL, not just function names. The prepared fare_features view contains the six made-up rides from in_database_ml.py after filtering positive distances and nonnegative fares. Define distance in miles as the input feature and fare in dollars as the label. First read the six rows, then highlight FROM and WHERE split = train along with the four training rows. Highlight the regression aggregates next: regr_intercept(fare, distance) and regr_slope(fare, distance), with target first and feature second. They fit a least-squares line, learning intercept 3 and slope 2. count(*) records four training rows. CREATE TABLE stores the query result in fare_model. Read the saved row and form predicted fare = 3 + 2 times distance. The intercept is the line value at zero miles, not a verified taxi base fare. Python only submits these SQL statements and prints results; DuckDB performs the fit. Both test rows stay out of training. The exact setup and complete runnable SQL are in the reading and linked script. This tiny synthetic example teaches execution, not real taxi-fare accuracy.",
        "id": "train-inside-the-query-engine",
        "steps": 5,
        "states": [
          "Identify the feature and label",
          "Keep only training rides",
          "Learn the intercept and slope",
          "Save one model row",
          "Read the learned prediction rule"
        ],
        "sources": [
          "lectures/lecture-10/analytics.html#train-sql",
          "lectures/lecture-10/in_database_ml.py",
          "https://duckdb.org/docs/stable/sql/functions/aggregates.html"
        ],
        "clarityNative": true
      },
      {
        "title": "SQL checks and applies the saved model",
        "minutes": 3,
        "kind": "activity",
        "notes": "Keep fare_model fixed at intercept 3 and slope 2. Show CREATE VIEW held_out_predictions with the test-only filter. CROSS JOIN pairs each test ride with the one model row, and the expression m.intercept + m.slope * r.distance calculates its fare. Ask the class to predict results before showing 8 and 12 dollars for distances 2.5 and 4.5. The actual fares 9 and 11 did not influence training. On the next build replace the SQL with avg(abs(fare - predicted_fare)), explain absolute error, and calculate a one-dollar MAE. The query also reports the two test rows and RMSE, which is one dollar here. Explain RMSE as the square root of mean squared error. Then show a separate SELECT for VALUES (3.5), cross joined with the same model, and pause before revealing 10 dollars. The new query needs only distance, not an actual fare, and does not retrain. The projected queries retain ride_id from the reading so each output still identifies its input ride. CROSS JOIN is safe here because fare_model has exactly one row; a multi-version model table requires selecting a model first. Two synthetic test rows demonstrate the mechanics, not generalization.",
        "id": "evaluate-and-apply-the-model",
        "steps": 6,
        "states": [
          "Select the two test rides",
          "Combine each ride with the model",
          "Name the test predictions",
          "Calculate mean absolute error",
          "Predict a new ride",
          "Reveal the new fare"
        ],
        "sources": [
          "lectures/lecture-10/analytics.html#evaluate-sql",
          "lectures/lecture-10/in_database_ml.py"
        ],
        "clarityNative": true
      },
      {
        "title": "DuckDB + PyTorch: a neural network for fares",
        "minutes": 3,
        "kind": "visual",
        "clarityNative": true,
        "id": "duckdb-pytorch-fare-model",
        "steps": 11,
        "states": [
          "DuckDB selects training batches",
          "PyTorch learns the weights",
          "Scale the input distances",
          "Predict and scale the target fares",
          "Measure the batch loss",
          "Convert predictions back to dollars",
          "Register the prediction function",
          "Send an Arrow batch to Python",
          "Return a fare for each batch position",
          "Predict the reserved rides",
          "Compare prediction errors"
        ],
        "notes": "Use the core Lab 8 investigation as a concrete local bridge between the small SQL regression and the managed BigQuery ML example. This example uses the real, cleaned 2024 taxi sample rather than the six made-up rides. Train on 50,000 January–October rides and reserve the 10,000 November–December rides for evaluation. DuckDB filters and projects rows, Arrow carries batches, and Python converts them to tensors. ORDER BY hash(ride_id) gives the training rides a repeatable mixed order so batches do not follow date order. This mixing is useful but optional. The same mixed order repeats each epoch, and the month filter still excludes the test rides. In the network diagram, the single distance node connects to all 16 hidden nodes through the first Linear layer, then all 16 hidden nodes connect to the fare output through the second Linear layer. Each line is a learned weight. ReLU acts at the hidden nodes. Biases and scaling are omitted from the diagram. PyTorch trains a one-input, 16-hidden-unit, one-output ReLU network for 30 epochs. The source code also learns scaling from training rows only. Four detail builds unpack the two prediction and loss lines. Use two invented rides with distances 3 and 5 miles and recorded fares 20 and 30 dollars. Assume the full training set already gave distance mean 3 and std 2, and fare mean 20 and std 10. Those statistics are not computed from the displayed batch. The scaled distances and targets are 0 and 1. Assume the current model outputs 0.2 and 0.8, giving squared errors 0.04 and 0.04 and mean loss 0.04. This loss is in squared standardized-fare units, not dollars. Conversion back to dollars gives 22 and 28, each two dollars away from the recorded fare. The toy values illustrate the calculation and are separate from the measured lab results later. The forward prediction and loss calculation do not update weights; optimizer.step does that after backward computes gradients. Projected Python is an excerpt: imports, tensor conversion, scaling statistics, optimizer setup, and the surrounding loops are in the linked script. Create the network once, then update it on each training batch. The predict_fare callback runs the frozen model under inference_mode and returns an Arrow array. create_function registers it as predict_fare_nn on this connection. Arrow means Apache Arrow, a format for column data in memory. The SQL function has one DOUBLE input and one DOUBLE output per row, while type=arrow tells DuckDB to call the Python function with a batch of values. The two Arrow builds show distances 3 and 5 entering one callback and illustrative fares 22 and 28 returning at matching positions. The real callback receives a PyArrow ChunkedArray, converts it to tensors, applies the fixed model, and returns a PyArrow array with the same number of entries. Returning values in a different order would attach fares to the wrong rides. DuckDB controls these UDF batch sizes; the earlier to_arrow_reader batch_size=1024 applies only to the training loop. This lab copies values into torch.tensor, so avoid claiming that every conversion is free. It is not a built-in DuckDB function. The test SELECT invokes PyTorch through that callback without retraining. Its first two sample predictions are rounded from the completed run: ride 50000, distance 2.00, actual fare 20.50, neural prediction 15.17; ride 50001, distance 0.94, actual fare 10.00, prediction 9.50. The script materializes predictions with both linear_fare and neural_fare before the final aggregate. In the documented run with seed 6042, DuckDB 1.5.6, and PyTorch 2.14.1, MAE is 3.53 dollars for the straight line and 3.26 for the neural network. Both use only distance and the same training/test split. These are measured results for one sample and configuration, not guaranteed accuracy or evidence that larger models always win. The next slide moves training management into Google Cloud.",
        "sources": [
          "labs/lab-08/duckdb.html#pytorch",
          "labs/lab-08/starter/pytorch_fares.py",
          "https://docs.pytorch.org/docs/stable/generated/torch.nn.MSELoss.html",
          "https://duckdb.org/docs/stable/clients/python/function.html#arrow",
          "https://duckdb.org/2023/07/07/python-udf#predicting-taxi-fare-costs-ibis--pyarrow-udf"
        ]
      },
      {
        "title": "Training and prediction with BigQuery ML",
        "minutes": 2,
        "kind": "visual",
        "clarityNative": true,
        "id": "managed-model-sql",
        "steps": 3,
        "states": [
          "CREATE MODEL learns from training rides",
          "ML.EVALUATE checks separate test rides",
          "ML.PREDICT applies the saved model"
        ],
        "notes": "Show actual GoogleSQL for the same six toy rides. This optional cloud example requires replacing YOUR_PROJECT with a BigQuery project ID, a demo dataset, and demo.ml_rides loaded with the six rows and compatible BigQuery types. Use the setup and permissions instructions in the reading before running it; BigQuery may incur charges. CREATE MODEL with linear_reg learns a distance-to-fare line. input_label_cols identifies fare as the outcome, leaving distance as the feature. NO_SPLIT uses all rows supplied by the training SELECT; WHERE split = train keeps the two test rows out. NORMAL_EQUATION with l2_reg = 0 selects an unregularized least-squares fit. The next build passes explicit test rows to ML.EVALUATE and requests mean_absolute_error. The final build gives ML.PREDICT the saved model and a new distance. The projected code uses the same YOUR_PROJECT placeholder and demo dataset names as the reading. Unlike DuckDB's ordinary one-row coefficient table, BigQuery saves a managed model object. These statements use BigQuery syntax and do not run in DuckDB. The cloud statements are documented examples; projected output values are not presented as results from an executed cloud job.",
        "sources": [
          "lectures/lecture-10/analytics.html#managed-ml",
          "https://docs.cloud.google.com/bigquery/docs/bqml-introduction",
          "https://docs.cloud.google.com/bigquery/docs/reference/standard-sql/bigqueryml-syntax-create-glm",
          "https://docs.cloud.google.com/bigquery/docs/reference/standard-sql/bigqueryml-syntax-evaluate",
          "https://docs.cloud.google.com/bigquery/docs/reference/standard-sql/bigqueryml-syntax-predict"
        ]
      },
      {
        "title": "Performance becomes cost",
        "minutes": 1,
        "kind": "activity",
        "notes": "Ask which changes can lower bytes-scanned billing and which may lower compute duration. BigQuery on-demand commonly prices scanned data; Snowflake-style compute billing is different, so avoid one pricing rule for every warehouse. No actual price quote is needed. In Lab 8’s optional storage experiments, students compare CSV/Parquet, projection and pruning; actual timings depend on machine, caching and data, so the deck must not promise the source’s universal 100× result.",
        "id": "performance-becomes-cost",
        "steps": 3,
        "states": [
          "Read everything",
          "Read one column",
          "Read one partition"
        ],
        "sources": [
          "lectures/lecture-10/analytics.html"
        ]
      },
      {
        "title": "Choose the shape",
        "minutes": 1,
        "kind": "recap",
        "notes": "Have students choose the access shape and narrate the savings: fewer unrelated columns, encodings, batches and skipping. Lab 8 uses a fixed sample of real 2024 NYC taxi trips to compare SQL and neural-network fare models and investigate test errors; project proposals are due Thursday October 29. Direct setup details to notes or the lab link. Next lecture asks what happens when the column stores an embedding and the query asks for similarity. Quizzes follow the revised schedule; this material also supports optional review. Add one final retrieval question: which stage learns coefficients and which reuses them? Expected: training aggregates learn them; inference applies the saved model without fitting again.",
        "id": "choose-the-shape",
        "steps": 3,
        "states": [
          "Point lookup",
          "Whole-table aggregate",
          "Partitioned aggregate"
        ],
        "sources": [
          "lectures/lecture-10/analytics.html"
        ]
      },
      {
        "title": "More models with DuckDB",
        "minutes": 1,
        "kind": "visual",
        "clarityNative": true,
        "id": "more-models-with-duckdb",
        "steps": 1,
        "states": [
          "Resources for the core Lab 8 investigation"
        ],
        "notes": "End with clickable resources for students who want to go further. Start with the official DuckDB article: its PyTorch taxi example uses a pretrained linear model through a Python function. Our core Lab 8 investigation builds on that integration with a small neural network. DuckDB selects training batches and later calls the trained model; PyTorch learns and applies the network weights in the same local Python process. The ML extension is a separate community project that exposes model training through SQL. The Duck’s Brain is a research paper about expressing neural-network calculations in SQL, with historical benchmarks using DuckDB 0.8.1. These are three different execution arrangements. The lab uses the existing taxi sample and no cloud service. Students submit an investigation query, its results, a model-comparison chart, and a short report. Ask which component updates the neural-network weights in the lab.",
        "sources": [
          "https://duckdb.org/2023/07/07/python-udf#predicting-taxi-fare-costs-ibis--pyarrow-udf",
          "https://duckdb.org/community_extensions/extensions/ml",
          "https://arxiv.org/abs/2312.17355",
          "labs/lab-08/duckdb.html#pytorch"
        ]
      }
    ]
  }
];
for (const deck of plans) {
 deck.scenes.forEach((scene, i) => { scene.draw = draws[deck.id][i]; });
 const lectureSixTeaching = deck.id === 6 ? new Map(deck.scenes.map(scene => [scene.id, scene.teaching])) : null;
 window.CourseTraceSlides.apply(deck);
 if (deck.id === 6) {
   for (const scene of deck.scenes) {
     if (!scene.traceId) continue;
     const example = window.CourseTraces.examples[scene.traceId];
     scene.teaching = {...lectureSixTeaching.get(scene.id), builds: example.frames.map(frame => frame.explanation)};
     scene.teaching.question = example.question;
     scene.teaching.answer = example.answer;
   }
 }
 window.COURSE_DECKS = window.COURSE_DECKS || {};
 window.COURSE_DECKS[deck.id] = deck;
}
})();
