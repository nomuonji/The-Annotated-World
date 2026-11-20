export {};
const root=document.querySelector<HTMLElement>('[data-study-reader]');
if(root)setup(root);
function setup(reader:HTMLElement){
 const controls=document.querySelector<HTMLElement>('[data-reader-tools]');if(!controls)return;controls.hidden=false;
 const input=document.querySelector<HTMLInputElement>('#reader-query')!,count=document.querySelector<HTMLElement>('#reader-count')!,prev=document.querySelector<HTMLButtonElement>('#reader-prev')!,next=document.querySelector<HTMLButtonElement>('#reader-next')!;
 const blocks=[...reader.querySelectorAll<HTMLElement>('.utterance')];const original=blocks.map(el=>({el,text:[...el.querySelectorAll('.en,.ja,.note')].map(n=>n.textContent||'').join(' ').toLowerCase()}));let results:HTMLElement[]=[],index=-1;
 const clear=()=>{for(const b of blocks)b.classList.remove('search-hit','search-current');};
 function showHit(i:number){if(!results.length)return;results[index]?.classList.remove('search-current');index=(i+results.length)%results.length;const el=results[index];el.classList.add('search-current');const section=el.closest<HTMLElement>('section.sec');if(section)reader.dispatchEvent(new CustomEvent('reader-select-chapter',{detail:{id:section.id}}));const reveal=el.querySelector<HTMLButtonElement>('[data-reveal]');if(reader.dataset.mode!=='parallel'&&reveal?.getAttribute('aria-expanded')==='false')reveal.click();el.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});count.textContent=(index+1)+' / '+results.length+' 発話';}
 function search(){clear();const q=input.value.trim().toLowerCase();results=q?original.filter(o=>o.text.includes(q)).map(o=>o.el):[];index=-1;for(const el of results)el.classList.add('search-hit');prev.disabled=next.disabled=!results.length;count.textContent=q?results.length+' 発話に一致':'一致した発話に移動';}
 input.addEventListener('input',search);input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();showHit(index+1);}});prev.addEventListener('click',()=>showHit(index<0?results.length-1:index-1));next.addEventListener('click',()=>showHit(index+1));
 // A compact search toolbar remains accessible from the sticky reading toolbar.
 const quick=document.createElement('button');quick.type='button';quick.textContent='本文検索';quick.className='study-control quick-reader-tools';quick.addEventListener('click',()=>{controls.setAttribute('open','');controls.scrollIntoView({block:'start'});input.focus({preventScroll:true});});document.querySelector('.study-secondary')?.append(quick);
 // All editorial annotations now share one interaction: tap a marked phrase
 // to reveal only its corresponding note in the English reading flow.
 function toggleNote(trigger:HTMLElement){
  if(reader.dataset.annotations==='off')return;
  const noteId=trigger.getAttribute('aria-controls');
  const note=noteId?document.getElementById(noteId):null;
  if(!note?.classList.contains('in-situ-annotation'))return;
  const opening=note.hidden;
  for(const mark of reader.querySelectorAll<HTMLElement>('[data-note-toggle]')){
   const other=document.getElementById(mark.getAttribute('aria-controls')||'');
   if(other?.classList.contains('in-situ-annotation'))other.hidden=true;
   mark.setAttribute('aria-expanded','false');
  }
  if(opening){
   note.hidden=false;
   trigger.setAttribute('aria-expanded','true');
  }
 }
 reader.addEventListener('click',event=>{
  if(!(event.target instanceof Element))return;
  const mark=event.target.closest<HTMLElement>('[data-note-toggle]');
  if(mark)toggleNote(mark);
 });
 reader.addEventListener('keydown',event=>{
  if(event.key!=='Enter'&&event.key!==' ')return;
  if(!(event.target instanceof Element))return;
  const mark=event.target.closest<HTMLElement>('[data-note-toggle]');
  if(!mark)return;
  event.preventDefault();
  toggleNote(mark);
 });
}
