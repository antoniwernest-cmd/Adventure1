(function(){
 'use strict';
 const C=window.LanguageCore,D=window.LANGUAGE_DATA,O=window.SCHOOL_OBJECTS,$=id=>document.getElementById(id),KEY='language-adventures-progress-v1';
 let state=C.fresh(),storageFailed=false;
 try{state=C.restore(localStorage.getItem(KEY));}catch(e){storageFailed=true;}
 if(!O.some(o=>o.id===state.selected))state.selected='';
 const page=document.body.dataset.page,requested=new URLSearchParams(location.search).get('game'),key=C.games[requested]?requested:'pronoun',meta=C.games[key];
 let p=null,g=null,item=null,e=null,level='A',position=0,bankOrder=[],slots=[],activeSlot=0,poolView='build',lastTick=0,feedback='',feedbackKind='',hintShown=false,drag=null,suppressUntil=0,returnFocus=null,voiceToken=0,currentRead=null;
 let rate=.82;
 try{rate=Number(localStorage.getItem('language-adventures-speed-v1'))||.82;}catch(err){}
 const allowedRates=[.65,.82,1,1.15,1.3];if(!allowedRates.includes(rate))rate=.82;
 function save(){if(e&&lastTick){const now=performance.now();e.seconds=(e.seconds||0)+Math.min(60,Math.max(0,(now-lastTick)/1000));lastTick=now;}try{localStorage.setItem(KEY,JSON.stringify(state));}catch(err){storageFailed=true;showStorage();}}
 function showStorage(){const box=$('storage-note');if(box){box.hidden=!storageFailed;box.textContent=storageFailed?'Browser saving is unavailable. Download the assessment before closing.':'';}}
 function stop(){voiceToken++;currentRead=null;window.speechSynthesis?.cancel();}
 function voiceText(){
  const passage=C.clean(item.passage||'').replace(/___/g,'blank');
  if(key==='paragraph')return item.title+'. '+item.question+' Sentence bank. '+bankOrder.map((id,i)=>'Sentence '+(i+1)+'. '+item.sentences[id]).join(' ');
  return passage+' '+item.question+' '+bankOrder.map((value,i)=>String.fromCharCode(65+i)+'. '+value+(key==='homophone'?', spelled '+[...value].map(c=>/[’']/.test(c)?'apostrophe':c).join(', '):'')).join('. ');
 }
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
  const summary=[['Picture ID','Activity','Version','Completed','Questions','Checks / choices','Hints','Listens','Active seconds']];
  const progress=[['Picture ID','Activity','Version','Question','Topic','Earned credit','Current response correct','Current response','Target / one accepted paragraph','Offered choices / sentences','Attempts','Hints','Listens','Support','Assessment type','Active seconds']];
  const attempts=[['Picture ID','Time','Activity','Version','Question','Event','Response','Correct','New point','Input method','Attempts so far','Hints','Listens','Support','Assessment type','Active seconds']];
  for(const id of ids){const profile=state.profiles[id]||{games:{},attempts:[]},object=O.find(o=>o.id===id).name;
   for(const [game,metadata]of Object.entries(C.games))for(const lv of C.levels){
    const rows=D[game][lv],entries=profile.games?.[game]?.[lv]?.entries||{},values=Object.values(entries);
    summary.push([object,metadata.name,lv,values.filter(x=>x.complete).length,rows.length,values.reduce((n,x)=>n+(x.tries||0),0),values.reduce((n,x)=>n+(x.hints||0),0),values.reduce((n,x)=>n+(x.listens||0),0),Math.round(values.reduce((n,x)=>n+(x.seconds||0),0))]);
    for(const row of rows){const x=entries[row.id]||{};progress.push([object,metadata.name,lv,row.id,row.title,x.complete?'Yes':'No',x.solved?'Yes':'No',C.describe(row,x.response),C.target(row),(row.sentences||row.options).join(' | '),x.tries||0,x.hints||0,x.listens||0,x.support||'',x.assessment||'',Math.round(x.seconds||0)]);}
   }
   for(const x of profile.attempts||[])attempts.push([object,x.time,C.games[x.game]?.name||x.game,x.level,x.item,x.event,x.response,x.correct===null?'':x.correct?'Yes':'No',x.newPoint?'Yes':'No',x.method,x.tries,x.hints,x.listens,x.support,x.assessment,x.seconds]);
  }
  const guide=[['Topic','Notes'],['Profiles','Use the same picture ID to continue. Progress is stored in this browser.'],['Versions','A has shorter passages or three-sentence paragraphs. AA has longer passages or four-sentence paragraphs. Each activity has 30 questions per version.'],['Pronoun Detective','Choose the named person, group or thing referred to by the highlighted pronoun.'],['Homophone Harbour','Use the written context to choose the correct spelling. Listen spells each choice aloud because homophones sound alike.'],['Paragraph Builder','Build a paragraph and leave out one sentence about the same setting that does not support its main idea. AA accepts either order for its two independent supporting details.'],['Meaning Master','Use context clues to interpret the highlighted word.'],['Credit','Each question earns credit once. Reset question preserves earned credit and assessment history.'],['Assessment','Attempts include incorrect answers and retries. Hints, listens, support and formative/summative choices are recorded.'],['Teacher voice','Enter 259 in Teacher voice settings to enable or disable voice for all four activities.'],['Picture use','All 34 story illustrations were created for Language Adventures using the built-in image generation tool. Browse them from View pictures on the landing pad. See ARTWORK.json for the prompt set.']];
  download('Language-Adventures-'+(all?'all-picture-IDs':state.selected)+'-'+new Date().toISOString().slice(0,10)+'.xlsx',window.SpellingExcel.workbook([{name:'Summary',rows:summary},{name:'Progress',rows:progress},{name:'Attempts',rows:attempts},{name:'Guide',rows:guide}]));
 }
 if(page==='landing'){
  $('export-all').onclick=()=>exportAssessment(true);
  const chosen=O.find(o=>o.id===state.selected);
  if(chosen){$('resume-note').textContent='Continue with '+chosen.name+' · change your picture inside any activity.';}
  window.addEventListener('pagehide',stop);return;
 }
 document.title=meta.name+' · Language Adventures';document.body.dataset.game=key;
 $('game-title').textContent=meta.name;$('game-tag').textContent=meta.tag;$('profile-title').textContent='Choose your picture ID';
 function date(){const d=new Date();$('today').textContent=d.toLocaleDateString('en-CA',{weekday:'long',month:'long',day:'numeric',year:'numeric'});$('today').dateTime=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
 date();showStorage();
 function chooseProfile(id){save();stop();state.selected=id;p=C.profile(state,id);g=C.game(p,key);if(!C.levels.includes(g.level))g.level='A';level=g.level;save();$('profile-dialog').close();load(false);}
 function showProfiles(){stop();save();returnFocus=document.activeElement;const dialog=$('profile-dialog');if(!dialog.open)dialog.showModal();}
 const grid=$('profile-grid');for(const object of O){const b=document.createElement('button');b.type='button';b.className='profile-tile';b.setAttribute('aria-label','Choose '+object.name);const img=document.createElement('img'),label=document.createElement('span');img.src=object.image;img.alt='';label.textContent=object.name;b.append(img,label);b.onclick=()=>chooseProfile(object.id);grid.append(b);}
 $('profile-dialog').addEventListener('cancel',event=>{if(!state.selected)event.preventDefault();});
 $('profile-dialog').addEventListener('close',()=>returnFocus?.focus());
 $('profile-cancel').onclick=()=>{if(state.selected)$('profile-dialog').close();else location.href='index.html';};
 $('profile-button').onclick=showProfiles;
 function setView(view){$('activity').dataset.view=view;document.querySelectorAll('[data-view-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.viewChoice===view)));}
 document.querySelectorAll('[data-view-choice]').forEach(b=>b.onclick=()=>setView(b.dataset.viewChoice));
 function setPool(view){poolView=view;$('paragraph-area').dataset.pool=view;document.querySelectorAll('[data-pool-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.poolChoice===view)));}
 document.querySelectorAll('[data-pool-choice]').forEach(b=>b.onclick=()=>setPool(b.dataset.poolChoice));
 function focusPassage(container,text){
  container.replaceChildren();for(const part of text.split(/(\{.*?\})/g)){if(!part)continue;if(part.startsWith('{')){const mark=document.createElement('mark'),focus=part.slice(1,-1);mark.textContent=key==='homophone'&&e.response?e.response:focus;mark.className=key==='homophone'?(e.solved?'chosen-word correct':e.response?'chosen-word trying':'blank'):'focus-word';container.append(mark);}else container.append(document.createTextNode(part));}
 }
 function renderChoice(){
  focusPassage($('passage'),item.passage);$('choices').replaceChildren();bankOrder.forEach((value,i)=>{const b=document.createElement('button'),letter=document.createElement('span'),label=document.createElement('span');b.type='button';b.className='answer'+(e.response===value?(e.solved?' correct':' incorrect'):'');b.dataset.choice=value;b.disabled=e.solved;b.setAttribute('aria-pressed',String(e.response===value));letter.className='choice-letter';letter.textContent=String.fromCharCode(65+i);label.textContent=value;b.append(letter,label);b.onclick=()=>{if(Date.now()<suppressUntil)return;save();stop();const result=C.submit(p,key,level,item,value);feedback=result.correct?item.why:'Try another answer. Read the whole passage and compare the clues.';feedbackKind=result.correct?'correct':'retry';save();render();};$('choices').append(b);});
 }
 function editParagraph(){e.response=slots.slice();e.solved=false;feedback='';feedbackKind='';save();renderParagraph();renderFeedback();}
 function put(piece,slot,method='Tap'){
  if(e.solved||slot<0||slot>=slots.length)return;
  const from=slots.indexOf(piece),previous=slots[slot];
  if(from>=0)slots[from]=previous;slots[slot]=piece;activeSlot=slots.findIndex(x=>x===null);if(activeSlot<0)activeSlot=slot;
  e.lastMethod=method;editParagraph();
 }
 $('enlarge-picture').onclick=()=>{stop();save();$('large-picture').src=item.image;$('large-picture').alt=item.alt;$('large-picture-title').textContent=item.title;$('picture-dialog').showModal();};
 $('close-picture').onclick=()=>$('picture-dialog').close();
 $('picture-dialog').addEventListener('close',()=>$('enlarge-picture').focus());
 function renderParagraph(){
  const length=item.orders[0].length;slots=Array.isArray(e.response)&&e.response.length===length?e.response.slice():Array(length).fill(null);
  $('paragraph-slots').replaceChildren();slots.forEach((piece,i)=>{
   const row=document.createElement('div'),slot=document.createElement('button'),number=document.createElement('span'),text=document.createElement('span');row.className='slot-row';slot.type='button';slot.className='sentence-slot'+(piece===null?' empty':' filled')+(i===activeSlot?' active':'');slot.dataset.slot=String(i);if(piece!==null)slot.dataset.piece=String(piece);slot.disabled=e.solved;number.className='slot-number';number.textContent=String(i+1);text.textContent=piece===null?(level==='A'?['Topic sentence','Supporting detail','Closing sentence'][i]:['Topic sentence','Supporting detail','Supporting detail','Closing sentence'][i]):item.sentences[piece];slot.setAttribute('aria-label','Slot '+(i+1)+': '+text.textContent);slot.append(number,text);slot.onclick=()=>{if(Date.now()<suppressUntil||e.solved)return;if(piece===null){activeSlot=i;setPool('bank');renderParagraph();}else{slots[i]=null;activeSlot=i;setPool('bank');editParagraph();}};row.append(slot);
   if(piece!==null){const moves=document.createElement('div');moves.className='move-buttons';for(const [delta,label]of [[-1,'↑'],[1,'↓']]){const b=document.createElement('button');b.type='button';b.textContent=label;b.disabled=e.solved||i+delta<0||i+delta>=length;b.setAttribute('aria-label','Move sentence '+(i+1)+(delta<0?' up':' down'));b.onclick=()=>{[slots[i],slots[i+delta]]=[slots[i+delta],slots[i]];activeSlot=i+delta;editParagraph();};moves.append(b);}row.append(moves);}
   $('paragraph-slots').append(row);
  });
  $('sentence-bank').replaceChildren();for(const piece of bankOrder){if(slots.includes(piece))continue;const b=document.createElement('button');b.type='button';b.className='bank-sentence';b.dataset.piece=String(piece);b.textContent=item.sentences[piece];b.disabled=e.solved;b.onclick=()=>{if(Date.now()<suppressUntil||e.solved)return;let slot=slots[activeSlot]===null?activeSlot:slots.findIndex(x=>x===null);if(slot<0){feedback='Remove a sentence from your paragraph before choosing another.';feedbackKind='retry';renderFeedback();return;}put(piece,slot);setPool(slots.some(x=>x===null)?'bank':'build');};$('sentence-bank').append(b);}
  const placed=slots.filter(x=>x!==null).length;
  $('check-paragraph').hidden=placed<length||e.solved;$('check-paragraph').disabled=e.solved||placed<length;$('paragraph-status').textContent=placed+' of '+length+' placed · '+(e.solved?'Paragraph complete.':placed<length?'Choose a sentence to add next. Leave one out.':'Read your paragraph, then check it.');
  document.querySelector('[data-pool-choice="build"]').textContent='My paragraph ('+placed+'/'+length+')';document.querySelector('[data-pool-choice="bank"]').textContent='Choose sentences';setPool(poolView);
 }
 function renderFeedback(){$('feedback').textContent=key==='paragraph'&&e.solved?'Well done! Your paragraph stays on one topic.':feedback;$('feedback').className='feedback '+feedbackKind;$('hint-box').hidden=!hintShown;$('hint-box').textContent=hintShown?item.hint:'';if(hintShown&&!$('hint-dialog').open)$('hint-dialog').showModal();else if(!hintShown&&$('hint-dialog').open)$('hint-dialog').close();$('hint').textContent=hintShown?'Hide hint':'Show hint';}
 function render(){
  const paragraph=key==='paragraph';$('choice-area').hidden=paragraph;$('paragraph-area').hidden=!paragraph;$('question-prompt').textContent=paragraph?'Build a paragraph. Leave one sentence out.':item.question;
  if(paragraph)renderParagraph();else{$('check-paragraph').hidden=true;renderChoice();}renderFeedback();
  const done=C.count(p,key,level);$('score').textContent=done+' / '+D[key][level].length+' solved';$('question-number').textContent=(position+1)+' / '+D[key][level].length;
  $('journey-fill').style.width=(C.total(p)/240*100)+'%';$('journey-count').textContent=C.total(p)+' / 240';
  $('previous').disabled=position===0;$('next').textContent=position===D[key][level].length-1?'Finish →':'Next →';
  $('listen').disabled=window.TeacherVoice?.isEnabled()===false;$('reading-voice-speed').disabled=$('listen').disabled;
  $('voice-note').textContent=$('listen').disabled?'Voice is off. Your teacher can enable it.':'Tap Listen to read this activity.';
  document.querySelectorAll('[data-level]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.level===level)));
  document.querySelectorAll('[data-support]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.support===e.support)));
  $('assessment-type').value=e.assessment||'Formative';
 }
 function load(read=true){
  stop();cancelDrag();g=C.game(p,key);level=g.level;position=Math.max(0,Math.min(D[key][level].length-1,Number(g[level].position)||0));g[level].position=position;item=D[key][level][position];e=C.entry(p,key,level,item);lastTick=performance.now();hintShown=false;feedback=e.solved?item.why:e.tries?'You can try again. Read the clues carefully.':'';feedbackKind=e.solved?'correct':'';
  const source=item.sentences?item.sentences.map((_,i)=>i):item.options;
  if(!Array.isArray(e.bankOrder)||e.bankOrder.length!==source.length||new Set(e.bankOrder).size!==source.length||!e.bankOrder.every(x=>source.includes(x)))e.bankOrder=C.shuffle(source);
  bankOrder=e.bankOrder.slice();slots=item.sentences?(Array.isArray(e.response)?e.response.slice():Array(item.orders[0].length).fill(null)):[];activeSlot=Math.max(0,slots.findIndex(x=>x===null));poolView=slots.some(x=>x===null)?'bank':'build';
  $('topic').textContent=item.title;$('scene-image').src=item.image;$('scene-image').alt=item.alt;$('profile-image').src=O.find(o=>o.id===state.selected).image;$('profile-name').textContent=O.find(o=>o.id===state.selected).name;
  $('finish-dialog').open&&$('finish-dialog').close();setView('work');render();save();if(read)listen();
 }
 document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{if(!p||level===b.dataset.level)return;save();g.level=b.dataset.level;save();load();});
 $('previous').onclick=()=>{if(position>0){save();g[level].position=position-1;load();}};
 $('next').onclick=()=>{save();if(position<D[key][level].length-1){g[level].position=position+1;load();}else{stop();$('finish-title').textContent=meta.name+' · '+level;$('finish-text').textContent='You have reached all '+D[key][level].length+' questions. You have solved '+C.count(p,key,level)+' of them. You can review, try the other version or choose another adventure.';$('finish-dialog').showModal();}};
 $('review').onclick=()=>{g[level].position=0;load(false);};$('finish-close').onclick=()=>$('finish-dialog').close();
 $('reset-question').onclick=()=>{save();stop();C.reset(p,key,level,item);slots=item.orders?Array(item.orders[0].length).fill(null):[];activeSlot=0;poolView='bank';feedback='';feedbackKind='';hintShown=false;render();save();};
 $('hint').onclick=()=>{if(!hintShown){e.hints++;C.log(p,key,level,item,e,'Hint',e.response);save();}hintShown=!hintShown;renderFeedback();};
 $('hint-close').onclick=()=>{hintShown=false;renderFeedback();};$('hint-dialog').addEventListener('cancel',()=>{hintShown=false;$('hint').textContent='Show hint';});
 $('check-paragraph').onclick=()=>{save();stop();const result=C.submit(p,key,level,item,slots,e.lastMethod||'Tap');feedback=result.correct?item.why:'Check the main idea and sentence order. One sentence does not support this main idea.';feedbackKind=result.correct?'correct':'retry';save();setPool('build');render();};
 $('listen').onclick=listen;$('stop').onclick=()=>{stop();$('voice-note').textContent='Voice stopped.';};$('reading-voice-speed').value=String(rate);$('reading-voice-speed').onchange=()=>{rate=Number($('reading-voice-speed').value);try{localStorage.setItem('language-adventures-speed-v1',String(rate));}catch(err){}if(currentRead)runVoice(currentRead);};
 $('export-current').onclick=()=>exportAssessment(false);$('export-all').onclick=()=>exportAssessment(true);
 document.querySelectorAll('[data-support]').forEach(b=>b.onclick=()=>{e.support=e.support===b.dataset.support?'':b.dataset.support;save();render();});
 $('assessment-type').onchange=()=>{e.assessment=$('assessment-type').value;save();};
 $('reset-profile').onclick=()=>{if(!state.selected)return;if(confirm('Reset all four Language Adventures for '+O.find(o=>o.id===state.selected).name+' in this browser? Download Excel first if you need a record.')){stop();lastTick=0;e=null;delete state.profiles[state.selected];p=C.profile(state,state.selected);g=C.game(p,key);save();load(false);}};
 function cancelDrag(){drag=null;document.body.classList.remove('dragging');$('drag-ghost').hidden=true;}
 document.addEventListener('pointerdown',event=>{const tile=event.target.closest('[data-piece]');if(key!=='paragraph'||!tile||e?.solved||event.button!==0||event.target.closest('.move-buttons'))return;drag={piece:Number(tile.dataset.piece),x:event.clientX,y:event.clientY,moved:false};});
 document.addEventListener('pointermove',event=>{if(!drag)return;if(Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>7)drag.moved=true;if(!drag.moved)return;if(event.cancelable)event.preventDefault();document.body.classList.add('dragging');const ghost=$('drag-ghost');ghost.hidden=false;ghost.textContent=item.sentences[drag.piece];ghost.style.left=Math.min(innerWidth-140,Math.max(4,event.clientX-90))+'px';ghost.style.top=Math.max(4,event.clientY-35)+'px';},{passive:false});
 document.addEventListener('pointerup',event=>{if(!drag)return;const held=drag;cancelDrag();if(!held.moved)return;suppressUntil=Date.now()+350;const hit=document.elementFromPoint(event.clientX,event.clientY),slot=hit?.closest('[data-slot]');if(slot){put(held.piece,Number(slot.dataset.slot),'Drag');return;}if(hit?.closest('#sentence-bank')){const from=slots.indexOf(held.piece);if(from>=0){slots[from]=null;activeSlot=from;editParagraph();}}});
 document.addEventListener('pointercancel',cancelDrag);document.addEventListener('keydown',event=>{if(event.key==='Escape')cancelDrag();});
 window.addEventListener('pagehide',()=>{save();stop();cancelDrag();lastTick=0;});document.addEventListener('visibilitychange',()=>{if(document.hidden){save();stop();cancelDrag();lastTick=0;}else{date();if(e)lastTick=performance.now();}});window.addEventListener('focus',date);
 if(state.selected){p=C.profile(state,state.selected);g=C.game(p,key);load(false);}else showProfiles();
})();
