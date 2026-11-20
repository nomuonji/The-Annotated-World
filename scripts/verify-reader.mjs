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
  await page.locator('[data-mode=parallel]').click();assert.equal(await second.locator('.ja').isVisible(),true);
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
  await page.locator('.quick-reader-tools').click();await page.locator('#reader-query').fill('unceded territories');
  await page.locator('#reader-next').click();assert.ok(await first.evaluate(e=>e.classList.contains('search-current')));
  await page.locator('.quick-reader-tools').click();await page.locator('#reader-focus').click();assert.equal(await page.locator('.study-sidebar').isVisible(),false);
  await page.locator('#reader-dark').click();assert.equal(await page.locator('html').evaluate(e=>e.classList.contains('reader-dark')),true);
  await page.locator('#reader-dark').click();await page.locator('#reader-focus').click();
  assert.equal(await page.locator('.study-sidebar').isVisible(),true);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Reader causes horizontal overflow');
  // The second published document originally used numbered source notes.
  // Ensure all 18 are still readable, but in the same permanent inline format.
  await page.goto(base+'/read/slavoj-zizek-how-to-become-free/');
  const secondNotes=page.locator('.utterance .note.annotation-converted');
  assert.equal(await secondNotes.count(),18,'Numbered source notes were not converted');
  assert.ok(await page.locator('.en .in-situ-annotation').count()>=32,'Existing source notes went missing during conversion');
  assert.equal(await page.locator('.en .inline-note-ref').count(),0,'Original footnote numbers survive conversion');
  assert.equal(await page.locator('.note:visible').count(),0,'Duplicate notes are visible beneath the English');
  assert.equal(await page.locator('.editorial-annotation').count(),0,'Supplemental details remain in the second lesson');
  assert.equal(await page.locator('.in-situ-annotation').first().isVisible(),true);
  assert.ok(!(await page.locator('.hero').innerText()).includes('青い番号'),'Second article still advertises removed numbered note controls');
  await page.goto(base+'/library/');await page.locator('[data-scope=chapters]').click();await page.locator('#find').fill('映画');assert.ok(await page.locator('[data-chapter-result]:visible').count()>0);
  await page.locator('#find').fill('');await page.locator('.library-filter-details summary').click();await page.locator('#filter-time').selectOption('15');assert.ok(await page.locator('[data-chapter-result]:visible').count()>0);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Library causes horizontal overflow');
  console.log(viewport.width+'px: reading modes, mocked seek/rate/repeat/sync, mobile layout and chapter search passed');await page.close();
 }
}finally{await browser?.close();server.kill();}
