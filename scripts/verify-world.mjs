import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
const port=4174,base=process.env.AW_AUDIT_BASE||'http://127.0.0.1:'+port;
const publicAudit=Boolean(process.env.AW_AUDIT_BASE);
const server=publicAudit?null:spawn(process.execPath,['node_modules/.bin/astro','preview','--host','127.0.0.1','--port',String(port)],{stdio:'inherit'});
const out=publicAudit?'world-audit/public':'world-audit';await mkdir(out,{recursive:true});
let browser;const results=[];
try{
 let ready=false;for(let i=0;i<60;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}if(server&&server.exitCode!==null)break;await new Promise(r=>setTimeout(r,500));}assert.ok(ready,'Preview did not start');
 browser=await chromium.launch({headless:true});
 const routes=['/','/library/','/genres/philosophy/','/genres/literature/','/topics/','/topics/psychoanalysis/','/people/','/people/slavoj-zizek/','/words/','/words/unceded-territories-3c7dd2479078/','/concepts/','/concepts/surplus-enjoyment/','/read/slavoj-zizek-signs-from-the-future/','/read/slavoj-zizek-how-to-become-free/','/read/slavoj-zizek-how-to-become-free/?chapter=ch1','/workspace/','/404.html'];
 for(const width of [320,390,768,1440])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  // Deterministic visual audit: external fonts/videos are blocked; actual playback is covered separately by mocked reader regression.
  await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
  const page=await context.newPage();
  {
   await page.addInitScript(t=>{
 localStorage.setItem('aw-theme',t);
 window.__awMetrics={lcp:null,cls:0,shifts:[]};
 try{new PerformanceObserver(list=>{const last=list.getEntries().at(-1);if(last)window.__awMetrics.lcp=last.startTime}).observe({type:'largest-contentful-paint',buffered:true});}catch{}
 try{new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput){window.__awMetrics.cls+=e.value;window.__awMetrics.shifts.push({value:e.value,at:e.startTime,nodes:e.sources.map(s=>s.node?.nodeName+':'+(s.node?.className||''))});}}).observe({type:'layout-shift',buffered:true});}catch{}
 },theme);
   for(const path of routes){
    const response=await page.goto(base+path,{waitUntil:'domcontentloaded'});assert.ok(response&&(response.ok()||path==='/404.html'&&response.status()===404),path+' response');
    await page.waitForLoadState('load');
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const initialMetrics=await page.evaluate(()=>{
     const nav=performance.getEntriesByType('navigation')[0];
     const local=performance.getEntriesByType('resource').filter(e=>e.name.startsWith(location.origin+'/'));
     return {lcpMs:window.__awMetrics.lcp,cls:window.__awMetrics.cls,shifts:window.__awMetrics.shifts,domContentLoadedMs:nav?.domContentLoadedEventEnd,loadMs:nav?.loadEventEnd,localTransferBytes:local.reduce((n,e)=>n+e.transferSize,0),localImageBytes:local.filter(e=>e.initiatorType==='img').reduce((n,e)=>n+e.transferSize,0)};
    });
    await page.evaluate(()=>{for(const img of document.images)img.loading='eager'});
    await page.waitForFunction(()=>[...document.images].filter(i=>i.currentSrc.includes('/brand/')||i.src.includes('/brand/')).every(i=>i.complete),{},{timeout:10000});
    await page.evaluate(async()=>{await Promise.all([...document.images].filter(i=>i.currentSrc.includes('/brand/')||i.src.includes('/brand/')).map(i=>i.decode()));await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
    const audit=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,theme:document.documentElement.dataset.theme,broken:[...document.images].filter(i=>(i.currentSrc.includes('/brand/')||i.src.includes('/brand/'))&&!i.naturalWidth).map(i=>i.src),h1:document.querySelector('h1')?.textContent?.trim()}));
    if(audit.scroll>width+1){console.error('Overflow nodes:',await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.right>innerWidth+1}).slice(0,12).map(e=>({tag:e.tagName,cls:e.className,rect:e.getBoundingClientRect().toJSON()}))));}
    assert.ok(audit.scroll<=width+1,path+' '+width+' '+theme+' horizontal overflow '+audit.scroll);
    if(path==='/'){
     const violations=await page.evaluate(()=>[...document.querySelectorAll('.aw-atlas-center-art .aw-atlas-annotator,.aw-atlas-object img')].filter(img=>{const r=img.getBoundingClientRect(),p=img.parentElement.getBoundingClientRect();return r.left<p.left-1||r.right>p.right+1||r.top<p.top-1||r.bottom>p.bottom+1}).map(img=>img.src));
     assert.deepEqual(violations,[],width+' atlas artwork spills beyond its layer');
     const portals=page.locator('.aw-atlas-portal img');assert.equal(await portals.count(),6);assert.ok(await portals.evaluateAll(imgs=>imgs.every(i=>i.naturalWidth>0&&i.getBoundingClientRect().width>0)),'All room views visible');
     for(const room of await page.locator('[data-room-link]').all()){await room.scrollIntoViewIfNeeded();assert.ok(await room.evaluate(a=>{const b=a.getBoundingClientRect();return a.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2))}),'Room link obscured at '+width);}
     const cinema=page.locator('.aw-atlas-cinema');await cinema.scrollIntoViewIfNeeded();
     assert.ok(await cinema.evaluate(a=>{const r=a.getBoundingClientRect(),e=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return a.contains(e)}),'Cinema link obscured at '+width);
     await page.evaluate(()=>window.scrollTo(0,0));
    }
    assert.deepEqual(audit.broken,[],path+' broken local art');assert.equal(audit.theme,theme,path+' theme');
    const accessibility=await page.evaluate(()=>{
     const visible=e=>e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden';
     const noAlt=[...document.images].filter(e=>!e.hasAttribute('alt')).map(e=>e.src);
     const unnamed=[...document.querySelectorAll('a[href],button')].filter(e=>visible(e)&&!e.textContent.trim()&&!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby')&&!e.getAttribute('title')&&!e.querySelector('img[alt]:not([alt=""])')).map(e=>e.outerHTML.slice(0,240));
     const h1=[...document.querySelectorAll('h1')].filter(visible).length;
     return {noAlt,unnamed,h1,mainCount:document.querySelectorAll('main').length};
    });
    assert.deepEqual(accessibility.noAlt,[],path+' image alt attributes');
    results.push({path,width,theme,...audit,initialMetrics,accessibility});
    if(!publicAudit||width===390||width===1440)await page.screenshot({path:out+'/'+theme+'-'+width+'-'+(path.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'')||'home')+'.png',animations:'disabled'});
    if((width===390||width===1440)&&path==='/'){await page.locator('#archive-index').scrollIntoViewIfNeeded();await page.screenshot({path:out+'/'+theme+'-'+width+'-home-explore.png',animations:'disabled'});}
    // Actual component crops, including below-the-fold cards and inline reading
    // notes. A full first viewport alone cannot support an art review.
    if([320,390,1440].includes(width)){
     const detailTargets={
      '/library/':[['library-search','.library-toolbar'],['edition-card','.document-entry.discovery-card']],
      '/words/':[['specimen','.aw-word-specimen']],
      '/people/':[['dossier','.aw-person-register .person-item']],
      '/workspace/':[['private-edition','.lesson-card']],
      '/read/slavoj-zizek-signs-from-the-future/':[['chapter-index','.study-original .toc-list'],['reader-tools','.study-toolbar'],['language-note','.study-original .en:has(.in-situ-annotation[data-note-kind=language])'],['context-note','.study-original .en:has(.in-situ-annotation[data-note-kind=context])']],
      '/':[['home-entry','.aw-world-enter'],['video-card','#video-shelf .document-entry']]
     };
     for(const [name,selector] of detailTargets[path]||[]){
      const target=page.locator(selector).first();
      if(await target.isVisible()){
       await target.scrollIntoViewIfNeeded();
       await target.screenshot({path:out+'/'+theme+'-'+width+'-detail-'+name+'.png',animations:'disabled',timeout:10000});
      }
     }
    }
   }
  }
  await context.close();
 }
 if(publicAudit){console.log('Public screenshot audit: '+results.length+' combinations');}else{
 const p=await browser.newPage({viewport:{width:390,height:844}});
 await p.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
 await p.goto(base+'/library/');
 await p.keyboard.press('Tab');
 assert.ok(await p.evaluate(()=>document.activeElement?.matches('a.skip-link')),'First keyboard focus should be the skip link');
 await p.keyboard.press('Enter');
 assert.equal(await p.evaluate(()=>document.activeElement?.id),'main','Skip link must focus main');
 await p.goto(base+'/library/?scope=chapters&q=映画&time=15');assert.equal(await p.locator('#find').inputValue(),'映画');assert.equal(await p.locator('#filter-time').inputValue(),'15');assert.equal(await p.locator('[data-scope=chapters]').getAttribute('aria-pressed'),'true');
 await p.locator('#find').fill('zzzz-no-result-000');assert.equal(await p.locator('#no-documents').isVisible(),true);
 await p.reload();assert.equal(await p.locator('#find').inputValue(),'zzzz-no-result-000');
 await p.goto(base+'/words/');await p.locator('#word-search').fill('unceded');assert.ok(await p.locator('[data-index-search]:visible').count()>0);await p.locator('#word-search').fill('zzzz-no-result-000');assert.equal(await p.locator('#word-empty').isVisible(),true);
 await p.goto(base+'/concepts/');await p.locator('#index-query').fill('Lacan');assert.ok(await p.locator('[data-index-search]:visible').count()>0);await p.locator('#index-query').fill('zzzz-no-result-000');assert.equal(await p.locator('#index-empty').isVisible(),true);
 await p.goto(base+'/people/');await p.locator('#index-query').fill('ジジェク');assert.ok(await p.locator('[data-index-search]:visible').count()>0);await p.goto(base+'/topics/');await p.locator('#index-query').fill('自由');assert.ok(await p.locator('[data-index-search]:visible').count()>0);
 await p.goto(base+'/');assert.equal(await p.locator('a[href^="/marginalia"],.aw-marginalia-section').count(),0,'Rejected editorial journal must not appear on home');
 assert.equal(await p.locator('.aw-atlas-section').getAttribute('data-edition'),'late-autumn');
 const atlas=p.locator('.aw-atlas-nav');
 assert.equal(await atlas.locator('[data-room-link]').count(),6);
 const expected=['/library/','/topics/','/concepts/','/words/','/people/','/workspace/'];
 assert.deepEqual((await atlas.locator('[data-room-link]').evaluateAll(a=>a.map(e=>e.getAttribute('href')))).sort(),expected.sort());
 assert.equal(await atlas.locator('.aw-atlas-cinema').getAttribute('href'),'#video-shelf');
 await atlas.locator('[data-room-link=library]').focus();assert.ok(await atlas.locator('[data-room-link=library]').evaluate(e=>document.activeElement===e));
 await p.keyboard.press('Tab');assert.ok(await atlas.locator('[data-room-link=observatory]').evaluate(e=>document.activeElement===e),'Scene atlas native keyboard order');
 const mapBounds=await atlas.locator('a').evaluateAll(a=>a.map(e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height};}));
 assert.ok(mapBounds.every(b=>b.w>=44&&b.h>=44),'Atlas targets too small');
 for(let i=0;i<mapBounds.length;i++)for(let j=i+1;j<mapBounds.length;j++){const a=mapBounds[i],b=mapBounds[j];assert.ok(a.x+a.w<=b.x+1||b.x+b.w<=a.x+1||a.y+a.h<=b.y+1||b.y+b.h<=a.y+1,'Atlas links overlap');}

 const homeVideos=p.locator('#video-shelf .document-entry .source-thumbnail');
 assert.equal(await homeVideos.count(),2,'Home should use original video thumbnails for both current videos');
 assert.equal(await p.locator('#video-shelf .aw-cover-illustration').count(),0,'Home video shelf must not replace source thumbnails with edition art');
 const ratio=await homeVideos.first().evaluate(el=>{const b=el.closest('.document-cover').getBoundingClientRect();return b.width/b.height;});
 assert.ok(Math.abs(ratio-16/9)<.03,'Home source thumbnail must be landscape');
 assert.ok(await p.locator('#video-shelf').evaluate(el=>Boolean(document.querySelector('#archive-index').compareDocumentPosition(el)&Node.DOCUMENT_POSITION_FOLLOWING)),'Scene atlas should precede the video shelf in the new stage composition');
 await p.locator('#query').fill('ジジェク');await Promise.all([p.waitForURL(u=>u.pathname==='/library/'&&u.searchParams.get('q')==='ジジェク'),p.locator('#search-form button').click()]);await p.locator('#find').waitFor();assert.equal(await p.locator('#find').inputValue(),'ジジェク','Home search uses the live library query');assert.ok(await p.locator('[data-document]:visible').count()>0,'Home search should find existing source documents');
 await p.goto(base+'/library/');assert.equal(await p.locator('.aw-cover-illustration').count(),2,'Library keeps both original edition covers');
 await p.goto(base+'/workspace/');
 const lesson={id:'world-audit-private',title:'Private audit lesson',author:'Test',chapters:[{title:'One',blocks:[{en:'Read the world.',ja:'世界を読む。',note:'test'}]}]};
 await p.locator('#importFile').setInputFiles({name:'audit.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(lesson))});
 const card=p.locator('.lesson-card').filter({hasText:lesson.title});await card.getByRole('button',{name:'読む',exact:true}).click();
 await p.getByRole('button',{name:'発話を保存',exact:true}).click();await p.reload();await p.locator('#savedNav').click();assert.ok(await p.locator('#savedList').getByText('Read the world.').isVisible());
 await p.locator('#libraryNav').click();const html='<h1>Private HTML audit</h1><section class="sec"><header class="sec-header"><h2>One</h2></header><div class="utterance"><p class="en">A private passage.</p><p class="ja">個人の文章。</p></div></section>';
 await p.locator('#importFile').setInputFiles({name:'audit.html',mimeType:'text/html',buffer:Buffer.from(html)});await p.locator('.lesson-card').filter({hasText:'Private HTML audit'}).getByRole('button',{name:'読む',exact:true}).click();assert.ok(await p.locator('#chapter').getByText('A private passage.').isVisible());await p.reload();assert.ok(await p.locator('.lesson-card').filter({hasText:'Private HTML audit'}).isVisible());
 await p.locator('#workspace-theme').click();const theme=await p.locator('html').getAttribute('data-theme');await p.goto(base+'/library/');assert.equal(await p.locator('html').getAttribute('data-theme'),theme);
 await p.close();
 }
 console.log('World audit: '+results.length+' page/viewport/theme combinations; search, source links, workspace import and saved data passed.');
}finally{await writeFile(out+'/results.json',JSON.stringify(results,null,2));await browser?.close();server?.kill();}
