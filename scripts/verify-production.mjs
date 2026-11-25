import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base='https://the-annotated-world.pages.dev';
const routes=['/','/library/','/topics/','/people/','/words/','/concepts/surplus-enjoyment/','/read/slavoj-zizek-how-to-become-free/','/read/slavoj-zizek-signs-from-the-future/','/workspace/'];
const report={base,checkedAt:new Date().toISOString(),pages:[],video:[]};let browser;
try{
 browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 // Cloudflare builds independently of GitHub CI. Verify that the intended
 // deployment is actually visible, not merely that an older page responds.
 let deployed=false;
 for(let i=0;i<12;i++){try{const res=await page.goto(base+'/library/',{waitUntil:'domcontentloaded',timeout:20000});deployed=!!res?.ok()&&await page.locator('link[rel=canonical]').count()>0;if(deployed)break;}catch{}await new Promise(r=>setTimeout(r,5000));}
 assert.ok(deployed,'Production could not be reached or new canonical marker not yet visible');
 for(const path of routes){
  const res=await page.goto(base+path,{waitUntil:'domcontentloaded',timeout:30000});
  assert.ok(res?.ok(),path+' response '+res?.status());
  const details=await page.evaluate(()=>({title:document.title,scrollWidth:document.documentElement.scrollWidth,width:innerWidth}));
  assert.ok(details.scrollWidth<=details.width+1,path+' overflow');
  report.pages.push({path,status:res.status(),...details});
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
   }catch(e){result.reason=String(e).slice(0,350);result.state=await page.locator('#video-state').textContent().catch(()=>null);}
   report.video.push(result);
  }
 }
 assert.ok(report.video.every(v=>v.source&&v.iframe),'Source video fallback missing');
 console.log(JSON.stringify(report,null,2));
} catch(e){report.error=String(e);throw e;}
finally{await mkdir('world-audit',{recursive:true});await writeFile('world-audit/production.json',JSON.stringify(report,null,2));await browser?.close();}
