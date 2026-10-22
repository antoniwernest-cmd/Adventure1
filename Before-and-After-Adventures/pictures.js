(function(){
 'use strict';
 const $=id=>document.getElementById(id),all=window.LANGUAGE_PICTURES||[];
 let pictures=all,index=0;
 const requested=new URLSearchParams(location.search).get('picture');
 if(requested){const found=pictures.findIndex(p=>p.id===requested);if(found>=0)index=found;}
 function render(){
  const p=pictures[index];if(!p)return;
  $('gallery-picture').src=p.file;$('gallery-picture').alt=p.alt;$('picture-title').textContent=p.title;$('picture-count').textContent=(index+1)+' of '+pictures.length;
  $('picture-previous').disabled=index===0;$('picture-next').disabled=index===pictures.length-1;$('picture-select').value=p.id;
  $('picture-save').href=p.file;$('picture-save').download='Before-and-After-'+p.id+'.webp';
  const adjacent=pictures[index+1];if(adjacent){const preload=new Image();preload.src=adjacent.file;}
 }
 function options(){const select=$('picture-select');select.replaceChildren(...pictures.map(p=>{const option=document.createElement('option');option.value=p.id;option.textContent=p.title;return option;}));render();}
 function move(delta){index=Math.max(0,Math.min(pictures.length-1,index+delta));render();}
 $('picture-previous').onclick=()=>move(-1);$('picture-next').onclick=()=>move(1);
 $('picture-select').onchange=e=>{index=pictures.findIndex(p=>p.id===e.target.value);render();};
 $('gallery-filter').onchange=e=>{const previous=pictures[index]?.id;pictures=e.target.value==='all'?all:all.filter(p=>p.games.includes(e.target.value));index=Math.max(0,pictures.findIndex(p=>p.id===previous));options();};
 document.addEventListener('keydown',e=>{if(['SELECT','INPUT','TEXTAREA'].includes(e.target.tagName))return;if(e.key==='ArrowRight'){e.preventDefault();move(1);}if(e.key==='ArrowLeft'){e.preventDefault();move(-1);}});
 options();
})();
