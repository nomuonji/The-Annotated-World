import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base='https://the-annotated-world.pages.dev';
const routes=['/','/library/','/topics/','/people/','/words/','/concepts/surplus-enjoyment/','/read/slavoj-zizek-how-to-become-free/','/read/slavoj-zizek-signs-from-the-future/','/workspace/'];
const expectedSha=process.env.GITHUB_SHA||'';
const report={base,expectedSha,checkedAt:new Date().toISOString(),pages:[],video:[]};let browser;
try{
 browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 // Cloudflare builds independently of GitHub CI. Verify that the intended
 // deployment is actually visible, not merely that an older page responds.
 await page.addInitScript(()=>{window.__awLive={cls:0,lcp:null};try{new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__awLive.cls+=e.value}).observe({type:'layout-shift',buffered:true});new PerformanceObserver(l=>{const e=l.getEntries().at(-1);if(e)window.__awLive.lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});}catch{}});
 let deployed=false;
 for(let i=0;i<12;i++){try{const res=await page.goto(base+'/library/',{waitUntil:'domcontentloaded',timeout:20000});const actual=await page.locator('meta[name=aw-build-sha]').getAttribute('content',{timeout:2000}).catch(()=>null);report.deployedSha=actual;deployed=!!res?.ok()&&(!expectedSha||actual===expectedSha);if(deployed)break;}catch{}await new Promise(r=>setTimeout(r,5000));}
 assert.ok(deployed,'Production could not be reached or expected commit marker not yet visible');
 for(const path of routes){
  const res=await page.goto(base+path,{waitUntil:'domcontentloaded',timeout:30000});
  assert.ok(res?.ok(),path+' response '+res?.status());
  await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
  const details=await page.evaluate(()=>({title:document.title,scrollWidth:document.documentElement.scrollWidth,width:innerWidth,overflow:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.right>innerWidth+1}).slice(0,12).map(e=>({tag:e.tagName,cls:String(e.className),right:e.getBoundingClientRect().right}))}));
  const metrics=await page.evaluate(()=>({lcpMs:window.__awLive.lcp,cls:window.__awLive.cls,resources:performance.getEntriesByType('resource').length,localTransferBytes:performance.getEntriesByType('resource').filter(e=>e.name.startsWith(location.origin)).reduce((n,e)=>n+e.transferSize,0)}));
  report.pages.push({path,status:res.status(),...details,metrics});
  await mkdir('world-audit/live',{recursive:true});
  await page.screenshot({path:'world-audit/live/'+(path.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'')||'home')+'.png',animations:'disabled',timeout:15000}).catch(e=>{report.pages.at(-1).screenshotError=String(e).slice(0,200)});
  if(path.startsWith('/read/')){
   const result={path,source:await page.locator('#source-video a').first().getAttribute('href'),iframe:await page.locator('#original-player').getAttribute('src'),actualPlayback:'unverified'};
   try{
    await page.waitForFunction(()=>!document.querySelector('#play-pause')?.disabled,{},{timeout:15000});
    const start=await page.locator('#video-clock').textContent();
    await page.locator('#play-pause').click({timeout:5000});
    await page.waitForFunction(s=>document.querySelector('#video-clock')?.textContent!==s,start,{timeout:12000});
    result.actualPlayback='clock-advanced';
    result.clockAfter=await page.locator('#video-clock').textContent();
    await page.locator('#play-pause').click({timeout:5000}).catch(()=>{});
   }catch(e){result.reason=String(e).slice(0,350);result.state=await page.locator('#video-state').textContent().catch(()=>null);result.youtubeError=await page.locator('#source-video').getAttribute('data-youtube-error').catch(()=>null);}
   report.video.push(result);
  }
 }
 assert.ok(report.video.every(v=>v.source&&v.iframe),'Source video fallback missing');
 assert.ok(report.pages.every(p=>p.scrollWidth<=p.width+1),'Production overflow: '+JSON.stringify(report.pages.filter(p=>p.scrollWidth>p.width+1)));
 console.log(JSON.stringify(report,null,2));
} catch(e){report.error=String(e);console.error(JSON.stringify(report,null,2));throw e;}
finally{await mkdir('world-audit',{recursive:true});await writeFile('world-audit/production.json',JSON.stringify(report,null,2));await browser?.close();}
