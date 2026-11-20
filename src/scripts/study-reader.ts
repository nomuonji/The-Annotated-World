export {};
type Player = {
 getCurrentTime():number;getDuration():number;getPlayerState():number;getAvailablePlaybackRates():number[];getPlaybackRate():number;setPlaybackRate(rate:number):void;seekTo(seconds:number,allowSeekAhead:boolean):void;playVideo():void;pauseVideo():void;
};
type PlayerEvent={target:Player;data:number};
type YTApi={Player:new(id:string,options:{events:{onReady:(e:PlayerEvent)=>void;onStateChange:(e:PlayerEvent)=>void;onPlaybackRateChange:(e:PlayerEvent)=>void;onError:(e:PlayerEvent)=>void;onAutoplayBlocked?:()=>void}})=>Player};
declare global{interface Window{YT?:YTApi;onYouTubeIframeAPIReady?:()=>void;}}
type Mode='parallel'|'english'|'listen';
type TimedBlock={element:HTMLElement;start:number;end:number|null};
const root=document.querySelector<HTMLElement>('[data-study-reader]');
if(root)setup(root);
function setup(reader:HTMLElement){
 const byId=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T|null;
 const toolbar=byId('study-toolbar'),sidebar=reader.querySelector<HTMLElement>('.study-sidebar'),panel=byId('source-video'),iframe=byId<HTMLIFrameElement>('original-player');
 const modeButtons=Array.from(reader.querySelectorAll<HTMLButtonElement>('[data-mode]'));
 const blocks=Array.from(reader.querySelectorAll<HTMLElement>('.utterance'));
 const chapters=Array.from(reader.querySelectorAll<HTMLElement>('.study-original section.sec'));
 const viewControl=byId<HTMLElement>('chapter-mode-control'),viewToggle=byId<HTMLButtonElement>('chapter-view-toggle'),viewContext=byId<HTMLElement>('chapter-mode-context');
 const annotationsButton=byId<HTMLButtonElement>('reader-annotations');
 let annotationsVisible=true;
 try{annotationsVisible=localStorage.getItem('aw-annotations')!=='off';}catch{}
 const showAnnotations=(on:boolean)=>{
  annotationsVisible=on;
  reader.dataset.annotations=on?'on':'off';
  if(annotationsButton){
   annotationsButton.setAttribute('aria-pressed',String(on));
   annotationsButton.textContent=on?'注釈 ON':'注釈 OFF';
   annotationsButton.setAttribute('aria-label',on?'文中注釈を非表示にする':'文中注釈を表示する');
  }
 };
 showAnnotations(annotationsVisible);
 annotationsButton?.addEventListener('click',()=>{
  showAnnotations(!annotationsVisible);
  try{localStorage.setItem('aw-annotations',annotationsVisible?'on':'off');}catch{}
 });
 const entries:TimedBlock[]=blocks.flatMap(element=>{const raw=element.dataset.utteranceStart;return raw!==undefined&&/^\d+$/.test(raw)?[{element,start:Number(raw),end:null}]:[];}).sort((a,b)=>a.start-b.start);
 // A timestamp is usable as a repeat boundary only if the next timed block is strictly later.
 entries.forEach((entry,i)=>{const next=entries[i+1];if(next&&next.start>entry.start)entry.end=next.start;});
 let mode:Mode='parallel',size=0,player:Player|null=null,ready=false,failed=false,follow=false,active:TimedBlock|null=null,loop:TimedBlock|null=null,loopPendingUntil=0,queued:{seconds:number;repeat?:TimedBlock}|null=null;
 const play=byId<HTMLButtonElement>('play-pause'),speed=byId<HTMLSelectElement>('playback-speed'),followButton=byId<HTMLButtonElement>('follow-video'),pin=byId<HTMLButtonElement>('mobile-pin-video'),jump=byId<HTMLButtonElement>('jump-current'),stop=byId<HTMLButtonElement>('stop-repeat'),clock=byId('video-clock'),status=byId('video-state'),nav=byId<HTMLSelectElement>('study-chapter-nav');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const mobile=matchMedia('(max-width: 899px)');
 const frameBase=panel?.dataset.video;
 const frameUrl=(seconds?:number)=>{const u=new URL(frameBase!);u.searchParams.set('playsinline','1');u.searchParams.set('enablejsapi','1');if(location.protocol==='http:'||location.protocol==='https:')u.searchParams.set('origin',location.origin);if(seconds!==undefined){u.searchParams.set('start',String(seconds));u.searchParams.set('autoplay','1');}return u.href;};
 const say=(message:string)=>{if(status){status.textContent=message;status.hidden=!message;}};
 function scrollTo(el:HTMLElement){el.scrollIntoView({block:'start',behavior:reduced.matches?'instant':'smooth'});}
 // The full article is the default; ?chapter=chN is a shareable, one-chapter reading mode.
 let selectedChapterId:string|null=null;
 const findChapter=(id:string|null)=>id?chapters.find(chapter=>chapter.id===id)||null:null;
 function setChapterView(id:string|null,updateUrl=true){
  const chapter=findChapter(id);
  const previous=selectedChapterId;
  selectedChapterId=chapter?.id||null;
  if(chapter){
   reader.dataset.chapterView='single';
   document.body.classList.add('chapter-reading-page');
  }else{
   reader.removeAttribute('data-chapter-view');
   document.body.classList.remove('chapter-reading-page');
  }
  for(const item of chapters)item.classList.toggle('chapter-selected',item===chapter);
  if(viewToggle){
   viewToggle.setAttribute('aria-pressed',String(!!chapter));
   viewToggle.textContent=chapter?'全文表示へ戻る':'章単位で読む';
  }
  if(viewContext)viewContext.hidden=!chapter;
  if(nav)nav.value=chapter?.id||'';
  if(updateUrl){
   const url=new URL(window.location.href);
   if(chapter){url.searchParams.set('chapter',chapter.id);url.hash='';}
   else{url.searchParams.delete('chapter');if(previous)url.hash=previous;}
   window.history.pushState(null,'',url);
  }
 }
 const openChapter=(id:string)=>{
  const target=findChapter(id);
  if(!target)return;
  setChapterView(id);
  requestAnimationFrame(()=>scrollTo(target));
 };
 if(viewControl&&viewToggle&&chapters.length){
  viewControl.hidden=false;
  const query=new URLSearchParams(location.search).get('chapter');
  if(findChapter(query))setChapterView(query,false);
  viewToggle.addEventListener('click',()=>{
   if(selectedChapterId){
    const selected=findChapter(selectedChapterId);
    setChapterView(null);
    if(selected)requestAnimationFrame(()=>scrollTo(selected));
   }else{
    const hash=decodeURIComponent(location.hash.slice(1));
    const fromHash=byId<HTMLElement>(hash)?.closest<HTMLElement>('section.sec');
    const current=fromHash||chapters.find(chapter=>{
     const rect=chapter.getBoundingClientRect();
     return rect.top<=window.innerHeight*.4&&rect.bottom>=window.innerHeight*.4;
    })||chapters[0];
    openChapter(current.id);
   }
  });
  reader.addEventListener('click',event=>{
   if(!(event.target instanceof Element))return;
   const link=event.target.closest<HTMLAnchorElement>('a[data-chapter-link]');
   if(!link||event instanceof MouseEvent&&(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey))return;
   const target=new URL(link.href);
   if(target.origin!==location.origin||target.pathname!==location.pathname)return;
   const id=target.searchParams.get('chapter');
   if(!findChapter(id))return;
   event.preventDefault();
   openChapter(id!);
  });
  reader.addEventListener('reader-select-chapter',event=>{
   if(!selectedChapterId)return;
   const id=(event as CustomEvent<{id:string}>).detail?.id;
   if(findChapter(id))setChapterView(id);
  });
  window.addEventListener('popstate',()=>{
   const id=new URLSearchParams(location.search).get('chapter');
   setChapterView(id,false);
  });
 }
 function updateReveal(b:HTMLElement){const btn=b.querySelector<HTMLButtonElement>('[data-reveal]');if(!btn)return;const open=b.classList.contains('revealed');btn.hidden=mode==='parallel';btn.setAttribute('aria-expanded',String(open));btn.textContent=open?'もう一度隠す':mode==='listen'?'英文・和訳を確認':'和訳・注釈を見る';}
 function setMode(next:Mode){mode=next;reader.dataset.mode=next;for(const b of modeButtons)b.setAttribute('aria-pressed',String(b.dataset.mode===next));for(const b of blocks){b.classList.remove('revealed');updateReveal(b);}if(next==='listen'&&panel)say(ready?'リスニング：発話を聞いてから英文を確認できます。':'リスニング：元動画を再生して聞き取ります。');else if(ready)say('');}
 for(const b of modeButtons)b.addEventListener('click',()=>setMode(b.dataset.mode as Mode));
 for(const b of blocks){b.querySelector('[data-reveal]')?.addEventListener('click',()=>{b.classList.toggle('revealed');updateReveal(b);});}
 toolbar?.removeAttribute('hidden');setMode('parallel');
 if(toolbar){const update=()=>reader.style.setProperty('--study-toolbar-height',toolbar.getBoundingClientRect().height+'px');new ResizeObserver(update).observe(toolbar);update();}
 byId('study-size')?.addEventListener('click',()=>{size=(size+1)%3;reader.dataset.textSize=String(size);const btn=byId('study-size');if(btn){btn.textContent=['A↗','A+','A++'][size];btn.setAttribute('aria-label','文字サイズ '+['標準','大','特大'][size]+'。クリックして変更');}});
 nav?.addEventListener('change',()=>{const target=byId(nav.value);if(target){
  if(selectedChapterId&&target.matches('section.sec'))openChapter(target.id);
  else{scrollTo(target);history.replaceState(null,'','#'+encodeURIComponent(target.id));}
 }else{const toc=reader.querySelector<HTMLElement>('.toc');if(toc)scrollTo(toc);}});
 if(!panel||!iframe||!frameBase)return;
 const videoPanel=panel;const videoFrame=iframe;
 for(const node of panel.querySelectorAll<HTMLElement>('[data-video-enhancement]'))node.hidden=false;
 if(sidebar){const updateHeight=()=>reader.style.setProperty('--pinned-video-height',reader.classList.contains('video-pinned')&&mobile.matches?sidebar.getBoundingClientRect().height+'px':'0px');const observer=new ResizeObserver(updateHeight);observer.observe(sidebar);mobile.addEventListener('change',updateHeight);pin?.addEventListener('click',()=>{const on=reader.classList.toggle('video-pinned');pin.setAttribute('aria-pressed',String(on));pin.textContent=on?'固定解除':'動画固定';updateHeight();});}
 function usableEnd(entry:TimedBlock){if(entry.end!==null)return entry.end;return entries.at(-1)===entry&&player&&player.getDuration()>entry.start?player.getDuration():null;}
 function updateRepeatButtons(){for(const item of entries){const b=item.element.querySelector<HTMLButtonElement>('[data-repeat]');if(!b)continue;const usable=ready&&usableEnd(item)!==null;b.hidden=!usable;b.setAttribute('aria-pressed',String(loop===item));b.textContent=loop===item?'↻ リピート中':'↻ リピート';}if(stop)stop.hidden=!loop;}
 function clearLoop(){if(!loop)return;loop=null;loopPendingUntil=0;updateRepeatButtons();}
 function setLoop(item:TimedBlock){if(!ready||usableEnd(item)===null)return;clearLoop();loop=item;loopPendingUntil=performance.now()+1300;updateRepeatButtons();performSeek(item.start);}
 function setFollow(on:boolean){follow=on;followButton?.setAttribute('aria-pressed',String(on));}
 function setActive(entry:TimedBlock|null,scroll:boolean){if(active===entry)return;active?.element.classList.remove('is-playing');active=entry;active?.element.classList.add('is-playing');if(jump)jump.disabled=!entry;if(entry&&scroll)scrollTo(entry.element);}
 function formatTime(v:number){const n=Math.max(0,Math.floor(v));return (n>=3600?Math.floor(n/3600)+':':'')+String(Math.floor(n/60)%60).padStart(2,'0')+':'+String(n%60).padStart(2,'0');}
 function sync(){if(!ready||!player)return;const time=player.getCurrentTime();if(!Number.isFinite(time))return;if(clock)clock.textContent=formatTime(time);const state=player.getPlayerState();if(loop){const end=usableEnd(loop);if(end!==null&&performance.now()>loopPendingUntil&&((state===1&&(time>=end||time<loop.start-1))||state===0)){loopPendingUntil=performance.now()+1300;performSeek(loop.start);return;}}let found:TimedBlock|null=null;for(const item of entries){if(item.start>time)break;found=item;}setActive(found,follow&&state===1);}
 function performSeek(seconds:number){if(!player||!ready)return;player.seekTo(seconds,true);player.playVideo();const found=entries.find(e=>e.start===seconds);if(found)setActive(found,follow);}
 function fallbackSeek(seconds:number){videoFrame.src=frameUrl(seconds);say('動画同期は利用できません。動画の通常操作をお使いください。');if(mobile.matches&&!reader.classList.contains('video-pinned'))scrollTo(videoPanel);}
 function seek(seconds:number){if(!Number.isFinite(seconds)||seconds<0)return;clearLoop();if(ready){performSeek(seconds);if(mobile.matches&&!reader.classList.contains('video-pinned'))scrollTo(videoPanel);}else if(failed)fallbackSeek(seconds);else{queued={seconds};say('動画連携を準備中。接続後に再生します。');}}
 for(const el of reader.querySelectorAll<HTMLElement>('[data-video-seek],[data-utterance-play]'))el.addEventListener('click',event=>{if(event instanceof MouseEvent&&(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey))return;event.preventDefault();seek(Number(el.dataset.videoSeek??el.dataset.utterancePlay));});
 for(const item of entries)item.element.querySelector('[data-repeat]')?.addEventListener('click',()=>{if(loop===item)clearLoop();else setLoop(item);});
 stop?.addEventListener('click',clearLoop);followButton?.addEventListener('click',()=>{setFollow(!follow);if(follow&&active)scrollTo(active.element);});jump?.addEventListener('click',()=>{if(active)scrollTo(active.element);});
 play?.addEventListener('click',()=>{if(!player||!ready)return;player.getPlayerState()===1?player.pauseVideo():player.playVideo();});
 speed?.addEventListener('change',()=>{if(ready)player?.setPlaybackRate(Number(speed.value));});
 byId('play-chapter')?.addEventListener('click',()=>{const select=byId<HTMLSelectElement>('video-chapter');if(select)seek(Number(select.value));});
 // Explicit manual scrolling disengages follow mode, not video playback.
 window.addEventListener('wheel',()=>{if(follow)setFollow(false);},{passive:true});
 window.addEventListener('touchmove',()=>{if(follow)setFollow(false);},{passive:true});
 function refreshRates(){if(!player||!speed)return;const rates=player.getAvailablePlaybackRates();if(!rates.length)return;speed.replaceChildren(...rates.map(rate=>{const option=document.createElement('option');option.value=String(rate);option.textContent=rate+'×';return option;}));speed.value=String(player.getPlaybackRate());speed.disabled=rates.length<=1;}
 function updatePlay(){const playing=player?.getPlayerState()===1;if(play){play.textContent=playing?'Ⅱ 停止':'▶ 再生';play.setAttribute('aria-label',playing?'動画を一時停止':'動画を再生');}}
 function unavailable(message:string){if(ready)return;failed=true;say(message);if(queued){const s=queued.seconds;queued=null;fallbackSeek(s);}}
 const timer=window.setTimeout(()=>unavailable('動画同期に接続できません。時刻リンクと通常の動画操作は利用できます。'),15000);
 function connect(){if(failed||!window.YT?.Player)return;try{player=new window.YT.Player('original-player',{events:{
 onReady(e){if(failed)return;player=e.target;ready=true;clearTimeout(timer);say('');if(play)play.disabled=false;if(followButton)followButton.disabled=!entries.length;refreshRates();updatePlay();updateRepeatButtons();if(queued){const s=queued.seconds;queued=null;performSeek(s);}sync();},
 onStateChange(e){if(!ready)return;updatePlay();refreshRates();updateRepeatButtons();sync();if(e.data===0&&!loop)setFollow(false);},
 onPlaybackRateChange(e){if(speed)speed.value=String(e.data);},
 onError(){ready=false;clearTimeout(timer);failed=true;clearLoop();setFollow(false);if(play)play.disabled=true;if(speed)speed.disabled=true;if(followButton)followButton.disabled=true;updateRepeatButtons();say('動画を埋め込み再生できません。YouTubeで開いてください。');},
 onAutoplayBlocked(){say('自動再生が制限されています。プレイヤーの再生ボタンを押してください。');}
 }});}catch{unavailable('動画同期を開始できません。');}}
 videoFrame.src=frameUrl();
 say('動画連携を準備中…');
 if(window.YT?.Player)connect();else{const previous=window.onYouTubeIframeAPIReady;window.onYouTubeIframeAPIReady=()=>{previous?.();connect();};const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.async=true;script.addEventListener('error',()=>{clearTimeout(timer);unavailable('動画同期に接続できません。');});document.head.append(script);}
 const interval=window.setInterval(()=>{if(!document.hidden)sync();},300);
 window.addEventListener('pagehide',()=>{clearInterval(interval);clearTimeout(timer);},{once:true});
}