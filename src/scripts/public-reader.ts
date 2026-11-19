import {read,write} from './public-store';
const root=document.querySelector<HTMLElement>('[data-public-reader]');
if(root){
 const id=root.dataset.lesson!,title=root.dataset.title!,state=read();
 const resume=document.querySelector<HTMLAnchorElement>('#resume');
 const last=state.progress[id];
 if(resume&&last&&document.getElementById(last)){resume.href='#'+last;resume.hidden=false;}
 const buttons=root.querySelectorAll<HTMLButtonElement>('[data-toggle]');
 function update(){for(const b of buttons){const key=b.dataset.toggle!;b.setAttribute('aria-pressed',String(state.prefs[key]!==false));root.classList.toggle('hide-'+key,state.prefs[key]===false);}}
 for(const b of buttons)b.addEventListener('click',()=>{const key=b.dataset.toggle!;state.prefs[key]=state.prefs[key]===false;write(state);update();});update();
 for(const row of root.querySelectorAll<HTMLElement>('[data-block]')){const b=row.querySelector<HTMLButtonElement>('[data-save]')!;const saved=()=>state.saved.some(x=>x.lessonId===id&&x.anchor===row.id);const render=()=>{b.textContent=saved()?'保存済み':'発話を保存';b.setAttribute('aria-pressed',String(saved()));};render();b.addEventListener('click',()=>{if(saved())state.saved=state.saved.filter(x=>x.lessonId!==id||x.anchor!==row.id);else state.saved.push({lessonId:id,title,anchor:row.id,en:row.querySelector('.en')?.textContent?.trim()||''});write(state);render();});}
 const blocks=[...root.querySelectorAll<HTMLElement>('[data-block]')];
 let pending=false;let userScrolled=false;
 function remember(){pending=false;if(!userScrolled)return;let closest:HTMLElement|undefined;for(const b of blocks){if(b.getBoundingClientRect().top<=window.innerHeight*.4)closest=b;else break;}if(closest&&state.progress[id]!==closest.id){state.progress[id]=closest.id;write(state);}}
 window.addEventListener('scroll',()=>{userScrolled=true;if(!pending){pending=true;requestAnimationFrame(remember);}},{passive:true});
 if(matchMedia('(max-width:720px)').matches)root.querySelector('details')?.removeAttribute('open');
}