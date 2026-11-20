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
  // Notes are always in the English paragraph, after their exact source phrase.
  const inline=first.locator('.en .in-situ-annotation');
  assert.ok((await inline.count())>=2,'No inline explanations attached to real source phrases');
  assert.ok((await first.locator('.en').textContent()).startsWith('Host: How are we doing here? Good? Still alive? Still lively?'));
  assert.equal(await inline.first().getAttribute('data-editorial-gloss'),'ch1-line-1-note-1');
  assert.ok((await inline.first().textContent()).includes('ラカン派'),'First source note is not present inside the English');
  assert.equal(await inline.first().isVisible(),true,'Editorial note must be visible without a tap');
  assert.equal(await first.locator('.inline-note-ref').count(),0,'Old footnote jump buttons remain');
  assert.equal(await first.locator('.annotation-note-toggle').count(),0,'Old annotation disclosure button remains');
  assert.equal(await page.locator('.inline-annotation-popover').count(),0,'Old annotation popup remains');
  assert.equal(await first.locator('.en .in-situ-annotation').count(),3,'First utterance did not convert all 3 point notes');
  assert.equal(await first.locator('.note').isVisible(),false,'Legacy point box is still visible');
  assert.equal(await page.locator('.note.annotation-converted').count(),61,'Not all 61 utterances are using the new format');
  assert.equal(await page.locator('.editorial-annotation').count(),0,'Legacy listening-hint details remain');
  assert.equal(await page.locator('.note-label:visible').count(),0,'Legacy point labels remain visible');
  assert.equal(await page.locator('.en .inline-note-ref').count(),0,'Legacy jump-to-note numbers remain in English');
  assert.equal(await page.locator('.chapter-trail:visible').count(),0,'Normal article should not show chapter-end buttons');
  assert.equal(await page.locator('#reader-focus').count(),0,'Obsolete focus-reading control was not removed');
  assert.equal(await page.locator('#reader-dark').count(),0,'Local reader theme control should be replaced by the global setting');
  const annotationsButton=page.locator('#reader-annotations');
  assert.equal(await annotationsButton.getAttribute('aria-pressed'),'true');
  await annotationsButton.click();
  assert.equal(await inline.first().isVisible(),false,'OFF should hide all editorial glosses');
  assert.ok((await first.locator('.en').textContent()).includes('unceded territories'),'Switching off annotations lost source English');
  assert.equal(await page.locator('.note:visible').count(),0,'OFF revealed legacy point boxes');
  await annotationsButton.click();
  assert.equal(await inline.first().isVisible(),true,'ON should restore inline explanations');
  const intro=await page.locator('.hero').innerText();
  assert.ok(!intro.includes('ポイント')&&!intro.includes('英文 → 日本語訳 →'),'Intro advertises obsolete point format');
  assert.equal(await first.locator('.editorial-annotation summary').filter({hasText:'構文を読み解く'}).count(),0);
  assert.equal(await second.locator('.editorial-annotation summary').filter({hasText:'英文と和訳を照合'}).count(),0);
  const atStart=await page.evaluate(()=>window.scrollY);
  assert.ok(await inline.first().isVisible());
  assert.equal(await page.evaluate(()=>window.scrollY),atStart,'Inline annotations should not cause navigation');
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
   await page.locator('#mobile-translation-unpin').click();
   assert.equal(await second.locator('.ja').isVisible(),true,'Unpin should restore inline parallel translation');
   assert.equal(await page.locator('#mobile-translation-dock').isVisible(),false);
   await page.locator('#mobile-translation-pin').click();
   await page.waitForFunction(()=>document.querySelector('#mobile-translation-dock')?.getAttribute('data-utterance-id')==='ch1-line-2');
   await page.locator('[data-mode=english]').click();
   assert.equal(await page.locator('#mobile-translation-dock').isVisible(),false,'English-only mode should never show Japanese in a dock');
   await page.locator('[data-mode=parallel]').click();
  }else{
   assert.equal(await second.locator('.ja').isVisible(),true,'Desktop should retain inline parallel translation');
   assert.equal(await page.locator('#mobile-translation-dock').isVisible(),false);
  }
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
   assert.ok(await inline.first().isVisible(),'Notes should remain visible directly in the paragraph while video is pinned');
   await page.locator('#mobile-pin-video').click();
  }
  // Exercise the new reader tools with the real generated transcript, not synthetic content.
  const word=first.locator('a[data-word]').first(), destination=await word.getAttribute('href');
  await word.click();
  await page.locator('#word-dialog[open]').waitFor();
  assert.ok((await page.locator('#word-dialog-note').textContent()).includes('未割譲'));
  assert.equal(new URL(await page.locator('#word-dialog-more').getAttribute('href'),base).pathname,destination);
  await page.locator('#word-dialog button').click();
  // Regression: a clicked inflected word must never show neighboring notes.
  // ch3-line-6 has three distinct notes: steal the show, stick out, element of discord.
  const vocabularyCases=[
   {word:'sticking out',expected:'目立つ、浮き出る',excluded:['steal the show','不協和音','ヘーゲル']},
   {word:'stole the show',expected:'主役を食って',excluded:['stick out','不協和音','ヘーゲル']},
   {word:'World Spirit',expected:'この語句に対応する個別注釈は登録されていません。',excluded:['steal the show','stick out','ヘーゲル']}
  ];
  for(const {word,expected,excluded} of vocabularyCases){
   const tapped=page.locator('#ch3-line-6 a[data-word]').filter({hasText:word}).first();
   await tapped.click();
   const popup=await page.locator('#word-dialog-note').textContent()||'';
   assert.ok(popup.includes(expected),word+' did not resolve to its own annotation: '+popup);
   for(const unrelated of excluded)assert.ok(!popup.includes(unrelated),word+' included unrelated annotation: '+unrelated);
   await page.locator('#word-dialog button').click();
  }
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
  assert.equal(await page.locator('.in-situ-annotation').first().isVisible(),true);
  await page.locator('#site-theme-toggle').click();
  assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
  console.log(viewport.width+'px: reading modes, mocked seek/rate/repeat/sync, mobile layout and chapter search passed');await page.close();
 }
}finally{await browser?.close();server.kill();}
