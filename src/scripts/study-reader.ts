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
 // Enhance the static paper notes only on small screens. Without JS, every note remains readable.
 const annotatedNotes=Array.from(reader.querySelectorAll<HTMLElement>('.note.has-inline-annotations'));
 const expandNote=(note:HTMLElement,open:boolean)=>{
  note.classList.toggle('annotation-expanded',open);
  note.querySelector<HTMLButtonElement>('.annotation-note-toggle')?.setAttribute('aria-expanded',String(open));
 };
 for(const note of annotatedNotes){
  const count=note.querySelectorAll('.inline-note-item').length;
  if(!count)continue;
  const toggle=document.createElement('button');
  toggle.type='button';toggle.className='annotation-note-toggle';
  toggle.textContent='本文注釈 '+count+'件';
  toggle.setAttribute('aria-expanded','false');
  toggle.addEventListener('click',()=>expandNote(note,!note.classList.contains('annotation-expanded')));
  note.prepend(toggle);
 }
 reader.classList.add('annotation-enhanced');
 // Show the exact editorial note beside the highlighted phrase on small screens.
 // Never navigate to a far-away footnote or force the source text to scroll.
 const smallReader=matchMedia('(max-width: 899px)');
 const popover=document.createElement('aside');
 popover.className='inline-annotation-popover';
 popover.hidden=true;
 popover.setAttribute('role','dialog');
 popover.setAttribute('aria-label','本文注釈');
 const popoverHead=document.createElement('div');
 popoverHead.className='inline-annotation-popover-head';
 const popoverTitle=document.createElement('strong');
 const popoverClose=document.createElement('button');
 popoverClose.type='button';
 popoverClose.className='inline-annotation-popover-close';
 popoverClose.textContent='閉じる ×';
 popoverHead.append(popoverTitle,popoverClose);
 const popoverText=document.createElement('p');
 popoverText.className='inline-annotation-popover-text';
 const popoverLink=document.createElement('a');
 popoverLink.className='inline-annotation-popover-link';
 popoverLink.textContent='語彙の用例を見る ↗';
 popover.append(popoverHead,popoverText,popoverLink);
 document.body.append(popover);
 let activeNoteTrigger:HTMLElement|null=null;
 const closePopover=()=>{
  popover.hidden=true;
  activeNoteTrigger?.removeAttribute('aria-expanded');
  activeNoteTrigger=null;
 };
 popoverClose.addEventListener('click',()=>{closePopover();});
 const positionPopover=()=>{
  if(popover.hidden||!activeNoteTrigger)return;
  const rect=activeNoteTrigger.getBoundingClientRect();
  const width=Math.min(360,window.innerWidth-24);
  popover.style.width=width+'px';
  const left=Math.max(12,Math.min(window.innerWidth-width-12,rect.left+rect.width/2-width/2));
  // Leave the pinned player and sticky study toolbar unobstructed.
  const stickyBottom=Math.max(0,toolbar?.getBoundingClientRect().bottom??0);
  const topLimit=Math.max(12,stickyBottom+8);
  const bottomLimit=window.visualViewport?.height??window.innerHeight;
  const height=popover.getBoundingClientRect().height;
  const below=rect.bottom+8;
  const above=rect.top-height-8;
  const desired=below+height<=bottomLimit-12?below:above>=topLimit?above:below;
  const top=Math.max(topLimit,Math.min(desired,Math.max(topLimit,bottomLimit-height-12)));
  popover.style.left=left+'px';
  popover.style.top=top+'px';
 };
 const openPopover=(trigger:HTMLElement,note:HTMLElement,word:HTMLElement|null)=>{
  if(!popover.hidden&&activeNoteTrigger===trigger){closePopover();return;}
  activeNoteTrigger?.removeAttribute('aria-expanded');
  activeNoteTrigger=trigger;
  trigger.setAttribute('aria-expanded','true');
  const title=word?.textContent?.trim()||note.querySelector('strong')?.textContent?.trim()||'本文注釈';
  popoverTitle.textContent=title;
  popoverText.textContent=note.textContent?.trim()||'';
  const glossary=word?.querySelector<HTMLAnchorElement>('a[data-word]')||
   (word?.matches('a[data-word]')?word as HTMLAnchorElement:null);
  if(glossary){popoverLink.href=glossary.href;popoverLink.hidden=false;}
  else{popoverLink.removeAttribute('href');popoverLink.hidden=true;}
  popover.hidden=false;
  positionPopover();
 };
 // Use capture so the source-linked word dialog does not steal an annotation tap.
 reader.addEventListener('click',event=>{
  if(!(event.target instanceof Element))return;
  const word=event.target.closest<HTMLElement>('.en .annotation-term');
  const ref=event.target.closest<HTMLAnchorElement>('.inline-note-ref a[href^="#"]')||
   word?.nextElementSibling?.querySelector<HTMLAnchorElement>('.inline-note-ref a[href^="#"]')||
   (word?.nextElementSibling?.matches('.inline-note-ref')?word.nextElementSibling.querySelector<HTMLAnchorElement>('a[href^="#"]'):null);
  if(!ref)return;
  const note=document.getElementById(ref.hash.slice(1));
  if(!note)return;
  const utterance=note.closest<HTMLElement>('.utterance');
  if(smallReader.matches){
   event.preventDefault();
   event.stopImmediatePropagation();
   const trigger=(word||ref) as HTMLElement;
   openPopover(trigger,note,word);
   return;
  }
  if(event.target.closest('.inline-note-ref')){
   expandNote(note.closest<HTMLElement>('.note')!,true);
   if(utterance){utterance.classList.add('revealed');updateReveal(utterance);}
  }
 },true);
 document.addEventListener('pointerdown',event=>{
  if(popover.hidden)return;
  const target=event.target as Node;
  if(!popover.contains(target)&&!activeNoteTrigger?.contains(target))closePopover();
 });
 document.addEventListener('keydown',event=>{if(event.key==='Escape')closePopover();});
 window.addEventListener('scroll',()=>{
  if(popover.hidden||!activeNoteTrigger)return;
  const rect=activeNoteTrigger.getBoundingClientRect();
  if(rect.bottom<0||rect.top>window.innerHeight){closePopover();return;}
  positionPopover();
 },{passive:true});
 window.addEventListener('resize',()=>{if(!smallReader.matches)closePopover();else positionPopover();},{passive:true});
 smallReader.addEventListener('change',closePopover);
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
 function updateReveal(b:HTMLElement){const btn=b.querySelector<HTMLButtonElement>('[data-reveal]');if(!btn)return;const open=b.classList.contains('revealed');btn.hidden=mode==='parallel';btn.setAttribute('aria-expanded',String(open));btn.textContent=open?'もう一度隠す':mode==='listen'?'英文・和訳を確認':'和訳・注釈を見る';}
 function setMode(next:Mode){mode=next;reader.dataset.mode=next;for(const b of modeButtons)b.setAttribute('aria-pressed',String(b.dataset.mode===next));for(const b of blocks){b.classList.remove('revealed');updateReveal(b);}if(next==='listen'&&panel)say(ready?'リスニング：発話を聞いてから英文を確認できます。':'リスニング：元動画を再生して聞き取ります。');else if(ready)say('');}
 for(const b of modeButtons)b.addEventListener('click',()=>setMode(b.dataset.mode as Mode));
 for(const b of blocks){b.querySelector('[data-reveal]')?.addEventListener('click',()=>{b.classList.toggle('revealed');updateReveal(b);});}
 toolbar?.removeAttribute('hidden');setMode('parallel');
 if(toolbar){const update=()=>reader.style.setProperty('--study-toolbar-height',toolbar.getBoundingClientRect().height+'px');new ResizeObserver(update).observe(toolbar);update();}
 byId('study-size')?.addEventListener('click',()=>{size=(size+1)%3;reader.dataset.textSize=String(size);const btn=byId('study-size');if(btn){btn.textContent=['A↗','A+','A++'][size];btn.setAttribute('aria-label','文字サイズ '+['標準','大','特大'][size]+'。クリックして変更');}});
 nav?.addEventListener('change',()=>{const target=byId(nav.value);if(target){scrollTo(target);history.replaceState(null,'','#'+encodeURIComponent(target.id));}else{const toc=reader.querySelector<HTMLElement>('.toc');if(toc)scrollTo(toc);}});
 if(!panel||!iframe||!frameBase)return;
 const videoPanel=panel;const videoFrame=iframe;
 for(const node of panel.querySelectorAll<HTMLElement>('[data-video-enhancement]'))node.hidden=false;
 if(sidebar){const updateHeight=()=>reader.style.setProperty('--pinned-video-height',reader.classList.contains('video-pinned')&&mobile.matches?sidebar.getBoundingClientRect().height+'px':'0px');const observer=new ResizeObserver(updateHeight);observer.observe(sidebar);mobile.addEventListener('change',updateHeight);pin?.addEventListener('click',()=>{const on=reader.classList.toggle('video-pinned');pin.setAttribute('aria-pressed',String(on));pin.textContent=on?'固定解除':'動画固定';updateHeight();});}
 function usableEnd(entry:TimedBlock){if(entry.end!==null)return entry.end;return entries.at(-1)===entry&&player&&player.getDuration()>entry.start?player.getDuration():null;}
 function updateRepeatButtons(){for(const item of entries){const b=item.element.querySelector<HTMLButtonElement>('[data-repeat]');if(!b)continue;const usable=ready&&usableEnd(item)!==null;b.hidden=!usable;b.setAttribute('aria-pressed',String(loop===item));b.textContent=loop===item?'↻ リピート中':'↻ リピート';}if(stop)stop.hidden=!loop;}
 reader.addEventListener('reader-focus-on',()=>{if(ready)player?.pauseVideo();clearLoop();setFollow(false);if(reader.classList.contains('video-pinned'))pin?.click();});
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