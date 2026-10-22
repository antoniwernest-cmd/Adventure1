(function(){
 'use strict';
 const C=window.LanguageCore,D=window.LANGUAGE_DATA,O=window.SCHOOL_OBJECTS,$=id=>document.getElementById(id),KEY='before-after-adventures-progress-v1',key='sequence';
 let state=C.fresh(),storageFailed=false;
 try{state=C.restore(localStorage.getItem(KEY));}catch(err){storageFailed=true;}
 if(!O.some(o=>o.id===state.selected))state.selected='';
 let p=null,g=null,story=null,item=null,e=null,level='A',position=0,stage='before',bankOrder=[],lastTick=0,feedback='',feedbackKind='',returnFocus=null,voiceToken=0,currentRead=null;
 let rate=.82;try{rate=Number(localStorage.getItem('before-after-adventures-speed-v1'))||.82;}catch(err){}
 if(![.65,.82,1,1.15,1.3].includes(rate))rate=.82;
 function save(){if(e&&lastTick){const now=performance.now();e.seconds=(e.seconds||0)+Math.min(60,Math.max(0,(now-lastTick)/1000));lastTick=now;}try{localStorage.setItem(KEY,JSON.stringify(state));}catch(err){storageFailed=true;showStorage();}}
 function showStorage(){const box=$('storage-note');if(box){box.hidden=!storageFailed;box.textContent=storageFailed?'Browser saving is unavailable. Download the assessment before closing.':'';}}
 function stop(){voiceToken++;currentRead=null;window.speechSynthesis?.cancel();}

 function voiceText(){return story.title+'. Look at the picture. '+story.now+' '+item.question+' '+bankOrder.map((value,i)=>String.fromCharCode(65+i)+'. '+value).join(' ');}
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
  const summary=[['Picture ID','Level','Stories completed','Stories available','Before completed','After completed','Choices / checks','Hints','Listens','Active seconds']];
  const progress=[['Picture ID','Level','Story','Topic','Step','Earned credit','Current response correct','Current response','Correct answer','Offered choices','Attempts','Hints','Listens','Support','Assessment type','Active seconds']];
  const attempts=[['Picture ID','Time','Level','Question','Event','Response','Correct','New point','Input method','Attempts so far','Hints','Listens','Support','Assessment type','Active seconds']];
  for(const id of ids){const profile=state.profiles[id]||{games:{},attempts:[]},name=O.find(o=>o.id===id).name;
   for(const lv of C.levels){const entries=profile.games?.sequence?.[lv]?.entries||{},values=Object.values(entries);
    const completed=Object.entries(entries).filter(([qid,x])=>qid.endsWith('-before')&&x.complete&&entries[qid.slice(0,-7)+'-after']?.complete).length;
    summary.push([name,lv,completed,50,...['before','after'].map(step=>Object.entries(entries).filter(([qid,x])=>qid.endsWith('-'+step)&&x.complete).length),values.reduce((n,x)=>n+(x.tries||0),0),values.reduce((n,x)=>n+(x.hints||0),0),values.reduce((n,x)=>n+(x.listens||0),0),Math.round(values.reduce((n,x)=>n+(x.seconds||0),0))]);
    for(const row of D.sequence[lv])for(const step of ['before','after']){const q=C.part(row,step),x=entries[q.id]||{};progress.push([name,lv,row.id,row.title,step,x.complete?'Yes':'No',x.solved?'Yes':'No',x.response||'',q.answer,q.options.join(' | '),x.tries||0,x.hints||0,x.listens||0,x.support||'',x.assessment||'Formative',Math.round(x.seconds||0)]);}
   }
   for(const x of profile.attempts||[])attempts.push([name,x.time,x.level,x.item,x.event,x.response,x.correct===null?'':x.correct?'Yes':'No',x.newPoint?'Yes':'No',x.method,x.tries,x.hints,x.listens,x.support,x.assessment,x.seconds]);
  }
  const guide=[['Topic','Notes'],['Activity','Study a middle moment. Choose the immediately preceding action and most likely next step.'],['Levels','50 pictures in each level. A offers three related choices. AA adds a fourth nearby event and asks for finer timing.'],['Credit','A story is completed when both before and after have earned credit. 50 stories per level; 100 across both levels; 200 individual decisions.'],['Practice','Try this story again clears current responses for both steps but preserves earned credit and assessment history.'],['Navigation','Every picture opens on Before, including saved pictures and reviews. Next visits After on the same picture. Both current answers must be correct to unlock the next picture. The story picker only allows unlocked pictures.'],['Profiles','20 picture IDs; progress stays in this browser. Each profile and level is separate.'],['Teacher voice','Teacher code 259 enables or disables voice for both levels in this browser.'],['Reports','Attempts include retries, hints, listens, support, assessment type and active seconds. New point refers to an individual before/after decision.'],['Artwork','50 new illustrations generated with the built-in image generation tool. See ARTWORK.json for prompts.'],['Script reuse','Adapted from Language Adventures: profile storage, grading, attempts, speech, teacher voice, native Excel and picture viewer.']];
  download('Before-and-After-'+(all?'all-picture-IDs':state.selected)+'-'+new Date().toISOString().slice(0,10)+'.xlsx',window.SpellingExcel.workbook([{name:'Summary',rows:summary},{name:'Progress',rows:progress},{name:'Attempts',rows:attempts},{name:'Guide',rows:guide}]));
 }
 if(document.body.dataset.page==='landing'){
  $('export-all').onclick=()=>exportAssessment(true);const chosen=O.find(o=>o.id===state.selected);
  if(chosen)$('resume-note').textContent='Continue with '+chosen.name+' · your progress is saved in this browser.';
  window.addEventListener('pagehide',stop);return;
 }
 document.body.dataset.game=key;
 $('game-title').textContent='Before & After';$('game-tag').textContent='Look closely. Put events in order.';
 const date=new Date();$('today').textContent=date.toLocaleDateString('en-CA',{month:'short',day:'numeric'});$('today').dateTime=date.toISOString().slice(0,10);showStorage();
 function chooseProfile(id){save();stop();state.selected=id;p=C.profile(state,id);g=C.game(p,key);if(!C.levels.includes(g.level))g.level='A';if(window.requestedSequenceLevel){g.level=window.requestedSequenceLevel;window.requestedSequenceLevel=null;}level=g.level;save();$('profile-dialog').close();load(null,false);}
 function showProfiles(){stop();save();returnFocus=document.activeElement;const dialog=$('profile-dialog');if(!dialog.open)dialog.showModal();}
 const grid=$('profile-grid');for(const object of O){const b=document.createElement('button');b.type='button';b.className='profile-tile';b.setAttribute('aria-label','Choose '+object.name);const img=document.createElement('img'),label=document.createElement('span');img.src=object.image;img.alt='';label.textContent=object.name;b.append(img,label);b.onclick=()=>chooseProfile(object.id);grid.append(b);}
 $('profile-dialog').addEventListener('cancel',event=>{if(!state.selected)event.preventDefault();});
 $('profile-dialog').addEventListener('close',()=>returnFocus?.focus());
 $('profile-cancel').onclick=()=>{if(state.selected)$('profile-dialog').close();else location.href='index.html';};
 $('profile-button').onclick=showProfiles;
 function setView(view){$('activity').dataset.view=view;document.querySelectorAll('[data-view-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.viewChoice===view)));}
 document.querySelectorAll('[data-view-choice]').forEach(b=>b.onclick=()=>setView(b.dataset.viewChoice));

 function renderFeedback(){
  $('feedback').textContent=C.storySolved(p,level,story)?'Both answers correct ✓. Ready for the next picture.':e.solved?(stage==='before'?'Before ✓. Press Next: After to finish this picture.':'After ✓. Finish Before to unlock the next picture.'):feedback;$('feedback').className='feedback '+feedbackKind;
 }
 function render(){
  $('question-prompt').textContent=item.question;$('choices').replaceChildren();
  bankOrder.forEach((value,i)=>{const b=document.createElement('button'),letter=document.createElement('span'),label=document.createElement('span');b.type='button';b.className='answer'+(e.response===value?(e.solved?' correct':' incorrect'):'');b.dataset.choice=value;b.disabled=e.solved;b.setAttribute('aria-pressed',String(e.response===value));letter.className='choice-letter';letter.textContent=String.fromCharCode(65+i);label.textContent=value;b.append(letter,label);
   b.onclick=()=>{save();stop();const result=C.submit(p,key,level,item,value);feedback=result.correct?item.why:'That step belongs at a different time. Look closely and try again.';feedbackKind=result.correct?'correct':'retry';save();render();if(result.correct)$('next').focus();};
   $('choices').append(b);
  });
  document.querySelectorAll('[data-stage]').forEach(b=>{const q=C.part(story,b.dataset.stage),x=C.entry(p,key,level,q);b.setAttribute('aria-pressed',String(stage===b.dataset.stage));b.textContent=(b.dataset.stage==='before'?'⏪ Before':'After ⏩')+(x.solved?' ✓':'');});
  $('score').textContent=C.storyCount(p,level)+' / 50 stories';$('story-select').value=String(position);
  $('journey-fill').style.width=C.total(p)+'%';$('journey-count').textContent=C.total(p)+' / 100';
  const action=C.forwardAction(p,level,story,stage),next=$('next');
  $('previous').disabled=position===0;next.disabled=action.disabled;
  next.textContent=action.kind==='story'?(position===49?'Finish ✓':'Next picture →'):action.kind==='before'?'Finish Before ⏪':action.disabled?'Answer After ⏩':'Next: After ⏩';
  next.title=action.kind==='story'?'Both answers are correct. Continue.':action.disabled?'Choose the correct answer to finish this picture.':'Stay with this picture and finish the other answer.';
  const unlocked=C.unlockedThrough(p,level,D.sequence[level]);
  [...$('story-select').options].forEach((option,i)=>{option.disabled=i>unlocked;option.textContent=(i+1)+'. '+D.sequence[level][i].title+(C.storySolved(p,level,D.sequence[level][i])?' ✓':i>unlocked?' · locked':'');});
  document.querySelectorAll('[data-level]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.level===level)));
  document.querySelectorAll('[data-support]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.support===e.support)));
  $('assessment-type').value=e.assessment||'Formative';
  $('listen').disabled=window.TeacherVoice?.isEnabled()===false;$('reading-voice-speed').disabled=$('listen').disabled;
  renderFeedback();
 }
 function load(chosenStage=null,read=false){
  stop();g=C.game(p,key);if(!C.levels.includes(g.level))g.level='A';level=g.level;position=Math.max(0,Math.min(C.unlockedThrough(p,level,D.sequence[level]),Number(g[level].position)||0));g[level].position=position;story=D.sequence[level][position];
  stage=chosenStage||'before';item=C.part(story,stage);e=C.entry(p,key,level,item);lastTick=performance.now();
  feedback=e.solved?item.why:e.tries?'Look for the next clue and try again.':'';feedbackKind=e.solved?'correct':'';
  if(!Array.isArray(e.bankOrder)||e.bankOrder.length!==item.options.length||new Set(e.bankOrder).size!==item.options.length||!e.bankOrder.every(x=>item.options.includes(x)))e.bankOrder=C.shuffle(item.options);
  bankOrder=e.bankOrder.slice();
  $('topic').textContent=story.title;$('scene-image').src=story.image;$('scene-image').alt=story.alt;
  const object=O.find(o=>o.id===state.selected);$('profile-image').src=object.image;$('profile-name').textContent=object.name;
  $('finish-dialog').open&&$('finish-dialog').close();$('story-select').replaceChildren(...D.sequence[level].map((s,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=(i+1)+'. '+s.title;return option;}));
  $('picture-link').href='pictures.html?picture='+story.picture;
  setView('work');render();save();if(read)listen();
 }
 document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{if(!p||level===b.dataset.level)return;save();g.level=b.dataset.level;load();});
 document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{save();load(b.dataset.stage);});
 $('story-select').onchange=()=>{save();const target=Number($('story-select').value);if(target>C.unlockedThrough(p,level,D.sequence[level])){$('story-select').value=String(position);return;}g[level].position=target;load();};
 $('previous').onclick=()=>{if(position>0){save();g[level].position=position-1;load();}};
 $('next').onclick=()=>{save();const action=C.forwardAction(p,level,story,stage);if(action.disabled)return;if(action.kind!=='story'){load(action.kind);$('question-prompt').focus();return;}if(position<49){g[level].position=position+1;load();}else{stop();$('finish-title').textContent='Level '+level+' · Story journey';$('finish-text').textContent='Both answers are correct for all 50 pictures in Level '+level+'. You can review your stories or try the other level.';$('finish-dialog').showModal();}};
 $('review').onclick=()=>{g[level].position=0;load();};$('finish-close').onclick=()=>$('finish-dialog').close();
 $('reset-question').onclick=()=>{save();stop();for(const step of ['before','after'])C.reset(p,key,level,C.part(story,step));load('before');};
 $('hint').onclick=()=>{save();stop();e.hints++;C.log(p,key,level,item,e,'Hint',e.response);$('hint-box').textContent=item.hint;$('hint-dialog').showModal();save();};
 $('hint-close').onclick=()=>$('hint-dialog').close();$('hint-dialog').addEventListener('close',()=>$('hint').focus());
 $('enlarge-picture').onclick=()=>{save();stop();$('large-picture').src=story.image;$('large-picture').alt=story.alt;$('large-picture-title').textContent=story.title;$('picture-dialog').showModal();};
 $('close-picture').onclick=()=>$('picture-dialog').close();$('picture-dialog').addEventListener('close',()=>$('enlarge-picture').focus());
 $('listen').onclick=listen;$('stop').onclick=()=>{stop();$('voice-note').textContent='Voice stopped.';};
 $('reading-voice-speed').value=String(rate);$('reading-voice-speed').onchange=()=>{rate=Number($('reading-voice-speed').value);try{localStorage.setItem('before-after-adventures-speed-v1',String(rate));}catch(err){}if(currentRead)runVoice(currentRead);};
 $('export-current').onclick=()=>exportAssessment(false);$('export-all').onclick=()=>exportAssessment(true);
 document.querySelectorAll('[data-support]').forEach(b=>b.onclick=()=>{e.support=e.support===b.dataset.support?'':b.dataset.support;C.log(p,key,level,item,e,'Support',e.response);save();render();});
 $('assessment-type').onchange=()=>{e.assessment=$('assessment-type').value;C.log(p,key,level,item,e,'Assessment type',e.response);save();};
 $('reset-profile').onclick=()=>{if(!confirm('Reset all Before & After progress and assessment history for '+O.find(o=>o.id===state.selected).name+'?'))return;stop();lastTick=0;e=null;delete state.profiles[state.selected];p=C.profile(state,state.selected);g=C.game(p,key);save();$('teacher-tools').open=false;load();};
 document.addEventListener('pointerdown',event=>{const tools=$('teacher-tools');if(tools.open&&!tools.contains(event.target))tools.open=false;});
 document.addEventListener('keydown',event=>{if(event.key==='Escape')$('teacher-tools').open=false;});
 function finishSave(){save();stop();lastTick=0;}
 window.addEventListener('pagehide',finishSave);document.addEventListener('visibilitychange',()=>{if(document.hidden)finishSave();else if(e)lastTick=performance.now();});
 setInterval(()=>{if(!document.hidden)save();},15000);
 if(state.selected){p=C.profile(state,state.selected);g=C.game(p,key);const requested=new URLSearchParams(location.search).get('level');if(C.levels.includes(requested))g.level=requested;load();}else{const requested=new URLSearchParams(location.search).get('level');if(C.levels.includes(requested)){window.requestedSequenceLevel=requested;}showProfiles();}
})();
