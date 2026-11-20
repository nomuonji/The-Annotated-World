import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
const port=4173,base='http://127.0.0.1:'+port;
const server=spawn(process.execPath,['node_modules/.bin/astro','preview','--host','127.0.0.1','--port',String(port)],{stdio:'inherit'});
let browser;
try{
 for(let i=0;i<60;i++){try{if((await fetch(base)).ok)break;}catch{}if(server.exitCode!==null||i===59)throw Error('Preview did not start');await new Promise(r=>setTimeout(r,250));}
 browser=await chromium.launch({headless:true});
 const path='/read/slavoj-zizek-signs-from-the-future/';
 const mock=`
 window.mockPlayer={time:0,rate:1,state:-1,events:null,seeks:[],getCurrentTime(){return this.time},getDuration(){return 5181},getPlayerState(){return this.state},getAvailablePlaybackRates(){return [.75,1,1.25,1.5,2]},getPlaybackRate(){return this.rate},setPlaybackRate(v){this.rate=v;this.events.onPlaybackRateChange({target:this,data:v})},seekTo(v){this.time=v;this.seeks.push(v)},playVideo(){this.state=1;this.events.onStateChange({target:this,data:1})},pauseVideo(){this.state=2;this.events.onStateChange({target:this,data:2})}};
 window.YT={Player:function(id,opts){const player=window.mockPlayer;player.events=opts.events;setTimeout(()=>opts.events.onReady({target:player,data:0}),0);return player}};
 window.onYouTubeIframeAPIReady?.();`;
 for(const viewport of [{width:1280,height:900},{width:390,height:844},{width:320,height:640}]){
  const page=await browser.newPage({viewport,isMobile:viewport.width<900,hasTouch:viewport.width<900,deviceScaleFactor:1,reducedMotion:'reduce'});
  await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin===base)return route.continue();if(u.hostname==='www.youtube.com'&&u.pathname==='/iframe_api')return route.fulfill({contentType:'application/javascript',body:mock});if(u.hostname==='www.youtube-nocookie.com')return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Controlled test iframe</title>'});return route.abort();});
  await page.goto(base+path);await page.waitForFunction(()=>!document.getElementById('play-pause').disabled);
  const first=page.locator('.utterance').first();const second=page.locator('.utterance').nth(1);
  assert.equal(await page.locator('.utterance').count(),61);
  // One global ON/OFF switch owns all annotations; no tap is necessary.
  const inline=first.locator('[data-editorial-gloss="ch1-line-1-note-1"]');
  const languageNote=first.locator('[data-editorial-gloss="ch1-line-1-note-3"]');
  const annotationsButton=page.locator('#reader-annotations');
  assert.equal(await first.locator('.in-situ-annotation').count(),3,'Original editorial notes were lost');
  assert.ok((await first.locator('.en').textContent()).startsWith('Host: How are we doing here? Good? Still alive? Still lively?'));
  assert.equal(await inline.getAttribute('data-note-kind'),'context');
  assert.equal(await languageNote.getAttribute('data-note-kind'),'language');
  assert.ok((await inline.textContent()).includes('ラカン派'));
  assert.equal(await inline.isVisible(),true,'Background explanation must be inline without tapping');
  assert.equal(await languageNote.isVisible(),true,'Language explanation must be inline without tapping');
  assert.equal(await annotationsButton.getAttribute('aria-pressed'),'true');

  // Regression for the screenshot: the Hegel quotation sits inside <strong>.
  // Highlight the *whole* exact quotation, then place its context note
  // directly after "everywhere", never in the middle of "Evil".
  const hegel=page.locator('#ch2-line-3');
  const quoted=hegel.locator('.annotation-source[data-note-targets~="ch2-line-3-note-1"]');
  assert.equal((await quoted.allTextContents()).join(''),
   'Evil resides in the gaze which sees evil everywhere');
  const explanation=hegel.locator('[data-editorial-gloss="ch2-line-3-note-1"]');
  const adjacent=await explanation.evaluate(node=>{
   const previous=node.parentElement?.previousElementSibling;
   return previous?.classList.contains('annotation-source')&&
    previous.textContent?.endsWith('everywhere')&&
    (previous.getAttribute('data-note-targets')||'').includes('ch2-line-3-note-1');
  });
  assert.equal(adjacent,true,'Historical note is not immediately after its highlighted quotation');
  assert.ok(await explanation.isVisible(),'Historical note is not visible with annotation ON');
  assert.equal(await page.locator('.annotation-kind,.reader-annotation-legend').count(),0,
   'Redundant language/background labels remain visible');

  assert.equal(await page.locator('[data-note-toggle],#word-dialog').count(),0,'Unused tap-based annotation controls remain');

  assert.equal(await first.locator('.note').isVisible(),false);
  assert.equal(await page.locator('.note.annotation-converted').count(),61);
  assert.equal(await page.locator('.chapter-trail:visible').count(),0);
  await annotationsButton.click();
  assert.equal(await first.locator('.in-situ-annotation:visible').count(),0,'OFF did not hide both annotation kinds');
  assert.ok((await first.locator('.en').textContent()).includes('unceded territories'),'OFF lost source English');
  await annotationsButton.click();
  assert.equal(await inline.isVisible(),true,'ON did not restore the background explanation');
  assert.equal(await languageNote.isVisible(),true,'ON did not restore the language explanation');
  const intro=await page.locator('.hero').innerText();
  assert.ok(!intro.includes('ポイント')&&!intro.includes('英文 → 日本語訳 →'));
  assert.equal(await first.locator('.editorial-annotation summary').count(),0);
  assert.equal(await second.locator('.editorial-annotation summary').count(),0);
  await page.locator('[data-mode=english]').click();assert.equal(await first.locator('.en').isVisible(),true);assert.equal(await first.locator('.ja').isVisible(),false);
  await first.locator('[data-reveal]').click();assert.equal(await first.locator('.ja').isVisible(),true);assert.equal(await second.locator('.ja').isVisible(),false);
  await page.locator('[data-mode=listen]').click();assert.equal(await first.locator('.en').isVisible(),false);await first.locator('[data-reveal]').click();assert.equal(await first.locator('.en').isVisible(),true);
  await page.locator('[data-mode=parallel]').click();
  if(viewport.width<900){
   await second.locator('.en').evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
   await page.waitForFunction(()=>document.querySelector('#mobile-translation-dock')?.getAttribute('data-utterance-id')==='ch1-line-2');
   assert.equal(await second.locator('.ja').isVisible(),false,'Mobile dock should replace the inline translation');
   assert.equal(await page.locator('#mobile-translation-text').textContent(),await second.locator('.ja').textContent(),'Dock shows the wrong utterance translation');
   const dock=await page.locator('#mobile-translation-dock').boundingBox();
   assert.ok(dock&&dock.y+dock.height<=viewport.height+1,'Translation panel is outside the mobile viewport');
   // Deep in the document, expanding/collapsing every earlier inline JA
   // paragraph used to displace the current English by thousands of pixels.
   const deep=page.locator('#ch8-line-3 .en');
   await deep.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
   await page.waitForFunction(()=>document.querySelector('#mobile-translation-dock')?.getAttribute('data-utterance-id')==='ch8-line-3');
   const originalY=(await deep.boundingBox()).y;
   await page.locator('#mobile-translation-unpin').click();
   assert.equal(await page.locator('#mobile-translation-dock').isVisible(),false);
   assert.equal(await page.locator('#ch8-line-3 .ja').isVisible(),true);
   const unpinnedY=(await deep.boundingBox()).y;
   assert.ok(Math.abs(unpinnedY-originalY)<20,'Unpin displaced the English reading position by '+(unpinnedY-originalY)+'px');
   await page.locator('#mobile-translation-pin').click();
   await page.waitForFunction(()=>document.querySelector('#mobile-translation-dock')?.getAttribute('data-utterance-id')==='ch8-line-3');
   const repinnedY=(await deep.boundingBox()).y;
   assert.ok(Math.abs(repinnedY-originalY)<20,'Repin displaced the English reading position by '+(repinnedY-originalY)+'px');
   await page.locator('[data-mode=english]').click();
   assert.equal(await page.locator('#mobile-translation-dock').isVisible(),false,'English-only mode should never show Japanese in a dock');
   await page.locator('[data-mode=parallel]').click();
  }else{
   assert.equal(await second.locator('.ja').isVisible(),true,'Desktop should retain inline parallel translation');
   assert.equal(await page.locator('#mobile-translation-dock').isVisible(),false);
  }
  // The location picker must follow the reading position, not remain on its
  // initial "目次" placeholder once a new chapter is visible.
  const chapter3=page.locator('#ch3-line-6 .en');
  await chapter3.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
  await page.waitForFunction(()=>document.querySelector('#study-chapter-nav')?.value==='ch3');
  assert.ok((await page.locator('#study-chapter-nav option:checked').textContent()).includes('第3章'));
  await first.locator('[data-utterance-play]').click();const time=Number(await first.getAttribute('data-utterance-start'));
  await page.waitForFunction(t=>window.mockPlayer.time===t,time);assert.equal(await first.evaluate(e=>e.classList.contains('is-playing')),true);
  await page.locator('#playback-speed').selectOption('0.75');assert.equal(await page.evaluate(()=>window.mockPlayer.rate),.75);
  await first.locator('[data-repeat]').click();assert.equal(await first.locator('[data-repeat]').getAttribute('aria-pressed'),'true');
  const next=Number(await second.getAttribute('data-utterance-start'));await page.waitForTimeout(1400);await page.evaluate(t=>window.mockPlayer.time=t+0.1,next);await page.waitForFunction(t=>window.mockPlayer.time===t,time);
  await page.locator('#stop-repeat').click();assert.equal(await first.locator('[data-repeat]').getAttribute('aria-pressed'),'false');
  await page.evaluate(t=>window.mockPlayer.time=t,next);await page.waitForFunction(()=>document.querySelectorAll('.utterance')[1].classList.contains('is-playing'));
  await page.locator('#jump-current').click();await page.waitForTimeout(100);
  if(viewport.width<900){
   await page.locator('#study-chapter-nav').selectOption('ch8');
   await page.locator('#mobile-pin-video').click();
   assert.equal(await page.locator('[data-study-reader]').evaluate(e=>e.classList.contains('video-pinned')),true);
   assert.equal(await page.locator('.study-secondary').isVisible(),false,'Secondary reader controls crowd the fixed video');
   assert.equal(await page.locator('#play-pause').isVisible(),true,'Play button should stay available');
   assert.equal(await page.locator('#mobile-pin-video').isVisible(),true,'Unpin control should stay available');
   assert.equal(await page.locator('#follow-video').isVisible(),false,'Follow button crowds pinned video');
   assert.equal(await page.locator('#playback-speed').isVisible(),false,'Speed control crowds pinned video');
   assert.equal(await page.locator('#jump-current').isVisible(),false,'Extra video controls are still visible');
   await page.waitForTimeout(150);
   const geometry=await page.evaluate(()=>({
    panel:document.querySelector('.study-sidebar').getBoundingClientRect(),
    toolbar:document.getElementById('study-toolbar').getBoundingClientRect(),
    vh:innerHeight
   }));
   const frame=await page.locator('.video-pinned .video-frame').boundingBox();
   assert.ok(frame&&frame.height>=110&&frame.height<170,'Pinned video should remain watchable without dominating the screen');
   assert.ok(geometry.panel.height+geometry.toolbar.height<geometry.vh*.44,'Fixed controls leave insufficient reading space');
   assert.ok(geometry.toolbar.top>=geometry.panel.bottom-2,'Pinned video and toolbar overlap');
   assert.ok(geometry.toolbar.bottom<geometry.vh,'Fixed controls leave no reading space');
   assert.ok(await inline.isVisible(),'Inline notes should remain readable with pinned video');
   await page.locator('#mobile-pin-video').click();
  }
  // Every note is printed adjacent to its English source. A combined
  // language/context range never creates an additional clickable word.
  const subject=page.locator('#ch3-line-6');
  const checks=[
   ['ch3-line-6-note-1','主役を食って'],
   ['ch3-line-6-note-2','目立つ、浮き出る'],
   ['ch3-line-6-note-3','不協和音']
  ];
  for(const [id,meaning] of checks){
   const note=subject.locator('[data-editorial-gloss="'+id+'"]');
   assert.equal(await note.count(),1,'A source note disappeared or was duplicated: '+id);
   assert.ok((await note.textContent()).includes(meaning),'Wrong note matched to source: '+id);
   assert.equal(await note.isVisible(),true,'Inline explanation is hidden despite global ON');
  }
  assert.equal(await subject.locator('[data-note-toggle],a[data-word]').count(),0);
  assert.ok(await subject.locator('strong.key').filter({hasText:'World Spirit'}).count());
  await page.locator('.quick-reader-tools').click();await page.locator('#reader-query').fill('unceded territories');
  await page.locator('#reader-next').click();assert.ok(await first.evaluate(e=>e.classList.contains('search-current')));
  // The chapter-only view keeps its own shareable URL and shows exactly one chapter.
  await page.goto(base+path+'?chapter=ch2');
  await page.locator('#chapter-view-toggle').waitFor({state:'visible'});
  assert.equal(await page.locator('[data-study-reader]').getAttribute('data-chapter-view'),'single');
  assert.equal(await page.locator('.study-original section.sec:visible').count(),1);
  assert.equal(await page.locator('#ch2').isVisible(),true);
  if(viewport.width<900){
   const chapterLine=page.locator('#ch2 .utterance').first();
   await chapterLine.locator('.en').evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
   await page.waitForFunction(()=>document.querySelector('#mobile-translation-dock')?.getAttribute('data-utterance-id')==='ch2-line-1');
   assert.equal(await page.locator('#mobile-translation-text').textContent(),await chapterLine.locator('.ja').textContent(),'Chapter-only mode must show its own Japanese translation');
  }
  assert.equal(await page.locator('#ch1').isVisible(),false);
  assert.equal(await page.locator('.reader-page>.hero').isVisible(),false,'Full article hero crowds chapter-only view');
  assert.equal(await page.locator('#ch2 .chapter-trail').isVisible(),true);
  await page.locator('#study-chapter-nav').selectOption('ch3');
  assert.equal(await page.locator('#ch3').isVisible(),true);
  assert.ok(page.url().includes('chapter=ch3'));
  await page.goBack();
  assert.equal(await page.locator('#ch2').isVisible(),true,'Browser back did not restore selected chapter');
  const nextChapter=page.locator('#ch2 .chapter-trail a[href*="?chapter=ch3"]').first();
  assert.ok(await nextChapter.count()>0,'Remaining article lost its chapter-mode navigation');
  await nextChapter.click();
  assert.equal(await page.locator('#ch3').isVisible(),true);
  assert.equal(await page.locator('.study-original section.sec:visible').count(),1);
  await page.locator('#chapter-view-toggle').click();
  assert.equal(await page.locator('.study-original section.sec:visible').count(),11,'Returning to full view did not restore all 11 chapters');
  assert.equal(await page.locator('.chapter-trail:visible').count(),0,'Chapter trails leak into normal article mode');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Reader causes horizontal overflow');
  await page.goto(base+'/library/');await page.locator('[data-scope=chapters]').click();await page.locator('#find').fill('映画');assert.ok(await page.locator('[data-chapter-result]:visible').count()>0);
  await page.locator('#find').fill('');await page.locator('.library-filter-details summary').click();await page.locator('#filter-time').selectOption('15');assert.ok(await page.locator('[data-chapter-result]:visible').count()>0);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Library causes horizontal overflow');
  const card=page.locator('[data-chapter-result] h3 a').first();
  assert.ok((await card.getAttribute('href')).includes('?chapter='),'Library chapters should launch chapter-only reading');
  // Global theme and annotation visibility survive navigation to unrelated pages.
  const headerTheme=page.locator('#site-theme-toggle');
  if((await page.locator('html').getAttribute('data-theme'))!=='dark')await headerTheme.click();
  assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  const bg=await page.evaluate(()=>getComputedStyle(document.body).backgroundColor);
  assert.notEqual(bg,'rgb(255, 255, 255)','Dark palette was not applied to library page');
  await page.goto(base+'/topics/psychoanalysis/');
  assert.equal(await page.locator('html').getAttribute('data-theme'),'dark','Theme did not persist to a topic page');
  assert.equal(await page.locator('#site-theme-toggle').getAttribute('aria-pressed'),'true');
  await page.goto(base+path);
  assert.equal(await page.locator('html').getAttribute('data-theme'),'dark','Theme did not persist back to article');
  await page.locator('#reader-annotations').click();
  assert.equal(await page.locator('.in-situ-annotation').first().isVisible(),false);
  await page.goto(base+'/library/');
  assert.equal(await page.locator('[data-document]').count(),2,'Rebuilt RapidAPI article must be listed alongside the original lesson');
  await page.goto(base+path);
  assert.equal(await page.locator('#reader-annotations').getAttribute('aria-pressed'),'false','Annotation OFF did not persist across navigation');
  assert.equal(await page.locator('.in-situ-annotation').first().isVisible(),false);
  await page.locator('#reader-annotations').click();
  assert.equal(await page.locator('.in-situ-annotation').first().isVisible(),true,'Restored ON preference did not show annotations');
  await page.locator('#site-theme-toggle').click();
  assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
  console.log(viewport.width+'px: reading modes, mocked seek/rate/repeat/sync, mobile layout and chapter search passed');await page.close();
 }
}finally{await browser?.close();server.kill();}
