/* Local-file compatible slide player. No services, fonts, or libraries to download. */
(function () {
  'use strict';
  const id=Number(document.body.dataset.lecture),deck=window.COURSE_DECKS[id],V=window.DeckViz;
  if(!deck){document.body.textContent='This lecture deck could not load. Open it from the slides index.';return;}
  const params=new URLSearchParams(location.search),role=params.has('presenter')?'presenter':params.has('guide')?'guide':'audience';
  const $=id=>document.getElementById(id),el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
  const svg=()=>{const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('viewBox','0 0 1280 720');return s;};
  const total=deck.scenes.reduce((sum,s)=>sum+s.minutes,0),starts=deck.scenes.map((s,i)=>deck.scenes.slice(0,i).reduce((n,p)=>n+p.minutes,0));
  const session=params.get('session')||Math.random().toString(36).slice(2)+Date.now().toString(36);
  const channel=location.protocol!=='file:'&&typeof BroadcastChannel!=='undefined'?new BroadcastChannel('course-deck-'+id+'-'+session):null;
  const state={slide:0,step:0,elapsed:0,running:false,playing:false,blanked:false};
  let presenterWindow=null,auto=null,clockStart=0,quietTimer,toastTimer,hashWrite=false;
  document.title=deck.title+' · Visual lecture '+id;
  const scene=()=>deck.scenes[state.slide];
  // Chromium reports file:// here, but local-file message recipients have an
  // opaque origin. Messages still go only to the stored peer window, and the
  // receive handlers verify event.source before accepting them.
  const origin=location.protocol==='file:'||location.origin==='null'?'*':location.origin;
  const pad=n=>String(n).padStart(2,'0');
  const index=(value,max)=>Number.isFinite(Number(value))?Math.max(0,Math.min(max,Math.floor(Number(value)))):0;
  const elapsed=()=>state.elapsed+(state.running?(Date.now()-clockStart)/1000:0);
  const time=n=>Math.floor(n/60)+':'+pad(Math.floor(n%60));
  function sourceLink(src) {return /^https?:/.test(src)?src:'../'+src;}
  function render(target,sc,step,animate=false){V.mount(target,V.sceneDrawing(sc,step),{animate,label:sc.title,description:sc.states?.[step]||`Build ${step+1} of ${sc.steps}`});}
  function button(text,label,fn){const b=el('button','',text);b.type='button';b.setAttribute('aria-label',label);b.title=label;b.addEventListener('click',fn);return b;}
  function announce(text){const s=$('status');if(!s)return;s.textContent=text;clearTimeout(toastTimer);toastTimer=setTimeout(()=>s.textContent='',2200);}
  function safePost(win,msg){try{if(win&&!win.closed)win.postMessage({scope:'course-visual-deck',id,...msg},origin);}catch(_) {}}
  function sendPeer(msg){if(channel)channel.postMessage({scope:'course-visual-deck',id,...msg});else safePost(role==='presenter'?window.opener:presenterWindow,msg);}
  function publish(){sendPeer({type:'state',state:{...state,elapsed:elapsed()}});}
  function stopAuto(){clearInterval(auto);auto=null;state.playing=false;}
  function writeHash(){hashWrite=true;history.replaceState(null,'',`#s=${state.slide+1}&b=${state.step+1}`);hashWrite=false;}
  function readHash(){const h=new URLSearchParams(location.hash.slice(1));state.slide=index((Number(h.get('s'))||1)-1,deck.scenes.length-1);state.step=index((Number(h.get('b'))||1)-1,scene().steps-1);}
  function update(animate=true){
    render($('canvas'),scene(),state.step,animate);$('counter').textContent=`${pad(state.slide+1)} / ${pad(deck.scenes.length)}`;
    $('counter').title=`Build ${state.step+1} of ${scene().steps}`;
    $('back').disabled=state.slide===0&&state.step===0;$('forward').disabled=state.slide===deck.scenes.length-1&&state.step===scene().steps-1;
    $('play').textContent=state.playing?'Ⅱ':'▷';$('play').setAttribute('aria-label',state.playing?'Pause animation (A)':'Play this animation (A)');
    $('build-progress').style.width=((state.slide+(state.step+1)/scene().steps)/deck.scenes.length*100)+'%';
    document.body.classList.toggle('blanked',state.blanked);writeHash();publish();
    $('live').textContent=`Slide ${state.slide+1}. ${scene().title}. ${scene().states?.[state.step]||'Build '+(state.step+1)}`;
  }
  function command(cmd,value){
    if(role==='presenter'){sendPeer({type:'command',cmd,value});return;}
    const oldSlide=state.slide;
    if(cmd==='next'){stopAuto();if(state.step<scene().steps-1)state.step++;else if(state.slide<deck.scenes.length-1){state.slide++;state.step=0;}}
    else if(cmd==='back'){stopAuto();if(state.step>0)state.step--;else if(state.slide>0){state.slide--;state.step=scene().steps-1;}}
    else if(cmd==='next-slide'){stopAuto();state.slide=Math.min(deck.scenes.length-1,state.slide+1);state.step=0;}
    else if(cmd==='previous-slide'){stopAuto();state.slide=Math.max(0,state.slide-1);state.step=0;}
    else if(cmd==='jump'){stopAuto();state.slide=index(value,deck.scenes.length-1);state.step=0;}
    else if(cmd==='replay'){stopAuto();state.step=0;}
    else if(cmd==='play'){
      if(auto)stopAuto();else{if(state.step===scene().steps-1)state.step=0;state.playing=true;auto=setInterval(()=>{if(state.step<scene().steps-1){state.step++;update();}else{stopAuto();update(false);}},1400);}
    }
    else if(cmd==='blackout'){state.blanked=!state.blanked;}
    else if(cmd==='clock'){if(state.running){state.elapsed=elapsed();state.running=false;}else{clockStart=Date.now();state.running=true;}}
    else if(cmd==='reset-clock'){state.elapsed=0;clockStart=Date.now();}
    update(oldSlide===state.slide);
  }
  function sourceList(sc,target){
    const links=[{url:sourceLink(deck.source),text:'Lecture reading'}];
    if(sc.demo)links.push({url:sourceLink(deck.source)+'#'+sc.demo,text:'Original interactive demo'});
    (sc.sources||[]).filter(s=>s!==deck.source).forEach((s,i)=>links.push({url:sourceLink(s),text:s.startsWith(deck.source+'#')?'Reading section':'Source '+(i+1)}));
    links.forEach((l,i)=>{if(i)target.append(document.createTextNode(' · '));const a=el('a','',l.text);a.href=l.url;a.target='_blank';a.rel='noopener';target.append(a);});
  }
  function notesParagraphs(target,text){
    String(text).split(/\n\s*\n|\n/).filter(Boolean).forEach(p=>target.append(el('p','',p)));
  }
  function teachingNotes(target,sc,step=null){
    if(!sc.teaching){notesParagraphs(target,sc.notes);return;}
    const t=sc.teaching;
    const paragraph=(parent,label,value,cls='')=>{
      const p=el('p',cls);p.append(el('strong','',label+' '),document.createTextNode(value));parent.append(p);
    };
    paragraph(target,'Main idea:',t.idea,'teaching-idea');
    const build=(parent,i)=>paragraph(parent,`Step ${i+1}:`,t.builds[i]);
    if(step===null){t.builds.forEach((_,i)=>build(target,i));}
    else{
      const current=el('div','teaching-current');
      current.append(el('p','build',`Step ${step+1} of ${sc.steps}: ${sc.states[step]}`));
      current.append(el('p','',t.builds[step]));target.append(current);
    }
    paragraph(target,'Ask the class:',t.question);
    if(step===null)paragraph(target,'Expected answer:',t.answer);
    else{
      const answer=el('details','teaching-answer');answer.append(el('summary','','Expected answer'),el('p','',t.answer));target.append(answer);
      const all=el('details','teaching-all');all.append(el('summary','','All animation steps'));t.builds.forEach((_,i)=>build(all,i));target.append(all);
    }
    if(t.context)paragraph(target,'Teaching context:',t.context,'teaching-context');
  }
  function presenter(){
    document.body.className='presenter';document.body.innerHTML='<header><div><h1></h1><p>Presenter view · 60 teaching minutes · quizzes separate</p><span class="connection" id="connection"></span></div><div><span class="clock" id="clock">0:00</span> <button id="clock-button">Start clock</button> <button id="reset-clock">↺</button></div></header><div class="workspace"><section><div class="preview" id="preview"></div><div class="timing"><span id="scene-time"></span><span id="pace"></span></div><div class="speaker-tools" id="speaker-tools"></div><div class="timeline"><span id="timeline-progress"></span></div><label for="jump">Slide </label><select id="jump"></select><p class="next" id="next-scene"></p><a class="guide-link" id="guide-link" target="_blank">Full teaching guide</a></section><section id="notes" aria-live="polite"></section></div>';
    document.querySelector('h1').textContent=`${pad(id)} · ${deck.title}`;const s=svg();s.id='presenter-canvas';$('preview').append(s);
    [['←','Previous build','back'],['→','Next build','next'],['↺','Replay scene','replay'],['▷','Play or pause animation','play'],['▸▸','Next slide','next-slide'],['◼','Blank audience screen','blackout']].forEach(([t,l,c])=>$('speaker-tools').append(button(t,l,()=>command(c))));
    $('clock-button').onclick=()=>command('clock');$('reset-clock').title='Reset lecture clock';$('reset-clock').onclick=()=>command('reset-clock');
    $('guide-link').href=location.pathname.split('/').pop()+'?guide=1';
    deck.scenes.forEach((sc,i)=>{const o=el('option','',`${pad(i+1)} · ${sc.title}`);o.value=i;$('jump').append(o);});$('jump').onchange=()=>command('jump',Number($('jump').value));
    $('connection').textContent=window.opener||channel?'Connecting to audience window…':'Open the lecture deck first, then press N to connect this presenter view.';
    const receive=e=>{if(e.data?.scope!=='course-visual-deck'||e.data.id!==id)return;if(e.data.type==='ink'){window.dispatchEvent(new CustomEvent('deck-ink-remote',{detail:e.data.detail}));return;}if(e.data.type!=='state')return;const changed=e.data.state.slide!==state.slide||e.data.state.step!==state.step;Object.assign(state,e.data.state);clockStart=Date.now();$('connection').textContent='Connected to audience window';drawPresenter(changed);};
    if(channel)channel.onmessage=receive;else window.addEventListener('message',e=>{if(e.source===window.opener)receive(e);});
    sendPeer({type:'ready'});drawPresenter(true);
  }
  function drawPresenter(changed){
    const sc=scene();if(changed||!$('presenter-canvas').childElementCount)render($('presenter-canvas'),sc,state.step,changed);
    $('clock').textContent=time(elapsed());$('clock-button').textContent=state.running?'Pause clock':'Start clock';
    $('scene-time').textContent=`${starts[state.slide]}–${starts[state.slide]+sc.minutes} min · ${sc.minutes} min here`;
    $('pace').textContent=`Build ${state.step+1} / ${sc.steps}`;
    $('timeline-progress').style.width=Math.min(100,elapsed()/60/total*100)+'%';$('jump').value=state.slide;
    $('next-scene').textContent=state.slide+1<deck.scenes.length?'Next: '+deck.scenes[state.slide+1].title:'Final scene';
    const notes=$('notes');if(changed||!notes.childElementCount){notes.replaceChildren(el('h2','',sc.title));if(!sc.teaching)notes.append(el('p','build',sc.states?.[state.step]||`Build ${state.step+1}`));teachingNotes(notes,sc,state.step);const sources=el('p','sources');sourceList(sc,sources);notes.append(sources);notes.scrollTop=0;}
  }
  function guide(){
    document.body.className='guide';const tools=el('div','guide-tools');const a=el('a','','← Lecture deck');a.href=location.pathname.split('/').pop();tools.append(a,button('Print teaching guide','Print teaching guide',()=>window.print()));document.body.append(tools,el('h1','',deck.title));document.body.append(el('p','intro',`${deck.date} · ${deck.scenes.length} scenes · ${total} teaching minutes. Scheduled quizzes are separate. Advance each animation with the right arrow or Space. Pause at the prediction prompts before revealing the next build.`));
    deck.scenes.forEach((sc,i)=>{const article=el('article');article.append(el('div','meta',`${pad(i+1)} · ${starts[i]}–${starts[i]+sc.minutes} min · ${sc.steps} builds`),el('h2','',sc.title));const row=el('div','guide-row'),preview=svg(),notes=el('div');render(preview,sc,sc.steps-1);row.append(preview,notes);if(sc.definition)notes.append(el('p','',`${sc.term}: ${sc.definition}`));teachingNotes(notes,sc);if(sc.states&&!sc.teaching)notes.append(el('p','meta','Builds: '+sc.states.join(' / ')));const sources=el('p','sources');sourceList(sc,sources);notes.append(sources);article.append(row);document.body.append(article);});
  }
  function openPresenter(){if(channel){$('presenter').click();return;}if(presenterWindow&&!presenterWindow.closed){presenterWindow.focus();publish();return;}const url=location.pathname.split('/').pop()+'?presenter=1&session='+encodeURIComponent(session);presenterWindow=window.open(url,'course-presenter-'+id,'popup,width=1300,height=850');if(!presenterWindow)announce('Allow pop-ups to open presenter view.');}
  function fullscreen(){if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});else if(document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(()=>announce('Use your browser’s full-screen command.'));else announce('Use your browser’s full-screen command.');}
  function closeOverlay(){const overlay=$('overlay');if(overlay)overlay.remove();$('overview').focus();}
  function overlay(mode){
    if($('overlay')){closeOverlay();return;}
    const wrap=el('section');wrap.id='overlay';wrap.setAttribute('role','dialog');wrap.setAttribute('aria-modal','true');wrap.setAttribute('aria-label',mode==='help'?'Presentation controls':'Lecture overview');const header=el('header');header.append(el('h1','',mode==='help'?'Presentation controls':deck.title),button('×','Close dialog',closeOverlay));wrap.append(header);
    if(mode==='help'){
      const help=el('div','help');help.innerHTML='<p>One build at a time. Pause to let the class predict what moves next.</p><dl><dt>→ or Space</dt><dd>Next build, then next slide</dd><dt>←</dt><dd>Previous build</dd><dt>Page Down / Page Up</dt><dd>Next / previous slide</dd><dt>R</dt><dd>Reset this scene</dd><dt>A</dt><dd>Play / pause this animation</dd><dt>N</dt><dd>Open separate presenter view</dd><dt>F</dt><dd>Full screen</dd><dt>B</dt><dd>Blank / restore audience screen</dd><dt>D / H / E</dt><dd>Pen / highlighter / eraser</dd><dt>L</dt><dd>Laser pointer</dd><dt>U / C</dt><dd>Undo / clear this slide’s ink</dd><dt>O</dt><dd>Slide overview</dd><dt>?</dt><dd>These controls</dd></dl><p>Each deck contains 60 minutes of teaching. Start the lecture clock in presenter view. Notes, discussion prompts, answers, and sources appear there. Keep the audience window on the projector.</p><p>On a tablet, use landscape orientation. Swipe left or right while drawing is off, or tap the navigation controls. Pen mode keeps swipes from changing slides. After a stylus is detected, finger touches on the ink layer are ignored. Ink saves with each slide in this browser. Clear is undoable. Animation playback stops at the end of the current scene. Reduced-motion preferences are respected.</p>';
      wrap.append(help);
    }else{
      const grid=el('div');grid.id='overview-list';deck.scenes.forEach((sc,i)=>{const b=button('','Go to slide '+(i+1)+': '+sc.title,()=>{command('jump',i);closeOverlay();});b.setAttribute('aria-current',i===state.slide);const s=svg();render(s,sc,sc.steps-1);const caption=el('div','caption');caption.append(el('span','',pad(i+1)),el('strong','',sc.title));b.append(s,caption);grid.append(b);});wrap.append(grid);
    }
    document.body.append(wrap);header.querySelector('button').focus();
    wrap.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const focusable=[...wrap.querySelectorAll('a,button,input,select')],first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
  }
  function wake(){document.body.classList.remove('quiet');clearTimeout(quietTimer);quietTimer=setTimeout(()=>{if(!$('overlay'))document.body.classList.add('quiet');},2700);}
  function audience(){
    document.body.innerHTML='<main id="stage"><svg id="canvas" viewBox="0 0 1280 720"></svg></main><div id="blackout" aria-hidden="true"></div><nav class="toolbar" aria-label="Presentation controls"></nav><div id="build-progress" aria-hidden="true"></div><div id="status" role="status"></div><div id="live" class="sr-only" aria-live="polite"></div>';
    const toolbar=document.querySelector('.toolbar'),home=el('a','','⌂');home.href='index.html';home.title='All lecture decks';home.setAttribute('aria-label','All lecture decks');toolbar.append(home);
    const sep=()=>el('span','divider');toolbar.append(sep());
    [['back','←','Previous build (←)','back'],['forward','→','Next build (Space)','next']].forEach(([id,t,l,c])=>{const b=button(t,l,()=>command(c));b.id=id;toolbar.append(b);});const count=el('span','count');count.id='counter';toolbar.append(count);
    [['play','▷','Play this animation (A)','play'],['replay','↺','Reset scene (R)','replay']].forEach(([id,t,l,c])=>{const b=button(t,l,()=>command(c));b.id=id;toolbar.append(b);});toolbar.append(sep());
    [['overview','▦','Slide overview (O)',()=>overlay('overview')],['fullscreen','⤢','Full screen (F)',fullscreen],['help','?','Controls (?)',()=>overlay('help')]].forEach(([id,t,l,fn])=>{const b=button(t,l,fn);b.id=id;toolbar.append(b);});
    const presenterLink=el('a','','▣');presenterLink.id='presenter';presenterLink.href=location.pathname.split('/').pop()+'?presenter=1&session='+encodeURIComponent(session);presenterLink.target='_blank';presenterLink.title='Open presenter view (N)';presenterLink.setAttribute('aria-label','Open presenter view (N)');if(channel)presenterLink.rel='noopener';else presenterLink.onclick=e=>{e.preventDefault();openPresenter();};toolbar.insertBefore(presenterLink,$('fullscreen'));
    readHash();update(false);wake();
    const receive=e=>{if(e.data?.scope!=='course-visual-deck'||e.data.id!==id)return;if(e.data.type==='ready'){publish();window.dispatchEvent(new Event('deck-ink-sync-request'));}if(e.data.type==='command'&&e.data.cmd==='ink'){window.dispatchEvent(new CustomEvent('deck-ink-remote',{detail:e.data.value}));return;}if(e.data.type==='command'&&['next','back','replay','play','next-slide','previous-slide','jump','clock','reset-clock','blackout'].includes(e.data.cmd))command(e.data.cmd,e.data.value);};
    if(channel)channel.onmessage=receive;else window.addEventListener('message',e=>{if(e.source===presenterWindow)receive(e);});
    $('presenter').dataset.presenterUrl=location.pathname.split('/').pop()+'?presenter=1&session='+encodeURIComponent(session);
    window.addEventListener('hashchange',()=>{if(!hashWrite){stopAuto();readHash();update(false);}});window.addEventListener('pointermove',wake);window.addEventListener('pointerdown',wake);
    let start=null;$('stage').addEventListener('touchcancel',()=>{start=null;},{passive:true});$('stage').addEventListener('touchstart',e=>{if(e.touches.length!==1){start=null;return;}if(document.body.dataset.inkMode&&document.body.dataset.inkMode!=='none')return;if(e.touches.length===1)start={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});$('stage').addEventListener('touchend',e=>{if(!start)return;const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.5)command(dx<0?'next':'back');start=null;},{passive:true});
  }
  if(role==='guide'){guide();return;}if(role==='presenter')presenter();else audience();
  window.addEventListener('keydown',e=>{
    if(/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)&&e.key!=='Escape')return;
    if(/^(BUTTON|A)$/.test(e.target.tagName)&&[' ','Enter'].includes(e.key))return;
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    if($('overlay')){if(e.key==='Escape'){e.preventDefault();closeOverlay();}return;}
    const map={ArrowRight:'next',' ':'next',ArrowLeft:'back',PageDown:'next-slide',PageUp:'previous-slide',r:'replay',R:'replay',a:'play',A:'play',b:'blackout',B:'blackout'};
    if(map[e.key]){e.preventDefault();command(map[e.key]);}
    else if(e.key==='Home'){e.preventDefault();command('jump',0);}else if(e.key==='End'){e.preventDefault();command('jump',deck.scenes.length-1);}
    else if(role==='audience'){if(e.key.toLowerCase()==='n')openPresenter();else if(e.key.toLowerCase()==='f')fullscreen();else if(e.key.toLowerCase()==='o')overlay('overview');else if(e.key==='?')overlay('help');}
  });
  setInterval(()=>{if(role==='audience')publish();else{if(!channel&&(!window.opener||window.opener.closed))$('connection').textContent='Audience window is closed. Reopen the deck and press N.';drawPresenter(false);}},1000);
  window.addEventListener('pagehide',()=>{stopAuto();clearTimeout(quietTimer);});
  // Narrow read-only hooks for deterministic validation and accessible integrations.
  window.CoursePlayer={getState:()=>({...state}),deck,role,requestInk:()=>sendPeer({type:'ready'}),sendInk:detail=>{if(role==='presenter')sendPeer({type:'command',cmd:'ink',value:detail});else sendPeer({type:'ink',detail});}};
})();
