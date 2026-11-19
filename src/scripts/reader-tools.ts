export {};
const root=document.querySelector<HTMLElement>('[data-study-reader]');
if(root)setup(root);
function setup(reader:HTMLElement){
 const controls=document.querySelector<HTMLElement>('[data-reader-tools]');if(!controls)return;controls.hidden=false;
 const input=document.querySelector<HTMLInputElement>('#reader-query')!,count=document.querySelector<HTMLElement>('#reader-count')!,prev=document.querySelector<HTMLButtonElement>('#reader-prev')!,next=document.querySelector<HTMLButtonElement>('#reader-next')!;
 const blocks=[...reader.querySelectorAll<HTMLElement>('.utterance')];const original=blocks.map(el=>({el,text:[...el.querySelectorAll('.en,.ja,.note')].map(n=>n.textContent||'').join(' ').toLowerCase()}));let results:HTMLElement[]=[],index=-1;
 const clear=()=>{for(const b of blocks)b.classList.remove('search-hit','search-current');};
 function showHit(i:number){if(!results.length)return;results[index]?.classList.remove('search-current');index=(i+results.length)%results.length;const el=results[index];el.classList.add('search-current');const reveal=el.querySelector<HTMLButtonElement>('[data-reveal]');if(reader.dataset.mode!=='parallel'&&reveal?.getAttribute('aria-expanded')==='false')reveal.click();el.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});count.textContent=(index+1)+' / '+results.length+' 発話';}
 function search(){clear();const q=input.value.trim().toLowerCase();results=q?original.filter(o=>o.text.includes(q)).map(o=>o.el):[];index=-1;for(const el of results)el.classList.add('search-hit');prev.disabled=next.disabled=!results.length;count.textContent=q?results.length+' 発話に一致':'一致した発話に移動';}
 input.addEventListener('input',search);input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();showHit(index+1);}});prev.addEventListener('click',()=>showHit(index<0?results.length-1:index-1));next.addEventListener('click',()=>showHit(index+1));
 // A compact search toolbar remains accessible from the sticky reading toolbar.
 const quick=document.createElement('button');quick.type='button';quick.textContent='検索・設定';quick.className='study-control quick-reader-tools';quick.addEventListener('click',()=>{controls.setAttribute('open','');controls.scrollIntoView({block:'start'});input.focus({preventScroll:true});});document.querySelector('.study-secondary')?.append(quick);
 const focus=document.querySelector<HTMLButtonElement>('#reader-focus')!;focus.addEventListener('click',()=>{const on=reader.classList.toggle('focus-reading');document.body.classList.toggle('focus-reading-page',on);focus.setAttribute('aria-pressed',String(on));focus.textContent=on?'集中読書を終了':'集中読書';if(on)reader.dispatchEvent(new Event('reader-focus-on'));controls.scrollIntoView({block:'start'});});
 const dark=document.querySelector<HTMLButtonElement>('#reader-dark')!;dark.addEventListener('click',()=>{const on=document.documentElement.classList.toggle('reader-dark');dark.setAttribute('aria-pressed',String(on));dark.textContent=on?'ライトモード':'ダークモード';});
 const dialog=document.querySelector<HTMLDialogElement>('#word-dialog');if(dialog&&typeof dialog.showModal==='function'){
 reader.addEventListener('click',e=>{if(!(e.target instanceof Element)||!(e instanceof MouseEvent)||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;const anchor=e.target.closest<HTMLAnchorElement>('a[data-word]');if(!anchor)return;e.preventDefault();document.getElementById('word-dialog-title')!.textContent=anchor.dataset.word||'';document.getElementById('word-dialog-note')!.textContent=anchor.dataset.wordNote||'元教材の注釈と使用例を確認できます。';const more=document.querySelector<HTMLAnchorElement>('#word-dialog-more')!;more.href=anchor.href;dialog.showModal();});
 dialog.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)dialog.close();}});
 }
}
