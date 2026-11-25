import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
const port=4174,base='http://127.0.0.1:'+port;
const server=spawn(process.execPath,['node_modules/.bin/astro','preview','--host','127.0.0.1','--port',String(port)],{stdio:'inherit'});
const out='world-audit';await mkdir(out,{recursive:true});
let browser;const results=[];
try{
 let ready=false;for(let i=0;i<60;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}if(server.exitCode!==null)break;await new Promise(r=>setTimeout(r,500));}assert.ok(ready,'Preview did not start');
 browser=await chromium.launch({headless:true});
 const routes=['/','/library/','/genres/philosophy/','/genres/literature/','/topics/','/topics/psychoanalysis/','/people/','/people/slavoj-zizek/','/words/','/words/unceded-territories-3c7dd2479078/','/concepts/','/concepts/surplus-enjoyment/','/read/slavoj-zizek-signs-from-the-future/','/read/slavoj-zizek-how-to-become-free/?chapter=ch1','/workspace/','/404.html'];
 for(const width of [320,390,768,1440])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  // Deterministic visual audit: external fonts/videos are blocked; actual playback is covered separately by mocked reader regression.
  await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
  const page=await context.newPage();
  {
   await page.addInitScript(t=>localStorage.setItem('aw-theme',t),theme);
   for(const path of routes){
    const response=await page.goto(base+path,{waitUntil:'domcontentloaded'});assert.ok(response&&(response.ok()||path==='/404.html'&&response.status()===404),path+' response');
    await page.evaluate(()=>{for(const img of document.images)img.loading='eager'});
    await page.waitForFunction(()=>[...document.images].filter(i=>i.currentSrc.includes('/brand/')||i.src.includes('/brand/')).every(i=>i.complete),{},{timeout:10000});
    const audit=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,theme:document.documentElement.dataset.theme,broken:[...document.images].filter(i=>(i.currentSrc.includes('/brand/')||i.src.includes('/brand/'))&&!i.naturalWidth).map(i=>i.src),h1:document.querySelector('h1')?.textContent?.trim()}));
    assert.ok(audit.scroll<=width+1,path+' '+width+' '+theme+' horizontal overflow '+audit.scroll);
    assert.deepEqual(audit.broken,[],path+' broken local art');assert.equal(audit.theme,theme,path+' theme');
    results.push({path,width,theme,...audit});
    if(width===390||width===1440)await page.screenshot({path:out+'/'+theme+'-'+width+'-'+(path.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'')||'home')+'.png',animations:'disabled'});
    if((width===390||width===1440)&&path==='/'){await page.locator('#archive-index').scrollIntoViewIfNeeded();await page.screenshot({path:out+'/'+theme+'-'+width+'-home-explore.png',animations:'disabled'});await page.locator('.aw-marginalia-section').scrollIntoViewIfNeeded();await page.screenshot({path:out+'/'+theme+'-'+width+'-home-marginalia.png',animations:'disabled'});}
   }
  }
  await context.close();
 }
 const p=await browser.newPage({viewport:{width:390,height:844}});
 await p.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
 await p.goto(base+'/library/?scope=chapters&q=映画&time=15');assert.equal(await p.locator('#find').inputValue(),'映画');assert.equal(await p.locator('#filter-time').inputValue(),'15');assert.equal(await p.locator('[data-scope=chapters]').getAttribute('aria-pressed'),'true');
 await p.locator('#find').fill('zzzz-no-result-000');assert.equal(await p.locator('#no-documents').isVisible(),true);
 await p.reload();assert.equal(await p.locator('#find').inputValue(),'zzzz-no-result-000');
 await p.goto(base+'/concepts/');await p.locator('#index-query').fill('Lacan');assert.ok(await p.locator('[data-index-search]:visible').count()>0);await p.locator('#index-query').fill('zzzz-no-result-000');assert.equal(await p.locator('#index-empty').isVisible(),true);
 await p.goto(base+'/topics/');await p.locator('#index-query').fill('自由');assert.ok(await p.locator('[data-index-search]:visible').count()>0);
 await p.goto(base+'/');assert.equal(await p.locator('.aw-margin-entry').count(),2);const href=await p.locator('.aw-margin-entry a').first().getAttribute('href');assert.ok(href?.includes('chapter='));
 await p.goto(base+'/workspace/');
 const lesson={id:'world-audit-private',title:'Private audit lesson',author:'Test',chapters:[{title:'One',blocks:[{en:'Read the world.',ja:'世界を読む。',note:'test'}]}]};
 await p.locator('#importFile').setInputFiles({name:'audit.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(lesson))});
 const card=p.locator('.lesson-card').filter({hasText:lesson.title});await card.getByRole('button',{name:'読む',exact:true}).click();
 await p.getByRole('button',{name:'発話を保存',exact:true}).click();await p.reload();await p.locator('#savedNav').click();assert.ok(await p.locator('#savedList').getByText('Read the world.').isVisible());
 await p.locator('#workspace-theme').click();const theme=await p.locator('html').getAttribute('data-theme');await p.goto(base+'/library/');assert.equal(await p.locator('html').getAttribute('data-theme'),theme);
 await p.close();
 console.log('World audit: '+results.length+' page/viewport/theme combinations; search, source links, workspace import and saved data passed.');
}finally{await writeFile(out+'/results.json',JSON.stringify(results,null,2));await browser?.close();server.kill();}
