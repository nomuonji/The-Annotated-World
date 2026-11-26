import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const base='http://127.0.0.1:4179';
const server=spawn(process.execPath,['node_modules/.bin/astro','preview','--host','127.0.0.1','--port','4179'],{stdio:'ignore'});
const routes=['/','/library/','/genres/philosophy/','/genres/literature/','/topics/','/topics/psychoanalysis/','/people/','/people/slavoj-zizek/','/words/','/words/unceded-territories-3c7dd2479078/','/concepts/','/concepts/surplus-enjoyment/','/read/slavoj-zizek-how-to-become-free/?chapter=ch1','/read/slavoj-zizek-signs-from-the-future/?chapter=ch1','/workspace/','/404.html'];
let browser;const report={pages:[],fallbacks:[]};
try{
 let ready=false;for(let i=0;i<60;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}assert.ok(ready);
 browser=await chromium.launch({headless:true});
 for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await context.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
  const page=await context.newPage();await page.addInitScript(t=>localStorage.setItem('aw-theme',t),theme);
  for(const path of routes){
   await page.goto(base+path);await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
   const result=await page.evaluate(async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']},iframes:false});return {violations:r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),incomplete:r.incomplete.map(v=>({id:v.id,nodes:v.nodes.length})),passes:r.passes.length};});
   report.pages.push({path,theme,...result});
  }
  await context.close();
 }
 const c=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await c.route('**/*',r=>r.request().resourceType()==='image'||!r.request().url().startsWith(base)?r.abort():r.continue());
 const p=await c.newPage();
 await p.goto(base+'/library/');await p.locator('.aw-cover-failed').first().waitFor();
 assert.equal(await p.locator('.aw-cover-failed .cover-fallback:visible').count(),2);
 await p.locator('#find').fill('zizek');report.fallbacks.push({path:'/library/',condition:'all images and external resources blocked',pass:true});
 await p.goto(base+'/');assert.equal(await p.locator('#video-shelf .cover-fallback:visible').count(),2);report.fallbacks.push({path:'/',condition:'source thumbnails and scene art blocked',pass:true});
 for(const id of ['slavoj-zizek-how-to-become-free','slavoj-zizek-signs-from-the-future']){
  await p.goto(base+'/read/'+id+'/?chapter=ch1');
  assert.ok(await p.locator('.study-original .sec.chapter-selected .en').first().isVisible());
  assert.ok(await p.locator('#source-video a').first().isVisible());
  assert.ok(await p.locator('#source-video a').first().getAttribute('href'));
  report.fallbacks.push({path:'/read/'+id+'/',condition:'external font, video and all images blocked; original and source accessible',pass:true});
 }
 await c.close();
 const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
 await nojs.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
 const q=await nojs.newPage();await q.goto(base+'/read/slavoj-zizek-how-to-become-free/');
 assert.ok(await q.locator('.study-original .en').first().isVisible());assert.ok(await q.locator('.study-original .ja').first().isVisible());
 report.fallbacks.push({path:'/read/slavoj-zizek-how-to-become-free/',condition:'no JS, external blocked; English and Japanese still visible',pass:true});
 await nojs.close();
 const counts={};for(const p of report.pages)for(const v of p.violations)counts[v.id]=(counts[v.id]||0)+v.nodes.length;
 report.violationCounts=counts;console.log('AXE audit: '+report.pages.length+' cases; violations '+JSON.stringify(counts)+'; fallbacks '+report.fallbacks.length);
 // Automated WCAG findings are a release gate; incomplete/manual checks remain separate.
 assert.deepEqual(counts,{},'Automated WCAG violations must be resolved');
}finally{await mkdir('world-audit',{recursive:true});await writeFile('world-audit/accessibility.json',JSON.stringify(report,null,2));await browser?.close();server.kill();}
