(function(){
 'use strict';
 const C=window.LanguageCore,D=window.LANGUAGE_DATA,O=window.SCHOOL_OBJECTS,$=id=>document.getElementById(id),KEY='letter-writing-progress-v1',key='paragraph';
 let state=C.fresh(),storageFailed=false;try{state=C.restore(localStorage.getItem(KEY));}catch(err){storageFailed=true;}
 if(!O.some(o=>o.id===state.selected))state.selected='';
 let p=null,g=null,item=null,e=null,level='A',position=0,slots=[],lastTick=0,feedback='',feedbackKind='',returnFocus=null,voiceToken=0,currentRead=null,drag=null,successTimer=null;
 let requestedLevel=new URLSearchParams(location.search).get('level');if(!C.levels.includes(requestedLevel))requestedLevel=null;
 let rate=.82;try{rate=Number(localStorage.getItem('letter-writing-speed-v1'))||.82;}catch(err){}if(![.65,.82,1,1.15,1.3].includes(rate))rate=.82;
 function save(){if(e&&lastTick){const now=performance.now();e.seconds=(e.seconds||0)+Math.min(60,Math.max(0,(now-lastTick)/1000));lastTick=now;}try{localStorage.setItem(KEY,JSON.stringify(state));}catch(err){storageFailed=true;showStorage();}}
 function showStorage(){const box=$('storage-note');if(box){box.hidden=!storageFailed;box.textContent=storageFailed?'Browser saving is unavailable. Download the assessment before closing.':'';}}
 function stop(){voiceToken++;currentRead=null;window.speechSynthesis?.cancel();}
 function hideSuccess(){clearTimeout(successTimer);successTimer=null;$('letter-success').hidden=true;$('letter-success').classList.remove('celebrating');}
 function celebrate(){hideSuccess();$('letter-success').hidden=false;$('letter-success').classList.add('celebrating');successTimer=setTimeout(hideSuccess,2600);}

 function voiceText(){return 'Read your letter in its current order. '+item.greeting+' '+slots.map(i=>item.sentences[i]).join(' ')+' '+item.signoff+' '+item.sender;}
 function runVoice(text){
  stop();if(window.TeacherVoice?.isEnabled()===false)return;
  if(!('speechSynthesis'in window)){$('voice-note').textContent='Voice is unavailable in this browser.';return;}
  const token=voiceToken,u=new SpeechSynthesisUtterance(text);u.lang='en-CA';u.rate=rate;
  const voices=window.speechSynthesis.getVoices();u.voice=voices.find(v=>/^en[-_]CA/i.test(v.lang))||voices.find(v=>/^en/i.test(v.lang))||null;
  currentRead=text;$('voice-note').textContent='Listening…';
  u.onend=()=>{if(token===voiceToken){currentRead=null;$('voice-note').textContent='Tap Listen to hear it again.';}};
  u.onerror=()=>{if(token===voiceToken){currentRead=null;$('voice-note').textContent='Tap Listen to try again.';}};
  window.speechSynthesis.speak(u);
 }
 function listen(){if(!item||window.TeacherVoice?.isEnabled()===false)return;e.listens++;C.log(p,key,level,item,e,'Listen',e.response);save();runVoice(voiceText());}
 window.ReadingVoice={cancel:stop};
 function download(name,blob){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}

 function exportAssessment(all=false){
  save();const ids=all?O.map(o=>o.id):[state.selected].filter(Boolean);if(!ids.length){exportAssessment(true);return;}
  const summary=[['Picture ID','Level','Letters completed','Letters available','Attempts','Moves','Hints','Listens','Active seconds']];
  const progress=[['Picture ID','Level','Letter','Topic','Body sentences','Greeting','Sender','Earned credit','Current order correct','Current body order','One accepted body order','Attempts','Moves','Hints','Listens','Support','Assessment type','Active seconds']];
  const attempts=[['Picture ID','Time','Level','Letter','Event','Response','Correct','New point','Input method','Attempt number','Hints','Listens','Support','Assessment type','Active seconds']];
  for(const id of ids){const profile=state.profiles[id]||{games:{},attempts:[]},name=O.find(o=>o.id===id).name,completed=new Set();
   for(const lv of C.levels){const entries=profile.games?.paragraph?.[lv]?.entries||{},rows=D.paragraph[lv].filter(row=>entries[row.id]?.complete),values=rows.map(row=>entries[row.id]);
    if(!rows.length)continue;
    rows.forEach(row=>completed.add(lv+'|'+row.id));
    summary.push([name,lv,values.filter(x=>x.complete).length,50,...['tries','moves','hints','listens'].map(field=>values.reduce((n,x)=>n+(x[field]||0),0)),Math.round(values.reduce((n,x)=>n+(x.seconds||0),0))]);
    for(const row of rows){const x=entries[row.id];progress.push([name,lv,row.id,row.title,row.sentences.length,row.greeting,row.sender,x.complete?'Yes':'No',x.solved?'Yes':'No',C.describe(row,x.response),C.target(row),x.tries||0,x.moves||0,x.hints||0,x.listens||0,x.support||'',x.assessment||'Formative',Math.round(x.seconds||0)]);}
   }
   for(const x of profile.attempts||[])if(x.game===key&&completed.has(x.level+'|'+x.item))attempts.push([name,x.time,x.level,x.item,x.event==='Paragraph check'?'Letter check':x.event,x.response,x.correct===null?'':x.correct?'Yes':'No',x.newPoint?'Yes':'No',x.method,x.tries,x.hints,x.listens,x.support,x.assessment,x.seconds]);
  }
  const guide=[['Topic','Notes'],['Activity','Arrange the letter body vertically. The greeting and sign-off are provided outside the sortable body.'],['Levels','50 letters per level. A has exactly 3 body sentences; AA has exactly 4.'],['Report scope','Only letters with earned completion credit are included. Earlier incorrect attempts on those letters are included too.'],['Attempts','Each press of Check my letter is an attempt. Attempt numbers and totals persist through reloads and Start again. Hints and listens are separate events.'],['Controls','Use the up/down buttons or drag the grip. Check the letter to receive feedback.'],['Navigation','The next letter unlocks only after the current order is correct.'],['Credit','Each letter earns credit once. Start again preserves earned credit and history.'],['Profiles','20 story objects; choose the same picture to continue in this browser.'],['Teacher voice','259 enables or disables voice across this collection. Listen reads the current arranged order.'],['Pictures','Reuses 50 existing Before & After illustrations; no new story pictures were generated.']];
  download('Letter-Writing-'+(all?'all-picture-IDs':state.selected)+'-'+new Date().toISOString().slice(0,10)+'.xlsx',window.SpellingExcel.workbook([{name:'Summary',rows:summary},{name:'Progress',rows:progress},{name:'Attempts',rows:attempts},{name:'Guide',rows:guide}]));
 }
 $('game-title').textContent='Letter Writing';$('game-tag').textContent='Put your message in order.';document.body.dataset.game='paragraph';
 function date(){const d=new Date();$('today').textContent=d.toLocaleDateString('en-CA',{month:'short',day:'numeric'});$('today').dateTime=d.toISOString().slice(0,10);}date();showStorage();
 function chooseProfile(id){save();stop();state.selected=id;p=C.profile(state,id);g=C.game(p,key);if(!C.levels.includes(g.level))g.level='A';if(requestedLevel){g.level=requestedLevel;requestedLevel=null;}level=g.level;save();$('profile-dialog').close();load(false);}
 function showProfiles(){stop();save();returnFocus=document.activeElement;const dialog=$('profile-dialog');if(!dialog.open)dialog.showModal();}
 const grid=$('profile-grid');for(const object of O){const b=document.createElement('button');b.type='button';b.className='profile-tile';b.setAttribute('aria-label','Choose '+object.name);const img=document.createElement('img'),label=document.createElement('span');img.src=object.image;img.alt='';label.textContent=object.name;b.append(img,label);b.onclick=()=>chooseProfile(object.id);grid.append(b);}
 $('profile-dialog').addEventListener('cancel',event=>{if(!state.selected)event.preventDefault();});
 $('profile-dialog').addEventListener('close',()=>returnFocus?.focus());
 $('profile-cancel').onclick=()=>{if(state.selected)$('profile-dialog').close();else location.href='../index.html';};
 $('profile-button').onclick=showProfiles;
 function setView(view){$('activity').dataset.view=view;document.querySelectorAll('[data-view-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.viewChoice===view)));}
 document.querySelectorAll('[data-view-choice]').forEach(b=>b.onclick=()=>setView(b.dataset.viewChoice));

 function unlocked(){const entries=C.game(p,key)[level].entries;const index=D.paragraph[level].findIndex(row=>!entries[row.id]?.solved);return index<0?49:index;}
 function initialOrder(){let order=C.shuffle(item.sentences.map((_,i)=>i));if(C.correct(item,order))order.push(order.shift());return order;}
 function validOrder(order){return Array.isArray(order)&&order.length===item.sentences.length&&new Set(order).size===order.length&&order.every(i=>Number.isInteger(i)&&i>=0&&i<item.sentences.length);}
 function move(from,to,method='Arrow'){
  if(e.solved||from<0||to<0||from>=slots.length||to>=slots.length||from===to)return;
  const [piece]=slots.splice(from,1);slots.splice(to,0,piece);e.response=slots.slice();e.lastMethod=method;e.moves=(e.moves||0)+1;feedback='';feedbackKind='';save();render();
  document.querySelector('[data-drag-piece="'+piece+'"]').focus();
 }
 function renderLetter(){
  $('letter-greeting').textContent=item.greeting;$('letter-signoff').textContent=item.signoff;$('letter-sender').textContent=item.sender;
  $('letter-sentences').style.setProperty('--sentence-count',String(slots.length));$('letter-sentences').replaceChildren();
  slots.forEach((piece,index)=>{const row=document.createElement('li'),number=document.createElement('span'),text=document.createElement('span'),handle=document.createElement('button'),moves=document.createElement('div');
   row.className='letter-row';row.dataset.orderIndex=String(index);number.className='letter-number';number.textContent=String(index+1);text.className='letter-sentence';text.textContent=item.sentences[piece];
   handle.type='button';handle.className='letter-grip';handle.dataset.dragPiece=String(piece);handle.textContent='⠿';handle.disabled=e.solved;handle.setAttribute('aria-label','Drag sentence '+(index+1)+', or use its up and down buttons');
   moves.className='letter-moves';for(const [delta,label]of [[-1,'↑'],[1,'↓']]){const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.move=delta===-1?'up':'down';b.disabled=e.solved||index+delta<0||index+delta>=slots.length;b.setAttribute('aria-label','Move sentence '+(index+1)+(delta===-1?' up':' down'));b.onclick=()=>move(index,index+delta);moves.append(b);}
   row.append(handle,number,text,moves);$('letter-sentences').append(row);
  });
 }
 function render(){
  document.body.dataset.letterLevel=level;
  $('question-prompt').textContent='Order '+item.sentences.length+' sentences · use ↑ ↓ or drag.';renderLetter();
  $('feedback').textContent=e.solved?'Letter ready ✓. You can open the next letter.':feedback;$('feedback').className='feedback '+feedbackKind;
  $('score').textContent=C.count(p,key,level)+' / 50 letters';$('journey-fill').style.width=C.total(p)+'%';$('journey-count').textContent=C.total(p)+' / 100';
  $('previous').disabled=position===0;$('next').disabled=!e.solved;$('next').textContent=position===49?'Finish ✓':'Next letter →';$('next').title=e.solved?'Continue to the next letter.':'Put the sentences in order and check your letter first.';
  $('check-letter').disabled=e.solved;$('check-letter').textContent=e.solved?'Letter ready ✓':'Check my letter ✓';
  document.querySelectorAll('[data-level]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.level===level)));
  document.querySelectorAll('[data-support]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.support===e.support)));$('assessment-type').value=e.assessment||'Formative';
  const limit=unlocked();[...$('letter-select').options].forEach((option,i)=>{const row=D.paragraph[level][i];option.disabled=i>limit;option.textContent=(i+1)+'. '+row.title+(g[level].entries[row.id]?.solved?' ✓':i>limit?' · locked':'');});$('letter-select').value=String(position);
  $('listen').disabled=window.TeacherVoice?.isEnabled()===false;$('reading-voice-speed').disabled=$('listen').disabled;
 }
 function load(read=false){
  stop();cancelDrag();hideSuccess();g=C.game(p,key);if(!C.levels.includes(g.level))g.level='A';level=g.level;
  position=Math.max(0,Math.min(unlocked(),Number(g[level].position)||0));g[level].position=position;item=D.paragraph[level][position];e=C.entry(p,key,level,item);lastTick=performance.now();
  slots=validOrder(e.response)?e.response.slice():initialOrder();e.response=slots.slice();feedback=e.tries&&!e.solved?'Move a sentence and try again.':'';feedbackKind=e.solved?'correct':'';
  $('topic').textContent=item.title;$('scene-image').src=item.image;$('scene-image').alt=item.alt;
  const profile=O.find(o=>o.id===state.selected);$('profile-image').src=profile.image;$('profile-name').textContent=profile.name;
  $('letter-select').replaceChildren(...D.paragraph[level].map((row,i)=>{const option=document.createElement('option');option.value=String(i);return option;}));$('finish-dialog').open&&$('finish-dialog').close();setView('work');render();save();if(read)listen();
 }
 document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{if(level===b.dataset.level)return;save();g.level=b.dataset.level;load();});
 $('letter-select').onchange=()=>{save();const target=Number($('letter-select').value);if(target>unlocked()){$('letter-select').value=String(position);return;}g[level].position=target;load();};
 $('previous').onclick=()=>{if(position>0){save();g[level].position=position-1;load();}};
 $('next').onclick=()=>{if(!e.solved)return;save();if(position<49){g[level].position=position+1;load();}else{stop();$('finish-title').textContent='Level '+level+' letters complete';$('finish-text').textContent='You organised all 50 letters in this level. Review them or choose the other level.';$('finish-dialog').showModal();}};
 $('review').onclick=()=>{g[level].position=0;load();};$('finish-close').onclick=()=>$('finish-dialog').close();
 $('check-letter').onclick=()=>{hideSuccess();save();stop();const result=C.submit(p,key,level,item,slots,e.lastMethod||'Tap');feedback=result.correct?item.why:'Check the opening and closing. Move a sentence and try again.';feedbackKind=result.correct?'correct':'retry';save();render();if(result.correct){if(!result.ignored)celebrate();$('next').focus();}};
 $('reset-question').onclick=()=>{save();stop();C.reset(p,key,level,item);e.response=initialOrder();e.lastMethod='Tap';load();};
 $('hint').onclick=()=>{save();stop();e.hints++;C.log(p,key,level,item,e,'Hint',e.response);$('hint-box').textContent=item.hint;$('hint-dialog').showModal();save();};$('hint-close').onclick=()=>$('hint-dialog').close();$('hint-dialog').addEventListener('close',()=>$('hint').focus());
 $('enlarge-picture').onclick=()=>{save();stop();$('large-picture').src=item.image;$('large-picture').alt=item.alt;$('large-picture-title').textContent=item.title;$('picture-link').href='../pictures.html?picture=Before-and-After-Adventures-'+item.picture;$('picture-dialog').showModal();};$('close-picture').onclick=()=>$('picture-dialog').close();$('picture-dialog').addEventListener('close',()=>$('enlarge-picture').focus());
 $('listen').onclick=listen;$('stop').onclick=()=>{stop();$('voice-note').textContent='Voice stopped.';};$('reading-voice-speed').value=String(rate);$('reading-voice-speed').onchange=()=>{rate=Number($('reading-voice-speed').value);try{localStorage.setItem('letter-writing-speed-v1',String(rate));}catch(err){}if(currentRead)runVoice(currentRead);};
 $('export-current').onclick=()=>exportAssessment(false);$('export-all').onclick=()=>exportAssessment(true);
 document.querySelectorAll('[data-support]').forEach(b=>b.onclick=()=>{e.support=e.support===b.dataset.support?'':b.dataset.support;save();render();});$('assessment-type').onchange=()=>{e.assessment=$('assessment-type').value;save();};
 $('reset-profile').onclick=()=>{if(!confirm('Reset all Letter Writing progress for '+O.find(o=>o.id===state.selected).name+'?'))return;stop();lastTick=0;e=null;delete state.profiles[state.selected];p=C.profile(state,state.selected);g=C.game(p,key);save();$('teacher-tools').open=false;load();};
 function cancelDrag(){drag=null;document.body.classList.remove('dragging');$('drag-ghost').hidden=true;}
 document.addEventListener('pointerdown',event=>{const handle=event.target.closest('[data-drag-piece]');if(!handle||e?.solved||event.button!==0)return;drag={piece:Number(handle.dataset.dragPiece),x:event.clientX,y:event.clientY,moved:false};});
 document.addEventListener('pointermove',event=>{if(!drag)return;if(Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>7)drag.moved=true;if(!drag.moved)return;if(event.cancelable)event.preventDefault();const ghost=$('drag-ghost');document.body.classList.add('dragging');ghost.hidden=false;ghost.textContent=item.sentences[drag.piece];ghost.style.left=Math.max(4,Math.min(innerWidth-244,event.clientX-110))+'px';ghost.style.top=Math.max(4,event.clientY-25)+'px';},{passive:false});
 document.addEventListener('pointerup',event=>{if(!drag)return;const held=drag;cancelDrag();if(!held.moved)return;const row=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-order-index]');if(row)move(slots.indexOf(held.piece),Number(row.dataset.orderIndex),'Drag');});
 document.addEventListener('pointercancel',cancelDrag);document.addEventListener('keydown',event=>{if(event.key==='Escape'){cancelDrag();$('teacher-tools').open=false;}});
 document.addEventListener('pointerdown',event=>{const panel=$('teacher-tools');if(panel.open&&!panel.contains(event.target))panel.open=false;});
 window.addEventListener('pagehide',()=>{save();stop();cancelDrag();hideSuccess();lastTick=0;});document.addEventListener('visibilitychange',()=>{if(document.hidden){save();stop();cancelDrag();hideSuccess();lastTick=0;}else if(e)lastTick=performance.now();});
 setInterval(()=>{if(!document.hidden)save();},15000);
 if(state.selected){p=C.profile(state,state.selected);g=C.game(p,key);if(requestedLevel){g.level=requestedLevel;requestedLevel=null;}load();}else showProfiles();
})();
